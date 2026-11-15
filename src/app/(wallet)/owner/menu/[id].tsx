import { useLocalSearchParams } from 'expo-router';

import OwnerMenuItemScreen from '@/components/owner/OwnerMenuItemScreen';

/** `/owner/menu/:id` — edit one item on the menu. */
export default function EditMenuItemRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OwnerMenuItemScreen itemId={typeof id === 'string' ? id : ''} />;
}
