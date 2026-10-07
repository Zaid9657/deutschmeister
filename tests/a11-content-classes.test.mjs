// The CLASSES behind the content findings of the 2026-10 review — each pinned as a rule over the
// whole course, not as the one line that was fixed (CLAUDE.md: close a finding class with a rule +
// a test, never with a list of ids).
//
//   5A  a phonetics focus that promises a long/short contrast must mark both lengths (IPA ː and a
//       short vowel) — „Lange und kurze Vokale: bin – bist – sind“ promised one and had none;
//   5B  no English respelling or English sound comparison in the teaching text
//       („W sounds like an English v“, „gay“, „zed“) — the house rule (rule-card-overrides.mjs);
//   5C  a bank explanation the reviewed sidecar corrected can no longer be shipped silently: every
//       divergence is either the shipped sidecar text or a reviewed keep, every correction applies;
//       and no explanation states official time as „Uhr + hour“;
//   5D  a dialogue set on a named weekday does not answer „heute“ with another weekday;
//   5E  no absolute ban on the indefinite article before a job („Never ein Lehrer“, „kein ein“).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const POOL = JSON.parse(read('src/data/lessonPools/a11.json')).items;
const SIDECAR = JSON.parse(read('src/data/lessonPools/a11.explanationsEn.json'));
const CORRECTIONS = JSON.parse(read('src/data/lessonPools/a11.corrections.json'));
const CACHE = JSON.parse(read('grammar-content-cache.json'));
const CARDS = read('scripts/rule-card-overrides.mjs');
const LEKTIONEN = CURRICULUM_A11.lektionen;

/** Every learner-facing teaching text of the course, with where it lives. */
function teachingTexts() {
  const out = [];
  for (const l of LEKTIONEN) {
    out.push([`L${l.nr} notice.bodyDe`, l.notice?.bodyDe], [`L${l.nr} notice.bodyEn`, l.notice?.bodyEn], [`L${l.nr} phonetik`, l.phonetik?.focus]);
  }
  for (const it of POOL) out.push([`${it.id} explanationDe`, it.explanationDe], [`${it.id} explanationEn`, it.explanationEn], [`${it.id} hint`, it.hint]);
  out.push(['rule cards', CARDS]);
  return out.filter(([, t]) => typeof t === 'string' && t);
}

test('5A: a phonetics focus that promises long vs. short marks both lengths', () => {
  for (const l of LEKTIONEN) {
    const focus = l.phonetik?.focus || '';
    if (!(/lang/i.test(focus) && /kurz/i.test(focus))) continue;
    assert.match(focus, /ː/, `L${l.nr}: „${focus}“ promises a long vowel and marks none`);
    assert.match(focus, /[ɪʏʊɛɔœ]/, `L${l.nr}: „${focus}“ promises a short vowel and marks none`);
  }
});

test('5B: no English respelling or English sound comparison in teaching text', () => {
  // SOUND comparisons and respellings only — „no helper word like the English do“ is grammar, fine.
  const ENGLISH_COMPARISON = /sounds? (?:nothing )?like (?:an? |the )?English|pronounced like (?:an? |the )?English|is said like|"(?:ay|ee|gay|zed|zee)"|English letter name/i;
  const hits = teachingTexts().filter(([, t]) => ENGLISH_COMPARISON.test(t)).map(([where, t]) => `${where}: …${t.match(ENGLISH_COMPARISON)[0]}…`);
  assert.deepEqual(hits, []);
});

test('5C: no sidecar correction is ignored silently, and every field correction ships', () => {
  const bank = new Map(CACHE.exercises.map((e) => [e.id, e]));
  const keep = CORRECTIONS.keepBankExplanationEn || {};
  for (const it of POOL) {
    const row = bank.get(it.id);
    const side = (SIDECAR[it.id] || '').trim();
    if (!row || !side) continue;
    const own = (row.explanation_en || row.why_correct_en || '').trim();
    if (!own || own === side) continue;
    const fixed = CORRECTIONS.items?.[it.id]?.explanationEn;
    const expected = fixed || (keep[it.id] ? own : side);
    assert.equal(it.explanationEn, expected, `${it.id}: the reviewed English diverges from the bank and is not what ships`);
  }
  for (const [id, fix] of Object.entries(CORRECTIONS.items || {})) {
    const it = POOL.find((x) => x.id === id);
    assert.ok(it, `${id}: a correction for an item the pool does not have`);
    assert.ok(typeof fix.reason === 'string' && fix.reason.length > 10, `${id}: every correction says why`);
    for (const [field, value] of Object.entries(fix)) {
      if (field !== 'reason') assert.deepEqual(it[field], value, `${id}.${field}: the correction did not ship`);
    }
  }
  const migration = read('migrations/2026-10-05-a11-exercise-text-fixes.sql');
  for (const id of Object.keys(CORRECTIONS.items || {})) assert.ok(migration.includes(id), `${id}: the database half of the fix is missing`);
});

test('5C: official time is hour + Uhr + minutes, never „Uhr + hour“', () => {
  const WRONG_ORDER = /Uhr\s*\+\s*(?:Stunde|hour)/i;
  assert.deepEqual(teachingTexts().filter(([, t]) => WRONG_ORDER.test(t)).map(([w]) => w), []);
});

