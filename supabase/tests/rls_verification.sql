-- SwiftTrack Private Delivery Company
-- Row Level Security verification suite.
--
-- Run against any SwiftTrack database after applying the migrations:
--   psql "$SUPABASE_DB_URL" -f supabase/tests/rls_verification.sql
--
-- It impersonates the anon and authenticated PostgREST roles, exercises every
-- policy boundary, prints a pass/fail table and then removes its own fixtures.
-- Everything runs inside one transaction that is rolled back at the end, so the
-- suite is safe to run against a live project.

begin;

create temporary table rls_results (
  at timestamptz not null default clock_timestamp(),
  area text,
  check_name text,
  expected text,
  actual text,
  passed boolean
) on commit drop;

-- The checks below run while the session role is anon or authenticated, so
-- those roles need to be able to append their own results.
grant all on rls_results to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fixtures: three identities that differ only in their admin_users row.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-outsider@swifttrack.test', '', now(), now()),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-viewer@swifttrack.test',   '', now(), now()),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-operator@swifttrack.test', '', now(), now()),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-disabled@swifttrack.test', '', now(), now())
on conflict (id) do nothing;

insert into public.admin_users (id, email, full_name, role, is_active)
values
  ('00000000-0000-4000-8000-000000000002', 'rls-viewer@swifttrack.test',   'RLS Viewer',   'viewer',   true),
  ('00000000-0000-4000-8000-000000000003', 'rls-operator@swifttrack.test', 'RLS Operator', 'operator', true),
  ('00000000-0000-4000-8000-000000000004', 'rls-disabled@swifttrack.test', 'RLS Disabled', 'operator', false)
on conflict (id) do nothing;

insert into public.shipments (
  tracking_id, origin_city, origin_state, origin_address_line1,
  destination_city, destination_state,
  sender_name, recipient_name, recipient_phone, recipient_email, internal_notes
) values (
  'STTEST000001AE', 'Dubai', null, '12 Fixture Sender Street',
  'Boston', 'MA',
  'Fixture Sender', 'Fixture Recipient', '+1 555 0000', 'fixture-recipient@swifttrack.test',
  'internal only'
) on conflict (tracking_id) do nothing;

insert into public.shipment_events (shipment_id, status, title, city, state, is_public)
select id, 'in_transit', 'Fixture public event', 'Newark', 'NJ', true
from public.shipments where tracking_id = 'STTEST000001AE';

insert into public.shipment_events (shipment_id, status, title, city, state, is_public)
select id, 'exception', 'Fixture internal event', 'Newark', 'NJ', false
from public.shipments where tracking_id = 'STTEST000001AE';

insert into public.support_requests (name, email, subject, message)
values ('Fixture Person', 'fixture@swifttrack.test', 'Fixture subject', 'Fixture message body long enough.')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Verification driver
-- ---------------------------------------------------------------------------

create or replace function pg_temp.become(p_user uuid, p_email text)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated', 'email', p_email)::text,
    true
  );
end;
$$;

create or replace function pg_temp.become_anon()
returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end;
$$;

create or replace function pg_temp.become_superuser()
returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

-- Runs a statement under the current role and records whether it was blocked.
-- p_expect_blocked = true  -> we want an error or zero rows.
-- p_expect_blocked = false -> we want it to succeed with rows/effect.
create or replace function pg_temp.expect(
  p_area text,
  p_check text,
  p_sql text,
  p_expect_blocked boolean
)
returns void language plpgsql as $$
declare
  v_rows bigint := 0;
  v_error text := null;
  v_blocked boolean;
  v_actual text;
begin
  begin
    execute p_sql;
    get diagnostics v_rows = row_count;
  exception when others then
    v_error := sqlerrm;
  end;

  -- "Blocked" means either the statement raised, or RLS silently filtered
  -- everything out. Both are acceptable denials.
  v_blocked := v_error is not null or v_rows = 0;
  v_actual := case
    when v_error is not null then 'error: ' || left(v_error, 90)
    else v_rows || ' row(s)'
  end;

  insert into rls_results (area, check_name, expected, actual, passed)
  values (
    p_area,
    p_check,
    case when p_expect_blocked then 'denied' else 'allowed' end,
    v_actual,
    v_blocked = p_expect_blocked
  );
end;
$$;

-- --- anonymous visitor -----------------------------------------------------
select pg_temp.become_anon();

