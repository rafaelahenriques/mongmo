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
import { ripple } from '@/components/ui/ripple';
import { StampRow } from '@/components/ui/Stamps';
import { StepBar } from '@/components/ui/StepBar';
import { productPhoto, sectionPhoto } from '@/constants/productPhotos';
import { levelSticker, rewardSticker, Stickers, type StickerName } from '@/constants/stickers';
import { CardShadow, PageInset, Radius } from '@/constants/theme';
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
import { nameFromContent } from '@/utils/a11y';
import { formatEventWindow, getEventPhase } from '@/utils/dateTime';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { ORDER_STEP, ORDER_STEPS, ORDER_STATUS_TITLE, pickupCode, shortItemName } from '@/utils/orderFormat';
import { featuredPopUps } from '@/utils/popUps';
import { bestClaimableReward, nextReward } from '@/utils/rewards';
import { stampCard } from '@/utils/stamps';
import type { PopUpEvent } from '@/types';
import { popUpImage } from '@/constants/brandPhotos';
import PhotosOfTheWeek from '@/components/home/PhotosOfTheWeek';
import { ErrorState } from '@/components/ui/LoadState';
import { Sticker } from '@/components/ui/Sticker';

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
        {/* Hello, by name, and what's new. */}
        <View style={styles.hello}>
          <ThemedText type="title" accessibilityRole="header">
            {firstName ? `Hey ${firstName}` : 'Hey there'}
          </ThemedText>
          <Pressable
            onPress={() => router.push('/(home)/notifications')}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${feed.unseen ? `, ${feed.unseen} new` : ''}`}
            style={styles.target}
          >
            <ThemedText type="small" themeColor="textSecondary">
              {feed.unseen ? `${feed.unseen} new for you →` : 'Bánh mì, pop-ups and good company.'}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.bento}>
          {/* Your points: a big sage card with your level, the number and the stamp card. */}
          <Pressable
            onPress={() => router.navigate('/(wallet)')}
            accessibilityRole="button"
            accessibilityLabel={`${summary.points} points, ${level.current.name} level. ${
              goal ? `${goal.costPoints - summary.points} more to ${goal.title}.` : ''
            } Open Wallet.`}
            style={({ pressed }) => [
              styles.pointsCard,
              {
                backgroundColor: theme.backgroundElement,
                boxShadow: CardShadow,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              },
            ]}
          >
            <View style={styles.pointsTop}>
              <View style={[styles.levelChip, { backgroundColor: theme.brandFill }]}>
                <ThemedText type="captionBold" style={{ color: theme.onBrand }}>
                  {level.current.name}
                </ThemedText>
              </View>
              <View style={[styles.roundGo, { backgroundColor: theme.surfaceDark }]}>
                <Icon name="arrowRight" size={18} color={theme.onSurfaceDark} weight="bold" />
              </View>
            </View>
            <View style={styles.pointsRow}>
              <ThemedText type="display" numberOfLines={1} adjustsFontSizeToFit style={styles.pointsNumber}>
                {summary.points}
              </ThemedText>
              <ThemedText type="subtitle" themeColor="textSecondary">
                points
              </ThemedText>
            </View>
            <StampRow earned={stamps.earned} total={stamps.total} partial={stamps.partial} />
            <ThemedText type="small" themeColor="textSecondary">
              {goal
                ? `${goal.costPoints - summary.points} points to ${goal.title.charAt(0).toLowerCase()}${goal.title.slice(1)}`
                : 'Your points cover a reward: redeem it in Wallet'}
            </ThemedText>
          </Pressable>

          {/* The two ways in: order ahead, and the card to show at the counter. */}
          <View style={styles.duo}>
            <Pressable
              onPress={() => {
                haptics.tap();
                openOrder();
              }}
              accessibilityRole="button"
              accessibilityLabel="Order ahead"
              style={({ pressed }) => [
                styles.tile,
                styles.photoTile,
                {
                  backgroundColor: theme.backgroundElement,
                  boxShadow: CardShadow,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Image
                accessible={false}
                accessibilityLabel=""
                source={ORDER_PHOTO}
                style={styles.tilePhoto}
                contentFit="cover"
              />
              <View style={styles.tileWords}>
                <ThemedText type="section">Order ahead</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  Skip the queue
                </ThemedText>
              </View>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(wallet)/card')}
              accessibilityRole="button"
              accessibilityLabel="My card: show my membership QR code"
              style={({ pressed }) => [
                styles.tile,
                {
                  backgroundColor: theme.backgroundElement,
                  boxShadow: CardShadow,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={[styles.qrDisc, { backgroundColor: theme.brandFill }]}>
                <Icon name="qrcode" size={30} color={theme.onBrand} />
              </View>
              <View>
                <ThemedText type="section">My card</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  Scan at the counter
                </ThemedText>
              </View>
            </Pressable>
          </View>

          {newLevel ? (
            <Card
              eyebrow="NEW LEVEL"
              title={`Welcome to ${newLevel.name}!`}
              icon="trophy"
              image={stickerImage(levelSticker(newLevel.key))}
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
              eyebrow="REWARD"
              title="A reward is yours"
              icon="gift"
              image={stickerImage(rewardSticker(claimable.title))}
              body={`Your points cover ${claimable.title}. Redeem it in Wallet.`}
              link="CLAIM"
              onPress={() => router.navigate('/(wallet)')}
            />
          ) : null}

          {order ? (
            <Card
              title={ORDER_STATUS_TITLE[order.status]}
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.picks}
              style={styles.picksScroller}
            >
              {picks.map(({ item, photo }) => (
                <Pressable
                  key={item.id}
                  onPress={() => openItem(item.id)}
                  accessibilityRole="button"
                  {...nameFromContent(item.name)}
                  style={({ pressed }) => [
                    styles.pick,
                    { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Image
                    accessible={false}
                    accessibilityLabel=""
                    source={photo}
                    style={styles.pickPhoto}
                    contentFit="cover"
                  />
                  {/* The section ("Bánh mì") over the filling. */}
                  <View style={styles.pickName}>
                    <ThemedText type="card" numberOfLines={1} style={{ color: theme.text }}>
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
            </ScrollView>
          </View>
        ) : null}

        <PhotosOfTheWeek style={styles.section} />

        <View style={styles.section}>
          {eventsQuery.isError && !eventsQuery.data ? (
            // Not "nothing planned": we couldn't find out.
            <ErrorState message="Couldn’t load the pop-ups." onRetry={() => void eventsQuery.refetch()} />
          ) : (
            <SectionHead
              title={upcoming.length ? 'Pop-ups coming up' : 'Nothing else planned yet'}
              link="SEE ALL"
              onPress={() => router.navigate('/(popups)')}
            />
          )}
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

/** A sticker's picture, or nothing (the card keeps its icon). */
function stickerImage(name: StickerName | null): number | undefined {
  return name ? Stickers[name] : undefined;
}

/**
 * A card with one job: a headline, a line or two, and its link with a
 * round arrow at the bottom right. `brand` and `rose` make the whole card
 * a colour tile; a sticker can stand in for the icon.
 */
function Card({
  title,
  eyebrow,
  icon,
  image,
  body,
  link,
  onPress,
  tone = 'plain',
  children,
}: {
  title: string;
  eyebrow?: string;
  icon?: IconName;
  /** A sticker instead of the icon. Decorative: the title says it. */
  image?: number;
  body: string;
  link: string;
  onPress: () => void;
  tone?: 'plain' | 'brand' | 'rose';
  children?: ReactNode;
}) {
  const theme = useTheme();
  const { background, ink } = {
    plain: { background: theme.backgroundElement, ink: theme.text },
    brand: { background: theme.brandFill, ink: theme.onBrand },
    rose: { background: theme.tertiary, ink: theme.onTertiary },
  }[tone];
  const plain = tone === 'plain';
  return (
    <Pressable
      android_ripple={ripple(ink)}
      onPress={onPress}
      accessibilityRole="button"
      {...nameFromContent(`${eyebrow ? `${eyebrow}: ` : ''}${title}. ${body}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: background,
          boxShadow: plain ? CardShadow : undefined,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          {eyebrow ? (
            <ThemedText type="label" style={{ color: plain ? theme.textSecondary : ink }}>
              {eyebrow}
            </ThemedText>
          ) : null}
          <ThemedText type="subtitle" style={{ color: ink }}>
            {title}
          </ThemedText>
        </View>
        {image ? (
          <Sticker source={image} style={styles.cardSticker} />
        ) : icon ? (
          <Icon name={icon} size={36} color={ink} />
        ) : null}
      </View>
      {children}
      <ThemedText type="small" style={{ color: plain ? theme.textSecondary : ink }}>
        {body}
      </ThemedText>
      <View style={styles.cardLink}>
        <ThemedText type="label" style={{ color: ink }}>
          {link}
        </ThemedText>
        <View style={[styles.roundGo, { backgroundColor: plain ? theme.surfaceDark : ink }]}>
          <Icon name="arrowRight" size={16} color={plain ? theme.onSurfaceDark : background} weight="bold" />
        </View>
      </View>
    </Pressable>
  );
}

