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

### Changed

- On a tablet or a wide browser window, the app keeps a centred column
  instead of stretching edge to edge.
- You pay at the counter when you pick up your order; the app takes no
  payment. Staff see what to take and mark it paid as they hand it over.
- The leaderboard is opt-in: join it from Achievements, leave it in
  Settings.

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
