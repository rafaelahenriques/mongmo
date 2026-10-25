import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { badgeIcon } from '@/components/achievements/badgeIcons';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { IconBadge } from '@/components/ui/IconBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/Screen';
import { Spacing } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useTheme } from '@/hooks/useTheme';

/**
 * Home's "Your progress": points and the next reward they buy, rewards
 * already redeemed and waiting to be used, and the two badges closest to
 * unlocking. Everything links to Achievements for the full picture.
 */
export function ProgressSection() {
  const theme = useTheme();
  const router = useRouter();
  const { query, summary, usableRewards, progress } = useAchievements();
  const openAchievements = () => router.push('/(profile)/achievements');

  const rewards = useMemo(
    () => [...(query.data?.rewards ?? [])].sort((a, b) => a.costPoints - b.costPoints),
    [query.data?.rewards],
  );
  // What the points can buy now (the priciest), or else the next one to aim for.
  const affordable = rewards.filter((reward) => reward.costPoints <= summary.points).at(-1);
  const nextReward = rewards.find((reward) => reward.costPoints > summary.points);

  const nextBadges = useMemo(() => {
    const earned = new Set(summary.earned.map((badge) => badge.badgeId));
    return (query.data?.badges ?? [])
      .filter((badge) => !earned.has(badge.id) && progress[badge.key])
      .map((badge) => ({ badge, ...progress[badge.key]! }))
      .sort((a, b) => b.current / b.target - a.current / a.target)
      .slice(0, 2);
  }, [query.data?.badges, summary.earned, progress]);

  if (!query.data) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Your progress" actionLabel="See all" onAction={openAchievements} />

      <Card
        tone="primary"
        onPress={openAchievements}
        accessibilityLabel={
          `${summary.points} points. ` +
          (affordable
            ? `You can redeem ${affordable.title}.`
            : nextReward
              ? `${nextReward.costPoints - summary.points} more for ${nextReward.title}.`
              : '')
        }
        style={styles.points}
      >
        <View style={styles.pointsTop}>
          <View>
            <ThemedText type="label" style={{ color: theme.onPrimary, opacity: 0.75 }}>
              Points
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.pointsValue, { color: theme.onPrimary }]}>
              {summary.points.toLocaleString()}
            </ThemedText>
          </View>
          <Icon name="arrowRight" size={20} color={theme.onPrimary} weight="bold" />
        </View>
        {affordable ? (
          <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
            Enough for “{affordable.title}” — redeem it in Achievements.
          </ThemedText>
        ) : nextReward ? (
          <View style={styles.next}>
            <ThemedText type="small" style={{ color: theme.onPrimary }}>
              {nextReward.costPoints - summary.points} to go for “{nextReward.title}”
            </ThemedText>
            {/* On the Shadow Grey card: the card's own text colour, on a faint track of it (3:1 or more). */}
            <ProgressBar
              value={summary.points / nextReward.costPoints}
              color={theme.onPrimary}
              track={`${theme.onPrimary}33`}
            />
          </View>
        ) : null}
      </Card>

      {usableRewards.length > 0 ? (
        <Card style={styles.list}>
          {usableRewards.slice(0, 2).map(({ userRewardId, reward }) => (
            <View key={userRewardId} style={styles.row}>
              <IconBadge name="ticket" tone="accent" size={40} />
              <View style={styles.texts}>
                <ThemedText type="smallBold">{reward.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {reward.discountCents ? 'Ready to use at checkout' : 'Ready — show it at pickup'}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {nextBadges.length > 0 ? (
        <Card onPress={openAchievements} accessibilityLabel="Badges you're close to. Open achievements." style={styles.list}>
          {nextBadges.map(({ badge, current, target }) => (
            <View
              key={badge.id}
              style={styles.row}
              accessible
              accessibilityLabel={`${badge.title}: ${current} of ${target}. ${badge.description}.`}
            >
              <IconBadge name={badgeIcon(badge.key)} tone="muted" size={40} />
              <View style={styles.texts}>
                <View style={styles.badgeTop}>
                  <ThemedText type="smallBold" style={styles.flex} numberOfLines={1}>
                    {badge.title}
                  </ThemedText>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    {current}/{target}
                  </ThemedText>
                </View>
                <ProgressBar value={current / target} />
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {badge.description}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two + Spacing.one,
  },
  points: {
    gap: Spacing.two,
  },
  pointsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsValue: {
    fontSize: 34,
    lineHeight: 38,
  },
  next: {
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  texts: {
    flex: 1,
    gap: Spacing.one,
  },
  badgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
