import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { curriculumFor } from '../../data/curricula/index.js';
import { fetchDueCards, gradeCard, fetchNextDueAt, buildCardIndex, parseCardKey } from '../../services/reviewService.js';
import { fetchWordsByIds } from '../../services/lessonService.js';
import { audioFor, playLine, playWord, speakGerman } from '../../lib/lesson/speech.js';
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

export default function ReviewPage() {
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

  const [wordAudio, setWordAudio] = useState(() => new Map());

  const cardIndex = useMemo(() => buildCardIndex(curriculum), [curriculum]);

  useEffect(() => {
    if (!curriculum) return;
    let cancelled = false;
    if (!user) {
      setCards([]);
      return () => { cancelled = true; };
    }
    fetchDueCards(user.id, curriculum.level, 12).then((rows) => {
      if (cancelled) return;
      const due = rows.filter((row) => cardIndex.has(row.card_key));
      setCards(due);
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
  }, [user, curriculum, cardIndex]);

  const card = cards?.[index] || null;
  const content = card ? cardIndex.get(card.card_key) : null;

  const play = useCallback((row, face) => {
    const text = (face && (face.speak || face.front)) || '';
    if (!row) return speakGerman(text);
    const recorded = recordedKeyFor(row.card_key);
    if (recorded) return playLine(recorded.lektionId, recorded.key, text);
    const parsed = parseCardKey(row.card_key);
    if (parsed && parsed.kind === 'word') return playWord(wordAudio.get(parsed.ref) || '', text);
    return speakGerman(text);
  }, [wordAudio]);

  const hasRecording = (() => {
    if (!card) return false;
    const recorded = recordedKeyFor(card.card_key);
    if (recorded) return !!audioFor(recorded.lektionId, recorded.key);
    const parsed = parseCardKey(card.card_key);
    return !!(parsed && parsed.kind === 'word' && wordAudio.get(parsed.ref));
  })();
  const mode = card ? modeForCard(card.kind, index) : null;

  useEffect(() => {
    setRevealed(false);
    setTyped('');
    setVerdict(null);
    if (card && content && (mode === 'listening')) play(card, content);
  }, [card, content, mode, play]);

  const finish = useCallback(() => {
    if (!user || !curriculum) return;
    fetchNextDueAt(user.id, curriculum.level).then(setNextDueAt);
  }, [user, curriculum]);

  const grade = async (correct) => {
    if (!card) return;
    await gradeCard(user?.id, card.card_key, correct);
    if (index + 1 >= (cards?.length || 0)) {
      setIndex(index + 1);
      finish();
    } else {
      setIndex(index + 1);
    }
  };

  if (!curriculum) return <Navigate to={`/course/${level || ''}`} replace />;

  const done = cards && index >= cards.length;

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
              <Check className="h-5 w-5 text-accent-limette-ink" aria-hidden="true" /> {t('review.doneToday', lang)}
            </p>
            <p className="mt-2 text-sm text-graphite">
              {/* Deutsch-Modus: „Neue Karten kommen, sobald Sie eine Lektion abschließen." (same test). */}
              {formatDue(nextDueAt, lang) ? t('review.nextOn', lang, { date: formatDue(nextDueAt, lang) }) : t('review.newCards', lang)}
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
