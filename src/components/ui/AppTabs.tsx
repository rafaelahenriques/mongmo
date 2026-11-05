import { Tabs } from 'expo-router/tabs';

import { IconNav, TABS } from '@/components/ui/IconNav';

/**
 * The customer's four tabs, with the design's icon bar instead of the
 * system one. Account (and owners' tools through it) and Achievements
 * open from the top bar: they're tabs without a button, and back returns
 * to the tab they were opened from. Home opens first because it's the
 * first tab declared (no anchor: tabs with "history" ignore it for back).
 */
export default function AppTabs() {
  return (
    <Tabs backBehavior="history" tabBar={(props) => <IconNav {...props} />} screenOptions={{ headerShown: false }}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
      {/* Not hidden (`href: null`): a hidden tab can't be opened, it sends you
          back to the first one. The icon bar only draws TABS anyway. */}
      <Tabs.Screen name="(profile)" options={{ title: 'Account' }} />
      <Tabs.Screen name="(achievements)" options={{ title: 'Achievements' }} />
      <Tabs.Screen name="+not-found" options={{ title: 'Not found' }} />
    </Tabs>
  );
}
