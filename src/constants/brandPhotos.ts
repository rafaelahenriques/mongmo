import type { ImageContentPosition } from 'expo-image';

type Spot = 'opening' | 'welcome' | 'permissions' | 'wallet' | 'card';

/**
 * Mongmo's own photos (assets/images/photos, made small from the originals
 * in assets/images/brand). A screen without its photo still works; it
 * shows its colour block instead.
 */
export const BrandPhotos: Partial<Record<Spot, number>> = {
  /** Opening: hands kneading the dough, under "The bánh mì is how it started." */
  opening: require('@/assets/images/photos/dough.jpg'),
  /** Join us and sign in: the counter of the food truck. */
  welcome: require('@/assets/images/photos/truck-counter.jpg'),
  /** Permissions: the trailer, for "where are you". */
  permissions: require('@/assets/images/photos/food-truck.jpg'),
  /** Wallet: the Mongmo cup, in the circle by your points. */
  wallet: require('@/assets/images/photos/che-cup.jpg'),
  /** Membership card: the bánh mì loaves. */
  card: require('@/assets/images/photos/banh-mi.jpg'),
};

/** Where each photo's subject sits, so a tight crop keeps it. */
export const BrandPhotoFocus: Partial<Record<Spot, ImageContentPosition>> = {
  welcome: { top: '25%', left: '50%' },
  card: { top: '72%', left: '50%' },
};
