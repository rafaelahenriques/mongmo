import type { Coordinates } from '@/types';

/** One address suggestion: what the list shows, and what picking it fills in. */
export type PlaceSuggestion = Coordinates & {
  id: string;
  /** "Grote Markt", "Jan Palfijnstraat 26", "Mongmo". */
  title: string;
  /** "8500 Kortrijk, West-Vlaanderen". */
  subtitle: string;
  /** For the form's Venue field: the place and its street address. */
  venue: string;
  city: string | null;
};

/** Credit the OpenStreetMap data wherever suggestions are shown. */
export const PLACE_SEARCH_ATTRIBUTION = 'Suggestions © OpenStreetMap contributors';

/**
 * Photon (photon.komoot.io): OpenStreetMap search built for search-as-you-
 * type, with no API key. The OS geocoders aren't made for this — they're
 * rate-limited and return no list of named places — and Nominatim's usage
 * policy rules out autocomplete.
 */
const PHOTON_URL = 'https://photon.komoot.io/api/';
const MAX_SUGGESTIONS = 5;

/** Results lean towards here when the owner's location isn't known: Belgium. */
export const DEFAULT_SEARCH_BIAS: Coordinates = { latitude: 50.64, longitude: 4.67 };

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_type?: string;
    osm_id?: number;
    type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
  };
};

/** Suggestions for what's typed so far, nearest to `near` first. */
export async function suggestPlaces(
  query: string,
  near: Coordinates,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const params = [
    `q=${encodeURIComponent(query.trim())}`,
    `limit=${MAX_SUGGESTIONS * 2}`,
    `lat=${near.latitude.toFixed(4)}`,
    `lon=${near.longitude.toFixed(4)}`,
  ].join('&');
  const response = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!response.ok) throw new Error(`Address suggestions failed (${response.status})`);
  const body = (await response.json()) as { features?: PhotonFeature[] };
  return toSuggestions(body.features ?? []);
}

/** Photon's GeoJSON as suggestions: labelled, without repeats, at most five. */
export function toSuggestions(features: PhotonFeature[]): PlaceSuggestion[] {
  const seen = new Set<string>();
  const suggestions: PlaceSuggestion[] = [];

  for (const feature of features) {
    const [longitude, latitude] = feature.geometry?.coordinates ?? [];
    const place = feature.properties ?? {};
    if (typeof latitude !== 'number' || typeof longitude !== 'number') continue;

    const address = [place.street, place.housenumber].filter(Boolean).join(' ');
    const isSettlement = place.type === 'city' || place.type === 'locality' || place.type === 'district';
    const city = place.city ?? (isSettlement ? place.name : undefined) ?? place.district ?? place.county ?? null;
    const title = place.name ?? address;
    if (!title) continue;

    // A named place on a street reads "Mongmo, Jan Palfijnstraat 26".
    const venue = place.name && address && place.name !== address ? `${place.name}, ${address}` : title;
    const town = [place.postcode, city !== title ? city : null].filter(Boolean).join(' ');
    const subtitle = [address !== title && place.name ? address : null, town, place.state]
      .filter(Boolean)
      .join(', ');

    // Long streets come back as several segments with the same name.
    const key = `${title}|${subtitle}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    suggestions.push({
      id: `${place.osm_type ?? 'x'}${place.osm_id ?? suggestions.length}`,
      title,
      subtitle,
      venue,
      city,
      latitude,
      longitude,
    });
    if (suggestions.length === MAX_SUGGESTIONS) break;
  }
  return suggestions;
}
