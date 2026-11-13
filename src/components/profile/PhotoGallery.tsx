import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Photo } from '@/api/photos';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { IconBadge } from '@/components/ui/IconBadge';
import { IconButton } from '@/components/ui/IconButton';
import { Ink, inkAlpha, Paper, Radius, Spacing } from '@/constants/theme';
import { useSetPhotoShared } from '@/hooks/usePhotos';
import { useTheme } from '@/hooks/useTheme';
import { showError } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import { useMotion } from '@/constants/motion';

export type PhotoGalleryProps = {
  photos: Photo[];
  /** What to say when there are none yet. */
  emptyText: string;
  /** The person's own photos: shows which are shared, and lets them share or stop. */
  own?: boolean;
};

/** A grid of challenge photos, newest first. Tap one to see it full screen. */
export default function PhotoGallery({ photos, emptyText, own = false }: PhotoGalleryProps) {
  const theme = useTheme();
  const motion = useMotion();
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
            accessibilityLabel={`Photo from ${photo.eventTitle}${own && photo.shared ? ', in Photos of the week' : ''}`}
            accessibilityHint="Opens it full screen"
            style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Image
              accessible={false}
              accessibilityLabel=""
              source={{ uri: photo.url, cacheKey: photo.path || undefined }}
              style={[styles.photo, { backgroundColor: theme.backgroundSelected }]}
              contentFit="cover"
              transition={motion.imageFadeMs}
            />
            {own && photo.shared ? <Chip label="Shared" tone="dark" style={styles.sharedTag} /> : null}
          </Pressable>
        ))}
      </View>
      <PhotoViewer
        photo={open}
        onClose={() => setOpen(null)}
        actions={own && open ? <ShareToggle photo={open} onDone={() => setOpen(null)} /> : null}
      />
    </>
  );
}

/** Share one of your photos in Photos of the week, or stop sharing it. */
function ShareToggle({ photo, onDone }: { photo: Photo; onDone: () => void }) {
  const setShared = useSetPhotoShared();
  if (photo.takenDown) {
    return (
      <ThemedText type="small" style={styles.light}>
        Someone reported this photo, so it was taken out of Photos of the week. It stays private to you.
      </ThemedText>
    );
  }
  if (!photo.shared && !photo.canShare) {
    return (
      <ThemedText type="small" style={styles.light}>
        Only photos from the last week can go in Photos of the week.
      </ThemedText>
    );
  }
  return (
    <>
      <ThemedText type="small" style={styles.light}>
        {photo.shared
          ? 'In Photos of the week: other members see it on Home, without your name.'
          : 'Private: only you and Mongmo staff see it.'}
      </ThemedText>
      <Button
        label={photo.shared ? 'Stop sharing' : 'Share in Photos of the week'}
        variant="secondary"
        loading={setShared.isPending}
        onPress={() =>
          setShared.mutate(
            { photoIds: [photo.id], shared: !photo.shared },
            { onSuccess: onDone, onError: (error) => showError('That didn’t work', error) },
          )
        }
      />
    </>
  );
}

/** A photo full screen, with its pop-up's name, and optional actions under it. */
export function PhotoViewer({
  photo,
  onClose,
  actions,
}: {
  photo: { url: string; path?: string; eventTitle: string } | null;
  onClose: () => void;
  actions?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const motion = useMotion();
  return (
    <Modal visible={photo !== null} animationType={motion.sheet} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewer}>
        {photo ? (
          <Image
            source={{ uri: photo.url, cacheKey: photo.path || undefined }}
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
        {actions ? (
          <View style={[styles.viewerActions, { bottom: insets.bottom + Spacing.three }]}>{actions}</View>
        ) : null}
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
  sharedTag: {
    position: 'absolute',
    left: Spacing.one,
    bottom: Spacing.one,
  },
  viewerActions: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    backgroundColor: inkAlpha(0.7),
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
