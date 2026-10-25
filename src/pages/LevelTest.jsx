import React, { useState, useMemo, useEffect, useRef } from 'react';
import SEO from '../components/SEO';
import { seoProps } from '../data/seoRoutes.js';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { calculatePlacement } from '../components/LevelTest/placementResult.js';
import { supabase } from '../utils/supabase';
import LevelTestLanding from '../components/LevelTest/LevelTestLanding';
import LevelTestQuestion from '../components/LevelTest/LevelTestQuestion';
import LevelTestListening from '../components/LevelTest/LevelTestListening';
import LevelTestSpeaking from '../components/LevelTest/LevelTestSpeaking';
import LevelTestResults from '../components/LevelTest/LevelTestResults';
import questionData from '../data/levelTestQuestions.json';

const LevelTest = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const { refreshSubscription } = useSubscription();
  const refreshSubscriptionRef = useRef(refreshSubscription);
  useEffect(() => { refreshSubscriptionRef.current = refreshSubscription; }, [refreshSubscription]);
  const [testState, setTestState] = useState('landing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [listeningScore, setListeningScore] = useState(null);
  const [, setListeningAnswers] = useState([]);
  const [speakingScore, setSpeakingScore] = useState(null);
  const assessmentRef = useRef(null);

  // Route changes in this SPA preserve the previous document scroll position.
  // Bring each assessment step back into view and move keyboard/screen-reader
  // focus with it, especially when the landing CTA sits near the page footer.
  useEffect(() => {
    if (testState === 'landing') return undefined;

    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      assessmentRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [testState, currentQuestionIndex]);

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

  const placement = useMemo(() => calculatePlacement({ answers, questions, listeningScore, speakingScore }),
    [answers, questions, listeningScore, speakingScore]);
  const finalSublevel = placement.sublevel;

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
      setTestState('listening');
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setTestState('listening');
    }
  };

  const startTest = () => {
    setTestState('testing');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setListeningScore(null);
    setListeningAnswers([]);
    setSpeakingScore(null);
  };

  // Persist the placement result. Without this the whole test was decorative:
  // profiles.current_level stayed at its 'a1' default for every account, and
  // SpeakingPage — the only reader — coerced that back to A1.1, so a learner
  // placed at B1.2 was still handed A1.1 content. There is no signup gate
  // here (the landing page promises no account is required); an anonymous
  // tester's result is kept on the browser by LevelTestResults and written at
  // the first profile load after sign-in (src/lib/placement.js).
  useEffect(() => {
    if (testState !== 'results' || !userId) return;
    let cancelled = false;
    (async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ current_level: finalSublevel, updated_at: new Date().toISOString() })
        .eq('id', userId);
      // supabase-js resolves rather than throws, so the error has to be read
      // off the result or a failed write looks identical to a successful one.
      if (cancelled) return;
      if (error) {
        console.error('Failed to save placement level:', error.message);
      } else {
        await refreshSubscriptionRef.current();
      }
    })();
    return () => { cancelled = true; };
  }, [testState, userId, finalSublevel]);

  return (
    <>
      <SEO
        {...seoProps('/level-test')}
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
              "@id": "https://deutsch-meister.de/#organization",
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
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://deutsch-meister.de"},
              {"@type": "ListItem", "position": 2, "name": "Level Test", "item": "https://deutsch-meister.de/level-test/"}
            ]
          }
        ]}
      />

      {/* The ground only. Each step owns its own gutter and rhythm — the
          speaking step hands the screen to SpeakingSession, which is a
          full-height layout of its own and must not sit in a padded box. */}
      <div
        ref={assessmentRef}
        tabIndex={testState === 'landing' ? undefined : -1}
        role="region"
        aria-label="German level test assessment"
        className="min-h-screen bg-paper text-ink outline-none"
      >
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
            placement={placement}
            listeningScore={listeningScore}
            speakingScore={speakingScore}
            onRetake={startTest}
          />
        )}
      </div>
    </>
  );
};

export default LevelTest;
