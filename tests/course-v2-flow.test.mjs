// Course v2 — opening a Kapitel, Duolingo-simple (round 3, owner 2026-09-30: "i would say it looks
// intimidating and too much, can we change the view to make it in duolingo style and for everything to
// be step for step"). Duolingo on the surface, the textbook one tap deep. Pins:
//   - the pure flow logic (story.js): which screen a phase shows, the guide winning over it, the
//     welcome-back's line, where the guide's X goes;
//   - ONE thing per screen: the story screen (fresh), the welcome-back (resume), the Folge and its gist
//     question on two screens, the recap — each with ONE primary button and at most one quiet one;
//   - the lesson bar: X, the thick progress bar, the flame only from a combo of three.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { screenOf, welcomeLine, guideCloseTarget, introBubble } from '../src/components/course-v2/story.js';
import { tocRows } from '../src/components/course-v2/kapitel.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const V2 = 'src/components/course-v2';
const PAGE = 'src/pages/course-v2/UnitPlayerPage.jsx';
const between = (src, from, to) => {
  const a = src.indexOf(from);
  assert.ok(a >= 0, `missing: ${from}`);
  const b = src.indexOf(to, a + from.length);
  assert.ok(b > a, `missing after ${from}: ${to}`);
  return src.slice(a, b);
};

// ---------------------------------------------------------------------------
// The pure flow logic
// ---------------------------------------------------------------------------

test('screenOf: a fresh unit is the story, a resumed one the welcome-back, the guide wins over every phase but loading', () => {
  assert.equal(screenOf('start'), 'story');
  assert.equal(screenOf('resume'), 'welcome');
  for (const phase of ['step', 'celebrate', 'recap']) assert.equal(screenOf(phase), phase);
  for (const phase of ['start', 'resume', 'step', 'celebrate', 'recap']) assert.equal(screenOf(phase, 'guide'), 'guide', phase);
  assert.equal(screenOf('loading', 'guide'), 'loading', 'nothing to show before the learner state is in');
  assert.equal(screenOf(null), 'loading');
  assert.equal(screenOf('start', 'somethingelse'), 'story', 'only ?view=guide opens the guide');
});

test('welcomeLine names the part „Weiter" opens: a section by letter and title, any other part by its name', () => {
  const manifest = json('src/data/course-v2/a1.1/manifest.json');
  const u01 = json('src/data/course-v2/a1.1/units/u01.json');
  const rows = tocRows({ unit: u01, course: manifest, finished: new Set(['a1.1-u01-ls1']), currentIndex: 1 });
  assert.deepEqual(welcomeLine(rows[1]), { key: 'flow.nextPart', vars: { l: 'B', title: 'Woher kommst du?' } });
  const named = (r) => `name:${r.kind}`;
  assert.deepEqual(welcomeLine(rows[4], named), { key: 'flow.nextName', vars: { name: 'name:sprechen' } });
  assert.deepEqual(welcomeLine(rows[6], named), { key: 'flow.nextName', vars: { name: 'name:check' } });
  assert.deepEqual(welcomeLine({ letter: 'C', title: null }, () => 'Teil C'), { key: 'flow.nextName', vars: { name: 'Teil C' } }, 'a section without a title by its letter');
  assert.deepEqual(welcomeLine(null), { key: 'flow.nextSummary', vars: {} });
  const strings = read(`${V2}/strings.js`);
  for (const k of ['flow.nextPart', 'flow.nextName', 'flow.nextSummary']) assert.equal(strings.split(`'${k}':`).length - 1, 2, `${k} in both tables`);
});

test('guideCloseTarget: back where the learner came from, else the course home', () => {
  assert.equal(guideCloseTarget('abc123', '/course/a1.1/v2'), -1, 'opened from the home, the welcome-back or the recap: history back');
  assert.equal(guideCloseTarget('default', '/course/a1.1/v2'), '/course/a1.1/v2', 'opened cold (the first page of the visit): the course home');
  assert.equal(guideCloseTarget(undefined, '/course/a1.1/v2'), '/course/a1.1/v2');
});

