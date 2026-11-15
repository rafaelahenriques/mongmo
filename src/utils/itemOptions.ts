import type { OrderMenuItem } from '@/api/orders';

export type OptionGroup = {
  name: string;
  /** Pick one (the sauce, coriander or not, spicy or not), or switch each on (extra sauce). */
  choice: boolean;
  items: OrderMenuItem[];
};

/**
 * The options that go with an item, grouped by their section. A section
 * whose name starts with "Choose" ("Choose your sauce", "Choose
 * coriander") is pick-one, its first option picked unless changed; the
 * others ("Extras") are switched on one by one, free or paid.
 */
export function optionGroupsFor(item: OrderMenuItem | undefined, menu: OrderMenuItem[]): OptionGroup[] {
  if (!item?.category) return [];
  const groups: OptionGroup[] = [];
  for (const option of menu) {
    if (!option.addOnFor?.includes(item.category)) continue;
    const name = option.category?.trim() || 'Extras';
    const group = groups.find((candidate) => candidate.name === name);
    if (group) group.items.push(option);
    else groups.push({ name, choice: false, items: [option] });
  }
  for (const group of groups) group.choice = /^choose\b/i.test(group.name);
  // What comes with it first (the sauce), then the rest in menu order.
  return groups.sort((a, b) => Number(b.choice) - Number(a.choice));
}
