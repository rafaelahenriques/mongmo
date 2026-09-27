import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { CheckInRecord } from '@/types';

export type PhotoGalleryProps = {
  checkIns: CheckInRecord[];
};

/**
 * Every photo the user has posted by checking in at events, newest first.
 * Empty state explains how to fill it (no gallery without check-ins).
 */
export default function PhotoGallery({ checkIns }: PhotoGalleryProps) {
  const theme = useTheme();
  const photos = [...checkIns].reverse();

  if (photos.length === 0) {
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel="No photos yet. Open an event and tap Check in to add one."
        style={[
          styles.empty,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}
      >
        <ThemedText style={styles.emptyEmoji}>📸</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
          No photos yet — open an event and tap <ThemedText type="smallBold">Check in</ThemedText>{' '}
          to start your gallery.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <View key={photo.eventId} style={styles.cell}>
          <Image
            source={{ uri: photo.imageUrl }}
            style={styles.photo}
            contentFit="cover"
            transition={200}
            accessibilityRole="image"
            accessibilityLabel={`Photo from ${photo.title}`}
          />
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.caption}>
            {photo.title}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    flexBasis: '31%',
    flexGrow: 1,
    gap: Spacing.half,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  empty: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
