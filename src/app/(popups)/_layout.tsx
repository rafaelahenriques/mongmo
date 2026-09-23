import { Stack } from "expo-router";

export default function PopupsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "Upcoming Pop-ups",
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
