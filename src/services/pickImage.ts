import type { ImagePickerOptions } from 'expo-image-picker';

export type PickedImage = { uri: string; mimeType?: string | null };

/**
 * Lets the person choose a photo from their library or take one. Resolves
 * to the image, or null when they cancel; rejects with a message to show
 * when camera access is off. The picker is loaded on demand (see
 * services/nativeModules.ts).
 */
export async function pickImage(
  source: 'library' | 'camera',
  options: ImagePickerOptions,
): Promise<PickedImage | null> {
  const ImagePicker = await import('expo-image-picker');
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Camera access is off for Mongmo — allow it in Settings to take a photo.');
    }
  }
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? { uri: asset.uri, mimeType: asset.mimeType } : null;
}
