// Balance-display contract for the speaking setup screen — plan Task 3.
//
// Balances are shown as human-readable minutes with the two sources labeled
// separately when both exist (monthly expires, permanent does not — one
// aggregated number would mislead), and the page keeps seconds internally.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/SpeakingPage.jsx', import.meta.url), 'utf8');

test('the page reads the seconds balance from the server read-model', () => {
  assert.match(page, /monthlySeconds/);
  assert.match(page, /permanentSeconds/);
  assert.match(page, /totalSeconds/);
  assert.match(page, /check-speaking-usage/);
});

test('both balances render with their own labels when both exist', () => {
  assert.match(page, /Monthly allowance/);
  assert.match(page, /Permanent minutes/);
});

test('minutes are displayed, seconds are kept', () => {
  assert.match(page, /function fmtMinutes\(seconds\)/);
  assert.match(page, /fmtMinutes\(balance\.totalSeconds\)/);
});

test('a start the balance cannot cover is disabled with an honest notice', () => {
  assert.match(page, /balance\.totalSeconds >= GUIDED_SECONDS/);
  assert.match(page, /Not enough speaking time left/);
});

test('an included course attempt is visible and overrides the balance gate', () => {
  assert.match(page, /includedAttemptForSelection/);
  assert.match(page, /first attempt is included/);
});

// ---------------------------------------------------------------------------
// The City Conversation Map — plan Task 4 (speaking-guided-city-map)
// ---------------------------------------------------------------------------

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
// Comments may explain a banned pattern; only rendered code counts (the same
// convention tests/brand.test.mjs and tests/speaking-cost.test.mjs follow).
const rendered = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').filter((line) => !/^\s*\/\//.test(line)).join('\n');
const hub = read('src/features/speaking/SpeakingHub.jsx');
const map = read('src/features/speaking/CityRouteMap.jsx');
const prep = read('src/features/speaking/MissionPrep.jsx');
const mission = read('src/features/speaking/GuidedMission.jsx');
const ticket = read('src/features/speaking/MissionTicket.jsx');
const balanceCmp = read('src/features/speaking/SpeakingBalance.jsx');
const api = read('src/features/speaking/speakingApi.js');
const css = read('src/index.css');

test('A1.1 signed-in visits route to the SpeakingHub; the legacy setup screen stays for everything else', () => {
  assert.match(page, /import SpeakingHub from '\.\.\/features\/speaking\/SpeakingHub\.jsx'/);
  assert.match(page, /surface === 'hub'/);
  assert.match(page, /lvl === 'A1\.1' && !courseHandoff \? 'hub' : 'legacy'/);
  // The legacy free-conversation flow survives (it serves A1.2+ and course tasks).
  assert.match(page, /Free Conversation/);
  assert.match(page, /onExitToLegacy/);
});

test('query entry from course lessons is preserved (?level&mission&return)', () => {
  assert.match(page, /searchParams\.get\('level'\)/);
  assert.match(page, /searchParams\.get\('mission'\)/);
  assert.match(page, /searchParams\.get\('return'\)/);
  assert.match(page, /initialMissionOrder=\{wantedMission\}/);
  assert.match(page, /returnTo=\{wantedReturn\}/);
  // Deep links go through the same gate as the map buttons.
  assert.match(hub, /canOpenStation\(\{ missions, attempts, order: initialMissionOrder, access \}\)/);
});

