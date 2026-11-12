import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getProfile,
  getReportedProfilePhotos,
  removeProfilePhoto,
  reportProfilePhoto,
  reviewReportedProfilePhoto,
  setLeaderboardVisible,
  setProfilePhoto,
  updateProfile,
  type ProfileEdit,
  type ReportedProfilePhoto,
} from '@/api/endpoints';
import type { PickedImage } from '@/services/pickImage';

/** The signed-in user's profile (cached with the rest of the API cache). */
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  });
}

/** Flips the "show me on the leaderboard" privacy toggle (server-side). */
export function useSetLeaderboardVisible() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (visible: boolean) => setLeaderboardVisible(visible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

/** Saves the user's name and home city (Profile → Edit). */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (edit: ProfileEdit) => updateProfile(edit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // The leaderboard shows names too.
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

/** Sets a new profile photo, or takes it away (null). It shows on the leaderboard too. */
export function useProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (image: PickedImage | null) => (image ? setProfilePhoto(image) : removeProfilePhoto()),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

/** Report someone's photo on the leaderboard (it's hidden at once). */
export function useReportProfilePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => reportProfilePhoto(userId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['leaderboard'] }),
  });
}

/** Staff: hidden profile photos waiting for a decision (Owner tools). */
export function useReportedProfilePhotos(enabled = true) {
  return useQuery({ queryKey: ['profilePhotos', 'reported'], queryFn: getReportedProfilePhotos, enabled });
}

/** Staff: put a hidden profile photo back, or remove it. */
export function useReviewReportedProfilePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ photo, restore }: { photo: ReportedProfilePhoto; restore: boolean }) =>
      reviewReportedProfilePhoto(photo, restore),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profilePhotos'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
