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
      <View style={styles.header}>
        <ThemedText type="section" accessibilityRole="header">
          Challenges
        </ThemedText>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {completedCount} of {challenges.length} done
        </ThemedText>
      </View>
      {!checkedIn ? (
        <ThemedText type="small" themeColor="textSecondary">
          Check in to start them. Each one earns points.
        </ThemedText>
      ) : null}
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
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: {
    gap: Spacing.two + Spacing.one,
    marginTop: Spacing.one,
  },
  loader: {
    marginVertical: Spacing.four,
  },
});
