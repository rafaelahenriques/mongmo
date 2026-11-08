import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import type { WeekPhoto } from '@/api/photos';
import { PhotoViewer } from '@/components/profile/PhotoGallery';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { useMotion } from '@/constants/motion';
import { Paper, Radius, Spacing } from '@/constants/theme';
import { usePhotosOfTheWeek, useReportPhoto, useSetPhotoShared } from '@/hooks/usePhotos';
import { useTheme } from '@/hooks/useTheme';
import { confirm, showError } from '@/services/confirm';
import { haptics } from '@/services/haptics';

const THUMB = 120;

/**
 * Home: photos members chose to share this week, newest first, without
 * names. Nothing shows until someone shares one. Your own can be taken
 * back; anyone else's can be reported, which takes it down at once.
 */
export default function PhotosOfTheWeek({ style }: { style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const motion = useMotion();
  const photos = usePhotosOfTheWeek();
  const [open, setOpen] = useState<WeekPhoto | null>(null);

  if (!photos.data?.length) return null;

  return (
    <View style={style}>
      <View>
        <ThemedText type="section" accessibilityRole="header">
          Photos of the week
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Shared by members from this week’s challenges
        </ThemedText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        tabIndex={0}
        aria-label="Photos of the week"
      >
        {photos.data.map((photo) => (
          <Pressable
            key={photo.id}
            onPress={() => {
              haptics.tap();
              setOpen(photo);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Photo from ${photo.eventTitle}${photo.mine ? ', yours' : ''}`}
            accessibilityHint="Opens it full screen"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <Image
              accessible={false}
              accessibilityLabel=""
              source={{ uri: photo.url }}
              style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}
              contentFit="cover"
              transition={motion.imageFadeMs}
            />
          </Pressable>
        ))}
      </ScrollView>
      <PhotoViewer
        photo={open}
        onClose={() => setOpen(null)}
        actions={open ? <PhotoActions photo={open} onDone={() => setOpen(null)} /> : null}
      />
    </View>
  );
}

/** Yours: stop sharing it. Someone else's: report it. */
function PhotoActions({ photo, onDone }: { photo: WeekPhoto; onDone: () => void }) {
  const unshare = useSetPhotoShared();
  const report = useReportPhoto();

  if (photo.mine) {
    return (
      <>
        <ThemedText type="small" style={styles.light}>
          Your photo. Other members see it without your name.
        </ThemedText>
        <Button
          label="Stop sharing"
          variant="secondary"
          loading={unshare.isPending}
          onPress={() =>
            unshare.mutate(
              { photoIds: [photo.id], shared: false },
              { onSuccess: onDone, onError: (error) => showError('That didn’t work', error) },
            )
          }
        />
      </>
    );
  }
  return (
    <Button
      label="Report this photo"
      variant="secondary"
      loading={report.isPending}
      onPress={async () => {
        const yes = await confirm(
          'Report this photo?',
          'It’s taken down for everyone straight away, and Mongmo staff will look at it.',
          'Report',
          { destructive: true },
        );
        if (!yes) return;
        report.mutate(photo.id, {
          onSuccess: onDone,
          onError: (error) => showError('That didn’t work', error),
        });
      }}
    />
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: Spacing.two,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: Radius.medium,
  },
  light: {
    color: Paper,
  },
});
