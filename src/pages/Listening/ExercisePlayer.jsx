import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useExerciseDetails, useSaveProgress } from '../../hooks/useListening';
import { calculateScore, allQuestionsAnswered, getAudioUrl } from '../../utils/listeningHelpers';
import AudioPlayer from '../../components/listening/AudioPlayer';
import QuestionCard from '../../components/listening/QuestionCard';
import ResultsView from '../../components/listening/ResultsView';
import SEO from '../../components/SEO';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import Reveal from '../../components/ui/Reveal.jsx';

const ExercisePlayer = () => {
  const { level, exerciseNumber } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';
  // The route level is lowercase (/listening/a1.1/…); the DB and the storage
  // folders use the uppercase form — normalize before every display.
  const levelKey = (level || '').toUpperCase();

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
    if (submitted || questions.length === 0) return;

    const calculatedScore = calculateScore(questions, answers);
    setScore(calculatedScore);
    setSubmitted(true);

    if (exercise) {
      setSaving(true);
      try {
        await saveProgress(exercise.id, calculatedScore, answers, playsUsed);
      } catch (err) {
        console.error('Error saving progress:', err);
      } finally {
        setSaving(false);
      }
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
      <div className="min-h-screen bg-paper pt-24 flex items-center justify-center" role="status" aria-label="Loading">
        <div className="animate-spin w-8 h-8 border-4 border-rule border-t-siegel rounded-full" aria-hidden="true" />
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-paper pt-24 px-4">
        <div className="max-w-3xl mx-auto py-16">
          <Card className="p-8 text-center">
            <p className="text-graphite mb-6">{error || (isGerman ? 'Übung nicht gefunden.' : 'Exercise not found.')}</p>
            <Button onClick={() => navigate(`/listening/${(level || '').toLowerCase()}`)}>
              {isGerman ? 'Zurück zu den Übungen' : 'Back to exercises'}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const audioUrl = getAudioUrl(level, exerciseNumber);
  const allAnswered = allQuestionsAnswered(questions, answers);

  return (
    <div className="min-h-screen bg-paper font-body text-ink pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title={`Listening Exercise ${exerciseNumber} - German ${levelKey}`}
        description={`German listening comprehension exercise ${exerciseNumber} for level ${levelKey}. Listen to native speaker dialogues and answer questions.`}
        path={`/listening/${(level || '').toLowerCase()}/${exerciseNumber}`}
      />
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/listening/${(level || '').toLowerCase()}`)}
          className="mb-4 -ml-3"
        >
          <ArrowLeft size={18} />
          {levelKey} - {isGerman ? 'Übungen' : 'Exercises'}
        </Button>

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
            nextExerciseHref={
              // 6 exercises per level (listening_exercises, marketing.js);
              // after the last one the results CTA falls back to the list.
              Number(exerciseNumber) < 6
                ? `/listening/${(level || '').toLowerCase()}/${Number(exerciseNumber) + 1}`
                : null
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Exercise header */}
            <div>
              <Chip tone="label" className="mb-3">{levelKey}</Chip>
              <SectionHeading
                level={1}
                title={exercise.title || `${isGerman ? 'Übung' : 'Exercise'} ${exerciseNumber}`}
                lead={exercise.description || undefined}
              />
            </div>

            {/* Audio player */}
            <Reveal delay={80}>
              <AudioPlayer
                src={audioUrl}
                onPlayCountChange={setPlaysUsed}
              />
              <p className="font-data text-[0.6875rem] text-graphite mt-2 text-center">
                {isGerman
                  ? 'Höre dir den Dialog an und beantworte die Fragen unten.'
                  : 'Listen to the dialogue and answer the questions below.'}
              </p>
            </Reveal>

            {/* Questions */}
            <div className="space-y-4">
              <h3 className="font-display text-[1.0625rem] font-semibold text-ink">
                {isGerman ? 'Fragen' : 'Questions'} ({Object.keys(answers).length}/{questions.length})
              </h3>
              {questions.map((q, i) => (
                <QuestionCard
                  key={q.id || q.question_number}
                  question={q}
                  selectedAnswer={answers[q.id || q.question_number]}
                  onAnswer={handleAnswer}
                  index={i}
                />
              ))}
            </div>

            {/* Submit button — the one primary action on this screen */}
            <Button
              size="lg"
              shimmer
              onClick={handleSubmit}
              disabled={!allAnswered || saving}
              className="w-full"
            >
              <Send size={18} />
              {saving
                ? (isGerman ? 'Wird gespeichert...' : 'Saving...')
                : (isGerman ? 'Antworten abgeben' : 'Submit Answers')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExercisePlayer;
