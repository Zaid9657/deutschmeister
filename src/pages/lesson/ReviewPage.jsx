import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Volume2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { curriculumFor } from '../../data/curricula/index.js';
import { fetchDueCards, gradeCard, fetchNextDueAt, buildCardIndex } from '../../services/reviewService.js';
import { LADDER_DAYS } from '../../lib/review/ladder.js';
import { checkAnswer, RESULT, STRICT_TOPIC } from '../../lib/lesson/check.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';

// The Wiederholen screen (standard §3, "Spaced review"): the cards that are due
// today, in four modes — flashcard reveal, listening, typed, and "say it"
// self-confirm — so the same word is not always met the same way. The schedule
// is the Babbel ladder; the card content comes from the curriculum, never from
// the database row (see reviewService.buildCardIndex).

const MODES_BY_KIND = {
  word: ['flashcard', 'listening', 'typed'],
  pattern: ['flashcard', 'typed'],
  sentence: ['listening', 'say', 'flashcard'],
};

const MODE_LABEL = {
  flashcard: 'Karte',
  listening: 'Hören',
  typed: 'Schreiben',
  say: 'Sprechen',
};

function speak(text) {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

const formatDue = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long' });
  } catch {
    return null;
  }
};

export default function ReviewPage() {
  const { level } = useParams();
  const { user } = useAuth();
  const curriculum = curriculumFor(level);

  const [cards, setCards] = useState(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [nextDueAt, setNextDueAt] = useState(null);

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
      setCards(rows.filter((row) => cardIndex.has(row.card_key)));
    });
    return () => { cancelled = true; };
  }, [user, curriculum, cardIndex]);

  const card = cards?.[index] || null;
  const content = card ? cardIndex.get(card.card_key) : null;
  const mode = card ? (MODES_BY_KIND[card.kind] || MODES_BY_KIND.word)[index % (MODES_BY_KIND[card.kind] || MODES_BY_KIND.word).length] : null;

  useEffect(() => {
    setRevealed(false);
    setTyped('');
    setVerdict(null);
    if (card && content && (mode === 'listening')) speak(content.speak || content.front);
  }, [card, content, mode]);

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
    const strict = STRICT_TOPIC.test(card.card_key);
    const { result } = checkAnswer(typed, content.accepted, { strict });
    const ok = result === RESULT.CORRECT || result === RESULT.TYPO;
    setVerdict(ok);
    setRevealed(true);
  };

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="mb-6 flex items-center gap-3">
          <Link to={`/course/${curriculum.level}`} className="inline-flex items-center gap-1 text-sm font-bold text-siegel hover:text-siegel-deep">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {curriculum.code}
          </Link>
          {cards && cards.length > 0 && !done && (
            <span className="font-data text-xs text-graphite">{index + 1}/{cards.length}</span>
          )}
        </div>

        <h1 className="font-display text-2xl text-ink sm:text-3xl">Wiederholen</h1>
        <p className="mt-1 text-sm text-graphite">
          Wörter, Strukturen und Sätze kommen nach {LADDER_DAYS.join(', ')} Tagen wieder.
        </p>

        {cards === null && <p className="mt-8 text-sm text-graphite">Wird geladen …</p>}

        {cards !== null && cards.length === 0 && (
          <Card className="mt-6 p-6">
            <p className="text-[0.9375rem] text-ink">
              {user ? 'Heute ist nichts fällig.' : 'Melde dich an, damit deine Wiederholungen gespeichert werden.'}
            </p>
            <Button className="mt-4" variant="secondary" to={`/course/${curriculum.level}`}>Zum Kursplan</Button>
          </Card>
        )}

        {card && content && !done && (
          <Card className="mt-6 p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Chip tone="label">{MODE_LABEL[mode]}</Chip>
              {content.lektionNr && <span className="font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite">Lektion {content.lektionNr}</span>}
            </div>

            {mode === 'listening' ? (
              <>
                <Button variant="secondary" onClick={() => speak(content.speak || content.front)}>
                  <Volume2 className="h-4 w-4" aria-hidden="true" /> Nochmal hören
                </Button>
                {revealed && <p className="mt-4 font-display text-xl text-ink">{content.front}</p>}
              </>
            ) : mode === 'typed' ? (
              <>
                <p className="font-display text-xl text-ink">{content.back || content.front}</p>
                <form
                  className="mt-4 flex flex-col gap-3 sm:flex-row"
                  onSubmit={(event) => { event.preventDefault(); checkTyped(); }}
                >
                  <label className="sr-only" htmlFor="review-answer">Auf Deutsch</label>
                  <input
                    id="review-answer"
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    disabled={revealed}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-clay border border-rule bg-white px-4 py-3 font-body text-base text-ink placeholder:text-graphite/60 disabled:bg-paper-sunk"
                    placeholder="Auf Deutsch schreiben"
                  />
                  {!revealed && <Button type="submit" className="sm:w-auto">Prüfen</Button>}
                </form>
                {revealed && (
                  <p className={`mt-3 flex items-center gap-2 text-sm font-bold ${verdict ? 'text-accent-limette-ink' : 'text-accent-himbeer-ink'}`}>
                    {verdict ? <Check className="h-4 w-4" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
                    {verdict ? 'Richtig' : `Richtig ist: ${content.front}`}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-display text-xl text-ink">{content.front}</p>
                {content.detail && <p className="mt-1 text-sm text-graphite">{content.detail}</p>}
                {revealed && content.back && <p className="mt-3 text-[0.9375rem] text-ink">{content.back}</p>}
              </>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {!revealed && mode !== 'typed' && (
                <Button onClick={() => { setRevealed(true); if (mode === 'say') speak(content.speak || content.front); }}>
                  {mode === 'say' ? 'Gesagt — auflösen' : 'Auflösen'}
                </Button>
              )}
              {revealed && (
                <>
                  <Button variant="secondary" onClick={() => grade(false)}>
                    <X className="h-4 w-4" aria-hidden="true" /> Nochmal
                  </Button>
                  <Button onClick={() => grade(verdict !== false)}>
                    <Check className="h-4 w-4" aria-hidden="true" /> Gewusst
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}

        {done && (
          <Card raised edge="limette" className="mt-6 p-6">
            <p className="flex items-center gap-2 font-display text-xl text-ink">
              <Check className="h-5 w-5 text-accent-limette-ink" aria-hidden="true" /> Fertig für heute
            </p>
            <p className="mt-2 text-sm text-graphite">
              {formatDue(nextDueAt) ? `Nächste Wiederholung am ${formatDue(nextDueAt)}.` : 'Neue Karten kommen, sobald du eine Lektion abschließt.'}
            </p>
            <Button className="mt-4" to={`/course/${curriculum.level}`}>
              Zum Kursplan <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
