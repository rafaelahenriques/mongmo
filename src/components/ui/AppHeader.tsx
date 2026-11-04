import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Wordmark } from '@/components/brand/Wordmark';
import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ScreenReaderTitle } from '@/components/ui/ScreenReaderTitle';
import { CardShadow, PageInset } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * The top bar on each tab's first screen: the wordmark (with the screen's
 * name for screen readers), then your points
 * in a pill (to Wallet), achievements (the trophy) and your account (the
 * person) on the right. Something of the screen's own can sit next to the
 * wordmark (`left`).
 */
export function AppHeader({ title, left }: { title: string; left?: ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const points = useAchievements().summary.points;

  return (
    <View style={[styles.bar, { backgroundColor: theme.band, boxShadow: CardShadow, paddingTop: insets.top + 10 }]}>
      <View style={styles.left}>
        <Wordmark height={28} color={theme.bandMark} />
        {/* The screen's name for screen readers (its h1): the bar shows the logo. */}
        <ScreenReaderTitle>{title}</ScreenReaderTitle>
        {left}
      </View>
      <Pressable
        onPress={() => {
          haptics.tap();
          router.navigate('/(wallet)');
        }}
        accessibilityRole="button"
        accessibilityLabel={`${points} points. Open Wallet.`}
        hitSlop={6}
        style={({ pressed }) => [styles.pill, { backgroundColor: theme.onBand, opacity: pressed ? 0.7 : 1 }]}
      >
        <Icon name="star" size={14} color={theme.band} weight="bold" />
        <ThemedText type="smallBold" style={{ color: theme.band }}>
          {points}
        </ThemedText>
      </Pressable>
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 4,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
