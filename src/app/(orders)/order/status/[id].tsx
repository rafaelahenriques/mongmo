import { useLocalSearchParams } from 'expo-router';

import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import OrderStatusScreen from '@/components/order/OrderStatusScreen';

/** `/order/status/:id` — an order's pickup code and progress. */
export default function OrderStatusRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <GuestGate copy={JOIN.orders} preview={false}>
      <OrderStatusScreen orderId={typeof id === 'string' ? id : ''} />
    </GuestGate>
  );
}
