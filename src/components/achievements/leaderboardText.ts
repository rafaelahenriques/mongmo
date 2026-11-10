import type { LeaderboardRow } from '@/hooks/useLeaderboard';

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
