// Course v2 — the Duolingo-style lesson player (owner feedback 2026-09-29: "the design is boring,
// gamify it … Unit 1 opens with a speaking test before anything is taught … I don't like the
// colours"). Pins what the redesign promised, where a regression would be silent:
//   - the soft start: the unit opens on the story screen (round 3: ONE bubble, ONE button — the
//     screens themselves are pinned in tests/course-v2-flow.test.mjs), the Folge is the first
//     interaction, and the Auftakt micro-output is an optional bonus AFTER the Folge — never the
//     opening, never a gate;
//   - the game ledger: one recordGame per finished Lernschritt, none for a skipped Aufgabe, the
//     Check goes to the recap (no step celebration), XP.unit once per newly completed unit;
//   - the ?s=<n> deep link of the course home, with ?s=1 on an unstarted unit showing the Start;
//   - every chrome string the new screens use exists in both tables; the colours are tokens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { narratorOf, introBubble } from '../src/components/course-v2/story.js';
import { XP } from '../src/lib/course-v2/gamify.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const V2 = 'src/components/course-v2';
const NEW_CHROME = [
  `${V2}/GameButton.jsx`, `${V2}/GameParts.jsx`, `${V2}/GameTopBar.jsx`, `${V2}/FeedbackSheetV2.jsx`,
  `${V2}/StepCelebration.jsx`, `${V2}/UnitIntro.jsx`, `${V2}/ItemInputs.jsx`, `${V2}/ItemView.jsx`,
  `${V2}/ItemRun.jsx`, `${V2}/StartView.jsx`, `${V2}/StepView.jsx`, `${V2}/CheckView.jsx`, `${V2}/InlineFeedback.jsx`,
  'src/pages/course-v2/UnitPlayerPage.jsx', 'src/pages/course-v2/AssessmentPlayer.jsx',
];

test('the intro is built from the unit: the narrator, and a bubble that does not tell the Folge', () => {
  const u01 = json('src/data/course-v2/a1.1/units/u01.json');
  const u02 = json('src/data/course-v2/a1.1/units/u02.json');
  assert.equal(narratorOf(u01), 'Priya', 'A1 is told by Priya');
  assert.equal(narratorOf({ level: 'b1.1', story: { castIn: ['cast.frau-otto'] } }), 'Frau Otto', 'other levels: the first of the cast');
  assert.equal(introBubble(u01), u01.start.recapDe, 'U01: „Was bisher geschah"');
  const bubble = introBubble(u02);
  assert.ok(u02.story.beat.startsWith(bubble) && bubble.length < u02.story.beat.length, 'later units: the first sentence of the beat only');
  assert.match(bubble, /[.!?]$/);
  assert.equal(introBubble({ title: { canDo: 'Sie können x.' } }), 'Sie können x.');
});

