# Environments, deployment and rollback

Mongmo runs in three environments. Each has its own app on the phone and
its own Supabase project, so testing never touches real customers' data.

| | Development | Staging | Production |
|---|---|---|---|
| Who uses it | You, on your machine | Testers, before a release | Customers |
| App name and id | Mongmo (Dev), `….dev` | Mongmo (Staging), `….staging` | Mongmo |
| Supabase | Local (`supabase start`) or a dev project | Its own project | Its own project |
| EAS build profile | `development` | `staging` | `production` |
| EAS environment (variables) | `development` | `preview` | `production` |
| Crash reporting | Off | After the person says yes (if a DSN is set) | After the person says yes |
| Logs printed | Everything | Warnings and errors | Warnings and errors |

`EXPO_PUBLIC_APP_ENV` picks the environment. `eas.json` sets it for each
build profile, and `app.config.ts` uses it to choose the app's name and id.
Because each environment is a separate app, all three can be installed
side by side.

## What each environment needs

Set these on expo.dev (Project → Environment variables) for the matching
EAS environment, or locally with
`eas env:set --name … --value … --environment preview`.

| Variable | Visibility | Notes |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Plain text | That environment's project URL, `https://…supabase.co`. Staging and production refuse plain http. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Plain text | The **anon / publishable** key only. The app refuses to start with the service_role key. |
| `EXPO_PUBLIC_SENTRY_DSN` | Plain text | Sentry project → Client Keys. Leave unset to keep crash reporting off. |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Secret | Optional. With them, builds upload source maps so crash reports show the real code. |

Never put the Supabase service_role key, a database password or any other
secret in an `EXPO_PUBLIC_*` variable. Everything in those is readable by
anyone who has the app.

For GitHub Actions deploys, create two GitHub environments (repository
Settings → Environments), `staging` and `production`, each with:

- `SUPABASE_DB_URL`: secret. The database connection string from Supabase
  (Connect → Session pooler), with the password in it.
- `EXPO_TOKEN`: secret. An Expo access token (expo.dev → Account settings →
  Access tokens).

Give `production` **required reviewers**, so a deploy waits for an approval.

The nightly retention job has its own environment, `retention`
([`privacy/retention.md`](privacy/retention.md)). Repository variables
switch the automations on once their environments are ready:
`STAGING_AUTO_DEPLOY`, `STORE_SUBMIT`, `RETENTION_ENABLED`
([`github-setup.md`](github-setup.md)).

### One-time setup

1. Create two Supabase projects, `mongmo-staging` and `mongmo-production`.
   Turn on backups (point-in-time recovery if your plan has it) for
   production.
2. Link the app to EAS once: `npx eas-cli init` (adds the project id to the
   app config). Commit that change.
3. Fill in the variables and GitHub environments above.
4. In Sentry, create one project, and set its environments filter to
   `staging` and `production`. Under Settings → Security & Privacy, turn on
   **Data Scrubber** and **Prevent Storing of IP Addresses**, and leave
   Session Replay off.

## Deploying

Every push already runs CI (lint, type check, unit tests, dependency
audit, web build, and the integration tests against a fresh database). Only
deploy a commit whose CI is green.

1. **Merge to `main`** with CI green.
2. **Staging deploys itself** (with `STAGING_AUTO_DEPLOY` on; otherwise
   Actions → Deploy → Run workflow → target `staging`). It runs every CI
   check again, applies new migrations to the staging database (it shows
   them first, and never runs the seed), then starts the iOS and Android
   builds on EAS. EAS runs the unit tests once more before building, and
   fails the build if any fail.
3. **Test staging on a phone.** Install the staging build from the EAS
   link. Then check: sign up, order at the café, mark it collected from the
   owner screens, see the points and level, redeem a reward, Your data →
   download, delete the account. Check Sentry for new staging errors.
4. **Release to production** by tagging a version: the full steps, store
   submission, phased release and staged rollout are in
   [`release-process.md`](release-process.md). The tag is also what you
   roll back to.
5. **Watch for 48 hours**: Sentry's crash-free sessions, and new issues in
   `production` ([`monitoring.md`](monitoring.md)).

