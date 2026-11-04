import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Paper } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * The stamp card as a bar: one rounded segment per stamp, solid for each
 * stamp earned, and the next one filling up with the points toward it.
 * Sage on the page; ink on a sage card (`onBrand`). Decorative; say the
 * count in text.
 */
export function StampRow({
  earned,
  total = 6,
  partial = 0,
  onBrand = false,
  style,
}: {
  earned: number;
  total?: number;
  /** How far the next stamp has filled, 0 to 1. */
  partial?: number;
  /** On a sage card: earned in ink, the rest in paper. */
  onBrand?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const filled = Math.max(0, Math.min(total, Math.round(earned)));
  const fill = Math.max(0, Math.min(1, partial));
  const on = onBrand ? theme.onBrand : theme.brandFill;
  const off = onBrand ? Paper : theme.backgroundSelected;

  return (
    <View style={[styles.bar, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: total }, (_, index) => (
        <View key={index} style={[styles.segment, { backgroundColor: index < filled ? on : off }]}>
          {index === filled && fill > 0 ? (
            <View style={[styles.part, { width: `${fill * 100}%`, backgroundColor: on }]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  part: {
    height: '100%',
  },
});
