import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { formatInTimeZone } from 'date-fns-tz';

import { getOrderLines } from '@/api/orders';
import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { TaskCard } from '@/components/ui/TaskCard';
import { PageInset } from '@/constants/theme';
import { useMyOrders } from '@/hooks/useMyOrders';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { nameFromContent } from '@/utils/a11y';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';
import { formatCents, ORDER_STATUS_TITLE, pickupCode } from '@/utils/orderFormat';

const ACTIVE = ['paid', 'preparing', 'ready'];

/**
 * O-06 My orders: the one on its way in a stone block, then the history.
 * Each opens its status, where a past one can be ordered again.
 */
export default function MyOrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const orders = useMyOrders();
  const all = orders.data ?? [];
  const lines = useQuery({
    queryKey: ['orders', 'lines', all.map((order) => order.id).join(',')],
    queryFn: () => getOrderLines(all.map((order) => order.id)),
    enabled: all.length > 0,
  });

  const open = (id: string) => router.push({ pathname: '/(profile)/order/[id]', params: { id } });
  const current = all.filter((order) => ACTIVE.includes(order.status));
  const past = all.filter((order) => !ACTIVE.includes(order.status));
  const time = (iso: string) => formatInTimeZone(iso, DISPLAY_TIME_ZONE, 'HH:mm');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: tabBarInset + 32 }}
    >
      {current.map((order) => (
        <Pressable
          key={order.id}
          onPress={() => {
            haptics.tap();
            open(order.id);
          }}
          accessibilityRole="button"
          {...nameFromContent(`${ORDER_STATUS_TITLE[order.status]}, pickup code ${pickupCode(order.id)}. Open.`)}
          style={[styles.current, { backgroundColor: theme.backgroundSelected }]}
        >
          <View style={styles.flex}>
            <ThemedText type="title">{ORDER_STATUS_TITLE[order.status]}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {[
                pickupCode(order.id),
                formatCents(order.total_cents),
                order.pickup_at ? `Pick up at ${time(order.pickup_at)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
          </View>
          <View style={[styles.arrow, { backgroundColor: theme.brandFill }]}>
            <Icon name="chevronRight" size={18} color={theme.onBrand} weight="semibold" />
          </View>
        </Pressable>
      ))}

      <View style={styles.page}>
        <ThemedText type="subtitle" accessibilityRole="header">
          History
        </ThemedText>
        {orders.isPending ? (
          <ActivityIndicator accessibilityLabel="Loading" color={theme.text} style={styles.loader} />
        ) : orders.isError ? (
          <ThemedText type="caption" themeColor="textSecondary">
            Couldn’t load your orders.
          </ThemedText>
        ) : past.length === 0 ? (
          <ThemedText type="caption" themeColor="textSecondary">
            No past orders yet. Your first one will show up here.
          </ThemedText>
        ) : (
          past.map((order) => (
            <TaskCard
              key={order.id}
              icon="receipt"
              title={formatInTimeZone(order.created_at, DISPLAY_TIME_ZONE, 'EEE d MMM')}
              subtitle={[
                (lines.data?.[order.id] ?? []).join(', ') || null,
                order.status === 'cancelled' ? 'Cancelled' : formatCents(order.total_cents),
              ]
                .filter(Boolean)
                .join(' · ')}
              state="arrow"
              onPress={() => open(order.id)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: PageInset,
    paddingVertical: 16,
    marginBottom: 6,
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    paddingHorizontal: PageInset,
    paddingTop: 12,
    gap: 8,
  },
  loader: {
    marginVertical: 24,
  },
});
