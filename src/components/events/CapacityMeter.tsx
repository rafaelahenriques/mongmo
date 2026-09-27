import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type CapacityMeterProps = {
  occupancy: number;
  capacity: number;
  /** Visible label, e.g. "How busy right now". */
  label: string;
};

/**
 * Accessible occupancy bar: green < 70 %, amber < full, red when at capacity.
 * Announced to screen readers as progressbar with min/max/now.
 */
function CapacityMeterComponent({ occupancy, capacity, label }: CapacityMeterProps) {
  const theme = useTheme();

  const ratio = capacity > 0 ? Math.min(1, Math.max(0, occupancy / capacity)) : 0;
  const isFull = occupancy >= capacity;
  const fillColor = isFull ? theme.danger : ratio >= 0.7 ? theme.warning : theme.success;
  const valueText = isFull ? 'Full' : `${occupancy} / ${capacity}`;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}: ${occupancy} of ${capacity}`}
      accessibilityValue={{ min: 0, max: capacity, now: occupancy }}
      style={styles.wrap}
    >
      <View style={styles.header}>
        <ThemedText type="label">{label}</ThemedText>
        <ThemedText type="small" style={{ color: isFull ? theme.danger : theme.textSecondary }}>
          {valueText}
        </ThemedText>
      </View>
      <View
        style={[styles.track, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
        importantForAccessibility="no"
      >
        <View
          style={[styles.fill, { backgroundColor: fillColor, flexGrow: ratio }]}
        />
      </View>
    </View>
  );
}

export default memo(CapacityMeterComponent);

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    flexBasis: 0,
  },
});
