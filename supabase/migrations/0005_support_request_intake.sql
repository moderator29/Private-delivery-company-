-- SwiftTrack Private Delivery Company
-- Migration 0005: public support request intake
--
-- The contact form needs to write one row into a table that anon cannot read or
-- write. Two ways to do that: hand the application a service role key, or expose
-- a single narrow function. The function wins.
--
--   * No secret key has to exist in the deployment for the form to work.
--   * The write is shaped by the function, so a caller cannot set status, choose
--     an id, backdate created_at or write to any other column.
--   * support_requests stays fully closed to anon for both read and write.
--
-- The application rate limits by hashed IP before calling this. The counters
-- below are the backstop for anyone calling the endpoint directly.

create or replace function public.submit_support_request(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_phone text default null,
  p_tracking_id text default null,
  p_ip_hash text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_subject text := btrim(coalesce(p_subject, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_tracking text := nullif(public.normalize_tracking_id(p_tracking_id), '');
  v_ip_hash text := nullif(btrim(coalesce(p_ip_hash, '')), '');
  v_recent int;
begin
  -- Validate here as well as in the application. The application message is the
  -- friendly one; these exist so the endpoint is still safe when called directly.
  if char_length(v_name) < 1 or char_length(v_name) > 120 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  if v_email !~ '^[^@\s]+@[^@\s.]+\.[^@\s]+$' or char_length(v_email) > 200 then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  if char_length(v_subject) < 1 or char_length(v_subject) > 160 then
    raise exception 'invalid_subject' using errcode = '22023';
  end if;

  if char_length(v_message) < 10 or char_length(v_message) > 4000 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;

  if v_phone is not null and char_length(v_phone) > 40 then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  -- Per-sender backstop: five submissions an hour from one hashed address.
  if v_ip_hash is not null then
    select count(*) into v_recent
    from public.support_requests
    where requester_ip_hash = v_ip_hash
      and created_at > now() - interval '1 hour';

    if v_recent >= 5 then
      raise exception 'rate_limited' using errcode = '53400';
    end if;
  end if;

  -- Global backstop, so a distributed flood cannot fill the table unbounded.
  select count(*) into v_recent
  from public.support_requests
  where created_at > now() - interval '1 minute';

  if v_recent >= 60 then
    raise exception 'rate_limited' using errcode = '53400';
  end if;

  insert into public.support_requests (name, email, phone, subject, tracking_id, message, source, requester_ip_hash)
  values (v_name, v_email, v_phone, v_subject, v_tracking, v_message, 'contact_form', v_ip_hash);
end;
$$;

comment on function public.submit_support_request(text, text, text, text, text, text, text) is
  'Public contact form intake. Write only, validates and throttles. The support_requests table itself stays closed to anon.';

revoke all on function public.submit_support_request(text, text, text, text, text, text, text) from public;
grant execute on function public.submit_support_request(text, text, text, text, text, text, text)
  to anon, authenticated, service_role;

-- Supports the per-sender throttle lookup above.
create index if not exists support_requests_ip_hash_idx
  on public.support_requests (requester_ip_hash, created_at desc);
