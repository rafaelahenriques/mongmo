import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconButton } from '@/components/ui/IconButton';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * − 2 + control. Labels name the thing being counted. `medium` is the
 * design's small sage pill (menu rows, cart); `large` uses round buttons.
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
}) {
  const theme = useTheme();
  const canDecrease = value - step >= min;
  const canIncrease = value + step <= max;

  if (size === 'medium') {
    const tap = (next: number) => {
      haptics.select();
      onChange(next);
    };
    return (
      <View style={[styles.pill, { backgroundColor: theme.brandFill }]}>
        <Pressable
          onPress={() => tap(Math.max(min, value - step))}
          disabled={!canDecrease}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          accessibilityState={{ disabled: !canDecrease }}
          hitSlop={8}
          style={styles.pillButton}
        >
          <ThemedText type="captionBold" style={{ color: theme.onBrand, opacity: canDecrease ? 1 : 0.4 }}>
            −
          </ThemedText>
        </Pressable>
        <ThemedText
          type="captionBold"
          style={[styles.pillValue, { color: theme.onBrand }]}
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
          accessibilityState={{ disabled: !canIncrease }}
          hitSlop={8}
          style={styles.pillButton}
        >
          <ThemedText type="captionBold" style={{ color: theme.onBrand, opacity: canIncrease ? 1 : 0.4 }}>
            +
          </ThemedText>
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
    height: 28,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.one,
  },
  pillButton: {
    width: 22,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillValue: {
    minWidth: 20,
    textAlign: 'center',
  },
});
