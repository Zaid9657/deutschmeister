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

// The checkpoint screen (standard §3): 20 items, one per screen, a thin
// progress bar, then a result that says what to do next. Design rules it
// follows: one primary action per screen, feedback as text + icon + colour
// (never colour alone), no hearts and no XP, legible at 360 px, and nothing
// that moves on its own — the only motion is the Button's own press.
//
// The item renderer below is deliberately small. The lesson engine's
// PracticeItem can replace it wholesale once it lands; the contract between
// them is the item shape from buildCheckpoint.js, nothing else.

const POOL_LOADERS = {
  'a1.1': () => import('../../data/lessonPools/a11.json'),
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
      {item.register && <Chip tone="quiet">{item.register === 'formular' ? 'Formular' : 'Mitteilung'}</Chip>}
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
        <p className="font-display text-lg leading-snug text-ink">{item.promptDe}</p>
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
          {pending?.usedMic
            ? 'Bewertet — Verständlichkeit zählt in Ihr Sprechen-Ergebnis.'
            : 'Ohne Aufnahme wird der Sprechen-Teil nicht bewertet, gehört aber zum Test.'}
        </p>
        <Button
          className="mt-4"
          disabled={!pending}
          onClick={() => onAnswer(item, pending?.usedMic ? { usedMic: true, pct: pending.pct } : true)}
        >
          Weiter <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
        <p className="font-display text-lg leading-snug text-ink">{item.promptDe}</p>
        <div className="mt-4">
          <GradedWriting task={item.task} lektionId={item.lektionId} onResult={setPending} />
        </div>
        <p className="mt-3 text-xs text-graphite">
          {verdict
            ? `Bewertet — ab ${Math.round(WRITING_PASS_PCT * 100)} % zählt diese Aufgabe als richtig.`
            : 'Ohne KI-Bewertung zählt diese Aufgabe nicht in das Schreiben-Ergebnis, gehört aber zum Test.'}
        </p>
        <Button className="mt-4" disabled={!pending} onClick={() => onAnswer(item, verdict)}>
          Weiter <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Card>
    );
  }

  const isAudio = Boolean(item.audioText);

  return (
    <Card className="p-5 sm:p-6">
      {header}

      <p className="font-display text-lg leading-snug text-ink">{item.promptDe}</p>
      {item.promptEn && <p className="mt-1 text-sm text-graphite">{item.promptEn}</p>}

      {isAudio && (
        <div className="mt-4">
          <Button variant="secondary" onClick={() => speak(item.audioText, item.lektionId, item.lineKey)}>
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            Nochmal hören
          </Button>
        </div>
      )}

      {item.text && (
        <Card tone="sunk" className="mt-4 p-4 text-[0.9375rem] leading-relaxed text-ink">{item.text}</Card>
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
          <label className="sr-only" htmlFor={`answer-${item.id}`}>Ihre Antwort</label>
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
            placeholder="Antwort eingeben"
          />
          {!feedback && <Button type="submit" className="sm:w-auto">Prüfen</Button>}
        </form>
      )}

      {item.mode === 'confirm' && !feedback && (
        <div className="mt-5">
          <Button onClick={() => submit(true)}>
            <Check className="h-4 w-4" aria-hidden="true" /> Gesagt
          </Button>
          <p className="mt-2 text-xs text-graphite">Nicht bewertet — aber Teil des Tests.</p>
        </div>
      )}

      {feedback && (
        <div className="mt-5 border-t border-rule pt-4">
          <p className={`flex items-center gap-2 text-sm font-bold ${feedback.correct ? 'text-accent-limette-ink' : 'text-accent-himbeer-ink'}`}>
            {feedback.correct ? <Check className="h-4 w-4" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
            {item.mode === 'confirm' ? 'Erledigt' : feedback.correct ? 'Richtig' : 'Nicht richtig'}
          </p>
          {!feedback.correct && item.mode !== 'confirm' && (
            <p className="mt-1 text-sm text-ink">Richtig ist: <strong className="font-bold">{item.answer}</strong></p>
          )}
          {item.explanationDe && <p className="mt-1 text-sm text-graphite">{item.explanationDe}</p>}
          <Button className="mt-4" onClick={advance}>
            Weiter <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </Card>
  );
}

/** A per-section result row: label, text score, number — and a bar behind it. */
function SectionRow({ name, section }) {
  const ok = !section.scored || section.pct >= PASS_SECTION_PCT;
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-ink">{SECTION_LABELS[name] || name}</span>
        <span className="font-data text-sm text-graphite">
          {section.correct}/{section.total}
          {section.scored ? ` · ${section.pct} %` : ' · nicht bewertet'}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-paper-sunk" role="img" aria-label={`${SECTION_LABELS[name] || name}: ${section.pct} Prozent`}>
        <div className={`h-full ${ok ? 'bg-siegel' : 'bg-accent-himbeer'}`} style={{ width: `${section.pct}%` }} />
      </div>
      {section.scored && !ok && <p className="mt-1 text-xs text-accent-himbeer-ink">Unter {PASS_SECTION_PCT} % — dieser Teil muss noch einmal.</p>}
    </li>
  );
}

export default function CheckpointPage() {
  const { level, nr } = useParams();
  const { user } = useAuth();
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
      if (!scored.passed && pool) setRemediation(remediationSet(items, finalAnswers, pool));
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
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-24 sm:pb-12 sm:pt-28">
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
        </div>

        {phase === 'intro' && (
          <Card className="p-6 sm:p-8">
            <Chip tone="label">Checkpoint {checkpoint.nr}</Chip>
            <h1 className="mt-3 font-display text-2xl text-ink sm:text-3xl">{checkpoint.title}</h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite">
              20 Aufgaben aus {sectionsCovered} — im Format Ihrer Prüfung. Der Test zieht aus den
              Lektionen dieses Kapitels und wiederholt Grammatik aus früheren Kapiteln.
            </p>
            <p className="mt-3 text-[0.9375rem] font-bold text-ink">
              Bestanden ab {PASS_OVERALL_PCT} % insgesamt und mindestens {PASS_SECTION_PCT} % in jedem bewerteten Teil.
            </p>
            <p className="mt-2 text-sm text-graphite">
              {attempts
                ? attempts.blocked
                  ? `Keine Versuche mehr in diesem Zeitfenster. Wieder frei ab ${attempts.nextAllowedAt?.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr.`
                  : `Noch ${attempts.remaining} von ${ATTEMPT_LIMIT} Versuchen in ${ATTEMPT_WINDOW_HOURS} Stunden.`
                : `${ATTEMPT_LIMIT} Versuche pro ${ATTEMPT_WINDOW_HOURS} Stunden.`}
            </p>
            <div className="mt-6">
              <Button disabled={!items.length || Boolean(attempts?.blocked)} onClick={() => { setPhase('run'); setIndex(0); setAnswers({}); }}>
                Checkpoint starten <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              {!items.length && <p className="mt-2 text-sm text-graphite">Die Aufgaben werden geladen …</p>}
            </div>
          </Card>
        )}

        {phase === 'run' && current && <PracticeItem key={current.id} item={current} onAnswer={onAnswer} />}

        {phase === 'result' && result && (
          <>
            <Card raised edge={result.passed ? 'limette' : 'himbeer'} className="p-6 sm:p-8">
              <p className="flex items-center gap-2 font-display text-2xl text-ink">
                {result.passed ? <Check className="h-6 w-6 text-accent-limette-ink" aria-hidden="true" /> : <X className="h-6 w-6 text-accent-himbeer-ink" aria-hidden="true" />}
                {result.passed ? 'Bestanden' : 'Noch nicht bestanden'}
              </p>
              <p className="mt-2 font-data text-4xl text-ink">{result.overall} %</p>
              <p className="text-sm text-graphite">{result.correct} von {result.total} bewerteten Aufgaben richtig</p>
              <ul className="mt-5 divide-y divide-rule">
                {SECTION_ORDER.filter((s) => result.sections[s]).map((s) => (
                  <SectionRow key={s} name={s} section={result.sections[s]} />
                ))}
              </ul>
              {Object.keys(result.errorTags).length > 0 && (
                <div className="mt-5">
                  <p className="font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite">Woran es lag</p>
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
                    {nextLektion ? `Weiter: Lektion ${nextLektion.nr}` : 'Zurück zum Kurs'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    disabled={Boolean(attempts?.blocked)}
                    onClick={() => { setRound(round + 1); setAnswers({}); setIndex(0); setRemediation([]); setPhase('run'); }}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" /> Nochmal
                  </Button>
                )}
                <Button variant="secondary" to={`/course/${curriculum.level}`}>Zum Kursplan</Button>
              </div>
            </Card>

            {!result.passed && remediation.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-xl text-ink">Zuerst üben</h2>
                <p className="mt-1 text-sm text-graphite">
                  {remediation.length} Aufgaben zu genau den Themen, die eben nicht saßen. Danach den Checkpoint noch einmal.
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
