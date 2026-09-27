import { useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import InputView from './InputView.jsx';
import ItemView from './ItemView.jsx';
import ItemRun from './ItemRun.jsx';
import MicroOutputView from './MicroOutputView.jsx';
import { canDoTexts, laneLabel, lineIndex, teilLabel } from './content.js';
import { useV2Strings } from './strings.js';

const LABEL = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite';

/**
 * StartView({ unit, level, onDone }) — the Start slot that opens a unit (SCHEMA §8 Start,
 * BLUEPRINT §3.1 / §3.2, §7.3 S2):
 *
 *   „Was bisher geschah" (U01 only) → the Lernziele box (3–5 can-dos in our own ich-Form
 *   wording) and the Prüfungsfokus chips → the B-skeleton Auftakt (a question and a 60-s
 *   spoken micro-output) → the serial episode (listen first, transcript after) with its one
 *   gist item → „Los geht's", or „Ich kann das schon" (the test-out, when offered).
 *
 * onDone({ stepId, correct, total, testOut }) once. „Ich kann das schon" runs the test-out
 * here — the unit's Lektions-Check items plus its proof items (BLUEPRINT §3.5) — and reports
 * `testOut: { correct, total }`; the player decides with `testOutPassed()` (≥ 80 % credits the
 * practice steps, the two Aufgaben stay open). Without the test-out `testOut` is null.
 * Optional: onAttempt (every answered item), course (manifest: can-do wording, minutes),
 * canDos, names.
 */
export default function StartView({ unit, level, onDone, onAttempt, course = null, canDos = null, names = null }) {
  const [lang, t] = useV2Strings();
  const start = unit?.start || {};
  const lines = useMemo(() => lineIndex(unit), [unit]);
  const goals = useMemo(() => canDoTexts(unit, course, canDos), [unit, course, canDos]);
  const [auftaktDone, setAuftaktDone] = useState(!start.auftakt?.microOutput);
  const [gist, setGist] = useState(null);
  const [testing, setTesting] = useState(false);
  const stepId = unit ? `${unit.id}-start` : 'start';

  if (!unit) return null;
  const minutes = unit.minutesPlanned?.total ?? null;
  const gistItem = start.folge?.gistItem || null;
  const folge = start.folge || null;
  const ready = auftaktDone && (!gistItem || gist);

  const finish = (testOut) => {
    if (typeof onDone === 'function') {
      onDone({ stepId, correct: gist && gist.correct ? 1 : 0, total: gist ? 1 : 0, testOut: testOut || null });
    }
  };

  const testItems = [...(unit.check?.items || []), ...(unit.check?.proofItems || [])];
  if (testing && testItems.length) {
    return (
      <section className="mx-auto w-full max-w-2xl" data-step-id={`${stepId}-testout`}>
        <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">{t('start.testOut')}</p>
        <p className="mb-4 mt-2 text-[0.9375rem] text-graphite">{t('start.testOutLead')}</p>
        <ItemRun
          key="testout"
          items={testItems}
          unitId={unit.id}
          lines={lines}
          names={names}
          stepId={`${stepId}-testout`}
          level={level}
          onAttempt={onAttempt}
          onFinish={(r) => finish({ correct: r.correct, total: r.total })}
        />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-5" data-step-id={stepId}>
      <header>
        <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
          {String(unit.level || level || '').toUpperCase()} · {lang === 'de' ? 'Lektion' : 'Unit'} {unit.nr}
          {minutes != null && <span className="ml-2 font-normal normal-case tracking-normal text-graphite">{t('start.minutes', { n: minutes })}</span>}
        </p>
        <h1 className="mt-2 font-display text-[1.625rem] font-semibold leading-tight tracking-[-0.018em] text-ink [hyphens:auto] sm:text-[2rem]" lang="de">
          {unit.title?.de}
        </h1>
        {unit.title?.canDo && <p className="mt-2 text-[1rem] leading-relaxed text-graphite" lang="de">{unit.title.canDo}</p>}
      </header>

      {start.recapDe && (
        <Card tone="sunk" className="p-4">
          <p className={LABEL}>{t('start.recap')}</p>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink" lang="de">{start.recapDe}</p>
        </Card>
      )}

      <Card className="p-5">
        <p className={`flex items-center gap-2 ${LABEL}`}><Target className="h-4 w-4" aria-hidden="true" /> {t('start.goals')}</p>
        <ul className="mt-3 space-y-2">
          {Object.entries(goals).map(([id, text]) => (
            <li key={id} className="flex items-start gap-2 text-[0.9375rem] leading-relaxed text-ink" lang="de">
              <span aria-hidden="true" className="mt-0.5 text-graphite">›</span> {text}
            </li>
          ))}
        </ul>
        {Array.isArray(start.pruefungsfokusChips) && start.pruefungsfokusChips.length > 0 && (
          <div className="mt-4 border-t border-rule pt-4">
            <p className={LABEL}>{t('start.examFocus')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {start.pruefungsfokusChips.map((tpl) => (
                <Chip key={tpl} tone="label">{teilLabel(tpl)}</Chip>
              ))}
              {unit.spec?.lanes?.primary && <Chip tone="quiet">{laneLabel(unit.spec.lanes.primary)}</Chip>}
            </div>
          </div>
        )}
      </Card>

      {start.auftakt && (
        <div>
          {start.auftakt.promptDe && <p className="mb-3 font-display text-[1.1875rem] font-semibold text-ink" lang="de">{start.auftakt.promptDe}</p>}
          {!auftaktDone && start.auftakt.microOutput && (
            <MicroOutputView mo={start.auftakt.microOutput} level={level} onDone={() => setAuftaktDone(true)} />
          )}
        </div>
      )}

      {auftaktDone && folge && (
        <div>
          <p className={LABEL}>{t('start.episode')}</p>
          <div className="mt-2">
            <InputView
              input={{ title: folge.title, lines: folge.lines || [], glosses: [], transcriptAfterUnaidedListen: true }}
              unitId={unit.id}
              names={names}
            />
          </div>
          {gistItem && (
            <div className="mt-4">
              <ItemView
                item={gistItem}
                level={level}
                stepId={stepId}
                unitId={unit.id}
                lines={lines}
                onResult={(p) => { setGist(p); if (typeof onAttempt === 'function') onAttempt(p); }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
        {start.testOut?.offered ? (
          <div className="max-w-sm">
            <button
              type="button"
              onClick={() => (testItems.length ? setTesting(true) : finish(null))}
              className="inline-flex min-h-11 items-center rounded-pill border border-rule bg-white px-4 py-2 text-[0.875rem] font-bold text-graphite hover:border-siegel hover:text-ink"
            >
              {t('start.testOut')}
            </button>
            <p className="mt-1 text-[0.75rem] leading-snug text-graphite">{t('start.testOutLead')}</p>
          </div>
        ) : <span />}
        <Button onClick={() => finish(false)} size="lg" disabled={!ready} className="w-full sm:w-auto">{t('start.begin')}</Button>
      </div>
    </section>
  );
}
