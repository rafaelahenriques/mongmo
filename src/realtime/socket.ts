import { io } from 'socket.io-client';

import { SOCKET_URL } from '@/constants/config';
import { createMockSocket } from '@/realtime/mockSocket';
import type { BusySocket } from '@/realtime/types';

function createRealSocket(url: string): BusySocket {
  const socket = io(url, { transports: ['websocket'], autoConnect: true });
  return {
    on(event, listener) {
      // socket.io's conditional listener type can't see our generic's exact
      // payload shape; the contract above guarantees they match.
      socket.on(event, listener as never);
    },
    disconnect() {
      socket.disconnect();
    },
  };
}

/**
 * Live busy-count stream for the app. Uses a real Socket.IO connection when
 * `EXPO_PUBLIC_SOCKET_URL` is configured and the bundled mock otherwise —
 * callers only ever see a `BusySocket`.
 */
export function createBusySocket(): BusySocket {
  return SOCKET_URL ? createRealSocket(SOCKET_URL) : createMockSocket();
}
