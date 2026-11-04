import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OMark } from '@/components/brand/OMark';
import { Paper } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/** Stamps on one line before the card wraps. */
const MAX_PER_ROW = 7;

/**
 * A stamp card: the logo's Ộ, solid sage for each stamp earned and a thin
 * stone outline for each still to go; the next one fills up from the
 * bottom with the points toward it. Past seven stamps it wraps onto rows
 * of equal length, the stamps in columns. Decorative; say the count in
 * text.
 */
export function StampRow({
  earned,
  total = 6,
  partial = 0,
  height = 50,
  onBrand = false,
  style,
}: {
  earned: number;
  total?: number;
  /** How far the next stamp has filled, 0 to 1. */
  partial?: number;
  /** On a sage card: earned stamps in ink, the rest in paper. */
  onBrand?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const filled = Math.max(0, Math.min(total, Math.round(earned)));
  const rows = Math.ceil(total / MAX_PER_ROW);
  const perRow = Math.ceil(total / rows);
  const width = (height * 34) / 50;
  const fill = Math.max(0, Math.min(1, partial));
  const on = onBrand ? theme.onBrand : theme.brand;
  const off = onBrand ? Paper : theme.border;
  return (
    <View style={[styles.card, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: perRow }, (_, column) => {
            const index = row * perRow + column;
            // A short last row keeps its columns under the ones above.
            if (index >= total) return <View key={index} style={{ width }} />;
            if (index === filled && fill > 0) {
              return (
                <View key={index} style={{ width, height }}>
                  <OMark height={height} color={off} variant="outline" />
                  <View style={[styles.fill, { height: height * fill }]}>
                    <View style={styles.fillMark}>
                      <OMark height={height} color={on} variant="solid" />
                    </View>
                  </View>
                </View>
              );
            }
            return (
              <OMark
                key={index}
                height={height}
                color={index < filled ? on : off}
                variant={index < filled ? 'solid' : 'outline'}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // The bottom of a solid stamp, showing through a window as tall as the
  // share of the stamp you've earned.
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  fillMark: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
});
