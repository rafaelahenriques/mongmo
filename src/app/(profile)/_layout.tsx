import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "Profile",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="achievements" options={{ headerTitle: "Achievements" }} />
    </Stack>
  );
}
