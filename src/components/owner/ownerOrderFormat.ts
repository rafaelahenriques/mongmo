import type { OrderStatus } from '@/types/database';

/** The board's columns. New = placed orders nobody has started yet. */
export type OwnerColumn = 'new' | 'preparing' | 'ready' | 'collected';

export const COLUMN_LABEL: Record<OwnerColumn, string> = {
  new: 'New',
  preparing: 'Being made',
  ready: 'Ready',
  collected: 'Collected',
};

export function columnFor(status: OrderStatus): OwnerColumn | null {
  if (status === 'placed') return 'new';
  if (status === 'preparing' || status === 'ready' || status === 'collected') return status;
  return null;
}

/** One tap moves a ticket on. */
export const NEXT_STEP: Partial<Record<OwnerColumn, { status: 'preparing' | 'ready' | 'collected'; label: string }>> = {
  new: { status: 'preparing', label: 'Accept' },
  preparing: { status: 'ready', label: 'Mark as ready' },
  // Handing it over is when the customer pays.
  ready: { status: 'collected', label: 'Paid & collected' },
};

/** The button's words: handing over an order that's already paid online takes no payment. */
export function stepLabel(column: OwnerColumn, order: { payment: string; paid_at: string | null }): string | null {
  const step = NEXT_STEP[column];
  if (!step) return null;
  return column === 'ready' && order.payment === 'online' && order.paid_at ? 'Collected' : step.label;
}

/** "In 18 min", "Now", "As soon as possible". */
export function untilPickup(pickupAt: string | null, now: number, long = false): string {
  if (!pickupAt) return 'As soon as possible';
  const minutes = Math.round((Date.parse(pickupAt) - now) / 60_000);
  if (minutes <= 0) return 'Now';
  if (minutes >= 120) return `In ${Math.round(minutes / 60)} hours`;
  return `In ${minutes} ${long ? (minutes === 1 ? 'minute' : 'minutes') : 'min'}`;
}
