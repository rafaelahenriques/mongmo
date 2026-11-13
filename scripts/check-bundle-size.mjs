#!/usr/bin/env node
// Fails when an exported build grows past its budget, so a heavy import
// (a whole icon set, a second date library) is caught in review instead of
// in the store. Budgets and how they were set: docs/performance.md.
//
//   npx expo export --platform web --output-dir dist
//   node scripts/check-bundle-size.mjs dist
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const KB = 1024;
/** Each with room for normal growth; raise one only on purpose, in docs/performance.md too. */
const BUDGETS = {
  web: { js: 6000 * KB, largestJs: 4000 * KB },
};

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/check-bundle-size.mjs <export dir>');
  process.exit(2);
}

async function files(root) {
  const out = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...(await files(path)));
    else out.push({ path, size: (await stat(path)).size });
  }
  return out;
}

const js = (await files(join(dir, '_expo/static/js/web'))).filter((file) => file.path.endsWith('.js'));
const total = js.reduce((sum, file) => sum + file.size, 0);
const largest = js.reduce((max, file) => (file.size > max.size ? file : max), { path: '', size: 0 });

const checks = [
  ['web JavaScript, all files', total, BUDGETS.web.js],
  [`web JavaScript, largest file (${largest.path.split('/').pop()})`, largest.size, BUDGETS.web.largestJs],
];
let over = false;
for (const [name, size, budget] of checks) {
  const ok = size <= budget;
  over ||= !ok;
  console.log(`${ok ? 'ok  ' : 'OVER'} ${name}: ${Math.round(size / KB)} KB of ${Math.round(budget / KB)} KB`);
}
if (over) process.exit(1);
