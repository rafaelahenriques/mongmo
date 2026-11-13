import { ApiError, toApiError } from '@/api/errors';
import { signedPhotoUrls, uploadImage } from '@/api/storage';
import { getCurrentUserId, supabase } from '@/lib/supabase';

export type Photo = {
  id: string;
  url: string;
  /** Storage path: the image cache's key, as the signed URL changes each time. */
  path: string;
  eventId: string;
  eventTitle: string;
  challengeId: string | null;
  createdAt: string;
  /** In this week's Photos of the week. */
  shared: boolean;
  /** Can be shared: taken in the last week and never taken down. */
  canShare: boolean;
  /** Taken out of Photos of the week after a report. */
  takenDown: boolean;
};

/** A photo in Photos of the week: no name, only whether it's yours. */
export type WeekPhoto = {
  id: string;
  url: string;
  /** Storage path: the image cache's key, as the signed URL changes each time. */
  path: string;
  eventTitle: string;
  sharedAt: string;
  mine: boolean;
};

/** How long a shared photo stays in Photos of the week (0029). */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Uploads a challenge photo to the signed-in user's folder in the
 * `challenge-photos` bucket and records it in `photos` — which is what
 * complete_challenge counts. The bucket is private: photos are shown
 * through short-lived signed links (see getPhotos). It starts private;
 * the person may share it afterwards (setPhotoShared). Returns its id.
 */
export async function uploadChallengePhoto(params: {
  uri: string;
  mimeType?: string | null;
  eventId: string;
  challengeId: string;
}): Promise<string> {
  const userId = await getCurrentUserId();
  const path = await uploadImage({
    bucket: 'challenge-photos',
    folder: userId,
    uri: params.uri,
    mimeType: params.mimeType,
  });

  const { data, error } = await supabase
    .from('photos')
    .insert({
      user_id: userId,
      event_id: params.eventId,
      challenge_id: params.challengeId,
      storage_path: path,
    })
    .select('id')
    .single();
  if (error) throw toApiError(error);
  return data.id;
}

/** Shares one of your photos in Photos of the week, or stops sharing it. */
export async function setPhotoShared(photoId: string, shared: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_photo_shared', { p_photo_id: photoId, p_shared: shared });
  if (error) throw toApiError(error);
}

/** Reports a photo of the week: it comes down for everyone straight away. */
export async function reportPhoto(photoId: string): Promise<void> {
  const { error } = await supabase.rpc('report_photo', { p_photo_id: photoId });
  if (error) throw toApiError(error);
}

/** This week's shared photos, newest first. */
export async function getPhotosOfTheWeek(): Promise<WeekPhoto[]> {
  const { data, error } = await supabase.rpc('photos_of_the_week');
  if (error) throw toApiError(error);
  if (data.length === 0) return [];
  const urls = await signedPhotoUrls(data.map((row) => row.storage_path));
  return data.flatMap((row) => {
    const url = urls.get(row.storage_path);
    if (!url) return [];
    return [
      { id: row.id, url, path: row.storage_path, eventTitle: row.event_title, sharedAt: row.shared_at, mine: row.mine },
    ];
  });
}

type PhotoFilter = { userId: string } | { eventId: string };

/** Photos newest first, with their pop-up's title — the user's own, or a whole event's. */
async function getPhotos(filter: PhotoFilter): Promise<Photo[]> {
  let query = supabase
    .from('photos')
    .select('id, storage_path, event_id, challenge_id, created_at, shared_at, removed_at')
    .order('created_at', { ascending: false })
    .limit(60);
  query = 'userId' in filter ? query.eq('user_id', filter.userId) : query.eq('event_id', filter.eventId);
  const { data, error } = await query;
  if (error) throw toApiError(error);
  if (data.length === 0) return [];

  const eventIds = [...new Set(data.map((row) => row.event_id))];
  const events = await supabase.from('events').select('id, title').in('id', eventIds);
  if (events.error) throw toApiError(events.error);
  const titles = new Map(events.data.map((event) => [event.id, event.title]));
  const urls = await signedPhotoUrls(data.map((row) => row.storage_path));

  return data.flatMap((row) => {
    const url = urls.get(row.storage_path);
    if (!url) return [];
    return [
      {
        id: row.id,
        url,
        path: row.storage_path,
        eventId: row.event_id,
        eventTitle: titles.get(row.event_id) ?? 'Pop-up',
        challengeId: row.challenge_id,
        createdAt: row.created_at,
        shared: row.shared_at !== null && Date.now() - Date.parse(row.shared_at) < WEEK_MS,
        canShare: row.removed_at === null && Date.now() - Date.parse(row.created_at) < WEEK_MS,
        takenDown: row.removed_at !== null,
      },
    ];
  });
}

/** Every photo the signed-in user took for a challenge. */
export async function getMyPhotos(): Promise<Photo[]> {
  return getPhotos({ userId: await getCurrentUserId() });
}

/** Every guest's photos from one pop-up (the owner's view). */
export async function getEventPhotos(eventId: string): Promise<Photo[]> {
  return getPhotos({ eventId });
}

/** A photo taken down after a report, waiting for staff to decide. */
export type ReportedPhoto = {
  id: string;
  path: string;
  /** Empty when the file can't be shown (already gone). */
  url: string;
  eventTitle: string;
  takenAt: string;
  removedAt: string;
  reports: number;
};

/** Staff: reported photos waiting for a decision, oldest first. */
export async function getReportedPhotos(): Promise<ReportedPhoto[]> {
  const { data, error } = await supabase.rpc('reported_photos');
  if (error) throw toApiError(error);
  if (data.length === 0) return [];
  // Staff must be able to decide even when a photo can't be shown.
  const urls = await signedPhotoUrls(data.map((row) => row.storage_path)).catch(() => new Map<string, string>());
  return data.map((row) => ({
    id: row.id,
    path: row.storage_path,
    url: urls.get(row.storage_path) ?? '',
    eventTitle: row.event_title,
    takenAt: row.taken_at,
    removedAt: row.removed_at,
    reports: row.reports,
  }));
}

/** Staff: put a reported photo back (`restore`), or keep it down. */
export async function reviewReportedPhoto(photoId: string, restore: boolean): Promise<void> {
  const { error } = await supabase.rpc('review_reported_photo', { p_photo_id: photoId, p_restore: restore });
  if (error) throw toApiError(error);
}

/** Staff: delete a reported photo for good, the file first, then its record. */
export async function deleteReportedPhoto(photo: Pick<ReportedPhoto, 'id' | 'path'>): Promise<void> {
  const bucket = supabase.storage.from('challenge-photos');
  const removed = await bucket.remove([photo.path]);
  if (removed.error) throw toApiError({ message: removed.error.message });
  // Storage reports nothing removed both when the file was already gone and
  // when a rule refused: only carry on to the record if it's really gone.
  if (removed.data.length === 0 && !(await bucket.createSignedUrl(photo.path, 60)).error) {
    throw new ApiError('Couldn’t delete the photo’s file. Try again.', 500);
  }
  const { error } = await supabase.rpc('delete_reported_photo', { p_photo_id: photo.id });
  if (error) throw toApiError(error);
}
