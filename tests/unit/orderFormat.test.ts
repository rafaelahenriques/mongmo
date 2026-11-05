import { formatCents, pickupCode, priceParts, shortItemName } from '@/utils/orderFormat';

describe('order formatting', () => {
  it('writes euros with a comma, as on the menu board', () => {
    expect(formatCents(650)).toBe('6,50');
    expect(formatCents(1000)).toBe('10,00');
    expect(formatCents(5)).toBe('0,05');
  });

  it('splits a price into euros and raised cents', () => {
    expect(priceParts(1050)).toEqual({ euros: '10', cents: '50' });
    expect(priceParts(1005)).toEqual({ euros: '10', cents: '05' });
  });

  it('makes a short pickup code from the order id', () => {
    expect(pickupCode('3f2a9c1e-0000-4000-8000-000000000000')).toBe('3F2A9C');
  });

  it("drops the section's name from an item's name", () => {
    expect(shortItemName('Bánh mì, crispy pork belly', 'Bánh mì')).toBe('Crispy pork belly');
    expect(shortItemName('Iced coffee', 'Drinks')).toBe('Iced coffee');
    expect(shortItemName('Bánh mì', 'Bánh mì')).toBe('Bánh mì');
    expect(shortItemName('Springrolls', null)).toBe('Springrolls');
  });
});
