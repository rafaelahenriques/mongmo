import { useLocalSearchParams } from 'expo-router';

import OrderStatusScreen from '@/components/order/OrderStatusScreen';

/** `/(profile)/order/:id` — an order opened from My orders, in the Account stack. */
export default function AccountOrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrderStatusScreen orderId={typeof id === 'string' ? id : ''} />;
}
