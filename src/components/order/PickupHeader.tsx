import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TopBar } from '@/components/ui/TopBar';
import { CardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useMotion } from '@/constants/motion';

/**
 * The cart and checkout header: the pop-up's own photo behind a white bar
 * saying "PICK UP AT" and the place, or the brand's sage when the place
 * has no photo (the café).
 */
export function PickupHeader({
  place,
  image,
  onBack,
}: {
  place: string;
  /** The place's photo; none gives the sage band. */
  /** A remote URL or a bundled image (`require`). */
  image?: string | number | null;
  onBack: () => void;
}) {
  const theme = useTheme();
  const motion = useMotion();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.strip, { paddingTop: insets.top + 28, backgroundColor: theme.band }]}>
      {image ? (
        <Image
          accessible={false}
          accessibilityLabel=""
          source={image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={motion.imageFadeMs}
        />
      ) : null}
      <View style={[styles.bar, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}>
        <TopBar title="Pick up at" value={place} onBack={onBack} topInset={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  bar: {
    paddingTop: 10,
  },
});
