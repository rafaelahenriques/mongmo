# Security incident response plan

What to do when personal data may have been exposed, lost or changed
without permission: a leaked key, a database rule that let someone read
others' data, a stolen laptop with access, a hacked account at a provider.

**Roles.** Incident lead: Rafaela Henriques. Contact for the authority and
users: hello@mongmo-store.com. Write down who else is involved as they
join. Keep a log from the first minute: time, what was seen, what was done,
by whom. It is the record the authority can ask for.

## 1. Detect

Signs to act on:

- Sentry: a burst of new errors, especially `permission denied` or failed
  sign-ins.
- Supabase: Advisors, unusual traffic or database load, auth logs with many
  failed sign-ins from one place, rows changing that shouldn't.
- GitHub: a secret scanning or push protection alert; a Dependabot alert
  for a package the app uses at runtime.
- A report from a user, a researcher (see `SECURITY.md`) or a provider.

Start the clock when you have reasonable certainty that personal data was
affected: the 72 hours below run from then.

## 2. Contain (first hours)

Stop the damage first, investigate second.

| What happened | Do now |
|---|---|
| A key leaked (service_role, database password, Expo or Sentry token) | Rotate it: Supabase → Settings → API (new secret key) or Database (new password); expo.dev → Access tokens; update the GitHub environment secrets. Revoke the old one. |
| A database rule exposes data | Write a migration that closes it and deploy it (`docs/DEPLOYMENT.md`). If that takes too long, turn off the affected feature or pause the project (Supabase → Settings → Pause). |
| An account is being abused | Supabase → Authentication → the user → Ban, and sign them out everywhere. |
| A bad release | Roll back (`docs/DEPLOYMENT.md` → Rolling back). |
| A team member's device or account is compromised | Remove their access (GitHub, Supabase, Expo, Sentry), rotate every key they could reach. |

Keep evidence: don't delete logs, rows or the affected build. Export the
relevant Supabase logs and note their time window.

## 3. Assess (within 24 hours)

Answer, in the log:

1. What data: which tables and fields, and whether it includes anything
   sensitive (location history, photos, email addresses).
2. Whose: how many people, which accounts (query by time window and ids).
3. What happened to it: read, copied, changed, deleted, or only exposed.
4. Since when, and is it stopped.
5. The risk to those people: identity misuse, phishing using their email,
   being located, embarrassment from photos.

## 4. Notify the authority: within 72 hours (GDPR art. 33)

Unless the breach is **unlikely to result in a risk** to people (for
example, encrypted data whose key is safe, or data already public), notify
the **Belgian Data Protection Authority** within 72 hours of becoming
aware, using its online breach form: www.dataprotectionauthority.be
(Gegevensbeschermingsautoriteit / Autorité de protection des données).

Include: what happened; the kinds and approximate numbers of people and
records; the likely consequences; what you did and will do; a contact
person. If you don't know everything yet, notify within 72 hours anyway
and send the rest later. If you notify late, say why.

Record every breach in the log, notified or not, with the reasoning (art.
33(5)).

## 5. Tell the people affected: without undue delay (GDPR art. 34)

When the breach is likely to result in a **high risk** to them (for
example, their location history, photos or email and password reached
someone else), tell them directly, by email to each affected account, in
plain language:

> Subject: Something happened to your Mongmo data
>
> On [date] we found that [what happened, in one sentence]. It affected
> [what data] of your account. [What it means for you, in one sentence.]
>
> What we've done: [closed the problem, reset sessions, informed the Data
> Protection Authority].
>
> What you can do: [change your password if you use it elsewhere; be wary
> of emails pretending to be from Mongmo; we will never ask for your
> password].
>
> We're sorry. Questions: hello@mongmo-store.com.

Don't speculate, don't minimise, don't blame. If emailing everyone isn't
possible, a clear notice in the app and on the website instead.

## 6. Recover and learn (within two weeks)

- Fix the cause for good, with a test that would have caught it (add it to
  `tests/integration/accessControl.test.ts` if it's about access).
- Check nothing else has the same weakness.
- Write a short report in the log: timeline, cause, impact, what changed.
- Update this plan if a step didn't work.
