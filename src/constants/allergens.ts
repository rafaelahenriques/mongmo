/**
 * The 14 allergens EU food law (Regulation 1169/2011, Annex II) says a
 * customer must be able to see before ordering, in the order the law lists
 * them. Keys match menu_items.allergens (0035).
 */
export const ALLERGENS = {
  gluten: 'Gluten (wheat, rye, barley, oats)',
  crustaceans: 'Crustaceans',
  eggs: 'Eggs',
  fish: 'Fish',
  peanuts: 'Peanuts',
  soybeans: 'Soy',
  milk: 'Milk',
  nuts: 'Tree nuts',
  celery: 'Celery',
  mustard: 'Mustard',
  sesame: 'Sesame',
  sulphites: 'Sulphites',
  lupin: 'Lupin',
  molluscs: 'Molluscs',
} as const;

export type Allergen = keyof typeof ALLERGENS;

/** Where to ask when a dish's allergens aren't listed, or for anything else. */
export const ALLERGY_CONTACT = 'hello@mongmo-store.com';

/**
 * What an item contains, in words, in the law's order: "Gluten (wheat, rye,
 * barley, oats), Soy". Unknown keys are left out. Null when not filled in.
 */
export function allergenLabels(allergens: readonly string[] | null | undefined): string[] | null {
  if (!allergens) return null;
  return (Object.keys(ALLERGENS) as Allergen[]).filter((key) => allergens.includes(key)).map((key) => ALLERGENS[key]);
}

/** "Gluten (…), Soy", "None of the 14 main allergens", or "Not listed yet". */
export function allergenText(allergens: readonly string[] | null | undefined): string {
  const labels = allergenLabels(allergens);
  if (!labels) return 'Not listed yet';
  return labels.length ? labels.join(', ') : 'None of the 14 main allergens';
}
