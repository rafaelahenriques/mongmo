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
    /** Aged Concrete White ("stone"): hairlines, outlines, faded words. */
    border: '#D6D1C4',
    /** The big faded word next to a number ("25 POINTS"): decorative. */
    faded: '#D6D1C4',
    /** Card shadow colour. */
    shadow: 'rgba(46, 46, 43, 0.10)',
    /** Dark pill buttons and round icon buttons, paper text (12.6:1). */
    primary: '#2F302B',
    onPrimary: Paper,
    /** Dark bands: the tab bar, "Next up", dark block buttons. */
    surfaceDark: '#2F2F2B',
    onSurfaceDark: Paper,
    /** Sage graphics: stamps, rings, progress, the live pin. */
    brand: Sage,
    /** Weathered Sage: the main call to action and "live", ink on it (6.9:1). */
    brandFill: Sage,
    onBrand: '#2F302B',
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
    faded: '#5A5B53',
    shadow: inkAlpha(0),
    primary: '#ECEAE3',
    onPrimary: '#22231E',
    surfaceDark: '#2F2F2B',
    onSurfaceDark: Paper,
    brand: Sage,
    brandFill: Sage,
    onBrand: '#22231E',
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
 * Brand typefaces, loaded at startup (see FONT_ASSETS). Outfit for headings,
 * card titles and the word tab bar; Be Vietnam Pro for text. Both cover
 * every Vietnamese diacritic (Cà phê sữa đá, Bánh mì…).
 *
 * Each weight is its own family: pick the family, don't set `fontWeight`.
 */
export const FontFamily = {
  body: 'BeVietnamPro_400Regular',
  bodyMedium: 'BeVietnamPro_500Medium',
  bodySemiBold: 'BeVietnamPro_600SemiBold',
  bodyBold: 'BeVietnamPro_700Bold',
  /** Outfit SemiBold: titles, names and big numbers. */
  display: 'Outfit_600SemiBold',
  /** Outfit Black: uppercase card titles, labels and the tab bar. */
  heavy: 'Outfit_900Black',
} as const;

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

/**
 * The word tab bar sits below the screens (it takes its own space), so
 * screens need no extra inset for it.
 */
export const BottomTabInset = 0;
export const TopTabInset = 0;
export const MaxContentWidth = 800;
