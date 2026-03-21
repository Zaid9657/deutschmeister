import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Play, Pause, Volume2, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabase';

const LevelTestListening = ({ level, sublevel, onComplete, onSkip }) => {
  // States
  const [stage, setStage] = useState('loading'); // loading, intro, exercise
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [error, setError] = useState(null);
  // Track all questions across exercises for final score calculation
  const allQuestionsRef = useRef([]);

  const audioRef = useRef(null);
  const maxPlays = 3;

  // Fetch exercises on mount
  useEffect(() => {
    fetchExercises();
  }, [sublevel]);

  const fetchExercises = async () => {
    try {
      // Fetch 2 exercises at the determined level
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('listening_exercises')
        .select('*')
        .eq('level', sublevel)
        .order('exercise_number')
        .limit(2);

      if (exerciseError) throw exerciseError;

      if (!exerciseData || exerciseData.length === 0) {
        // Try parent level if no exercises at sublevel
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('listening_exercises')
          .select('*')
          .ilike('level', `${level}%`)
          .order('exercise_number')
          .limit(2);

        if (fallbackError) throw fallbackError;

        if (!fallbackData || fallbackData.length === 0) {
          setError('No listening exercises available for this level.');
          setStage('intro');
          return;
        }

        setExercises(fallbackData);
      } else {
        setExercises(exerciseData);
      }

      setStage('intro');
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Failed to load listening exercises.');
      setStage('intro');
    }
  };

  const fetchQuestions = async (exerciseId) => {
    const { data, error } = await supabase
      .from('listening_questions')
      .select('*')
      .eq('exercise_id', exerciseId)
      .order('question_number');

    if (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
    return data || [];
  };

  const startListening = async () => {
    if (exercises.length === 0) {
      onSkip();
      return;
    }

    const questions = await fetchQuestions(exercises[0].id);
    setCurrentQuestions(questions);
    allQuestionsRef.current = [...questions];
    setCurrentExerciseIndex(0);
    setPlayCount(0);
    setStage('exercise');
  };

  const getAudioUrl = (exercise) => {
    return `https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/audio/listening/${exercise.level}/exercise${exercise.exercise_number}.mp3`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (playCount < maxPlays) {
        if (audioRef.current.currentTime === 0 || audioRef.current.ended) {
          setPlayCount(prev => prev + 1);
        }
        audioRef.current.play();
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress || 0);
    }
  };

  const handleAnswerSelect = (questionId, option) => {
    // Extract the answer key (e.g., "a" from "a) 0,99 €" or use full option for Richtig/Falsch)
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

  const allCurrentQuestionsAnswered = () => {
    if (currentQuestions.length === 0) return false;
    return currentQuestions.every(q => answers[q.id] !== undefined && answers[q.id] !== null);
  };

  const nextExercise = async () => {
    if (currentExerciseIndex < exercises.length - 1) {
      const nextIndex = currentExerciseIndex + 1;
      const questions = await fetchQuestions(exercises[nextIndex].id);
      allQuestionsRef.current = [...allQuestionsRef.current, ...questions];
      setCurrentQuestions(questions);
      setCurrentExerciseIndex(nextIndex);
      setPlayCount(0);
      setAudioProgress(0);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } else {
      calculateAndComplete();
    }
  };

  const calculateAndComplete = () => {
    const allQuestions = allQuestionsRef.current;
    let correct = 0;

    allQuestions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer === q.correct_answer) {
        correct++;
      }
    });

    const score = allQuestions.length > 0 ? Math.round((correct / allQuestions.length) * 100) : 0;
    onComplete(score, answers);
  };

  const currentExercise = exercises[currentExerciseIndex];

  // Loading state
  if (stage === 'loading') {
    return (
      <div className="level-test-container">
        <div className="question-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 size={48} className="spin" style={{ color: '#1D9E75', marginBottom: '1rem' }} />
          <p>Loading listening exercises...</p>
        </div>
      </div>
    );
  }

  // Intro screen
  if (stage === 'intro') {
    return (
      <div className="level-test-container">
        <div className="question-card listening-intro">
          <div className="listening-intro-header">
            <div className="listening-icon">
              <Headphones size={40} />
            </div>
            <h2>Listening Comprehension</h2>
            <span className={`level-badge level-${level.toLowerCase()}`}>{sublevel}</span>
          </div>

          {error ? (
            <div className="listening-error">
              <p>{error}</p>
              <button className="skip-btn" onClick={onSkip} style={{ marginTop: '1rem' }}>
                Skip to Speaking Test
              </button>
            </div>
          ) : (
            <>
              <div className="listening-info">
                <div className="info-item">
                  <Volume2 size={20} />
                  <span>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="info-item">
                  <Play size={20} />
                  <span>Max 3 plays per audio</span>
                </div>
              </div>

              <div className="listening-instructions">
                <h3>Instructions</h3>
                <ul>
                  <li>Listen to each audio clip carefully</li>
                  <li>You can replay up to 3 times</li>
                  <li>Answer the comprehension questions</li>
                  <li>This tests your listening at {sublevel} level</li>
                </ul>
              </div>

              <div className="listening-actions">
                <button className="skip-btn" onClick={onSkip}>
                  Skip Listening
                </button>
                <button className="start-test-btn" onClick={startListening}>
                  Start Listening Test
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Exercise screen
  if (stage === 'exercise' && currentExercise) {
    return (
      <div className="level-test-container">
        <div className="question-card">
          {/* Header */}
          <div className="question-header">
            <div className="question-header-left">
              <span className="header-title">Listening Test</span>
              <span className={`level-badge level-${level.toLowerCase()}`}>{sublevel}</span>
            </div>
            <span className="question-counter">
              Exercise {currentExerciseIndex + 1} of {exercises.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }}
            />
          </div>

          {/* Audio Player */}
          <div className="listening-player">
            <audio
              ref={audioRef}
              src={getAudioUrl(currentExercise)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleAudioEnded}
              onTimeUpdate={handleTimeUpdate}
            />

            <div className="audio-controls">
              <button
                className={`play-button ${playCount >= maxPlays && !isPlaying ? 'disabled' : ''}`}
                onClick={togglePlay}
                disabled={playCount >= maxPlays && !isPlaying}
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

              <span className="play-count">
                {playCount}/{maxPlays} plays
              </span>
            </div>

            {currentExercise.title && (
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
                  {question.options.map((option, oIndex) => {
                    const isSelected = (() => {
                      const userAnswer = answers[question.id];
                      if (!userAnswer) return false;
                      if (option.match(/^[a-d]\)/)) {
                        return option.charAt(0) === userAnswer;
                      }
                      return option === userAnswer;
                    })();
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
              disabled={!allCurrentQuestionsAnswered()}
            >
              {currentExerciseIndex < exercises.length - 1 ? 'Next Exercise' : 'Continue to Speaking'}
              <ChevronRight size={18} style={{ marginLeft: '0.25rem' }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LevelTestListening;
