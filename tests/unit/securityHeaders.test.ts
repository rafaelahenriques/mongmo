// Node's file reader. The app's TypeScript settings have no Node types (the
// app never touches the file system), so it's typed here.
const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: 'utf8') => string };

/**
 * The web build's Content-Security-Policy (public/_headers). A photo the
 * person picks, takes or has just had shrunk is a blob: or data: address in
 * the page; the app reads it with fetch() to upload it, which connect-src
 * must allow. Without that, every photo upload on the web fails.
 */
const policy = (() => {
  // Jest runs from the repository root.
  const headers = readFileSync('public/_headers', 'utf8');
  const line = headers.split('\n').find((candidate) => candidate.includes('Content-Security-Policy:')) ?? '';
  const directives = line.replace(/^.*Content-Security-Policy:/, '').split(';');
  return Object.fromEntries(
    directives.map((directive) => {
      const [name, ...sources] = directive.trim().split(/\s+/);
      return [name, sources];
    }),
  ) as Record<string, string[]>;
})();

it('lets the app read a picked photo, and still only talks to its own servers', () => {
  expect(policy['connect-src']).toEqual(expect.arrayContaining(["'self'", 'blob:', 'data:']));
  // Everything else it may reach is named: no wildcard, no plain http.
  const remote = policy['connect-src'].filter((source) => !["'self'", 'blob:', 'data:'].includes(source));
  expect(remote.length).toBeGreaterThan(0);
  for (const source of remote) expect(source).toMatch(/^(https|wss):\/\/[a-z0-9*.-]+$/);
  expect(policy['connect-src']).not.toContain('*');
});

it('shows photos from the page, the picker and Supabase only', () => {
  expect(policy['img-src']).toEqual(expect.arrayContaining(["'self'", 'data:', 'blob:', 'https://*.supabase.co']));
});
