import { Stack } from "expo-router";

export default function IndexLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "Café Hunt",
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
