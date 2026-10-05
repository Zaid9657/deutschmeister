// The Arabic pilot's release gate (docs/arabic/README.md §4): every learning-
// support text a learner can meet in A1.1 Lektionen 1–3 exists in Arabic and
// is not stale; nothing is "reviewed" without a named human; the interface
// tables are complete and never show a developer key; the matching exercise
// can never offer two identical Arabic tiles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const ARABIC = /[؀-ۿ]/;

const { coverage } = await import('../scripts/i18n-coverage.mjs');
const c = await coverage();
const { default: SIDECAR } = await import('../src/data/curricula/a11.ar.js');
const { STRINGS } = await import('../src/lib/lesson/strings.js');
const { default: AR_LESSON } = await import('../src/locales/ar/lesson.js');
const { default: AR_APP } = await import('../src/locales/ar/app.js');
const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
const { SUPPORT_SCOPE, supportKeys } = await import('../src/lib/lesson/support.js');

test('the pilot scope is A1.1 Lektionen 1–3, and every reachable support text there is translated and current', () => {
  assert.deepEqual(SUPPORT_SCOPE['ar:a1.1'], ['a1.1-l01', 'a1.1-l02', 'a1.1-l03']);
  assert.ok(c.pilot.total >= 300, `suspiciously few reachable keys (${c.pilot.total}) — did the builders change?`);
  assert.deepEqual(c.problems, [], `missing or stale Arabic in the pilot:\n${c.problems.join('\n')}`);
});

test('no Arabic entry is marked reviewed without a named reviewer and a date', () => {
  assert.deepEqual(c.reviewedWithoutSignoff, []);
  for (const [key, e] of Object.entries(SIDECAR.entries)) {
    assert.ok(['draft', 'reviewed'].includes(e.status), `${key}: status ${e.status}`);
    assert.match(e.src, /^h[0-9a-f]{8}$/, `${key}: no source hash`);
    assert.ok(ARABIC.test(e.ar), `${key}: the "Arabic" has no Arabic letters`);
  }
});

test('every sidecar entry is still reachable (no orphan translations)', () => {
  assert.deepEqual(c.orphans, []);
});

test('Arabic uses Latin digits and never transliterates German into Arabic script', () => {
  const texts = [...Object.values(SIDECAR.entries).map((e) => e.ar), ...Object.values(AR_LESSON)];
  for (const t of texts) assert.doesNotMatch(t, /[٠-٩۰-۹]/, `Arabic-Indic digits in: ${t}`);
  // A Latin run inside «…» or **…** is rendered as an isolated German span; a
  // run that mixes in an Arabic letter would lose its isolation (richText.jsx).
  for (const [key, e] of Object.entries(SIDECAR.entries)) {
    for (const m of e.ar.matchAll(/\*\*([^*]+)\*\*|«([^»]+)»/g)) {
      const run = m[1] || m[2];
      if (/[A-Za-zÄÖÜäöüß]/.test(run)) assert.doesNotMatch(run, ARABIC, `${key}: mixed run «${run}»`);
    }
  }
});

test('the three lesson chrome tables carry the same keys and placeholders, none empty, Arabic in Arabic', () => {
  const en = Object.keys(STRINGS.en);
  for (const table of [STRINGS.de, AR_LESSON]) {
    assert.deepEqual(Object.keys(table).filter((k) => !en.includes(k)), [], 'extra keys');
    assert.deepEqual(en.filter((k) => !(k in table)), [], 'missing keys');
  }
  const ph = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join();
  const LATIN_OK = new Set(['lang.de', 'lang.en']);
  for (const k of en) {
    assert.ok(AR_LESSON[k] && AR_LESSON[k].trim(), `ar.${k} is empty`);
    assert.equal(ph(AR_LESSON[k]), ph(STRINGS.en[k]), `ar.${k} placeholders differ`);
    if (!LATIN_OK.has(k)) assert.match(AR_LESSON[k], ARABIC, `ar.${k} is not Arabic: ${AR_LESSON[k]}`);
  }
});

// Every literal t('key') a course or lesson screen calls must exist in the
// English table — otherwise the last fallback of t() would put the raw key on
// screen. Dynamic keys are listed with the prefixes they may take.
const walk = (dir) => readdirSync(join(ROOT, dir)).flatMap((n) => {
  const p = join(dir, n);
  return statSync(join(ROOT, p)).isDirectory() ? walk(p) : /\.(jsx?|mjs)$/.test(n) ? [p] : [];
});
const LESSON_SCREENS = [
  ...walk('src/components/lesson'), ...walk('src/components/course'), ...walk('src/pages/lesson'),
  'src/pages/CurriculumHomePage.jsx', 'src/components/locale/LocaleFallbackNotice.jsx',
].filter((f) => !f.endsWith('strings.js'));

