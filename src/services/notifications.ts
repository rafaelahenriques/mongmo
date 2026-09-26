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
