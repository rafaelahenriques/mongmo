/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Mongmo palette: Soft Cream paper, Cool Brown ink, Bold Red for actions,
 * Light Blue and a street-food yellow for stickers and highlights.
 * Contrast (WCAG) is noted where text sits on a color.
 */
export const Colors = {
  light: {
    /** Cool Brown ink — 13:1 on background. */
    text: '#342626',
    /** Soft Cream paper. */
    background: '#FDF1E2',
    /** Cards and sheets: a lighter paper that lifts off the background. */
    backgroundElement: '#FFF9F1',
    /** Pressed/selected states, inputs, subtle fills. */
    backgroundSelected: '#F6E4CE',
    /** Muted ink — 6:1 on background, 5.4:1 on backgroundSelected. */
    textSecondary: '#6B5752',
    /** Card/button outlines and hard shadows: the "printed label" look. */
    border: '#342626',
    shadow: '#342626',
    /** Bold Red — button fills and accents. */
    primary: '#E8492A',
    /** On primary: 3.5:1, so only for large bold text (buttons are 20px bold caps). */
    onPrimary: '#FDF1E2',
    /** Red for text on paper (prices, links) — 4.8:1. */
    primaryText: '#C23A1E',
    /** Light Blue stickers — brown text on it is 10:1. */
    accent: '#BDDDFC',
    onAccent: '#342626',
    /** Street-food yellow highlight (points, live) — brown text on it is 9.6:1. */
    highlight: '#F6CF45',
    onHighlight: '#342626',
    /** AA on backgroundElement (>= 4.5:1). */
    success: '#0F6B33',
    danger: '#B3261E',
    warning: '#8A5300',
  },
  dark: {
    /** Soft Cream ink — 13:1 on background. */
    text: '#FDF1E2',
    /** Cool Brown. */
    background: '#342626',
    backgroundElement: '#433331',
    backgroundSelected: '#524039',
    /** 8:1 on background, 6.7:1 on backgroundElement. */
    textSecondary: '#D2BFB3',
    border: '#7C6660',
    shadow: '#1E1616',
    primary: '#E8492A',
    onPrimary: '#FDF1E2',
    /** 5.6:1 on background, 4.7:1 on backgroundElement. */
    primaryText: '#FF7A5C',
    accent: '#BDDDFC',
    onAccent: '#342626',
    highlight: '#F6CF45',
    onHighlight: '#342626',
    /** AA on backgroundElement (>= 4.5:1). */
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
export const MaxContentWidth = 800;
