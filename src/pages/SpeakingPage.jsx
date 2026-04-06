import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Clock, ChevronRight, Crown, ArrowRight, Loader2, AlertTriangle, Monitor } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import { LEVEL_CONFIGS, getConfigForLevel } from '../constants/speakingPrompts';
import SpeakingPractice, { checkSpeakingSupport } from '../components/SpeakingPractice';
import SpeakingEvaluationResults from '../components/SpeakingEvaluationResults';
import SpeakingUsageIndicator from '../components/SpeakingUsageIndicator';

const LEVEL_ORDER = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];

const LEVEL_COLORS = {
  'A1.1': { accent: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', pill: 'bg-emerald-50 text-emerald-600', dots: 1 },
  'A1.2': { accent: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', pill: 'bg-emerald-50 text-emerald-600', dots: 1 },
  'A2.1': { accent: 'bg-teal-500', badge: 'bg-teal-50 text-teal-700 ring-teal-200', pill: 'bg-teal-50 text-teal-600', dots: 2 },
  'A2.2': { accent: 'bg-teal-500', badge: 'bg-teal-50 text-teal-700 ring-teal-200', pill: 'bg-teal-50 text-teal-600', dots: 2 },
  'B1.1': { accent: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 ring-blue-200', pill: 'bg-blue-50 text-blue-600', dots: 3 },
  'B1.2': { accent: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 ring-blue-200', pill: 'bg-blue-50 text-blue-600', dots: 3 },
  'B2.1': { accent: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', pill: 'bg-indigo-50 text-indigo-600', dots: 4 },
  'B2.2': { accent: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', pill: 'bg-indigo-50 text-indigo-600', dots: 4 },
};

function getNextLevel(current) {
  const idx = LEVEL_ORDER.indexOf(current);
  if (idx === -1 || idx >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1];
}

function DifficultyDots({ count }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            i <= count ? 'bg-slate-500' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

function SoundWaveSVG() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-full opacity-60" aria-hidden="true">
      <path d="M20 60 Q30 20 40 60 Q50 100 60 60 Q70 20 80 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-300" />
      <path d="M60 60 Q70 30 80 60 Q90 90 100 60 Q110 30 120 60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-teal-400" />
      <path d="M100 60 Q110 15 120 60 Q130 105 140 60 Q150 15 160 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-300" />
      <path d="M140 60 Q150 35 160 60 Q170 85 180 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-teal-200" />
      <circle cx="30" cy="60" r="3" className="fill-teal-300 opacity-40" />
      <circle cx="90" cy="60" r="4" className="fill-teal-400 opacity-30" />
      <circle cx="150" cy="60" r="3" className="fill-teal-300 opacity-40" />
    </svg>
  );
}

function UsageGate({ usage }) {
  if (!usage || usage.allowed) return null;

  const { reason, tier, used, limit, nextAvailable } = usage;

  if (reason === 'subscription_required') {
    return (
      <div className="max-w-md mx-auto mb-8 bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Crown className="w-7 h-7 text-white" />
        </div>
        {/* EN: Your trial is over — but your progress isn't */}
        <h3 className="font-bold text-slate-800 mb-2">Deine Testphase ist vorbei — aber dein Fortschritt nicht</h3>
        <p className="text-sm text-slate-500 mb-4">
          {/* EN: You've already taken the first step. With Pro you get 30 AI conversations per month and pick up right where you left off. */}
          Du hast bereits den ersten Schritt gemacht. Mit Pro bekommst du 30 KI-Gespräche pro Monat und machst da weiter, wo du aufgehört hast.
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-200 text-sm"
        >
          <Crown className="w-4 h-4" />
          {/* EN: Keep learning with Pro */}
          Weiter lernen mit Pro
        </Link>
      </div>
    );
  }

  if (reason === 'monthly_limit_reached') {
    return (
      <div className="max-w-md mx-auto mb-8 bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <Mic className="w-7 h-7 text-white" />
        </div>
        {/* EN: You're learning faster than expected */}
        <h3 className="font-bold text-slate-800 mb-2">Du lernst schneller als erwartet</h3>
        <p className="text-sm text-slate-500 mb-4">
          {/* EN: You've used all {used}/{limit} conversations this month. That shows real progress. Upgrade for more practice time. */}
          Du hast alle {used}/{limit} Gespräche diesen Monat genutzt. Das zeigt echten Fortschritt. Upgrade für mehr Übungszeit.
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-200 text-sm"
        >
          <Crown className="w-4 h-4" />
          {/* EN: Unlock more conversations */}
          Mehr Gespräche freischalten
        </Link>
      </div>
    );
  }

  if (reason === 'trial_limit_reached') {
    return (
      <div className="max-w-md mx-auto mb-8 bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
          <Mic className="w-7 h-7 text-white" />
        </div>
        {/* EN: Your first impression of AI speaking practice */}
        <h3 className="font-bold text-slate-800 mb-2">Dein erster Eindruck von KI-Sprechübungen</h3>
        <p className="text-sm text-slate-500 mb-4">
          {/* EN: You've used your 2 free sessions. Did it help? With Pro you practice 30 times per month — and get an evaluation after every conversation. */}
          Du hast deine 2 kostenlosen Sitzungen genutzt. Hat es geholfen? Mit Pro übst du 30 Mal pro Monat — und bekommst nach jedem Gespräch eine Bewertung.
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-200 text-sm"
        >
          <Crown className="w-4 h-4" />
          {/* EN: Continue with Pro */}
          Mit Pro weitermachen
        </Link>
      </div>
    );
  }

  return null;
}

function BrowserUnsupportedBanner({ browserSupport }) {
  const isInApp = browserSupport.reason === 'in_app_browser';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      window.prompt('URL kopieren:', window.location.href);
    }
  };

  return (
    <div className="max-w-lg mx-auto mb-8 bg-white rounded-2xl border border-amber-200 p-6 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-amber-500" />
      </div>
      <h3 className="font-bold text-slate-800 mb-2">
        {isInApp ? 'In-App-Browser erkannt' : 'Browser nicht unterstützt'}
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        {isInApp
          ? 'Bitte öffne diese Seite in Safari oder Chrome. In-App-Browser unterstützen kein Mikrofon.'
          : 'Dein Browser unterstützt die benötigten Audio-Funktionen nicht. Sprechübungen erfordern WebRTC und Mikrofon-Zugriff.'}
      </p>
      {isInApp ? (
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm transition-colors"
        >
          URL kopieren
        </button>
      ) : (
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
          <Monitor className="w-4 h-4" />
          Bitte verwende <strong>Chrome</strong>, <strong>Edge</strong> oder <strong>Safari</strong> (Desktop)
        </div>
      )}
    </div>
  );
}

const SpeakingPage = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState('select');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [usage, setUsage] = useState(null);
  const [usageLoading, setUsageLoading] = useState(true);

  const browserSupport = useMemo(() => checkSpeakingSupport(), []);

  const fetchUsage = useCallback(async () => {
    if (!user?.id) { setUsageLoading(false); return; }
    try {
      const res = await fetch('/api/speaking/check-speaking-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (res.ok) {
        setUsage(await res.json());
      }
    } catch (err) {
      console.error('Failed to check speaking usage:', err);
    } finally {
      setUsageLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const handleSelectLevel = (level) => {
    if (usage && !usage.allowed) return;
    setSelectedLevel(level);
    setEvaluation(null);
    setPhase('practice');
  };

  const handleComplete = (eval_) => {
    setEvaluation(eval_);
    setPhase(eval_ ? 'results' : 'select');
    // Refresh usage after session
    fetchUsage();
  };

  const handleCancel = () => {
    setSelectedLevel(null);
    setPhase('select');
  };

  const handleRetry = () => {
    setEvaluation(null);
    setPhase('practice');
  };

  const handleNextLevel = () => {
    const next = getNextLevel(selectedLevel);
    if (next) {
      setSelectedLevel(next);
      setEvaluation(null);
      setPhase('practice');
    }
  };

  const handleBack = () => {
    setSelectedLevel(null);
    setEvaluation(null);
    setPhase('select');
  };

  // Guest gate — show compelling signup page instead of redirecting silently
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 pt-20 pb-12">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-teal-200">
            <Mic className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            AI Speaking Practice
          </h1>
          <p className="text-lg text-slate-600 mb-2">
            Create your free account to try AI Speaking Practice.
          </p>
          <p className="text-slate-500 mb-8">
            Your first <strong className="text-teal-600">2 sessions are free</strong> — no credit card required. Practice real German conversations with an AI teacher and get instant feedback on grammar, vocabulary, and pronunciation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold rounded-2xl shadow-lg shadow-rose-200 hover:shadow-xl transition-all"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              Log In
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span>✓ 2 free sessions included</span>
            <span>✓ No credit card required</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </div>
    );
  }

  // Practice phase
  if (phase === 'practice' && selectedLevel) {
    return (
      <SpeakingPractice
        level={selectedLevel}
        userId={user?.id}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    );
  }

  // Results phase
  if (phase === 'results' && evaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12 px-4">
        <SpeakingEvaluationResults
          level={selectedLevel}
          evaluation={evaluation}
          onRetry={handleRetry}
          onNextLevel={getNextLevel(selectedLevel) ? handleNextLevel : undefined}
          onBack={handleBack}
        />
      </div>
    );
  }

  const isBlocked = usage && !usage.allowed;

  // Select phase
  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <SEO
        title="AI German Speaking Practice | Conversation Partner Online | DeutschMeister"
        description="Practice speaking German with our AI conversation partner. Get instant feedback on pronunciation and grammar. Available 24/7, no scheduling needed. Try free today."
        keywords="German speaking practice, AI German tutor, practice German conversation, German speaking partner online, speak German with AI"
        path="/speaking"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "DeutschMeister AI Speaking Practice",
            "description": "AI-powered German conversation partner that helps you practice speaking German with real-time feedback on pronunciation and grammar.",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR",
              "description": "Free trial available"
            },
            "featureList": [
              "Real-time conversation with AI",
              "Pronunciation feedback",
              "Grammar correction",
              "Adaptive difficulty (A1-B2)",
              "Available 24/7"
            ],
            "inLanguage": ["de", "en"],
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
                "name": "How does AI German speaking practice work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You have a real-time voice conversation with our AI tutor 'Frau Schmidt'. The AI adapts to your level (A1-B2), corrects mistakes, and helps you practice natural German conversation."
                }
              },
              {
                "@type": "Question",
                "name": "Is the AI speaking practice free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, you get a free trial session to try the AI speaking practice. Premium plans offer unlimited sessions for regular practice."
                }
              },
              {
                "@type": "Question",
                "name": "What level of German do I need?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The AI adapts to all levels from A1 (beginner) to B2 (upper intermediate). It starts at your level and adjusts based on your responses."
                }
              },
              {
                "@type": "Question",
                "name": "Can AI really help me improve my German speaking?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! Regular practice with AI helps build confidence and fluency. You can practice anytime without scheduling, make mistakes without embarrassment, and get immediate feedback on grammar and pronunciation."
                }
              }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://deutsch-meister.de"},
              {"@type": "ListItem", "position": 2, "name": "Speaking Practice", "item": "https://deutsch-meister.de/speaking"}
            ]
          }
        ]}
      />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-teal-500/10 via-teal-500/5 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-center justify-between">
            <div className="flex-1 animate-[fadeInUp_0.5s_ease-out]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 text-teal-700 text-xs font-semibold mb-4 tracking-wide uppercase">
                <Mic className="w-3.5 h-3.5" />
                KI-Sprachpraxis
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
                Sprechen üben
              </h1>
              <p className="text-base sm:text-lg text-slate-500 max-w-md leading-relaxed mb-4">
                Wähle dein Level und führe ein 10-minütiges Gespräch mit deinem KI-Sprachpartner.
              </p>
              {/* Usage indicator */}
              {usageLoading ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-400 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Laden…
                </div>
              ) : (
                <SpeakingUsageIndicator usage={usage} />
              )}
            </div>
            <div className="hidden sm:block w-48 h-28 flex-shrink-0 ml-8 animate-[fadeIn_0.8s_ease-out]">
              <SoundWaveSVG />
            </div>
          </div>
        </div>
      </div>

      {/* Browser Unsupported Banner */}
      {!browserSupport.supported && <BrowserUnsupportedBanner browserSupport={browserSupport} />}

      {/* Usage Gate */}
      {browserSupport.supported && !usageLoading && <UsageGate usage={usage} />}

      {/* Level Grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 -mt-2">
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 ${isBlocked || !browserSupport.supported ? 'opacity-50 pointer-events-none' : ''}`}>
          {LEVEL_ORDER.map((level, index) => {
            const config = getConfigForLevel(level);
            const colors = LEVEL_COLORS[level];
            if (!config) return null;

            return (
              <button
                key={level}
                onClick={() => handleSelectLevel(level)}
                disabled={isBlocked}
                className="group relative text-left rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 hover:border-gray-300/80 active:scale-[0.98] disabled:cursor-not-allowed"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.accent} rounded-l-2xl`} />

                <div className="p-5 pl-6">
                  {/* Top row: badge + difficulty */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ring-1 ${colors.badge}`}>
                        {config.level}
                      </span>
                      <DifficultyDots count={colors.dots} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Title + description */}
                  <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-slate-900 transition-colors">
                    {config.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3.5 line-clamp-2">
                    {config.description}
                  </p>

                  {/* Bottom: topic pills + time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                      {config.topics.slice(0, 3).map((topic, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium truncate ${colors.pill}`}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      <span className="text-[11px] font-medium">~10 Min</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SpeakingPage;
