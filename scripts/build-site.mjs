#!/usr/bin/env node
// The deploy build, as a script instead of an 18-step shell chain in a TOML string.
//
// WHY THIS EXISTS. netlify.toml's command used to be one long `&&` chain ending
// in `|| true`. Shell precedence applies that to the WHOLE chain — any step
// could fail and the command still exited 0. A failed Astro build meant the
// `dist/index.html` → `dist/app.html` rename never ran, so Netlify published a
// dist/ with no app.html: every SPA rewrite pointed at a missing file and "/"
// served the SPA shell, which has no "/" route. A site-wide outage, published
// green. CI does now build the Astro half offline from grammar-content-cache.json
// and checks all ~95 pages, so this is no longer the only gate on the static
// pages — but it is the only one that sees the LIVE database, so it still has to
// be able to fail, and it still has to check what it produced rather than
// assume it.
//
// Every step here throws on a non-zero exit. Only the IndexNow ping is allowed
// to fail, and it says so when it does.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, renameSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ASTRO_DIST = join(ROOT, 'astro-site', 'dist');

let step = 0;
const run = (label, cmd, args, opts = {}) => {
  step += 1;
  console.log(`\n[${String(step).padStart(2, '0')}] ${label}`);
  execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
};

const copyDir = (label, from, to) => {
  step += 1;
  if (!existsSync(from)) {
    throw new Error(`${label}: expected Astro to have produced ${from}, but it does not exist`);
  }
  cpSync(from, to, { recursive: true });
  console.log(`[${String(step).padStart(2, '0')}] copied ${label}`);
};

// `--verify-only` runs the post-conditions against an existing dist/ without
// rebuilding. The checks below are the part of this script that can be
// exercised without Supabase credentials, so they are reachable on their own.
const VERIFY_ONLY = process.argv.includes('--verify-only');

// The top-level directories the Astro build emits, read out of its own pages/
// directory rather than listed here. `trailingSlash: 'always'` means every
// top-level page becomes `<name>/index.html`, so a sub-directory (grammar/,
// leitfaden/, vergleich/) or a bare `.astro` file (pricing, privacy, impressum,
// telc-b1-komplettvorbereitung) each maps to one output directory. index.astro
// and 404.astro are the two exceptions — they emit files at the root, and are
// copied and asserted separately below.
//
// Derived rather than hard-coded because a hard-coded copy of this list is
// exactly how the prerendered-route assertions further down silently stopped
// covering /faq and /ueber-uns. main has since added the telc-b1 landing page
// as a new top-level Astro route; this list picked it up without being edited.
const ASTRO_ROUTES = readdirSync(join(ROOT, 'astro-site', 'src', 'pages'), { withFileTypes: true })
  .filter((e) => e.isDirectory() || (e.name.endsWith('.astro') && !['index.astro', '404.astro'].includes(e.name)))
  .map((e) => e.name.replace(/\.astro$/, ''))
  .sort();

if (ASTRO_ROUTES.length === 0) {
  throw new Error('could not read any top-level route out of astro-site/src/pages');
}

// --- build ------------------------------------------------------------------

if (!VERIFY_ONLY) {
run('SPA: optimize images + vite build', 'npm', ['run', 'build']);
run('Astro: install', 'npm', ['install'], { cwd: join(ROOT, 'astro-site') });
run('Astro: build', 'npm', ['run', 'build'], { cwd: join(ROOT, 'astro-site') });

// --- merge Astro output into dist/ -------------------------------------------
// Order matters: the SPA build above empties dist/, so every copy happens after it.

for (const dir of ASTRO_ROUTES) {
  copyDir(`astro ${dir}/`, join(ASTRO_DIST, dir), join(DIST, dir));
}

mkdirSync(join(DIST, '_astro'), { recursive: true });
copyDir('astro _astro/ chunks', join(ASTRO_DIST, '_astro'), join(DIST, '_astro'));
copyDir('astro 404.html', join(ASTRO_DIST, '404.html'), join(DIST, '404.html'));

// The swap: the SPA shell becomes app.html, and "/" becomes the Astro homepage.
// This is the step whose silent failure caused the outage described above.
step += 1;
if (!existsSync(join(DIST, 'index.html'))) {
  throw new Error('the SPA build did not produce dist/index.html — nothing to rename');
}
renameSync(join(DIST, 'index.html'), join(DIST, 'app.html'));
console.log(`[${String(step).padStart(2, '0')}] dist/index.html → dist/app.html`);

copyDir('astro homepage → dist/index.html', join(ASTRO_DIST, 'index.html'), join(DIST, 'index.html'));
copyDir('astro sitemap', join(ASTRO_DIST, 'sitemap-0.xml'), join(DIST, 'sitemap-0.xml'));

run('prerender the crawlable SPA routes', 'node', ['scripts/prerender-spa-routes.mjs']);
}

// --- post-conditions ---------------------------------------------------------
// Structural facts about dist/ that must hold for the site to work at all. These
// are deliberately content-independent: they do not depend on how many grammar
// topics Supabase returned, only on the choreography above having completed.

