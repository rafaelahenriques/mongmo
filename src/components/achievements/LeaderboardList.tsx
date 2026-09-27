import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Segmented';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { LeaderboardPeriod } from '@/types';
import type { LeaderboardRow } from '@/hooks/useLeaderboard';

export type LeaderboardListProps = {
  rows: LeaderboardRow[];
  hidden: boolean;
  period: LeaderboardPeriod;
  onChangePeriod: (period: LeaderboardPeriod) => void;
};

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'all', label: 'All-time' },
];

/** Weekly / all-time leaderboard; the podium ranks in red, your row marked. */
export default function LeaderboardList({ rows, hidden, period, onChangePeriod }: LeaderboardListProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <Segmented
        options={PERIODS}
        value={period}
        onChange={onChangePeriod}
        accessibilityLabel="Leaderboard period"
      />

      {hidden ? (
        <Card
          tone="muted"
          style={styles.hiddenNote}
        >
          <Icon name="eye" size={18} color={theme.textSecondary} />
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.flex}
            accessibilityLabel="You are hidden from the leaderboard by your privacy setting."
          >
            You’re hidden from the leaderboard (Profile → Settings). Your points still count for badges and
            rewards.
          </ThemedText>
        </Card>
      ) : null}

      {rows.length > 0 ? (
        <Card style={styles.list}>
          {rows.map((row, index) => (
            <View key={row.userId}>
              {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
              <View
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Rank ${row.rank}, ${row.isMe ? 'you' : row.name}, ${row.points} points`}
                style={[styles.row, row.isMe && { backgroundColor: theme.backgroundSelected }]}
              >
                <ThemedText
                  type="subtitle"
                  style={[styles.rank, { color: row.rank <= 3 ? theme.brand : theme.textSecondary }]}
                >
                  {row.rank}
                </ThemedText>
                <ThemedText type="smallBold" style={styles.flex} numberOfLines={1}>
                  {row.isMe ? `${row.name} (you)` : row.name}
                </ThemedText>
                <ThemedText type="smallBold">{row.points.toLocaleString()}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  pts
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>
      ) : !hidden ? (
        <ThemedText type="small" themeColor="textSecondary">
          No scores yet — check in to claim the top spot.
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.three,
  },
  hiddenNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  list: {
    padding: Spacing.two,
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  rank: {
    width: 32,
  },
});
