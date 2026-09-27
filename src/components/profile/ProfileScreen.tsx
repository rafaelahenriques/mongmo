import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Award, ChevronRight } from 'lucide-react-native';

import PhotoGallery from '@/components/profile/PhotoGallery';
import SettingsPanel from '@/components/profile/SettingsPanel';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useProfile } from '@/hooks/useProfile';
import { useVisitedEvents } from '@/hooks/useVisitedEvents';
import { useTheme } from '@/hooks/useTheme';
import { format as formatZoned } from 'date-fns-tz';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';

/**
 * Profile tab: identity card, quick stats, a jump into achievements, the
 * photo gallery of past check-ins, and settings (notifications, appearance,
 * privacy, log out).
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const { summary } = useAchievements();
  const visitedEvents = useVisitedEvents();

  const openAchievements = useCallback(() => {
    router.push('/(profile)/achievements');
  }, [router]);

  if (profile.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText type="small" themeColor="textSecondary">
          Loading your profile…
        </ThemedText>
      </View>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ThemedText type="smallBold">Couldn’t load your profile</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
          Your stats and settings are still available below once this loads — check your
          connection.
        </ThemedText>
        <Pressable
          onPress={() => profile.refetch()}
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

  const user = profile.data;
  const memberSince = formatZoned(new Date(user.memberSince), 'MMM yyyy', {
    timeZone: DISPLAY_TIME_ZONE,
  });

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.card, styles.identity, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
        <Image
          source={{ uri: user.avatarUrl }}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
          accessibilityRole="image"
          accessibilityLabel={`Profile photo of ${user.name}`}
        />
        <View style={styles.identityTexts}>
          <ThemedText type="subtitle" style={styles.name}>
            {user.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user.bio}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user.homeCity} · member since {memberSince}
          </ThemedText>
        </View>
      </View>

      <View style={styles.stats}>
        <StatTile label="Events" value={String(summary.eventsAttended)} caption="attended" />
        <StatTile label="Points" value={summary.points.toLocaleString()} caption="earned" />
        <StatTile
          label="Badges"
          value={String(summary.earned.length)}
          caption="unlocked"
        />
      </View>

      <Pressable
        onPress={openAchievements}
        accessibilityRole="button"
        accessibilityLabel="View your achievements and rewards"
        style={({ pressed }) => [
          styles.card,
          styles.achievementsCta,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Award size={20} color={theme.text} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <View style={styles.ctaTexts}>
          <ThemedText type="smallBold">Achievements</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Badges, streaks, rewards and the leaderboard
          </ThemedText>
        </View>
        <ChevronRight size={18} color={theme.textSecondary} />
      </Pressable>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Photos from events
      </ThemedText>
      <PhotoGallery checkIns={visitedEvents.data ?? []} />

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Settings
      </ThemedText>
      <SettingsPanel />
    </ScrollView>
  );
}

function StatTile({ label, value, caption }: { label: string; value: string; caption: string }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value} ${caption}`}
      style={[
        styles.statTile,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}
    >
      <ThemedText type="subtitle" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {caption}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  identityTexts: {
    flex: 1,
    gap: Spacing.half,
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statTile: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
  },
  achievementsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  ctaTexts: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
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
