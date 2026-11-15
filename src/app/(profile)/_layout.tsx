import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';

export default function ProfileLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, headerTitle: 'Account' }} />
      <Stack.Screen name="edit" options={{ headerTitle: 'Edit profile' }} />
      <Stack.Screen name="settings" options={{ headerTitle: 'Settings' }} />
      <Stack.Screen name="password" options={{ headerTitle: 'Change password' }} />
      <Stack.Screen name="your-data" options={{ headerTitle: 'Your data' }} />
      <Stack.Screen name="privacy" options={{ headerTitle: 'Privacy policy' }} />
      <Stack.Screen name="terms" options={{ headerTitle: 'Terms of use' }} />
      {/* My orders lives under Account: opening it never switches you to the Order tab. */}
      <Stack.Screen name="orders" options={{ headerTitle: 'My orders' }} />
      <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
