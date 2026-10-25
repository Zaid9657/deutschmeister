// The telc B1 pilot route (src/data/programs/telcB1Komplett.js) and the logic
// of its course page (src/lib/telcPilot.js), 2026-10-12.
//
// The route replaced a grammar-first library checklist with no writing task and
// no telc test in it (business review §3: "an exam name over a grammar-first
// checklist"). These pins keep it the exam:
//   1. SHAPE — the short test opens and closes the route; three letters, each
//      written before it is revised (six corrections); ten rehearsals over the
//      three telc Teile, never more than two a day.
//   2. HAND-OFF — every rehearsal survives the speaking server's own parser
//      unchanged, at a level the server accepts, and its context names its own
//      way home and carries no itemId (so the Astro bar never offers a lesson
//      that does not exist).
//   3. REGISTER — the buyer is addressed with Sie: the route, the three telc
//      letter tasks, the telc mock's instructions, and the pages the route
//      opens. The exam's own reading letter says du — it is content, not chrome.
//   4. MEANING — gapPriorities never calls an unanswered section "weakest";
//      pilotEvidence counts at most two corrections per letter and each
//      rehearsal once, by its own label.
//   4b. ARRIVAL — arrive() writes only the profile fields still empty, never
//      'none', and settles within its timeout even when a write never answers:
//      a stalled request must not keep a buyer's plan shut (Codex review 2).
//   5. RUNBOOK — the eligibility SQL in docs/telc-pilot/README.md lists exactly
//      the route's item ids and rehearsal labels.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  PROGRAM, EXAM_KEY, SPEAKING_LEVEL, SHORT_TEST_MINUTES, BONUSES,
  allDays, allItemIds, writeHref,
} from '../src/data/programs/telcB1Komplett.js';
import { writingTasksForExam } from '../src/data/writingTasks.js';
import { telcB1Mock } from '../src/data/mockExams/telcB1.js';
import { parseCourseTask, SPEAKING_LEVELS } from '../netlify/functions/_shared/speakingAI.mjs';
import { gapPriorities, pilotEvidence, sectionAnswered, dayDone, rehearsalTopics, arrive } from '../src/lib/telcPilot.js';
import { telcCourseContext, normalizeCourseContext, TELC_COURSE_HOME } from '../src/lib/courseFlow.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const days = allDays();
const items = days.flatMap((d) => d.items);
const speaking = items.filter((i) => i.type === 'speaking');
const dayOf = (id) => days.findIndex((d) => d.items.some((i) => i.id === id));

// ── 1. shape ────────────────────────────────────────────────────────────────

test('the short test opens and closes the route, in one sitting without Schreiben', () => {
  assert.equal(items[0].href, '/modelltest/telc-b1');
  assert.equal(items.at(-1).href, '/modelltest/telc-b1');
  assert.equal(items[0].type, 'exam');
  assert.equal(items.at(-1).type, 'exam');
  assert.match(items.at(-1).title, /Probe, nicht als Beweis/, 'the retest is a rehearsal, never proof of a result');
  const expected = telcB1Mock.sections.filter((s) => s.key !== 'schreiben').reduce((m, s) => m + s.minutes, 0);
  assert.equal(SHORT_TEST_MINUTES, expected, 'the minutes are derived from the mock, never typed');
  for (const t of [items[0], items.at(-1)]) assert.equal(t.minutes, SHORT_TEST_MINUTES);
});

test('three telc letters, each written before it is revised: six corrections', () => {
  const drafts = items.filter((i) => i.type === 'writing');
  const revisions = items.filter((i) => i.type === 'revise');
  const bank = writingTasksForExam(EXAM_KEY).map((t) => t.taskKey).sort();
  assert.equal(drafts.length, 3);
  assert.equal(revisions.length, 3);
  assert.deepEqual(drafts.map((d) => d.taskKey).sort(), bank, 'the three letters are exactly the telc tasks of the writing bank');
  for (const draft of drafts) {
    const revision = revisions.find((r) => r.taskKey === draft.taskKey);
    assert.ok(revision, `${draft.taskKey}: no revision`);
    assert.ok(dayOf(draft.id) < dayOf(revision.id), `${draft.taskKey}: revised before it was written`);
    assert.equal(draft.href, writeHref(draft.taskKey));
    assert.equal(revision.href, writeHref(draft.taskKey, { revise: true }));
    assert.match(revision.href, /[?&]revise=1$/);
  }
});

