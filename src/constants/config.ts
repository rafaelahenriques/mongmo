/**
 * App-wide configuration read from public env vars.
 *
 * When `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_SOCKET_URL` are unset the app
 * runs against the bundled mock transport — no code changes required to flip
 * to a real server later.
 */

/** Base URL of the Mongmo API. Empty string = use the local mock transport. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/** Socket.IO endpoint for live busy counts. Empty = use the mock socket. */
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? '';

/** Demo scenario understood by the mock API (edge-case screenshots, QA). */
export type MockScenario = 'normal' | 'empty' | 'closed' | 'full';

const scenario = process.env.EXPO_PUBLIC_MOCK_SCENARIO ?? 'normal';
export const MOCK_SCENARIO: MockScenario =
  scenario === 'empty' || scenario === 'closed' || scenario === 'full' ? scenario : 'normal';

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
