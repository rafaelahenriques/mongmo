import { useCallback, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import BadgeCard from '@/components/achievements/BadgeCard';
import LeaderboardList from '@/components/achievements/LeaderboardList';
import RewardRow from '@/components/achievements/RewardRow';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useTheme } from '@/hooks/useTheme';
import type { LeaderboardPeriod, Reward } from '@/types';

/**
 * Achievements tab content: points header, badge grid (earned vs locked),
 * redeemable rewards and the weekly/all-time leaderboard. Everything here
 * is server-authoritative — badges, points and redemptions all come from
 * Supabase, never decided on-device.
 */
export default function AchievementsScreen() {
  const theme = useTheme();
  const { query, summary, userRewards, redeemReward } = useAchievements();
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const leaderboard = useLeaderboard(period);

  const earnedByBadge = useMemo(
    () => new Map(summary.earned.map((badge) => [badge.badgeId, badge])),
    [summary.earned],
  );

  const onRedeem = useCallback(
    (reward: Reward) => {
      redeemReward(reward.id, {
        onSuccess: () => {
          AccessibilityInfo.announceForAccessibility(
            `${reward.title} redeemed. Points balance updated.`,
          );
        },
        onError: () => {
          AccessibilityInfo.announceForAccessibility(
            `Couldn't redeem ${reward.title} — check your points balance.`,
          );
        },
      });
    },
    [redeemReward],
  );

  if (query.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText type="small" themeColor="textSecondary">
          Loading achievements…
        </ThemedText>
      </View>
    );
  }

  if (query.isError || !query.data) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ThemedText type="smallBold">Couldn’t load achievements</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
          Your badges and points are safe — this is only the catalog. Check your connection.
        </ThemedText>
        <Pressable
          onPress={() => query.refetch()}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={({ pressed }) => [
            styles.retry,
            { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <ThemedText type="smallBold">Try again</ThemedText>
        </Pressable>
      </View>
    );
  }

  const { badges, rewards } = query.data;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View
        accessibilityRole="header"
        accessibilityLabel={`${summary.points} points, ${summary.eventsAttended} events attended`}
        style={[
          styles.pointsCard,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}
      >
        <ThemedText type="title" style={styles.points}>
          {summary.points.toLocaleString()}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="textSecondary">
          points
        </ThemedText>
        <View style={styles.pointsStats}>
          <ThemedText type="small" themeColor="textSecondary">
            {summary.eventsAttended} event{summary.eventsAttended === 1 ? '' : 's'} attended
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            ·
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {summary.citiesVisited} cit{summary.citiesVisited === 1 ? 'y' : 'ies'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            ·
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {summary.earned.length}/{badges.length} badges
          </ThemedText>
        </View>
      </View>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Badges
      </ThemedText>
      <View style={styles.grid}>
        {badges.map((badge) => (
          <BadgeCard key={badge.id} definition={badge} earned={earnedByBadge.get(badge.id)} />
        ))}
      </View>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Rewards
      </ThemedText>
      <View style={styles.rewards}>
        {rewards.map((reward) => (
          <RewardRow
            key={reward.id}
            reward={reward}
            points={summary.points}
            redeemedCount={userRewards.filter((entry) => entry.reward_id === reward.id).length}
            onRedeem={onRedeem}
          />
        ))}
      </View>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Leaderboard
      </ThemedText>
      <View style={styles.section}>
        <LeaderboardList
          rows={leaderboard.rows}
          hidden={leaderboard.hidden}
          period={period}
          onChangePeriod={setPeriod}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  pointsCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  points: {
    fontSize: 44,
    lineHeight: 50,
  },
  pointsStats: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  section: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    marginTop: Spacing.four,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  rewards: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  stateBody: {
    textAlign: 'center',
    maxWidth: 320,
  },
  retry: {
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
});
