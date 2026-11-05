# Mongmo

[![CI](https://github.com/rafaelahenriques/mongmo/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rafaelahenriques/mongmo/actions/workflows/ci.yml)

A cross-platform app for Mongmo, a Vietnamese café brand that runs pop-up events across Belgium: brunches, DJ nights and market stalls. Customers discover pop-ups near them, check in on site, complete challenges, earn rewards and order ahead for pickup. Owners get their own interface for creating events, managing challenges and handling incoming orders.

Built for the React challenge in Creative Development at Devine (Howest). I did the design and the development.

[Case study with screen recordings ↗](https://rafaelahenriques.com/projects/mongmo/)

## Highlights

- **Native device features.** Background geofencing alerts customers within 500 m of a live pop-up. Check-in combines a QR scan with a GPS check, and challenges use the camera, photo library and motion sensor (a dance meter).
- **Server-authoritative backend.** Points, badges, check-in verification and order totals are computed in Postgres functions. Per-user tables have no client write policy at all, so the app can only ask for an action and the database decides whether it is allowed.
- **Security in depth.** Row Level Security covers every table, and column-level grants keep each event's QR token unreadable to customers so a check-in cannot be spoofed. Prices are snapshotted on the server when an order is placed.
- **Live updates.** Supabase Realtime pushes pop-up occupancy and order status changes to every connected client.
- **Points ledger.** Points are stored as a ledger of events instead of a running total, which makes balances and the weekly leaderboard plain aggregates over the same data.
- **One codebase.** It runs on iOS and Android, and on the web where native APIs have web fallbacks.

## Tech stack

Expo (React Native) · Expo Router · TypeScript · Supabase (PostgreSQL, Auth, Storage, Realtime) · TanStack Query · Zustand

| Folder | Contents |
|---|---|
| `src/app/` | File-based routes: the Home, Pop-ups, Order and Wallet tabs, plus Account (with the owner screens) and Achievements, opened from the top bar |
| `src/api/`, `src/hooks/` | Supabase queries and mutations wrapped in TanStack Query hooks |
| `src/services/` | Location, geofencing, notifications, calendar, motion and haptics, with web variants |
| `src/state/` | Zustand stores for cart, filters, location and settings |
| `supabase/migrations/` | Schema, RLS, RPC functions, storage buckets and realtime publication. See [`supabase/README.md`](supabase/README.md) |

## Backend

The app reads and writes a real Supabase project — there's no mock data or
offline demo mode. Before running it, follow [`supabase/README.md`](supabase/README.md)
to apply the schema and set `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` (copy `.env.example`).

## This app does not run in Expo Go

Background geofencing (`expo-task-manager`), the camera (`expo-camera`,
for QR check-in and challenge photos), the photo library (`expo-image-picker`,
for pop-up photos), the motion sensor (`expo-sensors`, for dance
challenges), the calendar (`expo-calendar`, for "Add to calendar") and the
native date pickers (`@expo/ui`) are native modules Expo Go doesn't ship — opening the project in the plain Expo Go app will crash with
`Cannot find native module 'ExpoCamera'` (or similar) the moment any screen
imports one. You need a **development build** instead:

```bash
# Local build (needs Xcode for iOS / Android Studio for Android installed):
npx expo run:ios       # or: npx expo run:android

# Cloud build (no local native toolchain required — needs an Expo account):
npm install -g eas-cli
eas login
eas build --profile development --platform ios      # or android, or "all"
# For an iOS *simulator* build specifically (no paid Apple Developer account needed):
eas build --profile development-simulator --platform ios
```

Install the resulting build once, then go back to your normal
`npx expo start` — just open it from the dev-client app you installed
instead of Expo Go. Any time a new native dependency is added (as
happened here), the dev client needs rebuilding again; a plain JS/Metro
reload can't add native code to an already-installed app.

### On the iOS Simulator

- **Location:** the Simulator has none until you pick one (hence
  `kCLErrorDomain Code=0` in the log). Use *Features → Location → Custom
  Location…* — `50.8279, 3.2649` puts you at the seeded live pop-up in
  Kortrijk, close enough for the 500 m check-in geofence.
- **Camera:** the Simulator has no camera, so QR check-in and Capture
  challenges need a physical device (install the development build on it).
- **Motion:** no motion sensor either — dance challenges need a phone.
- **Rebuild each target:** `npx expo run:ios` rebuilds for the device or
  Simulator you pick (`npx expo run:ios --device` lists them). After a new
  native module, rebuild the phone *and* the Simulator; a stale build says
  "Update the app" for the missing feature instead of crashing.

## Get started

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL and anon key
npx expo run:ios       # or: npx expo run:android
```

After the first native build, `npx expo start` is enough for day-to-day work. Open it from the installed development build, not Expo Go.

## Tests and checks

`npm run verify` runs lint, formatting, the type check and the unit tests;
run it before pushing. CI runs those, a dependency audit, the web build,
the integration tests against a fresh database and an accessibility pass
over every screen, on every push, and fails on any error. See
[tests/README.md](tests/README.md).

## Environments and releases

Development, staging and production each have their own app and their own
Supabase project. Merges to `main` go to staging; a version tag releases to
TestFlight and Google Play. See [docs/release-process.md](docs/release-process.md)
and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Documentation

| | |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branches, Conventional Commits, pull requests, the rules the code keeps |
| [docs/setup.md](docs/setup.md) | Setting up a machine, everyday commands |
| [docs/architecture.md](docs/architecture.md) | How the app and backend fit together |
| [docs/database.md](docs/database.md) | Tables, the security model, changing the schema |
| [docs/release-process.md](docs/release-process.md) | Versions, the pipeline, cutting a release, checklists |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Environments, deploying, rolling back, logs |
| [docs/store-release.md](docs/store-release.md) | App Store and Google Play requirements and privacy answers |
| [docs/monitoring.md](docs/monitoring.md) | Sentry, Supabase and store alerts |
| [docs/github-setup.md](docs/github-setup.md) | Repository settings, branch protection, environments |
| [SECURITY.md](SECURITY.md) | Reporting a security problem |
| [docs/security-audit.md](docs/security-audit.md), [docs/security.md](docs/security.md) | What's protected; settings to apply per environment |
| [docs/incident-response.md](docs/incident-response.md) | What to do after a data breach (72-hour rule) |
| [docs/privacy/](docs/privacy/) | Personal data inventory and retention schedule |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each release |

## License

Proprietary. © 2026 Rafaela Henriques and Mongmo, all rights reserved; see
[LICENSE](LICENSE). The open-source packages, fonts, icons and data the app
uses keep their own licences, listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). After changing
dependencies, regenerate that file with `npm run licenses`.
