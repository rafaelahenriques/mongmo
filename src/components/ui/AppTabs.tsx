import { Tabs } from 'expo-router/tabs';

import { IconNav, TABS } from '@/components/ui/IconNav';

/**
 * The customer's four tabs, with the design's icon bar instead of the
 * system one. Account (and owners' tools through it) and Achievements
 * open from the top bar: they're tabs without a button, and back returns
 * to the tab they were opened from.
 */
export default function AppTabs() {
  return (
    <Tabs
      initialRouteName="(home)"
      backBehavior="history"
      tabBar={(props) => <IconNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
      <Tabs.Screen name="(profile)" options={{ title: 'Account', href: null }} />
      <Tabs.Screen name="(achievements)" options={{ title: 'Achievements', href: null }} />
      <Tabs.Screen name="+not-found" options={{ href: null }} />
    </Tabs>
  );
}
