import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';

import { badgeIcon } from '@/components/achievements/badgeIcons';
import LeaderboardList from '@/components/achievements/LeaderboardList';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Coin } from '@/components/ui/Coin';
import { Segmented } from '@/components/ui/Segmented';
import { TopBar } from '@/components/ui/TopBar';
import { PageInset } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSetLeaderboardVisible } from '@/hooks/useProfile';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import type { LeaderboardPeriod } from '@/types';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';
import { useRefreshControl } from '@/components/ui/LoadState';

/**
 * M-06 Achievements (the trophy in the top bar): every badge as a coin,
 * sage once earned and stone until then, with how far along you are; or
 * the leaderboard, this week's or all-time.
 */
export default function AchievementsScreen() {
  const theme = useTheme();
  const refreshControl = useRefreshControl();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { query, summary, progress } = useAchievements();
  const badges = query.data?.badges ?? [];
  const earned = new Map(summary.earned.map((badge) => [badge.badgeId, badge]));
  const [view, setView] = useState<'badges' | 'leaderboard'>('badges');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const leaderboard = useLeaderboard(period);
  const joinLeaderboard = useSetLeaderboardVisible();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TopBar
        title="Achievements"
        value={badges.length ? `${earned.size}/${badges.length}` : undefined}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(home)'))}
      />
      <View style={styles.switch}>
        <Segmented
          options={[
            { value: 'badges', label: 'Badges' },
            { value: 'leaderboard', label: 'Leaderboard' },
          ]}
          value={view}
          onChange={setView}
          accessibilityLabel="Show"
          look="tabs"
        />
      </View>
      {view === 'leaderboard' ? (
        <ScrollView
          tabIndex={0}
          aria-label="Leaderboard"
          contentContainerStyle={[styles.list, { paddingBottom: tabBarInset + 32 }]}
          refreshControl={refreshControl}
        >
          <LeaderboardList
            rows={leaderboard.rows}
            hidden={leaderboard.hidden}
            period={period}
            onChangePeriod={setPeriod}
            onJoin={() => joinLeaderboard.mutate(true)}
            joining={joinLeaderboard.isPending}
          />
        </ScrollView>
      ) : query.isPending ? (
        <ActivityIndicator accessibilityLabel="Loading" color={theme.text} style={styles.loader} />
      ) : query.isError ? (
        <View style={styles.message}>
          <ThemedText type="caption" themeColor="textSecondary">
            Couldn’t load your achievements.
          </ThemedText>
          <Button label="Try again" variant="ghost" size="small" onPress={() => query.refetch()} />
        </View>
      ) : (
        <ScrollView
          tabIndex={0}
          aria-label="Badges"
          contentContainerStyle={[styles.list, { paddingBottom: tabBarInset + 32 }]}
          refreshControl={refreshControl}
        >
          {badges.map((badge) => {
            const got = earned.get(badge.id);
            const step = progress[badge.key];
            const status = got
              ? `Earned ${formatInTimeZone(new Date(got.earnedAt), DISPLAY_TIME_ZONE, 'd MMM')}`
              : step
                ? `${step.current} of ${step.target}`
                : 'Not yet';
            return (
              <View
                key={badge.id}
                style={styles.row}
                accessible
                accessibilityLabel={`${badge.title}. ${badge.description}. ${status}.`}
              >
                <Coin icon={badgeIcon(badge.key)} earned={Boolean(got)} size={76} />
                {/* The badge's name first, what it takes under it, then how far you are. */}
                <View style={styles.texts}>
                  <ThemedText type="section">{badge.title}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {badge.description}
                  </ThemedText>
                  {!got && step ? (
                    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                      <View
                        style={[
                          styles.fill,
                          {
                            width: `${Math.min(100, (step.current / Math.max(1, step.target)) * 100)}%`,
                            backgroundColor: theme.primaryText,
                          },
                        ]}
                      />
                    </View>
                  ) : null}
                  <ThemedText type="captionBold" style={{ color: got ? theme.primaryText : theme.text }}>
                    {status}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  switch: {
    paddingHorizontal: PageInset,
    paddingBottom: 12,
  },
  loader: {
    marginVertical: 32,
  },
  message: {
    paddingHorizontal: PageInset,
    gap: 8,
  },
  list: {
    paddingHorizontal: PageInset,
    paddingTop: 6,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  texts: {
    flex: 1,
    gap: 4,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {
    height: '100%',
  },
});
