import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, BookOpen, Target, CalendarClock, Headphones, Mic, Check } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import StageShell from './StageShell.jsx';
import WordsLearnedCards from './WordsLearnedCards.jsx';
import { accuracyPercent } from '../../lib/lesson/mastery.js';
import { fetchLektionReviewDueAt } from '../../services/reviewService.js';
import { recapReviewSchedule } from '../../lib/review/recapSchedule.js';
import { useAuth } from '../../contexts/AuthContext';
import SaveProgressCard from '../course/SaveProgressCard.jsx';
import { lessonDateFormat, t, useLessonLang } from '../../lib/lesson/strings.js';
import { curriculumFor } from '../../data/curricula/index.js';
import { canDoLines } from '../../lib/course/canDo.js';
import { supabase } from '../../utils/supabase.js';
import { SOCIAL_LINKS } from '../../data/navigation.js';
import { SOCIAL_ICONS } from '../socialIcons.js';
import { trackSocialClicked } from '../../lib/funnelTracking.js';

/**
 * Stage 8 — Recap. OUTCOME FIRST (Wave 1, 2026-10-14): what the learner can do
 * now — the Lektion's own can-do lines — and when it comes back; then ONE call
 * to action, the next thing on the path. Everything that measures the run (the
 * mastery label, first-try accuracy, the four skill lines, the words and the
 * grammar point) and the extras sit in one closed <details>, so the screen
 * reads as an ability, not a score sheet. No XP, no hearts, no league
 * (standard §4, "Skip"). The words come back in the course review — the one
 * review destination; the "add to my vocab deck" button that sent them to a
 * second, separate deck is gone.
 *
 * One exception to "one call to action": a SIGNED-OUT learner also gets the
 * save-progress card (P4, "first lesson before sign-up"). It is not a wall —
 * the primary action below it still goes to the next Lektion — and it appears
 * only here, after the work is done, because that is the one moment the ask is
 * about something the learner already owns. The lesson is in localStorage by
 * the time this renders (LessonPlayerPage's recap effect).
 */
/** The text for one skillStatus line: `recap.skill.<skill>.<state>` with its numbers. */
function skillText(line, lang) {
  const pct = typeof line.pct === 'number' ? accuracyPercent(line.pct) : null;
  const state = line.skill === 'writing' && line.state === 'self-checked' && line.limitReached ? 'self-checked-limit' : line.state;
  return t(`recap.skill.${line.skill}.${state}`, lang, { ...line, pct });
}

