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
