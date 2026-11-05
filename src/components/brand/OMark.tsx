import { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * The Ộ from the logo, drawn the way the app design uses it: a hat, a ring
 * and a dot. Solid, it is a map pin and an earned stamp; as a thin outline,
 * a stamp still to earn. Geometry from the Figma "Stamp" components, on a
 * 34 × 50 grid.
 */
export type OMarkProps = {
  /** Height in points; the width is 0.68 × the height. */
  height?: number;
  color: string;
  variant?: 'solid' | 'outline';
};

function OMarkComponent({ height = 50, color, variant = 'solid' }: OMarkProps) {
  const solid = variant === 'solid';
  return (
    <Svg width={(height * 34) / 50} height={height} viewBox="0 0 34 50">
      <Path
        d="M10 9 L17 3 L24 9"
        stroke={color}
        strokeWidth={solid ? 4.5 : 1.5}
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
      <Circle cx={17} cy={26} r={solid ? 11.5 : 14.25} stroke={color} strokeWidth={solid ? 7 : 1.5} fill="none" />
      {solid ? (
        <Circle cx={17} cy={46} r={3.5} fill={color} />
      ) : (
        <Circle cx={17} cy={46} r={3} stroke={color} strokeWidth={1.5} fill="none" />
      )}
    </Svg>
  );
}

export const OMark = memo(OMarkComponent);
