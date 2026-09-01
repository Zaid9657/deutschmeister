import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ListChecks, Rocket, ChevronLeft, ChevronRight, Check, Bug, GraduationCap } from 'lucide-react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { EXAM_TRACKS } from '../../data/examTracks';
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
  {
    icon: ListChecks,
    headline: 'Your first day, step by step.',
    checklist: [
      'Take the placement test (5 min — we find your level)',
      'Try a speaking session with the AI',
      'Break down your first German sentence with X-Ray',
    ],
  },
  {
    icon: Rocket,
    headline: "Let's start with the placement test.",
    body: "In 5 minutes you'll know exactly which level to start at. No weeks wasted on the wrong one.",
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

export default function IntroSlides() {
  const { currentStep, setCurrentStep, completeOnboarding, needsOnboarding } = useOnboarding();
  const { user } = useAuth();
  const [examTrack, setExamTrack] = useState(null);

  // Persist the choice immediately (client-writable preference, like
  // current_level); onboarding completion must never wait on it.
  const chooseExam = (key) => {
    setExamTrack(key);
    if (user) {
      supabase.from('profiles').update({ exam_track: key }).eq('id', user.id)
        .then(({ error }) => {
          if (error) console.error('exam_track save failed:', error.message);
        });
    }
    setCurrentStep((s) => s + 1);
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
    completeOnboarding('dashboard');
  };

  const slide = SLIDES[currentStep];

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
                {slide.headline}
              </h2>

              {slide.body && (
                <p className="text-[0.9375rem] leading-relaxed text-graphite sm:text-base mb-6">{slide.body}</p>
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

              {slide.checklist && (
                <ul className="text-left space-y-3 mb-6 mx-auto max-w-xs">
                  {slide.checklist.map((item, i) => (
                    <li key={item} className="flex items-start gap-3 animate-pop-in" style={{ animationDelay: `${90 * i}ms` }}>
                      <div className="w-5 h-5 rounded-full bg-siegel-wash flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-siegel" aria-hidden="true" />
                      </div>
                      <span className="text-sm text-ink leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {slide.isFinal && (
                <div className="flex flex-col gap-3 mt-2">
                  <Button onClick={() => completeOnboarding('level-test')} shimmer size="lg" className="w-full">
                    Start the placement test
                  </Button>
                  <button
                    onClick={handleSkip}
                    className="text-sm font-bold text-siegel transition-colors hover:text-siegel-deep"
                  >
                    Maybe later, take me to the dashboard →
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
