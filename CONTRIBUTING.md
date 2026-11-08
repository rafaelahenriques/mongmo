# Contributing

How work gets from an idea to the stores. Setting up a machine:
[`docs/setup.md`](docs/setup.md).

## The flow (GitHub Flow)

1. **Branch from `main`**, named for the change: `feat/pickup-times`,
   `fix/cart-total`, `docs/release-process`.
2. **Commit** in small steps, each a [Conventional Commit](#commit-messages).
3. **Open a pull request** early (a draft is fine). Fill in the template.
4. **CI must be green**: lint, formatting, types, unit tests, dependency
   audit, web build, integration tests against a fresh database, and the
   accessibility walk-through of every screen.
5. **Review**, then **squash and merge**. The pull request title becomes the
   commit on `main`, so it must be a Conventional Commit too (a check
   enforces it).
6. Merging to `main` deploys to **staging** (when switched on). Releases to
   the stores are cut from `main` with a version tag:
   [`docs/release-process.md`](docs/release-process.md).

`main` is protected: no direct pushes, no force-pushes, a pull request with
green checks for every change ([`docs/github-setup.md`](docs/github-setup.md)).

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): what changed`,
in the imperative, lower case, no full stop.

| Type | For | Shows in the changelog |
|---|---|---|
| `feat` | Something new people can do | Added |
| `fix` | A bug fixed | Fixed |
| `perf` | Faster, same behaviour | Changed |
| `refactor` | Code changed, behaviour not | — |
| `docs`, `test`, `style`, `build`, `ci`, `chore` | Everything else | — |
| `revert` | Undoing an earlier commit | Fixed |

Scopes are the app's areas: `order`, `wallet`, `popups`, `challenges`,
`auth`, `privacy`, `a11y`, `db`, `owner`, `deps`, `ci`.

A breaking change (an old app version stops working, a migration that
removes something) gets a `!` and a `BREAKING CHANGE:` line in the body:

```
feat(db)!: remove profiles.bio

BREAKING CHANGE: app versions before 1.3.0 can't save their profile.
```

## Before you push

```bash
npm run verify             # lint, formatting, types, unit tests
npm run format             # fix formatting
npm run test:integration   # if you touched the database (docs/setup.md)
```

## Rules the code keeps

- **Database:** every change is a new numbered migration in
  `supabase/migrations/`; never edit one that has run in production. It
  must work with the app versions already on phones (add first, remove a
  release later). Queries go through the Supabase client or a function with
  parameters, never built from strings. New tables get row-level security
  and a test in `tests/integration/accessControl.test.ts`.
- **Secrets:** never in the code or in `EXPO_PUBLIC_*` variables (those
  ship inside the app). `.env` is never committed.
- **Personal data:** anything new goes in
  `docs/privacy/data-inventory.md`, the privacy policy
  (`src/constants/privacyPolicy.json`, then `npm run privacy:page`) and the
  store declarations (`docs/store-release.md`). Logs go through
  `src/lib/log.ts`, which scrubs them.
- **Accessibility:** every control has a name, a 44 pt target, works with
  the keyboard and a screen reader, and keeps working at 200% text. New
  screens go in the walk-through (`tests/a11y/run.mjs`).
- **Packages:** check the exact name on npm, its weekly downloads and
  maintainers before installing (`npm run audit:deps`). Expo packages with
  `npx expo install`.
- **Fonts** are bundled in the app; nothing loads from a CDN.
- **Colours:** near-white and near-black, never pure `#FFF` or `#000`.

## Reporting bugs and security problems

Bugs and ideas: the issue templates. Security problems: privately, as
[`SECURITY.md`](SECURITY.md) explains, never as a public issue.
