import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Wordmark } from '@/components/brand/Wordmark';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ScreenReaderTitle } from '@/components/ui/ScreenReaderTitle';
import { BrandPhotos } from '@/constants/brandPhotos';
import { Colors, Fonts, PageInset } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * W-02 Opening: the photo-first first-launch screen. The founders' line
 * over hands kneading dough, then on to creating an account or signing in.
 */
export function OpeningScreen({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
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
      {/* Drawn by the platform: an SVG gradient stretched to fill the
          screen shows in hard bands on iPhones. */}
      <View aria-hidden pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shade]} />

      <View style={[styles.top, { paddingTop: insets.top + 14 }]}>
        <View style={styles.tags} accessibilityLabel="Pick-up, pop-ups, discounts">
          {['Pick-up', 'Pop ups', 'Discounts'].map((tag) => (
            <ThemedText key={tag} style={[styles.tag, { color: Colors.light.background }]}>
              {tag}
            </ThemedText>
          ))}
        </View>
        <Wordmark height={64} />
        <ScreenReaderTitle>Mongmo</ScreenReaderTitle>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 18 }]}>
        <ThemedText type="smallBold" style={[styles.line, { color: theme.onSurfaceDark }]}>
          We brought South East Asian culture to Kortrijk and abroad. The bánh mì is how it started.
        </ThemedText>
        <Button label="Get started" variant="brand" onPress={onGetStarted} />
        <Pressable
          onPress={() => {
            haptics.tap();
            onSignIn();
          }}
          accessibilityRole="button"
          hitSlop={10}
          style={styles.link}
        >
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            I already have an account
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shade: {
    backgroundImage:
      'linear-gradient(to bottom, rgba(26, 26, 23, 0.35) 0%, rgba(26, 26, 23, 0) 50%, rgba(26, 26, 23, 0.85) 100%)',
  },
  screen: {
    flex: 1,
    justifyContent: 'space-between',
  },
  top: {
    paddingHorizontal: PageInset,
    gap: 14,
  },
  tags: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tag: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bottom: {
    paddingHorizontal: PageInset,
    gap: 16,
  },
  line: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  link: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
});
