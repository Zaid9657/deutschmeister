import { useEffect, useState, useCallback } from 'react';
import { Brain, Loader2, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDueCards, fetchDeckCounts, recordReview } from '../../services/srsService';
import { GRADES } from '../../services/srsScheduler';
import { displayGerman } from '../../utils/wordDisplay';
import CompletionMoment from '../CompletionMoment';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import Stat from '../ui/Stat.jsx';

// The vocabulary trainer (renovation Phase 6) — the persisted practice mode
// the 1,935-word list never had. Flashcards over the user's own deck
// (vocab_srs_cards): German side first, reveal, grade, and the SM-2-lite
// scheduler decides when the word comes back. No audio dependence by design
// (0/1,935 words have audio files).
//
// Grades are pressable raised chips in the accent tones (tokens rule 2:
// accents are energy, never a CTA) — again → himbeer, hard → aprikose,
// good → limette, easy → the siegel-wash label.
const GRADE_BUTTONS = [
  { grade: GRADES.AGAIN, label: 'Nochmal', hint: 'gleich wieder', tone: 'himbeer' },
  { grade: GRADES.HARD, label: 'Schwer', hint: 'kurzer Abstand', tone: 'aprikose' },
  { grade: GRADES.GOOD, label: 'Gut', hint: 'normaler Abstand', tone: 'limette' },
  { grade: GRADES.EASY, label: 'Leicht', hint: 'langer Abstand', tone: 'label' },
];

// The two faces of the flashcard share one grid cell so the card is as tall
// as its taller side; the flip is a pure CSS 3D rotate (reduced motion
// collapses the transition to an instant swap via the global gate).
const FACE = 'col-start-1 row-start-1 flex flex-col items-center justify-center px-4 py-8 text-center [backface-visibility:hidden]';

const SrsTrainer = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [counts, setCounts] = useState({ total: 0, due: 0 });
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionDone, setSessionDone] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [cards, deckCounts] = await Promise.all([
      fetchDueCards(user.id),
      fetchDeckCounts(user.id),
    ]);
    setQueue(cards);
    setCounts(deckCounts);
    setSessionDone(false);
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  if (!user) return null;

  const card = queue[0];
  const word = card?.words;

  const grade = async (g) => {
    if (!card) return;
    await recordReview(user.id, card, g);
    setRevealed(false);
    setReviewedCount((n) => n + 1);
    setQueue((q) => {
      const rest = q.slice(1);
      // "Nochmal" resurfaces at the end of this session's queue
      const next = g === GRADES.AGAIN ? [...rest, card] : rest;
      if (next.length === 0) setSessionDone(true);
      return next;
    });
  };

  // Empty deck → invite; nothing due → status line
  if (loading) {
    return (
      <Card className="p-6 flex items-center gap-2 text-sm text-graphite">
        <Loader2 className="w-4 h-4 animate-spin" /> Dein Wörter-Deck wird geladen…
      </Card>
    );
  }

  if (counts.total === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-clay bg-siegel-wash text-siegel flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <p className="font-display font-semibold text-ink">Dein Wörter-Trainer</p>
        </div>
        <p className="text-sm text-graphite leading-relaxed">
          Füg unten Wörter aus einem Niveau hinzu — der Trainer fragt sie dann in wachsenden
          Abständen ab, kurz bevor du sie vergessen würdest.
        </p>
      </Card>
    );
  }

  if (sessionDone || (!card && counts.due === 0)) {
    return (
      <CompletionMoment
        headline={reviewedCount > 0 ? `${reviewedCount} Wörter wiederholt!` : 'Alles wiederholt!'}
        detail={`Dein Deck: ${counts.total} Wörter. Nichts mehr fällig — komm morgen wieder, dann warten die nächsten.`}
        nextLabel="Zum Dashboard"
        nextHref="/dashboard"
        celebrate={reviewedCount > 0}
      />
    );
  }

  if (!card) {
    return (
      <Card className="p-6 flex items-center justify-between gap-3">
        <p className="text-sm text-graphite">
          {counts.due} Wörter fällig · Deck: {counts.total}
        </p>
        <Button variant="ghost" size="sm" onClick={reload}>
          <RotateCcw className="w-4 h-4" /> Laden
        </Button>
      </Card>
    );
  }

  return (
    <Card raised className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="flex items-center gap-2 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
            <Brain className="w-3.5 h-3.5" /> Heute üben
          </p>
          <Stat value={counts.due} label="fällig" size="sm" className="mt-2" />
        </div>
        <Chip tone="quiet" className="font-data tabular-nums">
          Noch {queue.length} fällig
        </Chip>
      </div>

      {/* The flashcard: front = German, back = meaning. Flips on reveal. */}
      <div key={card.word_id} className="animate-pop-in [perspective:1000px]">
        <div
          className={`grid transition-transform duration-500 ease-snap [transform-style:preserve-3d] ${revealed ? '[transform:rotateY(180deg)]' : ''}`}
          aria-live="polite"
        >
          <Card tone="sunk" className={FACE} aria-hidden={revealed}>
            <p className="font-display text-3xl font-semibold text-ink">
              {displayGerman(word.article, word.german)}
            </p>
          </Card>
          <Card tone="wash" className={`${FACE} [transform:rotateY(180deg)]`} aria-hidden={!revealed}>
            <p className="font-display text-2xl font-semibold text-ink">
              {displayGerman(word.article, word.german)}
            </p>
            <p className="mt-3 text-lg text-graphite">{word.english}</p>
            {word.example_sentence && (
              <p className="mt-2 text-sm text-graphite italic">{word.example_sentence}</p>
            )}
            {word.plural && word.plural !== 'null' && (
              <p className="mt-1 font-data text-[0.8125rem] text-graphite">Plural: {word.plural}</p>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-5">
        {!revealed ? (
          <Button size="lg" className="w-full" onClick={() => setRevealed(true)}>
            Aufdecken
          </Button>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GRADE_BUTTONS.map((b) => (
              <Chip
                key={b.grade}
                raised
                size="md"
                tone={b.tone}
                className="w-full justify-center py-2.5"
                onClick={() => grade(b.grade)}
              >
                <span className="flex flex-col items-center leading-tight">
                  {b.label}
                  <span className="font-normal text-[0.6875rem] opacity-70">{b.hint}</span>
                </span>
              </Chip>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SrsTrainer;
