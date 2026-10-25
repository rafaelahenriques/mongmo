import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type CardProps = PropsWithChildren<{
  /** Makes the whole card a button (with a gentle press and a tap haptic). */
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** default: white · muted: rose fill · brand: sage · accent: cream · primary: Shadow Grey. */
  tone?: 'default' | 'muted' | 'brand' | 'accent' | 'primary';
  style?: StyleProp<ViewStyle>;
}>;

/** The app's main surface: a soft, rounded card with a faint shadow. */
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
    primary: theme.primary,
  }[tone];
  const surface = [
    styles.card,
    {
      backgroundColor,
      boxShadow:
        tone === 'default' ? `0px 1px 2px ${theme.shadow}, 0px 10px 28px ${theme.shadow}` : undefined,
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
      accessibilityState={{ disabled }}
      style={({ pressed }) => [surface, { transform: [{ scale: pressed && !disabled ? 0.98 : 1 }] }, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    padding: Spacing.three + Spacing.one,
    gap: Spacing.two,
  },
});
