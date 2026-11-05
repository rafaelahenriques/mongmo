/**
 * Keeps personal data out of logs and crash reports. Everything the app
 * logs or sends to crash reporting passes through here first.
 *
 * Personal data here means: email addresses, phone numbers, names and
 * addresses, exact locations, ids that point at a person (user and order
 * ids), and secrets (passwords, tokens, keys). Text has those patterns
 * replaced; objects lose any field whose name suggests one.
 */

/** Field names whose values are never kept, whatever they hold. */
const SENSITIVE_KEY =
  /pass(word)?|secret|token|auth|cookie|session|key|email|e-?mail|phone|name|address|street|birth|lat(itude)?$|lng$|lon(gitude)?$|coords?|location|ip_?address|card|iban|text|input|value|query|body/i;

/** Patterns replaced inside any text, with what stands in for them. */
const PATTERNS: [RegExp, string][] = [
  // JSON web tokens (Supabase sessions, API keys) and bearer headers.
  [/\beyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]{5,}/g, '[jwt]'],
  [/\bbearer\s+[\w.~+/-]+=*/gi, 'Bearer [token]'],
  // Supabase's newer API keys.
  [/\bsb_(secret|publishable)_[\w-]+/g, '[key]'],
  [/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]'],
  // User, order and other row ids.
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id]'],
  // Phone numbers: +32 56 94 43 81, 0470 12 34 56, (056) 944381.
  [/(?:\+|\b00)\d[\d\s().-]{7,}\d|\b0\d[\d\s().-]{7,}\d/g, '[phone]'],
  // Coordinates with enough decimals to find a house.
  [/-?\b\d{1,3}\.\d{4,}\b/g, '[coord]'],
];

/** Longest text kept from one message; the rest is cut. */
const MAX_TEXT = 500;
/** How deep into nested objects scrubbing goes; deeper is dropped. */
const MAX_DEPTH = 4;

/** Text with emails, phone numbers, ids, tokens and coordinates replaced. */
export function scrubText(text: string): string {
  let out = text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}…` : text;
  for (const [pattern, replacement] of PATTERNS) out = out.replace(pattern, replacement);
  return out;
}

/** A URL with its query string and fragment removed and ids in the path replaced. */
export function scrubUrl(url: string): string {
  return scrubText(url.split(/[?#]/)[0] ?? '');
}

/**
 * A copy of any value that's safe to log: text scrubbed, sensitive fields
 * removed, errors reduced to their name and scrubbed message, and nothing
 * nested deeper than a few levels.
 */
export function scrubValue(value: unknown, depth = 0): unknown {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return scrubText(value);
  if (value instanceof Error) return `${value.name}: ${scrubText(value.message)}`;
  if (typeof value !== 'object') return undefined;
  if (depth >= MAX_DEPTH) return '[…]';
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => scrubValue(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : scrubValue(item, depth + 1);
  }
  return out;
}
