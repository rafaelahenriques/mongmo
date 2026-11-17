import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getAchievements, getEarnedBadges } from '@/api/endpoints';
import { badgeIcon } from '@/components/achievements/badgeIcons';
import { notifyNow } from '@/services/notifications';
import { useCelebrationStore } from '@/state/celebrationStore';
import { useSettingsStore } from '@/state/settingsStore';

/**
 * "Badge unlocked" the moment the server awards one. Badges are granted
 * server-side (check-ins, challenges, orders), and every such action
 * refetches the earned list — so this just notices new ids appearing.
 * The first list seen is the baseline: nothing already earned re-alerts.
 * In the app, it's celebrated on the whole screen; in the background, a
 * notification says so (when those are on).
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
    if (!previous) return;

    const inApp = AppState.currentState === 'active';
    for (const id of ids) {
      if (previous.has(id)) continue;
      const badge = catalog.data?.badges.find((definition) => definition.id === id);
      if (inApp) {
        useCelebrationStore.getState().celebrate({
          id: `badge:${id}`,
          kind: 'New badge',
          title: badge?.title ?? 'A new badge',
          text: badge?.description ?? 'See it in Achievements.',
          icon: badgeIcon(badge?.key),
          link: { label: 'See your badges', href: '/(achievements)/achievements' },
        });
        continue;
      }
      if (!enabled) continue;
      void notifyNow({
        title: badge ? `Badge unlocked: ${badge.title}` : 'New badge unlocked',
        body: badge ? `${badge.description} — see it in Achievements.` : 'See it in Achievements.',
        channel: 'badges',
        url: '/(achievements)/achievements',
      });
    }
  }, [earned.data, catalog.data, enabled]);
}
