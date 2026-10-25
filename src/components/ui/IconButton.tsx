import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * Circular icon-only button (share, close, add…). Needs an accessibility
 * label. Disabled, it turns muted rose with a grey icon (still 3:1 or more).
 */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  tone = 'card',
  size = 44,
  disabled = false,
  haptic = 'tap',
  style,
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: 'card' | 'muted' | 'primary' | 'brand';
  size?: number;
  disabled?: boolean;
  /** `press` for weightier actions (add to cart), `select` for steppers. */
  haptic?: 'tap' | 'press' | 'select';
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const { background, foreground } = disabled
    ? { background: theme.backgroundSelected, foreground: theme.textSecondary }
    : {
        card: { background: theme.backgroundElement, foreground: theme.text },
        muted: { background: theme.backgroundSelected, foreground: theme.text },
        primary: { background: theme.primary, foreground: theme.onPrimary },
        brand: { background: theme.brandFill, foreground: theme.onBrand },
      }[tone];

  return (
    <Pressable
      onPress={() => {
        haptics[haptic]();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          backgroundColor: background,
          boxShadow: tone === 'card' && !disabled ? `0px 4px 12px ${theme.shadow}` : undefined,
          transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
        },
        style,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.42)} color={foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
