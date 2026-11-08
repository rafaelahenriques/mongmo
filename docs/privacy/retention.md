# Data retention

How long each kind of personal data is kept, and the code that deletes it.

## The schedule

| Data | Deleted | Counted from |
|---|---|---|
| Unpaid draft orders | 1 day | Created |
| Guest accounts (no email), with everything in them | 30 days | Last activity |
| Challenge photos (file and record) | 12 months | Uploaded |
| Orders and their items | 24 months | Placed |
| Check-ins | 24 months | Checked in |
| Challenge results | 24 months | Completed |
| Rewards that have been used | 24 months | Used |
| Accounts with an email, with everything in them | 24 months | Last activity |
| Points history, badges, unused rewards | With the account | — |
| Crash reports (Sentry) | 30 days | Received |

"Last activity" is the latest of: account created, last sign-in, last
session refresh, last order, last check-in (`last_active_at()`). Staff
(owner) accounts are never deleted automatically.

Deleting an account deletes everything hanging off it: profile, orders,
points, badges, rewards, check-ins, challenge results and photos. Pop-ups a
staff member created stay, without a creator. It's the same cascade as
Settings → Delete account (`0016_delete_account.sql`).

## The code that enforces it

| Piece | What it does |
|---|---|
| `supabase/migrations/0025_retention.sql` | `retention_photo_paths(now)` lists the photo files due for deletion; `apply_retention(now)` deletes the rows and expired accounts and returns how many of each. Only the service role can call them. |
| `scripts/retention.mjs` | Deletes the listed photo files from Storage (batches of 100), then runs `apply_retention`. Prints counts only, never ids or names. `--dry-run` only counts. |
| `.github/workflows/retention.yml` | Runs the script every night at 03:17 UTC, and by hand (Actions → Data retention → Run workflow, dry run by default). |
| `tests/integration/retention.test.ts` | Proves against a real database, on every push: old orders, drafts and check-ins go and recent ones stay; an account expires only after 24 months unused; staff accounts never do; the app itself can't run any of it. |

Photo files go first because an account can't be deleted while its files
remain (Storage keeps them otherwise).

## Switching it on

1. GitHub → Settings → Environments → **New environment** `retention`, with
   secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (production's).
2. Settings → Secrets and variables → Actions → **Variables** →
   `RETENTION_ENABLED` = `true`.
3. Run it once by hand with **dry run** on and check the counts look right.

In Sentry: Settings → Data Retention (or your plan's equivalent) to 30
days.

## Changing a period

Change it in `0025_retention.sql` through a new migration, in its test,
here, in the privacy policy (`src/constants/privacyPolicy.json`, then
`npm run privacy:page`) and in `docs/privacy/data-inventory.md`.
