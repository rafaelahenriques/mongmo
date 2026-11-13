# Changelog

What changed in each release, for people using the app. Format:
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions:
[Semantic Versioning](https://semver.org/). Releasing moves **Unreleased**
under a new version heading ([`docs/release-process.md`](docs/release-process.md));
the release workflow publishes that section as the GitHub release notes.

## [Unreleased]

### Added

- Pop-ups near you on a map and in a list, with live occupancy, and alerts
  when you're within 500 m of a live one.
- Check in at a pop-up with its QR code; challenges (photo, vote, taste,
  timing, dance) for points.
- Order ahead for pickup at the café or a pop-up, with item options and
  live order status.
- Points, levels (Dough, Rising, Golden, Crisp), badges, rewards and a
  membership card in the Wallet; a weekly leaderboard you can opt out of.
- Owner screens: create and run pop-ups, manage challenges and handle
  incoming orders.
- Reset your password with an emailed code.
- Settings → Your data: see what's held about you, download a copy,
  correct it, or delete your account and all its data.
- Privacy policy in the app and on the web.
- Crash reports, only if you say yes; change your mind in Settings.
- The app version at the bottom of Settings.
- Photos of the week on Home: after a challenge photo, choose whether to
  share it. Shared photos show for a week without your name; stop sharing
  from Account, or report someone else's.
- Pop-ups without a picture of their own show Mongmo's photos.
- Owner tools → Reported photos: staff put a reported photo back, keep it
  down, or delete it for good. Reports are deleted once decided.

- Settings → Contrast: medium and high contrast colours, from the
  Material theme. System follows your phone's Increase Contrast setting.
- Cancel an order you placed by mistake, until the café starts on it; a
  reward you used comes back.
- Every screen that loads something says when it couldn't, with Try
  again, and lists refresh when you pull down.

- Mongmo's own stickers in the app: on rewards, levels, the menu's
  sections, Home's reward and level cards, and empty screens.
- A profile photo: choose one or take one in Account → Edit profile.
  The leaderboard opens on your spot (your rank, photo and how far to the
  next one up), then the top three as photo cards with their medals, then
  everyone close behind. No photo shows your initials. Photos are private
  and only shown while you're on the leaderboard; a removed photo is
  deleted.
- Tap someone's photo on the leaderboard to see it bigger, and report it
  if it isn't right: it's hidden straight away. Staff put it back or
  remove it in Owner tools → Reported photos.
- Allergens on every dish's page, dips and extras included, with a way to
  ask us by email. A dish whose allergens aren't filled in yet says so.
- "Prices include VAT" on the menu, cart and checkout.
- Terms of use, in Settings and on sign-up, and as a web page.
- Pay in the app: card, Apple Pay, Google Pay or Bancontact, through
  Stripe, or still at the counter. Cancelling an order you paid for gives
  the money back. Staff see which orders are paid.

### Changed

- The stamp card shows stamps: an Ô sticker for each one earned, a dashed
  circle for each to go, and the next one's ring filling with your points.
- A new look, photo first: Home opens on a kitchen photo with your name,
  points and Order ahead over it; pop-ups are tall photo posters with
  Check in and Directions on them; the menu's sections are dish photos;
  the café's page is a photo card; the cart and checkout show where you
  pick up as a photo. Sections are numbered (01, 02, …) on Home, the
  Wallet, the cart and checkout, and rewards are a clean list. Rounder
  cards, pill buttons and a floating tab bar. Same fonts, colours and
  features.
- A pop-up's page shows when and where side by side, and how busy it is
  as a sage bar.
- Ordering is quicker: pick the pickup day from a row of open days
  (Today, Tomorrow, Thu 12…) instead of a month calendar; change amounts
  in the cart with round − and + (a bin at 1); "View cart" shows how many
  things and the total. Your pickup code is a ticket, and your current
  order sits at the top of My orders.
- Achievements: a sage card with how many badges you have and the next
  one to get, then every badge as a tile, two to a row. The leaderboard
  has round rank badges, the top three in sage.
- Account and Settings: numbered sections, each group of rows on one
  rounded card.
- Softer buttons: second choices are stone pills instead of outlines,
  extras are "+ Add" / "✓ Added" pills, and the counters have round
  buttons that are easier to hit.
- On an item's page, the price drops under the name when text is large.
- On a tablet or a wide browser window, the app keeps a centred column
  instead of stretching edge to edge.
- You pay at the counter when you pick up your order; the app takes no
  payment. Staff see what to take and mark it paid as they hand it over.
- The leaderboard is opt-in: join it from Achievements, leave it in
  Settings.
- Android: notifications come in five kinds (your orders, pop-ups near
  you, badges, rewards, cart reminders), each with its own switch in
  Android's settings. Order updates pop up on screen; cart reminders
  arrive quietly. They show the Mongmo mark in the status bar.
- Android: buttons, rows and cards ripple when you touch them, as
  elsewhere on Android.

### Fixed

- Wallet: "Redeem" no longer breaks across two lines.
- Settings: the Contrast options sit under their explanation instead of
  squeezing it into a narrow column.

- On Android, opening Pop-ups no longer closes the app. The map needs a
  Google Maps key in the build; until it has one, Android shows a drawn
  map, and the list and the panel below still have every pop-up.

### Removed

- The profile bio: nobody else ever saw it, so we no longer keep it.
- How far from the venue you were at a check-in challenge: only whether
  you were close enough is kept.

### Security

- Sign-in kept in the phone's Keychain or Keystore.
- Signed-out visitors can't call any database function; challenge photos
  are private, shown through short-lived links.
- Error messages no longer show the server's own wording.
- Old data is deleted automatically after its retention period.
- Challenge photos are private to you and Mongmo staff unless you share
  one.
- The web app loads images only from itself and our own storage.
