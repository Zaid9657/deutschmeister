// Guard suite for the COURSE SPEAKING TASK (DaF review #4, "missionOrder null").
//
// Four A1.1 Lektionen (L7/L10/L11/L12) show a Goethe-style Sprechen task and
// promise an automatic response, but have no `speaking_missions` row — so
// `missionId` is null and the session used to become a generic free chat. The
// task now travels with the start call, is validated server-side, is persisted
// in the two unused nullable columns `speaking_sessions.topic` / `.scenario`
// (no schema change), and is rebuilt on every turn.
//
// What this pins:
//   1. VALIDATION. parseCourseTask trims and bounds every field, and a mission
//      ALWAYS wins — a mission's prompt is server-owned, a course task is
//      client text.
//   2. THE ROUND TRIP. What is written to topic/scenario at start is exactly
//      what taskFromSession rebuilds on a turn, including a plain-string
//      scenario written by anything else.
//   3. THE PROMPT. The task text and its hint words reach the teacher system
//      prompt when a task is given — and NOTHING task-shaped leaks into a free
//      or placement session when it is not.
//   4. THE WIRING. Both functions actually read/persist the columns.
//
// The module is imported directly: _shared/speakingAI.mjs has no env
// requirements at import time (the same reason tests/course-reminder.test.mjs
// can import its mailer).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  COURSE_TASK_LIMITS,
  parseCourseTask,
  courseTaskColumns,
  taskFromSession,
  buildTeacherSystemPrompt,
} from '../netlify/functions/_shared/speakingAI.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const PROMPT = 'Erzählen Sie von Ihrem Wochenende: Was haben Sie gemacht?';
const HINTS = ['am Samstag', 'mit Freunden', 'ins Kino'];

// --- 1. validation -----------------------------------------------------------

test('parseCourseTask accepts a well-formed task and trims it', () => {
  const task = parseCourseTask({
    taskPrompt: `  ${PROMPT}  `,
    taskTeil: ' Teil 2 ',
    taskHintWords: [' am Samstag ', 'mit Freunden', '', 'ins Kino'],
    taskAnrede: 'du',
  });
  assert.deepEqual(task, { prompt: PROMPT, teil: 'Teil 2', hintWords: HINTS, anrede: 'du' });
});

test('parseCourseTask defaults the Teil label but never the prompt', () => {
  assert.equal(parseCourseTask({ taskPrompt: PROMPT }).teil, 'Sprechen');
  assert.equal(parseCourseTask({ taskTeil: 'Teil 2', taskHintWords: HINTS }), null);
  assert.equal(parseCourseTask({ taskPrompt: '   ' }), null);
  assert.equal(parseCourseTask({}), null);
  assert.equal(parseCourseTask(null), null);
  assert.equal(parseCourseTask('nope'), null);
});

test('parseCourseTask normalises anrede to Sie|du, defaulting to Sie', () => {
  assert.equal(parseCourseTask({ taskPrompt: PROMPT }).anrede, 'Sie');
  assert.equal(parseCourseTask({ taskPrompt: PROMPT, taskAnrede: 'Sie' }).anrede, 'Sie');
  assert.equal(parseCourseTask({ taskPrompt: PROMPT, taskAnrede: 'du' }).anrede, 'du');
  assert.equal(parseCourseTask({ taskPrompt: PROMPT, taskAnrede: 'bogus' }).anrede, 'Sie');
  assert.equal(parseCourseTask({ taskPrompt: PROMPT, taskAnrede: null }).anrede, 'Sie');
});

test('a missionId always wins — the client task is ignored outright', () => {
  assert.equal(
    parseCourseTask({ missionId: 'uuid-1', taskPrompt: PROMPT, taskHintWords: HINTS }),
    null,
  );
});

