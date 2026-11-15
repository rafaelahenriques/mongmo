import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { formatInTimeZone } from 'date-fns-tz';

import type { OfferedPhoto } from '@/api/photos';
import { PhotoViewer } from '@/components/profile/PhotoGallery';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chapter } from '@/components/ui/Chapter';
import { EmptyState, ErrorState, LoadingState, useRefreshControl } from '@/components/ui/LoadState';
import { PageInset, Radius, Spacing } from '@/constants/theme';
import { useOfferedPhotos, useSetPhotoFeatured } from '@/hooks/usePhotos';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { showError } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';

const THUMB = 96;

const day = (iso: string) => formatInTimeZone(new Date(iso), DISPLAY_TIME_ZONE, 'EEE d MMM');

/**
 * Owner tools → Photos of the week. Members share photos from challenges;
 * here staff pick the ones that show on Home. A picked photo shows for
 * seven days, without the member's name, and can be taken out again. The
 * member can stop sharing at any time, which takes it off this screen and
 * off Home at once.
 */
export default function OwnerPhotoPicksScreen() {
  const theme = useTheme();
  const refreshControl = useRefreshControl();
  const tabBarInset = useTabBarInset();
  const offered = useOfferedPhotos();
  const pick = useSetPhotoFeatured();
  const [open, setOpen] = useState<OfferedPhoto | null>(null);

  const showing = offered.data?.filter((photo) => photo.showing) ?? [];
  const waiting = offered.data?.filter((photo) => !photo.showing) ?? [];

  const setFeatured = (photo: OfferedPhoto, featured: boolean) =>
    pick.mutate(
      { photoId: photo.id, featured },
      {
        onSuccess: () => haptics.success(),
        onError: (error) => {
          haptics.error();
          showError('That didn’t work', error);
        },
      },
    );

  const row = (photo: OfferedPhoto) => (
    <PickRow
      key={photo.id}
      photo={photo}
      busy={pick.isPending && pick.variables?.photoId === photo.id}
      onOpen={() => setOpen(photo)}
      onChange={(featured) => setFeatured(photo, featured)}
    />
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
      refreshControl={refreshControl}
    >
      <ThemedText type="small" themeColor="textSecondary">
        Pick the photos that show on Home. A picked photo shows for a week, without the member’s name. Members can stop
        sharing a photo at any time.
      </ThemedText>

      {offered.isPending ? (
        <LoadingState />
      ) : offered.isError ? (
        <ErrorState message="Couldn’t load the photos." onRetry={() => void offered.refetch()} />
      ) : (
        <>
          <Chapter number="01" title="Shared by members" />
          {waiting.length === 0 ? (
            <EmptyState icon="photo" text="Nothing new. Photos members share from challenges show up here." />
          ) : (
            waiting.map(row)
          )}

          <Chapter number="02" title="Showing now" style={styles.chapter} />
          {showing.length === 0 ? (
            <EmptyState icon="photo" text="No photos on Home right now. Pick one above to show it for a week." />
          ) : (
            showing.map(row)
          )}
        </>
      )}

      <PhotoViewer photo={open} onClose={() => setOpen(null)} />
    </ScrollView>
  );
}

function PickRow({
  photo,
  busy,
  onOpen,
  onChange,
}: {
  photo: OfferedPhoto;
  busy: boolean;
  onOpen: () => void;
  onChange: (featured: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <Card style={styles.card}>
      <Pressable
        onPress={() => {
          haptics.tap();
          onOpen();
        }}
        // 'button', not 'imagebutton': the web build has no mapping for the latter.
        accessibilityRole="button"
        accessibilityLabel={`Photo from ${photo.eventTitle}, shared ${day(photo.offeredAt)}`}
        accessibilityHint="Opens it full screen"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Image
          accessible={false}
          accessibilityLabel=""
          source={{ uri: photo.url, cacheKey: photo.path }}
          style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}
          contentFit="cover"
        />
      </Pressable>
      <View style={styles.side}>
        <View style={styles.texts}>
          <ThemedText type="smallBold" numberOfLines={2}>
            {photo.eventTitle}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {photo.showsUntil ? `On Home until ${day(photo.showsUntil)}` : `Shared ${day(photo.offeredAt)}`}
          </ThemedText>
        </View>
        {photo.showing ? (
          <Button
            label="Take it out"
            variant="secondary"
            size="medium"
            loading={busy}
            onPress={() => onChange(false)}
            // Starts with the words on the button, so voice control finds it.
            accessibilityLabel={`Take it out: photo from ${photo.eventTitle}`}
            style={styles.action}
          />
        ) : (
          <Button
            label="Show for a week"
            variant="brand"
            size="medium"
            loading={busy}
            onPress={() => onChange(true)}
            accessibilityLabel={`Show for a week: photo from ${photo.eventTitle}`}
            style={styles.action}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    gap: 16,
  },
  chapter: {
    marginTop: Spacing.three,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: Radius.medium,
  },
  side: {
    flex: 1,
    gap: Spacing.two,
  },
  texts: {
    gap: 2,
  },
  action: {
    alignSelf: 'flex-start',
  },
});
