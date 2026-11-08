# End-to-end tests (Maestro)

Flows that drive the real app on a simulator or phone: sign up, order,
Your data, delete the account. They complement the unit and integration
tests (logic and database) and the web accessibility walk-through
(`tests/a11y`).

Status: written against the app's labels; not yet run in CI, because they
need an iOS simulator or Android emulator with a build installed.

## Run them

1. Install Maestro: https://docs.maestro.dev/getting-started/installing-maestro
2. Install a development or staging build on a simulator or emulator
   (`npx expo run:ios`, or `eas build --profile development-simulator`).
   It must point at a Supabase project with the seed data.
3. Run, with the app id of that build:

   ```bash
   # iOS (development build)
   maestro test -e APP_ID=com.mongmostore.app.dev tests/e2e
   # Android (development build)
   maestro test -e APP_ID=com.mongmostore.app.dev tests/e2e
   ```

   Staging builds end in `.staging` instead of `.dev`.

`sign-up` makes a fresh account each run; the others continue as that
account, and `delete-account` removes it at the end.

## In CI later

EAS can run these on its own simulators after a build (EAS Workflows,
`type: maestro`), or Maestro Cloud can. Either needs an account; see
docs/release-process.md.
