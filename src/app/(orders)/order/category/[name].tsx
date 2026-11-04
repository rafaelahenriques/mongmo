import { useLocalSearchParams } from 'expo-router';

import CategoryScreen from '@/components/order/CategoryScreen';

/** `/order/category/:name` — one section of the menu. */
export default function CategoryRoute() {
  const { name } = useLocalSearchParams<{ name: string }>();
  return <CategoryScreen name={typeof name === 'string' ? name : ''} />;
}
