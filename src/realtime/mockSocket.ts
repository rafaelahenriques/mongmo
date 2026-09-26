import { getMockEvents, MOCK_STORE } from '@/api/mock/mockData';
import { MOCK_SCENARIO } from '@/constants/config';
import type { BusyUpdate } from '@/types';
import type { BusySocket, BusySocketEvents } from '@/realtime/types';

/**
 * Local stand-in for the busy-count websocket: "connects" shortly after
 * creation, then nudges a random entity's occupancy every few seconds so the
 * live pin/sheet numbers move without a server.
 */
export function createMockSocket(): BusySocket {
  const updateListeners: BusySocketEvents['busy:update'][] = [];
  const connectListeners: BusySocketEvents['connect'][] = [];
  const disconnectListeners: BusySocketEvents['disconnect'][] = [];
  const connectErrorListeners: BusySocketEvents['connect_error'][] = [];

  const capacities = new Map<string, number>();
  const occupancies = new Map<string, number>();
  for (const entity of [MOCK_STORE, ...getMockEvents()]) {
    capacities.set(entity.id, entity.busy.capacity);
    occupancies.set(entity.id, entity.busy.occupancy);
  }

  let connected = false;
  let tickTimer: ReturnType<typeof setTimeout> | null = null;
  let connectTimer: ReturnType<typeof setTimeout> | null = null;

  const stopTimers = (): void => {
    if (tickTimer) clearTimeout(tickTimer);
    if (connectTimer) clearTimeout(connectTimer);
    tickTimer = null;
    connectTimer = null;
  };

  const tick = (): void => {
    if (!connected) return;

    const ids = [...occupancies.keys()];
    const id = ids[Math.floor(Math.random() * ids.length)];
    if (id) {
      const capacity = capacities.get(id) ?? 0;
      const current = occupancies.get(id) ?? 0;
      const delta = Math.floor(Math.random() * 7) - 3; // -3..+3 people
      // The "full" demo scenario must survive the random walk: keep everyone
      // pinned at capacity so the full state stays visible.
      const next =
        MOCK_SCENARIO === 'full' && id !== MOCK_STORE.id
          ? capacity
          : Math.max(0, Math.min(capacity, current + delta));
      occupancies.set(id, next);

      const update: BusyUpdate = { id, occupancy: next };
      for (const listener of updateListeners) listener(update);
    }

    tickTimer = setTimeout(tick, 2000 + Math.random() * 3000);
  };

  const socket: BusySocket = {
    on(event, listener) {
      switch (event) {
        case 'busy:update':
          updateListeners.push(listener as BusySocketEvents['busy:update']);
          break;
        case 'connect':
          connectListeners.push(listener as BusySocketEvents['connect']);
          break;
        case 'disconnect':
          disconnectListeners.push(listener as BusySocketEvents['disconnect']);
          break;
        case 'connect_error':
          connectErrorListeners.push(listener as BusySocketEvents['connect_error']);
          break;
      }
    },

    disconnect() {
      connected = false;
      stopTimers();
      for (const listener of disconnectListeners) listener();
    },
  };

  // Simulate the connection handshake a moment after subscribing.
  connectTimer = setTimeout(() => {
    connected = true;
    for (const listener of connectListeners) listener();
    tickTimer = setTimeout(tick, 1500);
  }, 500);

  return socket;
}
