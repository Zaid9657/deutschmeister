import React, { useState, useRef } from 'react';
import { Headphones, Play, Pause, Loader2, Volume2, ChevronRight } from 'lucide-react';
import { supabase } from '../../utils/supabase';

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
      <div className="level-test-container">
        <div className="question-card listening-intro">
          <div className="listening-intro-header">
            <div className="listening-icon">
              <Headphones size={40} />
            </div>
            <h2>Listening Test</h2>
            <p className="listening-subtitle">Test your comprehension across all levels</p>
          </div>

          <div className="listening-info">
            <div className="info-item">
              <Volume2 size={18} />
              <span>4 exercises</span>
            </div>
            <div className="info-item">
              <Play size={18} />
              <span>3 plays per audio</span>
            </div>
          </div>

          <div className="listening-instructions">
            <h3>How it works</h3>
            <ul>
              <li>You'll hear 4 audio clips, one from each level (A1 → B2)</li>
              <li>Listen carefully — you can replay each audio up to 3 times</li>
              <li>Answer the comprehension questions for each clip</li>
              <li>Your listening level will be determined by your accuracy</li>
            </ul>
          </div>

          <div className="listening-levels-preview">
            {testLevels.map((level, i) => (
              <div key={level} className="level-preview-item">
                <span className="level-number">{i + 1}</span>
                <span className={`level-badge level-${level.substring(0, 2).toLowerCase()}`}>
                  {level}
                </span>
              </div>
            ))}
          </div>

          <div className="listening-actions">
            <button className="skip-btn" onClick={onSkip}>
              Skip Listening
            </button>
            <button className="start-test-btn" onClick={loadExercises}>
              Start Listening Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
  if (stage === 'loading') {
    return (
      <div className="level-test-container">
        <div className="question-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 size={48} className="spin" style={{ color: '#1D9E75', marginBottom: '1rem' }} />
          <h2>Loading Exercises...</h2>
          <p style={{ color: '#666' }}>Preparing listening test from all levels</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="level-test-container">
        <div className="question-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="skip-btn" onClick={onSkip}>Skip Listening</button>
            <button className="start-test-btn" onClick={loadExercises} style={{ maxWidth: '200px' }}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  // Testing screen
  return (
    <div className="level-test-container">
      <div className="question-card">
        {/* Header */}
        <div className="question-header">
          <div className="question-header-left">
            <span className="header-title">Listening Test</span>
            <span className={`level-badge level-${currentLevel?.substring(0, 2).toLowerCase()}`}>
              {currentLevel}
            </span>
          </div>
          <span className="question-counter">
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${((currentExerciseIndex) / exercises.length) * 100}%` }}
          />
        </div>

        {/* Audio Player */}
        <div className="listening-player">
          <audio
            ref={audioRef}
            src={getAudioUrl(currentExercise)}
            onEnded={handleAudioEnded}
            onTimeUpdate={handleTimeUpdate}
          />

          <div className="audio-controls">
            <button
              className={`play-button ${playCount >= maxPlays ? 'disabled' : ''}`}
              onClick={togglePlay}
              disabled={playCount >= maxPlays}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <div className="audio-progress-container">
              <div className="audio-progress-bar">
                <div
                  className="audio-progress-fill"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>

            <span className="play-count">{playCount}/{maxPlays} plays</span>
          </div>

          {currentExercise?.title && (
            <p className="exercise-title">{currentExercise.title}</p>
          )}
        </div>

        {/* Questions */}
        <div className="listening-questions">
          <h3>Questions</h3>
          {currentQuestions.map((question, qIndex) => (
            <div key={question.id} className="listening-question">
              <p className="question-text">
                {qIndex + 1}. {question.question_text}
              </p>
              <div className="options-list">
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
                      className={`option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleAnswerSelect(question.id, option)}
                    >
                      <span className="option-text">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="question-footer">
          <button className="skip-btn" onClick={onSkip}>
            Skip
          </button>
          <button
            className="next-btn"
            onClick={nextExercise}
            disabled={!allQuestionsAnswered()}
          >
            {currentExerciseIndex < exercises.length - 1 ? 'Next Exercise' : 'Continue to Speaking'}
            <ChevronRight size={18} style={{ marginLeft: '0.25rem' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelTestListening;
