# Database

Supabase Postgres. Everything about it lives in `supabase/migrations/`,
applied in order. Per-migration notes: [`supabase/README.md`](../supabase/README.md).

## Tables

| Area | Tables | Who writes |
|---|---|---|
| People | `profiles` (name, role, leaderboard choice) | The person (some columns), functions |
| Places | `stores`, `events` (pop-ups) | Staff |
| Food | `menus`, `menu_items`, `event_menus` | Staff |
| Orders | `orders`, `order_items` | Functions only (`create_order`, `place_order`, `advance_order_status`). Paid at pickup: `paid_at` is set when staff mark an order collected |
| Programme | `challenges`; `check_ins`, `challenge_completions`, `photos`, `photo_reports` | Staff; functions only; the person (photos, private; shared through `set_photo_shared`) |
| Loyalty | `point_events`, `badges`, `user_badges`, `rewards`, `user_rewards`, `levels` | Functions only (rewards and badges: staff) |

`profiles.id` is the login's id; everything per-person references it with
`on delete cascade`, so deleting the login deletes it all.

## Security model

- **Row-level security** on every table. People read their own rows;
  staff (`role = 'owner'`) read what they run.
- **No direct writes** to per-person tables: the app calls functions
  (`security definer`) that check the rules and write.
- **Functions** can be called only by signed-in users, and only those
  granted (0023). Retention functions only by the service role.
- **Storage:** `challenge-photos` is private, a folder per person,
  readable by the person, staff, and anyone while a photo is shared in
  Photos of the week; `event-images` is public, written by staff.
- Proven by `tests/integration/accessControl.test.ts` on every push.

## Changing the schema

1. Add a migration: the next number, a name, e.g.
   `0027_pickup_notes.sql`. Never edit one that has run in production.
2. It must work with the app versions on phones: add first, remove later.
3. New table: enable row-level security, add policies, grant only what's
   needed, add access tests. New function: `set search_path = public`,
   grant execute to `authenticated` explicitly.
4. Update `src/types/database.ts` for anything the app reads.
5. Test: `npx supabase db reset`, then `npm run test:integration`.
6. Personal data? Update `docs/privacy/data-inventory.md`, the export
   (`export_my_data`), retention, and the privacy policy.

Deploying applies new migrations to staging (on merge) and production (on
release): [`DEPLOYMENT.md`](DEPLOYMENT.md). Undoing one is a new migration
that reverses it.

## Backups

Supabase takes daily backups; turn on point-in-time recovery for
production if the plan allows. Restoring: `DEPLOYMENT.md` → Rolling back.
