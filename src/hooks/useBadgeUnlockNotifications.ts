import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getAchievements, getEarnedBadges } from '@/api/endpoints';
import { notifyNow } from '@/services/notifications';
import { useSettingsStore } from '@/state/settingsStore';

/**
 * "Badge unlocked" the moment the server awards one. Badges are granted
 * server-side (check-ins, challenges, orders), and every such action
 * refetches the earned list — so this just notices new ids appearing.
 * The first list seen is the baseline: nothing already earned re-alerts.
 */
export function useBadgeUnlockNotifications(): void {
  const enabled = useSettingsStore((state) => state.notifications.achievements);
  // Same keys and fetchers as useAchievements, so they share one cache entry.
  const earned = useQuery({ queryKey: ['badges', 'earned'], queryFn: () => getEarnedBadges() });
  const catalog = useQuery({ queryKey: ['achievements'], queryFn: () => getAchievements() });
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!earned.data) return;
    const ids = new Set(earned.data.map((badge) => badge.badgeId));
    const previous = seen.current;
    seen.current = ids;
    if (!previous || !enabled) return;

    for (const id of ids) {
      if (previous.has(id)) continue;
      const badge = catalog.data?.badges.find((definition) => definition.id === id);
      void notifyNow({
        title: badge ? `Badge unlocked: ${badge.title}` : 'New badge unlocked',
        body: badge ? `${badge.description} — see it in Achievements.` : 'See it in Achievements.',
        url: '/(profile)/achievements',
      });
    }
  }, [earned.data, catalog.data, enabled]);
}
