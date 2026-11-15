import { menuItemProblem, menuSections, optionGroups, parsePrice, priceText } from '@/utils/menuItemForm';

describe('the price field', () => {
  it.each([
    ['4,50', 450],
    ['4.5', 450],
    ['4', 400],
    ['0', 0],
    ['0,9', 90],
    ['€ 12,00', 1200],
    [' 3,05 ', 305],
    ['1000', 100000],
  ])('reads %p as %p cents', (text, cents) => {
    expect(parsePrice(text)).toBe(cents);
  });

  it.each(['', 'free', '-1', '4,505', '4,,5', '1.000,00', '12345', '4 50 x'])('refuses %p', (text) => {
    expect(parsePrice(text)).toBeNull();
  });

  it('shows an amount the way it is typed', () => {
    expect(priceText(450)).toBe('4,50');
    expect(priceText(0)).toBe('0,00');
    expect(parsePrice(priceText(1290))).toBe(1290);
  });
});

describe('what the form says is wrong', () => {
  const dish = {
    name: 'Bánh mì, chicken',
    description: '',
    priceCents: 850 as number | null,
    category: 'Bánh mì',
    available: true,
    optionFor: null as string[] | null,
    allergens: null as string[] | null,
  };

  it('is nothing for a complete item', () => {
    expect(menuItemProblem(dish)).toBeNull();
    expect(menuItemProblem({ ...dish, priceCents: 0 })).toBeNull();
  });

  it('asks for a name, a price and a section, in that order', () => {
    expect(menuItemProblem({ ...dish, name: '  ', priceCents: null, category: '' })).toMatch(/name/);
    expect(menuItemProblem({ ...dish, priceCents: null, category: '' })).toMatch(/price/i);
    expect(menuItemProblem({ ...dish, category: ' ' })).toMatch(/section/);
    expect(menuItemProblem({ ...dish, priceCents: 100_001 })).toMatch(/too high/);
  });

  it('asks an option for its group', () => {
    expect(menuItemProblem({ ...dish, category: '', optionFor: ['Springrolls'] })).toMatch(/group/);
  });
});

describe('sections and option groups', () => {
  const items = [
    { category: 'Bánh mì', optionFor: null },
    { category: 'Springrolls', optionFor: null },
    { category: 'Bánh mì', optionFor: null },
    { category: 'Choose your sauce', optionFor: ['Springrolls'] },
    { category: 'Extras', optionFor: ['Springrolls'] },
    { category: 'Extras', optionFor: ['Springrolls'] },
    { category: '', optionFor: null },
  ];

  it('lists each once, in menu order, options apart from dishes', () => {
    expect(menuSections(items)).toEqual(['Bánh mì', 'Springrolls']);
    expect(optionGroups(items)).toEqual(['Choose your sauce', 'Extras']);
  });
});
