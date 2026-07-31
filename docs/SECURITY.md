# Security model

This describes what protects SwiftTrack data, what the public tracking page
deliberately shows, and where the model is known to be thin. It is written for
whoever maintains this next, not as a compliance document.

---

## The shape of it

There are two ways into the data and they are enforced in completely different
places.

Anonymous visitors reach the database through a small set of `SECURITY DEFINER`
functions and nothing else. They have no table grants at all. Migration
`0002_row_level_security.sql` revokes every privilege on every table from
`anon`, which means a mistake in a single RLS policy still cannot expose a
table: PostgREST needs both a table grant and a passing policy, and the grant is
gone.

Operators reach the data through Row Level Security. Every admin page runs
`requireAdmin()` from `src/lib/data/admin.ts`, which resolves the Supabase user
with `getUser()` (validating the JWT against the auth server rather than
trusting the cookie) and then requires an active row in `admin_users`.
Authenticating alone grants nothing. Underneath that, every query the server
makes uses the publishable key and a request-scoped session, so RLS re-decides
the same question in the database.

`src/middleware.ts` is not part of either path. It runs on `/admin/:path*` only
and redirects signed-out visitors to the login page. It is a convenience. It
degrades to "nobody is signed in" whenever the auth call fails, rather than
throwing, because an uncaught throw in middleware is a 500 on the whole route.
Bypassing it gains nothing: the page behind it calls `requireAdmin()` in the
same request that reads data, and RLS sits under that.

The application never uses a service role key. `src/lib/env.ts` does not even
read one. The only place it appears is `scripts/create-admin.mjs`, which is an
optional bootstrap helper you can skip entirely by running
`supabase/bootstrap_admin.sql` in the SQL editor instead.

---

## Roles

`admin_users.role` is one of `owner`, `operator`, `viewer`, and `is_active` gates
all three.

A **viewer** may read shipments, events and audit logs. Every write policy calls
`can_write_shipments()`, which a viewer fails.

An **operator** may create and update shipments and events, and archive a
shipment. There is no delete policy on `shipments` at all, so an operator cannot
hard delete one; archiving is a soft delete that keeps tracking history and the
audit trail intact.

An **owner** additionally manages staff rows in `admin_users` and may delete
shipment events. The delete policy on `admin_users` carries `id <> auth.uid()`,
so an owner cannot remove their own access and lock the company out.

Nobody, at any role, can write `audit_logs`. Migration 0002 revokes
`insert, update, delete` on that table from `authenticated`. Rows arrive only
through the `record_audit_event()` trigger, which is `SECURITY DEFINER` and is
revoked from `public`, `anon` and `authenticated` so it cannot be called
directly.

---

## What public tracking returns

`public.track_shipment(text)` in `supabase/migrations/0006_international_shipping.sql`
is the current definition (0003 created it, 0006 replaced it). It is the only
read path an anonymous visitor has to shipment data, and `src/lib/data/tracking.ts`
is the only caller — nothing in the application queries a shipment table
directly on a public page.

The function normalizes the input, rejects anything that does not match
`^ST[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}[A-Z]{2}$` before touching the table, and
returns `null` for an unknown, malformed or archived tracking ID. All three
cases are indistinguishable to the caller, so the page cannot be used to confirm
whether a given ID exists.

It returns:

- `tracking_id`, `status`, `service_level`
- `sender`: name, company, and the origin city, state and country
- `recipient`: name, company, `address_line1`, `address_line2`, city, state,
  postal code and country
- `origin` and `destination`: city, state, country and coordinates
- `current_location_label`, `estimated_delivery_date`,
  `estimated_delivery_window`, `shipped_at`, `delivered_at`
- `package`: type, piece count, `weight_kg` and centimetre dimensions
- `payment_status` and `recipient_email_submitted_at`, which are what tell the
  tracking page whether to ask the recipient for an email address or to confirm
  one arrived
- `payment_method`, `payment_wallet_address`, `payment_currency`,
  `total_amount_due`, `payment_confirmation_at` and `invoice_items` (an ordered
  list of `{description, amount}`), which drive the invoice, the pay-to details
  and the payment-review state. These describe what is owed and where to pay it,
  not who is paying; the wallet address is a payment destination, shown to the
  recipient the same way the delivery address is
- `created_at`, `updated_at`
- `events`: for each event with `is_public = true`, its status, title,
  description, facility label, city, state, country, coordinates and
  `occurred_at`

It withholds:

- **Phone numbers.** `sender_phone` and `recipient_phone` are never returned.
- **Email addresses.** `sender_email`, `recipient_email` and
  `recipient_contact_email` are never returned. The last of those is the address
  a recipient submits from the tracking page; the page confirms that it arrived
  and never displays it, so a forwarded tracking link cannot be used to read
  someone's mailbox back.
- **`internal_notes`.** Operations commentary stays in the admin area.
- **`created_by`** and the internal row `id`. Nothing links a public payload back
  to a staff account or to a primary key.