test('ten rehearsals over the three Teile, at most two a day, each with its own label', () => {
  assert.equal(speaking.length, 10);
  const perTeil = { 1: 0, 2: 0, 3: 0 };
  for (const s of speaking) perTeil[s.task.teil.match(/Teil (\d)/)[1]] += 1;
  assert.deepEqual(perTeil, { 1: 3, 2: 4, 3: 3 }, 'Kontaktaufnahme, Gespräch über ein Thema, gemeinsam planen');
  assert.equal(new Set(speaking.map((s) => s.task.teil)).size, 10, 'labels must be unique — the course page counts rehearsals by label');
  for (const day of days) {
    assert.ok(day.items.filter((i) => i.type === 'speaking').length <= 2, `${day.label}: more than two rehearsals`);
  }
  for (const s of speaking) assert.match(s.task.prompt, new RegExp(`^Teil ${s.task.teil.match(/Teil (\d)/)[1]}\\b`), `${s.id}: prompt names another Teil than its label`);
});

test('every item has a short version for a busy day, and every day is one unit', () => {
  assert.equal(days.length, 20);
  for (const item of items) {
    assert.ok(typeof item.minimum === 'string' && item.minimum.length > 10, `${item.id}: no minimum`);
    assert.ok(Number.isFinite(item.minutes) && item.minutes > 0, `${item.id}: no minutes`);
  }
  assert.deepEqual(allItemIds(), items.map((i) => i.id));
  assert.ok(!allItemIds().some((id) => BONUSES.some((b) => b.id === id)), 'extras are outside the 20 units');
});

// ── 2. hand-off ─────────────────────────────────────────────────────────────

test('every rehearsal survives the speaking server parser unchanged, at an accepted level', () => {
  // The level list the start handler checks (and evaluate-speaking grades against).
  const server = read('netlify/functions/speaking-session.mjs');
  assert.match(server, /if \(!SPEAKING_LEVELS\.includes\(effectiveLevel\)\)/);
  assert.ok(SPEAKING_LEVELS.includes(SPEAKING_LEVEL.toUpperCase()), `${SPEAKING_LEVEL} is not an accepted speaking level`);
  for (const s of speaking) {
    assert.equal(s.href, `/speaking/?level=${SPEAKING_LEVEL.toUpperCase()}`);
    const parsed = parseCourseTask({ taskPrompt: s.task.prompt, taskTeil: s.task.teil, taskHintWords: s.task.hintWords, taskAnrede: 'Sie' });
    assert.deepEqual(parsed, { prompt: s.task.prompt, teil: s.task.teil, hintWords: s.task.hintWords, anrede: 'Sie' },
      `${s.id}: the server trims or drops part of the task`);
  }
});

test('the hand-off context names its way home and has no itemId', () => {
  const ctx = normalizeCourseContext(telcCourseContext(speaking[0]));
  assert.equal(ctx.homeHref, TELC_COURSE_HOME);
  assert.equal(ctx.returnTo, TELC_COURSE_HOME);
  assert.equal(ctx.returnLabel, 'Zurück zum Plan');
  assert.equal(ctx.level, SPEAKING_LEVEL);
  assert.equal(ctx.openPrompt, speaking[0].task.prompt);
  assert.equal(ctx.openTeil, speaking[0].task.teil);
  assert.equal(ctx.anrede, 'Sie');
  assert.ok(!('itemId' in ctx), 'an itemId would make the Astro return bar offer a /course/b1.2 lesson that does not exist');
  assert.match(read('astro-site/src/layouts/Layout.astro'), /if \(!ctx \|\| !ctx\.level \|\| !ctx\.itemId\) return;/,
    'the Astro bar must keep requiring an itemId');
});

// ── 3. register ─────────────────────────────────────────────────────────────

// The du-imperatives the old telc copy used. "nutze"/"bewerte" are also
// first person ("ich nutze"), so they only count without an "ich" before them.
// Boundaries are Unicode letters, not \b: JavaScript's \b treats "ü" as a
// boundary, so /\bHör\b/ would match inside "Hörübungen".
const DU_WORDS = 'du|Du|dir|Dir|dich|Dich|dein|Dein|deine[mnrs]?|Deine[mnrs]?|kannst|musst|hast|willst|machst|hörst|schreibst|Schreib|Lies|Hör|Sprich|Melde|Probier|Versuch es|Beschreib|Erklär|Bedank|Stell|Frag|Sag|Schlag|Fordere|wähl';
const DU = new RegExp(`(?<!\\p{L})(?:${DU_WORDS})(?!\\p{L})|(?<![Ii]ch )(?<!\\p{L})(?:nutze|bewerte)(?!\\p{L})`, 'u');
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

