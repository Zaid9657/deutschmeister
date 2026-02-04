import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

const VocabularyList = ({ vocabulary, theme }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const isGerman = i18n.language === 'de';

  if (!vocabulary || vocabulary.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header / Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800">
              {isGerman ? 'Schlüsselvokabular' : 'Key Vocabulary'}
            </h3>
            <p className="text-xs text-slate-500">
              {vocabulary.length} {isGerman ? 'Wörter' : 'words'}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
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
            <div className="border-t border-slate-100 px-4 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {vocabulary.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-medium text-slate-800 min-w-0 flex-1">
                      {item.de}
                    </span>
                    <span className="text-slate-500 text-sm min-w-0 flex-1 text-right">
                      {item.en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VocabularyList;
