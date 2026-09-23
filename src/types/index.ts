/** Shared domain types for the Café Hunt app. */

/** Bare geographic coordinate. */
export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * A map location that can be rendered as a marker with a tap-to-expand
 * callout (title + description).
 */
export type Location = Coordinates & {
  title: string;
  description: string;
};

export type PopupStatus = 'upcoming' | 'live' | 'ended';

export type PopUp = {
  id: string;
  title: string;
  description: string;
  /** ISO 8601 date string, e.g. "2026-10-12T14:00:00". */
  date: string;
  status: PopupStatus;
  /** Distance from the café in meters. */
  distance: number;
  location: Coordinates;
};

/** Map camera region, compatible with react-native-maps `initialRegion`. */
export type Region = Coordinates & {
  latitudeDelta: number;
  longitudeDelta: number;
};
