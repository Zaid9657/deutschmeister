// One <h1> per SPA screen. index.html carries a visually-hidden identity <h1>
// for crawlers that never run JavaScript; prerendered routes strip it at build
// time, and src/main.jsx removes it on mount for every other route, so a
// signed-in screen (/signup, /login, /dashboard …) never announces two.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('the shell identity <h1> is removed before the app renders its own', () => {
  const shell = read('index.html');
  assert.match(shell, /<body>[\s\S]*?\n\s*<h1 style="position:absolute;[^"]*">[^<]+<\/h1>\n\s*<div id="root"><\/div>/, 'the shell h1 sits directly in <body>, before #root');
  const main = read('src/main.jsx');
  const removal = main.indexOf(`document.querySelector('body > h1[style*="position:absolute"]')?.remove();`);
  assert.ok(removal > 0, 'main.jsx removes the shell h1');
  assert.ok(removal < main.indexOf('createRoot('), 'before the first render');
  // The prerender keeps stripping it for the routes it writes.
  assert.match(read('scripts/prerender-spa-routes.mjs'), /'shell identity h1'/);
});
