import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';

export default function WalletLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, headerTitle: 'Wallet' }} />
      <Stack.Screen name="card" options={{ headerTitle: 'Membership card' }} />
      <Stack.Screen name="history" options={{ headerTitle: 'Points' }} />
      <Stack.Screen name="levels" options={{ headerTitle: 'Levels' }} />
      {/* The owner's view: this tab is Menu. */}
      <Stack.Screen name="owner/menu/new" options={{ headerTitle: 'New item' }} />
      <Stack.Screen name="owner/menu/limits" options={{ headerTitle: 'How many a day' }} />
      <Stack.Screen name="owner/menu/[id]" options={{ headerTitle: 'Edit item' }} />
    </Stack>
  );
}
