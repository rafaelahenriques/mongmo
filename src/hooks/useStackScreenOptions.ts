import { createElement, useMemo, type ReactNode } from 'react';

import { TopBar } from '@/components/ui/TopBar';
import { useTheme } from '@/hooks/useTheme';

type HeaderProps = {
  navigation: { goBack: () => void; canGoBack: () => boolean };
  route: { name: string };
  options: { title?: string; headerTitle?: unknown; headerRight?: (props: { tintColor?: string }) => ReactNode };
  back?: unknown;
};

/**
 * Every stack header is the design's top bar: a chevron back, the screen's
 * name in uppercase and, from `headerRight`, a value or control on the
 * right. Tab roots hide it and draw their own heading.
 */
export function useStackScreenOptions() {
  const theme = useTheme();
  return useMemo(
    () => ({
      headerShown: true,
      header: ({ navigation, route, options, back }: HeaderProps) =>
        createElement(TopBar, {
          title: typeof options.headerTitle === 'string' ? options.headerTitle : (options.title ?? route.name),
          // A screen opened from the top bar (Achievements) is its stack's
          // first: back returns to the tab it was opened from.
          onBack: back || navigation.canGoBack() ? navigation.goBack : undefined,
          trailing: options.headerRight?.({ tintColor: theme.text }),
        }),
      contentStyle: { backgroundColor: theme.background },
    }),
    [theme],
  );
}
