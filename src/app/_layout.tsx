import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from 'expo-router';

import AppTabs from '@/components/ui/AppTabs';
import { Providers } from '@/components/Providers';
import { useNavigationTheme } from '@/hooks/useNavigationTheme';
import { useResolvedScheme } from '@/hooks/useTheme';

export default function RootLayout() {
  const navTheme = useNavigationTheme();
  const scheme = useResolvedScheme();

  return (
    <Providers>
      {/* Chrome (stack headers) and status bar glyphs follow the same
          resolved scheme as the screens, settings override included. */}
      <ThemeProvider value={navTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <AppTabs />
      </ThemeProvider>
    </Providers>
  );
}
