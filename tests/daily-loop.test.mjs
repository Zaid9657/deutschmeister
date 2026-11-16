import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 as curriculum } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { curriculumPath } from '../src/data/curricula/index.js';
import { dailyOpening, dailyT, dailyText, completedCanDos } from '../src/lib/course/dailyLoop.js';
const path = curriculumPath(curriculum);
const today = new Date(2026, 10, 14, 12);
const at = (day) => new Date(2026, 10, day, 12).toISOString();
const open = (input = {}) => dailyOpening({ curriculum, path, today, ...input });

test('daily opening derives all six situations from existing evidence', () => {
  assert.equal(open().situation, 'first');
  assert.equal(open({ attempts: [{ created_at: at(13) }] }).situation, 'nextDay');
  const back = open({ attempts: [{ created_at: at(4) }] });
  assert.equal(back.situation, 'break');
  for (const lang of ['de', 'en']) assert.doesNotMatch(dailyT(back.situation, lang), /miss|away|absence|break|verpasst|Pause|Abwesen|fehl/i);
  assert.equal(open({ run: { lektionId: curriculum.lektionen[0].id, stageKey: 'practice', savedAt: +today } }).situation, 'saved');
  assert.equal(open({ rows: [{ lektion_id: curriculum.lektionen[0].id, completed_at: at(13) }] }).situation, 'finished');
  const reteach = open({ attempts: [{ lektion_id: curriculum.lektionen[0].id, item_id: 'proof-a1.1-l01-0', stage: 'proof', correct: false, created_at: at(13) }] });
  assert.equal(reteach.situation, 'reteach');
  assert.equal(reteach.goal('de'), curriculum.lektionen[0].canDo[0]);
  assert.equal(open({ attempts: [{ stage: 'proof', correct: true, created_at: at(13) }] }).situation, 'nextDay');
});

test('plan and primary target agree for lessons, saved parts, checkpoint, and completion', () => {
  assert.equal(open().href, '/course/a1.1/l/1');
  assert.equal(open().planVars.lo > 0, true);
  const run = { lektionId: 'a1.1-l02', stageKey: 'writing', savedAt: +today };
  const saved = open({ run, due: 8 });
  assert.equal(saved.href, '/course/a1.1/l/2');
  assert.equal(saved.planVars.part, 3);
  assert.equal(saved.planVars.due, 8);
  const checkpoint = open({ done: new Set(curriculum.lektionen.slice(0, 3).map((l) => l.id)) });
  assert.equal(checkpoint.href, '/course/a1.1/checkpoint/1');
  assert.equal(open({ done: new Set(path.map((n) => n.id)) }).href, '/course/a1.1/complete');
  assert.equal(open({ attempts: [{ created_at: at(12) }] }).day, 3);
});

test('goal line is honest for no date, sustainable pace, short date and past date', () => {
  assert.equal(open().plan.status, 'no-date');
  assert.equal(open({ profile: { exam_date: '2027-06-01' } }).plan.status, 'ahead');
  assert.equal(open({ profile: { exam_date: '2026-11-15' } }).plan.status, 'behind');
  assert.equal(open({ profile: { exam_date: '2026-11-01' } }).plan.status, 'past');
  const card = readFileSync(new URL('../src/components/course/TodayCard.jsx', import.meta.url), 'utf8');
  assert.match(card, /<ExamDatePlan/);
  assert.match(card, /plan.status !== 'no-date'/);
});

