import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getDishStock, setDishLimits, type DishPlace, type DishStock } from '@/api/dishLimits';

const placeKey = (place: DishPlace | null) =>
  !place ? 'none' : 'storeId' in place ? `store:${place.storeId}` : `event:${place.eventId}`;

/**
 * The dishes with a limit at a place, and what's left of each: at the café
 * on `day` (yyyy-MM-dd; today when left out), at a pop-up over all of it.
 * Checked again every minute while it's on screen: other people order too.
 */
export function useDishStock(place: DishPlace | null, day?: string) {
  return useQuery({
    queryKey: ['dish-stock', placeKey(place), day ?? 'today'],
    queryFn: () => getDishStock(place as DishPlace, day),
    enabled: place !== null,
    refetchInterval: 60_000,
    staleTime: 15_000,
  });
}

/** How many are left of each dish with a limit, by menu item id (a dish that's not in it has no limit). */
export function leftById(stock: DishStock[] | undefined): Record<string, number> {
  const left: Record<string, number> = {};
  for (const row of stock ?? []) left[row.menuItemId] = row.left;
  return left;
}

/** Staff: save the limits for a place. */
export function useSetDishLimits(place: DishPlace) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (limits: { menuItemId: string; max: number | null }[]) => setDishLimits(place, limits),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['dish-stock'] }),
  });
}
