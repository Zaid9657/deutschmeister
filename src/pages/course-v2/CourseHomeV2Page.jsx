import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Flag, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import { normalizeLevel, levelCode, bandOf } from '../../lib/course-v2/ids.js';
import { courseHomeModel, STATUS_LABEL_DE } from '../../lib/course-v2/homeModel.js';
import { planSummary } from '../../lib/course-v2/pacePlan.js';
import { fetchLevelState, fetchLearnerGoal } from '../../lib/course-v2/progress.js';
import { localLevelState } from '../../lib/course-v2/localState.js';
import { loadManifest, plateauNrs } from '../../lib/course-v2/loaders.js';
import { V2_DEFAULT_PACE } from '../../config/courseV2.js';
import ActionBar from './ActionBar.jsx';

// The v2 course home: /course/:level/v2 (BLUEPRINT §7.3 S0; a preview route that
// works whenever compiled v2 content exists for the level; COURSE_V2_LIVE later
// decides whether /course/:level itself renders it).
//
// The unit path grouped by Etappe, each Etappe closed by its Plateau (or the
// closing block), with the can-do title, the planned minutes, the Prüfungsfokus
// chips and the learner's status per unit; one primary action („Weiter mit
// Lektion N"), pinned in the thumb zone; a one-line plan from the pace preset.
// Everything shown is computed in src/lib/course-v2/homeModel.js; completion comes
// from completion.js. The gate is soft: a unit whose predecessor is not finished
// shows „Trotzdem öffnen" and opens anyway.

