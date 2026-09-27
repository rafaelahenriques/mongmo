import { create } from 'zustand';

import type { RealtimeStatus } from '@/realtime/types';
import type { BusyState, MapEntity } from '@/types';

type BusyMap = Record<string, BusyState>;

type BusyStoreState = {
  /** Live occupancy per entity id, seeded from API data, updated by the socket. */
  busy: BusyMap;
  /** Connection state of the busy-count stream. */
  status: RealtimeStatus;
  setStatus: (status: RealtimeStatus) => void;
  /** Merge API payloads in without clobbering newer socket values. */
  seed: (entities: MapEntity | MapEntity[]) => void;
  /** Apply a websocket update (clamped to the entity's capacity). */
  setOccupancy: (id: string, occupancy: number) => void;
};

export const useBusyStore = create<BusyStoreState>((set) => ({
  busy: {},
  status: 'connecting',

  setStatus: (status) => set({ status }),

  seed: (entities) => {
    const list = Array.isArray(entities) ? entities : [entities];
    if (list.length === 0) return;

    set((state) => {
      const next: BusyMap = { ...state.busy };
      for (const entity of list) {
        const live = next[entity.id];
        // Keep the socket's occupancy once we have one; refresh capacity only.
        next[entity.id] = live
          ? { capacity: entity.busy.capacity, occupancy: live.occupancy }
          : entity.busy;
      }
      return { busy: next };
    });
  },

  setOccupancy: (id, occupancy) =>
    set((state) => {
      const current = state.busy[id];
      if (!current) return state;

      const clamped = Math.max(0, Math.min(occupancy, current.capacity));
      if (clamped === current.occupancy) return state;

      return { busy: { ...state.busy, [id]: { ...current, occupancy: clamped } } };
    }),
}));
