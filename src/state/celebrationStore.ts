import type { Href } from 'expo-router';
import { create } from 'zustand';

import type { IconName } from '@/components/ui/Icon';

/**
 * Something big enough for the whole screen: a new level or a new badge.
 * Shown one at a time, in the order they came, until each is closed.
 */
export type Milestone = {
  /** The same id twice is the same milestone: shown once. */
  id: string;
  /** Over the title: "New level", "New badge". */
  kind: string;
  title: string;
  text: string;
  /** A sticker to show big, or else an icon on a coin. */
  image?: number;
  icon?: IconName;
  /** Where to see more, as the second way out ("See your level"). */
  link?: { label: string; href: Href };
  /** Runs once it's closed, by either way (to remember it was seen). */
  onClose?: () => void;
};

type CelebrationState = {
  queue: Milestone[];
  celebrate: (milestone: Milestone) => void;
  /** Closes the one showing. */
  dismiss: () => void;
};

export const useCelebrationStore = create<CelebrationState>((set, get) => ({
  queue: [],
  celebrate: (milestone) =>
    set((state) =>
      state.queue.some((queued) => queued.id === milestone.id) ? state : { queue: [...state.queue, milestone] },
    ),
  dismiss: () => {
    const [shown, ...rest] = get().queue;
    set({ queue: rest });
    shown?.onClose?.();
  },
}));
