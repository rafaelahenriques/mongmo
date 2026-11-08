import { LeagueSpartan_900Black } from '@expo-google-fonts/league-spartan/900Black';

import { FontFamily } from '@/constants/theme';

/**
 * Font files keyed by the family names in FontFamily, for expo-font's
 * useFonts: League Spartan from its package, Lato from assets/fonts (from
 * Google Fonts' own repository, SIL Open Font License, Lato-OFL.txt).
 */
export const FONT_ASSETS = {
  [FontFamily.display]: LeagueSpartan_900Black,
  [FontFamily.body]: require('@/assets/fonts/Lato-Regular.ttf'),
  [FontFamily.bodyMedium]: require('@/assets/fonts/Lato-Medium.ttf'),
  [FontFamily.bodyBold]: require('@/assets/fonts/Lato-Bold.ttf'),
};
