// The Arabic edition's public half (docs/arabic/README.md §5): five Astro pages
// under /ar/, paired with their English twins only where a real equivalent
// exists, every start button opening the app in Arabic, and the copy honest
// about how far the Arabic reaches. Source-level pins; the BUILT html (lang/dir,
// reciprocal hreflang, titles, one h1, sitemap) is checked by
// scripts/check-built-html.mjs against dist/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const ARABIC = /[؀-ۿ]/;

const PAGES = {
  '/ar/': 'astro-site/src/pages/ar/index.astro',
  '/ar/courses/': 'astro-site/src/pages/ar/courses/index.astro',
  '/ar/courses/a1-1/': 'astro-site/src/pages/ar/courses/a1-1.astro',
  '/ar/pricing/': 'astro-site/src/pages/ar/pricing.astro',
  '/ar/help/': 'astro-site/src/pages/ar/help.astro',
};
// Real equivalents only. /ar/help/ has no English twin and names none.
const PAIRS = {
  '/': ['astro-site/src/pages/index.astro', '/ar/'],
  '/courses/': ['astro-site/src/pages/courses/index.astro', '/ar/courses/'],
  '/courses/a1-1/': ['astro-site/src/pages/courses/[level].astro', '/ar/courses/a1-1/'],
  '/pricing/': ['astro-site/src/pages/pricing.astro', '/ar/pricing/'],
};

const { AR_COURSE_HREF, AR_CHROME, COVERAGE_ROWS, arDays, arMonths, arLessons, arRich, LEVEL_OUTCOME_AR } = await import('../astro-site/src/data/i18n/ar.js');
const { TRIAL_DAYS } = await import('../astro-site/src/data/marketing.js');

test('the five Arabic pages exist, declare Arabic, and are self-canonical at their slash URL', () => {
  for (const [url, file] of Object.entries(PAGES)) {
    assert.ok(existsSync(join(ROOT, file)), `${file} is missing`);
    const src = read(file);
    assert.match(src, /lang="ar"/, `${file}: Layout lang="ar"`);
    assert.ok(src.includes(`canonical="https://deutsch-meister.de${url}"`), `${file}: canonical ${url}`);
    assert.match(src, /<h1\b/, `${file}: one visible heading`);
  }
  const layout = read('astro-site/src/layouts/Layout.astro');
  assert.match(layout, /<html lang=\{lang\} dir=\{isArabic \? 'rtl' : undefined\}/, 'an Arabic page is right-to-left');
});

test('hreflang pairs are reciprocal in source and exist only for real twins', () => {
  for (const [en, [file, ar]] of Object.entries(PAIRS)) {
    const enSrc = read(file);
    const arSrc = read(PAGES[ar]);
    const pair = `{ en: '${en}', ar: '${ar}' }`;
    assert.ok(enSrc.includes(pair), `${file} names its Arabic twin ${ar}`);
    assert.ok(arSrc.includes(`alternates={${pair}}`), `${PAGES[ar]} names its English twin ${en}`);
  }
  assert.doesNotMatch(read(PAGES['/ar/help/']), /alternates=/, '/ar/help/ has no English equivalent and claims none');
  // The course template pairs A1.1 only: no other level has an Arabic page.
  assert.match(read('astro-site/src/pages/courses/[level].astro'), /alternates=\{level === 'a1\.1' \? \{ en: '\/courses\/a1-1\/', ar: '\/ar\/courses\/a1-1\/' \} : null\}/);
  const layout = read('astro-site/src/layouts/Layout.astro');
  for (const code of ['en', 'ar', 'x-default']) assert.ok(layout.includes(`hreflang="${code}"`), `Layout emits hreflang ${code}`);
  assert.match(layout, /hreflang="x-default" href=\{abs\(alternates\.en\)\}/, 'x-default is the English page');
});

