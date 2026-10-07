import { Children, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';

/**
 * Buttons side by side while they fit at their natural width, sharing any
 * room left over; each on its own full-width line when they don't. Fixed
 * halves squeeze a long label ("Add to calendar") out of its pill on a
 * narrow phone or with larger text.
 */
export function ButtonRow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, style]}>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={styles.cell}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + Spacing.one,
  },
  cell: {
    flexGrow: 1,
  },
});
