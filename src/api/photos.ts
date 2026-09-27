import { Directory, File, Paths } from 'expo-file-system';

import { toApiError } from '@/api/errors';
import { getCurrentUserId, supabase } from '@/lib/supabase';

const BUCKET = 'challenge-photos';

/**
 * Saves a captured photo permanently on device (Paths.document survives
 * cache clears, unlike the camera's own temp file), uploads it to the
 * challenge-photos bucket, and records it in `photos`. Returns the public
 * URL to pass into complete_challenge's `data`.
 */
export async function saveAndUploadChallengePhoto(params: {
  localUri: string;
  eventId: string;
  challengeId: string;
}): Promise<string> {
  const userId = await getCurrentUserId();

  const capturedFile = new File(params.localUri);
  const savedDirectory = new Directory(Paths.document, 'challenge-photos');
  if (!savedDirectory.exists) {
    savedDirectory.create({ intermediates: true });
  }
  const savedFile = new File(savedDirectory, `${params.challengeId}-${Date.now()}.jpg`);
  await capturedFile.copy(savedFile);

  const storagePath = `${userId}/${savedFile.name}`;
  const bytes = await savedFile.bytes();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: 'image/jpeg' });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const { error: insertError } = await supabase.from('photos').insert({
    user_id: userId,
    event_id: params.eventId,
    challenge_id: params.challengeId,
    storage_path: storagePath,
    url: publicUrl,
  });
  if (insertError) throw toApiError(insertError);

  return publicUrl;
}
