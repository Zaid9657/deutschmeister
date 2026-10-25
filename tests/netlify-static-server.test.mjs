import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { createNetlifyStaticServer } from '../scripts/lib/netlify-static-server.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = '<!doctype html><title>SPA shell</title>';
const home = '<!doctype html><title>Astro home</title>';
const notFound = '<!doctype html><title>Not found</title>';

function fixture(t, { gzip = false, extra = '', plainVite = false } = {}) {
  const cache = join(root, '.cache');
  mkdirSync(cache, { recursive: true });
  const dir = mkdtempSync(join(cache, 'netlify-server-test-'));
  const dist = join(dir, 'dist');
  const files = {
    'index.html': home, '404.html': notFound,
    'pricing/index.html': '<title>Astro pricing</title>',
    'grammar/a1.1/index.html': '<title>Grammar A1.1</title>',
    'assets/app.js': 'console.log("compressed asset");'.repeat(100),
    'logo.png': Buffer.from([137, 80, 78, 71]),
  };
  if (!plainVite) files['app.html'] = app;
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dist, name)), { recursive: true });
    writeFileSync(join(dist, name), body);
  }
  const toml = join(dir, 'netlify.toml');
  writeFileSync(toml, extra + '\n' + readFileSync(join(root, 'netlify.toml'), 'utf8'));
  const server = createNetlifyStaticServer({ dist, toml, gzip, spaShellFallback: plainVite });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  // Exercise the server's actual request handler without binding a port, which
  // restricted agent environments prohibit. Preserve all HTTP/body assertions.
  return (path, headers = {}) => new Promise((resolve) => {
    const result = {};
    server.emit('request', {
      url: path, method: 'GET',
      headers: Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])),
    }, {
      writeHead(status, values = {}) {
        result.status = status;
        result.headers = Object.fromEntries(Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]));
      },
      end(body = '') { resolve({ ...result, body: Buffer.from(body) }); },
    });
  });
}

test('browser audits follow Netlify redirects, the SPA allow-list and hard 404s', async (t) => {
  for (const gzip of [false, true]) {
    const get = await fixture(t, { gzip });
    const pricing = await get('/pricing?ref=audit');
    assert.equal(pricing.status, 301);
    assert.equal(pricing.headers.location, '/pricing/?ref=audit');
    for (const path of ['/course/a1.1', '/course/a1.1/l/1', '/support']) {
      const res = await get(path);
      assert.equal(res.status, 200, path);
      assert.equal(res.body.toString(), app, path);
    }
    for (const path of ['/definitely-not-a-page', '/grammar/a1.1/missing/']) {
      const res = await get(path);
      assert.equal(res.status, 404, path);
      assert.equal(res.body.toString(), notFound, path);
    }
  }
});

test('static pages beat unforced rewrites and dotted level directories still redirect', async (t) => {
  const get = await fixture(t, { extra: '[[redirects]]\nfrom = "/pricing/*"\nto = "/app.html"\nstatus = 200\n' });
  const pricing = await get('/pricing/');
  assert.equal(pricing.status, 200);
  assert.equal(pricing.body.toString(), '<title>Astro pricing</title>');
  const level = await get('/grammar/a1.1?x=1');
  assert.equal(level.status, 301);
  assert.equal(level.headers.location, '/grammar/a1.1/?x=1');
});

test('configured headers match the request path, not the rewritten shell path', async (t) => {
  const get = await fixture(t, { extra: '[[headers]]\nfor = "/support"\n[headers.values]\nX-Audit-Request = "support"\n' });
  const support = await get('/support?ref=audit');
  assert.equal(support.headers['x-audit-request'], 'support');
  assert.equal(support.headers['x-frame-options'], 'DENY');
  assert.equal(support.headers['x-robots-tag'], undefined);
  const shell = await get('/app.html');
  assert.equal(shell.headers['x-robots-tag'], 'noindex');
  assert.equal(shell.headers['x-audit-request'], undefined);
  const asset = await get('/assets/app.js');
  assert.equal(asset.headers['cache-control'], 'public, max-age=31536000, immutable');
  const missing = await get('/missing');
  assert.equal(missing.headers['x-frame-options'], 'DENY');
});

test('Lighthouse mode preserves gzip for text assets and rewritten HTML', async (t) => {
  const get = await fixture(t, { gzip: true });
  for (const path of ['/assets/app.js', '/course/a1.1']) {
    const plain = await get(path);
    const compressed = await get(path, { 'Accept-Encoding': 'br, gzip' });
    assert.equal(compressed.headers['content-encoding'], 'gzip');
    assert.equal(Number(compressed.headers['content-length']), compressed.body.length);
    assert.equal(compressed.headers.vary, 'Accept-Encoding');
    assert.deepEqual(gunzipSync(compressed.body), plain.body);
  }
  const binary = await get('/logo.png', { 'Accept-Encoding': 'gzip' });
  assert.equal(binary.headers['content-encoding'], undefined);
  const declined = await get('/support', { 'Accept-Encoding': 'gzip;q=0, br' });
  assert.equal(declined.headers['content-encoding'], undefined);
  assert.equal(declined.body.toString(), app);
});

test('forced redirects win over static files and function rewrites stay explicit 501s', async (t) => {
  const get = await fixture(t, { extra: '[[redirects]]\nfrom = "/pricing/"\nto = "/moved/"\nstatus = 302\nforce = true\n' });
  const pricing = await get('/pricing/');
  assert.equal(pricing.status, 302);
  assert.equal(pricing.headers.location, '/moved/');
  const feed = await get('/podcast-feed.xml');
  assert.equal(feed.status, 501);
  assert.equal(feed.body.toString(), 'function not served locally');
});

test('plain Vite shell compatibility is confined to allow-listed app rewrites', async (t) => {
  const get = await fixture(t, { gzip: true, plainVite: true });
  assert.equal((await get('/course/a1.1')).body.toString(), home);
  const missing = await get('/not-a-route');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.toString(), notFound);
});

test('encoded traversal cannot escape dist and invalid escapes do not crash the server', async (t) => {
  const get = await fixture(t);
  assert.equal((await get('/%2e%2e%2fnetlify.toml')).status, 404);
  assert.equal((await get('/%ZZ')).status, 400);
  assert.equal((await get('/support')).status, 200);
});

test('all local audit servers consume the shared Netlify routing implementation', () => {
  for (const name of ['serve-like-netlify.mjs', 'evaluate-site.mjs', 'lighthouse-batch.mjs']) {
    const source = readFileSync(join(root, 'scripts', name), 'utf8');
    assert.match(source, /import .*createNetlifyStaticServer.*from '\.\/lib\/netlify-static-server\.mjs'/, name);
    assert.match(source, /createNetlifyStaticServer\(/, name);
    assert.doesNotMatch(source, /SPA_PREFIXES|createServer\(/, name);
  }
});
