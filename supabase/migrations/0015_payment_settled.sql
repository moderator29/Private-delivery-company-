-- SwiftTrack Private Delivery Company
-- Migration 0015: the state where the money actually arrived
--
-- The flow from 0011 and 0012 ends at 'reviewing_payment': the recipient has
-- reported sending payment and finance has not cleared it. There was no way to
-- record the next thing that happens, which is finance confirming the funds are
-- in. A shipment that had been paid therefore kept showing its recipient the
-- invoice, the wallet and the "I've Sent Payment" button — asking again for
-- money already handed over, with the obvious risk of it being sent twice.
--
-- 'paid' closes the flow. It is set by an operator, never by the recipient:
-- there is deliberately no public function that reaches it, because the whole
-- point of the state is that it means something a stranger cannot assert.
--
-- payment_received_at is a separate column from payment_confirmation_at on
-- purpose. The latter is when the recipient said they had paid, which is a
-- claim; this is when the money was confirmed received, which is a fact. Two
-- different things deserve two different columns, and collapsing them would
-- lose the ability to tell a report from a receipt.

alter table public.shipments
  add column if not exists payment_received_at timestamptz;

comment on column public.shipments.payment_received_at is
  'When payment was confirmed received by finance. A fact, unlike payment_confirmation_at, which is the recipient''s claim to have sent it. Null until the money is cleared.';

-- 'paid' joins the vocabulary from 0011 and 0012.
--   paid  payment confirmed received; nothing further is owed on this shipment
alter table public.shipments drop constraint if exists shipments_payment_status_known;
alter table public.shipments
  add constraint shipments_payment_status_known check (
    payment_status is null
    or payment_status in (
      'not_required',
      'awaiting_recipient_email',
      'email_received',
      'reviewing_payment',
      'paid'
    )
  );

-- A settled shipment has to carry the moment it settled, so the receipt the
-- recipient reads is dated rather than merely asserted.
alter table public.shipments drop constraint if exists shipments_paid_has_received_at;
alter table public.shipments
  add constraint shipments_paid_has_received_at check (
    payment_status is distinct from 'paid' or payment_received_at is not null
  );

-- Republished with payment_received_at. Everything else is unchanged from 0014.
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
    'payment_received_at', s.payment_received_at,
    'invoice_items', v_invoice_items,
    'created_at', s.created_at,
    'updated_at', s.updated_at,
    'events', v_events
  );
end;
$$;

revoke all on function public.track_shipment(text) from public;
grant execute on function public.track_shipment(text) to anon, authenticated, service_role;
