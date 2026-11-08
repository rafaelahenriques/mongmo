import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { log } from '@/lib/log';

/**
 * Android notification channels, one per kind, so people can switch one
 * off (Settings → Apps → Mongmo → Notifications) and keep the rest. Order
 * updates pop up on screen; cart reminders arrive quietly. iOS ignores them.
 */
export const NOTIFICATION_CHANNELS = {
  orders: {
    name: 'Your orders',
    description: 'When the café starts on your order and when it’s ready.',
    importance: AndroidImportance.HIGH,
  },
  nearby: {
    name: 'Pop-ups near you',
    description: 'When you’re about 500 m from a live pop-up.',
    importance: AndroidImportance.DEFAULT,
  },
  badges: {
    name: 'Badges',
    description: 'When you unlock a badge.',
    importance: AndroidImportance.DEFAULT,
  },
  rewards: {
    name: 'Rewards',
    description: 'A day before a reward you have runs out.',
    importance: AndroidImportance.DEFAULT,
  },
  reminders: {
    name: 'Cart reminders',
    description: 'When something is still waiting in your cart.',
    importance: AndroidImportance.LOW,
  },
} as const;

export type NotificationChannel = keyof typeof NOTIFICATION_CHANNELS;

/** Before the channels, every alert went to this one, "Pop-up alerts". */
const OLD_CHANNEL = 'default';

/**
 * Creates (or updates) the channels. Android needs one before it shows the
 * permission prompt or any notification; asking for nothing, it's safe to
 * run at every start. Never throws.
 */
export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Promise.all(
      Object.entries(NOTIFICATION_CHANNELS).map(([id, channel]) =>
        Notifications.setNotificationChannelAsync(id, {
          ...channel,
          vibrationPattern: [0, 200],
          lightColor: '#388075',
        }),
      ),
    );
    await Notifications.deleteNotificationChannelAsync(OLD_CHANNEL);
  } catch (error) {
    log.warn('notifications', 'could not set up notification channels', error);
  }
}

/**
 * Show a banner + list entry with sound while
 * the app is in the foreground, and set up Android's channels.
 */
export function configureNotifications(): void {
  void ensureNotificationChannels();
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
 * Make sure notifications can actually be presented. Android requires a
 * channel before any prompt appears; iOS just needs authorization.
 * Resolves to whether permission was granted (never throws).
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    await ensureNotificationChannels();

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (error) {
    log.warn('notifications', 'permission request failed', error);
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
  /** Which kind it is: on Android, its channel. */
  channel: NotificationChannel;
  /** In-app route opened when the notification is tapped. */
  url?: string;
};

/**
 * Shows a local notification right away (as a banner, too, while the app
 * is open — see configureNotifications). Never throws: a notification
 * that can't be shown must not break the flow that triggered it.
 */
export async function notifyNow({ title, body, channel, url }: LocalNotification): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: url ? { url } : {}, sound: true },
      trigger: { channelId: channel },
    });
  } catch (error) {
    log.warn('notifications', 'could not show notification', error);
  }
}

/** Settings → "Send a test notification": proves permission + presentation work. */
export async function sendTestNotification(): Promise<boolean> {
  const granted = await ensureNotificationPermission();
  if (!granted) return false;
  await notifyNow({
    title: 'Notifications are on',
    body: 'You’ll hear about nearby pop-ups, your orders and new badges.',
    channel: 'orders',
  });
  return true;
}

/** Content for a "you're near a pop-up" alert (geofence task and foreground check). */
export function nearbyNotification(event: { id: string; title: string; city: string }): LocalNotification {
  return {
    title: "You're 500 m away",
    body: `${event.title} is live. Check in when you get there.`,
    channel: 'nearby',
    url: `/(popups)/event/${event.id}`,
  };
}
