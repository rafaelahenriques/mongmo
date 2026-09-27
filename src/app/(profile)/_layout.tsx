import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';

export default function ProfileLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, headerTitle: 'Profile' }} />
      <Stack.Screen name="edit" options={{ headerTitle: 'Edit profile' }} />
      <Stack.Screen name="achievements" options={{ headerTitle: 'Achievements' }} />
      <Stack.Screen name="owner/index" options={{ headerTitle: 'Owner tools' }} />
      <Stack.Screen name="owner/events" options={{ headerTitle: 'Manage pop-ups' }} />
      <Stack.Screen name="owner/event/new" options={{ headerTitle: 'New pop-up' }} />
      <Stack.Screen name="owner/event/[id]" options={{ headerTitle: 'Manage pop-up' }} />
      <Stack.Screen name="owner/challenge/new" options={{ headerTitle: 'New challenge' }} />
      <Stack.Screen name="owner/challenge/[id]" options={{ headerTitle: 'Edit challenge' }} />
      <Stack.Screen name="owner/orders" options={{ headerTitle: 'Orders' }} />
    </Stack>
  );
}
