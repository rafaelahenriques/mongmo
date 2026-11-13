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
import { Chapter } from '@/components/ui/Chapter';
import { Icon } from '@/components/ui/Icon';
import { Stepper } from '@/components/ui/Stepper';
import { Toggle } from '@/components/ui/Toggle';
import { orderPoints } from '@/constants/points';
import { PRODUCT_PHOTO_POSITION, productPhoto } from '@/constants/productPhotos';
import { Stickers } from '@/constants/stickers';
import { PageInset, Radius } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useLevel } from '@/hooks/useLevel';
import { useMenu } from '@/hooks/useMenu';
import { usePickupPlace } from '@/hooks/usePickupPlace';
import { useTheme } from '@/hooks/useTheme';
import { confirm, showError } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import { cartSubtotalCents, cartUnitCents, useCartStore, type CartItem } from '@/state/cartStore';
import { formatCents, shortItemName } from '@/utils/orderFormat';
import { discountOff } from '@/utils/rewards';
import { stampsFor, stampsLabel } from '@/utils/stamps';
import { Sticker } from '@/components/ui/Sticker';

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
  const { query, summary, usableRewards, redeemRewardAsync } = useAchievements();
  const level = useLevel();
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
  // Already redeemed (and unused): switch it on. Enough points: switching it
  // on redeems it then and there. Not enough yet: say how far off it is.
  const discount = usableRewards.find(({ reward }) => reward.discountCents);
  const using = Boolean(discount && userRewardId === discount.userRewardId);
  const subtotal = cartSubtotalCents(items);
  const off = using ? discountOff(discount?.reward, subtotal) : 0;
  const offer = (query.data?.rewards ?? [])
    .filter((reward) => reward.discountCents)
    .sort((a, b) => a.costPoints - b.costPoints)[0];
  const affordable = Boolean(offer && summary.points >= offer.costPoints);
  const [redeeming, setRedeeming] = useState(false);

  const onReward = async (on: boolean) => {
    if (!on) {
      useCartStore.getState().setUserRewardId(null);
      return;
    }
    if (discount) {
      useCartStore.getState().setUserRewardId(discount.userRewardId);
      return;
    }
    if (!offer || !affordable) return;
    const yes = await confirm(
      `Use ${stampsLabel(stampsFor(offer.costPoints))} for ${offer.title.toLowerCase()}?`,
      `${offer.costPoints} points come off your balance, and ${formatCents(offer.discountCents ?? 0)} off this order.`,
      'Use it',
    );
    if (!yes) return;
    setRedeeming(true);
    try {
      const id = await redeemRewardAsync(offer.id);
      haptics.success();
      useCartStore.getState().setUserRewardId(id);
    } catch (error) {
      showError('Couldn’t use the reward', error);
    } finally {
      setRedeeming(false);
    }
  };

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

  // The stepper gives the haptic tick itself.
  const step = (line: CartItem, by: number) => {
    useCartStore.getState().setQuantity(line.key, line.quantity + by);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <PickupHeader place={place?.name ?? ''} image={place?.image} onBack={back} />
      {removed ? (
        <View
          style={[styles.undo, { backgroundColor: theme.surfaceDark }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <ThemedText type="small" style={[styles.flex, { color: theme.onSurfaceDark }]}>
            Product removed
          </ThemedText>
          <Pressable
            onPress={undo}
            accessibilityRole="button"
            accessibilityLabel="Undo"
            hitSlop={10}
            style={styles.lineButton}
          >
            <ThemedText type="label" style={{ color: theme.brand }}>
              Undo
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Sticker source={Stickers.openBanhMi} style={styles.emptySticker} />
          <ThemedText type="section">Your cart is empty</ThemedText>
          <Button label="Back to the menu" variant="ghost" size="medium" onPress={back} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Chapter number="01" title="Your order" />
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
                        accessible={false}
                        accessibilityLabel=""
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
                      <Stepper
                        value={line.quantity}
                        min={1}
                        max={20}
                        label={line.name}
                        onChange={(next) => step(line, next - line.quantity)}
                        onRemove={() => remove(line)}
                      />
                    </View>
                  </View>
                </View>
              );
            })}

            {discount || offer ? (
              <View style={[styles.reward, { backgroundColor: theme.backgroundSelected }]}>
                {discount || affordable ? null : <Icon name="lock" size={20} color={theme.textSecondary} />}
                <View style={styles.flex}>
                  <ThemedText type="smallBold" themeColor={discount || affordable ? 'text' : 'textSecondary'}>
                    {discount ? discount.reward.title : (offer?.title ?? '')}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {discount
                      ? using
                        ? `${formatCents(off)} off this order.`
                        : 'Redeemed. Switch it on to use it now.'
                      : offer && affordable
                        ? `Use ${stampsLabel(stampsFor(offer.costPoints))} (${offer.costPoints} points).`
                        : offer
                          ? `At ${stampsLabel(stampsFor(offer.costPoints))}: ${offer.costPoints - summary.points} more points to go.`
                          : ''}
                  </ThemedText>
                </View>
                {discount || affordable ? (
                  <Toggle
                    value={using}
                    disabled={redeeming}
                    onValueChange={(on) => void onReward(on)}
                    accessibilityLabel={discount ? `Use ${discount.reward.title}` : `Use ${offer?.title ?? 'a reward'}`}
                  />
                ) : null}
              </View>
            ) : null}

            <View style={styles.earn}>
              <Icon name="star" size={18} color={theme.text} />
              <ThemedText type="caption" style={styles.flex}>
                {`Earn ${orderPoints(subtotal - off, {
                  firstOrder: level.firstOrderBonus,
                  bonusPct: level.current.orderBonusPct,
                })} points when you pick this up${
                  level.firstOrderBonus
                    ? ': double, it’s your first order'
                    : level.current.orderBonusPct
                      ? `, with ${level.current.name}’s +${level.current.orderBonusPct}%`
                      : ''
                }.`}
              </ThemedText>
            </View>
            <ThemedText type="caption" themeColor="textSecondary">
              Prices include VAT.
            </ThemedText>

            {suggestions.length ? (
              <View style={styles.more}>
                <Chapter number="02" title="You may also like" />
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
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptySticker: {
    width: 140,
    height: 90,
  },
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 16,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  // A rounded photo, like the programme lines on Home and Pop-ups.
  round: {
    width: 72,
    height: 72,
    borderRadius: Radius.large,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  // Each a 44 × 44 target, not just the size of "+1".
  lineButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineActions: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.card,
  },
  earn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
