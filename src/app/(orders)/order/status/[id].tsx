import { useLocalSearchParams } from 'expo-router';

import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import OrderStatusScreen from '@/components/order/OrderStatusScreen';

/** `/order/status/:id` — an order's pickup code and progress (`?placed=1` straight after checkout). */
export default function OrderStatusRoute() {
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  return (
    <GuestGate copy={JOIN.orders} preview={false}>
      <OrderStatusScreen orderId={typeof id === 'string' ? id : ''} justPlaced={placed === '1'} />
    </GuestGate>
  );
}
