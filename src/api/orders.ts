import { toApiError } from '@/api/errors';
import { getCurrentUserId, supabase } from '@/lib/supabase';
import type { CartLocation } from '@/state/cartStore';
import type { Database } from '@/types/database';

export type OrderMenuItem = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
};

export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type OrderItemRow = Database['public']['Tables']['order_items']['Row'];

/** The café and pop-up menus are the same shape; only the source id differs. */
async function menuIdsForLocation(location: CartLocation): Promise<string[]> {
  if (location.type === 'store') {
    const { data, error } = await supabase
      .from('stores')
      .select('menu_id')
      .eq('id', location.storeId)
      .single();
    if (error) throw toApiError(error);
    return data.menu_id ? [data.menu_id] : [];
  }

  const { data, error } = await supabase
    .from('event_menus')
    .select('menu_id')
    .eq('event_id', location.eventId);
  if (error) throw toApiError(error);
  return data.map((row) => row.menu_id);
}

/** Available items across every menu attached to this location, in menu order. */
export async function getMenuItems(location: CartLocation): Promise<OrderMenuItem[]> {
  const menuIds = await menuIdsForLocation(location);
  if (menuIds.length === 0) return [];

  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, description, price_cents')
    .in('menu_id', menuIds)
    .eq('available', true)
    .order('sort_order');
  if (error) throw toApiError(error);

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
  }));
}

/**
 * Creates the order server-side (prices/totals computed from item ids only)
 * and immediately confirms the mock payment — see AGENTS.md: "Use a
 * mock/test payment clearly labelled as prototype."
 */
export async function placeOrder(
  location: CartLocation,
  items: { menuItemId: string; quantity: number }[],
  pickupAt: string | null,
  /** A redeemed discount reward to apply; the server checks it's yours and unused. */
  userRewardId: string | null = null,
): Promise<OrderRow> {
  const { data: order, error } = await supabase.rpc('create_order', {
    p_store_id: location.type === 'store' ? location.storeId : null,
    p_event_id: location.type === 'event' ? location.eventId : null,
    p_items: items.map((item) => ({ menu_item_id: item.menuItemId, quantity: item.quantity })),
    p_pickup_at: pickupAt,
    p_user_reward_id: userRewardId,
  });
  if (error) throw toApiError(error);

  const { data: paid, error: payError } = await supabase.rpc('confirm_mock_payment', {
    p_order_id: order.id,
  });
  if (payError) throw toApiError(payError);
  return paid;
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
