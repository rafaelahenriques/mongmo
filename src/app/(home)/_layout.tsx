import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Mongmo',
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
