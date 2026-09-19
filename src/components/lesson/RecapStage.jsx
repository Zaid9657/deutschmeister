import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, BookOpen, Target, CalendarClock, Headphones, Mic, Plus } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import Button from '../ui/Button.jsx';
import StageShell from './StageShell.jsx';
import WordsLearnedCards from './WordsLearnedCards.jsx';
import { accuracyPercent, nextReviewDate } from '../../lib/lesson/mastery.js';
import { useAuth } from '../../contexts/AuthContext';
import SaveProgressCard from '../course/SaveProgressCard.jsx';
import { lessonDateFormat, t, useLessonLang } from '../../lib/lesson/strings.js';
import { curriculumFor } from '../../data/curricula/index.js';
import { enqueueWords } from '../../services/srsService.js';
import { supabase } from '../../utils/supabase.js';

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
  const [lang] = useLessonLang();
  const pct = accuracyPercent(accuracy);
  const review = nextReviewDate();
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
  // "open" speaking task: `/speaking?level=<level>&mission=<missionOrder>`.
  const missionOrder = lektion?.sprechen?.open?.missionOrder;
  const speakingHref = missionOrder != null ? `/speaking?level=${encodeURIComponent(level)}&mission=${missionOrder}` : null;

  const hasGoDeeper = Boolean(lektion && (listeningHref || readingHref || speakingHref));

  // Vocab bridge: the Lektion's own words, keyed by the live `words` table
  // (a11.js header — some entries carry `wordId: null` where the table has no
  // row yet, so those are skipped rather than sent to enqueueWords). The
  // service upserts with `ignoreDuplicates`, so a repeat click is a no-op for
  // any card that already exists — no separate membership check needed.
  const wordIds = useMemo(() => (stage.wortfeld || []).map((w) => w.wordId).filter(Boolean), [stage.wortfeld]);
  const [bridgeStatus, setBridgeStatus] = useState('idle'); // idle | adding | added
  const addToDeck = async () => {
    if (!user || !wordIds.length || bridgeStatus !== 'idle') return;
    setBridgeStatus('adding');
    await enqueueWords(user.id, wordIds);
    setBridgeStatus('added');
  };

  return (
    <StageShell
      eyebrow={t('stage.recap.eyebrow', lang)}
      title={t('stage.recap.title', lang)}
      onBack={onBack}
      primaryLabel={nextLabel || t('action.next', lang)}
      onPrimary={onNext}
    >
      <Card raised edge={status === 'gold' ? 'siegel' : 'paper'} className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={status === 'gold' ? 'himbeer' : 'label'}>
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> {t(`recap.mastery.${status === 'gold' || status === 'complete' ? status : 'started'}`, lang)}
          </Chip>
          <span className="font-data text-[0.8125rem] text-graphite">{t('recap.firstTry', lang, { pct })}</span>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <div>
            <dt className="flex items-center gap-1.5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> {t('recap.review', lang)}
            </dt>
            <dd className="mt-1 text-[0.9375rem] font-bold leading-snug text-ink">{t('recap.reviewOn', lang, { date: date.format(review) })}</dd>
          </div>
        </dl>

        {stage.wortfeld && stage.wortfeld.length > 0 && (
          <div className="mt-5 border-t border-rule pt-4">
            <WordsLearnedCards words={stage.wortfeld} />
          </div>
        )}

        {/* "Read the rule again": omitted on purpose. The player has no route
            back to a single stage — stages are a linear index, not addressable
            URLs — so there is nowhere for this link to go without a player
            change, and RecapStage does not own the player. */}

        <p className="mt-5 border-t border-rule pt-4 text-[0.875rem] leading-relaxed text-graphite">
          {t(status === 'gold' ? 'recap.gold' : 'recap.done', lang)}
        </p>
      </Card>

      {hasGoDeeper && (
        <Card className="mt-5 p-5 sm:p-6">
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
        </Card>
      )}

      {wordIds.length > 0 && (
        <Card className="mt-5 p-5 sm:p-6">
          {user ? (
            <Button variant="secondary" onClick={addToDeck} disabled={bridgeStatus !== 'idle'}>
              {bridgeStatus === 'added' ? (
                <Trophy className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {bridgeStatus === 'added'
                ? t('recap.vocabBridge.added', lang)
                : bridgeStatus === 'adding'
                  ? t('recap.vocabBridge.adding', lang)
                  : t('recap.vocabBridge.add', lang)}
            </Button>
          ) : (
            <p className="text-sm text-graphite">{t('recap.vocabBridge.signInHint', lang)}</p>
          )}
        </Card>
      )}

      {!user && level ? <SaveProgressCard level={level} /> : null}

    </StageShell>
  );
}
