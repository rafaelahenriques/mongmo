import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';

export default function OrdersLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false, headerTitle: 'Orders' }} />
      <Stack.Screen name="order/location" options={{ headerTitle: 'New order' }} />
      <Stack.Screen name="order/menu" options={{ headerTitle: 'Menu' }} />
      <Stack.Screen name="order/item/[id]" options={{ headerTitle: '' }} />
      <Stack.Screen name="order/cart" options={{ headerTitle: 'Your cart' }} />
      <Stack.Screen name="order/pickup-time" options={{ headerTitle: 'Pickup time' }} />
      <Stack.Screen name="order/checkout" options={{ headerTitle: 'Checkout' }} />
      <Stack.Screen
        name="order/confirmation"
        options={{ headerTitle: '', gestureEnabled: false, headerBackVisible: false }}
      />
      <Stack.Screen name="order/status/[id]" options={{ headerTitle: 'Order status' }} />
    </Stack>
  );
}
