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
   * brand: sage (the one main action on a screen) · primary: dark ·
   * ghost: light stone · secondary: outlined · danger: light stone, red label.
   */
  variant?: 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger';
  size?: 'large' | 'medium' | 'small';
  icon?: IconName;
  /** A trailing arrow in a circle, for "go somewhere" actions. */
  arrow?: boolean;
  loading?: boolean;
  /** Light stone with a grey label, still readable (AA) rather than faded out. */
  disabled?: boolean;
  /** Feedback on press; `press` for weightier actions. */
  haptic?: 'tap' | 'press' | 'none';
  /** Defaults to `label`. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = { large: 52, medium: 44, small: 32 } as const;
const PADDING = { large: 20, medium: Spacing.three, small: 14 } as const;

/**
 * Pill button. Shrinks a touch when pressed; labels stay at AA contrast.
 * The label never leaves the pill: if the button is narrower than it, it
 * ends with "…" (lay buttons out with ButtonRow so that stays rare).
 */
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
  const colors = disabled
    ? { background: theme.backgroundSelected, foreground: theme.textSecondary }
    : {
        primary: { background: theme.primary, foreground: theme.onPrimary },
        brand: { background: theme.brandFill, foreground: theme.onBrand },
        secondary: { background: 'transparent', foreground: theme.text },
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
          paddingHorizontal: PADDING[size],
          paddingRight: arrow ? Spacing.one + 2 : undefined,
          backgroundColor: colors.background,
          borderWidth: variant === 'secondary' && !disabled ? 1 : 0,
          borderColor: theme.text,
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
              style={[styles.label, { color: colors.foreground }, size === 'small' && styles.smallLabel]}
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
    maxWidth: '100%',
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
  label: {
    flexShrink: 1,
  },
  smallLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
