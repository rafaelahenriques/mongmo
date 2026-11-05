/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Mongmo palette, from the brand style guide and the app design in Figma:
 * one accent colour, Weathered Sage, for what is live and for the main
 * action; everything else is near-black ink, off-white paper and greys
 * (Aged Concrete White as "stone", Shadow Grey for quiet text).
 *
 * The brand never uses pure white or pure black. Paper is the near-white
 * page and Ink the near-black of the dark mode, camera screens and QR code.
 * Text colours pass WCAG AA (4.5:1) on every surface they sit on.
 */
export const Paper = '#FAF9F5';
export const Ink = '#1C1D19';
/** Weathered Sage. */
export const Sage = '#80C7BC';

/** Paper or Ink at `opacity`, for scrims, glass buttons and bar tracks. */
export const paperAlpha = (opacity: number) => `rgba(250, 249, 245, ${opacity})`;
export const inkAlpha = (opacity: number) => `rgba(28, 29, 25, ${opacity})`;

export const Colors = {
  light: {
    /** Ink — 12.6:1 on paper, 11:1 on light stone. */
    text: '#2F302B',
    /** Paper page. */
    background: Paper,
    /** Cards, fields and sheets: a hair lighter than the page. */
    backgroundElement: '#FEFEFC',
    /** Light stone: soft buttons, icon squares, highlighted blocks. */
    backgroundSelected: '#ECEAE3',
    /** Shadow Grey — 5.5:1 on paper, 4.8:1 on light stone. */
    textSecondary: '#65665D',
    /** Aged Concrete White ("stone"): hairlines and dividers only (decorative). */
    border: '#D6D1C4',
    /** The edge of a control you must see to use (text fields, switches off,
     *  time pills): 3.15:1 or more on every light surface (WCAG 1.4.11). */
    outline: '#86837A',
    /** The big quiet word next to a number ("25 POINTS"), unavailable days:
     *  large text, 3.15:1 or more on every light surface. */
    faded: '#86837A',
    /** Card shadow colour. */
    shadow: 'rgba(46, 46, 43, 0.10)',
    /** Dark pill buttons and round icon buttons, paper text (12.6:1). */
    primary: '#2F302B',
    onPrimary: Paper,
    /** Dark bands: the tab bar, "Next up", dark block buttons. */
    surfaceDark: '#2F2F2B',
    onSurfaceDark: Paper,
    /** Quieter text on the dark band (dates under "Next up"): 7.8:1. */
    onSurfaceDarkMuted: '#C9C5B9',
    /** The top bar on each tab: sage, with the wordmark and icons in ink. */
    band: Sage,
    onBand: Ink,
    bandMark: Ink,
    /** Sage graphics: stamps, rings, progress, the live pin. */
    brand: Sage,
    /** Weathered Sage: the main call to action and "live", ink on it (6.9:1). */
    brandFill: Sage,
    onBrand: '#2F302B',
    /** The second word on sage ("POINTS" by the number): large text, 3.5:1. */
    onBrandSoft: '#44615A',
    /** Deep sage for the rare sage text (6.7:1 on paper). */
    primaryText: '#2B6259',
    /** Board cream, from the menu board: small highlights. */
    accent: '#FBE3B0',
    onAccent: '#2F302B',
    /** AA (4.5:1) on paper and light stone. */
    success: '#21653F',
    danger: '#A33024',
    warning: '#7A5115',
  },
  dark: {
    /** Warm off-white — 13.9:1 on the page. */
    text: '#F2F0EA',
    background: Ink,
    backgroundElement: '#272822',
    backgroundSelected: '#34352E',
    /** 6:1 on fills. */
    textSecondary: '#B8B4A8',
    border: '#45463F',
    /** 3.3:1 or more on every dark surface. */
    outline: '#86847B',
    faded: '#86847B',
    shadow: inkAlpha(0),
    primary: '#ECEAE3',
    onPrimary: '#22231E',
    surfaceDark: '#2F2F2B',
    onSurfaceDark: Paper,
    onSurfaceDarkMuted: '#C9C5B9',
    /** A deep sage, so the status bar's light text still reads on it. */
    band: '#23332F',
    onBand: '#F2F0EA',
    bandMark: Sage,
    brand: Sage,
    brandFill: Sage,
    onBrand: '#22231E',
    onBrandSoft: '#44615A',
    primaryText: Sage,
    accent: '#FBE3B0',
    onAccent: '#22231E',
    success: '#3BB16F',
    danger: '#E18278',
    warning: '#D68D24',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/**
 * Brand typefaces. Titles, names, labels, buttons and big numbers: League
 * Spartan Black in capitals, bundled (see FONT_ASSETS) and with every
 * Vietnamese letter. Text: Helvetica (see BodyFont).
 */
export const FontFamily = {
  /** League Spartan Black: titles, names and big numbers, in capitals. */
  display: 'LeagueSpartan_900Black',
  /** The same face for card titles, labels and buttons. */
  heavy: 'LeagueSpartan_900Black',
} as const;

/** Helvetica on the web, falling back to its look-alikes. */
const HELVETICA_WEB = '"Helvetica Neue", Helvetica, Arial, sans-serif';

/**
 * Text in Helvetica. It's a licensed font, so it isn't bundled: iPhones and
 * iPads have Helvetica Neue built in and the app uses theirs. Android has
 * no Helvetica, so it uses its own Roboto; the web, Helvetica or Arial.
 * Spread a weight into a style: `{ ...BodyFont.bold, fontSize: 14 }`.
 */
export const BodyFont = Platform.select({
  ios: {
    regular: { fontFamily: 'HelveticaNeue' },
    medium: { fontFamily: 'HelveticaNeue-Medium' },
    bold: { fontFamily: 'HelveticaNeue-Bold' },
  },
  android: {
    regular: { fontFamily: 'sans-serif' },
    medium: { fontFamily: 'sans-serif-medium' },
    bold: { fontFamily: 'sans-serif', fontWeight: '700' as const },
  },
  default: {
    regular: { fontFamily: HELVETICA_WEB, fontWeight: '400' as const },
    medium: { fontFamily: HELVETICA_WEB, fontWeight: '500' as const },
    bold: { fontFamily: HELVETICA_WEB, fontWeight: '700' as const },
  },
});

/**
 * Corner radii. Round things sit on the page (pill buttons, chips, fields);
 * blocks that attach to a card or the screen edge are square.
 */
export const Radius = {
  small: 8,
  medium: 12,
  large: 20,
  pill: 999,
} as const;

/** Shadow under the white cards (task cards, pop-up rows, ticket). */
export const CardShadow = '0px 6px 9px rgba(46, 46, 43, 0.10)';

/** Page side margin. */
export const PageInset = 20;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
