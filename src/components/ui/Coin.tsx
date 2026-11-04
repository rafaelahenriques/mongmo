import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';

/**
 * A coin: a thick ring with a thin inner ring around an icon. Sage when
 * earned, stone when locked. Achievements and "points earned". Decorative.
 * Geometry from the Figma "Coin" component (96 × 96).
 */
export function Coin({ icon, earned = true, size = 96 }: { icon: IconName; earned?: boolean; size?: number }) {
  const theme = useTheme();
  const ring = earned ? theme.brand : theme.border;
  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size} viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
        <Circle cx={48} cy={48} r={44} fill={theme.backgroundElement} stroke={ring} strokeWidth={6} />
        <Circle cx={48} cy={48} r={35} fill="none" stroke={ring} strokeWidth={1} />
      </Svg>
      <View style={styles.icon}>
        <Icon name={icon} size={(size * 34) / 96} color={earned ? theme.text : theme.border} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
