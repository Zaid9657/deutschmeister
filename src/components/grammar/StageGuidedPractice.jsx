import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Lightbulb, PenTool } from 'lucide-react';

const StageGuidedPractice = ({ content, isGerman, theme, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  if (!content || !content.exercises) {
    return (
      <div className="text-center py-8 text-slate-500">
        {isGerman ? 'Übungen werden geladen...' : 'Loading exercises...'}
      </div>
    );
  }

  const { title, instructions, exercises } = content;
  const currentExercise = exercises[currentIndex];
  const totalQuestions = exercises.length;
  const progress = ((currentIndex + (showFeedback ? 1 : 0)) / totalQuestions) * 100;

  const checkAnswer = () => {
    let correct = false;

    if (currentExercise.type === 'multiple-choice') {
      correct = selectedAnswer === currentExercise.correct;
    } else if (currentExercise.type === 'fill-blank') {
      const userAnswer = textAnswer.trim().toLowerCase();
      correct = currentExercise.acceptableAnswers.some(
        ans => ans.toLowerCase() === userAnswer
      );
    }

    setIsCorrect(correct);
    setShowFeedback(true);
    setAnsweredQuestions([...answeredQuestions, { index: currentIndex, correct }]);

    if (correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setTextAnswer('');
      setShowFeedback(false);
    } else {
      setCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setTextAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setScore(0);
    setCompleted(false);
    setAnsweredQuestions([]);
  };

  const canSubmit = currentExercise?.type === 'multiple-choice'
    ? selectedAnswer !== null
    : textAnswer.trim().length > 0;

  // Completed screen
  if (completed) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= 70;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
          passed ? 'bg-emerald-100' : 'bg-amber-100'
        }`}>
          {passed ? (
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          ) : (
            <RotateCcw className="w-12 h-12 text-amber-500" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-slate-800 mb-2">
          {passed
            ? (isGerman ? 'Sehr gut!' : 'Great Job!')
            : (isGerman ? 'Weiter üben!' : 'Keep Practicing!')}
        </h3>

        <p className="text-lg text-slate-600 mb-4">
          {isGerman
            ? `Du hast ${score} von ${totalQuestions} richtig (${percentage}%)`
            : `You got ${score} out of ${totalQuestions} correct (${percentage}%)`}
        </p>

        {/* Score breakdown */}
        <div className="flex justify-center gap-2 mb-6">
          {answeredQuestions.map((q, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                q.correct ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={resetQuiz}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            {isGerman ? 'Nochmal üben' : 'Practice Again'}
          </button>

          {passed && onComplete && (
            <button
              onClick={onComplete}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white bg-gradient-to-r ${theme.gradient} hover:shadow-lg transition-all`}
            >
              {isGerman ? 'Weiter zur Meisterschaft' : 'Continue to Mastery'}
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {!passed && (
          <p className="mt-4 text-sm text-slate-500">
            {isGerman
              ? 'Du brauchst 70% um weiterzumachen. Versuche es nochmal!'
              : 'You need 70% to proceed. Try again!'}
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-display font-bold text-slate-800 mb-2">
          {isGerman ? title.de : title.en}
        </h3>
        <p className="text-slate-600 text-sm">
          {isGerman ? instructions.de : instructions.en}
        </p>
      </motion.div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>{isGerman ? 'Frage' : 'Question'} {currentIndex + 1} / {totalQuestions}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full bg-gradient-to-r ${theme.gradient} rounded-full`}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          {/* Question */}
          <div className="flex items-start gap-3 mb-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              currentExercise.type === 'fill-blank' ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              <PenTool className={`w-5 h-5 ${
                currentExercise.type === 'fill-blank' ? 'text-purple-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                currentExercise.type === 'fill-blank'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {currentExercise.type === 'fill-blank'
                  ? (isGerman ? 'Lückentext' : 'Fill in the blank')
                  : (isGerman ? 'Multiple Choice' : 'Multiple Choice')}
              </span>
              <p className="text-lg font-medium text-slate-800 mt-2">
                {isGerman ? currentExercise.question.de : currentExercise.question.en}
              </p>
            </div>
          </div>

          {/* Answer Options */}
          {currentExercise.type === 'multiple-choice' && (
            <div className="space-y-3">
              {currentExercise.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const showCorrect = showFeedback && index === currentExercise.correct;
                const showWrong = showFeedback && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => !showFeedback && setSelectedAnswer(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      showCorrect
                        ? 'border-emerald-500 bg-emerald-50'
                        : showWrong
                          ? 'border-rose-500 bg-rose-50'
                          : isSelected
                            ? `border-blue-500 bg-blue-50`
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        showCorrect
                          ? 'bg-emerald-500 text-white'
                          : showWrong
                            ? 'bg-rose-500 text-white'
                            : isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-100 text-slate-600'
                      }`}>
                        {showCorrect ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : showWrong ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-medium">
                            {String.fromCharCode(65 + index)}
                          </span>
                        )}
                      </div>
                      <span className={`${
                        showCorrect ? 'text-emerald-800' : showWrong ? 'text-rose-800' : 'text-slate-700'
                      }`}>
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Fill in the blank */}
          {currentExercise.type === 'fill-blank' && (
            <div className="space-y-3">
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => !showFeedback && setTextAnswer(e.target.value)}
                disabled={showFeedback}
                placeholder={isGerman ? 'Deine Antwort...' : 'Your answer...'}
                className={`w-full p-4 rounded-xl border-2 text-lg ${
                  showFeedback
                    ? isCorrect
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-rose-500 bg-rose-50'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                } outline-none transition-all`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit && !showFeedback) {
                    checkAnswer();
                  }
                }}
              />
              {showFeedback && !isCorrect && (
                <p className="text-sm text-slate-600">
                  {isGerman ? 'Richtige Antwort: ' : 'Correct answer: '}
                  <span className="font-semibold text-emerald-600">
                    {currentExercise.answer}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Feedback */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-3"
              >
                {/* Basic feedback */}
                <div className={`p-4 rounded-xl ${
                  isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Lightbulb className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-semibold ${isCorrect ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {isCorrect
                          ? (isGerman ? 'Richtig!' : 'Correct!')
                          : (isGerman ? 'Nicht ganz...' : 'Not quite...')}
                      </p>
                      {currentExercise.explanation && (currentExercise.explanation.en || currentExercise.explanation.de) && (
                        <p className={`text-sm mt-1 ${isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {isGerman ? currentExercise.explanation.de : currentExercise.explanation.en}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* NEW: Detailed "Why Correct" explanation (for correct answers only) */}
                {isCorrect && currentExercise.whyCorrect && (currentExercise.whyCorrect.en || currentExercise.whyCorrect.de) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                          {isGerman ? '💡 Warum ist das richtig?' : '💡 Why This Is Correct'}
                        </h5>
                        <p className="text-blue-800 leading-relaxed text-sm">
                          {isGerman ? currentExercise.whyCorrect.de : currentExercise.whyCorrect.en}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Action Button */}
      <div className="flex justify-end">
        {!showFeedback ? (
          <button
            onClick={checkAnswer}
            disabled={!canSubmit}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              canSubmit
                ? `bg-gradient-to-r ${theme.gradient} text-white hover:shadow-lg`
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isGerman ? 'Überprüfen' : 'Check Answer'}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r ${theme.gradient} hover:shadow-lg transition-all`}
          >
            {currentIndex < totalQuestions - 1
              ? (isGerman ? 'Nächste Frage' : 'Next Question')
              : (isGerman ? 'Ergebnisse anzeigen' : 'See Results')}
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default StageGuidedPractice;
