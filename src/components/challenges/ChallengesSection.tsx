import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import ChallengeList, { challengeLockedReason } from '@/components/challenges/ChallengeList';
import { ThemedText } from '@/components/ThemedText';
import { TextLink } from '@/components/ui/TextLink';
import { CHALLENGE_POINTS_PER_DAY } from '@/constants/points';
import { useChallenges } from '@/hooks/useChallenges';
import type { PopUpEvent } from '@/types';
import type { EventPhase } from '@/utils/dateTime';

/** How many the pop-up page shows before "See all". */
const PREVIEW = 3;

export type ChallengesSectionProps = {
  event: PopUpEvent;
  checkedIn: boolean;
  phase: EventPhase;
  /** When check-in opens, already formatted in the pop-up's zone. */
  opensAt: string;
};

/**
 * The challenges on the pop-up page (P-03): "Challenges, 1 of 5 done", the
 * first few as task cards, and the whole list (X-01) a tap away.
 */
export default function ChallengesSection({ event, checkedIn, phase, opensAt }: ChallengesSectionProps) {
  const router = useRouter();
  const { challenges, completedByChallenge } = useChallenges(event.id);

  if (challenges.length === 0) return null;

  const done = challenges.filter((challenge) => completedByChallenge.has(challenge.id)).length;
  const lockedReason = challengeLockedReason(phase, checkedIn, opensAt);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Challenges
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {done} of {challenges.length} done
        </ThemedText>
      </View>
      {lockedReason ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {phase === 'live' ? `Check in to start them: up to ${CHALLENGE_POINTS_PER_DAY} points a day.` : lockedReason}
        </ThemedText>
      ) : null}
      <ChallengeList event={event} lockedReason={lockedReason} limit={PREVIEW} />
      {challenges.length > PREVIEW ? (
        <TextLink
          label={`See all ${challenges.length}`}
          onPress={() => router.push({ pathname: '/(popups)/challenges/[id]', params: { id: event.id } })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
});
