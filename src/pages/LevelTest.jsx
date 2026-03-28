import React, { useState, useMemo, useCallback } from 'react';
import SEO from '../components/SEO';
import LevelTestLanding from '../components/LevelTest/LevelTestLanding';
import LevelTestQuestion from '../components/LevelTest/LevelTestQuestion';
import LevelTestListening from '../components/LevelTest/LevelTestListening';
import LevelTestSpeaking from '../components/LevelTest/LevelTestSpeaking';
import LevelTestResults from '../components/LevelTest/LevelTestResults';
import questionData from '../data/levelTestQuestions.json';
import '../styles/LevelTest.css';

const LevelTest = () => {
  const [testState, setTestState] = useState('landing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [determinedLevel, setDeterminedLevel] = useState('A1');
  const [determinedSublevel, setDeterminedSublevel] = useState('A1.1');
  const [listeningScore, setListeningScore] = useState(null);
  const [listeningAnswers, setListeningAnswers] = useState([]);
  const [speakingScore, setSpeakingScore] = useState(null);

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

  // Calculate level from written test answers
  const calculateLevel = useCallback((writtenAnswers) => {
    const levelScores = {};
    const sublevelScores = {};

    ['A1', 'A2', 'B1', 'B2'].forEach(level => {
      levelScores[level] = { correct: 0, total: 0 };
    });
    ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'].forEach(sub => {
      sublevelScores[sub] = { correct: 0, total: 0 };
    });

    writtenAnswers.forEach(answer => {
      levelScores[answer.level].total++;
      sublevelScores[answer.sublevel].total++;
      if (answer.isCorrect) {
        levelScores[answer.level].correct++;
        sublevelScores[answer.sublevel].correct++;
      }
    });

    let level = 'A1';
    let sublevel = 'A1.1';

    for (const lvl of ['A1', 'A2', 'B1', 'B2']) {
      const score = levelScores[lvl];
      if (score.total === 0) continue;
      const percentage = (score.correct / score.total) * 100;

      if (percentage >= 60) {
        level = lvl;
        const sub2 = `${lvl}.2`;
        const sub2Score = sublevelScores[sub2];
        const sub2Pct = sub2Score.total > 0 ? (sub2Score.correct / sub2Score.total) * 100 : 0;
        sublevel = sub2Pct >= 70 ? sub2 : `${lvl}.1`;
      }
    }

    return { level, sublevel };
  }, []);

  const finishWrittenTest = useCallback((finalAnswers) => {
    const { level, sublevel } = calculateLevel(finalAnswers);
    setDeterminedLevel(level);
    setDeterminedSublevel(sublevel);
    setTestState('listening');
  }, [calculateLevel]);

  const handleAnswer = (selectedIndex) => {
    const isCorrect = selectedIndex === currentQuestion.correctIndex;

    const newAnswer = {
      questionId: currentQuestion.id,
      level: currentQuestion.level,
      sublevel: currentQuestion.sublevel,
      type: currentQuestion.type,
      selectedIndex,
      isCorrect,
      points: isCorrect ? currentQuestion.points : 0
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishWrittenTest(updatedAnswers);
    }
  };

  const handleSkip = () => {
    setSkipped(prev => [...prev, currentQuestion.id]);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishWrittenTest(answers);
    }
  };

  const startTest = () => {
    setTestState('testing');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSkipped([]);
    setDeterminedLevel('A1');
    setDeterminedSublevel('A1.1');
    setListeningScore(null);
    setListeningAnswers([]);
    setSpeakingScore(null);
  };

  return (
    <>
      <SEO
        title="Free German Level Test | Find Your CEFR Level (A1-B2) | DeutschMeister"
        description="Take our free German level test to discover your CEFR level. Test your reading, listening, and speaking skills in 15 minutes. Instant results with personalized learning recommendations."
        keywords="German level test, CEFR test, German placement test, what level is my German, German proficiency test, free German test"
        path="/level-test"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Quiz",
            "name": "German CEFR Level Test",
            "description": "Free online German proficiency test covering reading, listening, and speaking. Discover your level from A1 to B2.",
            "educationalLevel": ["A1", "A2", "B1", "B2"],
            "learningResourceType": "Assessment",
            "inLanguage": ["en", "de"],
            "isAccessibleForFree": true,
            "provider": {
              "@type": "Organization",
              "name": "DeutschMeister",
              "url": "https://deutsch-meister.de"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How long does the German level test take?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The complete test takes approximately 15-20 minutes, including written, listening, and speaking sections."
                }
              },
              {
                "@type": "Question",
                "name": "Is the German level test free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, the German level test is completely free. You'll receive instant results showing your CEFR level from A1 to B2."
                }
              },
              {
                "@type": "Question",
                "name": "What does the German level test include?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The test includes three sections: written comprehension (grammar and vocabulary), listening comprehension with native speaker audio, and speaking assessment with AI feedback."
                }
              },
              {
                "@type": "Question",
                "name": "What CEFR levels does the test cover?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The test assesses levels from complete beginner (A1) to upper intermediate (B2), following the Common European Framework of Reference for Languages."
                }
              }
            ]
          }
        ]}
      />

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

        {testState === 'listening' && (
          <LevelTestListening
            onComplete={(score, details) => {
              setListeningScore(score);
              setListeningAnswers(details);
              setTestState('speaking');
            }}
            onSkip={() => {
              setListeningScore(null);
              setListeningAnswers(null);
              setTestState('speaking');
            }}
          />
        )}

        {testState === 'speaking' && (
          <LevelTestSpeaking
            onComplete={(evaluation) => {
              setSpeakingScore(evaluation);
              setTestState('results');
            }}
            onSkip={() => {
              setSpeakingScore(null);
              setTestState('results');
            }}
          />
        )}

        {testState === 'results' && (
          <LevelTestResults
            answers={answers}
            skipped={skipped}
            questions={questions}
            listeningScore={listeningScore}
            speakingScore={speakingScore}
            determinedLevel={determinedLevel}
            determinedSublevel={determinedSublevel}
            onRetake={startTest}
          />
        )}
      </div>
    </>
  );
};

export default LevelTest;
