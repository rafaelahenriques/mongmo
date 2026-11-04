import { usePathname } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OMark } from '@/components/brand/OMark';
import { Icon, type IconName } from '@/components/ui/Icon';
import { paperAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { isTabBarHidden } from '@/utils/tabBar';

/**
 * The four tabs, in order. Pop-ups is the logo's Ộ, the app's map pin;
 * the label is what a screen reader says.
 */
export const TABS: readonly { name: string; label: string; icon: IconName | 'mark' }[] = [
  { name: '(home)', label: 'Home', icon: 'home' },
  { name: '(popups)', label: 'Pop-ups', icon: 'mark' },
  { name: '(orders)', label: 'Order', icon: 'bag' },
  { name: '(profile)', label: 'Me', icon: 'person' },
];

const ICON = 24;

/**
 * The tab bar: four icons on a dark band, the current one bright with a
 * short rule under it, the rest faded. Tapping the current tab again goes
 * back to its first screen.
 */
export function IconNav({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  if (isTabBarHidden(pathname)) return null;

  const current = state.routes[state.index]?.name;
  return (
    <View
      style={[styles.bar, { backgroundColor: theme.surfaceDark, paddingBottom: Math.max(insets.bottom, 8) }]}
      accessibilityRole="tablist"
    >
      {TABS.map((tab) => {
        const route = state.routes.find((candidate) => candidate.name === tab.name);
        if (!route) return null;
        const selected = current === tab.name;
        const color = selected ? theme.onSurfaceDark : paperAlpha(0.55);
        return (
          <Pressable
            key={tab.name}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (event.defaultPrevented) return;
              haptics.select();
              if (selected) navigation.navigate(route.name, { screen: 'index' });
              else navigation.navigate(route.name);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            style={styles.tab}
          >
            <View style={styles.icon}>
              {tab.icon === 'mark' ? (
                <OMark height={ICON + 2} color={color} variant={selected ? 'solid' : 'outline'} />
              ) : (
                <Icon name={tab.icon} size={ICON} color={color} weight={selected ? 'semibold' : 'regular'} />
              )}
            </View>
            <View style={[styles.rule, { backgroundColor: selected ? theme.onSurfaceDark : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  icon: {
    height: ICON + 2,
    justifyContent: 'center',
  },
  rule: {
    width: 18,
    height: 2,
  },
});
