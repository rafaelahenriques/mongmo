import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';

export default function PopupsLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, headerTitle: 'Pop-ups' }} />
      <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="check-in/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="challenges/[id]" options={{ headerShown: false }} />
      {/* The owner's view: running a pop-up and its challenges. */}
      <Stack.Screen name="owner/event/new" options={{ headerTitle: 'New pop-up' }} />
      <Stack.Screen name="owner/event/[id]" options={{ headerTitle: 'Manage pop-up' }} />
      <Stack.Screen name="owner/challenge/new" options={{ headerTitle: 'New challenge' }} />
      <Stack.Screen name="owner/challenge/[id]" options={{ headerTitle: 'Edit challenge' }} />
    </Stack>
  );
}
