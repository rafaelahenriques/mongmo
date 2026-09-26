import { useEffect } from 'react';

import { createBusySocket } from '@/realtime/socket';
import type { RealtimeStatus } from '@/realtime/types';
import { useBusyStore } from '@/state/busyStore';

/**
 * Subscribes to the busy-count websocket for the lifetime of the app (called
 * once from Providers). Updates land in `useBusyStore`, which pins, sheets
 * and cards read through fine-grained selectors — no manual refresh anywhere.
 */
export function useRealtime(): RealtimeStatus {
  const status = useBusyStore((state) => state.status);
  const setOccupancy = useBusyStore((state) => state.setOccupancy);
  const setStatus = useBusyStore((state) => state.setStatus);

  useEffect(() => {
    const socket = createBusySocket();
    socket.on('connect', () => setStatus('live'));
    socket.on('disconnect', () => setStatus('connecting'));
    socket.on('connect_error', () => setStatus('connecting'));
    socket.on('busy:update', (update) => setOccupancy(update.id, update.occupancy));

    return () => socket.disconnect();
  }, [setOccupancy, setStatus]);

  return status;
}
