import { ScrollView, StyleSheet, View } from 'react-native';

import { badgeIcon } from '@/components/achievements/badgeIcons';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { Coin } from '@/components/ui/Coin';
import { TaskCard } from '@/components/ui/TaskCard';
import { TopBar } from '@/components/ui/TopBar';
import { CHALLENGE_POINTS_PER_DAY } from '@/constants/points';
import { PageInset } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { BadgeDefinition } from '@/types';

export type ChallengeResult = {
  title: string;
  /** What it earned. */
  points: number;
  /** The challenge's own points: more than `points` once the day's cap is hit. */
  listed?: number;
  /** The balance after this challenge; null when it couldn't be read. */
  balance: number | null;
  /** A badge this challenge unlocked, if any. */
  badge: BadgeDefinition | null;
};

/**
 * X-05 Points earned: the points big with the faded word under them, a
 * sage coin with a tick, the new balance, any badge it unlocked, and the
 * next challenge.
 */
export default function PointsEarned({
  result,
  onNext,
  onClose,
}: {
  result: ChallengeResult;
  /** Opens the next challenge still to do; none when they're all done. */
  onNext?: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const capped = result.listed !== undefined && result.points < result.listed;
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TopBar title="" onBack={onClose} backIcon="close" />
      <ScrollView contentContainerStyle={styles.body}>
        {result.points > 0 ? (
          <View accessible accessibilityRole="header" accessibilityLabel={`Plus ${result.points} points`}>
            <ThemedText type="display" style={styles.big}>
              +{result.points}
            </ThemedText>
            <ThemedText type="display" style={[styles.big, { color: theme.faded }]}>
              POINTS
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="display" style={styles.big} accessibilityRole="header">
            DONE
          </ThemedText>
        )}
        <Coin icon="checkSquare" size={150} />
        <ThemedText type="default" style={styles.text}>
          {result.title}, done.
          {result.balance !== null
            ? ` New balance: ${result.balance} ${result.balance === 1 ? 'point' : 'points'}.`
            : ''}
        </ThemedText>
        {capped ? (
          <ThemedText type="caption" themeColor="textSecondary" style={styles.text}>
            {`That’s today’s ${CHALLENGE_POINTS_PER_DAY} challenge points at this pop-up. Challenges still count for badges, and orders still earn points.`}
          </ThemedText>
        ) : null}
      </ScrollView>
      {result.badge ? (
        <TaskCard
          icon={badgeIcon(result.badge.key)}
          title={`New badge: ${result.badge.title}`}
          subtitle={result.badge.description}
          state="plain"
          style={styles.badge}
        />
      ) : null}
      {onNext ? (
        <BlockButton label="Next challenge" onPress={onNext} bottomInset />
      ) : (
        <BlockButton label="Back to challenges" onPress={onClose} bottomInset />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    alignItems: 'center',
    gap: 28,
    paddingHorizontal: PageInset,
    paddingTop: 12,
    paddingBottom: 24,
  },
  big: {
    fontSize: 80,
    lineHeight: 84,
    textAlign: 'center',
  },
  text: {
    textAlign: 'center',
  },
  badge: {
    marginHorizontal: PageInset,
    marginBottom: 14,
  },
});
