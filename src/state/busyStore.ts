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
  /** Take fresh API values (the server is the source of truth; the socket keeps them live). */
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

    // Called when a query delivers new data, so it's at least as fresh as
    // anything the socket said before the fetch. (Keeping the first value
    // forever — as this used to — froze the meter until a socket update.)
    set((state) => {
      const next: BusyMap = { ...state.busy };
      for (const entity of list) next[entity.id] = entity.busy;
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
