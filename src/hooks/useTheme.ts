/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 *
 * Resolves the user's appearance preference from the settings store:
 * 'system' follows the device, 'light'/'dark' override it everywhere
 * (screens, tabs, sheets) from this single hook.
 */

import { Palettes, type ContrastLevel } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSettingsStore } from '@/state/settingsStore';
import { useSystemContrastStore } from '@/state/systemContrastStore';

/** Resolved scheme after the settings override (no device preference falls back to light). */
export function useResolvedScheme(): 'light' | 'dark' {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);

  const scheme = themeMode === 'system' ? systemScheme : themeMode;
  return scheme === 'dark' ? 'dark' : 'light';
}

/**
 * Contrast level after the settings override: 'system' is high when the
 * phone asks for more contrast, standard otherwise.
 */
export function useContrastLevel(): ContrastLevel {
  const mode = useSettingsStore((state) => state.contrast);
  const systemHigh = useSystemContrastStore((state) => state.high);
  if (mode === 'system') return systemHigh ? 'high' : 'standard';
  return mode;
}

export function useTheme() {
  return Palettes[useResolvedScheme()][useContrastLevel()];
}
