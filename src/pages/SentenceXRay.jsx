import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, ArrowRight, Loader2, AlertCircle, ChevronDown, ChevronUp, Type, Sparkles, Eye, Crown } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';

// ─── constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS = {
  subject:            'Subject',
  direct_object:      'Direct Object',
  indirect_object:    'Indirect Object',
  verb:               'Verb',
  adverb:             'Adverb',
  adjective:          'Adjective',
  preposition_phrase: 'Prep. Phrase',
  conjunction:        'Conjunction',
  particle:           'Particle',
  other:              'Other',
};

const CASE_STYLES = {
  nominative: {
    chip:  'bg-[#E6F1FB] border border-[#378ADD] text-[#0C447C]',
    badge: 'bg-[#378ADD] text-white',
    card:  'border-[#378ADD] bg-[#E6F1FB]/40',
    label: 'Nominative',
  },
  accusative: {
    chip:  'bg-[#FAECE7] border border-[#D85A30] text-[#712B13]',
    badge: 'bg-[#D85A30] text-white',
    card:  'border-[#D85A30] bg-[#FAECE7]/40',
    label: 'Accusative',
  },
  dative: {
    chip:  'bg-[#E1F5EE] border border-[#1D9E75] text-[#085041]',
    badge: 'bg-[#1D9E75] text-white',
    card:  'border-[#1D9E75] bg-[#E1F5EE]/40',
    label: 'Dative',
  },
  genitive: {
    chip:  'bg-[#EEEDFE] border border-[#7F77DD] text-[#3C3489]',
    badge: 'bg-[#7F77DD] text-white',
    card:  'border-[#7F77DD] bg-[#EEEDFE]/40',
    label: 'Genitive',
  },
};

const DEFAULT_STYLE = {
  chip:  'bg-slate-100 border border-slate-300 text-slate-700',
  badge: 'bg-slate-500 text-white',
  card:  'border-slate-200 bg-slate-50',
  label: null,
};

const EXAMPLES = [
  'Die Mutter gibt dem Kind einen Apfel.',
  'Wegen des Wetters bleiben wir heute zu Hause.',
  'Er hat das Buch seinem Freund gegeben.',
  'Trotz des Regens ging sie spazieren.',
  'Ich kaufe meiner Schwester ein Geschenk.',
];

const HOW_IT_WORKS = [
  { icon: Type,     step: '1', label: 'Paste any German sentence' },
  { icon: Sparkles, step: '2', label: 'AI analyzes grammar instantly' },
  { icon: Eye,      step: '3', label: 'See cases, roles, and why' },
];

const PREVIEW_WORDS = [
  { text: 'Ich',      case: 'nominative', role: 'subject',         translation: 'I' },
  { text: 'gebe',     case: null,         role: 'verb',            translation: 'give' },
  { text: 'dir',      case: 'dative',     role: 'indirect_object', translation: 'to you' },
  { text: 'das Buch', case: 'accusative', role: 'direct_object',   translation: 'the book' },
];

const TIER_LABELS = {
  anonymous: 'visitor',
  free:      'free account',
  pro:       'Pro',
};

const ANON_ID_KEY = 'dm_xray_anon_id';

