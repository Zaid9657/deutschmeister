import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('a different listening level or exercise remounts the whole attempt', () => {
  const source = read('src/pages/Listening/ExercisePlayer.jsx');
  assert.match(source, /<ExerciseAttempt\s+key=\{`\$\{level\}\/\$\{exerciseNumber\}`\}/);
  const attempt = source.slice(source.indexOf('const ExerciseAttempt ='));
  assert.match(attempt, /useExerciseDetails\(level, exerciseNumber\)/);
  for (const state of ['answers', 'playsUsed', 'submitted', 'score', 'saving']) {
    assert.match(attempt, new RegExp(`const \\[${state},[^\\n]+useState`), `${state} must belong to the keyed attempt`);
  }
});

function audioHarness({ disabled = false } = {}) {
  const source = read('src/components/listening/AudioPlayer.jsx');
  const body = source.slice(source.indexOf('  const audioRef'), source.indexOf('  return (\n    <Card'));
  const states = [];
  const listeners = new Map();
  const counts = [];
  let cursor = 0;
  let plays = 0;
  const audio = {
    currentTime: 0,
    ended: false,
    play() { plays += 1; this.ended = false; },
    pause() {},
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
  };
  const context = {
    disabled,
    MAX_PLAYS: 3,
    onPlayCountChange: (count) => counts.push(count),
    useRef: () => ({ current: audio }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (value) => { states[index] = value; }];
    },
    useCallback: (fn) => fn,
    useEffect: (setup) => setup(),
  };
  return {
    audio,
    counts,
    get plays() { return plays; },
    end() { audio.ended = true; listeners.get('ended')(); },
    render() {
      cursor = 0;
      return runInNewContext(`(() => { ${body}; return { togglePlay, restart, playDisabled, restartDisabled }; })()`, context);
    },
  };
}

test('pausing the third listen still permits resuming its unfinished playback', () => {
  const h = audioHarness();
  h.render().togglePlay();
  h.end();
  h.render().togglePlay();
  h.end();
  h.render().togglePlay();
  h.audio.currentTime = 24;
  h.render().togglePlay();
  const paused = h.render();
  assert.equal(paused.playDisabled, false, 'resume must remain available after the last permitted start');
  assert.equal(paused.restartDisabled, true, 'restart would consume another listen');
  paused.togglePlay();
  assert.equal(h.audio.currentTime, 24, 'resume keeps the paused position');
  assert.equal(h.plays, 4);
  assert.deepEqual(h.counts, [1, 2, 3], 'resuming must not consume another listen');
  h.end();
  assert.equal(h.render().playDisabled, true, 'a fourth full listen is blocked');
  h.render().togglePlay();
  h.render().restart();
  assert.equal(h.plays, 4);
});

test('a disabled listening player cannot start playback', () => {
  const h = audioHarness({ disabled: true });
  assert.equal(h.render().playDisabled, true);
  h.render().togglePlay();
  h.render().restart();
  assert.equal(h.plays, 0);
  assert.deepEqual(h.counts, []);
});
