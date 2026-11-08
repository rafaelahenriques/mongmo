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
import { Chapter } from '@/components/ui/Chapter';
import { ripple } from '@/components/ui/ripple';
import { levelSticker, rewardSticker, Stickers } from '@/constants/stickers';
import { PageInset, Radius } from '@/constants/theme';
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

  // The sections are numbered in the order they show: 01, 02, …
  let count = 0;
  const chapter = () => `0${++count}`;

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
          <View style={styles.section}>
            <Chapter number={chapter()} title={goal ? 'Next reward' : 'Your stamp card'} />
            <ThemedText type="title">
              {goal ? goal.title : rewards.length ? 'Full: redeem a reward below' : 'Earn points at every pop-up'}
            </ThemedText>
            <StampRow earned={stamps.earned} total={stamps.total} partial={stamps.partial} />
            {goal ? (
              <ThemedText type="small" themeColor="textSecondary">
                {`${stamps.earned} of ${stampsLabel(stamps.total)} · ${goal.costPoints - points} points to go`}
              </ThemedText>
            ) : null}
          </View>

          {/* Your level: its sticker, how far to the next and what it brings; opens the levels. */}
          <View style={styles.section}>
            <Chapter number={chapter()} title="Your level" />
            <Pressable
              android_ripple={ripple(theme.text)}
              onPress={() => router.push('/(wallet)/levels')}
              accessibilityRole="button"
              accessibilityLabel={`Your level: ${level.current.name}.${
                level.next ? ` ${level.toNext} points to ${level.next.name}: ${level.next.perk}.` : ''
              } See the levels.`}
              style={({ pressed }) => [styles.level, { opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[styles.levelTile, { backgroundColor: theme.backgroundSelected }]}>
                {levelSticker(level.current.key) ? (
                  <Sticker source={Stickers[levelSticker(level.current.key)!]} style={styles.levelSticker} />
                ) : null}
              </View>
              <View style={styles.levelTexts}>
                <ThemedText type="title">{level.current.name}</ThemedText>
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
                    <ThemedText type="caption" themeColor="textSecondary">
                      {`${level.toNext} points to ${level.next.name}: ${level.next.perk.charAt(0).toLowerCase()}${level.next.perk.slice(1)}`}
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText type="caption" themeColor="textSecondary">
                    {level.current.perk}
                  </ThemedText>
                )}
              </View>
              <View style={[styles.roundGo, { backgroundColor: theme.brandFill }]}>
                <Icon name="arrowRight" size={16} color={theme.onBrand} weight="bold" />
              </View>
            </Pressable>
          </View>

          {usableRewards.length ? (
            <View style={styles.section}>
              <Chapter number={chapter()} title="Ready to use" />
              <View>
                {usableRewards.map(({ userRewardId, reward }, index) => (
                  <RewardRow
                    key={userRewardId}
                    image={stickerFor(reward.title)}
                    icon="gift"
                    title={reward.title}
                    subtitle={
                      reward.discountCents ? 'Comes off at checkout.' : 'Show it at the counter when you pick up.'
                    }
                    done
                    last={index === usableRewards.length - 1}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {rewards.length ? (
            <View style={styles.section}>
              <Chapter number={chapter()} title="Rewards" />
              <View>
                {rewards.map((reward, index) => {
                  const open = level.unlocked(reward.minLevel);
                  const ready = open && points >= reward.costPoints;
                  const levelName = level.levelName(reward.minLevel);
                  return (
                    <RewardRow
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
                      value={ready ? undefined : stampsLabel(stampsFor(reward.costPoints))}
                      action={ready ? 'Redeem' : undefined}
                      onPress={ready && !redeemPending ? () => void onRedeem(reward) : undefined}
                      last={index === rewards.length - 1}
                      accessibilityLabel={`${reward.title}, ${stampsLabel(stampsFor(reward.costPoints))}, ${reward.costPoints} points${
                        !open ? `, unlocks at ${levelName}` : ready ? ', ready to redeem' : ''
                      }`}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* How points come in: three tiles, the number first, what it's for under it. */}
          <View style={styles.section}>
            <Chapter number={chapter()} title="How to earn" />
            <View style={styles.earnTiles}>
              <EarnTile icon="bag" points={POINTS_PER_EURO} text="for every €1 you spend" />
              <EarnTile icon="trophy" points={CHALLENGE_POINTS_PER_DAY} text="max per day, from challenges" />
              <EarnTile icon="star" points={POINTS_PER_STAMP} text="fill one stamp" />
            </View>
          </View>

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
  section: {
    gap: 12,
    paddingTop: 22,
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
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  rewardTile: {
    width: 56,
    height: 56,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardSticker: {
    width: 48,
    height: 48,
  },
  rewardTexts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  redeem: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  levelTile: {
    width: 76,
    height: 76,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelSticker: {
    width: 64,
    height: 64,
    transform: [{ rotate: '6deg' }],
  },
  levelTexts: {
    flex: 1,
    minWidth: 0,
    gap: 6,
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
      style={[styles.earnTile, { backgroundColor: theme.backgroundSelected }]}
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

/**
 * A reward as a line in a list: its sticker (or a gift or lock) on a stone
 * tile, the name and what it takes, and on the right how many stamps, a
 * sage Redeem pill when it's yours to take, or a tick once redeemed.
 */
function RewardRow({
  image,
  icon,
  title,
  subtitle,
  value,
  action,
  done = false,
  onPress,
  last,
  accessibilityLabel,
}: {
  image?: number;
  icon: IconName;
  title: string;
  subtitle: string;
  value?: string;
  action?: string;
  done?: boolean;
  onPress?: () => void;
  last: boolean;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const body = (
    <>
      <View style={[styles.rewardTile, { backgroundColor: theme.backgroundSelected }]}>
        {image ? (
          <Sticker source={image} style={styles.rewardSticker} />
        ) : (
          <Icon name={icon} size={22} color={theme.textSecondary} />
        )}
      </View>
      <View style={styles.rewardTexts}>
        <ThemedText type="card">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </View>
      {action ? (
        <View style={[styles.redeem, { backgroundColor: theme.brandFill }]}>
          <ThemedText type="button" style={{ color: theme.onBrand }}>
            {action}
          </ThemedText>
        </View>
      ) : done ? (
        <View style={[styles.roundGo, { backgroundColor: theme.brandFill }]}>
          <Icon name="check" size={18} color={theme.onBrand} weight="bold" />
        </View>
      ) : value ? (
        <ThemedText type="captionBold" themeColor="textSecondary">
          {value}
        </ThemedText>
      ) : null}
    </>
  );
  const line = [
    styles.reward,
    !last && { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: theme.border },
  ];
  return onPress ? (
    <Pressable
      android_ripple={ripple(theme.text)}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [line, { opacity: pressed ? 0.75 : 1 }]}
    >
      {body}
    </Pressable>
  ) : (
    <View style={line} accessible accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}>
      {body}
    </View>
  );
}
