import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Volume2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { curriculumFor, curriculumPath } from '../../data/curricula/index.js';
import {
  buildCheckpoint,
  scoreCheckpoint,
  remediationSet,
  isItemCorrect,
  SECTION_LABELS,
  SECTION_ORDER,
  PASS_OVERALL_PCT,
  PASS_SECTION_PCT,
  WRITING_PASS_PCT,
  shuffle,
  mulberry32,
  hashSeed,
} from '../../lib/checkpoint/buildCheckpoint.js';
import GradedWriting from '../../components/lesson/GradedWriting.jsx';
import ReadAloudLine from '../../components/lesson/ReadAloudLine.jsx';
import { playLine } from '../../lib/lesson/speech.js';
import {
  fetchAttemptState,
  recordAttempt,
  ATTEMPT_LIMIT,
  ATTEMPT_WINDOW_HOURS,
} from '../../services/checkpointService.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import LangToggle from '../../components/lesson/LangToggle.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

// The checkpoint screen (standard §3): 20 items, one per screen, a thin
// progress bar, then a result that says what to do next. Design rules it
// follows: one primary action per screen, feedback as text + icon + colour
// (never colour alone), no hearts and no XP, legible at 360 px, and nothing
// that moves on its own — the only motion is the Button's own press.
//
// The item renderer below is deliberately small. The lesson engine's
// PracticeItem can replace it wholesale once it lands; the contract between
// them is the item shape from buildCheckpoint.js, nothing else.
//
// Chrome labels come from src/lib/lesson/strings.js in the chrome language
// (English by default, Deutsch-Modus on the header toggle). The SECTION names
// (Hören, Lesen, …) stay German in both: they are the parts of the exam.

const POOL_LOADERS = {
  'a1.1': () => import('../../data/lessonPools/a11.json'),
  'a1.2': () => import('../../data/lessonPools/a12.json'),
};

/**
 * Play a checkpoint item's audio: the recorded line when the manifest has one
 * (playLine → src/data/curricula/<level>.audio.js), the browser voice when not.
 * Items carry lektionId + lineKey from buildCheckpoint for exactly this.
 */
function speak(text, lektionId = null, lineKey = null) {
  if (!text) return;
  playLine(lektionId, lineKey, text, { rate: 0.9 });
}

