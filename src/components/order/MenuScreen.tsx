import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { formatInTimeZone } from 'date-fns-tz';

import { getOrderLines, type OrderMenuItem, type OrderRow } from '@/api/orders';
import { CategoryIcon } from '@/components/order/CategoryIcon';
import { ThemedText } from '@/components/ThemedText';
import { AppHeader } from '@/components/ui/AppHeader';
import { BlockButton } from '@/components/ui/BlockButton';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Segmented';
import { CardShadow, PageInset, Radius } from '@/constants/theme';
import { ripple } from '@/components/ui/ripple';
import { useMenu } from '@/hooks/useMenu';
import { useMyOrders } from '@/hooks/useMyOrders';
import { usePickupPlace } from '@/hooks/usePickupPlace';
import { useStore } from '@/hooks/useStore';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { orderAgain } from '@/services/orderAgain';
import { cartItemCount, cartSubtotalCents, useCartStore } from '@/state/cartStore';
import { nameFromContent } from '@/utils/a11y';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';
import { formatCents } from '@/utils/orderFormat';
import { pickupSlots } from '@/utils/pickupSlots';
import { useRefreshControl } from '@/components/ui/LoadState';

type Section = { name: string; items: OrderMenuItem[] };

/** The menu's sections in the order their first item comes; no section goes last. */
export function sectionsOf(items: OrderMenuItem[]): Section[] {
  const sections: Section[] = [];
  for (const item of items) {
    const name = item.category?.trim() || 'More';
    const section = sections.find((candidate) => candidate.name.toLowerCase() === name.toLowerCase());
    if (section) section.items.push(item);
    else sections.push({ name, items: [item] });
  }
  return sections.sort((a, b) => Number(a.name === 'More') - Number(b.name === 'More'));
}

/**
 * The Order tab: where and when you pick up, then the menu as a list of
 * sections, each with its drawing (open one for its products), or your
 * past orders to order again. "View cart" once there's something in it.
 * Extras and dips aren't here: they're picked on an item's page.
 */