test('parseCourseTask bounds every field', () => {
  const task = parseCourseTask({
    taskPrompt: 'a'.repeat(1000),
    taskTeil: 'b'.repeat(200),
    taskHintWords: Array.from({ length: 40 }, (_, i) => `w${i}${'c'.repeat(100)}`),
  });
  assert.equal(task.prompt.length, COURSE_TASK_LIMITS.promptChars);
  assert.equal(task.teil.length, COURSE_TASK_LIMITS.teilChars);
  assert.equal(task.hintWords.length, COURSE_TASK_LIMITS.hintWords);
  for (const w of task.hintWords) assert.ok(w.length <= COURSE_TASK_LIMITS.hintWordChars);
});

test('parseCourseTask ignores non-string hint words rather than throwing', () => {
  const task = parseCourseTask({
    taskPrompt: PROMPT,
    taskHintWords: [null, 42, { a: 1 }, 'ins Kino'],
  });
  assert.deepEqual(task.hintWords, ['ins Kino']);
  assert.deepEqual(parseCourseTask({ taskPrompt: PROMPT, taskHintWords: 'nope' }).hintWords, []);
});

// --- 2. the round trip -------------------------------------------------------

test('courseTaskColumns → taskFromSession round-trips a task unchanged', () => {
  const task = parseCourseTask({ taskPrompt: PROMPT, taskTeil: 'Teil 2', taskHintWords: HINTS, taskAnrede: 'du' });
  const cols = courseTaskColumns(task);
  assert.equal(cols.topic, 'Teil 2');
  assert.deepEqual(JSON.parse(cols.scenario), { prompt: PROMPT, hintWords: HINTS, anrede: 'du' });
  assert.deepEqual(taskFromSession({ mission_id: null, ...cols }), task);
});

test('courseTaskColumns → taskFromSession round-trips the Sie default too', () => {
  const task = parseCourseTask({ taskPrompt: PROMPT, taskTeil: 'Teil 2', taskHintWords: HINTS });
  const cols = courseTaskColumns(task);
  assert.deepEqual(JSON.parse(cols.scenario), { prompt: PROMPT, hintWords: HINTS, anrede: 'Sie' });
  assert.deepEqual(taskFromSession({ mission_id: null, ...cols }), task);
  assert.equal(task.anrede, 'Sie');
});

test('courseTaskColumns nulls both columns when there is no task', () => {
  assert.deepEqual(courseTaskColumns(null), { topic: null, scenario: null });
});

test('taskFromSession returns null for mission, placement-shaped and empty rows', () => {
  const cols = courseTaskColumns(parseCourseTask({ taskPrompt: PROMPT }));
  assert.equal(taskFromSession({ mission_id: 'uuid-1', ...cols }), null);
  assert.equal(taskFromSession({ mission_id: null, topic: null, scenario: null }), null);
  assert.equal(taskFromSession({ mission_id: null, topic: 'Teil 2', scenario: '  ' }), null);
  assert.equal(taskFromSession(null), null);
});

test('taskFromSession tolerates a plain-string scenario', () => {
  const task = taskFromSession({ mission_id: null, topic: 'Teil 2', scenario: PROMPT });
  assert.deepEqual(task, { prompt: PROMPT, teil: 'Teil 2', hintWords: [], anrede: 'Sie' });
  // Malformed JSON is a string, not a crash.
  assert.equal(taskFromSession({ mission_id: null, topic: null, scenario: '{"prompt":' }).teil, 'Sprechen');
  // A JSON object with no usable prompt is no task at all.
  assert.equal(taskFromSession({ mission_id: null, topic: 'Teil 2', scenario: '{"hintWords":["a"]}' }), null);
});

// --- 3. the prompt -----------------------------------------------------------

