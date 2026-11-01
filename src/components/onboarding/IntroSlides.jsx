import { AUTH_CONTINUITY_ENABLED } from '../../lib/authContinuityFlag.js';
import { peekReturnPath, clearReturnPath } from '../../lib/returnPath.js';
import { confirmationDestinationLabel } from '../../lib/confirmationContinuity.js';
import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Rocket, ChevronLeft, ChevronRight, Bug, GraduationCap } from 'lucide-react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase } from '../../utils/supabase';
import { withTimeout } from '../../utils/withTimeout';
import { EXAM_TRACKS } from '../../data/examTracks';
import { FREE_COURSE_LEVEL } from '../../lib/courseEntry.js';
import { STARTING_POINT_KEY, STARTING_POINTS, onboardingGoalAction } from '../../lib/firstRun.js';
import {
  trackOnboardingStarted,
  trackOnboardingSlideViewed,
  trackOnboardingSkipped,
} from '../../lib/funnelTracking';
import { color } from '../../data/design-tokens';
import Button from '../ui/Button';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import Aurora from '../ui/Aurora.jsx';

const SLIDES = [
  {
    icon: Sparkles,
    headline: "Glad you're here.",
    body: 'Here you learn German like a person, not like a toy. In 30 seconds we\'ll show you what to do next.',
  },
  {
    // The exam-first question. The answer (profiles.exam_track) shapes the
    // dashboard: exam goal header, countdown, exam tools. Skippable — 'none'
    // gets the library-first layout.
    icon: GraduationCap,
    headline: 'Are you preparing for an exam?',
    isExamPicker: true,
  },
  // The "first day checklist" slide that stood here is gone (work order #6):
  // it listed three different first actions — placement test, speaking, X-Ray —
  // one click before the slide that asks for ONE. The last slide now asks the
  // one question that decides the first action (src/lib/firstRun.js).
  {
    icon: Rocket,
    headline: 'How much German do you know?',
    // Honest time: the test's own landing page says 15–20 minutes.
    body:
      `New to German? Lektion 1 of the free ${FREE_COURSE_LEVEL.toUpperCase()} course starts with the first „Hallo“, one short step at a time. Already know some? The placement test (15–20 min) finds your exact level.`,
    isFinal: true,
  },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
};

// The prev/next arrows: a round secondary key (raised, depresses on press).
const ARROW = 'h-10 w-10 !p-0 rounded-pill';

