import { publicImageUrl, uploadImage } from '@/api/storage';

/**
 * Uploads a pop-up's photo to the owner-only `event-images` bucket and
 * returns its public URL, for events.image_url.
 */
export async function uploadEventImage(image: { uri: string; mimeType?: string | null }): Promise<string> {
  return publicImageUrl(await uploadImage({ bucket: 'event-images', folder: 'events', ...image }));
}
