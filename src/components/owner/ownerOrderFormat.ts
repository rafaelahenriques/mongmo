import type { OrderStatus } from '@/types/database';

/** The board's columns. New = paid orders nobody has started yet. */
export type OwnerColumn = 'new' | 'preparing' | 'ready' | 'collected';

export const COLUMN_LABEL: Record<OwnerColumn, string> = {
  new: 'New',
  preparing: 'Being made',
  ready: 'Ready',
  collected: 'Collected',
};

export function columnFor(status: OrderStatus): OwnerColumn | null {
  if (status === 'paid') return 'new';
  if (status === 'preparing' || status === 'ready' || status === 'collected') return status;
  return null;
}

/** One tap moves a ticket on. */
export const NEXT_STEP: Partial<Record<OwnerColumn, { status: 'preparing' | 'ready' | 'collected'; label: string }>> = {
  new: { status: 'preparing', label: 'Accept' },
  preparing: { status: 'ready', label: 'Mark as ready' },
  ready: { status: 'collected', label: 'Collected' },
};

/** "In 18 min", "Now", "As soon as possible". */
export function untilPickup(pickupAt: string | null, now: number, long = false): string {
  if (!pickupAt) return 'As soon as possible';
  const minutes = Math.round((Date.parse(pickupAt) - now) / 60_000);
  if (minutes <= 0) return 'Now';
  if (minutes >= 120) return `In ${Math.round(minutes / 60)} hours`;
  return `In ${minutes} ${long ? (minutes === 1 ? 'minute' : 'minutes') : 'min'}`;
}
