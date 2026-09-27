import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * SDK 57 notification behavior: show a banner + list entry with sound while
 * the app is in the foreground.
 */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Make sure geofencing alerts can actually be presented. Android requires a
 * channel before any prompt appears; iOS just needs authorization.
 * Resolves to whether permission was granted (never throws).
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Pop-up alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200],
        lightColor: '#8B4513',
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (error) {
    console.warn('Notification permission request failed', error);
    return false;
  }
}

export type NotificationPermission = {
  granted: boolean;
  /** False once the user said no: iOS won't prompt again, only Settings can fix it. */
  canAskAgain: boolean;
};

/** Current notification permission (never throws; web reports "not granted"). */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (Platform.OS === 'web') return { granted: false, canAskAgain: false };
  try {
    const status = await Notifications.getPermissionsAsync();
    return { granted: status.granted, canAskAgain: status.canAskAgain };
  } catch {
    return { granted: false, canAskAgain: false };
  }
}

export type LocalNotification = {
  title: string;
  body: string;
  /** In-app route opened when the notification is tapped. */
  url?: string;
};

/**
 * Shows a local notification right away (as a banner, too, while the app
 * is open — see configureNotifications). Never throws: a notification
 * that can't be shown must not break the flow that triggered it.
 */
export async function notifyNow({ title, body, url }: LocalNotification): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: url ? { url } : {}, sound: true },
      trigger: null,
    });
  } catch (error) {
    console.warn('Could not show notification', error);
  }
}

/** Settings → "Send a test notification": proves permission + presentation work. */
export async function sendTestNotification(): Promise<boolean> {
  const granted = await ensureNotificationPermission();
  if (!granted) return false;
  await notifyNow({
    title: 'Notifications are on',
    body: 'You’ll hear about nearby pop-ups, your orders and new badges.',
  });
  return true;
}

/** Content for a "you're near a pop-up" alert (geofence task and foreground check). */
export function nearbyNotification(event: { id: string; title: string; city: string }): LocalNotification {
  return {
    title: `${event.title} is nearby`,
    body: `You're within 500 m of the pop-up in ${event.city}. Tap to see details.`,
    url: `/(explore)/event/${event.id}`,
  };
}
