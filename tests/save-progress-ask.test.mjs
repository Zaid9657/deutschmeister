// The save-progress ask comes after a signed-out learner's FIRST checked answer
// (product agent, owner decision 2026-10-06: "yes, move the signup ask after
// the first exercise"). Before, the only ask was the recap card, after all
// twelve stages of a Lektion, and no account had ever finished an A1.1 Lektion.
//
// What this suite pins, as rules rather than as a list of screens:
//   1. WHEN: signed out, once the first answer's feedback has been read, once
//      per Lektion, never on the recap (it has its own card), never signed in,
//      never in the preview; either button settles it.
//   2. WHERE TO: both doors are on-site attributed hrefs, and the tag survives
//      the real parser (public/attribution.js under node:vm) into the signup
//      metadata as acquisition_last_source.
//   3. THE PLACE: the click remembers the Lektion (or the course home) and
//      postAuthPath returns to it after a pending checkout; mid-Lektion, the
//      run is handed to the tab the confirmation e-mail opens.
//   4. THE WIRING: the player decides through saveAskDue with `!user`, records
//      the first answer from the attempts its onResult path writes, and no
//      course-chrome file opens /signup except through the door helper.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { register } from 'node:module';

// buyIntent.js and attribution.js import '../utils/safeStorage' without an
// extension (Vite resolves it, node does not). Resolve those few the way Vite
// does, so this suite runs the real postAuthPath and the real signup metadata.
register(`data:text/javascript,${encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try { return await next(specifier, context); } catch (err) {
    if (err && err.code === 'ERR_MODULE_NOT_FOUND' && /^\\.\\.?\\//.test(specifier) && !/\\.[cm]?jsx?$/.test(specifier)) {
      return next(specifier + '.js', context);
    }
    throw err;
  }
}`)}`);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
/** Comments out, so a doc comment cannot satisfy or trip a source rule. */
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');

function fakeStorage() {
  const map = new Map();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

/** One browser: a localStorage shared by every tab, a sessionStorage per tab. */
function browser() {
  const localStorage = fakeStorage();
  return {
    localStorage,
    tab: () => ({ sessionStorage: fakeStorage(), localStorage }),
  };
}

function inWindow(win, fn) {
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const prev = globalThis.window;
  globalThis.window = win;
  try { return fn(); } finally {
    if (had) globalThis.window = prev; else delete globalThis.window;
  }
}

const ask = await import('../src/lib/course/saveProgressAsk.js');
const { setReturnPath, peekReturnPath, clearReturnPath, isCourseReturnPath } = await import('../src/lib/returnPath.js');
const { postAuthPath, setBuyIntent, clearBuyIntent } = await import('../src/lib/buyIntent.js');
const { packRun, saveRun, readRun, clearRun, runKey, HANDOFF_KEY } = await import('../src/lib/lesson/runState.js');
const { signupAttributionMetadata } = await import('../src/lib/attribution.js');

const NOW = Date.UTC(2026, 9, 6, 17, 0, 0);
const FEEDBACK = { stageIndex: 5, itemIndex: 0 }; // practice item 1, its feedback showing
const NEXT = { stageIndex: 5, itemIndex: 1 };

// --- 1. WHEN ----------------------------------------------------------------------------------

test('signed out: the ask waits for the first answer, then takes the next screen', () => {
  const base = { signedOut: true, preview: false, settled: false, stageKind: 'practice' };
  assert.equal(ask.saveAskDue({ ...base, firstAnswerAt: null, at: FEEDBACK }), false, 'no answer yet, no ask');
  assert.equal(ask.saveAskDue({ ...base, firstAnswerAt: FEEDBACK, at: FEEDBACK }), false, 'never over the feedback of the answer itself');
  assert.equal(ask.saveAskDue({ ...base, firstAnswerAt: FEEDBACK, at: NEXT }), true, 'the next item');
  assert.equal(ask.saveAskDue({ ...base, firstAnswerAt: { stageIndex: 5, itemIndex: 6 }, at: { stageIndex: 6, itemIndex: 0 }, stageKind: 'derived' }), true, 'or the next stage');
});

test('signed in, settled, in the preview or on the recap: never', () => {
  const due = { signedOut: true, preview: false, settled: false, firstAnswerAt: FEEDBACK, at: NEXT, stageKind: 'practice' };
  assert.equal(ask.saveAskDue(due), true);
  assert.equal(ask.saveAskDue({ ...due, signedOut: false }), false, 'a signed-in learner never sees it');
  assert.equal(ask.saveAskDue({ ...due, settled: true }), false, 'once answered, not again in this Lektion');
  assert.equal(ask.saveAskDue({ ...due, preview: true }), false);
  assert.equal(ask.saveAskDue({ ...due, stageKind: 'recap' }), false, 'the recap has its own card');
});

test('the ask is settled per Lektion and per browser', () => {
  const b = browser();
  inWindow(b.tab(), () => {
    assert.equal(ask.isAskSettled('A1.1', 'a1.1-l01'), false);
    ask.settleAsk('A1.1', 'a1.1-l01', NOW);
    assert.equal(ask.isAskSettled('a1.1', 'a1.1-l01'), true, 'the level is lower-cased in the key');
    assert.equal(ask.isAskSettled('a1.1', 'a1.1-l02'), false, 'the next Lektion asks again');
  });
  inWindow(b.tab(), () => assert.equal(ask.isAskSettled('a1.1', 'a1.1-l01'), true, 'another tab of the same browser'));
  assert.equal(ask.isAskSettled('a1.1', 'a1.1-l01'), false, 'no storage at all: not settled, and no throw');
});

// --- 2. WHERE TO ------------------------------------------------------------------------------

test('both doors are on-site attributed /signup hrefs (CLAUDE.md case 3: no trailing slash)', () => {
  assert.equal(ask.saveProgressSignupHref({ door: 'first', level: 'A1.1', lektionNr: 1 }),
    '/signup?ref=save-progress-first&utm_medium=onsite&utm_content=a1.1-l1');
  assert.equal(ask.saveProgressSignupHref({ door: 'recap', level: 'a1.1' }),
    '/signup?ref=save-progress-recap&utm_medium=onsite&utm_content=a1.1');
  assert.deepEqual(Object.values(ask.SAVE_PROGRESS_DOORS), ['save-progress-first', 'save-progress-recap']);
});

/** Land on a URL with public/attribution.js, the one classifier, exactly as the browser runs it. */
function land(localStorage, url, referrer = '') {
  const u = new URL(url, 'https://deutsch-meister.de');
  const ctx = { window: { localStorage, location: { search: u.search, pathname: u.pathname } }, document: { referrer }, URL, URLSearchParams, Date, JSON };
  vm.createContext(ctx);
  vm.runInContext(read('public/attribution.js'), ctx);
}

test('the door tag survives the real parser into the signup metadata as acquisition_last_source', () => {
  for (const [door, lektionNr, source, content] of [['first', 3, 'save-progress-first', 'a1.1-l3'], ['recap', null, 'save-progress-recap', 'a1.1']]) {
    // A visitor who came from Google, started A1.1 and took the door.
    const b = browser();
    land(b.localStorage, '/', 'https://www.google.com/');
    land(b.localStorage, ask.saveProgressSignupHref({ door, level: 'a1.1', lektionNr }), 'https://deutsch-meister.de/course/a1.1/l/3');
    const meta = inWindow(b.tab(), () => signupAttributionMetadata());
    assert.equal(meta.acquisition_source, 'google', 'the first touch is never overwritten');
    assert.equal(meta.acquisition_last_source, source, door);

    // A visitor with no earlier touch: the door is the first touch too, and names the Lektion.
    const fresh = browser();
    land(fresh.localStorage, ask.saveProgressSignupHref({ door, level: 'a1.1', lektionNr }));
    const first = inWindow(fresh.tab(), () => signupAttributionMetadata());
    assert.equal(first.acquisition_source, source);
    assert.equal(first.acquisition_medium, 'onsite', 'kept out of the channel shares');
    assert.equal(first.acquisition_content, content);
  }
});

// --- 3. THE PLACE -----------------------------------------------------------------------------

test('the return path takes the A1.1 player and course home beside the course v2 shapes, and nothing else', () => {
  for (const ok of ['/course/a1.1', '/course/a1.1/l/1', '/course/a1.1/l/12', '/course/a1.1/u/1?s=5', '/course/a1.1/v2', '/course/a1.1/p/2', '/course/a1.1/abschluss']) {
    assert.ok(isCourseReturnPath(ok), ok);
  }
  for (const bad of ['//evil.com', 'https://evil.com/course/a1.1/v2', '/dashboard', '/course/a1.1/u/1?s=5&x=//e', '/course/../admin',
    '/course/a1.1/l/1/../../admin', '/course/a1.1/l/x', '/course/a1.1/', '/course/a1.1/l/123', '/signup']) {
    assert.ok(!isCourseReturnPath(bad), bad);
  }
});

test('after the ask, postAuthPath returns to the Lektion; a pending checkout still comes first', () => {
  inWindow(browser().tab(), () => {
    assert.equal(postAuthPath(), '/dashboard', 'nothing remembered: the dashboard, as before');
    ask.rememberPlace({ level: 'a1.1', lektionId: 'a1.1-l01', lektionNr: 1 });
    assert.equal(peekReturnPath(), '/course/a1.1/l/1');
    assert.equal(postAuthPath(), '/course/a1.1/l/1');
    setBuyIntent('course_a1_1');
    assert.equal(postAuthPath(), '/subscription?buy=course_a1_1', 'checkout first, then the course step, then the dashboard');
    clearBuyIntent();
    clearReturnPath();
    assert.equal(postAuthPath(), '/dashboard');
    ask.rememberPlace({ level: 'a1.1' });
    assert.equal(postAuthPath(), '/course/a1.1', 'the recap card returns to the course home, where the merge runs');
  });
});

test('the return path is forgotten after three days', () => {
  inWindow(browser().tab(), () => {
    setReturnPath('/course/a1.1/l/2', NOW);
    assert.equal(peekReturnPath(NOW + 60_000), '/course/a1.1/l/2');
    assert.equal(peekReturnPath(NOW + 4 * 24 * 3600_000), null);
  });
});

test('mid-Lektion, the run crosses into the tab the confirmation e-mail opens, once', () => {
  const b = browser();
  const tabA = b.tab();
  const run = packRun({ stageKey: 'practice', stageIndex: 5, itemIndex: 1, attempts: [{ itemId: 'p1', stage: 'practice', correct: true }] }, NOW);
  inWindow(tabA, () => {
    saveRun('a1.1', 'a1.1-l01', run);
    ask.rememberPlace({ level: 'a1.1', lektionId: 'a1.1-l01', lektionNr: 1 }, NOW);
  });
  assert.ok(b.localStorage.map.has(HANDOFF_KEY), 'the click hands the run off');

  // The e-mail's tab: no sessionStorage of its own. Another Lektion does not take it.
  const tabB = b.tab();
  inWindow(tabB, () => {
    assert.equal(readRun('a1.1', 'a1.1-l02', NOW + 1000), null, 'another Lektion starts fresh');
    assert.ok(b.localStorage.map.has(HANDOFF_KEY), 'and leaves the hand-off where it is');
    const resumed = readRun('a1.1', 'a1.1-l01', NOW + 1000);
    assert.equal(resumed.stageKey, 'practice');
    assert.equal(resumed.itemIndex, 1);
    assert.deepEqual(resumed.attempts, run.attempts, 'the signed-out answer travels with the run');
  });
  assert.ok(!b.localStorage.map.has(HANDOFF_KEY), 'taken once');
  assert.ok(tabB.sessionStorage.map.has(runKey('a1.1', 'a1.1-l01')), 'and now it is that tab\'s run');

  // The original tab keeps its own run (it may have moved on since).
  inWindow(tabA, () => assert.equal(readRun('a1.1', 'a1.1-l01', NOW + 1000).itemIndex, 1));
  // A hand-off older than a sitting starts fresh, like any run.
  inWindow(tabA, () => ask.rememberPlace({ level: 'a1.1', lektionId: 'a1.1-l01', lektionNr: 1 }, NOW));
  inWindow(b.tab(), () => assert.equal(readRun('a1.1', 'a1.1-l01', NOW + 13 * 3600_000), null));
});

test('a run finished in the saving tab takes its hand-off with it: a later tab cannot resume it (review of 6278791d)', () => {
  // Save → Back → finish Lektion 1 in the same tab → open Lektion 1 in a new tab within 12 h.
  const b = browser();
  const tabA = b.tab();
  const run = packRun({ stageKey: 'practice', stageIndex: 5, itemIndex: 1, attempts: [{ itemId: 'p1', stage: 'practice', correct: true }] }, NOW);
  inWindow(tabA, () => {
    saveRun('a1.1', 'a1.1-l01', run);
    ask.rememberPlace({ level: 'a1.1', lektionId: 'a1.1-l01', lektionNr: 1 }, NOW);
    clearRun('a1.1', 'a1.1-l02');
  });
  assert.ok(b.localStorage.map.has(HANDOFF_KEY), 'ending ANOTHER Lektion leaves this hand-off alone');
  inWindow(tabA, () => clearRun('a1.1', 'a1.1-l01')); // the recap of Lektion 1, in the saving tab
  assert.ok(!b.localStorage.map.has(HANDOFF_KEY), 'the recap drops the hand-off of the run it ends');
  inWindow(b.tab(), () => assert.equal(readRun('a1.1', 'a1.1-l01', NOW + 3600_000), null, 'a new tab starts Lektion 1 fresh, no old answer re-logged'));
  // The player's recap is what calls clearRun, for this Lektion's key.
  assert.match(code(read('src/pages/lesson/LessonPlayerPage.jsx')), /if \(saved \|\| stage\.kind === 'recap'\) \{ clearRun\(curriculum\.level, lektion\.id\); return; \}/);
});

// --- 4. THE WIRING ----------------------------------------------------------------------------

test('the player shows the ask through saveAskDue for a signed-out learner, from the attempts onResult writes', () => {
  const src = code(read('src/pages/lesson/LessonPlayerPage.jsx'));
  assert.match(src, /saveAskDue\(\{ signedOut: !authLoading && !user, preview, settled: askSettled, firstAnswerAt, at: \{ stageIndex, itemIndex \}, stageKind: stage\.kind \}\)/);
  assert.match(src, /body = <SaveProgressAsk level=\{curriculum\.level\} lektion=\{lektion\} onContinue=\{\(\) => setAskSettled\(true\)\} \/>/);
  assert.match(src, /if \(firstAnswerAt \|\| !attempts\.length\) return;\s*setFirstAnswerAt\(\{ stageIndex, itemIndex \}\);/,
    'the first answer is the first attempt recordResult stores, wherever it was given');
  assert.match(src, /setAttempts\(\(prev\) => \[\.\.\.prev, \{ itemId: item\.id/, 'recordResult is the onResult every checked item calls');
  assert.match(src, /useState\(\(\) => preview \|\| isAskSettled\(curriculum\.level, lektion\.id\)\)/);
  assert.match(src, /if \(user && !preview\) clearReturnPath\(\);/, 'signed in, the remembered place is cleared');
  // The ask decides nothing about the answer itself: every item still checks through check.js.
  for (const f of ['PracticeItem', 'DictationItem', 'WordOrderItem', 'ListenSelectItem']) {
    assert.match(read(`src/components/lesson/${f}.jsx`), /from '\.\.\/\.\.\/lib\/lesson\/check\.js'/, f);
  }
});

test('"signed out" means the session has loaded and there is none, so a member never sees the ask flash (review of 6278791d)', () => {
  // Why `!user` alone is not enough: AuthContext starts with user null and loading true,
  // getSession may take up to 8 s, and LevelSubscriptionGuard renders a free level
  // (A1.1) without waiting for it.
  const auth = read('src/contexts/AuthContext.jsx');
  assert.match(auth, /const \[user, setUser\] = useState\(null\);\s*const \[loading, setLoading\] = useState\(true\);/);
  assert.match(auth, /withTimeout\(supabase\.auth\.getSession\(\), \d+\)/);
  const guard = code(read('src/components/LevelSubscriptionGuard.jsx'));
  assert.ok(guard.indexOf('if (isLevelFree(level))') < guard.indexOf('if (authLoading || subLoading)'), 'a free level renders before auth has loaded');
  // So the player reads the flag, and the decision takes it.
  const src = code(read('src/pages/lesson/LessonPlayerPage.jsx'));
  assert.match(src, /const \{ user, loading: authLoading \} = useAuth\(\);/);
  assert.match(src, /signedOut: !authLoading && !user/);
  assert.doesNotMatch(src, /signedOut: !user\b/);
  const due = { preview: false, settled: false, firstAnswerAt: FEEDBACK, at: NEXT, stageKind: 'practice' };
  for (const [authLoading, user, expected] of [[true, null, false], [false, null, true], [false, { id: 'u' }, false], [true, { id: 'u' }, false]]) {
    assert.equal(ask.saveAskDue({ ...due, signedOut: !authLoading && !user }), expected, JSON.stringify({ authLoading, user }));
  }
});

test('the player is keyed by the Lektion, so the ask (and every other piece of run state) starts over in the next one', () => {
  const src = code(read('src/pages/lesson/LessonPlayerPage.jsx'));
  const renders = src.match(/<LessonPlayer\b[^>]*\/>/g) || [];
  assert.equal(renders.length, 1, 'one place renders the routed player');
  assert.match(renders[0], /key=\{`\$\{curriculum\.level\}:\$\{lektion\.id\}`\}/,
    'the recap\'s "Next lesson" is a client-side hop to the same route; without the key the next Lektion opens on the old stage index');
});

test('the ask: an attributed signup href that remembers the place, a way on without saving, and a login', () => {
  const src = code(read('src/components/course/SaveProgressAsk.jsx'));
  assert.match(src, /href=\{saveProgressSignupHref\(\{ door: 'first', level, lektionNr: lektion\.nr \}\)\}\s*onClick=\{save\}/);
  assert.match(src, /const save = \(\) => \{\s*settle\(\);\s*rememberPlace\(\{ level, lektionId: lektion\.id, lektionNr: lektion\.nr \}\);/);
  assert.match(src, /onClick=\{\(\) => \{ settle\(\); onContinue\(\); \}\}/, '"Continue without saving" settles the ask and goes on');
  assert.match(src, /\{t\('saveAsk\.cta', lang\)\}/);
  assert.match(src, /\{t\('saveAsk\.skip', lang\)\}/);
  assert.match(src, /to="\/login"\s*state=\{\{ from: \{ pathname: here \} \}\}\s*onClick=\{save\}/,
    '"I already have an account" remembers the place like the signup door: /login can turn into /signup or a new confirmation tab');
  assert.equal((src.match(/onClick=\{save\}/g) || []).length, 2, 'both account doors take the same save path');
  const card = code(read('src/components/course/SaveProgressCard.jsx'));
  assert.match(card, /href=\{saveProgressSignupHref\(\{ door: 'recap', level \}\)\} onClick=\{\(\) => rememberPlace\(\{ level \}\)\}/);
});

test('the copy: both tables carry the ask, the CTA says what it does, and the German speaks Sie', async () => {
  const { STRINGS } = await import('../src/lib/lesson/strings.js');
  for (const key of ['saveAsk.eyebrow', 'saveAsk.title', 'saveAsk.body', 'saveAsk.cta', 'saveAsk.skip']) {
    assert.ok(STRINGS.en[key] && STRINGS.de[key], key);
  }
  assert.equal(STRINGS.en['saveAsk.cta'], 'Save my progress — create a free account');
  assert.equal(STRINGS.en['saveAsk.skip'], 'Continue without saving');
  assert.match(STRINGS.de['saveAsk.body'], /\bSie\b/);
  for (const key of ['saveAsk.eyebrow', 'saveAsk.title', 'saveAsk.body', 'saveAsk.cta', 'saveAsk.skip']) {
    assert.doesNotMatch(STRINGS.de[key], /\b(du|dich|dir|dein\w*|kannst|hast|bist)\b/i, key);
  }
});

test('no course-chrome file opens /signup except through the door helper', () => {
  const dirs = ['src/components/course', 'src/components/lesson', 'src/pages/lesson'];
  const files = dirs.flatMap((d) => readdirSync(join(ROOT, d)).filter((f) => /\.jsx?$/.test(f)).map((f) => `${d}/${f}`));
  files.push('src/pages/CurriculumHomePage.jsx');
  assert.ok(files.length > 30, `the walk found ${files.length} files`);
  for (const f of files) {
    assert.doesNotMatch(code(read(f)), /['"`]\/signup/, `${f} opens /signup without a door tag: use saveProgressSignupHref`);
  }
});
