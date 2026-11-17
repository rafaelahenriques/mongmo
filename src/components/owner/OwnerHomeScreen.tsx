import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ownerEventGroup } from '@/components/owner/ownerEventPhase';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { TaskCard } from '@/components/ui/TaskCard';
import { CardShadow, PageInset } from '@/constants/theme';
import { useOwnerEvents } from '@/hooks/useOwnerEvents';
import { useOwnerMenu } from '@/hooks/useOwnerMenu';
import { useOwnerOrders } from '@/hooks/useOwnerOrders';
import { useOfferedPhotos, useReportedPhotos } from '@/hooks/usePhotos';
import { useReportedProfilePhotos } from '@/hooks/useProfile';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { useRefreshControl } from '@/components/ui/LoadState';

/**
 * A-01 Today, the first tab of the owner's view: today's orders as three
 * big numbers (new ones are the loudest) and MANAGE ORDERS, then what else
 * there is to run, each card saying where it stands: pop-ups and the menu
 * (their own tabs), and members' photos: the ones shared for Photos of
 * the week, to pick from, and reported photos (Photos of the week, profile
 * photos) waiting for a decision.
 */
export default function OwnerHomeScreen() {
  const theme = useTheme();
  const refreshControl = useRefreshControl();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { orders } = useOwnerOrders();
  const eventsQuery = useOwnerEvents();
  const menu = useOwnerMenu();
  const offered = useOfferedPhotos();
  const reported = useReportedPhotos();
  const reportedProfiles = useReportedProfilePhotos();
  const toReview = (reported.data?.length ?? 0) + (reportedProfiles.data?.length ?? 0);
  const toPick = offered.data?.filter((photo) => !photo.showing).length ?? 0;
  const onHome = (offered.data?.length ?? 0) - toPick;
  const picks = !offered.data
    ? 'Pick what shows on Home'
    : `${toPick === 0 ? 'Nothing new to pick from' : `${toPick} to pick from`}, ${onHome} showing`;

  const counts = useMemo(
    () => ({
      new: orders.filter((order) => order.status === 'placed').length,
      preparing: orders.filter((order) => order.status === 'preparing').length,
      ready: orders.filter((order) => order.status === 'ready').length,
    }),
    [orders],
  );
  const menuLine = useMemo(() => {
    const items = menu.menus.flatMap((each) => each.items);
    if (!menu.query.data) return 'Items, prices and allergens';
    const off = items.filter((item) => !item.available).length;
    const unlisted = items.filter((item) => item.allergens === null).length;
    return [
      `${items.length} ${items.length === 1 ? 'item' : 'items'}`,
      off ? `${off} off the menu` : null,
      unlisted ? `${unlisted} without allergens` : null,
    ]
      .filter(Boolean)
      .join(', ');
  }, [menu.menus, menu.query.data]);
  const events = useMemo(() => {
    const groups = (eventsQuery.data ?? []).map((event) => ownerEventGroup(event));
    return {
      live: groups.filter((group) => group === 'live').length,
      upcoming: groups.filter((group) => group === 'upcoming').length,
    };
  }, [eventsQuery.data]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
      refreshControl={refreshControl}
    >
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}>
        <View
          style={styles.counts}
          accessible
          accessibilityLabel={`Orders: ${counts.new} new, ${counts.preparing} being made, ${counts.ready} ready`}
        >
          <Count value={counts.new} label="New" loud />
          <Count value={counts.preparing} label="Being made" />
          <Count value={counts.ready} label="Ready" />
        </View>
        <View style={styles.cardFoot}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.today}>
            Today
          </ThemedText>
          <BlockButton label="Manage orders" size="compact" onPress={() => router.navigate('/(orders)')} />
        </View>
      </View>

      <ThemedText type="subtitle" accessibilityRole="header">
        Pop-ups and menu
      </ThemedText>
      <TaskCard
        icon="calendar"
        title="Pop-ups"
        subtitle={`${events.live} live, ${events.upcoming} upcoming`}
        state="arrow"
        onPress={() => router.navigate('/(popups)')}
      />
      <TaskCard
        icon="food"
        title="Menu"
        subtitle={menuLine}
        state="arrow"
        onPress={() => router.navigate('/(wallet)')}
      />

      <ThemedText type="subtitle" accessibilityRole="header">
        Members’ photos
      </ThemedText>
      <TaskCard
        icon="star"
        title="Photos of the week"
        subtitle={picks}
        state="arrow"
        onPress={() => router.push('/(home)/owner/photos')}
      />
      <TaskCard
        icon="photo"
        title="Reported photos"
        subtitle={toReview === 0 ? 'Nothing to review' : `${toReview} to review`}
        state="arrow"
        onPress={() => router.push('/(home)/owner/reports')}
      />
    </ScrollView>
  );
}

/** A big number over its word; faded when there's nothing, ink when there is. */
function Count({ value, label, loud = false }: { value: number; label: string; loud?: boolean }) {
  const theme = useTheme();
  const color = value > 0 || loud ? theme.text : theme.faded;
  return (
    <View style={styles.count}>
      <ThemedText type="display" style={[styles.number, { color }]}>
        {value}
      </ThemedText>
      <ThemedText type="caption" style={{ color: value > 0 || loud ? theme.text : theme.textSecondary }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    gap: 12,
  },
  card: {
    marginBottom: 12,
  },
  counts: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  count: {
    flex: 1,
  },
  number: {
    fontSize: 48,
    lineHeight: 52,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  today: {
    paddingLeft: 16,
  },
});
