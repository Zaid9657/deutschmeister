import { useState, useEffect, useMemo } from 'react';
import { courseForLevel, eur, PLANS } from '../data/pricing.js';
import { FREE_LEVEL_LABEL, TRIAL_DAYS } from '../data/marketing.js';
import { levelToSlug } from '../data/courseContents.js';
import { sameAnswer } from '../data/sameAnswer.js';

// Cheap synchronous check for a stored Supabase session, so the logged-out
// majority never fetches the Supabase client chunk.
function hasStoredSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && /^sb-.*-auth-token$/.test(k)) return true;
    }
  } catch { /* ignore */ }
  return false;
}

const ICONS = {
  correct: '✓',
  wrong: '✗',
};

// Playful Depth vocabulary (docs/design/playbook.md), Tailwind classes only —
// this file is scanned by the Astro tailwind config. Rule 3: an answer you can
// still choose is RAISED and depresses on press; once answered, every option
// goes flat (nothing left to press). Correct = limette + ✓, wrong = himbeer + ✗
// — never colour alone. Rule 2: `siegel` is the only interactive colour; the
// `celebrate` (himbeer) button appears only on a perfect run.
const BTN =
  'inline-flex select-none items-center justify-center gap-2 rounded-clay font-bold transition-all duration-100 ease-snap';
const BTN_PRIMARY = `${BTN} bg-siegel px-5 py-2.5 text-sm text-white shadow-raise-siegel hover:bg-siegel-lift active:translate-y-1 active:shadow-none`;
const BTN_PRIMARY_LG = `${BTN} bg-siegel px-7 py-3.5 text-base text-white shadow-raise-siegel hover:bg-siegel-lift active:translate-y-1 active:shadow-none`;
const BTN_CELEBRATE = `${BTN} bg-accent-himbeer px-7 py-3.5 text-base text-ink shadow-raise-himbeer hover:brightness-105 active:translate-y-1 active:shadow-none`;
// Secondary action on the results card. Flat by rule 3 (nothing to press home)
// and siegel-on-paper by rule 2, so the forward action keeps the only raised button.
const BTN_QUIET = `${BTN} px-5 py-2.5 text-sm text-siegel hover:text-siegel-deep`;

const OPTION_BASE =
  'w-full rounded-clay border px-4 py-3 text-left text-[0.9375rem] font-semibold transition-all duration-100 ease-snap';
const OPTION_IDLE =
  'border-rule bg-white text-ink shadow-raise hover:border-siegel hover:text-siegel-deep active:translate-y-1 active:shadow-none';
const OPTION_CORRECT = 'border-accent-limette bg-accent-limette-wash text-accent-limette-ink shadow-none';
const OPTION_WRONG = 'border-accent-himbeer bg-accent-himbeer-wash text-accent-himbeer-ink shadow-none';
const OPTION_MUTED = 'border-rule bg-paper-sunk text-graphite shadow-none';

