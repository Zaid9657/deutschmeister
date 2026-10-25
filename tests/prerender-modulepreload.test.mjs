// A prerendered SPA route preloads its own page chunk
// (scripts/prerender-spa-routes.mjs, vite.config.js build.manifest).
//
// The finding this closes (cross-check 2026-10-25, SHL-16, X-064): the
// prerendered pages modulepreloaded only the three vendor chunks. Their page
// component is React.lazy, and main.jsx uses createRoot (no hydration), so the
// prerendered content was replaced by the Suspense spinner until the page chunk
// (LevelTest and SentenceXRay ≈ 75 KB each) had been discovered — after the
// entry bundle ran — and downloaded: content → spinner → content.
//
// Prerender is not idempotent; verify the built output from a clean build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import viteConfig from '../vite.config.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const PRERENDER = fileURLToPath(new URL('../scripts/prerender-spa-routes.mjs', import.meta.url));
const script = read('scripts/prerender-spa-routes.mjs');
const app = read('src/App.jsx');

const ROUTES = [...script.matchAll(/^ {4}path: '([^']+)',\n {4}dir: '[^']+',\n {4}module: '([^']+)',/gm)]
  .map(([, path, module]) => ({ path, module }));

test('the build writes the manifest the prerender step reads', () => {
  assert.equal(viteConfig.build.manifest, true);
  assert.match(script, /const MANIFEST = join\(DIST, '\.vite', 'manifest\.json'\);/);
  // …and it does not ship: the prerender step deletes it once used.
  assert.match(script, /rmSync\(join\(DIST, '\.vite'\), \{ recursive: true, force: true \}\);/);
});

