import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'display'
    | 'title'
    | 'subtitle'
    | 'section'
    | 'label'
    | 'button'
    | 'small'
    | 'smallBold'
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

const styles = StyleSheet.create({
  /** Big numerals (points, pickup codes, counts). */
  display: {
    fontFamily: FontFamily.display,
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -0.5,
  },
  /** Screen headings — condensed, sentence case. */
  title: {
    fontFamily: FontFamily.display,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FontFamily.display,
    fontSize: 28,
    lineHeight: 30,
  },
  /** Section headings ("Nearby pop-ups", "Settings"). */
  section: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  /** Small uppercase eyebrow above a value or group. */
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  button: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 20,
  },
  default: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  small: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    fontFamily: FontFamily.bodySemiBold,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: FontFamily.bodySemiBold,
    lineHeight: 30,
    fontSize: 14,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
