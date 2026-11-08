/**
 * Mongmo's sticker art (the "Stickers" page of the Mongmo Figma file),
 * exported with a soft shadow so the die-cut edge shows on a light page
 * too. Decorative: wherever one appears, the words next to it say the same.
 */
export const Stickers = {
  oMark: require('@/assets/images/stickers/o-mark.png'),
  /** The Ô in ink, for a sage background (the membership card). */
  oMarkInk: require('@/assets/images/stickers/o-mark-ink.png'),
  logo: require('@/assets/images/stickers/logo.png'),
  banhMi: require('@/assets/images/stickers/banh-mi.png'),
  openBanhMi: require('@/assets/images/stickers/open-banh-mi.png'),
  stewBowl: require('@/assets/images/stickers/stew-bowl.png'),
  phin: require('@/assets/images/stickers/phin.png'),
  chillies: require('@/assets/images/stickers/chillies.png'),
  coriander: require('@/assets/images/stickers/coriander.png'),
  popUpStall: require('@/assets/images/stickers/pop-up-stall.png'),
  stool: require('@/assets/images/stickers/stool.png'),
  icedGlass: require('@/assets/images/stickers/iced-glass.png'),
  springrolls: require('@/assets/images/stickers/springrolls.png'),
  handsKneading: require('@/assets/images/stickers/hands-kneading.png'),
  /** Four stickers together: the sticker pack reward. */
  pack: require('@/assets/images/stickers/sticker-pack.png'),
} as const;

export type StickerName = keyof typeof Stickers;

/**
 * The sticker for a reward, from what it is. Staff can add rewards, so this
 * reads the title; one it doesn't recognise gets none (the gift icon stays).
 */
export function rewardSticker(title: string): StickerName | null {
  const name = title.toLowerCase();
  if (name.includes('sticker')) return 'pack';
  if (name.includes('springroll')) return 'springrolls';
  if (name.includes('stew') || name.includes('soup')) return 'stewBowl';
  if (name.includes('bánh mì') || name.includes('banh mi')) return 'banhMi';
  if (name.includes('coffee') || name.includes('cà phê') || name.includes('phin')) return 'phin';
  if (name.includes('drink') || name.includes('tea') || name.includes('juice')) return 'icedGlass';
  if (name.includes('tote') || name.includes('bag')) return 'logo';
  if (name.includes('off')) return 'oMark';
  return null;
}

/** Each level's sticker, after the bake it's named for. */
const LEVEL_STICKERS: Record<string, StickerName> = {
  dough: 'handsKneading',
  rising: 'banhMi',
  golden: 'openBanhMi',
  crisp: 'springrolls',
};

export function levelSticker(key: string): StickerName | null {
  return LEVEL_STICKERS[key] ?? null;
}
