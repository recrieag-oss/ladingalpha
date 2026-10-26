// Servidor local que imita a Vercel: estáticos + /api + rota oculta /painel/:token.
// Uso: node scripts/dev.js   (lê .env.local)
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
try {
  fs.readFileSync(path.join(root, '.env.local'), 'utf8').split('\n').forEach((l) => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) {}

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let p = decodeURIComponent(url.pathname);
  let handler = null;
  const painel = p.match(/^\/painel\/([^/]+)$/);
  if (painel) { handler = 'painel'; url.searchParams.set('token', painel[1]); }
  else if (/^\/api\/[a-z]+$/.test(p) && fs.existsSync(path.join(root, p + '.js'))) handler = p.slice(5);

  if (handler) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString();
    req.query = Object.fromEntries(url.searchParams);
    try { req.body = raw && JSON.parse(raw); } catch (e) { req.body = raw; }
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
    return require(path.join(root, 'api', handler))(req, res);
  }

  if (p === '/') p = '/index.html';
  else if (!path.extname(p)) p += '.html';
  const file = path.join(root, p);
  if (!file.startsWith(path.join(root, 'assets')) && !/^\/(index|seletiva)\.html$/.test(p)) { res.statusCode = 404; return res.end('404'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('404'); }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
}).listen(3000, () => console.log('http://localhost:3000'));
