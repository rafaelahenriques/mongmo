import { Stack } from 'expo-router';

export default function OrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Orders',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="order/location" options={{ headerTitle: 'Pickup location' }} />
      <Stack.Screen name="order/menu" options={{ headerTitle: 'Menu' }} />
      <Stack.Screen name="order/item/[id]" options={{ headerTitle: 'Item' }} />
      <Stack.Screen name="order/cart" options={{ headerTitle: 'Your cart' }} />
      <Stack.Screen name="order/pickup-time" options={{ headerTitle: 'Pickup time' }} />
      <Stack.Screen name="order/checkout" options={{ headerTitle: 'Checkout' }} />
      <Stack.Screen
        name="order/confirmation"
        options={{ headerTitle: 'Order placed', gestureEnabled: false, headerBackVisible: false }}
      />
      <Stack.Screen name="order/status/[id]" options={{ headerTitle: 'Order status' }} />
    </Stack>
  );
}