test('no developer key can reach a learner: every literal t(\'…\') on the course screens exists', () => {
  const missing = [];
  for (const f of LESSON_SCREENS) {
    const src = read(f);
    if (!/lib\/lesson\/strings\.js/.test(src)) continue;
    for (const m of src.matchAll(/\bt\(\s*'([a-z][\w.]+)'/g)) {
      if (!(m[1] in STRINGS.en)) missing.push(`${relative(ROOT, join(ROOT, f))}: ${m[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('every Arabic i18next key the translated screens ask for exists in the Arabic bundle', () => {
  const files = ['src/pages/LoginPage.jsx', 'src/pages/SignupPage.jsx', 'src/pages/ResetPasswordPage.jsx', 'src/pages/UpdatePasswordPage.jsx', 'src/pages/VerifyEmailPage.jsx', 'src/components/TrialBanner.jsx', 'src/locales/useArabic.js', 'src/components/locale/LocaleFallbackNotice.jsx'];
  const get = (path) => path.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), AR_APP);
  const missing = [];
  for (const f of files) {
    const src = read(f);
    for (const m of src.matchAll(/\b(?:ta|ar)\(\s*'([a-zA-Z][\w.]+)'/g)) if (typeof get(m[1]) !== 'string') missing.push(`${f}: ${m[1]}`);
    for (const m of src.matchAll(/\bt\(\s*'((?:auth|nav|a11y)\.[\w.]+)'/g)) if (typeof get(m[1]) !== 'string') missing.push(`${f}: ${m[1]}`);
  }
  for (const code of ['invalid_credentials', 'user_already_exists', 'weak_password', 'email_address_invalid', 'over_email_send_rate_limit', 'over_request_rate_limit', 'same_password', 'network']) {
    if (typeof get(`account.errors.${code}`) !== 'string') missing.push(`account.errors.${code}`);
  }
  assert.deepEqual(missing, []);
});

test('matching is always gradable: no two words of a pilot Lektion share an Arabic (or English) meaning', () => {
  for (const l of CURRICULUM_A11.lektionen.filter((x) => SUPPORT_SCOPE['ar:a1.1'].includes(x.id))) {
    const seenAr = new Map();
    const seenEn = new Map();
    for (const w of l.wortfeld) {
      const ar = SIDECAR.entries[supportKeys.word(w.wordId)]?.ar;
      assert.ok(ar, `${l.id} ${w.de}: no Arabic meaning`);
      assert.ok(!seenAr.has(ar), `${l.id}: «${w.de}» and «${seenAr.get(ar)}» both mean «${ar}» — a match exercise could not grade them`);
      assert.ok(!seenEn.has(w.en.toLowerCase()), `${l.id}: «${w.de}» and «${seenEn.get(w.en.toLowerCase())}» share the English meaning`);
      seenAr.set(ar, w.de);
      seenEn.set(w.en.toLowerCase(), w.de);
    }
  }
});

test('every dialogue line of A1.1 has a stable id the translations attach to', () => {
  const ids = new Set();
  for (const l of CURRICULUM_A11.lektionen) {
    l.dialog.lines.forEach((line, i) => {
      assert.equal(line.id, `${l.id}-d${String(i + 1).padStart(2, '0')}`, `${l.id} line ${i}`);
      assert.ok(!ids.has(line.id));
      ids.add(line.id);
    });
  }
});

test('the profession rule keeps its hedge in Arabic (usually no article), with the German example separate', () => {
  const body = SIDECAR.entries[supportKeys.noticeBody('a1.1-l02')].ar;
  assert.match(body, /عادةً اسم المهنة دون أداة نكرة/);
  assert.match(body, /\*\*Ich bin Lehrer\.\*\*/);
});

test('Lektionen outside the pilot are reported, not silently mixed: the intro says so in Arabic', () => {
  assert.ok(c.laterLektionen.total > 0);
  assert.equal(c.laterLektionen.missing, c.laterLektionen.total, 'later Lektionen are untranslated by design for now');
  assert.match(AR_LESSON['intro.supportScope'], /للدروس 1–3 فقط/);
  assert.match(read('src/components/lesson/IntroStage.jsx'), /lektionHasSupport\(lang, level, lektion\.id\)/);
  assert.match(read('src/components/lesson/SupportText.jsx'), /support\.inEnglish/);
});
