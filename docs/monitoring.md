# Monitoring

What to watch, where, and when to act.

## Crashes and errors: Sentry

Only from people who said yes to crash reports, so counts are a sample.

Set up once (Sentry → the project):

- **Alerts → Create alert:**
  - *New issue* in `production` → email (or Slack) at once.
  - *Crash-free session rate* below 99.5% over 1 hour → email.
  - *Issue frequency*: more than 20 events in 10 minutes → email.
- **Releases**: builds report their version, so each issue shows the
  version it started in. Upload source maps by giving EAS the
  `SENTRY_AUTH_TOKEN` secret ([`DEPLOYMENT.md`](DEPLOYMENT.md)).
- Privacy settings: [`security.md`](security.md) → Sentry.

After a release, watch 48 hours: new issues, and crash-free sessions per
version. Pause the rollout if it drops ([`DEPLOYMENT.md`](DEPLOYMENT.md) →
Rolling back).

## Backend: Supabase

- **Reports** (API, Auth, Database): request errors, slow queries, sign-in
  failures.
- **Advisors → Security and Performance**: after every migration.
- **Logs → Auth**: bursts of failed sign-ins or reset codes from one
  address (see [`incident-response.md`](incident-response.md)).
- **Usage**: database size, storage, bandwidth against the plan's limits;
  turn on spend alerts in Organization → Billing.
- **Backups**: Database → Backups, before every production deploy.

## Payments: Stripe

- **Developers → Webhooks → the endpoint**: failed deliveries. Stripe tries
  again for three days; a run of failures means the function or its secrets
  are broken.
- **Supabase → Edge Functions → `stripe-webhook` → Logs**, filtered on
  `"level":"error"`: a dispute opened, a refund that failed, an event that
  couldn't be handled. Each line has Stripe's event id to look it up by;
  no line has personal data.
- **Disputes** are answered in the Stripe Dashboard before the deadline in
  Stripe's email. The app only logs that one opened.
- **Refunds to check** on the owner's orders board: a cancelled order whose
  refund hasn't gone through; "Send refund again" retries it.

## Automated jobs: GitHub Actions

- A failed run emails its author. Watch for: **Data retention** (nightly),
  **Release**, **Preview**.
- **Security** tab: Dependabot, secret scanning and CodeQL alerts.

## The stores

- App Store Connect → **Analytics** and **TestFlight** crash feedback;
  **Ratings and Reviews**.
- Play Console → **Android vitals** (crash rate and ANR rate must stay
  under Google's bad-behaviour thresholds: 1.09% and 0.47%), **Ratings and
  reviews**, **Pre-launch report** for each build.

## Uptime

The app depends on Supabase: subscribe to status.supabase.com (and
status.sentry.io, status.expo.dev) for incidents.

## Weekly, five minutes

- [ ] Sentry: anything new or growing?
- [ ] Supabase Advisors and usage
- [ ] Dependabot pull requests merged or closed
- [ ] Store reviews answered