function getOrCreateAnonId() {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

function getStyle(caseVal) {
  return CASE_STYLES[caseVal] || DEFAULT_STYLE;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function WordChip({ word, isSelected, onClick }) {
  const style = getStyle(word.case);
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all duration-150 ${style.chip} ${
        isSelected ? 'ring-2 ring-offset-1 ring-slate-400 scale-105' : 'hover:scale-105'
      }`}
    >
      {word.text}
    </button>
  );
}

function WordCard({ word, index }) {
  const [expanded, setExpanded] = useState(false);
  const style = getStyle(word.case);
  const roleLabel = ROLE_LABELS[word.role] || word.role;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-xl border-2 ${style.card} overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-display font-bold text-lg text-slate-900">{word.text}</span>
              <span className="text-slate-400 text-sm">→</span>
              <span className="text-slate-600 text-sm italic">{word.translation}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                {roleLabel}
              </span>
              {word.case && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                  {style.label || word.case}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/60 transition-colors text-slate-500"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="mt-3 text-sm text-slate-700 leading-relaxed border-t border-black/10 pt-3">
                {word.explanation}
              </p>
              {word.grammarTopic && (
                <Link
                  to={`/grammar/a1.1/${word.grammarTopic}/`}
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Learn more: {word.grammarTopic.replace(/-/g, ' ')}
                  <ArrowRight size={11} />
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function CaseLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {Object.entries(CASE_STYLES).map(([key, style]) => (
        <span key={key} className={`px-2.5 py-1 rounded-full border font-medium ${style.chip}`}>
          {style.label}
        </span>
      ))}
      <span className="px-2.5 py-1 rounded-full border font-medium bg-slate-100 border-slate-300 text-slate-600">
        Verb / Other
      </span>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 py-4">
      {HOW_IT_WORKS.map(({ icon: Icon, step, label }, i) => (
        <div key={step} className="flex sm:flex-1 items-center gap-2 sm:justify-center">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
            <Icon size={14} className="text-slate-500" />
          </div>
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-slate-600">{step}.</span> {label}
          </span>
          {i < HOW_IT_WORKS.length - 1 && (
            <ArrowRight size={14} className="hidden sm:block text-slate-300 ml-2 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function PreviewExample({ onTryIt }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Example result
        </span>
        <button
          onClick={onTryIt}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
        >
          Try it yourself ↑
        </button>
      </div>
      <p className="text-sm font-medium text-slate-500 italic mb-3">
        "Ich gebe dir das Buch." — <span className="not-italic">I give you the book.</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {PREVIEW_WORDS.map((word) => {
          const style = getStyle(word.case);
          return (
            <div key={word.text} className="flex flex-col items-center gap-1">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border opacity-80 ${style.chip}`}>
                {word.text}
              </span>
              <span className="text-xs text-slate-400 italic">{word.translation}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UsageBar({ usage, isLoggedIn }) {
  if (!usage || usage.remaining === null) return null;

  const { limit, usedToday, remaining, tier } = usage;
  const pct = Math.min(100, (usedToday / limit) * 100);
  const isLow = remaining <= 1;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-amber-400' : 'bg-indigo-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-medium whitespace-nowrap ${isLow ? 'text-amber-600' : 'text-slate-500'}`}>
        {remaining} of {limit} left today
        {!isLoggedIn && (
          <Link to="/signup" className="ml-1.5 text-indigo-500 hover:text-indigo-700 underline underline-offset-2">
            Sign up for more
          </Link>
        )}
      </span>
    </div>
  );
}

function LimitReachedBanner({ tier, limit, isLoggedIn }) {
  const tierLabel = TIER_LABELS[tier] || tier;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-center"
    >
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 mb-3">
        <Crown size={20} className="text-amber-600" />
      </div>
      <h3 className="font-display font-bold text-slate-800 text-base mb-1">
        {isLoggedIn
          ? /* EN: You've used all {limit} analyses today — back tomorrow, or: */
            `Du hast heute alle ${limit} Analysen genutzt — morgen geht's weiter, oder:`
          : /* EN: Create a free account for 5 analyses per day — or try Pro with 50 analyses daily. */
            'Erstelle ein kostenloses Konto für 5 Analysen pro Tag — oder teste Pro mit 50 Analysen täglich.'}
      </h3>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
        >
          <Crown size={14} />
          {/* EN: Upgrade to Pro now — 50 analyses per day */}
          {isLoggedIn ? 'Jetzt auf Pro upgraden — 50 Analysen pro Tag' : 'Pro testen — 50 Analysen täglich'}
        </Link>
        {!isLoggedIn && (
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Kostenlos registrieren
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

const SentenceXRay = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Pre-fill sentence from ?s= query param (used by daily email CTA links)
  const [sentence, setSentence]       = useState(() => searchParams.get('s') ?? '');
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [limitReached, setLimitReached] = useState(null); // { tier, limit }
  const [usage, setUsage]             = useState(null);   // { tier, limit, usedToday, remaining }

  // Stable anonymous ID
  const [anonId] = useState(() => getOrCreateAnonId());

  // Auto-analyze if sentence arrived via ?s= param
  useEffect(() => {
    const prefill = searchParams.get('s');
    if (prefill?.trim()) analyze(prefill.trim());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyze = async (text) => {
    const trimmed = (text || sentence).trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setLimitReached(null);
    setSelectedWord(null);
    if (text) setSentence(text);

    try {
      const res = await fetch('/.netlify/functions/analyze-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence:    trimmed,
          userId:      user?.id || null,
          anonymousId: user?.id ? null : anonId,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setLimitReached({ tier: data.tier, limit: data.limit });
        setUsage({ tier: data.tier, limit: data.limit, usedToday: data.usedToday, remaining: 0 });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
      if (data.usage) setUsage(data.usage);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      analyze();
    }
  };

  const reset = () => {
    setResult(null);
    setSentence('');
    setError(null);
    setLimitReached(null);
  };

  const showIntro = !result && !loading && !limitReached;

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-16">
      <SEO
        title="Sentence X-Ray — Analyze Any German Sentence"
        description="Paste any German sentence and instantly see the grammatical breakdown. Color-coded cases, word roles, and explanations for why each word works the way it does."
        path="/analyze"
        keywords="German grammar analyzer, German sentence analysis, German cases, nominative accusative dative genitive, learn German grammar"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Sentence X-Ray",
          "description": "Analyze any German sentence to see grammatical cases, word roles, and explanations.",
          "url": "https://deutsch-meister.de/analyze",
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "Any",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "provider": {
            "@type": "Organization",
            "name": "DeutschMeister",
            "url": "https://deutsch-meister.de"
          }
        }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-200 mb-4">
            <Scan className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Sentence X-Ray
          </h1>
          <p className="text-slate-600 text-lg max-w-lg mx-auto">
            Paste any German sentence and see exactly how it works — cases, roles, and why.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4"
        >
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type or paste a German sentence… e.g. Die Mutter gibt dem Kind einen Apfel."
            rows={2}
            className="w-full resize-none text-slate-800 text-base placeholder:text-slate-400 focus:outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex-1 min-w-0">
              {usage ? (
                <UsageBar usage={usage} isLoggedIn={!!user} />
              ) : (
                <span className="text-xs text-slate-400">{sentence.length}/500</span>
              )}
            </div>
            <button
              onClick={() => analyze()}
              disabled={loading || !sentence.trim() || !!limitReached}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Scan size={15} />
                  Analyze
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Intro: how it works + preview + examples */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6 space-y-4"
            >
              <div className="bg-white rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100 sm:divide-y-0">
                <HowItWorks />
              </div>

              <PreviewExample onTryIt={() => document.querySelector('textarea')?.focus()} />

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  Or try an example
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => analyze(ex)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700"
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Limit reached */}
        <AnimatePresence>
          {limitReached && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <LimitReachedBanner
                tier={limitReached.tier}
                limit={limitReached.limit}
                isLoggedIn={!!user}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Full translation */}
              <div className="mb-5 px-4 py-3 rounded-xl bg-slate-800 text-white text-sm">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider mr-2">Translation</span>
                <span className="font-medium">{result.fullTranslation}</span>
              </div>

              {/* Color legend */}
              <div className="mb-4">
                <CaseLegend />
              </div>

              {/* Word chips */}
              <div className="flex flex-wrap gap-2 mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                {result.words.map((word, i) => (
                  <WordChip
                    key={i}
                    word={word}
                    isSelected={selectedWord === i}
                    onClick={() => setSelectedWord(selectedWord === i ? null : i)}
                  />
                ))}
              </div>

              {/* Word detail cards */}
              <div className="space-y-3 mb-6">
                {result.words.map((word, i) => (
                  <WordCard key={i} word={word} index={i} />
                ))}
              </div>

              {/* Insight box */}
              {result.insight && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: result.words.length * 0.06 + 0.1 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 mb-6"
                >
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                    Key Insight
                  </p>
                  <h3 className="font-display font-bold text-slate-800 text-base mb-2">
                    {result.insight.title}
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {result.insight.explanation}
                  </p>
                </motion.div>
              )}

              {/* Analyze another */}
              <div className="text-center">
                <button
                  onClick={reset}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors underline underline-offset-2"
                >
                  Analyze another sentence
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SentenceXRay;
