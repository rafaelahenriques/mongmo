import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from 'expo-router';

import SignInScreen from '@/components/auth/SignInScreen';
import AppTabs from '@/components/ui/AppTabs';
import { Providers } from '@/components/Providers';
import { FONT_ASSETS } from '@/constants/fonts';
import { useNavigationTheme } from '@/hooks/useNavigationTheme';
import { useSession } from '@/hooks/useSession';
import { useResolvedScheme, useTheme } from '@/hooks/useTheme';

export default function RootLayout() {
  const navTheme = useNavigationTheme();
  const scheme = useResolvedScheme();
  const session = useSession();
  // A font that fails to load falls back to the system face rather than
  // blocking the app, hence `|| fontError`.
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const ready = session !== undefined && (fontsLoaded || fontError !== null);

  return (
    <Providers session={session}>
      {/* Chrome (stack headers) and status bar glyphs follow the same
          resolved scheme as the screens, settings override included. */}
      <ThemeProvider value={navTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {!ready ? <SplashLoading /> : session ? <AppTabs /> : <SignInScreen />}
      </ThemeProvider>
    </Providers>
  );
}

/** Shown for the brief moment it takes to read a cached session and load fonts at launch. */
function SplashLoading() {
  const theme = useTheme();
  return (
    <View style={[styles.splash, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
