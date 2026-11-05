import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useResolvedScheme, useTheme } from '@/hooks/useTheme';

/** Canvas, blocks and roads, light and dark. */
const PALETTE = {
  light: { canvas: '#F1EFE9', block: '#E4E0D6', road: '#FAF9F5' },
  dark: { canvas: '#2C2D27', block: '#373831', road: '#45463F' },
} as const;

/** Two streets crossing at an angle, a different pair per variant. */
const STREETS = [
  [
    [-10, 62, 114, 40],
    [30, -6, 60, 110],
  ],
  [
    [-10, 30, 114, 70],
    [70, -6, 40, 110],
  ],
  [
    [-10, 80, 114, 56],
    [50, -6, 26, 110],
  ],
] as const;

/**
 * The design's map stand-in: a quiet street plan (blocks, two streets) with
 * the Ộ pin in the middle. Decorative — used where a real map would be
 * overkill (list rows, the "Almost there" screen). Scales to its box.
 *
 * `route` draws the dotted line from you (a dark dot) to the pop-up's sage
 * pin, as on the check-in screens. It stays in the middle third, so it shows
 * whatever shape the box has.
 */
function MapSketchComponent({
  variant = 0,
  route = false,
  pin = true,
  style,
}: {
  variant?: number;
  route?: boolean;
  /** The Ộ in the middle; off for a strip behind a bar. */
  pin?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const colors = PALETTE[useResolvedScheme()];
  const streets = STREETS[Math.abs(variant) % STREETS.length];
  const blocks: { x: number; y: number }[] = [];
  for (let x = -4; x < 104; x += 22) for (let y = -6; y < 100; y += 20) blocks.push({ x: x + (y % 40 ? 6 : 0), y });

  return (
    <View
      style={[styles.box, { backgroundColor: colors.canvas }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Laid over the box, never sizing it: on iOS and Android an SVG
          sized in % inside a box without a set height grows to its own
          aspect ratio and stretches the row it sits in. */}
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 104 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <G transform={`rotate(${variant % 2 ? -14 : 12} 52 50)`}>
          {blocks.map((block) => (
            <Rect
              key={`${block.x}-${block.y}`}
              x={block.x}
              y={block.y}
              width={16}
              height={14}
              rx={1.5}
              fill={colors.block}
            />
          ))}
        </G>
        {streets.map(([x1, y1, x2, y2]) => (
          <Line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.road} strokeWidth={7} />
        ))}
        {route ? (
          <>
            <Line
              x1={38}
              y1={84}
              x2={64}
              y2={38}
              stroke={theme.brand}
              strokeWidth={2}
              strokeDasharray="0.1 4"
              strokeLinecap="round"
            />
            <Circle cx={38} cy={84} r={2.4} fill={theme.text} />
          </>
        ) : null}
        {route ? <Pin x={64} y={29} scale={0.34} /> : pin ? <Pin x={52} y={48} scale={0.62} /> : null}
      </Svg>
    </View>
  );
}

export const MapSketch = memo(MapSketchComponent);

/**
 * The pin, as on the live map (see BrandPin): the Ộ in ink on a sage disc
 * ringed in paper, centred at x, y. Light palette: it sits on the map.
 */
function Pin({ x, y, scale }: { x: number; y: number; scale: number }) {
  const ink = Colors.light.text;
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Circle
        cx={0}
        cy={0}
        r={27}
        fill={Colors.light.brandFill}
        stroke={Colors.light.backgroundElement}
        strokeWidth={4}
      />
      <G transform="scale(0.68) translate(-17 -26)">
        <Path d="M10 9 L17 3 L24 9" stroke={ink} strokeWidth={4.5} strokeLinecap="square" fill="none" />
        <Circle cx={17} cy={26} r={11.5} stroke={ink} strokeWidth={7} fill="none" />
        <Circle cx={17} cy={46} r={3.5} fill={ink} />
      </G>
    </G>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
});
