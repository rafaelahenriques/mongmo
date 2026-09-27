/** App-wide configuration read from public env vars. */

/** Radius (meters) of the geofence registered around every pop-up. */
export const GEOFENCE_RADIUS_M = 500;

/** Per-event debounce so one entry never produces repeated push alerts. */
export const GEOFENCE_DEBOUNCE_MS = 6 * 60 * 60 * 1000;

/** Where "Order online" sends the user. */
export const ORDER_URL = 'https://bestel.mongmo-store.com/nl';

/** Public events page, used as the share URL. */
export const EVENTS_PAGE_URL = 'https://www.mongmo-store.com/events';

/** How long the react-query cache is persisted for offline starts. */
export const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24;

/**
 * Bump when a cached query's data shape changes: a persisted cache written
 * with a different buster is discarded instead of restored. (2: the
 * events-with-menu query went from a Set — persisted as `{}` — to an array.)
 */
export const PERSIST_BUSTER = '2';
