import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { GlassButton, onPhoto, onPhotoSoft, PhotoShade } from '@/components/ui/PhotoShade';
import { BrandPhotos } from '@/constants/brandPhotos';
import { useMotion } from '@/constants/motion';
import { PageInset, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * The cart and checkout header: where you pick up, as a photo with
 * rounded bottom corners. The pop-up's own photo, or the café's kitchen
 * table; a glass back button on it, "Pick up at" and the place over a
 * soft shade.
 */
export function PickupHeader({
  place,
  image,
  onBack,
}: {
  place: string;
  /** The place's photo (a remote URL or a bundled image); none gives the café's. */
  image?: string | number | null;
  onBack: () => void;
}) {
  const theme = useTheme();
  const motion = useMotion();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.surfaceDark }]}>
      <Image
        accessible={false}
        accessibilityLabel=""
        source={image ?? BrandPhotos.welcome}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={motion.imageFadeMs}
      />
      <PhotoShade from={0.12} to={0.8} />
      <View style={styles.top}>
        <GlassButton icon="chevronLeft" label="Back" onPress={onBack} />
      </View>
      <View style={styles.texts}>
        <ThemedText type="label" style={onPhotoSoft}>
          Pick up at
        </ThemedText>
        <ThemedText type="title" accessibilityRole="header" headingLevel={1} numberOfLines={2} style={onPhoto}>
          {place}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: Radius.tile,
    borderBottomRightRadius: Radius.tile,
    overflow: 'hidden',
  },
  top: {
    paddingHorizontal: PageInset,
    flexDirection: 'row',
  },
  texts: {
    paddingHorizontal: PageInset,
    paddingTop: 34,
    paddingBottom: 22,
    gap: 4,
  },
});