const failures = [];
let checked = 0;
const check = (label, ok) => { checked += 1; if (!ok) failures.push(label); };
const exists = (p) => existsSync(join(DIST, p));
const read = (p) => readFileSync(join(DIST, p), 'utf8');
const size = (p) => (exists(p) ? statSync(join(DIST, p)).size : 0);

console.log('\n--- verifying dist/ ---');

// 1. The SPA shell survived the rename. Its absence breaks EVERY SPA rewrite.
check('dist/app.html is missing — every netlify.toml SPA rewrite would 404', exists('app.html'));
check('dist/app.html is suspiciously small', size('app.html') > 2000);

// 2. "/" is the Astro homepage, not the SPA shell. The SPA has no "/" route, so
//    shipping the shell here renders NotFoundPage on the homepage.
check('dist/index.html is missing', exists('index.html'));
if (exists('index.html') && exists('app.html')) {
  const home = read('index.html');
  check(
    'dist/index.html is byte-identical to app.html — the Astro homepage did not land',
    home !== read('app.html'),
  );
  check(
    'dist/index.html does not carry the homepage canonical — it is not the Astro build',
    home.includes('<link rel="canonical" href="https://deutsch-meister.de/"'),
  );
}

// 3. Every top-level Astro route landed as a real static file — the same list
//    the copy loop above walked, so a new Astro page is copied AND asserted
//    without either being edited.
for (const p of [...ASTRO_ROUTES.map((r) => `${r}/index.html`), '404.html']) {
  check(`dist/${p} is missing`, exists(p));
}

// 4. All eight CEFR level pages. A partial grammar copy is otherwise invisible.
for (const level of ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2']) {
  check(`dist/grammar/${level}/index.html is missing`, exists(`grammar/${level}/index.html`));
}

// 5. Astro's JS/CSS chunks, or every island on the static pages is dead.
check('dist/_astro/ is empty — the Astro islands have no code',
  exists('_astro') && readdirSync(join(DIST, '_astro')).length > 0);

// 6. The prerendered SPA routes, which is what crawlers get for those URLs.
//    Derived from the prerenderer's own route table rather than hard-coded: this
//    list was written with six routes and prerender-spa-routes.mjs later grew to
//    eight (/faq, /ueber-uns), so a hard-coded copy silently stopped covering
//    the new ones. Reading the source keeps the two in step by construction.
const prerenderSrc = readFileSync(join(ROOT, 'scripts', 'prerender-spa-routes.mjs'), 'utf8');
const prerendered = [...prerenderSrc.matchAll(/^\s*path: '\/([a-z0-9-]+)',/gm)].map((m) => m[1]);
check('could not read any route out of prerender-spa-routes.mjs', prerendered.length > 0);
for (const r of prerendered) {
  check(`dist/${r}/index.html is missing — prerender did not run`, exists(`${r}/index.html`));
}

if (failures.length) {
  console.error(`\n✗ dist/ failed ${failures.length} post-condition(s):`);
  for (const f of failures) console.error(`    - ${f}`);
  console.error('\nRefusing to publish a broken dist/. Nothing above is optional.');
  process.exit(1);
}
console.log(`✓ dist/ passed all ${checked} structural post-conditions`);

// --- content check -------------------------------------------------------------
// check-built-html.mjs is the repo's real HTML gate, and it is FATAL here.
//
// It was introduced as advisory-only, because at the time CI could run it only
// in --spa-only mode (the Astro half needed Supabase credentials) and a check
// that has never run should not be able to brick a deploy. Both halves of that
// changed: CI now builds the Astro site offline from the committed
// grammar-content-cache.json and runs this check over all ~95 pages, and the
// same full run has been reproduced against this script's own dist/. It is
// observed-green, and CI already fails on it — a deploy gate weaker than the CI
// gate protects nothing.
//
// STRICT_HTML_CHECK=0 is the escape hatch for an emergency deploy. It should be
// a deliberate, temporary act, not a default.
const strict = process.env.STRICT_HTML_CHECK !== '0';
if (!VERIFY_ONLY) {
  try {
    execFileSync('node', ['scripts/check-built-html.mjs', 'dist'], { cwd: ROOT, stdio: 'inherit' });
  } catch {
    if (strict) {
      console.error(
        '\n✗ check-built-html failed — refusing to publish.\n' +
        '  Fix what it reported above. STRICT_HTML_CHECK=0 overrides this, for an\n' +
        '  emergency deploy only.',
      );
      process.exit(1);
    }
    console.error('\n⚠ check-built-html failed but STRICT_HTML_CHECK=0 — publishing anyway.');
  }
}

// --- best-effort ---------------------------------------------------------------
// The ONLY step allowed to fail. Search engines not hearing about a deploy is
// not a reason to fail one.
try {
  if (!VERIFY_ONLY) execFileSync('node', ['scripts/ping-indexnow.mjs'], { cwd: ROOT, stdio: 'inherit' });
} catch {
  console.warn('⚠ IndexNow ping failed — ignored, the deploy is unaffected.');
}

console.log('\n✓ build complete');
