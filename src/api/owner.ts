import { requestRefund } from '@/api/payments';
import { ApiError, toApiError } from '@/api/errors';
import { getCurrentUserId, supabase } from '@/lib/supabase';
import type { ChallengeRules } from '@/types';
import type { Database } from '@/types/database';
import { challengeConfigPayload } from '@/utils/challengeConfig';

export type OwnerEventSummary = {
  id: string;
  title: string;
  type: string;
  city: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  capacity: number;
};

/** Every event regardless of status — the owner manages past/cancelled ones too. */
export async function getOwnerEvents(): Promise<OwnerEventSummary[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, type, city, venue, starts_at, ends_at, time_zone, status, capacity')
    .order('starts_at', { ascending: false });
  if (error) throw toApiError(error);

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    city: row.city,
    venue: row.venue,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timeZone: row.time_zone,
    status: row.status,
    capacity: row.capacity,
  }));
}

export type OwnerEventInput = {
  title: string;
  type: string;
  city: string;
  venue: string;
  latitude: number;
  longitude: number;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  description: string;
  imageUrl: string;
  capacity: number;
};

type EventRow = Database['public']['Tables']['events']['Row'];

/** Everything the owner edit form needs — `qr_token` stays out (get_event_qr_token only). */
export async function getOwnerEvent(eventId: string): Promise<Omit<EventRow, 'qr_token'>> {
  const { data, error } = await supabase
    .from('events')
    .select(
      'id, title, type, city, venue, latitude, longitude, starts_at, ends_at, time_zone, description, image_url, tags, capacity, occupancy, status, order_url, created_by, created_at',
    )
    .eq('id', eventId)
    .single();
  if (error) throw toApiError(error);
  return data;
}

export async function createEvent(input: OwnerEventInput): Promise<string> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: input.title,
      type: input.type,
      city: input.city,
      venue: input.venue,
      latitude: input.latitude,
      longitude: input.longitude,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      time_zone: input.timeZone,
      description: input.description,
      image_url: input.imageUrl || null,
      capacity: input.capacity,
      created_by: userId,
    })
    .select('id')
    .single();
  if (error) throw toApiError(error);
  return data.id;
}

export async function updateEvent(eventId: string, input: OwnerEventInput): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({
      title: input.title,
      type: input.type,
      city: input.city,
      venue: input.venue,
      latitude: input.latitude,
      longitude: input.longitude,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      time_zone: input.timeZone,
      description: input.description,
      image_url: input.imageUrl || null,
      capacity: input.capacity,
    })
    .eq('id', eventId);
  if (error) throw toApiError(error);
}

export async function setEventStatus(eventId: string, status: 'ended' | 'cancelled'): Promise<void> {
  const { error } = await supabase.from('events').update({ status }).eq('id', eventId);
  if (error) throw toApiError(error);
}

/** Owner-only: the one legitimate way to read an event's QR token (for printing/display). */
export async function getEventQrToken(eventId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_event_qr_token', { p_event_id: eventId });
  if (error) throw toApiError(error);
  return data;
}

/* ------------------------------------------------------------------ *
 * Challenges (owner CRUD)                                             *
 * ------------------------------------------------------------------ */

export type ChallengeInput = {
  title: string;
  description: string;
  points: number;
  rules: ChallengeRules;
};

const challengeColumns = (input: ChallengeInput) => ({
  type: input.rules.type,
  title: input.title.trim(),
  description: input.description.trim(),
  points: input.points,
  config: challengeConfigPayload(input.rules),
});

export async function createChallenge(eventId: string, input: ChallengeInput): Promise<void> {
  const { error } = await supabase.from('challenges').insert({ event_id: eventId, ...challengeColumns(input) });
  if (error) throw toApiError(error);
}

export async function updateChallenge(challengeId: string, input: ChallengeInput): Promise<void> {
  const { error } = await supabase.from('challenges').update(challengeColumns(input)).eq('id', challengeId);
  if (error) throw toApiError(error);
}

