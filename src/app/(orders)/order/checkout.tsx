import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import CheckoutScreen from '@/components/order/CheckoutScreen';

export default function CheckoutRoute() {
  return (
    <GuestGate copy={JOIN.order} preview={false}>
      <CheckoutScreen />
    </GuestGate>
  );
}
