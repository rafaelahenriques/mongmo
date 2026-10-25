import { useCallback, useState } from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from 'expo-router';

import SignInScreen from '@/components/auth/SignInScreen';
import AppTabs from '@/components/ui/AppTabs';
import { Providers } from '@/components/Providers';
import { SplashIntro } from '@/components/SplashIntro';
import { FONT_ASSETS } from '@/constants/fonts';
import { useNavigationTheme } from '@/hooks/useNavigationTheme';
import { useSession } from '@/hooks/useSession';
import { useResolvedScheme } from '@/hooks/useTheme';

export default function RootLayout() {
  const navTheme = useNavigationTheme();
  const scheme = useResolvedScheme();
  const session = useSession();
  // A font that fails to load falls back to the system face rather than
  // blocking the app, hence `|| fontError`.
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const ready = session !== undefined && (fontsLoaded || fontError !== null);
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  return (
    <Providers session={session}>
      {/* Chrome (stack headers) and status bar glyphs follow the same
          resolved scheme as the screens, settings override included. */}
      <ThemeProvider value={navTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {ready && (session ? <AppTabs /> : <SignInScreen />)}
        {/* The logo animation plays over the app while it reads the cached
            session and loads fonts, then fades out to reveal it. */}
        {!introDone && <SplashIntro ready={ready} onDone={finishIntro} />}
      </ThemeProvider>
    </Providers>
  );
}
