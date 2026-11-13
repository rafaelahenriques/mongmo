# Store listings

The texts for the App Store and Google Play, written from what the app
actually does. Paste them as they are; the limits are checked
(`npm run store:listing`, also in CI). Each store gets its own version: Apple
rejects listings that mention Android or Google Pay, and Google Play has
no reason to mention Apple Pay.

## App Store (App Store Connect → the app → App Information and the version)

**Name** (30): `Mongmo`

**Subtitle** (30): `Bánh mì, pop-ups and rewards`

**Promotional text** (170, can change without a review):

```
Order your bánh mì ahead, pay in the app or at the counter, and collect it hot. Find our pop-ups on the map and earn rewards every time.
```

**Keywords** (100, commas, no spaces, the name isn't needed):

```
banh mi,vietnamese,food,order ahead,pickup,pop-up,rewards,loyalty,kortrijk,bakery,stamps,cafe,lunch
```

**Description** (4000):

```
Mongmo makes Vietnamese bánh mì, springrolls and stews in Kortrijk, and takes them on the road to pop-ups. The app is the quickest way to eat with us.

ORDER AHEAD
• Pick a time at the café or a live pop-up, and your order is ready when you arrive.
• Choose your dip and extras on each dish.
• Every dish shows its allergens before you order.
• Pay in the app with card, Apple Pay or Bancontact, or pay at the counter when you collect it.
• Follow your order as it's made, and show your pickup code at the counter.

FIND THE POP-UPS
• See where we pop up next, on a map or in a list, with how busy it is right now.
• Get a nudge when you're close to one that's open, if you want it.
• Add a pop-up to your calendar and get directions in one tap.

EARN AS YOU EAT
• Collect points for every order and fill your stamp card.
• Swap points for rewards: stickers, money off, a free bánh mì.
• Level up from Dough to Crisp for perks along the way.
• Check in at a pop-up with its QR code and take on challenges: a photo, a vote, a taste test, a dance.
• Join the leaderboard if you like, and share your best photo in Photos of the week.

YOURS TO CONTROL
• No ads, no tracking. Crash reports only if you say yes.
• See, download or delete your data from Settings, any time.
• Supports dark mode, larger text and VoiceOver.
```

**What's New** (first release): `The first Mongmo app: order ahead, pop-ups and rewards.`

**Support URL**: `https://www.mongmo-store.com` · **Privacy Policy URL**: the
privacy page (`docs/store-release.md` → blockers) · **Category**: Food & Drink

**Screenshot captions** (6.9" iPhone, 1320 × 2868; in this order):

1. Home — `Order ahead, collect it hot`
2. Menu — `Bánh mì, springrolls and stews`
3. A dish — `Pick your dip. See every allergen.`
4. Checkout — `Pay in the app or at pickup`
5. Pop-ups map — `Find our next pop-up`
6. Wallet — `Earn points, unlock rewards`
7. Leaderboard — `See your spot this week`

## Google Play (Play Console → Grow → Store presence → Main store listing)

**App name** (30): `Mongmo`

**Short description** (80):

```
Order bánh mì ahead, find our pop-ups and earn rewards with every bite.
```

**Full description** (4000):

```
Mongmo makes Vietnamese bánh mì, springrolls and stews in Kortrijk, and takes them on the road to pop-ups. The app is the quickest way to eat with us.

ORDER AHEAD
• Pick a time at the café or a live pop-up, and your order is ready when you arrive.
• Choose your dip and extras on each dish.
• Every dish shows its allergens before you order.
• Pay in the app with card, Google Pay or Bancontact, or pay at the counter when you collect it.
• Follow your order as it's made, and show your pickup code at the counter.

FIND THE POP-UPS
• See where we pop up next, on a map or in a list, with how busy it is right now.
• Get a nudge when you're close to one that's open, if you want it.
• Add a pop-up to your calendar and get directions in one tap.

EARN AS YOU EAT
• Collect points for every order and fill your stamp card.
• Swap points for rewards: stickers, money off, a free bánh mì.
• Level up from Dough to Crisp for perks along the way.
• Check in at a pop-up with its QR code and take on challenges: a photo, a vote, a taste test, a dance.
• Join the leaderboard if you like, and share your best photo in Photos of the week.

YOURS TO CONTROL
• No ads, no tracking. Crash reports only if you say yes.
• See, download or delete your data from Settings, any time.
• Supports dark theme, larger text and TalkBack.
```

**Graphics**: icon 512 × 512, feature graphic 1024 × 500 (a dish photo with
the wordmark, no text promising prices or awards), at least 2 phone
screenshots (1080 × 1920 or larger), the same seven as the App Store.
**Category**: Food & Drink · **Contact email**: `hello@mongmo-store.com`

## What could get it rejected, and how this avoids it

| Risk | Rule | Here |
|---|---|---|
| Reviewer can't sign in or the server is empty | Apple 2.1, Google "App access" | A reviewer account with an order and points (`scripts/reviewer-account.mjs`), the production menu and at least one upcoming pop-up live during review |
| Mentioning the other platform | Apple 2.3.10 | The App Store text names Apple Pay only; the Play text Google Pay only |
| Payments for food going through in-app purchase | Apple 3.1.3(e), Google Payments policy | Food is a physical good: Stripe is the right way, nothing to change |
| Screenshots that aren't the app | Apple 2.3.3, Google metadata policy | Take them from a real build with real menu data, no mock-ups |
| Superlatives, prices or awards in the text | Apple 2.3.7, Google metadata policy | None used ("best", "#1", "cheapest", review quotes) |
| Keyword stuffing, other brands | Apple 2.3.7 | Keywords are generic food words; no competitor names |
| Background location without a clear reason | Apple 5.1.1, Google location policy | Explained in the permission text and review notes; off until turned on |
| User photos without reporting | Apple 1.2, Google UGC policy | Report on every shared and profile photo; staff review in Owner tools |
| Account deletion only by email | Apple 5.1.1(v), Google account deletion | In the app: Settings → Delete account; on the web: the privacy page |
| Allergens missing | EU food law (not a store rule, but a real risk) | Fill them in before launch (`supabase/base.sql`); the app shows "not listed yet" until then |
