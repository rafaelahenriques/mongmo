import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

import { GEOFENCE_RADIUS_M } from '@/constants/config';
import { ensureNotificationPermission } from '@/services/notifications';
import { useLocationStore } from '@/state/locationStore';
import { useSettingsStore } from '@/state/settingsStore';
import { GEOFENCE_TASK_NAME } from '@/tasks/geofenceTask';
import { saveGeofenceMetas } from '@/utils/geofenceRegistry';
import type { PopUpEvent } from '@/types';

/**
 * Headless screenshot runs (EXPO_PUBLIC_UI_TOUR=1): the verification
 * simulator has no GUI window, so the system permission alert could never be
 * dismissed — skip the prompt. Geofence regions still register; only the
 * banner presentation needs permission, which real users grant normally.
 */
const SKIP_PERMISSION_PROMPT = process.env.EXPO_PUBLIC_UI_TOUR === '1';

/**
 * Registers a 500 m geofence around every relevant pop-up for as long as
 * location is granted. Calling startGeofencingAsync with a fresh array
 * replaces the region set (SDK 57 docs), so filter changes self-heal.
 * Alert filtering (active hours, per-event debounce) happens in the task.
 */
export function useGeofencing(events: PopUpEvent[] | undefined): void {
  const permission = useLocationStore((state) => state.permission);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);

  useEffect(() => {
    if (!notificationsEnabled) {
      // Settings toggle off: tear regions down so no alert can fire.
      Location.stopGeofencingAsync(GEOFENCE_TASK_NAME).catch(() => undefined);
      return;
    }
    if (permission !== 'granted') return;
    if (!events) return; // still loading — keep whatever was registered
    if (events.length === 0) {
      Location.stopGeofencingAsync(GEOFENCE_TASK_NAME).catch(() => undefined);
      return;
    }

    let cancelled = false;

    (async () => {
      // Alerts only matter with notification permission; never block on it.
      if (!SKIP_PERMISSION_PROMPT) {
        await ensureNotificationPermission();
      }
      if (cancelled) return;

      // iOS: background ("Always") authorization is what makes region
      // monitoring continue while backgrounded. Skipped on Android because
      // the API opens the system settings page instead of a prompt.
      if (Platform.OS === 'ios') {
        await Location.requestBackgroundPermissionsAsync().catch(() => undefined);
      }
      if (cancelled) return;

      await saveGeofenceMetas(events);
      const regions: Location.LocationRegion[] = events.map((event) => ({
        identifier: `event:${event.id}`,
        latitude: event.coordinates.latitude,
        longitude: event.coordinates.longitude,
        radius: GEOFENCE_RADIUS_M,
        notifyOnEnter: true,
        notifyOnExit: false,
      }));
      await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
      console.log(`[geofencing] watching ${regions.length} event region(s)`);
    })().catch((error: unknown) => {
      // Denied location / Expo Go / simulators without services: degrade to
      // "map without alerts" instead of crashing.
      console.warn('[geofencing] could not start', error);
    });

    return () => {
      cancelled = true;
    };
  }, [permission, events, notificationsEnabled]);
}
