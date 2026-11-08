import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from 'expo-router';

import { PermissionsScreen } from '@/components/auth/PermissionsScreen';
import { ConsentPrompt } from '@/components/privacy/ConsentPrompt';
import SignInScreen from '@/components/auth/SignInScreen';
import AppTabs from '@/components/ui/AppTabs';
import { Providers } from '@/components/Providers';
import { SplashIntro } from '@/components/SplashIntro';
import { FONT_ASSETS } from '@/constants/fonts';
import { applyCrashReportsChoice, withCrashReporting } from '@/lib/crashReporting';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigationTheme } from '@/hooks/useNavigationTheme';
import { useSession } from '@/hooks/useSession';
import { useResolvedScheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/state/settingsStore';

// Crash reporting starts as early as possible, but only once the person
// has said yes (asked by ConsentPrompt, changeable in Settings).
applyCrashReportsChoice(useSettingsStore.getState().crashReports);
useSettingsStore.subscribe((state, previous) => {
  if (state.crashReports !== previous.crashReports) applyCrashReportsChoice(state.crashReports);
});

function RootLayout() {
  useDocumentTitle();
  const navTheme = useNavigationTheme();
  const scheme = useResolvedScheme();
  const session = useSession();
  // A font that fails to load falls back to the system face rather than
  // blocking the app, hence `|| fontError`.
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const ready = session !== undefined && (fontsLoaded || fontError !== null);
  const [introDone, setIntroDone] = useState(false);
  const permissionsAsked = useSettingsStore((state) => state.permissionsAsked);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  return (
    <Providers session={session}>
      {/* Chrome (stack headers) and status bar glyphs follow the same
          resolved scheme as the screens, settings override included. */}
      <ThemeProvider value={navTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {/* On a tablet or a wide browser window the app keeps a phone-like
            column instead of stretching edge to edge. */}
        <View style={[styles.page, { backgroundColor: navTheme.colors.background }]}>
          <View style={styles.column}>
            {ready ? <FirstScreen signedIn={Boolean(session)} permissionsAsked={permissionsAsked} /> : null}
            {introDone ? <ConsentPrompt /> : null}
          </View>
        </View>
        {/* The logo animation plays over the app while it reads the cached
            session and loads fonts, then fades out to reveal it. */}
        {!introDone && <SplashIntro ready={ready} onDone={finishIntro} />}
      </ThemeProvider>
    </Providers>
  );
}

/** Signed out: sign in. Signed in: the permissions screen once, then the app. */
function FirstScreen({ signedIn, permissionsAsked }: { signedIn: boolean; permissionsAsked: boolean }) {
  if (!signedIn) return <SignInScreen />;
  if (!permissionsAsked) return <PermissionsScreen />;
  return <AppTabs />;
}

/** Wider than this, the app sits in a centred column. */
const MAX_APP_WIDTH = 720;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_APP_WIDTH,
  },
});

export default withCrashReporting(RootLayout);
