-- SwiftTrack Private Delivery Company
-- Migration 0011: recipient email collection
--
-- Some shipments stop and wait for the recipient to supply a contact address
-- before payment instructions and the supporting documents can be issued. This
-- migration is what makes that state legible and safe:
--
--   * The payment columns are brought under migration control. They were added
--     to the live project by hand, so a database built from this directory did
--     not match production. Every statement below is idempotent for that reason:
--     it converges a project that already has them and creates them on one that
--     does not.
--   * payment_status gains a closed vocabulary, so a typo cannot silently park a
--     shipment in a state no code handles.
--   * submit_recipient_email() is rewritten. The hand-written version could not
--     work when called with the anon key (it was not SECURITY DEFINER, and anon
--     has no grant on shipments), and it returned the entire shipments row —
--     sender email, phone numbers, internal notes — to whoever called it. It is
--     replaced with a function shaped like every other public write in this
--     schema: constrained, idempotent, and answering with a small verdict.
--   * track_shipment() gains the payment state, so the tracking page can tell
--     whether to ask for an address. The address itself is never returned.

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------

alter table public.shipments
  add column if not exists recipient_contact_email text,
  add column if not exists recipient_email_submitted_at timestamptz,
  add column if not exists payment_status text,
  add column if not exists payment_currency text,
  add column if not exists total_amount_due numeric(12, 2),
  add column if not exists payment_reference text;

comment on column public.shipments.recipient_contact_email is
  'Address the recipient submitted themselves from the tracking page. Distinct from recipient_email, which operations records when the shipment is booked. Never returned by public tracking.';

comment on column public.shipments.payment_status is
  'Where a shipment sits in the recipient payment flow. Null means the flow does not apply, which is the normal case.';

-- The vocabulary is deliberately small: every value has code behind it.
--   awaiting_recipient_email  the tracking page asks for an address
--   email_received            an address was submitted; documents are being prepared
--   not_required              explicitly recorded as out of the flow
alter table public.shipments drop constraint if exists shipments_payment_status_known;
alter table public.shipments
  add constraint shipments_payment_status_known check (
    payment_status is null
    or payment_status in ('not_required', 'awaiting_recipient_email', 'email_received')
  );

-- Mirrors the check already carried by support_requests.email.
alter table public.shipments drop constraint if exists shipments_recipient_contact_email_format;
alter table public.shipments
  add constraint shipments_recipient_contact_email_format check (
    recipient_contact_email is null
    or (
      char_length(recipient_contact_email) <= 254
      and recipient_contact_email ~* '^[^@\s]+@[^@\s.]+\.[^@\s]+$'
    )
  );

alter table public.shipments drop constraint if exists shipments_payment_currency_len;
alter table public.shipments
  add constraint shipments_payment_currency_len check (
    payment_currency is null or char_length(payment_currency) = 3
  );

alter table public.shipments drop constraint if exists shipments_total_amount_due_non_negative;
alter table public.shipments
  add constraint shipments_total_amount_due_non_negative check (
    total_amount_due is null or total_amount_due >= 0
  );

-- Partial: the overwhelming majority of shipments are outside the flow and do
-- not need to be in this index.
create index if not exists shipments_payment_status_idx
  on public.shipments (payment_status)
  where payment_status is not null;

-- ---------------------------------------------------------------------------
-- 2. Submission
--
-- Everything that matters is enforced here rather than in the application:
-- the shipment must exist, must not be archived, must actually be asking for an
-- address, and must not already have one. The browser validates the same rules
-- first so a visitor gets a fast answer, but nothing here trusts that it did.
--
-- The row is locked for the duration, so two submissions racing each other
-- resolve to one write and one 'already_submitted', rather than two events and
-- two audit entries.
-- ---------------------------------------------------------------------------

-- The previous version returned `shipments`, so the type has to be dropped
-- before it can be recreated returning jsonb.
drop function if exists public.submit_recipient_email(text, text);

create or replace function public.submit_recipient_email(
  p_tracking_id text,
  p_email text
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
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_latest public.shipment_events;
begin
  if v_email = ''
    or char_length(v_email) > 254
    or v_email !~ '^[^@\s]+@[^@\s.]+\.[^@\s]+$'
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_email');
  end if;

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

  if s.payment_status = 'email_received' then
    return jsonb_build_object('ok', false, 'reason', 'already_submitted');
  end if;

  -- Only a shipment that is actually asking for an address accepts one. Without
  -- this, the function would be a way to write an arbitrary address onto any
  -- shipment whose tracking number someone holds.
  if s.payment_status is distinct from 'awaiting_recipient_email' then
    return jsonb_build_object('ok', false, 'reason', 'not_requested');
  end if;

  update public.shipments
  set recipient_contact_email = v_email,
      recipient_email_submitted_at = now(),
      payment_status = 'email_received'
  where id = s.id;

  -- The rollup trigger (0009) recomputes the shipment's location from its newest
  -- event. Submitting an address is not a scan and moves nothing, so the event
  -- repeats the location of the event before it rather than inventing one; a
  -- shipment held in Miami must not appear to jump back to its origin. With no
  -- prior event there is nothing to repeat, and the origin is the truthful
  -- answer.
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
    'Recipient Email Received',
    'The recipient securely submitted an email address. Payment documentation is now being prepared.',
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

comment on function public.submit_recipient_email(text, text) is
  'Records the address a recipient submits from the tracking page, and files the matching public event. Accepts one submission per shipment and only while payment_status is awaiting_recipient_email.';

revoke all on function public.submit_recipient_email(text, text) from public;
grant execute on function public.submit_recipient_email(text, text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Public tracking payload
--
-- Two fields are added: the payment state, which decides whether the page asks
-- for an address, and when an address was submitted, which lets the page confirm
-- receipt. The address itself is not returned. Publishing it would hand the
-- recipient's mailbox to anyone holding the tracking number, and no part of the
-- page needs to display it.
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
    'payment_status', s.payment_status,
    'recipient_email_submitted_at', s.recipient_email_submitted_at,
    'created_at', s.created_at,
    'updated_at', s.updated_at,
    'events', v_events
  );
end;
$$;

revoke all on function public.track_shipment(text) from public;
grant execute on function public.track_shipment(text) to anon, authenticated, service_role;