export async function deleteChallenge(challengeId: string): Promise<void> {
  const { error } = await supabase.from('challenges').delete().eq('id', challengeId);
  if (error) throw toApiError(error);
}

/* ------------------------------------------------------------------ *
 * Menus (attach an existing menu to an event — items are pre-defined) *
 * ------------------------------------------------------------------ */

export type MenuSummary = { id: string; name: string };

export async function getMenus(): Promise<MenuSummary[]> {
  const { data, error } = await supabase.from('menus').select('id, name').eq('active', true);
  if (error) throw toApiError(error);
  return data;
}

export async function getEventMenuIds(eventId: string): Promise<string[]> {
  const { data, error } = await supabase.from('event_menus').select('menu_id').eq('event_id', eventId);
  if (error) throw toApiError(error);
  return data.map((row) => row.menu_id);
}

export async function attachMenu(eventId: string, menuId: string): Promise<void> {
  const { error } = await supabase.from('event_menus').insert({ event_id: eventId, menu_id: menuId });
  if (error) throw toApiError(error);
}

export async function detachMenu(eventId: string, menuId: string): Promise<void> {
  const { error } = await supabase.from('event_menus').delete().eq('event_id', eventId).eq('menu_id', menuId);
  if (error) throw toApiError(error);
}

/* ------------------------------------------------------------------ *
 * The menu (owner: items, prices, what's on today)                     *
 * ------------------------------------------------------------------ */

export type OwnerMenuItem = {
  id: string;
  menuId: string;
  name: string;
  description: string;
  priceCents: number;
  /** The section it's listed under; for an option, the group it's offered in. */
  category: string;
  sortOrder: number;
  /** Off: customers don't see it and can't order it. */
  available: boolean;
  /** The sections this is an option for; null for a dish or drink of its own. */
  optionFor: string[] | null;
  /** Which of the 14 allergens it contains; null while not filled in. */
  allergens: string[] | null;
};

export type OwnerMenu = { id: string; name: string; items: OwnerMenuItem[] };

/** What the owner fills in for an item. */
export type MenuItemInput = Pick<
  OwnerMenuItem,
  'name' | 'description' | 'priceCents' | 'category' | 'available' | 'optionFor' | 'allergens'
>;

/** Every active menu with all its items, the ones taken off included, in menu order. */
export async function getOwnerMenus(): Promise<OwnerMenu[]> {
  const menus = await supabase.from('menus').select('id, name').eq('active', true).order('name');
  if (menus.error) throw toApiError(menus.error);
  if (menus.data.length === 0) return [];
  const items = await supabase
    .from('menu_items')
    .select('*')
    .in(
      'menu_id',
      menus.data.map((menu) => menu.id),
    )
    .order('sort_order');
  if (items.error) throw toApiError(items.error);
  return menus.data.map((menu) => ({
    id: menu.id,
    name: menu.name,
    items: items.data
      .filter((row) => row.menu_id === menu.id)
      .map((row) => ({
        id: row.id,
        menuId: row.menu_id,
        name: row.name,
        description: row.description ?? '',
        priceCents: row.price_cents,
        category: row.category ?? '',
        sortOrder: row.sort_order,
        available: row.available,
        optionFor: row.add_on_for?.length ? row.add_on_for : null,
        allergens: row.allergens,
      })),
  }));
}

const menuItemColumns = (input: MenuItemInput) => ({
  name: input.name.trim(),
  description: input.description.trim() || null,
  price_cents: input.priceCents,
  category: input.category.trim() || null,
  available: input.available,
  add_on_for: input.optionFor?.length ? input.optionFor : null,
  allergens: input.allergens,
});

/** Adds an item at the end of its menu. Returns its id. */
export async function createMenuItem(menuId: string, input: MenuItemInput): Promise<string> {
  const last = await supabase
    .from('menu_items')
    .select('sort_order')
    .eq('menu_id', menuId)
    .order('sort_order', { ascending: false })
    .limit(1);
  if (last.error) throw toApiError(last.error);
  const { data, error } = await supabase
    .from('menu_items')
    .insert({ menu_id: menuId, sort_order: (last.data[0]?.sort_order ?? 0) + 1, ...menuItemColumns(input) })
    .select('id')
    .single();
  if (error) throw toApiError(error);
  return data.id;
}

