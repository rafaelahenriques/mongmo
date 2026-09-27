import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, View } from 'react-native';
import { formatInTimeZone } from 'date-fns-tz';

import { uploadChallengePhoto } from '@/api/photos';
import { CHALLENGE_TYPES } from '@/components/challenges/challengeTypes';
import CommunityVoteModal from '@/components/challenges/CommunityVoteModal';
import SimpleConfirmModal from '@/components/challenges/SimpleConfirmModal';
import TasteRatingModal from '@/components/challenges/TasteRatingModal';
import PhotoCapture from '@/components/camera/PhotoCapture';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { IconBadge } from '@/components/ui/IconBadge';
import { EVENTS_PAGE_URL } from '@/constants/config';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getCurrentUserId } from '@/lib/supabase';
import { haptics } from '@/services/haptics';
import { useLocationStore } from '@/state/locationStore';
import type { Challenge, ChallengeCompletion, PopUpEvent } from '@/types';
import { challengeRequirement } from '@/utils/challengeConfig';
import { distanceInMeters } from '@/utils/distance';

export type ChallengeItemProps = {
  challenge: Challenge;
  completion: ChallengeCompletion | undefined;
  event: PopUpEvent;
  checkedIn: boolean;
  onComplete: (data: Record<string, unknown>) => void;
  pending: boolean;
};

type Modal = 'confirm' | 'taste' | 'community' | 'capture' | null;

/**
 * One challenge row. Tapping it opens the interaction its type needs — the
 * camera for Capture/Discovery (as many photos as the owner asked for), a
 * rating for Taste, the owner's options for a vote, the share sheet for
 * Social, and a confirm for the rest. Every path ends in complete_challenge,
 * where the server checks the check-in and the type's own rule; the hints
 * here (distance, time window) only save a pointless round trip.
 */
