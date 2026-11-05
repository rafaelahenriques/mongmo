import { useMemo } from 'react';
import { formatInTimeZone } from 'date-fns-tz';

import type { IconName } from '@/components/ui/Icon';
import { useAchievements } from '@/hooks/useAchievements';
import { useEvents } from '@/hooks/useEvents';
import { useMyOrders } from '@/hooks/useMyOrders';
import { useNow } from '@/hooks/useNow';
import { usePointsHistory } from '@/hooks/usePointsHistory';
import { useLocationStore } from '@/state/locationStore';
import { useSettingsStore } from '@/state/settingsStore';
import { getEventPhase } from '@/utils/dateTime';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { pickupCode } from '@/utils/orderFormat';

export type FeedItem = {
  id: string;
  kind: 'order' | 'popup' | 'reward';
  icon: IconName;
  title: string;
  subtitle: string;
  /** When it happened (ISO). */
  at: string;
  /** Where tapping it goes. */
  target: { tab: 'orders'; orderId: string } | { tab: 'event'; eventId: string } | { tab: 'rewards' };
};

const WEEK_MS = 7 * 24 * 3600 * 1000;
/** A live pop-up within this distance is "nearby". */
const NEARBY_M = 2000;

/**
 * The Notifications list (H-02): the three kinds the app sends — orders,
 * pop-ups and rewards — rebuilt from the user's own data, newest first:
 * an order ready for pickup, a live pop-up nearby, a pop-up added this
 * week, points earned this week, and a reward the points now cover.
 */
export function useNotificationsFeed() {
  const orders = useMyOrders();
  const events = useEvents('all');
  const history = usePointsHistory();
  const { query: achievements, summary } = useAchievements();
  const coordinates = useLocationStore((state) => state.coordinates);
  const seenAt = useSettingsStore((state) => state.notificationsSeenAt);
  const nowDate = useNow();

  const items = useMemo<FeedItem[]>(() => {
    const now = nowDate.getTime();
    const recent = (iso: string) => now - new Date(iso).getTime() < WEEK_MS;
    const feed: FeedItem[] = [];

    for (const order of orders.data ?? []) {
      if (order.status !== 'ready') continue;
      feed.push({
        id: `order-${order.id}`,
        kind: 'order',
        icon: 'bag',
        title: 'Ready for pickup',
        subtitle: `Order ${pickupCode(order.id)} is waiting`,
        at: order.pickup_at ?? order.created_at,
        target: { tab: 'orders', orderId: order.id },
      });
    }

    for (const event of events.data ?? []) {
      const phase = getEventPhase(event.startsAt, event.endsAt);
      const distance = coordinates ? distanceInMeters(coordinates, event.coordinates) : null;
      if (phase === 'live' && distance !== null && distance <= NEARBY_M) {
        feed.push({
          id: `nearby-${event.id}`,
          kind: 'popup',
          icon: 'pin',
          title: 'Pop-up nearby',
          subtitle: `${event.title}, ${formatDistance(distance)} away`,
          at: event.startsAt,
          target: { tab: 'event', eventId: event.id },
        });
      } else if (phase === 'upcoming' && event.createdAt && recent(event.createdAt)) {
        feed.push({
          id: `new-${event.id}`,
          kind: 'popup',
          icon: event.tags.some((tag) => /dj|music|night/i.test(tag)) ? 'music' : 'calendar',
          title: 'New pop-up',
          subtitle: `${event.title}, ${formatInTimeZone(new Date(event.startsAt), event.timeZone, 'EEE d MMM')}`,
          at: event.createdAt,
          target: { tab: 'event', eventId: event.id },
        });
      }
    }

    for (const entry of history.data ?? []) {
      if (entry.points <= 0 || !recent(entry.createdAt)) continue;
      feed.push({
        id: `points-${entry.id}`,
        kind: 'reward',
        icon: 'star',
        title: `+${entry.points} points`,
        subtitle: entry.title,
        at: entry.createdAt,
        target: { tab: 'rewards' },
      });
    }

    const cheapest = [...(achievements.data?.rewards ?? [])].sort((a, b) => a.costPoints - b.costPoints)[0];
    const lastEarned = history.data?.find((entry) => entry.points > 0);
    if (cheapest && summary.points >= cheapest.costPoints && lastEarned) {
      feed.push({
        id: `reward-${cheapest.id}`,
        kind: 'reward',
        icon: 'gift',
        title: 'Reward unlocked',
        subtitle: `You can redeem ${cheapest.title.toLowerCase()}`,
        at: lastEarned.createdAt,
        target: { tab: 'rewards' },
      });
    }

    return feed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [orders.data, events.data, history.data, achievements.data?.rewards, summary.points, coordinates, nowDate]);

  const unseen = items.filter((item) => !seenAt || new Date(item.at).getTime() > new Date(seenAt).getTime()).length;

  return { items, unseen, isPending: orders.isPending || events.isPending };
}
