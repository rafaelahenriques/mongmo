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
import { Sticker } from '@/components/ui/Sticker';
import { TaskCard } from '@/components/ui/TaskCard';
import { levelSticker, rewardSticker, Stickers } from '@/constants/stickers';
import { CardShadow, PageInset, Radius } from '@/constants/theme';
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
        <View style={styles.page}>
          {/* Your points: a big sage card, your name on it, the QR in its corner. */}
          <View style={[styles.hero, { backgroundColor: theme.brandFill }]}>
            <View style={styles.heroTop}>
              {profile.data?.name ? (
                <View style={[styles.chip, { backgroundColor: theme.surfaceDark }]}>
                  <ThemedText type="captionBold" style={{ color: theme.onSurfaceDark }}>
                    {shortName(profile.data.name)}
                  </ThemedText>
                </View>
              ) : (
                <View />
              )}
              <SquareIconButton
                icon="qrcode"
                tone="dark"
                size={48}
                onPress={() => router.push('/(wallet)/card')}
                accessibilityLabel="Show your membership card"
              />
            </View>
            <View accessible accessibilityLabel={`${points} points`} style={styles.heroNumber}>
              <ThemedText
                type="display"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.number, numberSize(points), { color: theme.onBrand }]}
              >
                {points}
              </ThemedText>
              <ThemedText type="title" style={{ color: theme.onBrand }}>
                points
              </ThemedText>
            </View>
          </View>

          {/* Next reward: what it is, the card toward it, how far off. */}
          <View style={[styles.stamps, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}>
            <ThemedText type="label" style={{ color: theme.primaryText }}>
              {goal ? 'Next reward' : 'Your stamp card'}
            </ThemedText>
            <ThemedText type="subtitle" accessibilityRole="header">
              {goal ? goal.title : rewards.length ? 'Full: redeem a reward below' : 'Earn points at every pop-up'}
            </ThemedText>
            <StampRow earned={stamps.earned} total={stamps.total} partial={stamps.partial} />
            {goal ? (
              <ThemedText type="smallBold" themeColor="textSecondary">
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
              {
                backgroundColor: theme.backgroundElement,
                boxShadow: CardShadow,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              },
            ]}
          >
            <View style={styles.levelHead}>
              <View style={styles.flex}>
                <ThemedText type="label" style={{ color: theme.primaryText }}>
                  Your level
                </ThemedText>
                <ThemedText type="title">{level.current.name}</ThemedText>
              </View>
              {levelSticker(level.current.key) ? (
                <Sticker source={Stickers[levelSticker(level.current.key)!]} style={styles.levelSticker} />
              ) : null}
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
            <View style={styles.levelLink}>
              <ThemedText type="label">Levels</ThemedText>
              <View style={[styles.roundGo, { backgroundColor: theme.brandFill }]}>
                <Icon name="arrowRight" size={16} color={theme.onBrand} weight="bold" />
              </View>
            </View>
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
                  image={stickerFor(reward.title)}
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
                    image={open ? stickerFor(reward.title) : undefined}
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
/** A reward's sticker, if it has one (else its card keeps the gift icon). */
function stickerFor(title: string) {
  const name = rewardSticker(title);
  return name ? Stickers[name] : undefined;
}

function numberSize(points: number) {
  const digits = String(points).length;
  if (digits <= 3) return null;
  return digits === 4 ? { fontSize: 72, lineHeight: 76 } : { fontSize: 58, lineHeight: 62 };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  page: {
    paddingHorizontal: PageInset,
    paddingTop: 16,
    gap: 14,
  },
  // Grows with the text (large font sizes) instead of clipping it.
  hero: {
    borderRadius: Radius.tile,
    padding: 20,
    minHeight: 220,
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroNumber: {
    gap: 0,
  },
  number: {
    fontSize: 88,
    // Never below the font size: iOS cuts the top off the glyphs.
    lineHeight: 92,
  },
  stamps: {
    borderRadius: Radius.tile,
    padding: 20,
    gap: 10,
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
    padding: 14,
    gap: 4,
    borderRadius: Radius.card,
  },
  flex: {
    flex: 1,
  },
  group: {
    gap: 10,
    paddingTop: 10,
  },
  levelCard: {
    borderRadius: Radius.tile,
    padding: 20,
    gap: 10,
  },
  levelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelSticker: {
    width: 72,
    height: 72,
    transform: [{ rotate: '6deg' }],
  },
  levelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    minHeight: 44,
  },
  roundGo: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTrack: {
    height: 10,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: Radius.pill,
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