test('the story bubble stays short: one to three sentences for every compiled unit', () => {
  const manifest = json('src/data/course-v2/a1.1/manifest.json');
  for (const row of manifest.units) {
    const unit = json(`src/data/course-v2/a1.1/${row.chunk}`);
    const bubble = introBubble(unit);
    const ends = (bubble.match(/[.!?](?=\s|$)/g) || []).length;
    assert.ok(bubble.length > 0 && ends >= 1 && ends <= 3, `${unit.id}: ${ends} sentences — „${bubble}"`);
  }
});

// ---------------------------------------------------------------------------
// One thing per screen
// ---------------------------------------------------------------------------

test('the story screen: the narrator big, one bubble, one small line naming the Kapitel, ONE button, the test-out quiet', () => {
  const ui = read(`${V2}/UnitIntro.jsx`);
  const story = between(ui, 'export function StoryScreen(', 'export default function UnitIntro(');
  assert.match(story, /<CastAvatar name=\{narrator\} size=\{140\} className="[^"]*motion-safe:animate-pop-in/, 'a big narrator, popping in only when motion is allowed');
  assert.match(story, /<SpeechBubble tail="down"/);
  assert.match(story, /<h1 id=\{headingId\}/, 'the Kapitel line is the screen’s heading');
  assert.equal((story.match(/<GameButton/g) || []).length, 1, 'one big button');
  assert.ok((story.match(/<QuietButton/g) || []).length <= 1, 'at most one quiet text button');
  assert.match(story, /<StickyAction>/, 'the button in the thumb zone');
  assert.doesNotMatch(story, /<ul|<ol|<details|ReferenceShelf|TocRow|XpIcon|kap\.minutes|kap\.parts/, 'no list, no contents, no back matter, no meta row');
  const sv = read(`${V2}/StartView.jsx`);
  const intro = between(sv, "if (stage === 'intro') {", "if (stage === 'bonus'");
  assert.match(intro, /<StoryScreen/);
  assert.match(intro, /bubble=\{introBubble\(unit\)\}/);
  assert.match(intro, /primaryLabel=\{t\('flow\.go'\)\}\s*onPrimary=\{begin\}/, '„Los geht’s" opens the Folge');
  assert.match(intro, /quietLabel=\{t\('flow\.testOut'\)\}\s*onQuiet=\{testOut\}/, 'the test-out as the quiet button');
  assert.match(intro, /start\.testOut\?\.offered \?/, '…only where the unit offers it');
  for (const gone of ['UnitIntro', 'tocRows', 'goals', 'examFocus', 'cards', 'wordGroups', 'redemittel', 'XP.']) {
    assert.ok(!intro.includes(gone), `the story screen shows no ${gone}`);
  }
});

