import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Reward } from '@/types';

export type RewardRowProps = {
  reward: Reward;
  points: number;
  redeemedCount: number;
  onRedeem: (reward: Reward) => void;
};

/** One redeemable reward: cost, affordability and the redeem action. */
export default function RewardRow({ reward, points, redeemedCount, onRedeem }: RewardRowProps) {
  const theme = useTheme();
  const affordable = points >= reward.costPoints;
  const shortfall = reward.costPoints - points;

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <View style={styles.texts}>
        <ThemedText type="smallBold">{reward.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {reward.description}
        </ThemedText>
        <ThemedText type="small" themeColor={affordable ? 'success' : 'textSecondary'}>
          {reward.costPoints} pts{affordable ? '' : ` · ${shortfall} more to go`}
          {redeemedCount > 0 ? ` · redeemed ×${redeemedCount}` : ''}
        </ThemedText>
      </View>

      <Pressable
        onPress={() => onRedeem(reward)}
        disabled={!affordable}
        accessibilityRole="button"
        accessibilityLabel={`Redeem ${reward.title} for ${reward.costPoints} points`}
        accessibilityState={{ disabled: !affordable }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: affordable ? theme.text : theme.backgroundSelected,
            opacity: !affordable ? 0.55 : pressed ? 0.8 : 1,
          },
        ]}
      >
        <ThemedText
          type="smallBold"
          style={{ color: affordable ? theme.background : theme.textSecondary }}
        >
          Redeem
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 14,
    borderWidth: 2,
    padding: Spacing.three,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  button: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
