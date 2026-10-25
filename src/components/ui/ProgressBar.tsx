import { StyleSheet, View, type ColorValue } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * A thin rounded bar, filled to `value` (0–1). Decorative: say the numbers in
 * text. The default deep sage on rose keeps the fill at 3:1 against its track.
 */
export function ProgressBar({ value, color, track }: { value: number; color?: ColorValue; track?: ColorValue }) {
  const theme = useTheme();
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View
      style={[styles.track, { backgroundColor: track ?? theme.backgroundSelected }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color ?? theme.brand }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
