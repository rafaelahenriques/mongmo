import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LegalLinks } from '@/components/auth/LegalLinks';
import { Wordmark } from '@/components/brand/Wordmark';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { PhotoPill } from '@/components/ui/PhotoShade';
import { ScreenReaderTitle } from '@/components/ui/ScreenReaderTitle';
import { BrandPhotos } from '@/constants/brandPhotos';
import { PageInset, Paper, paperAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type OpeningProps = {
  onCreateAccount: () => void;
  onSignIn: () => void;
  /** "Skip": look around as a guest. */
  onGuest: () => void;
  guestPending: boolean;
  /** Why guest sign-in didn't work (it can be switched off). */
  guestError: string | null;
};

/**
 * W-02 Opening, the first thing a signed-out person sees: hands kneading
 * dough, the wordmark, and the three ways in. Create an account and sign
 * in each open the short form; Skip looks around as a guest.
 */
export function OpeningScreen({ onCreateAccount, onSignIn, onGuest, guestPending, guestError }: OpeningProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: theme.surfaceDark }]}>
      {BrandPhotos.opening ? (
        <Image
          accessible={false}
          accessibilityLabel=""
          source={BrandPhotos.opening}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : null}
      {/* Dark at the top for Skip, clear in the middle, near black where
          the buttons sit. Drawn by the platform: an SVG gradient stretched
          to fill the screen shows in hard bands on iPhones. */}
      <View aria-hidden pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shade]} />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        {/* On frosted glass, so it reads over any part of the photo. */}
        <PhotoPill
          label={guestPending ? 'One moment…' : 'Skip'}
          onPress={onGuest}
          disabled={guestPending}
          // Starts with the word on screen, so voice control finds it.
          accessibilityLabel={guestPending ? 'One moment…' : 'Skip, look around as a guest'}
        />
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.brand}>
          <Wordmark height={56} />
          <ScreenReaderTitle>Mongmo</ScreenReaderTitle>
          <ThemedText type="small" style={[styles.center, { color: paperAlpha(0.88) }]}>
            Bánh mì, pop-ups and rewards from Kortrijk.
          </ThemedText>
        </View>
        <View style={styles.buttons}>
          <Button label="Create an account" variant="brand" onPress={onCreateAccount} />
          <Button label="Sign in" variant="secondary" onPress={onSignIn} />
        </View>
        {guestError ? (
          <ThemedText type="caption" style={[styles.center, styles.onPhoto]} accessibilityRole="alert">
            {guestError}
          </ThemedText>
        ) : null}
        <LegalLinks onDark />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shade: {
    backgroundImage:
      'linear-gradient(to bottom, rgba(26, 26, 23, 0.4) 0%, rgba(26, 26, 23, 0) 30%, rgba(26, 26, 23, 0.75) 62%, rgba(26, 26, 23, 0.96) 100%)',
  },
  screen: {
    flex: 1,
    justifyContent: 'space-between',
  },
  top: {
    paddingHorizontal: PageInset,
    alignItems: 'flex-end',
  },
  onPhoto: {
    color: Paper,
  },
  bottom: {
    paddingHorizontal: PageInset + 8,
    gap: 20,
  },
  brand: {
    alignItems: 'center',
    gap: 10,
  },
  center: {
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
  },
});
