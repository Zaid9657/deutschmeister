import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { allQuestionsAnswered, calculateScore } from '../src/utils/listeningHelpers.js';

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

// The player's state-and-handlers section runs in a VM with stand-in hooks. `play` decides what
// audio.play() does: a value (resolves) or a function that throws/rejects. togglePlay and restart
// await play(), so every call is awaited before the next one.
function audioHarness({ disabled = false, review = false, play } = {}) {
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
    play() {
      if (play) return play();
      plays += 1;
      this.ended = false;
      return undefined;
    },
    pause() {},
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
  };
  const context = {
    disabled,
    review,
    MAX_PLAYS: 3,
    onPlayCountChange: (count) => counts.push(count),
    useRef: () => ({ current: audio }),
    useTranslation: () => ({ i18n: { language: 'de' } }),
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
    listeners,
    get plays() { return plays; },
    end() { audio.ended = true; listeners.get('ended')(); },
    render() {
      cursor = 0;
      return runInNewContext(`(() => { ${body}; return { togglePlay, restart, playDisabled, restartDisabled, isPlaying, playFailed, canPlay }; })()`, context);
    },
  };
}

test('pausing the third listen still permits resuming its unfinished playback', async () => {
  const h = audioHarness();
  await h.render().togglePlay();
  h.end();
  await h.render().togglePlay();
  h.end();
  await h.render().togglePlay();
  h.audio.currentTime = 24;
  await h.render().togglePlay();
  const paused = h.render();
  assert.equal(paused.playDisabled, false, 'resume must remain available after the last permitted start');
  assert.equal(paused.restartDisabled, true, 'restart would consume another listen');
  await paused.togglePlay();
  assert.equal(h.audio.currentTime, 24, 'resume keeps the paused position');
  assert.equal(h.plays, 4);
  assert.deepEqual(h.counts, [1, 2, 3], 'resuming must not consume another listen');
  h.end();
  assert.equal(h.render().playDisabled, true, 'a fourth full listen is blocked');
  await h.render().togglePlay();
  await h.render().restart();
  assert.equal(h.plays, 4);
});

test('a disabled listening player cannot start playback', async () => {
  const h = audioHarness({ disabled: true });
  assert.equal(h.render().playDisabled, true);
  await h.render().togglePlay();
  await h.render().restart();
  assert.equal(h.plays, 0);
  assert.deepEqual(h.counts, []);
});

test('a play() that fails spends none of the three plays and shows no playing state (C-080/C-093)', async () => {
  let fail = true;
  let started = 0;
  const h = audioHarness({
    play() {
      if (fail) return Promise.reject(new DOMException('The element has no supported sources.', 'NotSupportedError'));
      started += 1;
      return Promise.resolve();
    },
  });
  await h.render().togglePlay();
  let view = h.render();
  assert.deepEqual(h.counts, [], 'a rejected start is not a play');
  assert.equal(view.isPlaying, false, 'no equaliser over silence');
  assert.equal(view.playFailed, true, 'the learner is told the try did not count');
  await view.restart();
  await h.render().restart();
  assert.deepEqual(h.counts, [], 'nor do failed restarts');
  assert.equal(h.render().canPlay, true, 'all three plays are still there');
  fail = false;
  await h.render().togglePlay();
  view = h.render();
  assert.equal(started, 1);
  assert.deepEqual(h.counts, [1], 'the first real start counts once');
  assert.equal(view.isPlaying, true);
  assert.equal(view.playFailed, false);
  const source = read('src/components/listening/AudioPlayer.jsx');
  assert.match(source, /Die Wiedergabe ist nicht gestartet\. Bitte erneut versuchen — dieser Versuch zählt nicht\./);
});

test('the playing state follows the element: an OS pause or a network error stops the equaliser', async () => {
  const h = audioHarness({ play: () => Promise.resolve() });
  await h.render().togglePlay();
  assert.equal(h.render().isPlaying, true);
  h.listeners.get('pause')();
  assert.equal(h.render().isPlaying, false);
  await h.render().togglePlay(); // resume: the play-through is unfinished, so it is free
  assert.equal(h.render().isPlaying, true);
  h.listeners.get('error')();
  assert.equal(h.render().isPlaying, false);
  assert.deepEqual(h.counts, [1]);
});

