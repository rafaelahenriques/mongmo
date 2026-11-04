import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Wordmark } from '@/components/brand/Wordmark';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CardShadow, PageInset } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * The top bar on each tab's first screen: the wordmark, then achievements
 * (the trophy) and your account (the person) on the right. Something of
 * the screen's own can sit next to the wordmark (`left`).
 */
export function AppHeader({ left }: { left?: ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { backgroundColor: theme.band, boxShadow: CardShadow, paddingTop: insets.top + 10 }]}>
      <View style={styles.left}>
        <Wordmark height={20} color={theme.bandMark} />
        {left}
      </View>
      <HeaderIcon icon="trophy" label="Achievements" onPress={() => router.push('/(achievements)/achievements')} />
      <HeaderIcon icon="person" label="Account" onPress={() => router.push('/(profile)')} />
    </View>
  );
}

function HeaderIcon({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.icon, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Icon name={icon} size={24} color={theme.onBand} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: PageInset,
    paddingBottom: 10,
    zIndex: 1,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
