-- SwiftTrack Private Delivery Company
-- Migration 0009: derive shipment state from all events, not just the new one
--
-- The original trigger inspected only the row being inserted and asked "is this
-- now the newest event". That is correct for a single insert but wrong for a
-- multi-row insert, because Postgres does not promise to process rows in the
-- order they were written. Seeding four events in one statement set shipped_at
-- from whichever moving event happened to be applied first.
--
-- The rollup below recomputes the derived columns from the complete event set
-- every time, so the result is the same no matter what order events arrive in,
-- including backfilled and corrected ones. It also now fires on update and
-- delete, so editing or removing an event repairs the parent shipment.

create or replace function public.apply_event_to_shipment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_shipment_id uuid;
  v_latest public.shipment_events;
  v_location text;
  v_shipped_at timestamptz;
  v_delivered_at timestamptz;
begin
  v_shipment_id := coalesce(new.shipment_id, old.shipment_id);

  select * into v_latest
  from public.shipment_events e
  where e.shipment_id = v_shipment_id
  order by e.occurred_at desc, e.created_at desc, e.id desc
  limit 1;

  if not found then
    -- Last event removed: reset the derived columns rather than leaving the
    -- shipment claiming a status no event supports.
    update public.shipments
    set status = 'created',
        current_location_label = null,
        shipped_at = null,
        delivered_at = null
    where id = v_shipment_id;
    return coalesce(new, old);
  end if;

  v_location := coalesce(
    nullif(btrim(coalesce(v_latest.facility_label, '')), ''),
    nullif(
      btrim(concat_ws(', ',
        nullif(btrim(coalesce(v_latest.city, '')), ''),
        nullif(btrim(coalesce(v_latest.state, '')), '')
      )),
      ''
    )
  );

  -- Earliest point the package was physically moving.
  select min(e.occurred_at) into v_shipped_at
  from public.shipment_events e
  where e.shipment_id = v_shipment_id
    and e.status in ('picked_up', 'in_transit', 'arrived_at_facility', 'out_for_delivery');

  -- Delivered only counts when delivery is the current state.
  if v_latest.status = 'delivered' then
    v_delivered_at := v_latest.occurred_at;
  else
    v_delivered_at := null;
  end if;

  update public.shipments
  set status = v_latest.status,
      current_location_label = v_location,
      shipped_at = v_shipped_at,
      delivered_at = v_delivered_at
  where id = v_shipment_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists shipment_events_apply_to_shipment on public.shipment_events;
create trigger shipment_events_apply_to_shipment
  after insert or update or delete on public.shipment_events
  for each row execute function public.apply_event_to_shipment();

revoke all on function public.apply_event_to_shipment() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Audit trigger fix
--
-- The original version tested `old.archived_at` inside a branch guarded by
-- `tg_table_name = 'shipments'`. PL/pgSQL plans the whole boolean expression as
-- one query, so the field reference had to resolve even when the guard was
-- false. That made any UPDATE on shipment_events fail with
-- 'record "old" has no field "archived_at"'.
--
-- Reading the rows as jsonb removes the problem entirely: a missing key is null
-- rather than a compile error, and the function no longer needs to know the
-- column layout of the table it is attached to.
-- ---------------------------------------------------------------------------

create or replace function public.record_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_new jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_action text;
  v_metadata jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := tg_table_name || '.created';
  elsif tg_op = 'DELETE' then
    v_action := tg_table_name || '.deleted';
  else
    v_action := tg_table_name || '.updated';

    if tg_table_name = 'shipments' then
      if v_old ->> 'archived_at' is null and v_new ->> 'archived_at' is not null then
        v_action := 'shipments.archived';
      elsif v_old ->> 'archived_at' is not null and v_new ->> 'archived_at' is null then
        v_action := 'shipments.restored';
      elsif v_old ->> 'status' is distinct from v_new ->> 'status' then
        v_action := 'shipments.status_changed';
        v_metadata := jsonb_build_object('from', v_old ->> 'status', 'to', v_new ->> 'status');
      end if;
    end if;
  end if;

  if tg_table_name = 'shipments' then
    v_metadata := v_metadata || jsonb_build_object('tracking_id', v_row ->> 'tracking_id');
  elsif tg_table_name = 'shipment_events' then
    v_metadata := v_metadata || jsonb_build_object(
      'shipment_id', v_row ->> 'shipment_id',
      'status', v_row ->> 'status'
    );
  end if;

  insert into public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''),
    v_action,
    tg_table_name,
    (v_row ->> 'id')::uuid,
    v_metadata
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.record_audit_event() from public, anon, authenticated;
