import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { Radius, Spacing } from '@/constants/theme';
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
      <Card tone="muted" style={styles.empty}>
        <View
          accessible
          accessibilityRole="text"
          accessibilityLabel="No photos yet. Open an event and tap Check in to add one."
          style={styles.emptyInner}
        >
          <IconBadge name="photo" tone="card" size={52} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            No photos yet — open an event and tap <ThemedText type="smallBold">Check in</ThemedText> to start
            your gallery.
          </ThemedText>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <View key={photo.eventId} style={styles.cell}>
          <Image
            source={{ uri: photo.imageUrl }}
            style={[styles.photo, { backgroundColor: theme.backgroundSelected }]}
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
    // A third of the row each, so one photo doesn't stretch to full width.
    width: '31.5%',
    gap: Spacing.half,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.medium,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  empty: {
    padding: Spacing.four,
  },
  emptyInner: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
