import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';

/**
 * Achievements, opened from the trophy in the top bar. No index route:
 * every group's index is "/", and this one would win it from Home.
 */
export default function AchievementsLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="achievements" options={{ headerShown: false, headerTitle: 'Achievements' }} />
    </Stack>
  );
}
