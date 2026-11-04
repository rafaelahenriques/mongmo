import { useLocalSearchParams } from 'expo-router';

import CheckInScreen from '@/components/checkin/CheckInScreen';

/** `/check-in/:id` — scan the counter's code for a live pop-up. */
export default function CheckInRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CheckInScreen eventId={typeof id === 'string' ? id : ''} />;
}
