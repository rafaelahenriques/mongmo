import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { PageInset, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { nameFromContent } from '@/utils/a11y';
import { ripple } from '@/components/ui/ripple';

export type BlockButtonProps = {
  label: string;
  onPress: () => void;
  /** A value before the arrow: the total, the points ("15,50", "+20"). */
  value?: string;
  /** sage: the main action · dark: pause, directions over a map… */
  tone?: 'sage' | 'dark';
  arrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** Pads for the home indicator: for the bar flush with the screen's bottom edge. */
  bottomInset?: boolean;
  /** `compact` is the small block attached to a card ("CHECK IN →"). */
  size?: 'bar' | 'compact';
  haptic?: 'tap' | 'press';
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The main action: a pill floating over the bottom of the screen ("ADD TO
 * ORDER 5,00 →"), or a compact block on the edge of a card ("CHECK IN →").
 * An uppercase label, an optional value and an arrow.
 */
export function BlockButton({
  label,
  onPress,
  value,
  tone = 'sage',
  arrow = true,
  loading = false,
  disabled = false,
  bottomInset = false,
  size = 'bar',
  haptic = 'press',
  accessibilityHint,
  style,
}: BlockButtonProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const inactive = disabled || loading;
  const background = disabled ? theme.backgroundSelected : tone === 'sage' ? theme.brandFill : theme.surfaceDark;
  const color = disabled ? theme.textSecondary : tone === 'sage' ? theme.onBrand : theme.onSurfaceDark;

  return (
    <Pressable
      android_ripple={ripple(color)}
      onPress={() => {
        haptics[haptic]();
        onPress();
      }}
      disabled={inactive}
      accessibilityRole="button"
      {...nameFromContent([label, value].filter(Boolean).join(', '))}
      accessibilityHint={accessibilityHint}
      aria-disabled={inactive}
      aria-busy={loading}
      style={({ pressed }) => [
        { backgroundColor: background, opacity: pressed && !inactive ? 0.85 : 1 },
        // The bar floats as a pill above the bottom edge; the compact block
        // stays square, flush with the card it belongs to.
        size === 'bar' && [styles.bar, { marginBottom: bottomInset ? insets.bottom + 8 : 12 }],
        style,
      ]}
    >
      <View style={[styles.row, size === 'compact' && styles.compact]}>
        <ThemedText type="button" numberOfLines={1} style={[styles.label, { color }]}>
          {label}
        </ThemedText>
        {loading ? (
          <ActivityIndicator accessibilityLabel="Loading" color={color} />
        ) : (
          <View style={styles.right}>
            {value ? (
              <ThemedText type="button" style={{ color }}>
                {value}
              </ThemedText>
            ) : null}
            {arrow ? <Icon name="arrowRight" size={16} color={color} weight="bold" /> : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: PageInset,
    paddingVertical: 18,
  },
  compact: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  label: {
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
