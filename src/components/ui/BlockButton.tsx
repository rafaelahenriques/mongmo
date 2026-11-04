import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { PageInset } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

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
 * The design's square action block: an uppercase label, an optional value
 * and an arrow, attached to the bottom of the screen ("ADD TO ORDER 5,00 →")
 * or to the edge of a card ("CHECK IN →").
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
      onPress={() => {
        haptics[haptic]();
        onPress();
      }}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={[label, value].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        { backgroundColor: background, opacity: pressed && !inactive ? 0.85 : 1 },
        bottomInset && { paddingBottom: insets.bottom },
        style,
      ]}
    >
      <View style={[styles.row, size === 'compact' && styles.compact]}>
        <ThemedText type="label" numberOfLines={1} style={[styles.label, { color }]}>
          {label}
        </ThemedText>
        {loading ? (
          <ActivityIndicator color={color} />
        ) : (
          <View style={styles.right}>
            {value ? (
              <ThemedText type="label" style={{ color }}>
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
