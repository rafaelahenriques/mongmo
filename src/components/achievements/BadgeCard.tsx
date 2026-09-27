import { StyleSheet, View } from 'react-native';
import { formatInTimeZone } from 'date-fns-tz';

import { badgeIcon } from '@/components/achievements/badgeIcons';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { IconBadge } from '@/components/ui/IconBadge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';
import type { BadgeDefinition, EarnedBadge } from '@/types';

export type BadgeCardProps = {
  definition: BadgeDefinition;
  earned?: EarnedBadge;
};

/**
 * One badge tile: its symbol on Bold Red with the unlock date when earned;
 * muted with a lock, and the requirement as its hint, while still locked.
 */
export default function BadgeCard({ definition, earned }: BadgeCardProps) {
  const theme = useTheme();

  const statusLabel = earned
    ? `Earned ${formatInTimeZone(new Date(earned.earnedAt), DISPLAY_TIME_ZONE, 'd MMM yyyy')}`
    : 'Locked';

  return (
    <Card tone={earned ? 'default' : 'muted'} style={styles.card}>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${definition.title}. ${earned ? statusLabel : `Locked — ${definition.description}`}`}
        style={styles.inner}
      >
        <View style={styles.headRow}>
          <IconBadge
            name={badgeIcon(definition.key)}
            tone={earned ? 'brand' : 'card'}
            size={48}
            style={earned ? undefined : styles.locked}
          />
          {!earned ? <Icon name="lock" size={14} color={theme.textSecondary} /> : null}
        </View>
        <ThemedText type="smallBold" numberOfLines={1} themeColor={earned ? undefined : 'textSecondary'}>
          {definition.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.description} numberOfLines={2}>
          {definition.description}
        </ThemedText>
        <ThemedText type="label" style={{ color: earned ? theme.primaryText : theme.textSecondary }}>
          {statusLabel}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '46%',
    padding: Spacing.three,
  },
  inner: {
    gap: Spacing.one,
  },
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  locked: {
    opacity: 0.6,
  },
  description: {
    minHeight: 40,
  },
});
