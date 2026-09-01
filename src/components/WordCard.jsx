import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Check, BookOpen } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import Chip from './ui/Chip.jsx';

/**
 * A vocabulary word as a clay card.
 *
 * It used to tint its border, badge, category chip and speaker icon with the
 * LEVEL's colour, resolved out of the Tailwind config at runtime. Colour means
 * grammatical CASE (design-tokens.js rule 1) and a level is not a case, so the
 * card is neutral: the "learned" state is carried by the limette success token
 * and a check, never by a level hue.
 */
const WordCard = ({ word, level }) => {
  const { t } = useTranslation();
  const { isItemLearned, markAsLearned, unmarkAsLearned } = useProgress();
  const [showExample, setShowExample] = useState(false);

  const learned = isItemLearned(level, 'vocabulary', word.id);

  const handleSpeak = (text) => {
    if (word.audioUrl) {
      const audio = new Audio(word.audioUrl);
      audio.play().catch(() => {
        // Fall back to speech synthesis if audio_url fails
        speakWithSynthesis(text);
      });
    } else {
      speakWithSynthesis(text);
    }
  };

  const speakWithSynthesis = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleLearned = () => {
    if (learned) {
      unmarkAsLearned(level, 'vocabulary', word.id);
    } else {
      markAsLearned(level, 'vocabulary', word.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative h-full"
    >
      <Card raised edge={learned ? 'limette' : 'paper'} className="relative h-full">
        {/* Learned badge */}
        {learned && (
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-pill bg-accent-limette flex items-center justify-center shadow-raise-limette">
            <Check className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Card content */}
        <div className="p-6">
          {/* Category tag */}
          {word.category && (
            <div className="mb-4">
              <Chip tone="quiet">{word.category}</Chip>
            </div>
          )}

          {/* Main word */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-display font-semibold text-ink">
                {word.article && !word.word.toLowerCase().startsWith(word.article.toLowerCase()) && (
                  // The separating space must be a real text node: `mr-1` alone
                  // looked right but made the word one string ("dieFrau") for
                  // copy-paste and screen readers.
                  <><span className="text-graphite">{word.article}</span>{' '}</>
                )}
                {word.word}
              </h3>
              <button
                onClick={() => handleSpeak(word.word)}
                className="p-2 rounded-pill text-siegel hover:bg-siegel-wash transition-colors"
                title={t('levelPage.listenPronunciation')}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-graphite">{word.translation}</p>
          </div>

          {/* Example section */}
          <AnimatePresence>
            {showExample && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-paper-sunk rounded-clay"
              >
                <div className="flex items-start justify-between">
                  <p className="text-ink font-medium">{word.example}</p>
                  <button
                    onClick={() => handleSpeak(word.example)}
                    className="p-1 text-graphite hover:bg-siegel-wash hover:text-siegel-deep rounded-pill transition-colors flex-shrink-0 ml-2"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowExample(!showExample)}
              aria-expanded={showExample}
              className="flex-1"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('levelPage.example')}</span>
            </Button>
            {/* Not a candy CTA (tokens rule 2): the button stays secondary and
                the limette success token rides the label, beside a check. */}
            <Button
              variant="secondary"
              onClick={toggleLearned}
              aria-pressed={learned}
              className={`flex-1 ${learned ? 'text-accent-limette-ink' : ''}`}
            >
              <Check className="w-4 h-4" />
              <span>{learned ? t('levelPage.learned') : t('levelPage.markLearned')}</span>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default WordCard;
