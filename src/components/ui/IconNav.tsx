import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, { Circle, Path } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CardShadow, Radius } from '@/constants/theme';
import { useOwnerView } from '@/hooks/useOwnerView';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { isTabBarHidden } from '@/utils/tabBar';

/**
 * The customer's four tabs, in order. Pop-ups is the logo's Ộ, the app's
 * map pin. Account and achievements sit in the top bar instead (AppHeader).
 */
export const TABS: readonly { name: string; label: string; icon: IconName | 'mark' }[] = [
  { name: '(home)', label: 'Home', icon: 'home' },
  { name: '(popups)', label: 'Pop-ups', icon: 'mark' },
  { name: '(orders)', label: 'Order', icon: 'bag' },
  { name: '(wallet)', label: 'Wallet', icon: 'wallet' },
];

/**
 * The owner's view: the same four tabs hold the owner's screens, in the
 * order of a working day. (wallet) is where the menu is edited.
 */
export const OWNER_TABS: typeof TABS = [
  { name: '(home)', label: 'Today', icon: 'home' },
  { name: '(orders)', label: 'Orders', icon: 'receipt' },
  { name: '(popups)', label: 'Pop-ups', icon: 'mark' },
  { name: '(wallet)', label: 'Menu', icon: 'food' },
];

const ICON = 22;

/**
 * The tab bar: a dark pill floating over the bottom of the screen, an icon
 * over a small word for each tab. The current one sits on a sage pill;
 * the rest are light grey. Tapping the current tab again goes back to its
 * first screen.
 */
export function IconNav({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const ownerView = useOwnerView();
  const tabs = ownerView ? OWNER_TABS : TABS;

  // Switching between the owner's and the customer's view (Account) starts
  // the other one fresh: every tab back on its first screen, so nothing of
  // the old view is left open, and the first tab showing.
  const shownView = useRef(ownerView);
  useEffect(() => {
    if (shownView.current === ownerView) return;
    shownView.current = ownerView;
    // Any screen's navigation speaks for the tabs; its state has each tab's stack.
    const tabsNavigation = descriptors[state.routes[state.index].key]?.navigation;
    for (const route of tabsNavigation?.getState().routes ?? []) {
      const stack = route.state;
      // As the tabs do themselves when a tab is pressed twice.
      if (stack?.key && (stack.index ?? 0) > 0) tabsNavigation.dispatch({ type: 'POP_TO_TOP', target: stack.key });
    }
    const first = state.routes.find((route) => route.name === TABS[0].name);
    if (first) navigateToTab(first.key);
  }, [ownerView, state, descriptors, navigateToTab]);

  if (isTabBarHidden(pathname)) return null;

  const current = state.routes[state.index]?.name;
  return (
    <View style={[styles.dock, { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View
        style={[styles.bar, { backgroundColor: theme.surfaceDark, boxShadow: CardShadow }]}
        accessibilityRole="tablist"
      >
        {tabs.map((tab) => {
          const route = state.routes.find((candidate) => candidate.name === tab.name);
          if (!route) return null;
          const selected = current === tab.name;
          const color = selected ? theme.onBrand : theme.onSurfaceDarkMuted;
          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                // On the current tab, the press event alone takes its stack
                // back to the first screen.
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (event.defaultPrevented) return;
                haptics.select();
                if (!selected) navigateToTab(route.key);
              }}
              accessibilityRole="tab"
              aria-selected={selected}
              accessibilityLabel={tab.label}
              style={[styles.tab, selected && { backgroundColor: theme.brandFill }]}
            >
              <View style={styles.icon}>
                {tab.icon === 'mark' ? (
                  <TabPin color={color} />
                ) : (
                  <Icon name={tab.icon} size={ICON} color={color} weight={selected ? 'medium' : 'regular'} />
                )}
              </View>
              <ThemedText type={selected ? 'captionBold' : 'caption'} style={[styles.word, { color }]}>
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** The logo's Ộ as a tab icon, drawn with the same line weight as the other icons. */
function TabPin({ color }: { color: string }) {
  return (
    <Svg width={(ICON * 34) / 50} height={ICON} viewBox="0 0 34 50">
      <Path
        d="M10.5 9.5 L17 4 L23.5 9.5"
        stroke={color}
        strokeWidth={3.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={17} cy={27} r={11} stroke={color} strokeWidth={3.6} fill="none" />
      <Circle cx={17} cy={45.5} r={3} fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  dock: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: Radius.pill,
    padding: 6,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: Radius.pill,
  },
  icon: {
    height: ICON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: {
    fontSize: 12,
    lineHeight: 15,
  },
});
