import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';

import { ThemedText } from '@/components/ThemedText';
import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { ColumnRow } from '@/components/ui/ColumnRow';
import { PhotoHero } from '@/components/ui/PhotoHero';
import { Stepper } from '@/components/ui/Stepper';
import { PageInset } from '@/constants/theme';
import { useMenu } from '@/hooks/useMenu';
import { usePickupPlace } from '@/hooks/usePickupPlace';
import { useStore } from '@/hooks/useStore';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { cartSubtotalCents, useCartStore } from '@/state/cartStore';
import type { OrderMenuItem } from '@/api/orders';
import { formatCents, priceParts, shortItemName } from '@/utils/orderFormat';
import { pickupSlots } from '@/utils/pickupSlots';

type Section = { name: string; items: OrderMenuItem[] };

/** The menu's sections in the order their first item comes; no section goes last. */
function sectionsOf(items: OrderMenuItem[]): Section[] {
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
 * O-01 Menu, the Order tab: a photo, where and when you pick up, then the
 * menu board — each section in the label column with its price, an Add
 * pill per item that turns into a sage stepper, and "View cart" once
 * there's something in it. Pay at pickup.
 */
export default function MenuScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const location = useCartStore((state) => state.location);
  const items = useCartStore((state) => state.items);
  const store = useStore();
  const place = usePickupPlace();
  const menu = useMenu(location);

  // Nowhere chosen yet: the café, until you pick a pop-up.
  useEffect(() => {
    if (!location && store.data) useCartStore.getState().setLocation({ type: 'store', storeId: store.data.id });
  }, [location, store.data]);

  // Extras and dips aren't on the board: they're picked on an item's page.
  const sections = useMemo(() => sectionsOf((menu.data ?? []).filter((item) => !item.addOnFor)), [menu.data]);
  const optionSections = useMemo(() => new Set((menu.data ?? []).flatMap((item) => item.addOnFor ?? [])), [menu.data]);
  const heroImage = menu.data?.find((item) => item.imageUrl)?.imageUrl ?? undefined;
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
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

  const add = (item: OrderMenuItem) =>
    useCartStore.getState().addItem({ menuItemId: item.id, name: item.name, priceCents: item.priceCents });

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: (count ? 88 : 24) + tabBarInset }}>
        <PhotoHero
          imageUrl={heroImage}
          title="Order"
          meta="Fresh today"
          height={196}
          top={
            <Pressable
              onPress={() => {
                haptics.tap();
                router.push('/(orders)/orders');
              }}
              accessibilityRole="button"
              hitSlop={10}
              style={styles.myOrders}
            >
              <ThemedText type="captionBold" style={{ color: theme.onSurfaceDark }}>
                My orders
              </ThemedText>
            </Pressable>
          }
        />

        <View style={styles.page}>
          <View style={[styles.rule, { backgroundColor: theme.text }]} />
          <ColumnRow label="Pick up" index={1}>
            <View style={styles.pickup}>
              <View style={styles.flex}>
                <ThemedText type="smallBold">{place?.name ?? '…'}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {when}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => {
                  haptics.tap();
                  router.push('/(orders)/order/location');
                }}
                accessibilityRole="button"
                accessibilityLabel="Change where you pick up"
                hitSlop={10}
              >
                <ThemedText type="link">Change</ThemedText>
              </Pressable>
            </View>
          </ColumnRow>

          {menu.isPending && location ? (
            <ActivityIndicator color={theme.text} style={styles.loader} />
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
          ) : null}

          {sections.map((section, index) => {
            const prices = new Set(section.items.map((item) => item.priceCents));
            const shared =
              prices.size === 1 && section.items[0]!.priceCents > 0 ? priceParts(section.items[0]!.priceCents) : null;
            return (
              <View key={section.name}>
                <View style={[styles.hairline, { backgroundColor: theme.border }]} />
                <ColumnRow
                  label={section.name.toUpperCase()}
                  index={index + 2}
                  aside={
                    shared ? (
                      <View
                        style={styles.price}
                        accessible
                        accessibilityLabel={`${formatCents(section.items[0]!.priceCents)} euro each`}
                      >
                        <ThemedText type="subtitle">{shared.euros}</ThemedText>
                        <ThemedText type="micro" style={styles.cents}>
                          {shared.cents}
                        </ThemedText>
                      </View>
                    ) : null
                  }
                >
                  {section.items.map((item, at) => {
                    const open = () => router.push({ pathname: '/(orders)/order/item/[id]', params: { id: item.id } });
                    // With options (a dip, extra protein), Add opens the item's page to pick them.
                    const hasOptions = optionSections.has(item.category ?? '');
                    return (
                      <MenuRow
                        key={item.id}
                        item={item}
                        showPrice={!shared}
                        hasOptions={hasOptions}
                        last={at === section.items.length - 1}
                        onOpen={open}
                        onAdd={hasOptions ? open : () => add(item)}
                      />
                    );
                  })}
                </ColumnRow>
              </View>
            );
          })}
        </View>
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

/** One item: its name (opens it), then Add, or − n + once it's in the cart. */
function MenuRow({
  item,
  showPrice,
  hasOptions,
  last,
  onOpen,
  onAdd,
}: {
  item: OrderMenuItem;
  showPrice: boolean;
  /** Picked on its own page: Add opens it, and the count shows what's in the cart. */
  hasOptions: boolean;
  last: boolean;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const theme = useTheme();
  const quantity = useCartStore((state) =>
    state.items.filter((line) => line.menuItemId === item.id).reduce((sum, line) => sum + line.quantity, 0),
  );
  return (
    <View style={[styles.item, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <Pressable
        onPress={() => {
          haptics.tap();
          onOpen();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${formatCents(item.priceCents)} euro. Open.`}
        style={({ pressed }) => [styles.flex, { opacity: pressed ? 0.6 : 1 }]}
      >
        {/* A section of one, named like its section, needs no second name. */}
        {item.name.toLowerCase() !== item.category?.trim().toLowerCase() ? (
          <ThemedText type="smallBold">{shortItemName(item.name, item.category)}</ThemedText>
        ) : null}
        {showPrice ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {formatCents(item.priceCents)}
          </ThemedText>
        ) : null}
      </Pressable>
      {quantity && hasOptions ? (
        <ThemedText type="captionBold" themeColor="textSecondary">
          {quantity} in cart
        </ThemedText>
      ) : null}
      {quantity && !hasOptions ? (
        <Stepper
          value={quantity}
          min={0}
          label={item.name}
          onChange={(next) => useCartStore.getState().setQuantity(item.id, next)}
        />
      ) : (
        <Pressable
          onPress={() => {
            haptics.press();
            onAdd();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Add ${item.name}`}
          hitSlop={8}
          style={({ pressed }) => [styles.add, { borderColor: theme.text, opacity: pressed ? 0.6 : 1 }]}
        >
          <ThemedText type="captionBold">Add</ThemedText>
        </Pressable>
      )}
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
  myOrders: {
    position: 'absolute',
    top: 14,
    right: PageInset,
  },
  page: {
    paddingHorizontal: PageInset,
    paddingTop: 12,
  },
  rule: {
    height: 3,
  },
  hairline: {
    height: 1,
  },
  pickup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loader: {
    marginVertical: 24,
  },
  message: {
    paddingVertical: 14,
    gap: 8,
  },
  price: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cents: {
    marginTop: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
    paddingVertical: 6,
  },
  add: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  footer: {
    position: 'absolute',
    left: PageInset,
    right: PageInset,
  },
});
