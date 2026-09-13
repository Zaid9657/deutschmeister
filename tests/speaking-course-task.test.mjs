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
