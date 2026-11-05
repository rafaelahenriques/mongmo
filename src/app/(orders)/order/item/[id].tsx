import { useLocalSearchParams } from 'expo-router';

import ItemScreen from '@/components/order/ItemScreen';

/** `/order/item/:id` — one thing on the menu. */
export default function ItemRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ItemScreen itemId={typeof id === 'string' ? id : ''} />;
}
