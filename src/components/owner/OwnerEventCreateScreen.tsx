import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import OwnerEventForm from '@/components/owner/OwnerEventForm';
import { Spacing } from '@/constants/theme';
import { useCreateEvent } from '@/hooks/useOwnerEvent';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';

/** Owner: create a new pop-up, then land on its manage screen (QR, menu, challenges). */
export default function OwnerEventCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const createEvent = useCreateEvent();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + Spacing.five }]}
        keyboardShouldPersistTaps="handled"
      >
        <OwnerEventForm
          submitLabel="Create pop-up"
          pending={createEvent.isPending}
          submitError={createEvent.error?.message}
          onSubmit={(input) =>
            createEvent.mutate(input, {
              onSuccess: (id) => router.replace({ pathname: '/(profile)/owner/event/[id]', params: { id } }),
            })
          }
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three + Spacing.one,
  },
});
