#!/usr/bin/env node
// Serves the web build (`npx expo export --platform web`) the way a host
// would: each route's .html, the SPA fallback, and the security headers from
// public/_headers. Used by the accessibility tests and CI.
//
//   node scripts/serve-web.mjs <dist dir> <port> [extra connect-src origin]
//
// The optional origin is added to the Content-Security-Policy's connect-src,
// for a local Supabase on http://127.0.0.1:54321 that the production policy
// (https only) would block.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [dist = 'dist', port = '8090', extraConnect] = process.argv.slice(2);
const root = resolve(dist);
const headersFile = join(fileURLToPath(new URL('..', import.meta.url)), 'public', '_headers');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

/** The headers for every path, from the `/*` block of public/_headers. */
async function securityHeaders() {
  const text = await readFile(headersFile, 'utf8');
  const headers = {};
  for (const line of text.split('\n')) {
    const match = /^\s+([A-Za-z-]+):\s*(.+)$/.exec(line);
    if (match) headers[match[1]] = match[2].trim();
  }
  if (extraConnect && headers['Content-Security-Policy']) {
    // The local API, and its realtime websocket (ws:// for http://).
    const origins = [extraConnect, extraConnect.replace(/^http/, 'ws')].join(' ');
    headers['Content-Security-Policy'] = headers['Content-Security-Policy']
      .replace('connect-src ', `connect-src ${origins} `)
      .replace('; upgrade-insecure-requests', '');
  }
  return headers;
}

async function fileFor(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  for (const candidate of [clean, `${clean}.html`, join(clean, 'index.html')]) {
    const path = join(root, candidate);
    if (!path.startsWith(root)) continue;
    try {
      if ((await stat(path)).isFile()) return path;
    } catch {
      // try the next form
    }
  }
  return join(root, 'index.html');
}

const headers = await securityHeaders();
createServer(async (request, response) => {
  const path = await fileFor(request.url ?? '/');
  try {
    const body = await readFile(path);
    response.writeHead(200, { ...headers, 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, headers);
    response.end('Not found');
  }
}).listen(Number(port), () => console.log(`Serving ${root} on http://localhost:${port}`));