// Dealing order. The stored order put the correct option first in 34% of the
// four-option items, and "Practice again" replayed the identical sequence right
// after the corrections — rewarding a remembered position, not the grammar.
// Seeded, not Math.random, where it decides the first render: the island is
// client:visible, so React hydrates the HTML the build rendered, and a
// different order on each side would be a hydration mismatch.
function seededRandom(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(list, random = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// The order of the next run: shuffled, and never the order just played.
function nextRunOrder(previous, random = Math.random) {
  const order = shuffled(previous, random);
  if (order.length > 1 && order.every((item, i) => item === previous[i])) order.push(order.shift());
  return order;
}

function MultipleChoice({ exercise, onAnswer, answered, run = 0 }) {
  const [selected, setSelected] = useState(null);
  // Dealt once per question and run; the answer is compared by value, so the
  // order changes nothing else.
  const options = useMemo(
    () => shuffled(exercise.options ?? [], seededRandom(`${exercise.id}:${run}`)),
    [exercise, run],
  );

  const choose = (opt) => {
    if (answered) return;
    setSelected(opt);
    onAnswer(opt === exercise.correct_answer);
  };

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const isSelected = selected === opt;
        const isCorrect = opt === exercise.correct_answer;
        let cls = `${OPTION_BASE} `;
        if (!answered) {
          cls += OPTION_IDLE;
        } else if (isCorrect) {
          cls += `${OPTION_CORRECT} animate-pop-in`;
        } else if (isSelected) {
          cls += `${OPTION_WRONG} animate-wiggle`;
        } else {
          cls += OPTION_MUTED;
        }

        return (
          <button
            key={opt}
            onClick={() => choose(opt)}
            className={cls}
            disabled={answered}
            aria-pressed={isSelected}
          >
            <span className="flex items-center gap-3">
              {answered && isCorrect && (
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-pill bg-accent-limette font-data text-xs font-bold text-ink" aria-hidden="true">{ICONS.correct}</span>
              )}
              {answered && isSelected && !isCorrect && (
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-pill bg-accent-himbeer font-data text-xs font-bold text-ink" aria-hidden="true">{ICONS.wrong}</span>
              )}
              {opt}
              {answered && isCorrect && <span className="sr-only">(correct answer)</span>}
              {answered && isSelected && !isCorrect && <span className="sr-only">(your answer, incorrect)</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Forgiving comparison: case, whitespace, and umlaut/ß ASCII spellings
// (ä↔ae …) are equivalent. Mirrors src/utils/answerMatch.js in the SPA —
// NFC first, like it: a decomposed umlaut (u + ¨, from a paste or some
// keyboards) is the same letter (tests/exercise-player.test.mjs).
function normalizeAnswer(text) {
  return String(text ?? '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

function answerMatches(userInput, exercise) {
  const user = normalizeAnswer(userInput);
  if (!user) return false;
  const accepted = [exercise.correct_answer, ...(exercise.acceptable_answers ?? [])];
  return accepted.some((a) => normalizeAnswer(a) === user);
}

// What a typed answer is graded by: the literal match above, or a whole answer that is the same
// answer as the key — „Wieso" where the key says „Warum". That rule is the lesson checker's own,
// shared byte-identical (../data/sameAnswer.js ← src/data/sameAnswer.js), never a widened key.
function acceptsAnswer(userInput, exercise) {
  return answerMatches(userInput, exercise)
    || [exercise.correct_answer, ...(exercise.acceptable_answers ?? [])].some((a) => sameAnswer(a, userInput));
}

function FillBlank({ exercise, onAnswer, answered }) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!value.trim() || submitted) return;
    setSubmitted(true);
    onAnswer(acceptsAnswer(value, exercise));
  };

  const isCorrect = acceptsAnswer(value, exercise);

  // Placeholder-only labelling fails WCAG 3.3.2 (the label vanishes on input)
  // and leaves screen-reader users with an unnamed field. The exercise prompt
  // is the field's real label, so name the input from it.
  const inputId = `fill-blank-${exercise.id}`;
  const promptText = exercise.question_de || exercise.question_en || 'your answer';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={inputId} className="sr-only">
        {promptText}
      </label>
      <div className="relative min-w-0 flex-1">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={submitted}
          placeholder="Type your answer…"
          className={`w-full rounded-clay border px-4 py-3 text-[0.9375rem] transition-all placeholder:text-graphite focus:outline-none ${
            submitted
              ? isCorrect
                ? 'border-accent-limette bg-accent-limette-wash pr-11 text-accent-limette-ink'
                : 'border-accent-himbeer bg-accent-himbeer-wash pr-11 text-accent-himbeer-ink'
              : 'border-rule bg-white text-ink focus:border-siegel'
          }`}
        />
        {submitted && (
          <span
            className={`absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-pill font-data text-xs font-bold text-ink ${isCorrect ? 'bg-accent-limette' : 'bg-accent-himbeer'}`}
            aria-hidden="true"
          >
            {isCorrect ? ICONS.correct : ICONS.wrong}
          </span>
        )}
      </div>
      {!submitted && (
        <button onClick={submit} className={BTN_PRIMARY}>
          Check
        </button>
      )}
      {submitted && !isCorrect && (
        <span className="flex items-center px-1 text-sm text-graphite">
          → <strong className="ml-1 text-accent-limette-ink">{exercise.correct_answer}</strong>
        </span>
      )}
    </div>
  );
}

// The paywall, decided 2026-09-03 (docs/HANDOFF-2026-09-03.md §11): the rule
// text of every lesson stays public (the SEO asset), the EXERCISES above the
// free level need a live trial, Pro, or a bought level course — the same
// three doors as the SPA's hasLevelAccess. Signed-out visitors see the
// signup door first (7 days of Pro), signed-in ones the course they are
// missing. Prices derive from pricing.js; nothing here is retyped.
function LockedExercises({ level, signedIn, count, signupHref }) {
  const course = courseForLevel(level);
  const buyable = Boolean(course) && !course.comingSoon;
  const code = course?.code || level.toUpperCase();
  // The level's own course page (an Astro page, trailing slash): its Buy button
  // opens this course's checkout. /pricing/ opened on another course's ticket.
  const coursePage = `/courses/${levelToSlug(level.toLowerCase())}/`;
  // "Log in" names this page in ?next=, so login returns here, not to the
  // dashboard (src/lib/loginReturn.js). Set after mount: the lock also renders
  // at build time, with no location, and hydration keeps the built attribute.
  const [loginHref, setLoginHref] = useState('/login');
  useEffect(() => {
    setLoginHref(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }, []);
  const BTN = 'inline-flex select-none items-center justify-center gap-2 rounded-clay font-bold transition-all duration-100 ease-snap';
  const primary = `${BTN} bg-siegel px-6 py-3 text-sm text-white shadow-raise-siegel hover:bg-siegel-lift active:translate-y-1 active:shadow-none`;
  const secondary = `${BTN} border border-rule bg-white px-6 py-3 text-sm text-ink shadow-raise hover:border-siegel hover:text-siegel-deep active:translate-y-1 active:shadow-none`;
  return (
    <div className="text-center">
      <span className="inline-block rounded-pill bg-paper-sunk px-3 py-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
        {code} · {count} {count === 1 ? 'exercise' : 'exercises'}
      </span>
      <p className="mt-4 font-display text-[1.375rem] font-semibold leading-tight tracking-[-0.018em] text-ink">
        The rules are free. The practice is part of {code}.
      </p>
      <p className="mx-auto mt-2 max-w-md text-[0.9375rem] leading-relaxed text-graphite">
        {signedIn
          ? buyable
            ? `Your account does not include ${code} yet. Buy the ${code} course once and keep it, or go Pro for every level and the AI tools.`
            : `Your account does not include ${code} yet. The ${code} course is coming soon — Pro opens every level and the AI tools today.`
          : `${FREE_LEVEL_LABEL} is free with no account. A free account adds ${TRIAL_DAYS} days of Pro — every level, every exercise — before you decide.`}
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {signedIn ? (
          <>
            {buyable && (
              <a href={coursePage} className={primary}>
                Buy the {code} course — {eur(course.price)} once
              </a>
            )}
            <a href="/pricing/#pro" className={buyable ? secondary : primary}>
              Go Pro — {eur(PLANS.monthly.price)}/month
            </a>
          </>
        ) : (
          <>
            <a href={signupHref} className={primary}>
              Start free — {TRIAL_DAYS} days of Pro included
            </a>
            <a href={loginHref} className={secondary}>
              Log in
            </a>
          </>
        )}
      </div>
      {!signedIn && buyable && (
        <p className="mt-4 text-sm text-graphite">
          <a href={coursePage} className="font-bold text-siegel hover:text-siegel-deep">
            Own {code} for {eur(course.price)}
          </a>{' '}
          — one payment, no subscription.
        </p>
      )}
    </div>
  );
}

// `signupHref` is the page's attributed signup door (astro-site/src/lib/onsiteLinks.js);
// the bare /signup is only a fallback for a caller that passes none.
export default function ExercisePlayer({ exercises, topicId, level, nextHref, nextTitle, signupHref = '/signup' }) {
  const isFreeLevel = !level || level.toLowerCase() === FREE_LEVEL_LABEL.toLowerCase();
  // 'open' | 'checking' | 'locked'
  const [access, setAccess] = useState(() => {
    if (isFreeLevel) return 'open';
    return hasStoredSession() ? 'checking' : 'locked';
  });
  const [signedIn, setSignedIn] = useState(() => !isFreeLevel && hasStoredSession());

  useEffect(() => {
    if (access !== 'checking') return;
    let cancelled = false;
    import('../lib/levelAccess.js')
      .then((m) => m.getLevelAccess(level))
      .then((r) => {
        if (cancelled) return;
        setSignedIn(r.signedIn);
        setAccess(r.open ? 'open' : 'locked');
      })
      .catch(() => {
        if (!cancelled) setAccess('locked');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access]);

  if (access === 'checking') {
    return <p className="text-sm italic text-graphite">Checking your access…</p>;
  }
  if (access === 'locked') {
    return <LockedExercises level={level} signedIn={signedIn} count={exercises?.length || 0} signupHref={signupHref} />;
  }
  return <ExerciseRun exercises={exercises} topicId={topicId} nextHref={nextHref} nextTitle={nextTitle} signupHref={signupHref} />;
}

function ExerciseRun({ exercises, topicId, nextHref, nextTitle, signupHref }) {
  // The order this run plays: the stored order first (what the build rendered),
  // a fresh one for every "Practice again". `run` re-deals the options too.
  const [order, setOrder] = useState(() => exercises ?? []);
  const [run, setRun] = useState(0);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState([]); // array of booleans
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [done, setDone] = useState(false);

  // On completion: surface the tally to the page's momentum block, and (for
  // signed-in users) record the run to user_grammar_progress — same shape the
  // SPA writes, so the dashboard's continue-state stays in sync. Fire-and-forget.
  useEffect(() => {
    if (!done || !exercises || exercises.length === 0) return;
    const total = exercises.length;
    const score = results.filter(Boolean).length;
    const pct = Math.round((score / total) * 100);
    try {
      window.dispatchEvent(new CustomEvent('grammar:done', { detail: { score, total, pct } }));
    } catch { /* ignore */ }
    if (topicId && hasStoredSession()) {
      import('../lib/grammarProgress.js')
        .then((m) => m.recordAttempt(topicId, pct))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (!exercises || exercises.length === 0) {
    return (
      <p className="text-sm italic text-graphite">No exercises available for this topic yet.</p>
    );
  }

  const exercise = order[current];
  const score = results.filter(Boolean).length;

  const handleAnswer = (correct) => {
    setAnswered(true);
    setShowExplanation(true);
    setResults((r) => [...r, correct]);
  };

  const next = () => {
    if (current + 1 >= exercises.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setAnswered(false);
      setShowExplanation(false);
    }
  };

  const restart = () => {
    setOrder((previous) => nextRunOrder(previous));
    setRun((r) => r + 1);
    setCurrent(0);
    setResults([]);
    setAnswered(false);
    setShowExplanation(false);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / exercises.length) * 100);
    // Pass = celebrate, fail = calm: the candy button is earned only by a perfect run.
    const perfect = score === exercises.length;
    return (
      <div className="animate-pop-in rounded-clay border border-rule bg-paper-sunk px-6 py-8 text-center">
        <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
          {score} of {exercises.length} correct
        </p>
        <div className={`mt-2 font-display text-[3.5rem] font-semibold leading-none tracking-[-0.02em] ${perfect ? 'text-accent-limette-ink' : 'text-ink'}`}>
          {pct}%
        </div>
        <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-pill bg-white" aria-hidden="true">
          <div className={`h-full rounded-pill transition-all duration-500 ease-snap ${perfect ? 'bg-accent-limette' : 'bg-siegel'}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mx-auto mt-4 mb-6 max-w-sm text-[0.9375rem] leading-relaxed text-graphite">
          {pct >= 70 ? "Excellent! You've got a good grasp of this topic." : pct >= 40 ? 'Good start — review the rules and try again.' : 'No problem — grammar takes practice. Start over!'}
        </p>
        {/* Forward motion is the primary action. 89% of learners reach this screen
            and the only button used to be "Practice again", which asks the one
            person who just succeeded to repeat themselves. The next topic is the
            raised button; practising again stays available, quietly. */}
        {/* Which action is primary follows the score, so the button agrees with
            the sentence above it: a weak run is told to practise again and was
            being handed a "Next" button, which is the opposite advice. 70% is
            the same threshold recordAttempt uses to mark a topic completed. */}
        {nextHref && pct >= 70 ? (
          <div className="flex flex-col items-center gap-1">
            <a href={nextHref} className={perfect ? BTN_CELEBRATE : BTN_PRIMARY_LG}>
              {nextTitle ? `Next: ${nextTitle}` : 'Next topic'} →
            </a>
            <button onClick={restart} className={BTN_QUIET}>
              Practice again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <button onClick={restart} className={BTN_PRIMARY_LG}>
              Practice again
            </button>
            {nextHref && (
              <a href={nextHref} className={BTN_QUIET}>
                {nextTitle ? `Skip to ${nextTitle}` : 'Skip to next topic'} →
              </a>
            )}
          </div>
        )}
        {/* Signed out, this run is recorded nowhere: recordAttempt above runs
            only with a stored session. Saying so is the honest offer, and the
            link carries the lesson (?ref=grammar) so the signup is traceable. */}
        {!hasStoredSession() && signupHref && (
          <p className="mx-auto mt-5 max-w-sm border-t border-rule pt-4 text-sm leading-relaxed text-graphite">
            This score is not saved without an account.{' '}
            <a href={signupHref} className="font-bold text-siegel hover:text-siegel-deep">
              Create a free account
            </a>{' '}
            to keep your progress — {TRIAL_DAYS} days of Pro included.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Progress — one siegel bar; the count is the accessible text */}
      <div className="mb-5">
        <p className="mb-2 font-data text-[0.8125rem] text-graphite">Question {current + 1} of {exercises.length}</p>
        <div className="h-2 w-full overflow-hidden rounded-pill bg-paper-sunk" role="progressbar" aria-valuemin={0} aria-valuemax={exercises.length} aria-valuenow={results.length} aria-label="Exercise progress">
          <div
            className="h-full rounded-pill bg-siegel transition-all duration-300 ease-snap"
            style={{ width: `${Math.round((results.length / exercises.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Question — the German sentence (with the blank) is the task; the
          English is the translation aid. Matches the SPA (GrammarLessonPage)
          which also prefers question_de. */}
      <p className="mb-1 font-display text-[1.1875rem] font-semibold leading-snug text-ink" lang="de">
        {exercise.question_de || exercise.question_en}
      </p>
      {exercise.question_de && exercise.question_en && (
        <p className="mb-4 text-sm italic text-graphite">{exercise.question_en}</p>
      )}
      {!(exercise.question_de && exercise.question_en) && <div className="mb-3" />}

      {/* Input */}
      {/* `key` is load-bearing, not decoration. Both inputs keep local state
          (FillBlank's `submitted`/`value`, MultipleChoice's `selected`), and
          without a key React reuses the same instance when one question is
          followed by another of the SAME type. FillBlank then stays `submitted`
          into the next question: the field is disabled, holds the previous
          answer, is marked wrong against a prompt the learner never saw, and
          renders no Check button — while the parent has reset `answered`, so
          there is no Next button either. The lesson dead-ends with no control
          on screen. Keying by exercise id remounts per question. */}
      {exercise.exercise_type === 'multiple_choice' ? (
        <MultipleChoice key={exercise.id ?? current} exercise={exercise} onAnswer={handleAnswer} answered={answered} run={run} />
      ) : (
        <FillBlank key={exercise.id ?? current} exercise={exercise} onAnswer={handleAnswer} answered={answered} />
      )}

      {/* Feedback — aria-live so screen readers hear the result, which is
          otherwise conveyed by colour alone */}
      <div aria-live="polite">
        {answered && (
          <p className="sr-only">
            {results[results.length - 1] ? 'Correct.' : `Incorrect. The correct answer is ${exercise.correct_answer}.`}
          </p>
        )}
        {showExplanation && exercise.explanation_en && (
          <div className="animate-pop-in mt-4 rounded-clay border border-rule bg-paper-sunk p-4 text-sm leading-relaxed text-ink">
            <strong className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">Explanation:</strong> {exercise.explanation_en}
          </div>
        )}
      </div>

      {/* Next */}
      {answered && (
        <div className="mt-4 flex justify-end">
          <button onClick={next} className={BTN_PRIMARY}>
            {current + 1 >= exercises.length ? 'See results →' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
