// Accessibility pins for the City Conversation Map — plan Task 4
// (speaking-guided-city-map). Keyboard, screen-reader, reduced-motion and
// narrow-phone use are RELEASE requirements, not polish; these source pins
// keep the load-bearing pieces from being refactored away silently.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const hub = read('src/features/speaking/SpeakingHub.jsx');
const map = read('src/features/speaking/CityRouteMap.jsx');
const prep = read('src/features/speaking/MissionPrep.jsx');
const mission = read('src/features/speaking/GuidedMission.jsx');
const ticket = read('src/features/speaking/MissionTicket.jsx');
const lab = read('src/features/speaking/PronunciationLab.jsx');
const css = read('src/index.css');

test('the hub carries a skip link to the current mission', () => {
  assert.match(hub, /href="#city-current"/);
  assert.match(hub, /Skip to your current mission/);
  assert.match(hub, /id="city-current"/, 'the skip target must exist');
  assert.match(hub, /sr-only focus:not-sr-only/, 'visible on focus, out of the way otherwise');
});

test('headings are semantic: one h1 on the hub, labelled sections below it', () => {
  assert.match(hub, /<h1[^>]*>/);
  assert.match(hub, /aria-labelledby="current-station-heading"/);
  assert.match(ticket, /aria-labelledby=\{labelId\}/);
  assert.match(prep, /aria-labelledby="prep-situation"/);
});

test('station state is text + icon, never colour alone', () => {
  // Every state has a spelled-out label…
  assert.match(map, /complete: 'Complete — replay anytime'/);
  assert.match(map, /current: 'Current station'/);
  assert.match(map, /locked: 'Locked — finish the station before it'/);
  assert.match(map, /'course-locked': 'Unlock with the A1\.1 course'/);
  assert.match(map, /placeholder: 'In preparation — coming soon'/);
  // …and an icon; both render in the station row and its accessible name.
  assert.match(map, /STATE_ICONS/);
  assert.match(map, /aria-label=\{`Station \$\{station\.order\}: \$\{station\.title_en \|\| station\.title_de\} — \$\{STATE_LABELS\[state\]\}`\}/);
});

test('locked and placeholder stations are not interactive; openable ones are real buttons', () => {
  assert.match(map, /<button\s+type="button"\s+onClick=\{\(\) => onOpen\(station\)\}/);
  assert.match(map, /<span className=\{rowBase\}>\{inner\}<\/span>/, 'a locked station renders as plain text, not a dead button');
});

test('every mic control has a visible text label AND an aria-label', () => {
  assert.match(mission, /aria-label=\{phase === 'recording' \? 'Stop recording' : 'Start recording'\}/);
  assert.match(mission, /aria-pressed=\{phase === 'recording'\}/);
  assert.match(mission, /Stop recording<\/>/);
  assert.match(mission, /Start recording<\/>/);
  assert.match(lab, /aria-label="Start recording your attempt"/);
  assert.match(lab, /aria-label="Stop recording and check"/);
  assert.match(mission, /aria-label="Replay the coach's audio"/);
  assert.match(mission, /aria-label="Play back your recording"/);
});

test('the space bar is a keyboard alternative that never hijacks form controls', () => {
  assert.match(mission, /e\.code !== 'Space'/);
  assert.match(mission, /tag === 'BUTTON' \|\| tag === 'INPUT' \|\| tag === 'TEXTAREA' \|\| tag === 'SELECT'/);
  assert.match(mission, /press the space bar/i, 'the alternative must be announced on screen');
  assert.match(mission, /removeEventListener\('keydown'/, 'the listener must be cleaned up');
});

test('coach replies are always captioned — text first, audio as an addition', () => {
  assert.match(mission, /aria-live="polite"/);
  assert.match(mission, /\{coachText\}/, 'the caption renders unconditionally');
  assert.match(mission, /Replay audio/, 'a replay control exists');
  assert.match(mission, /the caption is on screen|the text is always shown/i);
});

test('the reduced-motion branch covers the whole speaking-city scope', () => {
  const block = css.slice(css.indexOf('.speaking-city {'));
  assert.match(block, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(block, /\.speaking-city \*, \.speaking-city \*::before, \.speaking-city \*::after/);
  assert.match(block, /animation-duration: 0\.01ms !important;/);
  assert.match(block, /transition-duration: 0\.01ms !important;/);
  assert.match(block, /scroll-behavior: auto !important;/);
});

test('no horizontal scroll at 320px: fluid widths, no sideways scrollers, 16px gutters', () => {
  for (const [name, src] of [['SpeakingHub', hub], ['CityRouteMap', map], ['GuidedMission', mission], ['MissionTicket', ticket], ['MissionPrep', prep], ['PronunciationLab', lab]]) {
    assert.doesNotMatch(src, /overflow-x-auto|whitespace-nowrap/, `${name} scrolls sideways`);
    assert.doesNotMatch(src, /\bw-\[\d{3,}px\]|min-w-\[\d{3,}px\]/, `${name} forces a fixed width`);
  }
  assert.match(hub, /px-4/, 'the hub keeps the 16px side gutter');
  assert.match(map, /min-w-0/, 'station rows must be allowed to shrink');
});

test('the microphone check never traps: denial explains, offers recovery, and the way back stays open', () => {
  assert.match(prep, /Microphone access was denied/);
  assert.match(prep, /site\s+settings/, 'the recovery hint names where to fix it');
  assert.match(prep, /Check again/);
  assert.match(prep, /Back to the map/, 'the exit is always present');
  assert.match(prep, /getTracks\(\)\.forEach\(\(t\) => t\.stop\(\)\)/, 'the probe releases the microphone');
});

test('the coach never interrupts — recording is learner-initiated only', () => {
  assert.match(mission, /never interrupts/i);
  assert.doesNotMatch(mission, /setTimeout\([^)]*stopRecording/, 'no timer may stop a recording for the learner');
});
