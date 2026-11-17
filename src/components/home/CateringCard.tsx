import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { onPhoto, onPhotoSoft, PhotoPill } from '@/components/ui/PhotoShade';
import { BrandPhotos } from '@/constants/brandPhotos';
import { CATERING_URL, openLink } from '@/constants/links';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * Catering and events, on Home: the food truck's counter, then what it's
 * for and a button to the catering page on Mongmo's website, where it's
 * booked. The words sit on the card's dark panel, not over the photo,
 * so they read whatever the photo shows.
 */
export function CateringCard() {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceDark }]}>
      {BrandPhotos.permissions ? (
        <Image
          accessible={false}
          accessibilityLabel=""
          source={BrandPhotos.permissions}
          style={styles.photo}
          contentFit="cover"
        />
      ) : null}
      <View style={styles.text}>
        <ThemedText type="label" style={onPhotoSoft}>
          Catering & events
        </ThemedText>
        <ThemedText type="title" style={onPhoto}>
          Mongmo at your event
        </ThemedText>
        <ThemedText type="small" style={onPhotoSoft}>
          Bánh mì and springrolls from our food truck, for your party, office or festival.
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <PhotoPill
          label="Plan your catering"
          tone="brand"
          icon="truck"
          accessibilityLabel="Plan your catering, on our website"
          onPress={() => openLink(CATERING_URL)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.tile,
    overflow: 'hidden',
  },
  // A wide strip of the counter.
  photo: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  text: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    paddingTop: 14,
  },
});
