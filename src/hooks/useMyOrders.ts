import { useQuery } from '@tanstack/react-query';

import { getMyOrders } from '@/api/orders';

/** Order history, newest first. */
export function useMyOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => getMyOrders(),
  });
}
