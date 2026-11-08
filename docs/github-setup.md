# GitHub settings

Settings that live on github.com, not in the code. Do them once.

## General (Settings → General)

- **Description:** "Mongmo: order ahead, pop-ups, challenges and rewards
  for a Vietnamese café brand in Belgium. Expo (React Native) + Supabase."
- **Website:** the case study or the web app.
- **Topics:** `expo`, `react-native`, `typescript`, `supabase`,
  `postgresql`, `expo-router`, `tanstack-query`, `zustand`, `ios`,
  `android`, `mobile-app`, `loyalty-program`.
- **Pull Requests:** allow **squash merging** only (default message: pull
  request title); turn on **Always suggest updating pull request
  branches** and **Automatically delete head branches**.

## Protect `main` (Settings → Rules → Rulesets → New branch ruleset)

Name `main`, enforcement **Active**, target the default branch:

- [x] Restrict deletions
- [x] Block force pushes
- [x] Require a pull request before merging: 1 approval if you're more than
  one person (0 otherwise), dismiss stale approvals, require conversation
  resolution
- [x] Require status checks to pass, branches up to date:
  - `Lint, format, types, unit tests, build`
  - `Integration tests (local Supabase)`
  - `Accessibility, light mode (every screen, axe)`
  - `Accessibility, dark mode (every screen, axe)`
  - `Accessibility, light mode, high contrast (every screen, axe)`
  - `Accessibility, dark mode, high contrast (every screen, axe)`
  - `Conventional Commit title`
- [x] Require linear history

Add yourself to the bypass list only if you must merge in an emergency.

Protect tags too: a second ruleset, target tags `v*`, restrict creation
and deletion to admins, so only a deliberate release makes one.

## Security (Settings → Advanced Security / Code security)

Turn on:

- **Dependency graph**
- **Dependabot alerts** and **Dependabot security updates** (version
  updates come from `.github/dependabot.yml`)
- **Secret scanning** and **Push protection** (blocks a push that contains a
  key)
- **Private vulnerability reporting** (`SECURITY.md` points to it)
- **Code scanning → CodeQL default setup**, languages JavaScript/TypeScript
  and Actions

## Actions (Settings → Actions → General)

- Allow actions: **Allow all actions and reusable workflows** is fine:
  every workflow pins its actions to a commit, and Dependabot updates them.
- Workflow permissions: **Read repository contents** (the default); the
  release job asks for write itself.
- Fork pull request workflows: require approval for first-time
  contributors.

## Environments (Settings → Environments)

| Environment | Secrets | Protection |
|---|---|---|
| `staging` | `SUPABASE_DB_URL`, `EXPO_TOKEN` | — |
| `production` | `SUPABASE_DB_URL`, `EXPO_TOKEN` | Required reviewers (you); deployment branches and tags: `main` and `v*` |
| `retention` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (production's) | Deployment branches: `main` |

What each secret is: [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Variables (Settings → Secrets and variables → Actions → Variables)

Each switches on an automation once its environment is ready:

| Variable | `true` turns on |
|---|---|
| `STAGING_AUTO_DEPLOY` | Staging deploy on every merge to `main`, and `preview`-labelled pull requests |
| `STORE_SUBMIT` | Production builds sent to TestFlight and Play internal testing |
| `RETENTION_ENABLED` | The nightly retention job |

## Labels (Issues → Labels)

Create `preview` (staging builds of a pull request), `dependencies`
(Dependabot), `bug` and `enhancement` (issue templates) if missing.

## Projects

Optional: a project board (Projects → New → Board) with columns Backlog,
Next, In progress, In review, Done; set it to add new issues automatically.
