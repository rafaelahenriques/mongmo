import { Platform } from 'react-native';
import { File } from 'expo-file-system';

import { toApiError } from '@/api/errors';
import { supabase } from '@/lib/supabase';

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

/**
 * Uploads an image to a public bucket at `folder/<random>.<ext>` and returns
 * its public URL. The bucket's policies decide who may write where.
 */
export async function uploadPublicImage(params: {
  bucket: 'challenge-photos' | 'event-images';
  folder: string;
  uri: string;
  mimeType?: string | null;
}): Promise<{ path: string; publicUrl: string }> {
  const contentType = imageContentType(params.mimeType);
  const path = `${params.folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${EXTENSION[contentType]}`;
  const bytes = await readImageBytes(params.uri);

  const { error } = await supabase.storage.from(params.bucket).upload(path, bytes, { contentType });
  if (error) throw toApiError(error);

  const { data } = supabase.storage.from(params.bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
