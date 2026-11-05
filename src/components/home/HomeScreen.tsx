import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { formatInTimeZone } from 'date-fns-tz';

import type { OrderMenuItem } from '@/api/orders';
import { shortName } from '@/components/achievements/LeaderboardList';
import { ThemedText } from '@/components/ThemedText';
import { AppHeader } from '@/components/ui/AppHeader';
import Chip from '@/components/ui/Chip';
import { Icon, type IconName } from '@/components/ui/Icon';
import { usePullToRefresh } from '@/components/ui/Screen';
import { StampRow } from '@/components/ui/Stamps';
import { StepBar } from '@/components/ui/StepBar';
import { productPhoto } from '@/constants/productPhotos';
import { CardShadow, PageInset } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useActiveOrder } from '@/hooks/useActiveOrder';
import { useEvents } from '@/hooks/useEvents';
import { useLevel } from '@/hooks/useLevel';
import { useMenu } from '@/hooks/useMenu';
import { useNotificationsFeed } from '@/hooks/useNotificationsFeed';
import { useProfile } from '@/hooks/useProfile';
import { useStore } from '@/hooks/useStore';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { switchPickup } from '@/services/switchPickup';
import { useCartStore, type CartLocation } from '@/state/cartStore';
import { useLocationStore } from '@/state/locationStore';
import { useSettingsStore } from '@/state/settingsStore';
import { formatEventWindow, getEventPhase } from '@/utils/dateTime';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { ORDER_STEP, ORDER_STEPS, ORDER_STATUS_TITLE, pickupCode, shortItemName } from '@/utils/orderFormat';
import { featuredPopUps } from '@/utils/popUps';
import { bestClaimableReward, nextReward } from '@/utils/rewards';
import { stampCard } from '@/utils/stamps';
import type { PopUpEvent } from '@/types';

/**
 * H-01 Home, laid out like a magazine (after Joe & The Juice's home): your
 * points big on sage with the stamp line under them, a hello and the way
 * to order, then cards: a reward to claim, your order, the pop-up that's on,
 * a few things from the menu, and the pop-ups coming up. Each card has one
 * action, an uppercase link with an arrow.
 */
