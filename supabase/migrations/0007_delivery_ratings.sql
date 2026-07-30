-- SwiftTrack Private Delivery Company
-- Migration 0007: delivery ratings and service performance
--
-- Two numbers appear on the public site and both are computed from real rows:
--
--   * Customer ratings, submitted by recipients after a shipment is delivered.
--   * Operational performance, derived from actual shipment timestamps.
--
-- Neither is seeded, hard coded or estimated. Before any real deliveries exist
-- the site says so rather than displaying a flattering placeholder.

create table if not exists public.shipment_ratings (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  stars smallint not null,
  comment text,
  requester_ip_hash text,
  created_at timestamptz not null default now(),

  -- One rating per shipment. A recipient can rate their delivery, not vote
  -- repeatedly to move the average.
  constraint shipment_ratings_one_per_shipment unique (shipment_id),
  constraint shipment_ratings_stars_range check (stars between 1 and 5),
  constraint shipment_ratings_comment_len check (comment is null or char_length(comment) <= 600)
);

create index if not exists shipment_ratings_created_at_idx
  on public.shipment_ratings (created_at desc);

alter table public.shipment_ratings enable row level security;
revoke all on table public.shipment_ratings from anon;

-- Operators read ratings in the admin area. Writes only ever happen through the
-- submit function below.
drop policy if exists shipment_ratings_select on public.shipment_ratings;
create policy shipment_ratings_select on public.shipment_ratings
  for select to authenticated
  using (public.is_active_admin());

-- ---------------------------------------------------------------------------
-- Submission
-- ---------------------------------------------------------------------------

create or replace function public.submit_shipment_rating(
  p_tracking_id text,
  p_stars int,
  p_comment text default null,
  p_ip_hash text default null
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
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  if p_stars is null or p_stars < 1 or p_stars > 5 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_rating');
  end if;

  if v_comment is not null and char_length(v_comment) > 600 then
    return jsonb_build_object('ok', false, 'reason', 'comment_too_long');
  end if;

  v_normalized := public.normalize_tracking_id(p_tracking_id);
  if v_normalized !~ '^ST[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}[A-Z]{2}$' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into s
  from public.shipments
  where tracking_id = v_normalized and archived_at is null;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Only a completed delivery can be rated.
  if s.status <> 'delivered' then
    return jsonb_build_object('ok', false, 'reason', 'not_delivered');
  end if;

  if exists (select 1 from public.shipment_ratings r where r.shipment_id = s.id) then
    return jsonb_build_object('ok', false, 'reason', 'already_rated');
  end if;

  insert into public.shipment_ratings (shipment_id, stars, comment, requester_ip_hash)
  values (s.id, p_stars, v_comment, nullif(btrim(coalesce(p_ip_hash, '')), ''));

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.submit_shipment_rating(text, int, text, text) from public;
grant execute on function public.submit_shipment_rating(text, int, text, text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Has this shipment already been rated
--
-- Returns a single boolean so the tracking page can hide the form once a rating
-- exists, without exposing the ratings table.
-- ---------------------------------------------------------------------------

create or replace function public.shipment_rating_state(p_tracking_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.shipments;
  v_normalized text;
  v_rating public.shipment_ratings;
begin
  v_normalized := public.normalize_tracking_id(p_tracking_id);
  if v_normalized !~ '^ST[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}[A-Z]{2}$' then
    return jsonb_build_object('can_rate', false, 'rated', false);
  end if;

  select * into s from public.shipments
  where tracking_id = v_normalized and archived_at is null;

  if not found or s.status <> 'delivered' then
    return jsonb_build_object('can_rate', false, 'rated', false);
  end if;

  select * into v_rating from public.shipment_ratings where shipment_id = s.id;

  if found then
    return jsonb_build_object('can_rate', false, 'rated', true, 'stars', v_rating.stars);
  end if;

  return jsonb_build_object('can_rate', true, 'rated', false);
end;
$$;

revoke all on function public.shipment_rating_state(text) from public;
grant execute on function public.shipment_rating_state(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Aggregate performance
--
-- Every figure is computed from rows that exist. on_time_percent compares the
-- delivery timestamp against the estimated delivery date, counting only
-- shipments that carried an estimate. Counts are returned alongside every
-- average so the caller can decide whether the sample is worth displaying.
-- ---------------------------------------------------------------------------

create or replace function public.service_performance()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with delivered as (
    select
      s.delivered_at,
      s.estimated_delivery_date,
      s.shipped_at
    from public.shipments s
    where s.status = 'delivered'
      and s.archived_at is null
      and s.delivered_at is not null
  ),
  timing as (
    select
      count(*) as delivered_count,
      count(*) filter (where estimated_delivery_date is not null) as with_estimate,
      count(*) filter (
        where estimated_delivery_date is not null
          and delivered_at::date <= estimated_delivery_date
      ) as on_time,
      avg(
        extract(epoch from (delivered_at - shipped_at)) / 86400.0
      ) filter (where shipped_at is not null) as avg_transit_days
    from delivered
  ),
  ratings as (
    select count(*) as rating_count, avg(stars)::numeric(3, 2) as average_stars
    from public.shipment_ratings
  )
  select jsonb_build_object(
    'delivered_count', timing.delivered_count,
    'on_time_count', timing.on_time,
    'rated_delivery_count', timing.with_estimate,
    'on_time_percent', case
      when timing.with_estimate > 0
        then round((timing.on_time::numeric / timing.with_estimate) * 100, 1)
      else null
    end,
    'average_transit_days', case
      when timing.avg_transit_days is not null then round(timing.avg_transit_days::numeric, 1)
      else null
    end,
    'rating_count', ratings.rating_count,
    'average_stars', ratings.average_stars
  )
  from timing, ratings;
$$;

revoke all on function public.service_performance() from public;
grant execute on function public.service_performance() to anon, authenticated, service_role;
