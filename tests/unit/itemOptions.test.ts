import type { OrderMenuItem } from '@/api/orders';
import { optionGroupsFor } from '@/utils/itemOptions';

const item = (id: string, name: string, category: string, priceCents: number, addOnFor: string[] | null = null) =>
  ({ id, name, category, priceCents, addOnFor, description: null, imageUrl: null, allergens: null }) as OrderMenuItem;

/** The café's menu, as in supabase/base.sql. */
const MENU = [
  item('pork', 'Bánh mì, crispy pork belly', 'Bánh mì', 1050),
  item('tofu-roll', 'Springrolls, fried tofu', 'Springrolls', 500),
  item('stew', 'Bò kho (beef stew)', 'Vietnamese stews', 1650),
  item('peanut', 'Peanut sauce', 'Choose your sauce', 0, ['Springrolls']),
  item('mango', 'Mango sauce', 'Choose your sauce', 0, ['Springrolls']),
  item('coriander', 'With coriander', 'Choose coriander', 0, ['Bánh mì', 'Springrolls']),
  item('no-coriander', 'No coriander', 'Choose coriander', 0, ['Bánh mì', 'Springrolls']),
  item('not-spicy', 'Not spicy', 'Choose how spicy', 0, ['Bánh mì', 'Springrolls']),
  item('spicy', 'Spicy', 'Choose how spicy', 0, ['Bánh mì', 'Springrolls']),
  item('more-peanut', 'Extra peanut sauce', 'Extras', 90, ['Springrolls']),
  item('more-mango', 'Extra mango sauce', 'Extras', 90, ['Springrolls']),
];

const summary = (id: string) =>
  optionGroupsFor(
    MENU.find((row) => row.id === id),
    MENU,
  ).map((group) => [group.name, group.choice ? 'pick one' : 'switch on', group.items.map((option) => option.id)]);

it('gives springrolls the sauce, coriander or not, spicy or not, each its own choice, then extra sauce', () => {
  expect(summary('tofu-roll')).toEqual([
    ['Choose your sauce', 'pick one', ['peanut', 'mango']],
    ['Choose coriander', 'pick one', ['coriander', 'no-coriander']],
    ['Choose how spicy', 'pick one', ['not-spicy', 'spicy']],
    ['Extras', 'switch on', ['more-peanut', 'more-mango']],
  ]);
});

it('gives a bánh mì coriander or not and spicy or not, and no sauce', () => {
  expect(summary('pork')).toEqual([
    ['Choose coriander', 'pick one', ['coriander', 'no-coriander']],
    ['Choose how spicy', 'pick one', ['not-spicy', 'spicy']],
  ]);
});

it('keeps free options you switch on apart from a pick-one group: only a "Choose…" section is pick-one', () => {
  const extras = [
    item('herbs', 'Extra herbs', 'Extras', 0, ['Bánh mì']),
    item('egg', 'Fried egg', 'Extras', 0, ['Bánh mì']),
  ];
  const [free] = optionGroupsFor(MENU[0], [...MENU.slice(0, 3), ...extras]);
  expect(free!.items.every((option) => option.priceCents === 0)).toBe(true);
  expect(free!.choice).toBe(false);
});

it('has nothing for a dish without options, or one without a section', () => {
  expect(summary('stew')).toEqual([]);
  expect(optionGroupsFor(undefined, MENU)).toEqual([]);
  expect(optionGroupsFor({ ...MENU[0]!, category: null }, MENU)).toEqual([]);
});
