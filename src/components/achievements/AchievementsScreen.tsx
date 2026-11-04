import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';

import { badgeIcon } from '@/components/achievements/badgeIcons';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Coin } from '@/components/ui/Coin';
import { TopBar } from '@/components/ui/TopBar';
import { PageInset } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';

/**
 * M-06 Achievements (the trophy in the top bar): every badge as a coin,
 * sage once earned and stone until then, with how far along you are.
 */
export default function AchievementsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { query, summary, progress } = useAchievements();
  const badges = query.data?.badges ?? [];
  const earned = new Map(summary.earned.map((badge) => [badge.badgeId, badge]));

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TopBar
        title="Achievements"
        value={badges.length ? `${earned.size}/${badges.length}` : undefined}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(home)'))}
      />
      {query.isPending ? (
        <ActivityIndicator color={theme.text} style={styles.loader} />
      ) : query.isError ? (
        <View style={styles.message}>
          <ThemedText type="caption" themeColor="textSecondary">
            Couldn’t load your achievements.
          </ThemedText>
          <Button label="Try again" variant="ghost" size="small" onPress={() => query.refetch()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: tabBarInset + 32 }]}>
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
                <View style={styles.texts}>
                  <ThemedText type="section" themeColor={got ? 'text' : 'textSecondary'}>
                    {status}
                  </ThemedText>
                  <ThemedText type="card">{badge.title}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {badge.description}
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
    gap: 1,
  },
});
