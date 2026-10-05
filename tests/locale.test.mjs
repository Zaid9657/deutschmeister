// The ONE interface locale (src/lib/locale.js, docs/arabic/README.md §3):
// precedence, conflict handling, the whitelist, legacy migration, route
// readiness, and the first-paint script in index.html that must agree with it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const L = await import('../src/lib/locale.js');

test('the supported locales are a whitelist of three, English by default', () => {
  assert.deepEqual(L.SUPPORTED_LOCALES, ['en', 'de', 'ar']);
  assert.equal(L.DEFAULT_LOCALE, 'en');
  assert.equal(L.normalizeLocale('ar'), 'ar');
  for (const bad of ['fr', 'AR', '', null, undefined, 'ar-EG', '<script>']) assert.equal(L.normalizeLocale(bad), 'en', String(bad));
  assert.equal(L.dirFor('ar'), 'rtl');
  assert.equal(L.dirFor('de'), 'ltr');
});

test('the switcher names each language in itself, Arabic first, no flags', () => {
  assert.deepEqual(L.LOCALE_SWITCH_ORDER, ['ar', 'en', 'de']);
  assert.deepEqual(L.LOCALE_NAMES, { ar: 'العربية', en: 'English', de: 'Deutsch' });
  const toggle = read('src/components/lesson/LangToggle.jsx');
  assert.ok(toggle.includes('LOCALE_SWITCH_ORDER.map'), 'the toggle renders the shared order');
  assert.ok(toggle.includes('lang={code}'), 'each pill carries its own language');
  assert.doesNotMatch(toggle, /[\u{1F1E6}-\u{1F1FF}]|Flag|<img/u, 'no flags (no regional-indicator emoji, no flag icon or image)');
});

test('?lang= is validated and wins, and is persisted as an explicit choice', () => {
  assert.equal(L.parseQueryLocale('?lang=ar'), 'ar');
  assert.equal(L.parseQueryLocale('?lang=xx'), null);
  assert.equal(L.parseQueryLocale('?lang=AR'), null, 'case is not guessed');
  const r = L.resolveLocale({ query: 'ar', stored: { lang: 'de', at: 5, source: 'explicit' }, now: 100 });
  assert.equal(r.locale, 'ar');
  assert.equal(r.source, 'query');
  assert.deepEqual(r.write, { lang: 'ar', at: 100, source: 'explicit' });
});

test('a saved choice beats the account unless the account choice is NEWER', () => {
  const stored = { lang: 'ar', at: 2000, source: 'explicit' };
  // An old account value never silently overrides a new explicit choice.
  assert.equal(L.resolveLocale({ stored, account: { lang: 'en', at: 1000, source: 'account' } }).locale, 'ar');
  // A newer explicit choice made on another device wins.
  assert.equal(L.resolveLocale({ stored, account: { lang: 'de', at: 3000, source: 'account' } }).locale, 'de');
  // Same language: nothing to resolve.
  assert.equal(L.resolveLocale({ stored, account: { lang: 'ar', at: 9000 } }).source, 'stored');
});

test('reconcileAccount pulls a newer account choice and pushes a newer device choice', () => {
  const dev = { lang: 'ar', at: 2000, source: 'explicit' };
  assert.equal(L.reconcileAccount(dev, null), 'push');
  assert.equal(L.reconcileAccount(null, { lang: 'de', at: 1 }), 'pull');
  assert.equal(L.reconcileAccount(dev, { lang: 'de', at: 1000 }), 'push');
  assert.equal(L.reconcileAccount(dev, { lang: 'de', at: 3000 }), 'pull');
  assert.equal(L.reconcileAccount(dev, { lang: 'ar', at: 3000 }), 'none');
  assert.equal(L.reconcileAccount(null, null), 'none');
});

test('the account preference only fills a device with no choice', () => {
  const r = L.resolveLocale({ account: L.accountChoice({ ui_lang: 'ar', ui_lang_at: 50 }) });
  assert.equal(r.locale, 'ar');
  assert.equal(r.source, 'account');
  assert.equal(L.accountChoice({ ui_lang: 'xx' }), null, 'an unknown account value is ignored');
  assert.equal(L.accountChoice(null), null);
});

test('legacy flags migrate: dm_lesson_lang was always explicit, dm_lang only proves "de"', () => {
  assert.equal(L.resolveLocale({ legacy: { lesson: 'de', app: 'en' } }).locale, 'de');
  assert.equal(L.resolveLocale({ legacy: { lesson: null, app: 'de' } }).locale, 'de');
  const r = L.resolveLocale({ legacy: { lesson: null, app: 'en' } });
  assert.equal(r.locale, 'en');
  assert.equal(r.source, 'default', "dm_lang='en' was written on every page load and proves nothing");
});

test('an Arabic browser is OFFERED Arabic, never switched — and never by IP', () => {
  const r = L.resolveLocale({ browserLanguages: ['ar-EG', 'en'] });
  assert.equal(r.locale, 'en');
  assert.equal(r.suggest, true);
  assert.equal(L.resolveLocale({ browserLanguages: ['de-DE'] }).suggest, false);
  assert.equal(L.resolveLocale({ stored: { lang: 'en', at: 1, source: 'explicit' }, browserLanguages: ['ar'] }).suggest, false, 'an explicit English choice is never second-guessed');
  const src = read('src/lib/locale.js');
  assert.doesNotMatch(src, /geoip|ipapi|x-forwarded-for|cf-ipcountry/i, 'no IP-based language');
});

