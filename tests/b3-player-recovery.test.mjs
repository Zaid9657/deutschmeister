import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canRetryReadAloud, canSelfConfirmReadAloud } from '../src/lib/lesson/readAloudControls.js';
import { selfConfirmedResult } from '../src/lib/lesson/readaloud.js';
import { isMicResult } from '../src/lib/checkpoint/buildCheckpoint.js';
import { recapReviewSchedule } from '../src/lib/review/recapSchedule.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('player waits for restored authentication and remounts the snapshot state when its owner changes', () => {
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  const wrapper = player.slice(player.indexOf('export function LessonPlayer('), player.indexOf('function LessonRun('));
  assert.match(wrapper, /const \{ user, loading \} = useAuth\(\)/);
  assert.match(wrapper, /if \(!props\.preview && loading\) \{\s*return/);
  assert.match(wrapper, /return <LessonRun key=\{user\?\.id \|\| 'guest'\} \{\.\.\.props\} \/>/);
  assert.doesNotMatch(wrapper, /readRun\(/, 'snapshot state only mounts inside the authenticated owner boundary');
  const run = player.slice(player.indexOf('function LessonRun('));
  assert.match(run, /const owner = user \? user\.id : null/);
  assert.match(run, /readRun\(curriculum\.level, lektion\.id, Date\.now\(\), owner\)/);
});

test('checkpoint capture errors expose an unassessed confirmation and keep the recording retry', () => {
  for (const micError of ['Permission denied', 'No microphone found', 'Device busy']) {
    assert.equal(canSelfConfirmReadAloud({ scoringPossible: true, phase: 'idle', canRetry: false, micError }), true, micError);
    for (const attempts of [0, 1, 2]) {
      assert.equal(canRetryReadAloud({ phase: 'idle', attempts, maxAttempts: 3, micError }), true, `retry after ${attempts} scored attempts`);
    }
  }
  assert.equal(canSelfConfirmReadAloud({ scoringPossible: true, phase: 'idle', canRetry: false, micError: null }), false);
  for (const phase of ['recording', 'scoring']) {
    assert.equal(canSelfConfirmReadAloud({ scoringPossible: true, phase, canRetry: false, micError: 'old error' }), false, phase);
  }
  assert.equal(canSelfConfirmReadAloud({ scoringPossible: false, phase: 'idle', canRetry: false }), true);
  assert.equal(canSelfConfirmReadAloud({ scoringPossible: true, phase: 'scored', canRetry: false }), true);
  assert.equal(canRetryReadAloud({ phase: 'scored', attempts: 3, maxAttempts: 3 }), false);
  const result = selfConfirmedResult(null, 0);
  assert.equal(result.usedMic, false);
  assert.equal(isMicResult(result), false, 'a capture failure never fabricates a checkpoint measurement');
  const line = read('src/components/lesson/ReadAloudLine.jsx');
  assert.match(line, /canSelfConfirmReadAloud\(\{ scoringPossible, phase, canRetry, micError \}\)/);
  assert.match(line, /canRetryReadAloud\(\{ phase, attempts, maxAttempts: MAX_ATTEMPTS, micError \}\)/);
  assert.match(line, /setMicError\(micErrorMessage\(err\)\)/);
});

test('guest recap reports failed storage and retries the retained run without recording it twice', () => {
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.match(player, /const durable = recordLocalLesson\(/);
  assert.match(player, /setSync\(durable \? 'local' : 'localFailed'\)/);
  const flush = player.slice(player.indexOf('const flush = useCallback'), player.indexOf('\n  useEffect', player.indexOf('const flush = useCallback')));
  assert.match(flush, /if \(!user\) \{\s*setSync\(retryLocalProgressSave\(\) \? 'local' : 'localFailed'\)/);
  assert.doesNotMatch(flush, /recordLocalLesson\(/);
  assert.match(read('src/components/lesson/RecapStage.jsx'), /sync === 'localFailed'\) && onRetrySync/);
  assert.match(read('src/lib/lesson/strings.js'), /'sync\.localFailed': 'This browser could not save your lesson/);
});

test('recap uses the saved review schedule for new, overdue, repeated and unsaved lessons', () => {
  const now = Date.parse('2026-10-22T12:00:00Z');
  assert.equal(recapReviewSchedule('2026-10-22T12:00:00Z', now).state, 'due', 'new cards are due immediately');
  assert.equal(recapReviewSchedule('2026-10-21T12:00:00Z', now).state, 'due');
  const existing = recapReviewSchedule('2026-11-12T08:30:00Z', now);
  assert.equal(existing.state, 'next');
  assert.equal(existing.date.toISOString(), '2026-11-12T08:30:00.000Z', 'a repeat keeps its actual future schedule');
  for (const missing of [null, undefined, '', 'invalid']) {
    assert.deepEqual(recapReviewSchedule(missing, now), { state: 'unscheduled', date: null });
  }
  const recap = read('src/components/lesson/RecapStage.jsx');
  assert.doesNotMatch(recap, /nextReviewDate/);
  assert.match(recap, /sync !== 'synced'/, 'query only after the run and cards have saved');
  assert.match(recap, /fetchLektionReviewDueAt\(user\.id, lektion, level\)/);
  assert.match(recap, /recapReviewSchedule\(reviewDueAt\)/);
});
