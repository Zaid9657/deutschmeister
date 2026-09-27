import { useMemo, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import FeedbackSheet from '../lesson/FeedbackSheet.jsx';
import ReadAloudLine from '../lesson/ReadAloudLine.jsx';
import AudioButton from './AudioButton.jsx';
import InlineFeedback from './InlineFeedback.jsx';
import { ChoiceList, ChoiceSelect, TypedInput, TilesInput, MatchInput } from './ItemInputs.jsx';
import { gradeAnswer, attemptPayload, RESULT, acceptedOf } from './grade.js';
import { quoteOf, resolveText, speakerName } from './content.js';
import { useV2Strings, ltext } from './strings.js';

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
 *   allowReveal     offer „Lösung zeigen" before the first check (default: only in the retry)
 *   names           { speakerId: name } for read-aloud / audio labels
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
  allowReveal = false,
  names = null,
}) {
  const [lang, t] = useV2Strings();
  const [value, setValue] = useState(() => (item.type === 'error_correction' ? quoteOf(item.promptDe) || '' : ''));
  const [phase, setPhase] = useState('answering'); // answering | retry | done
  const [outcome, setOutcome] = useState(null); // { result, expected, revealed }
  const typoSeen = useRef(false);
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
      return item.options.map((o) => ({ value: o, label: o }));
    }
    return null;
  }, [item, block, texts, t]);

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
    const r = gradeAnswer(item, answer);
    if (r.result === RESULT.TYPO && retryAllowed && phase === 'answering') {
      typoSeen.current = true;
      setOutcome({ result: RESULT.TYPO, reason: r.reason || null });
      setPhase('retry');
      if (inputRef.current) inputRef.current.focus();
      return;
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
      />
    );
  } else if (kind === 'select') {
    answerArea = (
      <>
        <ChoiceSelect id={`sel-${item.id}`} options={choiceSet} picked={value || null} onPick={(v) => setValue(v || '')} resolved={done} disabled={done} />
        {done && outcome && outcome.result === RESULT.WRONG && (
          <p className="mt-2 text-[0.875rem] text-graphite">
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

  const body = (
    <>
      {promptText && (
        <p
          className={compact
            ? 'text-[1rem] font-semibold leading-snug text-ink'
            : 'font-display text-[1.25rem] font-semibold leading-snug text-ink sm:text-[1.375rem]'}
          lang="de"
        >
          <Prompt text={promptText} />
        </p>
      )}
      {promptEn && <p className="mt-1 text-[0.875rem] leading-snug text-graphite">{promptEn}</p>}
      {textRefObj && textRefObj.kind !== 'audio' && !compact && (
        <div className="mt-3 rounded-clay border border-rule bg-paper-sunk p-3 text-[0.9375rem] leading-relaxed text-ink" lang="de">
          {textRefObj.title && <p className="font-bold">{textRefObj.title}</p>}
          {textRefObj.text && <p className="whitespace-pre-line">{textRefObj.text}</p>}
        </div>
      )}
      {audioLine && kind !== 'readaloud' && (
        <div className="mt-3">
          <AudioButton unitId={uid} line={audioLine} rate={item.type === 'dictation' || item.type === 'notes' ? 0.85 : undefined} />
        </div>
      )}
      <div className={compact ? 'mt-3' : 'mt-5'}>{answerArea}</div>
      {hint.main && !done && phase !== 'retry' && (
        <p className="mt-2 text-[0.8125rem] text-graphite">{t('item.hint', { hint: hint.main })}</p>
      )}
      {phase === 'retry' && (
        <InlineFeedback retry message={t(outcome && outcome.reason === 'case' ? 'item.caseRetry' : 'item.typoRetry')} />
      )}
      {needsCheckButton && (
        <div className={`flex flex-wrap items-center justify-end gap-3 ${compact ? 'mt-3' : 'mt-6'}`}>
          {(phase === 'retry' || allowReveal) && (
            <button
              type="button"
              onClick={reveal}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-rule bg-white px-4 py-2 text-[0.875rem] font-bold text-graphite transition-colors duration-100 ease-snap hover:border-siegel hover:text-ink motion-reduce:transition-none"
            >
              <Eye className="h-4 w-4 shrink-0" aria-hidden="true" /> {t('item.showSolution')}
            </button>
          )}
          <Button onClick={() => submit()} size={compact ? 'md' : 'lg'} disabled={!canSubmit} className={compact ? '' : 'w-full sm:w-auto'}>
            {phase === 'retry' ? t('item.retry') : t('item.check')}
          </Button>
        </div>
      )}
      {done && outcome && !outcome.readAloud && !showSheet && (
        <InlineFeedback
          result={outcome.result}
          revealed={!!outcome.revealed}
          expected={outcome.result === RESULT.CORRECT ? null : outcome.expected}
          explanation={outcome.result === RESULT.CORRECT && compact ? null : item.explanation}
        />
      )}
      {done && outcome && outcome.readAloud && typeof onNext === 'function' && !compact && (
        <div className="mt-6 flex justify-end">
          <Button onClick={onNext} size="lg" className="w-full sm:w-auto">{t('item.next')}</Button>
        </div>
      )}
    </>
  );

  if (compact) {
    return <div className="py-4" data-item-id={item.id}>{body}</div>;
  }

  return (
    <div className={done && showSheet && !outcome?.readAloud ? 'pb-40 sm:pb-0' : ''} data-item-id={item.id}>
      {(index != null || requeued) && (
        <p className="flex flex-wrap items-center gap-2 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
          {index != null && total != null && <span>{t('item.of', { n: index + 1, total })}</span>}
          {requeued && <span className="rounded-pill bg-accent-aprikose-wash px-2 py-0.5 text-accent-aprikose-ink">{t('item.repeat')}</span>}
        </p>
      )}
      <Card className="mt-3 p-5 sm:p-6">{body}</Card>
      {showSheet && done && outcome && !outcome.readAloud && (
        <FeedbackSheet
          result={outcome.result}
          revealed={!!outcome.revealed}
          expected={outcome.result === RESULT.CORRECT ? null : outcome.expected}
          explanation={outcome.result === RESULT.CORRECT ? null : ex.main}
          otherExplanation={outcome.result === RESULT.CORRECT ? null : ex.other}
          primaryLabel={t('item.next')}
          onContinue={onNext}
        />
      )}
    </div>
  );
}

/** A prompt with its `___` gaps drawn as a gap, not as three underscores. */
function Prompt({ text }) {
  const parts = String(text || '').split(/_{3,}/);
  if (parts.length === 1) return text;
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && (
        <span className="mx-0.5 inline-block min-w-[3.5rem] border-b-2 border-ink align-baseline" aria-label="Lücke">&nbsp;</span>
      )}
    </span>
  ));
}