- **Internal-only events.** The event subquery filters on `e.is_public`, so an
  event recorded with `is_public = false` is invisible to tracking while
  remaining visible to operators.
- **Archived shipments.** The lookup carries `archived_at is null`, so archiving
  removes a shipment from public tracking immediately.
- **The sender's street address.** `origin_address_line1` and
  `origin_address_line2` are not in the payload; only the origin city, state and
  country are.

Location data is scan level. There is no live GPS anywhere in this product and
the UI must not present it as such — `shipments.current_location_label` carries
that as a column comment.

---

## The recipient address decision

`track_shipment()` returns the recipient's full name and street address to
anyone holding the tracking number. This is a deliberate product decision, not
an oversight, and it is recorded as such in the exposure note in migration 0006.
The tracking page is designed to show a recipient their own delivery address so
they can confirm it is correct before the courier arrives, and that is what the
approved design displays.

The trade-off is real and worth stating plainly. A tracking number is the only
credential involved. Anyone who obtains one — from a forwarded link, a photo of
a label, a shared screenshot — can read the recipient's name and street address.
Tracking IDs are not guessable (ten characters from a 32-symbol alphabet drawn
from `gen_random_bytes`, roughly 50 bits), the tracking page sends
`robots: noindex, nofollow`, `/track/` is disallowed in `src/app/robots.ts`, and
individual tracking pages are absent from the sitemap. So the exposure is
"whoever has the number", not "the open internet". But within that population it
is unrestricted.

To reduce it later, replace the `recipient` block in `track_shipment()` with
city, state and country only:

```sql
-- Inside public.track_shipment(), replacing the existing 'recipient' object.
'recipient', jsonb_build_object(
  'name', null,
  'company', s.recipient_company,
  'address_line1', null,
  'address_line2', null,
  'city', s.destination_city,
  'state', s.destination_state,
  'postal_code', null,
  'country', s.destination_country
),
```

Keep the key names. `src/lib/tracking/shipment.ts` parses the payload with a Zod
schema and treats the address fields as nullable, so nulling them changes what
renders without breaking the parse. After changing it, re-run the RLS suite and
the browser tests; `tests/e2e/tracking.spec.ts` asserts against what the page
shows today.

Two things do not change with it: the sender's name is still returned, and the
destination city, state and coordinates are needed by the map and the timeline.
Full anonymity of the destination is not achievable without redesigning the
tracking page.

---

## The contact form

The contact form needs to write one row into `support_requests`, a table `anon`
can neither read nor write. It does that through
`public.submit_support_request()` (migration 0005) rather than through a service
role key, which is why no secret key needs to exist in the deployment at all.

The function fixes every column the caller must not control: it cannot set
`status`, choose an `id`, backdate `created_at`, or write to any other column.
It revalidates name, email, subject, message and phone lengths in SQL, so the
endpoint is still safe when called directly rather than through
`src/lib/data/support.ts`.

It carries two throttles of its own: five submissions an hour from one hashed
address, and sixty submissions a minute globally so a distributed flood cannot
fill the table without bound. The application throttle in front of it is the
friendly one; these are the backstop.

The requester's IP address is hashed in `src/lib/rate-limit.ts` before it ever
reaches the database, so `support_requests.requester_ip_hash` cannot be turned
back into a list of visitor addresses.

---

## Every function anon can call

Seven, all `SECURITY DEFINER`, all explicitly revoked from `public` and then
granted to `anon`:

| Function                                        | Migration              | What it does                                      |
| ----------------------------------------------- | ---------------------- | ------------------------------------------------- |
| `track_shipment(text)`                          | 0012 (created in 0003) | Public tracking lookup                            |
| `submit_support_request(...)`                   | 0005                   | Contact form intake, write only                   |
| `submit_shipment_rating(text, int, text, text)` | 0007                   | One rating per delivered shipment                 |
| `shipment_rating_state(text)`                   | 0007                   | Whether the rating form should appear             |
| `service_performance()`                         | 0007                   | Aggregate counts and averages for the public site |
| `submit_recipient_email(text, text)`            | 0011                   | One recipient email address per shipment          |
| `submit_payment_notification(text)`             | 0012                   | One payment notification per shipment             |

Everything else is closed. Migration `0004_harden_function_exposure.sql` exists
because revoking from `anon` alone did not actually close anything: Postgres
grants `EXECUTE` on every new function to the `PUBLIC` pseudo-role, and PostgREST
publishes anything in the `public` schema at `/rest/v1/rpc/<name>`. 0004 revokes
from `PUBLIC` explicitly and re-grants only where needed. If you add a function
to the `public` schema, you must revoke it from `PUBLIC` in the same migration or
you have published it.

`is_active_admin()`, `current_admin_role()` and `can_write_shipments()` keep
`EXECUTE` for `authenticated`, because RLS policy expressions are evaluated with
the privileges of the querying role and every admin policy calls them. They stay
`SECURITY DEFINER` on purpose: that is what lets the policy on `admin_users`
avoid recursing into itself. Calling one reveals only the caller's own role.

