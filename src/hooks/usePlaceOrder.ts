import { useMutation, useQueryClient } from '@tanstack/react-query';

import { placeOrder } from '@/api/orders';
import { useCartStore } from '@/state/cartStore';
import type { CartLocation } from '@/state/cartStore';

/** Places the order, confirms the mock payment, and clears the cart. */
export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      location,
      items,
      pickupAt,
      userRewardId = null,
    }: {
      location: CartLocation;
      items: { menuItemId: string; quantity: number }[];
      pickupAt: string | null;
      userRewardId?: string | null;
    }) => placeOrder(location, items, pickupAt, userRewardId),
    onSuccess: () => {
      useCartStore.getState().clear();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['active-order'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['user-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['points'] });
    },
  });
}
