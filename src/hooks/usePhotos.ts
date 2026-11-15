import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteReportedPhoto,
  getEventPhotos,
  getMyPhotos,
  getOfferedPhotos,
  getPhotosOfTheWeek,
  getReportedPhotos,
  reportPhoto,
  reviewReportedPhoto,
  setPhotoFeatured,
  setPhotoShared,
  type ReportedPhoto,
} from '@/api/photos';

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

/** This week's photos, picked by staff from what members shared (Home). */
export function usePhotosOfTheWeek() {
  return useQuery({ queryKey: ['photos', 'week'], queryFn: getPhotosOfTheWeek });
}

/** Offer one of your photos for Photos of the week, or take it back. */
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

/** Staff: photos members are offering for Photos of the week (Owner tools). */
export function useOfferedPhotos() {
  return useQuery({ queryKey: ['photos', 'offered'], queryFn: getOfferedPhotos });
}

/** Staff: put a photo in Photos of the week, or take it out. */
export function useSetPhotoFeatured() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ photoId, featured }: { photoId: string; featured: boolean }) => setPhotoFeatured(photoId, featured),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['photos'] }),
  });
}

/** Staff: reported photos waiting for a decision (Owner tools). */
export function useReportedPhotos(enabled = true) {
  return useQuery({ queryKey: ['photos', 'reported'], queryFn: getReportedPhotos, enabled });
}

/** Staff: decide on a reported photo: put it back, keep it down, or delete it. */
export function useReviewReportedPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ photo, decision }: { photo: ReportedPhoto; decision: 'restore' | 'keep' | 'delete' }) =>
      decision === 'delete' ? deleteReportedPhoto(photo) : reviewReportedPhoto(photo.id, decision === 'restore'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['photos'] }),
  });
}
