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
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        styles[type],
        type === 'linkPrimary' && { color: theme.primaryText },
        style,
      ]}
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
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: tracking(13, 2),
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
    fontSize: 14,
    lineHeight: 20,
  },
  /** Secondary lines: times, places, hints (same as caption). */
  small: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 16,
  },
  /** Row titles, names, values. */
  smallBold: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 16,
  },
  captionBold: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  /** Step labels and footnote numbers. */
  micro: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    lineHeight: 12,
  },
  link: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
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
