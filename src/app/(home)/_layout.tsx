import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';

export default function HomeLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, headerTitle: 'Home' }} />
      <Stack.Screen name="notifications" options={{ headerTitle: 'Notifications' }} />
      {/* The owner's view: Today's own pages. */}
      <Stack.Screen name="owner/photos" options={{ headerTitle: 'Photos of the week' }} />
      <Stack.Screen name="owner/reports" options={{ headerTitle: 'Reported photos' }} />
    </Stack>
  );
}
