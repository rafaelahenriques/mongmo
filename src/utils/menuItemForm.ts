import type { MenuItemInput } from '@/api/owner';

/** The same limits the database checks (0023, 0035), so the form can say what's wrong. */
export const MENU_ITEM_LIMITS = { name: 80, description: 300, category: 60, maxPriceCents: 100_000 } as const;

/**
 * A price as someone types it ("4,50", "4.5", "€ 12", "0") in cents, or
 * null when it isn't a price: not a number, negative, or more than two
 * decimals.
 */
export function parsePrice(text: string): number | null {
  const cleaned = text.replace(/[€\s]/g, '').replace(',', '.');
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

/** What the price field shows for an amount: "4,50". */
export function priceText(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

/** What's wrong with an item before it's saved, in words for the owner; null when it's fine. */
export function menuItemProblem(
  input: Omit<MenuItemInput, 'priceCents'> & { priceCents: number | null },
): string | null {
  if (!input.name.trim()) return 'Give the item a name.';
  if (input.priceCents === null) return 'Enter the price in euros, like 4,50. Use 0 for something that’s free.';
  if (input.priceCents > MENU_ITEM_LIMITS.maxPriceCents) return 'That price is too high.';
  if (!input.category.trim()) {
    return input.optionFor ? 'Give the option a group, like Extras.' : 'Say which section of the menu it goes in.';
  }
  return null;
}

/** The sections dishes and drinks are listed under, in menu order (options aside). */
export function menuSections(items: readonly { category: string; optionFor: string[] | null }[]): string[] {
  return [...new Set(items.filter((item) => !item.optionFor && item.category).map((item) => item.category))];
}

/** The groups options are offered in ("Extras", "Choose your sauce"), in menu order. */
export function optionGroups(items: readonly { category: string; optionFor: string[] | null }[]): string[] {
  return [...new Set(items.filter((item) => item.optionFor && item.category).map((item) => item.category))];
}
