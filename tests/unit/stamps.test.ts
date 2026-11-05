import { STAMP_VALUE_LABEL, stampCard, stampsFor, stampsLabel } from '@/utils/stamps';

describe('stamps', () => {
  it('prices a reward in whole stamps, at least one', () => {
    expect(stampsFor(400)).toBe(4);
    expect(stampsFor(450)).toBe(5);
    expect(stampsFor(0)).toBe(1);
  });

  it('says one stamp or several', () => {
    expect(stampsLabel(1)).toBe('1 stamp');
    expect(stampsLabel(4)).toBe('4 stamps');
    expect(STAMP_VALUE_LABEL).toBe('1 stamp = 100 points');
  });

  it('fills a stamp per 100 points toward the next reward, with the rest as a partial stamp', () => {
    expect(stampCard(250, { costPoints: 500 })).toEqual({ earned: 2, total: 5, partial: 0.5 });
  });

  it('stops at a full card and shows no partial stamp once the reward is in reach', () => {
    expect(stampCard(780, { costPoints: 500 })).toEqual({ earned: 5, total: 5, partial: 0 });
  });

  it('shows a full card of ten when there is nothing left to aim for', () => {
    expect(stampCard(1234, null)).toEqual({ earned: 10, total: 10, partial: 0 });
  });
});
