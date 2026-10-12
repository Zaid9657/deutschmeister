// The telc B1 pilot route opens each day's exact task (2026-10-12). Every link
// in src/data/programs/telcB1Komplett.js lands on a page that understands it:
//
//   /schreiben/telc-b1?task=<key>     opens that task — a key of THIS exam's
//                                     bank only; anything else falls back to
//                                     the first task, never an empty page;
//   …&revise=1                        loads the learner's OWN latest letter for
//                                     that task into an EMPTY editor and shows
//                                     its correction; typed text is replaced only
//                                     by an explicit „Ihren letzten Brief laden",
//                                     and the card claims the letter is in the
//                                     editor only for the task it was loaded for;
//   /speaking/?level=B1.2             receives the rehearsal through the course
//                                     context, and the return bar takes the
//                                     learner back to /telc-b1-kurs, labelled
//                                     „Zurück zum Plan";
//   /telc-b1-kurs                     clears stale contexts and fills the two
//                                     profile fields the onboarding gate reads,
//                                     only where they are NULL ('none' is the
//                                     learner's "no exam" choice), and opens the
//                                     task links once those writes are done — or
//                                     have failed or timed out, never later
//                                     (arrive(), tested in telc-pilot.test.mjs).
//
// Structural (the repo's style for React pages); the pure parts are tested
// behaviourally in tests/telc-pilot.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { allDays } from '../src/data/programs/telcB1Komplett.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('the writing page opens the named task, and only a task of this exam', () => {
  const page = read('src/pages/SchreibenPage.jsx');
  assert.match(page, /const wantedTask = searchParams\.get\('task'\);/);
  assert.match(page, /const wantsRevision = searchParams\.get\('revise'\) === '1';/);
  assert.match(page, /const tasks = writingTasksForExam\(examKey\);/);
  assert.match(page, /const activeTask = tasks\.find\(\(t\) => t\.taskKey === taskKey\) \|\| tasks\[0\] \|\| null;/,
    'an unknown ?task= must fall back to the first task of the bank, never to nothing');
  assert.match(page, /const revising = wantsRevision && !!activeTask && activeTask\.taskKey === wantedTask;/,
    'the revision view belongs to the task the link named, and only to it');
  assert.match(page, /useEffect\(\(\) => \{\s*if \(!wantedTask\) return;\s*setTaskKey\(wantedTask\);/,
    'a link to another task while the page is open must select it');
});

