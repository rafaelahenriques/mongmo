/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 *
 * Resolves the user's appearance preference from the settings store:
 * 'system' follows the device, 'light'/'dark' override it everywhere
 * (screens, tabs, sheets) from this single hook.
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSettingsStore } from '@/state/settingsStore';

/** Resolved scheme after the settings override ('unspecified' falls back to light). */
export function useResolvedScheme(): 'light' | 'dark' {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);

  const scheme = themeMode === 'system' ? systemScheme : themeMode;
  return scheme === 'unspecified' ? 'light' : scheme;
}

export function useTheme() {
  return Colors[useResolvedScheme()];
}
