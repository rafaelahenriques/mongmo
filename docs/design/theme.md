# Theme

The app's colours and type come from this Material 3 theme:
[Material Theme Builder](http://material-foundation.github.io/material-theme-builder/?primary=%2380C7BC&secondary=%23F1E4B2&tertiary=%23B88F8C&neutral=%23ECEAE3&neutralVariant=%232F302B&bodyFont=Lato&displayFont=League+Spartan&colorMatch=true)
(color match on). `material-theme.json` is its export, kept as the
reference. The tokens the app uses are in `src/constants/theme.ts`.

| Input | Colour | In the app |
|---|---|---|
| Primary | Weathered Sage `#80C7BC` | `brand`, `brandFill`, `band`: the main action, what's live, the top bar |
| Secondary | Cream `#F1E4B2` | `accent`: small highlights |
| Tertiary | Dusty rose `#B88F8C` | `tertiary` (text on it: `onTertiary` `#462928`); not used on a screen yet |
| Neutral | Stone `#ECEAE3` | `backgroundSelected`: soft buttons, icon squares |
| Neutral variant | Ink `#2F302B` | `text`, `primary`: text and the dark pill buttons |

| Type | Font | In the app |
|---|---|---|
| Display, headlines, titles | League Spartan (Black) | `FontFamily.display`, `.heavy` |
| Body and labels | Lato (Regular, Medium, Bold) | `BodyFont` |

Both fonts are bundled (`src/constants/fonts.ts`), never loaded from a
font service, and both have every Vietnamese letter the app uses.

## Contrast levels

The theme's medium- and high-contrast schemes (in `material-theme.json`)
give each scheme two stronger versions: darker text and edges on light,
lighter on dark, the brand colours kept with stronger text on them. Paper
and Ink still replace pure white and black.

| | Main and quiet text | Other text and status colours |
|---|---|---|
| Standard | 4.5:1 or more | 4.5:1 or more |
| Medium | 9:1 or more | 6.9:1 or more |
| High | about 11:1 | 9:1 or more |

Settings → Contrast: **System** (the default) uses High when the phone asks
for more contrast (iOS Increase Contrast, Android high contrast text, the
browser's prefers-contrast), Standard otherwise; or pick Standard, Medium
or High. `tests/unit/contrast.test.ts` checks every level, and the
accessibility walk-through runs in high contrast too.

## Material roles used as they are

| Role | Light | Dark | Token |
|---|---|---|---|
| primary (text in sage) | `#1C6960` | (Sage) | `primaryText` |
| secondaryContainer | `#F1E4B2` | `#F1E4B2` | `accent` |
| tertiaryContainer, onTertiaryContainer | `#B88F8C`, `#462928` | same | `tertiary`, `onTertiary` |
| error | `#BA1A1A` | `#FFB4AB` | `danger` |
| outline | `#777870` | `#91918A` | `outline`, `faded` |
| outlineVariant | `#C7C7BF` | `#464741` | `border` |

## Where the app differs from the scheme, and why

- **No pure white or black.** Material's `#FFFFFF` (on-primary, lowest
  surface) and `#000000` (shadow, scrim) are Paper `#FAF9F5` and Ink
  `#1C1D19`, the brand's near-white and near-black.
- **Page and surfaces** stay Paper and its card white `#FEFEFC` instead of
  Material's slightly pink `#FDF8F7`; dark mode stays on Ink.
- **Buttons.** Material would fill the main button with primary `#1C6960`
  and white text. The app keeps its design: ink pill buttons, and sage for
  the main call to action with ink text on it (6.9:1).
- **Quiet text** stays Shadow Grey `#65665D`: Material's
  `#464741` is too close to the main text colour to read as secondary.

Every text colour passes WCAG AA on the surfaces it's used on; the
accessibility walk-through checks it on every screen.
