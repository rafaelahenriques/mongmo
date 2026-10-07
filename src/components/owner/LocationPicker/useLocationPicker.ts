import { useState } from 'react';

import { haptics } from '@/services/haptics';
import { describePlace, getCurrentPlace, searchPlace } from '@/services/location';
import type { PlaceSuggestion } from '@/services/placeSearch';
import type { Coordinates } from '@/types';

/** The form's location fields. Coordinates stay text so they can be typed on web. */
export type LocationValue = {
  latitude: string;
  longitude: string;
  city: string;
  venue: string;
};

export type LocationPickerProps = {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
};

/** The pinned point, when both coordinates parse. */
export function pinnedPoint(value: LocationValue): Coordinates | null {
  const latitude = Number.parseFloat(value.latitude);
  const longitude = Number.parseFloat(value.longitude);
  return value.latitude.trim() && value.longitude.trim() && Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
}

const coordinateText = (coordinates: Coordinates) => ({
  latitude: coordinates.latitude.toFixed(6),
  longitude: coordinates.longitude.toFixed(6),
});

/**
 * The ways to set where a pop-up is, shared by the native picker (with a
 * map) and the web one:
 *  - pick an address suggestion while typing: moves the pin there and fills
 *    in the venue and city;
 *  - search the typed text (the fallback when there's no suggestion): the
 *    same, through the OS geocoder;
 *  - use my current location: pins where the owner stands, and suggests a
 *    city and street only where they're still empty;
 *  - move the pin: the same gentle suggestions.
 */
export function useLocationPicker({ value, onChange }: LocationPickerProps) {
  const [busy, setBusy] = useState<'search' | 'locate' | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const report = (message: string | null, failed: boolean) => {
    setNote(failed ? null : message);
    setProblem(failed ? message : null);
    if (failed) haptics.error();
    else haptics.success();
  };

  const search = async (query: string) => {
    if (!query.trim()) return;
    setBusy('search');
    try {
      const place = await searchPlace(query);
      if (!place) {
        report(`Couldn’t find “${query.trim()}”. Try adding the city.`, true);
        return;
      }
      onChange({
        ...coordinateText(place),
        city: place.city ?? value.city,
        venue: place.street ?? query.trim(),
      });
      report(`Pinned to ${[place.street, place.city].filter(Boolean).join(', ') || 'that address'}.`, false);
    } catch (error) {
      report(error instanceof Error ? error.message : 'Address search failed.', true);
    } finally {
      setBusy(null);
    }
  };

  const pick = (place: PlaceSuggestion) => {
    onChange({
      ...coordinateText(place),
      city: place.city ?? value.city,
      venue: place.venue,
    });
    report(`Pinned to ${[place.title, place.city].filter(Boolean).join(', ')}.`, false);
  };

  const locate = async () => {
    setBusy('locate');
    try {
      const place = await getCurrentPlace();
      onChange({
        ...coordinateText(place),
        city: value.city.trim() || place.city || '',
        venue: value.venue.trim() || place.street || '',
      });
      report(`Pinned to where you are${place.accuracy ? ` (±${Math.round(place.accuracy)} m)` : ''}.`, false);
    } catch (error) {
      report(error instanceof Error ? error.message : 'Couldn’t get your location.', true);
    } finally {
      setBusy(null);
    }
  };

  const move = async (coordinates: Coordinates) => {
    haptics.select();
    const moved = { ...value, ...coordinateText(coordinates) };
    onChange(moved);
    const place = await describePlace(coordinates);
    onChange({
      ...moved,
      city: moved.city.trim() || place.city || '',
      venue: moved.venue.trim() || place.street || '',
    });
    setProblem(null);
    setNote('Pin moved.');
  };

  return { busy, note, problem, pick, search, locate, move };
}