export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const refresh = usePullToRefresh();
  const profile = useProfile();
  const store = useStore();
  const eventsQuery = useEvents('all');
  const activeOrder = useActiveOrder();
  const { query: achievements, summary } = useAchievements();
  const feed = useNotificationsFeed();
  const coordinates = useLocationStore((state) => state.coordinates);
  const cartLocation = useCartStore((state) => state.location);
  const tabBarInset = useTabBarInset();

  // The menu shown on Home: where you're ordering from, else the café's.
  const menuLocation: CartLocation | null =
    cartLocation ?? (store.data ? { type: 'store', storeId: store.data.id } : null);
  const menu = useMenu(menuLocation);

  const { featured, upcoming } = useMemo(
    () => featuredPopUps(eventsQuery.data ?? [], coordinates),
    [eventsQuery.data, coordinates],
  );

  const level = useLevel();
  const levelSeen = useSettingsStore((state) => state.levelSeen);
  const markLevelSeen = useSettingsStore((state) => state.markLevelSeen);
  // A level you've just reached gets one welcome card (Dough is where everyone starts).
  const newLevel = level.current.minPoints > 0 && levelSeen !== level.current.key ? level.current : null;
  const rewards = achievements.data?.rewards ?? [];
  const goal = nextReward(rewards, summary.points, level.unlocked);
  // The best reward your points already cover: worth a card of its own.
  const claimable = bestClaimableReward(rewards, summary.points, level.unlocked);
  const stamps = stampCard(summary.points, goal);

  // Three things to start an order with, each with its own photo.
  const picks = useMemo(() => menuPicks(menu.data ?? []), [menu.data]);

  // "rafaela.henriques" (a name made from an email) greets as "Rafaela".
  const firstName = profile.data?.name ? shortName(profile.data.name).split(' ')[0] : '';
  const order = activeOrder.data;
  const openEvent = (id: string) => router.push({ pathname: '/(popups)/event/[id]', params: { id } });
  const openOrder = () => router.navigate('/(orders)');
  const openItem = (id: string) => {
    // The item page shows the menu of where you're picking up: the café's
    // when nothing's chosen yet (an empty cart, so nothing to lose).
    if (!cartLocation && menuLocation) useCartStore.getState().setLocation(menuLocation);
    router.push({ pathname: '/(orders)/order/item/[id]', params: { id } });
  };
  const orderAt = async (event: PopUpEvent) => {
    if (await switchPickup({ type: 'event', eventId: event.id, eventTitle: event.title })) openOrder();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader title="Home" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: tabBarInset + 32 }}
        refreshControl={<RefreshControl refreshing={refresh.refreshing} onRefresh={refresh.onRefresh} />}
      >
        {/* Your points: the number big on sage, the next reward beside it, the stamps under. */}
        <Pressable
          onPress={() => router.navigate('/(wallet)')}
          accessibilityRole="button"
          accessibilityLabel={`${summary.points} points, ${level.current.name} level. ${
            goal ? `${goal.costPoints - summary.points} more to ${goal.title}.` : ''
          } Open Wallet.`}
          style={styles.hero}
        >
          <View style={[styles.heroBlock, { backgroundColor: theme.brandFill }]}>
            <ThemedText
              type="display"
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.heroNumber, { color: theme.onBrand }]}
            >
              {summary.points}
            </ThemedText>
            {/* The level under the number, like a membership tier. */}
            <ThemedText type="title" numberOfLines={1} style={{ color: theme.onBrandSoft }}>
              {level.current.name}
            </ThemedText>
          </View>
          <View style={styles.heroSide}>
            <ThemedText type="label" themeColor="textSecondary">
              {goal ? 'NEXT REWARD' : 'REWARDS'}
            </ThemedText>
            <ThemedText type="section" numberOfLines={3}>
              {goal ? goal.title : 'Your points cover one'}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {goal ? `${goal.costPoints - summary.points} points to go` : 'Redeem it in Wallet'}
            </ThemedText>
          </View>
        </Pressable>
        <View style={styles.page}>
          <StampRow earned={stamps.earned} total={stamps.total} partial={stamps.partial} />

          {/* Hello, and the one big way in: order. */}
          <View style={styles.helloRow}>
            <View style={styles.flex}>
              <ThemedText type="item" accessibilityRole="header">
                {firstName ? `HEY ${firstName.toUpperCase()}!` : 'HEY THERE!'}
              </ThemedText>
              <Pressable
                onPress={() => router.push('/(home)/notifications')}
                accessibilityRole="button"
                accessibilityLabel={`Notifications${feed.unseen ? `, ${feed.unseen} new` : ''}`}
                style={styles.target}
              >
                <ThemedText type="caption" themeColor="textSecondary">
                  {feed.unseen ? `${feed.unseen} new for you` : 'Bánh mì, pop-ups and good company.'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
          <View style={styles.orderRow}>
            <Pressable
              onPress={() => router.push('/(wallet)/card')}
              accessibilityRole="button"
              accessibilityLabel="Show my membership QR code"
              style={({ pressed }) => [
                styles.square,
                { backgroundColor: theme.surfaceDark, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Icon name="qrcode" size={26} color={theme.onSurfaceDark} />
            </Pressable>
            <Pressable
              onPress={() => {
                haptics.tap();
                openOrder();
              }}
              accessibilityRole="button"
              accessibilityLabel="Order"
              // One sage block, the word on it: the block says "tap me", no
              // arrow or icon needed on top.
              style={({ pressed }) => [
                styles.orderBlock,
                { backgroundColor: theme.brandFill, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <ThemedText type="item" style={{ color: theme.onBrand }}>
                ORDER
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.cards}>
          {newLevel ? (
            <Card
              tone="brand"
              title={`WELCOME TO ${newLevel.name.toUpperCase()}!`}
              icon="trophy"
              body={`You've reached a new level: ${newLevel.perk.charAt(0).toLowerCase()}${newLevel.perk.slice(1)}.`}
              link="SEE LEVELS"
              onPress={() => {
                markLevelSeen(newLevel.key);
                router.push('/(wallet)/levels');
              }}
            />
          ) : null}

          {claimable ? (
            <Card
              tone="brand"
              title="YOU CAN CLAIM A REWARD"
              icon="gift"
              body={`Your points cover: ${claimable.title}. Redeem it in Wallet.`}
              link="CLAIM"
              onPress={() => router.navigate('/(wallet)')}
            />
          ) : null}

          {order ? (
            <Card
              title={ORDER_STATUS_TITLE[order.status].toUpperCase()}
              eyebrow="YOUR ORDER"
              body={`${pickupCode(order.id)}${
                order.pickup_at ? ` · Pick up at ${new Date(order.pickup_at).toTimeString().slice(0, 5)}` : ''
              }`}
              link="VIEW ORDER"
              onPress={() => router.push({ pathname: '/(orders)/order/status/[id]', params: { id: order.id } })}
            >
              <StepBar steps={ORDER_STEPS} reached={ORDER_STEP[order.status] ?? 0} />
            </Card>
          ) : null}

          {featured ? (
            <PopUpCard
              event={featured}
              distance={coordinates ? formatDistance(distanceInMeters(coordinates, featured.coordinates)) : null}
              onCheckIn={() => router.push({ pathname: '/(popups)/check-in/[id]', params: { id: featured.id } })}
              onOpen={() => openEvent(featured.id)}
              onOrder={() => orderAt(featured)}
            />
          ) : null}
        </View>

        {picks.length ? (
          <View style={styles.section}>
            <SectionHead title="Hungry? Start here" link="MENU" onPress={openOrder} />
            <View style={styles.tiles}>
              {picks.map(({ item, photo }) => (
                <Pressable
                  key={item.id}
                  onPress={() => openItem(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  style={({ pressed }) => [
                    styles.tile,
                    { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Image
                    accessible={false}
                    accessibilityLabel=""
                    source={photo}
                    style={styles.tilePhoto}
                    contentFit="cover"
                  />
                  {/* The section in caps ("BÁNH MÌ"), the filling under it. */}
                  <View style={styles.tileName}>
                    <ThemedText type="label" numberOfLines={1} style={styles.tileSection}>
                      {item.category ?? item.name}
                    </ThemedText>
                    {item.category ? (
                      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
                        {shortItemName(item.name, item.category)}
                      </ThemedText>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHead
            title={upcoming.length ? 'Pop-ups coming up' : 'Nothing else planned yet'}
            link="SEE ALL"
            onPress={() => router.navigate('/(popups)')}
          />
          {upcoming.map((event) => (
            <PopUpRow key={event.id} event={event} onPress={() => openEvent(event.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/** A section's title, with its one link at the right ("MENU", "SEE ALL"). */
function SectionHead({ title, link, onPress }: { title: string; link: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHead}>
      <ThemedText type="section" accessibilityRole="header" style={styles.flex}>
        {title}
      </ThemedText>
      <Pressable onPress={onPress} accessibilityRole="link" hitSlop={10} style={styles.target}>
        <ThemedText type="label" style={{ color: theme.primaryText }}>
          {link}
        </ThemedText>
      </Pressable>
    </View>
  );
}

/**
 * A card with one job: an uppercase headline, a line or two, and its link
 * with an arrow at the bottom right. `brand` puts the headline on sage.
 */
function Card({
  title,
  eyebrow,
  icon,
  body,
  link,
  onPress,
  tone = 'plain',
  children,
}: {
  title: string;
  eyebrow?: string;
  icon?: IconName;
  body: string;
  link: string;
  onPress: () => void;
  tone?: 'plain' | 'brand';
  children?: ReactNode;
}) {
  const theme = useTheme();
  const brand = tone === 'brand';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${eyebrow ? `${eyebrow}: ` : ''}${title}. ${body}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.cardTop, brand && { backgroundColor: theme.brandFill }]}>
        <View style={styles.flex}>
          {eyebrow ? (
            <ThemedText type="label" themeColor="textSecondary">
              {eyebrow}
            </ThemedText>
          ) : null}
          <ThemedText type="item" style={{ color: brand ? theme.onBrand : theme.text }}>
            {title}
          </ThemedText>
        </View>
        {icon ? <Icon name={icon} size={40} color={brand ? theme.onBrand : theme.text} /> : null}
      </View>
      <View style={styles.cardBody}>
        {children}
        <ThemedText type="small" themeColor="textSecondary">
          {body}
        </ThemedText>
        <View style={styles.cardLink}>
          <ThemedText type="label">{link}</ThemedText>
          <Icon name="arrowRight" size={16} color={theme.text} weight="bold" />
        </View>
      </View>
    </Pressable>
  );
}

/**
 * The pop-up that's on (or next): its photo with the name across it, when
 * and where under it, and one link: check in when it's live, details before.
 */
function PopUpCard({
  event,
  distance,
  onCheckIn,
  onOpen,
  onOrder,
}: {
  event: PopUpEvent;
  distance: string | null;
  onCheckIn: () => void;
  onOpen: () => void;
  onOrder: () => void;
}) {
  const theme = useTheme();
  const live = getEventPhase(event.startsAt, event.endsAt) === 'live';
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${live ? 'Live now: ' : 'Coming up: '}${event.title}. Open the pop-up.`}
        style={[styles.popPhoto, { backgroundColor: theme.surfaceDark }]}
      >
        {event.imageUrl ? (
          <Image
            accessible={false}
            accessibilityLabel=""
            source={{ uri: event.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : null}
        <View style={styles.popShade} />
        {live ? <Chip label="Live now" tone="live" /> : null}
        <ThemedText type="item" numberOfLines={2} style={{ color: theme.onSurfaceDark }}>
          {event.title.toUpperCase()}
        </ThemedText>
      </Pressable>
      <View style={styles.cardBody}>
        <ThemedText type="smallBold">{event.venue}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {[formatEventWindow(event.startsAt, event.endsAt, event.timeZone), distance].filter(Boolean).join(' · ')}
        </ThemedText>
        <View style={styles.cardFoot}>
          {/* Ordering here is the second thing: a quieter link on the left. */}
          <Pressable onPress={onOrder} accessibilityRole="button" hitSlop={8} style={styles.target}>
            <ThemedText type="label" themeColor="textSecondary">
              {live ? 'ORDER HERE' : 'ORDER AHEAD'}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={live ? onCheckIn : onOpen}
            accessibilityRole="button"
            hitSlop={8}
            style={[styles.cardLink, styles.target]}
          >
            <ThemedText type="label">{live ? 'CHECK IN' : 'DETAILS'}</ThemedText>
            <Icon name="arrowRight" size={16} color={theme.text} weight="bold" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** A pop-up coming up: its photo, name, when and where, and a sage square to open it. */
function PopUpRow({ event, onPress }: { event: PopUpEvent; onPress: () => void }) {
  const theme = useTheme();
  const start = new Date(event.startsAt);
  const when = `${formatInTimeZone(start, event.timeZone, 'EEE d MMM, HH:mm')} · ${event.city}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${when}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.rowPhoto, { backgroundColor: theme.backgroundSelected }]}>
        {event.imageUrl ? (
          <Image
            accessible={false}
            accessibilityLabel=""
            source={{ uri: event.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View style={styles.rowTexts}>
        <ThemedText type="card" numberOfLines={2}>
          {event.title}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
          {when}
        </ThemedText>
      </View>
      <View style={[styles.rowGo, { backgroundColor: theme.brandFill }]}>
        <Icon name="chevronRight" size={18} color={theme.onBrand} weight="bold" />
      </View>
    </Pressable>
  );
}

type Photo = NonNullable<ReturnType<typeof productPhoto>>;

/** A few things to start an order with: main items, not options, each with a photo no other pick has. */
function menuPicks(items: OrderMenuItem[], count = 3): { item: OrderMenuItem; photo: Photo }[] {
  const seen = new Set<Photo>();
  const picks: { item: OrderMenuItem; photo: Photo }[] = [];
  for (const item of items) {
    const photo = productPhoto(item);
    if (item.addOnFor || !photo || seen.has(photo)) continue;
    seen.add(photo);
    picks.push({ item, photo });
    if (picks.length === count) break;
  }
  return picks;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  /** A text-only control, 44pt tall so it's easy to hit. */
  target: {
    minHeight: 44,
    justifyContent: 'center',
  },
  page: {
    paddingHorizontal: PageInset,
  },
  hero: {
    flexDirection: 'row',
    minHeight: 190,
    marginBottom: 14,
  },
  heroBlock: {
    width: '56%',
    minHeight: 190,
    paddingHorizontal: PageInset,
    paddingTop: 18,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  heroNumber: {
    fontSize: 64,
    // Never below the font size: iOS cuts the top off the glyphs.
    lineHeight: 68,
  },
  heroSide: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 4,
  },
  helloRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  orderBlock: {
    flex: 1,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  square: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cards: {
    paddingHorizontal: PageInset,
    gap: 16,
  },
  card: {
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  cardBody: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 6,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    columnGap: 12,
  },
  cardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    minHeight: 44,
  },
  popPhoto: {
    minHeight: 180,
    padding: 18,
    gap: 8,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  popShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26, 26, 23, 0.35)',
  },
  section: {
    paddingHorizontal: PageInset,
    paddingTop: 28,
    gap: 10,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    minWidth: 0,
  },
  tilePhoto: {
    aspectRatio: 1,
  },
  tileName: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2,
  },
  // Small enough that "SPRINGROLLS" fits a third of a phone.
  tileSection: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 12,
    minHeight: 84,
  },
  rowPhoto: {
    width: 84,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  rowTexts: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    gap: 2,
  },
  rowGo: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
