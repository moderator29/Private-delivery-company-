-- SwiftTrack Private Delivery Company
-- Migration 0003: the public tracking read path
--
-- This function is the only way an anonymous visitor can read shipment data.
-- It is security definer, so it must be conservative about what it returns.
--
-- Deliberately NOT returned:
--   internal id, sender/recipient full names, email addresses, phone numbers,
--   street addresses, postal codes, internal notes, created_by, non-public
--   events, and anything about archived shipments.
--
-- Returned location data is scan level only. There is no live GPS in this
-- product and the UI must not present it as such.

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

  -- Reject anything that cannot be a SwiftTrack tracking ID before touching
  -- the table. Keeps malformed input off the index and out of the logs.
  if v_normalized !~ '^ST[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}$' then
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
    'sender_label', coalesce(nullif(btrim(coalesce(s.sender_company, '')), ''), public.mask_person_name(s.sender_name)),
    'recipient_label', coalesce(nullif(btrim(coalesce(s.recipient_company, '')), ''), public.mask_person_name(s.recipient_name)),
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
    'shipped_at', s.shipped_at,
    'delivered_at', s.delivered_at,
    'package', jsonb_build_object(
      'package_type', s.package_type,
      'piece_count', s.piece_count,
      'weight_lb', s.weight_lb,
      'length_in', s.length_in,
      'width_in', s.width_in,
      'height_in', s.height_in
    ),
    'created_at', s.created_at,
    'updated_at', s.updated_at,
    'events', v_events
  );
end;
$$;

comment on function public.track_shipment(text) is
  'Public tracking lookup. Returns only fields approved for public display, or null for unknown, malformed or archived tracking IDs.';

revoke all on function public.track_shipment(text) from public;
grant execute on function public.track_shipment(text) to anon, authenticated, service_role;