test('buildTeacherSystemPrompt carries the task text and hint words', () => {
  const courseTask = parseCourseTask({ taskPrompt: PROMPT, taskTeil: 'Teil 2', taskHintWords: HINTS });
  const system = buildTeacherSystemPrompt({ level: 'A1.1', courseTask });
  assert.ok(system.includes(PROMPT), 'the task prompt must reach the teacher');
  assert.ok(system.includes('DEINE AUFGABE'));
  assert.ok(system.includes('Teil 2'));
  for (const w of HINTS) assert.ok(system.includes(w), `hint word missing: ${w}`);
  // Still a level-appropriate German teacher with the shared rules.
  assert.ok(system.includes('A1.1'));
  assert.ok(system.includes('WICHTIG — WIE DU SPRICHST'));
});

test('buildTeacherSystemPrompt carries the right ANREDE line for Sie and du', () => {
  const sieTask = parseCourseTask({ taskPrompt: PROMPT, taskAnrede: 'Sie' });
  const sieSystem = buildTeacherSystemPrompt({ level: 'A1.1', courseTask: sieTask });
  assert.ok(sieSystem.includes('ANREDE: Sprich den Lernenden mit Sie an und spiele die Rolle, die die Aufgabe verlangt (z. B. Kellner, Beamtin).'));
  assert.ok(!sieSystem.includes('duze den Lernenden'));

  const duTask = parseCourseTask({ taskPrompt: PROMPT, taskAnrede: 'du' });
  const duSystem = buildTeacherSystemPrompt({ level: 'A1.1', courseTask: duTask });
  assert.ok(duSystem.includes('ANREDE: Ihr seid Freunde/Kollegen — duze den Lernenden.'));
  assert.ok(!duSystem.includes('Sprich den Lernenden mit Sie an'));

  // No task at all → no ANREDE line, for free, mission and placement prompts.
  const free = buildTeacherSystemPrompt({ level: 'A1.1' });
  assert.ok(!free.includes('ANREDE:'));
  const mission = buildTeacherSystemPrompt({ level: 'A1.1', mission: { ai_role: 'Du bist Bäckerin.' } });
  assert.ok(!mission.includes('ANREDE:'));
  const placement = buildTeacherSystemPrompt({ level: 'placement', isPlacement: true, courseTask: duTask });
  assert.ok(!placement.includes('ANREDE:'));
});

test('a task with no hint words adds the task block but no hint block', () => {
  const system = buildTeacherSystemPrompt({ level: 'A1.1', courseTask: parseCourseTask({ taskPrompt: PROMPT }) });
  assert.ok(system.includes('DEINE AUFGABE'));
  assert.ok(!system.includes('HILFSWÖRTER'));
});

test('no task → no task lines at all (free, mission and placement)', () => {
  const free = buildTeacherSystemPrompt({ level: 'A1.1' });
  assert.ok(!free.includes('DEINE AUFGABE'));
  assert.ok(!free.includes('HILFSWÖRTER'));
  assert.ok(!free.includes(PROMPT));

  const courseTask = parseCourseTask({ taskPrompt: PROMPT, taskHintWords: HINTS });
  // A mission wins inside the builder too, not only at the parse boundary.
  const mission = buildTeacherSystemPrompt({
    level: 'A1.1',
    mission: { ai_role: 'Du bist Bäckerin.', target_structures: ['ich hätte gern'] },
    courseTask,
  });
  assert.ok(!mission.includes(PROMPT));
  assert.ok(mission.includes('Du bist Bäckerin.'));

  const placement = buildTeacherSystemPrompt({ level: 'placement', isPlacement: true, courseTask });
  assert.ok(!placement.includes(PROMPT));
  assert.ok(placement.includes('Einstufungstest'));
});

// --- 4. the wiring -----------------------------------------------------------

