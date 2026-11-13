import { Platform } from 'react-native';
import { File } from 'expo-file-system';

import { toApiError } from '@/api/errors';
import { log } from '@/lib/log';
import { supabase } from '@/lib/supabase';
import { shrinkImage } from '@/services/shrinkImage';

/** A captured or picked image's bytes: `file://` on iOS/Android, `blob:`/`data:` in the browser. */
async function readImageBytes(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.arrayBuffer();
  }
  return new File(uri).arrayBuffer();
}

/** JPEG unless the picker said otherwise (only the types the buckets accept). */
export function imageContentType(mimeType: string | null | undefined): string {
  return mimeType === 'image/png' || mimeType === 'image/webp' || mimeType === 'image/heic' ? mimeType : 'image/jpeg';
}

const EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

/** The storage buckets: event photos are public; guests' challenge and profile photos private. */
export type Bucket = 'challenge-photos' | 'event-images' | 'avatars';

/**
 * The longest side, in pixels, a photo is shrunk to before it's uploaded:
 * what the largest place it's shown needs on a sharp phone screen (a
 * profile photo fills the member sheet's width; the others, the screen).
 */
const MAX_SIDE: Record<Bucket, number> = {
  'challenge-photos': 1600,
  'event-images': 1600,
  avatars: 1024,
};

/**
 * The image to send: shrunk and saved as a JPEG. If that can't be done (a
 * format the phone can't decode, an install without the resizer), the
 * original goes up as it is; the bucket's own size and type limits still
 * apply.
 */
async function forUpload(
  bucket: Bucket,
  uri: string,
  mimeType: string | null | undefined,
): Promise<{ uri: string; mimeType: string | null | undefined }> {
  try {
    return (await shrinkImage(uri, MAX_SIDE[bucket])) ?? { uri, mimeType };
  } catch (error) {
    log.warn('upload', 'could not shrink the photo, sending the original', error);
    return { uri, mimeType };
  }
}

/** How long a link to a private photo works: an hour, then the app asks for a new one. */
export const SIGNED_URL_SECONDS = 60 * 60;

/**
 * Uploads an image, shrunk first, to `folder/<random>.<ext>` in a bucket
 * and returns its path. The bucket's policies decide who may write where.
 */
export async function uploadImage(params: {
  bucket: Bucket;
  folder: string;
  uri: string;
  mimeType?: string | null;
}): Promise<string> {
  const image = await forUpload(params.bucket, params.uri, params.mimeType);
  const contentType = imageContentType(image.mimeType);
  const path = `${params.folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${EXTENSION[contentType]}`;
  const bytes = await readImageBytes(image.uri);

  const { error } = await supabase.storage.from(params.bucket).upload(path, bytes, { contentType });
  if (error) throw toApiError(error);
  return path;
}

/** A link anyone can open, for an image in the public bucket. */
export function publicImageUrl(path: string): string {
  return supabase.storage.from('event-images').getPublicUrl(path).data.publicUrl;
}

/** Short-lived links to private photos (challenge photos unless told otherwise), by path. Paths it couldn't sign are left out. */
export async function signedPhotoUrls(
  paths: string[],
  bucket: 'challenge-photos' | 'avatars' = 'challenge-photos',
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) throw toApiError(error);
  const urls = new Map<string, string>();
  for (const entry of data) if (entry.path && entry.signedUrl) urls.set(entry.path, entry.signedUrl);
  return urls;
}
