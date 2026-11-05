import { useMemo } from 'react';
import { AccessibilityInfo, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { shortName } from '@/components/achievements/LeaderboardList';
import { ThemedText } from '@/components/ThemedText';
import { AppHeader } from '@/components/ui/AppHeader';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ListRow } from '@/components/ui/ListRow';
import { usePullToRefresh } from '@/components/ui/Screen';
import { SquareIconButton } from '@/components/ui/SquareIconButton';
import { StampRow } from '@/components/ui/Stamps';
import { TaskCard } from '@/components/ui/TaskCard';
import { CardShadow, PageInset } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useLevel } from '@/hooks/useLevel';
import { useProfile } from '@/hooks/useProfile';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { confirm, showError } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import type { Reward } from '@/types';
import { CHALLENGE_POINTS_PER_DAY, POINTS_PER_EURO, POINTS_PER_STAMP } from '@/constants/points';
import { byCost, nextReward } from '@/utils/rewards';
import { stampCard, stampsFor, stampsLabel } from '@/utils/stamps';

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
  const level = useLevel();
  const points = summary.points;

  const rewards = useMemo(() => byCost(query.data?.rewards ?? []), [query.data?.rewards]);
  const goal = nextReward(rewards, points, level.unlocked);
  const stamps = stampCard(points, goal);

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
      onError: (error) => showError('Couldn’t redeem it', error),
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader title="Wallet" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarInset + 32 }}
        refreshControl={<RefreshControl refreshing={refresh.refreshing} onRefresh={refresh.onRefresh} />}
      >
        <View style={styles.hero}>
          <View style={[styles.block, { backgroundColor: theme.brandFill }]}>
            {profile.data?.name ? (
              <ThemedText type="captionBold" style={{ color: theme.onBrand }}>
                {shortName(profile.data.name)}
              </ThemedText>
            ) : null}
            <View accessible accessibilityLabel={`${points} points`}>
              <ThemedText
                type="display"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.number, numberSize(points), { color: theme.onBrand }]}
              >
                {points}
              </ThemedText>
              <ThemedText type="display" style={[styles.word, { color: theme.onBrandSoft }]}>
                POINTS
              </ThemedText>
            </View>
          </View>
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
          {/* Next reward: what it is, the card toward it, how far off. */}
          <View style={styles.stamps}>
            <ThemedText type="label" themeColor="textSecondary">
              {goal ? 'Next reward' : 'Your stamp card'}
            </ThemedText>
            <ThemedText type="subtitle" accessibilityRole="header">
              {goal ? goal.title : rewards.length ? 'Full: redeem a reward below' : 'Earn points at every pop-up'}
            </ThemedText>
            <StampRow earned={stamps.earned} total={stamps.total} partial={stamps.partial} />
            {goal ? (
              <ThemedText type="smallBold">
                {`${stamps.earned} of ${stampsLabel(stamps.total)} · ${goal.costPoints - points} points to go`}
              </ThemedText>
            ) : null}
          </View>

          {/* Your level: where you are, how far to the next, and what it brings. */}
          <Pressable
            onPress={() => router.push('/(wallet)/levels')}
            accessibilityRole="button"
            accessibilityLabel={`Your level: ${level.current.name}.${
              level.next ? ` ${level.toNext} points to ${level.next.name}: ${level.next.perk}.` : ''
            } See the levels.`}
            style={({ pressed }) => [
              styles.levelCard,
              { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.levelHead}>
              <View style={styles.flex}>
                <ThemedText type="label" themeColor="textSecondary">
                  Your level
                </ThemedText>
                <ThemedText type="subtitle">{level.current.name}</ThemedText>
              </View>
              <View style={styles.levelLink}>
                <ThemedText type="label">Levels</ThemedText>
                <Icon name="arrowRight" size={16} color={theme.text} weight="bold" />
              </View>
            </View>
            {level.next ? (
              <>
                <View style={[styles.levelTrack, { backgroundColor: theme.backgroundSelected }]}>
                  <View
                    style={[
                      styles.levelFill,
                      { width: `${Math.round(level.progress * 100)}%`, backgroundColor: theme.primaryText },
                    ]}
                  />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {`${level.toNext} points to ${level.next.name}: ${level.next.perk.charAt(0).toLowerCase()}${level.next.perk.slice(1)}`}
                </ThemedText>
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                {level.current.perk}
              </ThemedText>
            )}
          </Pressable>

          {/* How points come in: three tiles, the number first, what it's for under it. */}
          <View style={styles.group}>
            <ThemedText type="subtitle" accessibilityRole="header">
              How to earn
            </ThemedText>
            <View style={styles.earnTiles}>
              <EarnTile icon="bag" points={POINTS_PER_EURO} text="for every €1 you spend" />
              <EarnTile icon="trophy" points={CHALLENGE_POINTS_PER_DAY} text="max per day, from challenges" />
              <EarnTile icon="star" points={POINTS_PER_STAMP} text="fill one stamp" />
            </View>
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
                const open = level.unlocked(reward.minLevel);
                const ready = open && points >= reward.costPoints;
                const levelName = level.levelName(reward.minLevel);
                return (
                  <TaskCard
                    key={reward.id}
                    icon={open ? 'gift' : 'lock'}
                    title={reward.title}
                    subtitle={
                      !open
                        ? `Unlocks at ${levelName}`
                        : ready
                          ? 'Ready to redeem'
                          : `${reward.costPoints - points} points to go`
                    }
                    state={ready ? 'value' : 'plain'}
                    value={ready ? 'Redeem' : stampsLabel(stampsFor(reward.costPoints))}
                    onPress={ready && !redeemPending ? () => void onRedeem(reward) : undefined}
                    accessibilityLabel={`${reward.title}, ${stampsLabel(stampsFor(reward.costPoints))}, ${reward.costPoints} points${
                      !open ? `, unlocks at ${levelName}` : ready ? ', ready to redeem' : ''
                    }`}
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

/** The points number shrinks as it gets longer, so 4 or 5 digits still fit the block. */
function numberSize(points: number) {
  const digits = String(points).length;
  if (digits <= 3) return null;
  return digits === 4 ? { fontSize: 72, lineHeight: 76 } : { fontSize: 58, lineHeight: 62 };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  // Grows with the text (large font sizes) instead of clipping it; the QR
  // button sits in the 26pt under the block.
  hero: {
    minHeight: 252,
    paddingBottom: 26,
    marginBottom: 18,
  },
  block: {
    minHeight: 226,
    // The whole width: no photo beside it, the QR square at its corner.
    width: '100%',
    paddingHorizontal: PageInset,
    paddingTop: 26,
    paddingBottom: 20,
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
  // Three across on a phone; they wrap onto more rows with large text.
  earnTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  earnTile: {
    flexGrow: 1,
    flexBasis: 96,
    padding: 12,
    gap: 4,
  },
  flex: {
    flex: 1,
  },
  group: {
    gap: 8,
  },
  levelCard: {
    padding: 16,
    gap: 8,
  },
  levelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  levelTrack: {
    height: 8,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
  },
});

/** One way to earn: the points big, "pts" small beside them, what for underneath. */
function EarnTile({ icon, points, text }: { icon: IconName; points: number; text: string }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.earnTile, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}
      accessible
      accessibilityLabel={`${points} points ${text}`}
    >
      <Icon name={icon} size={18} color={theme.textSecondary} />
      <ThemedText type="title">
        {points}
        <ThemedText type="smallBold"> pts</ThemedText>
      </ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {text}
      </ThemedText>
    </View>
  );
}