select pg_temp.expect('anon', 'cannot read shipments',        'select * from public.shipments',        true);
select pg_temp.expect('anon', 'cannot read shipment_events',  'select * from public.shipment_events',  true);
select pg_temp.expect('anon', 'cannot read admin_users',      'select * from public.admin_users',      true);
select pg_temp.expect('anon', 'cannot read audit_logs',       'select * from public.audit_logs',       true);
select pg_temp.expect('anon', 'cannot read support_requests', 'select * from public.support_requests', true);
-- Every insert attempt below supplies tracking_id explicitly, the way the admin
-- create flow does (src/app/admin/(dashboard)/shipments/actions.ts builds it in
-- TypeScript). Leaving it out makes the column default fire
-- public.generate_tracking_id('US'), which 0006 grants to service_role only, so
-- the statement dies on a function privilege before any policy is consulted.
-- These checks exist to prove the policies deny the write, so they must not be
-- allowed to pass on an unrelated grant.
select pg_temp.expect('anon', 'cannot insert shipments',
  $q$insert into public.shipments (tracking_id, origin_city, origin_state, destination_city, destination_state)
     values ('STTEST000010US','X','NY','Y','CA')$q$, true);
select pg_temp.expect('anon', 'cannot insert support_requests',
  $q$insert into public.support_requests (name, email, subject, message)
     values ('a','a@b.co','s','long enough message')$q$, true);
select pg_temp.expect('anon', 'cannot call generate_tracking_id',
  'select public.generate_tracking_id()', true);
select pg_temp.expect('anon', 'CAN call track_shipment',
  $q$select public.track_shipment('STTEST000001AE') where public.track_shipment('STTEST000001AE') is not null$q$, false);

select pg_temp.become_superuser();

-- track_shipment must not leak internal fields to anyone.
do $$
declare
  payload text;
begin
  perform set_config('role', 'anon', true);
  payload := public.track_shipment('STTEST000001AE')::text;
  perform set_config('role', 'none', true);

  insert into rls_results (area, check_name, expected, actual, passed) values
    ('anon', 'track_shipment hides phone numbers', 'denied',
     case when payload like '%555 0000%' then 'phone leaked' else 'absent' end,
     payload not like '%555 0000%'),
    ('anon', 'track_shipment hides internal notes', 'denied',
     case when payload like '%internal only%' then 'notes leaked' else 'absent' end,
     payload not like '%internal only%'),
    ('anon', 'track_shipment hides email addresses', 'denied',
     case when payload like '%fixture-recipient@swifttrack.test%' then 'email leaked' else 'absent' end,
     payload not like '%fixture-recipient@swifttrack.test%'),
    ('anon', 'track_shipment hides the sender street address', 'denied',
     case when payload like '%12 Fixture Sender Street%' then 'address leaked' else 'absent' end,
     payload not like '%12 Fixture Sender Street%'),
    -- The recipient's own name and delivery address are returned on purpose:
    -- the tracking page exists so a recipient can confirm where their parcel is
    -- going. See "The recipient address decision" in docs/SECURITY.md. This
    -- asserts the decision rather than the reverse, so an accidental change to
    -- track_shipment() that drops the field is caught as a regression too.
    ('anon', 'track_shipment returns the recipient name by design', 'allowed',
     case when payload like '%Fixture Recipient%' then 'present' else 'missing' end,
     payload like '%Fixture Recipient%'),
    ('anon', 'track_shipment hides internal-only events', 'denied',
     case when payload like '%Fixture internal event%' then 'event leaked' else 'absent' end,
     payload not like '%Fixture internal event%'),
    ('anon', 'track_shipment includes the public event', 'allowed',
     case when payload like '%Fixture public event%' then 'present' else 'missing' end,
     payload like '%Fixture public event%');
end
$$;

-- --- signed in, but not operations staff -----------------------------------
select pg_temp.become('00000000-0000-4000-8000-000000000001', 'rls-outsider@swifttrack.test');

select pg_temp.expect('authenticated non-admin', 'cannot read shipments',        'select * from public.shipments',        true);
select pg_temp.expect('authenticated non-admin', 'cannot read shipment_events',  'select * from public.shipment_events',  true);
select pg_temp.expect('authenticated non-admin', 'cannot read audit_logs',       'select * from public.audit_logs',       true);
select pg_temp.expect('authenticated non-admin', 'cannot read support_requests', 'select * from public.support_requests', true);
select pg_temp.expect('authenticated non-admin', 'cannot read other admin_users',
  $q$select * from public.admin_users where id <> '00000000-0000-4000-8000-000000000001'$q$, true);
select pg_temp.expect('authenticated non-admin', 'cannot insert shipments',
  $q$insert into public.shipments (tracking_id, origin_city, origin_state, destination_city, destination_state)
     values ('STTEST000011US','X','NY','Y','CA')$q$, true);
select pg_temp.expect('authenticated non-admin', 'cannot escalate self to admin',
  $q$insert into public.admin_users (id, email, role)
     values ('00000000-0000-4000-8000-000000000001','rls-outsider@swifttrack.test','owner')$q$, true);