test('names are signed-in display data only; unsupported courses render nothing', () => {
  assert.equal(open({ profile: { full_name: 'Ada' } }).name, '');
  assert.equal(open({ profile: { full_name: 'Ada' }, signedIn: true }).name, 'Ada');
  assert.equal(dailyOpening({ curriculum: CURRICULUM_A12 }), null);
  const model = readFileSync(new URL('../src/lib/course/dailyLoop.js', import.meta.url), 'utf8');
  assert.doesNotMatch(model, /safeSet|localStorage|\.insert\(|\.update\(/);
});

test('German daily templates use Sie; completed can-dos are unique and completion based', () => {
  assert.doesNotMatch(Object.values(dailyText.de).join(' '), /\b(du|dich|dir|dein|deine|kannst|hast)\b/i);
  assert.equal(completedCanDos(curriculum, new Set()).length, 0);
  const done = new Set(curriculum.lektionen.slice(0, 2).map((l) => l.id));
  const list = completedCanDos(curriculum, done);
  assert.equal(list.length, curriculum.lektionen.slice(0, 2).reduce((n, l) => n + l.canDo.length, 0));
  assert.equal(new Set(list.map((l) => l.id)).size, list.length);
});

const { dailyWarmupRows, needsDailyWarmup } = await import('../src/lib/course/dailyWarmup.js');
const { buildCardIndex, warmupCards } = await import('../src/services/reviewService.js');
const { default: buildLesson } = await import('../src/lib/lesson/buildLesson.js');
const { forgivingStreak } = await import('../src/lib/course/milestones.js');
const { pauseCanDos, dailySupported } = await import('../src/lib/course/dailyLoop.js');

test('warm-up prefers checked passed material, preserves ladder steps, and comes before other checks', () => {
  const index = buildCardIndex(curriculum);
  const words = [...index].filter(([, c]) => c.kind === 'word' && c.lektionNr === 1).map(([key]) => key);
  const rows = [
    { card_key: words[0], step: 2, last_result: 'wrong' },
    { card_key: words[1], step: 2, last_result: 'correct' },
    { card_key: words[2], step: 0, last_result: 'correct' },
  ];
  const picked = dailyWarmupRows(rows, index, curriculum, [], 2);
  assert.deepEqual(picked, [rows[1]]);
  assert.equal(warmupCards(picked, index)[0].step, 2);
  const lesson = buildLesson({ curriculum, lektion: curriculum.lektionen[1], pool: [], dueCards: warmupCards(picked, index) });
  assert.equal(lesson.stages[0].kind, 'warmup');
  assert.equal(lesson.stages[1].kind, 'pretest');
  assert.deepEqual(dailyWarmupRows([], index, curriculum, [], 1), [], 'brand-new learner keeps first sentence');
  const passed = [{ lektion_id: 'a1.1-l01', item_id: 'proof-a1.1-l01-0', stage: 'proof', correct: true }];
  const priorProof = dailyWarmupRows([], index, curriculum, passed, 2);
  assert.ok(priorProof.length > 0 && priorProof.length <= 2);
  assert.ok(priorProof.every((r) => r.practiceOnly && r.step === 2));
  assert.deepEqual(dailyWarmupRows([], index, curriculum, passed.map((a) => ({ ...a, correct: false })), 2), []);
  assert.equal(needsDailyWarmup({ savedAt: at(13), stageKey: 'practice' }, today), true);
  assert.equal(needsDailyWarmup({ savedAt: at(14), stageKey: 'practice' }, today), false);
  const player = readFileSync(new URL('../src/pages/lesson/LessonPlayerPage.jsx', import.meta.url), 'utf8');
  assert.match(player, /if \(returningDay && openingCards === null\)/);
  assert.match(player, /const stage = useMemo\(\(\) => opening \? \{ key: 'warmup'/);
  assert.match(player, /if \(opening\) \{ setOpeningIndex/);
});

test('forgiving streak allows one rest day per rolling seven and counts only learning', () => {
  const key = (day) => `2026-10-${day}`;
  assert.equal(forgivingStreak([14, 13, 11, 10, 9].map(key), { today }), 5);
  assert.equal(forgivingStreak([14, 12, 10, 9].map(key), { today }), 2);
  assert.equal(forgivingStreak([13, 12].map(key), { today }), 2, 'today can still be a learning day');
  assert.equal(forgivingStreak([], { today }), 0);
});

test('saved pause claims practice from observed checks and never adds an unfinished can-do to the count', () => {
  const l = curriculum.lektionen[0];
  assert.deepEqual(pauseCanDos(l, []), []);
  const practiced = pauseCanDos(l, [{ stage: 'scene', itemId: `scene-${l.id}-1`, correct: true }]);
  assert.ok(practiced.length > 0);
  assert.equal(completedCanDos(curriculum, new Set()).length, 0);
  assert.equal(dailySupported(curriculum, { ...l, flow: 'legacy' }), false);
  assert.equal(dailySupported(curriculum, { id: 'missing', flow: 'guided' }), false);
  const pause = readFileSync(new URL('../src/components/lesson/SessionBreak.jsx', import.meta.url), 'utf8');
  assert.match(pause, /<DayDone.*part=\{done\}.*attempts=\{attempts\}/);
  const player = readFileSync(new URL('../src/pages/lesson/LessonPlayerPage.jsx', import.meta.url), 'utf8');
  assert.match(player, /body = <>{body}<DayDone.*part=\{pause.done\}/);
  const card = readFileSync(new URL('../src/components/course/DayDone.jsx', import.meta.url), 'utf8');
  assert.match(card, /if \(!supported\) return null/);
  assert.match(card, /if \(completed\) done.add\(lesson.id\)/);
  assert.match(card, /<details/);
});

test('yesterday help starts with that now-passed goal; newer successful evidence supersedes it', () => {
  const index = buildCardIndex(curriculum);
  const help = { lektion_id: 'a1.1-l01', item_id: 'proof-a1.1-l01-0', stage: 'proof', correct: false, error_tag: 'proof-help', created_at: at(13) };
  const rows = dailyWarmupRows([], index, curriculum, [help], 2, null, today);
  assert.ok(rows.length > 0);
  assert.equal(rows[0].practiceOnly, true);
  assert.equal(open({ attempts: [help, { ...help, correct: true, created_at: at(14) }] }).situation, 'nextDay');
});

const { loadJsxModule } = await import('./helpers/renderJsx.mjs');
const dailyModule = await import('../src/lib/course/dailyLoop.js');
const { A11_META } = await import('../src/data/curricula/a11.meta.js');
const { canDoLines } = await import('../src/lib/course/canDo.js');
const treeText = (tree) => Array.isArray(tree) ? tree.map(treeText).join(' ') : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : treeText(tree?.props?.children || []);
const elements = (tree, type) => Array.isArray(tree) ? tree.flatMap((x) => elements(x, type)) : tree && typeof tree === 'object' ? [...(tree.type === type ? [tree] : []), ...elements(tree.props?.children, type)] : [];

test('rendered closing card leads with evidence, counts unique completed can-dos, and supports both pause types', async () => {
  let evidence = { rows: [], attempts: [] };
  const stubs = {
    react: { useState: () => [evidence, () => {}], useEffect: () => {} },
    '../../contexts/AuthContext': { useAuth: () => ({ user: null }) },
    '../../data/curricula/a11.meta.js': { A11_META },
    '../../lib/course/canDo.js': { canDoLines },
    '../../lib/course/dailyLoop.js': dailyModule,
    '../../lib/course/milestones.js': { forgivingStreak },
    '../../services/dailyCourse.js': { loadDailyCourse: async () => evidence },
  };
  const { default: Card } = await loadJsxModule('src/components/course/DayDone.jsx', stubs);
  for (const lang of ['en', 'de']) {
    const lesson = curriculum.lektionen[1];
    evidence = { rows: [{ lektion_id: curriculum.lektionen[0].id, completed_at: at(13) }], attempts: [] };
    const recap = Card({ curriculum, lesson, lang, completed: true });
    assert.ok(treeText(recap).includes(dailyT('count', lang, { n: curriculum.lektionen[0].canDo.length + lesson.canDo.length })));
    assert.ok(treeText(recap).includes(dailyT('shown', lang)));
    assert.ok(treeText(recap).includes(lesson.nextHook[lang]));
    assert.ok(treeText(recap).includes(canDoLines(curriculum.lektionen[2], lang)[0]));
    assert.equal(elements(recap, 'details').length, 1);
    const pause = Card({ curriculum, lesson, lang, part: 1, attempts: lesson.guided.chunks.map((_, i) => ({ stage: 'scene', itemId: `scene-${lesson.id}-${i + 1}`, correct: true })) });
    assert.ok(treeText(pause).includes(dailyT('count', lang, { n: curriculum.lektionen[0].canDo.length })));
    assert.ok(treeText(pause).includes(dailyT('practised', lang)));
    assert.ok(treeText(pause).includes(dailyT('nextPart', lang, { part: 2, nr: 2 })));
  }
  assert.equal(Card({ curriculum: CURRICULUM_A12, lesson: CURRICULUM_A12.lektionen[0], lang: 'de' }), null);
  assert.equal(Card({ curriculum, lesson: null, lang: 'en' }), null);
});

test('rendered Today card uses the model target and omits a guest name', async () => {
  const { default: Card } = await loadJsxModule('src/components/course/TodayCard.jsx', {
    '../../data/curricula/a11.meta.js': { A11_META },
    '../../lib/course/dailyLoop.js': dailyModule,
    '../ui/Button.jsx': { default: 'Button' },
    '../ui/Card.jsx': { default: 'Card' },
    './ExamDatePlan.jsx': { default: 'ExamDatePlan' },
  });
  const input = { curriculum, path, today, done: new Set(), lang: 'en', profile: { full_name: 'Private Name' }, signedIn: false };
  const tree = Card(input);
  assert.doesNotMatch(treeText(tree), /Private Name/);
  assert.equal(elements(tree, 'Button')[0].props.to, open().href);
  assert.equal(elements(tree, 'ExamDatePlan').length, 0);
  const account = Card({ ...input, signedIn: true });
  assert.match(treeText(account), /Private Name/);
  assert.equal(elements(account, 'ExamDatePlan').length, 1);
  assert.equal(Card({ curriculum: CURRICULUM_A12 }), null);
});

test('daily texts: both languages carry the same keys; no count of zero and no "1 days" reach the learner', async () => {
  const { dailyText, dailyT } = await import('../src/lib/course/dailyLoop.js');
  assert.deepEqual(Object.keys(dailyText.de).sort(), Object.keys(dailyText.en).sort());
  for (const lang of ['en', 'de']) {
    for (const key of ['planNoDue', 'nodeNoDue']) assert.doesNotMatch(dailyText[lang][key], /\{due\}/, `${lang}.${key} says nothing about review`);
    assert.doesNotMatch(dailyT('streakOne', lang, { n: 1 }), /\b1\b/, 'the first day is said in words, not as "1 days"');
    assert.match(dailyT('tomorrow', lang, { goal: 'X' }), /X/);
  }
  const source = (await import('node:fs')).readFileSync(new URL('../src/lib/course/dailyLoop.js', import.meta.url), 'utf8');
  assert.match(source, /due > 0 \? 'plan' : 'planNoDue'/, 'a plan line with nothing due uses the text without a count');
  const dayDone = (await import('node:fs')).readFileSync(new URL('../src/components/course/DayDone.jsx', import.meta.url), 'utf8');
  assert.match(dayDone, /streak === 1 \? 'streakOne' : 'streak'/);
});
