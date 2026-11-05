import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getEventPhotos, getMyPhotos, getPhotosOfTheWeek, reportPhoto, setPhotoShared } from '@/api/photos';

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

/** Photos members shared this week (Home). */
export function usePhotosOfTheWeek() {
  return useQuery({ queryKey: ['photos', 'week'], queryFn: getPhotosOfTheWeek });
}

/** Share one of your photos in Photos of the week, or stop sharing it. */
export function useSetPhotoShared() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ photoIds, shared }: { photoIds: string[]; shared: boolean }) =>
      Promise.all(photoIds.map((id) => setPhotoShared(id, shared))),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['photos'] }),
  });
}

/** Report a photo of the week (it comes down at once). */
export function useReportPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reportPhoto,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['photos'] }),
  });
}
