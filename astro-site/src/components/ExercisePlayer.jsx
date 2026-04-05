import { useState } from 'react';

const ICONS = {
  correct: '✓',
  wrong: '✗',
};

function MultipleChoice({ exercise, onAnswer, answered }) {
  const [selected, setSelected] = useState(null);

  const choose = (opt) => {
    if (answered) return;
    setSelected(opt);
    onAnswer(opt === exercise.correct_answer);
  };

  return (
    <div className="space-y-2">
      {(exercise.options ?? []).map((opt) => {
        const isSelected = selected === opt;
        const isCorrect = opt === exercise.correct_answer;
        let cls = 'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ';
        if (!answered) {
          cls += 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50';
        } else if (isCorrect) {
          cls += 'border-emerald-400 bg-emerald-50 text-emerald-800';
        } else if (isSelected) {
          cls += 'border-red-400 bg-red-50 text-red-800';
        } else {
          cls += 'border-slate-200 bg-white text-slate-400';
        }

        return (
          <button key={opt} onClick={() => choose(opt)} className={cls} disabled={answered}>
            <span className="flex items-center gap-3">
              {answered && isCorrect && <span className="text-emerald-500 font-bold">{ICONS.correct}</span>}
              {answered && isSelected && !isCorrect && <span className="text-red-500 font-bold">{ICONS.wrong}</span>}
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FillBlank({ exercise, onAnswer, answered }) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!value.trim() || submitted) return;
    setSubmitted(true);
    onAnswer(value.trim().toLowerCase() === exercise.correct_answer.toLowerCase());
  };

  const isCorrect = value.trim().toLowerCase() === exercise.correct_answer.toLowerCase();

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        disabled={submitted}
        placeholder="Antwort eingeben…"
        className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm transition-all focus:outline-none ${
          submitted
            ? isCorrect
              ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
              : 'border-red-400 bg-red-50 text-red-800'
            : 'border-slate-200 focus:border-indigo-400'
        }`}
      />
      {!submitted && (
        <button
          onClick={submit}
          className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
        >
          Prüfen
        </button>
      )}
      {submitted && !isCorrect && (
        <span className="flex items-center px-3 text-sm text-slate-600">
          → <strong className="ml-1">{exercise.correct_answer}</strong>
        </span>
      )}
    </div>
  );
}

export default function ExercisePlayer({ exercises }) {
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState([]); // array of booleans
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [done, setDone] = useState(false);

  if (!exercises || exercises.length === 0) {
    return (
      <p className="text-slate-500 text-sm italic">Für dieses Thema sind noch keine Übungen verfügbar.</p>
    );
  }

  const exercise = exercises[current];
  const score = results.filter(Boolean).length;

  const handleAnswer = (correct) => {
    setAnswered(true);
    setShowExplanation(true);
    setResults((r) => [...r, correct]);
  };

  const next = () => {
    if (current + 1 >= exercises.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setAnswered(false);
      setShowExplanation(false);
    }
  };

  const restart = () => {
    setCurrent(0);
    setResults([]);
    setAnswered(false);
    setShowExplanation(false);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / exercises.length) * 100);
    return (
      <div className="text-center py-8">
        <div className={`text-5xl font-bold mb-2 ${pct >= 70 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
          {pct}%
        </div>
        <p className="text-slate-600 mb-1">{score} von {exercises.length} richtig</p>
        <p className="text-slate-500 text-sm mb-6">
          {pct >= 70 ? 'Ausgezeichnet! Du hast das Thema gut verstanden.' : pct >= 40 ? 'Guter Anfang — lies die Regeln nochmal durch und versuche es erneut.' : 'Kein Problem — Grammatik braucht Übung. Nochmal von vorne!'}
        </p>
        <button
          onClick={restart}
          className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
        >
          Nochmal üben
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">Frage {current + 1} von {exercises.length}</span>
        <div className="flex gap-1">
          {exercises.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < results.length
                  ? results[i] ? 'bg-emerald-400' : 'bg-red-400'
                  : i === current ? 'bg-indigo-400' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <p className="font-semibold text-slate-800 mb-4 text-base">{exercise.question_en}</p>

      {/* Input */}
      {exercise.exercise_type === 'multiple_choice' ? (
        <MultipleChoice exercise={exercise} onAnswer={handleAnswer} answered={answered} />
      ) : (
        <FillBlank exercise={exercise} onAnswer={handleAnswer} answered={answered} />
      )}

      {/* Explanation */}
      {showExplanation && exercise.explanation_en && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
          <strong>Erklärung:</strong> {exercise.explanation_en}
        </div>
      )}

      {/* Next */}
      {answered && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={next}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            {current + 1 >= exercises.length ? 'Ergebnis ansehen →' : 'Weiter →'}
          </button>
        </div>
      )}
    </div>
  );
}
