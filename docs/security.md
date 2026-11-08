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
| Rate limits | Rate Limits | Sign-ups and sign-ins: 30 per 5 minutes per IP. Token verifications (reset codes): 30 per 5 minutes. Emails: as low as your provider allows, 2 per hour by default |
| JWT expiry | JWT Keys / Sessions | 3600 seconds (1 hour) |
| Refresh token rotation | Sessions | On, reuse interval 10 seconds |
| Inactivity timeout (paid plans) | Sessions | 30 days |
| Site URL and redirect URLs | URL Configuration | `https://www.mongmo-store.com` (where a confirmed email link lands); `reactchallenge://` for the app |
| Anonymous sign-ins | Sign In / Providers | On (guests); also turn on CAPTCHA if abuse appears |
| Multi-factor (when you add the screen) | Multi-Factor | TOTP on |

### Reset password email

The app asks for a 6-digit code, so the **Reset Password** template
(Authentication → Emails) must show the code:

```html
<h2>Reset your Mongmo password</h2>
<p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
<p>It works for one hour. If you didn't ask for it, ignore this email.</p>
```

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
