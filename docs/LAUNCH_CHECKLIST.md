# Launch checklist

What has to be true before this accepts a real shipment for a real customer.
Items are grouped by the kind of failure they prevent. Each says why it matters,
because a checklist nobody understands gets ticked without being done.

Nothing here is optional in the sense of "nice to have". Items marked
**blocking** will cause visible harm if skipped.

---

## Data and schema

- [ ] **Apply every migration in `supabase/migrations/` in order, to the
      production project.** They are numbered in apply order and several are
      corrective — 0004 closes functions that 0002 only appeared to close, 0009
      fixes a rollup that produced wrong `shipped_at` values on multi-row event
      inserts. A project running only 0001 through 0003 is not the system this
      documentation describes. Blocking.

- [ ] **Run `psql "$SUPABASE_DB_URL" -f supabase/tests/rls_verification.sql`
      against production and read every row.** This is the only automated proof
      that anonymous visitors cannot read a table. It rolls itself back, so it is
      safe to run against a live project. Blocking.

- [x] **Repair the stale checks in that suite.** Done. The suite had not run
      since migration 0006: its fixture tracking ID predated the country suffix
      that 0006 made a check constraint, so the fixture insert aborted the whole
      transaction before a single check executed, and the check named
      `track_shipment hides full recipient name` asserted the opposite of the
      product decision 0006 recorded. The fixture now uses `STTEST000001AE`, that
      check asserts the name is returned deliberately, and two new checks cover
      email addresses and the sender's street address being withheld.

- [ ] **Re-read the Supabase advisors and reconcile them against the accepted
      set.** Nine warnings were reduced to four and the remaining four are
      intentional, but that list lives in the dashboard and not in this
      repository. Confirm the count is still four and that each one is a
      warning you recognise. Do not "fix" the `SECURITY DEFINER` functions —
      every one of them is deliberate and documented in the migration that
      created it.

- [ ] **Decide what happens to `supabase/seed/first_shipment.sql`.** It is real
      operational data for `STX984756532US`, kept so the record can be recreated
      if the project is rebuilt, and re-running it deletes and recreates that
      shipment. Confirm it belongs in the production database, and confirm the
      recipient consented to their name and street address being visible to
      anyone holding the number.

- [ ] **Enable Point-in-Time Recovery on the Supabase project.** Daily backups
      alone mean up to 24 hours of shipments lost to a bad `update`. See
      `docs/DEPLOYMENT.md`.

---

## Access control

- [ ] **Create the first operator account and verify it can sign in.** Use
      `npm run admin:create -- --email you@example.com --password '…' --role owner`,
      or `supabase/bootstrap_admin.sql` from the SQL editor if you would rather
      not have a service role key on disk. Access needs both an auth user and an
      active `admin_users` row; creating one without the other produces an
      account that authenticates and then sees nothing. Blocking.

- [ ] **Remove `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` once the bootstrap
      is done.** The application never needs it. Every hour it stays on disk is
      an hour a key that bypasses all Row Level Security is sitting in a file.

- [ ] **Confirm no service role key exists in any Vercel environment, and that
      nothing named `NEXT_PUBLIC_SERVICE_ROLE` or similar exists anywhere.** A
      `NEXT_PUBLIC_` prefix compiles the value into the browser bundle, where it
      would hand every visitor unrestricted database access. Blocking.

- [ ] **Sign in as a `viewer` and confirm writes are refused.** The role split is
      enforced in three places — `canWrite()` in the UI, `requireWriteAccess()`
      in the server actions, and `can_write_shipments()` in every write policy.
      Verify the last one is really on by attempting an edit.

- [ ] **Confirm every staff member has their own account.** `audit_logs` records
      `actor_id` and `actor_email`. A shared login makes the audit trail useless
      the first time you need it.

- [ ] **Visit `/admin` signed out and confirm the redirect to `/admin/login`.**
      Then confirm that the pages themselves refuse to render data even if the
      redirect is bypassed — the middleware is a convenience, `requireAdmin()` is
      the boundary.

---

## Content and identity

- [ ] **Replace the placeholder contact details in `src/lib/brand.ts` and set
      `BRAND_CONTACT_IS_PLACEHOLDER = false`.** `supportEmail`, `privacyEmail`
      and `businessEmail` all point at the reserved `swifttrack.example` domain,
      and `supportPhone` is `+971 4 555 0142`. Every customer-facing occurrence
      of the company name, address and support contact reads from this file, so
      launching without changing it publishes a support address that goes
      nowhere. Blocking.

