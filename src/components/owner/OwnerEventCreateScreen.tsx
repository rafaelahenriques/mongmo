import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import OwnerEventForm from '@/components/owner/OwnerEventForm';
import { useCreateEvent } from '@/hooks/useOwnerEvent';
import { useTheme } from '@/hooks/useTheme';

/** Owner: create a new pop-up event. */
export default function OwnerEventCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const createEvent = useCreateEvent();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <OwnerEventForm
        submitLabel="Create event"
        pending={createEvent.isPending}
        onSubmit={(input) =>
          createEvent.mutate(input, {
            onSuccess: (id) => router.replace({ pathname: '/(profile)/owner/event/[id]', params: { id } }),
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
