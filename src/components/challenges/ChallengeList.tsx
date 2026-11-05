import { useState } from 'react';
import { ActivityIndicator, Modal, Share, StyleSheet, View } from 'react-native';
import { formatInTimeZone } from 'date-fns-tz';

import { uploadChallengePhoto } from '@/api/photos';
import PhotoCapture from '@/components/camera/PhotoCapture';
import { CHALLENGE_TYPES } from '@/components/challenges/challengeTypes';
import ConfirmChallenge from '@/components/challenges/ConfirmChallenge';
import DanceMeter from '@/components/challenges/DanceMeter';
import PointsEarned, { type ChallengeResult } from '@/components/challenges/PointsEarned';
import RateAndVote from '@/components/challenges/RateAndVote';
import { TaskCard } from '@/components/ui/TaskCard';
import { EVENTS_PAGE_URL } from '@/constants/config';
import { useChallenges } from '@/hooks/useChallenges';
import { useNow } from '@/hooks/useNow';
import { useSetPhotoShared } from '@/hooks/usePhotos';
import { useTheme } from '@/hooks/useTheme';
import { getCurrentUserId } from '@/lib/supabase';
import { showError, showMessage } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import { askToSharePhotos } from '@/services/photoSharing';
import { useLocationStore } from '@/state/locationStore';
import type { Challenge, PopUpEvent } from '@/types';
import { nameFromContent } from '@/utils/a11y';
import { challengeRequirement } from '@/utils/challengeConfig';
import type { EventPhase } from '@/utils/dateTime';
import { distanceInMeters } from '@/utils/distance';
import { useMotion } from '@/constants/motion';

/** Why the challenges can't be started yet, if so (the server says the same). */
export function challengeLockedReason(phase: EventPhase, checkedIn: boolean, opensAt: string): string | undefined {
  if (phase === 'upcoming') return `Challenges open when the pop-up starts, ${opensAt}.`;
  if (phase === 'ended') return 'This pop-up has ended.';
  if (!checkedIn) return 'Check in to this pop-up before doing its challenges.';
  return undefined;
}

export type ChallengeListProps = {
  event: PopUpEvent;
  lockedReason?: string;
  /** Show only the first few (the pop-up page); all of them otherwise. */
  limit?: number;
};

/**
 * The event's challenges as task cards (X-01). Tapping one opens the input
 * its type needs, full screen — the camera, the dance meter, rate and
 * vote, or the rule and DONE — and every path ends in complete_challenge,
 * where the server checks the check-in and the type's own rule. Then
 * "Points earned" (X-05) in the same screen, with the next challenge.
 */
