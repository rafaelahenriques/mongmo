/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Mongmo palette, contemporary: warm off-white background, white cards,
 * Cool Brown ink and pill buttons, Bold Red as the one accent (live, points,
 * the main call to action), Light Blue for soft highlights.
 * Contrast (WCAG) is noted where text sits on a color.
 */
export const Colors = {
  light: {
    /** Cool Brown ink — 13.9:1 on background, 15.8:1 on cards. */
    text: '#2A2020',
    /** Warm off-white page. */
    background: '#F4EFE9',
    /** Cards and sheets. */
    backgroundElement: '#FFFFFF',
    /** Muted fills: chips, inputs, icon circles, pressed rows. */
    backgroundSelected: '#EDE6DE',
    /** Muted ink — 5:1 on background, 4.6:1 on backgroundSelected. */
    textSecondary: '#705E58',
    /** Hairline dividers. */
    border: '#E6DDD3',
    /** Soft card shadow color. */
    shadow: 'rgba(42, 32, 32, 0.08)',
    /** Pill buttons: Cool Brown with white text (14.5:1). */
    primary: '#342626',
    onPrimary: '#FFFFFF',
    /** Bold Red, decorative: big numerals, dots, icons (large-text use only). */
    brand: '#E8492A',
    /** Red fill that carries white text at AA (4.7:1) — the main call to action. */
    brandFill: '#D23F1F',
    onBrand: '#FFFFFF',
    /** Red for small text on background/cards (4.6:1 / 5.3:1). */
    primaryText: '#C6391B',
    /** Light Blue soft highlight — brown text on it is 11:1. */
    accent: '#BDDDFC',
    onAccent: '#2A2020',
    /** AA on cards (>= 4.5:1). */
    success: '#0F6B33',
    danger: '#B3261E',
    warning: '#8A5300',
  },
  dark: {
    /** Soft Cream ink — 16.8:1 on background. */
    text: '#FDF1E2',
    background: '#161111',
    backgroundElement: '#231B1B',
    backgroundSelected: '#302626',
    /** 8.4:1 on background, 6.6:1 on backgroundSelected. */
    textSecondary: '#BCAAA3',
    border: '#3A2E2E',
    shadow: 'rgba(0, 0, 0, 0)',
    /** Inverted pill: cream with brown text (14.2:1). */
    primary: '#FDF1E2',
    onPrimary: '#2A2020',
    brand: '#F0553A',
    brandFill: '#D23F1F',
    onBrand: '#FFFFFF',
    /** 6.6:1 on cards. */
    primaryText: '#FF7A5C',
    accent: '#BDDDFC',
    onAccent: '#2A2020',
    success: '#6EE7A0',
    danger: '#FF8A80',
    warning: '#F5B24A',
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
