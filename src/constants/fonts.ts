import { LeagueSpartan_900Black } from '@expo-google-fonts/league-spartan/900Black';

import { FontFamily } from '@/constants/theme';

/**
 * Font files keyed by the family names in FontFamily, for expo-font's
 * useFonts. Only the title face is bundled: text is Helvetica, which the
 * system provides (see BodyFont).
 */
export const FONT_ASSETS = {
  [FontFamily.display]: LeagueSpartan_900Black,
};
