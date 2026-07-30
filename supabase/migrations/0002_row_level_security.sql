-- SwiftTrack Private Delivery Company
-- Migration 0002: Row Level Security
--
-- Model
--   * Anonymous visitors have no table access at all. Public tracking is served
--     exclusively by public.track_shipment() (migration 0003), which returns a
--     curated field set. Revoking the anon grants means a mistake in a single
--     policy cannot expose a table.
--   * Signed-in users are only operators if they also have an active row in
--     admin_users. Authenticating alone grants nothing.
--   * 'viewer' operators can read but not write. 'owner' manages staff.

alter table public.admin_users enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.support_requests enable row level security;

-- Defense in depth: PostgREST needs a table grant *and* a passing policy, so
-- dropping the anon grant closes the table even if a policy is miswritten.
revoke all on table public.admin_users from anon;
revoke all on table public.shipments from anon;
revoke all on table public.shipment_events from anon;
revoke all on table public.audit_logs from anon;
revoke all on table public.support_requests from anon;

-- Audit rows are written by a security definer trigger, never by a client.
revoke insert, update, delete on table public.audit_logs from authenticated;

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------

drop policy if exists admin_users_select on public.admin_users;
create policy admin_users_select on public.admin_users
  for select to authenticated
  using (id = auth.uid() or public.is_active_admin());

drop policy if exists admin_users_insert on public.admin_users;
create policy admin_users_insert on public.admin_users
  for insert to authenticated
  with check (public.current_admin_role() = 'owner');

drop policy if exists admin_users_update on public.admin_users;
create policy admin_users_update on public.admin_users
  for update to authenticated
  using (public.current_admin_role() = 'owner')
  with check (public.current_admin_role() = 'owner');

drop policy if exists admin_users_delete on public.admin_users;
create policy admin_users_delete on public.admin_users
  for delete to authenticated
  using (public.current_admin_role() = 'owner' and id <> auth.uid());

-- ---------------------------------------------------------------------------
-- shipments
-- ---------------------------------------------------------------------------

drop policy if exists shipments_select on public.shipments;
create policy shipments_select on public.shipments
  for select to authenticated
  using (public.is_active_admin());

drop policy if exists shipments_insert on public.shipments;
create policy shipments_insert on public.shipments
  for insert to authenticated
  with check (public.can_write_shipments());

drop policy if exists shipments_update on public.shipments;
create policy shipments_update on public.shipments
  for update to authenticated
  using (public.can_write_shipments())
  with check (public.can_write_shipments());

-- No delete policy. Shipments are archived (soft deleted) so tracking history
-- and audit trails stay intact.

-- ---------------------------------------------------------------------------
-- shipment_events
-- ---------------------------------------------------------------------------

drop policy if exists shipment_events_select on public.shipment_events;
create policy shipment_events_select on public.shipment_events
  for select to authenticated
  using (public.is_active_admin());

drop policy if exists shipment_events_insert on public.shipment_events;
create policy shipment_events_insert on public.shipment_events
  for insert to authenticated
  with check (public.can_write_shipments());

drop policy if exists shipment_events_update on public.shipment_events;
create policy shipment_events_update on public.shipment_events
  for update to authenticated
  using (public.can_write_shipments())
  with check (public.can_write_shipments());

drop policy if exists shipment_events_delete on public.shipment_events;
create policy shipment_events_delete on public.shipment_events
  for delete to authenticated
  using (public.current_admin_role() = 'owner');

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.is_active_admin());

-- ---------------------------------------------------------------------------
-- support_requests
-- ---------------------------------------------------------------------------

-- No client insert policy exists; submissions arrive through a function.
--
-- Superseded by 0005: that route was replaced with submit_support_request(),
-- a constrained SECURITY DEFINER function granted to anon, so the application
-- needs no service role key at all. The absence of an insert policy here is
-- still correct and still deliberate.
drop policy if exists support_requests_select on public.support_requests;
create policy support_requests_select on public.support_requests
  for select to authenticated
  using (public.is_active_admin());

drop policy if exists support_requests_update on public.support_requests;
create policy support_requests_update on public.support_requests
  for update to authenticated
  using (public.can_write_shipments())
  with check (public.can_write_shipments());

-- ---------------------------------------------------------------------------
-- Function execution grants
-- ---------------------------------------------------------------------------

revoke all on function public.generate_tracking_id() from anon, authenticated;
revoke all on function public.is_active_admin() from anon;
revoke all on function public.current_admin_role() from anon;
revoke all on function public.can_write_shipments() from anon;
revoke all on function public.record_audit_event() from anon, authenticated;
revoke all on function public.apply_event_to_shipment() from anon, authenticated;
revoke all on function public.set_updated_at() from anon, authenticated;

grant execute on function public.generate_tracking_id() to service_role;
