import { useLocalSearchParams } from 'expo-router';

import ChallengesScreen from '@/components/challenges/ChallengesScreen';

/** `/challenges/:id` — every challenge on a pop-up. */
export default function ChallengesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChallengesScreen eventId={typeof id === 'string' ? id : ''} />;
}
