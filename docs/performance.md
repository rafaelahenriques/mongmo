# Performance

What was measured, what changed, and the budgets that keep it that way.
Numbers are from release exports (`npx expo export`) and a local Supabase,
13 November 2026.

## Before and after

| | Before | After | |
|---|---|---|---|
| Android JavaScript (Hermes bytecode) | 11.4 MB | 9.1 MB | −20% |
| Android JavaScript (minified, before Hermes) | 7,496 KB | 5,781 KB | −23% |
| Of which the icon library | 1,662 KB | 37 KB | −98% |
| Web JavaScript, all files | 7,745 KB | 5,474 KB | −29% |
| Web JavaScript, largest file | 5,932 KB | 3,663 KB | −38% |
| Owner board, one refresh, a year of orders (2,190) | 1,065 KB | 2.4 KB | −99.8% |
| Owner board names and lines, past 392 orders | fail (URL too long) | work | |
| An order's status screen, once collected or cancelled | checked every 15 s | not checked | |
| Polling with the app in the background (phones) | carried on | paused | |
| Shared photos and the photo gallery, on each refresh | downloaded again | from the cache | |
| A camera photo, uploaded (estimate, 12 MP) | 1.5–2.9 MB | 180–330 KB | about −90% |
| A profile photo, uploaded (estimate, 12 MP) | 1.5–2.9 MB | 80–150 KB | about −95% |

**The icon library.** `import { Plus } from 'lucide-react-native'` put all of
Lucide's ~4,000 icons in the app: Metro doesn't drop unused exports. Each
icon is now imported from its own module (`lucide-react-native/icons/plus`),
the same glyphs as before. A lint rule stops the whole-library import
coming back.

**The owner board** downloaded every order ever placed, every 15 seconds,
then asked for their names and lines with every order id in one URL. Past
392 orders that URL was too long and the board lost its names and lines.
It now gets only what it shows (`owner_board_orders`, migration 0037):
orders still with the kitchen, those collected or cancelled in the last
day, and refunds still owed, with an index for each part.

**Polling.** React Query couldn't tell when a phone app went to the
background, so polling went on there, and coming back refreshed nothing.
`src/api/queryClient.ts` now tells it, from `AppState`. An order's status
stops being checked once nothing more will change (collected, or cancelled
with no refund on its way).

**Shared photos** (Photos of the week, your gallery, reported photos)
come through signed links that change every time they're fetched, so the
image cache never matched and each refresh downloaded every photo again.
They're now cached by their storage path, as profile photos already were.

**Uploaded photos** went up as the camera made them, several megabytes
each, and a 44-point leaderboard avatar downloaded all of it. They're now
shrunk on the phone first (`src/services/shrinkImage.ts`): challenge
photos and pop-up images to 1,600 pixels on the longest side, profile
photos to 1,024, saved as JPEG at 80% quality. HEIC photos become JPEG
too, which every phone and browser can show. If a photo can't be shrunk,
the original is sent as before. The sizes in the table are estimates from
sample photos re-encoded on a computer, not measured on a phone.

**My orders** shows the latest 50 (with a note when there are more; every
order is in Settings → Your data), so it and the lines lookup behind it
stay the same size however long someone has been a customer.

## Already in good shape

- Photos bundled with the app: 1.6 MB for all of them, each sized for its
  slot (the largest 1,200 px wide).
- Screens are split per route on the web; data is cached and persisted, so
  a cold start shows the last data straight away.
- Lists that can grow have limits: points history 50, photos 60, the
  leaderboard its top entries.

## Still open

- **The Material Symbols font (950 KB)** is in the Android and web builds
  although only iOS draws symbols: Expo Router loads `expo-symbols` itself
  for its native tabs. Leaving it: removing it would mean overriding how
  Metro resolves Expo Router's code.
- **Lato (3 × 640 KB)** has every script Lato supports. Cutting it to Latin
  and Vietnamese would save about 1.5 MB, but names in other scripts would
  fall back to the system font; worth doing only if app size becomes a
  problem.

## Budgets

Checked in CI after the web build (`scripts/check-bundle-size.mjs`); a
build over budget fails.

| | Budget | Now |
|---|---|---|
| Web JavaScript, all files | 6,000 KB | 5,502 KB |
| Web JavaScript, largest file | 4,000 KB | 3,676 KB |

Raise a budget only on purpose: say in the pull request what grew and why,
and change it here and in the script together.

Not checked automatically, but watch them when adding features:

- Anything polled: say why, how often, and when it stops.
- A list that grows with time: give its query a limit or a window.
- A new dependency: run the source-map breakdown below before and after.

## How to measure

```bash
# App size (Android): bytecode size, then what's in it by package
npx expo export -p android --output-dir /tmp/android
npx expo export -p android --source-maps --no-bytecode --output-dir /tmp/android-map

# Web size against the budget
npx expo export -p web --output-dir dist && node scripts/check-bundle-size.mjs dist
```

For the source-map breakdown, any source-map explorer works on
`/tmp/android-map/_expo/static/js/android/entry-*.js(.map)`.
