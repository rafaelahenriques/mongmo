import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import type { OrderMenuItem } from '@/api/orders';
import { shortName } from '@/components/achievements/leaderboardText';
import { ThemedText } from '@/components/ThemedText';
import { Wordmark } from '@/components/brand/Wordmark';
import { Chapter } from '@/components/ui/Chapter';
import { GlassButton, glass, onPhoto, onPhotoSoft, PhotoPill, PhotoShade } from '@/components/ui/PhotoShade';
import { PopUpPoster, PopupRow } from '@/components/explore/PopupRow';
import { ScreenReaderTitle } from '@/components/ui/ScreenReaderTitle';
import { Icon, type IconName } from '@/components/ui/Icon';
import { usePullToRefresh } from '@/components/ui/Screen';
import { ripple } from '@/components/ui/ripple';
import { LiveStampRow } from '@/components/ui/Stamps';
import { StepBar } from '@/components/ui/StepBar';
import { productPhoto } from '@/constants/productPhotos';
import { rewardSticker, Stickers, type StickerName } from '@/constants/stickers';
import { CardShadow, PageInset, Paper, Radius } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useActiveOrder } from '@/hooks/useActiveOrder';
import { useEvents } from '@/hooks/useEvents';
import { useIsGuest } from '@/hooks/useIsGuest';
import { useLevel } from '@/hooks/useLevel';
import { useMenu } from '@/hooks/useMenu';
import { useNotificationsFeed } from '@/hooks/useNotificationsFeed';
import { useProfile } from '@/hooks/useProfile';
import { useStore } from '@/hooks/useStore';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { switchPickup } from '@/services/switchPickup';
import { useCartStore, type CartLocation } from '@/state/cartStore';
import { useLocationStore } from '@/state/locationStore';
import { nameFromContent } from '@/utils/a11y';
import { getEventPhase } from '@/utils/dateTime';
import {
  formatCents,
  ORDER_STEP,
  ORDER_STEPS,
  ORDER_STATUS_TITLE,
  pickupCode,
  shortItemName,
} from '@/utils/orderFormat';
import { featuredPopUps, takesOrders } from '@/utils/popUps';
import { bestClaimableReward, nextReward } from '@/utils/rewards';
import { stampCard } from '@/utils/stamps';
import type { PopUpEvent } from '@/types';
import { BrandPhotos, popUpImage } from '@/constants/brandPhotos';
import PhotosOfTheWeek from '@/components/home/PhotosOfTheWeek';
import { CateringCard } from '@/components/home/CateringCard';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, openLink } from '@/constants/links';
import { GuestLock } from '@/components/guest/GuestLock';
import { JOIN } from '@/components/guest/joinCopy';
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
  const guest = useIsGuest();
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
  const rewards = achievements.data?.rewards ?? [];
  const goal = nextReward(rewards, summary.points, level.unlocked);
  // The best reward your points already cover: worth a card of its own.
  const claimable = bestClaimableReward(rewards, summary.points, level.unlocked);
  const stamps = stampCard(summary.points, goal);
  const progress = goal
    ? `${stamps.earned} of ${stamps.total} stamps · ${goal.costPoints - summary.points} points to ${goal.title.charAt(0).toLowerCase()}${goal.title.slice(1)}`
    : 'Your points cover a reward: redeem it in Wallet.';

  // Three things to start an order with, each with its own photo.
  const picks = useMemo(() => menuPicks(menu.data ?? []), [menu.data]);

  // "rafaela.henriques" (a name made from an email) greets as "Rafaela".
  // A guest has no name of their own ("Mongmo fan"): "Hello there".
  const firstName = profile.data?.name && !guest ? shortName(profile.data.name).split(' ')[0] : '';
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
          <PhotoShade />
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
              Hello
            </ThemedText>
            <ThemedText type="name" style={styles.onPhoto}>
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
              <PhotoPill label="Order ahead" tone="brand" onPress={openOrder} />
              <PhotoPill
                label="My card"
                icon="qrcode"
                accessibilityLabel="My card: show my membership QR code"
                onPress={() => router.push('/(wallet)/card')}
              />
            </View>
          </View>
        </View>

        {/* What needs you now (an order, a reward), over the photo's edge. */}
        {notices.length ? <View style={styles.notices}>{notices}</View> : null}

        {featured ? (
          <View style={styles.section}>
            <Chapter number="01" title={liveNow(featured) ? 'On right now' : 'Up next'} />
            <PopUpPoster
              tall
              event={featured}
              onOpen={() => openEvent(featured.id)}
              actions={
                <>
                  {liveNow(featured) ? (
                    <PhotoPill
                      label="Check in"
                      tone="brand"
                      onPress={() => router.push({ pathname: '/(popups)/check-in/[id]', params: { id: featured.id } })}
                    />
                  ) : (
                    <PhotoPill label="Details" tone="brand" onPress={() => openEvent(featured.id)} />
                  )}
                  {/* While it's on, or from a day before (a pre-order); before that, its page says when. */}
                  {takesOrders(featured) ? (
                    <PhotoPill
                      label={liveNow(featured) ? 'Order here' : 'Pre-order'}
                      onPress={() => orderAt(featured)}
                    />
                  ) : null}
                </>
              }
            />
          </View>
        ) : null}

        {picks.length ? (
          <View style={styles.section}>
            <Chapter number="02" title="From the menu" link="MENU" onPress={openOrder} />
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

        {/* Your stamp card: the stamps, how far to the next reward. A guest
            sees it dimmed, under a card to make an account. */}
        <View style={styles.section}>
          <Chapter
            number="03"
            title="Your stamp card"
            link={guest ? undefined : 'WALLET'}
            onPress={guest ? undefined : () => router.navigate('/(wallet)')}
          />
          {guest ? (
            <GuestLock inline {...JOIN.stamps}>
              <StampCard stamps={stamps}>{progress}</StampCard>
            </GuestLock>
          ) : (
            <StampCard stamps={stamps}>{progress}</StampCard>
          )}
        </View>

        <View style={styles.section}>
          {eventsQuery.isError && !eventsQuery.data ? (
            // Not "nothing planned": we couldn't find out.
            <ErrorState message="Couldn’t load the pop-ups." onRetry={() => void eventsQuery.refetch()} />
          ) : (
            <Chapter
              number="04"
              title={upcoming.length ? 'Pop-ups coming up' : 'Nothing else planned yet'}
              link="SEE ALL"
              onPress={() => router.navigate('/(popups)')}
            />
          )}
          <View>
            {upcoming.map((event, index) => (
              <PopupRow
                key={event.id}
                event={event}
                last={index === upcoming.length - 1}
                onPress={() => openEvent(event.id)}
              />
            ))}
          </View>
        </View>

        <PhotosOfTheWeek style={styles.section} />

        <View style={styles.section}>
          <Chapter number="06" title="Catering" />
          <CateringCard />
        </View>

        {/* Where the pop-ups are announced first. */}
        <Pressable
          onPress={() => openLink(INSTAGRAM_URL)}
          accessibilityRole="link"
          accessibilityLabel={`Follow us on Instagram, ${INSTAGRAM_HANDLE}`}
          style={({ pressed }) => [styles.instagram, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Icon name="camera" size={18} color={theme.text} />
          <ThemedText type="smallBold">Follow us on Instagram</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {INSTAGRAM_HANDLE}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const PICK_WIDTH = 200;

/** The stamp line, and under it how far to the next reward. */
function StampCard({ stamps, children }: { stamps: ReturnType<typeof stampCard>; children: string }) {
  return (
    <View style={styles.stampCard}>
      <View style={styles.stampRow}>
        <LiveStampRow earned={stamps.earned} total={stamps.total} partial={stamps.partial} />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {children}
      </ThemedText>
    </View>
  );
}

function liveNow(event: PopUpEvent) {
  return getEventPhase(event.startsAt, event.endsAt) === 'live';
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  onPhoto,
  onPhotoSoft,
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
  // The section's own gap, as when these were its children.
  stampCard: {
    gap: 14,
  },
  // At least 44 tall to tap; centred under the last section.
  instagram: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    marginTop: 28,
    paddingHorizontal: PageInset,
  },
  stampRow: {
    paddingVertical: 4,
  },
});
