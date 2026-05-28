import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ListChecks, Rocket, ChevronLeft, ChevronRight, Check, Bug } from 'lucide-react';
import { useOnboarding } from '../../hooks/useOnboarding';
import {
  trackOnboardingStarted,
  trackOnboardingSlideViewed,
  trackOnboardingSkipped,
} from '../../lib/funnelTracking';

const SLIDES = [
  {
    icon: Sparkles,
    color: 'from-amber-400 to-rose-500',
    headline: 'Schön, dass du da bist.',
    body: 'Hier lernst du Deutsch wie ein Mensch — nicht wie ein Spielzeug. Wir zeigen dir in 30 Sekunden, was du als nächstes tun kannst.',
  },
  {
    icon: ListChecks,
    color: 'from-teal-400 to-emerald-500',
    headline: 'Dein Start in den ersten Tag.',
    checklist: [
      'Mach den Einstufungstest (5 Min — wir finden dein Niveau)',
      'Probiere das Sprechtraining mit der KI',
      'Analysiere deinen ersten deutschen Satz mit X-Ray',
    ],
  },
  {
    icon: Rocket,
    color: 'from-violet-400 to-indigo-500',
    headline: "Los geht's mit dem Einstufungstest.",
    body: 'In 5 Minuten weißt du genau, auf welcher Stufe du startest. Spar dir Wochen auf der falschen Stufe.',
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12 relative">
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
            className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center"
          >
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-lg`}>
              <slide.icon className="w-8 h-8 text-white" />
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-800 mb-4">
              {slide.headline}
            </h2>

            {slide.body && (
              <p className="text-slate-600 leading-relaxed mb-6">{slide.body}</p>
            )}

            {slide.checklist && (
              <ul className="text-left space-y-3 mb-6 mx-auto max-w-xs">
                {slide.checklist.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-sm text-slate-700 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {slide.isFinal && (
              <div className="flex flex-col gap-3 mt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => completeOnboarding('level-test')}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/25 hover:from-amber-600 hover:to-rose-600 transition-all"
                >
                  Einstufungstest starten
                </motion.button>
                <button
                  onClick={handleSkip}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Lieber später, direkt zum Dashboard →
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
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all disabled:opacity-0 disabled:pointer-events-none"
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
                  backgroundColor: i === currentStep ? '#f59e0b' : '#cbd5e1',
                }}
                transition={{ duration: 0.2 }}
                className="h-2 rounded-full"
              />
            ))}
          </div>

          {currentStep < SLIDES.length - 1 ? (
            <button
              onClick={goNext}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
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
