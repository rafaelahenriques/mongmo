import { create } from 'zustand';

import type { EventFilter } from '@/types';

type FilterState = {
  /** Currently selected date filter; the permanent store pin ignores it. */
  filter: EventFilter;
  setFilter: (filter: EventFilter) => void;
};

export const useFilterStore = create<FilterState>((set) => ({
  // "This Week" is the useful default: it shows everything upcoming.
  filter: 'week',
  setFilter: (filter) => set({ filter }),
}));
