import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Reveal from '../ui/Reveal.jsx';
import { isQuestionCorrect } from '../../utils/listeningHelpers';

// Extract answer key from option string: "a) 2,50 €" → "a", "Richtig" → "Richtig"
const getAnswerKey = (option) => {
  const match = option.match(/^([a-d])\)/);
  return match ? match[1] : option;
};

// One comprehension question. Depth carries the state (design-tokens.js rule 3):
// while the exercise is live every option is a raised, pressable surface that
// depresses under the pointer; once the answers are in they all go FLAT and the
// verdict is carried by a wash AND an icon — never by colour alone.
const QuestionCard = ({ question, selectedAnswer, onAnswer, showResult = false, index }) => {
  const options = question.options || [];
  const questionKey = question.id || question.question_number;
  const isDictation = question.question_type === 'dictation';
  // Draft text for a dictation answer, registered into the shared `answers`
  // state only once the learner presses "Prüfen" — mirrors how a multiple-
  // choice option is only registered on click, not on hover.
  const [draft, setDraft] = useState(selectedAnswer || '');

  if (isDictation) {
    const hasAnswer = selectedAnswer != null && selectedAnswer !== '';
    const isCorrect = showResult && hasAnswer && isQuestionCorrect(question, selectedAnswer);

    return (
      <Reveal delay={index * 70}>
        <Card className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex-shrink-0 w-7 h-7 rounded-pill bg-siegel-wash text-siegel-deep flex items-center justify-center font-data text-[0.75rem] font-bold">
              {question.question_number || (index + 1)}
            </span>
            <p className="text-ink font-bold leading-relaxed">{question.question_text}</p>
          </div>

          <div className="ml-10 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={showResult ? (selectedAnswer || '') : draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={showResult}
                placeholder="Antwort eingeben..."
                className={`flex-1 min-w-0 px-4 py-3 rounded-clay border font-body text-ink transition-colors duration-100 ${
                  showResult
                    ? hasAnswer
                      ? isCorrect
                        ? 'border-accent-limette bg-accent-limette-wash text-accent-limette-ink'
                        : 'border-accent-himbeer bg-accent-himbeer-wash text-accent-himbeer-ink'
                      : 'border-rule bg-paper-sunk text-graphite'
                    : 'border-rule bg-white focus:border-siegel focus:outline-none'
                }`}
              />
              {!showResult && (
                <button
                  type="button"
                  onClick={() => draft.trim() && onAnswer(questionKey, draft.trim())}
                  disabled={!draft.trim()}
                  className="flex-shrink-0 px-4 py-3 rounded-clay border border-rule bg-white text-ink font-bold shadow-raise transition-all duration-100 ease-snap hover:border-siegel active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:pointer-events-none"
                >
                  Prüfen
                </button>
              )}
              {showResult && hasAnswer && (
                isCorrect ? (
                  <CheckCircle size={22} className="flex-shrink-0 self-center text-accent-limette-ink" />
                ) : (
                  <XCircle size={22} className="flex-shrink-0 self-center text-accent-himbeer-ink" />
                )
              )}
            </div>
            {showResult && !isCorrect && (
              <p className="text-sm text-graphite">
                Richtig: <span className="font-bold text-ink">{question.correct_answer}</span>
              </p>
            )}
          </div>

          {showResult && question.explanation && (
            <Card tone="sunk" className="mt-3 ml-10 p-3 animate-pop-in">
              <p className="text-sm text-graphite">{question.explanation}</p>
            </Card>
          )}
        </Card>
      </Reveal>
    );
  }

  return (
    <Reveal delay={index * 70}>
      <Card className="p-5">
        {/* Question header */}
        <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-pill bg-siegel-wash text-siegel-deep flex items-center justify-center font-data text-[0.75rem] font-bold">
            {question.question_number || (index + 1)}
          </span>
          <p className="text-ink font-bold leading-relaxed">{question.question_text}</p>
        </div>

        {/* Options */}
        <div className="space-y-2 ml-10">
          {options.map((option, i) => {
            const isSelected = selectedAnswer === option;
            const optionKey = getAnswerKey(option);
            const isCorrectOption = question.correct_answer === optionKey;

            // Live: raised and pressable. Answered: flat, verdict-tinted.
            let state = 'border-rule bg-white text-ink shadow-raise hover:border-siegel active:translate-y-1 active:shadow-none';

            if (showResult) {
              if (isCorrectOption) {
                state = 'border-accent-limette bg-accent-limette-wash text-accent-limette-ink';
              } else if (isSelected && !isCorrectOption) {
                state = 'border-accent-himbeer bg-accent-himbeer-wash text-accent-himbeer-ink';
              } else {
                state = 'border-rule bg-paper-sunk text-graphite';
              }
            } else if (isSelected) {
              state = 'border-siegel bg-siegel-wash text-siegel-deep shadow-raise active:translate-y-1 active:shadow-none';
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => !showResult && onAnswer(questionKey, option)}
                disabled={showResult}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-clay border select-none transition-all duration-100 ease-snap ${state} ${
                  showResult ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <span className="flex-1">{option}</span>
                {showResult && isCorrectOption && <CheckCircle size={18} className="flex-shrink-0" />}
                {showResult && isSelected && !isCorrectOption && <XCircle size={18} className="flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation (shown after submit) */}
        {showResult && question.explanation && (
          <Card tone="sunk" className="mt-3 ml-10 p-3 animate-pop-in">
            <p className="text-sm text-graphite">{question.explanation}</p>
          </Card>
        )}
      </Card>
    </Reveal>
  );
};

export default QuestionCard;
