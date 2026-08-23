import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ListChecks, Rocket, ChevronLeft, ChevronRight, Check, Bug } from 'lucide-react';
import { useOnboarding } from '../../hooks/useOnboarding';
import {
  trackOnboardingStarted,
  trackOnboardingSlideViewed,
  trackOnboardingSkipped,
} from '../../lib/funnelTracking';
import { color } from '../../data/design-tokens';
import Button from '../ui/Button';

const SLIDES = [
  {
    icon: Sparkles,
    headline: "Glad you're here.",
    body: 'Here you learn German like a person, not like a toy. In 30 seconds we\'ll show you what to do next.',
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

export default function IntroSlides() {
  const { currentStep, setCurrentStep, completeOnboarding, needsOnboarding } = useOnboarding();

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-4 py-12 relative">
      {import.meta.env.DEV && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-mono hover:bg-red-200 transition-colors z-50"
        >
          <Bug className="w-3 h-3" />
          Skip (dev)
        </button>
      )}

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={currentStep}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-white rounded-lg border border-rule shadow-overlay p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-siegel flex items-center justify-center">
              <slide.icon className="w-8 h-8 text-white" />
            </div>

            <h2 className="font-display text-2xl font-semibold text-ink mb-4">
              {slide.headline}
            </h2>

            {slide.body && (
              <p className="text-graphite leading-relaxed mb-6">{slide.body}</p>
            )}

            {slide.checklist && (
              <ul className="text-left space-y-3 mb-6 mx-auto max-w-xs">
                {slide.checklist.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-siegel-wash flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-siegel" />
                    </div>
                    <span className="text-sm text-ink leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {slide.isFinal && (
              <div className="flex flex-col gap-3 mt-2">
                <Button onClick={() => completeOnboarding('level-test')} size="lg" className="w-full">
                  Start the placement test
                </Button>
                <button
                  onClick={handleSkip}
                  className="text-sm text-graphite hover:text-ink transition-colors"
                >
                  Maybe later, take me to the dashboard →
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 px-2">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="w-10 h-10 rounded-full border border-rule flex items-center justify-center text-graphite hover:text-ink hover:border-siegel transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === currentStep ? 24 : 8,
                  backgroundColor: i === currentStep ? color.siegel : color.rule,
                }}
                transition={{ duration: 0.2 }}
                className="h-2 rounded-full"
              />
            ))}
          </div>

          {currentStep < SLIDES.length - 1 ? (
            <button
              onClick={goNext}
              className="w-10 h-10 rounded-full border border-rule flex items-center justify-center text-graphite hover:text-ink hover:border-siegel transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>
    </div>
  );
}
