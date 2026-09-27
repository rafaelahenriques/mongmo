import { useQuery } from '@tanstack/react-query';

import { getMenuItems } from '@/api/orders';
import type { CartLocation } from '@/state/cartStore';

function locationKey(location: CartLocation | null): string {
  if (!location) return 'none';
  return location.type === 'store' ? `store:${location.storeId}` : `event:${location.eventId}`;
}

/** Available menu items for the cart's current pickup location. */
export function useMenu(location: CartLocation | null) {
  return useQuery({
    queryKey: ['menu', locationKey(location)],
    queryFn: () => getMenuItems(location as CartLocation),
    enabled: location !== null,
  });
}
