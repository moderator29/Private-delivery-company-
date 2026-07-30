-- SwiftTrack Private Delivery Company
-- Migration 0004: harden function exposure
--
-- Postgres grants EXECUTE on every new function to the PUBLIC pseudo-role, and
-- PostgREST publishes anything in the `public` schema at /rest/v1/rpc/<name>.
-- Revoking from `anon` alone (migration 0002) therefore did not actually close
-- these functions, because the PUBLIC grant still applied. Every internal helper
-- is revoked from PUBLIC here and re-granted only where it is genuinely needed.

-- ---------------------------------------------------------------------------
-- Internal helpers. Nothing outside the database needs to call these.
-- They are still reachable from inside the security definer functions and
-- triggers that use them, because those execute as the function owner.
-- ---------------------------------------------------------------------------

revoke all on function public.normalize_tracking_id(text)  from public, anon, authenticated;
revoke all on function public.generate_tracking_id()       from public, anon, authenticated;
revoke all on function public.mask_person_name(text)       from public, anon, authenticated;
revoke all on function public.set_updated_at()             from public, anon, authenticated;
revoke all on function public.record_audit_event()         from public, anon, authenticated;
revoke all on function public.apply_event_to_shipment()    from public, anon, authenticated;

grant execute on function public.generate_tracking_id()      to service_role;
grant execute on function public.normalize_tracking_id(text) to service_role;

-- ---------------------------------------------------------------------------
-- Authorization predicates.
--
-- These are referenced by the RLS policies in 0002. A policy expression is
-- evaluated with the privileges of the querying role, so `authenticated` must
-- keep EXECUTE or every admin policy would fail. They stay SECURITY DEFINER on
-- purpose: they answer "is the caller an active operator" without requiring the
-- caller to be able to read admin_users, which is what prevents the policy on
-- admin_users from recursing into itself.
--
-- Calling them reveals only the caller's own role, never another user's data,
-- and anon cannot call them at all.
-- ---------------------------------------------------------------------------

revoke all on function public.is_active_admin()      from public, anon;
revoke all on function public.current_admin_role()   from public, anon;
revoke all on function public.can_write_shipments()  from public, anon;

grant execute on function public.is_active_admin()     to authenticated, service_role;
grant execute on function public.current_admin_role()  to authenticated, service_role;
grant execute on function public.can_write_shipments() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- public.track_shipment(text) stays deliberately callable by anon. It is the
-- product's public tracking endpoint and returns only the approved field set
-- (see 0003). This is the one intentional anon-callable SECURITY DEFINER
-- function in the schema.
-- ---------------------------------------------------------------------------

comment on function public.is_active_admin() is
  'SECURITY DEFINER by design: breaks RLS recursion on admin_users. Not callable by anon.';
