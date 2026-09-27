import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';

import { getExpiringUserRewards } from '@/api/endpoints';
import { useSettingsStore } from '@/state/settingsStore';

const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;

function reminderIdentifier(userRewardId: string): string {
  return `reward-expiring-${userRewardId}`;
}

/**
 * Schedules one local reminder per unused, unexpired redeemed reward — a
 * day before it expires, or right away if it's already inside that window.
 * Re-runs whenever the catalog refetches; each reward's identifier is
 * stable, so re-scheduling replaces the old trigger instead of stacking.
 */
export function useRewardExpiryNotifications(): void {
  const enabled = useSettingsStore((state) => state.notifications.rewardExpiring);

  const query = useQuery({
    queryKey: ['user-rewards', 'expiring'],
    queryFn: () => getExpiringUserRewards(),
    enabled,
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (!enabled || !query.data) return;

    (async () => {
      for (const reward of query.data) {
        const identifier = reminderIdentifier(reward.userRewardId);
        await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);

        const expiresAt = new Date(reward.expiresAt).getTime();
        const fireAt = Math.max(expiresAt - REMINDER_LEAD_MS, Date.now() + 60_000);
        if (fireAt >= expiresAt) continue; // already expired

        await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: 'Reward expiring soon',
            body: `${reward.title} expires soon — redeem it before it's gone.`,
            data: { url: '/(profile)/achievements' },
            sound: true,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fireAt) },
        }).catch(() => undefined);
      }
    })();
  }, [enabled, query.data]);
}
