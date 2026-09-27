import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type CapacityMeterProps = {
  occupancy: number;
  capacity: number;
  /** Visible label, e.g. "How busy right now". */
  label: string;
};

/**
 * Slim occupancy bar: green below 70 %, amber until full, red at capacity.
 * Announced to screen readers as a progressbar with min/max/now.
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
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: isFull ? theme.danger : theme.text }}>
          {valueText}
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]} importantForAccessibility="no">
        <View style={[styles.fill, { backgroundColor: fillColor, flexGrow: ratio }]} />
      </View>
    </View>
  );
}

export default memo(CapacityMeterComponent);

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.one + 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  fill: {
    height: '100%',
    flexBasis: 0,
    borderRadius: Radius.pill,
  },
});
