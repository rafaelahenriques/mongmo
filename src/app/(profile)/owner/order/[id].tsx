import { useLocalSearchParams } from 'expo-router';

import OwnerOrderDetailScreen from '@/components/owner/OwnerOrderDetailScreen';

/** `/owner/order/:id` — one order, for the counter. */
export default function OwnerOrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OwnerOrderDetailScreen orderId={typeof id === 'string' ? id : ''} />;
}