export default function IntroSlides({ onComplete }) {
  const { currentStep, setCurrentStep, completeOnboarding: completeStandaloneOnboarding, needsOnboarding } = useOnboarding();
  const completeOnboarding = onComplete || completeStandaloneOnboarding;
  const { user } = useAuth();
  const { refreshSubscription, profile, hasLevelAccess } = useSubscription();
  const [examTrack, setExamTrack] = useState(null);
  // The exam_track write, kept so every exit can wait for it (true = saved).
  const examSave = useRef(null);

  // Persist the choice immediately (client-writable preference, like
  // current_level).
  const chooseExam = (key) => {
    setExamTrack(key);
    if (user) {
      examSave.current = supabase.from('profiles').update({ exam_track: key }).eq('id', user.id)
        .then(({ error }) => {
          if (error) console.error('exam_track save failed:', error.message);
          return !error;
        }, () => false);
    }
    setCurrentStep((s) => s + 1);
  };

  // Every exit leaves through here, so the exam pick reaches the dashboard in
  // the same visit. The shared profile (SubscriptionContext) was loaded before
  // the pick and still said "no exam": no goal strip, and the course card
  // instead of the exam's first task, until a reload. The exit waits for the
  // write (never more than 3 s — completion must not hang on a preference),
  // completes onboarding, which is written before it navigates, and only then
  // reloads the profile: if that reload re-mounts the guarded route, the
  // onboarding gate finds its completion already written.
  const finish = async (exitPath, options) => {
    const saved = examSave.current ? await withTimeout(examSave.current, 3000).catch(() => false) : false;
    if (AUTH_CONTINUITY_ENABLED && exitPath !== 'return-task') clearReturnPath();
    await completeOnboarding(exitPath, options);
    if (saved) await refreshSubscription();
  };

  useEffect(() => {
    if (needsOnboarding) trackOnboardingStarted();
  }, [needsOnboarding]);

  useEffect(() => {
    trackOnboardingSlideViewed(currentStep);
  }, [currentStep]);

  const dir = 1;

  const goNext = useCallback(() => {
    if (currentStep < SLIDES.length - 1) setCurrentStep((s) => s + 1);
  }, [currentStep, setCurrentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep, setCurrentStep]);

  const handleSkip = () => {
    trackOnboardingSkipped();
    return finish('dashboard');
  };

  // Explicit beginner/placement answers still land where their labels say.
  const chooseStart = (point) => {
    if (point === STARTING_POINTS.SOME && user) {
      supabase.auth.updateUser({ data: { [STARTING_POINT_KEY]: point } })
        .then(({ error }) => {
          if (error) console.error('starting_point save failed:', error.message);
        });
    }
    return finish(point === STARTING_POINTS.SOME ? 'level-test' : 'first-lesson');
  };

  const slide = SLIDES[currentStep];
  const goalPreferences = {
    examTrack: examTrack ?? profile?.exam_track,
    currentLevel: profile?.current_level,
    startingPoint: user?.user_metadata?.[STARTING_POINT_KEY],
    hasLevelAccess,
  };
  const resumePath = AUTH_CONTINUITY_ENABLED && examTrack === null ? peekReturnPath() : null;
  const resumeLabel = confirmationDestinationLabel(resumePath);
  const goalAction = resumePath && resumeLabel
    ? { href: resumePath, label: resumeLabel, locked: false }
    : onboardingGoalAction(goalPreferences);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center bg-paper px-4 py-12">
      <Aurora />
      {import.meta.env.DEV && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-50 flex items-center gap-1.5 rounded-pill bg-accent-himbeer-wash px-3 py-1.5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-accent-himbeer-ink transition-colors hover:bg-white"
        >
          <Bug className="w-3 h-3" />
          Skip (dev)
        </button>
      )}

      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={currentStep}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Card raised className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-clay bg-siegel shadow-raise-siegel flex items-center justify-center">
                <slide.icon className="w-8 h-8 text-white" aria-hidden="true" />
              </div>

              <h2 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink mb-4">
                {slide.isFinal && goalAction ? 'Ihr nächster Schritt' : slide.headline}
              </h2>

              {slide.body && (
                <p className="text-[0.9375rem] leading-relaxed text-graphite sm:text-base mb-6">{slide.isFinal && goalAction ? goalAction.href === '/level-test/' ? 'Der Einstufungstest hilft Ihnen, einen passenden Einstieg zu finden.' : 'Öffnen Sie Ihre Aufgabe direkt. Den Einstufungstest können Sie bei Bedarf später machen.' : slide.body}</p>
              )}

              {slide.isExamPicker && (
                <div className="flex flex-col gap-3 mb-2 pt-1">
                  {EXAM_TRACKS.map((track) => (
                    <Card
                      key={track.key}
                      as="button"
                      type="button"
                      interactive
                      onClick={() => chooseExam(track.key)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left ${
                        examTrack === track.key ? '!border-siegel !bg-siegel-wash' : 'hover:border-siegel'
                      }`}
                    >
                      <span className="text-sm font-bold text-ink">{track.nameDe}</span>
                      <Chip tone="label">{track.level}</Chip>
                    </Card>
                  ))}
                  <button
                    onClick={() => chooseExam('none')}
                    className="mt-1 text-sm font-bold text-siegel transition-colors hover:text-siegel-deep"
                  >
                    I'm just learning German — no exam →
                  </button>
                </div>
              )}

              {slide.isFinal && (
                <div className="flex flex-col gap-3 mt-2">
                  {goalAction ? (
                    <>
                      <Button onClick={resumePath && resumeLabel
                        ? () => finish('return-task', { returnTo: resumePath })
                        : () => finish('exam-task', goalPreferences)} shimmer size="lg" className="w-full">
                        {goalAction.label}
                      </Button>
                      {goalAction.locked && <p className="text-sm text-graphite">Diese Aufgabe benötigt einen passenden Zugang. Beim Öffnen sehen Sie die Zugangssperre.</p>}
                    </>
                  ) : (
                    <Button onClick={() => chooseStart(STARTING_POINTS.NEW)} shimmer size="lg" className="w-full">
                      A1.1 Lektion 1 öffnen – ich beginne mit Deutsch
                    </Button>
                  )}
                  {goalAction?.href !== '/level-test/' && (
                    <Button onClick={() => chooseStart(STARTING_POINTS.SOME)} variant="secondary" size="lg" className="w-full">
                      Optional: Einstufungstest öffnen (15–20 Minuten)
                    </Button>
                  )}
                  <button
                    onClick={handleSkip}
                    className="text-sm font-bold text-graphite transition-colors hover:text-siegel-deep"
                  >
                    Dashboard öffnen →
                  </button>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 px-2">
          <Button
            variant="secondary"
            onClick={goPrev}
            disabled={currentStep === 0}
            className={`${ARROW} disabled:opacity-0 disabled:pointer-events-none`}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Dots — the active one on siegel */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === currentStep ? 24 : 8,
                  backgroundColor: i === currentStep ? color.siegel : color.rule,
                }}
                transition={{ duration: 0.2 }}
                className="h-2 rounded-pill"
              />
            ))}
          </div>

          {currentStep < SLIDES.length - 1 ? (
            <Button variant="secondary" onClick={goNext} className={ARROW}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>
    </div>
  );
}
