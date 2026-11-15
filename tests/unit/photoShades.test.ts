/**
 * Shades over photos are drawn by the platform (`backgroundImage:
 * linear-gradient(…)`). An SVG gradient stretched over a photo
 * (preserveAspectRatio="none") shows on iPhones as hard bands: a dark block
 * with an edge across the picture instead of a fade.
 */
const fs = require('fs') as {
  readdirSync: (path: string, options: { withFileTypes: true }) => { name: string; isDirectory: () => boolean }[];
  readFileSync: (path: string, encoding: 'utf8') => string;
};

/** Every .ts and .tsx file under a folder (paths from the repository root, where Jest runs). */
function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

it('draws no photo shade as a stretched SVG gradient', () => {
  const stretched = sources('src').filter((path) => {
    const text = fs.readFileSync(path, 'utf8');
    return text.includes('LinearGradient') && text.includes('preserveAspectRatio="none"');
  });
  expect(stretched).toEqual([]);
});
