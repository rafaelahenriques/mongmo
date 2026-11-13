import type { OrderStatus } from '@/types/database';

/** Client-facing status labels (`draft` and `placed` stay internal). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: 'Draft',
  placed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

/** `6,50` from an integer cent amount: euros, the way the menu board writes them. */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

/** The menu's big price, "10" and a raised "50". */
export function priceParts(cents: number): { euros: string; cents: string } {
  return { euros: String(Math.floor(cents / 100)), cents: String(cents % 100).padStart(2, '0') };
}

/** What the order is doing, as the status screen's heading. */
export const ORDER_STATUS_TITLE: Record<OrderStatus, string> = {
  draft: 'Not placed',
  placed: 'Confirmed',
  preparing: 'Being made',
  ready: 'Ready',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

/** Confirmed → Being made → Ready, and the step an order has reached (for StepBar). */
export const ORDER_STEPS = ['Confirmed', 'Being made', 'Ready'];
export const ORDER_STEP: Partial<Record<OrderStatus, number>> = { placed: 0, preparing: 1, ready: 2, collected: 2 };

/** Short human pickup code shown at the counter — the order id needs no separate token. */
export function pickupCode(orderId: string): string {
  return orderId.slice(0, 6).toUpperCase();
}

/**
 * An item's name under its section: "Bánh mì, crispy pork belly" in
 * "Bánh mì" reads "Crispy pork belly". The full name is what the kitchen
 * sees on the order.
 */
export function shortItemName(name: string, category: string | null): string {
  if (!category) return name;
  const prefix = category.trim().toLowerCase();
  if (!name.toLowerCase().startsWith(prefix)) return name;
  const rest = name.slice(prefix.length).replace(/^[\s,:·-]+/, '');
  return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : name;
}

type PaymentFields = {
  status: OrderStatus;
  payment: 'at_pickup' | 'online';
  paid_at: string | null;
  refund_status: 'pending' | 'refunded' | 'failed' | null;
};

/** Whether the money for this order has come in online (so nobody charges it again at the counter). */
export function paidOnline(order: PaymentFields): boolean {
  return order.payment === 'online' && order.paid_at !== null;
}

/** How the customer pays, said under the total. */
export function paymentNote(order: PaymentFields): string {
  if (paidOnline(order)) return 'Paid online';
  if (order.status === 'collected') return 'Paid at the counter';
  if (order.status === 'draft' && order.payment === 'online') return 'Confirming your payment…';
  return 'Pay at the counter when you collect it';
}

/** Where a cancelled online payment's money is, for the customer; null when there's no refund. */
export function refundNote(order: PaymentFields): { title: string; subtitle: string } | null {
  if (order.status !== 'cancelled' || !paidOnline(order)) return null;
  if (order.refund_status === 'refunded') {
    return { title: 'Refunded', subtitle: 'The money is back on your card or account; banks can take a few days.' };
  }
  if (order.refund_status === 'failed') {
    return { title: 'Refund held up', subtitle: 'We’re sorting it out and will make sure you get it back.' };
  }
  return { title: 'Refund on its way', subtitle: 'Back on your card or account within a few days.' };
}