test('every prerendered route names the page module App.jsx lazy-loads for it', () => {
  const prerendered = [...script.matchAll(/^ {4}path: '([^']+)',/gm)].map((m) => m[1]);
  assert.ok(prerendered.length >= 8, 'premise: the routes are found');
  assert.deepEqual(ROUTES.map((r) => r.path), prerendered, 'every route carries a module');

  const lazy = new Map([...app.matchAll(/^const (\w+) = lazy\(\(\) => import\('\.\/([^']+)'\)\);$/gm)]
    .map(([, name, path]) => [name, `src/${path}`]));
  for (const { path, module } of ROUTES) {
    const at = app.indexOf(`path="${path}"`);
    assert.ok(at > 0, `${path} has no <Route> in App.jsx`);
    const end = app.indexOf('<Route', at);
    const element = app.slice(at, end > 0 ? end : undefined);
    const pages = [...element.matchAll(/<([A-Z]\w*)\b/g)].map((m) => m[1]).filter((name) => lazy.has(name));
    assert.equal(pages.length, 1, `${path}: expected one lazy page component, found ${pages.join(', ') || 'none'}`);
    const imported = lazy.get(pages[0]);
    assert.ok([imported, `${imported}.jsx`, `${imported}.js`].includes(module), `${path}: App.jsx lazy-loads ${imported}, the prerender preloads ${module}`);
    assert.ok(existsSync(new URL(`../${module}`, import.meta.url)), `${module} does not exist`);
  }
});

function chunkPreloads() {
  const fn = script.match(/^function chunkPreloads\(manifestEntries, moduleKey, loaded\) \{[\s\S]*?\n\}/m);
  assert.ok(fn, 'the prerender script computes the preloads in chunkPreloads');
  return vm.runInNewContext(`${fn[0]}\nchunkPreloads;`, {});
}

// The shape of a Vite 5 manifest (dist/.vite/manifest.json), trimmed.
const MANIFEST = {
  'index.html': { file: 'assets/index-a1.js', isEntry: true, imports: ['_vendor-react-b2.js', '_vendor-supabase-c3.js'], dynamicImports: ['src/pages/LevelTest.jsx'] },
  '_vendor-react-b2.js': { file: 'assets/vendor-react-b2.js' },
  '_vendor-supabase-c3.js': { file: 'assets/vendor-supabase-c3.js' },
  '_Card-d4.js': { file: 'assets/Card-d4.js', imports: ['_vendor-react-b2.js'] },
  '_motion-e5.js': { file: 'assets/motion-e5.js', imports: ['_Card-d4.js'] },
  'src/pages/LevelTest.jsx': { file: 'assets/LevelTest-f6.js', isDynamicEntry: true, imports: ['index.html', '_vendor-react-b2.js', '_motion-e5.js', '_Card-d4.js'], dynamicImports: ['src/pages/Later.jsx'], css: ['assets/LevelTest-f6.css'] },
  'src/pages/Later.jsx': { file: 'assets/Later-g7.js', isDynamicEntry: true },
};
const SHELL = new Set(['/assets/index-a1.js', '/assets/vendor-react-b2.js', '/assets/vendor-supabase-c3.js']);

test('the page chunk and its static imports are preloaded, nothing the shell already loads', () => {
  const preloads = [...chunkPreloads()(MANIFEST, 'src/pages/LevelTest.jsx', SHELL)];
  assert.deepEqual(preloads, ['/assets/LevelTest-f6.js', '/assets/motion-e5.js', '/assets/Card-d4.js']);
  assert.ok(!preloads.includes('/assets/Later-g7.js'), 'a dynamic import of the page stays lazy');
});

test('a module the manifest does not know fails the build instead of shipping without preloads', () => {
  assert.throws(() => chunkPreloads()(MANIFEST, 'src/pages/Missing.jsx', SHELL), /not in the build manifest/);
});

// ── the script itself, on a built-looking shell ─────────────────────────────

/** Prerender `shell` into a fresh directory (with `manifest` at .vite/), returning what it wrote. */
function prerender(shell, manifest) {
  const dir = mkdtempSync(join(tmpdir(), 'dm-prerender-modulepreload-'));
  try {
    writeFileSync(join(dir, 'app.html'), shell);
    if (manifest) {
      mkdirSync(join(dir, '.vite'));
      writeFileSync(join(dir, '.vite', 'manifest.json'), JSON.stringify(manifest));
    }
    let failed = false;
    try {
      execFileSync(process.execPath, [PRERENDER, dir], { stdio: 'ignore' });
    } catch {
      failed = true;
    }
    const pages = new Map(ROUTES.map(({ path }) => {
      const file = join(dir, path.slice(1), 'index.html');
      return [path.slice(1), existsSync(file) ? readFileSync(file, 'utf8') : null];
    }));
    return { failed, page: (route) => pages.get(route), manifestLeft: existsSync(join(dir, '.vite')) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const SOURCE_SHELL = read('index.html');
const BUILT_SHELL = SOURCE_SHELL.replace(
  '<script type="module" src="/src/main.jsx"></script>',
  '<script type="module" crossorigin src="/assets/index-a1.js"></script>\n    <link rel="modulepreload" crossorigin href="/assets/vendor-react-b2.js">',
);
const preloadLinks = (html) => [...html.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)">/g)].map((m) => m[1]);

test('a built shell gets each route its page chunk, and the manifest does not ship', () => {
  assert.notEqual(BUILT_SHELL, SOURCE_SHELL, 'premise: the source shell loads /src/main.jsx');
  const manifest = {
    'index.html': { file: 'assets/index-a1.js', isEntry: true, imports: ['_vendor-react-b2.js'] },
    '_vendor-react-b2.js': { file: 'assets/vendor-react-b2.js' },
    '_Card-d4.js': { file: 'assets/Card-d4.js', imports: ['_vendor-react-b2.js'] },
  };
  for (const { module } of ROUTES) {
    const name = module.split('/').pop().replace('.jsx', '');
    manifest[module] = { file: `assets/${name}-x9.js`, isDynamicEntry: true, imports: ['index.html', '_vendor-react-b2.js', '_Card-d4.js'] };
  }
  const out = prerender(BUILT_SHELL, manifest);
  assert.equal(out.failed, false);
  const VENDOR = '/assets/vendor-react-b2.js';
  for (const [route, chunk] of [['speaking', 'SpeakingPage'], ['listening', 'ListeningHome'], ['analyze', 'SentenceXRay']]) {
    const links = preloadLinks(out.page(route));
    assert.deepEqual(links.filter((href) => href !== VENDOR), [`/assets/${chunk}-x9.js`, '/assets/Card-d4.js'], route);
    assert.equal(links.filter((href) => href === VENDOR).length, 1, `${route}: the shell's own preload is not repeated`);
  }
  assert.equal(out.manifestLeft, false, 'dist/.vite is removed: /.vite/manifest.json must not be served');
});

test('a built shell without its manifest fails; the source shell prerenders without preloads', () => {
  const missing = prerender(BUILT_SHELL, null);
  assert.equal(missing.failed, true, 'a build that lost its manifest must not ship silently without preloads');
  const source = prerender(SOURCE_SHELL, null);
  assert.equal(source.failed, false);
  assert.deepEqual(preloadLinks(source.page('speaking')), [], 'nothing hashed to preload in the source shell');
});
