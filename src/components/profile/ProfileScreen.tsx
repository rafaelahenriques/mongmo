import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';

import { GuestLock } from '@/components/guest/GuestLock';
import { JOIN } from '@/components/guest/joinCopy';
import { Avatar } from '@/components/profile/Avatar';
import PhotoGallery from '@/components/profile/PhotoGallery';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenScroll } from '@/components/ui/Screen';
import { Chapter } from '@/components/ui/Chapter';
import { TopBar } from '@/components/ui/TopBar';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useIsGuest } from '@/hooks/useIsGuest';
import { useMyOrders } from '@/hooks/useMyOrders';
import { useMyPhotos } from '@/hooks/usePhotos';
import { useProfile } from '@/hooks/useProfile';
import { useOwnerView } from '@/hooks/useOwnerView';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/state/settingsStore';
import { confirmLogOut } from '@/services/auth';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';

/**
 * Account (from the person in the top bar): who you are, then
 * achievements, your orders, owner tools for owners, edit profile and
 * settings, and the photos you took for challenges.
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const email = useAuthUser().data?.email;
  const achievements = useAchievements();
  const { summary } = achievements;
  const orders = useMyOrders();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(home)'));
  const photos = useMyPhotos();
  const guest = useIsGuest();

  const openAchievements = useCallback(() => router.push('/(achievements)/achievements'), [router]);
  const ownerView = useOwnerView();
  const setCustomerView = useSettingsStore((state) => state.setCustomerView);
  /**
   * Staff: to the customer's view of the app, or back to the owner's. The
   * tab bar takes it from there (IconNav): the other view opens on its
   * first tab.
   */
  const switchView = useCallback(() => setCustomerView(ownerView), [ownerView, setCustomerView]);

  if (profile.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator accessibilityLabel="Loading" size="large" color={theme.text} />
        <ThemedText type="caption" themeColor="textSecondary">
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
        <ThemedText type="caption" themeColor="textSecondary" style={styles.stateBody}>
          {/* The raw server message (e.g. "permission denied for table
              profiles") is what makes a backend setup problem fixable, but
              it's not for customers' eyes. */}
          {__DEV__ && profile.error ? profile.error.message : 'Check your connection and try again.'}
        </ThemedText>
        <Button label="Try again" variant="primary" size="medium" onPress={() => profile.refetch()} />
        {/* Settings (and its Log out) live below the profile card, so without
            this a failed load would leave no way to sign out at all. */}
        <Button label="Log out" variant="ghost" size="medium" onPress={() => void confirmLogOut(guest)} />
      </View>
    );
  }

  const user = profile.data;
  const memberSince = formatInTimeZone(new Date(user.memberSince), DISPLAY_TIME_ZONE, 'MMM yyyy');
  const badgeCount = achievements.query.data?.badges.length ?? 0;
  const current = (orders.data ?? []).filter((order) => ['placed', 'preparing', 'ready'].includes(order.status));

  const identity = (
    <View style={[styles.identity, { backgroundColor: theme.backgroundSelected }]}>
      <Avatar name={user.name} url={user.avatarUrl} cacheKey={user.avatarPath} />
      <View style={styles.identityTexts}>
        <ThemedText type="title" numberOfLines={2} accessibilityRole="header">
          {user.name}
        </ThemedText>
        {email ? (
          <ThemedText type="captionBold" numberOfLines={1} selectable>
            {email}
          </ThemedText>
        ) : null}
        <ThemedText type="caption" themeColor="textSecondary">
          {[user.homeCity, `Since ${memberSince}`, user.role === 'owner' ? 'Owner' : null].filter(Boolean).join(' · ')}
        </ThemedText>
      </View>
    </View>
  );
  const settings = <ListRow title="Settings" onPress={() => router.push('/(profile)/settings')} last />;

  // A guest sees their account dimmed, under a card to make one; Settings
  // (appearance, alerts, the legal pages, log out) still works.
  if (guest) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <TopBar title="Account" onBack={back} />
        <ScreenScroll>
          <GuestLock inline {...JOIN.account}>
            <View style={styles.preview}>
              {identity}
              <View style={[styles.card, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}>
                <ListRow title="Achievements" onPress={openAchievements} />
                <ListRow title="My orders" onPress={() => router.push('/(profile)/orders')} />
                <ListRow title="Edit profile" onPress={() => router.push('/(profile)/edit')} last />
              </View>
            </View>
          </GuestLock>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}>
            {settings}
          </View>
        </ScreenScroll>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TopBar title="Account" onBack={back} />
      <ScreenScroll>
        {identity}

        <View style={[styles.card, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}>
          <ListRow
            title="Achievements"
            value={badgeCount ? `${summary.earned.length} of ${badgeCount}` : undefined}
            onPress={openAchievements}
          />
          <ListRow
            title="My orders"
            value={current.length ? `${current.length} on the way` : undefined}
            onPress={() => router.push('/(profile)/orders')}
          />
          {user.role === 'owner' ? (
            ownerView ? (
              <ListRow title="Customer view" subtitle="See the app the way customers do" onPress={switchView} />
            ) : (
              <ListRow title="Owner view" subtitle="Orders, pop-ups, the menu and photos" onPress={switchView} />
            )
          ) : null}
          <ListRow title="Edit profile" onPress={() => router.push('/(profile)/edit')} />
          {settings}
        </View>

        <Chapter title="Your photos" />
        <PhotoGallery
          own
          photos={photos.data ?? []}
          emptyText="Photos you take for challenges show up here. Check in at a pop-up and try a photo challenge."
        />
      </ScreenScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  // You, on a soft stone card: the photo or initial, name, email, since when.
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: 20,
    borderRadius: Radius.tile,
  },
  // The menu rows on one rounded white card, like Settings.
  card: {
    borderRadius: Radius.card,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  preview: {
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
