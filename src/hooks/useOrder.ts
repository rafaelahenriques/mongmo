import { useQuery } from '@tanstack/react-query';

import { getOrder, getOrderItems } from '@/api/orders';
import type { OrderRow } from '@/api/orders';

/**
 * How often the status screen checks an order: every 2 seconds while an
 * online payment is being confirmed, every 15 while the kitchen has it or a
 * refund is on its way, and not at all once nothing more will change. A
 * cheap fallback: the Realtime subscription (see useOrderStatusNotifications)
 * refreshes it directly when it changes.
 */
export function orderRefetchInterval(order: Pick<OrderRow, 'status' | 'refund_status'> | undefined): number | false {
  if (!order) return 15_000;
  if (order.status === 'draft') return 2_000;
  if (order.status === 'collected') return false;
  if (order.status === 'cancelled') return order.refund_status === 'pending' ? 15_000 : false;
  return 15_000;
}

/** A single order plus its line items, for the status screen. */
export function useOrder(orderId: string) {
  const order = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
    enabled: orderId.length > 0,
    refetchInterval: (query) => orderRefetchInterval(query.state.data),
  });

  const items = useQuery({
    queryKey: ['order-items', orderId],
    queryFn: () => getOrderItems(orderId),
    enabled: orderId.length > 0,
  });

  return { order, items };
}
