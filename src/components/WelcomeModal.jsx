import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Mic, BookOpen } from 'lucide-react';

const LS_KEY = 'dm_welcome_seen';

const ACTIONS = [
  {
    icon: Sparkles,
    gradient: 'from-amber-400 to-orange-500',
    title: 'Sentence X-Ray ausprobieren',
    // EN: Try Sentence X-Ray
    description: 'Füge einen deutschen Satz ein und sieh sofort Fälle, Rollen und Struktur.',
    // EN: Paste a German sentence and instantly see cases, roles, and structure.
    to: '/analyze',
  },
  {
    icon: Mic,
    gradient: 'from-teal-400 to-cyan-500',
    title: 'Erste Sprechübung starten',
    // EN: Start your first speaking session
    description: 'Übe Deutsch sprechen mit KI — dein persönlicher Gesprächspartner.',
    // EN: Practice speaking German with AI — your personal conversation partner.
    to: '/speaking',
  },
  {
    icon: BookOpen,
    gradient: 'from-blue-400 to-indigo-500',
    title: 'A1.1 Grammatik beginnen',
    // EN: Start A1.1 Grammar
    description: 'Starte mit den Grundlagen — Artikel, Pronomen und erste Sätze.',
    // EN: Start with the basics — articles, pronouns, and first sentences.
    to: '/level/a1.1',
  },
];

const WelcomeModal = ({ onDismiss }) => {
  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const dismiss = () => {
    localStorage.setItem(LS_KEY, 'true');
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4">
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo mark */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 flex items-center justify-center shadow-lg shadow-rose-500/25 mb-4">
              <span className="text-white font-bold text-2xl" style={{ fontFamily: 'inherit' }}>D</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-800 mb-1">
              {/* EN: Welcome to DeutschMeister! */}
              Willkommen bei DeutschMeister!
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              {/* EN: Your 7-day Pro trial is active. Here are three ways to start right now: */}
              Deine 7-tägige Pro-Testversion ist aktiv. Hier sind drei Wege, sofort loszulegen:
            </p>
          </div>

          {/* Action cards */}
          <div className="px-6 pb-2 space-y-3">
            {ACTIONS.map(({ icon: Icon, gradient, title, description, to }) => (
              <Link
                key={to}
                to={to}
                onClick={dismiss}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all group"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm leading-snug">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Dismiss */}
          <div className="px-6 py-5 text-center">
            <button
              onClick={dismiss}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              {/* EN: Explore later */}
              Später erkunden
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export { LS_KEY };
export default WelcomeModal;
