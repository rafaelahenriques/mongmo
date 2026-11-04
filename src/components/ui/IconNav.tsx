import { usePathname } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, { Circle, Path } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { isTabBarHidden } from '@/utils/tabBar';

/**
 * The four tabs, in order. Pop-ups is the logo's Ộ, the app's map pin.
 * Account and achievements sit in the top bar instead (AppHeader).
 */
export const TABS: readonly { name: string; label: string; icon: IconName | 'mark' }[] = [
  { name: '(home)', label: 'Home', icon: 'home' },
  { name: '(popups)', label: 'Pop-ups', icon: 'mark' },
  { name: '(orders)', label: 'Order', icon: 'bag' },
  { name: '(wallet)', label: 'Wallet', icon: 'wallet' },
];

const ICON = 26;

/**
 * The tab bar: an icon over a small word for each tab on a light band.
 * The current one is dark with a sage block tucked behind its icon; the
 * rest are grey. Tapping the current tab again goes back to its first
 * screen.
 */
export function IconNav({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  if (isTabBarHidden(pathname)) return null;

  const current = state.routes[state.index]?.name;
  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, paddingBottom: Math.max(insets.bottom, 8) },
      ]}
      accessibilityRole="tablist"
    >
      {TABS.map((tab) => {
        const route = state.routes.find((candidate) => candidate.name === tab.name);
        if (!route) return null;
        const selected = current === tab.name;
        const color = selected ? theme.text : theme.textSecondary;
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
                <TabPin color={color} fill={selected ? theme.brandFill : undefined} />
              ) : (
                <>
                  {selected ? <View style={[styles.fill, { backgroundColor: theme.brandFill }]} /> : null}
                  {/* Its own layer, so the sage block stays behind the lines. */}
                  <View>
                    <Icon name={tab.icon} size={ICON} color={color} weight={selected ? 'medium' : 'regular'} />
                  </View>
                </>
              )}
            </View>
            <ThemedText type={selected ? 'captionBold' : 'caption'} style={{ color }}>
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * The logo's Ộ as a tab icon, drawn with the same line weight as the
 * other icons; the current tab fills its ring with sage.
 */
function TabPin({ color, fill }: { color: string; fill?: string }) {
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
      <Circle cx={17} cy={27} r={11} stroke={color} strokeWidth={3.6} fill={fill ?? 'none'} />
      <Circle cx={17} cy={45.5} r={3} fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    width: ICON + 4,
    height: ICON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 7,
    right: 7,
    bottom: 3,
    height: 11,
  },
});
