import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  /**
   * The hierarchy: one filled button per group, the rest outlined.
   * brand: sage, the main action · primary: ink, a main action on sage or
   * where sage is already taken · secondary (and ghost): outlined in ink,
   * a second action · danger: outlined in red, for removing things.
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
const OUTLINED = new Set<ButtonProps['variant']>(['secondary', 'ghost', 'danger']);
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
        ghost: { background: 'transparent', foreground: theme.text },
        danger: { background: 'transparent', foreground: theme.danger },
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
          // Outlined variants keep a 1.5pt ring in their label's colour.
          borderWidth: OUTLINED.has(variant) && !disabled ? 1.5 : 0,
          borderColor: colors.foreground,
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
