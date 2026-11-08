# Security policy

## Reporting a problem

Please report security problems privately, never as a public issue:

- on GitHub: **Security → Report a vulnerability** on this repository
  (a private advisory only the maintainers see), or
- by email: hello@mongmo-store.com, subject "Security".

Say what you found, how to reproduce it, and what someone could do with it.
Please don't access other people's data beyond what you need to show the
problem, and don't run tests that slow the service down for others.

## What happens next

| When | What |
|---|---|
| 3 working days | We confirm we've received it |
| 10 working days | We tell you how serious we think it is and what we'll do |
| As soon as it's fixed | We tell you, and credit you if you'd like |

If people's personal data was exposed, we follow our incident plan
([`docs/incident-response.md`](docs/incident-response.md)), including
telling the Belgian Data Protection Authority within 72 hours where the law
requires it.

## Supported versions

The latest version in the App Store and on Google Play, and the code on
`main`. Older app versions get fixes through an update.

## In scope

The Mongmo iOS and Android apps, the web app, and the database rules and
functions in `supabase/`. Our providers' own services (Supabase, Sentry,
Apple, Google) have their own programmes.

## How the app is protected

[`docs/security-audit.md`](docs/security-audit.md) lists what's checked and
how; [`docs/security.md`](docs/security.md) lists the settings each
environment needs.
