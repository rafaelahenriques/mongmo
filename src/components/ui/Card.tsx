import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { CardShadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type CardProps = PropsWithChildren<{
  /** Makes the whole card a button (with a gentle press and a tap haptic). */
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** default: near-white with a shadow · muted: light stone · brand: sage · accent: cream · primary: dark. */
  tone?: 'default' | 'muted' | 'brand' | 'accent' | 'primary';
  style?: StyleProp<ViewStyle>;
}>;

/** The app's main surface: a square near-white card with a soft shadow. */
export function Card({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  tone = 'default',
  style,
}: CardProps) {
  const theme = useTheme();
  const backgroundColor = {
    default: theme.backgroundElement,
    muted: theme.backgroundSelected,
    brand: theme.brandFill,
    accent: theme.accent,
    primary: theme.surfaceDark,
  }[tone];
  const surface = [
    styles.card,
    {
      backgroundColor,
      boxShadow: tone === 'default' ? CardShadow : undefined,
    },
  ];

  if (!onPress) {
    return <View style={[surface, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      aria-disabled={disabled}
      style={({ pressed }) => [surface, { transform: [{ scale: pressed && !disabled ? 0.98 : 1 }] }, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
