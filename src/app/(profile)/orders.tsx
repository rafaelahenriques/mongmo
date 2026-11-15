import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import MyOrdersScreen from '@/components/order/MyOrdersScreen';

export default function MyOrdersRoute() {
  return (
    <GuestGate copy={JOIN.orders}>
      <MyOrdersScreen />
    </GuestGate>
  );
}
