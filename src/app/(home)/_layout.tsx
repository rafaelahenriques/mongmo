import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';

export default function HomeLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, headerTitle: 'Home' }} />
    </Stack>
  );
}
