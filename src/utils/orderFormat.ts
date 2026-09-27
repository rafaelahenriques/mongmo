import type { OrderStatus } from '@/types/database';

/** Client-facing status labels (AGENTS.md keeps `draft`/`paid` internal). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: 'Draft',
  paid: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

/** `€6.50` from an integer cent amount. */
export function formatCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

/** Short human pickup code shown at the counter — the order id needs no separate token. */
export function pickupCode(orderId: string): string {
  return orderId.slice(0, 6).toUpperCase();
}
