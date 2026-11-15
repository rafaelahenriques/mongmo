import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { useTheme } from '@/hooks/useTheme';

/**
 * The first screen of a tab in the owner's view (Today, Orders, Pop-ups,
 * Menu): the top bar, then the screen. `title` is the screen's name for
 * screen readers; the tab bar shows it to everyone else.
 */
export function OwnerTab({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AppHeader title={title} />
      {children}
    </View>
  );
}
