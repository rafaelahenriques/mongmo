import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { Radius, Spacing } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { usePlaceOrder } from '@/hooks/usePlaceOrder';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { useCartStore, cartSubtotalCents } from '@/state/cartStore';
import { formatCents } from '@/utils/orderFormat';

/**
 * Order flow, step 5: mock/test payment — clearly labelled as a prototype
 * per AGENTS.md. The server computes the real total; this screen only
 * shows the client's own subtotal estimate before that happens.
 */
export default function OrderCheckoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const location = useCartStore((state) => state.location);
  const items = useCartStore((state) => state.items);
  const pickupAt = useCartStore((state) => state.pickupAt);
  const placeOrder = usePlaceOrder();
  const { usableRewards } = useAchievements();
  const [error, setError] = useState<string | null>(null);
  const [rewardId, setRewardId] = useState<string | null>(null);

  if (!location || items.length === 0) return null;

  // Only discount rewards apply to an order; free items are shown at pickup.
  const discounts = usableRewards.filter(({ reward }) => reward.discountCents);
  const chosen = discounts.find((entry) => entry.userRewardId === rewardId);
  const subtotal = cartSubtotalCents(items);
  const discount = Math.min(chosen?.reward.discountCents ?? 0, subtotal);

  const onPay = () => {
    setError(null);
    placeOrder.mutate(
      {
        location,
        items: items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
        pickupAt,
        userRewardId: chosen?.userRewardId ?? null,
      },
      {
        onSuccess: (order) => {
          haptics.success();
          router.replace({ pathname: '/(orders)/order/confirmation', params: { id: order.id } });
        },
        onError: (mutationError) => {
          haptics.error();
          setError(mutationError instanceof Error ? mutationError.message : 'Something went wrong.');
        },
      },
    );
  };

  const pickupLabel = pickupAt
    ? `Pickup at ${new Date(pickupAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    : 'Pickup as soon as possible';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Checkout</ThemedText>
        <View style={styles.chips}>
          <Chip label={location.type === 'event' ? location.eventTitle : 'Mongmo café'} icon={location.type === 'event' ? 'takeout' : 'store'} />
          <Chip label={pickupLabel} icon="clock" />
        </View>

        <Card style={styles.receipt}>
          {items.map((item) => (
            <View key={item.menuItemId} style={styles.row}>
              <ThemedText type="small" style={styles.rowName}>
                <ThemedText type="smallBold">{item.quantity}×</ThemedText> {item.name}
              </ThemedText>
              <ThemedText type="small">{formatCents(item.priceCents * item.quantity)}</ThemedText>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          {chosen ? (
            <View style={styles.row}>
              <ThemedText type="small" style={styles.rowName}>
                {chosen.reward.title}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="success">
                −{formatCents(discount)}
              </ThemedText>
            </View>
          ) : null}
          <View style={[styles.row, styles.totalRow]}>
            <ThemedText type="smallBold">Estimated total</ThemedText>
            <ThemedText type="subtitle">{formatCents(subtotal - discount)}</ThemedText>
          </View>
        </Card>

        {discounts.length > 0 ? (
          <View style={styles.rewards} accessibilityRole="radiogroup" accessibilityLabel="Use a reward">
            <ThemedText type="section">Use a reward</ThemedText>
            {discounts.map(({ userRewardId, reward }) => {
              const selected = userRewardId === rewardId;
              return (
                <Pressable
                  key={userRewardId}
                  onPress={() => {
                    haptics.select();
                    setRewardId(selected ? null : userRewardId);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Use ${reward.title}`}
                  style={[
                    styles.reward,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: selected ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  <Icon name="ticket" size={20} color={theme.text} />
                  <ThemedText type="smallBold" style={styles.rowName}>
                    {reward.title}
                  </ThemedText>
                  <Icon name={selected ? 'checkCircle' : 'add'} size={20} color={selected ? theme.success : theme.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={[styles.notice, { backgroundColor: theme.accent }]}>
          <Icon name="lock" size={16} color={theme.onAccent} />
          <ThemedText type="small" style={[styles.noticeText, { color: theme.onAccent }]}>
            Prototype payment — no real card is charged.
          </ThemedText>
        </View>

        {error ? (
          <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
            {error}
          </ThemedText>
        ) : null}
      </ScrollView>

      <ScreenFooter>
        <Button
          label="Place order"
          accessibilityLabel="Place order with prototype payment"
          variant="brand"
          icon="checkCircle"
          haptic="press"
          onPress={onPay}
          loading={placeOrder.isPending}
        />
      </ScreenFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
  },
  receipt: {
    gap: Spacing.two + Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowName: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  totalRow: {
    alignItems: 'baseline',
  },
  rewards: {
    gap: Spacing.two,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 2,
    padding: Spacing.three,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 16,
    padding: Spacing.three,
  },
  noticeText: {
    flex: 1,
  },
});
