import { useLocalSearchParams } from 'expo-router';

import OwnerEventDetailScreen from '@/components/owner/OwnerEventDetailScreen';

export default function OwnerEventDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OwnerEventDetailScreen eventId={typeof id === 'string' ? id : ''} />;
}
