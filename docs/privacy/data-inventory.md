# Personal data inventory

Every place the app collects, stores or sends personal data, from the code
as of 5 November 2026. Keep it current: the privacy policy
(`src/constants/privacyPolicy.json`) and the store declarations
(`docs/store-release.md`) are written from it.

## Collected and stored on our servers (Supabase)

| Data | Collected in | Stored in | Who can read it | Why | Kept for |
|---|---|---|---|---|---|
| Email, password (hashed by Supabase Auth) | `SignInScreen`, `ChangePasswordScreen` | `auth.users` | The person | Account | Account's life; 24 months unused |
| Display name | Sign-up, `ProfileEditScreen` | `profiles.name` | The person; other members on the leaderboard unless hidden; staff | Account, leaderboard | Account's life |
| Home city, bio | `ProfileEditScreen` | `profiles.home_city`, `profiles.bio` | The person; staff | **None found** (see proposals) | Account's life |
| Profile picture link | Nowhere in the app | `profiles.avatar_url` | The person; staff | **None found** (see proposals) | Account's life |
| Leaderboard visibility | Settings | `profiles.leaderboard_visible` | The person | Opt-out | Account's life |
| Orders: items, options, pickup place and time, totals, reward used | Cart, checkout | `orders`, `order_items` | The person; staff | Making the order | 24 months (drafts: 1 day) |
| Points history | Server (orders, challenges, badges, rewards) | `point_events` | The person | Loyalty balance and level | Account's life |
| Badges, rewards redeemed and used | Server | `user_badges`, `user_rewards` | The person | Loyalty | Used rewards: 24 months |
| Check-ins (pop-up, time, by QR code) | `CheckInScreen` | `check_ins` | The person; staff | Challenges, badges | 24 months |
| Location at check-in | `CheckInScreen` | **Not stored**: checked by `verify_check_in` and dropped | — | Proving presence | Not kept |
| Challenge results | Challenge screens | `challenge_completions.data` | The person; staff | Points | 24 months |
| Distance from the venue at a check-in challenge | Challenge screens | `challenge_completions.data.distanceM` | The person; staff | **Not needed** (see proposals) | 24 months |
| Challenge photos | `PhotoCapture` | Private bucket `challenge-photos/<user id>/`, `photos` | The person; staff (signed links, one hour) | The photo challenge | 12 months |
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
| images.unsplash.com | The viewer's IP address (image requests) | Demo pop-up images from `seed.sql` | Third party | Demo data only: see proposals |

The app has no analytics, advertising or session replay SDK.

## Proposed removals: waiting for approval

Nothing below has been changed. Each needs a yes or no.

| # | What | Why remove or gate it | The change |
|---|---|---|---|
| 1 | Profile **bio** | Typed free text that nobody but the person ever sees | Remove the field from Edit profile and the column (migration) |
| 2 | Profile **home city** | Shown only to the person; used for nothing | Remove the field and the column |
| 3 | Profile **picture link** | No way to set it in the app; collected nowhere | Drop the column |
| 4 | **Distance from the venue** in check-in challenge results | Only pass or fail matters; the distance is location data | Store `{ "withinRadius": true }`; clear the distances already stored |
| 5 | Old **photo links** in challenge results | Dead links since the bucket went private | Replace them with a photo count in existing rows |
| 6 | **Leaderboard on by default** | Shares a name with other members before anyone chose to | New accounts start hidden (opt in); existing accounts keep their setting |
| 7 | **Photos readable by every signed-in member** in the database rules | The app shows them only to the person and staff | Limit the rules to the uploader and staff |
| 8 | **Demo images from images.unsplash.com** | Each view tells Unsplash the viewer's IP address | Replace them with images in our own storage before launch |

## Retention

The schedule above is enforced by `supabase/migrations/0025_retention.sql`
and runs nightly from `.github/workflows/retention.yml` (once
`RETENTION_ENABLED` is set). Sentry keeps crash reports for 30 days (set in
the Sentry project).
