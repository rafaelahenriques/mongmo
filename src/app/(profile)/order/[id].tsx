import { useLocalSearchParams } from 'expo-router';

import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import OrderStatusScreen from '@/components/order/OrderStatusScreen';

/** `/(profile)/order/:id` — an order opened from My orders, in the Account stack. */
export default function AccountOrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <GuestGate copy={JOIN.orders} preview={false}>
      <OrderStatusScreen orderId={typeof id === 'string' ? id : ''} />
    </GuestGate>
  );
}
