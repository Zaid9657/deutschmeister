import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import LevelTestLanding from '../components/LevelTest/LevelTestLanding';
import LevelTestQuestion from '../components/LevelTest/LevelTestQuestion';
import LevelTestResults from '../components/LevelTest/LevelTestResults';
import questionData from '../data/levelTestQuestions.json';
import '../styles/LevelTest.css';

const LevelTest = () => {
  const [testState, setTestState] = useState('landing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [skipped, setSkipped] = useState([]);

  // Shuffle questions within each level for variety
  const questions = useMemo(() => {
    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Get 10 questions per level (40 total)
    const levels = ['A1', 'A2', 'B1', 'B2'];
    let selectedQuestions = [];

    levels.forEach(level => {
      const levelQuestions = questionData.questions.filter(q => q.level === level);
      const shuffled = shuffleArray(levelQuestions);
      selectedQuestions = [...selectedQuestions, ...shuffled.slice(0, 10)];
    });

    return selectedQuestions;
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const handleAnswer = (selectedIndex) => {
    const isCorrect = selectedIndex === currentQuestion.correctIndex;

    setAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      level: currentQuestion.level,
      sublevel: currentQuestion.sublevel,
      type: currentQuestion.type,
      selectedIndex,
      isCorrect,
      points: isCorrect ? currentQuestion.points : 0
    }]);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setTestState('results');
    }
  };

  const handleSkip = () => {
    setSkipped(prev => [...prev, currentQuestion.id]);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setTestState('results');
    }
  };

  const startTest = () => {
    setTestState('testing');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSkipped([]);
  };

  return (
    <>
      <Helmet>
        <title>German Level Test | Find Your CEFR Level | DeutschMeister</title>
        <meta name="description" content="Take our free German level test to discover your CEFR level from A1 to B2. 40 questions, 15-20 minutes, instant results with personalized recommendations." />
      </Helmet>

      <div className="level-test-page">
        {testState === 'landing' && (
          <LevelTestLanding onStart={startTest} />
        )}

        {testState === 'testing' && currentQuestion && (
          <LevelTestQuestion
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
            currentLevel={currentQuestion.level}
            onAnswer={handleAnswer}
            onSkip={handleSkip}
          />
        )}

        {testState === 'results' && (
          <LevelTestResults
            answers={answers}
            skipped={skipped}
            questions={questions}
            onRetake={startTest}
          />
        )}
      </div>
    </>
  );
};

export default LevelTest;
