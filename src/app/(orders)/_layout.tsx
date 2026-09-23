import { Stack } from "expo-router";

export default function OrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "My Orders",
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