test('5D: a scene set on a weekday does not answer „heute“ with a different weekday', () => {
  const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  for (const l of LEKTIONEN) {
    const sceneDay = DAYS.find((d) => (l.dialog?.setting || '').includes(d));
    if (!sceneDay) continue;
    const lines = l.dialog.lines;
    for (let i = 0; i + 1 < lines.length; i += 1) {
      if (!/\bheute\b/i.test(lines[i].de) || !/\?\s*$/.test(lines[i].de)) continue;
      const answerDay = DAYS.find((d) => new RegExp(`\\bam ${d}\\b`).test(lines[i + 1].de));
      assert.ok(!answerDay || answerDay === sceneDay,
        `L${l.nr}: the scene is ${sceneDay}; „${lines[i].de}“ is answered „${lines[i + 1].de}“`);
    }
  }
});

test('5E: the job-without-article pattern is taught as the usual form, never as a ban', () => {
  const BAN = /never "?(?:ein|eine)\b|kein ein, keine eine|Nicht: Ich bin ein|"?Ein Lehrer"? [^.]*is wrong|no ein, no eine|never eine/i;
  assert.deepEqual(teachingTexts().filter(([, t]) => BAN.test(t)).map(([w, t]) => `${w}: …${t.match(BAN)[0]}…`), []);
});

// Finding 7: the read-aloud is speech-to-text word recognition (score-readaloud.mjs) and the AI
// speaking partner grades a transcript (evaluate-speaking.mjs: „Du hast KEIN Audio“). Neither
// measures pronunciation, so no learner-facing text may promise a pronunciation score or
// pronunciation feedback. Comments are skipped; the claim is what a learner reads.
import { readdirSync, statSync } from 'node:fs';
test('7: no learner-facing text promises a pronunciation score or pronunciation feedback', () => {
  const CLAIM = /scores? your pronunciation|(?:feedback|corrections?) on [^.]{0,40}pronunciation|pronunciation (?:feedback|score|scoring|grade)|Aussprache-Bewertung|Auswertung von [^.]{0,40}Aussprache/i;
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(join(ROOT, dir))) {
      const rel = `${dir}/${name}`;
      if (statSync(join(ROOT, rel)).isDirectory()) walk(rel);
      else if (/\.(jsx?|mjs|astro|txt)$/.test(name)) files.push(rel);
    }
  };
  for (const dir of ['src', 'astro-site/src', 'netlify/functions']) walk(dir);
  files.push('public/llms.txt', 'public/llms-full.txt');
  const hits = [];
  for (const f of files) {
    read(f).split('\n').forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      // The honest disclaimer („not a pronunciation grade“, „keine Aussprachenote“) is the point.
      if (CLAIM.test(line) && !/not a pronunciation|keine Aussprache/i.test(line)) hits.push(`${f}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  assert.deepEqual(hits, []);
});

test('coverage is said, not hidden: a Lektion without a linked listening exercise or reading text says so on its recap', async () => {
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const recap = readFileSync(new URL('../src/components/lesson/RecapStage.jsx', import.meta.url), 'utf8');
  assert.match(recap, /lektion\.links\?\.listeningExercise == null && t\('recap\.coverage\.noListening', lang\)/);
  assert.match(recap, /lektion\.links\?\.readingOrder == null && t\('recap\.coverage\.noReading', lang\)/);
  const strings = readFileSync(new URL('../src/lib/lesson/strings.js', import.meta.url), 'utf8');
  for (const key of ['recap.coverage.noListening', 'recap.coverage.noReading']) {
    assert.equal((strings.match(new RegExp(`'${key.replace(/\./g, '\\.')}':`, 'g')) || []).length, 2, `${key} in English and German`);
  }
  // The measured gaps this line speaks for (2026-10-06): listening L2, 3, 5, 7, 11, 12 · reading L2, 6.
  const gaps = (field) => CURRICULUM_A11.lektionen.filter((l) => l.links?.[field] == null).map((l) => l.nr);
  assert.deepEqual(gaps('listeningExercise'), [2, 3, 5, 7, 11, 12]);
  assert.deepEqual(gaps('readingOrder'), [2, 6]);
});

test('5E, cards too: no rule card shows a grammatical job sentence as a mistake (Codex DaF review, 2026-10-07)', async () => {
  const { default: OVERRIDES } = await import('../scripts/rule-card-overrides.mjs');
  const offenders = [];
  for (const [slug, card] of Object.entries(OVERRIDES)) {
    for (const m of card.commonMistakes || []) {
      // „Ich bin ein Lehrer.“ is German; the course teaches that the article is USUALLY left out.
      if (/^(Ich bin|Du bist|Er ist|Sie ist|Sie sind|Wir sind) (ein|eine) [A-ZÄÖÜ][a-zäöüß]+\.$/.test(m.wrong)) offenders.push(`${slug}: ${m.wrong}`);
    }
    const text = [card.content, ...(card.commonMistakes || []).map((m) => m.explanationDe)].join('\n');
    // Over-absolute rules the review measured as false.
    for (const re of [/is always es/, /\bdirekt nach dem Verb\b(?<!meist direkt nach dem Verb)/, /Nomen auf -chen sind das-Wörter/, /am for days and parts of the day/]) {
      if (re.test(text)) offenders.push(`${slug}: ${re}`);
    }
  }
  assert.deepEqual(offenders, []);
});
