import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ComprehensionQuestions = ({ questions, theme }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const isGerman = i18n.language === 'de';

  if (!questions || questions.length === 0) return null;

  const toggleAnswer = (index) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const viewedCount = Object.values(revealedAnswers).filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header / Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
            <HelpCircle className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800">
              {isGerman ? 'Verständnisfragen' : 'Comprehension Questions'}
            </h3>
            <p className="text-xs text-slate-500">
              {questions.length} {isGerman ? 'Fragen' : 'questions'}
              {viewedCount > 0 && (
                <span className="text-emerald-600 ml-1">
                  ({viewedCount}/{questions.length} {isGerman ? 'beantwortet' : 'answered'})
                </span>
              )}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Questions List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 py-3 space-y-3">
              {questions.map((q, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-100 overflow-hidden"
                >
                  {/* Question */}
                  <div className="px-4 py-3 bg-slate-50">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">
                          {q.question_de}
                        </p>
                        {q.question_en && (
                          <p className="text-sm text-slate-500 mt-1 italic">
                            {q.question_en}
                          </p>
                        )}
                      </div>
                      {revealedAnswers[index] && (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>

                  {/* Answer toggle */}
                  <div className="px-4 py-2">
                    <button
                      onClick={() => toggleAnswer(index)}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      {revealedAnswers[index] ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          {isGerman ? 'Antwort verbergen' : 'Hide answer'}
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          {isGerman ? 'Antwort zeigen' : 'Show answer'}
                        </>
                      )}
                    </button>

                    <AnimatePresence>
                      {revealedAnswers[index] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <p className="text-sm font-medium text-emerald-800">
                              {q.answer_de}
                            </p>
                            {q.answer_en && (
                              <p className="text-xs text-emerald-600 mt-1 italic">
                                {q.answer_en}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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

export default ComprehensionQuestions;
