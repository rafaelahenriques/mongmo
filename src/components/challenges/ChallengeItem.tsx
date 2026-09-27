import { useCallback, useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';

import { CHALLENGE_ICON } from '@/components/challenges/challengeIcons';
import CommunityVoteModal from '@/components/challenges/CommunityVoteModal';
import SimpleConfirmModal from '@/components/challenges/SimpleConfirmModal';
import TasteRatingModal from '@/components/challenges/TasteRatingModal';
import PhotoCapture from '@/components/camera/PhotoCapture';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { IconBadge } from '@/components/ui/IconBadge';
import { Radius, Spacing } from '@/constants/theme';
import { GEOFENCE_RADIUS_M, EVENTS_PAGE_URL } from '@/constants/config';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { saveAndUploadChallengePhoto } from '@/api/photos';
import { getCurrentUserId } from '@/lib/supabase';
import { useLocationStore } from '@/state/locationStore';
import { distanceInMeters } from '@/utils/distance';
import type { Challenge, ChallengeCompletion, PopUpEvent } from '@/types';

/** Types whose "confirm" step first checks the device is within the geofence. */
const LOCATION_GATED: ReadonlySet<Challenge['type']> = new Set(['explore', 'timing']);

export type ChallengeItemProps = {
  challenge: Challenge;
  completion: ChallengeCompletion | undefined;
  event: PopUpEvent;
  checkedIn: boolean;
  onComplete: (data: Record<string, unknown>) => void;
  pending: boolean;
};

/**
 * One challenge row. Dispatches to a type-specific interaction on tap —
 * camera for Capture/Discovery, a rating for Taste, a vote for Community,
 * and a plain confirm (optionally geofence-gated) for the rest. Every path
 * ends in the same `complete_challenge` call; the server still requires a
 * prior check-in for this event before any of them can succeed.
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
  const [modal, setModal] = useState<'confirm' | 'taste' | 'community' | 'capture' | null>(null);

  const done = Boolean(completion);

  const distanceReason = useCallback((): string | undefined => {
    if (!LOCATION_GATED.has(challenge.type)) return undefined;
    if (!userCoordinates) return 'Turn on location to confirm you’re at the venue.';
    const distance = distanceInMeters(userCoordinates, event.coordinates);
    if (distance > GEOFENCE_RADIUS_M) {
      return `You're ${Math.round(distance)} m away — get closer to the venue to complete this.`;
    }
    return undefined;
  }, [challenge.type, event.coordinates, userCoordinates]);

  const onPress = useCallback(async () => {
    // Also ignore taps while a completion is in flight: the sheet that just
    // submitted fades out over this row, and a tap landing on it would
    // reopen the sheet for a challenge that's about to show as done.
    if (done || pending) return;

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
      case 'social': {
        try {
          const userId = await getCurrentUserId();
          await Share.share({
            message: `Join me at ${event.title} — use my code ${userId.slice(0, 8)} when you check in. ${EVENTS_PAGE_URL}`,
          });
          onComplete({ sharedAt: new Date().toISOString() });
        } catch {
          // Share sheet dismissed — no completion.
        }
        return;
      }
      default:
        setModal('confirm');
    }
  }, [checkedIn, challenge.type, done, pending, event.title, onComplete]);

  const onCapturePhoto = useCallback(
    async (localUri: string) => {
      setModal(null);
      const photoUrl = await saveAndUploadChallengePhoto({
        localUri,
        eventId: event.id,
        challengeId: challenge.id,
      });
      onComplete({ photoUrl });
    },
    [event.id, challenge.id, onComplete],
  );

  return (
    <>
      <Card
        onPress={onPress}
        disabled={done || pending}
        accessibilityLabel={`${challenge.title}, ${challenge.points} points, ${done ? 'completed' : 'not completed'}`}
        style={[styles.row, done && { opacity: 0.75 }]}
      >
        <IconBadge name={CHALLENGE_ICON[challenge.type]} tone={done ? 'success' : 'muted'} size={44} />
        <View style={styles.texts}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {challenge.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {challenge.description}
          </ThemedText>
        </View>
        {done ? (
          <Icon name="checkCircle" size={24} color={theme.success} />
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
        body={challenge.description}
        pending={pending}
        disabledReason={distanceReason()}
        onConfirm={() => {
          setModal(null);
          onComplete({ confirmedAt: new Date().toISOString() });
        }}
        onClose={() => setModal(null)}
      />

      <TasteRatingModal
        visible={modal === 'taste'}
        title={challenge.title}
        pending={pending}
        onSubmit={(rating) => {
          setModal(null);
          onComplete({ rating });
        }}
        onClose={() => setModal(null)}
      />

      <CommunityVoteModal
        visible={modal === 'community'}
        title={challenge.title}
        description={challenge.description}
        pending={pending}
        onSubmit={(choice) => {
          setModal(null);
          onComplete({ choice });
        }}
        onClose={() => setModal(null)}
      />

      <PhotoCapture
        visible={modal === 'capture'}
        title={challenge.title}
        onCapture={onCapturePhoto}
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
