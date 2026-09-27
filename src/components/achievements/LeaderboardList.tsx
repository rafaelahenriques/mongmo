import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
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

/** Weekly / all-time segmented leaderboard with the signed-in row marked. */
export default function LeaderboardList({ rows, hidden, period, onChangePeriod }: LeaderboardListProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.segment, { backgroundColor: theme.backgroundElement }]}
        accessibilityRole="tablist"
        accessibilityLabel="Leaderboard period"
      >
        {PERIODS.map((option) => {
          const selected = option.value === period;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChangePeriod(option.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label} leaderboard`}
              style={[
                styles.segmentItem,
                selected && { backgroundColor: theme.backgroundSelected },
              ]}
            >
              <ThemedText type="smallBold" themeColor={selected ? undefined : 'textSecondary'}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {hidden ? (
        <View
          style={[
            styles.hiddenNote,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
          accessibilityRole="text"
          accessibilityLabel="You are hidden from the leaderboard by your privacy setting."
        >
          <ThemedText type="small" themeColor="textSecondary">
            You’re hidden from the leaderboard (Profile → Privacy). Your points still count for
            badges and rewards.
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.rows}>
        {rows.map((row) => (
          <View
            key={row.userId}
            accessibilityRole="text"
            accessibilityLabel={`Rank ${row.rank}, ${row.isMe ? 'you' : row.name}, ${row.points} points`}
            style={[
              styles.row,
              {
                backgroundColor: row.isMe ? theme.backgroundSelected : theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.rank}>
              {row.rank}
            </ThemedText>
            <ThemedText type="smallBold" style={styles.name} numberOfLines={1}>
              {row.isMe ? `${row.name} (you)` : row.name}
            </ThemedText>
            <ThemedText type="smallBold">{row.points.toLocaleString()}</ThemedText>
          </View>
        ))}
        {rows.length === 0 && !hidden ? (
          <ThemedText type="small" themeColor="textSecondary">
            No scores yet — check in to claim the top spot.
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: Spacing.half,
    gap: Spacing.half,
    alignSelf: 'flex-start',
  },
  segmentItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  hiddenNote: {
    borderRadius: 12,
    borderWidth: 2,
    padding: Spacing.three,
  },
  rows: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rank: {
    width: 28,
  },
  name: {
    flex: 1,
  },
});
