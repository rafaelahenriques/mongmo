# Mongmo — Supabase backend

This is the backend foundation the rest of the app builds on: schema, RLS,
and the server-authoritative business logic (points, badges, check-in
verification, order totals). No feature in the app should ever decide on
its own that a user earned points or a discount — everything below runs in
Postgres so the client can only ever *ask*, never *decide*.

## Setup

1. Install the Supabase CLI (`npx supabase --version` works without a global
   install) and create a project at [supabase.com](https://supabase.com), or
   run one locally with `npx supabase start` (requires Docker).
2. Apply the schema, in order:
   ```bash
   npx supabase link --project-ref <your-project-ref>   # skip for local
   npx supabase db push                                  # applies supabase/migrations/*.sql
   ```
   For local development, `npx supabase db reset` applies every migration
   **and** `supabase/seed.sql` in one step.
3. Copy `.env.example` to `.env` and fill in the project URL and anon key
   (Supabase dashboard → Project Settings → API, or the values `supabase
   start` prints for a local project).
4. `npm install && npx expo start`.

Without step 3, `src/lib/supabase.ts` throws immediately on launch with a
message pointing back here — the app intentionally has no mock fallback
left, per "no hardcoded/mock data."

## Schema (supabase/migrations)

| File | Contents |
|---|---|
| `0001_schema.sql` | Every table in AGENTS.md: profiles, stores, events, menus/menu_items/event_menus, challenges, check_ins, challenge_completions, photos, badges/user_badges, point_events, rewards/user_rewards, orders/order_items. |
| `0002_functions.sql` | The server-authoritative logic: the profile-creation trigger, the points ledger triggers, badge evaluation (`evaluate_badges`), and the RPCs below. |
| `0003_rls.sql` | Row Level Security for every table. Per-user tables (`check_ins`, `challenge_completions`, `user_badges`, `point_events`, `user_rewards`, `orders`) have **no client-facing write policy at all** — they're only ever written by the SECURITY DEFINER functions in 0002, which run as the table owner and bypass RLS. |
| `0004_storage.sql` | The `challenge-photos` storage bucket (public read, write restricted to the uploader's own folder). |
| `0005_realtime.sql` | Adds `stores`/`events` to the `supabase_realtime` publication so the app's live "how busy" numbers work via `postgres_changes`, not a bespoke socket server. |
| `0006_qr_token_hardening.sql` | Revokes `events.qr_token` from ordinary reads (column-level, not row-level) so "scan the QR" actually verifies something — see below. |

### Points ledger, not a running total

`profiles` does **not** have a `points` column. Every award (`challenge_completion`,
`badge`) or spend (`reward_redeemed`) is one row in `point_events`. A running
total would make the weekly leaderboard impossible to compute honestly; a
ledger makes both `my_points_balance()` (sum everything) and
`leaderboard('weekly')` (sum the last 7 days) plain aggregates over the same
data.

### RPCs the client calls

| Function | Purpose |
|---|---|
| `verify_check_in(event_id, qr_token, lat, lng)` | The only way a `check_ins` row is created. Checks the QR token matches, the event's time window is currently open, and the device is within ~500m (haversine distance) — "verified (geofence + QR)" per spec. |
| `complete_challenge(challenge_id, data)` | Requires an existing check-in for that challenge's event first. |
| `redeem_reward(reward_id)` | Validates balance + expiry, then spends points atomically. |
| `create_order(store_id, event_id, items, pickup_at, user_reward_id?)` | The client sends only item ids/quantities; prices, reward validation and totals are computed here. Snapshots `name`/`price_cents` onto `order_items` at insert time. |
| `confirm_mock_payment(order_id)` | Stand-in for a real Stripe charge later (Edge Function). Moves `draft → paid`; nothing else can. |
| `advance_order_status(order_id, status)` | Owner-only: `preparing`/`ready`/`collected`/`cancelled`. |
| `leaderboard(period)` | `'weekly' | 'all'`, aggregated across every visible profile. |
| `my_points_balance()`, `my_stats()` | The signed-in user's own numbers (points; events attended, cities visited, challenges completed, orders placed). |
| `get_event_qr_token(event_id)` | Owner-only. The one legitimate way to read an event's QR token, for generating/printing it. |

### Why `qr_token` needs a real access control, not just RLS

Row Level Security controls *which rows* a query can see, not *which
columns*. A plain "events are publicly readable" policy would let any signed-in
customer `select qr_token from events where id = ...` and check themselves in
from anywhere with spoofed coordinates — "scan the QR" would verify nothing.
`0006_qr_token_hardening.sql` revokes table-level `SELECT` on `events` for
`authenticated` and re-grants it column-by-column, leaving `qr_token` out (a
column-level `REVOKE` alone doesn't work here — it's a no-op as long as the
role still holds the table-level grant, which is exactly what a bare `alter
default privileges ... grant all` leaves in place). The client-side query in
`src/api/endpoints.ts` selects an explicit column list for the same reason;
`select('*')` would now fail for a customer.

## Client integration (`src/lib`, `src/api`, `src/hooks`)

- `src/lib/supabase.ts` — the one `supabase-js` client, session persisted to
  AsyncStorage.
- `src/types/database.ts` — hand-written mirror of the schema above (table
  Row/Insert/Update shapes + RPC signatures), used as `createClient<Database>`'s
  generic. Once a real project exists, replace it wholesale with
  `supabase gen types typescript --linked`.
- `src/api/endpoints.ts` + `src/api/mappers.ts` — every query the app makes,
  and the snake_case → camelCase mapping into the app's domain types
  (`src/types/index.ts`).
- `src/hooks/useSession.ts` — gates the whole app (`src/app/_layout.tsx`
  renders the sign-in screen, a loading splash, or the tabs, based on this).

## What this session did **not** build

Deliberately out of scope for a "backend foundation" pass — the schema and
RPCs above are ready for these, but no UI calls them yet:

- **Ordering UI** (location → menu → cart → checkout). `create_order` /
  `confirm_mock_payment` are implemented and tested against the schema, but
  there's no cart store or order screens yet.
- **Challenge UI** (the generic per-type renderers). `complete_challenge`
  exists; the Event Detail screen doesn't show challenges yet.
- **Camera-based QR scanning** for check-in. `verify_check_in` is real and
  tested (token match + time window + geofence distance); the Event Detail
  "Check in" button is left disabled with a "scan QR — coming soon" label
  because there's no legitimate way for the client to obtain the token
  without a camera scan (see the qr_token note above) or expo-camera
  installed yet.
- **Owner screens** (event/challenge/menu management, order board, QR
  generation). The `role` column, `is_owner()` check, and every owner-write
  RLS policy are in place; there's no owner UI.
- Photo upload UI for Capture/Discovery challenges (the storage bucket and
  its RLS policies exist).

## Validating this schema without a live project

There's no live Supabase project wired into this session, so the migrations
were validated against a plain local Postgres 16 instance with minimal stand-ins
for `auth.users`/`auth.uid()`/`auth.role()` and the `storage` schema (not
committed — this was a throwaway local check, not part of the app). That
confirmed, end to end: check-in verification (wrong token, out-of-range,
success, duplicate), the full badge ladder, the points ledger, reward
redemption (including insufficient-balance), order pricing + the mock
payment step, RLS isolation between two users, the qr_token column
hardening, and the leaderboard aggregation. It does **not** replace testing
against a real Supabase project (PostgREST's exact request/role plumbing,
Realtime, and Storage weren't exercised) — do that before shipping.
