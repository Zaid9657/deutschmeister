import test from 'node:test';
import assert from 'node:assert/strict';
import { a2EngineCourse, calendar } from './fixtures/a2-engine-course.mjs';
import { A11_META, LANDESKUNDE, WORTFELD_ICONS } from '../src/data/curricula/a11.meta.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { courseMetaFor, courseMetaErrors, landeskundeFor, wortfeldIconsFor } from '../src/lib/course/meta.js';
import { canDoLines } from '../src/lib/course/canDo.js';
import { normalizeCourseContext, saveCourseContext, readCourseContext } from '../src/lib/courseFlow.js';
import { speakingMaterials } from '../src/lib/lesson/speaking.js';
import { parseCourseTask, courseTaskColumns, taskFromSession, buildTeacherSystemPrompt } from '../netlify/functions/_shared/speakingAI.mjs';
import { buildWritingPrompt, gateEvaluation } from '../netlify/functions/evaluate-writing.mjs';
import { a2WritingFormat, examFormat } from '../src/data/curricula/examFormats.js';
import { writingTasksForExam } from '../src/data/writingTasks.js';
import { validateCurriculum } from '../scripts/validate-curriculum.mjs';

export function withMeta() {
  const c = a2EngineCourse();
  c.meta = {
    aboutEn: 'Synthetic A2 fixture.', outcomesEn: ['Ask about a day.'],
    chapters: [{ nr: 1, lektionen: [1, 2, 3], titleDe: 'Termine', titleEn: 'Appointments', storyEn: 'Find a day.' }],
    characters: [{ name: 'Ana', roleEn: 'A2 fixture role', appearsIn: [1, 2, 3] }],
    lektionIntro: Object.fromEntries(c.lektionen.map((l) => [l.id, { situationEn: 'Fixture situation', canDoEn: l.canDo.map((_, i) => `I can do fixture task ${i + 1}.`) }])),
    wortfeldIcons: { Hallo: 'Calendar' },
    landeskunde: { 1: { titleDe: 'Termine', titleEn: 'Appointments', bodyDe: 'Lesen Sie den Kalender.', bodyEn: 'Read the calendar.', source: 'Synthetic fixture, not course content.' } },
  };
  return c;
}

test('G8: level-generic metadata preserves A1 defaults and validates synthetic A2 chrome', () => {
  assert.equal(courseMetaFor(CURRICULUM_A11), A11_META);
  assert.equal(courseMetaFor('A1.1'), A11_META);
  assert.equal(courseMetaFor(CURRICULUM_A12), null);
  assert.equal(landeskundeFor(CURRICULUM_A11), LANDESKUNDE);
  assert.deepEqual(landeskundeFor(CURRICULUM_A12), {});
  assert.equal(wortfeldIconsFor(CURRICULUM_A12), WORTFELD_ICONS);
  const c = withMeta();
  assert.deepEqual(courseMetaErrors(c), []);
  assert.equal(courseMetaFor(c).chapters[0].titleEn, 'Appointments');
  assert.equal(courseMetaFor(c).characters[0].roleEn, 'A2 fixture role');
  assert.deepEqual(canDoLines(c.lektionen[0], 'en', c), c.meta.lektionIntro[c.lektionen[0].id].canDoEn);
  assert.deepEqual(canDoLines(c.lektionen[0], 'de', c), c.lektionen[0].canDo);
  assert.equal(landeskundeFor(c)[1].titleDe, 'Termine');
  assert.equal(wortfeldIconsFor(c).Hallo, 'Calendar');
  assert.ok(courseMetaFor(c).howItWorksEn.minutesEstimate.hi > 0);
  c.meta.lektionIntro[c.lektionen[0].id].canDoEn.pop();
  c.meta.landeskunde[1].source = '';
  c.meta.chapters[0].lektionen.push(1);
  assert.equal(courseMetaErrors(c).length, 3);
  assert.ok(validateCurriculum(c, [], []).some((e) => e.includes('metadata')));
});

