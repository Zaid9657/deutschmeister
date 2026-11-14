import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import buildLesson from '../src/lib/lesson/buildLesson.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { guidedFindings } from '../scripts/lib/guided-content.mjs';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { sessionOf, sessionCompleted } from '../src/lib/lesson/sessions.js';
import { sceneStep } from '../src/lib/lesson/buildGuided.js';
import { sayText } from '../src/lib/lesson/scene.js';
import { packRun, unpackRun, RUN_VERSION } from '../src/lib/lesson/runState.js';
import { practiceScore } from '../src/lib/lesson/mastery.js';
import { createStageReachWriter, stageSteps } from '../src/lib/lesson/stageReach.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
const lektion = CURRICULUM_A11.lektionen[0];
const build = (l = lektion, attempt = 1) => buildLesson({ curriculum: CURRICULUM_A11, lektion: l, pool, attempt });
const legacyOrder = ['pretest', 'dialog', 'wortfeld', 'notice', 'phonetik', 'practice', 'derived', 'dictation', 'speaking', 'writing', 'requeue', 'recap'];

test('all A1.1 lessons are guided; A1.2 and a synthetic lesson without flow keep the legacy order', () => {
  assert.deepEqual(CURRICULUM_A11.lektionen.filter((l) => l.flow).map((l) => l.nr), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.ok(CURRICULUM_A12.lektionen.every((l) => !l.flow));
  assert.deepEqual(build().stages.map((s) => s.key), ['pretest', 'scene', 'wortfeld', 'sound', 'read', 'notice', 'practice', 'derived', 'dictation', 'fluency', 'speaking', 'writing', 'proof', 'requeue', 'recap']);
  assert.deepEqual(build({ ...CURRICULUM_A11.lektionen[1], flow: undefined }).stages.map((s) => s.key), legacyOrder);
  const a12 = buildLesson({ curriculum: CURRICULUM_A12, lektion: CURRICULUM_A12.lektionen[0], pool: JSON.parse(read('src/data/lessonPools/a12.json')) });
  assert.deepEqual(a12.stages.map((s) => s.key), legacyOrder);
});

test('guided pacing preserves every word, both pauses, all unchanged stages and every seeded draw', () => {
  for (const attempt of [1, 2, 3]) {
    const guided = build(lektion, attempt);
    const legacy = build({ ...lektion, flow: undefined }, attempt);
    const rest = (lesson) => Object.fromEntries(lesson.stages.filter((s) => !['scene', 'dialog', 'wortfeld', 'phonetik', 'sound', 'read', 'fluency', 'proof'].includes(s.kind)).map(({ part: _part, nextHook: _hook, ...s }) => [s.key, s]));
    assert.deepEqual(rest(guided), rest(legacy));
    const words = guided.stages.filter((s) => ['wortfeld', 'read'].includes(s.kind));
    assert.equal(words.length, 2);
    assert.equal(new Set(words.flatMap((s) => s.words)).size, lektion.wortfeld.length);
    assert.ok(words[0].words.length < lektion.wortfeld.length);
    assert.deepEqual(words.flatMap((s) => s.words).sort((a, b) => a.de.localeCompare(b.de)), [...lektion.wortfeld].sort((a, b) => a.de.localeCompare(b.de)));
    assert.deepEqual(guided.stages.slice(1).map((s, i) => sessionCompleted(guided.stages[i], s)).filter(Boolean), [1, 2]);
    assert.deepEqual(guided.stages.map(sessionOf), [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3]);
    assert.equal(guided.stages.find((s) => s.kind === 'practice').items.length, 7);
    assert.equal(guided.stages.find((s) => s.kind === 'derived').items.length, 3);
  }
});

test('every scene line is original and meaning recognition goes through the common checker', () => {
  const scene = build().stages.find((s) => s.kind === 'scene');
  assert.deepEqual(scene.chunks.flatMap((c) => c.lines).map(({ index: _index, ...line }) => line), lektion.dialog.lines);
  for (const chunk of scene.chunks) {
    assert.ok(chunk.lines.length >= 2 && chunk.lines.length <= 3);
    assert.equal(chunk.say.speaker, 'Ana');
    const item = chunk.meaning;
    for (const option of item.options) assert.equal(checkAnswer(option, item.accepted, checkOptionsFor(item)).result, option === item.answer ? RESULT.CORRECT : RESULT.WRONG);
  }
  assert.match(read('src/components/lesson/CheckedChoice.jsx'), /checkAnswer\(answer, item.accepted, checkOptionsFor\(item\)\)/);
  const score = practiceScore([{ stage: 'scene', itemId: 'meaning', correct: true }, { stage: 'practice', itemId: 'p', correct: false }]);
  assert.equal(score.accuracy, 0, 'scene never raises practice gold');
});

test('the learner says their own name; no scene answer text is persisted', () => {
  const scene = build().stages.find((s) => s.kind === 'scene');
  assert.equal(sayText(scene.chunks[0].say, '  Sam   Noor '), 'Guten Tag. Ich heiße Sam Noor.');
  assert.equal(sayText(scene.chunks[1].say, 'Noor'), 'N-O-O-R.');
  assert.equal(sayText(scene.chunks[0].say, ''), null);
  assert.equal(sayText(scene.chunks[2].say, 'Sam Noor'), 'Mir geht es gut, danke.');
  const now = Date.now();
  const snapshot = packRun({ flow: 'guided', stageKey: 'scene', itemIndex: 5, sceneReadAloud: { 0: { pct: 0.7, attempts: 2, usedMic: true, text: 'Sam Noor', transcript: 'Sam Noor' } } }, now);
  assert.equal(snapshot.v, RUN_VERSION);
  assert.equal(RUN_VERSION, 1);
  assert.equal(unpackRun(snapshot, now, 'legacy'), null);
  assert.deepEqual(unpackRun(snapshot, now, 'guided'), snapshot);
  assert.equal(unpackRun({ ...snapshot, flow: undefined }, now, 'guided'), null);
  assert.equal(unpackRun(packRun({ stageKey: 'practice' }, now), now, 'legacy').flow, 'legacy');
  assert.equal(snapshot.itemIndex, 5);
  assert.doesNotMatch(JSON.stringify(snapshot), /Sam|Noor|transcript|"text"/);
});

test('RULE 32 rejects invalid guided fields without changing legacy curricula', () => {
  assert.deepEqual(guidedFindings(CURRICULUM_A11), []);
  assert.deepEqual(guidedFindings(CURRICULUM_A12), []);
  const mutations = [
    (l) => { l.flow = 'other'; }, (l) => { delete l.guided; },
    (l) => { l.guided.chunks = []; }, (l) => { l.guided.chunks[0] = null; },
    (l) => { l.guided.chunks[0].from = 1; }, (l) => { l.guided.chunks[0].to = 4; },
    (l) => { l.guided.chunks.pop(); }, (l) => { delete l.guided.chunks[0].meaning.promptDe; },
    (l) => { l.guided.chunks[0].meaning.promptDe = 'Wähle die Bedeutung.'; },
    (l) => { l.guided.chunks[0].meaning.promptEn = ''; },
    (l) => { l.guided.chunks[0].meaning.options = ['a', 'a']; },
    (l) => { l.guided.chunks[0].meaning.answer = 'No option'; },
    (l) => { l.guided.chunks[0].say.line = 0; }, (l) => { l.guided.chunks[0].say.line = 3; },
    (l) => { delete l.guided.chunks[0].say.ownName; }, (l) => { l.guided.chunks[1].say.ownName = 'full'; },
    (l) => { l.guided.chunks[2].say.ownName = 'first'; },
  ];
  for (const mutate of mutations) {
    const l = structuredClone(lektion); mutate(l);
    assert.ok(guidedFindings({ lektionen: [l] }).length, String(mutate));
  }
  assert.match(read('scripts/validate-curriculum.mjs'), /guidedFindings\(c\).*RULE 32/);
});

function fakeClient(respond) {
  const calls = [];
  return { calls, from(table) {
    const call = { table, eq: [] }; calls.push(call);
    return { upsert(data, options) { call.data = data; call.options = options; return Promise.resolve({ error: null }); }, update(data) { call.data = data; return this; }, eq(...args) { call.eq.push(args); return this; }, or(filter) { call.filter = filter; return respond(call); } };
  } };
}

test('furthest-stage writes fail silently once per client when migration columns are absent', async () => {
  for (const error of [{ code: '42703', message: 'column furthest_stage does not exist' }, { code: 'PGRST204', message: "Could not find the 'furthest_at' column" }]) {
    const client = fakeClient(async () => ({ error }));
    const write = createStageReachWriter(client);
    const args = { level: 'A1.1', lektionId: lektion.id, step: 'scene:1:say', steps: stageSteps(build().stages) };
    assert.equal(await write(null, args), false); assert.equal(client.calls.length, 0);
    assert.deepEqual(await Promise.all([write('own-user', args), ...Array.from({ length: 10 }, () => write('own-user', { ...args, step: 'practice' }))]), Array(11).fill(false));
    assert.equal(client.calls.filter((c) => c.data.furthest_stage).length, 1, 'missing migration never causes a retry storm');
    assert.equal(client.calls.length, 2, 'one row ensure and one column probe');
  }
  const network = fakeClient(() => { throw new Error('offline'); });
  assert.equal(await createStageReachWriter(network)('user', { level: 'a1.1', lektionId: lektion.id, step: 'pretest', steps: ['pretest'] }), false);
});

test('furthest-stage UPDATE is own-row scoped and atomic against earlier steps only', async () => {
  const client = fakeClient(async () => ({ error: null }));
  const write = createStageReachWriter(client);
  const steps = stageSteps(build().stages);
  assert.equal(await write('user', { level: 'A1.1', lektionId: lektion.id, step: sceneStep(5), steps }), true);
  const ensure = client.calls[0];
  assert.equal(ensure.data.status, 'started');
  assert.equal(ensure.options.ignoreDuplicates, true, 'adopting guest work never replaces a completed/better account row');
  const call = client.calls[1];
  assert.deepEqual(call.eq, [['user_id', 'user'], ['level', 'a1.1'], ['lektion_id', lektion.id]]);
  assert.equal(call.data.furthest_stage, 'scene:2:say');
  assert.ok(Date.parse(call.data.furthest_at));
  assert.deepEqual(Object.keys(call.data).sort(), ['furthest_at', 'furthest_stage']);
  assert.ok(call.filter.startsWith('furthest_stage.is.null,furthest_stage.in.('));
  assert.ok(call.filter.includes('scene:2:meaning'));
  assert.ok(!call.filter.includes('scene:2:say') && !call.filter.includes('practice'), 'no equal/later step can be overwritten');
});

test('Start writes started; intro mount and resume do not; reach waits for start and actual visibility', () => {
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  const start = player.slice(player.indexOf('  const start = () => {'), player.indexOf('  if (!introDone) {'));
  assert.match(start, /if \(!ready \|\| started.current\) return/);
  assert.match(start, /if \(!preview && user\) startWrite.current = startLesson\(user.id, curriculum.level, lektion.id\)/);
  assert.equal(player.match(/startLesson\(user.id/g).length, 1, 'only the Start handler writes started');
  assert.match(player, /if \(preview \|\| pause \|\| !stage \|\| viewedStages.current.has\(reachStep\)\) return/);
  assert.match(player, /startWrite.then\(\(\) => recordStageReach/);
  assert.match(player, /sceneStep\(itemIndex\)/);
  assert.match(player, /lazy\(\(\) => import\('.*SceneStage.jsx'\)\)/);
  const sql = read('migrations/2026-11-12-lesson-furthest-stage.sql');
  assert.match(sql, /ADD COLUMN IF NOT EXISTS furthest_stage text/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS furthest_at timestamptz/);
  assert.doesNotMatch(sql.replace(/--[^\n]*/g, ''), /CREATE POLICY|GRANT|UPDATE|DELETE/);
});

// Exercise the real JSX callbacks as well as the pure engine; no copied submit logic.
function sceneHooks() {
  const slots = []; let cursor = 0;
  return {
    react: {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], (v) => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }]; },
      useMemo(fn) { return fn(); }, useEffect() {},
    },
    clear() { slots.length = 0; cursor = 0; },
    render(Component, props) { cursor = 0; return Component(props); },
  };
}
function sceneElements(tree, type) {
  if (Array.isArray(tree)) return tree.flatMap((v) => sceneElements(v, type));
  if (!tree || typeof tree !== 'object') return [];
  return [...((type === Function ? typeof tree.type === 'function' : tree.type === type) ? [tree] : []), ...sceneElements(tree.props?.children, type)];
}
async function sceneHarness() {
  const { loadJsxModule } = await import('./helpers/renderJsx.mjs');
  const hooks = sceneHooks();
  const { default: SceneStage } = await loadJsxModule('src/components/lesson/SceneStage.jsx', {
    react: hooks.react,
    '../ui/Button.jsx': { default: 'Button' }, '../ui/Card.jsx': { default: 'Card' },
    '../illustrations/SituationScene.jsx': { default: 'SituationScene' }, './DialogStage.jsx': { GlossLine: 'GlossLine' },
    './PlayButton.jsx': { default: 'PlayButton' }, './ReadAloudLine.jsx': { default: 'ReadAloudLine' }, './LangToggle.jsx': { default: 'LangToggle' },
    '../../lib/lesson/gloss.js': { parseLektionId: () => null },
    './CheckedChoice.jsx': { default: (await loadJsxModule('src/components/lesson/CheckedChoice.jsx', { react: hooks.react, '../ui/Button.jsx': { default: 'Button' }, '../../lib/lesson/check.js': { checkAnswer, checkOptionsFor, RESULT }, '../../lib/lesson/guidedFeedback.js': await import('../src/lib/lesson/guidedFeedback.js'), '../../lib/lesson/strings.js': { t: (key) => key } })).default },
    '../../lib/lesson/buildGuided.js': { SCENE_PHASES: ['hear', 'meaning', 'say'] },
    '../../lib/lesson/scene.js': { sayText }, '../../lib/lesson/strings.js': { useLessonLang: () => ['en'], t: (key) => key },
  });
  const stage = build().stages.find((s) => s.kind === 'scene');
  const outcomes = []; let finished = 0;
  const props = { names: {}, onNamesChange: (names) => { props.names = names; }, stage, lektionId: lektion.id, itemIndex: 0, results: {}, onItemChange: (i) => { props.itemIndex = i; }, onSayResult: (i, r) => { props.results = { ...props.results, [i]: r }; }, onResult: (...args) => outcomes.push(args), onDone: () => finished++ };
  return { hooks, props, outcomes, render: () => hooks.render(SceneStage, props), finished: () => finished };
}

