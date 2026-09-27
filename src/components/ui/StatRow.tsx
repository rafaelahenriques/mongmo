import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type Stat = {
  label: string;
  value: string;
  caption?: string;
  /** Shows the value in Bold Red (the one number that matters most). */
  emphasis?: boolean;
};

/** A row of figures with hairline dividers, in one card. */
export function StatRow({ stats }: { stats: Stat[] }) {
  const theme = useTheme();
  return (
    <Card style={styles.row}>
      {stats.map((stat, index) => (
        <Fragment key={stat.label}>
          {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
          <View
            style={styles.stat}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`${stat.label}: ${stat.value}${stat.caption ? ` ${stat.caption}` : ''}`}
          >
            <ThemedText type="small" themeColor="textSecondary">
              {stat.label}
            </ThemedText>
            <ThemedText type="subtitle" style={stat.emphasis ? { color: theme.brand } : undefined}>
              {stat.value}
            </ThemedText>
            {stat.caption ? (
              <ThemedText type="small" themeColor="textSecondary">
                {stat.caption}
              </ThemedText>
            ) : null}
          </View>
        </Fragment>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: Spacing.three,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.three,
  },
});
