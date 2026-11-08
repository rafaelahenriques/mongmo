import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Image } from 'expo-image';
import { formatInTimeZone } from 'date-fns-tz';

import type { OrderMenuItem } from '@/api/orders';
import { shortName } from '@/components/achievements/LeaderboardList';
import { ThemedText } from '@/components/ThemedText';
import { Wordmark } from '@/components/brand/Wordmark';
import { ScreenReaderTitle } from '@/components/ui/ScreenReaderTitle';
import Chip from '@/components/ui/Chip';
import { Icon, type IconName } from '@/components/ui/Icon';
import { usePullToRefresh } from '@/components/ui/Screen';
import { ripple } from '@/components/ui/ripple';
import { StampRow } from '@/components/ui/Stamps';
import { StepBar } from '@/components/ui/StepBar';
import { productPhoto } from '@/constants/productPhotos';
import { levelSticker, rewardSticker, Stickers, type StickerName } from '@/constants/stickers';
import { CardShadow, PageInset, Paper, Radius } from '@/constants/theme';
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
import {
  formatCents,
  ORDER_STEP,
  ORDER_STEPS,
  ORDER_STATUS_TITLE,
  pickupCode,
  shortItemName,
} from '@/utils/orderFormat';
import { featuredPopUps } from '@/utils/popUps';
import { bestClaimableReward, nextReward } from '@/utils/rewards';
import { stampCard } from '@/utils/stamps';
import type { PopUpEvent } from '@/types';
import { BrandPhotos, popUpImage } from '@/constants/brandPhotos';
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
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

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

  // The kitchen photo, unless the pop-up card below already shows it.
  const heroPhoto =
    featured && popUpImage(featured) === BrandPhotos.opening ? BrandPhotos.welcome : BrandPhotos.opening;

  const notices = [
    order ? (
      <Notice
        key="order"
        eyebrow="YOUR ORDER"
        title={ORDER_STATUS_TITLE[order.status]}
        text={`${pickupCode(order.id)}${
          order.pickup_at ? ` · Pick up at ${new Date(order.pickup_at).toTimeString().slice(0, 5)}` : ''
        }`}
        icon="bag"
        onPress={() => router.push({ pathname: '/(orders)/order/status/[id]', params: { id: order.id } })}
      >
        <StepBar steps={ORDER_STEPS} reached={ORDER_STEP[order.status] ?? 0} />
      </Notice>
    ) : null,
    claimable ? (
      <Notice
        key="reward"
        eyebrow="A REWARD IS YOURS"
        title={claimable.title}
        text="Redeem it in Wallet"
        icon="gift"
        image={stickerImage(rewardSticker(claimable.title))}
        onPress={() => router.navigate('/(wallet)')}
      />
    ) : null,
    newLevel ? (
      <Notice
        key="level"
        eyebrow="NEW LEVEL"
        title={`Welcome to ${newLevel.name}`}
        text={`${newLevel.perk.charAt(0).toUpperCase()}${newLevel.perk.slice(1)}`}
        icon="trophy"
        image={stickerImage(levelSticker(newLevel.key))}
        onPress={() => {
          markLevelSeen(newLevel.key);
          router.push('/(wallet)/levels');
        }}
      />
    ) : null,
  ].filter(Boolean);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: tabBarInset + 40 }}
        refreshControl={<RefreshControl refreshing={refresh.refreshing} onRefresh={refresh.onRefresh} />}
      >
        {/* The hero: a photo from the kitchen, edge to edge, hello and the two ways in over it. */}
        <View style={[styles.hero, { minHeight: Math.min(560, height * 0.64), backgroundColor: theme.surfaceDark }]}>
          <Image
            accessible={false}
            accessibilityLabel=""
            source={heroPhoto}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <Shade />
          <View style={[styles.heroBar, { paddingTop: insets.top + 8 }]}>
            <Wordmark height={26} color={Paper} />
            <ScreenReaderTitle>Home</ScreenReaderTitle>
            <View style={styles.flex} />
            <GlassButton
              icon="bell"
              label={`Notifications${feed.unseen ? `, ${feed.unseen} new` : ''}`}
              dot={feed.unseen > 0}
              onPress={() => router.push('/(home)/notifications')}
            />
            <GlassButton
              icon="trophy"
              label="Achievements"
              onPress={() => router.push('/(achievements)/achievements')}
            />
            <GlassButton icon="person" label="Account" onPress={() => router.push('/(profile)')} />
          </View>
          <View style={styles.heroText}>
            <ThemedText type="label" style={styles.onPhotoSoft}>
              Xin chào
            </ThemedText>
            <ThemedText type="name" accessibilityRole="header" style={styles.onPhoto}>
              {firstName || 'there'}
            </ThemedText>
            <Pressable
              onPress={() => router.navigate('/(wallet)')}
              accessibilityRole="button"
              accessibilityLabel={`${summary.points} points, ${level.current.name} level. Open Wallet.`}
              style={({ pressed }) => [styles.glass, styles.pointsChip, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Icon name="star" size={14} color={Paper} weight="bold" />
              <ThemedText type="captionBold" style={styles.onPhoto}>
                {`${summary.points} points · ${level.current.name}`}
              </ThemedText>
            </Pressable>
            <View style={styles.heroPills}>
              <Pressable
                onPress={() => {
                  haptics.tap();
                  openOrder();
                }}
                accessibilityRole="button"
                accessibilityLabel="Order ahead"
                style={({ pressed }) => [
                  styles.pill,
                  { backgroundColor: theme.brandFill, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <ThemedText type="button" style={{ color: theme.onBrand }}>
                  Order ahead
                </ThemedText>
                <Icon name="arrowRight" size={16} color={theme.onBrand} weight="bold" />
              </Pressable>
              <Pressable
                onPress={() => router.push('/(wallet)/card')}
                accessibilityRole="button"
                accessibilityLabel="My card: show my membership QR code"
                style={({ pressed }) => [styles.pill, styles.glass, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Icon name="qrcode" size={16} color={Paper} />
                <ThemedText type="button" style={styles.onPhoto}>
                  My card
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* What needs you now (an order, a reward, a level), over the photo's edge. */}
        {notices.length ? <View style={styles.notices}>{notices}</View> : null}

        {featured ? (
          <View style={styles.section}>
            <Chapter number="01" vi="Hôm nay" en={liveNow(featured) ? 'On right now' : 'Up next'} />
            <PopUpCard
              event={featured}
              distance={coordinates ? formatDistance(distanceInMeters(coordinates, featured.coordinates)) : null}
              onCheckIn={() => router.push({ pathname: '/(popups)/check-in/[id]', params: { id: featured.id } })}
              onOpen={() => openEvent(featured.id)}
              onOrder={() => orderAt(featured)}
            />
          </View>
        ) : null}

        {picks.length ? (
          <View style={styles.section}>
            <Chapter number="02" vi="Thực đơn" en="From the menu" link="MENU" onPress={openOrder} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={PICK_WIDTH + 14}
              decelerationRate="fast"
              contentContainerStyle={styles.picks}
              style={styles.picksScroller}
            >
              {picks.map(({ item, photo }) => (
                <Pressable
                  key={item.id}
                  onPress={() => openItem(item.id)}
                  accessibilityRole="button"
                  {...nameFromContent(`${item.name}, ${formatCents(item.priceCents)} euro`)}
                  style={({ pressed }) => [styles.pick, { opacity: pressed ? 0.9 : 1 }]}
                >
                  <View style={[styles.pickPhoto, { backgroundColor: theme.backgroundSelected }]}>
                    <Image
                      accessible={false}
                      accessibilityLabel=""
                      source={photo}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                  </View>
                  {/* "Add", over the photo's corner: the whole card is the button. */}
                  <View style={[styles.pickAdd, { backgroundColor: theme.brandFill, borderColor: theme.background }]}>
                    <Icon name="add" size={18} color={theme.onBrand} weight="bold" />
                  </View>
                  <ThemedText type="card" numberOfLines={1}>
                    {item.category ?? item.name}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                    {item.category ? shortItemName(item.name, item.category) : ' '}
                  </ThemedText>
                  <ThemedText type="smallBold">{formatCents(item.priceCents)}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Your stamp card: the stamps, how far to the next reward. */}
        <View style={styles.section}>
          <Chapter
            number="03"
            vi="Thẻ tích điểm"
            en="Your stamp card"
            link="WALLET"
            onPress={() => router.navigate('/(wallet)')}
          />
          <View style={styles.stampRow}>
            <StampRow earned={stamps.earned} total={stamps.total} partial={stamps.partial} />
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {goal
              ? `${stamps.earned} of ${stamps.total} stamps · ${goal.costPoints - summary.points} points to ${goal.title.charAt(0).toLowerCase()}${goal.title.slice(1)}`
              : 'Your points cover a reward: redeem it in Wallet.'}
          </ThemedText>
        </View>

        <View style={styles.section}>
          {eventsQuery.isError && !eventsQuery.data ? (
            // Not "nothing planned": we couldn't find out.
            <ErrorState message="Couldn’t load the pop-ups." onRetry={() => void eventsQuery.refetch()} />
          ) : (
            <Chapter
              number="04"
              vi="Sắp tới"
              en={upcoming.length ? 'Pop-ups coming up' : 'Nothing else planned yet'}
              link="SEE ALL"
              onPress={() => router.navigate('/(popups)')}
            />
          )}
          <View>
            {upcoming.map((event, index) => (
              <PopUpRow
                key={event.id}
                event={event}
                last={index === upcoming.length - 1}
                onPress={() => openEvent(event.id)}
              />
            ))}
          </View>
        </View>

        <PhotosOfTheWeek style={styles.section} />
      </ScrollView>
    </View>
  );
}

const PICK_WIDTH = 200;

function liveNow(event: PopUpEvent) {
  return getEventPhase(event.startsAt, event.endsAt) === 'live';
}

/** Darkens a photo toward its bottom, so the words over it read. */
function Shade({ from = 0.05, to = 0.78 }: { from?: number; to?: number }) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 1 1">
      <Defs>
        <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1C1D19" stopOpacity={from + 0.25} />
          <Stop offset="0.35" stopColor="#1C1D19" stopOpacity={from} />
          <Stop offset="1" stopColor="#1C1D19" stopOpacity={to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="1" height="1" fill="url(#shade)" />
    </Svg>
  );
}

/** A round see-through button over a photo. */
function GlassButton({
  icon,
  label,
  dot = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  dot?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.glass, styles.glassButton, { opacity: pressed ? 0.75 : 1 }]}
    >
      <Icon name={icon} size={20} color={Paper} />
      {dot ? <View style={[styles.dot, { backgroundColor: theme.brandFill }]} /> : null}
    </Pressable>
  );
}

/**
 * A section's heading: its number, the Vietnamese word big, the English
 * under it, and one link on the right ("MENU", "SEE ALL").
 */
function Chapter({
  number,
  vi,
  en,
  link,
  onPress,
}: {
  number: string;
  vi: string;
  en: string;
  link?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.chapter}>
      <ThemedText type="label" aria-hidden style={[styles.chapterNumber, { color: theme.primaryText }]}>
        {number}
      </ThemedText>
      <View style={styles.flex}>
        <ThemedText type="subtitle" accessibilityRole="header" lang="vi">
          {vi}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {en}
        </ThemedText>
      </View>
      {link && onPress ? (
        <Pressable onPress={onPress} accessibilityRole="link" hitSlop={10} style={styles.target}>
          <ThemedText type="label" style={{ color: theme.primaryText }}>
            {link}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Something that needs you now: a small picture, what it is, and a round arrow. */
function Notice({
  eyebrow,
  title,
  text,
  icon,
  image,
  onPress,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  icon: IconName;
  image?: number;
  onPress: () => void;
  children?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      android_ripple={ripple(theme.text)}
      onPress={onPress}
      accessibilityRole="button"
      {...nameFromContent(`${eyebrow}: ${title}. ${text}`)}
      style={({ pressed }) => [
        styles.notice,
        { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <View style={styles.noticeRow}>
        <View style={[styles.noticeArt, { backgroundColor: theme.backgroundSelected }]}>
          {image ? (
            <Sticker source={image} style={styles.noticeSticker} />
          ) : (
            <Icon name={icon} size={22} color={theme.text} />
          )}
        </View>
        <View style={styles.flex}>
          <ThemedText type="label" style={{ color: theme.primaryText }}>
            {eyebrow}
          </ThemedText>
          <ThemedText type="card" numberOfLines={2}>
            {title}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
            {text}
          </ThemedText>
        </View>
        <View style={[styles.roundGo, { backgroundColor: theme.brandFill }]}>
          <Icon name="arrowRight" size={16} color={theme.onBrand} weight="bold" />
        </View>
      </View>
      {children}
    </Pressable>
  );
}

/** A sticker's picture, or nothing (the notice keeps its icon). */
function stickerImage(name: StickerName | null): number | undefined {
  return name ? Stickers[name] : undefined;
}

/**
 * The pop-up that's on (or next), tall like a poster: its photo, a glass
 * panel at the bottom with the name, when and where, and two pills: order
 * here, and check in when it's live (details before).
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
  const live = liveNow(event);
  return (
    <View style={[styles.popCard, { backgroundColor: theme.surfaceDark }]}>
      <Image
        accessible={false}
        accessibilityLabel=""
        source={popUpImage(event)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <Shade from={0} to={0.85} />
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        {...nameFromContent(`${live ? 'Live now' : 'Coming up'}: ${event.title}. Open the pop-up.`)}
        style={styles.popText}
      >
        {live ? (
          <Chip label="Live now" tone="live" />
        ) : (
          <ThemedText type="label" style={styles.onPhotoSoft}>
            Coming up
          </ThemedText>
        )}
        <ThemedText type="title" numberOfLines={3} style={styles.onPhoto}>
          {event.title}
        </ThemedText>
        <ThemedText type="small" style={styles.onPhotoSoft}>
          {[event.venue, formatEventWindow(event.startsAt, event.endsAt, event.timeZone), distance]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
      </Pressable>
      <View style={styles.popPills}>
        <Pressable
          onPress={live ? onCheckIn : onOpen}
          accessibilityRole="button"
          style={({ pressed }) => [styles.pill, { backgroundColor: theme.brandFill, opacity: pressed ? 0.85 : 1 }]}
        >
          <ThemedText type="button" style={{ color: theme.onBrand }}>
            {live ? 'Check in' : 'Details'}
          </ThemedText>
          <Icon name="arrowRight" size={16} color={theme.onBrand} weight="bold" />
        </Pressable>
        <Pressable
          onPress={onOrder}
          accessibilityRole="button"
          style={({ pressed }) => [styles.pill, styles.glass, { opacity: pressed ? 0.8 : 1 }]}
        >
          <ThemedText type="button" style={styles.onPhoto}>
            {live ? 'Order here' : 'Order ahead'}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

/** A pop-up coming up, as a line in a programme: the date big, the name, where and when, an arrow. */
function PopUpRow({ event, last, onPress }: { event: PopUpEvent; last: boolean; onPress: () => void }) {
  const theme = useTheme();
  const start = new Date(event.startsAt);
  const day = formatInTimeZone(start, event.timeZone, 'dd');
  const month = formatInTimeZone(start, event.timeZone, 'MMM');
  const when = `${formatInTimeZone(start, event.timeZone, 'EEE HH:mm')} · ${event.city}`;
  return (
    <Pressable
      android_ripple={ripple(theme.text)}
      onPress={onPress}
      accessibilityRole="button"
      {...nameFromContent(
        `${event.title}, ${formatInTimeZone(start, event.timeZone, 'EEE d MMM, HH:mm')}, ${event.city}`,
      )}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: theme.border },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.date}>
        <ThemedText type="subtitle">{day}</ThemedText>
        <ThemedText type="label" themeColor="textSecondary">
          {month}
        </ThemedText>
      </View>
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
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {when}
        </ThemedText>
      </View>
      <Icon name="chevronRight" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

type Photo = NonNullable<ReturnType<typeof productPhoto>>;

/** A few things to start an order with: main items, not options, each with a photo no other pick has. */
function menuPicks(items: OrderMenuItem[], count = 6): { item: OrderMenuItem; photo: Photo }[] {
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

const glass = {
  backgroundColor: 'rgba(250, 249, 245, 0.16)',
  borderWidth: 1,
  borderColor: 'rgba(250, 249, 245, 0.42)',
};

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
  onPhoto: {
    color: Paper,
  },
  onPhotoSoft: {
    color: 'rgba(250, 249, 245, 0.86)',
  },
  hero: {
    justifyContent: 'space-between',
    borderBottomLeftRadius: Radius.tile + 8,
    borderBottomRightRadius: Radius.tile + 8,
    overflow: 'hidden',
  },
  heroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: PageInset,
  },
  heroText: {
    paddingHorizontal: PageInset,
    paddingBottom: 28,
    gap: 6,
    alignItems: 'flex-start',
  },
  glass,
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pointsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    marginTop: 2,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
  },
  notices: {
    paddingHorizontal: PageInset,
    marginTop: -18,
    gap: 10,
  },
  notice: {
    borderRadius: Radius.card,
    padding: 12,
    gap: 10,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noticeArt: {
    width: 52,
    height: 52,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeSticker: {
    width: 46,
    height: 46,
  },
  roundGo: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: PageInset,
    paddingTop: 36,
    gap: 14,
  },
  chapter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  chapterNumber: {
    paddingTop: 7,
  },
  popCard: {
    borderRadius: Radius.tile,
    overflow: 'hidden',
    aspectRatio: 0.82,
    justifyContent: 'flex-end',
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
  picksScroller: {
    marginHorizontal: -PageInset,
  },
  picks: {
    paddingHorizontal: PageInset,
    gap: 14,
  },
  pick: {
    width: PICK_WIDTH,
    gap: 2,
  },
  pickPhoto: {
    width: '100%',
    aspectRatio: 0.8,
    borderRadius: Radius.card,
    overflow: 'hidden',
    marginBottom: 10,
  },
  pickAdd: {
    position: 'absolute',
    right: 10,
    top: PICK_WIDTH / 0.8 - 22,
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampRow: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  date: {
    width: 44,
    alignItems: 'center',
  },
  rowPhoto: {
    width: 56,
    height: 56,
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  rowTexts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
