import { useCallback, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Camera as CameraIcon,
  Check,
  Clock,
  Compass,
  Flame,
  Layers,
  QrCode,
  Search,
  Share2,
  Users,
  Utensils,
} from 'lucide-react-native';

import CommunityVoteModal from '@/components/challenges/CommunityVoteModal';
import SimpleConfirmModal from '@/components/challenges/SimpleConfirmModal';
import TasteRatingModal from '@/components/challenges/TasteRatingModal';
import PhotoCapture from '@/components/camera/PhotoCapture';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { GEOFENCE_RADIUS_M, EVENTS_PAGE_URL } from '@/constants/config';
import { useTheme } from '@/hooks/useTheme';
import { saveAndUploadChallengePhoto } from '@/api/photos';
import { getCurrentUserId } from '@/lib/supabase';
import { useLocationStore } from '@/state/locationStore';
import { distanceInMeters } from '@/utils/distance';
import type { Challenge, ChallengeCompletion, PopUpEvent } from '@/types';

const TYPE_ICON: Record<Challenge['type'], typeof Compass> = {
  explore: Compass,
  check_in: QrCode,
  capture: CameraIcon,
  taste: Utensils,
  social: Share2,
  timing: Clock,
  collection: Layers,
  discovery: Search,
  streak: Flame,
  community: Users,
};

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

  const Icon = TYPE_ICON[challenge.type];
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
    if (done) return;

    if (!checkedIn) {
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
  }, [checkedIn, challenge.type, done, event.title, onComplete]);

  const onCapturePhoto = useCallback(
    async (localUri: string) => {
      setModal(null);
      const photoUrl = await saveAndUploadChallengePhoto({
        localUri,
        eventId: event.id,
        challengeId: challenge.id,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      onComplete({ photoUrl });
    },
    [event.id, challenge.id, onComplete],
  );

  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={done}
        accessibilityRole="button"
        accessibilityLabel={`${challenge.title}, ${challenge.points} points, ${done ? 'completed' : 'not completed'}`}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.backgroundSelected,
            opacity: done ? 0.7 : pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSelected }]}>
          <Icon size={18} color={theme.text} />
        </View>
        <View style={styles.texts}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {challenge.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {challenge.description}
          </ThemedText>
        </View>
        <View style={styles.trailing}>
          {done ? (
            <Check size={20} color={theme.success} />
          ) : (
            <ThemedText type="smallBold">+{challenge.points}</ThemedText>
          )}
        </View>
      </Pressable>

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
    gap: Spacing.two,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  trailing: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
