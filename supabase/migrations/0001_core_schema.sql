-- SwiftTrack Private Delivery Company
-- Migration 0001: core schema (extensions, enums, tables, indexes, functions, triggers)
--
-- Design notes
--   * Every timestamp is timestamptz so the application can render timezone aware values.
--   * Public tracking never reads these tables directly. It goes through the
--     public.track_shipment() function defined in 0003, which returns a curated
--     set of safe fields only.
--   * Shipment status is derived from the newest shipment event so the summary
--     header and the timeline can never disagree.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'shipment_status') then
    create type public.shipment_status as enum (
      'created',
      'label_created',
      'picked_up',
      'in_transit',
      'arrived_at_facility',
      'out_for_delivery',
      'delivered',
      'delivery_attempted',
      'delayed',
      'exception',
      'returned',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'service_level') then
    create type public.service_level as enum (
      'standard',
      'express',
      'priority',
      'same_day',
      'freight'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum ('owner', 'operator', 'viewer');
  end if;

  if not exists (select 1 from pg_type where typname = 'support_request_status') then
    create type public.support_request_status as enum ('new', 'in_review', 'resolved', 'closed');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- Strips formatting characters so "st-1a2b 3c4d5e" and "ST1A2B3C4D5E" resolve
-- to the same shipment.
create or replace function public.normalize_tracking_id(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(regexp_replace(coalesce(p_value, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- Crockford style alphabet: no I, L, O or U, so tracking IDs stay unambiguous
-- when they are read over the phone or copied from a printed label.
create or replace function public.generate_tracking_id()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  candidate text;
  raw bytea;
  i int;
begin
  for attempt in 1..25 loop
    candidate := 'ST';
    raw := extensions.gen_random_bytes(10);
    for i in 1..10 loop
      -- 256 is an exact multiple of 32, so the modulo stays uniform.
      candidate := candidate || substr(alphabet, 1 + (get_byte(raw, i - 1) % 32), 1);
    end loop;
    exit when not exists (
      select 1 from public.shipments where tracking_id = candidate
    );
    candidate := null;
  end loop;

  if candidate is null then
    raise exception 'Could not generate a unique tracking id after 25 attempts';
  end if;

  return candidate;
end;
$$;

-- Public tracking shows who a shipment is for without publishing a full name.
create or replace function public.mask_person_name(p_value text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  parts text[];
  part text;
  out_value text := '';
begin
  if p_value is null or btrim(p_value) = '' then
    return null;
  end if;

  parts := regexp_split_to_array(btrim(p_value), '\s+');
  foreach part in array parts loop
    if part <> '' then
      out_value := out_value || upper(substr(part, 1, 1)) || '.';
    end if;
  end loop;

  return nullif(out_value, '');
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------

create table if not exists public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.admin_role not null default 'operator',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Operations staff allowed into /admin. A row here is what grants access, not merely having an auth account.';

create index if not exists admin_users_email_idx on public.admin_users (lower(email));

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

-- Authorization predicate used by every admin policy. security definer so the
-- policy check does not itself depend on a readable admin_users row.
create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.id = auth.uid()
      and a.is_active
  );
$$;

create or replace function public.current_admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = ''
as $$
  select a.role
  from public.admin_users a
  where a.id = auth.uid()
    and a.is_active;
$$;

create or replace function public.can_write_shipments()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_admin_role() in ('owner', 'operator');
$$;

-- ---------------------------------------------------------------------------
-- shipments
-- ---------------------------------------------------------------------------

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_id text not null default public.generate_tracking_id(),
  status public.shipment_status not null default 'created',
  service_level public.service_level not null default 'standard',

  -- Sender. Contact details stay internal and are never returned by the
  -- public tracking function.
  sender_name text,
  sender_company text,
  sender_email text,
  sender_phone text,
  origin_address_line1 text,
  origin_address_line2 text,
  origin_city text not null,
  origin_state text not null,
  origin_postal_code text,
  origin_country text not null default 'US',
  origin_latitude numeric(9, 6),
  origin_longitude numeric(9, 6),

  -- Recipient.
  recipient_name text,
  recipient_company text,
  recipient_email text,
  recipient_phone text,
  destination_address_line1 text,
  destination_address_line2 text,
  destination_city text not null,
  destination_state text not null,
  destination_postal_code text,
  destination_country text not null default 'US',
  destination_latitude numeric(9, 6),
  destination_longitude numeric(9, 6),

  -- Operational state.
  current_location_label text,
  estimated_delivery_date date,
  shipped_at timestamptz,
  delivered_at timestamptz,

  -- Package metadata.
  package_type text,
  piece_count integer not null default 1,
  weight_lb numeric(10, 2),
  length_in numeric(10, 2),
  width_in numeric(10, 2),
  height_in numeric(10, 2),

  internal_notes text,

  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  constraint shipments_tracking_id_key unique (tracking_id),
  constraint shipments_tracking_id_format
    check (tracking_id ~ '^ST[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}$'),
  constraint shipments_piece_count_positive check (piece_count > 0),
  constraint shipments_weight_non_negative check (weight_lb is null or weight_lb >= 0),
  constraint shipments_origin_lat_range
    check (origin_latitude is null or origin_latitude between -90 and 90),
  constraint shipments_origin_lng_range
    check (origin_longitude is null or origin_longitude between -180 and 180),
  constraint shipments_destination_lat_range
    check (destination_latitude is null or destination_latitude between -90 and 90),
  constraint shipments_destination_lng_range
    check (destination_longitude is null or destination_longitude between -180 and 180),
  constraint shipments_country_len check (
    char_length(origin_country) = 2 and char_length(destination_country) = 2
  )
);

comment on column public.shipments.current_location_label is
  'Most recent operational scan location. This is not live GPS and the UI must not present it as such.';

create index if not exists shipments_status_idx on public.shipments (status);
create index if not exists shipments_created_at_idx on public.shipments (created_at desc);
create index if not exists shipments_updated_at_idx on public.shipments (updated_at desc);
create index if not exists shipments_estimated_delivery_idx on public.shipments (estimated_delivery_date);
create index if not exists shipments_active_idx on public.shipments (archived_at) where archived_at is null;
create index if not exists shipments_search_idx on public.shipments
  using gin ((
    coalesce(tracking_id, '') || ' ' ||
    coalesce(recipient_name, '') || ' ' ||
    coalesce(recipient_company, '') || ' ' ||
    coalesce(sender_name, '') || ' ' ||
    coalesce(sender_company, '') || ' ' ||
    coalesce(destination_city, '') || ' ' ||
    coalesce(origin_city, '')
  ) extensions.gin_trgm_ops);

drop trigger if exists shipments_set_updated_at on public.shipments;
create trigger shipments_set_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- shipment_events
-- ---------------------------------------------------------------------------

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  status public.shipment_status not null,
  title text not null,
  description text,
  facility_label text,
  city text,
  state text,
  country text default 'US',
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  occurred_at timestamptz not null default now(),
  is_public boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),

  constraint shipment_events_title_len check (char_length(btrim(title)) between 1 and 160),
  constraint shipment_events_lat_range check (latitude is null or latitude between -90 and 90),
  constraint shipment_events_lng_range check (longitude is null or longitude between -180 and 180)
);

comment on column public.shipment_events.is_public is
  'Internal-only events are excluded from public tracking output.';

create index if not exists shipment_events_shipment_idx
  on public.shipment_events (shipment_id, occurred_at desc, created_at desc);
create index if not exists shipment_events_public_idx
  on public.shipment_events (shipment_id) where is_public;

-- Keeps shipments.status, current_location_label and delivered_at aligned with
-- the newest event, so the tracking header and timeline are always consistent.
create or replace function public.apply_event_to_shipment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_is_latest boolean;
  v_location text;
begin
  select not exists (
    select 1
    from public.shipment_events e
    where e.shipment_id = new.shipment_id
      and e.id <> new.id
      and (e.occurred_at, e.created_at) > (new.occurred_at, new.created_at)
  )
  into v_is_latest;

  if not v_is_latest then
    return new;
  end if;

  v_location := coalesce(
    nullif(btrim(coalesce(new.facility_label, '')), ''),
    nullif(
      btrim(
        concat_ws(', ', nullif(btrim(coalesce(new.city, '')), ''), nullif(btrim(coalesce(new.state, '')), ''))
      ),
      ''
    )
  );

  update public.shipments s
  set status = new.status,
      current_location_label = coalesce(v_location, s.current_location_label),
      delivered_at = case
        when new.status = 'delivered' then new.occurred_at
        else null
      end,
      shipped_at = case
        when s.shipped_at is null and new.status in (
          'picked_up', 'in_transit', 'arrived_at_facility', 'out_for_delivery'
        ) then new.occurred_at
        else s.shipped_at
      end
  where s.id = new.shipment_id;

  return new;
end;
$$;

drop trigger if exists shipment_events_apply_to_shipment on public.shipment_events;
create trigger shipment_events_apply_to_shipment
  after insert on public.shipment_events
  for each row execute function public.apply_event_to_shipment();

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create or replace function public.record_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entity_id uuid;
  v_action text;
  v_metadata jsonb := '{}'::jsonb;
begin
  v_entity_id := coalesce(
    case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'id') else (to_jsonb(new) ->> 'id') end
  )::uuid;

  if tg_op = 'INSERT' then
    v_action := tg_table_name || '.created';
  elsif tg_op = 'DELETE' then
    v_action := tg_table_name || '.deleted';
  elsif tg_table_name = 'shipments'
    and old.archived_at is null and new.archived_at is not null then
    v_action := 'shipments.archived';
  elsif tg_table_name = 'shipments'
    and old.archived_at is not null and new.archived_at is null then
    v_action := 'shipments.restored';
  elsif tg_table_name = 'shipments' and old.status <> new.status then
    v_action := 'shipments.status_changed';
    v_metadata := jsonb_build_object('from', old.status, 'to', new.status);
  else
    v_action := tg_table_name || '.updated';
  end if;

  if tg_table_name = 'shipments' then
    v_metadata := v_metadata || jsonb_build_object(
      'tracking_id',
      case when tg_op = 'DELETE' then old.tracking_id else new.tracking_id end
    );
  elsif tg_table_name = 'shipment_events' then
    v_metadata := v_metadata || jsonb_build_object(
      'shipment_id', case when tg_op = 'DELETE' then old.shipment_id else new.shipment_id end,
      'status', case when tg_op = 'DELETE' then old.status else new.status end
    );
  end if;

  insert into public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''),
    v_action,
    tg_table_name,
    v_entity_id,
    v_metadata
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists shipments_audit on public.shipments;
create trigger shipments_audit
  after insert or update or delete on public.shipments
  for each row execute function public.record_audit_event();

drop trigger if exists shipment_events_audit on public.shipment_events;
create trigger shipment_events_audit
  after insert or update or delete on public.shipment_events
  for each row execute function public.record_audit_event();

-- ---------------------------------------------------------------------------
-- support_requests
-- ---------------------------------------------------------------------------

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  tracking_id text,
  message text not null,
  status public.support_request_status not null default 'new',
  source text not null default 'contact_form',
  -- Hashed, never the raw address, so abuse throttling does not become a
  -- long term store of visitor IP addresses.
  requester_ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint support_requests_name_len check (char_length(btrim(name)) between 1 and 120),
  constraint support_requests_email_format check (email ~* '^[^@\s]+@[^@\s.]+\.[^@\s]+$'),
  constraint support_requests_subject_len check (char_length(btrim(subject)) between 1 and 160),
  constraint support_requests_message_len check (char_length(btrim(message)) between 10 and 4000)
);

create index if not exists support_requests_status_idx on public.support_requests (status, created_at desc);

drop trigger if exists support_requests_set_updated_at on public.support_requests;
create trigger support_requests_set_updated_at
  before update on public.support_requests
  for each row execute function public.set_updated_at();