- [ ] **Confirm the head office address and support hours are correct.**
      `mailingAddress` and `supportHours` in the same file appear on the legal
      pages and in the footer.

- [ ] **Have a lawyer review `/legal/privacy` and `/legal/terms`.** The README
      says it and it is worth repeating: these are launch-ready drafts, not legal
      advice. The privacy policy in particular has to describe the recipient
      address exposure documented in `docs/SECURITY.md` accurately, because that
      is the disclosure that makes the product decision defensible. Blocking.

- [ ] **Decide whether the recipient name and street address stay on the public
      tracking page.** This is the single largest privacy decision in the
      product. It is currently yes, by design. `docs/SECURITY.md` carries the
      exact SQL to narrow it if the answer changes. Blocking, in the sense that
      it must be a decision and not an accident.

- [ ] **Check the public performance figures on the marketing pages against
      reality.** `service_performance()` computes every number from real rows and
      returns nulls when there is no sample, so before any deliveries exist the
      site says so rather than showing a flattering placeholder. Confirm the copy
      around those numbers reads correctly in the empty state.

---

## Configuration and deployment

- [ ] **Set `NEXT_PUBLIC_SITE_URL` to the real production origin, with no
      trailing slash, and redeploy after setting it.** It feeds canonical URLs,
      the sitemap and the copy-tracking-link action. It is a `NEXT_PUBLIC_`
      variable, so it is baked in at build time — changing it in the dashboard
      without a redeploy changes nothing. Blocking.

- [ ] **Set `NEXT_PUBLIC_SUPABASE_URL` and
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for every environment that serves
      traffic, including preview if previews are shared.** Missing values do not
      fail the build — `src/lib/env.ts` validates lazily on first use — so a
      deployment can go green and then throw on the first tracking lookup.
      Blocking.

- [ ] **Load the production URL, submit a tracking number, and submit the contact
      form.** This is the only check that proves the built bundle carries the
      right Supabase URL. A wrong value shows up here and nowhere earlier.

- [ ] **Confirm the deployed site works while signed out on every public page.**
      The middleware runs on `/admin/:path*` only, precisely so nothing about
      auth can affect whether a public page renders. Verify that is still true
      after any middleware change.

- [ ] **Add the production domain to Supabase Auth redirect URLs.** Sign-in
      redirects fail silently against an unconfigured origin.

- [ ] **Decide whether to add security response headers.** `next.config.ts` is
      currently empty: no CSP, no `X-Frame-Options`, no `Referrer-Policy`. Not
      blocking, but it is the largest remaining gap in the deployment hardening.

---

## Tests and verification

- [ ] **`npm run verify` passes.** Format check, lint, typecheck and the 133
      Vitest unit tests in one pass. Blocking.

- [ ] **`npm run test:e2e` passes.** 57 Playwright tests across six files,
      running against a real production build served by `next start` with a mock
      Supabase in place of the real project. In a container, set
      `PLAYWRIGHT_CHROMIUM_PATH` to the preinstalled browser first; without it
      Playwright reaches for its own managed download. Blocking.

- [x] **Remove the broken `db:seed` script.** Done. It pointed at
      `scripts/seed-local.mjs`, which does not exist, and nothing referenced it.
      Seeding is `supabase/seed/first_shipment.sql`, run from the SQL editor.

- [ ] **Walk the tracking page on a phone.** `tests/e2e/responsive.spec.ts` and
      `tests/e2e/accessibility.spec.ts` cover a lot of this, but the map, the
      timeline and the rating form are the parts customers actually use and they
      are worth seeing on real hardware.

---

## Operational readiness

- [ ] **Know who watches `support_requests`.** The contact form writes rows into
      a table; nothing emails anyone. Unless somebody opens the admin area,
      customer messages accumulate unread. Blocking, in the sense that a support
      channel nobody reads is worse than no support channel.

- [ ] **Agree how a shipment is corrected and how one is removed.** Shipments are
      archived, never hard deleted — an archived shipment disappears from public
      tracking immediately while its history and audit trail survive. Only an
      owner can delete an individual event. Make sure operations knows this
      before they need it.

- [ ] **Write down the recovery procedure and confirm somebody other than the
      author can follow it.** `docs/DEPLOYMENT.md` covers rollback and restore.
      An untested restore is a hope, not a backup.

- [ ] **Decide what happens when Supabase is unavailable.** Public pages render
      without it, tracking lookups return the generic error outcome, and the
      admin area bounces to the login page. That is graceful, but nobody is
      alerted. Point the platform's monitoring at the production origin at
      minimum.
