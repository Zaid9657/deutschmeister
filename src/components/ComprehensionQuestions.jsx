import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, HelpCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Card from './ui/Card.jsx';
import Chip from './ui/Chip.jsx';

// Comprehension questions on a reading lesson. Questions are reference
// material, so the panel and every question row stay FLAT (design-tokens.js
// rule 3); the one thing you can press — "show answer" — is a raised chip,
// and the revealed answer arrives as a limette (success) wash WITH a check,
// never as colour alone.
const ComprehensionQuestions = ({ questions }) => {
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
    <Card className="overflow-hidden">
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-paper-sunk transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-clay bg-siegel-wash text-siegel flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h3 className="font-display text-[1.0625rem] font-semibold text-ink">
              {isGerman ? 'Verständnisfragen' : 'Comprehension Questions'}
            </h3>
            <p className="font-data text-[0.6875rem] text-graphite">
              {questions.length} {isGerman ? 'Fragen' : 'questions'}
              {viewedCount > 0 && (
                <span className="text-accent-limette-ink ml-1">
                  ({viewedCount}/{questions.length} {isGerman ? 'beantwortet' : 'answered'})
                </span>
              )}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-graphite" />
        ) : (
          <ChevronDown className="w-5 h-5 text-graphite" />
        )}
      </button>

      {/* Questions List */}
      {isOpen && (
        <div className="border-t border-rule px-4 py-3 space-y-3 animate-pop-in">
          {questions.map((q, index) => (
            <div
              key={index}
              className="rounded-clay border border-rule overflow-hidden"
            >
              {/* Question */}
              <div className="px-4 py-3 bg-paper-sunk">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-pill bg-white border border-rule flex items-center justify-center font-data text-[0.6875rem] font-bold text-ink">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-ink">
                      {q.question_de}
                    </p>
                    {q.question_en && (
                      <p className="text-sm text-graphite mt-1 italic">
                        {q.question_en}
                      </p>
                    )}
                  </div>
                  {revealedAnswers[index] && (
                    <CheckCircle className="w-4 h-4 text-accent-limette-ink flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>

              {/* Answer toggle */}
              <div className="px-4 py-3">
                <Chip tone="quiet" raised size="md" onClick={() => toggleAnswer(index)}>
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
                </Chip>

                {revealedAnswers[index] && (
                  <div className="mt-3 p-3 rounded-clay border border-accent-limette bg-accent-limette-wash animate-pop-in">
                    <p className="text-sm font-bold text-accent-limette-ink">
                      {q.answer_de}
                    </p>
                    {q.answer_en && (
                      <p className="text-xs text-accent-limette-ink/80 mt-1 italic">
                        {q.answer_en}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ComprehensionQuestions;
