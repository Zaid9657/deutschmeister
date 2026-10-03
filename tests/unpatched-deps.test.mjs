// Guard: packages with an advisory and NO patched release stay build-time only.
//
// MEASURED 2026-10-03 (security agent, `npm audit --omit=dev`): astro-site read
// 8 high + 1 critical, up from 1 high + 1 critical on 2026-10-02. Neither
// lockfile had changed since #161 (2026-09-28). Two advisories had been
// published in between, and npm has no fixed version for either:
//
//   braces <=3.0.3                GHSA-vfj7-8cjw-p6xm (npm 1240992, CVSS 7.5)
//     Stack exhaustion on a deeply nested brace pattern. 3.0.3 is the newest
//     braces there is. It reaches us through micromatch, fast-glob and
//     chokidar 3 under tailwindcss 3 and @astrojs/tailwind, so npm counts six
//     packages "high" for this one advisory.
//   http-cache-semantics <=4.2.0  GHSA-ch52-4w7c-c8xp (npm 1240991, CVSS 7.5)
//     max-stale handling can serve one user's cached response to another.
//     4.2.0 is the newest. Astro 5 imports it only in its build-time
//     remote-image fetch (astro/dist/assets/build/remote.js, imported only by
//     assets/build/generate.js), which tests/astro-deps.test.mjs keeps off.
//
// sharp's libvips/libheif advisories (GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c)
// belong to the same class: the fix (0.35.4) is outside astro 5's ^0.34 range.
//
// Each of these hurts only when it processes input an outsider controls: a glob
// pattern, an HTTP cache shared between users, an uploaded image. Here they run
// only at build time, on files from this repository: tailwind's content globs,
// and scripts/optimize-images.cjs and scripts/generate-og-image.mjs on our own
// images. Two rules keep it that way until a fixed release or the majors
// (tailwind 4, astro 7: SCORECARD #14b) land:
//
// 1. NO RUNTIME IMPORT. Nothing that runs after the build imports them: not
//    the SPA (src/), not the Netlify functions (netlify/functions/), not the
//    edge functions, and not astro-site/src (its islands are bundled for the
//    browser). The functions bundler resolves an import from node_modules
//    whether npm marked the package dev or not, so the import, not the
//    lockfile flag, is the boundary. scripts/ is build tooling and may import
//    them; the scan runs there too, to prove the scanner sees real imports.
//
// 2. ROOT PRODUCTION TREE STAYS CLEAN. The root lockfile holds them only as dev
//    dependencies, so `npm audit --omit=dev` on the root tree stays at 0 high.
//    A new production dependency that pulls one in raises the measured number
//    and needs a security review first.
//
// When a fixed version ships, `npm audit fix` (no --force) in that tree is the
// fix, and the daily pulse sees it. Tests run offline, so this file does not
// query the advisory database; it holds the reachability line in between.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

/** Packages with an open advisory and no fixed version reachable today. */
const UNPATCHED = ['braces', 'micromatch', 'fast-glob', 'chokidar', 'http-cache-semantics', 'sharp'];

/** Code that runs after the build: in the browser or as a server function. */
const RUNTIME_DIRS = ['src', 'netlify/functions', 'netlify/edge-functions', 'astro-site/src'];

const CODE = /\.(m?js|cjs|jsx|ts|tsx|astro)$/;
const SKIP = new Set(['node_modules', 'dist', '.astro', '.netlify']);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (SKIP.has(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : CODE.test(e.name) ? [p] : [];
  });
}

const names = UNPATCHED.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
// import x from 'pkg' · import 'pkg' · export … from 'pkg' · import('pkg') · require('pkg'),
// with or without a subpath ('fast-glob/out/settings').
const IMPORT = new RegExp(
  String.raw`(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(['"\`])(${names})(?:\/[^'"\`]*)?\1`,
  'g',
);

function importsIn(file) {
  const src = readFileSync(file, 'utf8');
  return [...src.matchAll(IMPORT)].map((m) => `${path.relative(ROOT, file)}: ${m[2]}`);
}

test('the import pattern catches every import form (scanner self-test)', () => {
  const caught = [
    "import sharp from 'sharp';",
    'import { glob } from "fast-glob";',
    "import 'braces';",
    "export { default } from 'micromatch';",
    "const c = await import('chokidar');",
    "const CachePolicy = require('http-cache-semantics');",
    "import settings from 'fast-glob/out/settings';",
    'const s = require(`sharp`);',
  ];
  for (const line of caught) {
    assert.equal([...line.matchAll(IMPORT)].length, 1, `not caught: ${line}`);
  }
  const ignored = [
    "import x from 'sharp-cli';", // a different package
    "import x from 'my-braces';",
    "const label = 'sharp';", // a string, not an import
    '// we used to import fast-glob here',
  ];
  for (const line of ignored) {
    assert.equal([...line.matchAll(IMPORT)].length, 0, `false positive: ${line}`);
  }
});

test('no runtime code imports a package with an unpatched advisory', () => {
  const files = RUNTIME_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
  // Not vacuous: 428 runtime files on 2026-10-03 (src 289, netlify/functions 73, astro-site/src 66).
  assert.ok(files.length >= 300, `only ${files.length} runtime files scanned; did a directory move?`);
  const hits = files.flatMap(importsIn);
  assert.deepEqual(
    hits,
    [],
    'A runtime import of a package whose advisory has no fix. It must only ever see repository files at build time ' +
      '(an outsider-controlled glob, cache or image makes the advisory live). Do the work in scripts/ at build time, ' +
      `or wait for a fixed release:\n${hits.join('\n')}`,
  );
});

test('the scanner sees the real build-time imports in scripts/ (not vacuous)', () => {
  const hits = walk(path.join(ROOT, 'scripts')).flatMap(importsIn);
  assert.ok(
    hits.some((h) => h.endsWith(': sharp')),
    `expected scripts/optimize-images.cjs or scripts/generate-og-image.mjs to import sharp; found:\n${hits.join('\n') || '(none)'}`,
  );
});

test('the root lockfile carries them only as dev dependencies (npm audit --omit=dev stays 0 high)', () => {
  const pkgs = JSON.parse(readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8')).packages;
  const prod = [];
  let seen = 0;
  for (const [key, entry] of Object.entries(pkgs)) {
    if (!key) continue;
    const name = key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length);
    if (!UNPATCHED.includes(name)) continue;
    seen++;
    if (!entry.dev) prod.push(`${key}@${entry.version}`);
  }
  // Not vacuous: tailwind 3 and the image scripts bring 5 of the 6 in as dev today.
  assert.ok(seen >= 4, `only ${seen} of ${UNPATCHED.join(', ')} found in package-lock.json; is the parser broken?`);
  assert.deepEqual(
    prod,
    [],
    `a production dependency now pulls in a package with an unpatched advisory. Get a security review of whether ` +
      `runtime input can reach it before merging:\n${prod.join('\n')}`,
  );
});
