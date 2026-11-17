/** From this many left, a dish says so: "Hurry, only 4 left". */
export const HURRY_AT = 10;

/** What to say about how many of a dish are left, or nothing when there's plenty (or no limit). */
export type StockNote = { label: string; soldOut: boolean };

/**
 * "Sold out" at none, "Hurry, only N left" at 10 or fewer. At the café the
 * limit is per day, so it says which day (`day`: "today", "tomorrow", "Fri 21 Nov").
 */
export function stockNote(left: number | undefined, day?: string): StockNote | null {
  if (left === undefined || left > HURRY_AT) return null;
  const when = day ? ` ${day}` : '';
  if (left <= 0) return { label: `Sold out${when}`, soldOut: true };
  return { label: `Hurry, only ${left} left${when}`, soldOut: false };
}

/** A cart line that asks for more than is left. */
export type ShortLine = { menuItemId: string; name: string; wanted: number; left: number };

/** The dishes in a cart that ask for more than is left (two lines of the same dish count together). */
export function shortLines(
  items: { menuItemId: string; name: string; quantity: number }[],
  left: Record<string, number>,
): ShortLine[] {
  const wanted = new Map<string, { name: string; quantity: number }>();
  for (const item of items) {
    const sofar = wanted.get(item.menuItemId);
    wanted.set(item.menuItemId, { name: item.name, quantity: (sofar?.quantity ?? 0) + item.quantity });
  }
  return [...wanted]
    .filter(([id, { quantity }]) => left[id] !== undefined && quantity > left[id])
    .map(([id, { name, quantity }]) => ({ menuItemId: id, name, wanted: quantity, left: Math.max(left[id], 0) }));
}

/** What checkout says about a dish there isn't enough of, and what to do. */
export function shortLineMessage(line: ShortLine, day?: string): string {
  const when = day ? ` ${day}` : '';
  const other = day ? ' or pick another day' : '';
  return line.left === 0
    ? `${line.name} is sold out${when}. Take it out of your cart${other}.`
    : `Only ${line.left} left of ${line.name}${when}. Take ${line.wanted - line.left} out of your cart${other}.`;
}

/** The most a limit can be (the server agrees). */
export const LIMIT_MOST = 10000;

/** A limit as staff type it: a whole number from 0 to 10000, or empty for none. */
export function parseLimit(text: string): number | null | 'invalid' {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return 'invalid';
  const value = Number(trimmed);
  return value > LIMIT_MOST ? 'invalid' : value;
}
