import { ALLERGENS, allergenLabels, allergenText } from '@/constants/allergens';

describe('allergens on the menu', () => {
  it('lists all 14 EU allergens', () => {
    expect(Object.keys(ALLERGENS)).toHaveLength(14);
  });

  it("says what's in a dish in the law's order, whatever order it was stored in", () => {
    expect(allergenText(['sesame', 'gluten', 'soybeans'])).toBe('Gluten (wheat, rye, barley, oats), Soy, Sesame');
  });

  it('tells "none of them" apart from "not filled in yet"', () => {
    expect(allergenText([])).toBe('None of the 14 main allergens');
    expect(allergenText(null)).toBe('Not listed yet');
    expect(allergenText(undefined)).toBe('Not listed yet');
  });

  it('leaves out anything that isn’t one of the 14', () => {
    expect(allergenLabels(['peanuts', 'pineapple'])).toEqual(['Peanuts']);
  });
});
