import { StyleSheet, View } from 'react-native';
import { format as formatZoned } from 'date-fns-tz';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { ACTIVITY_TIME_ZONE } from '@/utils/achievements';
import type { BadgeDefinition, EarnedBadge } from '@/types';

export type BadgeCardProps = {
  definition: BadgeDefinition;
  earned?: EarnedBadge;
};

/**
 * One badge tile: full colour with an unlock date when earned, greyed out
 * with a lock and the requirement as its hint while still locked.
 */
export default function BadgeCard({ definition, earned }: BadgeCardProps) {
  const theme = useTheme();

  const statusLabel = earned
    ? `Earned ${formatZoned(new Date(earned.earnedAt), 'd MMM yyyy', {
        timeZone: ACTIVITY_TIME_ZONE,
      })}`
    : 'Locked';

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${definition.title}. ${
        earned ? statusLabel : `Locked — ${definition.description}`
      }`}
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
          opacity: earned ? 1 : 0.6,
        },
      ]}
    >
      <View style={styles.headRow}>
        <ThemedText style={styles.emoji}>{definition.emoji}</ThemedText>
        {!earned ? (
          <ThemedText type="small" themeColor="textSecondary">
            🔒
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="smallBold" numberOfLines={1}>
        {definition.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
        {definition.description}
      </ThemedText>
      <ThemedText type="small" themeColor={earned ? 'success' : 'textSecondary'}>
        {statusLabel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  description: {
    minHeight: 36,
  },
});
