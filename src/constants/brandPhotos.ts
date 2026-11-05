import type { ImageContentPosition } from 'expo-image';

type Spot = 'opening' | 'welcome' | 'permissions';

/**
 * Mongmo's own photos (assets/images/photos, made small from the originals
 * in assets/images/brand). A screen without its photo still works; it
 * shows its colour block instead.
 */
export const BrandPhotos: Partial<Record<Spot, number>> = {
  /** Opening: close on the hands kneading, under "The bánh mì is how it started." */
  opening: require('@/assets/images/photos/dough-hands.jpg'),
  /** Join us and sign in: the whole table, dough, eggs, bread and herbs. */
  welcome: require('@/assets/images/photos/dough.jpg'),
  /** Permissions: the food truck's counter, for "know when we pop up nearby". */
  permissions: require('@/assets/images/photos/truck-counter.jpg'),
};

/** Where each photo's subject sits, so a tight crop keeps it. */
export const BrandPhotoFocus: Partial<Record<Spot, ImageContentPosition>> = {};

/** Mongmo's own photos a pop-up without a picture of its own takes one of. */
const POP_UP_FALLBACKS: number[] = [
  require('@/assets/images/photos/truck-counter.jpg'),
  require('@/assets/images/photos/banh-mi.jpg'),
  require('@/assets/images/photos/dough-hands.jpg'),
  require('@/assets/images/photos/dough.jpg'),
];

/**
 * A pop-up's picture for expo-image's `source`: its uploaded one, or else
 * one of Mongmo's bundled photos, always the same for the same pop-up. No
 * third-party image host is involved either way.
 */
export function popUpImage(event: { id: string; imageUrl?: string | null }): string | number {
  if (event.imageUrl) return event.imageUrl;
  let hash = 0;
  for (const char of event.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return POP_UP_FALLBACKS[hash % POP_UP_FALLBACKS.length];
}
