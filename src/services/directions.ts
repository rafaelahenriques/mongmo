import { Linking, Platform } from 'react-native';

import type { Coordinates } from '@/types';

/** Opens turn-by-turn directions in the platform's maps app (Apple Maps on iOS). */
export function openDirections(destination: Coordinates, label: string): void {
  const { latitude, longitude } = destination;
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodeURIComponent(label)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  Linking.openURL(url).catch(() => undefined);
}
