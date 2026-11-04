import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { Outfit_900Black } from '@expo-google-fonts/outfit/900Black';

import { FontFamily } from '@/constants/theme';

/**
 * Font files keyed by the family names in FontFamily, for expo-font's
 * useFonts. Imported per weight so only these six files are bundled.
 */
export const FONT_ASSETS = {
  [FontFamily.body]: BeVietnamPro_400Regular,
  [FontFamily.bodyMedium]: BeVietnamPro_500Medium,
  [FontFamily.bodySemiBold]: BeVietnamPro_600SemiBold,
  [FontFamily.bodyBold]: BeVietnamPro_700Bold,
  [FontFamily.display]: Outfit_600SemiBold,
  [FontFamily.heavy]: Outfit_900Black,
};
