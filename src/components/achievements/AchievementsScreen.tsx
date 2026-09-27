import { useCallback, useMemo, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, View } from 'react-native';

import BadgeCard from '@/components/achievements/BadgeCard';
import LeaderboardList from '@/components/achievements/LeaderboardList';
import RewardRow from '@/components/achievements/RewardRow';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { ScreenScroll, SectionHeader } from '@/components/ui/Screen';
import { StatRow } from '@/components/ui/StatRow';
import { Spacing } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
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
          haptics.success();
          AccessibilityInfo.announceForAccessibility(
            `${reward.title} redeemed. Points balance updated.`,
          );
        },
        onError: () => {
          haptics.error();
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
        <IconBadge name="alert" size={56} />
        <ThemedText type="section">Couldn’t load achievements</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
          Your badges and points are safe — this is only the catalog. Check your connection.
        </ThemedText>
        <Button label="Try again" size="medium" onPress={() => query.refetch()} />
      </View>
    );
  }

  const { badges, rewards } = query.data;

  return (
    <ScreenScroll>
      <Card tone="brand" style={styles.pointsCard}>
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${summary.points} points, ${summary.eventsAttended} events attended`}
        >
          <ThemedText type="label" style={{ color: theme.onBrand, opacity: 0.85 }}>
            Your points
          </ThemedText>
          <ThemedText type="display" style={[styles.points, { color: theme.onBrand }]}>
            {summary.points.toLocaleString()}
          </ThemedText>
        </View>
        <IconBadge name="star" tone="card" size={52} />
      </Card>

      <StatRow
        stats={[
          { label: 'Events', value: String(summary.eventsAttended) },
          { label: 'Cities', value: String(summary.citiesVisited) },
          { label: 'Badges', value: `${summary.earned.length}/${badges.length}` },
        ]}
      />

      <SectionHeader title="Badges" />
      <View style={styles.grid}>
        {badges.map((badge) => (
          <BadgeCard key={badge.id} definition={badge} earned={earnedByBadge.get(badge.id)} />
        ))}
      </View>

      <SectionHeader title="Rewards" />
      <View style={styles.list}>
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

      <SectionHeader title="Leaderboard" />
      <LeaderboardList rows={leaderboard.rows} hidden={leaderboard.hidden} period={period} onChangePeriod={setPeriod} />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.four,
  },
  points: {
    fontSize: 80,
    lineHeight: 80,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + Spacing.one,
  },
  list: {
    gap: Spacing.two + Spacing.one,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  stateBody: {
    textAlign: 'center',
    maxWidth: 320,
  },
});