test('speaking-session persists the task into topic/scenario and prompts with it', () => {
  const src = read('netlify/functions/speaking-session.mjs');
  assert.ok(/parseCourseTask\(body\)/.test(src), 'start must parse the task from the body');
  assert.ok(src.includes('...courseTaskColumns(courseTask)'), 'task must be persisted on insert');
  assert.ok(/buildTeacherSystemPrompt\(\{[\s\S]*courseTask,[\s\S]*\}\)/.test(src), 'opening line must use the task');
  // Identity still comes from the verified JWT, never from the body.
  assert.ok(src.includes('const user_id = await getAuthenticatedUserId(event)'));
  assert.ok(!/user_id\s*[:=]\s*body\./.test(src));
  assert.ok(src.includes('export const handler'), 'v1 handler signature');
  assert.ok(src.includes("'Access-Control-Allow-Origin'"), 'CORS preamble');
});

test('speaking-turn reads the columns back and keeps every turn on task', () => {
  const src = read('netlify/functions/speaking-turn.mjs');
  assert.ok(/\.select\('[^']*\btopic\b[^']*\bscenario\b[^']*'\)/.test(src), 'the session select must include topic + scenario');
  assert.ok(src.includes('taskFromSession(session)'), 'the task must be rebuilt from the row');
  assert.ok(src.includes('buildTeacherSystemPrompt({ level, mission, isPlacement, courseTask })'));
  assert.ok(src.includes('export const handler'), 'v1 handler signature');
});

test('the client sends the task only when no mission is selected', () => {
  const src = read('src/pages/SpeakingPage.jsx');
  assert.ok(src.includes('taskPrompt: courseTask.promptDe'));
  assert.ok(src.includes('taskTeil: courseTask.teil'));
  assert.ok(src.includes('taskAnrede: courseTask.anrede'));
  assert.ok(src.includes('taskHintWords: courseTask.hintWords'));
  assert.ok(src.includes('courseTaskActive && !selectedMissionId'), 'a chosen mission must suppress the task fields');
});

// --- 5. course v2: multi-Teil speaking rounds (a1.1-u01 r2-F01 class) ---------
//
// SCHEMA §12: the speaking functions read the bank shard „incl. `parts`". A1.1 has eight
// rounds (u01, u04, u05, u06, u08, u09, u10, u12: sd1.sp1 + sd1.sp2, or sd1.sp2 + sd1.sp3).
// Over every registered course, compiled in memory by the real compiler: (a) the partner
// prompt has one ABLAUF per part and every part's learner and partner cards; (b) the grading
// plan covers every part on its own profile; (c) every speaking Teil the unit's Prüfungsfokus
// names (slot 'sprechen') is run as a part and scored on that Teil's rubric.

const { compileLevel, levelsIn } = await import('../scripts/course-v2/lib/compiler.mjs');
const { CONTENT_ROOT, FIXTURES_ROOT } = await import('../scripts/course-v2/lib/tree.mjs');
const { buildCoursePartnerPrompt, normalizeSpeakingTask } = await import('../netlify/functions/_shared/speakingAI.mjs');
const { speakingPartsPlan } = await import('../netlify/functions/_shared/rubrics/grade.mjs');
const { compileRubrics } = await import('../scripts/course-v2/compile-rubrics.mjs');
const { mkdtempSync, rmSync } = await import('node:fs');
const { tmpdir } = await import('node:os');

const V2_RUBRICS = JSON.parse(compileRubrics().text).profiles;
const LANES = Object.fromEntries(['sd1', 'ga2', 'tb1', 'tb2'].map((l) => [l, JSON.parse(read(`content/course-v2/registries/lanes/${l}.json`))]));
const rubricOfTemplate = (template) => {
  const [lane, teil] = String(template).split('.');
  return LANES[lane]?.teile?.[teil]?.rubric || null;
};

function compiledCourses() {
  const tmp = mkdtempSync(join(tmpdir(), 'cv2-speak-'));
  const out = [];
  try {
    for (const level of levelsIn(CONTENT_ROOT, { exclude: [FIXTURES_ROOT] })) {
      const r = compileLevel(level, { contentRoot: CONTENT_ROOT, exclude: [FIXTURES_ROOT], outRoot: join(tmp, 'o'), banksRoot: join(tmp, 'b') });
      const banks = r.outputs.find((o) => o.file.endsWith(`${level}.banks.json`));
      const units = r.outputs.filter((o) => /\/units\/u\d{2}\.json$/.test(o.file)).map((o) => JSON.parse(o.text));
      if (banks) out.push({ level, banks: JSON.parse(banks.text), units });
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  return out;
}
const COURSES = compiledCourses();
const cardText = (c) => (typeof c === 'string' ? c : (c && c.de) || '');
const A11_ROUNDS = ['a11-u01-s', 'a11-u04-s', 'a11-u05-s', 'a11-u06-s', 'a11-u08-s', 'a11-u09-s', 'a11-u10-s', 'a11-u12-s'];

test('v2 rounds: the A1.1 multi-Teil tasks keep their parts in the compiled bank', () => {
  const a11 = COURSES.find((c) => c.level === 'a1.1');
  if (!a11) return;
  const compiledUnits = new Set(a11.units.map((u) => u.id));
  for (const key of A11_ROUNDS) {
    const unitId = `a1.1-u${key.slice(5, 7)}`;
    if (!compiledUnits.has(unitId)) continue; // a unit being edited that does not compile right now
    const entry = a11.banks.speaking[key];
    assert.ok(entry, `${key} is in the bank`);
    assert.ok(Array.isArray(entry.parts) && entry.parts.length >= 2, `${key} keeps its parts`);
  }
});

test('v2 rounds: one ABLAUF per part with every card, and every part graded on its own profile', () => {
  let rounds = 0;
  for (const { level, banks } of COURSES) {
    for (const [key, entry] of Object.entries(banks.speaking || {})) {
      if (!Array.isArray(entry.parts) || entry.parts.length < 2) continue;
      rounds += 1;
      const prompt = buildCoursePartnerPrompt({ level: level.toUpperCase(), task: entry });
      assert.equal((prompt.match(/^ABLAUF/gm) || []).length, entry.parts.length, `${key}: one ABLAUF per part`);
      for (const p of entry.parts) {
        for (const c of [...(p.cards?.learner || []), ...(p.cards?.partner || [])]) {
          if (cardText(c)) assert.ok(prompt.includes(`„${cardText(c)}“`), `${key}: card „${cardText(c)}“`);
        }
      }
      const plans = speakingPartsPlan(normalizeSpeakingTask(entry), (id) => V2_RUBRICS[id] || null);
      plans.forEach((pl, i) => {
        assert.equal(pl.profileId, entry.parts[i].profile, `${key} part ${i + 1}: its own profile`);
        assert.ok(pl.plan && pl.plan.length, `${key} part ${i + 1}: the profile resolves`);
      });
    }
  }
  assert.ok(rounds > 0 || COURSES.length === 0, 'the rule ran on at least one round');
});

test('v2 rounds: every speaking Teil of a unit\'s Prüfungsfokus is run and scored on that Teil\'s rubric', () => {
  for (const { level, banks, units } of COURSES) {
    for (const u of units) {
      const teile = (u.spec?.lanes?.pruefungsfokus || []).filter((p) => p.slot === 'sprechen').map((p) => p.template);
      if (!teile.length) continue;
      const step = (u.steps || []).find((s) => s.kind === 'sprechen');
      if (!step || !step.task || !step.task.bankKey) continue;
      const entry = banks.speaking[step.task.bankKey];
      assert.ok(entry, `${u.id}: ${step.task.bankKey} is in the ${level} bank`);
      const parts = Array.isArray(entry.parts) ? entry.parts : [entry];
      for (const tpl of teile) {
        const part = parts.find((p) => p.template === tpl);
        assert.ok(part, `${u.id}: the Prüfungsfokus Teil ${tpl} is run`);
        const want = rubricOfTemplate(tpl);
        if (want) assert.equal(part.profile, want, `${u.id}: ${tpl} is scored on ${want}`);
      }
    }
  }
});
