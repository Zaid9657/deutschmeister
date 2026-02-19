import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DialogueTranscript = ({ dialogues }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  if (!dialogues || dialogues.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <FileText size={18} />
          {isGerman ? 'Transkript anzeigen' : 'Show Transcript'}
        </div>
        {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>

      {/* Transcript content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
              {dialogues.map((dialogue) => (
                <div key={dialogue.id || dialogue.dialogue_number} className="flex gap-3">
                  {/* Speaker label */}
                  <span className="flex-shrink-0 w-20 text-right text-sm font-medium text-indigo-600">
                    {dialogue.speaker || `Speaker ${dialogue.dialogue_number}`}:
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-800 text-sm leading-relaxed">{dialogue.german_text}</p>
                    {dialogue.english_text && (
                      <p className="text-slate-400 text-xs mt-0.5 italic">{dialogue.english_text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DialogueTranscript;
