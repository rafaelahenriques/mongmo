import { ensureProfile } from '@/api/endpoints';
import { requestRefund } from '@/api/payments';
import { toApiError } from '@/api/errors';
import { getCurrentUserId, supabase } from '@/lib/supabase';
import type { CartLocation } from '@/state/cartStore';
import type { Database } from '@/types/database';

export type OrderMenuItem = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  /** The menu's section ("savoury", "drinks"); items without one go last. */
  category: string | null;
  /** The sections this is an option for (a dip, extra protein); null for a normal item. */
  addOnFor: string[] | null;
  /** Which of the 14 EU allergens it contains; null when not filled in yet, [] for none. */
  allergens: string[] | null;
};

export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type OrderItemRow = Database['public']['Tables']['order_items']['Row'];

/** The café and pop-up menus are the same shape; only the source id differs. */
async function menuIdsForLocation(location: CartLocation): Promise<string[]> {
  if (location.type === 'store') {
    const { data, error } = await supabase.from('stores').select('menu_id').eq('id', location.storeId).single();
    if (error) throw toApiError(error);
    return data.menu_id ? [data.menu_id] : [];
  }

  const { data, error } = await supabase.from('event_menus').select('menu_id').eq('event_id', location.eventId);
  if (error) throw toApiError(error);
  return data.map((row) => row.menu_id);
}

/** Available items across every menu attached to this location, in menu order. */
export async function getMenuItems(location: CartLocation): Promise<OrderMenuItem[]> {
  const menuIds = await menuIdsForLocation(location);
  if (menuIds.length === 0) return [];

  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, description, price_cents, image_url, category, add_on_for, allergens')
    .in('menu_id', menuIds)
    .eq('available', true)
    .order('sort_order');
  if (error) throw toApiError(error);

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    imageUrl: row.image_url,
    category: row.category,
    addOnFor: row.add_on_for,
    allergens: row.allergens,
  }));
}

/**
 * Creates the order server-side as a draft (prices and totals computed from
 * item ids only). It's placed by paying at pickup (placeAtPickup) or
 * online (the payment, confirmed by Stripe to the server).
 */
export async function createDraftOrder(
  location: CartLocation,
  items: { menuItemId: string; quantity: number; options?: string[] }[],
  pickupAt: string | null,
  /** A redeemed discount reward to apply; the server checks it's yours and unused. */
  userRewardId: string | null = null,
): Promise<OrderRow> {
  // An order needs the profile it belongs to; older accounts may lack one.
  await ensureProfile();

  const { data: order, error } = await supabase.rpc('create_order', {
    p_store_id: location.type === 'store' ? location.storeId : null,
    p_event_id: location.type === 'event' ? location.eventId : null,
    p_items: items.map((item) => ({
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      ...(item.options?.length ? { options: item.options } : {}),
    })),
    p_pickup_at: pickupAt,
    p_user_reward_id: userRewardId,
  });
  if (error) throw toApiError(error);
  return order;
}

/** Places a draft order, to be paid at the counter on pickup. */
export async function placeAtPickup(orderId: string): Promise<OrderRow> {
  const { data, error } = await supabase.rpc('place_order', { p_order_id: orderId });
  if (error) throw toApiError(error);
  return data;
}

/** Creates the order and places it, to be paid at the counter on pickup. */
export async function placeOrder(
  location: CartLocation,
  items: { menuItemId: string; quantity: number; options?: string[] }[],
  pickupAt: string | null,
  userRewardId: string | null = null,
): Promise<OrderRow> {
  const order = await createDraftOrder(location, items, pickupAt, userRewardId);
  return placeAtPickup(order.id);
}

/**
 * After the payment sheet: the order as soon as Stripe has confirmed the
 * payment to the server (paid and placed), or as it is after `timeoutMs`
 * (the status screen keeps checking and says it's confirming).
 */
export async function waitForPayment(orderId: string, timeoutMs = 12_000, everyMs = 1_000): Promise<OrderRow> {
  const until = Date.now() + timeoutMs;
  for (;;) {
    const order = await getOrder(orderId);
    if (order.paid_at || Date.now() >= until) return order;
    await new Promise((resolve) => setTimeout(resolve, everyMs));
  }
}

/**
 * Cancels your own order while the café hasn't started on it; a reward
 * used on it comes back. Refused once staff have accepted it.
 */
export async function cancelMyOrder(orderId: string): Promise<OrderRow> {
  const { data, error } = await supabase.rpc('cancel_my_order', { p_order_id: orderId });
  if (error) throw toApiError(error);
  // Paid online: the money goes back. If asking fails, the order still
  // says a refund is due, and staff can send it from Owner tools.
  if (data.refund_status === 'pending') await requestRefund(orderId).catch(() => undefined);
  return data;
}

export async function getOrder(orderId: string): Promise<OrderRow> {
  const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (error) throw toApiError(error);
  return data;
}

export async function getOrderItems(orderId: string): Promise<OrderItemRow[]> {
  const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  if (error) throw toApiError(error);
  return data;
}

/** What's in each of these orders, as "2 × Bánh mì" lines, by order id. */
export async function getOrderLines(orderIds: string[]): Promise<Record<string, string[]>> {
  if (orderIds.length === 0) return {};
  const { data, error } = await supabase
    .from('order_items')
    .select('order_id, name_snapshot, quantity')
    .in('order_id', orderIds);
  if (error) throw toApiError(error);
  const lines: Record<string, string[]> = {};
  for (const row of data) {
    (lines[row.order_id] ??= []).push(row.quantity > 1 ? `${row.quantity} × ${row.name_snapshot}` : row.name_snapshot);
  }
  return lines;
}

/** Order history, newest first — excludes abandoned drafts. */
export async function getMyOrders(): Promise<OrderRow[]> {
  // Scoped explicitly: RLS also lets an owner read every customer's orders.
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'draft')
    .order('created_at', { ascending: false });
  if (error) throw toApiError(error);
  return data;
}
