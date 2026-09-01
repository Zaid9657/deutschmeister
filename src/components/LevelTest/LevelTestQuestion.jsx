import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';

// One written question. Deliberately CALM (docs/design/playbook.md): a stranger
// is being assessed, so nothing here celebrates, nothing shimmers and no accent
// carries meaning. Depth does the work — the question rests raised, each answer
// is a pressable clay slab that physically depresses, and the chosen one is
// marked by the single interactive colour plus its filled letter badge, never
// by colour alone.

// A pressable answer. The background lives inside the branch, not beside it:
// two competing `bg-*` utilities resolve by stylesheet order, not by the order
// they appear in the class string.
const optionClass = (selected) =>
  'flex w-full items-center gap-3 rounded-clay border px-4 py-3 text-left select-none ' +
  'shadow-raise transition-all duration-100 ease-snap active:translate-y-1 active:shadow-none ' +
  (selected ? 'border-siegel bg-siegel-wash' : 'border-rule bg-white hover:border-siegel');

const letterClass = (selected) =>
  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md font-data text-[0.8125rem] font-bold ' +
  (selected ? 'bg-siegel text-white' : 'bg-paper-sunk text-graphite');

const LevelTestQuestion = ({
  question,
  questionNumber,
  totalQuestions,
  currentLevel,
  onAnswer,
  onSkip
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleNext = () => {
    if (selectedIndex !== null) {
      onAnswer(selectedIndex);
      setSelectedIndex(null);
    }
  };

  const handleSkip = () => {
    onSkip();
    setSelectedIndex(null);
  };

  // Calculate progress percentage
  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-20 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-[1.125rem] font-semibold text-ink">Level Test</span>
          <Chip tone="label">{currentLevel}</Chip>
        </div>
        <Chip tone="quiet" className="tabular-nums">
          Question {questionNumber} of {totalQuestions}
        </Chip>
      </div>

      {/* Progress Bar — decorative; the counter chip above carries the number */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-paper-sunk" aria-hidden="true">
        <div
          className="h-full rounded-pill bg-siegel transition-[width] duration-300 ease-snap"
          // Dynamic: the only thing this screen computes into a style.
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Content */}
      <Card raised className="mt-6 p-5 sm:p-6">
        {/* Topic Label */}
        <span className="block font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
          {question.topicDisplayName}
        </span>

        {/* Reading Passage (if present) — reference text, flat */}
        {question.passage && (
          <Card tone="sunk" className="mt-4 border-l-4 border-l-siegel p-4">
            <p className="text-[0.9375rem] leading-relaxed text-ink">{question.passage}</p>
          </Card>
        )}

        {/* Question Text */}
        <h2 className="mt-4 font-display text-[1.25rem] font-semibold leading-snug tracking-[-0.01em] text-ink sm:text-[1.375rem]">
          {question.question}
        </h2>

        {/* Options */}
        <div className="mt-5 flex flex-col gap-2.5">
          {question.options.map((option, index) => (
            <button
              key={index}
              type="button"
              aria-pressed={selectedIndex === index}
              className={optionClass(selectedIndex === index)}
              onClick={() => setSelectedIndex(index)}
            >
              <span className={letterClass(selectedIndex === index)}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-[0.9375rem] leading-snug text-ink">{option}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Footer */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={handleSkip}>
          Skip
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedIndex === null}
        >
          {questionNumber === totalQuestions ? 'Finish' : 'Next question'}
        </Button>
      </div>
    </div>
  );
};

export default LevelTestQuestion;
