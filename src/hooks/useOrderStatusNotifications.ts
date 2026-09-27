import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';

import { getCurrentUserId, supabase } from '@/lib/supabase';
import { useSettingsStore } from '@/state/settingsStore';
import { ORDER_STATUS_LABEL } from '@/utils/orderFormat';
import type { OrderStatus } from '@/types/database';

type OrderChangePayload = {
  new: { id: string; status: OrderStatus };
  old: { status?: OrderStatus };
};

const NOTIFY_ON: ReadonlySet<OrderStatus> = new Set(['preparing', 'ready', 'collected']);

/**
 * Local push the moment an order's status actually changes — confirmed,
 * preparing, ready for pickup (AGENTS.md's order-status notification type).
 * Subscribed once for the whole app (Providers), not per-screen, so it
 * fires even while the user is browsing something else.
 */
export function useOrderStatusNotifications(): void {
  const enabled = useSettingsStore((state) => state.notifications.orderUpdates);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    // Realtime can deliver the same status again (another column changing);
    // alert once per order per status.
    const notified = new Map<string, OrderStatus>();

    (async () => {
      const userId = await getCurrentUserId().catch(() => undefined);
      if (!userId || cancelled) return;

      channel = supabase
        .channel(`order-status-${userId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
          (payload) => {
            const { new: next, old: previous } = payload as unknown as OrderChangePayload;
            if (!NOTIFY_ON.has(next.status) || next.status === previous.status) return;
            if (notified.get(next.id) === next.status) return;
            notified.set(next.id, next.status);

            Notifications.scheduleNotificationAsync({
              content: {
                title: ORDER_STATUS_LABEL[next.status],
                body:
                  next.status === 'ready'
                    ? "Your order is ready for pickup!"
                    : `Your order is now ${ORDER_STATUS_LABEL[next.status].toLowerCase()}.`,
                data: { url: `/(orders)/order/status/${next.id}` },
                sound: true,
              },
              trigger: null,
            }).catch(() => undefined);

            queryClient.invalidateQueries({ queryKey: ['order', next.id] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['active-order'] });
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}
