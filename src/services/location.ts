import { Platform } from 'react-native';
import * as Location from 'expo-location';

import type { Coordinates } from '@/types';

export type CurrentPlace = Coordinates & {
  /** Horizontal accuracy in metres, when the OS reports it. */
  accuracy: number | null;
  city: string | null;
  /** Street + number (or the place name), for a venue suggestion. */
  street: string | null;
};

/**
 * One fresh, accurate fix of where the device is right now, plus a
 * best-effort street address (iOS/Android only — reverse geocoding has no
 * web implementation, and a failed lookup never fails the whole call).
 */
export async function getCurrentPlace(): Promise<CurrentPlace> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location is off for Mongmo — allow it in Settings to use where you are.');
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const { latitude, longitude, accuracy } = position.coords;

  let city: string | null = null;
  let street: string | null = null;
  if (Platform.OS !== 'web') {
    try {
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      city = address?.city ?? address?.subregion ?? null;
      street =
        [address?.street, address?.streetNumber].filter(Boolean).join(' ') || address?.name || null;
    } catch {
      // No address is fine: the coordinates are what check-in needs.
    }
  }

  return { latitude, longitude, accuracy: accuracy ?? null, city, street };
}
