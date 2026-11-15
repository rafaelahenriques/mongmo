import { Tabs } from 'expo-router/tabs';

import { IconNav, OWNER_TABS, TABS } from '@/components/ui/IconNav';
import { useOwnerView } from '@/hooks/useOwnerView';

/**
 * The four tabs, with the design's icon bar instead of the system one.
 * Customers get Home, Pop-ups, Order and Wallet. Staff get the owner's
 * view: the same four tabs hold Today, Orders, Pop-ups and Menu (each
 * tab's first screen picks which to show), until they switch to the
 * customer's view from Account. Account and Achievements open from the top
 * bar: they're tabs without a button, and back returns to the tab they
 * were opened from. Home opens first because it's the first tab declared
 * (no anchor: tabs with "history" ignore it for back).
 */
export default function AppTabs() {
  const titles = useOwnerView() ? OWNER_TABS : TABS;
  return (
    <Tabs backBehavior="history" tabBar={(props) => <IconNav {...props} />} screenOptions={{ headerShown: false }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: titles.find((other) => other.name === tab.name)?.label ?? tab.label }}
        />
      ))}
      {/* Not hidden (`href: null`): a hidden tab can't be opened, it sends you
          back to the first one. The icon bar only draws its own tabs anyway. */}
      <Tabs.Screen name="(profile)" options={{ title: 'Account' }} />
      <Tabs.Screen name="(achievements)" options={{ title: 'Achievements' }} />
      <Tabs.Screen name="+not-found" options={{ title: 'Not found' }} />
    </Tabs>
  );
}