/**
 * The pop-up that's on (or next): its photo filling a rounded card, the
 * name, when and where over it, and two pills: order here, and check in
 * when it's live (details before).
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
    <View style={[styles.popCard, { backgroundColor: theme.surfaceDark }]}>
      <Image
        accessible={false}
        accessibilityLabel=""
        source={popUpImage(event)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <View style={styles.popShade} />
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        {...nameFromContent(`${live ? 'Live now: ' : 'Coming up: '}${event.title}. Open the pop-up.`)}
        style={styles.popText}
      >
        {live ? <Chip label="Live now" tone="live" /> : null}
        <ThemedText type="title" numberOfLines={3} style={{ color: theme.onSurfaceDark }}>
          {event.title}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.onSurfaceDark }}>
          {[event.venue, formatEventWindow(event.startsAt, event.endsAt, event.timeZone), distance]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
      </Pressable>
      <View style={styles.popPills}>
        {/* Ordering here is the second thing: the glass pill. */}
        <Pressable
          onPress={onOrder}
          accessibilityRole="button"
          style={({ pressed }) => [styles.pill, styles.glassPill, { opacity: pressed ? 0.8 : 1 }]}
        >
          <ThemedText type="captionBold" style={{ color: theme.onSurfaceDark }}>
            {live ? 'Order here' : 'Order ahead'}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={live ? onCheckIn : onOpen}
          accessibilityRole="button"
          style={({ pressed }) => [styles.pill, { backgroundColor: theme.brandFill, opacity: pressed ? 0.85 : 1 }]}
        >
          <ThemedText type="captionBold" style={{ color: theme.onBrand }}>
            {live ? 'Check in' : 'Details'}
          </ThemedText>
          <Icon name="arrowRight" size={14} color={theme.onBrand} weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}

