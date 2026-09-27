import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
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
  /** Big condensed caps — screen titles and hero moments. */
  title: {
    fontFamily: FontFamily.display,
    fontSize: 40,
    lineHeight: 42,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: FontFamily.display,
    fontSize: 28,
    lineHeight: 32,
    textTransform: 'uppercase',
  },
  /** Section headings ("Nearby pop-ups", "Settings"). */
  section: {
    fontFamily: FontFamily.display,
    fontSize: 22,
    lineHeight: 26,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  /** Small caps for stickers, chips and eyebrows. */
  label: {
    fontFamily: FontFamily.displayBold,
    fontSize: 14,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  /** Button labels: 20px bold, so they count as large text for contrast. */
  button: {
    fontFamily: FontFamily.display,
    fontSize: 20,
    lineHeight: 24,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    fontFamily: FontFamily.bodyBold,
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
