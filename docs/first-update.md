# The first update

How to collect what people think in the first weeks, decide what to fix
first, and get the update through review. Builds and rollouts follow
[release-process.md](release-process.md); what to watch is in
[monitoring.md](monitoring.md).

## Collecting feedback (weeks 1–3)

| Where | What it tells you | How often |
|---|---|---|
| Sentry | Crashes and errors, by version and phone (only from people who said yes) | Daily in week 1, then twice a week |
| App Store and Google Play reviews | What people love and what annoys them | Daily; reply as in [review-replies.md](review-replies.md) |
| hello@mongmo-store.com | Order problems, refunds, ideas | Daily |
| Stripe Dashboard | Failed payments, refunds held up, disputes | Daily in week 1 |
| Staff at the counter | What customers say in person; what slows the kitchen down | A five-minute chat at the end of each week |
| Supabase (Reports) | Slow queries, errors | Weekly |

Put every item in GitHub Issues with one label: `bug`, `idea` or
`content` (menu text, photos, allergens), plus where it came from.

## Deciding what goes in

Sort the list once a week, top to bottom:

1. **Broken money or orders**: a payment taken without an order, a refund
   that didn't go through, an order the kitchen never saw. Fix now, as a
   hotfix, not with the update.
2. **Crashes** affecting more than 0.5% of sessions, or any crash on the
   order or payment screens.
3. **Wrong information**: allergens, prices, opening hours, pop-up times.
   Usually data, not code: fix it in the dashboard the same day.
4. **Things several people report**: the same confusion or request from
   three or more people.
5. **Ideas**: keep the best two or three for the update; the rest wait.

Keep the first update small: the fixes from 1–3 and one or two things from
4. Small updates get through review faster and are easier to roll back.

## Getting it through review

- Write the "What's New" text in plain words: what's fixed and what's new,
  two or three lines. No "bug fixes and improvements" alone.
- If the update changes what data the app collects, update
  [privacy/data-inventory.md](privacy/data-inventory.md), the privacy
  policy and both stores' privacy forms first.
- Check the demo account still works and the review notes still match the
  app ([review-notes.md](review-notes.md)).

## If the update is rejected

1. **Read the exact guideline** the rejection names, and the reviewer's
   screenshots. Most rejections are about something specific and fixable.
2. **Answer in the Resolution Center** (App Store) or Play Console inbox
   within a day: polite, short, quoting the guideline. If the reviewer
   misunderstood (for example, couldn't find a pop-up QR code), explain
   and attach a screenshot or recording; that alone often clears it.
3. **If a change is needed**, make the smallest one that answers the
   point, build again with a new build number, and say in the reply
   what changed.
4. **If you disagree** after replying, Apple has an appeal to the App
   Review Board; Google has an appeal form. Use them for a real
   misunderstanding, not to argue a rule.
5. **The version already in the store keeps working** meanwhile: a
   rejected update never takes the app down.
