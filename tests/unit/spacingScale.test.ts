import { SPACING_SCALE } from '@/constants/theme';

/**
 * Every gap, padding and margin written as a number is on the spacing
 * scale (SPACING_SCALE), so screens keep one rhythm. Sums like
 * `40 + Spacing.three` line things up with an icon and aren't checked;
 * offsets over 64 (room above a photo's text) aren't spacing.
 */
const fs = require('fs') as {
  readdirSync: (path: string, options: { recursive: true }) => string[];
  readFileSync: (path: string, encoding: 'utf8') => string;
};

const SPACING =
  /\b(gap|rowGap|columnGap|padding|padding(?:Top|Bottom|Left|Right|Horizontal|Vertical|Start|End)|margin|margin(?:Top|Bottom|Left|Right|Horizontal|Vertical|Start|End)): (\d+)(?=\s*[,}\n])/g;

const files = fs
  .readdirSync('src', { recursive: true })
  .filter((file) => /\.tsx?$/.test(file))
  .map((file) => `src/${file}`);

it('keeps every spacing value on the scale', () => {
  const off: string[] = [];
  for (const file of files) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(SPACING)) {
      const value = Number(match[2]);
      if (value <= 64 && !(SPACING_SCALE as readonly number[]).includes(value)) off.push(`${file}: ${match[0]}`);
    }
  }
  expect(off).toEqual([]);
});

it('finds the spacing it checks', () => {
  const found = files.flatMap((file) => [...fs.readFileSync(file, 'utf8').matchAll(SPACING)]);
  expect(found.length).toBeGreaterThan(300);
});
