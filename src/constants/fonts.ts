import { Lato_400Regular } from '@expo-google-fonts/lato/400Regular';
import { Lato_700Bold } from '@expo-google-fonts/lato/700Bold';
import { LeagueSpartan_900Black } from '@expo-google-fonts/league-spartan/900Black';

import { FontFamily } from '@/constants/theme';

/**
 * Font files keyed by the family names in FontFamily, for expo-font's
 * useFonts. Imported per weight so only these three files are bundled.
 */
export const FONT_ASSETS = {
  [FontFamily.body]: Lato_400Regular,
  [FontFamily.bodySemiBold]: Lato_700Bold,
  [FontFamily.display]: LeagueSpartan_900Black,
};
