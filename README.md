# Mongmo

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
| `src/app/` | File-based routes: explore, home, orders and profile (including the owner screens) |
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
