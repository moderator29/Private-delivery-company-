-- SwiftTrack Private Delivery Company
-- Migration 0014: an exact arrival instant, alongside the date and the window
--
-- estimated_delivery_date is a calendar date and estimated_delivery_window is
-- free text such as "By 8:00 PM". Together they are what a waybill prints, and
-- they stay: they are what operations sets and what the page shows as the
-- estimate.
--
-- What they cannot answer is "how long until it gets here". Deriving an instant
-- by parsing the window would mean the countdown a recipient reads depended on
-- how someone typed a time into a text box. So the instant is stored, once, as
-- its own column, and the tracking page counts down against it.
--
-- Nullable on purpose. A shipment with no arrival instant simply shows no
-- countdown, which is every shipment that predates this column and every
-- shipment that is held, delivered or otherwise unscheduled.

alter table public.shipments
  add column if not exists estimated_delivery_at timestamptz;

comment on column public.shipments.estimated_delivery_at is
  'Exact expected arrival instant, for the tracking page countdown. estimated_delivery_date and estimated_delivery_window remain the displayed estimate; this is the machine readable one. Null when no arrival time is committed.';

-- Republished with the new field. Everything else is unchanged from 0012.
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
  v_invoice_items jsonb;
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

  select coalesce(
    jsonb_agg(
      jsonb_build_object('description', i.description, 'amount', i.amount)
      order by i.sort_order asc, i.created_at asc
    ),
    '[]'::jsonb
  )
  into v_invoice_items
  from public.shipment_invoice_items i
  where i.shipment_id = s.id;

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
    'estimated_delivery_at', s.estimated_delivery_at,
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
    'payment_status', s.payment_status,
    'recipient_email_submitted_at', s.recipient_email_submitted_at,
    'payment_method', s.payment_method,
    'payment_wallet_address', s.payment_wallet_address,
    'payment_currency', s.payment_currency,
    'total_amount_due', s.total_amount_due,
    'payment_confirmation_at', s.payment_confirmation_at,
    'invoice_items', v_invoice_items,
    'created_at', s.created_at,
    'updated_at', s.updated_at,
    'events', v_events
  );
end;
$$;

-- create or replace keeps the grants from 0003 and 0004; restated so the
-- exposure of this function is readable in one place.
revoke all on function public.track_shipment(text) from public;
grant execute on function public.track_shipment(text) to anon, authenticated, service_role;
