import { useQuery } from '@tanstack/react-query';

import { getProfile } from '@/api/endpoints';

/** The signed-in user's profile (cached with the rest of the API cache). */
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: ({ signal }) => getProfile(signal),
  });
}
