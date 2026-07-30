-- SwiftTrack Private Delivery Company
-- Create the first operations account without a service role key.
--
-- Run this in the Supabase SQL editor. Replace the email and password below
-- first, then delete this file's edited copy: do not leave a password in a file
-- you might commit.
--
-- Access to /admin requires BOTH an auth user and an active admin_users row.
-- This creates both.

do $$
declare
  v_email    text := 'you@example.com';       -- CHANGE ME
  v_password text := 'change-this-password';  -- CHANGE ME, 12 characters or more
  v_name     text := 'Your Name';             -- CHANGE ME
  v_role     public.admin_role := 'owner';
  v_user_id  uuid;
begin
  if v_password = 'change-this-password' or length(v_password) < 12 then
    raise exception 'Set a real password of at least 12 characters before running this.';
  end if;

  select id into v_user_id from auth.users where lower(email) = lower(v_email);

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      lower(v_email),
      -- GoTrue reads bcrypt hashes, which is what crypt/gen_salt('bf') produces.
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb
    );

    raise notice 'Created auth user %', v_email;
  else
    update auth.users
    set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
        updated_at = now()
    where id = v_user_id;

    raise notice 'Auth user already existed, password reset for %', v_email;
  end if;

  insert into public.admin_users (id, email, full_name, role, is_active)
  values (v_user_id, lower(v_email), v_name, v_role, true)
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        is_active = true;

  raise notice 'Operations access granted to % as %', v_email, v_role;
end
$$;