export default function ChallengeItem({
  challenge,
  completion,
  event,
  checkedIn,
  onComplete,
  pending,
}: ChallengeItemProps) {
  const theme = useTheme();
  const userCoordinates = useLocationStore((state) => state.coordinates);
  const [modal, setModal] = useState<Modal>(null);
  const [uploading, setUploading] = useState(false);
  // When the confirm sheet opened: the time a timing window is judged against.
  const [openedAt, setOpenedAt] = useState(0);

  const done = Boolean(completion);
  const busy = pending || uploading;
  const requirement = challengeRequirement(challenge, event.timeZone);

  /** Why the confirm button is off right now, for the types we can pre-check. */
  const blockedReason = (): string | undefined => {
    if (challenge.type === 'explore') {
      if (!userCoordinates) return 'Turn on location to confirm you’re at the venue.';
      const distance = distanceInMeters(userCoordinates, event.coordinates);
      if (distance > challenge.config.radiusM) {
        return `You’re ${Math.round(distance)} m away — get within ${challenge.config.radiusM} m.`;
      }
    }
    if (challenge.type === 'timing') {
      const time = (iso: string) => formatInTimeZone(iso, event.timeZone, 'HH:mm');
      if (openedAt < Date.parse(challenge.config.startsAt)) return `This one opens at ${time(challenge.config.startsAt)}.`;
      if (openedAt > Date.parse(challenge.config.endsAt)) return `This one closed at ${time(challenge.config.endsAt)}.`;
    }
    return undefined;
  };

  const onConfirm = () => {
    setModal(null);
    onComplete(
      challenge.type === 'explore' && userCoordinates
        ? { latitude: userCoordinates.latitude, longitude: userCoordinates.longitude }
        : {},
    );
  };

  const onShare = async () => {
    if (challenge.type !== 'social') return;
    try {
      const userId = await getCurrentUserId();
      const message =
        challenge.config.message || `Join me at ${event.title} — use my code ${userId.slice(0, 8)} when you check in.`;
      const result = await Share.share({ message: `${message} ${EVENTS_PAGE_URL}` });
      if (result.action !== Share.dismissedAction) onComplete({});
    } catch {
      // Share sheet unavailable — nothing to complete.
    }
  };

  const onPress = () => {
    // Also ignore taps while a completion is in flight: the sheet that just
    // submitted fades out over this row, and a tap landing on it would
    // reopen the sheet for a challenge that's about to show as done.
    if (done || busy) return;

    if (!checkedIn) {
      haptics.warning();
      Alert.alert('Check in first', 'Check in to this event before completing its challenges.');
      return;
    }

    switch (challenge.type) {
      case 'check_in':
        onComplete({});
        return;
      case 'capture':
      case 'discovery':
        setModal('capture');
        return;
      case 'taste':
        setModal('taste');
        return;
      case 'community':
        setModal('community');
        return;
      case 'social':
        void onShare();
        return;
      default:
        setOpenedAt(Date.now());
        setModal('confirm');
    }
  };

  const onPhotosTaken = useCallback(
    async (uris: string[]) => {
      setModal(null);
      setUploading(true);
      try {
        for (const uri of uris) {
          await uploadChallengePhoto({ uri, eventId: event.id, challengeId: challenge.id });
        }
        onComplete({});
      } catch (error) {
        haptics.error();
        Alert.alert('Upload failed', error instanceof Error ? error.message : 'Check your connection and try again.');
      } finally {
        setUploading(false);
      }
    },
    [event.id, challenge.id, onComplete],
  );

  const photoCount =
    challenge.type === 'capture' || challenge.type === 'discovery' ? challenge.config.photoCount : 1;

  return (
    <>
      <Card
        onPress={onPress}
        disabled={done || busy}
        accessibilityLabel={`${challenge.title}, ${challenge.points} points, ${done ? 'completed' : 'not completed'}`}
        accessibilityHint={requirement ?? undefined}
        style={[styles.row, done && { opacity: 0.75 }]}
      >
        <IconBadge name={CHALLENGE_TYPES[challenge.type].icon} tone={done ? 'success' : 'muted'} size={44} />
        <View style={styles.texts}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {challenge.title}
          </ThemedText>
          {challenge.description ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {challenge.description}
            </ThemedText>
          ) : null}
          {requirement && !done ? (
            <ThemedText type="small" themeColor="primaryText" numberOfLines={2}>
              {requirement}
            </ThemedText>
          ) : null}
        </View>
        {done ? (
          <Icon name="checkCircle" size={24} color={theme.success} />
        ) : uploading ? (
          <ActivityIndicator color={theme.text} accessibilityLabel="Uploading photos" />
        ) : (
          <View style={[styles.points, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold" themeColor="primaryText">
              +{challenge.points}
            </ThemedText>
          </View>
        )}
      </Card>

      <SimpleConfirmModal
        visible={modal === 'confirm'}
        title={challenge.title}
        body={[challenge.description, requirement].filter(Boolean).join('\n\n')}
        pending={pending}
        disabledReason={modal === 'confirm' ? blockedReason() : undefined}
        onConfirm={onConfirm}
        onClose={() => setModal(null)}
      />

      <TasteRatingModal
        visible={modal === 'taste'}
        title={challenge.title}
        dish={challenge.type === 'taste' ? challenge.config.dish : undefined}
        pending={pending}
        onSubmit={(rating) => {
          setModal(null);
          onComplete({ rating });
        }}
        onClose={() => setModal(null)}
      />

      {challenge.type === 'community' ? (
        <CommunityVoteModal
          visible={modal === 'community'}
          title={challenge.title}
          description={challenge.description}
          options={challenge.config.options}
          pending={pending}
          onSubmit={(choice) => {
            setModal(null);
            onComplete({ choice });
          }}
          onClose={() => setModal(null)}
        />
      ) : null}

      <PhotoCapture
        visible={modal === 'capture'}
        title={challenge.title}
        prompt={requirement ?? undefined}
        count={photoCount}
        onDone={onPhotosTaken}
        onClose={() => setModal(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  points: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
  },
});
