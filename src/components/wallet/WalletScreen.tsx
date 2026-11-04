import { useMemo } from 'react';
import { AccessibilityInfo, Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { AppHeader } from '@/components/ui/AppHeader';
import { ListRow } from '@/components/ui/ListRow';
import { usePullToRefresh } from '@/components/ui/Screen';
import { SquareIconButton } from '@/components/ui/SquareIconButton';
import { StampRow } from '@/components/ui/Stamps';
import { TaskCard } from '@/components/ui/TaskCard';
import { BrandPhotos } from '@/constants/brandPhotos';
import { PageInset, Paper } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useProfile } from '@/hooks/useProfile';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { confirm } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import type { Reward } from '@/types';
import { CHALLENGE_POINTS_PER_DAY, POINTS_PER_EURO } from '@/constants/points';
import { STAMP_VALUE_LABEL, stampCard, stampsFor, stampsLabel } from '@/utils/stamps';

/**
 * Wallet tab: your points big on a sage block, the QR code a tap away,
 * the stamp card toward the next reward, the rewards (ready ones first),
 * and the points history.
 */
export default function WalletScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const refresh = usePullToRefresh();
  const profile = useProfile();
  const { query, summary, usableRewards, redeemReward, redeemPending } = useAchievements();
  const points = summary.points;

  const rewards = useMemo(
    () => [...(query.data?.rewards ?? [])].sort((a, b) => a.costPoints - b.costPoints),
    [query.data?.rewards],
  );
  const nextReward = rewards.find((reward) => reward.costPoints > points);
  const stamps = stampCard(points, nextReward);

  const onRedeem = async (reward: Reward) => {
    const yes = await confirm(
      `Redeem ${reward.title}?`,
      `It costs ${stampsLabel(stampsFor(reward.costPoints))} (${reward.costPoints} points). ${reward.discountCents ? 'It comes off at checkout.' : 'Show it at the counter when you pick up.'}`,
      'Redeem',
    );
    if (!yes) return;
    redeemReward(reward.id, {
      onSuccess: () => {
        haptics.success();
        AccessibilityInfo.announceForAccessibility(`${reward.title} redeemed.`);
      },
      onError: (error) =>
        Alert.alert('Couldn’t redeem it', error instanceof Error ? error.message : 'Please try again.'),
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarInset + 32 }}
        refreshControl={<RefreshControl refreshing={refresh.refreshing} onRefresh={refresh.onRefresh} />}
      >
        <View style={styles.hero}>
          <View style={[styles.block, { backgroundColor: theme.brandFill }]}>
            {profile.data?.name ? (
              <ThemedText type="captionBold" style={{ color: theme.onBrand }}>
                {profile.data.name}
              </ThemedText>
            ) : null}
            <View accessible accessibilityLabel={`${points} points`}>
              <ThemedText type="display" style={[styles.number, { color: theme.onBrand }]}>
                {points}
              </ThemedText>
              <ThemedText type="display" style={[styles.word, { color: Paper }]}>
                POINTS
              </ThemedText>
            </View>
          </View>
          {BrandPhotos.wallet ? <Image source={BrandPhotos.wallet} style={styles.photo} contentFit="cover" /> : null}
          <SquareIconButton
            icon="qrcode"
            tone="dark"
            size={52}
            onPress={() => router.push('/(wallet)/card')}
            accessibilityLabel="Show your membership card"
            style={styles.qr}
          />
        </View>

        <View style={styles.page}>
          <View style={styles.stamps}>
            <View style={styles.stampsHead}>
              <ThemedText type="captionBold" style={styles.flex}>
                {nextReward ? `${stamps.earned} of ${stamps.total} stamps` : 'Stamp card full'}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {STAMP_VALUE_LABEL}
              </ThemedText>
            </View>
            <StampRow earned={stamps.earned} total={stamps.total} partial={stamps.partial} height={44} />
            <ThemedText type="caption" themeColor="textSecondary">
              {nextReward
                ? `${nextReward.costPoints - points} more points to: ${nextReward.title}`
                : rewards.length
                  ? 'You can redeem a reward.'
                  : 'Earn points at every pop-up.'}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {`Earn ${POINTS_PER_EURO} points for every €1 you spend, and up to ${CHALLENGE_POINTS_PER_DAY} a day from challenges at a pop-up.`}
            </ThemedText>
          </View>

          {usableRewards.length ? (
            <View style={styles.group}>
              <ThemedText type="subtitle" accessibilityRole="header">
                Ready to use
              </ThemedText>
              {usableRewards.map(({ userRewardId, reward }) => (
                <TaskCard
                  key={userRewardId}
                  icon="gift"
                  title={reward.title}
                  subtitle={
                    reward.discountCents ? 'Comes off at checkout.' : 'Show it at the counter when you pick up.'
                  }
                  state="done"
                />
              ))}
            </View>
          ) : null}

          {rewards.length ? (
            <View style={styles.group}>
              <ThemedText type="subtitle" accessibilityRole="header">
                Rewards
              </ThemedText>
              {rewards.map((reward) => {
                const ready = points >= reward.costPoints;
                return (
                  <TaskCard
                    key={reward.id}
                    icon="gift"
                    title={reward.title}
                    subtitle={ready ? 'Ready to redeem' : `${reward.costPoints - points} points to go`}
                    state={ready ? 'value' : 'plain'}
                    value={ready ? 'Redeem' : stampsLabel(stampsFor(reward.costPoints))}
                    onPress={ready && !redeemPending ? () => void onRedeem(reward) : undefined}
                    accessibilityLabel={`${reward.title}, ${stampsLabel(stampsFor(reward.costPoints))}, ${reward.costPoints} points${ready ? ', ready to redeem' : ''}`}
                  />
                );
              })}
            </View>
          ) : null}

          <View>
            <ListRow title="Points history" onPress={() => router.push('/(wallet)/history')} />
            <ListRow title="Membership card" onPress={() => router.push('/(wallet)/card')} last />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  hero: {
    height: 236,
    marginBottom: 18,
  },
  block: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 26,
    width: '68%',
    paddingHorizontal: PageInset,
    paddingTop: 18,
    paddingBottom: 18,
    justifyContent: 'space-between',
  },
  number: {
    fontSize: 88,
    // Never below the font size: iOS cuts the top off the glyphs.
    lineHeight: 92,
  },
  word: {
    fontSize: 40,
    lineHeight: 42,
  },
  photo: {
    position: 'absolute',
    right: PageInset + 8,
    top: 40,
    width: 136,
    height: 136,
    borderRadius: 68,
  },
  qr: {
    position: 'absolute',
    right: PageInset,
    bottom: 0,
  },
  page: {
    paddingHorizontal: PageInset,
    gap: 24,
  },
  stamps: {
    gap: 8,
  },
  stampsHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  group: {
    gap: 8,
  },
});
