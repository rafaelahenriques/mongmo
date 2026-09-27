import { StyleSheet, View } from 'react-native';
import { formatInTimeZone } from 'date-fns-tz';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';
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
    ? `Earned ${formatInTimeZone(new Date(earned.earnedAt), DISPLAY_TIME_ZONE, 'd MMM yyyy')}`
    : 'Locked';

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${definition.title}. ${
        earned ? statusLabel : `Locked — ${definition.description}`
      }`}
      style={[
        styles.card,
        earned
          ? { backgroundColor: theme.highlight, borderColor: theme.border, boxShadow: `3px 3px 0px ${theme.shadow}` }
          : { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: 0.6 },
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
      <ThemedText type="section" numberOfLines={1} style={[styles.title, earned ? { color: theme.onHighlight } : undefined]}>
        {definition.title}
      </ThemedText>
      <ThemedText
        type="small"
        themeColor={earned ? undefined : 'textSecondary'}
        style={[styles.description, earned ? { color: theme.onHighlight } : undefined]}
      >
        {definition.description}
      </ThemedText>
      <ThemedText type="label" themeColor={earned ? undefined : 'textSecondary'} style={earned ? { color: theme.onHighlight } : undefined}>
        {statusLabel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    lineHeight: 22,
  },
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    borderRadius: 14,
    borderWidth: 2,
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
