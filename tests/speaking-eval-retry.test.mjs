// A failed speaking evaluation is recoverable (cross-check AI-08 / X-031, X-076),
// a late reply never plays after the learner left (AI-11), the page keeps its
// head in every branch (AI-09), and the session view keeps the newest reply,
// the record button and the countdown in sight (AI-10).
//
// Every non-OK evaluation answer (409 still grading, 429, 503) and every
// network error used to reach the caller as onComplete(null) — the value that
// means "nothing was said". /speaking silently went back to setup and the level
// test recorded speaking as skipped, although the session had used its
// allowance and evaluate-speaking.mjs makes a retry by session_token safe.
//
// No React renderer in this repo's tests (see tests/speaking-startup-cancellation.test.mjs):
// the handlers are cut out of the components and run against mocks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const SESSION = read('src/components/speaking/SpeakingSession.jsx');
const PAGE = read('src/pages/SpeakingPage.jsx');
const LEVEL_TEST = read('src/components/LevelTest/LevelTestSpeaking.jsx');
const quiet = { log() {}, warn() {}, error() {} };
// Objects made inside a vm context have that context's prototypes.
const plain = (value) => JSON.parse(JSON.stringify(value));

/** The source between two markers, `start` included. */
function cut(source, start, end) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, `not found: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.ok(to > from, `not found after ${start}: ${end}`);
  return source.slice(from, to);
}

const evaluation = { total_score: 64, feedback: 'Gut.', scores: { grammar: 12 } };

/** A fetch that answers the evaluation request from a script of responses. */
function scriptedFetch(script) {
  const requests = [];
  const fetch = async (url, init) => {
    requests.push({ url, body: JSON.parse(init.body) });
    const next = script.shift();
    if (next === 'offline') throw new TypeError('Failed to fetch');
    return { ok: next.status >= 200 && next.status < 300, status: next.status, json: async () => next.body };
  };
  return { fetch, requests };
}

/** requestSpeakingEvaluation as the component exports it, over a scripted fetch. */
function loadRequest(script) {
  const { fetch, requests } = scriptedFetch(script);
  const source = cut(SESSION, 'export async function requestSpeakingEvaluation', '\n}\n').replace('export ', '') + '\n}';
  const request = vm.runInNewContext(`${source}\nrequestSpeakingEvaluation;`, {
    fetch, getAuthHeaders: async () => ({ Authorization: 'Bearer jwt' }), console: quiet, JSON,
  });
  return { request, requests };
}

test('the evaluation request sends only the session token and classifies every answer', async () => {
  const { request, requests } = loadRequest([
    { status: 200, body: evaluation },
    { status: 409, body: { error: 'evaluation_in_progress' } },
    { status: 429, body: { error: 'limit_reached', limit: 20 } },
    { status: 503, body: { error: 'Usage could not be reserved' } },
    'offline',
    { status: 200, body: { evaluation_failed: true, message: 'Auswertung konnte nicht erstellt werden.' } },
    { status: 409, body: { error: 'no_learner_turns' } },
    { status: 404, body: { error: 'Session not found' } },
  ]);
  assert.deepEqual(plain(await request('sp_1')), { ok: true, evaluation });
  assert.deepEqual(requests[0], { url: '/api/speaking/evaluate-speaking', body: { session_token: 'sp_1' } },
    'the server grades its own stored transcript: no level, mode or messages travel');
  const expect = [
    { status: 409, code: 'evaluation_in_progress', retryable: true },
    { status: 429, code: 'limit_reached', retryable: true },
    { status: 503, code: 'Usage could not be reserved', retryable: true },
    { status: 0, code: 'network', retryable: true },
    { status: 200, code: 'evaluation_failed', retryable: true },
    { status: 409, code: 'no_learner_turns', retryable: false },
    { status: 404, code: 'Session not found', retryable: false },
  ];
  for (const want of expect) {
    const got = await request('sp_1');
    assert.equal(got.ok, false);
    assert.deepEqual({ status: got.status, code: got.code, retryable: got.retryable }, want);
  }
});

/** SpeakingSession's endSession, with the refs it reads and a scripted evaluation. */
function loadEndSession(script, { userTurns = 1, withFailureProp = true } = {}) {
  const { request } = loadRequest(script);
  const reported = { complete: [], failed: [], evaluating: [] };
  const inner = cut(SESSION, 'async () => {\n    if (endingRef.current) return;', ', [sessionToken, level, isPlacement, onComplete, onEvaluationFailed, stopAudio, reportEnd]);');
  const messages = [{ role: 'assistant', content: 'Hallo!' }, ...Array.from({ length: userTurns }, () => ({ role: 'user', content: 'Hallo.' }))];
  const endSession = vm.runInNewContext(`(${inner})`, {
    endingRef: { current: false }, timerRef: { current: null }, recorderRef: { current: null }, streamRef: { current: null },
    turnInFlightRef: { current: null }, messagesRef: { current: messages }, clearInterval() {},
    stopAudio() {}, reportEnd: async () => {}, setEvaluating: (v) => reported.evaluating.push(v),
    requestSpeakingEvaluation: request, sessionToken: 'sp_1', level: 'placement', isPlacement: true,
    onComplete: (value) => reported.complete.push(value),
    onEvaluationFailed: withFailureProp ? (failure) => reported.failed.push(failure) : undefined,
  });
  return { endSession, reported };
}

test('a failed evaluation reaches the caller as a failure with a retry flag, never as "nothing was said"', async () => {
  for (const answer of [{ status: 503, body: {} }, { status: 409, body: { error: 'evaluation_in_progress' } }, 'offline']) {
    const { endSession, reported } = loadEndSession([answer]);
    await endSession();
    assert.deepEqual(reported.complete, [], 'onComplete(null) is no longer the failure signal');
    assert.equal(reported.failed.length, 1);
    assert.equal(reported.failed[0].sessionToken, 'sp_1');
    assert.equal(reported.failed[0].isPlacement, true);
    assert.equal(reported.failed[0].retryable, true);
    assert.deepEqual(reported.evaluating, [true, false]);
  }
  const success = loadEndSession([{ status: 200, body: evaluation }]);
  await success.endSession();
  assert.deepEqual(success.reported.complete, [evaluation]);

  const silent = loadEndSession([], { userTurns: 0 });
  await silent.endSession();
  assert.deepEqual(silent.reported.complete, [null], 'null stays the zero-turn signal');
  assert.deepEqual(silent.reported.failed, []);

  // A caller without the new prop keeps the previous contract.
  const legacy = loadEndSession([{ status: 503, body: {} }], { withFailureProp: false });
  await legacy.endSession();
  assert.deepEqual(legacy.reported.complete, [null]);
  const legacyFailed = loadEndSession([{ status: 200, body: { evaluation_failed: true, message: 'x' } }], { withFailureProp: false });
  await legacyFailed.endSession();
  assert.equal(legacyFailed.reported.complete[0].evaluation_failed, true);
});

test('/speaking keeps the session through a failure and "Retry feedback" goes 409 → retry → 200 to the results', async () => {
  const { request, requests } = loadRequest([
    { status: 409, body: { error: 'evaluation_in_progress' } },
    { status: 200, body: evaluation },
  ]);
  const state = { phase: 'session', evaluation: null, failure: null, retrying: [], meta: 0 };
  const context = {
    session: { sessionToken: 'sp_page', level: 'A2.1' }, retryingEval: false,
    requestSpeakingEvaluation: request,
    setRetryingEval: (v) => state.retrying.push(v), setEvalFailure: (v) => { state.failure = v; },
    setEvaluation: (v) => { state.evaluation = v; }, setPhase: (v) => { state.phase = v; }, loadMeta: () => { state.meta++; },
  };
  const failedHandler = cut(PAGE, 'const handleEvaluationFailed = (failure) => {', '\n  };') + '\n  };';
  const retryHandler = cut(PAGE, 'const retryEvaluation = async () => {', '\n  };') + '\n  };';
  const { handleEvaluationFailed, retryEvaluation } = vm.runInNewContext(
    `${failedHandler}\n${retryHandler}\n({ handleEvaluationFailed, retryEvaluation });`, context);

  handleEvaluationFailed({ sessionToken: 'sp_page', status: 503, code: null, retryable: true, result: null });
  assert.equal(state.phase, 'eval_failed', 'the failure card, not a silent return to setup');
  assert.equal(state.failure.retryable, true);

  await retryEvaluation();
  assert.equal(state.phase, 'eval_failed', 'still being prepared: the card stays');
  assert.equal(state.failure.code, 'evaluation_in_progress');
  assert.match(PAGE, /evaluation_in_progress'\) return 'Your feedback is still being prepared — try again in a moment\.'/);

  await retryEvaluation();
  assert.equal(state.phase, 'results');
  assert.deepEqual(state.evaluation, evaluation);
  assert.equal(state.failure, null);
  assert.deepEqual(requests.map((r) => r.body), [{ session_token: 'sp_page' }, { session_token: 'sp_page' }], 'the same session, asked again');
  assert.deepEqual(state.retrying, [true, false, true, false]);

  assert.match(PAGE, /onEvaluationFailed=\{handleEvaluationFailed\}/);
  assert.match(PAGE, /Retry feedback/);
});

test('the level test retries inside its speaking step and only then hands the result on', async () => {
  const { request } = loadRequest([
    { status: 409, body: { error: 'evaluation_in_progress' } },
    { status: 200, body: evaluation },
  ]);
  const state = { stage: 'session', failure: null, completed: [] };
  const context = {
    session: { sessionToken: 'sp_level' }, retrying: false,
    requestSpeakingEvaluation: request,
    setRetrying() {}, setEvalFailure: (v) => { state.failure = v; }, setStage: (v) => { state.stage = v; },
    onComplete: (v) => state.completed.push(v),
  };
  const handlers = [
    cut(LEVEL_TEST, 'const handleEvaluationFailed = (failure) => {', '\n  };') + '\n  };',
    cut(LEVEL_TEST, 'const handleSessionComplete = (result) => {', '\n  };') + '\n  };',
    cut(LEVEL_TEST, 'const retryEvaluation = async () => {', '\n  };') + '\n  };',
  ].join('\n');
  const { handleSessionComplete, retryEvaluation } = vm.runInNewContext(
    `${handlers}\n({ handleSessionComplete, retryEvaluation });`, context);

  handleSessionComplete({ evaluation_failed: true, message: 'Auswertung konnte nicht erstellt werden.' });
  assert.equal(state.stage, 'eval_failed', 'an unusable grade is not passed on as a speaking score');
  assert.deepEqual(state.completed, []);
  await retryEvaluation();
  assert.deepEqual(state.completed, [], '409: not yet');
  assert.equal(state.failure.code, 'evaluation_in_progress');
  await retryEvaluation();
  assert.deepEqual(state.completed, [evaluation], 'the placement result reaches LevelTest once it exists');
  assert.match(LEVEL_TEST, /onEvaluationFailed=\{handleEvaluationFailed\}/);
  assert.match(LEVEL_TEST, /<Button variant="secondary" onClick=\{onSkip\}>Skip Speaking<\/Button>/, 'skipping stays possible');
});

test('a reply that arrives after the learner left is never played', async () => {
  const inner = cut(SESSION, 'async (audioBase64, mimeType) => {', ', [sessionToken, endSession, playAudio]);');
  for (const alive of [true, false]) {
    const played = [];
    const postTurn = vm.runInNewContext(`(${inner})`, {
      setRecordState() {}, setTurnError() {}, setTtsWarning() {}, setNoSpeech() {}, setMessages() {},
      getAuthHeaders: async () => ({}), console: quiet, JSON,
      fetch: async () => ({ ok: true, status: 200, json: async () => ({ userTranscript: 'Hallo', replyText: 'Hallo!', replyAudioBase64: 'audio' }) }),
      sessionToken: 'sp_1', messagesRef: { current: [] }, lastReplyAudioRef: { current: null },
      endingRef: { current: false }, aliveRef: { current: alive },
      playAudio: (audio) => played.push(audio), endSession() {},
    });
    await postTurn('YWJj', 'audio/webm');
    assert.deepEqual(played, alive ? ['audio'] : [], alive ? 'on screen: plays' : 'after unmount: silent');
  }
  // alive is set by the mount effect and cleared by its cleanup — never endingRef,
  // which StrictMode's double mount would leave set and so silence every reply.
  assert.match(SESSION, /aliveRef\.current = true;\s*return \(\) => \{ aliveRef\.current = false; \};/);
  assert.doesNotMatch(cut(SESSION, 'useEffect(() => {\n    if (opening?.audioBase64)', '}, []);'), /endingRef/);
});

test('/speaking renders its head in every branch, including the signed-out screen', () => {
  assert.match(PAGE, /const seo = <SEO \{\.\.\.seoProps\('\/speaking'\)\} \/>;/);
  assert.equal((PAGE.match(/<SEO\b/g) || []).length, 1, 'one head element, reused');
  const guest = cut(PAGE, 'if (!user) {', '\n  }\n');
  assert.match(guest, /\{seo\}/, 'the signed-out screen');
  for (const branch of ["if (phase === 'session' && session) {", "if (phase === 'eval_failed') {", "if (phase === 'results' && evaluation) {", '// ---- setup screen ----']) {
    const block = cut(PAGE, branch, 'return (');
    const after = PAGE.slice(PAGE.indexOf(block) + block.length, PAGE.indexOf(block) + block.length + 200);
    assert.match(after, /\{seo\}/, `${branch} renders the head`);
  }
});

test('the session view scrolls on a new message only, to keep the newest reply and the record button on screen', () => {
  const effect = cut(SESSION, 'controlsRef.current?.scrollIntoView', '}, [messages.length]);');
  assert.match(effect, /block: 'nearest'/, 'no more block "start": the reply is never pushed above the fold');
  assert.doesNotMatch(SESSION, /\}, \[messages, recordState\]\)/, 'a tap to record no longer scrolls');
  assert.match(SESSION, /<div ref=\{controlsRef\} className="[^"]*scroll-mb-20 lg:scroll-mb-0/, 'clears the mobile tab bar');
  assert.match(SESSION, /className="sticky top-16 z-10 flex-shrink-0 border-b border-rule bg-white"/, 'the countdown stays in view');
});
