// The English preference never relabels a German page as English
// (astro-site/src/layouts/Layout.astro, the dm_lang script).
//
// The defect this closes (cross-check 2026-10-25, SHL-20, X-059): with
// dm_lang=en the layout set document.documentElement.lang = 'en' on every
// static page and then translated only [data-en] elements — of which there are
// none today. German guides, comparisons and exam hubs (lang="de") were
// announced as English, and screen readers read their German in an English
// voice. Now only a translated element is marked English; the page keeps the
// language it declares.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const langScript = () => {
  const layout = read('astro-site/src/layouts/Layout.astro');
  const script = [...layout.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)].map((m) => m[1])
    .find((s) => s.includes("localStorage.getItem('dm_lang')"));
  assert.ok(script, 'Layout.astro reads the language preference');
  return script;
};

function run({ pref, pageLang = 'de', translatable = [] }) {
  const documentElement = { lang: pageLang };
  const elements = translatable.map((en) => ({
    textContent: 'Deutsch',
    attributes: { 'data-en': en },
    getAttribute(name) { return this.attributes[name] ?? null; },
    setAttribute(name, value) { this.attributes[name] = value; },
  }));
  vm.runInNewContext(langScript(), {
    localStorage: { getItem: (key) => (key === 'dm_lang' ? pref : null) },
    document: { documentElement, querySelectorAll: (selector) => (selector === '[data-en]' ? elements : []) },
  });
  return { documentElement, elements };
}

test('a German page with nothing translated stays German under the English preference', () => {
  assert.equal(run({ pref: 'en', pageLang: 'de' }).documentElement.lang, 'de');
});

test('translated elements switch to English and say so; the page keeps its language', () => {
  const { documentElement, elements } = run({ pref: 'en', pageLang: 'de', translatable: ['Practice', 'Rules'] });
  assert.equal(documentElement.lang, 'de');
  assert.deepEqual(elements.map((el) => el.textContent), ['Practice', 'Rules']);
  assert.deepEqual(elements.map((el) => el.attributes.lang), ['en', 'en']);
});

test('without the English preference nothing changes', () => {
  const { documentElement, elements } = run({ pref: null, translatable: ['Practice'] });
  assert.equal(documentElement.lang, 'de');
  assert.equal(elements[0].textContent, 'Deutsch');
});
