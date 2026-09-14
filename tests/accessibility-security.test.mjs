import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('brand wordmarks use contrast-safe colors on light and dark surfaces', async () => {
  const [logo, footer, layout] = await Promise.all([
    read('src/components/Logo.jsx'),
    read('src/components/Footer.jsx'),
    read('astro-site/src/layouts/Layout.astro'),
  ]);

  assert.match(logo, /wordmarkTone === 'inverse'/);
  assert.match(logo, /text-siegel-deep/);
  assert.doesNotMatch(logo, /color:\s*'#0D9488'/);
  assert.match(footer, /wordmarkTone="inverse"/);
  assert.doesNotMatch(footer, /<Logo size=\{32\} \/>[\s\S]{0,200}Deutsch/);
  assert.match(layout, /Deutsch<span class="text-siegel-deep">Meister<\/span>/);
  assert.match(layout, /Deutsch<span class="text-siegel-wash">Meister<\/span>/);
});

test('footer navigation headings do not skip from the page heading to h3', async () => {
  const [footer, layout] = await Promise.all([
    read('src/components/Footer.jsx'),
    read('astro-site/src/layouts/Layout.astro'),
  ]);

  assert.match(footer, /<h2 className=/);
  assert.doesNotMatch(footer, /<h3 className=/);
  assert.match(layout, /<h2 class="text-white font-semibold/);
  assert.doesNotMatch(layout, /<h3 class="text-white font-semibold/);
});

test('security headers enforce structural CSP while resource policy remains observable', async () => {
  const config = await read('netlify.toml');

  assert.match(config, /Content-Security-Policy = "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests"/);
  assert.match(config, /Content-Security-Policy-Report-Only = "default-src 'self';/);
});

test('Lighthouse launches current headless Chrome without disabling its sandbox', async () => {
  const audit = await read('scripts/lighthouse-audit.js');

  assert.match(audit, /--headless=new/);
  assert.match(audit, /onlyCategories/);
  assert.doesNotMatch(audit, /['"]--no-sandbox['"]/);
});

test('both shells allow browser zoom', async () => {
  const [spa, layout] = await Promise.all([
    read('index.html'),
    read('astro-site/src/layouts/Layout.astro'),
  ]);

  for (const shell of [spa, layout]) {
    assert.match(shell, /width=device-width, initial-scale=1\.0/);
    assert.doesNotMatch(shell, /maximum-scale|user-scalable\s*=\s*no/i);
  }
});
