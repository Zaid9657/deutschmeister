// Local browser audits share Netlify's static-file precedence, redirects and
// request-path headers. Functions are deliberately not run (501).
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

export function parseNetlifyConfig(toml) {
  const blocks = (name) => [...toml.matchAll(new RegExp(`\\[\\[${name}\\]\\]([\\s\\S]*?)(?=\\n[ \\t]*\\[(?!headers\\.values\\])|$)`, 'g'))].map((m) => m[1]);
  const scalar = (body, key) => {
    const m = body.match(new RegExp(`^\\s*${key}\\s*=\\s*(?:"([^"]*)"|(\\d+)|(true|false))`, 'm'));
    return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
  };
  const redirects = blocks('redirects').map((b) => ({
    from: scalar(b, 'from'), to: scalar(b, 'to'),
    status: Number(scalar(b, 'status') ?? 301), force: scalar(b, 'force') === 'true',
  })).filter((r) => r.from && r.to);
  const headers = blocks('headers').map((b) => {
    const values = {};
    const vm = b.match(/\[headers\.values\]([\s\S]*)/);
    if (vm) for (const line of vm[1].split('\n')) {
      const m = line.match(/^\s*([A-Za-z0-9-]+)\s*=\s*"""?([\s\S]*?)"""?\s*$/) || line.match(/^\s*([A-Za-z0-9-]+)\s*=\s*"([^"]*)"/);
      if (m) values[m[1]] = m[2].replace(/\s+/g, ' ').trim();
    }
    return { for: scalar(b, 'for'), values };
  }).filter((h) => h.for);
  return { redirects, headers };
}

const globToRe = (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '(.*)') + '$');
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.xml':'application/xml', '.txt':'text/plain; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png',
  '.webp':'image/webp', '.jpg':'image/jpeg', '.ico':'image/x-icon', '.woff2':'font/woff2' };
const isFile = (p) => existsSync(p) && statSync(p).isFile();

export function createNetlifyStaticServer({ dist = 'dist', toml = 'netlify.toml', gzip = false, spaShellFallback = false } = {}) {
  const root = resolve(dist);
  const { redirects, headers: headerRules } = parseNetlifyConfig(readFileSync(toml, 'utf8'));
  const staticPath = (pathname) => {
    const p = join(root, decodeURIComponent(pathname));
    return p === root || p.startsWith(root + sep) ? p : null;
  };
  const resolveStatic = (pathname) => {
    const p = staticPath(pathname);
    if (!p) return null;
    if (isFile(p)) return p;
    if (isFile(join(p, 'index.html'))) return join(p, 'index.html');
    if (isFile(p + '.html')) return p + '.html';
    // A plain Vite build still names its shell index.html. Only allow-listed
    // app.html rewrites may use it; missing routes must remain 404s.
    if (spaShellFallback && pathname === '/app.html' && isFile(join(root, 'index.html'))) return join(root, 'index.html');
    return null;
  };

  return createServer((req, res) => {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
      decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400); res.end(); return;
    }
    const pathname = url.pathname;
    const send = (status, file) => {
      let body = file ? readFileSync(file) : Buffer.from('');
      const type = MIME[extname(file ?? '')] ?? 'application/octet-stream';
      const headers = { 'Content-Type': type };
      // Header rules match the REQUEST path, never the rewritten app.html path.
      for (const h of headerRules) if (globToRe(h.for).test(pathname)) Object.assign(headers, h.values);
      // Lighthouse must measure compressed text, as served by Netlify, rather
      // than report the raw JS transfer as a production performance problem.
      if (gzip && /^(text\/|application\/(javascript|json)|image\/svg)/.test(type)) {
        headers.Vary = headers.Vary ? `${headers.Vary}, Accept-Encoding` : 'Accept-Encoding';
        const acceptsGzip = (req.headers['accept-encoding'] || '').split(',').some((part) => {
          const [encoding, ...params] = part.trim().split(';');
          return encoding === 'gzip' && !params.some((p) => /^\s*q\s*=\s*0(?:\.0*)?\s*$/.test(p));
        });
        if (acceptsGzip) {
          body = gzipSync(body);
          headers['Content-Encoding'] = 'gzip';
        }
      }
      headers['Content-Length'] = body.length;
      res.writeHead(status, headers);
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    const applyRules = (onlyForced) => {
      for (const r of redirects) {
        if (/^https?:\/\//.test(r.from) || r.force !== onlyForced) continue;
        const m = globToRe(r.from).exec(pathname);
        if (!m) continue;
        const target = r.to.replace(':splat', m[1] ?? '');
        if (r.status === 301 || r.status === 302) {
          res.writeHead(r.status, { Location: target }); res.end(); return true;
        }
        if (target.startsWith('/.netlify/functions/')) {
          res.writeHead(501, { 'Content-Type': 'text/plain' }); res.end('function not served locally'); return true;
        }
        const file = resolveStatic(target);
        if (file) { send(r.status, file); return true; }
      }
      return false;
    };

    if (applyRules(true)) return;
    // Dotted level slugs are directories too: extname() cannot decide this.
    const directPath = staticPath(pathname);
    if (!pathname.endsWith('/') && directPath && isFile(join(directPath, 'index.html'))) {
      res.writeHead(301, { Location: pathname + '/' + url.search }); res.end(); return;
    }
    const direct = resolveStatic(pathname);
    if (direct) { send(200, direct); return; }
    if (applyRules(false)) return;
    const notFound = join(root, '404.html');
    send(404, isFile(notFound) ? notFound : null);
  });
}
