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
import { CardShadow, PageInset, Radius } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSetLeaderboardVisible } from '@/hooks/useProfile';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import type { LeaderboardPeriod } from '@/types';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';
import { useRefreshControl } from '@/components/ui/LoadState';

/**
 * M-06 Achievements (the trophy in the top bar): a sage card with how many
 * badges you have and the next one to get, then every badge as a tile (white
 * once earned, stone until then, with how far along you are); or the
 * leaderboard, this week's or all-time.
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
  // The badge you're closest to: the highest share done of those not yet earned.
  const next = badges
    .filter((badge) => !earned.has(badge.id) && progress[badge.key])
    .map((badge) => ({ badge, step: progress[badge.key]! }))
    .sort((a, b) => b.step.current / Math.max(1, b.step.target) - a.step.current / Math.max(1, a.step.target))[0];

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
          {/* How far you are: badges earned out of all, and the closest one to get. */}
          <View
            style={[styles.hero, { backgroundColor: theme.brandFill }]}
            accessible
            accessibilityLabel={`${earned.size} of ${badges.length} badges earned.${
              next ? ` Next: ${next.badge.title}, ${next.step.current} of ${next.step.target}.` : ''
            }`}
          >
            <ThemedText type="label" style={{ color: theme.onBrand }}>
              Badges
            </ThemedText>
            <View style={styles.heroNumber}>
              <ThemedText type="display" style={[styles.heroCount, { color: theme.onBrand }]}>
                {earned.size}
              </ThemedText>
              <ThemedText type="title" style={{ color: theme.onBrandSoft }}>
                {`of ${badges.length}`}
              </ThemedText>
            </View>
            <View style={[styles.heroTrack, { backgroundColor: theme.onBrandSoft + '40' }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${badges.length ? (earned.size / badges.length) * 100 : 0}%`,
                    backgroundColor: theme.onBrand,
                  },
                ]}
              />
            </View>
            {next ? (
              <ThemedText type="small" style={{ color: theme.onBrand }}>
                {`Next: ${next.badge.title} · ${next.step.current} of ${next.step.target}`}
              </ThemedText>
            ) : null}
          </View>

          {/* Every badge as a tile, two to a row: white once earned, stone until then. */}
          <View style={styles.grid}>
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
                  style={[
                    styles.tile,
                    got
                      ? { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }
                      : { backgroundColor: theme.backgroundSelected },
                  ]}
                  accessible
                  accessibilityLabel={`${badge.title}. ${badge.description}. ${status}.`}
                >
                  <Coin icon={badgeIcon(badge.key)} earned={Boolean(got)} size={56} />
                  <ThemedText type="card">{badge.title}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary" style={styles.tileText}>
                    {badge.description}
                  </ThemedText>
                  {!got && step ? (
                    <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
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
              );
            })}
          </View>
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
  hero: {
    borderRadius: Radius.tile,
    padding: 20,
    gap: 8,
  },
  heroNumber: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  heroCount: {
    fontSize: 64,
    lineHeight: 70,
  },
  heroTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  // Two tiles a row on a phone; one a row when large text needs the width.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    flexGrow: 1,
    flexBasis: 150,
    borderRadius: Radius.card,
    padding: 14,
    gap: 6,
  },
  tileText: {
    flexGrow: 1,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
