import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/profile/Avatar';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chapter } from '@/components/ui/Chapter';
import { Icon } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Segmented';
import { CardShadow, Paper, paperAlpha, Radius, Spacing } from '@/constants/theme';
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
 * Weekly / all-time leaderboard, your place first: a sage card with your
 * rank, photo and how far to the next one up; then the top three as photo
 * cards with their medals; then everyone close behind. Members show their
 * own photo, or their initials.
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
  const top = rows.slice(0, 3);
  const rest = rows.slice(3);

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
          {me ? <YourSpot me={me} above={rows[me.rank - 2]} below={rows[me.rank]} period={period} /> : null}

          <Chapter number="01" title="Top three" style={styles.chapter} />
          <View style={styles.top}>
            {top.map((row) => (
              <TopRow key={row.userId} row={row} above={rows[row.rank - 2]} below={rows[row.rank]} />
            ))}
          </View>

          {rest.length > 0 ? (
            <>
              <Chapter number="02" title="Close behind" style={styles.chapter} />
              <View>
                {rest.map((row, index) => (
                  <RankRow key={row.userId} row={row} last={index === rest.length - 1} />
                ))}
              </View>
            </>
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

/** "1 pt", "40 pts", "1,240 pts". */
export const pointsLabel = (points: number) => (points === 1 ? '1 pt' : `${points.toLocaleString()} pts`);

/** How far you are from the one above, or ahead of the one below when you're first. */
export function gapLine(me: LeaderboardRow, above?: LeaderboardRow, below?: LeaderboardRow): string {
  if (above) {
    const toGo = above.points - me.points;
    return toGo > 0
      ? `${pointsLabel(toGo)} to pass ${shortName(above.name)} at #${above.rank}`
      : `Level with ${shortName(above.name)} at #${above.rank}`;
  }
  if (below) {
    const lead = me.points - below.points;
    return lead > 0 ? `${pointsLabel(lead)} ahead of ${shortName(below.name)}` : `Level with ${shortName(below.name)}`;
  }
  return 'The only one on the board so far';
}

const spoken = (row: LeaderboardRow) =>
  `Rank ${row.rank}, ${row.isMe ? 'you' : shortName(row.name)}, ${row.points.toLocaleString()} points`;

/** Your place: the rank big, your photo, and how far to the next one up. */
function YourSpot({
  me,
  above,
  below,
  period,
}: {
  me: LeaderboardRow;
  above?: LeaderboardRow;
  below?: LeaderboardRow;
  period: LeaderboardPeriod;
}) {
  const theme = useTheme();
  const when = period === 'weekly' ? 'this week' : 'all-time';
  const line = gapLine(me, above, below);
  const progress = above && above.points > 0 ? Math.min(1, me.points / above.points) : 1;
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Your spot ${when}: number ${me.rank}, ${me.points.toLocaleString()} points. ${line}.`}
      style={[styles.spot, { backgroundColor: theme.brandFill }]}
    >
      <View style={styles.spotTop}>
        <View style={styles.flex}>
          <ThemedText type="label" style={{ color: theme.onBrand }}>
            Your spot {when}
          </ThemedText>
          <ThemedText type="display" style={{ color: theme.onBrand }}>
            #{me.rank}
          </ThemedText>
          <ThemedText type="section" style={{ color: theme.onBrand }}>
            {me.points.toLocaleString()}{' '}
            <ThemedText type="section" style={{ color: theme.onBrandSoft }}>
              pts
            </ThemedText>
          </ThemedText>
        </View>
        <View style={styles.spotRing}>
          <Avatar name={me.name} url={me.photoUrl} cacheKey={me.photoPath} size={100} decorative />
        </View>
      </View>
      {above ? (
        <View style={styles.track}>
          <View
            style={[styles.fill, { width: `${Math.max(progress, 0.04) * 100}%`, backgroundColor: theme.onBrand }]}
          />
        </View>
      ) : null}
      <ThemedText type="smallBold" style={{ color: theme.onBrand }}>
        {line}
      </ThemedText>
    </View>
  );
}

/** One of the top three: a photo tile with its medal (sage, cream, rose), the name, the gap, the points. */
function TopRow({ row, above, below }: { row: LeaderboardRow; above?: LeaderboardRow; below?: LeaderboardRow }) {
  const theme = useTheme();
  const medal = [
    { fill: theme.brandFill, ink: theme.onBrand },
    { fill: theme.accent, ink: theme.onAccent },
    { fill: theme.tertiary, ink: theme.onTertiary },
  ][row.rank - 1]!;
  const place = row.rank === 2 ? 'first' : 'second';
  const gap = above ? above.points - row.points : below ? row.points - below.points : 0;
  const note = above
    ? gap > 0
      ? `${pointsLabel(gap)} to ${place}`
      : `Level with ${place}`
    : below
      ? gap > 0
        ? `${pointsLabel(gap)} ahead`
        : 'Level at the top'
      : 'On top';
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${spoken(row)}, ${note}`}
      style={[styles.topRow, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}
    >
      <View>
        <Avatar name={row.name} url={row.photoUrl} cacheKey={row.photoPath} size={80} shape="rounded" decorative />
        <View style={[styles.medal, { backgroundColor: medal.fill, borderColor: theme.backgroundElement }]}>
          <ThemedText type="card" style={{ color: medal.ink }}>
            {row.rank}
          </ThemedText>
        </View>
      </View>
      <View style={styles.flex}>
        <ThemedText type="item" numberOfLines={1}>
          {row.isMe ? 'You' : shortName(row.name)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {note}
        </ThemedText>
      </View>
      <ThemedText type="section">{row.points.toLocaleString()}</ThemedText>
    </View>
  );
}

/** Fourth place down: "04", the photo, the name and points; yours in deep sage. */
function RankRow({ row, last }: { row: LeaderboardRow; last: boolean }) {
  const theme = useTheme();
  const color = row.isMe ? theme.primaryText : theme.text;
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={spoken(row)}
      style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
    >
      <ThemedText type="section" style={[styles.rank, { color: row.isMe ? theme.primaryText : theme.textSecondary }]}>
        {String(row.rank).padStart(2, '0')}
      </ThemedText>
      <View style={[styles.rowPhoto, row.isMe && { borderColor: theme.brand }]}>
        <Avatar name={row.name} url={row.photoUrl} cacheKey={row.photoPath} size={44} shape="rounded" decorative />
      </View>
      <ThemedText type="card" style={[styles.flex, { color }]} numberOfLines={1}>
        {row.isMe ? 'You' : shortName(row.name)}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color }}>
        {row.points.toLocaleString()}
      </ThemedText>
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
  message: {
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  chapter: {
    marginTop: Spacing.three,
  },
  spot: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    borderRadius: Radius.tile,
  },
  spotTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  spotRing: {
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: Paper,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: paperAlpha(0.6),
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  top: {
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: Radius.card,
  },
  medal: {
    position: 'absolute',
    left: -6,
    top: -6,
    minWidth: 34,
    height: 34,
    paddingHorizontal: 4,
    borderRadius: Radius.pill,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 9,
  },
  rank: {
    minWidth: 30,
  },
  rowPhoto: {
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 18,
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
