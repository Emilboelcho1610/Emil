#!/usr/bin/env node
/* Lokal udviklingsserver til at teste appen i en desktop-browser.
 *
 *   node scripts/dev-server.js
 *   -> åbn http://localhost:5173/?proxy=1
 *
 * Med ?proxy=1 i URL'en router appen alle kald til IPTV-serveren gennem
 * denne server, så browserens CORS/mixed-content-spærring undgås.
 * (På et rigtigt Tizen/webOS-TV er det IKKE nødvendigt - der er fuld
 *  netværksadgang indbygget.)
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.join(__dirname, '..', 'app');
const PORT = process.env.PORT || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

function proxy(req, res, target) {
  let u;
  try { u = new URL(target); } catch (e) { res.writeHead(400); return res.end('bad url'); }
  const lib = u.protocol === 'https:' ? https : http;
  const preq = lib.request(u, { method: req.method, headers: { 'User-Agent': 'MyTV-dev' } }, pres => {
    res.writeHead(pres.statusCode, {
      ...pres.headers,
      'access-control-allow-origin': '*',
    });
    pres.pipe(res);
  });
  preq.on('error', e => { res.writeHead(502); res.end('proxy error: ' + e.message); });
  preq.end();
}

http.createServer((req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);

  if (u.pathname === '/__proxy') {
    return proxy(req, res, u.searchParams.get('url'));
  }

  let p = decodeURIComponent(u.pathname);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`MyTV dev-server kører på http://localhost:${PORT}`);
  console.log(`Test med proxy:  http://localhost:${PORT}/?proxy=1`);
});
