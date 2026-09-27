import { toApiError } from '@/api/errors';
import { getCurrentUserId, supabase } from '@/lib/supabase';
import type { ChallengeType } from '@/types';
import type { Database } from '@/types/database';

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

export async function setEventStatus(
  eventId: string,
  status: 'ended' | 'cancelled',
): Promise<void> {
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
  type: ChallengeType;
  title: string;
  description: string;
  points: number;
};

export async function createChallenge(eventId: string, input: ChallengeInput): Promise<void> {
  const { error } = await supabase.from('challenges').insert({
    event_id: eventId,
    type: input.type,
    title: input.title,
    description: input.description,
    points: input.points,
  });
  if (error) throw toApiError(error);
}

export async function updateChallenge(challengeId: string, input: ChallengeInput): Promise<void> {
  const { error } = await supabase
    .from('challenges')
    .update({
      type: input.type,
      title: input.title,
      description: input.description,
      points: input.points,
    })
    .eq('id', challengeId);
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
  const { error } = await supabase
    .from('event_menus')
    .delete()
    .eq('event_id', eventId)
    .eq('menu_id', menuId);
  if (error) throw toApiError(error);
}

/* ------------------------------------------------------------------ *
 * Orders (owner board)                                                 *
 * ------------------------------------------------------------------ */

export type OwnerOrderRow = Database['public']['Tables']['orders']['Row'];

/** Every non-draft order, for the owner's New/Preparing/Ready/Collected board. */
export async function getOwnerOrders(): Promise<OwnerOrderRow[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .neq('status', 'draft')
    .order('created_at', { ascending: true });
  if (error) throw toApiError(error);
  return data;
}

export async function advanceOrderStatus(
  orderId: string,
  status: 'preparing' | 'ready' | 'collected' | 'cancelled',
): Promise<void> {
  const { error } = await supabase.rpc('advance_order_status', {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw toApiError(error);
}
