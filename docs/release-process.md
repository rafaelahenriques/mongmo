# Release process

From `main` to the App Store and Google Play.

## Versions

- **Version** (what people see: 1.4.0) follows [Semantic Versioning](https://semver.org/):
  - **major** when an old app version stops working with the backend (rare);
  - **minor** for new features (`feat`);
  - **patch** for fixes only (`fix`).
- It lives in one place, `package.json`; `app.config.ts` reads it.
- **Build numbers** (iOS build number, Android version code) are kept by
  EAS (`appVersionSource: remote`) and go up by themselves on every
  production build.
- Each release is a **tag** `v1.4.0` on `main`, and a GitHub release with
  its changelog.
- The version is also the **runtime version** for over-the-air updates:
  an update only reaches builds of the same version. So a release that
  changes native code (a new native package, `app.json` plugins or
  permissions, an SDK upgrade) always gets a new version, never an
  over-the-air update ([`DEPLOYMENT.md`](DEPLOYMENT.md#over-the-air-updates)).

## The pipeline

| When | Workflow | Does |
|---|---|---|
| Every push and pull request | `ci.yml` | Lint, formatting, types, unit tests, audit, web build, integration tests, accessibility |
| Pull request opened or renamed | `pr-title.yml` | The title is a Conventional Commit |
| Merge to `main` | `preview.yml` | Staging: migrations, then internal iOS and Android builds (once `STAGING_AUTO_DEPLOY` is on) |
| Pull request labelled `preview` | `preview.yml` | Staging builds of that branch (app only) |
| Tag `v*.*.*` pushed | `release.yml` | GitHub release from the changelog, then production: migrations and builds after an approval, sent to TestFlight and Play internal testing (once `STORE_SUBMIT` is on) |
| By hand | `deploy.yml` | Any of the above for staging or production |
| Every night | `retention.yml` | Deletes data past its retention period |

## Cutting a release

1. **Check `main`**: CI green; staging tested on a phone (the checklist
   below).
2. **Changelog**: in `CHANGELOG.md`, rename `## [Unreleased]` to
   `## [1.4.0] - 2026-11-20` and add a fresh empty `## [Unreleased]` above
   it. Write for customers, not developers.
3. **Bump the version** on a branch, through a pull request (`main` is
   protected):
   ```bash
   git switch main && git pull
   git switch -c release/1.4.0
   npm version minor --no-git-tag-version      # or patch / major: package.json and the lockfile
   git commit -am "chore(release): 1.4.0"      # with the CHANGELOG.md change
   git push -u origin release/1.4.0            # open the pull request, merge it when green
   ```
4. **Tag the merge** on `main`; this starts the release:
   ```bash
   git switch main && git pull
   git tag v1.4.0 && git push origin v1.4.0
   ```
   The release workflow stops if the tag and `package.json` disagree, or
   the changelog has no section for it.
5. **Approve** the production deployment in Actions → Release (the
   `production` environment asks its reviewers).
6. **Builds go to testers**: with `STORE_SUBMIT` on, iOS lands in
   **TestFlight** and Android in Google Play **internal testing**. Without
   it: `eas submit --profile production --platform all --latest`.
7. **Test the store build** from TestFlight / internal testing (same
   checklist).
8. **Promote to the stores**:
   - App Store Connect: the version → add the build → What's New (from the
     changelog) → **Submit for Review**, with **Phased Release** on.
   - Play Console: internal testing → **Promote release** → Production,
     with a **staged rollout** starting at 10%.
9. **Watch for 48 hours** ([`monitoring.md`](monitoring.md)); widen the
   rollout when crash-free sessions hold.

Rolling back: [`DEPLOYMENT.md`](DEPLOYMENT.md) → Rolling back.

## Release checklist

Before tagging:

- [ ] CI green on `main`; Dependabot alerts dealt with
- [ ] Staging build tested on an iPhone and an Android phone: sign up,
      order, owner marks it ready, points and level, redeem a reward,
      Your data → download, delete the account
- [ ] VoiceOver / TalkBack pass over anything new; large text on
- [ ] New personal data or permissions → data inventory, privacy policy,
      App Privacy and Data Safety answers ([`store-release.md`](store-release.md))
- [ ] Migrations work with the version already in the stores
- [ ] Production backup exists (Supabase → Database → Backups)
- [ ] `CHANGELOG.md` section written

After release:

- [ ] Sentry: no new issues, crash-free sessions ≥ 99.5%
- [ ] Phased release / staged rollout widened
- [ ] Unreleased section empty and ready

## First release only

- [ ] `npx eas-cli init`, commit the project id ([`DEPLOYMENT.md`](DEPLOYMENT.md))
- [ ] Apple: App Store Connect app created; add its **Apple ID** (the
      number in App Information) to `eas.json` →
      `submit.production.ios.ascAppId`; `eas credentials` → App Store
      Connect API key
- [ ] Google: Play Console app created; **upload the first build by hand**
      (Play requires it); then `eas credentials` → Google service account
      key for submissions
- [ ] The store listings, screenshots and declarations:
      [`store-release.md`](store-release.md)
- [ ] GitHub settings: [`github-setup.md`](github-setup.md)

## Upgrading the Expo SDK

Dependabot leaves SDK packages' minor and major versions alone, on
purpose. Once per SDK release, on a branch: `npx expo install expo@^NN`
then `npx expo install --fix`, read the SDK's changelog, rebuild the
development build, run everything, and release it as a minor version.
