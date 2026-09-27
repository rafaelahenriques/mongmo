import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  /** primary: Bold Red · secondary: paper · accent: Light Blue sticker. */
  variant?: 'primary' | 'secondary' | 'accent';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

const SHADOW_OFFSET = 3;

/**
 * The Mongmo button: an outlined "printed label" with a hard offset shadow
 * that it presses down into. Labels are 20px bold caps, which keeps the
 * cream-on-red primary at AA for large text.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const background =
    variant === 'primary'
      ? theme.primary
      : variant === 'accent'
        ? theme.accent
        : theme.backgroundElement;
  const foreground =
    variant === 'primary' ? theme.onPrimary : variant === 'accent' ? theme.onAccent : theme.text;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderColor: theme.border,
          opacity: disabled ? 0.5 : 1,
          boxShadow: pressed || inactive ? undefined : `${SHADOW_OFFSET}px ${SHADOW_OFFSET}px 0px ${theme.shadow}`,
          transform: pressed && !inactive ? [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }] : [],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.content}>
          {icon}
          <ThemedText type="button" style={{ color: foreground }} numberOfLines={1}>
            {label}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    // Leave room for the shadow so it isn't clipped by the parent.
    marginRight: SHADOW_OFFSET,
    marginBottom: SHADOW_OFFSET,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
