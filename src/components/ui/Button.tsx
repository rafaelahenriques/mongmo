import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  /**
   * primary: Cool Brown pill · brand: Bold Red (the one main action on a
   * screen) · secondary: white · ghost: muted fill · danger: muted, red label.
   */
  variant?: 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger';
  size?: 'large' | 'medium' | 'small';
  icon?: IconName;
  /** A trailing arrow in a circle, for "go somewhere" actions. */
  arrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** Feedback on press; `press` for weightier actions. */
  haptic?: 'tap' | 'press' | 'none';
  /** Defaults to `label`. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = { large: 56, medium: 46, small: 36 } as const;

/** Pill button. Shrinks a touch when pressed; labels stay at AA contrast. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  icon,
  arrow = false,
  loading = false,
  disabled = false,
  haptic = 'tap',
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const colors = {
    primary: { background: theme.primary, foreground: theme.onPrimary },
    brand: { background: theme.brandFill, foreground: theme.onBrand },
    secondary: { background: theme.backgroundElement, foreground: theme.text },
    ghost: { background: theme.backgroundSelected, foreground: theme.text },
    danger: { background: theme.backgroundSelected, foreground: theme.danger },
  }[variant];
  const inactive = disabled || loading;
  const iconSize = size === 'small' ? 15 : 18;

  return (
    <Pressable
      onPress={() => {
        if (haptic !== 'none') haptics[haptic]();
        onPress();
      }}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: HEIGHT[size],
          paddingHorizontal: size === 'small' ? Spacing.three : Spacing.four,
          paddingRight: arrow ? Spacing.one + 2 : undefined,
          backgroundColor: colors.background,
          opacity: disabled ? 0.4 : 1,
          boxShadow: variant === 'secondary' ? `0px 4px 14px ${theme.shadow}` : undefined,
          transform: [{ scale: pressed && !inactive ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.foreground} />
      ) : (
        <View style={[styles.content, arrow && styles.spread]}>
          <View style={styles.labelRow}>
            {icon ? <Icon name={icon} size={iconSize} color={colors.foreground} /> : null}
            <ThemedText
              type="button"
              style={[{ color: colors.foreground }, size === 'small' && styles.smallLabel]}
              numberOfLines={1}
            >
              {label}
            </ThemedText>
          </View>
          {arrow ? (
            <View style={[styles.arrow, { backgroundColor: colors.foreground }]}>
              <Icon name="arrowRight" size={16} color={colors.background} weight="bold" />
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  spread: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 1,
  },
  smallLabel: {
    fontSize: 14,
    lineHeight: 18,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
