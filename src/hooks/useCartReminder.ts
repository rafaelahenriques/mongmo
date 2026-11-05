import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { orderPoints } from '@/constants/points';
import { cartItemCount, cartSubtotalCents, useCartStore } from '@/state/cartStore';
import { useSettingsStore } from '@/state/settingsStore';

const IDENTIFIER = 'cart-reminder';
/** How long a full cart sits before the nudge. */
const AFTER_MS = 45 * 60 * 1000;

/**
 * The abandoned-cart nudge: leave the app with something in the cart and,
 * 45 minutes later, a reminder of what's in it and the points it would
 * earn, opening the cart. Coming back to the app, or the cart emptying
 * (ordered or cleared), cancels it. Off with Settings → Cart reminders.
 */
export function useCartReminder(): void {
  const enabled = useSettingsStore((state) => state.notifications.cartReminder);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const cancel = () => Notifications.cancelScheduledNotificationAsync(IDENTIFIER).catch(() => undefined);

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void cancel();
        return;
      }
      if (state !== 'background' || !enabled) return;
      const { items } = useCartStore.getState();
      if (items.length === 0) return;
      const [first] = items;
      const more = cartItemCount(items) - 1;
      const points = orderPoints(cartSubtotalCents(items));
      void Notifications.scheduleNotificationAsync({
        identifier: IDENTIFIER,
        content: {
          title: 'Still hungry?',
          body: `${first.name}${more > 0 ? ` and ${more} more` : ''} is waiting in your cart. Order ahead, skip the queue and earn ${points} points.`,
          data: { url: '/(orders)/order/cart' },
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(Date.now() + AFTER_MS) },
      }).catch(() => undefined);
    });

    const cart = useCartStore.subscribe((state) => {
      if (state.items.length === 0) void cancel();
    });
    if (!enabled) void cancel();

    return () => {
      appState.remove();
      cart();
    };
  }, [enabled]);
}
