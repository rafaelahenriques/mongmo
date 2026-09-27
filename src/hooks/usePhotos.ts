import { useQuery } from '@tanstack/react-query';

import { getEventPhotos, getMyPhotos } from '@/api/photos';

/** The signed-in user's challenge photos (Profile gallery). */
export function useMyPhotos() {
  return useQuery({ queryKey: ['photos', 'mine'], queryFn: getMyPhotos });
}

/** Every guest's photos from one pop-up (owner tools). */
export function useEventPhotos(eventId: string) {
  return useQuery({
    queryKey: ['photos', 'event', eventId],
    queryFn: () => getEventPhotos(eventId),
    enabled: eventId.length > 0,
  });
}