test('every start button on an Arabic page opens the free course in Arabic', () => {
  assert.equal(AR_COURSE_HREF, '/course/a1.1?lang=ar');
  for (const file of Object.values(PAGES)) {
    const src = read(file);
    for (const m of src.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>(ابدأ A1\.1 مجانًا)<\/a>/g)) {
      assert.equal(m[1], '/course/a1.1?lang=ar', `${file}: "${m[2]}" → ${m[1]}`);
    }
  }
  // The SPA honours ?lang= as an explicit, persisted choice (tests/locale.test.mjs),
  // and the Arabic pages hand sign-up and sign-in the same choice.
  const layout = read('astro-site/src/layouts/Layout.astro');
  assert.match(layout, /const signupHref = lang === 'ar' \? '\/signup\?lang=ar' : navSignupHref;/);
  assert.match(layout, /const loginHref = lang === 'ar' \? '\/login\?lang=ar' : '\/login';/);
  assert.match(layout, /const freeHref = isArabic \? AR_COURSE_HREF : FREE_COURSE_HREF;/);
});

test('the Arabic copy says where it stops: lessons 1–3, English beyond, German grading, English emails and checkout', () => {
  const home = read(PAGES['/ar/']);
  assert.match(home, /<CoverageTable \/>/);
  const rows = COVERAGE_ROWS.map((r) => `${r.what} ${r.where} ${r.note || ''}`).join('\n');
  assert.match(rows, /الدروس 1–3/);
  assert.match(rows, /الدروس 4–12/);
  assert.match(rows, /بالألمانية/, 'AI grading is German');
  assert.match(rows, /رسائل البريد الإلكتروني وصفحة الدفع/, 'emails and checkout are English');
  const pricing = read(PAGES['/ar/pricing/']);
  assert.match(pricing, /AR_LINES\.englishOnly/, 'every paid course is labelled English-support-only');
  // Lemon Squeezy has no Arabic checkout (it follows a supported browser language, else English).
  assert.match(pricing, /صفحة الدفع من <bdi lang="en" dir="ltr">Lemon Squeezy<\/bdi> وهي لا تدعم العربية/);
  assert.match(pricing, /data-course-variant=\{variants\[st\.productKey\]\}/, 'buy buttons only through the shared, variant-guarded checkout');
  assert.match(pricing, /st\.status === 'ticket' && variants\[st\.productKey\]/, 'never a dead checkout');
});

