# Architecture

## The pieces

```
 iPhone / Android / browser
 ┌───────────────────────────────────────────┐
 │ Expo app (React Native, TypeScript)        │
 │  src/app        screens, by route          │
 │  src/components the screens' parts         │
 │  src/hooks      TanStack Query hooks       │
 │  src/api        Supabase calls             │
 │  src/services   device features            │
 │  src/state      Zustand stores (on phone)  │
 └──────────────┬────────────────────────────┘
                │ HTTPS: REST, Auth, Storage; WSS: Realtime
 ┌──────────────▼────────────────────────────┐
 │ Supabase                                   │
 │  Postgres: tables, row-level security,     │
 │            functions that decide points,   │
 │            prices, check-ins               │
 │  Auth:     email and password, guests      │
 │  Storage:  challenge photos (private),     │
 │            pop-up images (public)          │
 │  Realtime: occupancy, order status         │
 │  Edge Functions: start a payment, refund,  │
 │            Stripe's webhook (hold the      │
 │            Stripe and service-role keys)   │
 └──────────────▲────────────────────────────┘
                │ signed webhooks; PaymentIntents and refunds
 ┌──────────────┴────────────────────────────┐
 │ Stripe: payments (the app only shows its   │
 │         payment sheet, publishable key)    │
 └────────────────────────────────────────────┘
        Sentry (crash reports, only with consent)
```

## Who may talk to whom

The app is an untrusted client: anyone can take it apart and call the same
APIs. So it holds no secret and decides nothing that matters.

| From | To | With |
|---|---|---|
| App | Supabase (Auth, database through row-level security, Storage, Edge Functions) | The publishable (anon) key and the person's sign-in |
| App | Stripe's payment sheet | The publishable key and a one-payment client secret |
| Edge Functions | Stripe | The secret key (a Supabase secret) |
| Edge Functions | The database, past row-level security | The service-role key (set by Supabase) |
| Stripe | The `stripe-webhook` function | Its signature, checked before anything else |

## Where each thing lives

One place is right for each kind of data; everything else reads from it.

| Data | Source of truth | Copies, and who wins |
|---|---|---|
| Accounts, profiles, photos | Supabase | None |
| Menu, prices, allergens | Supabase (`menu_items`), edited by staff | None. An order keeps the name and price it was placed at |
| Orders and their status | Supabase (`orders`) | None |
| Whether an order is paid or refunded | Stripe | `orders.paid_at` and `refund_status`, written only by Stripe's webhook. Stripe wins |
| Points, levels, rewards | Supabase, worked out by database functions | None |
| Crash reports | Sentry | None |

There is no back-office system (accounting, stock) connected yet. If one
is added, it gets a row here first: which side owns each record, which way
it's copied, and who wins when they differ.

## Principles

- **The database decides.** The app asks; Postgres functions decide whether
  a check-in counts, what an order costs, how many points something earns.
  Per-user tables have no write access from the app at all. So a modified
  app can't give itself anything.
- **One codebase**, three platforms. Device features (`src/services`) have a
  `.web.ts` twin where the web needs a different way.
- **Server data in TanStack Query, phone data in Zustand.** Queries are
  cached and kept for offline opening (24 hours, cleared on sign-out); the
  cart, settings and location live in small persisted stores.
- **Three environments** (development, staging, production), each its own
  app id and Supabase project: [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Code layout

| Folder | What's in it |
|---|---|
| `src/app/` | Routes (Expo Router, file-based, typed). `(tabs)` are Home, Pop-ups, Order, Wallet; `(profile)` is Account, Settings, Your data, the owner screens. `_layout.tsx` starts everything. |
| `src/components/` | Screens and their parts, by area (`order/`, `wallet/`, `privacy/`…); `ui/` holds the shared controls (Button, ListRow, TextField…). |
| `src/api/` | One file per area of Supabase calls; `errors.ts` turns server errors into messages people can read. |
| `src/hooks/` | Query and mutation hooks around `src/api`, and small UI hooks. |
| `src/services/` | Location and geofencing, notifications, calendar, motion, haptics, auth flows, data export. |
| `src/state/` | Zustand stores: cart, settings (incl. the crash-report answer), filters, location. |
| `src/lib/` | Supabase client, environment checks (`env.ts`), logging and its scrubber, crash reporting, secure session storage. |
| `src/constants/` | Theme tokens, points rules, the privacy policy text. |
| `supabase/migrations/` | The whole backend: schema, rules, functions, storage, retention. [`database.md`](database.md). |
| `tests/` | `unit/` (Jest), `integration/` (Jest against a real local Supabase), `a11y/` (every web screen with axe), `e2e/` (Maestro flows). |
| `scripts/` | Retention job, privacy page builder, dependency audit, local web server with the security headers, licence notices. |
| `.github/` | CI, deploy, preview, release and retention workflows; templates; Dependabot. |

## Key flows

- **Sign-in:** Supabase Auth; the session is kept in the Keychain or
  Keystore (`src/lib/secureStorage.ts`). Guests are anonymous accounts.
- **Ordering:** the cart is on the phone; `create_order` prices it on the
  server from current menu prices and returns the order; status changes
  arrive over Realtime.
- **Check-in:** the QR code carries a token the app can't read from the
  database; `verify_check_in` checks the token and the distance, and stores
  only that it happened.
- **Points:** every gain or spend is a row in `point_events`; balances,
  levels and the leaderboard are sums over it.
- **Privacy:** crash reports start only after consent; Your data exports
  everything through `export_my_data`; deletion cascades from the login;
  retention deletes old data nightly ([`privacy/`](privacy/)).

## Security

What's protected and how: [`security-audit.md`](security-audit.md).
