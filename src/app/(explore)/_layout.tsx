import { Stack } from 'expo-router';

export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Explore',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="event/[id]" options={{ headerTitle: 'Event' }} />
    </Stack>
  );
}
