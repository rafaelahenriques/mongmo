import { useEffect, useRef } from 'react';

import { GEOFENCE_RADIUS_M } from '@/constants/config';
import { nearbyNotification, notifyNow } from '@/services/notifications';
import { useLocationStore } from '@/state/locationStore';
import { useSettingsStore } from '@/state/settingsStore';
import { getEventPhase } from '@/utils/dateTime';
import { distanceInMeters } from '@/utils/distance';
import { markAlerted, wasRecentlyAlerted } from '@/utils/geofenceRegistry';
import type { PopUpEvent } from '@/types';

/**
 * "You're near a pop-up" while the app is open. Background region
 * monitoring (useGeofencing) needs "Always" location and only fires on
 * crossing into a region — so it stays silent if you open the app already
 * standing at a pop-up, and it's unreliable in the Simulator. This checks
 * every position update against live pop-ups instead. Both paths share the
 * same per-event debounce, so a pop-up alerts once, whichever notices first.
 */
export function useNearbyAlerts(events: PopUpEvent[] | undefined): void {
  const enabled = useSettingsStore((state) => state.notifications.nearby);
  const coordinates = useLocationStore((state) => state.coordinates);
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !coordinates || !events) return;
    const now = new Date();

    for (const event of events) {
      if (getEventPhase(event.startsAt, event.endsAt, now) !== 'live') continue;
      if (distanceInMeters(coordinates, event.coordinates) > GEOFENCE_RADIUS_M) continue;
      if (inFlight.current.has(event.id)) continue;
      inFlight.current.add(event.id);

      (async () => {
        if (await wasRecentlyAlerted(event.id, now.getTime())) return;
        await markAlerted(event.id, now.getTime());
        await notifyNow(nearbyNotification(event));
      })().finally(() => inFlight.current.delete(event.id));
    }
  }, [enabled, coordinates, events]);
}
