import { FALLBACK_LEVELS, levelState } from '@/utils/levels';

describe('levelState', () => {
  it('starts at Dough with 500 points to Rising', () => {
    const state = levelState(FALLBACK_LEVELS, 0);
    expect(state.current.key).toBe('dough');
    expect(state.next?.key).toBe('rising');
    expect(state.toNext).toBe(500);
    expect(state.progress).toBe(0);
  });

  it('reaches a level at exactly its threshold', () => {
    expect(levelState(FALLBACK_LEVELS, 499).current.key).toBe('dough');
    expect(levelState(FALLBACK_LEVELS, 500).current.key).toBe('rising');
    expect(levelState(FALLBACK_LEVELS, 1500).current.key).toBe('golden');
    expect(levelState(FALLBACK_LEVELS, 4000).current.key).toBe('crisp');
  });

  it('measures progress from this level to the next', () => {
    const state = levelState(FALLBACK_LEVELS, 1000);
    expect(state.current.key).toBe('rising');
    expect(state.toNext).toBe(500);
    expect(state.progress).toBe(0.5);
  });

  it('is full and has nothing next at the top', () => {
    const state = levelState(FALLBACK_LEVELS, 9000);
    expect(state.current.key).toBe('crisp');
    expect(state.next).toBeNull();
    expect(state.toNext).toBe(0);
    expect(state.progress).toBe(1);
  });

  it('unlocks a level reward only once the level is reached', () => {
    const state = levelState(FALLBACK_LEVELS, 600);
    expect(state.unlocked(null)).toBe(true);
    expect(state.unlocked('rising')).toBe(true);
    expect(state.unlocked('golden')).toBe(false);
    expect(state.unlocked('retired-level')).toBe(true);
  });

  it('names levels by key', () => {
    const state = levelState(FALLBACK_LEVELS, 0);
    expect(state.levelName('golden')).toBe('Golden');
    expect(state.levelName(null)).toBe('');
  });

  it('falls back to the built-in ladder while the levels load', () => {
    expect(levelState([], 700, true)).toMatchObject({ current: { key: 'rising' }, firstOrderBonus: true });
  });
});
