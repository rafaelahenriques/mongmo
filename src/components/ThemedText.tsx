import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'display'
    | 'name'
    | 'title'
    | 'subtitle'
    | 'section'
    | 'card'
    | 'label'
    | 'item'
    | 'button'
    | 'small'
    | 'smallBold'
    | 'caption'
    | 'captionBold'
    | 'micro'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
  /** A header's level (1–3). Without it, it follows the text style. */
  headingLevel?: 1 | 2 | 3;
};

/**
 * Heading levels by text style, for headers that don't say: a screen's
 * title is 1, every other header a section (2) right under it, so no level
 * is ever skipped. On the web they become h1 and h2. Pass `headingLevel`
 * for a group nested inside a section (3).
 */
const HEADING_LEVEL: Partial<Record<NonNullable<ThemedTextProps['type']>, 1 | 2 | 3>> = {
  display: 1,
  name: 1,
  card: 1,
  title: 2,
  subtitle: 2,
  section: 2,
  item: 2,
};

export function ThemedText({ style, type = 'default', themeColor, headingLevel, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const level =
    rest.accessibilityRole === 'header' || rest.role === 'heading' ? (headingLevel ?? HEADING_LEVEL[type] ?? 2) : null;
  const capped = type === 'display' || type === 'name';

  return (
    <Text
      // Display sizes are already large text: past 1.3× they'd break the
      // layout. Everything else follows the system text size in full.
      maxFontSizeMultiplier={capped ? 1.3 : undefined}
      style={[
        { color: theme[themeColor ?? 'text'] },
        styles[type],
        type === 'linkPrimary' && { color: theme.primaryText },
        style,
      ]}
      {...(level ? ({ 'aria-level': level } as object) : null)}
      // On the web, marks the cap (data-text-cap) for the large-text test.
      {...(capped && Platform.OS === 'web' ? ({ dataSet: { textCap: '1.3' } } as object) : null)}
      {...rest}
    />
  );
}

/** Figma letter spacing is a percentage of the font size. */
const tracking = (size: number, percent: number) => (size * percent) / 100;

const styles = StyleSheet.create({
  /** Big numbers: points, pickup codes, "+20". */
  display: {
    fontFamily: FontFamily.display,
    fontSize: 72,
    lineHeight: 72,
    letterSpacing: tracking(72, -2),
  },
  /** A pop-up's name over its photo. */
  name: {
    fontFamily: FontFamily.display,
    fontSize: 46,
    lineHeight: 46,
    letterSpacing: tracking(46, -2),
  },
  /** Screen headings ("Being made", "Next up"). */
  title: {
    fontFamily: FontFamily.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: tracking(30, -2),
  },
  subtitle: {
    fontFamily: FontFamily.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: tracking(24, -1),
  },
  /** Section headings ("Challenges", "Today", "Keep earning"). */
  section: {
    fontFamily: FontFamily.display,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: tracking(20, -1),
  },
  /** Uppercase titles on cards and rows ("RATE THE BEST DISH"). */
  card: {
    fontFamily: FontFamily.heavy,
    fontSize: 15,
    lineHeight: 19,
    textTransform: 'uppercase',
  },
  /** Uppercase labels: the tab bar, top bars, block buttons, segments. */
  label: {
    fontFamily: FontFamily.heavy,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: tracking(14, 2),
    textTransform: 'uppercase',
  },
  /** Menu item names and prices on the menu board. */
  item: {
    fontFamily: FontFamily.heavy,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: tracking(24, -1),
  },
  button: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  default: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 22,
  },
  /** Secondary lines: times, places, hints (same as caption). */
  small: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 19,
  },
  /** Row titles, names, values. */
  smallBold: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  caption: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 19,
  },
  captionBold: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  /** Step labels and small tags. */
  micro: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    lineHeight: 15,
  },
  link: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    textDecorationLine: 'underline',
  },
  linkPrimary: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
