import { Stickers, type StickerName } from '@/constants/stickers';
import { Sticker } from '@/components/ui/Sticker';

/** Which sticker a menu section gets, from its name ("Bánh mì", "Springrolls"…). */
export function categorySticker(section: string): StickerName {
  const name = section
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  if (name.includes('banh mi') && name.includes('without')) return 'banhMi';
  if (name.includes('banh mi') || name.includes('sandwich')) return 'openBanhMi';
  if (name.includes('spring') || name.includes('roll')) return 'springrolls';
  if (/stew|soup|pho|curry|bowl/.test(name)) return 'stewBowl';
  if (/coffee|ca phe|phin/.test(name)) return 'phin';
  if (/drink|tea|juice|soda/.test(name)) return 'icedGlass';
  if (/extra|dip|sauce|side|chilli|protein/.test(name)) return 'chillies';
  return 'oMark';
}

/**
 * A menu section's sticker (Mongmo's own sticker art): the open bánh mì,
 * the plain loaf, springrolls, a steaming bowl, a drink, chillies for the
 * extras. Anything else gets the Ô. Decorative.
 */
export function CategoryIcon({ section, size = 28 }: { section: string; size?: number }) {
  return <Sticker source={Stickers[categorySticker(section)]} style={{ width: size, height: size }} />;
}
