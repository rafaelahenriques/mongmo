import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OMark } from '@/components/brand/OMark';
import { useTheme } from '@/hooks/useTheme';

/**
 * A stamp card: the logo's Ộ, solid sage for each stamp earned and a thin
 * stone outline for each still to go. Decorative; say the count in text.
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
  return (
    <View style={[styles.row, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: total }, (_, index) => (
        <OMark
          key={index}
          height={height}
          color={index < filled ? theme.brand : theme.border}
          variant={index < filled ? 'solid' : 'outline'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
