import { useEffect } from 'react';

import { levelSticker, Stickers } from '@/constants/stickers';
import { useLevel } from '@/hooks/useLevel';
import { useSettingsHydrated } from '@/hooks/useSettingsHydrated';
import { useCelebrationStore } from '@/state/celebrationStore';
import { useSettingsStore } from '@/state/settingsStore';

/**
 * A new level is a milestone: once you reach it, the whole screen says so
 * (once per level, remembered on the phone). Dough, where everyone starts,
 * isn't one.
 */
export function useLevelCelebration(): void {
  const level = useLevel();
  const hydrated = useSettingsHydrated();
  const levelSeen = useSettingsStore((state) => state.levelSeen);

  useEffect(() => {
    const current = level.current;
    if (!hydrated || current.minPoints === 0 || levelSeen === current.key) return;
    const sticker = levelSticker(current.key);
    useCelebrationStore.getState().celebrate({
      id: `level:${current.key}`,
      kind: 'New level',
      title: `Welcome to ${current.name}`,
      text: `${current.perk.charAt(0).toUpperCase()}${current.perk.slice(1)}.`,
      image: sticker ? Stickers[sticker] : undefined,
      icon: 'trophy',
      link: { label: 'See your level', href: '/(wallet)/levels' },
      onClose: () => useSettingsStore.getState().markLevelSeen(current.key),
    });
  }, [hydrated, level, levelSeen]);
}
