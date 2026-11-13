import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createDraftOrder, placeAtPickup, waitForPayment, type OrderRow } from '@/api/orders';
import { payOrder } from '@/services/payments';
import { useCartStore } from '@/state/cartStore';
import type { CartLocation } from '@/state/cartStore';

export type PaymentChoice = 'online' | 'at_pickup';

export type PlaceOrderInput = {
  location: CartLocation;
  items: { menuItemId: string; quantity: number; options?: string[] }[];
  pickupAt: string | null;
  userRewardId?: string | null;
  payment: PaymentChoice;
  /** A draft made for the same cart before (the payment sheet was closed): used again. */
  draft?: { id: string; totalCents: number } | null;
};

/**
 * placed: paying at pickup · paid: paid online (the order may still be
 * confirming) · cancelled: they closed the payment sheet, nothing charged,
 * and the draft can be used for the next try.
 */
export type PlaceOrderResult = { order: OrderRow; outcome: 'placed' | 'paid' | 'cancelled' };

/** Places the order, paying at pickup or online, and clears the cart once it's placed or paid. */
export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      location,
      items,
      pickupAt,
      userRewardId = null,
      payment,
      draft = null,
    }: PlaceOrderInput): Promise<PlaceOrderResult> => {
      const order: Pick<OrderRow, 'id' | 'total_cents'> = draft
        ? { id: draft.id, total_cents: draft.totalCents }
        : await createDraftOrder(location, items, pickupAt, userRewardId);
      // Nothing to pay (a reward covers it all): just place it.
      if (payment === 'at_pickup' || order.total_cents === 0) {
        return { order: await placeAtPickup(order.id), outcome: 'placed' };
      }
      const outcome = await payOrder(order.id);
      if (outcome === 'cancelled') return { order: order as OrderRow, outcome };
      return { order: await waitForPayment(order.id), outcome: 'paid' };
    },
    onSuccess: ({ outcome }) => {
      if (outcome === 'cancelled') return;
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
