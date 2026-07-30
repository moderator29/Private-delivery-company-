# Deployment

How to get this into production, what breaks when you change configuration, and
how to recover the data. Written for whoever is on the hook at 2am, so the
recovery section is deliberately literal.

The application is a standard Next.js 15 App Router build with a Supabase
project behind it. There is no other infrastructure: no queue, no cache, no
object storage, no cron.

---

## Read this before you change an environment variable

**`NEXT_PUBLIC_*` variables are inlined into the compiled bundle at build time.
They are not read at runtime. Changing one in the hosting dashboard changes
nothing until you redeploy.**

This has already cost this project once. It is not a subtlety of Next.js you can
work around; it is how the compiler works. `next build` finds the literal text
`process.env.NEXT_PUBLIC_SUPABASE_URL` in the source and substitutes the value
present at build time. `src/lib/env.ts` has a comment explaining why those
references are written out in full rather than looked up dynamically —
`process.env[name]` would not be substituted and would be `undefined` in the
browser. `tests/e2e-server.mjs` builds the whole application from scratch for
the browser tests for exactly this reason: pointing the app at a mock Supabase
is a build-time decision.

So:

- Changed `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or
  `NEXT_PUBLIC_SITE_URL`? **Redeploy.** Not "restart", not "clear cache" —
  trigger a new build.
- Rotated the Supabase publishable key? Redeploy, or the site keeps presenting
  the old one until you do.
- Moved to a new Supabase project? Redeploy.
- Promoted a preview build to production expecting it to pick up production
  variables? It will not. A build carries the values it was built with. Rebuild
  against the production environment.

The one exception is `SUPABASE_SERVICE_ROLE_KEY`, which has no `NEXT_PUBLIC_`
prefix and is read at runtime by `scripts/create-admin.mjs`. The application
never reads it, so it should not be set in the hosting platform at all.

---

## The second trap: a broken configuration deploys green

`src/lib/env.ts` validates lazily, on first use, not at module import. That is
deliberate — `next build` imports every module to collect page data, so
validating at import time would turn a missing variable into a failed build on
the hosting platform rather than a clear error at runtime.

The consequence is that a deployment with no Supabase configuration at all
builds successfully, deploys successfully, renders every marketing page, and
then throws the first time somebody submits a tracking number. The build being
green tells you the code compiles. It tells you nothing about whether the
environment is configured.

The only check that proves configuration is correct is to load the deployed
site and submit a real tracking number. Do that on every deployment that
touched environment variables.

---

## Requirements

- Node 18.18, 19.8 or 20 and above. Development here runs on Node 22.
- A Supabase project with all nine migrations applied.
- Three environment variables, listed in `.env.example` and in the README.

```bash
npm ci
npm run verify        # format check, lint, typecheck, 133 unit tests
npm run build
npm start
```

`npm run build` needs no environment variables. `npm start` needs them to serve
anything that touches Supabase.

---

## Environment variables in production

| Variable                               | Where it is read                         | Redeploy on change              |
| -------------------------------------- | ---------------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Compiled into the bundle                 | Yes                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Compiled into the bundle                 | Yes                             |
| `NEXT_PUBLIC_SITE_URL`                 | Compiled into the bundle                 | Yes                             |
| `SUPABASE_SERVICE_ROLE_KEY`            | `scripts/create-admin.mjs` only, locally | Should not be set in production |

`NEXT_PUBLIC_SITE_URL` must carry no trailing slash. `src/lib/env.ts` strips
trailing slashes defensively, but it also defaults to `http://localhost:3000`
when the variable is absent, without failing — so an unset value silently
publishes a sitemap and canonical URLs pointing at localhost. Nothing will alert
you. Check `/sitemap.xml` and `/robots.txt` on the deployed origin after the
first production build.

The publishable key is safe in the browser. Every request it makes is still
subject to Row Level Security, and `anon` has no table grants at all — see
`docs/SECURITY.md`. The service role key is not safe anywhere near the browser
and must never be given a `NEXT_PUBLIC_` prefix.

`.env*` is gitignored (with `.env.example` explicitly re-included), so the real
values exist only in the hosting platform and in whatever your team uses to hold
secrets. If the platform account is lost, the Supabase URL and publishable key
are recoverable from the Supabase dashboard; nothing else is stored only in the
deployment.

---

## Deploying

The repository carries no platform configuration beyond `next.config.ts`, which
is empty, so any host that runs a Next.js 15 build works. On Vercel the
defaults are correct: build command `next build`, no output directory override.

Order for a first deploy:

1. Create the Supabase project and apply the migrations (`supabase db push`, or
   each file in `supabase/migrations/` in numbered order through the SQL editor).
2. Run `supabase/tests/rls_verification.sql` and read the results.
3. Create the first operator account — `npm run admin:create` locally, or
   `supabase/bootstrap_admin.sql` in the SQL editor.
4. Set the three `NEXT_PUBLIC_*` variables in the hosting platform.
5. Deploy.
6. Add the production origin to Supabase Auth redirect URLs.
7. Load the site, run a tracking lookup, submit the contact form, sign in to
   `/admin`.

Steps 1 to 3 are database work and are independent of the deployment. Steps 4
and 5 are ordered: variables first, then build.

---

## What a Supabase outage does

The auth middleware runs on `/admin/:path*` only and wraps every Supabase call.
If auth is slow, unreachable or misconfigured, it degrades to "nobody is signed
in" and redirects to the login page rather than throwing — an uncaught throw in
middleware becomes `MIDDLEWARE_INVOCATION_FAILED`, which is a 500 on the whole
route.

The practical effect: during a Supabase outage the marketing pages render
normally, tracking lookups return the generic error state, the contact form
reports a failure the visitor can act on, and `/admin` bounces to a login page
that explains itself. Nothing 500s and the public site stays up.

