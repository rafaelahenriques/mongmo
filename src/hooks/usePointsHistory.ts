import { useQuery } from '@tanstack/react-query';

import { getPointsHistory } from '@/api/endpoints';

/** The points ledger, newest first: what each +20 or −30 was for. */
export function usePointsHistory() {
  return useQuery({
    queryKey: ['points', 'history'],
    queryFn: () => getPointsHistory(),
  });
}
