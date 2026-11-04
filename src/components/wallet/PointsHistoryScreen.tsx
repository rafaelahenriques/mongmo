import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { formatInTimeZone } from 'date-fns-tz';

import { CHALLENGE_TYPES } from '@/components/challenges/challengeTypes';
import { ThemedText } from '@/components/ThemedText';
import { BigNumber } from '@/components/ui/BigNumber';
import type { IconName } from '@/components/ui/Icon';
import { TaskCard } from '@/components/ui/TaskCard';
import { PageInset } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { usePointsHistory } from '@/hooks/usePointsHistory';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import type { PointsHistoryEntry } from '@/api/endpoints';
import type { ChallengeType } from '@/types/database';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';

function iconFor(entry: PointsHistoryEntry): IconName {
  if (entry.source === 'reward_redeemed') return 'gift';
  if (entry.source === 'badge') return 'award';
  return CHALLENGE_TYPES[entry.challengeType as ChallengeType]?.icon ?? 'star';
}

/**
 * M-03 Points: the balance big, then the ledger: what each +20 or −300
 * was for. The leaderboard is on Achievements.
 */
export default function PointsHistoryScreen() {
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  const { summary } = useAchievements();
  const history = usePointsHistory();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
    >
      <BigNumber value={summary.points} word="Points" size={46} />
      {history.isPending ? (
        <ActivityIndicator color={theme.text} style={styles.loader} />
      ) : history.isError ? (
        <ThemedText type="caption" themeColor="textSecondary">
          Couldn’t load your points. Pull down to try again.
        </ThemedText>
      ) : history.data.length === 0 ? (
        <ThemedText type="caption" themeColor="textSecondary">
          Nothing yet. Check in at a pop-up and do its challenges to earn points.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {history.data.map((entry) => (
            <TaskCard
              key={entry.id}
              icon={iconFor(entry)}
              title={entry.source === 'reward_redeemed' ? 'Reward redeemed' : entry.title}
              subtitle={
                [
                  entry.source === 'reward_redeemed' ? entry.title : entry.place,
                  formatInTimeZone(new Date(entry.createdAt), DISPLAY_TIME_ZONE, 'd MMM'),
                ]
                  .filter(Boolean)
                  .join(' · ') || undefined
              }
              state="plain"
              value={entry.points > 0 ? `+${entry.points}` : `−${Math.abs(entry.points)}`}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    gap: 14,
  },
  list: {
    gap: 8,
  },
  loader: {
    marginVertical: 24,
  },
});
