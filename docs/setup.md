# Setting up a machine

## You need

- **Node** in the version of `.nvmrc` (22): `nvm use`.
- **Docker**, for a local Supabase.
- **Xcode** (iOS) and/or **Android Studio** (Android) for development
  builds, or an Expo account to build in the cloud. The app doesn't run in
  Expo Go (it uses native modules): see the README.
- Editor: VS Code with the recommended extensions (`.vscode/`): ESLint,
  Prettier, EditorConfig.

## First run

```bash
git clone https://github.com/rafaelahenriques/mongmo.git && cd mongmo
nvm use
npm ci

# A local backend with every migration and the demo data:
npx supabase init            # once; keep the generated supabase/config.toml out of commits
# In supabase/config.toml, under [db.seed], set: sql_paths = ["./base.sql", "./seed.sql"]
npx supabase start           # prints the API URL and anon key
npx supabase db reset        # applies the migrations, the café's data and the demo pop-ups

cp .env.example .env         # then fill in the URL and anon key from `supabase start`
npx expo run:ios             # or run:android; builds and opens the app
```

After the first build, `npm start` is enough until a native package
changes.

The `.env` holds only public values (`EXPO_PUBLIC_*`). Never put the
service_role key there.

## Everyday commands

| Command | Does |
|---|---|
| `npm start` | Metro, for the installed development build |
| `npm run web` | The web version in a browser |
| `npm run verify` | Lint, formatting, types, unit tests (what CI runs first) |
| `npm run format` | Fixes formatting |
| `npm test` | Unit tests |
| `npm run test:integration` | Tests against the local Supabase (needs `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from `supabase status`) |
| `npm run test:a11y` | Every web screen through axe; see below |
| `npm run privacy:page` | Rebuilds `public/privacy.html` after editing the policy |
| `npm run audit:deps` | Checks every dependency on npm (downloads, maintainers) |

### The accessibility walk-through

```bash
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 EXPO_PUBLIC_SUPABASE_ANON_KEY=… \
  npx expo export --platform web --output-dir dist
npm run serve:web -- dist 8090 http://127.0.0.1:54321 &
npx playwright install chromium     # once
APP_URL=http://localhost:8090 npm run test:a11y
A11Y_COLOR_SCHEME=dark APP_URL=http://localhost:8090 npm run test:a11y   # dark mode
```

### End-to-end tests

Maestro flows on a simulator: [`tests/e2e/README.md`](../tests/e2e/README.md).

## Becoming an owner (staff screens)

See `supabase/README.md` → Becoming an owner.

## Troubleshooting

`supabase/README.md` → Troubleshooting covers the usual ones (empty
screens, missing env values, `ECONNREFUSED`).
