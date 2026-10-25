import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { curriculumFor } from '../../data/curricula/index.js';
import { fetchDueCards, gradeCard, fetchNextDueAt, fetchReviewCounts, buildCardIndex, parseCardKey } from '../../services/reviewService.js';
import { fetchWordsByIds } from '../../services/lessonService.js';
import { audioFor, playChecked, playRecordingChecked, speakGermanChecked } from '../../lib/lesson/speech.js';
import { LADDER_DAYS } from '../../lib/review/ladder.js';
import { gradeTypedReview } from '../../lib/checkpoint/reviewGrading.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import LangToggle from '../../components/lesson/LangToggle.jsx';
import ReviewCard, { modeForCard } from '../../components/lesson/ReviewCard.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

// The Wiederholen screen (standard §3, "Spaced review"): the cards that are due
// today, in four modes — flashcard reveal, listening, typed, and "say it"
// self-confirm — so the same word is not always met the same way. The schedule
// is the Babbel ladder; the card content comes from the curriculum, never from
// the database row (see reviewService.buildCardIndex). Chrome labels come from
// src/lib/lesson/strings.js in the chrome language (header toggle).

// Audio, in the order the standard wants it (plan P1): a recording when one
// exists, browser speech only as the fallback. A sentence card IS a dialogue
// line — `sentence:<lektionId>:<idx>` maps to the manifest key `line-<idx>` of
// that Lektion — and a word card carries `words.audio_url` from the Azure run.
// The card's text is on screen either way; sound is never the only channel.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The manifest key a recorded card would use, or null when it has none. */
function recordedKeyFor(cardKey) {
  const parsed = parseCardKey(cardKey);
  if (!parsed || parsed.kind !== 'sentence' || !Number.isFinite(parsed.lineIdx)) return null;
  return { lektionId: parsed.lektionId, key: `line-${parsed.lineIdx}` };
}

const formatDue = (iso, lang) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { day: '2-digit', month: 'long' });
  } catch {
    return null;
  }
};

/**
 * The owner boundary of a review session (2026-10-25): the deck, its position and the batch-end counts
 * belong to ONE account. A grade still being saved when another account signed in (another tab) used to
 * land on the new account's deck — its late continuation set that deck's index from the old one, so
 * three unanswered cards showed the finished-batch screen. So the session mounts once auth has settled,
 * keyed by its owner (as CheckpointPage keys a paper): a new owner is a new session.
 */
export default function ReviewPage() {
  const { user, loading } = useAuth();
  const [lang] = useLessonLang();
  if (loading) {
    return (
      <div className="min-h-screen bg-paper font-body text-graphite">
        <p className="mx-auto max-w-2xl px-4 py-16 text-sm">{t('review.loading', lang)}</p>
      </div>
    );
  }
  return <ReviewSession key={user?.id || 'guest'} />;
}