test('the map always renders the twelve-station route, padded while fewer missions are published', () => {
  assert.match(map, /export const STATION_COUNT = 12/);
  assert.match(map, /export function padStationsToTwelve/);
  assert.match(map, /Array\.from\(\{ length: STATION_COUNT \}/);
  // Twelve named fallbacks, one per station of the plan's table.
  const titles = map.match(/STATION_FALLBACK_TITLES = \[([\s\S]*?)\]/)[1]
    .split('\n').filter((l) => l.includes("'"));
  assert.equal(titles.length, 12, 'exactly twelve fallback station names');
  assert.match(map, /padStationsToTwelve\(stations\)/, 'the component renders the padded route');
});

test("'Start mission' is the single primary action — desktop card and mobile sticky bar never show together", () => {
  assert.match(hub, /Start mission/);
  // Desktop: in the current-station card, hidden below md.
  assert.match(hub, /hidden w-full md:inline-flex/);
  // Mobile: the sticky bottom bar, hidden from md up.
  assert.match(hub, /sticky bottom-16[^"]*md:hidden/);
});

test('course-locked stations link to the course page, with text — never colour alone', () => {
  assert.match(map, /href="\/courses\/a1-1\/"/);
  assert.match(map, /'course-locked': 'Unlock with the A1\.1 course'/);
  assert.match(hub, /href="\/courses\/a1-1\/"/);
});

test('the hub balance is labeled monthly/permanent minutes, display only', () => {
  assert.match(balanceCmp, /Monthly allowance/);
  assert.match(balanceCmp, /Permanent minutes/);
  assert.match(balanceCmp, /fmtMinutes/);
  assert.match(balanceCmp, /the ledger decides charges|Display only/i);
});

test('the scoped .speaking-city tokens exist with the exact custom properties and the reduced-motion rule', () => {
  assert.match(css, /\.speaking-city \{/);
  assert.match(css, /--city-night: #07152f;/);
  assert.match(css, /--city-cobalt: #2457ff;/);
  assert.match(css, /--city-lime: #c7ff4a;/);
  assert.match(css, /--city-mist: #eef3ff;/);
  assert.match(css, /--city-line: #8ba4ff;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.speaking-city \*, \.speaking-city \*::before, \.speaking-city \*::after \{/);
});

test('acid lime is an accent, never text (and so never body text on white)', () => {
  const lab = read('src/features/speaking/PronunciationLab.jsx');
  for (const [name, src] of [['SpeakingHub', hub], ['CityRouteMap', map], ['MissionPrep', prep], ['GuidedMission', mission], ['MissionTicket', ticket], ['SpeakingBalance', balanceCmp], ['PronunciationLab', lab]]) {
    assert.doesNotMatch(src, /text-\[var\(--city-lime\)\]/, `${name} uses lime as text`);
  }
});

test('no opacity modifier ever rides on a var() colour — Tailwind silently drops it', () => {
  // `text-[var(--city-mist)]/80` emits NOTHING into the built CSS (verified
  // against dist/, the rounded-pill lesson) — tints are their own custom
  // properties in the .speaking-city block instead.
  const lab = read('src/features/speaking/PronunciationLab.jsx');
  for (const [name, src] of [['SpeakingHub', hub], ['CityRouteMap', map], ['MissionPrep', prep], ['GuidedMission', mission], ['MissionTicket', ticket], ['SpeakingBalance', balanceCmp], ['PronunciationLab', lab]]) {
    assert.doesNotMatch(src, /var\(--city-[a-z-]+\)\]\/\d/, `${name} carries a dead alpha-modified var() class`);
  }
  assert.match(css, /--city-mist-dim: rgba\(238, 243, 255, 0\.8\);/, 'the derived tints live in the scoped block');
  assert.match(css, /--city-hairline: rgba\(139, 164, 255, 0\.3\);/);
});

test('submitGuidedTurn sends the structured contract and plucks the tokens before normalization', () => {
  assert.match(api, /structured: true/);
  assert.match(api, /taskStateToken \? \{ taskStateToken \} : \{\}/);
  assert.match(api, /referenceText \? \{ referenceText \} : \{\}/);
  // The two signed tokens must be read from the RAW response BEFORE the
  // normalizer runs — normalizeGuidedFeedback drops unknown props by design.
  const pluck = api.indexOf('data.taskStateToken');
  const pluckMission = api.indexOf('data.missionResultToken');
  const normalize = api.indexOf('normalizeGuidedFeedback(data)');
  assert.ok(pluck > -1 && pluckMission > -1 && normalize > -1);
  assert.ok(pluck < normalize && pluckMission < normalize, 'tokens plucked after normalization would already be gone');
});

test('the guided exchange holds at most the last six turns and threads the task state token', () => {
  assert.match(mission, /const MAX_HISTORY_MESSAGES = 12/);
  assert.match(mission, /\.slice\(-MAX_HISTORY_MESSAGES\)/);
  assert.match(mission, /taskStateToken,/);
  assert.match(mission, /if \(nextToken\) setTaskStateToken\(nextToken\)/);
});

test('sessions end through finishSpeakingSession with honest outcomes — failed refunds', () => {
  assert.match(mission, /finishSpeakingSession\(\{ sessionToken, usedSeconds, outcome, userTurns \}\)/);
  assert.match(mission, /finish\('completed'\)/);
  assert.match(mission, /finish\('cancelled'\)/);
  assert.match(mission, /finish\('failed'\)/);
  assert.match(mission, /refund/i);
});

test('the mission ticket keeps the four signals separate and never renders a composite score', () => {
  assert.match(ticket, /Task completed/);
  assert.match(ticket, /A better way to say it/);
  assert.match(ticket, /Pronunciation/);
  assert.match(ticket, /Try next/);
  assert.doesNotMatch(rendered(ticket), /Gesamt|overall score|composite/i, 'the ticket must never merge the signals into one number');
});

test('pronunciation on the ticket is provider evidence or honestly unavailable — never invented', () => {
  assert.match(ticket, /nicht verfügbar/);
  assert.match(ticket, /pronunciation\.provider/);
  assert.match(ticket, /never guessed from text|never invented/i);
});

test('a pass is recorded only after the server verifies the result token', () => {
  assert.match(ticket, /verifyMissionResult\(\{ token: missionResultToken \}\)/);
  const verified = ticket.indexOf("res?.verified === true");
  const write = ticket.indexOf("writeMissionResult('a1.1'");
  assert.ok(verified > -1 && write > -1 && verified < write, 'writeMissionResult must sit behind the verified === true check');
  assert.match(ticket, /\/modelltest\/abschlusstest-a1-1/);
});

test('mission prep shows situation, outcome, phrases, allowance source and the mic check', () => {
  assert.match(prep, /Your situation/);
  assert.match(prep, /You succeed when you/);
  assert.match(prep, /Useful phrases/);
  assert.match(prep, /first attempt at this mission is included/);
  assert.match(prep, /uses your speaking minutes/);
  assert.match(prep, /Microphone check/);
  assert.match(prep, /getUserMedia\(\{ audio: true \}\)/);
});

test('own-recording playback happens locally before anything is sent', () => {
  assert.match(mission, /Listen before you send/);
  assert.match(mission, /URL\.createObjectURL/);
  assert.match(mission, /audio controls src=\{pending\.url\}/);
  assert.match(mission, /Send to the coach/);
  assert.match(mission, /Discard/);
});