test('the Folge and its gist question are two screens; the Start can open on either from the guide', () => {
  const sv = read(`${V2}/StartView.jsx`);
  assert.match(sv, /useState\(\(\) => \(entry === 'folge' && start\.folge \? 'folge' : 'intro'\)\); \/\/ intro \| folge \| gist \| bonus/);
  assert.match(sv, /const \[testing, setTesting\] = useState\(\(\) => entry === 'testout'\);/, 'the guide’s test-out opens the test');
  const gist = between(sv, "if (stage === 'gist' && gistItem) {", '// the episode: listen first');
  assert.match(gist, /<ItemView/);
  assert.doesNotMatch(gist, /<InputView/, 'the question alone on its screen');
  const folge = sv.slice(sv.indexOf('// the episode: listen first'));
  assert.match(folge, /<InputView/);
  assert.doesNotMatch(folge, /<ItemView/, 'the transcript alone on its screen');
  assert.match(folge, /\{showNext && \(\s*<StickyAction>\s*<GameButton onClick=\{gistItem \? toGist : toBonusOrSteps\}>/, 'one „Weiter" once the episode is heard');
  const page = read(PAGE);
  assert.match(page, /<StartViewSlot key=\{`start-\$\{entry \|\| 'story'\}`\}/, 'a new entry mounts a fresh Start');
});

test('the welcome-back: one bubble naming the next part, „Weiter" into it, the guide one quiet tap away', () => {
  const page = read(PAGE);
  const welcome = between(page, "if (screen === 'welcome') {", "if (phase === 'celebrate' && celebration) {");
  assert.match(welcome, /<StoryScreen/);
  assert.match(welcome, /bubble=\{t\('flow\.welcome'\)\}/);
  assert.match(welcome, /const line = welcomeLine\(rows\[stepIndex\] \|\| null, partName\);/);
  assert.match(welcome, /primaryLabel=\{t\('item\.next'\)\}\s*onPrimary=\{\(\) => goTo\(stepIndex\)\}/, '„Weiter" opens the first open step');
  assert.match(welcome, /quietLabel=\{t\('flow\.overview'\)\}\s*onQuiet=\{onGuide\}/);
  assert.doesNotMatch(welcome, /<UnitIntro|<StepList|footer=/, 'nothing else');
  // the deep link still goes straight into step n (course-v2-player-game.test.mjs pins the rule)
  assert.match(page, /setStepIndex\(asked - 1\);\s*setPhase\('step'\);/);
});

test('the recap: trophy or narrator, one headline, three tiles, ONE button to the next thing, the guide as a quiet link', () => {
  const page = read(PAGE);
  const recap = between(page, '// Recap (S6', "/** The recap's one fold");
  assert.match(recap, /\{complete \? <Trophy \/> : <CastAvatar name=\{narrator\} size=\{140\}/);
  assert.equal((recap.match(/<h1 /g) || []).length, 1, 'one headline');
  assert.equal((recap.match(/<StatTile\s/g) || []).length, 3, 'XP · Richtig · Zeit');
  assert.match(recap, /\{pct !== null && <StatTile tone="course" label=\{t\('cel\.right'\)\} value=\{`\$\{pct\} %`\} \/>\}/, 'the share right only when the Check ran now — no empty tile');
  assert.match(recap, /<StatTile tone="xp" label=\{t\('cel\.xp'\)\} value=\{`\+\$\{sessionXp \+ unitBonus\}`\} \/>/, 'the chapter bonus is in the XP tile');
  assert.equal((recap.match(/<GameButton/g) || []).length, 1, 'one big button');
  assert.match(recap, /<GameButton to=\{nextTarget\.to\}>\{nextTarget\.label\}<\/GameButton>/);
  assert.match(recap, /<QuietButton onClick=\{onGuide\}>\{t\('flow\.overview'\)\}<\/QuietButton>/, 'the guide, one quiet tap away');
  for (const gone of ['<StreakCard', 'StoryCliffhanger', "t('player.words'", "t('player.nextUp'", "t('player.open')", 'player.unitBonus']) {
    assert.ok(!recap.includes(gone), `the recap no longer shows ${gone}`);
  }
  // a weak Check still offers the repeat, folded (aria-expanded) and never a gate
  assert.match(recap, /accuracy !== null && accuracy < 0\.6 && \([\s\S]{0,300}<RepeatFold[\s\S]{0,200}<StepList /);
  assert.match(page, /function RepeatFold\([\s\S]{0,400}aria-expanded=\{open\}/);
});

test('the lesson bar: X, the thick progress bar, the flame only from three in a row — nothing else', () => {
  const bar = read(`${V2}/GameTopBar.jsx`);
  const lesson = between(bar, 'export default function GameTopBar(', 'export function GuideTopBar(');
  assert.match(lesson, /<Link to=\{homeTo\} aria-label=\{homeLabel\}/, 'the X back to the course home');
  assert.match(lesson, /role="progressbar"/);
  assert.match(lesson, /className="h-\[1\.125rem\] flex-1 overflow-hidden rounded-full/, 'a thick, rounded bar');
  assert.match(lesson, /\{combo >= 3 && \(/, 'the combo flame from three right answers in a row');
  assert.doesNotMatch(lesson, /XpIcon|sessionXp/, 'no XP counter in the bar');
  const guideBar = bar.slice(bar.indexOf('export function GuideTopBar('));
  assert.match(guideBar, /<button type="button" onClick=\{onClose\} aria-label=\{closeLabel\}/, 'the guide’s X is a button with a name');
  assert.doesNotMatch(guideBar, /progressbar/, 'the guide is a page, not a lesson');
  // the player puts nothing of its own around a step: no heading, no strip
  const page = read(PAGE);
  const step = between(page, "if (phase === 'step' || phase === 'celebrate') {", '// Recap (S6');
  assert.doesNotMatch(step, /<h1|<h2|EYEBROW/, 'the step’s own heading is the renderer’s');
});