This is the behaviour that commit "stop the auth middleware from taking down the
public site" exists to preserve. If you widen the middleware matcher beyond
`/admin`, you put a network call to a third-party service in the path of every
page on the site and you give up that property. Do not widen it without
understanding that trade.

---

## Scaling notes

The rate limiter in `src/lib/rate-limit.ts` keeps its counters in the memory of a
single process. On a serverless platform, or behind more than one instance, each
one keeps its own counters and the effective limits multiply by the instance
count. The limits are 30 tracking lookups a minute, 5 contact submissions an
hour, 10 ratings an hour and 8 sign-in attempts in ten minutes — per instance.

The database-side throttles inside `submit_support_request()` are not affected,
because they count rows rather than requests: five an hour per hashed address
and sixty a minute globally, regardless of how many instances are running.

If you move to a shared counter store, that is the piece to replace, and
`docs/SECURITY.md` lists it as the known limitation it is.

---

## Backups

There are two things to back up and they are not backed up the same way.

**The database is the only thing that cannot be rebuilt from this repository.**
Shipments, events, audit logs, support requests and ratings exist nowhere else.
Supabase takes automated backups on paid plans; Point-in-Time Recovery is a
separate setting and is what turns "we lost up to a day" into "we lost up to a
couple of minutes". Check which one this project actually has, in the Supabase
dashboard under Database, and enable PITR before launch. The retention window is
also a setting; know what yours is rather than assuming.

**Everything else lives in git.** The schema is `supabase/migrations/`, the first
live shipment record is `supabase/seed/first_shipment.sql`, and the operator
bootstrap is `supabase/bootstrap_admin.sql`. A complete rebuild from an empty
Supabase project is: apply the migrations in order, run the bootstrap, run the
seed. That is the reason the seed file is committed at all — it is real
operational data kept so the record can be recreated exactly, and re-running it
deletes and recreates that one shipment rather than duplicating it.

What is in neither place: the environment variable values, and the auth users
themselves. Auth users live in Supabase's `auth` schema and come back with a
database restore; they are not in git and cannot be recreated from it beyond
re-running the bootstrap for a fresh account.

Take a manual backup before applying a migration to production. Migrations here
are forward-only — there are no down migrations — so the recovery path for a bad
migration is a restore, not a reversal.

---

## Recovery

**A bad deploy, database untouched.** Roll back to the previous deployment in the
hosting platform. This is instant and safe because the build is stateless.
Remember that rolling back the application does not roll back the database: if
the bad deploy also applied a migration, you have two problems and the migration
is the one that matters.

**A bad migration.** There is no down migration. Restore the database from a
backup or a PITR timestamp from immediately before it was applied, then fix the
migration and reapply. Take the site down first if the migration left the schema
in a state the running application cannot read — a partial schema serving live
traffic writes more bad data every minute.

**A destructive `update` or `delete` by an operator.** Check `audit_logs` first:
it records the actor, the action, the entity and the tracking ID for every write
to `shipments` and `shipment_events`, so you can establish what happened and
when before you touch anything. Then restore to a PITR timestamp just before it.
Note that `audit_logs` stores the action, not a full before-and-after row, so it
tells you what to restore and not what the value used to be.

Shipments are archived rather than deleted, which means the most common
"accidental deletion" is not a deletion at all: an archived shipment vanishes
from public tracking while its row and history remain. Clearing `archived_at`
restores it. There is no delete policy on `shipments` for any role, so a genuine
hard delete cannot have come from the application.

**A leaked publishable key.** Rotate it in Supabase, update the environment
variable, and redeploy. It grants nothing beyond what `anon` can already do —
which is five functions and no tables — so this is housekeeping, not an
incident.

**A leaked service role key.** This is an incident. Rotate it in Supabase
immediately. It bypasses Row Level Security entirely. Then work out how it
escaped, given the application never uses it: the realistic paths are a
committed `.env.local`, a CI log, or someone having set it in the hosting
platform where it did not belong.

**A compromised operator account.** Set `is_active = false` on the `admin_users`
row. That takes effect at the next request, because every RLS predicate and
`requireAdmin()` both re-check it. The Supabase session cookie stays technically
valid until it expires, so also revoke the user's sessions in the Supabase
dashboard, then reset the password. Read `audit_logs` for what the account did
while it was compromised.

**Total loss of the Supabase project.** Create a new project, apply
`supabase/migrations/` in order, restore the data from the most recent backup,
run `supabase/bootstrap_admin.sql` to recreate operator access, set the new
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
**redeploy** — those are `NEXT_PUBLIC_` variables and the old ones are compiled
into the current bundle.

---

## Verifying a deployment

```bash
npm run verify        # format, lint, types, 133 unit tests
npm run test:e2e      # 57 Playwright tests against a real production build
```

The browser suite starts a mock Supabase, builds the application against it,
serves it with `next start` and drives Chromium. It takes a few minutes because
the build is real. `E2E_SKIP_BUILD=1` reuses an existing build when iterating
locally; do not use it in CI, since the build is part of what is being tested.

In a container with a preinstalled browser, point Playwright at it:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e
```

Unset, Playwright uses its own managed download, so the configuration works
unchanged on a normal machine.

Neither suite touches the production Supabase project — the unit tests are pure
and the browser tests build against a local mock — so both are safe to run
against a release candidate at any time.

After deploying, the checks that are worth doing by hand are the ones the test
suites structurally cannot do: load the production origin, submit a real tracking
number, submit the contact form, and sign in to `/admin`. Those four confirm the
built bundle carries the right Supabase URL and key, which is the failure mode
this document opens with.
