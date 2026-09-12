import { Trophy, BookOpen, Target, CalendarClock } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import StageShell from './StageShell.jsx';
import { accuracyPercent, masteryLabel, nextReviewDate } from '../../lib/lesson/mastery.js';
import { useAuth } from '../../contexts/AuthContext';
import SaveProgressCard from '../course/SaveProgressCard.jsx';

const DE_DATE = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long' });

/**
 * Stage 8 — Recap. Words learned, the grammar point, the first-attempt
 * accuracy and its mastery label, the date the material comes back, and ONE
 * call to action: the next thing on the path. No XP, no hearts, no league
 * (standard §4, "Skip").
 *
 * One exception to "one call to action": a SIGNED-OUT learner also gets the
 * save-progress card (P4, "first lesson before sign-up"). It is not a wall —
 * the primary action below it still goes to the next Lektion — and it appears
 * only here, after the work is done, because that is the one moment the ask is
 * about something the learner already owns. The lesson is in localStorage by
 * the time this renders (LessonPlayerPage's recap effect).
 */
export default function RecapStage({ stage, accuracy, status, nextLabel, onNext, onBack, level }) {
  const { user } = useAuth();
  const pct = accuracyPercent(accuracy);
  const review = nextReviewDate();

  return (
    <StageShell
      eyebrow="Schritt 8 · Rückblick"
      title="Lektion geschafft"
      onBack={onBack}
      primaryLabel={nextLabel || 'Weiter'}
      onPrimary={onNext}
    >
      <Card raised edge={status === 'gold' ? 'siegel' : 'paper'} className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={status === 'gold' ? 'himbeer' : 'label'}>
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> {masteryLabel(status)}
          </Chip>
          <span className="font-data text-[0.8125rem] text-graphite">{pct} % im ersten Versuch</span>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1.5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Wörter
            </dt>
            <dd className="mt-1 font-display text-[1.5rem] font-semibold text-ink">{stage.wordCount || 0}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              <Target className="h-3.5 w-3.5" aria-hidden="true" /> Grammatik
            </dt>
            <dd className="mt-1 text-[0.9375rem] font-bold leading-snug text-ink">{stage.grammar || '—'}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> Wiederholung
            </dt>
            <dd className="mt-1 text-[0.9375rem] font-bold leading-snug text-ink">am {DE_DATE.format(review)}</dd>
          </div>
        </dl>

        <p className="mt-5 border-t border-rule pt-4 text-[0.875rem] leading-relaxed text-graphite">
          {status === 'gold'
            ? 'Gold: mindestens 80 % im ersten Versuch. Die Wörter und die Regel kommen zur Wiederholung zurück.'
            : 'Geschafft. Die Lektion zählt bei jeder Trefferquote — was heute wackelte, kommt zur Wiederholung zurück.'}
        </p>
      </Card>

      {!user && level ? <SaveProgressCard level={level} /> : null}

    </StageShell>
  );
}
