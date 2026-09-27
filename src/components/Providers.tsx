import { useEffect, type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/api/queryClient';
import { PERSIST_MAX_AGE_MS } from '@/constants/config';
import { useEvents } from '@/hooks/useEvents';
import { useGeofencing } from '@/hooks/useGeofencing';
import { useRealtime } from '@/hooks/useRealtime';
import { useStore } from '@/hooks/useStore';
import { useUserLocation } from '@/hooks/useUserLocation';
import { configureNotifications } from '@/services/notifications';

// Module-scope side effect: TaskManager.defineTask must run before render so
// the OS can re-invoke the geofence task in the background.
import '@/tasks/geofenceTask';

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'mongmo-query-cache',
});

/**
 * App-wide providers + singleton services:
 *  - gesture root (host for react-native-gesture-handler views),
 *  - persisted react-query cache (offline last-known data),
 *  - error boundary,
 *  - user location watcher, live busy socket and geofencing registration,
 *  - notification configuration + tap-to-open-event navigation.
 */
export function Providers({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: PERSIST_MAX_AGE_MS }}
      >
        <ErrorBoundary>
          <AppServices>{children}</AppServices>
        </ErrorBoundary>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Lives *inside* the query client so its hooks have context. Keeps exactly
 * one subscription each for location, realtime and geofencing.
 */
function AppServices({ children }: PropsWithChildren) {
  useUserLocation();
  useRealtime();
  useStore();

  // All upcoming events power the geofence region set, independent of the
  // filter currently selected on the map.
  const { data: allEvents } = useEvents('all');
  useGeofencing(allEvents);

  useEffect(() => {
    configureNotifications();
  }, []);

  return (
    <>
      <NotificationNavigation />
      {children}
    </>
  );
}

/** Opens the event screen when the user taps a geofencing notification. */
function NotificationNavigation() {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!lastResponse) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const url = lastResponse.notification.request.content.data?.url;
    if (typeof url === 'string') {
      router.push(url as Href);
    }
  }, [lastResponse, router]);

  return null;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
