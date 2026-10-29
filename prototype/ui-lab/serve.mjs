/**
 * Static server for the UI Lab mockups. Root is prototype/ so the pages can
 * reuse /web-v2 assets and fonts without copying them.
 *
 *   node prototype/ui-lab/serve.mjs
 *   open http://127.0.0.1:5190/ui-lab/
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 5190);
const host = process.env.HOST || '127.0.0.1';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/' || pathname === '/ui-lab') {
    response.writeHead(302, { Location: '/ui-lab/' }).end();
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';

  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(file, (error, body) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(body);
  });
});

server.listen(port, host, () => {
  console.log(`UI Lab: http://${host}:${port}/ui-lab/`);
});
