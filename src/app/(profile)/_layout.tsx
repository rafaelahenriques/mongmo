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
      <Stack.Screen name="owner/events" options={{ headerTitle: "Manage pop-ups" }} />
      <Stack.Screen name="owner/event/new" options={{ headerTitle: "New pop-up" }} />
      <Stack.Screen name="owner/event/[id]" options={{ headerTitle: "Manage pop-up" }} />
      <Stack.Screen name="owner/orders" options={{ headerTitle: "Orders" }} />
    </Stack>
  );
}
