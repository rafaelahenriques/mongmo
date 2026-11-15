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

### Sending the emails: Resend

Supabase's own sender is for testing only: it writes only to people on the
project's Supabase team, a few emails an hour. Anyone else who signs up or
asks for a password reset gets no email (the app says "We can't send emails
to that address yet"). **Both projects send through Resend instead; this has
to be in place before launch.**

**The domain.** Resend sends from `mail.mongmo-store.com` (a subdomain, as
Resend recommends, so the app's emails keep their own reputation apart from
the café's Google mail). It's set up in Resend → Domains, region EU
(Ireland), with open and click tracking off. Resend checks four DNS records
at the domain's DNS host (Squarespace), all under `mail`; the exact values
are on the domain's page in Resend:

| Type | Host | Purpose |
|---|---|---|
| TXT | `resend._domainkey.mail` | DKIM: proves the email is from us |
| MX | `send.mail` (priority 10) | Bounces come back to Resend |
| TXT | `send.mail` | SPF for the bounce address |
| CNAME | `rsend.mail` | Resend's sending infrastructure |

Nothing at the root domain changes: the café's Google mail, Odoo's SPF
record and the DMARC record stay as they are.

**Each Supabase project** (production, then staging): Authentication →
Emails → SMTP Settings → Enable custom SMTP.

| Setting | Value |
|---|---|
| Sender email | `no-reply@mail.mongmo-store.com` |
| Sender name | `Mongmo` (staging: `Mongmo staging`) |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | A Resend API key: Resend → API Keys → Create, **Sending access**, domain `mail.mongmo-store.com`, one key per project (named after it). Resend shows it once: paste it straight into Supabase and nowhere else. |

Once custom SMTP is on, Supabase allows 30 of these emails an hour
(Authentication → Rate Limits). Resend's free plan sends 100 a day and
3,000 a month; its Pro plan ($20 a month, 50,000 emails) has no daily
limit. To change the key, create a new one, paste it into Supabase, then
delete the old one in Resend.

Change the templates and ship the app version that asks for a code
together: an older app expects the link, the new one the code.

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