function ReviewSession() {
  const { level } = useParams();
  const { user } = useAuth();
  const [lang] = useLessonLang();
  const curriculum = curriculumFor(level);

  const [cards, setCards] = useState(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [nextDueAt, setNextDueAt] = useState(null);
  const [stillDue, setStillDue] = useState(0);
  const [batch, setBatch] = useState(0);

  const [wordAudio, setWordAudio] = useState(() => new Map());

  const cardIndex = useMemo(() => buildCardIndex(curriculum), [curriculum]);

  // Which deck is on screen: counted up whenever one loads (another level, the next round). A grade or a
  // batch-end count that resolves after the deck changed belongs to the old deck and is dropped.
  const deck = useRef(0);
  useEffect(() => {
    if (!curriculum) return;
    deck.current += 1;
    let cancelled = false;
    if (!user) {
      setCards([]);
      return () => { cancelled = true; };
    }
    fetchDueCards(user.id, curriculum.level, 12).then((rows) => {
      if (cancelled) return;
      const due = rows.filter((row) => cardIndex.has(row.card_key));
      setCards(due);
      setIndex(0);
      // Nothing due: say when the next card comes back — the reason to return. Only grading the last
      // card of a batch used to fetch it, so an empty deck never named a date.
      if (!due.length) {
        fetchNextDueAt(user.id, curriculum.level).then((at) => { if (!cancelled) setNextDueAt(at); });
      }
      // Word cards reference a words row by id — fetch the real recordings once.
      const ids = due
        .map((row) => parseCardKey(row.card_key))
        .filter((p) => p && p.kind === 'word' && UUID.test(p.ref))
        .map((p) => p.ref);
      if (ids.length) {
        fetchWordsByIds(ids).then((map) => {
          if (cancelled) return;
          setWordAudio(new Map([...map].map(([id, row]) => [id, row.audioUrl || ''])));
        });
      }
    });
    return () => { cancelled = true; };
  }, [user, curriculum, cardIndex, batch]);

  const card = cards?.[index] || null;
  const content = card ? cardIndex.get(card.card_key) : null;

  const play = useCallback((row, face) => {
    const text = (face && (face.speak || face.front)) || '';
    // Checked playback: each path resolves to { ok, reason } once sound has started (or why not).
    if (!row) return speakGermanChecked(text);
    const recorded = recordedKeyFor(row.card_key);
    if (recorded) return playChecked(recorded.lektionId, recorded.key, text);
    const parsed = parseCardKey(row.card_key);
    const wordUrl = parsed && parsed.kind === 'word' ? wordAudio.get(parsed.ref) : '';
    if (wordUrl) return playRecordingChecked(wordUrl, text);
    return speakGermanChecked(text);
  }, [wordAudio]);

  const hasRecording = (() => {
    if (!card) return false;
    const recorded = recordedKeyFor(card.card_key);
    if (recorded) return !!audioFor(recorded.lektionId, recorded.key);
    const parsed = parseCardKey(card.card_key);
    return !!(parsed && parsed.kind === 'word' && wordAudio.get(parsed.ref));
  })();
  // The mode follows the card's own history (its ladder step), not its seat in today's batch.
  const mode = card ? modeForCard(card.kind, card.step ?? index) : null;

  useEffect(() => {
    setRevealed(false);
    setTyped('');
    setVerdict(null);
    if (card && content && (mode === 'listening')) play(card, content);
  }, [card, content, mode, play]);

  const finish = useCallback(() => {
    if (!user || !curriculum) return;
    const shown = deck.current;
    fetchNextDueAt(user.id, curriculum.level).then((at) => { if (deck.current === shown) setNextDueAt(at); });
    // A batch is 12; a learner with 25 due used to read „Done for today" after the first 12.
    fetchReviewCounts(user.id, curriculum.level).then((c) => { if (deck.current === shown) setStillDue(c.due || 0); });
  }, [user, curriculum]);

  const grade = async (correct) => {
    if (!card) return;
    const shown = deck.current;
    await gradeCard(user?.id, card.card_key, correct);
    if (deck.current !== shown) return;
    if (index + 1 >= (cards?.length || 0)) {
      setIndex(index + 1);
      finish();
    } else {
      setIndex(index + 1);
    }
  };

  if (!curriculum) return <Navigate to={`/course/${level || ''}`} replace />;

  // Done means a batch was worked through. An empty fetch is the "nothing due" card alone: with
  // `cards = []`, 0 >= 0 rendered "Done for today" under "Nothing is due today" (and under the
  // sign-in card for a visitor).
  const done = cards && cards.length > 0 && index >= cards.length;
  const nextOn = formatDue(nextDueAt, lang);

  const checkTyped = () => {
    const { ok } = gradeTypedReview(card.card_key, content.accepted, typed, { caseSensitive: content.caseSensitive });
    setVerdict(ok);
    setRevealed(true);
  };

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-6 sm:pb-12 sm:pt-10">
        <div className="mb-6 flex items-center gap-3">
          <Link to={`/course/${curriculum.level}`} className="inline-flex items-center gap-1 text-sm font-bold text-siegel hover:text-siegel-deep">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {curriculum.code}
          </Link>
          {cards && cards.length > 0 && !done && (
            <span className="font-data text-xs text-graphite">{index + 1}/{cards.length}</span>
          )}
          <LangToggle className="ml-auto" />
        </div>

        <h1 className="font-display text-2xl text-ink sm:text-3xl">{t('review.title', lang)}</h1>
        <p className="mt-1 text-sm text-graphite">
          {t('review.lead', lang, { days: LADDER_DAYS.join(', ') })}
        </p>

        {cards === null && <p className="mt-8 text-sm text-graphite">{t('review.loading', lang)}</p>}

        {cards !== null && cards.length === 0 && (
          <Card className="mt-6 p-6">
            <p className="text-[0.9375rem] text-ink">
              {/* Deutsch-Modus: „Melden Sie sich an, damit Ihre Wiederholungen gespeichert werden."
                  — the Sie-register line tests/checkpoint.test.mjs §6 pins; in the string table now. */}
              {t(user ? 'review.nothingDue' : 'review.signIn', lang)}
            </p>
            {user && (
              <p className="mt-2 text-sm text-graphite">
                {nextOn ? t('review.nextOn', lang, { date: nextOn }) : t('review.newCards', lang)}
              </p>
            )}
            <Button className="mt-4" variant="secondary" to={`/course/${curriculum.level}`}>{t('action.toCoursePlan', lang)}</Button>
          </Card>
        )}

        {card && content && !done && (
          <ReviewCard
            content={content}
            mode={mode}
            lang={lang}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            typed={typed}
            onTypedChange={setTyped}
            onCheckTyped={checkTyped}
            verdict={verdict}
            onPlay={() => play(card, content)}
            hasRecording={hasRecording}
            onGrade={grade}
          />
        )}

        {done && (
          <Card raised edge="limette" className="mt-6 p-6">
            <p className="flex items-center gap-2 font-display text-xl text-ink">
              <Check className="h-5 w-5 text-accent-limette-ink" aria-hidden="true" /> {t(stillDue > 0 ? 'review.roundDone' : 'review.doneToday', lang)}
            </p>
            {stillDue > 0 && (
              <>
                <p className="mt-2 text-sm text-graphite">{t('review.moreDue', lang, { n: stillDue })}</p>
                <Button className="mt-4" onClick={() => { setStillDue(0); setBatch((b) => b + 1); }}>
                  {t('review.nextRound', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </>
            )}
            <p className="mt-2 text-sm text-graphite">
              {/* Deutsch-Modus: „Neue Karten kommen, sobald Sie eine Lektion abschließen." (same test). */}
              {nextOn ? t('review.nextOn', lang, { date: nextOn }) : t('review.newCards', lang)}
            </p>
            <Button className="mt-4" to={`/course/${curriculum.level}`}>
              {t('action.toCoursePlan', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
