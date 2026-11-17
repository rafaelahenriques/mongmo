import { parseLimit, shortLineMessage, shortLines, stockNote } from '@/utils/dishStock';

describe('what a dish says about how many are left', () => {
  it('says nothing without a limit, or with more than 10 left', () => {
    expect(stockNote(undefined)).toBeNull();
    expect(stockNote(11)).toBeNull();
  });

  it('says hurry from 10 left, and sold out at none', () => {
    expect(stockNote(10)).toEqual({ label: 'Hurry, only 10 left', soldOut: false });
    expect(stockNote(1)).toEqual({ label: 'Hurry, only 1 left', soldOut: false });
    expect(stockNote(0)).toEqual({ label: 'Sold out', soldOut: true });
  });

  it('at the café, says which day', () => {
    expect(stockNote(3, 'today')?.label).toBe('Hurry, only 3 left today');
    expect(stockNote(0, 'on Fri 20 Nov')?.label).toBe('Sold out on Fri 20 Nov');
  });
});

describe('a cart with more than is left', () => {
  const cart = [
    { menuItemId: 'banh-mi', name: 'Bánh mì', quantity: 2 },
    { menuItemId: 'banh-mi', name: 'Bánh mì', quantity: 1 },
    { menuItemId: 'rolls', name: 'Spring rolls', quantity: 4 },
    { menuItemId: 'coffee', name: 'Coffee', quantity: 9 },
  ];

  it('counts two lines of the same dish together, and leaves out dishes without a limit', () => {
    expect(shortLines(cart, { 'banh-mi': 2, rolls: 4 })).toEqual([
      { menuItemId: 'banh-mi', name: 'Bánh mì', wanted: 3, left: 2 },
    ]);
    expect(shortLines(cart, {})).toEqual([]);
  });

  it('says what to take out, and at the café that another day may do', () => {
    const [line] = shortLines(cart, { 'banh-mi': 2 });
    expect(shortLineMessage(line!)).toBe('Only 2 left of Bánh mì. Take 1 out of your cart.');
    expect(shortLineMessage(line!, 'today')).toBe(
      'Only 2 left of Bánh mì today. Take 1 out of your cart or pick another day.',
    );
    const [gone] = shortLines(cart, { rolls: 0 });
    expect(shortLineMessage(gone!)).toBe('Spring rolls is sold out. Take it out of your cart.');
  });
});

describe('a limit as staff type it', () => {
  it('is a whole number from 0 to 10000, or empty for none', () => {
    expect(parseLimit('')).toBeNull();
    expect(parseLimit('  ')).toBeNull();
    expect(parseLimit('0')).toBe(0);
    expect(parseLimit(' 40 ')).toBe(40);
    expect(parseLimit('10000')).toBe(10000);
    expect(parseLimit('10001')).toBe('invalid');
    expect(parseLimit('4.5')).toBe('invalid');
    expect(parseLimit('-1')).toBe('invalid');
  });
});
