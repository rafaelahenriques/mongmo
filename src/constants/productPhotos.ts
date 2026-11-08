import type { ImageSource } from 'expo-image';

const PHOTOS = {
  /** Plain loaves: the bánh mì without filling. */
  banhMi: require('@/assets/images/photos/banh-mi.jpg'),
  banhMiChicken: require('@/assets/images/photos/banh-mi-chicken.jpg'),
  banhMiPork: require('@/assets/images/photos/banh-mi-pork.jpg'),
  banhMiMeatballs: require('@/assets/images/photos/banh-mi-meatballs.jpg'),
  banhMiTofu: require('@/assets/images/photos/banh-mi-tofu.jpg'),
  springrollChicken: require('@/assets/images/photos/springroll-chicken.jpg'),
  springrollMeatballs: require('@/assets/images/photos/springroll-meatballs.jpg'),
  springrollTofu: require('@/assets/images/photos/springroll-tofu.jpg'),
  springrollEgg: require('@/assets/images/photos/springroll-egg.jpg'),
  stewBeef: require('@/assets/images/photos/stew-beef.jpg'),
  stewChicken: require('@/assets/images/photos/stew-chicken.jpg'),
} as const;

function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * A product's photo: the one the owner set on the menu item, or else
 * Mongmo's own shot of it (placeholders on sage until the café's own
 * photos: each bánh mì, the springrolls, both stews). Nothing for the
 * rest (dips, extras); they show their section's sticker.
 */
export function productPhoto(item: {
  name: string;
  category: string | null;
  imageUrl: string | null;
}): ImageSource | number | undefined {
  if (item.imageUrl) return { uri: item.imageUrl };
  const name = plain(item.name);
  const section = plain(item.category ?? '');
  if (section.includes('banh mi') || name.startsWith('banh mi')) {
    if (name.includes('without')) return PHOTOS.banhMi;
    if (name.includes('pork')) return PHOTOS.banhMiPork;
    if (name.includes('meatball')) return PHOTOS.banhMiMeatballs;
    if (name.includes('tofu')) return PHOTOS.banhMiTofu;
    return PHOTOS.banhMiChicken;
  }
  if (section.includes('spring') || name.includes('spring')) {
    if (name.includes('chicken')) return PHOTOS.springrollChicken;
    if (name.includes('meatball')) return PHOTOS.springrollMeatballs;
    if (name.includes('tofu')) return PHOTOS.springrollTofu;
    if (name.includes('egg')) return PHOTOS.springrollEgg;
  }
  if (/stew|kho|ca ri|curry/.test(section) || /stew|kho|ca ri|curry/.test(name)) {
    if (/beef|bo kho|pork|meat/.test(name)) return PHOTOS.stewBeef;
    return PHOTOS.stewChicken;
  }
  return undefined;
}

/** A menu section's photo, for its card on the menu: one of its dishes. */
export function sectionPhoto(section: string): number | undefined {
  const name = plain(section);
  if (name.includes('banh mi') && name.includes('without')) return PHOTOS.banhMi;
  if (name.includes('banh mi')) return PHOTOS.banhMiChicken;
  if (name.includes('spring')) return PHOTOS.springrollEgg;
  if (/stew|soup|curry/.test(name)) return PHOTOS.stewBeef;
  return undefined;
}

/** The food sits a little below the middle of each photo. */
export const PRODUCT_PHOTO_POSITION = { top: '60%', left: '50%' } as const;