select pg_temp.become_superuser();

-- --- deactivated operator --------------------------------------------------
select pg_temp.become('00000000-0000-4000-8000-000000000004', 'rls-disabled@swifttrack.test');
select pg_temp.expect('deactivated admin', 'cannot read shipments', 'select * from public.shipments', true);
select pg_temp.expect('deactivated admin', 'cannot insert shipments',
  $q$insert into public.shipments (tracking_id, origin_city, origin_state, destination_city, destination_state)
     values ('STTEST000012US','X','NY','Y','CA')$q$, true);
select pg_temp.become_superuser();

-- --- viewer: read only -----------------------------------------------------
select pg_temp.become('00000000-0000-4000-8000-000000000002', 'rls-viewer@swifttrack.test');
select pg_temp.expect('viewer', 'CAN read shipments',       'select * from public.shipments',       false);
select pg_temp.expect('viewer', 'CAN read shipment_events', 'select * from public.shipment_events', false);
select pg_temp.expect('viewer', 'CAN read audit_logs',      'select * from public.audit_logs',      false);
select pg_temp.expect('viewer', 'cannot insert shipments',
  $q$insert into public.shipments (tracking_id, origin_city, origin_state, destination_city, destination_state)
     values ('STTEST000013US','X','NY','Y','CA')$q$, true);
select pg_temp.expect('viewer', 'cannot update shipments',
  $q$update public.shipments set status = 'delivered' where tracking_id = 'STTEST000001AE'$q$, true);
select pg_temp.expect('viewer', 'cannot insert events',
  $q$insert into public.shipment_events (shipment_id, status, title)
     select id, 'delivered', 'nope' from public.shipments where tracking_id = 'STTEST000001AE'$q$, true);
select pg_temp.expect('viewer', 'cannot manage staff',
  $q$update public.admin_users set role = 'owner' where id = '00000000-0000-4000-8000-000000000002'$q$, true);
select pg_temp.become_superuser();

-- --- operator: read and write, but not destructive ------------------------
select pg_temp.become('00000000-0000-4000-8000-000000000003', 'rls-operator@swifttrack.test');
select pg_temp.expect('operator', 'CAN read shipments', 'select * from public.shipments', false);
select pg_temp.expect('operator', 'CAN insert shipments',
  $q$insert into public.shipments (tracking_id, origin_city, origin_state, destination_city, destination_state)
     values ('STTEST000002US','Trenton','NJ','Albany','NY')$q$, false);
select pg_temp.expect('operator', 'CAN insert events',
  $q$insert into public.shipment_events (shipment_id, status, title, city, state)
     select id, 'out_for_delivery', 'Out for delivery', 'Boston', 'MA'
     from public.shipments where tracking_id = 'STTEST000001AE'$q$, false);
select pg_temp.expect('operator', 'CAN archive shipments',
  $q$update public.shipments set archived_at = now() where tracking_id = 'STTEST000001AE'$q$, false);
select pg_temp.expect('operator', 'cannot hard delete shipments',
  $q$delete from public.shipments where tracking_id = 'STTEST000001AE'$q$, true);
select pg_temp.expect('operator', 'cannot delete events',
  $q$delete from public.shipment_events
     where shipment_id in (select id from public.shipments where tracking_id = 'STTEST000001AE')$q$, true);
select pg_temp.expect('operator', 'cannot write audit_logs',
  $q$insert into public.audit_logs (action, entity_type) values ('forged','shipments')$q$, true);
select pg_temp.expect('operator', 'cannot promote self to owner',
  $q$update public.admin_users set role = 'owner' where id = '00000000-0000-4000-8000-000000000003'$q$, true);
select pg_temp.become_superuser();

-- Archived shipments must disappear from public tracking.
do $$
declare
  v_null boolean;
begin
  perform set_config('role', 'anon', true);
  v_null := public.track_shipment('STTEST000001AE') is null;
  perform set_config('role', 'none', true);
  insert into rls_results (area, check_name, expected, actual, passed)
  values ('anon', 'archived shipment is untrackable', 'denied',
          case when v_null then 'null' else 'still visible' end, v_null);
end
$$;

-- Every exposed table must actually have RLS turned on.
insert into rls_results (area, check_name, expected, actual, passed)
select 'schema', 'RLS enabled on ' || c.relname, 'allowed',
       case when c.relrowsecurity then 'enabled' else 'DISABLED' end,
       c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------

select area, check_name, expected, actual,
       case when passed then 'PASS' else 'FAIL' end as result
from rls_results
order by at;

select count(*) filter (where passed)       as passed,
       count(*) filter (where not passed)   as failed,
       count(*)                             as total
from rls_results;

-- Fixtures and every write made above are discarded.
rollback;
