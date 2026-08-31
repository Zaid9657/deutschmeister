import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDueCards, fetchDeckCounts, recordReview } from '../../services/srsService';
import { GRADES } from '../../services/srsScheduler';
import CompletionMoment from '../CompletionMoment';

// The vocabulary trainer (renovation Phase 6) — the persisted practice mode
// the 1,935-word list never had. Flashcards over the user's own deck
// (vocab_srs_cards): German side first, reveal, grade, and the SM-2-lite
// scheduler decides when the word comes back. No audio dependence by design
// (0/1,935 words have audio files).
const GRADE_BUTTONS = [
  { grade: GRADES.AGAIN, label: 'Nochmal', hint: 'gleich wieder', classes: 'border-red-200 text-red-700 hover:bg-red-50' },
  { grade: GRADES.HARD, label: 'Schwer', hint: 'kurzer Abstand', classes: 'border-amber-200 text-amber-700 hover:bg-amber-50' },
  { grade: GRADES.GOOD, label: 'Gut', hint: 'normaler Abstand', classes: 'border-rule text-ink hover:bg-siegel-wash' },
  { grade: GRADES.EASY, label: 'Leicht', hint: 'langer Abstand', classes: 'border-siegel/40 text-siegel-deep hover:bg-siegel-wash' },
];

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
      <div className="rounded-2xl border border-rule bg-white p-6 flex items-center gap-2 text-sm text-graphite">
        <Loader2 className="w-4 h-4 animate-spin" /> Dein Wörter-Deck wird geladen…
      </div>
    );
  }

  if (counts.total === 0) {
    return (
      <div className="rounded-2xl border border-rule bg-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-siegel flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <p className="font-display font-semibold text-ink">Dein Wörter-Trainer</p>
        </div>
        <p className="text-sm text-graphite leading-relaxed">
          Füg unten Wörter aus einem Niveau hinzu — der Trainer fragt sie dann in wachsenden
          Abständen ab, kurz bevor du sie vergessen würdest.
        </p>
      </div>
    );
  }

  if (sessionDone || (!card && counts.due === 0)) {
    return (
      <CompletionMoment
        headline={reviewedCount > 0 ? `${reviewedCount} Wörter wiederholt!` : 'Alles wiederholt!'}
        detail={`Dein Deck: ${counts.total} Wörter. Nichts mehr fällig — komm morgen wieder, dann warten die nächsten.`}
        nextLabel="Zum Dashboard"
        nextHref="/dashboard"
      />
    );
  }

  if (!card) {
    return (
      <div className="rounded-2xl border border-rule bg-white p-6 flex items-center justify-between">
        <p className="text-sm text-graphite">
          {counts.due} Wörter fällig · Deck: {counts.total}
        </p>
        <button onClick={reload} className="inline-flex items-center gap-1.5 text-sm font-semibold text-siegel">
          <RotateCcw className="w-4 h-4" /> Laden
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rule bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="flex items-center gap-2 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
          <Brain className="w-3.5 h-3.5" /> Heute üben
        </p>
        <p className="font-data text-[0.8125rem] text-graphite">
          Noch {queue.length} fällig
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${card.word_id}-${revealed}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="text-center py-6"
        >
          <p className="font-display text-3xl font-semibold text-ink">
            {word.article ? `${word.article} ` : ''}{word.german}
          </p>
          {revealed && (
            <div className="mt-4">
              <p className="text-lg text-graphite">{word.english}</p>
              {word.example_sentence && (
                <p className="mt-2 text-sm text-graphite italic">{word.example_sentence}</p>
              )}
              {word.plural && word.plural !== 'null' && (
                <p className="mt-1 font-data text-[0.8125rem] text-graphite">Plural: {word.plural}</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-3 rounded-xl bg-siegel text-white font-semibold hover:bg-siegel-lift transition-colors"
        >
          Aufdecken
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GRADE_BUTTONS.map((b) => (
            <button
              key={b.grade}
              onClick={() => grade(b.grade)}
              className={`py-2.5 rounded-xl border font-semibold text-sm transition-colors ${b.classes}`}
            >
              {b.label}
              <span className="block font-normal text-[0.6875rem] opacity-70">{b.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SrsTrainer;
