import { Stack } from 'expo-router';

export default function IndexLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Mongmo',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="event/[id]" options={{ headerTitle: 'Event' }} />
    </Stack>
  );
}