test('scene hear → checked meaning → personalised, measured say → next chunk, with resumable confirmation', async () => {
  const h = await sceneHarness();
  let tree = h.render();
  assert.equal(sceneElements(tree, 'GlossLine').length, 2, 'only this chunk is shown');
  sceneElements(tree, 'Button')[0].props.onClick();
  assert.equal(h.props.itemIndex, 1);
  tree = h.render();
  const meaning = sceneElements(tree, Function)[0];
  assert.ok(meaning, 'the real MeaningCheck component is rendered');
  const state = h.hooks;
  state.clear();
  let meaningTree = state.render(meaning.type, meaning.props);
  assert.equal(sceneElements(meaningTree, 'Button')[0].props.disabled, true);
  const choices = sceneElements(meaningTree, 'input');
  choices.find((input) => input.props.value !== meaning.props.item.answer).props.onChange();
  meaningTree = state.render(meaning.type, meaning.props);
  sceneElements(meaningTree, 'Button')[0].props.onClick();
  assert.equal(h.outcomes[0][1].result, RESULT.WRONG, 'a selected distractor is wrong, never a typo');
  meaningTree = state.render(meaning.type, meaning.props);
  assert.ok(sceneElements(meaningTree, 'p').some((p) => p.props.role === 'status'));
  sceneElements(meaningTree, 'Button')[0].props.onClick();
  assert.equal(h.props.itemIndex, 1, 'first miss opens a hint retry');
  meaningTree = state.render(meaning.type, meaning.props);
  sceneElements(meaningTree, 'input').find((input) => input.props.value === meaning.props.item.answer).props.onChange();
  meaningTree = state.render(meaning.type, meaning.props);
  sceneElements(meaningTree, 'Button')[0].props.onClick();
  meaningTree = state.render(meaning.type, meaning.props);
  sceneElements(meaningTree, 'Button')[0].props.onClick();
  assert.equal(h.outcomes.length, 1, 'repair does not replace the first response');
  assert.equal(h.props.itemIndex, 2);
  state.clear();
  tree = h.render();
  assert.equal(sceneElements(tree, 'ReadAloudLine').length, 0, 'a name-bearing model waits for the learner name');
  sceneElements(tree, 'input')[0].props.onChange({ target: { value: 'Sam Noor' } });
  tree = h.render();
  const say = sceneElements(tree, 'ReadAloudLine')[0];
  assert.equal(say.props.text, 'Guten Tag. Ich heiße Sam Noor.');
  assert.equal(say.props.guided, true);
  assert.equal(sceneElements(tree, 'Button')[0].props.disabled, true);
  say.props.onResult({ pct: 0.8, attempts: 1, usedMic: true });
  tree = h.render();
  assert.equal(sceneElements(tree, 'Button')[0].props.disabled, false);
  sceneElements(tree, 'Button')[0].props.onClick();
  assert.equal(h.props.itemIndex, 3, 'hear of chunk 2 follows say of chunk 1');
  h.props.itemIndex = 5;
  tree = h.render();
  assert.equal(sceneElements(tree, 'GlossLine')[0].props.line, 'Buchstabieren Sie bitte Chakiri.', 'the cue precedes the chosen Ana line, even when the chunk ends in another staff question');
  h.props.itemIndex = 11;
  h.props.results[3] = { pct: null, attempts: 0, usedMic: false, selfConfirmed: true };
  tree = h.render();
  assert.equal(sceneElements(tree, 'Button')[0].props.disabled, false, 'a restored honest self-confirm costs no recording');
  sceneElements(tree, 'Button')[0].props.onClick();
  assert.equal(h.finished(), 1);
});
