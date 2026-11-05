#!/usr/bin/env node
// Writes public/privacy.html from src/constants/privacyPolicy.json: the
// privacy policy as a page anyone can open, for the App Store and Google
// Play listings (they want a link). The app shows the same text.
//
//   node scripts/build-privacy-page.mjs          write it
//   node scripts/build-privacy-page.mjs --check  fail if it's out of date (CI)
import { readFile, writeFile } from 'node:fs/promises';

const policy = JSON.parse(await readFile(new URL('../src/constants/privacyPolicy.json', import.meta.url), 'utf8'));
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(policy.title)} · Mongmo</title>
<style>
  :root { color-scheme: light dark; --paper: #faf9f5; --ink: #1c1d19; }
  body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.6 "Helvetica Neue", Helvetica, Arial, sans-serif; }
  main { max-width: 42rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
  h1 { font-size: 2rem; text-transform: uppercase; letter-spacing: 0.02em; }
  h2 { font-size: 1.15rem; text-transform: uppercase; margin-top: 2rem; }
  @media (prefers-color-scheme: dark) { body { background: var(--ink); color: var(--paper); } }
</style>
</head>
<body>
<main>
<h1>${escape(policy.title)}</h1>
<p><small>Last updated ${escape(policy.updated)}</small></p>
<p>${escape(policy.intro)}</p>
${policy.sections
  .map(
    (section) =>
      `<h2>${escape(section.heading)}</h2>\n${section.paragraphs.map((p) => `<p>${escape(p)}</p>`).join('\n')}`,
  )
  .join('\n')}
</main>
</body>
</html>
`;

const target = new URL('../public/privacy.html', import.meta.url);
if (process.argv.includes('--check')) {
  const current = await readFile(target, 'utf8').catch(() => '');
  if (current !== html) {
    console.error('public/privacy.html is out of date: run node scripts/build-privacy-page.mjs');
    process.exit(1);
  }
  console.log('public/privacy.html is up to date');
} else {
  await writeFile(target, html);
  console.log('Wrote public/privacy.html');
}
