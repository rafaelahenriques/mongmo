import { useLocalSearchParams } from 'expo-router';

import ChallengesScreen from '@/components/challenges/ChallengesScreen';
import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';

/** `/challenges/:id` — every challenge on a pop-up. */
export default function ChallengesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <GuestGate copy={JOIN.challenges}>
      <ChallengesScreen eventId={typeof id === 'string' ? id : ''} />
    </GuestGate>
  );
}