test('the Start is soft: story → Folge → gist → an optional bonus; the Auftakt never opens or gates the unit', () => {
  const sv = read(`${V2}/StartView.jsx`);
  assert.match(sv, /useState\(\(\) => \(entry === 'folge' && start\.folge \? 'folge' : 'intro'\)\); \/\/ intro \| folge \| gist \| bonus/, 'the Start opens on the story screen (the guide may open it on the Folge)');
  const intro = sv.slice(sv.indexOf("if (stage === 'intro')"), sv.indexOf("if (stage === 'bonus'"));
  assert.ok(intro.includes('<StoryScreen'), 'the first screen is the story screen');
  assert.ok(!intro.includes('MicroOutputView'), 'no speaking task on the first screen');
  const bonus = sv.slice(sv.indexOf("if (stage === 'bonus'"), sv.indexOf('// the episode:'));
  assert.ok(bonus.includes('<MicroOutputView'), 'the Auftakt lives in the bonus card');
  assert.match(bonus, /aria-expanded=\{bonusOpen\}/, 'folded until the learner opens it');
  assert.match(bonus, /\{!bonusOpen && \([\s\S]{0,200}onClick=\{\(\) => finish\(false\)\}/, 'and skippable with one tap');
  assert.doesNotMatch(sv, /auftaktDone/, 'the old gate on „Los geht\'s" is gone');
  assert.match(sv, /onHeard=\{\(\) => setHeard\(true\)\}/, 'the gist question follows the listen');
  const ui = read(`${V2}/UnitIntro.jsx`);
  assert.match(ui, /<details[\s\S]{0,400}t\('start\.examFocus'\)/, 'the Prüfungsfokus is a folded line (in the guide)');
  assert.match(ui, /\{onQuiet && quietLabel && <QuietButton onClick=\{onQuiet\}>\{quietLabel\}<\/QuietButton>\}/, 'the story screen’s test-out is a quiet text button');
  assert.match(ui, /\{onTestOut && <QuietButton onClick=\{onTestOut\}>\{t\('flow\.testOut'\)\}<\/QuietButton>\}/, '…and the guide’s');
});

test('the game ledger: one entry per finished step, the Check to the recap, the unit bonus once', () => {
  const page = read('src/pages/course-v2/UnitPlayerPage.jsx');
  const at = page.indexOf('const onDone = useCallback(');
  const body = page.slice(at, page.indexOf('}, [', at));
  assert.equal((body.match(/recordGame\(/g) || []).length, 1, 'one ledger write per finished step');
  assert.match(body, /recordGame\(\{ xp, minutes, steps: 1 \}\)/);
  assert.ok(body.indexOf('result.submitted === false') < body.indexOf('recordGame('), 'an Aufgabe moved on from writes nothing');
  const check = body.indexOf("if (step.kind === 'check') { nextAfter(stepIndex, done); return; }");
  assert.ok(check > body.indexOf('recordGame(') && check < body.indexOf("setPhase('celebrate')"), 'the Check counts, but its moment is the recap');
  assert.match(page, /const xp = itemXp \+ XP\.step;/, 'the step bonus is XP.step');
  assert.match(page, /unitXpAwarded\.current = true;\s*recordGame\(\{ xp: unitBonus \}\);/, 'XP.unit is written once per visit');
  assert.match(page, /storedStatus !== 'complete' && storedStatus !== 'gold' \? XP\.unit : 0/, 'and only for a unit not complete before');
  assert.match(page, /xpForItem\(\{ correct: !!payload\.correct, firstTry: !payload\.typo \}\)/, 'item XP by the gamify rule');
  assert.match(page, /setCombo\(\(c\) => nextCombo\(c, !!payload\.correct\)\)/, 'the combo by the ComboChip rule');
  assert.ok(XP.step > 0 && XP.unit > XP.step);
  // the sheet shows the same number the player adds up
  assert.match(read(`${V2}/ItemView.jsx`), /xpForItem\(\{ correct: outcome\.result !== RESULT\.WRONG, firstTry: outcome\.result === RESULT\.CORRECT \}\)/);
});

test('the celebration: star burst, one headline, three tiles, the streak in one line, one button; motion only when allowed', () => {
  const cel = read(`${V2}/StepCelebration.jsx`);
  for (const k of ['cel.title', 'cel.xp', 'cel.right', 'cel.time', 'game.streak', 'game.streakOne', 'game.streakNone']) assert.ok(cel.includes(`t('${k}'`), k);
  assert.ok(cel.includes('<StarBurst'));
  assert.ok(!cel.includes('<StreakCard'), 'round 3: the week grid lives on the home; here the streak is one line');
  assert.match(cel, /<FlameIcon size=\{26\} lit=\{streak > 0\} \/>/);
  assert.equal((cel.match(/<h1/g) || []).length, 1, 'one headline');
  assert.equal((cel.match(/<StatTile\s/g) || []).length, 3, 'three tiles');
  assert.equal((cel.match(/<GameButton/g) || []).length, 1, 'one action');
  const parts = read(`${V2}/GameParts.jsx`);
  assert.ok(!/\banimate-(?!pop-in)/.test(parts.replace(/motion-safe:animate-pop-in/g, '')), 'every animation is motion-safe');
  assert.match(parts, /week\.map\(\(d, i\)/, 'the Mo–So row');
});

test('?s=<n> opens a step; ?s=1 on a unit without progress still shows the Start', () => {
  const page = read('src/pages/course-v2/UnitPlayerPage.jsx');
  assert.match(page, /const \[params, setParams\] = useSearchParams\(\);/);
  assert.match(page, /const fresh = state\.finishedSteps\.size === 0 && !\(state\.row && state\.row\.status && state\.row\.status !== 'started'\);/);
  assert.match(page, /asked <= \(unit\.steps \|\| \[\]\)\.length && !\(asked === 1 && fresh\)\) \{\s*setStepIndex\(asked - 1\);\s*setPhase\('step'\);/);
});

test('the feedback sheet: a live region, green right, crimson wrong, one action, the requeue said out loud', () => {
  const sheet = read(`${V2}/FeedbackSheetV2.jsx`);
  assert.match(sheet, /role="status"\s+aria-live="polite"/);
  assert.ok(sheet.includes('border-game-right bg-game-right-wash text-game-right-ink'));
  assert.ok(sheet.includes('border-game-wrong bg-game-wrong-wash text-game-wrong-ink'));
  assert.ok(sheet.includes('animate-feedback-sheet motion-reduce:animate-none'));
  assert.ok(!/aria-label=["'][^"']*(close|schließen)/i.test(sheet), 'nothing to dismiss');
  assert.match(sheet, /t\(repeat === 'similar' \? 'fb\.repeatSimilar' : 'fb\.repeatSame'\)/);
  assert.match(read(`${V2}/ItemRun.jsx`), /setRepeatOf\(\{ pos, kind: alt \? 'similar' : 'same' \}\)/, 'the run tells the sheet it requeued');
});

test('every chrome key the new screens use exists in both tables; the colours are tokens, never a kasus hue', () => {
  const strings = read(`${V2}/strings.js`);
  const en = strings.slice(strings.indexOf('const EN = {'), strings.indexOf('const DE = {'));
  const de = strings.slice(strings.indexOf('const DE = {'), strings.indexOf('export const V2_STRINGS'));
  const used = new Set(['fb.praise1', 'fb.praise2', 'fb.praise3', 'fb.praise4', 'ask.choose', 'ask.fill', 'ask.tf',
    'item.srRight', 'item.srWrong', 'item.srSolution', 'item.srSelected', ...[0, 1, 2, 3, 4, 5, 6].map((i) => `game.wd${i}`)]);
  for (const f of [...NEW_CHROME, `${V2}/UnitIntro.jsx`]) {
    for (const m of read(f).matchAll(/\bt\('([a-z]+\.[A-Za-z0-9]+)'/g)) used.add(m[1]);
  }
  for (const k of used) {
    assert.ok(en.includes(`'${k}':`), `EN lacks ${k}`);
    assert.ok(de.includes(`'${k}':`), `DE lacks ${k}`);
  }
  for (const f of NEW_CHROME) {
    const src = read(f);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${f}: a hex colour outside design-tokens.js`);
    assert.doesNotMatch(src, /\b(?:bg|text|border|fill|stroke)-(?:amber|rose|red|green|blue|gray|slate|emerald|orange)-\d/, `${f}: a raw Tailwind palette class`);
    assert.doesNotMatch(src, /\b(?:bg|text|border|fill|stroke)-kasus-/, `${f}: a kasus colour on the chrome`);
  }
});