/** A pop-up coming up: a rounded photo, its name, when and where, and a round sage button. */
function PopUpRow({ event, onPress }: { event: PopUpEvent; onPress: () => void }) {
  const theme = useTheme();
  const start = new Date(event.startsAt);
  const when = `${formatInTimeZone(start, event.timeZone, 'EEE d MMM, HH:mm')} · ${event.city}`;
  return (
    <Pressable
      android_ripple={ripple(theme.text)}
      onPress={onPress}
      accessibilityRole="button"
      {...nameFromContent(`${event.title}, ${when}`)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.rowPhoto, { backgroundColor: theme.backgroundSelected }]}>
        <Image
          accessible={false}
          accessibilityLabel=""
          source={popUpImage(event)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </View>
      <View style={styles.rowTexts}>
        <ThemedText type="card" numberOfLines={2}>
          {event.title}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
          {when}
        </ThemedText>
      </View>
      <View style={[styles.roundGo, { backgroundColor: theme.brandFill }]}>
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

/** "Order ahead": a bánh mì. */
const ORDER_PHOTO = sectionPhoto('Bánh mì');

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
  hello: {
    paddingHorizontal: PageInset,
    paddingTop: 20,
  },
  bento: {
    paddingHorizontal: PageInset,
    gap: 12,
  },
  pointsCard: {
    borderRadius: Radius.tile,
    padding: 20,
    gap: 12,
  },
  pointsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelChip: {
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  pointsNumber: {
    fontSize: 64,
    // Never below the font size: iOS cuts the top off the glyphs.
    lineHeight: 76,
    flexShrink: 1,
  },
  roundGo: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duo: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    minHeight: 168,
    borderRadius: Radius.tile,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  // The photo fills the top, the words sit under it on the card.
  photoTile: {
    padding: 0,
  },
  tilePhoto: {
    flex: 1,
    minHeight: 96,
  },
  tileWords: {
    padding: 14,
    paddingTop: 10,
  },
  qrDisc: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: Radius.tile,
    padding: 20,
    gap: 10,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardSticker: {
    width: 72,
    height: 72,
  },
  cardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    minHeight: 44,
  },
  popCard: {
    borderRadius: Radius.tile,
    overflow: 'hidden',
    minHeight: 300,
    justifyContent: 'flex-end',
  },
  popShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26, 26, 23, 0.48)',
  },
  popText: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 6,
    alignItems: 'flex-start',
  },
  popPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 20,
    paddingTop: 14,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: Radius.pill,
  },
  glassPill: {
    backgroundColor: 'rgba(250, 249, 245, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(250, 249, 245, 0.5)',
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
  picksScroller: {
    marginHorizontal: -PageInset,
  },
  picks: {
    paddingHorizontal: PageInset,
    gap: 12,
  },
  pick: {
    width: 168,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  pickPhoto: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: Radius.large,
  },
  pickName: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    paddingRight: 14,
    borderRadius: Radius.card,
  },
  rowPhoto: {
    width: 68,
    height: 68,
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  rowTexts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
