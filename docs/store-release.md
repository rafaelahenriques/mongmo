# Store requirements and declarations

What Apple and Google ask for, with Mongmo's answers. Written from
[`privacy/data-inventory.md`](privacy/data-inventory.md); when that
changes, change these answers in both consoles too.

## Before the first submission: blockers

- [x] **Payment.** Customers pay at the counter when they pick up (no
      payment in the app, so no in-app purchase rules apply). If online
      payment comes later, food is a physical good: a provider like Stripe,
      not Apple's or Google's in-app purchase.
- [ ] **A reviewer account**: an email and password with some points and an
      order, written in App Store Connect → App Review Information and in
      Play Console → App access.
- [ ] **Privacy policy and account deletion URLs**: a page on Mongmo's own
      website (Odoo), e.g. `https://www.mongmo-store.com/app-privacy`, with
      the app's policy (the text of `public/privacy.html`, built from the
      in-app policy). Its "Your rights" section is the deletion page Google
      Play asks for. The app's web version doesn't need to be online.

## Both stores

| Item | Mongmo |
|---|---|
| Account deletion | In the app: Settings → Delete account (deletes everything, not hidden). On the web: the privacy page, "Your rights" |
| Sign in with Apple | Not required: the app has only its own email sign-in |
| Encryption (export compliance) | Standard HTTPS only: `usesNonExemptEncryption: false` in `app.json` |
| Age rating | No objectionable content, no user-to-user chat, no gambling: 4+ / Everyone. If pop-ups advertise alcohol, answer "infrequent alcohol references" |
| Location in the background | Used only for alerts near a live pop-up, off until the person turns it on; explained in the permission text |
| User-generated content (Apple 1.2, Google Play UGC policy) | Photos of the week: members choose to share a challenge photo, shown without names for 7 days. Every shared photo has **Report**, which takes it down for everyone at once; staff decide in Owner tools → Reported photos (put it back, keep it down, or delete it). Profile photos on the leaderboard (opt-in, members only): tap a photo → **Report this photo** hides it at once; staff put it back or remove it in the same place. Contact: hello@mongmo-store.com. Say so in the review notes |

## Apple: App Privacy (App Store Connect → App Privacy)

Tracking: **No**. No data is used for tracking or shared with data brokers.

| Data type | Collected | Linked to the person | Purpose |
|---|---|---|---|
| Contact Info → Email Address | Yes | Yes | App Functionality |
| Contact Info → Name | Yes (display name) | Yes | App Functionality |
| User Content → Photos or Videos | Yes (challenge photos, shown to other members only if the person shares one; a profile photo, if added, shown on the leaderboard only if the person joins it) | Yes | App Functionality |
| Purchases → Purchase History | Yes (orders) | Yes | App Functionality |
| Identifiers → User ID | Yes (account id) | Yes | App Functionality |
| Usage Data → Product Interaction | Yes (check-ins, challenge results, points) | Yes | App Functionality |
| Diagnostics → Crash Data | Yes, only with consent | No | App Functionality |
| Location → Precise Location | No: sent once to check a check-in and not stored (processed in real time only) | — | — |

If in doubt about location, declaring it (Precise, linked, App
Functionality) is the safe side.

App Review notes to include: background location is for pop-up alerts
only and can be refused; the camera scans pop-up QR codes and takes
challenge photos; motion is for the dance challenge; the calendar only
when "Add to calendar" is tapped.

## Google Play: Data safety (Play Console → App content → Data safety)

- Data **shared** with third parties: **none** (Supabase and Sentry are
  service providers).
- Data **encrypted in transit**: **Yes**.
- People can **request deletion**: **Yes**, in the app and on the web.

| Category → type | Collected | Optional | Processed ephemerally | Purposes |
|---|---|---|---|---|
| Location → Precise location | Yes | Yes (check-in) | Yes | App functionality |
| Personal info → Email address | Yes | Yes (guests have none) | No | App functionality, Account management |
| Personal info → Name | Yes | No | No | App functionality, Account management |
| Photos and videos → Photos | Yes | Yes | No | App functionality |
| Financial info → Purchase history | Yes | Yes | No | App functionality |
| App activity → Other actions (check-ins, challenges, points) | Yes | Yes | No | App functionality |
| App info and performance → Crash logs, Diagnostics | Yes | Yes (consent) | No | Analytics (fixing crashes) |

## Google Play: other declarations (App content)

- **Background location**: fill in the permission declaration (the
  nearby-pop-up alert, why it needs the background, a short video showing
  the in-app explanation and the alert). Required for
  `ACCESS_BACKGROUND_LOCATION`.
- **Foreground service (location)**: declare the location type with the
  same reason.
- **Target API level**: 36 (set by Expo SDK 58; Play requires 35 or newer
  for new apps and updates).
- **Ads**: No. **News app**: No. **Government app**: No. **Financial
  features**: None. **Health**: None.
- **Content rating**: the IARC questionnaire as above.
- **Target audience**: 13 and over (the privacy policy says the app isn't
  for children under 13).

## Store listings

| | App Store | Google Play |
|---|---|---|
| Name | Mongmo | Mongmo |
| Subtitle / short description | Bánh mì, pop-ups and rewards (≤ 30 / 80 characters) | Order ahead, find pop-ups, earn rewards |
| Screenshots | 6.9" iPhone (1320 × 2868); 6.5" if not auto-scaled | Phone, at least 2 (1080 × 1920 or larger) |
| Other images | — | Feature graphic 1024 × 500, icon 512 × 512 |
| Category | Food & Drink | Food & Drink |
| Support URL / email | hello@mongmo-store.com | Same |

## Testing tracks

- **TestFlight**: every production build lands here (`STORE_SUBMIT`).
  Internal testers (your team) get it at once; external testers after a
  short Beta App Review.
- **Google Play internal testing**: same, up to 100 testers by email list.
  Closed testing (alpha) for a wider group. New personal developer accounts
  must run a closed test with 12 testers for 14 days before production.
