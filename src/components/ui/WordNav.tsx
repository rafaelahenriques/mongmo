import { usePathname } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { isTabBarHidden } from '@/utils/tabBar';

/** The five tabs, in order, with the words the bar shows. */
export const TABS = [
  { name: '(home)', label: 'Home' },
  { name: '(popups)', label: 'Pop-ups' },
  { name: '(orders)', label: 'Order' },
  { name: '(story)', label: 'Story' },
  { name: '(profile)', label: 'Me' },
] as const;

/**
 * The design's tab bar: five words in uppercase Outfit Black on a dark
 * band, the current one underlined. Tapping the current tab again goes
 * back to its first screen.
 */
export function WordNav({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  if (isTabBarHidden(pathname)) return null;

  const current = state.routes[state.index]?.name;
  return (
    <View
      style={[styles.bar, { backgroundColor: theme.surfaceDark, paddingBottom: Math.max(insets.bottom, 10) }]}
      accessibilityRole="tablist"
    >
      {TABS.map((tab) => {
        const route = state.routes.find((candidate) => candidate.name === tab.name);
        if (!route) return null;
        const selected = current === tab.name;
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
            hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
          >
            <ThemedText type="label" style={[{ color: theme.onSurfaceDark }, selected && styles.selected]}>
              {tab.label}
            </ThemedText>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  selected: {
    textDecorationLine: 'underline',
  },
});
