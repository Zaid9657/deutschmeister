import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, ListChecks } from 'lucide-react';
import Card from './ui/Card.jsx';
import Chip from './ui/Chip.jsx';

/**
 * Auto-checkable comprehension items on a reading lesson: Richtig/Falsch
 * statements (`type: 'rf'`) and exam-style "which ad/sign fits" choices
 * (`type: 'choice'`, options like ['a', 'b']). Rendered above the open
 * ComprehensionQuestions, since these are the ones a learner can actually
 * self-grade.
 *
 * Each item is answered by pressing a raised Chip — design-tokens.js rule 3:
 * a pressable surface is raised, and once answered it goes flat. The verdict
 * lands as a wash AND a word (limette "Richtig!" / himbeer "Leider falsch"),
 * never colour alone (docs/design/playbook.md). An answer, once given, is
 * locked — this is a check, not a multiple-attempt quiz.
 */
const ReadingChecks = ({ checks, onAllAnswered }) => {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';
  const [answers, setAnswers] = useState({});
  const firedRef = useRef(false);

  const total = checks?.length || 0;
  const answeredCount = Object.keys(answers).length;
  const correctCount = (checks || []).filter((c, i) => answers[i] === c.answer).length;
  const allAnswered = total > 0 && answeredCount >= total;

  useEffect(() => {
    if (allAnswered && !firedRef.current) {
      firedRef.current = true;
      onAllAnswered?.();
    }
  }, [allAnswered, onAllAnswered]);

  if (!checks || checks.length === 0) return null;

  const selectAnswer = (index, value) => {
    // An answer is locked once given — pressing a different chip after the
    // fact would let a learner "try again until right".
    setAnswers((prev) => (prev[index] != null ? prev : { ...prev, [index]: value }));
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-rule bg-paper-sunk px-6 py-4">
        <div className="w-9 h-9 rounded-clay bg-siegel-wash text-siegel flex items-center justify-center flex-shrink-0">
          <ListChecks className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display text-[1.0625rem] font-semibold text-ink">
            {isGerman ? 'Richtig oder falsch?' : 'True or false?'}
          </h3>
          <p className="font-data text-[0.6875rem] text-graphite">
            {allAnswered
              ? `${correctCount} ${isGerman ? 'von' : 'of'} ${total} ${isGerman ? 'richtig' : 'correct'}`
              : `${answeredCount}/${total} ${isGerman ? 'beantwortet' : 'answered'}`}
          </p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {checks.map((check, index) => {
          const selected = answers[index];
          const isAnswered = selected != null;
          const isCorrect = isAnswered && selected === check.answer;
          const options = check.type === 'choice' ? check.options : ['richtig', 'falsch'];
          const label = (opt) => {
            if (check.type === 'choice') return opt;
            return opt === 'richtig' ? (isGerman ? 'Richtig' : 'True') : (isGerman ? 'Falsch' : 'False');
          };

          return (
            <div key={index} className="rounded-clay border border-rule overflow-hidden">
              {/* Statement */}
              <div className="px-4 py-3 bg-paper-sunk">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-pill bg-white border border-rule flex items-center justify-center font-data text-[0.6875rem] font-bold text-ink">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-ink">{check.statement_de}</p>
                    {check.statement_en && (
                      <p className="text-sm text-graphite mt-1 italic">{check.statement_en}</p>
                    )}
                  </div>
                  {isAnswered && (
                    isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-accent-limette-ink flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-4 h-4 text-accent-himbeer-ink flex-shrink-0 mt-1" />
                    )
                  )}
                </div>
              </div>

              {/* Answer chips */}
              <div className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => {
                    const isThisSelected = selected === opt;
                    let tone = 'quiet';
                    if (isAnswered && isThisSelected) tone = isCorrect ? 'limette' : 'himbeer';
                    return (
                      <Chip
                        key={opt}
                        tone={tone}
                        raised={!isAnswered}
                        size="md"
                        onClick={isAnswered ? undefined : () => selectAnswer(index, opt)}
                        className={isAnswered && !isThisSelected ? 'opacity-50' : ''}
                      >
                        {label(opt)}
                      </Chip>
                    );
                  })}
                </div>

                {/* Verdict — wash AND a word, never colour alone */}
                {isAnswered && (
                  <div
                    className={`mt-3 p-3 rounded-clay border animate-pop-in ${
                      isCorrect
                        ? 'border-accent-limette bg-accent-limette-wash'
                        : 'border-accent-himbeer bg-accent-himbeer-wash'
                    }`}
                  >
                    <p className={`text-sm font-bold ${isCorrect ? 'text-accent-limette-ink' : 'text-accent-himbeer-ink'}`}>
                      {isCorrect ? (isGerman ? 'Richtig!' : 'Correct!') : (isGerman ? 'Leider falsch' : 'Not quite')}
                    </p>
                    {check.explanation_de && (
                      <p className={`text-xs mt-1 ${isCorrect ? 'text-accent-limette-ink/80' : 'text-accent-himbeer-ink/80'}`}>
                        {check.explanation_de}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ReadingChecks;