test('the buyer is addressed with Sie: route, telc tasks and the telc mock instructions', () => {
  const texts = [PROGRAM.subtitle, ...PROGRAM.weeks.flatMap((w) => [w.title, w.intro])];
  for (const i of items) texts.push(i.title, i.minimum, i.note || '', ...(i.task ? [i.task.prompt, ...i.task.hintWords] : []));
  for (const b of BONUSES) texts.push(b.title, b.lead || '', ...(b.lines || []));
  for (const t of writingTasksForExam(EXAM_KEY)) texts.push(t.title, t.task, ...t.leitpunkte);
  texts.push(telcB1Mock.intro, ...telcB1Mock.sections.map((s) => s.instructions));
  const writing = telcB1Mock.sections.find((s) => s.key === 'schreiben').parts.find((p) => p.type === 'writing');
  texts.push(writing.task);
  for (const text of texts) assert.doesNotMatch(text, DU, `du-form in: ${text}`);
});

test('the pages the route opens address the learner with Sie', () => {
  for (const file of [
    'src/pages/TelcB1KursPage.jsx',
    'src/pages/SchreibenPage.jsx',
    'src/pages/Modelltest/ModelltestHub.jsx',
    'src/pages/Modelltest/ModelltestOverview.jsx',
    'src/pages/Modelltest/ModelltestRun.jsx',
    'src/pages/Modelltest/ModelltestResult.jsx',
  ]) {
    const lines = strip(read(file)).split('\n');
    const hits = lines.filter((line) => DU.test(line));
    assert.deepEqual(hits, [], `${file} still says du`);
  }
});

// ── 4. meaning ──────────────────────────────────────────────────────────────

const lesen = telcB1Mock.sections.find((s) => s.key === 'lesen');
const sb = telcB1Mock.sections.find((s) => s.key === 'sprachbausteine');
const firstLesenKey = (() => { const p = lesen.parts[0]; return `${p.key}:${p.texts[0].id}`; })();
const firstSbKey = sb.parts[0].gaps[0].id;

test('a section nobody answered is unmeasured, never the weakest', () => {
  const attempt = {
    section_scores: { lesen: { score: 3, max: 10 }, sprachbausteine: { score: 6, max: 10 }, hoeren: { score: 0, max: 10 } },
    answers: { [firstLesenKey]: 'a', [firstSbKey]: 'b' }, // nothing in Hören: time ran out
  };
  assert.equal(sectionAnswered(lesen, attempt.answers), true);
  assert.equal(sectionAnswered(telcB1Mock.sections.find((s) => s.key === 'hoeren'), attempt.answers), false);
  const gaps = gapPriorities({ attempt });
  assert.deepEqual(gaps.map((g) => g.key), ['lesen', 'sprachbausteine'], 'Hören (0 points, never answered) is not a gap');
  assert.equal(gaps[1].external, true, 'the B1.2 grammar hub is an Astro page');
  assert.deepEqual(gapPriorities({}), [], 'no measurement, no gaps');
});

test('letter criteria point back at the learner\'s own letter; a full score is no gap', () => {
  const writing = { task_key: 'einladung-absage', feedback: { scores: { task: 5, structure: 2, accuracy: 3, vocabulary: 4 } } };
  const gaps = gapPriorities({ writing });
  assert.deepEqual(gaps.map((g) => g.key), ['structure', 'accuracy', 'vocabulary']);
  assert.equal(gaps[0].href, writeHref('einladung-absage', { revise: true }));
  assert.equal(gaps[1].href, '/analyze/', 'accuracy goes to Satz-Röntgen');
  assert.equal(gapPriorities({ writing, limit: 1 }).length, 1);
});

