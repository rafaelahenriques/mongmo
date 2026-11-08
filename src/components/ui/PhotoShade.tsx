import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Darkens a photo toward its bottom (and a little at the top, for buttons
 * there), so paper text over it reads. Decorative; fills its parent.
 */
export function PhotoShade({ from = 0.05, to = 0.78 }: { from?: number; to?: number }) {
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      preserveAspectRatio="none"
      viewBox="0 0 1 1"
      aria-hidden
    >
      <Defs>
        <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1C1D19" stopOpacity={from + 0.25} />
          <Stop offset="0.35" stopColor="#1C1D19" stopOpacity={from} />
          <Stop offset="1" stopColor="#1C1D19" stopOpacity={to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="1" height="1" fill="url(#shade)" />
    </Svg>
  );
}

/** See-through glass for pills and round buttons over a photo. */
export const glass = {
  backgroundColor: 'rgba(250, 249, 245, 0.16)',
  borderWidth: 1,
  borderColor: 'rgba(250, 249, 245, 0.42)',
} as const;

/** Paper text over a photo, and its quieter second line. */
export const onPhoto = { color: '#FAF9F5' } as const;
export const onPhotoSoft = { color: 'rgba(250, 249, 245, 0.86)' } as const;
