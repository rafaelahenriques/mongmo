import type { Location, PopUp } from '@/types';

/** Mock delay (ms) used to simulate map initialization for UX purposes. */
export const MAP_LOAD_DELAY_MS = 800;

/** Initial map region: centered on all markers with a ~10km radius view. */
export const MAP_DELTA = 0.08;

/** The café, located on the Grote Markt in Kortrijk. */
export const MOCK_CAFE_LOCATION: Location = {
  latitude: 50.8276,
  longitude: 3.2662,
  title: 'Café Hunt HQ',
  description: 'The home base — grab a coffee before the hunt.',
};

export const MOCK_POPUPS: PopUp[] = [
  {
    id: 'popup-1',
    title: 'Kortrijk Xpo Market',
    description: 'Artisan goods and specialty coffee pop-up near the expo hall.',
    date: '2026-10-03T10:00:00',
    status: 'live',
    distance: 2700,
    location: { latitude: 50.8585, longitude: 3.287 },
  },
  {
    id: 'popup-2',
    title: 'Marke Makers Corner',
    description: 'Local makers and roasters taking over a storefront in Marke.',
    date: '2026-10-12T11:00:00',
    status: 'upcoming',
    distance: 3100,
    location: { latitude: 50.8055, longitude: 3.234 },
  },
  {
    id: 'popup-3',
    title: 'Bissegem Garden Sessions',
    description: 'An outdoor garden pop-up with live music and filter coffee.',
    date: '2026-09-20T18:00:00',
    status: 'ended',
    distance: 2900,
    location: { latitude: 50.8445, longitude: 3.233 },
  },
];

/** Marker locations for the map, derived from the pop-up data. */
export const MOCK_POPUP_LOCATIONS: Location[] = MOCK_POPUPS.map((popup) => ({
  ...popup.location,
  title: popup.title,
  description: popup.description,
}));
