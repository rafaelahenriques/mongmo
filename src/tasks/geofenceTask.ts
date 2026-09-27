import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { nearbyNotification, notifyNow } from '@/services/notifications';
import { getGeofenceMeta, markAlerted, wasRecentlyAlerted } from '@/utils/geofenceRegistry';

export const GEOFENCE_TASK_NAME = 'mongmo-geofence-alerts';

type GeofenceTaskData = {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
};

/**
 * Runs when the device enters one of the registered pop-up regions — even
 * from the background (iOS relaunches the JS bundle for this). Defined at
 * module scope and imported by the root layout, as expo-task-manager requires.
 *
 * Guards applied before notifying:
 *  1. metadata must exist for the region (registry written at registration),
 *  2. the event must be inside its active start/end window,
 *  3. the event must not have alerted within the debounce window.
 */
TaskManager.defineTask<GeofenceTaskData>(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn(`[${GEOFENCE_TASK_NAME}]`, error.message);
    return;
  }
  if (!data || data.eventType !== Location.GeofencingEventType.Enter) return;

  const identifier = data.region.identifier;
  if (!identifier) return;

  const meta = await getGeofenceMeta(identifier);
  if (!meta) return;

  const now = Date.now();
  const start = Date.parse(meta.startsAt);
  const end = Date.parse(meta.endsAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return;

  // iOS reports the initial state of registered regions at app startup;
  // the active-hours check keeps those (and late-evening passes) silent.
  if (now < start || now > end) {
    console.log(`[${GEOFENCE_TASK_NAME}] enter ignored (outside hours): ${meta.id}`);
    return;
  }

  if (await wasRecentlyAlerted(meta.id, now)) {
    console.log(`[${GEOFENCE_TASK_NAME}] enter debounced: ${meta.id}`);
    return;
  }

  await markAlerted(meta.id, now);
  await notifyNow(nearbyNotification(meta));
  console.log(`[${GEOFENCE_TASK_NAME}] alert sent: ${meta.id}`);
});