test('parseStoredChoice tolerates hand-edited blobs and rejects unknown languages', () => {
  assert.deepEqual(L.parseStoredChoice('{"lang":"ar","at":5,"source":"explicit"}'), { lang: 'ar', at: 5, source: 'explicit' });
  assert.deepEqual(L.parseStoredChoice('ar'), { lang: 'ar', at: 0, source: 'explicit' });
  assert.equal(L.parseStoredChoice('{"lang":"fr"}'), null);
  assert.equal(L.parseStoredChoice('{not json'), null);
});

test('Arabic renders only on the routes translated for the pilot; elsewhere English under a notice', () => {
  for (const p of ['/course/a1.1', '/course/a1.1/', '/course/a1.1/l/1', '/course/a1.1/l/3', '/course/a1.1/review', '/course/a1.1/checkpoint/1', '/login', '/signup', '/reset-password', '/update-password', '/verify-email']) {
    assert.equal(L.effectiveLocale('ar', p), 'ar', p);
  }
  for (const p of ['/dashboard', '/course/a1.2', '/course/a1.1/complete', '/faq/', '/speaking', '/profile', '/subscription']) {
    assert.equal(L.effectiveLocale('ar', p), 'en', p);
  }
  assert.equal(L.effectiveLocale('de', '/dashboard'), 'de', 'German is complete chrome-wise and is never downgraded');
  const shell = read('src/App.jsx');
  assert.ok(shell.includes('<LocaleFallbackNotice />'), 'the shell renders the fallback notice');
  assert.ok(shell.includes('effectiveLocale(locale, pathname)'), 'the shell derives the document language from the route');
});

test('index.html sets lang/dir before first paint with the SAME route pattern as locale.js', () => {
  const html = read('index.html');
  const script = html.slice(html.indexOf('<script>(function(){try{var L='), html.indexOf('</script>', html.indexOf('<script>(function(){try{var L=')));
  assert.ok(script.length > 50, 'the first-paint script is in <head>');
  const m = /var p=(\/.*?\/);if/.exec(script);
  assert.ok(m, 'the script carries the route pattern');
  assert.equal(m[1], String(L.AR_READY_PATTERN), 'index.html and src/lib/locale.js disagree about which routes render Arabic');
  assert.ok(script.includes("'en','de','ar'"), 'the script whitelists the same three locales');
  assert.ok(html.indexOf('dm_locale') < html.indexOf('<link rel="icon"'), 'the script runs before stylesheets/icons');
});

test('an Arabic first paint preloads the token Arabic face; nothing else ever loads it', async () => {
  const { arabicFontPreloads, fontFaces, tailwindFontFamily, tailwindSignFont } = await import('../src/data/design-tokens.js');
  const html = read('index.html');
  assert.equal(arabicFontPreloads.length, 1);
  assert.ok(html.includes(`if(v==='ar'){var k=document.createElement('link');k.rel='preload';k.as='font';k.type='font/woff2';k.crossOrigin='';k.href='${arabicFontPreloads[0]}'`), 'index.html preloads the token file, and only when the interface is Arabic');
  const faces = fontFaces.map((r) => r['@font-face']);
  const arabic = faces.filter((f) => f.fontFamily === "'IBM Plex Sans Arabic'");
  assert.equal(arabic.length, 2, '400 and 600');
  for (const f of arabic) assert.match(f.unicodeRange, /^U\+0600-06FF/, 'Arabic-only range: a Latin page never downloads it');
  // The metric fallbacks would otherwise paint Arabic in local Arial first.
  for (const f of faces.filter((x) => /Fallback/.test(x.fontFamily))) assert.match(f.unicodeRange, /U\+0000-05FF, U\+0700-074F/, `${f.fontFamily} must not claim Arabic`);
  for (const stack of [tailwindFontFamily.display, tailwindFontFamily.body, tailwindFontFamily.data, tailwindSignFont.sign]) assert.ok(stack.includes('IBM Plex Sans Arabic'), stack.join());
  // Naming Arabic in a switch on a non-Arabic page must not fetch the face (+45 kB, ~0.4 s lab LCP on /).
  assert.ok(!tailwindFontFamily.endonym.some((f) => /Plex|Nunito|Fraunces|Archivo/.test(f)), 'the endonym stack is system faces only');
  assert.match(read('src/components/lesson/LangToggle.jsx'), /code === 'ar' && lang !== 'ar' \? 'font-endonym '/);
  assert.match(read('astro-site/src/components/LanguageSwitch.astro'), /l\.code === 'ar' && current !== 'ar' && 'font-endonym'/);
});

test('main.jsx loads a non-inline locale bundle BEFORE the first render (no English flash)', () => {
  const main = read('src/main.jsx');
  assert.match(main, /ensureLocaleResources\(getLocale\(\)\)\.finally\(render\)/);
  const loader = read('src/locales/index.js');
  assert.match(loader, /ar: \(\) => import\('\.\/ar\/index\.js'\)/, 'Arabic is its own chunk');
});

test('signUp carries the device choice to the account; the account syncs newest-wins', () => {
  const auth = read('src/contexts/AuthContext.jsx');
  assert.match(auth, /\.\.\.signupLocaleMetadata\(\)/);
  assert.match(auth, /syncAccountLocale\(user\)/);
  const acc = read('src/lib/localeAccount.js');
  assert.match(acc, /updateUser\(\{ data: \{ ui_lang: choice\.lang, ui_lang_at: choice\.at \} \}\)/, 'metadata only, no table');
});

test('i18next starts in the route\'s effective locale and the lesson chrome reads the same store', async () => {
  const i18n = read('src/utils/i18n.js');
  assert.match(i18n, /effectiveLocale\(getLocale\(\), window\.location\.pathname\)/);
  const { LESSON_LANGS, readLessonLang } = await import('../src/lib/lesson/strings.js');
  assert.deepEqual(LESSON_LANGS, ['en', 'de', 'ar']);
  assert.equal(readLessonLang(), 'en', 'no window → English');
});