export async function updateMenuItem(itemId: string, input: MenuItemInput): Promise<void> {
  const { error } = await supabase.from('menu_items').update(menuItemColumns(input)).eq('id', itemId);
  if (error) throw toApiError(error);
}

/** Puts an item on the menu, or takes it off (sold out, not today). */
export async function setMenuItemAvailable(itemId: string, available: boolean): Promise<void> {
  const { error } = await supabase.from('menu_items').update({ available }).eq('id', itemId);
  if (error) throw toApiError(error);
}

/** Postgres: another row still points at this one. */
const STILL_REFERENCED = '23503';

/**
 * Deletes an item for good. One that's on an order someone placed can't
 * go (the order keeps pointing at it): take it off the menu instead.
 */
export async function deleteMenuItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
  if (error?.code === STILL_REFERENCED) {
    throw new ApiError('It’s on orders people placed, so it can’t be deleted. Take it off the menu instead.', 409);
  }
  if (error) throw toApiError(error);
}

/* ------------------------------------------------------------------ *
 * Orders (owner board)                                                 *
 * ------------------------------------------------------------------ */

export type OwnerOrderRow = Database['public']['Tables']['orders']['Row'];

/** How far back the board's Collected column, and cancelled orders, go. */
const OWNER_BOARD_HISTORY_MS = 24 * 60 * 60 * 1000;

/**
 * The orders the owner's board needs: everything still with the kitchen,
 * what was collected or cancelled in the last day, and any cancelled order
 * whose online refund isn't confirmed. Not the whole history, which grows
 * with every order and is fetched again every 15 seconds.
 */
export async function getOwnerOrders(now = Date.now()): Promise<OwnerOrderRow[]> {
  const { data, error } = await supabase.rpc('owner_board_orders', {
    p_since: new Date(now - OWNER_BOARD_HISTORY_MS).toISOString(),
  });
  if (error) throw toApiError(error);
  return data;
}

/** Who ordered and what's in it, for the owner's board and order detail. */
export type OwnerOrderInfo = {
  name: string | null;
  lines: { id: string; name: string; options: string | null; quantity: number; totalCents: number }[];
};

export async function getOwnerOrderInfo(orders: OwnerOrderRow[]): Promise<Record<string, OwnerOrderInfo>> {
  if (orders.length === 0) return {};
  const [people, items] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name')
      .in('id', [...new Set(orders.map((order) => order.user_id))]),
    supabase
      .from('order_items')
      .select('id, order_id, name_snapshot, options_snapshot, quantity, line_total_cents')
      .in(
        'order_id',
        orders.map((order) => order.id),
      ),
  ]);
  if (people.error) throw toApiError(people.error);
  if (items.error) throw toApiError(items.error);
  const names = new Map(people.data.map((person) => [person.id, person.name]));
  const info: Record<string, OwnerOrderInfo> = {};
  for (const order of orders) info[order.id] = { name: names.get(order.user_id) ?? null, lines: [] };
  for (const row of items.data) {
    info[row.order_id]?.lines.push({
      id: row.id,
      name: row.name_snapshot,
      options: row.options_snapshot,
      quantity: row.quantity,
      totalCents: row.line_total_cents,
    });
  }
  return info;
}

export async function advanceOrderStatus(
  orderId: string,
  status: 'preparing' | 'ready' | 'collected' | 'cancelled',
): Promise<void> {
  const { data, error } = await supabase.rpc('advance_order_status', {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw toApiError(error);
  // Cancelling an order paid online gives the money back. If asking
  // fails, the order shows the refund as due, with Send refund.
  if (data?.refund_status === 'pending') await requestRefund(orderId).catch(() => undefined);
}
