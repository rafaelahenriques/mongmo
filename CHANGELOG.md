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

### Removed

- The profile bio: nobody else ever saw it, so we no longer keep it.

### Security

- Sign-in kept in the phone's Keychain or Keystore.
- Signed-out visitors can't call any database function; challenge photos
  are private, shown through short-lived links.
- Error messages no longer show the server's own wording.
- Old data is deleted automatically after its retention period.
