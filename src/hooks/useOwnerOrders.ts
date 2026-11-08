import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { advanceOrderStatus, getOwnerOrderInfo, getOwnerOrders } from '@/api/owner';
import { haptics } from '@/services/haptics';

/** Every non-draft order, for the owner's status board. */
export function useOwnerOrders() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['owner', 'orders'],
    queryFn: () => getOwnerOrders(),
    refetchInterval: 15_000,
  });

  const orders = query.data ?? [];
  const info = useQuery({
    queryKey: ['owner', 'orders', 'info', orders.map((order) => order.id).join(',')],
    queryFn: () => getOwnerOrderInfo(orders),
    enabled: orders.length > 0,
  });

  const advance = useMutation({
    mutationFn: (params: { orderId: string; status: 'preparing' | 'ready' | 'collected' | 'cancelled' }) =>
      advanceOrderStatus(params.orderId, params.status),
    onSuccess: (_, { status }) => {
      if (status === 'ready' || status === 'collected') haptics.success();
      return queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
    },
    onError: () => haptics.error(),
  });

  return {
    orders,
    /** Who ordered and the lines, by order id. */
    info: info.data ?? {},
    isLoading: query.isPending,
    /** Couldn't load (and nothing cached to show). */
    isError: query.isError && !query.data,
    refetch: query.refetch,
    advance: advance.mutate,
    advancing: advance.isPending,
  };
}
