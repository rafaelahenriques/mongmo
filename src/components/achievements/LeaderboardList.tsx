import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/profile/Avatar';
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
  loading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
};

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'all', label: 'All-time' },
];

/**
 * Weekly / all-time leaderboard: the top three on a podium with their
 * photos, everyone else in rows below, and where you stand in a pill.
 * Anyone without a photo shows their initials.
 */
export default function LeaderboardList({
  rows,
  hidden,
  period,
  onChangePeriod,
  onJoin,
  joining = false,
  loading = false,
  failed = false,
  onRetry,
}: LeaderboardListProps) {
  const theme = useTheme();
  const me = rows.find((row) => row.isMe);
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <View style={styles.wrap}>
      <View style={styles.controls}>
        <Segmented
          options={PERIODS}
          value={period}
          onChange={onChangePeriod}
          accessibilityLabel="Leaderboard period"
          look="chips"
        />
        {me ? <YouPill row={me} /> : null}
      </View>

      {hidden ? (
        <Card tone="muted" style={styles.hiddenNote}>
          <View style={styles.hiddenText}>
            <Icon name="eye" size={18} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
              You’re not on the leaderboard. Join to show your name, photo and points to other members; leave any time
              in Settings. Your points count for badges and rewards either way.
            </ThemedText>
          </View>
          <Button label="Join the leaderboard" variant="secondary" onPress={onJoin} loading={joining} />
        </Card>
      ) : null}

      {loading && rows.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Loading the leaderboard…
        </ThemedText>
      ) : failed && rows.length === 0 ? (
        <View style={styles.message}>
          <ThemedText type="small" themeColor="textSecondary">
            Couldn’t load the leaderboard.
          </ThemedText>
          {onRetry ? <Button label="Try again" variant="ghost" size="small" onPress={onRetry} /> : null}
        </View>
      ) : rows.length > 0 ? (
        <>
          <Podium rows={podium} />
          {rest.length > 0 ? (
            <View>
              {rest.map((row, index) => (
                <RankRow key={row.userId} row={row} last={index === rest.length - 1} />
              ))}
            </View>
          ) : null}
        </>
      ) : !hidden ? (
        <ThemedText type="small" themeColor="textSecondary">
          No scores yet — check in to claim the top spot.
        </ThemedText>
      ) : null}
    </View>
  );
}

/** How a row's person is said and shown: "You" for the signed-in user. */
const displayName = (row: LeaderboardRow) => (row.isMe ? 'You' : shortName(row.name));
const pointsLabel = (points: number) => `${points.toLocaleString()} pts`;
const spoken = (row: LeaderboardRow) =>
  `Rank ${row.rank}, ${row.isMe ? 'you' : shortName(row.name)}, ${row.points.toLocaleString()} points`;

/** Your place, by the period chips: "You #12" with your photo. */
function YouPill({ row }: { row: LeaderboardRow }) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`You’re number ${row.rank}, with ${row.points.toLocaleString()} points`}
      style={[styles.you, { backgroundColor: theme.brandFill }]}
    >
      <Avatar name={row.name} url={row.photoUrl} cacheKey={row.photoPath} size={28} decorative />
      <ThemedText type="captionBold" style={{ color: theme.onBrand }}>
        You #{row.rank}
      </ThemedText>
    </View>
  );
}

/**
 * The top three, second · first · third, each on a step in the brand's
 * colours (sage, cream, rose) with its number. Said as one line, first to
 * third, since the layout puts second before first.
 */
function Podium({ rows }: { rows: LeaderboardRow[] }) {
  const theme = useTheme();
  const steps = [
    { fill: theme.brandFill, ink: theme.onBrand, height: 92, photo: 80 },
    { fill: theme.accent, ink: theme.onAccent, height: 68, photo: 64 },
    { fill: theme.tertiary, ink: theme.onTertiary, height: 52, photo: 64 },
  ];
  const order = [rows[1], rows[0], rows[2]].filter((row): row is LeaderboardRow => Boolean(row));

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Top ${rows.length}: ${rows.map(spoken).join('. ')}`}
      style={[styles.podium, { backgroundColor: theme.backgroundSelected }]}
    >
      {order.map((row) => {
        const step = steps[row.rank - 1]!;
        return (
          <View key={row.userId} style={styles.place}>
            <View style={[styles.ring, { borderColor: step.fill }]}>
              <Avatar name={row.name} url={row.photoUrl} cacheKey={row.photoPath} size={step.photo} decorative />
            </View>
            <ThemedText type="card" numberOfLines={1} style={styles.center}>
              {displayName(row)}
            </ThemedText>
            <View style={[styles.points, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="captionBold" style={styles.center}>
                {pointsLabel(row.points)}
              </ThemedText>
            </View>
            <View style={[styles.step, { minHeight: step.height, backgroundColor: step.fill }]}>
              <ThemedText type="title" style={{ color: step.ink }}>
                {row.rank}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Fourth place down: the rank, photo, name and points; your row on stone. */
function RankRow({ row, last }: { row: LeaderboardRow; last: boolean }) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={spoken(row)}
      style={[
        styles.row,
        !last && !row.isMe && { borderBottomWidth: 1, borderBottomColor: theme.border },
        row.isMe && { backgroundColor: theme.backgroundSelected, borderRadius: Radius.card },
      ]}
    >
      <ThemedText type="card" themeColor="textSecondary" style={styles.rank}>
        {row.rank}
      </ThemedText>
      <Avatar name={row.name} url={row.photoUrl} cacheKey={row.photoPath} size={44} decorative />
      <ThemedText type="card" style={styles.flex} numberOfLines={1}>
        {row.isMe ? `${shortName(row.name)} (you)` : shortName(row.name)}
      </ThemedText>
      <ThemedText type="card">{row.points.toLocaleString()}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        pts
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.three,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  you: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
    paddingLeft: 4,
    paddingRight: 14,
    borderRadius: Radius.pill,
  },
  hiddenNote: {
    gap: Spacing.three,
  },
  hiddenText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  message: {
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 20,
    paddingHorizontal: 12,
    borderRadius: Radius.tile,
    overflow: 'hidden',
  },
  place: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
  },
  ring: {
    padding: 3,
    borderWidth: 3,
    borderRadius: Radius.pill,
    marginBottom: 2,
  },
  points: {
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  step: {
    alignSelf: 'stretch',
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  rank: {
    minWidth: 24,
    textAlign: 'center',
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
