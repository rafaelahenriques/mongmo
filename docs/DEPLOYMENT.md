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
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Plain text | Stripe's **publishable** key: `pk_test_…` for development and staging, `pk_live_…` for production (the app refuses the wrong one, and any secret key). Leave unset to offer pay at pickup only. See [Online payment](#online-payment-stripe). |
| `GOOGLE_MAPS_ANDROID_API_KEY` | Sensitive | Android's map (Google Maps). Without it, Android builds show a drawn map instead of the live one; iOS uses Apple Maps and needs nothing. See below. |

Never put the Supabase service_role key, a database password or any other
secret in an `EXPO_PUBLIC_*` variable. Everything in those is readable by
anyone who has the app.

### The Android map key

Android draws the map with Google Maps, which needs an API key inside the
app. A key in an app can be read by anyone who has the app, so it's
**restricted** to Mongmo's Android apps instead of kept secret:

1. [Google Cloud console](https://console.cloud.google.com/): create a
   project (e.g. `mongmo`), then **APIs & Services → Library → Maps SDK for
   Android → Enable**. Google lists the Maps SDK's map loads as unlimited
   without charge; it may still ask for a billing account.
2. **APIs & Services → Credentials → Create credentials → API key**, then
   edit it:
   - **Application restrictions → Android apps → Add**, once per app: the
     package name and its signing certificate's SHA-1.
     - `com.mongmostore.app.dev`, `.staging` and `com.mongmostore.app`
       built on EAS: expo.dev → project → **Credentials** → the package →
       *SHA-1 Certificate Fingerprint*.
     - Built on your machine (`npx expo run:android`): the debug key,
       `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`.
     - From Google Play: Play Console → **Test and release → App integrity →
       Play app signing** → *App signing key certificate* SHA-1.
   - **API restrictions → Restrict key → Maps SDK for Android**.
3. expo.dev → project → **Environment variables**: `GOOGLE_MAPS_ANDROID_API_KEY`,
   visibility **Sensitive**, in all three environments. For a build on your
   machine, put the same line in `.env.local`.
4. Build again: the key is built into the app, so an app built before it
   was set keeps the drawn map.

For GitHub Actions deploys, create two GitHub environments (repository
Settings → Environments), `staging` and `production`, each with:

- `SUPABASE_DB_URL`: secret. The database connection string from Supabase
  (Connect → Session pooler), with the password in it.
- `EXPO_TOKEN`: secret. An Expo access token (expo.dev → Account settings →
  Access tokens).
- `SUPABASE_ACCESS_TOKEN`: secret. A Supabase access token
  (supabase.com → Account → Access tokens), to deploy the payment
  functions.
- `SUPABASE_PROJECT_REF`: secret. That environment's project ref (the
  `abcdefghij` in `https://abcdefghij.supabase.co`). Without these two,
  deploys skip the payment functions with a warning.

Give `production` **required reviewers**, so a deploy waits for an approval.

The nightly retention job has its own environment, `retention`
([`privacy/retention.md`](privacy/retention.md)). Repository variables
switch the automations on once their environments are ready:
`STAGING_AUTO_DEPLOY`, `STORE_SUBMIT`, `RETENTION_ENABLED`
([`github-setup.md`](github-setup.md)).

### Online payment (Stripe)

People can pay in the app (card, Apple Pay, Google Pay, Bancontact) or at
the counter. The app shows Stripe's payment sheet; three Supabase Edge
Functions (`supabase/functions`) do the server side: `payment-sheet`
starts a payment for exactly the order's total, `stripe-webhook` marks the
order paid when Stripe confirms it, `refund-order` refunds a cancelled
order. Do this once per environment, in test mode for staging and live
mode for production:

1. **Payment methods.** Stripe Dashboard → Settings → Payments → Payment
   methods: turn on Cards, Apple Pay, Google Pay and Bancontact; others
   off. The app takes only methods that confirm straight away.
2. **Keys.** Developers → API keys. The **publishable** key goes in the
   app (`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`, above). The **secret** key
   goes only in the Supabase project → Edge Functions → Secrets, as
   `STRIPE_SECRET_KEY`. Better still, a restricted key with write access to
   PaymentIntents and Refunds only. Never in the app or the repository.
3. **Webhook.** Developers → Webhooks → Add endpoint:
   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`, with the
   events `payment_intent.succeeded`, `payment_intent.payment_failed`,
   `charge.refunded`, `refund.failed`, `charge.refund.updated` and
   `charge.dispute.created`. Copy its signing secret into the Supabase
   secrets as `STRIPE_WEBHOOK_SECRET`. Each event is handled once
   (`stripe_events` remembers them for 90 days), and each person can start
   10 payments or refunds a minute.
4. **Deploy the functions.** The Deploy workflow does it after the
   migrations (with `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF`), or
   by hand from a folder with `supabase/functions`:
   `supabase functions deploy payment-sheet`, `refund-order`, and
   `stripe-webhook --no-verify-jwt` (Stripe can't sign in; the function
   checks Stripe's signature instead).
5. **Apple Pay.** Apple Developer → Identifiers → Merchant IDs → add
   `merchant.com.mongmostore.app` (it's in `app.json`). Then Stripe
   Dashboard → Settings → Apple Pay → add an iOS certificate for it, and
   build again: EAS adds the Apple Pay capability.
6. **Google Pay.** Works in test mode right away. For live payments, ask
   for production access in the Google Pay & Wallet Console for the app
   (`com.mongmostore.app`); Google checks screenshots of the checkout.
7. **Try it on staging** with Stripe's test cards (`4242 4242 4242 4242`,
   any future date and CVC), a Bancontact test payment, and a
   cancellation: the order should show paid, then refunded. Apple Pay and
   Google Pay need a real phone and a store or development build, not Expo
   Go.

Refunds come out of the Stripe balance; if a refund fails, staff see it
under Owner tools → Orders, with **Send refund again**, and it can also be
refunded in the Stripe Dashboard.

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
