import { hasNativeFeature } from '@/services/nativeModules';

/** JPEG quality for uploads: no loss you can see on a phone, at a fraction of a camera file's size. */
const QUALITY = 0.8;

/** Which side to set so the longest one is `maxSide`; null when the image already fits. */
export function sideToShrink(
  width: number,
  height: number,
  maxSide: number,
): { width: number } | { height: number } | null {
  if (Math.max(width, height) <= maxSide) return null;
  return width >= height ? { width: maxSide } : { height: maxSide };
}

/** The parts of expo-image-manipulator used here. */
export type Resizer = Pick<typeof import('expo-image-manipulator'), 'ImageManipulator' | 'SaveFormat'>;

/** Frees an image's memory now instead of when it's garbage collected (not needed, or there, on the web). */
function free(image: { release?: () => void }): void {
  image.release?.();
}

/**
 * A photo ready to upload: its longest side at most `maxSide` pixels, saved
 * as a JPEG. A camera photo of several megabytes becomes a few hundred
 * kilobytes, and HEIC photos become something every phone and browser can
 * show. Smaller images keep their size and are only re-saved.
 *
 * Null when this install was built before the resizer was added: the
 * caller sends the original instead.
 */
export async function shrinkImage(
  uri: string,
  maxSide: number,
  // Loaded on demand: see services/nativeModules.ts. A parameter so the tests can stand in for it.
  loadResizer: () => Promise<Resizer> = () => import('expo-image-manipulator'),
): Promise<{ uri: string; mimeType: 'image/jpeg' } | null> {
  if (!hasNativeFeature('imageManipulator')) return null;
  const { ImageManipulator, SaveFormat } = await loadResizer();

  // Decoding at up to twice the target keeps a full camera photo out of
  // memory, and still leaves enough detail for a clean resize.
  const decoded = await ImageManipulator.manipulate(uri, {
    maxWidth: maxSide * 2,
    maxHeight: maxSide * 2,
  }).renderAsync();
  let image = decoded;
  try {
    const side = sideToShrink(decoded.width, decoded.height, maxSide);
    if (side) image = await ImageManipulator.manipulate(decoded).resize(side).renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: QUALITY });
    return { uri: saved.uri, mimeType: 'image/jpeg' };
  } finally {
    if (image !== decoded) free(image);
    free(decoded);
  }
}
