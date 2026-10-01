import { useMemo, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import ReadAloudLine from '../lesson/ReadAloudLine.jsx';
import AudioButton, { SourceBadge } from './AudioButton.jsx';
import CastAvatar from './CastAvatar.jsx';
import FeedbackSheetV2 from './FeedbackSheetV2.jsx';
import GameButton, { QuietButton } from './GameButton.jsx';
import { SpeechBubble, StickyAction } from './GameParts.jsx';
import InlineFeedback from './InlineFeedback.jsx';
import { ChoiceList, ChoiceSelect, TypedInput, TilesInput, MatchInput } from './ItemInputs.jsx';
import { gradeAnswer, attemptPayload, RESULT, acceptedOf } from './grade.js';
import { orderedOptions } from '../../lib/course-v2/unitPlan.js';
import { xpForItem } from '../../lib/course-v2/gamify.js';
import { correctionQuoteOf, quoteOf, recordedLine, resolveText, speakerName } from './content.js';
import { useV2Strings, ltext } from './strings.js';

/** The one-retry notice per checker reason: case, the value written with the word next to the gap, else spelling. */
const RETRY_NOTICE = Object.freeze({ case: 'item.caseRetry', 'number-only': 'item.numberOnlyRetry', 'word-only': 'item.wordOnlyRetry' });

/**
 * The instruction heading of a one-item screen, by item type — only where the prompt itself
 * is not already the instruction („Bilden Sie …", „Hören Sie …", „Korrigieren Sie …").
 */
const INSTRUCTION = Object.freeze({
  multiple_choice: 'ask.choose',
  abc: 'ask.choose',
  fill_blank: 'ask.fill',
  cloze: 'ask.fill',
  richtig_falsch: 'ask.tf',
});

/**
 * ItemView({ item, level, onResult }) — renders ONE item of any SCHEMA §3.1 type and
 * reports the answer once (shared contract, E1):
 *
 *   onResult({ itemId, stepId, correct, answer, errorTag, typo })
 *
 * The flow (BLUEPRINT §7.3 S3c): idle → answered → checked → correct | typo (ONE retry
 * for a typed answer) | wrong | revealed → continue. Feedback is text + icon + colour,
 * never colour alone, with the item's static explanation (SCHEMA §0 rule 4). „Lösung
 * zeigen" is the way out of the retry (and, with `allowReveal`, of a first look); a
 * reveal reports `correct: false` and is never counted as knowing the answer.
 *
 * Grading is one call, `gradeAnswer` (grade.js → src/lib/lesson/check.js with the item's
 * own options + `exact`). `onResult` fires when the item is RESOLVED — before the learner
 * presses „Weiter" — so a closed tab never loses an answer; `payload.correct` is the final
 * outcome, `payload.typo` says a slip happened on the way.
 *
 * The one-item screen (the course theme, 2026-09-29): an instruction heading, the prompt —
 * in a speech bubble next to the speaker when the item plays a line — chunky answer tiles,
 * the big „Prüfen" in the thumb zone, and the verdict as a bottom sheet (FeedbackSheetV2)
 * with the XP the answer earned (gamify.js xpForItem: 10 first try, 5 after a retry).
 *
 * Optional props (all additive to the contract):
 *   stepId          stamped into the payload
 *   unitId          audio manifest key (recordings), defaults to the item id's unit
 *   lines           Map line id → Line (content.lineIndex(unit)) for `audioLineRef`
 *   block           the enclosing ExamBlock: `choices` + `noMatchKey` for zuordnen /
 *                   insert / word-bank cloze, and its `texts` for `textRef`
 *   texts           extra ExamTexts to resolve `textRef` against (step level)
 *   compact         several items on one screen (exam block, check list): inline
 *                   feedback, a choice is checked on tap, no „Weiter"
 *   onNext          one-item screens: „Weiter" after the feedback (bottom sheet). Without
 *                   it the feedback is inline and the parent moves on.
 *   index, total, requeued   the eyebrow („Aufgabe 3 von 12", „+1 Wiederholung")
 *   repeat          'same' | 'similar' — the run asks this again (ItemRun's requeue): the
 *                   sheet says so after a miss
 *   allowReveal     offer „Lösung zeigen" before the first check (default: only in the retry)
 *   names           { speakerId: name } for read-aloud / audio labels
 *   attempt         the step's attempt (step.plan.attempt, default 1): a non-exam item's own
 *                   options are shown in the order unitPlan.orderedOptions seeds by unit + item +
 *                   attempt; an exam item (role 'exam', or inside `block`) keeps its authored order.
 *                   The answer is always the option string, never its position.
 */
export default function ItemView({
  item,
  level,
  onResult,
  stepId = null,
  unitId = null,
  lines = null,
  block = null,
  texts = null,
  compact = false,
  onNext = null,
  index = null,
  total = null,
  requeued = false,
  repeat = null,
  allowReveal = false,
  names = null,
  attempt = 1,
}) {
  const [lang, t] = useV2Strings();
  const [value, setValue] = useState(() => (item.type === 'error_correction' ? correctionQuoteOf(item.promptDe) || '' : ''));
  const [phase, setPhase] = useState('answering'); // answering | retry | done
  const [outcome, setOutcome] = useState(null); // { result, expected, revealed }
  const typoSeen = useRef(false);
  const typoAnswer = useRef(null); // the answer that earned the one retry
  const reported = useRef(false);
  const inputRef = useRef(null);

  const uid = unitId || String(item.id || '').replace(/-(ls\d|start|c\d|q\d).*$/, '') || level || null;
  const accepted = acceptedOf(item);
  const correctValue = accepted[0] ?? item.answer;
  const hint = ltext(item.hint, lang);

  // ---- options for choice-type items ----------------------------------------
  const choiceSet = useMemo(() => {
    const blockChoices = Array.isArray(block?.choices) ? block.choices : [];
    const usesBlock = (item.type === 'zuordnen' || item.type === 'insert' || (item.type === 'cloze' && !item.options)) && blockChoices.length > 0;
    if (usesBlock) {
      const pool = [...(block?.texts || []), ...(texts || [])];
      const opts = blockChoices.map((c) => {
        const txt = c.textRef ? resolveText(c.textRef, pool) : null;
        return { value: c.key, key: c.key, label: c.de || txt?.title || txt?.text || c.key };
      });
      if (block?.noMatchKey) opts.push({ value: block.noMatchKey, key: block.noMatchKey, label: t('item.noMatch', { key: block.noMatchKey }) });
      return opts;
    }
    if (Array.isArray(item.options) && item.options.length) {
      return orderedOptions(item, { unitId: uid, attempt, block }).map((o) => ({ value: o, label: o }));
    }
    return null;
  }, [item, block, texts, t, uid, attempt]);

  const kind = (() => {
    if (item.type === 'read_aloud') return 'readaloud';
    if (item.type === 'match' && Array.isArray(item.pairs)) return 'match';
    if (item.type === 'sentence_building' && Array.isArray(item.tiles)) return 'tiles';
    if (choiceSet) return choiceSet.length > 5 ? 'select' : 'choice';
    return 'typed';
  })();
  const retryAllowed = kind === 'typed';

  // ---- audio -------------------------------------------------------------------
  const audioLine = useMemo(() => {
    if (item.audioLineRef && lines && lines.get) return lines.get(item.audioLineRef) || null;
    if (item.type === 'listen_select') {
      const say = item.speak || quoteOf(item.promptDe) || item.answer;
      return say ? { id: `${item.id}-say`, de: say } : null;
    }
    return null;
  }, [item, lines]);
  // A listen-select prompt that quotes what is played shows „…" until it is answered:
  // the task is to hear it, and the punctuation of the quote would give it away.
  const maskQuote = item.type === 'listen_select' && !item.audioLineRef && !!quoteOf(item.promptDe);
  const promptText = maskQuote && phase !== 'done' ? String(item.promptDe).replace(quoteOf(item.promptDe), '…') : item.promptDe;

  // ---- resolution --------------------------------------------------------------
  const resolve = (next, answer, correct) => {
    setOutcome(next);
    setPhase('done');
    if (reported.current) return;
    reported.current = true;
    if (typeof onResult === 'function') {
      onResult(attemptPayload({ item, stepId, correct, answer, typo: typoSeen.current, revealed: !!next.revealed }));
    }
  };

  const submit = (override) => {
    if (phase === 'done') return;
    const answer = override != null ? override : value;
    if (!String(answer || '').trim()) return;
    let r = gradeAnswer(item, answer);
    if (r.result === RESULT.TYPO && retryAllowed && phase === 'answering') {
      typoSeen.current = true;
      typoAnswer.current = String(answer).trim();
      setOutcome({ result: RESULT.TYPO, reason: r.reason || null });
      setPhase('retry');
      if (inputRef.current) inputRef.current.focus();
      return;
    }
    // the retry is for fixing the slip: the same answer sent again is not a fix (a1.1-u08 r3 F03)
    if (phase === 'retry' && r.result === RESULT.TYPO && typoAnswer.current !== null && String(answer).trim() === typoAnswer.current) {
      r = { ...r, result: RESULT.WRONG };
    }
    if (r.result === RESULT.TYPO) typoSeen.current = true;
    const correct = r.result !== RESULT.WRONG;
    const shown = correct ? (typoSeen.current ? RESULT.TYPO : RESULT.CORRECT) : RESULT.WRONG;
    resolve({ result: shown, expected: r.expected || correctValue }, answer, correct);
  };

  const reveal = () => {
    if (phase === 'done') return;
    resolve({ result: RESULT.WRONG, expected: correctValue, revealed: true }, value, false);
  };

  const pick = (v) => {
    if (phase === 'done') return;
    setValue(v || '');
    if (compact && v) submit(v);
  };

  const onMatchComplete = (misses) => {
    if (misses > 0) typoSeen.current = true;
    resolve({ result: misses > 0 ? RESULT.TYPO : RESULT.CORRECT, expected: null }, '', misses === 0);
  };

  const onReadAloud = (r) => {
    // Verständlichkeit (word recognition), never an accent score; without a microphone
    // the learner confirms by themself, which is not evidence either way.
    const pct = r && typeof r.pct === 'number' ? r.pct : null;
    resolve({ result: pct == null || pct >= 0.6 ? RESULT.CORRECT : RESULT.WRONG, expected: null, readAloud: true }, pct == null ? '' : String(Math.round(pct * 100)), pct == null ? true : pct >= 0.6);
  };

  const done = phase === 'done';
  const canSubmit = String(value || '').trim().length > 0;
  const showSheet = !compact && typeof onNext === 'function';
  const ex = ltext(item.explanation, lang);
  const promptEn = item.promptEn && lang !== 'de' ? item.promptEn : null;
  const textRefObj = item.textRef ? resolveText(item.textRef, block?.texts, texts) : null;
  // the XP this answer earned, as the sheet shows it (the player adds the same number up)
  const gained = done && outcome && !outcome.revealed
    ? xpForItem({ correct: outcome.result !== RESULT.WRONG, firstTry: outcome.result === RESULT.CORRECT })
    : 0;

  // ---- the answer area -----------------------------------------------------------
  let answerArea = null;
  if (kind === 'choice') {
    answerArea = (
      <ChoiceList
        options={choiceSet}
        picked={value || null}
        onPick={pick}
        resolved={done}
        correctValue={correctValue}
        disabled={done}
        compact={compact}
      />
    );
  } else if (kind === 'select') {
    answerArea = (
      <>
        <ChoiceSelect id={`sel-${item.id}`} options={choiceSet} picked={value || null} onPick={(v) => setValue(v || '')} resolved={done} disabled={done} />
        {done && outcome && outcome.result === RESULT.WRONG && (
          <p className="mt-2 text-[0.9375rem] font-semibold text-game-muted">
            {t('fb.yours')} <strong lang="de">{value || '–'}</strong>
          </p>
        )}
      </>
    );
  } else if (kind === 'tiles') {
    answerArea = <TilesInput itemId={item.id} tiles={item.tiles} onChange={setValue} disabled={done} />;
  } else if (kind === 'match') {
    answerArea = <MatchInput itemId={item.id} pairs={item.pairs} onComplete={onMatchComplete} disabled={done} />;
  } else if (kind === 'readaloud') {
    answerArea = done ? null : (
      <ReadAloudLine
        lektionId={uid}
        lineKey={item.id}
        text={item.answer}
        speaker={audioLine ? speakerName(audioLine.speaker, names) : null}
        onResult={onReadAloud}
      />
    );
  } else {
    answerArea = (
      <TypedInput
        id={`answer-${item.id}`}
        inputRef={inputRef}
        value={value}
        onChange={setValue}
        onSubmit={() => submit()}
        disabled={done}
        multiline={item.type === 'error_correction' && String(value).length > 60}
      />
    );
  }

  const needsCheckButton = !done && kind !== 'match' && kind !== 'readaloud' && !(compact && kind === 'choice');
  // a picked choice shows in the prompt's one gap, the way the sentence will read
  const gapFill = (kind === 'choice' || kind === 'select') && value ? { text: value, tone: !done ? 'picked' : outcome && outcome.result !== RESULT.WRONG ? 'right' : 'wrong' } : null;

  if (compact) {
    return (
      <div className="py-4" data-item-id={item.id}>
        {promptText && (
          <p className="text-[1.0625rem] font-bold leading-snug text-game-text" lang="de">
            <Prompt text={promptText} fill={gapFill} t={t} />
          </p>
        )}
        {promptEn && <p className="mt-1 text-[0.875rem] leading-snug text-game-muted">{promptEn}</p>}
        {audioLine && kind !== 'readaloud' && (
          <div className="mt-3">
            <AudioButton unitId={uid} line={audioLine} rate={item.type === 'dictation' || item.type === 'notes' ? 0.85 : undefined} />
          </div>
        )}
        <div className="mt-3">{answerArea}</div>
        {hint.main && !done && phase !== 'retry' && (
          <p className="mt-2 text-[0.875rem] font-semibold text-game-muted">{t('item.hint', { hint: hint.main })}</p>
        )}
        {phase === 'retry' && (
          <InlineFeedback retry message={t(RETRY_NOTICE[outcome && outcome.reason] || 'item.typoRetry')} />
        )}
        {needsCheckButton && (
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            {(phase === 'retry' || allowReveal) && (
              <QuietButton onClick={reveal}><Eye className="h-4 w-4 shrink-0" aria-hidden="true" /> {t('item.showSolution')}</QuietButton>
            )}
            <GameButton size="md" onClick={() => submit()} disabled={!canSubmit}>
              {phase === 'retry' ? t('item.retry') : t('item.check')}
            </GameButton>
          </div>
        )}
        {done && outcome && !outcome.readAloud && (
          <InlineFeedback
            result={outcome.result}
            revealed={!!outcome.revealed}
            expected={outcome.result === RESULT.CORRECT ? null : outcome.expected}
            explanation={outcome.result === RESULT.CORRECT ? null : item.explanation}
          />
        )}
      </div>
    );
  }

  const instruction = INSTRUCTION[item.type] ? t(INSTRUCTION[item.type]) : null;
  const speaker = audioLine && audioLine.speaker ? speakerName(audioLine.speaker, names) : null;
  const sheetOpen = showSheet && done && outcome && !outcome.readAloud;
  const promptBody = (
    <>
      {audioLine && kind !== 'readaloud' && (
        // the row wraps instead of widening the bubble (A11Y-03: 360 px at 125 % text); the slow
        // key's group is flex-1 with a min-content floor, so it stays beside the speaker key
        // wherever it fits and drops under it only where it does not. The source is said once,
        // here, since the speaker key is icon-only and the slow twin carries no badge (CT-09).
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <AudioButton
            unitId={uid}
            line={audioLine}
            iconOnly
            size="lg"
            rate={item.type === 'dictation' || item.type === 'notes' ? 0.85 : undefined}
            ariaLabel={speaker ? `${t('audio.play')}: ${speaker}` : t('audio.play')}
          />
          <div className="flex min-w-min flex-1 flex-wrap items-center gap-x-3 gap-y-1">
            <AudioButton unitId={uid} line={audioLine} label={t('audio.slow')} rate={0.7} size="sm" />
            <SourceBadge recorded={recordedLine(uid, audioLine.id)} />
          </div>
        </div>
      )}
      {promptText && (
        <p className={`${instruction ? 'text-[1.25rem]' : 'text-[1.375rem]'} font-extrabold leading-snug text-game-text [hyphens:auto] sm:text-[1.5rem]`} lang="de">
          <Prompt text={promptText} fill={gapFill} t={t} />
        </p>
      )}
      {promptEn && <p className="mt-1.5 text-[0.9375rem] font-semibold leading-snug text-game-muted">{promptEn}</p>}
    </>
  );

  return (
    <div className={sheetOpen ? 'pb-80 sm:pb-0' : needsCheckButton ? 'pb-36 sm:pb-0' : ''} data-item-id={item.id}>
      {(index != null || requeued) && (
        <p className="flex flex-wrap items-center gap-2 text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted">
          {index != null && total != null && <span>{t('item.of', { n: index + 1, total })}</span>}
          {requeued && <span className="rounded-lg bg-accent-aprikose-wash px-2 py-0.5 text-accent-aprikose-ink">{t('item.repeat')}</span>}
        </p>
      )}
      {instruction && <h2 className="mt-2 text-[1.5rem] font-extrabold leading-tight text-game-text sm:text-[1.625rem]">{instruction}</h2>}
      <div className="mt-4">
        {speaker ? (
          <div className="flex items-end gap-3">
            <CastAvatar name={speaker} size={76} className="shrink-0" />
            <SpeechBubble tail="left" className="min-w-0 flex-1">{promptBody}</SpeechBubble>
          </div>
        ) : audioLine ? (
          <SpeechBubble tail={null}>{promptBody}</SpeechBubble>
        ) : (
          promptBody
        )}
      </div>
      {textRefObj && textRefObj.kind !== 'audio' && (
        <div className="mt-4 rounded-2xl border-2 border-game-line bg-white p-4 text-[1rem] leading-relaxed text-game-text" lang="de">
          {textRefObj.title && <p className="font-extrabold">{textRefObj.title}</p>}
          {textRefObj.text && <p className="whitespace-pre-line">{textRefObj.text}</p>}
        </div>
      )}
      <div className="mt-6">{answerArea}</div>
      {hint.main && !done && phase !== 'retry' && (
        <p className="mt-3 text-[0.9375rem] font-semibold text-game-muted">{t('item.hint', { hint: hint.main })}</p>
      )}
      {phase === 'retry' && (
        <InlineFeedback retry message={t(RETRY_NOTICE[outcome && outcome.reason] || 'item.typoRetry')} />
      )}
      {needsCheckButton && (
        <StickyAction>
          {(phase === 'retry' || allowReveal) && (
            <QuietButton onClick={reveal}><Eye className="h-4 w-4 shrink-0" aria-hidden="true" /> {t('item.showSolution')}</QuietButton>
          )}
          <GameButton onClick={() => submit()} disabled={!canSubmit}>
            {phase === 'retry' ? t('item.retry') : t('item.check')}
          </GameButton>
        </StickyAction>
      )}
      {done && outcome && !outcome.readAloud && !showSheet && (
        <InlineFeedback
          result={outcome.result}
          revealed={!!outcome.revealed}
          expected={outcome.result === RESULT.CORRECT ? null : outcome.expected}
          explanation={item.explanation}
        />
      )}
      {done && outcome && outcome.readAloud && typeof onNext === 'function' && (
        <div className="mt-8">
          <GameButton onClick={onNext}>{t('item.next')}</GameButton>
        </div>
      )}
      {sheetOpen && (
        <FeedbackSheetV2
          result={outcome.result}
          revealed={!!outcome.revealed}
          expected={outcome.result === RESULT.CORRECT ? null : outcome.expected}
          explanation={outcome.result === RESULT.CORRECT ? null : ex.main}
          otherExplanation={outcome.result === RESULT.CORRECT ? null : ex.other}
          xp={gained}
          seed={item.id}
          repeat={outcome.result === RESULT.WRONG ? repeat : null}
          onContinue={onNext}
        />
      )}
    </div>
  );
}

/**
 * A prompt with its `___` gaps drawn as a gap, not as three underscores. `fill` (a picked
 * choice) shows in a prompt's single gap, in the tone of its state.
 */
const GAP_TONE = {
  empty: 'border-course text-course-ink',
  picked: 'border-course text-course-ink',
  right: 'border-game-right text-game-right-ink',
  wrong: 'border-game-wrong text-game-wrong-ink',
};

function Prompt({ text, fill = null, t }) {
  const parts = String(text || '').split(/_{3,}/);
  if (parts.length === 1) return text;
  const single = parts.length === 2;
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && (
        single && fill ? (
          <span className={`mx-0.5 inline-block min-w-[4.5rem] border-b-[3px] border-dashed px-1.5 text-center align-baseline ${GAP_TONE[fill.tone] || GAP_TONE.picked}`}>{fill.text}</span>
        ) : (
          <span className={`mx-0.5 inline-block min-w-[4.5rem] border-b-[3px] border-dashed align-baseline ${GAP_TONE.empty}`}>
            &nbsp;<span className="sr-only">{t('item.gapBlank')}</span>
          </span>
        )
      )}
    </span>
  ));
}
