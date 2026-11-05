# Tests

| Command | What it checks | Needs |
|---|---|---|
| `npm test` | Unit tests (`tests/unit`): points and levels maths, stamps, rewards and discounts, which pop-up comes first, pickup times, the cart, switching pickup place, ordering, logging out, account deletion and password change, reordering, dialogs, the privacy filter, the logger, crash reporting, environment checks, and the error screen. | Nothing |
| `npm run test:integration` | Integration tests (`tests/integration`) against a real database: ordering and server-side prices, points for orders (and that they match what the app shows), levels and level rewards, privacy rules between customers, and that deleting an account deletes every row. | A local Supabase |
| `npm run test:a11y` | Every screen of the web build, for accessibility. | The web build served locally |
| `npm run verify` | Lint, type check and unit tests: what to run before pushing. | Nothing |

CI runs lint, the type check, the unit tests, the audit, the web build and
the integration tests on every push, and fails on any error. Builds fail
too when a unit test fails: `npm run build:web` runs the tests first, and so
does every EAS build (the `eas-build-post-install` script).

## Integration tests on your machine

They need Docker and the Supabase CLI. They create their own customers and
delete them at the end, and refuse to run against anything but a local
database.

```bash
# A throwaway local Supabase around the repo's migrations and seed
mkdir -p /tmp/mongmo-db && cd /tmp/mongmo-db && npx supabase init
cp -r ~/mongmo/supabase/migrations supabase/ && cp ~/mongmo/supabase/seed.sql supabase/
npx supabase start
npx supabase status -o env   # shows API_URL, ANON_KEY, SERVICE_ROLE_KEY

cd ~/mongmo
SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npm run test:integration
```

The service role key is for these tests only: it's local, throwaway, and
never goes in the app or in `.env`.
