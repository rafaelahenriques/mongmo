/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Mongmo brand palette:
 *   Weathered Sage #80C7BC · Faded Warm Cream #F1E4B2 · Dusty Interior Rose
 *   #E5D4D3 · Aged Concrete White #D6D1C4 · Shadow Grey #65665D.
 * They are soft tones, so they're surfaces and fills; the text colours are
 * deeper shades of them, chosen to pass WCAG AA (4.5:1) on every surface
 * they sit on: the page (a light tint of concrete), white cards, rose fills
 * and cream highlights. Ratios are noted against the weakest of those.
 */
export const Colors = {
  light: {
    /** Ink, from Shadow Grey — 9.4:1 on rose, 13.5:1 on cards. */
    text: '#2E2F2A',
    /** Aged Concrete White lightened to a warm off-white page. */
    background: '#F1EFEA',
    /** Cards and sheets. */
    backgroundElement: '#FFFFFF',
    /** Dusty Interior Rose: fields, chips, icon circles, pressed rows. */
    backgroundSelected: '#E5D4D3',
    /** Muted ink — 4.8:1 on rose, 6:1 on the page. */
    textSecondary: '#5A5B53',
    /** Aged Concrete White: hairline dividers and outlines. */
    border: '#D6D1C4',
    /** Soft card shadow colour. */
    shadow: 'rgba(46, 47, 42, 0.10)',
    /** Shadow Grey pill buttons and dark cards, white text (5.8:1). */
    primary: '#65665D',
    onPrimary: '#FFFFFF',
    /** Deep sage, decorative: big numerals, stars, dots (3:1, large only). */
    brand: '#388075',
    /** Weathered Sage: the main call to action, with ink on it (6.9:1). */
    brandFill: '#80C7BC',
    onBrand: '#2E2F2A',
    /** Deep sage for small text: links, "Live" (4.9:1). */
    primaryText: '#2B6259',
    /** Faded Warm Cream highlight: rewards, pickup code, avatar. */
    accent: '#F1E4B2',
    onAccent: '#2E2F2A',
    /** AA (4.5:1) on every light surface. */
    success: '#21653F',
    danger: '#A33024',
    warning: '#7A5115',
  },
  dark: {
    /** Warm white ink — 10.9:1 even on fills. */
    text: '#F2F0EA',
    /** Shadow Grey, deepened. */
    background: '#1C1D19',
    backgroundElement: '#272822',
    backgroundSelected: '#34352E',
    /** 6:1 on fills. */
    textSecondary: '#B8B4A8',
    border: '#3B3C35',
    shadow: 'rgba(0, 0, 0, 0)',
    /** Aged Concrete pill with ink (10.4:1). */
    primary: '#D6D1C4',
    onPrimary: '#22231E',
    brand: '#80C7BC',
    /** Weathered Sage with ink (8.1:1). */
    brandFill: '#80C7BC',
    onBrand: '#22231E',
    /** 6.4:1 on fills. */
    primaryText: '#80C7BC',
    accent: '#F1E4B2',
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
 * Brand typefaces, loaded at startup (see FONT_ASSETS). Be Vietnam Pro for
 * text and Barlow Condensed for the bold street-sign headings — both cover
 * every Vietnamese diacritic (Cà phê sữa đá, Bánh mì…).
 *
 * Each weight is its own family: pick the family, don't set `fontWeight`.
 */
export const FontFamily = {
  body: 'BeVietnamPro_400Regular',
  bodyMedium: 'BeVietnamPro_500Medium',
  bodySemiBold: 'BeVietnamPro_600SemiBold',
  bodyBold: 'BeVietnamPro_700Bold',
  displayBold: 'BarlowCondensed_700Bold',
  display: 'BarlowCondensed_800ExtraBold',
} as const;

/** Corner radii: pills everywhere interactive, soft large cards. */
export const Radius = {
  small: 12,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
/** On web the tabs float over the top of the page instead. */
export const TopTabInset = Platform.select({ web: 64 }) ?? 0;
export const MaxContentWidth = 800;