export default function ChallengeList({ event, lockedReason, limit }: ChallengeListProps) {
  const theme = useTheme();
  const motion = useMotion();
  const { challenges, isLoading, completedByChallenge, complete, completePending } = useChallenges(event.id);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const sharePhotos = useSetPhotoShared();
  const [result, setResult] = useState<(ChallengeResult & { challengeId: string }) | null>(null);

  const busy = completePending || uploading;
  const activeChallenge = activeId ? challenges.find((challenge) => challenge.id === activeId) : undefined;
  const next = result
    ? challenges.find((challenge) => challenge.id !== result.challengeId && !completedByChallenge.has(challenge.id))
    : undefined;

  const finish = (challenge: Challenge, data: Record<string, unknown>) =>
    complete(
      { challengeId: challenge.id, data },
      {
        onSuccess: (outcome) => {
          setActiveId(null);
          setResult({
            ...outcome,
            challengeId: challenge.id,
            title: challenge.title,
            points: outcome.points ?? challenge.points,
            listed: challenge.points,
          });
        },
        // The server says exactly what's missing ("Take 3 photos — 1
        // uploaded so far", "This one opens at 18:00"), so show it as is.
        onError: (error) => showError('Not yet', error),
      },
    );

  const share = async (challenge: Challenge) => {
    if (challenge.type !== 'social') return;
    try {
      const userId = await getCurrentUserId();
      const message =
        challenge.config.message || `Join me at ${event.title}, use my code ${userId.slice(0, 8)} when you check in.`;
      const outcome = await Share.share({ message: `${message} ${EVENTS_PAGE_URL}` });
      if (outcome.action !== Share.dismissedAction) finish(challenge, {});
    } catch {
      // Share sheet unavailable: nothing to complete.
    }
  };

  const start = (challenge: Challenge) => {
    setResult(null);
    if (completedByChallenge.has(challenge.id) || busy) return;
    if (lockedReason) {
      haptics.warning();
      showMessage('Not yet', lockedReason);
      return;
    }
    if (challenge.type === 'check_in') {
      finish(challenge, {});
      return;
    }
    if (challenge.type === 'social') {
      void share(challenge);
      return;
    }
    setActiveId(challenge.id);
  };

  const sendPhotos = async (challenge: Challenge, uris: string[]) => {
    setUploading(true);
    const photoIds: string[] = [];
    try {
      for (const uri of uris) {
        photoIds.push(await uploadChallengePhoto({ uri, eventId: event.id, challengeId: challenge.id }));
      }
    } catch (error) {
      haptics.error();
      showError('Upload failed', error, 'Check your connection and try again.');
      return;
    } finally {
      setUploading(false);
    }
    finish(challenge, {});
    // Private unless they say so, asked now while the photo is fresh.
    if (await askToSharePhotos(photoIds.length)) {
      sharePhotos.mutate(
        { photoIds, shared: true },
        { onError: (error) => showError('Couldn’t share it', error, 'You can share it later from Account.') },
      );
    }
  };

  const close = () => {
    if (busy) return;
    setActiveId(null);
    setResult(null);
  };

  if (isLoading) {
    return <ActivityIndicator color={theme.text} style={styles.loader} />;
  }

  const shown = limit ? challenges.slice(0, limit) : challenges;

  return (
    <View style={styles.list}>
      {shown.map((challenge) => {
        const done = completedByChallenge.has(challenge.id);
        const requirement = challengeRequirement(challenge, event.timeZone);
        return (
          <TaskCard
            key={challenge.id}
            icon={CHALLENGE_TYPES[challenge.type].icon}
            title={challenge.title}
            subtitle={challenge.description || requirement || undefined}
            state={done ? 'done' : 'value'}
            value={`+${challenge.points}`}
            onPress={done || busy ? undefined : () => start(challenge)}
            {...nameFromContent(`${challenge.title}, ${challenge.points} points, ${done ? 'done' : 'to do'}`)}
            accessibilityHint={done ? undefined : (lockedReason ?? requirement ?? undefined)}
          />
        );
      })}

      <Modal visible={Boolean(activeChallenge || result)} animationType={motion.challenge} onRequestClose={close}>
        <View style={[styles.flex, { backgroundColor: theme.background }]}>
          {result ? (
            <PointsEarned result={result} onNext={next ? () => start(next) : undefined} onClose={close} />
          ) : activeChallenge ? (
            <ChallengeInput
              challenge={activeChallenge}
              event={event}
              sending={busy}
              onComplete={(data) => finish(activeChallenge, data)}
              onPhotos={(uris) => void sendPhotos(activeChallenge, uris)}
              onClose={close}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

/** The input one challenge type needs (X-02…X-04, or the rule and DONE). */
function ChallengeInput({
  challenge,
  event,
  sending,
  onComplete,
  onPhotos,
  onClose,
}: {
  challenge: Challenge;
  event: PopUpEvent;
  sending: boolean;
  onComplete: (data: Record<string, unknown>) => void;
  onPhotos: (uris: string[]) => void;
  onClose: () => void;
}) {
  const coordinates = useLocationStore((state) => state.coordinates);
  // Ticks every 15 s, so a timing window opens (or closes) on screen.
  const now = useNow(15_000).getTime();
  const requirement = challengeRequirement(challenge, event.timeZone) ?? undefined;
  const common = { title: challenge.title, points: challenge.points, sending, onClose };

  switch (challenge.type) {
    case 'capture':
    case 'discovery':
      return (
        <PhotoCapture
          {...common}
          heading={challenge.description || challenge.title}
          prompt={requirement}
          count={challenge.config.photoCount}
          onSend={onPhotos}
        />
      );
    case 'motion':
      return (
        <DanceMeter
          {...common}
          seconds={challenge.config.seconds}
          onDone={(activeSeconds) => onComplete({ activeSeconds })}
        />
      );
    case 'taste':
      return (
        <RateAndVote
          {...common}
          mode="rate"
          heading={
            challenge.description || (challenge.config.dish ? `How was the ${challenge.config.dish}?` : 'How was it?')
          }
          onSubmit={(rating) => onComplete({ rating })}
        />
      );
    case 'community':
      return (
        <RateAndVote
          {...common}
          mode="vote"
          heading={challenge.description || 'Cast your vote'}
          options={challenge.config.options}
          onSubmit={(choice) => onComplete({ choice })}
        />
      );
    default: {
      // Pre-checks for the types we can judge here; the server has the last word.
      let blockedReason: string | undefined;
      if (challenge.type === 'explore') {
        const distance = coordinates ? distanceInMeters(coordinates, event.coordinates) : null;
        if (distance === null) blockedReason = 'Turn on location to confirm you’re at the venue.';
        else if (distance > challenge.config.radiusM) {
          blockedReason = `You’re ${Math.round(distance)} m away. Get within ${challenge.config.radiusM} m.`;
        }
      }
      if (challenge.type === 'timing') {
        const time = (iso: string) => formatInTimeZone(iso, event.timeZone, 'HH:mm');
        if (now < Date.parse(challenge.config.startsAt)) {
          blockedReason = `This one opens at ${time(challenge.config.startsAt)}.`;
        } else if (now > Date.parse(challenge.config.endsAt)) {
          blockedReason = `This one closed at ${time(challenge.config.endsAt)}.`;
        }
      }
      return (
        <ConfirmChallenge
          {...common}
          icon={CHALLENGE_TYPES[challenge.type].icon}
          heading={challenge.description || challenge.title}
          requirement={requirement}
          blockedReason={blockedReason}
          onConfirm={() =>
            onComplete(
              challenge.type === 'explore' && coordinates
                ? { latitude: coordinates.latitude, longitude: coordinates.longitude }
                : {},
            )
          }
        />
      );
    }
  }
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  loader: {
    marginVertical: 24,
  },
});