**Database changes must work with the app already on phones.** People update
slowly, so for a while old and new app versions run against the same
database. Add before you remove: add new columns or functions in one
release, and remove old ones only in a later release, once the old app is
gone.

Without GitHub Actions, the same steps by hand:

```bash
supabase db push --db-url "$SUPABASE_DB_URL" --dry-run   # what will run
supabase db push --db-url "$SUPABASE_DB_URL"
eas build --profile staging --platform all                # or production
```

## Rolling back

First decide what broke: the app, the database, or both. Then stop the
damage, then fix forward.

### The app

An installed app can't be taken back from people's phones, so:

1. **Stop the rollout.** App Store Connect → the version → Phased Release →
   **Pause**. Google Play Console → the release → **Halt rollout**. People
   who don't have it yet won't get it.
2. **Ship the last good version again**, as a new build:
   ```bash
   git checkout v1.1.0                                     # the last good tag
   eas build --profile production --platform all          # gets a higher build number
   eas submit --profile production --platform all
   ```
   Ask Apple for an expedited review if customers are affected. Or, if the
   fix is small, fix it on `main` and release that instead.
3. **Check** Sentry's crash-free rate recovering on the new version.

(Instant over-the-air rollbacks of JavaScript-only changes need EAS Update,
which the app doesn't use yet: add `expo-updates` if you want that.)

### The database

Migrations only go forward, so:

1. **Before every production deploy**, check the latest backup exists:
   Supabase → Database → Backups.
2. **To undo a migration**, write a new migration that reverses it, for
   example `0023_revert_levels_bonus.sql`. Test it locally (`supabase db
   reset`, then `npm run test:integration`), then deploy it like any other
   change. Never edit or delete a migration that has already run in
   production.
3. **If data was lost or corrupted**, restore from a backup or a point in
   time: Supabase → Database → Backups. It returns the **whole** database to
   that moment, so everything written after it (orders, points, sign-ups)
   is lost. Use it only when that is the smaller harm, and note the time
   window to tell affected customers.

### Both

Roll back the app first (stop the rollout), then the database. A reverting
migration must still work with the app versions people have installed.

## Logs and crash reports

The app logs through `src/lib/log.ts`, never `console` directly (lint
fails on `console` in `src/`). Every message and value is scrubbed first,
by `src/lib/privacy.ts`:

- emails, phone numbers, user and order ids, tokens and keys, and exact
  coordinates in text are replaced, for example `[email]` and `[id]`;
- fields named like personal data or secrets (`email`, `name`, `phone`,
  `address`, `password`, `token`, `location`, `input`, `value` …) become
  `[redacted]`;
- errors keep only their type and a scrubbed message.

Development prints everything. Staging and production print warnings and
errors only. Warnings become breadcrumbs on the next crash report, and
errors are reported.

Crash reporting (`src/lib/crashReporting.ts`) is Sentry. It needs
`EXPO_PUBLIC_SENTRY_DSN` in the build **and** the person's yes: the app
asks once ("Help us fix crashes?", with Don't send and Send reports as
equal buttons), nothing is sent before the answer, and Settings → Crash
reports turns it off again (Sentry is closed at once). Its configuration:

```ts
Sentry.init({
  dsn: env.sentryDsn,
  environment: env.appEnv,          // development | staging | production
  sendDefaultPii: false,            // no IP address, no user
  attachScreenshot: false,          // a screenshot would show typed text
  attachViewHierarchy: false,       // so would the view tree
  enableCaptureFailedRequests: false,
  enableUserInteractionTracing: false,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,      // no session replay
  replaysOnErrorSampleRate: 0,
  maxBreadcrumbs: 50,
  beforeBreadcrumb: scrubBreadcrumb, // drops typing and console breadcrumbs
  beforeSend: scrubEvent,           // drops user, request details, device name; scrubs text
});
// Touch breadcrumbs: the component's name only, never its text.
Sentry.wrap(RootLayout, { touchEventBoundaryProps: { extractTextFromChildren: false } });
```

If session replay is ever turned on, it must mask everything:
`mobileReplayIntegration({ maskAllText: true, maskAllImages: true, maskAllVectors: true })`.
