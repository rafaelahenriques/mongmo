import { gapLine, pointsLabel, shortName } from '@/components/achievements/LeaderboardList';
import type { LeaderboardRow } from '@/hooks/useLeaderboard';

const row = (rank: number, name: string, points: number): LeaderboardRow => ({
  userId: name,
  rank,
  name,
  points,
  isMe: false,
  photoUrl: '',
  photoPath: '',
});

describe('your spot on the leaderboard', () => {
  it('says how far it is to pass the one above', () => {
    expect(gapLine(row(12, 'Rafaela Henriques', 800), row(11, 'Sofia De Smet', 840))).toBe(
      '40 pts to pass Sofia D. at #11',
    );
    expect(gapLine(row(3, 'Rafaela', 979), row(2, 'Noor', 980))).toBe('1 pt to pass Noor at #2');
  });

  it('says when you are level with them', () => {
    expect(gapLine(row(5, 'Rafaela', 900), row(4, 'Emma Claes', 900))).toBe('Level with Emma C. at #4');
  });

  it('says how far ahead you are when you are first', () => {
    expect(gapLine(row(1, 'Rafaela', 1240), undefined, row(2, 'lucas.peeters', 1100))).toBe(
      '140 pts ahead of Lucas P.',
    );
    expect(gapLine(row(1, 'Rafaela', 10))).toBe('The only one on the board so far');
  });

  it('writes points and names the way the board shows them', () => {
    expect(pointsLabel(1)).toBe('1 pt');
    expect(pointsLabel(1240)).toBe('1,240 pts');
    expect(shortName('  ')).toBe('Mongmo fan');
  });
});
