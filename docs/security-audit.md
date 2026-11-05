# Security audit

5 November 2026. What was checked, what was found, what changed. Re-run
the checks marked ↻ before each release.

## Secrets and keys

- ↻ No secrets in the code or its history: searched all tracked files and
  the full Git history for JWTs, Supabase secret keys, Stripe and AWS keys
  and private keys. Only fake keys in tests turned up.
- Every setting is an environment variable (`.env.example`,
  `docs/DEPLOYMENT.md`). The app holds only public values: the Supabase URL,
  the anon key, the Sentry DSN. `src/lib/env.ts` refuses to start with the
  service_role key, and outside development with plain http.
- The service_role key is used only server-side: the integration tests (a
  throwaway local database) and the nightly retention job (a GitHub
  environment secret).

## Database rules (Supabase)

- Row-level security is on for every table (checked against the catalog).
- **Found:** a visitor holding only the public anon key could call database
  functions, including the leaderboard (members' names). **Fixed** in
  `0023_security_hardening.sql`: functions run for signed-in users only;
  trigger functions can't be called; new functions default to no access.
- **Found:** the challenge photo bucket was public. **Fixed:** private;
  the app uses one-hour signed links.
- **Found:** a photo record held a link the app itself wrote (it could
  point anywhere). **Fixed:** removed; the storage path is the only
  reference.
- **Found:** four helper functions didn't pin their search path. **Fixed.**
- **Found:** no length or format limits on profile links and staff-entered
  texts. **Fixed** with database checks.
- ↻ `tests/integration/accessControl.test.ts` proves, against a real
  database on every push: one customer can't read or change another's
  orders, profile, points, check-ins, rewards or photos; nobody can give
  themselves points, badges, rewards or a check-in, or set a price; only
  staff change the menu, café and rewards; a signed-out visitor can call
  nothing.

## Transport and the web

- Supabase is reached over https only outside development (enforced).
- `public/_headers`: HSTS, nosniff, no framing, referrer and permissions
  policies, and a Content-Security-Policy. The accessibility walk-through
  runs every screen under it and fails if anything is blocked.

## Authentication

- Passwords: hashed by Supabase Auth (bcrypt). New ones need 8 characters.
- Sessions: 1-hour tokens with rotating refresh tokens; signing out revokes
  them on the server. On a phone the session is in the Keychain or Keystore.
- Password reset by emailed code; the same answer whether or not an account
  exists. Rate limits and the settings to apply: `docs/security.md`.
- Two-step sign-in prepared (`src/services/mfa.ts`), not switched on.

## Input

- Every database call goes through the query builder or a function with
  parameters; no query is built from strings.
- Prices, totals, points and rewards are decided by the database; the app
  only sends ids and quantities.
- No HTML is rendered from data, so there's nothing to inject. CSRF doesn't
  apply: requests carry a bearer token, not cookies.

## Errors and logs

- **Found:** some screens showed the server's raw error text. **Fixed:**
  only messages written for people are shown; the rest becomes "Something
  went wrong" and goes to the log.
- Logs and crash reports are scrubbed of personal data (`src/lib/privacy.ts`).
  Lint fails on `console` in the app.

## Dependencies

- ↻ `npm audit`: 9 low warnings, one advisory in `deepmerge`, used only by
  the test runner, with no fixed version yet. CI fails on moderate or worse.
- ↻ `node scripts/audit-deps.mjs`: every dependency exists on npm under its
  exact name, with real downloads and maintainers (`docs/dependency-audit.md`).
- Dependabot opens update pull requests weekly (`.github/dependabot.yml`).

## Not done here (needs access to the hosted project or GitHub settings)

See `docs/security.md` and `docs/github-setup.md`: rate limits, leaked
password protection, the reset email template, secret scanning and push
protection, and branch protection.
