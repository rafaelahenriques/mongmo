import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Award, ChevronRight, Store } from 'lucide-react-native';

import PhotoGallery from '@/components/profile/PhotoGallery';
import SettingsPanel from '@/components/profile/SettingsPanel';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useProfile } from '@/hooks/useProfile';
import { useVisitedEvents } from '@/hooks/useVisitedEvents';
import { useTheme } from '@/hooks/useTheme';
import { confirmLogOut } from '@/services/auth';
import { formatInTimeZone } from 'date-fns-tz';
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

  const openOwnerTools = useCallback(() => {
    router.push('/(profile)/owner');
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
          {/* The raw server message (e.g. "permission denied for table
              profiles") is what makes a backend setup problem fixable, but
              it's not for customers' eyes. */}
          {__DEV__ && profile.error
            ? profile.error.message
            : 'Check your connection and try again.'}
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
        {/* Settings (and its Log out) live below the profile card, so without
            this a failed load would leave no way to sign out at all. */}
        <Pressable
          onPress={confirmLogOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={({ pressed }) => [styles.retry, { opacity: pressed ? 0.7 : 1 }]}
        >
          <ThemedText type="smallBold" themeColor="textSecondary">
            Log out
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  const user = profile.data;
  const memberSince = formatInTimeZone(new Date(user.memberSince), DISPLAY_TIME_ZONE, 'MMM yyyy');

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
            {[user.homeCity, `member since ${memberSince}`].filter(Boolean).join(' · ')}
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

      {user.role === 'owner' ? (
        <Pressable
          onPress={openOwnerTools}
          accessibilityRole="button"
          accessibilityLabel="Owner tools: manage events, challenges and orders"
          style={({ pressed }) => [
            styles.card,
            styles.achievementsCta,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Store size={20} color={theme.text} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          <View style={styles.ctaTexts}>
            <ThemedText type="smallBold">Owner tools</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Manage events, challenges, menus and orders
            </ThemedText>
          </View>
          <ChevronRight size={18} color={theme.textSecondary} />
        </Pressable>
      ) : null}

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
