// Serve dist/ the way Netlify serves it, so a local audit sees the real headers,
// redirects and SPA rewrites instead of bare static-file behaviour. Parses
// netlify.toml directly, so there is no hand-copied rule table to drift.
//
//   node scripts/serve-like-netlify.mjs [dist] [netlify.toml] [port]
//
// Why this exists: a plain static server reports /faq as a 404 (it is an SPA
// rewrite), misses X-Robots-Tag: noindex on app.html, and serves /pricing as 200
// instead of 301-ing to /pricing/ — so every one of those becomes a false SEO
// finding. See docs/seo-routines/claude-seo.md.
//
// Two Netlify semantics this gets right, both easy to invert:
//   1. Static files beat unforced redirect rules. That is *why* the Astro pages
//      win over the SPA allow-list for /leitfaden/* and /vergleich/*.
//   2. No extname() guard on the trailing-slash redirect — level slugs like
//      "a1.1" contain a dot and would look like they carry a ".1" extension.
//
// Not a Netlify emulator: functions are not run (501), and the forced
// www -> apex redirect is host-scoped so it cannot apply on loopback.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const DIST = resolve(process.argv[2] ?? 'dist');
const TOML = resolve(process.argv[3] ?? 'netlify.toml');
const PORT = Number(process.argv[4] ?? 4178);

// --- parse the [[headers]] and [[redirects]] blocks -------------------------
const toml = readFileSync(TOML, 'utf8');
const blocks = (name) => {
  const out = [];
  const re = new RegExp(`\\[\\[${name}\\]\\]([\\s\\S]*?)(?=\\n\\[|$)`, 'g');
  let m;
  while ((m = re.exec(toml))) out.push(m[1]);
  return out;
};
const scalar = (body, key) => {
  const m = body.match(new RegExp(`^\\s*${key}\\s*=\\s*(?:"([^"]*)"|(\\d+)|(true|false))`, 'm'));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
};

const REDIRECTS = blocks('redirects').map((b) => ({
  from: scalar(b, 'from'),
  to: scalar(b, 'to'),
  status: Number(scalar(b, 'status') ?? 301),
  force: scalar(b, 'force') === 'true',
})).filter((r) => r.from && r.to);

const HEADERS = blocks('headers').map((b) => {
  const values = {};
  const vm = b.match(/\[headers\.values\]([\s\S]*)/);
  if (vm) for (const line of vm[1].split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9-]+)\s*=\s*"""?([\s\S]*?)"""?\s*$/) || line.match(/^\s*([A-Za-z0-9-]+)\s*=\s*"([^"]*)"/);
    if (m) values[m[1]] = m[2].replace(/\s+/g, ' ').trim();
  }
  return { for: scalar(b, 'for'), values };
}).filter((h) => h.for);

const globToRe = (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '(.*)') + '$');

// --- static resolution ------------------------------------------------------
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.xml':'application/xml', '.txt':'text/plain; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png',
  '.webp':'image/webp', '.jpg':'image/jpeg', '.ico':'image/x-icon', '.woff2':'font/woff2' };
const isFile = (p) => existsSync(p) && statSync(p).isFile();

function resolveStatic(pathname) {
  const p = join(DIST, decodeURIComponent(pathname));
  if (isFile(p)) return p;
  if (isFile(join(p, 'index.html'))) return join(p, 'index.html');
  if (isFile(p + '.html')) return p + '.html';
  return null;
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = url.pathname;

  const send = (status, file, extra = {}) => {
    const body = file ? readFileSync(file) : Buffer.from('');
    const headers = { 'Content-Type': MIME[extname(file ?? '')] ?? 'application/octet-stream', ...extra };
    for (const h of HEADERS) if (globToRe(h.for).test(pathname)) Object.assign(headers, h.values);
    // Netlify applies header rules to the REQUEST path; app.html's noindex is
    // keyed to the served file, so re-apply it when a rewrite landed there.
    if (file && file.endsWith('/app.html')) headers['X-Robots-Tag'] = 'noindex';
    res.writeHead(status, headers);
    res.end(body);
  };

  // Netlify precedence: forced redirects win, then STATIC FILES, then the
  // remaining redirect/rewrite rules. Getting this order wrong is what makes
  // the Astro pages lose to the SPA allow-list — they must win.
  const applyRules = (onlyForced) => {
    for (const r of REDIRECTS) {
      if (/^https?:\/\//.test(r.from)) continue;          // host-scoped (www->apex): n/a on localhost
      if (onlyForced && !r.force) continue;
      if (!onlyForced && r.force) continue;
      const m = globToRe(r.from).exec(pathname);
      if (!m) continue;
      const target = r.to.replace(':splat', m[1] ?? '');
      if (r.status === 301 || r.status === 302) {
        res.writeHead(r.status, { Location: target }); res.end(); return true;
      }
      if (target.startsWith('/.netlify/functions/')) {      // functions aren't running locally
        res.writeHead(501, { 'Content-Type': 'text/plain' }); res.end('function not served locally'); return true;
      }
      const f = resolveStatic(target);
      if (f) { send(r.status, f); return true; }
    }
    return false;
  };

  // 1. forced redirects (www -> apex)
  if (applyRules(true)) return;

  // 2. Netlify "pretty URLs": /pricing -> 301 /pricing/ when the directory exists
  // NB: no extname() guard — level slugs like "a1.1" look like they have a file
  // extension. The directory-index test is the reliable signal.
  if (!pathname.endsWith('/') && isFile(join(DIST, pathname, 'index.html'))) {
    res.writeHead(301, { Location: pathname + '/' + url.search }); res.end(); return;
  }

  // 3. static files win over unforced rules
  const direct = resolveStatic(pathname);
  if (direct) { send(200, direct); return; }

  // 4. remaining redirect/rewrite rules (SPA allow-list, uppercase collapses, 404 catch-all)
  if (applyRules(false)) return;

  // 5. catch-all 404
  const nf = join(DIST, '404.html');
  send(404, isFile(nf) ? nf : null);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`serving ${DIST} on http://127.0.0.1:${PORT}`);
  console.log(`${REDIRECTS.length} redirect rules, ${HEADERS.length} header rules from ${TOML}`);
});
