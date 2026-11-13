# The reviewer package

What Apple's and Google's reviewers need to test Mongmo, and every item
still to fill in before submitting. The store answers themselves are in
[`store-release.md`](store-release.md); the listing texts in
[`store-listing.md`](store-listing.md).

## 1. The demo account

Make it on **production** (reviewers test the production build), the day
before submitting:

```bash
SUPABASE_URL=https://<production-ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service role key> \
SUPABASE_ANON_KEY=<anon key> \
REVIEWER_EMAIL=review@mongmo-store.com \
REVIEWER_PASSWORD=<a new password, 12+ characters> \
  node scripts/reviewer-account.mjs
```

It makes a confirmed account called "App Review", on the leaderboard, with
one collected order and enough points for a reward. Run it from your own
machine: the service role key never goes anywhere else. Use a password
you don't use anywhere, and change it after the review (run the script
again with a new one).

Also live on production during the review:

- The real menu, with allergens filled in.
- At least one pop-up that's live or coming up, with its QR code printed
  or on a screen you can photograph for the reviewer (see the notes).
- Stripe in live mode with Apple Pay and Google Pay set up
  ([DEPLOYMENT.md → Online payment](DEPLOYMENT.md#online-payment-stripe)).

## 2. Review notes to paste

App Store Connect → the version → App Review Information → Notes; Play
Console → App content → App access → "All or some functionality is
restricted" → add the same login and instructions.

```
Sign in: review@mongmo-store.com / <password>

Mongmo is a café's app for ordering bánh mì ahead, finding its pop-ups and earning loyalty points.

To try ordering: Order tab → a dish → Add to cart → the cart → Checkout. Choose "At pickup" to place an order without paying, or "Pay now" to see the payment sheet (Stripe; card, Apple Pay or Bancontact). The order shows its pickup code and status; you can cancel it from there until the café starts on it, and a payment made in the app is refunded.

Pop-ups: Pop-ups tab, map or list. Checking in needs you to be at the pop-up and to scan its QR code; we've attached a photo of a test pop-up's code. Challenges and points follow from a check-in.

Location: sent once to confirm a check-in (not stored), and, only if the person turns on "Pop-ups near me" in Settings → Notifications, used in the background on the phone to notice a live pop-up within 500 m. Both can be refused; the rest of the app works without them.
Camera: scans pop-up QR codes and takes challenge or profile photos.
Motion: the dance challenge. Calendar: only when "Add to calendar" is tapped.

Photos members can see (Photos of the week, leaderboard profile photos) can be reported from the photo; a report hides it at once and staff review it in Owner tools.

Account deletion: Account → Settings → Delete account. It deletes the account and all its data.

Contact: hello@mongmo-store.com
```

Attach (App Store Connect → Attachment): a photo of the test pop-up's QR
code, and a short screen recording of a check-in.

## 3. Submission checklist

Tick each before pressing Submit. Everything the app needs is built; these
are settings and content only you can fill in.

**Accounts and setup**

- [ ] Apple Developer Program and Google Play developer accounts.
- [ ] Google Play: a closed test with 12 testers for 14 days (new personal
      accounts), finished.
- [ ] Production Supabase project: migrations applied, `base.sql` run,
      backups on, the settings in [`security.md`](security.md) applied.
- [ ] Email sending: your own SMTP provider in Supabase (confirmation
      emails and reset codes).
- [ ] `npx eas-cli init`, and the production variables on expo.dev.
- [ ] GitHub environment `production` with its secrets and required
      reviewers ([DEPLOYMENT.md](DEPLOYMENT.md)).
- [ ] Stripe live: keys, payment methods, webhook, Apple merchant ID,
      Google Pay production access.

**Content**

- [ ] Allergens filled in for every menu item, dips and extras included.
- [ ] Company number (KBO/BCE) and VAT number in the terms of use.
- [ ] Privacy policy and terms of use published on mongmo-store.com; their
      URLs in both consoles.
- [ ] At least one real pop-up live or coming up.
- [ ] The demo account (step 1) and the review notes (step 2).

**Store forms** (answers in [`store-release.md`](store-release.md))

- [ ] Apple App Privacy, including Financial Info → Payment Info.
- [ ] Google Play Data safety, including Financial info → User payment info.
- [ ] Content rating questionnaires (IARC on Google Play, age rating on
      the App Store).
- [ ] Google Play: background location declaration with its video, target
      audience 13+, ads: no.
- [ ] Export compliance: standard encryption only (already in `app.json`).

**Listing** (texts in [`store-listing.md`](store-listing.md))

- [ ] Name, subtitle, promotional text, keywords, descriptions.
- [ ] Screenshots from a real production build, in the listed order.
- [ ] Google Play feature graphic and icon.
- [ ] Support URL and contact email.

**Build**

- [ ] A production build from a version tag, tested on a real iPhone and
      Android phone (ordering both ways, a check-in, a refund).
- [ ] Phased release on (App Store) / staged rollout (Google Play)
      ([release-process.md](release-process.md)).
