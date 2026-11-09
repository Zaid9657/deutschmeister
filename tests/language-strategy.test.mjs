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

  // The guide renderer serves German guides and, since d2 (2026-10-26), English
  // ones: it declares each page's own language (guideLang, default 'de') and
  // shows the notice on every German page.
  const PER_GUIDE = 'astro-site/src/pages/leitfaden/[slug].astro';
  for (const path of templates) {
    const source = read(path);
    if (path === PER_GUIDE) {
      assert.match(source, /const lang = guideLang\(guide\);/, `${path} must derive the document language from the guide`);
      assert.match(source, /lang=\{lang\}/, `${path} must declare that language`);
      assert.match(source, /\{lang === 'de' && <div[^\n]*<LanguageNotice/, `${path} must show the notice on German guides`);
    } else {
      assert.match(source, /lang="de"/, `${path} must retain its German document language`);
    }
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

// The lesson player is a product screen (English document) whose CONTENT is
// German: the chrome defaults to English and Deutsch-Modus is the learner's
// opt-in, persisted in `dm_lesson_lang` (src/lib/lesson/strings.js).
test('the lesson chrome defaults to English and only the learner switches it to German', async () => {
  const { DEFAULT_LESSON_LANG, LESSON_LANG_KEY, LESSON_LANGS, readLessonLang, t } = await import('../src/lib/lesson/strings.js');
  assert.equal(DEFAULT_LESSON_LANG, 'en');
  assert.equal(LESSON_LANG_KEY, 'dm_lesson_lang');
  assert.deepEqual(LESSON_LANGS, ['en', 'de']);
  assert.equal(readLessonLang(), 'en', 'no window, no flag → English');
  assert.equal(t('stage.pretest.eyebrow'), 'Step 1 · Try first');
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.match(player, /useLessonLang\(\)/, 'the player reads the chrome language');
  assert.ok(!/useLessonLang\('de'\)|DEFAULT_LESSON_LANG = 'de'/.test(read('src/lib/lesson/strings.js')));
});

test('a guide is German unless it says otherwise', async () => {
  const { GUIDES, guideLang } = await import('../astro-site/src/data/guides/index.js');
  assert.equal(guideLang({}), 'de');
  for (const g of GUIDES) if (!g.lang) assert.equal(guideLang(g), 'de', g.slug);
});
