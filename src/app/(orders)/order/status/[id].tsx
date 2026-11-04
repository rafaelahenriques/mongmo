import { useLocalSearchParams } from 'expo-router';

import OrderStatusScreen from '@/components/order/OrderStatusScreen';

/** `/order/status/:id` — an order's pickup code and progress. */
export default function OrderStatusRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrderStatusScreen orderId={typeof id === 'string' ? id : ''} />;
}
