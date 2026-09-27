import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { Spacing } from '@/constants/theme';
import type { Reward } from '@/types';

export type RewardRowProps = {
  reward: Reward;
  points: number;
  redeemedCount: number;
  onRedeem: (reward: Reward) => void;
};

/** One redeemable reward: cost, how far off it is, and the redeem action. */
export default function RewardRow({ reward, points, redeemedCount, onRedeem }: RewardRowProps) {
  const affordable = points >= reward.costPoints;
  const shortfall = reward.costPoints - points;

  return (
    <Card style={styles.row}>
      <IconBadge name="ticket" tone={affordable ? 'accent' : 'muted'} size={44} />
      <View style={styles.texts}>
        <ThemedText type="smallBold">{reward.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {reward.description}
        </ThemedText>
        <ThemedText type="small" themeColor={affordable ? 'success' : 'textSecondary'}>
          {reward.costPoints} pts{affordable ? '' : ` · ${shortfall} to go`}
          {redeemedCount > 0 ? ` · redeemed ×${redeemedCount}` : ''}
        </ThemedText>
      </View>
      <Button
        label="Redeem"
        size="small"
        variant={affordable ? 'primary' : 'ghost'}
        disabled={!affordable}
        haptic="press"
        onPress={() => onRedeem(reward)}
        accessibilityLabel={`Redeem ${reward.title} for ${reward.costPoints} points`}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
