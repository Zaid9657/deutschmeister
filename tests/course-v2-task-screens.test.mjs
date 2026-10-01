// Course v2 — the Aufgaben screens and the course's account prompt (A1.1 audit, fix round 2,
// 2026-09-30). Pins, as rules rather than as a list of ids:
//   - WT-03  the stuck-point repair (and the empty run) keep their one action in the bottom bar;
//   - WT-04  Sprechen and Schreiben are round-3 screens: every primary in the bottom bar (StepScreen /
//            StickyAction), the skips quiet, the course tokens only — no in-flow „Weiter" row, no
//            retired Card/Chip/graphite/rule look;
//   - WT-05  the read-aloud's two raw pills are ≥ 44 px touch targets (min-h-11), on v1 and v2;
//   - WT-06  a form Schreiben reports its fields' share to the celebration, and an unscored Aufgabe's
//            tile says „erledigt", never „Richtig";
//   - A11Y-04 the wrong sheet's English line is not faded below AA (no opacity on its text);
//   - ASSESS-03 / CT-03  wherever the AI refuses a signed-out learner, the screen carries the door
//            (/login with the way back to this step) and a way on without an assessment; the copy
//            promises only what is true, in both tables, the German in Sie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const V2 = 'src/components/course-v2';

const TASK_FILES = [`${V2}/SpeakingTaskView.jsx`, `${V2}/WritingTaskView.jsx`, `${V2}/SpeakingRun.jsx`, `${V2}/SignInPrompt.jsx`];

