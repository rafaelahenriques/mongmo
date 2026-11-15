import { useLocalSearchParams } from 'expo-router';

import CheckInScreen from '@/components/checkin/CheckInScreen';
import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';

/** `/check-in/:id` — scan the counter's code for a live pop-up. Not for guests: it would open the camera. */
export default function CheckInRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <GuestGate copy={JOIN.checkIn} preview={false}>
      <CheckInScreen eventId={typeof id === 'string' ? id : ''} />
    </GuestGate>
  );
}
