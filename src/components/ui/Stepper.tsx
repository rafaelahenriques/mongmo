import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * − 2 + control. Labels name the thing being counted. `medium` is a soft
 * stone pill with round − and + (item page, cart); `large` uses bigger
 * round buttons. With `onRemove`, the − becomes a bin at the lowest count.
 */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  label = 'quantity',
  formatValue = String,
  size = 'medium',
  onRemove,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** What's being counted, for screen readers: "Decrease {label}". */
  label?: string;
  /** How the value reads, e.g. `(n) => `${n} m``. */
  formatValue?: (value: number) => string;
  size?: 'medium' | 'large';
  /** At the lowest count, − turns into a bin that calls this ("Remove {label}"). */
  onRemove?: () => void;
}) {
  const theme = useTheme();
  const canDecrease = value - step >= min;
  const canIncrease = value + step <= max;

  if (size === 'medium') {
    const removes = !canDecrease && Boolean(onRemove);
    const tap = (next: number) => {
      haptics.select();
      onChange(next);
    };
    const round = (enabled: boolean) => [
      styles.round,
      { backgroundColor: theme.backgroundElement, opacity: enabled ? 1 : 0.45 },
    ];
    return (
      <View style={[styles.pill, { backgroundColor: theme.backgroundSelected }]}>
        <Pressable
          onPress={() => (removes ? onRemove?.() : tap(Math.max(min, value - step)))}
          disabled={!canDecrease && !removes}
          accessibilityRole="button"
          accessibilityLabel={removes ? `Remove ${label}` : `Decrease ${label}`}
          aria-disabled={!canDecrease && !removes}
          hitSlop={4}
          style={round(canDecrease || removes)}
        >
          <Icon name={removes ? 'trash' : 'remove'} size={18} color={theme.text} />
        </Pressable>
        <ThemedText
          type="card"
          style={styles.pillValue}
          accessibilityLabel={`${label}: ${formatValue(value)}`}
          accessibilityLiveRegion="polite"
        >
          {formatValue(value)}
        </ThemedText>
        <Pressable
          onPress={() => tap(Math.min(max, value + step))}
          disabled={!canIncrease}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          aria-disabled={!canIncrease}
          hitSlop={4}
          style={round(canIncrease)}
        >
          <Icon name="add" size={18} color={theme.text} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <IconButton
        icon="remove"
        tone="muted"
        size={48}
        haptic="select"
        disabled={!canDecrease}
        onPress={() => onChange(Math.max(min, value - step))}
        accessibilityLabel={`Decrease ${label}`}
      />
      <ThemedText
        type="subtitle"
        style={[styles.value, { minWidth: 40 }]}
        accessibilityLabel={`${label}: ${formatValue(value)}`}
        accessibilityLiveRegion="polite"
      >
        {formatValue(value)}
      </ThemedText>
      <IconButton
        icon="add"
        tone="muted"
        size={48}
        haptic="select"
        disabled={!canIncrease}
        onPress={() => onChange(Math.min(max, value + step))}
        accessibilityLabel={`Increase ${label}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  value: {
    textAlign: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    padding: 4,
    gap: 4,
  },
  // 40 × 40, and 48 to hit with the slop around it.
  round: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillValue: {
    minWidth: 28,
    textAlign: 'center',
  },
});
