import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Wordmark } from '@/components/brand/Wordmark';
import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ScreenReaderTitle } from '@/components/ui/ScreenReaderTitle';
import { PageInset, Radius } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useOwnerView } from '@/hooks/useOwnerView';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * The top bar on each tab's first screen, on the page itself: the sage
 * wordmark (with the screen's name for screen readers), then your points
 * in a dark pill (to Wallet), achievements (the trophy) and your account
 * (the person) in round stone buttons on the right. Something of the screen's own can sit next to the
 * wordmark (`left`).
 *
 * In the owner's view the bar says so ("Owner") and keeps only the
 * account button: points and achievements are the customer's.
 */
export function AppHeader({ title, left }: { title: string; left?: ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const points = useAchievements().summary.points;
  const ownerView = useOwnerView();

  if (ownerView) {
    return (
      <View style={[styles.bar, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.left}>
          <Wordmark height={28} color={theme.brand} />
          <ScreenReaderTitle>{title}</ScreenReaderTitle>
          <View style={[styles.tag, { backgroundColor: theme.surfaceDark }]}>
            <ThemedText type="captionBold" style={{ color: theme.onSurfaceDark }}>
              Owner
            </ThemedText>
          </View>
        </View>
        <HeaderIcon icon="person" label="Account" onPress={() => router.push('/(profile)')} />
      </View>
    );
  }

  return (
    <View style={[styles.bar, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
      <View style={styles.left}>
        <Wordmark height={28} color={theme.brand} />
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
        // Points are a reward: cream, like the points card in Wallet.
        style={({ pressed }) => [styles.pill, { backgroundColor: theme.rewardFill, opacity: pressed ? 0.7 : 1 }]}
      >
        <Icon name="star" size={14} color={theme.onReward} weight="bold" />
        <ThemedText type="smallBold" style={{ color: theme.onReward }}>
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
      style={({ pressed }) => [styles.icon, { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.6 : 1 }]}
    >
      <Icon name={icon} size={22} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: PageInset,
    paddingBottom: 12,
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
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    marginRight: 2,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
