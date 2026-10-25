// A stale lazy chunk reloads the app once in every browser
// (src/components/ErrorBoundary.jsx, src/main.jsx).
//
// The defect this closes (cross-check 2026-10-25, SHL-14, C-118): after a
// deploy the old hashed chunks are gone (/assets/* 404s), and the next lazy
// route import rejects. isChunkLoadError knew only Chrome's wording, so on
// Safari/iOS ("Importing a module script failed.") and Firefox ("error loading
// dynamically imported module: …") learners got "Something went wrong" instead
// of the automatic reload, several times a day. Nothing listened for Vite's own
// vite:preloadError event either.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function boundaryHelpers() {
  const src = read('src/components/ErrorBoundary.jsx');
  const pieces = [
    src.match(/const CHUNK_ERROR_MESSAGES = \[[\s\S]*?\];/),
    src.match(/export function isChunkLoadError\(error\) \{[\s\S]*?\n\}/),
    src.match(/const RELOAD_KEY = '[^']+';/),
    src.match(/export function reloadForStaleChunk\(now = Date\.now\(\)\) \{[\s\S]*?\n\}/),
  ];
  pieces.forEach((piece, i) => assert.ok(piece, `ErrorBoundary.jsx helper ${i} not found`));
  const session = new Map();
  let reloads = 0;
  const api = vm.runInNewContext(`${pieces.map((p) => p[0].replace(/^export /, '')).join('\n')}\n({ isChunkLoadError, reloadForStaleChunk });`, {
    safeGet: (key) => session.get(key) ?? null,
    safeSet: (key, value) => { session.set(key, value); return true; },
    window: { location: { reload: () => { reloads += 1; } } },
  });
  return { ...api, reloads: () => reloads };
}

const BROWSER_MESSAGES = {
  chrome: 'Failed to fetch dynamically imported module: https://deutsch-meister.de/assets/LevelTest-Bq3x.js',
  safari: 'Importing a module script failed.',
  firefox: 'error loading dynamically imported module: https://deutsch-meister.de/assets/LevelTest-Bq3x.js',
  vite: 'Unable to preload CSS for /assets/LevelTest-9f2c.css',
};

test('the stale-chunk error is recognised in Chrome, Safari/iOS and Firefox', () => {
  const { isChunkLoadError } = boundaryHelpers();
  for (const [browser, message] of Object.entries(BROWSER_MESSAGES)) {
    assert.equal(isChunkLoadError(new TypeError(message)), true, browser);
  }
});

test('ordinary errors are not mistaken for a new deploy', () => {
  const { isChunkLoadError } = boundaryHelpers();
  for (const error of [new TypeError("Cannot read properties of undefined (reading 'map')"), new Error(''), null, undefined]) {
    assert.equal(isChunkLoadError(error), false, String(error?.message));
  }
});

test('the reload happens once per 10 seconds, never in a loop', () => {
  const { reloadForStaleChunk, reloads } = boundaryHelpers();
  const t0 = Date.parse('2026-10-25T10:00:00Z');
  assert.equal(reloadForStaleChunk(t0), true);
  assert.equal(reloadForStaleChunk(t0 + 3_000), false, 'the reloaded page failed again: show the error screen');
  assert.equal(reloads(), 1);
  assert.equal(reloadForStaleChunk(t0 + 10_001), true);
  assert.equal(reloads(), 2);
});

test("the boundary and Vite's preload event share that one guard", () => {
  const boundary = read('src/components/ErrorBoundary.jsx');
  assert.match(boundary, /if \(isChunkLoadError\(error\) && reloadForStaleChunk\(\)\) return;/);
  const main = read('src/main.jsx');
  assert.match(main, /^import ErrorBoundary, \{ reloadForStaleChunk \} from '\.\/components\/ErrorBoundary';$/m);
  assert.match(main, /window\.addEventListener\('vite:preloadError', \(\) => \{ reloadForStaleChunk\(\); \}\);/);
});
