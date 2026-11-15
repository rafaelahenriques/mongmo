import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import CartScreen from '@/components/order/CartScreen';

export default function CartRoute() {
  return (
    <GuestGate copy={JOIN.order} preview={false}>
      <CartScreen />
    </GuestGate>
  );
}
