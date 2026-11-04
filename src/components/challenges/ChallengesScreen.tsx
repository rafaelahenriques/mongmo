import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';

import ChallengeList, { challengeLockedReason } from '@/components/challenges/ChallengeList';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { usePullToRefresh } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { PageInset } from '@/constants/theme';
import { useChallenges } from '@/hooks/useChallenges';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useEvent } from '@/hooks/useEvent';
import { useNow } from '@/hooks/useNow';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { getEventPhase } from '@/utils/dateTime';

/**
 * X-01 Challenge list: "CHALLENGES 1/5", the pop-up's name, the points
 * still to earn over a progress rule, and every challenge as a task card.
 */
export default function ChallengesScreen({ eventId }: { eventId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const refresh = usePullToRefresh();
  const query = useEvent(eventId);
  const event = query.data;
  const checkIn = useCheckIn(eventId);
  const { challenges, completedByChallenge } = useChallenges(eventId);
  const now = useNow();

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(popups)'));
  const done = challenges.filter((challenge) => completedByChallenge.has(challenge.id));
  const toEarn = challenges
    .filter((challenge) => !completedByChallenge.has(challenge.id))
    .reduce((sum, challenge) => sum + challenge.points, 0);
  const share = challenges.length ? done.length / challenges.length : 0;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TopBar
        title="Challenges"
        value={challenges.length ? `${done.length}/${challenges.length}` : undefined}
        onBack={back}
      />
      {!event ? (
        <View style={styles.state}>
          {query.isPending ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <>
              <ThemedText type="caption" themeColor="textSecondary">
                Couldn’t load this pop-up.
              </ThemedText>
              <Button label="Try again" variant="ghost" size="small" onPress={() => query.refetch()} />
            </>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
          refreshControl={<RefreshControl refreshing={refresh.refreshing} onRefresh={refresh.onRefresh} />}
        >
          <View style={styles.head}>
            <ThemedText type="subtitle" accessibilityRole="header">
              {event.title}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {challenges.length === 0
                ? 'No challenges on this pop-up.'
                : toEarn
                  ? `${toEarn} points still to earn`
                  : 'All done. Nice.'}
            </ThemedText>
            <View
              style={[styles.track, { backgroundColor: theme.backgroundSelected }]}
              accessible
              accessibilityLabel={`${done.length} of ${challenges.length} done`}
            >
              <View style={[styles.fill, { width: `${share * 100}%`, backgroundColor: theme.text }]} />
            </View>
          </View>
          <ChallengeList
            event={event}
            lockedReason={challengeLockedReason(
              getEventPhase(event.startsAt, event.endsAt, now),
              Boolean(checkIn.data),
              formatInTimeZone(event.startsAt, event.timeZone, "EEE d MMM 'at' HH:mm"),
            )}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  content: {
    paddingHorizontal: PageInset,
    gap: 16,
  },
  head: {
    gap: 4,
    paddingTop: 6,
  },
  track: {
    height: 3,
    marginTop: 8,
  },
  fill: {
    height: 3,
  },
});
