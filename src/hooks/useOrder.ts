import { useQuery } from '@tanstack/react-query';

import { getOrder, getOrderItems } from '@/api/orders';

/** A single order plus its line items, for the status screen. */
export function useOrder(orderId: string) {
  const order = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
    enabled: orderId.length > 0,
    // Cheap fallback for live status until the Realtime subscription
    // (see useOrderStatusNotifications) invalidates it directly.
    refetchInterval: 15_000,
  });

  const items = useQuery({
    queryKey: ['order-items', orderId],
    queryFn: () => getOrderItems(orderId),
    enabled: orderId.length > 0,
  });

  return { order, items };
}