test('evidence: units are whole days, two corrections per letter at most, each rehearsal once', () => {
  const firstDay = days[0];
  const doneIds = new Set([...firstDay.items.map((i) => i.id), days[4].items[0].id]); // day 5 only half done
  assert.equal(dayDone(firstDay, doneIds), true);
  assert.equal(dayDone(days[4], doneIds), false);
  const writingRows = [
    { exam_key: 'telc_b1', task_key: 'beschwerde-lieferung' },
    { exam_key: 'telc_b1', task_key: 'beschwerde-lieferung' },
    { exam_key: 'telc_b1', task_key: 'beschwerde-lieferung' }, // a third try is not a second letter
    { exam_key: 'telc_b1', task_key: 'einladung-absage' },
    { exam_key: 'goethe_b1', task_key: 'beschwerde-kurs' },    // another exam's letter does not count
  ];
  const [r1, r2] = rehearsalTopics();
  const speakingRows = [
    { topic: r1, status: 'completed' },
    { topic: r1, status: 'completed' },  // the same rehearsal twice counts once
    { topic: r2, status: 'cancelled' },  // no learner turn
    { topic: 'Sprechen', status: 'completed' },
  ];
  assert.deepEqual(pilotEvidence({ doneIds, writingRows, speakingRows }), {
    units: { done: 1, total: 20 },
    corrections: { done: 3, total: 6 },
    rehearsals: { done: 1, total: 10 },
  });
});

// ── 5. runbook ──────────────────────────────────────────────────────────────

test('arrival writes only the empty fields, and never "none"', async () => {
  let calls = [];
  const ok = (name) => () => { calls.push(name); return Promise.resolve({ data: [{ id: 'u' }], error: null }); };
  const writers = { markOnboarded: ok('onboarding'), setExamTrack: ok('exam_track') };

  const fresh = await arrive({ profile: null, ...writers });
  assert.deepEqual(calls, ['onboarding', 'exam_track'], 'an unknown profile: both fields');
  assert.deepEqual(fresh, { changed: true, timedOut: false, errors: [] });

  calls = [];
  const known = await arrive({ profile: { onboarding_completed_at: '2026-01-01', exam_track: 'goethe_b1' }, ...writers });
  assert.deepEqual(calls, [], 'fields the loaded profile shows as set are not written again');
  assert.deepEqual(known, { changed: false, timedOut: false, errors: [] });

  calls = [];
  await arrive({ profile: { onboarding_completed_at: null, exam_track: 'none' }, ...writers });
  assert.deepEqual(calls, ['onboarding'], "'none' is the learner's no-exam choice and stays");

  const empty = () => Promise.resolve({ data: [], error: null });
  const nothingMatched = await arrive({ profile: null, markOnboarded: empty, setExamTrack: empty });
  assert.equal(nothingMatched.changed, false, 'a filter that matched no row changed nothing — no refresh needed');
});

// Its own deadline: without the timeout this test would hang the suite rather than fail it.
test('arrival settles even when a write never answers, fails or throws', { timeout: 2000 }, async () => {
  const never = () => new Promise(() => {});
  const fine = () => Promise.resolve({ data: [{ id: 'u' }], error: null });
  const started = Date.now();
  const stalled = await arrive({ profile: null, markOnboarded: fine, setExamTrack: never, timeoutMs: 30 });
  assert.deepEqual(stalled, { changed: false, timedOut: true, errors: [] }, 'one stalled write must not keep the plan shut');
  assert.ok(Date.now() - started < 1000, 'settled at the timeout, not later');

  const both = (write) => ({ markOnboarded: write, setExamTrack: write });
  const failed = await arrive({ profile: null, ...both(() => Promise.resolve({ data: null, error: { message: 'RLS' } })) });
  assert.deepEqual(failed, { changed: false, timedOut: false, errors: ['RLS', 'RLS'] });

  const rejected = await arrive({ profile: null, ...both(() => Promise.reject(new Error('offline'))) });
  assert.deepEqual(rejected.errors, ['offline', 'offline']);

  const thrown = await arrive({ profile: null, ...both(() => { throw new Error('bad client'); }) });
  assert.deepEqual(thrown.errors, ['bad client', 'bad client'], 'a synchronous throw is a failed write, not a crash');
});

test('the eligibility SQL in the runbook lists exactly the route\'s items and rehearsal labels', () => {
  const md = read('docs/telc-pilot/README.md');
  const arrayAfter = (marker) => {
    const at = md.indexOf(marker);
    assert.ok(at >= 0, `runbook: "${marker}" not found`);
    const body = md.slice(at).match(/array\[([\s\S]*?)\]\)/)[1];
    return [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  };
  assert.deepEqual(arrayAfter('with route(item_id) as ('), allItemIds());
  assert.deepEqual(arrayAfter('rehearsals(topic) as ('), rehearsalTopics());
  const letters = items.filter((i) => i.type === 'writing').map((i) => `'${i.taskKey}'`).join(', ');
  assert.ok(md.includes(`task_key in (${letters})`), 'the letter list in the eligibility SQL differs from the route');
});
