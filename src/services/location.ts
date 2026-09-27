import { Platform } from 'react-native';
import * as Location from 'expo-location';

import type { Coordinates } from '@/types';

/** A street-level description of a point, for suggesting a venue and city. */
export type PlaceDetails = {
  city: string | null;
  /** Street + number (or the place name). */
  street: string | null;
};

export type CurrentPlace = Coordinates &
  PlaceDetails & {
    /** Horizontal accuracy in metres, when the OS reports it. */
    accuracy: number | null;
  };

/** Address search and reverse geocoding run on the OS (none on web). */
export const canGeocode = Platform.OS !== 'web';

/**
 * Best-effort street and city for a point. Never throws: a failed lookup
 * just means no suggestion — the coordinates are what check-in needs.
 */
export async function describePlace(coordinates: Coordinates): Promise<PlaceDetails> {
  if (!canGeocode) return { city: null, street: null };
  try {
    const [address] = await Location.reverseGeocodeAsync(coordinates);
    return {
      city: address?.city ?? address?.subregion ?? null,
      street: [address?.street, address?.streetNumber].filter(Boolean).join(' ') || address?.name || null,
    };
  } catch {
    return { city: null, street: null };
  }
}

/** One fresh, accurate fix of where the device is right now, with its address. */
export async function getCurrentPlace(): Promise<CurrentPlace> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location is off for Mongmo — allow it in Settings to use where you are.');
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const { latitude, longitude, accuracy } = position.coords;
  return { latitude, longitude, accuracy: accuracy ?? null, ...(await describePlace({ latitude, longitude })) };
}

/**
 * The best match for a typed address ("Grote Markt, Kortrijk"), with its
 * street and city, or null when nothing matches.
 */
export async function searchPlace(query: string): Promise<(Coordinates & PlaceDetails) | null> {
  if (!canGeocode || !query.trim()) return null;
  // iOS and Android geocode through the OS, which asks for location access.
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location is off for Mongmo — allow it in Settings to search addresses.');
  }
  const [match] = await Location.geocodeAsync(query.trim());
  if (!match) return null;
  const coordinates = { latitude: match.latitude, longitude: match.longitude };
  return { ...coordinates, ...(await describePlace(coordinates)) };
}
