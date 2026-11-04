import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import type { OrderMenuItem } from '@/api/orders';
import { CategoryIcon } from '@/components/order/CategoryIcon';
import { PickupHeader } from '@/components/order/PickupHeader';
import { ProductCard } from '@/components/order/ProductCard';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Toggle } from '@/components/ui/Toggle';
import { PRODUCT_PHOTO_POSITION, productPhoto } from '@/constants/productPhotos';
import { PageInset } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useMenu } from '@/hooks/useMenu';
import { usePickupPlace } from '@/hooks/usePickupPlace';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { cartSubtotalCents, cartUnitCents, useCartStore, type CartItem } from '@/state/cartStore';
import { formatCents, shortItemName } from '@/utils/orderFormat';

/** How long "Product removed · UNDO" stays up. */
const UNDO_MS = 4000;

/**
 * The cart: where you pick up on a strip of map, each line with its photo,
 * options and price, a bin (or −1) and +1; "Product removed · UNDO" after
 * a bin; a reward to use; things you may also like; CHECKOUT with the total.
 */
export default function CartScreen() {
  const theme = useTheme();
  const router = useRouter();
  const location = useCartStore((state) => state.location);
  const items = useCartStore((state) => state.items);
  const userRewardId = useCartStore((state) => state.userRewardId);
  const place = usePickupPlace();
  const menu = useMenu(location);
  const { query, summary, usableRewards } = useAchievements();
  const [removed, setRemoved] = useState<{ line: CartItem; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(orders)'));
  const byId = useMemo(() => new Map((menu.data ?? []).map((item) => [item.id, item])), [menu.data]);
  // Something from the sections that aren't in the cart yet.
  const suggestions = useMemo(() => {
    const inCart = new Set(items.map((line) => byId.get(line.menuItemId)?.category));
    return (menu.data ?? [])
      .filter((item) => item.priceCents > 0 && !item.addOnFor && !inCart.has(item.category))
      .slice(0, 6);
  }, [menu.data, items, byId]);

  // Only discount rewards come off an order; free items are handed over at pickup.
  const discount = usableRewards.find(({ reward }) => reward.discountCents);
  const using = Boolean(discount && userRewardId === discount.userRewardId);
  const subtotal = cartSubtotalCents(items);
  const off = using && discount ? Math.min(discount.reward.discountCents ?? 0, subtotal) : 0;
  const nextDiscount = (query.data?.rewards ?? [])
    .filter((reward) => reward.discountCents && reward.costPoints > summary.points)
    .sort((a, b) => a.costPoints - b.costPoints)[0];

  const remove = (line: CartItem) => {
    haptics.press();
    const index = items.findIndex((row) => row.key === line.key);
    useCartStore.getState().removeItem(line.key);
    setRemoved({ line, index });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), UNDO_MS);
  };

  const undo = () => {
    if (!removed) return;
    haptics.tap();
    useCartStore.getState().restoreItem(removed.line, removed.index);
    setRemoved(null);
  };

  const step = (line: CartItem, by: number) => {
    haptics.select();
    useCartStore.getState().setQuantity(line.key, line.quantity + by);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <PickupHeader place={place?.name ?? ''} onBack={back} />
      {removed ? (
        <View
          style={[styles.undo, { backgroundColor: theme.surfaceDark }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <ThemedText type="small" style={[styles.flex, { color: theme.onSurfaceDark }]}>
            Product removed
          </ThemedText>
          <Pressable onPress={undo} accessibilityRole="button" accessibilityLabel="Undo" hitSlop={10}>
            <ThemedText type="label" style={{ color: theme.brand }}>
              Undo
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
      {items.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText type="section">Your cart is empty</ThemedText>
          <Button label="Back to the menu" variant="ghost" size="medium" onPress={back} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            {items.map((line) => {
              const item = byId.get(line.menuItemId);
              const photo = item ? productPhoto(item) : undefined;
              // "Bánh mì, crispy pork belly" reads BÁNH MÌ over "Crispy pork belly".
              const short = item ? shortItemName(line.name, item.category) : line.name;
              const titled = short !== line.name && item?.category;
              const detail = [titled ? short : null, ...line.options.map((option) => option.name.toLowerCase())].filter(
                Boolean,
              );
              return (
                <View key={line.key} style={[styles.line, { borderBottomColor: theme.border }]}>
                  <View style={[styles.round, { backgroundColor: theme.backgroundSelected }]}>
                    {photo ? (
                      <Image
                        source={photo}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        contentPosition={PRODUCT_PHOTO_POSITION}
                      />
                    ) : (
                      <CategoryIcon section={item?.category ?? line.name} size={30} />
                    )}
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.lineTop}>
                      <ThemedText type="card" style={styles.flex}>
                        {line.quantity > 1 ? `${line.quantity} × ` : ''}
                        {titled ? item.category : line.name}
                      </ThemedText>
                      <ThemedText type="captionBold">{formatCents(cartUnitCents(line) * line.quantity)}</ThemedText>
                    </View>
                    {detail.length || item?.description ? (
                      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
                        {detail.length
                          ? detail.join(', ').replace(/^./, (first) => first.toUpperCase())
                          : item?.description}
                      </ThemedText>
                    ) : null}
                    <View style={styles.lineActions}>
                      {line.quantity > 1 ? (
                        <Pressable
                          onPress={() => step(line, -1)}
                          accessibilityRole="button"
                          accessibilityLabel={`One less ${line.name}`}
                          hitSlop={10}
                        >
                          <ThemedText type="captionBold" themeColor="primaryText">
                            −1
                          </ThemedText>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => remove(line)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${line.name}`}
                          hitSlop={10}
                        >
                          <Icon name="trash" size={18} color={theme.textSecondary} />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => step(line, 1)}
                        accessibilityRole="button"
                        accessibilityLabel={`One more ${line.name}`}
                        hitSlop={10}
                      >
                        <ThemedText type="captionBold" themeColor="primaryText">
                          +1
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}

            {discount || nextDiscount ? (
              <View style={[styles.reward, { borderColor: theme.border }]}>
                <View style={styles.flex}>
                  <ThemedText type="smallBold">Use a reward</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {discount
                      ? `${discount.reward.title}: −${formatCents(discount.reward.discountCents ?? 0)}`
                      : nextDiscount
                        ? `${nextDiscount.title} for ${nextDiscount.costPoints} points. ${nextDiscount.costPoints - summary.points} more to go.`
                        : ''}
                  </ThemedText>
                </View>
                <Toggle
                  value={using}
                  disabled={!discount}
                  onValueChange={(on) =>
                    useCartStore.getState().setUserRewardId(on && discount ? discount.userRewardId : null)
                  }
                  accessibilityLabel="Use a reward"
                />
              </View>
            ) : null}

            {suggestions.length ? (
              <View style={styles.more}>
                <ThemedText type="subtitle" accessibilityRole="header">
                  You may also like
                </ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.moreRow}
                  contentContainerStyle={styles.moreCards}
                >
                  {suggestions.map((item: OrderMenuItem) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      withSection
                      style={styles.moreCard}
                      onPress={() => router.push({ pathname: '/(orders)/order/item/[id]', params: { id: item.id } })}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </ScrollView>
          <BlockButton
            label="Checkout"
            value={formatCents(subtotal - off)}
            onPress={() => router.push('/(orders)/order/checkout')}
            bottomInset
          />
        </>
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
    minWidth: 0,
  },
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 14,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  round: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  lineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 22,
    marginTop: 6,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    paddingBottom: 14,
  },
  more: {
    gap: 12,
  },
  moreRow: {
    marginHorizontal: -PageInset,
    flexGrow: 0,
  },
  moreCards: {
    gap: 12,
    paddingHorizontal: PageInset,
    paddingBottom: 8,
  },
  moreCard: {
    width: 168,
  },
});
