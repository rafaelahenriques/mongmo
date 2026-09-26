import type { BusyUpdate } from '@/types';

export type RealtimeStatus = 'connecting' | 'live';

/** Events the app listens for on the busy-count stream. */
export type BusySocketEvents = {
  'busy:update': (update: BusyUpdate) => void;
  connect: () => void;
  disconnect: () => void;
  connect_error: () => void;
};

/**
 * Minimal Socket.IO-shaped surface the app consumes. Both the real
 * socket.io-client connection and the local mock implement this, so the
 * hooks above them never know which one they got.
 */
export interface BusySocket {
  on<E extends keyof BusySocketEvents>(event: E, listener: BusySocketEvents[E]): void;
  disconnect(): void;
}
