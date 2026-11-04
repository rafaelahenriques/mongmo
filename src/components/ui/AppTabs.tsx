import { Tabs } from 'expo-router/tabs';

import { IconNav, TABS } from '@/components/ui/IconNav';

/**
 * The customer's four tabs (owners reach their tools through Me), with the
 * design's icon bar instead of the system one.
 */
export default function AppTabs() {
  return (
    <Tabs initialRouteName="(home)" tabBar={(props) => <IconNav {...props} />} screenOptions={{ headerShown: false }}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
      <Tabs.Screen name="+not-found" options={{ href: null }} />
    </Tabs>
  );
}
