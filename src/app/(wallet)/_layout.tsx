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
    </Stack>
  );
}
