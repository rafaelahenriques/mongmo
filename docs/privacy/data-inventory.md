# Personal data inventory

Every place the app collects, stores or sends personal data, from the code
as of 9 November 2026. Keep it current: the privacy policy
(`src/constants/privacyPolicy.json`) and the store declarations
(`docs/store-release.md`) are written from it.

## Collected and stored on our servers (Supabase)

| Data | Collected in | Stored in | Who can read it | Why | Kept for |
|---|---|---|---|---|---|
| Email, password (hashed by Supabase Auth) | `SignInScreen`, `ChangePasswordScreen` | `auth.users` | The person | Account | Account's life; 24 months unused |
| Display name | Sign-up, `ProfileEditScreen` | `profiles.name` | The person; staff; other members only if the person joins the leaderboard | Account, leaderboard | Account's life |
| Home city (optional) | `ProfileEditScreen` | `profiles.home_city` | The person; staff | Planned: shown on the leaderboard | Account's life |
| Profile photo | `ProfilePhotoPicker` (Account → Edit profile) | Private bucket `avatars/<user id>/`, `profiles.avatar_path` | The person; other members while the person is on the leaderboard (signed links, one hour) | Shown on the person's profile and the leaderboard, by their choice | Until changed or removed (the file is deleted); files nobody uses are removed by the retention job after a day; deleted with the account |
| Profile picture link (from sign-up details, if any) | Nowhere | `profiles.avatar_url` | The person; staff | Not shown to others | Account's life |
| Leaderboard choice | Achievements, Settings | `profiles.leaderboard_visible` (off for new accounts) | The person | Opt-in | Account's life |
| Orders: items, options, pickup place and time, totals, reward used, paid at pickup and when | Cart, checkout | `orders`, `order_items` | The person; staff | Making the order | 24 months (drafts: 1 day) |
| Points history | Server (orders, challenges, badges, rewards) | `point_events` | The person | Loyalty balance and level | Account's life |
| Badges, rewards redeemed and used | Server | `user_badges`, `user_rewards` | The person | Loyalty | Used rewards: 24 months |
| Check-ins (pop-up, time, by QR code) | `CheckInScreen` | `check_ins` | The person; staff | Challenges, badges | 24 months |
| Location at check-in | `CheckInScreen` | **Not stored**: checked by `verify_check_in` and dropped | — | Proving presence | Not kept |
| Challenge results (a score, a vote, how many photos, within the venue's radius or not) | Challenge screens | `challenge_completions.data` | The person; staff | Points | 24 months |
| Challenge photos | `PhotoCapture` | Private bucket `challenge-photos/<user id>/`, `photos` | The person; staff (signed links, one hour); other members, without a name, for 7 days if the person shares it | The photo challenge; Photos of the week by consent (asked after taking it) | 12 months |
| Photo reports (which photo, who reported it, when) | Photos of the week | `photo_reports` | Staff (the app shows only how many) | Moderation | Until staff decide (Owner tools → Reported photos), then deleted; the photo keeps the outcome |
| Profile photo reports (whose photo, who reported it, when) | Leaderboard (tap a photo → Report) | `profile_photo_reports`; `profiles.avatar_hidden_at` while hidden | Staff (the app shows only how many) | Moderation | Until staff decide (Owner tools → Reported photos: put it back or remove it), then deleted |
| Account activity (last sign-in, session refresh) | Supabase Auth | `auth.users`, `auth.sessions` | Supabase, retention job | Security, retention | Supabase's own |

## Kept on the phone only

| Data | Where | Why |
|---|---|---|
| Login session | Keychain / Keystore (`secureStorage.ts`); browser storage on web | Staying signed in |
| Cart | AsyncStorage `mongmo-cart` | The order in progress |
| Settings, crash reports answer | AsyncStorage `mongmo-settings` | Preferences |
| Recent data (profile, orders, points…) | AsyncStorage `mongmo-query-cache`, 24 hours, cleared on sign-out | Opening offline |
| Location (foreground, background) | Memory; geofences registered with the OS | Distances, nearby alerts |
| Nearby alert history (pop-up ids, times) | AsyncStorage | Not alerting twice |
| Motion sensor (dance challenge) | Memory | The challenge's score |
| Calendar entries | The phone's calendar, when asked | "Add to calendar" |

Notifications are scheduled on the phone: no push token is collected.

## Sent to others

| Recipient | What | When | Role | Gate |
|---|---|---|---|---|
| Supabase | Everything in the first table | Using the app | Processor (hosting, database, auth, storage) | Needed to run the app |
| Sentry | Crash reports: code, device model, OS and app version; scrubbed of personal data (`crashReporting.ts`) | A crash | Processor | **Consent** (asked once, Settings → Crash reports) |
| Apple / Google | Location (OS services), directions destination | Location features; "Directions" | Platform | OS permission prompts |
| Photon (komoot) | Address search text | Staff creating a pop-up | Third party | Staff only |

The app has no analytics, advertising or session replay SDK.

## Proposed removals

Decided:

| # | What | Decision |
|---|---|---|
| 1 | Profile **bio** | **Removed** (`0027_drop_profile_bio.sql`): nobody but the person ever saw it |
| 2 | Profile **home city** | **Kept**: it will be shown on the leaderboard. Update the privacy policy when it is |
| 3 | Profile **picture** | **Done** (`0033`): an uploaded photo in a private bucket, shown on the leaderboard only while the person is on it; policy and store declarations updated |

| 4 | **Distance from the venue** in check-in challenge results | **Removed** (`0028`): stores `withinRadius` only; stored distances cleared |
| 5 | Old **photo links** in challenge results | **Removed** (`0028`): replaced with a photo count |
| 6 | **Leaderboard on by default** | **Opt-in** (`0028`): new accounts start hidden and join from Achievements; existing accounts keep their choice |
| 7 | **Photos readable by every signed-in member** | **Private** (`0029`): the person and staff only, unless the person shares one in Photos of the week (asked after taking it; 7 days, no name; stop any time; reports take it down at once) |
| 8 | **Demo images from images.unsplash.com** | **Removed** (`0028`): pop-ups without a picture show Mongmo's own bundled photos; the web's image policy now allows only the app and Supabase |

## Retention

The schedule above is enforced by `supabase/migrations/0025_retention.sql`
and runs nightly from `.github/workflows/retention.yml` (once
`RETENTION_ENABLED` is set). Sentry keeps crash reports for 30 days (set in
the Sentry project).
