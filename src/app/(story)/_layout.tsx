import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';

export default function StoryLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, headerTitle: 'Story' }} />
    </Stack>
  );
}