function UnitCard({ row }) {
  const done = row.status === 'complete' || row.status === 'gold';
  const pct = row.stepsTotal ? Math.round((row.stepsDone / row.stepsTotal) * 100) : 0;
  const body = (
    <div className="flex gap-3 p-4">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-pill font-data text-sm font-bold ${
          row.status === 'gold' ? 'bg-gold text-ink' : done ? 'bg-accent-limette-wash text-accent-limette-ink' : 'border border-rule bg-white text-graphite'
        }`}
        aria-hidden="true"
      >
        {done ? <Check className="h-5 w-5" /> : row.nr}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite">
          Lektion {row.nr}{row.minutes ? ` · ≈ ${row.minutes} Min.${row.minutesMeasured ? '' : ' (geplant)'}` : ''}
        </p>
        <h3 className="mt-0.5 text-base font-bold leading-snug text-ink [hyphens:auto]">{row.title || `Lektion ${row.nr}`}</h3>
        {row.canDoTitle && <p className="mt-1 text-sm text-graphite">{row.canDoTitle}</p>}
        {row.pruefungsfokus.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {row.pruefungsfokus.map((t) => <Chip key={t} tone="aprikose">{t}</Chip>)}
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-graphite">
          <span className="font-bold">{STATUS_LABEL_DE[row.status]}</span>
          {row.status === 'started' && <span>· {row.stepsDone} von {row.stepsTotal} Schritten</span>}
          {row.available && !row.ready && !done && row.status === 'new' && (
            <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" aria-hidden="true" /> Noch nicht dran – trotzdem öffnen</span>
          )}
        </div>
        {row.status === 'started' && (
          <div className="mt-2 h-1 overflow-hidden rounded-pill bg-siegel-wash" aria-hidden="true">
            <div className="h-full rounded-pill bg-accent-limette" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  );
  if (!row.available) return <Card tone="sunk" className="opacity-80">{body}</Card>;
  return (
    <Card as={Link} to={row.href} interactive className="block">
      {body}
    </Card>
  );
}

function PlateauRow({ plateau }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3">
      <Flag className="h-5 w-5 shrink-0 text-graphite" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">Plateau {plateau.nr}</p>
        <p className="text-xs text-graphite">
          {plateau.done ? 'Abgegeben' : plateau.available ? 'Wiederholung und Prüfungsteile der Etappe' : 'Kommt bald'}
        </p>
      </div>
    </div>
  );
  return plateau.available
    ? <Card as={Link} to={plateau.href} interactive className="block">{inner}</Card>
    : <Card tone="sunk">{inner}</Card>;
}

export function CourseHomeV2({ level, manifest, state, goal }) {
  const model = useMemo(() => courseHomeModel(manifest, state, { plateaus: plateauNrs(level) }), [manifest, state, level]);
  const pace = (goal && goal.pace) || V2_DEFAULT_PACE;
  const plan = useMemo(
    () => (model ? planSummary({ manifest, pace, remainingSteps: model.remainingSteps, examDate: goal && goal.exam_date }) : null),
    [model, manifest, pace, goal],
  );
  if (!model) return null;
  const next = model.next;
  const started = next && next.status === 'started';
  const unitPart = model.completion ? model.completion.parts.find((p) => p.kind === 'unit') : null;

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 pb-32 pt-4 sm:pt-8">
        <Link to="/courses/" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-siegel hover:text-siegel-deep">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Alle Kurse
        </Link>
        <header className="mt-2">
          <Chip tone="label">{model.code} · Vorschau</Chip>
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink [hyphens:auto] sm:text-4xl">
            {(model.title && model.title.de) || `Kurs ${model.code}`}
          </h1>
          {model.honestyLineDe && <p className="mt-2 text-sm text-graphite">{model.honestyLineDe}</p>}
          {unitPart && (
            <p className="mt-3 font-data text-xs text-graphite">{unitPart.done} von {unitPart.count} Lektionen geschafft</p>
          )}
          {plan && <p className="mt-2 text-sm text-ink">{plan.lineDe}</p>}
        </header>

        <div className="mt-6 space-y-8">
          {model.etappen.map((e) => (
            <section key={e.nr} aria-labelledby={`etappe-${e.nr}`}>
              <h2 id={`etappe-${e.nr}`} className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
                Etappe {e.nr}
              </h2>
              <div className="mt-3 space-y-3">
                {e.units.map((row) => <UnitCard key={row.id} row={row} />)}
                {e.plateau && <PlateauRow plateau={e.plateau} />}
                {e.closing && (
                  <Card tone="sunk">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Flag className="h-5 w-5 shrink-0 text-graphite" aria-hidden="true" />
                      <p className="text-sm text-graphite">Abschluss des Kurses – kommt bald</p>
                    </div>
                  </Card>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
      {next && (
        <ActionBar>
          <Button size="lg" className="w-full" to={next.href}>
            {started ? `Weiter mit Lektion ${next.nr}` : `Lektion ${next.nr} starten`}
          </Button>
        </ActionBar>
      )}
    </div>
  );
}

export default function CourseHomeV2Page() {
  const { level: levelParam } = useParams();
  const level = normalizeLevel(levelParam);
  const { user, loading: authLoading } = useAuth();
  const [manifest, setManifest] = useState(undefined);
  const [state, setState] = useState(null);
  const [goal, setGoal] = useState(null);

  useEffect(() => {
    if (!level) return undefined;
    let cancelled = false;
    loadManifest(level).then((m) => { if (!cancelled) setManifest(m || null); });
    return () => { cancelled = true; };
  }, [level]);

  useEffect(() => {
    if (!level || authLoading) return undefined;
    let cancelled = false;
    if (!user) {
      setState(localLevelState(level));
      return undefined;
    }
    fetchLevelState(user.id, level).then((s) => { if (!cancelled) setState(s); });
    fetchLearnerGoal(user.id, bandOf(level)).then((g) => { if (!cancelled) setGoal(g); });
    return () => { cancelled = true; };
  }, [level, user, authLoading]);

  if (!level) return <Navigate to="/courses/" replace />;
  if (manifest === undefined || !state) {
    return (
      <div className="min-h-screen bg-paper font-body text-graphite">
        <p className="mx-auto max-w-2xl px-4 py-16 text-sm italic">Kurs wird geladen …</p>
      </div>
    );
  }
  if (manifest === null) {
    return (
      <div className="min-h-screen bg-paper font-body text-ink">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Chip tone="quiet">{levelCode(level)}</Chip>
          <h1 className="mt-3 font-display text-2xl text-ink">Der neue Kurs {levelCode(level)} kommt bald</h1>
          <p className="mt-2 text-sm text-graphite">Er ist noch in Arbeit.</p>
          <div className="mt-6">
            <Button variant="secondary" to={`/course/${level}`}>Zum aktuellen Kurs</Button>
          </div>
        </div>
      </div>
    );
  }
  return <CourseHomeV2 level={level} manifest={manifest} state={state} goal={goal} />;
}
