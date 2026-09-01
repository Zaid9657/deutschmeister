import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Volume2, Check, Eye, EyeOff } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import Chip from './ui/Chip.jsx';

/**
 * One example sentence as a clay card.
 *
 * It used to reach into the Tailwind config at runtime for the LEVEL's two
 * hexes and paint its border, indicator bar, topic tag and speaker with them,
 * and it wrote the body font stack inline out of design-tokens. Both are gone:
 * colour means grammatical case (rule 1), and the token vocabulary reaches this
 * file the same way it reaches every other — as Tailwind classes.
 */
const SentenceCard = ({ sentence, level }) => {
  const { t } = useTranslation();
  const { isItemLearned, markAsLearned, unmarkAsLearned } = useProgress();
  const [showTranslation, setShowTranslation] = useState(false);

  const learned = isItemLearned(level, 'sentences', sentence.id);

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(sentence.german);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleLearned = () => {
    if (learned) {
      unmarkAsLearned(level, 'sentences', sentence.id);
    } else {
      markAsLearned(level, 'sentences', sentence.id);
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
      <Card raised edge={learned ? 'limette' : 'paper'} className="relative h-full overflow-hidden">
        <div className="p-6">
          {/* Topic tag */}
          <div className="flex items-center justify-between gap-3 mb-4">
            {sentence.topic && <Chip tone="quiet">{sentence.topic}</Chip>}
            {learned && (
              <Chip tone="limette">
                <Check className="w-3 h-3" />
                {t('levelPage.learned')}
              </Chip>
            )}
          </div>

          {/* German sentence */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-4">
              <p className="font-body text-[1.1875rem] font-medium leading-[1.7] tracking-[0.01em] text-ink">
                {sentence.german}
              </p>
              <button
                onClick={handleSpeak}
                className="p-2 rounded-pill text-siegel hover:bg-siegel-wash transition-colors flex-shrink-0"
                title={t('levelPage.listenPronunciation')}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Translation toggle */}
          <div className="mb-4">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              aria-expanded={showTranslation}
              className="flex items-center gap-2 text-sm font-bold text-siegel transition-colors hover:text-siegel-deep"
            >
              {showTranslation ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide translation
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show translation
                </>
              )}
            </button>
            <motion.div
              initial={false}
              animate={{
                height: showTranslation ? 'auto' : 0,
                opacity: showTranslation ? 1 : 0,
              }}
              className="overflow-hidden"
            >
              <p className="pt-2 font-body text-base leading-relaxed text-graphite">
                {sentence.english}
              </p>
            </motion.div>
          </div>

          {/* Action button — secondary, never a candy CTA (tokens rule 2);
              the limette success token rides the label beside its check. */}
          <Button
            variant="secondary"
            onClick={toggleLearned}
            aria-pressed={learned}
            size="lg"
            className={`w-full ${learned ? 'text-accent-limette-ink' : ''}`}
          >
            <Check className="w-4 h-4" />
            <span>{learned ? t('levelPage.learned') : t('levelPage.markLearned')}</span>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default SentenceCard;
