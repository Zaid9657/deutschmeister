import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import Card from './ui/Card.jsx';

/**
 * The key-vocabulary drawer under a reading lesson. Reference material, so it
 * stays FLAT (tokens rule 3): hairlines and rows, no resting shadow. The old
 * per-level `theme.gradient` icon tile is gone — a level is not a case, and
 * colour means case (rule 1).
 */
const VocabularyList = ({ vocabulary }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const isGerman = i18n.language === 'de';

  if (!vocabulary || vocabulary.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      {/* Header / Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-4 transition-colors hover:bg-paper-sunk"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-clay bg-siegel-wash text-siegel flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-ink">
              {isGerman ? 'Schlüsselvokabular' : 'Key Vocabulary'}
            </h3>
            <p className="font-data text-[0.8125rem] text-graphite">
              {vocabulary.length} {isGerman ? 'Wörter' : 'words'}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-graphite" />
        ) : (
          <ChevronDown className="w-5 h-5 text-graphite" />
        )}
      </button>

      {/* Vocabulary List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-rule px-4 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {vocabulary.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-3 py-2 rounded-md bg-paper-sunk transition-colors hover:bg-siegel-wash"
                  >
                    <span className="font-medium text-ink min-w-0 flex-1">
                      {item.de}
                    </span>
                    <span className="text-graphite text-sm min-w-0 flex-1 text-right">
                      {item.en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default VocabularyList;
