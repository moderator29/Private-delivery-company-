#!/usr/bin/env node
/**
 * Bootstraps the first SwiftTrack operations account.
 *
 * Access to /admin requires BOTH a Supabase auth user and an active row in
 * admin_users. This script creates both in one step.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY, because creating an auth user is an admin
 * API operation. The application itself never needs that key. If you would
 * rather not have it on disk, supabase/bootstrap_admin.sql does the same thing
 * from the Supabase SQL editor.
 *
 *   npm run admin:create -- --email you@example.com --password 'strong-password' --role owner
 */

import { createClient } from "@supabase/supabase-js";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = "true";
    }
  }
  return args;
}

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const email = args.email;
const password = args.password;
const role = args.role ?? "owner";
const fullName = args.name ?? null;

if (!email || !password) {
  fail(
    "Usage: npm run admin:create -- --email you@example.com --password 'strong-password' [--role owner|operator|viewer] [--name 'Full Name']",
  );
}

if (!["owner", "operator", "viewer"].includes(role)) {
  fail(`Role must be owner, operator or viewer. Received "${role}".`);
}

if (password.length < 12) {
  fail("Choose a password of at least 12 characters. This account can read every shipment.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) fail("NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env.local.");
if (!serviceRoleKey) {
  fail(
    "SUPABASE_SERVICE_ROLE_KEY is not set.\n  Add it to .env.local temporarily, or use supabase/bootstrap_admin.sql instead.",
  );
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

let userId = created?.user?.id ?? null;

if (createError) {
  // Already registered is fine: promote the existing account rather than failing.
  const alreadyExists =
    createError.status === 422 || /already registered/i.test(createError.message ?? "");

  if (!alreadyExists) fail(`Could not create the auth user: ${createError.message}`);

  console.log("  Auth user already exists, looking it up.");
  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) fail(`Could not list users: ${listError.message}`);

  const match = list.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (!match) fail("The account exists but could not be found. Check the email address.");
  userId = match.id;
}

if (!userId) fail("No user id was returned.");

const { error: upsertError } = await supabase
  .from("admin_users")
  .upsert({ id: userId, email, full_name: fullName, role, is_active: true }, { onConflict: "id" });

if (upsertError) fail(`Could not grant operations access: ${upsertError.message}`);

console.log(`\n  Operations access granted.\n`);
console.log(`    Email : ${email}`);
console.log(`    Role  : ${role}`);
console.log(`\n  Sign in at /admin/login\n`);
