import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useExerciseDetails, useSaveProgress } from '../../hooks/useListening';
import { calculateScore, allQuestionsAnswered, getAudioUrl, getLevelTheme } from '../../utils/listeningHelpers';
import AudioPlayer from '../../components/listening/AudioPlayer';
import QuestionCard from '../../components/listening/QuestionCard';
import ResultsView from '../../components/listening/ResultsView';

const ExercisePlayer = () => {
  const { level, exerciseNumber } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';
  const theme = getLevelTheme(level);

  const { exercise, dialogues, questions, loading, error } = useExerciseDetails(level, exerciseNumber);
  const { saveProgress } = useSaveProgress();

  const [answers, setAnswers] = useState({});
  const [playsUsed, setPlaysUsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleAnswer = (questionNumber, answer) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionNumber]: answer }));
  };

  const handleSubmit = async () => {
    if (!allQuestionsAnswered(questions, answers) || submitted) return;

    const calculatedScore = calculateScore(questions, answers);
    setScore(calculatedScore);
    setSubmitted(true);

    if (exercise) {
      setSaving(true);
      await saveProgress(exercise.id, calculatedScore, answers, playsUsed);
      setSaving(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setPlaysUsed(0);
    setSubmitted(false);
    setScore(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-slate-500 mb-4">{error || (isGerman ? 'Übung nicht gefunden.' : 'Exercise not found.')}</p>
          <button
            onClick={() => navigate(`/listening/${level}`)}
            className="text-indigo-500 hover:underline"
          >
            {isGerman ? 'Zurück zu den Übungen' : 'Back to exercises'}
          </button>
        </div>
      </div>
    );
  }

  const audioUrl = getAudioUrl(level, exerciseNumber);
  const allAnswered = allQuestionsAnswered(questions, answers);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(`/listening/${level}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          {level} - {isGerman ? 'Übungen' : 'Exercises'}
        </motion.button>

        {/* If submitted, show results */}
        {submitted ? (
          <ResultsView
            exercise={exercise}
            questions={questions}
            answers={answers}
            score={score}
            dialogues={dialogues}
            playsUsed={playsUsed}
            onRetry={handleRetry}
          />
        ) : (
          <div className="space-y-6">
            {/* Exercise header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-display font-bold text-slate-800 mb-1">
                {exercise.title || `${isGerman ? 'Übung' : 'Exercise'} ${exerciseNumber}`}
              </h1>
              {exercise.description && (
                <p className="text-slate-500">{exercise.description}</p>
              )}
            </motion.div>

            {/* Audio player */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <AudioPlayer
                src={audioUrl}
                onPlayCountChange={setPlaysUsed}
              />
              <p className="text-xs text-slate-400 mt-2 text-center">
                {isGerman
                  ? 'Höre dir den Dialog an und beantworte die Fragen unten.'
                  : 'Listen to the dialogue and answer the questions below.'}
              </p>
            </motion.div>

            {/* Questions */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-slate-700">
                {isGerman ? 'Fragen' : 'Questions'} ({Object.keys(answers).length}/{questions.length})
              </h3>
              {questions.map((q, i) => (
                <QuestionCard
                  key={q.id || q.question_number}
                  question={q}
                  selectedAnswer={answers[q.question_number]}
                  onAnswer={handleAnswer}
                  index={i}
                />
              ))}
            </div>

            {/* Submit button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!allAnswered || saving}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white transition-all ${
                allAnswered
                  ? 'hover:opacity-90 shadow-lg'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              style={{ backgroundColor: allAnswered ? theme.primary : '#94a3b8' }}
            >
              <Send size={18} />
              {saving
                ? (isGerman ? 'Wird gespeichert...' : 'Saving...')
                : (isGerman ? 'Antworten abgeben' : 'Submit Answers')}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExercisePlayer;