test('no outcome promise, no invented staff or response time, no unlimited claim in the Arabic copy', () => {
  const files = [...Object.values(PAGES), 'astro-site/src/data/i18n/ar.js'];
  for (const f of files) {
    const src = read(f);
    assert.doesNotMatch(src, /نضمن|مضمون|ستنجح|خلال \d+ (ساعة|ساعات|يوم)|فريق الدعم|غير محدود/, `${f}: a promise the product cannot keep`);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${f}: hex literal (tokens only)`);
  }
});

test('figures are derived: counted Arabic agrees with the number, and no digit is typed into a price', () => {
  assert.equal(arDays(7), '7 أيام');
  assert.equal(arDays(14), '14 يومًا');
  assert.equal(arDays(1), 'يوم واحد');
  assert.equal(arMonths(3), '3 أشهر');
  assert.equal(arLessons(12), '12 درسًا');
  assert.equal(arLessons(3), '3 دروس');
  assert.equal(AR_CHROME.startTrial, `ابدأ تجربة ${arDays(TRIAL_DAYS)}`);
  for (const level of ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2']) {
    assert.ok(ARABIC.test(LEVEL_OUTCOME_AR[level]), `${level} has an Arabic description`);
  }
});

test('German inside Arabic is isolated and labelled, never reversed or transliterated', () => {
  assert.equal(arRich('ادعم رأيك بـ«weil»'), 'ادعم رأيك بـ«<bdi lang="de" dir="ltr">weil</bdi>»');
  assert.equal(arRich('**Ich bin Lehrer.**'), '<strong><bdi lang="de" dir="ltr">Ich bin Lehrer.</bdi></strong>');
  assert.equal(arRich('اضغط «تشغيل»'), 'اضغط «تشغيل»', 'an Arabic quotation stays a quotation');
  assert.equal(arRich('<script>'), '&lt;script&gt;', 'escaped before marking');
});

test('the language switch: three endonyms, Arabic first, no flags, the app\'s own store', () => {
  const sw = read('astro-site/src/components/LanguageSwitch.astro');
  const names = [...sw.matchAll(/name: '([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(names, ['العربية', 'English', 'Deutsch']);
  assert.doesNotMatch(sw, /[\u{1F1E6}-\u{1F1FF}]|Flag|<img/u, 'no flags (no regional-indicator emoji, no flag icon or image)');
  assert.match(sw, /localStorage\.setItem\('dm_locale', JSON\.stringify\(\{ lang, at: Date\.now\(\), source: 'explicit' \}\)\)/, 'same record as src/lib/locale.js');
  assert.match(sw, /dm_locale_suggestion_dismissed/, 'the same dismissal flag as the app suggestion');
  assert.doesNotMatch(sw, /geoip|ipapi|x-forwarded-for|cf-ipcountry/i, 'never by IP');
  assert.match(sw, /href: `\$\{en\}\?lang=de`/, 'Deutsch opens the English page with the German app choice');
  assert.match(sw, /min-h-11 min-w-11/, '44px targets');
});

test('G7: the static pages no longer relabel a document English when nothing on it is English', () => {
  const layout = read('astro-site/src/layouts/Layout.astro');
  assert.match(layout, /if \(localStorage\.getItem\('dm_lang'\) !== 'en'\) return;\s*\n\s*if \(!document\.querySelector\('\[data-en\]'\)\) return;\s*\n\s*document\.documentElement\.lang = 'en';/);
});

test('routing and discovery: the dotted A1.1 URL redirects, the sitemap carries /ar/, the banner speaks Arabic', () => {
  assert.match(read('netlify.toml'), /from = "\/ar\/courses\/a1\.1"\s*\n\s*to = "\/ar\/courses\/a1-1\/"\s*\n\s*status = 301/);
  assert.match(read('astro-site/astro.config.mjs'), /page\.startsWith\('https:\/\/deutsch-meister\.de\/ar\/'\)/);
  const consent = read('public/consent.js');
  assert.match(consent, /ar: \{\s*\n\s*label: 'الموافقة على ملفات تعريف الارتباط'/);
  assert.match(consent, /bar\.setAttribute\('dir', lang === 'ar' \? 'rtl' : 'ltr'\);/);
  const check = read('scripts/check-built-html.mjs');
  for (const p of ['ar/index.html', 'ar/courses/index.html', 'ar/courses/a1-1/index.html', 'ar/pricing/index.html', 'ar/help/index.html']) {
    assert.ok(check.includes(`'${p}'`), `check-built-html REQUIRED lacks ${p}`);
  }
  assert.match(check, /hreflang set differs on/, 'the build checks reciprocity');
  assert.match(check, /<html lang="ar"> without dir="rtl"/, 'the build checks direction');
});

test('Arabic pages set headings in the body face and never letter-space Arabic', () => {
  const css = read('astro-site/src/styles/linie.css');
  assert.match(css, /html\[lang='ar'\] :is\(h1, h2, h3, h4, \.font-display\) \{\s*font-family: theme\('fontFamily\.body'\);/);
  for (const f of ['astro-site/src/styles/linie.css', 'src/index.css']) {
    assert.match(read(f), /:lang\(ar\) \{\s*letter-spacing: normal !important;/, `${f}: tracking breaks Arabic joins`);
    assert.match(read(f), /\.font-data:lang\(ar\) \{\s*font-family: theme\('fontFamily\.body'\);/, `${f}: Arabic labels never take the mono face's spaces`);
  }
});
