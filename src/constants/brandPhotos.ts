import type { ImageSourcePropType } from 'react-native';

/**
 * The design's brand photos (assets/images/brand): the hands kneading dough
 * (Opening, Our story), the flat lay of dough, bread and bowls (Welcome) and
 * the food truck (Permissions). A screen without its photo still works; it
 * shows its colour block instead.
 */
export const BrandPhotos: {
  dough?: ImageSourcePropType;
  flatlay?: ImageSourcePropType;
  truck?: ImageSourcePropType;
} = {};
