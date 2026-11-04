import { StyleSheet, View } from 'react-native';

import { OMark } from '@/components/brand/OMark';
import { Colors } from '@/constants/theme';

export type BrandPinTone = 'live' | 'upcoming' | 'cafe';

/** Pins sit on the map, not on a themed surface: always the light palette. */
const TONES: Record<BrandPinTone, { fill: string; mark: string }> = {
  live: { fill: Colors.light.brandFill, mark: Colors.light.text },
  upcoming: { fill: Colors.light.backgroundElement, mark: Colors.light.text },
  cafe: { fill: Colors.light.text, mark: Colors.light.brandFill },
};

/**
 * A map pin: the logo's Ộ on a round colour, ringed in paper so it reads
 * on any map. Sage for a pop-up that's live (bigger, with a point under
 * it), paper for one still to come, ink for the café.
 */
export function BrandPin({ tone, size = 40, point = false }: { tone: BrandPinTone; size?: number; point?: boolean }) {
  const { fill, mark } = TONES[tone];
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View
        style={[
          styles.disc,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: fill },
          tone === 'upcoming' && { borderColor: Colors.light.brandFill },
        ]}
      >
        <OMark height={size * 0.62} color={mark} />
      </View>
      {point ? <View style={[styles.point, { borderTopColor: fill }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.backgroundElement,
    boxShadow: '0 2px 6px rgba(26, 26, 23, 0.25)',
  },
  // A small downward triangle: the pin's point.
  point: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
