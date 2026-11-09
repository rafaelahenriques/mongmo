# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v58.0.0/ before writing any code.

# Git and GitHub

## Branches

- `main` is the release branch. It only changes through merged pull requests.
- Every other branch is named `<type>/<short-description>`, lowercase with hyphens, saying what it's for:
  `feat/` (new features), `fix/` (bug fixes), `chore/` (upkeep, dependencies), `docs/`, `refactor/`, `test/`.
  For example `feat/ordering-and-buttons`, `fix/android-map-crash`.
- Never random words or numbers in a branch name, and never `claude`. If a session starts on a generated branch
  (such as `claude/cool-feynman-…`), make a properly named branch from `main` and work there; never push the generated
  one.
- Delete a branch once its pull request is merged.

## Authorship

- Every commit is authored by Rafaela Henriques `<73140603+rafaelahenriques@users.noreply.github.com>`, and only her.
- Never a co-author: no `Co-Authored-By` lines, in any commit.
- Never Claude: no `Claude-Session` lines, no "Generated with Claude Code" or Claude Code footers, no session links, and
  no mention of Claude or Anthropic in commit messages, pull request titles or descriptions, GitHub comments, code or
  docs. If a tool adds one to a pull request description, remove it.

## Pull requests

- The title is a Conventional Commit (`feat(order): …`, `fix: …`), and the description follows
  `.github/PULL_REQUEST_TEMPLATE.md`.
- Run `npm run verify` before pushing.
