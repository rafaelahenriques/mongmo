import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { formatInTimeZone } from 'date-fns-tz';

import type { ReportedPhoto } from '@/api/photos';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ButtonRow } from '@/components/ui/ButtonRow';
import { Card } from '@/components/ui/Card';
import { PageInset, Radius, Spacing } from '@/constants/theme';
import { useReportedPhotos, useReviewReportedPhoto } from '@/hooks/usePhotos';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { confirm, showError } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';
import { EmptyState, ErrorState, LoadingState, useRefreshControl } from '@/components/ui/LoadState';

type Decision = 'restore' | 'keep' | 'delete';

/**
 * Owner tools → Reported photos. A report takes a photo of the week down at
 * once; here staff decide what happens next: put it back, keep it down (the
 * person keeps it privately), or delete it for good. Who reported it isn't
 * shown, and the reports are deleted once decided.
 */
export default function OwnerReportsScreen() {
  const theme = useTheme();
  const refreshControl = useRefreshControl();
  const tabBarInset = useTabBarInset();
  const reported = useReportedPhotos();
  const review = useReviewReportedPhoto();

  const decide = async (photo: ReportedPhoto, decision: Decision) => {
    if (decision === 'delete') {
      const yes = await confirm(
        'Delete this photo for good?',
        'The photo and its file are deleted, also for the person who took it. Use this for anything unlawful or harmful.',
        'Delete',
        { destructive: true },
      );
      if (!yes) return;
    }
    review.mutate(
      { photo, decision },
      {
        onSuccess: () => haptics.success(),
        onError: (error) => {
          haptics.error();
          showError('That didn’t work', error);
        },
      },
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
      refreshControl={refreshControl}
    >
      <ThemedText type="small" themeColor="textSecondary">
        A reported photo comes down from Photos of the week straight away. Put it back if it’s fine; keep it down if it
        shouldn’t be shared (the person keeps it privately); delete it if it’s unlawful or harmful.
      </ThemedText>

      {reported.isPending ? (
        <LoadingState />
      ) : reported.isError ? (
        <ErrorState message="Couldn’t load the reports." onRetry={() => void reported.refetch()} />
      ) : reported.data.length === 0 ? (
        <EmptyState icon="checkCircle" text="Nothing to review. Reported photos show up here." />
      ) : (
        reported.data.map((photo) => (
          <ReportCard
            key={photo.id}
            photo={photo}
            busy={review.isPending && review.variables?.photo.id === photo.id}
            onDecide={(decision) => void decide(photo, decision)}
          />
        ))
      )}
    </ScrollView>
  );
}

function ReportCard({
  photo,
  busy,
  onDecide,
}: {
  photo: ReportedPhoto;
  busy: boolean;
  onDecide: (decision: Decision) => void;
}) {
  const theme = useTheme();
  const when = formatInTimeZone(new Date(photo.removedAt), DISPLAY_TIME_ZONE, 'd MMM, HH:mm');
  const times = photo.reports === 1 ? 'once' : `${photo.reports} times`;
  return (
    <Card style={styles.card}>
      {photo.url ? (
        <Image
          source={{ uri: photo.url }}
          style={[styles.photo, { backgroundColor: theme.backgroundSelected }]}
          contentFit="contain"
          accessibilityLabel={`Reported photo from ${photo.eventTitle}`}
        />
      ) : (
        <View style={[styles.photo, styles.noPhoto, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="small" themeColor="textSecondary">
            This photo can’t be shown.
          </ThemedText>
        </View>
      )}
      <View style={styles.texts}>
        <ThemedText type="smallBold">{photo.eventTitle}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {`Reported ${times} · taken down ${when}`}
        </ThemedText>
      </View>
      <ButtonRow>
        <Button label="Put it back" variant="secondary" onPress={() => onDecide('restore')} disabled={busy} />
        <Button label="Keep it down" variant="secondary" onPress={() => onDecide('keep')} disabled={busy} />
      </ButtonRow>
      <Button label="Delete for good" variant="danger" onPress={() => onDecide('delete')} loading={busy} />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    gap: 16,
  },
  card: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.medium,
  },
  noPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    gap: 2,
  },
});
