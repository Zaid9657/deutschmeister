import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('English discovery routes declare English and use English headings', () => {
  const grammar = read('astro-site/src/pages/grammar/index.astro');
  const level = read('astro-site/src/pages/grammar/[level].astro');
  const seo = read('src/data/seoRoutes.js');

  assert.match(grammar, /lang="en"/);
  assert.match(grammar, />\s*German Grammar\s*</);
  assert.match(level, /lang="en"/);
  assert.match(level, /German Grammar/);
  assert.match(seo, /'\/faq':\s*{[\s\S]*?title: 'Frequently Asked Questions'/);
  assert.match(seo, /'\/ueber-uns':\s*{[\s\S]*?title: 'About Deutschmeister'/);
  assert.doesNotMatch(seo, /'\/(?:faq|ueber-uns)':\s*{[\s\S]*?lang: 'de'/);
});

test('every German acquisition template shows the shared language notice', () => {
  const templates = [
    'astro-site/src/pages/leitfaden/index.astro',
    'astro-site/src/pages/leitfaden/[slug].astro',
    'astro-site/src/pages/pruefung/index.astro',
    'astro-site/src/pages/pruefung/[slug].astro',
    'astro-site/src/pages/vergleich/index.astro',
    'astro-site/src/pages/vergleich/[slug].astro',
    'astro-site/src/pages/telc-b1-komplettvorbereitung.astro',
  ];

  for (const path of templates) {
    const source = read(path);
    assert.match(source, /lang="de"/, `${path} must retain its German document language`);
    assert.match(source, /import LanguageNotice/, `${path} must import the shared notice`);
    assert.match(source, /<LanguageNotice/, `${path} must render the shared notice`);
  }
});

test('English navigation labels identify German destinations before the click', () => {
  const navigation = read('src/data/navigation.js');
  const astroNavigation = read('astro-site/src/data/navigation.js');
  assert.equal(navigation, astroNavigation, 'the navigation twins must remain byte-identical');

  for (const href of ['/pruefung/', '/leitfaden/', '/vergleich/']) {
    const escaped = href.replaceAll('/', '\\/');
    assert.match(
      navigation,
      new RegExp(`labelEn: '[^']*(?:DE|German)[^']*'[^\\n]*href: '${escaped}'`),
      `${href} needs an explicit German-language label`,
    );
  }
});
