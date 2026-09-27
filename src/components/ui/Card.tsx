import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type CardProps = PropsWithChildren<{
  /** Makes the whole card a button that presses into its shadow. */
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** paper (default) · accent: Light Blue · highlight: yellow · primary: Bold Red. */
  tone?: 'paper' | 'accent' | 'highlight' | 'primary';
  style?: StyleProp<ViewStyle>;
}>;

const SHADOW_OFFSET = 3;

/**
 * An outlined "label" card with a hard shadow, the app's main surface.
 * With `onPress` it behaves like a button (and presses into its shadow).
 */
export function Card({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  tone = 'paper',
  style,
}: CardProps) {
  const theme = useTheme();
  const backgroundColor =
    tone === 'accent'
      ? theme.accent
      : tone === 'highlight'
        ? theme.highlight
        : tone === 'primary'
          ? theme.primary
          : theme.backgroundElement;
  const base = [
    styles.card,
    { backgroundColor, borderColor: theme.border },
  ];
  const shadow = `${SHADOW_OFFSET}px ${SHADOW_OFFSET}px 0px ${theme.shadow}`;

  if (!onPress) {
    return <View style={[base, { boxShadow: shadow }, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        base,
        {
          boxShadow: pressed ? undefined : shadow,
          transform: pressed ? [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }] : [],
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 2,
    padding: Spacing.three,
    gap: Spacing.two,
    marginRight: SHADOW_OFFSET,
    marginBottom: SHADOW_OFFSET,
  },
});
