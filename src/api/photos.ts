import { toApiError } from '@/api/errors';
import { signedPhotoUrls, uploadImage } from '@/api/storage';
import { getCurrentUserId, supabase } from '@/lib/supabase';

export type Photo = {
  id: string;
  url: string;
  eventId: string;
  eventTitle: string;
  challengeId: string | null;
  createdAt: string;
};

/**
 * Uploads a challenge photo to the signed-in user's folder in the
 * `challenge-photos` bucket and records it in `photos` — which is what
 * complete_challenge counts. The bucket is private: photos are shown
 * through short-lived signed links (see getPhotos).
 */
export async function uploadChallengePhoto(params: {
  uri: string;
  mimeType?: string | null;
  eventId: string;
  challengeId: string;
}): Promise<void> {
  const userId = await getCurrentUserId();
  const path = await uploadImage({
    bucket: 'challenge-photos',
    folder: userId,
    uri: params.uri,
    mimeType: params.mimeType,
  });

  const { error } = await supabase.from('photos').insert({
    user_id: userId,
    event_id: params.eventId,
    challenge_id: params.challengeId,
    storage_path: path,
  });
  if (error) throw toApiError(error);
}

type PhotoFilter = { userId: string } | { eventId: string };

/** Photos newest first, with their pop-up's title — the user's own, or a whole event's. */
async function getPhotos(filter: PhotoFilter): Promise<Photo[]> {
  let query = supabase
    .from('photos')
    .select('id, storage_path, event_id, challenge_id, created_at')
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
        eventId: row.event_id,
        eventTitle: titles.get(row.event_id) ?? 'Pop-up',
        challengeId: row.challenge_id,
        createdAt: row.created_at,
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
