import { Tabs } from 'expo-router/tabs';

import { TABS, WordNav } from '@/components/ui/WordNav';

/**
 * The customer's five tabs (owners reach their tools through Me), with the
 * design's word tab bar instead of the system one.
 */
export default function AppTabs() {
  return (
    <Tabs
      initialRouteName="(home)"
      tabBar={(props) => <WordNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
      <Tabs.Screen name="+not-found" options={{ href: null }} />
    </Tabs>
  );
}
