import { useEffect, useState, useCallback, useRef } from 'react';
import { Brain, Loader2, Plus, RotateCcw, Volume2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { FREE_LEVELS, isLevelFree } from '../../config/freeTier';
import { fetchDueCards, fetchDeckCounts, recordReview, enqueueWords } from '../../services/srsService';
import { fetchWordsForLevel } from '../../services/vocabularyService';
import { GRADES, queueAfterGrade } from '../../services/srsScheduler';
import { displayGerman } from '../../utils/wordDisplay';
import { playWord } from '../../lib/lesson/speech.js';
import CompletionMoment from '../CompletionMoment';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import Stat from '../ui/Stat.jsx';

// The vocabulary trainer (renovation Phase 6) — the persisted practice mode
// the 1,935-word list never had. Flashcards over the user's own deck
// (vocab_srs_cards): German side first, reveal, grade, and the SM-2-lite
// scheduler decides when the word comes back. The revealed side can be heard:
// the word's recording where it has one (most A1.1 words do), else the
// browser's German voice, labelled "Computerstimme" as in the course.
//
// A session is one batch (fetchDueCards: the due reviews first, then a few new
// words). When it runs out the deck is counted again, and "Nichts mehr fällig"
// is said only for a freshly read zero; otherwise "Weiter üben" loads the next
// batch. A grade is saved before the card moves on, one grade at a time, and
// the headline counts the distinct words saved, not the "Nochmal" repeats.
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

// Only real DB ids: the word mapper falls back to `word-${index}` for a row
// without one, and those cannot reference public.words (as LevelPage.jsx).
const isWordId = (id) => /^[0-9a-f-]{36}$/.test(String(id));

// The empty deck's one-click start: the words of the learner's placed level
// when the level page would open it for them (free, or hasLevelAccess — the
// LevelSubscriptionGuard rule), else the free level. profiles.current_level is
// UPPERCASE in the DB and 'a1' (a band, not a placement) by default.
function starterLevel(currentLevel, hasLevelAccess) {
  const level = String(currentLevel || '').trim().toLowerCase();
  if (/^[ab][12]\.[12]$/.test(level) && (isLevelFree(level) || hasLevelAccess?.(level))) return level;
  return FREE_LEVELS[0];
}

const SrsTrainer = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const { profile, hasLevelAccess } = useSubscription();
  const [queue, setQueue] = useState([]);
  const [counts, setCounts] = useState({ total: 0, due: 0, ok: true });
  const [revealed, setRevealed] = useState(false);
  const [savedWords, setSavedWords] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  // null while a batch runs; 'checking' while the deck is counted again after it ran out; then 'done'.
  const [batchEnd, setBatchEnd] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addFailed, setAddFailed] = useState(false);
  // One grade at a time, for the card on screen: a second tap used to grade the same card again and
  // drop the next card unseen. Refs, because two taps can land before React re-renders: savingRef
  // while a grade is in flight, queueRef for the queue as it is NOW (a tap from a render that still
  // shows an already-graded card is ignored).
  const savingRef = useRef(false);
  const queueRef = useRef([]);
  // Bumped by every load, so an answer that lands after a newer load cannot overwrite it.
  const loadRef = useRef(0);

  const setSessionQueue = (next) => {
    queueRef.current = next;
    setQueue(next);
  };

  // Keyed on the user ID, not the auth user object: that object is replaced on every tab return and
  // token refresh, and each reload threw away this session's "Nochmal" cards (due 10 minutes later)
  // and could open the next card on its answer side.
  const reload = useCallback(async () => {
    if (!userId) return;
    const load = ++loadRef.current;
    setLoading(true);
    const [cards, deckCounts] = await Promise.all([
      fetchDueCards(userId),
      fetchDeckCounts(userId),
    ]);
    if (load !== loadRef.current) return;
    queueRef.current = cards;
    setQueue(cards);
    setCounts(deckCounts);
    setRevealed(false);
    setSaveFailed(false);
    setBatchEnd(null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const card = queue[0];

  const grade = async (g) => {
    if (!card || savingRef.current || queueRef.current[0] !== card) return;
    savingRef.current = true;
    setSaving(true);
    setSaveFailed(false);
    const load = loadRef.current;
    let next = null;
    try {
      next = await recordReview(userId, card, g);
    } catch {
      next = null;
    }
    savingRef.current = false;
    setSaving(false);
    if (load !== loadRef.current) return;
    if (!next) {
      // Not saved: the card stays at the front, still revealed, so the learner can grade it again.
      setSaveFailed(true);
      return;
    }
    setRevealed(false);
    setSavedWords((ids) => new Set(ids).add(card.word_id));
    // "Nochmal" goes to the back carrying the saved lapse (queueAfterGrade), never the stale card.
    const rest = queueAfterGrade(queueRef.current, card, g, next);
    setSessionQueue(rest);
    if (rest.length === 0) {
      // The batch ran out — count the deck again before anything says "nothing due".
      setBatchEnd('checking');
      const fresh = await fetchDeckCounts(userId);
      if (load !== loadRef.current) return;
      setCounts(fresh);
      setBatchEnd('done');
    }
  };

  const addLevel = starterLevel(profile?.current_level, hasLevelAccess);
  const addStarterWords = async () => {
    if (!userId || adding) return;
    setAdding(true);
    setAddFailed(false);
    const words = await fetchWordsForLevel(addLevel);
    const added = await enqueueWords(userId, words.map((w) => w.id).filter(isWordId));
    setAdding(false);
    if (added > 0) reload();
    else setAddFailed(true);
  };

  if (!user) return null;

  const word = card?.words;
  const savedCount = savedWords.size;
  const savedHeadline = `${savedCount} ${savedCount === 1 ? 'Wort' : 'Wörter'} wiederholt!`;

  if (loading) {
    return (
      <Card className="p-6 flex items-center gap-2 text-sm text-graphite">
        <Loader2 className="w-4 h-4 animate-spin" /> Dein Wörter-Deck wird geladen…
      </Card>
    );
  }

  if (!card) {
    if (batchEnd === 'checking') {
      return (
        <Card className="p-6 flex items-center gap-2 text-sm text-graphite">
          <Loader2 className="w-4 h-4 animate-spin" /> {savedHeadline} Der Stand wird geprüft…
        </Card>
      );
    }

    // A count that could not be read is not a zero: no "nothing due", no empty-deck invite.
    if (!counts.ok) {
      return (
        <Card className="p-6 flex items-center justify-between gap-3">
          <p className="text-sm text-graphite">Der Stand des Decks konnte nicht geladen werden.</p>
          <Button variant="ghost" size="sm" onClick={reload}>
            <RotateCcw className="w-4 h-4" /> Laden
          </Button>
        </Card>
      );
    }

    // Empty deck → invite, with a one-click start from the learner's level.
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
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={addStarterWords} disabled={adding}>
              <Plus className="w-4 h-4" />
              {adding ? 'Wird hinzugefügt…' : `Wörter aus ${addLevel.toUpperCase()} hinzufügen`}
            </Button>
            {addFailed && (
              <p role="alert" className="text-[0.8125rem] font-bold text-accent-aprikose-ink">
                Nicht hinzugefügt — bitte nochmal versuchen.
              </p>
            )}
          </div>
        </Card>
      );
    }

    if (counts.due > 0) {
      // The batch ran out but the deck has more: say how much and offer the next batch.
      if (batchEnd === 'done') {
        return (
          <CompletionMoment
            headline={savedHeadline}
            detail={`Noch ${counts.due} fällig · Deck: ${counts.total} Wörter.`}
            nextLabel="Weiter üben"
            onNext={reload}
            celebrate={savedCount > 0}
          />
        );
      }
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

    // A freshly read zero: now "nothing due" is true.
    return (
      <CompletionMoment
        headline={savedCount > 0 ? savedHeadline : 'Alles wiederholt!'}
        detail={`Dein Deck: ${counts.total} Wörter. Nichts mehr fällig — komm morgen wieder, dann warten die nächsten.`}
        nextLabel="Zum Dashboard"
        nextHref="/dashboard"
        celebrate={savedCount > 0}
      />
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
            {revealed && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playWord(word.audio_url, displayGerman(word.article, word.german))}
                  aria-label="Aussprache anhören"
                  className="flex h-10 w-10 items-center justify-center rounded-pill bg-white text-siegel hover:bg-siegel hover:text-white"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                {!word.audio_url && (
                  <span className="font-data text-[0.6875rem] text-graphite">Computerstimme</span>
                )}
              </div>
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
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADE_BUTTONS.map((b) => (
                <Chip
                  key={b.grade}
                  raised
                  size="md"
                  tone={b.tone}
                  className="w-full justify-center py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => grade(b.grade)}
                  disabled={saving}
                >
                  <span className="flex flex-col items-center leading-tight">
                    {b.label}
                    <span className="font-normal text-[0.6875rem] opacity-70">{b.hint}</span>
                  </span>
                </Chip>
              ))}
            </div>
            {saveFailed && (
              <p role="alert" className="mt-3 text-center text-[0.8125rem] font-bold text-accent-aprikose-ink">
                Nicht gespeichert — bitte nochmal versuchen.
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default SrsTrainer;