/** One item, one screen. Typed input, option chips, dictation or self-confirm. */
function PracticeItem({ item, onAnswer }) {
  const [lang] = useLessonLang();
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  // A read-aloud or graded-writing result: the machine's verdict, or the
  // learner's own confirm when the machine was unavailable.
  const [pending, setPending] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue('');
    setFeedback(null);
    setPending(null);
    if (item.audioText && item.kind !== 'readAloud') speak(item.audioText, item.lektionId, item.lineKey);
    if (item.mode === 'typed') inputRef.current?.focus();
  }, [item.id, item.audioText, item.mode, item.kind, item.lektionId, item.lineKey]);

  const submit = (answer) => {
    if (feedback) return;
    const correct = isItemCorrect(item, answer);
    setFeedback({ correct, answer });
  };

  const advance = () => onAnswer(item, feedback?.answer ?? value);

  const header = (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Chip tone="label">{SECTION_LABELS[item.section] || item.section}</Chip>
      {item.register && <Chip tone="quiet">{t(item.register === 'formular' ? 'checkpoint.formular' : 'checkpoint.mitteilung', lang)}</Chip>}
      {item.hint && <span className="font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite">{item.hint}</span>}
    </div>
  );

  // Sprechen: the line is recorded and scored word by word (ReadAloudLine →
  // score-readaloud). A mic result enters the score; a self-confirm keeps the
  // whole Sprechen section out of it (buildCheckpoint's header says why).
  if (item.kind === 'readAloud') {
    return (
      <Card className="p-5 sm:p-6">
        {header}
        <p className="font-display text-lg leading-snug text-ink" lang="de">{item.promptDe}</p>
        {item.promptEn && <p className="mt-1 text-sm text-graphite">{item.promptEn}</p>}
        <div className="mt-4">
          <ReadAloudLine
            lektionId={item.lektionId}
            lineKey={item.lineKey}
            text={item.text || item.audioText}
            onResult={setPending}
          />
        </div>
        <p className="mt-3 text-xs text-graphite">
          {/* Deutsch-Modus: „Bewertet — Verständlichkeit zählt in Ihr Sprechen-Ergebnis." — the
              Sie-register line tests/checkpoint.test.mjs §6 pins; it lives in the string table now. */}
          {t(pending?.usedMic ? 'checkpoint.readAloudScored' : 'checkpoint.readAloudUnscored', lang)}
        </p>
        <Button
          className="mt-4"
          disabled={!pending}
          onClick={() => onAnswer(item, pending?.usedMic ? { usedMic: true, pct: pending.pct } : true)}
        >
          {t('action.next', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Card>
    );
  }

  // Schreiben: one of the three items is the chapter's real writing task, graded
  // on the Goethe criteria by evaluate-writing through GradedWriting — the same
  // component and the same request the lesson's Schreiben step makes.
  if (item.kind === 'gradedWriting') {
    // Only a real grader verdict is an answer. GradedWriting falls back to its
    // mechanical form check when the learner is signed out, over the allowance
    // or offline (`scored: false`); that is reported as "not attempted" and the
    // Schreiben section scores over its two drills instead (buildCheckpoint's
    // itemCounts). The task is shown either way.
    const verdict = pending && pending.scored === true && typeof pending.pct === 'number'
      ? { graded: true, pct: pending.pct }
      : null;
    return (
      <Card className="p-5 sm:p-6">
        {header}
        <p className="font-display text-lg leading-snug text-ink" lang="de">{item.promptDe}</p>
        {item.task?.taskEn && <p className="mt-1 text-sm text-graphite">{item.task.taskEn}</p>}
        <div className="mt-4">
          <GradedWriting task={item.task} lektionId={item.lektionId} onResult={setPending} />
        </div>
        <p className="mt-3 text-xs text-graphite">
          {verdict
            ? t('checkpoint.writingScored', lang, { pct: Math.round(WRITING_PASS_PCT * 100) })
            : t('checkpoint.writingUnscored', lang)}
        </p>
        <Button className="mt-4" disabled={!pending} onClick={() => onAnswer(item, verdict)}>
          {t('action.next', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Card>
    );
  }

  const isAudio = Boolean(item.audioText);

  return (
    <Card className="p-5 sm:p-6">
      {header}

      <p className="font-display text-lg leading-snug text-ink" lang="de">{item.promptDe}</p>
      {item.promptEn && <p className="mt-1 text-sm text-graphite">{item.promptEn}</p>}

      {isAudio && (
        <div className="mt-4">
          <Button variant="secondary" onClick={() => speak(item.audioText, item.lektionId, item.lineKey)}>
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            {t('action.listenAgain', lang)}
          </Button>
        </div>
      )}

      {item.text && (
        <Card tone="sunk" className="mt-4 p-4 text-[0.9375rem] leading-relaxed text-ink" lang="de">{item.text}</Card>
      )}

      {item.mode === 'options' && (
        <div className="mt-5 flex flex-wrap gap-2">
          {(item.options || []).map((option) => {
            const chosen = feedback?.answer === option;
            const isAnswer = option === item.answer;
            let tone = 'quiet';
            if (feedback && isAnswer) tone = 'limette';
            else if (feedback && chosen) tone = 'himbeer';
            return (
              <Chip
                key={option}
                size="md"
                tone={tone}
                raised={!feedback}
                onClick={feedback ? undefined : () => submit(option)}
              >
                {feedback && isAnswer && <Check className="h-4 w-4" aria-hidden="true" />}
                {feedback && chosen && !isAnswer && <X className="h-4 w-4" aria-hidden="true" />}
                {option}
              </Chip>
            );
          })}
        </div>
      )}

      {item.mode === 'typed' && (
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            submit(value);
          }}
        >
          <label className="sr-only" htmlFor={`answer-${item.id}`}>{t('practice.yourAnswer', lang)}</label>
          <input
            id={`answer-${item.id}`}
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={Boolean(feedback)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full rounded-clay border border-rule bg-white px-4 py-3 font-body text-base text-ink placeholder:text-graphite/60 disabled:bg-paper-sunk"
            placeholder={t('checkpoint.typedPlaceholder', lang)}
          />
          {!feedback && <Button type="submit" className="sm:w-auto">{t('action.check', lang)}</Button>}
        </form>
      )}

      {item.mode === 'confirm' && !feedback && (
        <div className="mt-5">
          <Button onClick={() => submit(true)}>
            <Check className="h-4 w-4" aria-hidden="true" /> {t('speaking.said', lang)}
          </Button>
          <p className="mt-2 text-xs text-graphite">{t('checkpoint.notGraded', lang)}</p>
        </div>
      )}

      {feedback && (
        <div className="mt-5 border-t border-rule pt-4">
          <p className={`flex items-center gap-2 text-sm font-bold ${feedback.correct ? 'text-accent-limette-ink' : 'text-accent-himbeer-ink'}`}>
            {feedback.correct ? <Check className="h-4 w-4" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
            {t(item.mode === 'confirm' ? 'checkpoint.doneLabel' : feedback.correct ? 'feedback.correct' : 'checkpoint.wrong', lang)}
          </p>
          {!feedback.correct && item.mode !== 'confirm' && (
            <p className="mt-1 text-sm text-ink">{t('feedback.correctIs', lang)} <strong className="font-bold" lang="de">{item.answer}</strong></p>
          )}
          {(item.explanationEn || item.explanationDe) && <p className="mt-1 text-sm text-graphite">{lang !== 'de' && item.explanationEn ? item.explanationEn : item.explanationDe}</p>}
          <Button className="mt-4" onClick={advance}>
            {t('action.next', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </Card>
  );
}

/** A per-section result row: label, text score, number — and a bar behind it. */
function SectionRow({ name, section }) {
  const [lang] = useLessonLang();
  const ok = !section.scored || section.pct >= PASS_SECTION_PCT;
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-ink">{SECTION_LABELS[name] || name}</span>
        <span className="font-data text-sm text-graphite">
          {section.correct}/{section.total}
          {section.scored ? ` · ${section.pct} %` : t('checkpoint.notScored', lang)}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-paper-sunk" role="img" aria-label={t('checkpoint.sectionAria', lang, { name: SECTION_LABELS[name] || name, pct: section.pct })}>
        <div className={`h-full ${ok ? 'bg-siegel' : 'bg-accent-himbeer'}`} style={{ width: `${section.pct}%` }} />
      </div>
      {section.scored && !ok && <p className="mt-1 text-xs text-accent-himbeer-ink">{t('checkpoint.sectionBelow', lang, { pct: PASS_SECTION_PCT })}</p>}
    </li>
  );
}

export default function CheckpointPage() {
  const { level, nr } = useParams();
  const { user } = useAuth();
  const [lang] = useLessonLang();
  const curriculum = curriculumFor(level);
  const checkpoint = useMemo(
    () => (curriculum?.checkpoints || []).find((c) => String(c.nr) === String(nr)) || null,
    [curriculum, nr],
  );

  const [pool, setPool] = useState(null);
  const [phase, setPhase] = useState('intro');
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attempts, setAttempts] = useState(null);
  const [remediation, setRemediation] = useState([]);

  useEffect(() => {
    const load = POOL_LOADERS[String(level || '').toLowerCase()];
    if (!load) return;
    let cancelled = false;
    load().then((mod) => { if (!cancelled) setPool(mod.default || mod); });
    return () => { cancelled = true; };
  }, [level]);

  useEffect(() => {
    if (!checkpoint) return;
    let cancelled = false;
    fetchAttemptState(user?.id, checkpoint.id).then((state) => { if (!cancelled) setAttempts(state); });
    return () => { cancelled = true; };
  }, [user, checkpoint]);

  const items = useMemo(() => {
    if (!curriculum || !checkpoint || !pool) return [];
    // buildCheckpoint already puts the chapter's real writing task in the
    // Schreiben section when the curriculum names a taskKey (see buildSchreiben).
    const built = buildCheckpoint({ curriculum, checkpoint, pool });
    // "Nochmal" reshuffles the ORDER only — the same 20 items, so a second run
    // is a second look at the same evidence, not a different (easier) test.
    if (!round) return built;
    return shuffle(built, mulberry32(hashSeed(`${checkpoint.id}-round-${round}`)));
  }, [curriculum, checkpoint, pool, round]);

  const result = useMemo(() => (items.length ? scoreCheckpoint(items, answers) : null), [items, answers]);

  const finish = useCallback(
    (finalAnswers) => {
      const scored = scoreCheckpoint(items, finalAnswers);
      setPhase('result');
      recordAttempt(user?.id, { level, checkpointId: checkpoint.id, items, answers: finalAnswers, result: scored });
      fetchAttemptState(user?.id, checkpoint.id).then(setAttempts);
      // The bound the paper itself was drawn under (see servableBy): a remediation
      // item must not be the first place the learner meets a word.
      if (!scored.passed && pool) {
        setRemediation(remediationSet(items, finalAnswers, pool, { afterLektion: checkpoint.afterLektion }));
      }
    },
    [items, user, level, checkpoint, pool],
  );

  const onAnswer = (item, answer) => {
    const next = { ...answers, [item.id]: answer };
    setAnswers(next);
    if (index + 1 >= items.length) finish(next);
    else setIndex(index + 1);
  };

  if (!curriculum || !checkpoint) return <Navigate to={`/course/${level || ''}`} replace />;

  const path = curriculumPath(curriculum);
  const cpIndex = path.findIndex((entry) => entry.id === checkpoint.id);
  const nextLektion = path.slice(cpIndex + 1).find((entry) => entry.kind === 'lektion');
  const nextHref = nextLektion ? `/course/${curriculum.level}/l/${nextLektion.nr}` : `/course/${curriculum.level}`;

  const sectionsCovered = SECTION_ORDER.map((s) => SECTION_LABELS[s]).join(' · ');
  const current = items[index];
  const pct = items.length ? Math.round((index / items.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-6 sm:pb-12 sm:pt-10">
        <div className="mb-6 flex items-center gap-3">
          <Link to={`/course/${curriculum.level}`} className="inline-flex items-center gap-1 text-sm font-bold text-siegel hover:text-siegel-deep">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {curriculum.code}
          </Link>
          {phase === 'run' && (
            <>
              <div className="h-2.5 flex-1 overflow-hidden rounded-pill bg-siegel-wash" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-siegel" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-data text-xs text-graphite">{index + 1}/{items.length}</span>
            </>
          )}
          <LangToggle className="ml-auto" />
        </div>

        {phase === 'intro' && (
          <Card className="p-6 sm:p-8">
            <Chip tone="label">{t('checkpoint.label', lang, { nr: checkpoint.nr })}</Chip>
            <h1 className="mt-3 font-display text-2xl text-ink sm:text-3xl">{checkpoint.title}</h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite">
              {/* Deutsch-Modus: „… im Format Ihrer Prüfung …" (tests/checkpoint.test.mjs §6). */}
              {t('checkpoint.intro', lang, { sections: sectionsCovered })}
            </p>
            <p className="mt-3 text-[0.9375rem] font-bold text-ink">
              {t('checkpoint.passRule', lang, { overall: PASS_OVERALL_PCT, section: PASS_SECTION_PCT })}
            </p>
            <p className="mt-2 text-sm text-graphite">
              {attempts
                ? attempts.blocked
                  ? t('checkpoint.blocked', lang, { time: attempts.nextAllowedAt?.toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) })
                  : t('checkpoint.remaining', lang, { remaining: attempts.remaining, limit: ATTEMPT_LIMIT, hours: ATTEMPT_WINDOW_HOURS })
                : t('checkpoint.limit', lang, { limit: ATTEMPT_LIMIT, hours: ATTEMPT_WINDOW_HOURS })}
            </p>
            <div className="mt-6">
              <Button disabled={!items.length || Boolean(attempts?.blocked)} onClick={() => { setPhase('run'); setIndex(0); setAnswers({}); }}>
                {t('checkpoint.start', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              {!items.length && <p className="mt-2 text-sm text-graphite">{t('checkpoint.loadingItems', lang)}</p>}
            </div>
          </Card>
        )}

        {phase === 'run' && current && <PracticeItem key={current.id} item={current} onAnswer={onAnswer} />}

        {phase === 'result' && result && (
          <>
            <Card raised edge={result.passed ? 'limette' : 'himbeer'} className="p-6 sm:p-8">
              <p className="flex items-center gap-2 font-display text-2xl text-ink">
                {result.passed ? <Check className="h-6 w-6 text-accent-limette-ink" aria-hidden="true" /> : <X className="h-6 w-6 text-accent-himbeer-ink" aria-hidden="true" />}
                {t(result.passed ? 'checkpoint.passed' : 'checkpoint.notPassed', lang)}
              </p>
              <p className="mt-2 font-data text-4xl text-ink">{result.overall} %</p>
              <p className="text-sm text-graphite">{t('checkpoint.correctOf', lang, { correct: result.correct, total: result.total })}</p>
              <ul className="mt-5 divide-y divide-rule">
                {SECTION_ORDER.filter((s) => result.sections[s]).map((s) => (
                  <SectionRow key={s} name={s} section={result.sections[s]} />
                ))}
              </ul>
              {Object.keys(result.errorTags).length > 0 && (
                <div className="mt-5">
                  <p className="font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite">{t('checkpoint.whyTitle', lang)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(result.errorTags)
                      .sort((a, b) => b[1] - a[1])
                      .map(([tag, count]) => (
                        <Chip key={tag} tone="quiet">{tag} · {count}</Chip>
                      ))}
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {result.passed ? (
                  <Button to={nextHref}>
                    {nextLektion ? t('checkpoint.nextLesson', lang, { nr: nextLektion.nr }) : t('action.backToCourse', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    disabled={Boolean(attempts?.blocked)}
                    onClick={() => { setRound(round + 1); setAnswers({}); setIndex(0); setRemediation([]); setPhase('run'); }}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" /> {t('action.again', lang)}
                  </Button>
                )}
                <Button variant="secondary" to={`/course/${curriculum.level}`}>{t('action.toCoursePlan', lang)}</Button>
              </div>
            </Card>

            {!result.passed && remediation.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-xl text-ink">{t('checkpoint.practiceFirst', lang)}</h2>
                <p className="mt-1 text-sm text-graphite">
                  {t('checkpoint.practiceLead', lang, { n: remediation.length })}
                </p>
                <div className="mt-4 space-y-4">
                  {remediation.map((item) => (
                    <PracticeItem key={item.id} item={item} onAnswer={() => {}} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
