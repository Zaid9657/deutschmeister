import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Trophy,
  Shuffle,
  Languages,
  Star
} from 'lucide-react';

const StageMastery = ({ content, isGerman, theme, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  const { title, instructions, exercises } = content || {};
  const currentExercise = exercises?.[currentIndex];
  const totalQuestions = exercises?.length || 0;
  const progress = ((currentIndex + (showFeedback ? 1 : 0)) / totalQuestions) * 100;

  // Initialize word order exercise
  useEffect(() => {
    if (currentExercise?.type === 'word-order') {
      // Shuffle the words
      const shuffled = [...currentExercise.words].sort(() => Math.random() - 0.5);
      setAvailableWords(shuffled);
      setSelectedWords([]);
    }
  }, [currentIndex, currentExercise]);

  if (!content || !content.exercises) {
    return (
      <div className="text-center py-8 text-slate-500">
        {isGerman ? 'Übungen werden geladen...' : 'Loading exercises...'}
      </div>
    );
  }

  const handleWordSelect = (word, index) => {
    setSelectedWords([...selectedWords, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
  };

  const handleWordRemove = (word, index) => {
    setAvailableWords([...availableWords, word]);
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
  };

  const resetWordOrder = () => {
    const shuffled = [...currentExercise.words].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setSelectedWords([]);
  };

  const checkAnswer = () => {
    let correct = false;

    if (currentExercise.type === 'word-order') {
      // Check if words are in correct order
      correct = selectedWords.length === currentExercise.correctOrder.length &&
        selectedWords.every((word, i) => word === currentExercise.correctOrder[i]);
    } else if (currentExercise.type === 'translation') {
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
      setSelectedWords([]);
      setAvailableWords([]);
      setTextAnswer('');
      setShowFeedback(false);
    } else {
      setCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedWords([]);
    setAvailableWords([]);
    setTextAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setScore(0);
    setCompleted(false);
    setAnsweredQuestions([]);
  };

  const canSubmit = currentExercise?.type === 'word-order'
    ? selectedWords.length === currentExercise.words.length
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
        <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-6 ${
          passed ? 'bg-gradient-to-br from-amber-400 to-rose-500' : 'bg-slate-100'
        }`}>
          {passed ? (
            <Trophy className="w-14 h-14 text-white" />
          ) : (
            <RotateCcw className="w-12 h-12 text-slate-400" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-slate-800 mb-2">
          {passed
            ? (isGerman ? 'Meisterschaft erreicht!' : 'Mastery Achieved!')
            : (isGerman ? 'Fast geschafft!' : 'Almost There!')}
        </h3>

        <p className="text-lg text-slate-600 mb-4">
          {isGerman
            ? `Du hast ${score} von ${totalQuestions} richtig (${percentage}%)`
            : `You got ${score} out of ${totalQuestions} correct (${percentage}%)`}
        </p>

        {/* Star rating */}
        <div className="flex justify-center gap-1 mb-6">
          {[1, 2, 3].map((star) => (
            <Star
              key={star}
              className={`w-8 h-8 ${
                percentage >= star * 33
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-200'
              }`}
            />
          ))}
        </div>

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
            {isGerman ? 'Nochmal versuchen' : 'Try Again'}
          </button>

          {passed && onComplete && (
            <button
              onClick={onComplete}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white bg-gradient-to-r ${theme.gradient} hover:shadow-lg transition-all`}
            >
              <Trophy className="w-5 h-5" />
              {isGerman ? 'Thema abschließen' : 'Complete Topic'}
            </button>
          )}
        </div>

        {!passed && (
          <p className="mt-4 text-sm text-slate-500">
            {isGerman
              ? 'Du brauchst 70% für die Meisterschaft. Du schaffst das!'
              : 'You need 70% for mastery. You can do it!'}
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
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          <h3 className="text-xl font-display font-bold text-slate-800">
            {isGerman ? title.de : title.en}
          </h3>
        </div>
        <p className="text-slate-600 text-sm">
          {isGerman ? instructions.de : instructions.en}
        </p>
      </motion.div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>{isGerman ? 'Aufgabe' : 'Challenge'} {currentIndex + 1} / {totalQuestions}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
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
              currentExercise.type === 'word-order' ? 'bg-rose-100' : 'bg-amber-100'
            }`}>
              {currentExercise.type === 'word-order' ? (
                <Shuffle className="w-5 h-5 text-rose-600" />
              ) : (
                <Languages className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                currentExercise.type === 'word-order'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {currentExercise.type === 'word-order'
                  ? (isGerman ? 'Wörter ordnen' : 'Arrange Words')
                  : (isGerman ? 'Übersetzen' : 'Translation')}
              </span>
              <p className="text-lg font-medium text-slate-800 mt-2">
                {isGerman ? currentExercise.question.de : currentExercise.question.en}
              </p>
            </div>
          </div>

          {/* Word Order Exercise */}
          {currentExercise.type === 'word-order' && (
            <div className="space-y-4">
              {/* Selected words (answer area) */}
              <div className="min-h-[60px] p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
                <div className="flex flex-wrap gap-2">
                  {selectedWords.length === 0 ? (
                    <span className="text-slate-400 text-sm">
                      {isGerman ? 'Klicke auf die Wörter unten...' : 'Click the words below...'}
                    </span>
                  ) : (
                    selectedWords.map((word, index) => (
                      <motion.button
                        key={`selected-${index}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => !showFeedback && handleWordRemove(word, index)}
                        disabled={showFeedback}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          showFeedback
                            ? isCorrect
                              ? 'bg-emerald-500 text-white'
                              : 'bg-rose-500 text-white'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {word}
                      </motion.button>
                    ))
                  )}
                </div>
              </div>

              {/* Available words */}
              <div className="flex flex-wrap gap-2 justify-center">
                {availableWords.map((word, index) => (
                  <motion.button
                    key={`available-${index}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => !showFeedback && handleWordSelect(word, index)}
                    disabled={showFeedback}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                  >
                    {word}
                  </motion.button>
                ))}
              </div>

              {/* Reset button */}
              {selectedWords.length > 0 && !showFeedback && (
                <button
                  onClick={resetWordOrder}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mx-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  {isGerman ? 'Zurücksetzen' : 'Reset'}
                </button>
              )}

              {/* Show correct answer if wrong */}
              {showFeedback && !isCorrect && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-800">
                    <span className="font-semibold">{isGerman ? 'Richtige Reihenfolge: ' : 'Correct order: '}</span>
                    {currentExercise.correctOrder.join(' → ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Translation Exercise */}
          {currentExercise.type === 'translation' && (
            <div className="space-y-3">
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => !showFeedback && setTextAnswer(e.target.value)}
                disabled={showFeedback}
                placeholder={isGerman ? 'Schreibe deine Antwort...' : 'Type your answer...'}
                className={`w-full p-4 rounded-xl border-2 text-lg ${
                  showFeedback
                    ? isCorrect
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-rose-500 bg-rose-50'
                    : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
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
                className={`mt-6 p-4 rounded-xl ${
                  isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Lightbulb className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-semibold ${isCorrect ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {isCorrect
                        ? (isGerman ? 'Ausgezeichnet!' : 'Excellent!')
                        : (isGerman ? 'Guter Versuch!' : 'Good try!')}
                    </p>
                    <p className={`text-sm mt-1 ${isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isGerman ? currentExercise.explanation.de : currentExercise.explanation.en}
                    </p>
                  </div>
                </div>
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
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:shadow-lg'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isGerman ? 'Überprüfen' : 'Check Answer'}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:shadow-lg transition-all"
          >
            {currentIndex < totalQuestions - 1
              ? (isGerman ? 'Nächste Aufgabe' : 'Next Challenge')
              : (isGerman ? 'Ergebnisse anzeigen' : 'See Results')}
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default StageMastery;
