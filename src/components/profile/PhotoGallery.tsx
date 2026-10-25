import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Photo } from '@/api/photos';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { IconButton } from '@/components/ui/IconButton';
import { Ink, inkAlpha, Paper, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type PhotoGalleryProps = {
  photos: Photo[];
  /** What to say when there are none yet. */
  emptyText: string;
};

/** A grid of challenge photos, newest first. Tap one to see it full screen. */
export default function PhotoGallery({ photos, emptyText }: PhotoGalleryProps) {
  const theme = useTheme();
  const [open, setOpen] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <Card tone="muted" style={styles.empty}>
        <View accessible accessibilityRole="text" accessibilityLabel={emptyText} style={styles.emptyInner}>
          <IconBadge name="photo" tone="card" size={52} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            {emptyText}
          </ThemedText>
        </View>
      </Card>
    );
  }

  return (
    <>
      <View style={styles.grid}>
        {photos.map((photo) => (
          <Pressable
            key={photo.id}
            onPress={() => {
              haptics.tap();
              setOpen(photo);
            }}
            // 'button', not 'imagebutton': the web build has no mapping for the latter.
            accessibilityRole="button"
            accessibilityLabel={`Photo from ${photo.eventTitle}`}
            accessibilityHint="Opens it full screen"
            style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Image
              source={{ uri: photo.url }}
              style={[styles.photo, { backgroundColor: theme.backgroundSelected }]}
              contentFit="cover"
              transition={200}
            />
          </Pressable>
        ))}
      </View>
      <PhotoViewer photo={open} onClose={() => setOpen(null)} />
    </>
  );
}

function PhotoViewer({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={photo !== null} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewer}>
        {photo ? (
          <Image
            source={{ uri: photo.url }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            accessibilityLabel={`Photo from ${photo.eventTitle}`}
          />
        ) : null}
        <View style={[styles.viewerBar, { top: insets.top + Spacing.two }]}>
          <View style={styles.viewerTitle}>
            <ThemedText type="smallBold" style={styles.light} numberOfLines={1}>
              {photo?.eventTitle}
            </ThemedText>
          </View>
          <IconButton icon="close" tone="primary" size={40} onPress={onClose} accessibilityLabel="Close photo" />
        </View>
      </View>
    </Modal>
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
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.medium,
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
  viewer: {
    flex: 1,
    backgroundColor: Ink,
  },
  viewerBar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  viewerTitle: {
    flex: 1,
    backgroundColor: inkAlpha(0.55),
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  light: {
    color: Paper,
  },
});
