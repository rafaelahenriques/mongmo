import type { ImageSource } from 'expo-image';

const PHOTOS = {
  banhMi: require('@/assets/images/photos/banh-mi.jpg'),
  springrollChicken: require('@/assets/images/photos/springroll-chicken.jpg'),
  springrollMeatballs: require('@/assets/images/photos/springroll-meatballs.jpg'),
  springrollTofu: require('@/assets/images/photos/springroll-tofu.jpg'),
} as const;

function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * A product's photo: the one the owner set on the menu item, or else
 * Mongmo's own shot of it (bánh mì, the chicken, meatball and tofu
 * springrolls). Nothing for the rest; they show their section's drawing.
 */
export function productPhoto(item: {
  name: string;
  category: string | null;
  imageUrl: string | null;
}): ImageSource | number | undefined {
  if (item.imageUrl) return { uri: item.imageUrl };
  const name = plain(item.name);
  const section = plain(item.category ?? '');
  // The plain baguette keeps its drawing: the photo has a filling.
  if (name.includes('without')) return undefined;
  if (section.includes('banh mi') || name.startsWith('banh mi')) return PHOTOS.banhMi;
  if (section.includes('spring') || name.includes('spring')) {
    if (name.includes('chicken')) return PHOTOS.springrollChicken;
    if (name.includes('meatball')) return PHOTOS.springrollMeatballs;
    if (name.includes('tofu')) return PHOTOS.springrollTofu;
  }
  return undefined;
}

/** The photos are portraits with the food a little below the middle. */
export const PRODUCT_PHOTO_POSITION = { top: '62%', left: '50%' } as const;
