import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OMark } from '@/components/brand/OMark';
import { useTheme } from '@/hooks/useTheme';

/** Stamps on one line before the card wraps. */
const MAX_PER_ROW = 7;

/**
 * A stamp card: the logo's Ộ, solid sage for each stamp earned and a thin
 * stone outline for each still to go. Past seven stamps it wraps onto
 * rows of equal length, the stamps in columns. Decorative; say the count
 * in text.
 */
export function StampRow({
  earned,
  total = 6,
  height = 50,
  style,
}: {
  earned: number;
  total?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const filled = Math.max(0, Math.min(total, Math.round(earned)));
  const rows = Math.ceil(total / MAX_PER_ROW);
  const perRow = Math.ceil(total / rows);
  return (
    <View style={[styles.card, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: perRow }, (_, column) => {
            const index = row * perRow + column;
            // A short last row keeps its columns under the ones above.
            if (index >= total) return <View key={index} style={{ width: (height * 34) / 50 }} />;
            return (
              <OMark
                key={index}
                height={height}
                color={index < filled ? theme.brand : theme.border}
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
});
