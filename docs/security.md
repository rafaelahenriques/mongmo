# Security settings to apply

The code is ready; these switches live in each Supabase project (staging
and production) and in Sentry. Apply them once per project.

## Supabase → Authentication

| Setting | Where | Value |
|---|---|---|
| Minimum password length | Sign In / Providers → Email | 8 |
| Leaked password protection | Sign In / Providers → Email | On (checks HaveIBeenPwned) |
| Confirm email | Sign In / Providers → Email | On |
| Secure email change | Sign In / Providers → Email | On |
| Rate limits | Rate Limits | Sign-ups and sign-ins: 30 per 5 minutes per IP. Token verifications (confirmation and reset codes): 30 per 5 minutes. Emails: as low as your provider allows, 2 per hour by default |
| JWT expiry | JWT Keys / Sessions | 3600 seconds (1 hour) |
| Refresh token rotation | Sessions | On, reuse interval 10 seconds |
| Inactivity timeout (paid plans) | Sessions | 30 days |
| Site URL and redirect URLs | URL Configuration | `https://www.mongmo-store.com` (where a confirmed email link lands); `mongmo://**` for the app |
| Anonymous sign-ins | Sign In / Providers | On (guests: while it is off, "Continue as guest" says guest sign-in is off); also turn on CAPTCHA if abuse appears |
| Multi-factor (when you add the screen) | Multi-Factor | TOTP on |

### Emails: codes, not links

The app asks for a 6-digit code to confirm a new account and to reset a
password, typed into the app. No link to open, so nothing depends on where
a link lands (with the Site URL left at its default, a confirmation link
opens "localhost"). Both templates (Authentication → Emails) must show the
code, `{{ .Token }}`. Mongmo's own are in `supabase/templates`; paste each
file's whole contents into its template:

| Template | File | Subject |
|---|---|---|
| Confirm sign up | `supabase/templates/confirm-signup.html` | `Your Mongmo code: {{ .Token }}` |
| Reset password | `supabase/templates/reset-password.html` | `Reset your Mongmo password: {{ .Token }}` |

Keep **Email OTP length** at 6 and its expiry at 3600 seconds (Sign In /
Providers → Email): the app and the emails say six digits and one hour.

The emails come from Supabase's own sender until you connect your email
provider (Authentication → Emails → SMTP settings): do that before launch,
with the sender name `Mongmo` and an address at mongmo-store.com. The
built-in sender only sends a few emails an hour and is meant for testing.

## Supabase → Storage

The `challenge-photos` bucket must be **private** (migration 0023 sets
it). Check in Storage → Buckets after deploying.

## Supabase → Database

Run the security advisor (Advisors → Security) after each migration and fix
anything it reports.

## Sentry

Project settings → Security & Privacy: **Data Scrubber** on, **Use Default
Scrubbers** on, **Prevent Storing of IP Addresses** on. Data retention: 30
days. Leave Session Replay off.