test('WT-03: the stuck-point repair and the empty run keep their one action in the bottom bar', () => {
  const run = read(`${V2}/ItemRun.jsx`);
  assert.match(run, /if \(repair\) \{[\s\S]{0,300}<StepScreen title=\{t\('rule\.repairLead'\)\} action=\{<GameButton onClick=\{closeRepair\}>/);
  assert.match(run, /if \(!entry\) \{[\s\S]{0,200}<StepScreen action=\{<GameButton onClick=\{finish\}>/);
  assert.doesNotMatch(run, /<div className="mt-8">\s*<GameButton/, 'no in-flow button under the rule card');
  assert.doesNotMatch(run, /return <GameButton /, 'no bare in-flow button');
});

test('WT-04: Sprechen and Schreiben put every primary in the bottom bar and use the course tokens', () => {
  for (const f of TASK_FILES) {
    const src = read(f);
    assert.doesNotMatch(src, /\btext-(?:ink|graphite)\b|\bborder-rule\b|\bbg-paper-sunk\b|\brounded-pill\b|\bfont-data\b/, `${f}: the retired look`);
    assert.doesNotMatch(src, /from '\.\.\/ui\/(?:Card|Chip)\.jsx'/, `${f}: ui/Card or ui/Chip inside the course chrome`);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${f}: a hex colour`);
    assert.doesNotMatch(src, /\b(?:bg|text|border)-(?:amber|rose|red|green|blue|gray|slate|emerald|orange)-\d/, `${f}: a raw palette class`);
    assert.doesNotMatch(src, /\b(?:bg|text|border)-kasus-/, `${f}: a kasus colour`);
    for (const m of src.matchAll(/\banimate-[a-z-]+/g)) {
      assert.equal(src.slice(m.index - 'motion-safe:'.length, m.index), 'motion-safe:', `${f}: an animation that ignores reduced motion`);
    }
    assert.doesNotMatch(src, /className="mt-(?:5|6) flex (?:flex-wrap items-center )?justify-end/, `${f}: an in-flow action row`);
  }
  const sp = read(`${V2}/SpeakingTaskView.jsx`);
  // every screen but the speaking one is a StepScreen with its action; the speaking one mounts ONE bar
  const screens = sp.split('<StepScreen').slice(1);
  assert.ok(screens.length >= 4, 'material, intro, prep, no-mic/self are StepScreens');
  for (const s of screens) assert.match(s.slice(0, 40), /^\s*action=\{/, `SpeakingTaskView: a screen without its bottom-bar action: ${s.slice(0, 60)}`);
  assert.match(sp, /renderAction=\{\(\{ primary, skip, retry, busy \}\) => \(\s*<StickyAction>/, 'the start goes to the bar');
  assert.equal((sp.match(/<StickyAction>/g) || []).length, 1, 'one bar of its own (the others come with StepScreen)');
  assert.match(sp, /if \(partIdx \+ 1 < parts\.length\) setPartIdx\(partIdx \+ 1\);/, 'one Teil per screen');
  const run = read(`${V2}/SpeakingRun.jsx`);
  assert.match(run, /if \(typeof renderAction === 'function'\) \{/);
  const w = read(`${V2}/WritingTaskView.jsx`);
  assert.match(w, /return <FormTask [^>]*header=\{<TaskHeader/, 'the form and its text on one screen');
  assert.match(w, /<StepScreen\s+action=\{!results\s*\? <GameButton onClick=\{check\} disabled=\{!allFilled\}>\{t\('w\.formCheck'\)\}<\/GameButton>\s*: <GameButton onClick=\{done\}>/);
  assert.match(w, /<StepScreen action=\{action\}>/, 'the free text: the phase’s primary in the bar');
  // completion and grading are untouched: the same onDone payloads, the same AI call
  assert.match(w, /onDone\(\{ bankKey: task\.bankKey, submitted: results\.length > 0, result: results\[results\.length - 1\] \|\| null \}\)/);
  assert.match(w, /const r = await evaluateWriting\(\{ bankKey: task\.bankKey, text \}\);/);
  assert.match(sp, /onDone\(\{ bankKey: task\.bankKey, submitted: !!result, result \}\)/);
});

test('WT-05: the read-aloud pills are 44 px touch targets wherever the line is used', () => {
  const src = read('src/components/lesson/ReadAloudLine.jsx');
  const raw = [...src.matchAll(/<button\s+type="button"[\s\S]*?className="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(raw.length, 2, '„Anhören" and „Ich habe es gesagt"');
  for (const c of raw) assert.match(c, /\bmin-h-11\b/, `a raw pill under 44 px: ${c}`);
});

test('WT-06: a form Schreiben reports its share; an unscored Aufgabe never reads „Richtig"', () => {
  const w = read(`${V2}/WritingTaskView.jsx`);
  assert.match(w, /const correct = Object\.values\(results \|\| \{\}\)\.filter\(\(r\) => r\.result !== RESULT\.WRONG\)\.length;\s*onDone\(\{ bankKey: task\.bankKey, submitted: true, result: null, correct, total: fields\.length \}\);/);
  const sv = read(`${V2}/StepView.jsx`);
  const schreiben = sv.slice(sv.indexOf("case 'schreiben':"), sv.indexOf("case 'ueberarbeiten':"));
  assert.match(schreiben, /finishStep\(\{ correct: Number\(r\?\.correct\) \|\| 0, total: Number\(r\?\.total\) \|\| 0, submitted: !!r\?\.submitted/);
  const cel = read(`${V2}/StepCelebration.jsx`);
  assert.match(cel, /label=\{pct != null \? t\('cel\.right'\) : t\('player\.doneMark'\)\}/);
  // XP stays the gamify rule: the player adds XP.step to the items' XP, never a share
  assert.match(read('src/pages/course-v2/UnitPlayerPage.jsx'), /const xp = itemXp \+ XP\.step;/);
});

test('A11Y-04: the feedback sheet never fades its text below AA', () => {
  const sheet = read(`${V2}/FeedbackSheetV2.jsx`);
  assert.doesNotMatch(sheet, /<p[^>]*\bopacity-\d/, 'a faded paragraph on the tinted sheet');
});

test('ASSESS-03 / CT-03: a signed-out learner on an AI task gets the door back to this step and a way on', () => {
  const prompt = read(`${V2}/SignInPrompt.jsx`);
  assert.match(prompt, /return \{ to: '\/login', state: \{ from: \{ pathname: `\$\{pathname\}\$\{search \|\| ''\}` \} \} \};/, 'the login returns to the step (LoginPage reads state.from.pathname)');
  assert.match(read('src/pages/LoginPage.jsx'), /location\.state\?\.from\?\.pathname/, 'the login page still honours the way back');
  assert.match(prompt, /<GameButton to=\{link\.to\} state=\{link\.state\}/);
  // every surface that can hear „ai.signIn" carries the prompt
  for (const f of [`${V2}/SpeakingRun.jsx`, `${V2}/WritingTaskView.jsx`, 'src/pages/course-v2/AssessmentPlayer.jsx']) {
    assert.match(read(f), /<SignInPrompt\b/, `${f}: the refusal without its door`);
  }
  assert.doesNotMatch(read(`${V2}/SpeakingRun.jsx`), /\{error && <p[^>]*>\{t\(error\)\}<\/p>\}/, 'no bare refusal line that could be ai.signIn');
  assert.doesNotMatch(read(`${V2}/WritingTaskView.jsx`), /\{error && <p[^>]*>\{t\(error\)\}<\/p>\}/, 'no bare refusal line that could be ai.signIn');
  // the way on without an account
  const w = read(`${V2}/WritingTaskView.jsx`);
  assert.match(w, /\} else if \(signedOut && attempts === 0\) \{\s*action = \(\s*<>\s*<SignInButton \/>[\s\S]{0,200}\{skip\}/, 'Schreiben: the door, then „Ohne Auswertung weiter"');
  const sp = read(`${V2}/SpeakingTaskView.jsx`);
  assert.match(sp, /onSkip=\{\(\) => setPhase\(user \? 'nomic' : 'self'\)\}\s*skipLabel=\{user \? null : t\('mo\.skip'\)\}/, 'Sprechen: „Ohne Auswertung weiter" to the model conversation');
  const ap = read('src/pages/course-v2/AssessmentPlayer.jsx');
  assert.match(ap, /const openNeedsAccount = !user && openList\.some\(\(\{ s \}\) => AI_KINDS\.includes\(s\.kind\)\);/, 'the results card no longer loops back without a door');
  // the copy: both tables, Sie, and no promise the product does not keep (local progress is not merged)
  const strings = read(`${V2}/strings.js`);
  const en = strings.slice(strings.indexOf('const EN = {'), strings.indexOf('const DE = {'));
  const de = strings.slice(strings.indexOf('const DE = {'), strings.indexOf('export const V2_STRINGS'));
  const keys = new Set();
  for (const f of [...TASK_FILES, 'src/pages/course-v2/AssessmentPlayer.jsx']) for (const m of read(f).matchAll(/\bt\('([a-z]+\.[A-Za-z0-9]+)'/g)) keys.add(m[1]);
  for (const k of keys) {
    assert.ok(en.includes(`'${k}':`), `EN lacks ${k}`);
    assert.ok(de.includes(`'${k}':`), `DE lacks ${k}`);
  }
  for (const k of ['ai.signInTitle', 'ai.signInLead', 'ai.signInBack', 'ai.signInCta', 'sp.selfLead', 'sp.taskAgain']) {
    const line = de.split('\n').find((l) => l.includes(`'${k}':`)) || '';
    assert.ok(line, `DE lacks ${k}`);
    assert.doesNotMatch(line, /\b(?:du|dich|dir|dein\w*)\b/i, `${k}: the course speaks Sie`);
  }
  const lead = de.split('\n').find((l) => l.includes("'ai.signInLead':"));
  assert.match(lead, /ab dann/, 'progress is kept from the sign-in on — never „Ihr bisheriger Fortschritt"');
  assert.doesNotMatch(lead, /bisher|Serie|XP/, 'no promise about progress, streak or XP made before the account');
});
