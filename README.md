# SwiftTrack Private Delivery Company

A production-minded MVP for a Dubai based private delivery company: a public
marketing site, a shipment tracking experience, and a protected internal
operations dashboard, backed by Supabase.

- **Framework:** Next.js 15 (App Router) with React 19 and TypeScript in strict mode
- **Styling:** Tailwind CSS v4 with a small design token layer
- **Backend:** Supabase (Postgres, Auth, Row Level Security)
- **Tests:** Vitest for units, Playwright for browser flows

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values, see below
npm run dev                    # http://localhost:3000
```

## Environment variables

Copy `.env.example` to `.env.local`. Nothing secret belongs in this repository.

| Variable                               | Required | Purpose                                                                                             |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | yes      | Supabase project API URL                                                                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes      | Publishable key. Safe in the browser: every request it makes is still subject to Row Level Security |
| `NEXT_PUBLIC_SITE_URL`                 | yes      | Public origin, used for canonical URLs, the sitemap and copy-link actions. No trailing slash        |
| `SUPABASE_SERVICE_ROLE_KEY`            | no       | Only used by the optional admin bootstrap script. The application never needs it                    |

`src/lib/env.ts` validates these on first use rather than at import, and caches
the result. A missing value fails with a message naming the variable instead of
an obscure runtime error. Validating at import would run during `next build`,
where these are not necessarily set, and fail the build — so a misconfigured
deployment builds green and surfaces the problem on the first request that needs
Supabase. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

`NEXT_PUBLIC_*` values are inlined into the bundle at build time. Changing one
on the hosting platform has no effect until you redeploy.

> The application deliberately does **not** require a service role key. The
> contact form writes through a constrained `SECURITY DEFINER` database function
> rather than bypassing Row Level Security.

## Supabase setup

Migrations live in `supabase/migrations/` and are numbered in apply order.

```bash
# With the Supabase CLI linked to your project
supabase db push

# Or apply each file in order through the SQL editor
```

| Migration                                | What it does                                                       |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `0001_core_schema.sql`                   | Enums, tables, indexes, triggers, tracking ID generation           |
| `0002_row_level_security.sql`            | RLS on every table, admin policies, grant revocations              |
| `0003_public_tracking.sql`               | `track_shipment()`, the only public read path                      |
| `0004_harden_function_exposure.sql`      | Revokes the default `PUBLIC` execute grant from internal functions |
| `0005_support_request_intake.sql`        | `submit_support_request()` for the contact form                    |
| `0006_international_shipping.sql`        | International tracking IDs, metric units, full public payload      |
| `0007_delivery_ratings.sql`              | Customer ratings and computed service performance                  |
| `0008_optional_region.sql`               | Makes the state/region field nullable for non-US addresses         |
| `0009_deterministic_shipment_rollup.sql` | Recomputes shipment state from all events, order independent       |

### Creating the first operator account

Access to `/admin` requires **both** a Supabase auth user and an active row in
`admin_users`. Authenticating alone grants nothing.

```bash
# Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
npm run admin:create -- --email you@example.com --password 'a-strong-password' --role owner
```

If you would rather not use a service role key, `supabase/bootstrap_admin.sql`
does the same thing from the Supabase SQL editor.

### Verifying Row Level Security

```bash
psql "$SUPABASE_DB_URL" -f supabase/tests/rls_verification.sql
```

The suite impersonates the `anon` and `authenticated` roles, exercises every
policy boundary, prints a pass/fail table and rolls back its own fixtures. It is
safe to run against a live project.

## Scripts

| Command                           | Purpose                                                  |
| --------------------------------- | -------------------------------------------------------- |
| `npm run dev`                     | Development server                                       |
| `npm run build`                   | Production build                                         |
| `npm start`                       | Serve the production build                               |
| `npm run typecheck`               | TypeScript, no emit                                      |
| `npm run lint`                    | ESLint                                                   |
| `npm run format` / `format:check` | Prettier                                                 |
| `npm test`                        | Vitest unit tests                                        |
| `npm run test:e2e`                | Playwright browser tests                                 |
| `npm run verify`                  | Format check, lint, typecheck and unit tests in one pass |

## Project layout

```
src/
  app/
    (site)/            public marketing, tracking and legal pages
    admin/             protected operations dashboard
  components/
    brand/             logo and mark
    tracking/          tracking page building blocks
    ui/                design system primitives
    layout/            header, footer, page shells
  lib/
    data/              server-only data access
    tracking/          tracking domain logic (IDs, statuses, geometry)
    supabase/          typed clients
supabase/
  migrations/          numbered SQL migrations
  seed/                real shipment records
  tests/               RLS verification suite
docs/                  security model, deployment, launch checklist
tests/                 unit and end-to-end tests
```

## Documentation

- [`docs/SECURITY.md`](docs/SECURITY.md) — the security model, what public tracking exposes and why, and known limitations
- [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) — what must be done before this goes live
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deploying, backups and recovery

## Legal notice

The Privacy Policy and Terms of Service in this repository are **launch-ready
drafts, not legal advice**. They have not been reviewed by qualified counsel.
Have a lawyer review them, along with your business structure, insurance and any
route specific carriage regulation, before accepting commercial shipments.
