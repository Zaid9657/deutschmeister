import { useState, useRef } from 'react';
import { Headphones, Play, Pause, Loader2, Volume2, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import Reveal from '../ui/Reveal.jsx';

// The listening step of the placement test. Calm like the written step; the
// transport reuses the /listening/ player's treatment (docs/design/playbook.md):
// one large round siegel button that depresses on press, and the equalizer bars
// running ONLY while audio is actually coming out — paused is seven still dots,
// so motion always means sound.
//
// Every audio/media call below is unchanged: the same refs, the same play
// budget, the same handlers.

const BARS = [1, 2, 3, 4, 5, 6, 7];

const optionClass = (selected) =>
  'flex w-full items-center gap-3 rounded-clay border px-4 py-2.5 text-left select-none ' +
  'shadow-raise transition-all duration-100 ease-snap active:translate-y-1 active:shadow-none ' +
  (selected ? 'border-siegel bg-siegel-wash' : 'border-rule bg-white hover:border-siegel');

const LevelTestListening = ({ onComplete, onSkip }) => {
  const [stage, setStage] = useState('intro'); // intro, loading, testing
  const [exercises, setExercises] = useState([]); // Array of {level, exercise, questions}
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const maxPlays = 3;

  // Levels to test (one exercise per main level)
  const testLevels = ['A1.1', 'A2.1', 'B1.1', 'B2.1'];

  // Fetch one exercise from each level
  const loadExercises = async () => {
    setStage('loading');
    setError(null);

    try {
      const exercisePromises = testLevels.map(async (level) => {
        const { data: exerciseData, error: exError } = await supabase
          .from('listening_exercises')
          .select('*')
          .eq('level', level)
          .limit(6);

        if (exError) throw exError;
        if (!exerciseData || exerciseData.length === 0) return null;

        // Pick a random exercise
        const randomIndex = Math.floor(Math.random() * exerciseData.length);
        const exercise = exerciseData[randomIndex];

        // Fetch questions
        const { data: questionsData, error: qError } = await supabase
          .from('listening_questions')
          .select('*')
          .eq('exercise_id', exercise.id)
          .order('question_number');

        if (qError) throw qError;

        return {
          level,
          exercise,
          questions: questionsData || []
        };
      });

      const results = await Promise.all(exercisePromises);
      const validExercises = results.filter(r => r !== null && r.questions.length > 0);

      if (validExercises.length === 0) {
        setError('No listening exercises available');
        return;
      }

      setExercises(validExercises);
      setCurrentQuestions(validExercises[0].questions);
      setStage('testing');

    } catch (err) {
      console.error('Error loading exercises:', err);
      setError('Failed to load exercises');
    }
  };

  // Audio URL — uses level as-is (e.g., "A1.1") matching Supabase storage structure
  const getAudioUrl = (exercise) => {
    if (!exercise) return '';
    return `https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/audio/listening/${exercise.level}/exercise${exercise.exercise_number}.mp3`;
  };

  // Audio controls
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (playCount < maxPlays) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlayCount(prev => prev + 1);
    setAudioProgress(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress || 0);
    }
  };

  // Answer handling
  const handleAnswerSelect = (questionId, option) => {
    let answerKey;
    if (option.match(/^[a-d]\)/)) {
      answerKey = option.charAt(0);
    } else {
      answerKey = option;
    }

    setAnswers(prev => ({
      ...prev,
      [questionId]: answerKey
    }));
  };

  const allQuestionsAnswered = () => {
    if (currentQuestions.length === 0) return false;
    return currentQuestions.every(q => answers[q.id] !== undefined);
  };

  // Navigation
  const nextExercise = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlayCount(0);
    setAudioProgress(0);

    if (currentExerciseIndex < exercises.length - 1) {
      const nextIndex = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIndex);
      setCurrentQuestions(exercises[nextIndex].questions);
    } else {
      calculateAndComplete();
    }
  };

  const calculateAndComplete = () => {
    const levelScores = {};

    exercises.forEach(({ level, questions }) => {
      const mainLevel = level.substring(0, 2); // A1, A2, B1, B2
      let correct = 0;
      const total = questions.length;

      questions.forEach(q => {
        if (answers[q.id] === q.correct_answer) {
          correct++;
        }
      });

      levelScores[mainLevel] = {
        correct,
        total,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0
      };
    });

    // Determine listening level using 60% threshold
    let determinedLevel = 'A1';
    for (const level of ['A1', 'A2', 'B1', 'B2']) {
      if (levelScores[level] && levelScores[level].percentage >= 60) {
        determinedLevel = level;
      } else {
        break;
      }
    }

    // Overall percentage
    const totalCorrect = Object.values(levelScores).reduce((sum, s) => sum + s.correct, 0);
    const totalQuestions = Object.values(levelScores).reduce((sum, s) => sum + s.total, 0);
    const overallPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    onComplete(overallPercentage, {
      levelScores,
      determinedLevel,
      answers
    });
  };

  const currentExercise = exercises[currentExerciseIndex]?.exercise;
  const currentLevel = exercises[currentExerciseIndex]?.level;

  // Intro screen
  if (stage === 'intro') {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-20 pb-16">
        <Reveal>
          <Card raised className="p-5 sm:p-8">
            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-pill bg-siegel-wash text-siegel">
                <Headphones size={36} />
              </span>
              <h2 className="mt-4 font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink">
                Listening Test
              </h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite">
                Test your comprehension across all levels
              </p>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 border-y border-rule py-4 sm:flex-row sm:gap-8">
              <span className="inline-flex items-center gap-2 font-data text-[0.8125rem] text-graphite">
                <Volume2 size={18} className="text-siegel" aria-hidden="true" />
                4 exercises
              </span>
              <span className="inline-flex items-center gap-2 font-data text-[0.8125rem] text-graphite">
                <Play size={18} className="text-siegel" aria-hidden="true" />
                3 plays per audio
              </span>
            </div>

            <div className="mt-6">
              <h3 className="font-display text-[1.0625rem] font-semibold text-ink">How it works</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.9375rem] leading-relaxed text-graphite marker:text-siegel">
                <li>You'll hear 4 audio clips, one from each level (A1 → B2)</li>
                <li>Listen carefully — you can replay each audio up to 3 times</li>
                <li>Answer the comprehension questions for each clip</li>
                <li>Your listening level will be determined by your accuracy</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {testLevels.map((level, i) => (
                <span key={level} className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-paper-sunk font-data text-[0.6875rem] font-bold text-graphite">
                    {i + 1}
                  </span>
                  <Chip tone="label">{level}</Chip>
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <Button variant="secondary" onClick={onSkip}>
                Skip Listening
              </Button>
              <Button className="flex-1" onClick={loadExercises}>
                Start Listening Test
              </Button>
            </div>
          </Card>
        </Reveal>
      </div>
    );
  }

  // Loading screen
  if (stage === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-20 pb-16">
        <Card raised className="p-10 text-center">
          <Loader2 size={44} className="mx-auto mb-4 animate-spin text-siegel" aria-hidden="true" />
          <h2 className="font-display text-[1.25rem] font-semibold text-ink">Loading Exercises...</h2>
          <p className="mt-2 text-[0.9375rem] text-graphite">Preparing listening test from all levels</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-20 pb-16">
        <Card tone="himbeer" className="p-6 text-center">
          <AlertCircle size={36} className="mx-auto mb-3 text-accent-himbeer-ink" aria-hidden="true" />
          <p className="text-[0.9375rem] font-bold text-accent-himbeer-ink">{error}</p>
          <div className="mt-5 flex flex-col-reverse justify-center gap-3 sm:flex-row">
            <Button variant="secondary" onClick={onSkip}>Skip Listening</Button>
            <Button onClick={loadExercises}>Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Testing screen
  return (
    <div className="mx-auto max-w-2xl px-4 pt-20 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-[1.125rem] font-semibold text-ink">Listening Test</span>
          <Chip tone="label">{currentLevel}</Chip>
        </div>
        <Chip tone="quiet" className="tabular-nums">
          Exercise {currentExerciseIndex + 1} of {exercises.length}
        </Chip>
      </div>

      {/* Progress Bar — decorative; the counter chip above carries the number */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-paper-sunk" aria-hidden="true">
        <div
          className="h-full rounded-pill bg-siegel transition-[width] duration-300 ease-snap"
          // Dynamic: how far through the exercise set we are.
          style={{ width: `${((currentExerciseIndex) / exercises.length) * 100}%` }}
        />
      </div>

      {/* Audio Player — flat panel, raised controls */}
      <Card tone="sunk" className="mt-6 p-4">
        <audio
          ref={audioRef}
          src={getAudioUrl(currentExercise)}
          onEnded={handleAudioEnded}
          onTimeUpdate={handleTimeUpdate}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-pill select-none transition-all duration-100 ease-snap ${
              playCount >= maxPlays
                ? 'cursor-not-allowed bg-white text-graphite'
                : 'bg-siegel text-white shadow-raise-siegel hover:bg-siegel-lift active:translate-y-1 active:shadow-none'
            }`}
            onClick={togglePlay}
            disabled={playCount >= maxPlays}
            // Icon-only control: without a label a screen reader announced
            // just "button". The /listening/ player already does this.
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
          </button>

          {/* Level meter: animated only while audio is running */}
          {isPlaying ? (
            <div className="equalizer hidden h-8 flex-shrink-0 items-end gap-[3px] sm:flex" aria-hidden="true">
              {BARS.map((bar) => <span key={bar} />)}
            </div>
          ) : (
            <div className="hidden h-8 flex-shrink-0 items-center gap-[3px] sm:flex" aria-hidden="true">
              {BARS.map((bar) => (
                <span key={bar} className="block h-[5px] w-[5px] rounded-pill bg-rule" />
              ))}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="h-2 w-full overflow-hidden rounded-pill bg-white" aria-hidden="true">
              <div
                className="h-full rounded-pill bg-siegel transition-[width] duration-100 ease-linear"
                // Dynamic: audio playhead position.
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          </div>

          <span className="flex-shrink-0 whitespace-nowrap font-data text-[0.75rem] text-graphite">
            {playCount}/{maxPlays} plays
          </span>
        </div>

        {currentExercise?.title && (
          <p className="mt-3 text-center text-[0.875rem] text-graphite">{currentExercise.title}</p>
        )}
      </Card>

      {/* Questions */}
      <div className="mt-6">
        <h3 className="font-display text-[1.0625rem] font-semibold text-ink">Questions</h3>
        <div className="mt-3 flex flex-col gap-4">
          {currentQuestions.map((question, qIndex) => (
            <Card key={question.id} className="p-4">
              <p className="text-[0.9375rem] font-bold leading-snug text-ink">
                {qIndex + 1}. {question.question_text}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {question.options?.map((option, oIndex) => {
                  const userAnswer = answers[question.id];
                  let isSelected = false;
                  if (userAnswer) {
                    if (option.match(/^[a-d]\)/)) {
                      isSelected = option.charAt(0) === userAnswer;
                    } else {
                      isSelected = option === userAnswer;
                    }
                  }
                  return (
                    <button
                      key={oIndex}
                      type="button"
                      aria-pressed={isSelected}
                      className={optionClass(isSelected)}
                      onClick={() => handleAnswerSelect(question.id, option)}
                    >
                      <span className="text-[0.9375rem] leading-snug text-ink">{option}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={onSkip}>
          Skip
        </Button>
        <Button
          onClick={nextExercise}
          disabled={!allQuestionsAnswered()}
        >
          {currentExerciseIndex < exercises.length - 1 ? 'Next Exercise' : 'Continue to Speaking'}
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
};

export default LevelTestListening;
