import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
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
  /** Puts the person on the leaderboard (it's opt-in). */
  onJoin: () => void;
  joining?: boolean;
};

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'all', label: 'All-time' },
];

/** Weekly / all-time leaderboard; the podium ranks in red, your row marked. */
export default function LeaderboardList({
  rows,
  hidden,
  period,
  onChangePeriod,
  onJoin,
  joining = false,
}: LeaderboardListProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <Segmented
        options={PERIODS}
        value={period}
        onChange={onChangePeriod}
        accessibilityLabel="Leaderboard period"
        look="chips"
      />

      {hidden ? (
        <Card tone="muted" style={styles.hiddenNote}>
          <View style={styles.hiddenText}>
            <Icon name="eye" size={18} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
              You’re not on the leaderboard. Join to show your name and points to other members; leave any time in
              Settings. Your points count for badges and rewards either way.
            </ThemedText>
          </View>
          <Button label="Join the leaderboard" variant="secondary" onPress={onJoin} loading={joining} />
        </Card>
      ) : null}

      {rows.length > 0 ? (
        <View>
          {rows.map((row, index) => {
            const top = row.rank <= 3;
            return (
              <View
                key={row.userId}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Rank ${row.rank}, ${row.isMe ? 'you' : row.name}, ${row.points} points`}
                style={[
                  styles.row,
                  index < rows.length - 1 && !row.isMe && { borderBottomWidth: 1, borderBottomColor: theme.border },
                  row.isMe && { backgroundColor: theme.backgroundSelected, borderRadius: Radius.card },
                ]}
              >
                {/* The top three on sage, the rest on stone: the number says it too. */}
                <View style={[styles.rank, { backgroundColor: top ? theme.brandFill : theme.backgroundSelected }]}>
                  <ThemedText type="card" style={{ color: top ? theme.onBrand : theme.text }}>
                    {row.rank}
                  </ThemedText>
                </View>
                <ThemedText type="card" style={styles.flex} numberOfLines={1}>
                  {row.isMe ? `${shortName(row.name)} (you)` : shortName(row.name)}
                </ThemedText>
                <ThemedText type="card">{row.points.toLocaleString()}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  pts
                </ThemedText>
              </View>
            );
          })}
        </View>
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
    gap: Spacing.three,
  },
  hiddenText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  rank: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * A name as the leaderboard shows it: first name and initial ("Rafaela H."),
 * so a long name fits and a name made from an email address
 * ("rafaela.henriques") doesn't show it.
 */
export function shortName(name: string): string {
  const [first = '', second] = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
  if (!first) return 'Mongmo fan';
  return second ? `${cap(first)} ${second.charAt(0).toUpperCase()}.` : cap(first);
}