test('the after-submit review player is not rationed: no cap, nothing counted (X-084)', async () => {
  const h = audioHarness({ review: true });
  for (let i = 0; i < 5; i++) {
    await h.render().restart();
    h.end();
  }
  assert.equal(h.plays, 5);
  assert.deepEqual(h.counts, [], 'the attempt\'s plays_used is not touched');
  assert.equal(h.render().restartDisabled, false);
  const results = read('src/components/listening/ResultsView.jsx');
  assert.match(results, /\{audioUrl && \([\s\S]*?<AudioPlayer src=\{audioUrl\} review \/>/);
  assert.ok(results.indexOf('<AudioPlayer') < results.indexOf('<DialogueTranscript'), 'the player sits by the transcript');
  assert.match(read('src/pages/Listening/ExercisePlayer.jsx'), /<ResultsView[\s\S]*?audioUrl=\{audioUrl\}/);
});

// ── dictation answers (C-174) ───────────────────────────────────────────

const questionCard = read('src/components/listening/QuestionCard.jsx');
const player = read('src/pages/Listening/ExercisePlayer.jsx');

/** ExercisePlayer's real handleAnswer over a plain answers object. */
function answerHarness(initial = {}) {
  const start = player.indexOf('  const handleAnswer = ');
  const end = player.indexOf('\n  };\n', start) + '\n  };\n'.length;
  const state = { answers: initial, submitted: false };
  const handleAnswer = runInNewContext(`(() => { ${player.slice(start, end)} return handleAnswer; })()`, {
    get submitted() { return state.submitted; },
    setAnswers: (update) => { state.answers = typeof update === 'function' ? update(state.answers) : update; },
  });
  return { state, handleAnswer };
}

/** QuestionCard's real dictation onChange handler, wired to that handleAnswer. */
function dictationField(questionKey, onAnswer) {
  const handler = questionCard.match(/onChange=\{(\(e\) => \{ setDraft\(e\.target\.value\); onAnswer\(questionKey, e\.target\.value\.trim\(\)\); \})\}/);
  assert.ok(handler, 'the dictation input registers its text on every change');
  const field = { draft: '' };
  const onChange = runInNewContext(`(${handler[1]})`, {
    setDraft: (value) => { field.draft = value; },
    onAnswer,
    questionKey,
  });
  return { field, type: (value) => onChange({ target: { value } }) };
}

test('the graded dictation answer is always the text the field shows — an edit after typing is never dropped', () => {
  // A1.2 Übung 4 q23 'Wann beginnt der Tanzkurs?': the learner first types 19:30, replays, corrects to 18.
  const questions = [
    { id: 'q1', question_type: 'multiple_choice', correct_answer: 'a', options: ['a) Ja', 'b) Nein'] },
    { id: 'q23', question_type: 'dictation', correct_answer: '18', acceptable_answers: ['18', 'achtzehn'] },
  ];
  const { state, handleAnswer } = answerHarness();
  handleAnswer('q1', 'a) Ja');
  const q23 = dictationField('q23', handleAnswer);
  q23.type('19:30');
  q23.type('18 ');
  assert.equal(q23.field.draft, '18 ', 'the field keeps what was typed');
  assert.equal(state.answers.q23, '18', 'the answer is the visible text, trimmed');
  assert.equal(allQuestionsAnswered(questions, state.answers), true, 'no hidden "Prüfen" step blocks submission');
  assert.equal(calculateScore(questions, state.answers), 100, 'the correction is what gets graded');
  // A cleared field is no answer: "all answered" counts keys, so submission waits again.
  q23.type('   ');
  assert.ok(!('q23' in state.answers));
  assert.equal(allQuestionsAnswered(questions, state.answers), false);
  // After submission nothing changes any more.
  q23.type('17');
  state.submitted = true;
  q23.type('16');
  assert.equal(state.answers.q23, '17');
});

test('the dictation card has no register button left, and the review shows the registered text', () => {
  assert.doesNotMatch(questionCard, />\s*Prüfen\s*</, 'no "Prüfen" button is rendered');
  assert.doesNotMatch(questionCard, /onClick=\{\(\) => draft\.trim\(\) && onAnswer/);
  assert.match(questionCard, /value=\{showResult \? \(selectedAnswer \|\| ''\) : draft\}/);
});

// ── one dialogue's questions together (C-176) ───────────────────────────

test('questions are listed dialogue by dialogue, numbered by position, in the attempt and in the review', () => {
  const sorter = player.match(/\[\.\.\.questions\]\.sort\((\(a, b\) => [^\n]+?)\),\n/);
  assert.ok(sorter, 'ExerciseAttempt builds one ordered copy');
  const compare = runInNewContext(`(${sorter[1]})`);
  // A1.1 Übung 1: q1-q10 → dialogues 1-10, q11-q20 → dialogues 1-10, the dictation q21-q23 → 2, 6, 9.
  const rows = [];
  for (let n = 1; n <= 23; n++) {
    const dialogue = n <= 10 ? n : n <= 20 ? n - 10 : { 21: 2, 22: 6, 23: 9 }[n];
    rows.push({ id: `q${n}`, question_number: n, dialogue_number: dialogue });
  }
  const ordered = [...rows].reverse().sort(compare).map((q) => q.question_number);
  assert.deepEqual(ordered.slice(0, 7), [1, 11, 2, 12, 21, 3, 13]);
  assert.deepEqual(ordered.slice(-5), [9, 19, 23, 10, 20], 'dialogue 9 keeps its dictation item');
  // Rows without a dialogue fall back to question order, after the placed ones.
  assert.deepEqual([{ question_number: 2 }, { question_number: 1, dialogue_number: 1 }, { question_number: 1 }].sort(compare).map((q) => q.question_number), [1, 1, 2]);
  assert.match(player, /\{orderedQuestions\.map\(\(q, i\) => \(\s*<QuestionCard/);
  assert.match(player, /<ResultsView[\s\S]*?questions=\{orderedQuestions\}/);
  // The badge is the position on the page, never the stored number (which would read 1, 11, 2 …).
  assert.equal((questionCard.match(/\{index \+ 1\}/g) || []).length, 2);
  assert.doesNotMatch(questionCard, /question\.question_number \|\| \(index \+ 1\)/);
});
