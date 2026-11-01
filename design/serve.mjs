// Serves site/ under /crew/, exactly like GitHub Pages does for this repo,
// so relative paths are tested against the real base path.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../site', import.meta.url)));
// Mockups are dev-only; they are served beside the site so they share its assets.
const MOCKUPS = resolve(fileURLToPath(new URL('./mockups', import.meta.url)));
const BASE = '/crew/';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

export function serve(port = Number(process.env.PORT ?? 4173)) {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/' || url.pathname === '/crew') {
      res.writeHead(302, { location: BASE }).end();
      return;
    }
    if (!url.pathname.startsWith(BASE)) {
      res.writeHead(404).end('Not found (site is served under /crew/)');
      return;
    }
    const rel = decodeURIComponent(url.pathname.slice(BASE.length));
    const root = rel.startsWith('mockups/') ? MOCKUPS : ROOT;
    let file = normalize(join(root, rel.replace(/^mockups\//, '')));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((done) => server.listen(port, () => done(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await serve();
  console.log(`crew site on http://localhost:${server.address().port}/crew/`);
}