export default function RecapStage({ stage, accuracy, status, skills = [], sync = null, onRetrySync, nextLabel, onNext, onBack, level }) {
  const { user } = useAuth();
  const [lang] = useLessonLang();
  const pct = accuracyPercent(accuracy);
  const [reviewDueAt, setReviewDueAt] = useState(null);
  const review = recapReviewSchedule(reviewDueAt);
  const date = lessonDateFormat(lang, { day: 'numeric', month: 'long' });

  // "Go deeper": the Lektion this recap belongs to, found by reference — the
  // player hands the stage its Lektion's OWN wortfeld array unchanged
  // (buildLesson.js: `wortfeld: lektion.wortfeld || []`), so matching on that
  // reference finds the Lektion without needing buildLesson.js or
  // LessonPlayerPage.jsx to carry a new field.
  const curriculum = level ? curriculumFor(level) : null;
  const lektion = useMemo(
    () => curriculum?.lektionen?.find((l) => l.wortfeld === stage.wortfeld) || null,
    [curriculum, stage.wortfeld],
  );

  useEffect(() => {
    setReviewDueAt(null);
    if (!user || !lektion || sync !== 'synced') return undefined;
    let cancelled = false;
    fetchLektionReviewDueAt(user.id, lektion, level)
      .then((dueAt) => { if (!cancelled) setReviewDueAt(dueAt); })
      .catch(() => { /* no date promised without a saved schedule */ });
    return () => { cancelled = true; };
  }, [user, lektion, level, sync]);

  const listeningHref =
    lektion?.links?.listeningExercise != null ? `/listening/${level}/${lektion.links.listeningExercise}` : null;

  // readingOrder is `reading_lessons.order_index`, not the route's `:lessonId`
  // (that is the DB row's uuid — see src/services/readingService.js), so the
  // href needs one lookup. Fail-soft like every other service call here: no
  // row, no error thrown, the link just stays hidden.
  const [readingHref, setReadingHref] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const order = lektion?.links?.readingOrder;
    if (!level || order == null) {
      setReadingHref(null);
      return undefined;
    }
    supabase
      .from('reading_lessons')
      .select('id')
      .eq('level', String(level).toLowerCase())
      .eq('order_index', order)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[RecapStage] reading link lookup:', error.message);
          setReadingHref(null);
          return;
        }
        setReadingHref(data ? `/reading/${level}/${data.id}` : null);
      });
    return () => {
      cancelled = true;
    };
  }, [level, lektion]);

  // Same query shape SpeakingStage.jsx hands the player for the in-lesson
  // "open" speaking task: `/speaking/?level=<level>&mission=<missionOrder>` — with the slash,
  // because /speaking is a prerendered route (CLAUDE.md trailing-slash rule).
  const missionOrder = lektion?.sprechen?.open?.missionOrder;
  const speakingHref = missionOrder != null ? `/speaking/?level=${encodeURIComponent(level)}&mission=${missionOrder}` : null;

  const hasGoDeeper = Boolean(lektion && (listeningHref || readingHref || speakingHref));

  const canDo = lektion ? canDoLines(lektion, lang) : [];

  return (
    <StageShell
      eyebrow={t('stage.recap.eyebrow', lang)}
      title={t('stage.recap.title', lang)}
      onBack={onBack}
      primaryLabel={nextLabel || t('action.next', lang)}
      onPrimary={onNext}
    >
      <Card raised edge={status === 'gold' ? 'siegel' : 'paper'} className="p-6">
        {canDo.length > 0 && (
          <>
            <h3 className="font-display text-lg text-ink">{t('recap.canDo.title', lang)}</h3>
            <ul className="mt-3 space-y-2">
              {canDo.map((line) => (
                <li key={line} className="flex items-start gap-2 text-[0.9375rem] leading-snug text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-siegel-deep" aria-hidden="true" /> {line}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className={`${canDo.length ? 'mt-4 border-t border-rule pt-4 ' : ''}flex items-start gap-2 text-[0.875rem] leading-relaxed text-graphite`}>
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {t(`recap.canDo.${review.state}`, lang, { date: review.date ? date.format(review.date) : '' })}
        </p>

        {/* Where this run is saved (syncOutbox.js) — said in words, and never a reason to stop: Continue works either way. */}
        <p role="status" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] leading-snug text-graphite">
          {sync && <span>{t(`sync.${sync}`, lang)}</span>}
          {(sync === 'failed' || sync === 'failedTemp' || sync === 'localFailed') && onRetrySync && (
            <button type="button" onClick={onRetrySync} className="min-h-11 font-bold text-siegel-deep underline underline-offset-2 hover:text-ink">
              {t('sync.retry', lang)}
            </button>
          )}
        </p>
      </Card>

      {!user && level ? <SaveProgressCard level={level} /> : null}

      <details className="mt-5 rounded-clay border border-rule bg-white">
        <summary className="flex min-h-11 cursor-pointer items-center px-5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel-deep hover:text-ink">
          {t('recap.details', lang)}
        </summary>
        <div className="border-t border-rule p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={status === 'gold' ? 'himbeer' : 'label'}>
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> {t(`recap.mastery.${status === 'gold' || status === 'complete' ? status : 'started'}`, lang)}
            </Chip>
            <span className="font-data text-[0.8125rem] text-graphite">{t('recap.firstTry', lang, { pct })}</span>
          </div>

          {skills.length > 0 && (
            <div className="mt-5">
              <h3 className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{t('recap.skills.title', lang)}</h3>
              <dl className="mt-2 divide-y divide-rule border-y border-rule">
                {skills.map((line) => (
                  <div key={line.skill} className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[8rem_1fr] sm:gap-3">
                    <dt className="text-[0.875rem] font-bold text-ink">{t(`recap.skill.${line.skill}`, lang)}</dt>
                    <dd className="text-[0.875rem] leading-snug text-graphite">{skillText(line, lang)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-1.5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> {t('recap.words', lang)}
              </dt>
              <dd className="mt-1 font-display text-[1.5rem] font-semibold text-ink">{stage.wordCount || 0}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
                <Target className="h-3.5 w-3.5" aria-hidden="true" /> {t('recap.grammar', lang)}
              </dt>
              <dd className="mt-1 text-[0.9375rem] font-bold leading-snug text-ink">{stage.grammar || '—'}</dd>
            </div>
          </dl>

          {stage.wortfeld && stage.wortfeld.length > 0 && (
            <div className="mt-5 border-t border-rule pt-4">
              <WordsLearnedCards words={stage.wortfeld} />
            </div>
          )}

          <p className="mt-5 border-t border-rule pt-4 text-[0.875rem] leading-relaxed text-graphite">
            {t(status === 'gold' ? 'recap.gold' : 'recap.done', lang)}
          </p>

          {hasGoDeeper && (
            <div className="mt-5 border-t border-rule pt-4">
              <h3 className="font-display text-lg text-ink">{t('recap.goDeeper.title', lang)}</h3>
              <ul className="mt-3 space-y-2.5">
                {listeningHref && (
                  <li>
                    <Link to={listeningHref} className="inline-flex items-center gap-1.5 text-sm font-bold text-siegel hover:text-siegel-deep">
                      <Headphones className="h-4 w-4" aria-hidden="true" /> {t('recap.goDeeper.listening', lang)}
                    </Link>
                  </li>
                )}
                {readingHref && (
                  <li>
                    <Link to={readingHref} className="inline-flex items-center gap-1.5 text-sm font-bold text-siegel hover:text-siegel-deep">
                      <BookOpen className="h-4 w-4" aria-hidden="true" /> {t('recap.goDeeper.reading', lang)}
                    </Link>
                  </li>
                )}
                {speakingHref && (
                  <li>
                    <Link to={speakingHref} className="inline-flex items-center gap-1.5 text-sm font-bold text-siegel hover:text-siegel-deep">
                      <Mic className="h-4 w-4" aria-hidden="true" /> {t('recap.goDeeper.speaking', lang)}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Coverage said plainly (2026-10 review): a Lektion without a linked listening exercise or
              reading text says so instead of silently showing fewer links. */}
          {lektion && (lektion.links?.listeningExercise == null || lektion.links?.readingOrder == null) && (
            <p className="mt-4 text-[0.8125rem] leading-snug text-graphite">
              {[
                lektion.links?.listeningExercise == null && t('recap.coverage.noListening', lang),
                lektion.links?.readingOrder == null && t('recap.coverage.noReading', lang),
              ].filter(Boolean).join(' ')}
            </p>
          )}

          {/* Follow the channels: signed-in learners only. A signed-out learner's one extra ask is
              the save-progress card above; sending them off-site before they have an account
              loses the signup. */}
          {user && (
            <div className="mt-5 border-t border-rule pt-4">
              <h3 className="font-display text-lg text-ink">{t('recap.follow.title', lang)}</h3>
              <p className="mt-1 text-sm text-graphite">{t('recap.follow.body', lang)}</p>
              <ul className="mt-3 flex flex-wrap gap-x-5">
                {SOCIAL_LINKS.map((item) => {
                  const Icon = SOCIAL_ICONS[item.key];
                  return (
                    <li key={item.key}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackSocialClicked(item.key, 'lesson_recap')}
                        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-siegel hover:text-siegel-deep"
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" /> {lang === 'de' ? item.labelDe : item.labelEn}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </details>
    </StageShell>
  );
}
