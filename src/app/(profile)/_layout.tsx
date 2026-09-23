import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "My Profile",
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
