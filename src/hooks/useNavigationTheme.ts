import { useMemo } from 'react';
import { DarkTheme, DefaultTheme } from 'expo-router';

import { Colors, FontFamily } from '@/constants/theme';
import { useResolvedScheme } from '@/hooks/useTheme';

/**
 * Maps the app's color tokens onto react-navigation's theme so the native
 * chrome — stack headers, back buttons, separators — follows the same
 * light/dark resolution as the screens. Without this, react-navigation keeps
 * its own default light theme and renders white headers over dark content
 * whenever dark mode is active (via system or the settings override, which
 * this derived value honors because it comes from useResolvedScheme).
 */
export function useNavigationTheme() {
  const scheme = useResolvedScheme();
  const colors = Colors[scheme];

  return useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primaryText,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
      },
      // Header titles use `bold`: a compact semibold, not the display face,
      // so the chrome stays quiet next to each screen's big heading.
      fonts: {
        regular: { fontFamily: FontFamily.body, fontWeight: 'normal' as const },
        medium: { fontFamily: FontFamily.bodyMedium, fontWeight: 'normal' as const },
        bold: { fontFamily: FontFamily.bodySemiBold, fontWeight: 'normal' as const },
        heavy: { fontFamily: FontFamily.bodyBold, fontWeight: 'normal' as const },
      },
    };
  }, [scheme, colors]);
}
