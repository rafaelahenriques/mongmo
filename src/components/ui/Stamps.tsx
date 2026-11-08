import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Stickers } from '@/constants/stickers';
import { Paper } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Sticker } from '@/components/ui/Sticker';

/** Each stamp lands a little crooked, as if pressed by hand. */
const TILT = [-8, 6, -3, 9, -6, 4, -9, 3, 7, -4];

/**
 * The stamp card: a slot per stamp. Each stamp earned is the Ô sticker; the
 * rest are dashed circles, and the next one fills its ring with the points
 * toward it. Ink stamps on a sage card (`onBrand`). Decorative: say the
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
  /** On a sage card: ink stamps, paper slots. */
  onBrand?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const filled = Math.max(0, Math.min(total, Math.round(earned)));
  const fill = Math.max(0, Math.min(1, partial));
  const slot = onBrand ? Paper : theme.outline;
  const ring = onBrand ? theme.onBrand : theme.primaryText;

  return (
    <View style={[styles.row, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: total }, (_, index) => (
        <View key={index} style={styles.slot}>
          {index < filled ? (
            <Sticker
              source={onBrand ? Stickers.oMarkInk : Stickers.oMark}
              style={[styles.stamp, { transform: [{ rotate: `${TILT[index % TILT.length]}deg` }] }]}
            />
          ) : (
            <View style={[styles.empty, { borderColor: slot }]}>
              {index === filled && fill > 0 ? <ProgressRing fill={fill} color={ring} /> : null}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

/** The next stamp's ring, drawn round from the top as its points come in. */
function ProgressRing({ fill, color }: { fill: number; color: string }) {
  const size = 100;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  return (
    <Svg viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${length} ${length}`}
        strokeDashoffset={length * (1 - fill)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  // Up to 52 pt each; ten still fit a phone's width, smaller.
  slot: {
    flex: 1,
    maxWidth: 52,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: {
    width: '100%',
    height: '100%',
  },
  empty: {
    width: '84%',
    height: '84%',
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
});
