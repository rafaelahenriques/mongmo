import { useMemo } from 'react';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * Shared look for every stack header: flat (no hairline), the page colour,
 * a compact semibold title and an arrow-only back button. Tab roots hide
 * the header and draw their own large title instead.
 */
export function useStackScreenOptions() {
  const theme = useTheme();
  return useMemo(
    () => ({
      headerShown: true,
      headerShadowVisible: false,
      headerBackButtonDisplayMode: 'minimal' as const,
      headerTintColor: theme.text,
      headerStyle: { backgroundColor: theme.background },
      headerTitleStyle: { fontFamily: FontFamily.bodySemiBold, fontSize: 17, color: theme.text },
      contentStyle: { backgroundColor: theme.background },
    }),
    [theme],
  );
}
