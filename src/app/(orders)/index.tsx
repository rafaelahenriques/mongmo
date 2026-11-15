import MenuScreen from '@/components/order/MenuScreen';
import OwnerOrdersScreen from '@/components/owner/OwnerOrdersScreen';
import { OwnerTab } from '@/components/owner/OwnerTab';
import { useOwnerView } from '@/hooks/useOwnerView';

/** Order (the menu); in the owner's view, the orders board. */
export default function OrdersRoute() {
  if (!useOwnerView()) return <MenuScreen />;
  return (
    <OwnerTab title="Orders">
      <OwnerOrdersScreen />
    </OwnerTab>
  );
}
