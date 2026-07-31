-- SwiftTrack Private Delivery Company
-- Migration 0012: invoice-based recipient payment workflow
--
-- Migration 0011 taught a shipment to ask a recipient for an email address and
-- to confirm one arrived. This is the step after that: once the address is in,
-- the tracking page shows the recipient an itemised invoice, the payment method
-- and the wallet address to pay to, and lets them tell operations they have
-- sent payment. That notification is a claim, not a receipt — nothing here
-- marks a shipment paid. A person on the finance team still verifies it by hand.
--
-- What this migration adds:
--
--   * An invoice is a set of line items, not a single number. shipment_invoice_items
--     carries the itemised breakdown; shipments.total_amount_due (from 0011) is the
--     amount owed, and shipments.payment_currency the currency both are quoted in.
--   * Three columns record how the shipment is to be paid and what the recipient
--     did: payment_method, payment_wallet_address, payment_confirmation_at.
--   * payment_status gains 'reviewing_payment', the state a shipment enters when
--     the recipient reports payment and finance has not yet cleared it.
--   * track_shipment() returns the invoice, the method and the wallet address, so
--     the page renders them from the record rather than from anything hardcoded.
--     It still does not return recipient_contact_email.
--   * submit_payment_notification() is the single public write behind the button.
--     Like every other public write here it is SECURITY DEFINER, validates its
--     own preconditions, locks the row so a double click cannot file two events,
--     and answers with a small verdict.
--
-- Every statement is idempotent so the migration converges a project that was
-- built from an earlier state as well as one built from scratch.

-- ---------------------------------------------------------------------------
-- 1. Columns on shipments
-- ---------------------------------------------------------------------------

alter table public.shipments
  add column if not exists payment_method text,
  add column if not exists payment_wallet_address text,
  add column if not exists payment_confirmation_at timestamptz;

comment on column public.shipments.payment_method is
  'How the recipient is asked to pay. A closed vocabulary; BTC is the only method today.';
comment on column public.shipments.payment_wallet_address is
  'The wallet address the recipient is asked to send payment to. Configured per shipment. Returned by public tracking so the page can display it.';
comment on column public.shipments.payment_confirmation_at is
  'When the recipient reported they had sent payment. It is a claim awaiting manual review, not proof of payment.';

-- The method vocabulary is deliberately small: every value has code behind it.
alter table public.shipments drop constraint if exists shipments_payment_method_known;
alter table public.shipments
  add constraint shipments_payment_method_known check (
    payment_method is null or payment_method in ('BTC')
  );

-- A loose bound only. Bitcoin address formats vary (P2PKH, P2SH, Bech32), so the
-- length is checked but the shape is not; validating a real address belongs with
-- whoever configures the shipment, not in a check constraint that would reject a
-- format it had not been taught.
alter table public.shipments drop constraint if exists shipments_payment_wallet_address_len;
alter table public.shipments
  add constraint shipments_payment_wallet_address_len check (
    payment_wallet_address is null
    or char_length(btrim(payment_wallet_address)) between 6 and 128
  );