`submit_shipment_rating()` enforces its own rules rather than trusting the
caller: the shipment must exist, must not be archived, must be `delivered`, and
must not already have a rating. `shipment_ratings` carries a unique constraint on
`shipment_id` underneath that.

`submit_recipient_email()` does the same for the address a recipient supplies:
the shipment must exist, must not be archived, must carry
`payment_status = 'awaiting_recipient_email'`, and must not already have
answered. That last pair of conditions is what stops the function being a way to
write an arbitrary address onto any shipment whose number someone holds, and
what makes a repeated submission a no-op rather than a second database write and
a second timeline event. It selects the row `for update`, so two submissions
racing each other resolve to one write and one `already_submitted`.

Its verdicts are deliberately coarse where being precise would leak: `not_found`
and `not_requested` are worded identically to the visitor, because telling
someone which of the two applies would confirm whether a given shipment is
waiting on a payment.

`submit_payment_notification()` is shaped the same way, one step later in the
flow. It moves a shipment from `email_received` to `reviewing_payment`, stamps
`payment_confirmation_at`, records the method, and files a public
`Payment Notification Submitted` event. It does **not** mark a shipment paid:
the notification is the recipient's claim that they sent payment, which a person
on the finance team verifies by hand. Its preconditions — the shipment exists,
is not archived, has already had an email received, and has not already been
reported — are enforced in the function, it selects the row `for update` so a
double click resolves to one event, and a repeat is a no-op that returns
`already_submitted`. Its `not_found` and `not_ready` verdicts are worded
identically for the same reason the email function's are.



---

## Verifying it

```bash
psql "$SUPABASE_DB_URL" -f supabase/tests/rls_verification.sql
```

The suite impersonates the `anon` and `authenticated` PostgREST roles, walks
every policy boundary — anonymous, signed-in non-staff, deactivated operator,
viewer, operator — asserts that `track_shipment()` hides phone numbers, internal
notes and internal-only events, asserts that an archived shipment becomes
untrackable, checks that RLS is enabled on every table in `public`, prints a
pass/fail table with totals, and rolls back its own fixtures. It runs inside one
transaction ending in `rollback`, so it is safe against a live project.

It has not been updated since migration 0005 and currently fails to run. Two
things are stale: the fixture tracking ID `STTEST000001` predates the
country-suffix format that migration 0006 added as a check constraint, so the
fixture insert violates `shipments_tracking_id_format` and aborts the
transaction; and the check named `track_shipment hides full recipient name`
asserts the opposite of the decision recorded above. Fix both before trusting a
green run. See the launch checklist.

---

## Known limitations

**Rate limiting is per instance and in memory.** `src/lib/rate-limit.ts` holds a
fixed-window counter in a `Map` in one server process. Public tracking is
30 lookups a minute, the contact form 5 an hour, ratings 10 an hour, recipient
email submissions 10 an hour, and sign-in
8 attempts in ten minutes. Behind multiple instances, or on a serverless platform
that spawns isolates, each instance keeps its own count and the effective limit
multiplies by the instance count. It stops casual scraping and form spam from one
address; it is not a distributed limiter. Moving the counters to a shared store
(Upstash, Redis, or a Postgres table) is the next step. The database-side
throttles in `submit_support_request()` are unaffected by this, because they
count rows.

**The tracking number is the only credential.** There is no recipient login and
no second factor on the tracking page. See the recipient address section above.

**No security response headers.** `next.config.ts` is empty. There is no
Content-Security-Policy, no `Strict-Transport-Security`, no `X-Frame-Options`
and no `Referrer-Policy` beyond platform defaults. Vercel terminates TLS and
sets HSTS for its own domains, which covers part of this, but a CSP would need
writing from scratch.

**Session length is whatever Supabase Auth is configured with.** Nothing in this
codebase shortens the operator session or forces re-authentication for sensitive
actions.

**Audit coverage is writes to `shipments` and `shipment_events` only.** Sign-ins,
sign-outs, failed sign-in attempts, admin_users changes and reads of customer
data are not recorded in `audit_logs`. Supabase Auth keeps its own log of
authentication events; there is no unified trail.

**The audit trail records who and what, not before and after.** `audit_logs`
stores the actor, the action, the entity and small metadata — for a status change,
`from` and `to`. It does not store full row diffs, so it cannot answer "what did
this record look like last Tuesday".

**Deactivating an operator does not end their current session.** Setting
`is_active = false` causes the next `requireAdmin()` to fail and every RLS
predicate to return false, which is immediate at the data layer. The Supabase
session cookie itself remains valid until it expires. For a compromised account,
revoke the session in the Supabase dashboard as well.

**Supabase advisors.** The project was taken from nine advisor warnings to four.
The remaining four have been reviewed and accepted as intentional. The specific
list is not recorded in this repository — it lives in the Supabase dashboard
under Advisors — so re-read it there before launch rather than trusting this
paragraph. When reconciling, do not "fix" the `SECURITY DEFINER` functions listed
above: each is deliberate and each is documented in the migration that created
it.
