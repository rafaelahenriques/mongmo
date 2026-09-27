import { Stack } from 'expo-router';

export default function PopupsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Pop-ups',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="event/[id]" options={{ headerTitle: 'Event' }} />
    </Stack>
  );
}
