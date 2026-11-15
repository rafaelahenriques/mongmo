import { useLocalSearchParams } from 'expo-router';

import OwnerChallengeEditorScreen from '@/components/owner/OwnerChallengeEditorScreen';

export default function NewChallengeRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return <OwnerChallengeEditorScreen eventId={typeof eventId === 'string' ? eventId : ''} />;
}
