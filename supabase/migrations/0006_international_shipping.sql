-- SwiftTrack Private Delivery Company
-- Migration 0006: international shipping model
--
-- SwiftTrack operates from Dubai, United Arab Emirates and moves shipments
-- internationally. Three consequences for the schema:
--
--   1. Tracking IDs carry a destination country suffix, so they read as
--      "STX9 8475 6532 US" the way an international waybill does.
--   2. Measurements are metric, because that is what the origin market uses.
--   3. Public tracking returns the full sender and recipient details shown on
--      the tracking page. See the note on exposure at the bottom of this file.

-- ---------------------------------------------------------------------------
-- 1. Tracking ID format
--
-- ST + 10 unambiguous characters + a 2 letter destination country code.
-- The country suffix is not drawn from the restricted alphabet: it is a real
-- ISO code, so letters such as U are legitimate there.
-- ---------------------------------------------------------------------------

alter table public.shipments drop constraint if exists shipments_tracking_id_format;
alter table public.shipments
  add constraint shipments_tracking_id_format
  check (tracking_id ~ '^ST[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}[A-Z]{2}$');

-- Only the ten character body is folded for confusable characters. Folding the
-- suffix would turn a destination of US into VS.
create or replace function public.normalize_tracking_id(p_value text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_raw text;
  v_body text;
  v_suffix text;
begin
  v_raw := upper(regexp_replace(coalesce(p_value, ''), '[^A-Za-z0-9]', '', 'g'));

  if v_raw !~ '^ST.{10}[A-Z]{2}$' then
    return v_raw;
  end if;

  v_body := substr(v_raw, 3, 10);
  v_suffix := substr(v_raw, 13, 2);

  v_body := translate(v_body, 'ILOU', '110V');

  return 'ST' || v_body || v_suffix;
end;
$$;

-- The old zero-argument generator is the column default, so the default has to
-- be released before the function can be replaced.
alter table public.shipments alter column tracking_id drop default;
drop function if exists public.generate_tracking_id();

create or replace function public.generate_tracking_id(p_destination_country text default 'US')
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  suffix text;
  candidate text;
  raw bytea;
  i int;
begin
  suffix := upper(coalesce(nullif(btrim(p_destination_country), ''), 'US'));
  if suffix !~ '^[A-Z]{2}$' then
    raise exception 'Destination country must be a two letter code, got %', p_destination_country;
  end if;

  for attempt in 1..25 loop
    candidate := 'ST';
    raw := extensions.gen_random_bytes(10);
    for i in 1..10 loop
      candidate := candidate || substr(alphabet, 1 + (get_byte(raw, i - 1) % 32), 1);
    end loop;
    candidate := candidate || suffix;

    exit when not exists (select 1 from public.shipments where tracking_id = candidate);
    candidate := null;
  end loop;

  if candidate is null then
    raise exception 'Could not generate a unique tracking id after 25 attempts';
  end if;

  return candidate;
end;
$$;

-- The column default cannot see the row's destination country, so it falls back
-- to US. The admin create flow passes the real destination explicitly.
alter table public.shipments
  alter column tracking_id set default public.generate_tracking_id('US');

revoke all on function public.generate_tracking_id(text) from public, anon, authenticated;
grant execute on function public.generate_tracking_id(text) to service_role;

-- ---------------------------------------------------------------------------
-- 2. Metric measurements and delivery window
-- ---------------------------------------------------------------------------

alter table public.shipments rename column weight_lb to weight_kg;
alter table public.shipments rename column length_in to length_cm;
alter table public.shipments rename column width_in to width_cm;
alter table public.shipments rename column height_in to height_cm;

alter table public.shipments drop constraint if exists shipments_weight_non_negative;
alter table public.shipments
  add constraint shipments_weight_non_negative check (weight_kg is null or weight_kg >= 0);

-- Free text so operations can express "By 8:00 PM" or "Between 9 AM and 1 PM"
-- without the schema guessing at every carrier convention.
alter table public.shipments
  add column if not exists estimated_delivery_window text;

alter table public.shipments
  drop constraint if exists shipments_delivery_window_len;
alter table public.shipments
  add constraint shipments_delivery_window_len
  check (estimated_delivery_window is null or char_length(estimated_delivery_window) <= 80);

-- ---------------------------------------------------------------------------
-- 3. Public tracking payload
--
-- Exposure note, recorded deliberately.
--
-- This function returns the recipient's full name and street address to anyone
-- holding the tracking number. That is the product owner's explicit decision:
-- the tracking page is designed to show a recipient their own delivery address
-- so they can confirm it is correct before the courier arrives.
--
-- What is still withheld: phone numbers, email addresses, internal notes,
-- created_by, the internal row id, non-public events and archived shipments.
--
-- To reduce exposure later, replace the recipient block below with city, state
-- and country only. docs/SECURITY.md carries the exact replacement SQL.
-- ---------------------------------------------------------------------------

drop function if exists public.mask_person_name(text);

create or replace function public.track_shipment(p_tracking_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.shipments;
  v_normalized text;
  v_events jsonb;
begin
  v_normalized := public.normalize_tracking_id(p_tracking_id);

  if v_normalized !~ '^ST[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}[A-Z]{2}$' then
    return null;
  end if;

  select *
  into s
  from public.shipments
  where tracking_id = v_normalized
    and archived_at is null;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(evt order by evt_occurred_at asc, evt_created_at asc), '[]'::jsonb)
  into v_events
  from (
    select
      jsonb_build_object(
        'status', e.status,
        'title', e.title,
        'description', e.description,
        'facility_label', e.facility_label,
        'city', e.city,
        'state', e.state,
        'country', e.country,
        'latitude', e.latitude,
        'longitude', e.longitude,
        'occurred_at', e.occurred_at
      ) as evt,
      e.occurred_at as evt_occurred_at,
      e.created_at as evt_created_at
    from public.shipment_events e
    where e.shipment_id = s.id
      and e.is_public
  ) ordered_events;

  return jsonb_build_object(
    'tracking_id', s.tracking_id,
    'status', s.status,
    'service_level', s.service_level,
    'sender', jsonb_build_object(
      'name', s.sender_name,
      'company', s.sender_company,
      'city', s.origin_city,
      'state', s.origin_state,
      'country', s.origin_country
    ),
    'recipient', jsonb_build_object(
      'name', s.recipient_name,
      'company', s.recipient_company,
      'address_line1', s.destination_address_line1,
      'address_line2', s.destination_address_line2,
      'city', s.destination_city,
      'state', s.destination_state,
      'postal_code', s.destination_postal_code,
      'country', s.destination_country
    ),
    'origin', jsonb_build_object(
      'city', s.origin_city,
      'state', s.origin_state,
      'country', s.origin_country,
      'latitude', s.origin_latitude,
      'longitude', s.origin_longitude
    ),
    'destination', jsonb_build_object(
      'city', s.destination_city,
      'state', s.destination_state,
      'country', s.destination_country,
      'latitude', s.destination_latitude,
      'longitude', s.destination_longitude
    ),
    'current_location_label', s.current_location_label,
    'estimated_delivery_date', s.estimated_delivery_date,
    'estimated_delivery_window', s.estimated_delivery_window,
    'shipped_at', s.shipped_at,
    'delivered_at', s.delivered_at,
    'package', jsonb_build_object(
      'package_type', s.package_type,
      'piece_count', s.piece_count,
      'weight_kg', s.weight_kg,
      'length_cm', s.length_cm,
      'width_cm', s.width_cm,
      'height_cm', s.height_cm
    ),
    'created_at', s.created_at,
    'updated_at', s.updated_at,
    'events', v_events
  );
end;
$$;

revoke all on function public.track_shipment(text) from public;
grant execute on function public.track_shipment(text) to anon, authenticated, service_role;
