import React, { useState, useMemo, useEffect, useRef } from 'react';
import SEO from '../components/SEO';
import { seoProps } from '../data/seoRoutes.js';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { calculatePlacement } from '../components/LevelTest/placementResult.js';
import {
  drawQuestions,
  answerFor,
  placementSnapshot,
  restorePlacement,
  PLACEMENT_PROGRESS_KEY,
  RESUMABLE_STEPS,
} from '../components/LevelTest/drawQuestions.js';
import { safeGetJSON, safeSetJSON, safeRemove } from '../utils/safeStorage';
import { supabase } from '../utils/supabase';
import LevelTestLanding from '../components/LevelTest/LevelTestLanding';
import LevelTestQuestion from '../components/LevelTest/LevelTestQuestion';
import LevelTestListening from '../components/LevelTest/LevelTestListening';
import LevelTestSpeaking from '../components/LevelTest/LevelTestSpeaking';
import LevelTestResults from '../components/LevelTest/LevelTestResults';
import questionData from '../data/levelTestQuestions.json';

const BANK = questionData.questions;
// The run in progress lives in this tab only (sessionStorage, through safeStorage).
const SESSION = { session: true };
// Ten questions per band, each with its own option order (drawQuestions.js).
const newDraw = () => drawQuestions(BANK);