test('revise=1 loads the learner\'s own latest letter and never overwrites typed text', () => {
  const page = read('src/pages/SchreibenPage.jsx');
  const effect = page.slice(page.indexOf('// Revision day:'), page.indexOf('const submit = async'));
  assert.match(effect, /\.eq\('user_id', user\.id\)/, 'only the learner\'s own rows');
  assert.match(effect, /\.eq\('exam_key', examKey\)/);
  assert.match(effect, /const forTask = activeTask\.taskKey;/, 'the task is pinned when the query starts');
  assert.match(effect, /\.eq\('task_key', forTask\)/);
  assert.match(effect, /\.order\('created_at', \{ ascending: false \}\)\s*\.limit\(1\)/, 'the LATEST letter');
  assert.match(effect, /setLastLetter\(undefined\);/, 'no previous task\'s correction while the next one loads');
  assert.match(effect, /if \(data\?\.submission_text && !textRef\.current\.trim\(\)\) \{\s*setText\(data\.submission_text\);\s*setLoadedFor\(forTask\);/,
    'the pre-fill fills only an empty editor, and records which task it filled it for');
  assert.match(page, /\{loadedFor === activeTask\.taskKey \? \(/, 'the card claims the letter is in the editor only for that task');
  assert.match(page, /Ihren letzten Brief laden/, 'replacing typed text is an explicit action');
  for (const reset of ['onChange={(e) => { setExamKey(e.target.value); setTaskKey(null); setResult(null); setLoadedFor(null); }}',
    'onClick={() => { setTaskKey(t.taskKey); setResult(null); setLoadedFor(null); }}']) {
    assert.ok(page.includes(reset), `a task or exam switch must release the editor: ${reset}`);
  }
  assert.match(page, /Ihre letzte Korrektur/);
});

test('the return bar takes a telc rehearsal home to the plan, and hides on the plan itself', () => {
  const bar = read('src/components/CourseReturnBar.jsx');
  assert.match(bar, /const home = ctx\.homeHref \|\| courseHome\(ctx\.level\);/);
  assert.match(bar, /\{ctx\.returnLabel \|\| 'Zurück zur Lektion'\}/);
  assert.match(bar, /\(ctx\.homeHref && pathname === ctx\.homeHref\)/, 'no return bar on the page it returns to');
  const flow = read('src/lib/courseFlow.js');
  assert.match(flow, /export const TELC_COURSE_HOME = '\/telc-b1-kurs';/);
});

test('the course page hands every rehearsal over before it navigates', () => {
  const page = read('src/pages/TelcB1KursPage.jsx');
  const handOffs = page.match(/saveCourseContext\(telcCourseContext\(item\)\)/g) || [];
  assert.ok(handOffs.length >= 2, 'both the plan list and the „Heute" button must hand the task over');
  assert.match(page, /item\.type === 'speaking'/);
});

test('arrival clears stale contexts and fills only empty profile fields', () => {
  const page = read('src/pages/TelcB1KursPage.jsx');
  const arrival = page.slice(page.indexOf('// Arrival:'), page.indexOf('// The learner\'s records'));
  assert.match(arrival, /clearCourseContext\(\);/);
  assert.match(arrival, /arrive\(\{\s*profile,/, 'the bounded arrival of src/lib/telcPilot.js, fed the profile the app already loaded');
  assert.match(arrival, /update\(\{ onboarding_completed_at: [^}]+\}\)\s*\.eq\('id', user\.id\)\.is\('onboarding_completed_at', null\)/,
    'onboarding is marked done on the learner\'s own row, only where it is still empty');
  assert.match(arrival, /update\(\{ exam_track: EXAM_KEY \}\)\s*\.eq\('id', user\.id\)\.is\('exam_track', null\)/,
    'only an EMPTY exam_track is filled');
  assert.doesNotMatch(arrival, /exam_track\.eq\.none/, "'none' is the learner's explicit no-exam choice — never overwritten on arrival");
  assert.match(arrival, /if \(!alive\) return;\s*setArrived\(true\);/,
    'the links open after the writes settle — written, failed or timed out');
  assert.match(page, /if \(!ready\) return <span className=\{className\}>\{children\}<\/span>;/,
    'plan items are not doors until the arrival writes are done');
  assert.match(page, /\{loaded && arrived && \(/, 'the „Heute" button waits for the arrival writes too');
  assert.match(page, /ready=\{arrived\}/);
  assert.match(page, /MOCK_DISCLAIMER_DE/, 'the short test is labelled practice material');
});

test('every route the plan links to exists in the app and survives a direct page load', () => {
  const app = read('src/App.jsx');
  const toml = read('netlify.toml');
  const ROUTES = [
    [/^\/schreiben\/[a-z0-9-]+$/, 'path="/schreiben/:examSlug"', 'from = "/schreiben/*"'],
    [/^\/modelltest\/[a-z0-9-]+$/, 'path="/modelltest/:examSlug"', 'from = "/modelltest/*"'],
    [/^\/speaking\/$/, 'path="/speaking"', 'from = "/speaking"'],
    [/^\/analyze\/$/, 'path="/analyze"', 'from = "/analyze"'],
    [/^\/reading\/[ab][12]\.[12]$/, 'path="/reading/:level"', 'from = "/reading/*"'],
    [/^\/listening\/[ab][12]\.[12]$/, 'path="/listening/:level"', 'from = "/listening/*"'],
  ];
  const spaLinks = allDays().flatMap((d) => d.items).filter((i) => !i.external).map((i) => i.href.split('?')[0]);
  for (const href of spaLinks) {
    const route = ROUTES.find(([re]) => re.test(href));
    assert.ok(route, `${href}: not a route this test knows — add it with its App.jsx and netlify.toml entries`);
    assert.ok(app.includes(route[1]), `${href}: ${route[1]} missing from App.jsx`);
    assert.ok(toml.includes(route[2]), `${href}: ${route[2]} missing from netlify.toml — a direct load would 404`);
  }
});
