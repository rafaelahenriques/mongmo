/**
 * Mongmo's own photos (assets/images/photos, made small from the originals
 * in assets/images/brand). A screen without its photo still works; it
 * shows its colour block instead.
 */
export const BrandPhotos: {
  /** Opening: "The bánh mì is how it started." */
  opening?: number;
  /** Welcome (sign in and join). */
  welcome?: number;
  /** Permissions: the trailer, for "where are you". */
  permissions?: number;
  /** Wallet: the Mongmo cup, in the circle by your points. */
  wallet?: number;
  /** Membership card. */
  card?: number;
} = {
  opening: require('@/assets/images/photos/banh-mi.jpg'),
  welcome: require('@/assets/images/photos/delivery-bags.jpg'),
  permissions: require('@/assets/images/photos/food-truck.jpg'),
  wallet: require('@/assets/images/photos/che-cup.jpg'),
  card: require('@/assets/images/photos/delivery-bags.jpg'),
};
