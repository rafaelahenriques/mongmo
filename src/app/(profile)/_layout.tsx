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
      <Stack.Screen name="owner/index" options={{ headerTitle: "Owner tools" }} />
      <Stack.Screen name="owner/event/new" options={{ headerTitle: "New event" }} />
      <Stack.Screen name="owner/event/[id]" options={{ headerTitle: "Manage event" }} />
      <Stack.Screen name="owner/orders" options={{ headerTitle: "Orders" }} />
    </Stack>
  );
}
