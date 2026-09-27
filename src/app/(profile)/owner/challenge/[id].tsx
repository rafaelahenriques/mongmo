import { useLocalSearchParams } from 'expo-router';

import OwnerChallengeEditorScreen from '@/components/owner/OwnerChallengeEditorScreen';

export default function EditChallengeRoute() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  return (
    <OwnerChallengeEditorScreen
      eventId={typeof eventId === 'string' ? eventId : ''}
      challengeId={typeof id === 'string' ? id : undefined}
    />
  );
}
