import { toApiError } from '@/api/errors';
import { supabase } from '@/lib/supabase';
import type { CartLocation } from '@/state/cartStore';

/** A place to sell from: the café, or a pop-up. */
export type DishPlace = { storeId: string } | { eventId: string };

/** A dish with a limit at a place: the most there can be, how many are left, and (staff only) how many were ordered. */
export type DishStock = { menuItemId: string; max: number; left: number; sold: number | null };

const placeArgs = (place: DishPlace) => ({
  p_store_id: 'storeId' in place ? place.storeId : null,
  p_event_id: 'eventId' in place ? place.eventId : null,
});

export const placeOf = (location: CartLocation): DishPlace =>
  location.type === 'store' ? { storeId: location.storeId } : { eventId: location.eventId };

/**
 * What's left of each dish with a limit at a place: over the whole of a
 * pop-up, or on one day at the café (`day`, yyyy-MM-dd; today when left out).
 * Dishes without a limit aren't in it.
 */
export async function getDishStock(place: DishPlace, day?: string): Promise<DishStock[]> {
  const { data, error } = await supabase.rpc('dish_stock', { ...placeArgs(place), p_day: day ?? null });
  if (error) throw toApiError(error);
  return data.map((row) => ({
    menuItemId: row.menu_item_id,
    max: row.max_quantity,
    left: row.remaining,
    sold: row.sold,
  }));
}

/** Staff: sets the most of each dish a place can sell; null takes a dish's limit away. */
export async function setDishLimits(
  place: DishPlace,
  limits: { menuItemId: string; max: number | null }[],
): Promise<void> {
  const { error } = await supabase.rpc('set_dish_limits', {
    ...placeArgs(place),
    p_limits: limits.map((limit) => ({ menu_item_id: limit.menuItemId, max_quantity: limit.max })),
  });
  if (error) throw toApiError(error);
}