const LevelTest = () => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const { refreshSubscription } = useSubscription();
  const refreshSubscriptionRef = useRef(refreshSubscription);
  useEffect(() => { refreshSubscriptionRef.current = refreshSubscription; }, [refreshSubscription]);
  const [testState, setTestState] = useState('landing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [listeningScore, setListeningScore] = useState(null);
  const [, setListeningAnswers] = useState([]);
  const [speakingScore, setSpeakingScore] = useState(null);
  // The draw is state, not a memo: "Retake Test" used to serve the same 40
  // questions in the same order, because the memo never re-ran.
  const [questions, setQuestions] = useState(newDraw);
  // Who this run belongs to: the account signed in when it started, null for a
  // guest, undefined while there is no run (or auth had not answered yet when
  // it started — it is bound on the first answer, which is no account change).
  const [runOwner, setRunOwner] = useState(undefined);
  // A run this tab left unfinished (a back-swipe, an iOS tab reload), offered
  // on the landing page to its owner only, while every question still exists
  // in the bank.
  const [storedRun, setStoredRun] = useState(() => restorePlacement(BANK, safeGetJSON(PLACEMENT_PROGRESS_KEY, null, SESSION)));
  const resumable = storedRun && !authLoading && storedRun.owner === userId ? storedRun : null;
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

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const placement = useMemo(() => calculatePlacement({ answers, questions, listeningScore, speakingScore }),
    [answers, questions, listeningScore, speakingScore]);
  const finalSublevel = placement.sublevel;

  // The run, its snapshot and its result belong to the account that took it.
  // When that account is replaced on this tab — signed out, or another account
  // signed in from another tab — the run is dropped, and nothing of it is shown
  // or written for the next one: an open results page used to write its result
  // to whichever account signed in next. `view` hides the run already in the
  // render that changes the account; the reset lands just after. A guest's run
  // is not dropped by a sign-in: its result reaches an account only through the
  // explicit guest path (see the results effect below).
  const accountChanged = typeof runOwner === 'string' && !authLoading && runOwner !== userId;
  const view = accountChanged ? 'landing' : testState;
  useEffect(() => {
    if (!accountChanged) return;
    safeRemove(PLACEMENT_PROGRESS_KEY, SESSION);
    setStoredRun(null);
    setRunOwner(undefined);
    setQuestions(newDraw());
    setTestState('landing');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setListeningScore(null);
    setListeningAnswers([]);
    setSpeakingScore(null);
  }, [accountChanged]);

  // A run started before auth answered belongs to whoever auth then names.
  useEffect(() => {
    if (testState !== 'landing' && runOwner === undefined && !authLoading) setRunOwner(userId);
  }, [testState, runOwner, authLoading, userId]);

  // Keep the run in progress on this tab after every step, under its owner; a
  // finished run leaves nothing behind. Listening and speaking resume at their
  // intro screens.
  useEffect(() => {
    if (runOwner === undefined || accountChanged) return;
    if (RESUMABLE_STEPS.includes(testState)) {
      safeSetJSON(PLACEMENT_PROGRESS_KEY, placementSnapshot({ questions, answers, currentQuestionIndex, testState, listeningScore, owner: runOwner }), SESSION);
    } else if (testState === 'results') {
      safeRemove(PLACEMENT_PROGRESS_KEY, SESSION);
    }
  }, [questions, answers, currentQuestionIndex, testState, listeningScore, runOwner, accountChanged]);

  // Scored against the shown option order (drawQuestions.js remaps the key).
  const handleAnswer = (selectedIndex) => {
    const updatedAnswers = [...answers, answerFor(currentQuestion, selectedIndex)];
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

  // A new run, from the landing page or "Retake Test": a new draw for whoever
  // is signed in now, and the old run's snapshot is gone.
  const startTest = () => {
    safeRemove(PLACEMENT_PROGRESS_KEY, SESSION);
    setStoredRun(null);
    setRunOwner(authLoading ? undefined : userId);
    setQuestions(newDraw());
    setTestState('testing');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setListeningScore(null);
    setListeningAnswers([]);
    setSpeakingScore(null);
  };

  const resumeTest = () => {
    if (!resumable) return;
    setRunOwner(resumable.owner);
    setQuestions(resumable.questions);
    setAnswers(resumable.answers);
    setCurrentQuestionIndex(resumable.currentQuestionIndex);
    setListeningScore(resumable.listeningScore);
    setListeningAnswers([]);
    setSpeakingScore(null);
    setTestState(resumable.testState);
    setStoredRun(null);
  };

  const resumeAt = !resumable ? null
    : resumable.testState === 'testing' ? `question ${resumable.currentQuestionIndex + 1} of ${resumable.questions.length}`
      : `the ${resumable.testState} section`;

  // Persist the placement result. Without this the whole test was decorative:
  // profiles.current_level stayed at its 'a1' default for every account, and
  // SpeakingPage — the only reader — coerced that back to A1.1, so a learner
  // placed at B1.2 was still handed A1.1 content. There is no signup gate
  // here (the landing page promises no account is required); an anonymous
  // tester's result is kept on the browser by LevelTestResults and written at
  // the first profile load after sign-in (src/lib/placement.js).
  //
  // Written only for the account that took this run, while it is still the one
  // signed in. A guest's run is never written here, whoever signs in: the
  // results screen keeps it on this browser and the explicit guest path
  // (settlePendingPlacement, at a profile load) gives it to an account with no
  // placement yet — the reload below asks for that load now.
  useEffect(() => {
    if (testState !== 'results' || !userId) return;
    if (runOwner === null) {
      refreshSubscriptionRef.current();
      return;
    }
    if (runOwner !== userId) return;
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
  }, [testState, userId, runOwner, finalSublevel]);

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
        tabIndex={view === 'landing' ? undefined : -1}
        role="region"
        aria-label="German level test assessment"
        className="min-h-screen bg-paper text-ink outline-none"
      >
        {view === 'landing' && (
          <LevelTestLanding onStart={startTest} resumeAt={resumeAt} onResume={resumeTest} />
        )}

        {view === 'testing' && currentQuestion && (
          <LevelTestQuestion
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
            currentLevel={currentQuestion.level}
            onAnswer={handleAnswer}
            onSkip={handleSkip}
          />
        )}

        {view === 'listening' && (
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

        {view === 'speaking' && (
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

        {view === 'results' && (
          <LevelTestResults
            placement={placement}
            listeningScore={listeningScore}
            speakingScore={speakingScore}
            guestRun={runOwner === null}
            onRetake={startTest}
          />
        )}
      </div>
    </>
  );
};

export default LevelTest;
