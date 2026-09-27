import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { advanceOrderStatus, getOwnerOrders } from '@/api/owner';

/** Every non-draft order, for the owner's status board. */
export function useOwnerOrders() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['owner', 'orders'],
    queryFn: () => getOwnerOrders(),
    refetchInterval: 15_000,
  });

  const advance = useMutation({
    mutationFn: (params: { orderId: string; status: 'preparing' | 'ready' | 'collected' | 'cancelled' }) =>
      advanceOrderStatus(params.orderId, params.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] }),
  });

  return {
    orders: query.data ?? [],
    isLoading: query.isPending,
    advance: advance.mutate,
  };
}
