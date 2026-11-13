#!/usr/bin/env node
// Checks the store texts in docs/store-listing.md against Apple's and
// Google's length limits, so a paste is never cut off or refused.
//
//   npm run store:listing
import { readFile } from 'node:fs/promises';

const doc = await readFile(new URL('../docs/store-listing.md', import.meta.url), 'utf8');

/** The first code block (```…```) after a bold label, or the inline `value` on the label's line. */
function field(label) {
  const at = doc.indexOf(`**${label}**`);
  if (at < 0) throw new Error(`"${label}" isn't in docs/store-listing.md`);
  const line = doc.slice(at, doc.indexOf('\n', at));
  const inline = line.match(/:\s*`([^`]+)`/);
  if (inline) return inline[1];
  const block = doc.slice(at).match(/```\n([\s\S]*?)\n```/);
  if (!block) throw new Error(`No text for "${label}"`);
  return block[1];
}

// Apple's limits, then Google's. The two descriptions share a label, so
// they're read by position: the App Store section comes first.
const appleSection = doc.slice(0, doc.indexOf('## Google Play'));
const googleSection = doc.slice(doc.indexOf('## Google Play'));
const description = (section) => section.match(/\*\*(?:Full )?[Dd]escription\*\*[\s\S]*?```\n([\s\S]*?)\n```/)[1];

const checks = [
  ['App Store name', field('Name'), 30],
  ['App Store subtitle', field('Subtitle'), 30],
  ['App Store promotional text', field('Promotional text'), 170],
  ['App Store keywords', field('Keywords'), 100],
  ['App Store description', description(appleSection), 4000],
  ['Google Play name', field('App name'), 30],
  ['Google Play short description', field('Short description'), 80],
  ['Google Play full description', description(googleSection), 4000],
];

let over = false;
for (const [name, text, limit] of checks) {
  const length = [...text].length;
  const ok = length <= limit;
  over ||= !ok;
  console.log(`${ok ? 'ok  ' : 'OVER'} ${name}: ${length}/${limit}`);
}
if (/google pay|android/i.test(description(appleSection))) {
  console.log('OVER App Store description mentions Google Pay or Android (Apple 2.3.10)');
  over = true;
}
if (/apple pay|iphone|ios\b/i.test(description(googleSection))) {
  console.log('OVER Google Play description mentions Apple');
  over = true;
}
if (over) process.exit(1);
