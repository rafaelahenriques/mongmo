import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconButton } from '@/components/ui/IconButton';
import { Spacing } from '@/constants/theme';

/** − 2 + control. Labels name the thing being counted. */
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
  const button = size === 'large' ? 48 : 34;
  return (
    <View style={styles.row}>
      <IconButton
        icon="remove"
        tone="muted"
        size={button}
        haptic="select"
        disabled={value - step < min}
        onPress={() => onChange(Math.max(min, value - step))}
        accessibilityLabel={`Decrease ${label}`}
      />
      <ThemedText
        type={size === 'large' ? 'subtitle' : 'smallBold'}
        style={[styles.value, { minWidth: size === 'large' ? 40 : 28 }]}
        accessibilityLabel={`${label}: ${formatValue(value)}`}
        accessibilityLiveRegion="polite"
      >
        {formatValue(value)}
      </ThemedText>
      <IconButton
        icon="add"
        tone="muted"
        size={button}
        haptic="select"
        disabled={value + step > max}
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
});
