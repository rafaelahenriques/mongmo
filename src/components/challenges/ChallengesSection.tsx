import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import ChallengeItem from '@/components/challenges/ChallengeItem';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useChallenges } from '@/hooks/useChallenges';
import { useTheme } from '@/hooks/useTheme';
import type { PopUpEvent } from '@/types';

export type ChallengesSectionProps = {
  event: PopUpEvent;
  checkedIn: boolean;
};

/**
 * The event's challenges, each opening its type-specific interaction —
 * reached from Event Detail, never a dedicated tab (AGENTS.md).
 */
export default function ChallengesSection({ event, checkedIn }: ChallengesSectionProps) {
  const theme = useTheme();
  const { challenges, isLoading, completedByChallenge, complete, completePending } = useChallenges(event.id);

  const onComplete = useCallback(
    (challengeId: string) => (data: Record<string, unknown>) => complete({ challengeId, data }),
    [complete],
  );

  if (isLoading) {
    return <ActivityIndicator size="small" color={theme.text} style={styles.loader} />;
  }

  if (challenges.length === 0) {
    return null;
  }

  const completedCount = challenges.filter((challenge) => completedByChallenge.has(challenge.id)).length;

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" style={styles.title}>
        Challenges · {completedCount}/{challenges.length}
      </ThemedText>
      <View style={styles.list}>
        {challenges.map((challenge) => (
          <ChallengeItem
            key={challenge.id}
            challenge={challenge}
            completion={completedByChallenge.get(challenge.id)}
            event={event}
            checkedIn={checkedIn}
            onComplete={onComplete(challenge.id)}
            pending={completePending}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    marginBottom: Spacing.one,
  },
  list: {
    gap: Spacing.two,
  },
  loader: {
    marginVertical: Spacing.four,
  },
});