export default function MenuScreen() {
  const theme = useTheme();
  const refreshControl = useRefreshControl();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const location = useCartStore((state) => state.location);
  const items = useCartStore((state) => state.items);
  const store = useStore();
  const place = usePickupPlace();
  const menu = useMenu(location);
  const [view, setView] = useState<'menu' | 'reorder'>('menu');

  // Nowhere chosen yet: the café, until you pick a pop-up.
  useEffect(() => {
    if (!location && store.data) useCartStore.getState().setLocation({ type: 'store', storeId: store.data.id });
  }, [location, store.data]);

  const sections = useMemo(() => sectionsOf((menu.data ?? []).filter((item) => !item.addOnFor)), [menu.data]);
  const count = cartItemCount(items);
  const total = cartSubtotalCents(items);

  // Checkout picks the time; until then, the soonest one.
  const soonest = useMemo(() => {
    if (!place) return null;
    const today = pickupSlots(place.pickup, 'today')[0];
    if (today) return { day: 'Today', at: today };
    const tomorrow = pickupSlots(place.pickup, 'tomorrow')[0];
    return tomorrow ? { day: 'Tomorrow', at: tomorrow } : null;
  }, [place]);
  const when = !place
    ? ' '
    : soonest
      ? `${soonest.day}, from ${formatInTimeZone(soonest.at, place.timeZone, 'HH:mm')}`
      : 'Not taking pickups right now';

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader title="Order" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: (count ? 88 : 24) + tabBarInset }]}
        refreshControl={refreshControl}
      >
        <Pressable
          onPress={() => {
            haptics.tap();
            router.push('/(orders)/order/location');
          }}
          accessibilityRole="button"
          {...nameFromContent(`Pick up at ${place?.name ?? ''}, ${when}. Change.`)}
          style={({ pressed }) => [
            styles.pickup,
            { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Icon name="pin" size={24} color={theme.text} />
          <View style={styles.flex}>
            <ThemedText type="label" themeColor="textSecondary">
              Pick up at
            </ThemedText>
            <ThemedText type="section">{place?.name ?? ' '}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {when}
            </ThemedText>
          </View>
          <ThemedText type="link">Change</ThemedText>
        </Pressable>

        <Segmented
          options={[
            { value: 'menu', label: 'Menu' },
            { value: 'reorder', label: 'Reorder' },
          ]}
          value={view}
          onChange={setView}
          accessibilityLabel="Order from"
          look="tabs"
        />

        {view === 'reorder' ? (
          <Reorder placeName={place?.name} onDone={() => router.push('/(orders)/order/cart')} />
        ) : menu.isPending && location ? (
          <ActivityIndicator accessibilityLabel="Loading" color={theme.text} style={styles.loader} />
        ) : menu.isError ? (
          <View style={styles.message}>
            <ThemedText type="caption" themeColor="textSecondary">
              Couldn’t load the menu.
            </ThemedText>
            <Button label="Try again" variant="ghost" size="small" onPress={() => menu.refetch()} />
          </View>
        ) : location && sections.length === 0 ? (
          <ThemedText type="caption" themeColor="textSecondary" style={styles.message}>
            Nothing on the menu right now. Check back soon.
          </ThemedText>
        ) : (
          <View style={styles.sections}>
            {sections.map((section, index) => {
              const from = Math.min(...section.items.map((item) => item.priceCents));
              const tone = sectionTone(theme, index);
              return (
                <Pressable
                  key={section.name}
                  android_ripple={ripple(tone.ink)}
                  onPress={() => {
                    haptics.tap();
                    router.push({ pathname: '/(orders)/order/category/[name]', params: { name: section.name } });
                  }}
                  accessibilityRole="button"
                  {...nameFromContent(`${section.name}, from ${formatCents(from)} euro`)}
                  style={({ pressed }) => [
                    styles.section,
                    { backgroundColor: tone.background, transform: [{ scale: pressed ? 0.98 : 1 }] },
                  ]}
                >
                  <View style={styles.sectionText}>
                    {/* The number is decoration: the name and price say it all. */}
                    <ThemedText type="label" aria-hidden style={{ color: tone.ink }}>
                      {String(index + 1).padStart(2, '0')}
                    </ThemedText>
                    <ThemedText type="title" style={{ color: tone.ink }}>
                      {section.name}
                    </ThemedText>
                    <ThemedText type="captionBold" style={{ color: tone.ink }}>
                      {`From ${formatCents(from)}`}
                    </ThemedText>
                  </View>
                  <View style={styles.sectionArt}>
                    <CategoryIcon section={section.name} size={96} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {count ? (
        <View style={[styles.footer, { bottom: tabBarInset + 12 }]}>
          <Button
            label={`View cart · ${count} ${count === 1 ? 'item' : 'items'} · ${formatCents(total)}`}
            variant="brand"
            onPress={() => router.push('/(orders)/order/cart')}
          />
        </View>
      ) : null}
    </View>
  );
}

/** The sections' colours, in turn: sage, cream, rose, stone. Each with its text colour (AA). */
function sectionTone(theme: ReturnType<typeof useTheme>, index: number) {
  const tones = [
    { background: theme.brandFill, ink: theme.onBrand },
    { background: theme.accent, ink: theme.onAccent },
    { background: theme.tertiary, ink: theme.onTertiary },
    { background: theme.backgroundSelected, ink: theme.text },
  ];
  return tones[index % tones.length];
}

/** Past orders, newest first, each one tap from the cart again. */
function Reorder({ placeName, onDone }: { placeName?: string; onDone: () => void }) {
  const theme = useTheme();
  const orders = useMyOrders();
  const past = (orders.data ?? []).filter((order) => order.status !== 'cancelled').slice(0, 10);
  const lines = useQuery({
    queryKey: ['orders', 'lines', past.map((order) => order.id).join(',')],
    queryFn: () => getOrderLines(past.map((order) => order.id)),
    enabled: past.length > 0,
  });
  const [busy, setBusy] = useState<string | null>(null);

  const again = async (order: OrderRow) => {
    setBusy(order.id);
    const added = await orderAgain(order, placeName).catch(() => 0);
    setBusy(null);
    if (added) onDone();
  };

  if (orders.isPending)
    return <ActivityIndicator accessibilityLabel="Loading" color={theme.text} style={styles.loader} />;
  if (past.length === 0) {
    return (
      <ThemedText type="caption" themeColor="textSecondary" style={styles.message}>
        Your orders show up here, ready to order again.
      </ThemedText>
    );
  }
  return (
    <View style={styles.orders}>
      {past.map((order) => (
        <View
          key={order.id}
          style={[styles.order, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}
        >
          <View style={styles.orderBody}>
            <ThemedText type="card">{formatInTimeZone(order.created_at, DISPLAY_TIME_ZONE, 'EEE d MMM')}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
              {(lines.data?.[order.id] ?? []).join(', ') || ' '}
            </ThemedText>
          </View>
          <View style={styles.orderFoot}>
            <ThemedText type="captionBold" style={styles.orderTotal}>
              {formatCents(order.total_cents)}
            </ThemedText>
            <BlockButton
              label="Order again"
              size="compact"
              loading={busy === order.id}
              onPress={() => void again(order)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 20,
    gap: 18,
  },
  pickup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: Radius.card,
  },
  loader: {
    marginVertical: 24,
  },
  message: {
    paddingVertical: 14,
    gap: 8,
  },
  sections: {
    gap: 12,
  },
  // A colour tile per section: its number, name and price on the left, its sticker on the right.
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 132,
    borderRadius: Radius.tile,
    paddingLeft: 20,
    paddingRight: 12,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  sectionText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  sectionArt: {
    transform: [{ rotate: '-6deg' }],
  },
  orders: {
    gap: 10,
  },
  order: {
    overflow: 'hidden',
    borderRadius: Radius.card,
  },
  orderBody: {
    gap: 3,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  orderFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderTotal: {
    paddingLeft: 14,
  },
  footer: {
    position: 'absolute',
    left: PageInset,
    right: PageInset,
  },
});
