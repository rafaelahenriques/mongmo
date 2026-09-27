import AsyncStorage from '@react-native-async-storage/async-storage';

import { GEOFENCE_DEBOUNCE_MS } from '@/constants/config';
import type { PopUpEvent } from '@/types';

const REGISTRY_KEY = 'geofence:registry';
const ALERTED_KEY_PREFIX = 'geofence:alerted:';

/**
 * Metadata stored for each registered geofence region. The background task
 * only receives a region identifier, so everything it needs to build the
 * notification lives here (AsyncStorage is available in the task runtime).
 */
export type GeofenceMeta = {
  id: string;
  title: string;
  city: string;
  startsAt: string;
  endsAt: string;
};

/** Persist metadata for the regions about to be registered. */
export async function saveGeofenceMetas(events: PopUpEvent[]): Promise<void> {
  const registry: Record<string, GeofenceMeta> = {};
  for (const event of events) {
    registry[`event:${event.id}`] = {
      id: event.id,
      title: event.title,
      city: event.city,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
    };
  }
  await AsyncStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

/** Look up a region's metadata by its `event:<id>` identifier. */
export async function getGeofenceMeta(
  identifier: string,
): Promise<GeofenceMeta | null> {
  try {
    const raw = await AsyncStorage.getItem(REGISTRY_KEY);
    if (!raw) return null;
    const registry = JSON.parse(raw) as Record<string, GeofenceMeta>;
    return registry[identifier] ?? null;
  } catch (error) {
    console.warn('Could not read geofence registry', error);
    return null;
  }
}

/** True when this event alerted within the debounce window. */
export async function wasRecentlyAlerted(
  eventId: string,
  now: number = Date.now(),
): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ALERTED_KEY_PREFIX + eventId);
    if (!raw) return false;
    const lastAlert = Number(raw);
    if (Number.isNaN(lastAlert)) return false;
    return now - lastAlert < GEOFENCE_DEBOUNCE_MS;
  } catch {
    // Failing open would spam the user; failing closed just delays an alert.
    return true;
  }
}

/** Record that an alert was just sent for this event. */
export async function markAlerted(
  eventId: string,
  now: number = Date.now(),
): Promise<void> {
  try {
    await AsyncStorage.setItem(ALERTED_KEY_PREFIX + eventId, String(now));
  } catch (error) {
    console.warn('Could not persist geofence alert timestamp', error);
  }
}