-- 'reviewing_payment' joins the vocabulary from 0011.
--   reviewing_payment  the recipient reported payment; finance has not cleared it
alter table public.shipments drop constraint if exists shipments_payment_status_known;
alter table public.shipments
  add constraint shipments_payment_status_known check (
    payment_status is null
    or payment_status in (
      'not_required',
      'awaiting_recipient_email',
      'email_received',
      'reviewing_payment'
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Invoice line items
--
-- One row per charge. The invoice a recipient sees is the sum of these, ordered
-- by sort_order, which is what makes the breakdown itemised rather than a single
-- opaque amount hardcoded in the page.
-- ---------------------------------------------------------------------------

create table if not exists public.shipment_invoice_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint shipment_invoice_items_description_len
    check (char_length(btrim(description)) between 1 and 160),
  constraint shipment_invoice_items_amount_non_negative check (amount >= 0)
);

comment on table public.shipment_invoice_items is
  'Itemised charges that make up a shipment invoice. Read publicly through track_shipment(); never written by a client.';

create index if not exists shipment_invoice_items_shipment_idx
  on public.shipment_invoice_items (shipment_id, sort_order, created_at);

-- Same posture as every other table: anon has no direct access, operators read
-- and write through Row Level Security, and the public read path is a function.
alter table public.shipment_invoice_items enable row level security;
revoke all on table public.shipment_invoice_items from anon;

drop policy if exists shipment_invoice_items_select on public.shipment_invoice_items;
create policy shipment_invoice_items_select on public.shipment_invoice_items
  for select to authenticated
  using (public.is_active_admin());

drop policy if exists shipment_invoice_items_insert on public.shipment_invoice_items;
create policy shipment_invoice_items_insert on public.shipment_invoice_items
  for insert to authenticated
  with check (public.can_write_shipments());

drop policy if exists shipment_invoice_items_update on public.shipment_invoice_items;
create policy shipment_invoice_items_update on public.shipment_invoice_items
  for update to authenticated
  using (public.can_write_shipments())
  with check (public.can_write_shipments());

drop policy if exists shipment_invoice_items_delete on public.shipment_invoice_items;
create policy shipment_invoice_items_delete on public.shipment_invoice_items
  for delete to authenticated
  using (public.can_write_shipments());

-- Audited like shipments and shipment_events, so a change to an invoice leaves a
-- trail. record_audit_event() (0001) is generic over the table name.
drop trigger if exists shipment_invoice_items_audit on public.shipment_invoice_items;
create trigger shipment_invoice_items_audit
  after insert or update or delete on public.shipment_invoice_items
  for each row execute function public.record_audit_event();

-- ---------------------------------------------------------------------------
-- 3. Payment notification
--
-- The single public write behind the "I've Sent Payment" button. It does not
-- record a payment: it records that the recipient says they sent one, moves the
-- shipment into reviewing_payment, and files a public event so the timeline
-- shows the claim is now with finance.
--
-- Preconditions, all enforced here so the RPC is no more powerful than the form:
--   * the shipment exists and is not archived
--   * an email address has already been received (payment_status = 'email_received'),
--     because the invoice is only shown after that
--   * it has not already been reported (idempotent: a second call is a success
--     from the caller's side, not a second event)
--
-- The row is locked for the duration, so a double submission resolves to one
-- write and one event rather than two.
-- ---------------------------------------------------------------------------

create or replace function public.submit_payment_notification(
  p_tracking_id text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  s public.shipments;
  v_normalized text;
  v_latest public.shipment_events;
begin
  v_normalized := public.normalize_tracking_id(p_tracking_id);
  if v_normalized !~ '^ST[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}[A-Z]{2}$' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into s
  from public.shipments
  where tracking_id = v_normalized
    and archived_at is null
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Already reported. Idempotent, so a retry or a double click reads as done
  -- rather than as an error.
  if s.payment_status = 'reviewing_payment' then
    return jsonb_build_object('ok', false, 'reason', 'already_submitted');
  end if;

  -- Payment can only be reported once the invoice has actually been shown, which
  -- happens only after an address is received. Any other state is not ready.
  if s.payment_status is distinct from 'email_received' then
    return jsonb_build_object('ok', false, 'reason', 'not_ready');
  end if;

  update public.shipments
  set payment_status = 'reviewing_payment',
      payment_confirmation_at = now(),
      -- BTC is the only method today. Recording it explicitly keeps the row
      -- self-describing even if the column was left null when the shipment was
      -- configured, and leaves room for a second method later.
      payment_method = coalesce(payment_method, 'BTC')
      -- recipient_contact_email and payment_wallet_address are deliberately left
      -- as they are: the address the recipient submitted is preserved, and the
      -- wallet the shipment was configured with is the wallet on record.
  where id = s.id;

  -- Repeat the location of the newest event rather than invent one: reporting
  -- payment is not a scan and moves nothing. Mirrors submit_recipient_email().
  select * into v_latest
  from public.shipment_events e
  where e.shipment_id = s.id
  order by e.occurred_at desc, e.created_at desc, e.id desc
  limit 1;

  insert into public.shipment_events (
    shipment_id, status, title, description,
    facility_label, city, state, country, latitude, longitude,
    occurred_at, is_public
  )
  values (
    s.id,
    'awaiting_verification',
    'Payment Notification Submitted',
    'The recipient reported that payment has been sent. The payment notification is awaiting manual review.',
    v_latest.facility_label,
    coalesce(v_latest.city, s.origin_city),
    coalesce(v_latest.state, s.origin_state),
    coalesce(v_latest.country, s.origin_country),
    coalesce(v_latest.latitude, s.origin_latitude),
    coalesce(v_latest.longitude, s.origin_longitude),
    now(),
    true
  );

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.submit_payment_notification(text) is
  'Records that a recipient reported sending payment, moves the shipment to reviewing_payment and files the matching public event. Accepts one report per shipment and only while payment_status is email_received. Does not mark the shipment paid.';

revoke all on function public.submit_payment_notification(text) from public;
grant execute on function public.submit_payment_notification(text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Public tracking payload
--
-- Adds the invoice, the payment method, the wallet address, and when a payment
-- was reported. These are what the tracking page needs to render the invoice
-- and the pay-to details from the record. The recipient's submitted address is
-- still not returned.
--
-- invoice_items is an ordered array of {description, amount}. It is aggregated
-- in a subquery the same way events are, so a shipment with no invoice returns
-- an empty array rather than null.
-- ---------------------------------------------------------------------------

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

revoke all on function public.track_shipment(text) from public;
grant execute on function public.track_shipment(text) to anon, authenticated, service_role;
