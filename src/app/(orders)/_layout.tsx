import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';

export default function OrdersLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, headerTitle: 'Order' }} />
      <Stack.Screen name="orders" options={{ headerTitle: 'My orders' }} />
      <Stack.Screen name="order/location" options={{ headerTitle: 'Pick up at' }} />
      <Stack.Screen name="order/category/[name]" options={{ headerShown: false }} />
      <Stack.Screen name="order/item/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="order/cart" options={{ headerShown: false }} />
      <Stack.Screen name="order/checkout" options={{ headerShown: false }} />
      <Stack.Screen name="order/status/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
