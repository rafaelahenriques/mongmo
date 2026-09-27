import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';

import { Avatar } from '@/components/profile/Avatar';
import PhotoGallery from '@/components/profile/PhotoGallery';
import SettingsPanel from '@/components/profile/SettingsPanel';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { IconBadge } from '@/components/ui/IconBadge';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenScroll, SectionHeader } from '@/components/ui/Screen';
import { StatRow } from '@/components/ui/StatRow';
import { Spacing } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useMyPhotos } from '@/hooks/usePhotos';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { confirmLogOut } from '@/services/auth';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';

/**
 * Profile tab: who you are, your numbers, a jump into achievements (and
 * owner tools for owners), the photo gallery of past check-ins, and
 * settings (notifications, appearance, privacy, log out).
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const { summary } = useAchievements();
  const photos = useMyPhotos();

  const openAchievements = useCallback(() => router.push('/(profile)/achievements'), [router]);
  const openOwnerTools = useCallback(() => router.push('/(profile)/owner'), [router]);

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
        <IconBadge name="alert" size={56} />
        <ThemedText type="section">Couldn’t load your profile</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
          {/* The raw server message (e.g. "permission denied for table
              profiles") is what makes a backend setup problem fixable, but
              it's not for customers' eyes. */}
          {__DEV__ && profile.error ? profile.error.message : 'Check your connection and try again.'}
        </ThemedText>
        <Button label="Try again" variant="primary" size="medium" onPress={() => profile.refetch()} />
        {/* Settings (and its Log out) live below the profile card, so without
            this a failed load would leave no way to sign out at all. */}
        <Button label="Log out" variant="ghost" size="medium" onPress={confirmLogOut} />
      </View>
    );
  }

  const user = profile.data;
  const memberSince = formatInTimeZone(new Date(user.memberSince), DISPLAY_TIME_ZONE, 'MMM yyyy');

  return (
    <ScreenScroll topInset>
      <View style={styles.identity}>
        <Avatar name={user.name} url={user.avatarUrl} />
        <View style={styles.identityTexts}>
          <ThemedText type="title" numberOfLines={2} accessibilityRole="header">
            {user.name}
          </ThemedText>
          {user.bio ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {user.bio}
            </ThemedText>
          ) : null}
        </View>
        <IconButton
          icon="edit"
          tone="card"
          size={40}
          onPress={() => router.push('/(profile)/edit')}
          accessibilityLabel="Edit profile"
        />
      </View>
      <View style={styles.chips}>
        {user.homeCity ? <Chip label={user.homeCity} icon="pin" /> : null}
        <Chip label={`Since ${memberSince}`} icon="calendar" />
        {user.role === 'owner' ? <Chip label="Owner" tone="dark" icon="store" /> : null}
      </View>

      <StatRow
        stats={[
          { label: 'Events', value: String(summary.eventsAttended), caption: 'attended' },
          { label: 'Points', value: summary.points.toLocaleString(), caption: 'earned', emphasis: true },
          { label: 'Badges', value: String(summary.earned.length), caption: 'unlocked' },
        ]}
      />

      <Card style={styles.links}>
        <ListRow
          title="Achievements"
          subtitle="Badges, rewards and the leaderboard"
          icon="trophy"
          iconTone="accent"
          onPress={openAchievements}
          accessibilityLabel="View your achievements and rewards"
        />
        {user.role === 'owner' ? (
          <>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ListRow
              title="Owner tools"
              subtitle="Pop-ups, challenges, menus and orders"
              icon="store"
              iconTone="primary"
              onPress={openOwnerTools}
              accessibilityLabel="Owner tools: manage events, challenges and orders"
            />
          </>
        ) : null}
      </Card>

      <SectionHeader title="Your photos" />
      <PhotoGallery
        photos={photos.data ?? []}
        emptyText="Photos you take for challenges show up here. Check in at a pop-up and try a photo challenge."
      />

      <SectionHeader title="Settings" />
      <SettingsPanel />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  identityTexts: {
    flex: 1,
    gap: Spacing.one,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
  },
  links: {
    paddingVertical: Spacing.two,
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 40 + Spacing.three,
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
