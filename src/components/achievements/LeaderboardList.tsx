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
                  {row.isMe ? `${shortName(row.name)} (you)` : shortName(row.name)}
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