for (const [teil, materials] of [
  ['Sprechen Teil 1', { cards: ['Familie', 'Beruf', 'Wohnort', 'Freizeit'] }],
  ['Sprechen Teil 2', { prompts: ['Morgens', 'Arbeit', 'Abends', 'Wochenende'] }],
  ['Sprechen Teil 3', { calendar }],
]) test(`G12: ${teil} survives storage, request parsing and every coach turn`, () => {
  const ctx = { level: 'a2.1', openTeil: teil, openPrompt: 'Sprechen Sie über Ihren Tag.', hintWords: ['Tag'], anrede: 'Sie', ...materials };
  assert.deepEqual(speakingMaterials(normalizeCourseContext(ctx)), materials);
  const prior = globalThis.sessionStorage;
  const storage = new Map();
  globalThis.sessionStorage = { setItem: (k, v) => storage.set(k, v), getItem: (k) => storage.get(k) };
  try { saveCourseContext(ctx); assert.deepEqual(speakingMaterials(readCourseContext()), materials); }
  finally { if (prior === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = prior; }
  const task = parseCourseTask({ taskPrompt: ctx.openPrompt, taskTeil: teil, taskHintWords: ctx.hintWords, taskAnrede: 'Sie', taskCards: materials.cards, taskPrompts: materials.prompts, taskCalendar: materials.calendar });
  assert.deepEqual(speakingMaterials(task), materials);
  const rebuilt = taskFromSession(courseTaskColumns(task));
  assert.deepEqual(rebuilt, task);
  const prompt = buildTeacherSystemPrompt({ level: 'a2.1', courseTask: rebuilt });
  assert.ok(prompt.includes(materials.cards?.[0] || materials.prompts?.[0] || 'Kalender 2'));
});

test('G12: untrusted speaking material is bounded; old A1 hand-offs keep their shape', () => {
  assert.deepEqual(speakingMaterials({}), {});
  const old = parseCourseTask({ taskPrompt: 'Stellen Sie sich vor.', taskTeil: 'Sprechen Teil 1', taskHintWords: ['Name'] });
  assert.deepEqual(old, { prompt: 'Stellen Sie sich vor.', teil: 'Sprechen Teil 1', hintWords: ['Name'], anrede: 'Sie' });
  assert.deepEqual(speakingMaterials({ cards: [null, {}, '  Familie  '], calendar: [null] }), { cards: ['Familie'], calendar: [{ owner: '', slots: [] }] });
  assert.equal(speakingMaterials({ cards: Array(20).fill('x'.repeat(300)) }).cards.length, 4);
  assert.equal(speakingMaterials({ cards: ['x'.repeat(300)] }).cards[0].length, 160);
});

test('G10: A2 rubric ranges and strict 50% floor derive from the exam format', () => {
  const evaluation = { scores: { task: 5, structure: 5, accuracy: 5, vocabulary: 5 }, total_score: 20, leitpunkt_check: [true, true, true] };
  for (const form of examFormat('goethe_a2').writing) {
    const task = { examKey: 'goethe_a2', textsorte: form.textsorte, register: form.textsorte === 'sms' ? 'informell' : 'halbformell', minWords: 999, maxWords: 999, task: 'Schreiben Sie über Ihren Tag.', leitpunkte: ['Ort', 'Tag', 'Zeit'] };
    assert.equal(a2WritingFormat(task), form);
    for (const lang of ['de', 'en']) {
      const prompt = buildWritingPrompt(task, 'Ein Text.', lang);
      assert.ok(prompt.includes(`${form.range[0]}–${form.range[1]} Wörter`));
      assert.ok(prompt.includes(`Unter ${form.range[0] / 2} Wörtern`));
      assert.ok(prompt.includes('jeden der drei Leitpunkte und das Register'));
      assert.ok(prompt.includes(lang === 'en' ? 'short, simple English' : 'kurzem, einfachem Deutsch'));
      assert.ok(!prompt.includes('999'));
    }
    const floor = form.range[0] / 2;
    assert.equal(gateEvaluation(task, Array(floor - 1).fill('Hallo').join(' '), evaluation).total_score, 0);
    assert.equal(gateEvaluation(task, Array(floor).fill('Hallo').join(' '), evaluation).total_score, 20);
  }
  for (const task of writingTasksForExam('goethe_a2')) {
    assert.deepEqual([task.minWords, task.maxWords], a2WritingFormat(task).range);
    assert.doesNotMatch(task.task, /\b(Du|Deine|deinem|dich|dir|Schreib|Vergiss)\b/);
  }
  const a1 = { examKey: 'goethe_a1', register: 'informell', minWords: 25, maxWords: 45, leitpunkte: ['Ort', 'Tag', 'Zeit'], task: 'Schreiben Sie.' };
  assert.deepEqual(gateEvaluation(a1, 'Hallo', evaluation), { ...evaluation, improvements: [], gate: { copied: false, covered: 3, reported_total: 20 } });
  assert.match(buildWritingPrompt(a1, 'Hallo'), /25–45 Wörter/);
  assert.doesNotMatch(buildWritingPrompt(a1, 'Hallo'), /Unter 10|Niveau A2/);
});
