import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import type { OrderMenuItem } from '@/api/orders';
import { PickupHeader } from '@/components/order/PickupHeader';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Stepper } from '@/components/ui/Stepper';
import { Toggle } from '@/components/ui/Toggle';
import { PageInset } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useMenu } from '@/hooks/useMenu';
import { usePickupPlace } from '@/hooks/usePickupPlace';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { cartSubtotalCents, cartUnitCents, useCartStore } from '@/state/cartStore';
import { formatCents, shortItemName } from '@/utils/orderFormat';

/**
 * O-03 Cart: where you pick up on a strip of map, each item with its photo
 * and a sage stepper, a reward to use, two things you may also like, and
 * CHECKOUT with the total.
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

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(orders)'));
  const byId = useMemo(() => new Map((menu.data ?? []).map((item) => [item.id, item])), [menu.data]);
  const optionSections = useMemo(() => new Set((menu.data ?? []).flatMap((item) => item.addOnFor ?? [])), [menu.data]);
  // One thing from each section that's not in the cart yet.
  const suggestions = useMemo(() => {
    const inCart = new Set(items.map((line) => byId.get(line.menuItemId)?.category));
    const picked = new Map<string, OrderMenuItem>();
    for (const item of menu.data ?? []) {
      const section = item.category ?? item.name;
      if (item.priceCents > 0 && !item.addOnFor && !inCart.has(item.category) && !picked.has(section)) {
        picked.set(section, item);
      }
    }
    return [...picked.values()].slice(0, 2);
  }, [menu.data, items, byId]);

  // Only discount rewards come off an order; free items are handed over at pickup.
  const discount = usableRewards.find(({ reward }) => reward.discountCents);
  const using = Boolean(discount && userRewardId === discount.userRewardId);
  const subtotal = cartSubtotalCents(items);
  const off = using && discount ? Math.min(discount.reward.discountCents ?? 0, subtotal) : 0;
  const nextDiscount = (query.data?.rewards ?? [])
    .filter((reward) => reward.discountCents && reward.costPoints > summary.points)
    .sort((a, b) => a.costPoints - b.costPoints)[0];

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <PickupHeader place={place?.name ?? ''} onBack={back} />
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
              // "Bánh mì, crispy pork belly" reads BÁNH MÌ over "Crispy pork belly".
              const short = item ? shortItemName(line.name, item.category) : line.name;
              const titled = short !== line.name && item?.category;
              // "Fried tofu, peanut dip, additional protein"
              const detail = [titled ? short : null, ...line.options.map((option) => option.name.toLowerCase())].filter(
                Boolean,
              );
              return (
                <View key={line.key} style={styles.line}>
                  <View style={[styles.round, { backgroundColor: theme.backgroundSelected }]}>
                    {item?.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Icon name="food" size={22} color={theme.textSecondary} />
                    )}
                  </View>
                  <View style={styles.flex}>
                    <ThemedText type="card">{titled ? item.category : line.name}</ThemedText>
                    {detail.length || item?.description ? (
                      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
                        {detail.length
                          ? detail.join(', ').replace(/^./, (first) => first.toUpperCase())
                          : item?.description}
                      </ThemedText>
                    ) : null}
                  </View>
                  <View style={styles.lineEnd}>
                    <ThemedText type="captionBold">{formatCents(cartUnitCents(line) * line.quantity)}</ThemedText>
                    <Stepper
                      value={line.quantity}
                      min={0}
                      label={line.name}
                      onChange={(next) => useCartStore.getState().setQuantity(line.key, next)}
                    />
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
                <View style={styles.tiles}>
                  {suggestions.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        haptics.press();
                        // One with options (a dip) opens its page to pick them.
                        if (optionSections.has(item.category ?? '')) {
                          router.push({ pathname: '/(orders)/order/item/[id]', params: { id: item.id } });
                          return;
                        }
                        useCartStore
                          .getState()
                          .addItem({ menuItemId: item.id, name: item.name, priceCents: item.priceCents });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${shortItemName(item.name, item.category) !== item.name && item.category ? item.category : item.name}, ${formatCents(item.priceCents)} euro`}
                      style={({ pressed }) => [
                        styles.tile,
                        { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      ) : null}
                      <View style={[styles.tileLabel, { backgroundColor: theme.backgroundElement }]}>
                        <ThemedText type="label" numberOfLines={2} style={styles.flexShrink}>
                          {item.name}
                        </ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">
                          {formatCents(item.priceCents)}
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </View>
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
  flexShrink: {
    flexShrink: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  round: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineEnd: {
    alignItems: 'flex-end',
    gap: 6,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  more: {
    gap: 10,
  },
  tiles: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  tileLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
