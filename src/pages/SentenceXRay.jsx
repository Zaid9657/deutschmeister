import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, ArrowRight, Loader2, AlertCircle, ChevronDown, ChevronUp, Type, Sparkles, Eye, Crown } from 'lucide-react';
import SEO from '../components/SEO';
import { seoProps } from '../data/seoRoutes.js';
import { useAuth } from '../contexts/AuthContext';
import { getAuthHeaders } from '../utils/supabase';
import { TRIAL_DAILY_LIMIT, PRO_DAILY_LIMIT } from '../config/limits';
import { withTimeout } from '../utils/withTimeout';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';

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

// The four cases on the kasus tokens (design-tokens.js rule 1). This is the
// one screen where case colour is legitimately everywhere: every chip below
// names its case. `chip` is the same class string as the homepage's living
// X-Ray demo (astro-site/src/pages/index.astro, KASUS_CLASS), so a learner
// meets one colour language on both sides of the sign-up.
const CASE_STYLES = {
  nominative: {
    tone:  'nominativ',
    chip:  'border-kasus-nominativ bg-kasus-nominativ-wash text-kasus-nominativ-ink',
    edge:  'border-l-kasus-nominativ',
    abbr:  'NOM',
    label: 'Nominative',
  },
  accusative: {
    tone:  'akkusativ',
    chip:  'border-kasus-akkusativ bg-kasus-akkusativ-wash text-kasus-akkusativ-ink',
    edge:  'border-l-kasus-akkusativ',
    abbr:  'AKK',
    label: 'Accusative',
  },
  dative: {
    tone:  'dativ',
    chip:  'border-kasus-dativ bg-kasus-dativ-wash text-kasus-dativ-ink',
    edge:  'border-l-kasus-dativ',
    abbr:  'DAT',
    label: 'Dative',
  },
  genitive: {
    tone:  'genitiv',
    chip:  'border-kasus-genitiv bg-kasus-genitiv-wash text-kasus-genitiv-ink',
    edge:  'border-l-kasus-genitiv',
    abbr:  'GEN',
    label: 'Genitive',
  },
};

// Plain words (verbs, adverbs, particles…) — the homepage's PLAIN_CHIP.
const DEFAULT_STYLE = {
  tone:  null,
  chip:  'border-rule bg-paper-sunk text-graphite',
  edge:  'border-l-edge',
  abbr:  null,
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

const ANON_ID_KEY = 'dm_xray_anon_id';

const EYEBROW = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em]';
const XR_CHIP = 'rounded-md border px-3 py-2 text-left';
const XR_WORD = 'block text-[1.0625rem] font-semibold leading-none';
const XR_ABBR = 'mt-1.5 block font-data text-[0.625rem] font-bold tracking-[0.13em]';

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

// The small line under the word on an X-Ray chip: the case abbreviation when
// there is one, otherwise the role — so a plain chip still says what it is.
function chipAbbr(word) {
  const style = getStyle(word.case);
  if (style.abbr) return style.abbr;
  const role = ROLE_LABELS[word.role] || word.role || '';
  return String(role).toUpperCase();
}

// ─── sub-components ───────────────────────────────────────────────────────────

// One word on the X-Ray stage. The outer span carries the pop (index.css
// .xr-chip, fill-mode both — which is why the pressable button lives INSIDE
// it: a filled animation would pin the transform and swallow the press).
function WordChip({ word, index, isSelected, onClick }) {
  const style = getStyle(word.case);
  return (
    <span className="xr-chip inline-block" style={{ animationDelay: `${index * 70}ms` }}>
      <button
        type="button"
        onClick={onClick}
        className={`${XR_CHIP} ${style.chip} shadow-raise transition-all duration-100 ease-snap hover:-translate-y-0.5 active:translate-y-1 active:shadow-none ${
          isSelected ? 'ring-[3px] ring-siegel ring-offset-2 ring-offset-paper' : ''
        }`}
      >
        <span className={XR_WORD}>{word.text}</span>
        <span className={XR_ABBR}>{chipAbbr(word)}</span>
      </button>
    </span>
  );
}

function WordCard({ word, index }) {
  const [expanded, setExpanded] = useState(false);
  const style = getStyle(word.case);
  const roleLabel = ROLE_LABELS[word.role] || word.role;

  return (
    <Reveal delay={index * 60}>
      <Card className={`overflow-hidden border-l-4 ${style.edge}`}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="font-display font-semibold text-lg text-ink">{word.text}</span>
                <span className="text-graphite text-sm">→</span>
                <span className="text-graphite text-sm italic">{word.translation}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Chip tone="quiet">{roleLabel}</Chip>
                {word.case && (
                  <Chip tone={style.tone}>{style.label || word.case}</Chip>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0 p-1.5 rounded-md text-graphite hover:bg-paper-sunk hover:text-ink transition-colors"
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
                <p className="mt-3 text-sm text-graphite leading-relaxed border-t border-rule pt-3">
                  {word.explanation}
                </p>
                {word.grammarTopic && (
                  <a
                    href={`/grammar/a1.1/${word.grammarTopic}/`}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-siegel hover:text-siegel-deep transition-colors"
                  >
                    Learn more: {word.grammarTopic.replace(/-/g, ' ')}
                    <ArrowRight size={11} />
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </Reveal>
  );
}

function CaseLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(CASE_STYLES).map(([key, style]) => (
        <Chip key={key} tone={style.tone} size="md">
          {style.label}
        </Chip>
      ))}
      <Chip tone="quiet" size="md">Verb / Other</Chip>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 py-4">
      {HOW_IT_WORKS.map(({ icon: Icon, step, label }, i) => (
        <div key={step} className="flex sm:flex-1 items-center gap-2 sm:justify-center">
          <div className="flex-shrink-0 w-7 h-7 rounded-pill bg-siegel-wash flex items-center justify-center">
            <Icon size={14} className="text-siegel-deep" />
          </div>
          <span className="text-sm text-graphite">
            <span className="font-bold text-ink">{step}.</span> {label}
          </span>
          {i < HOW_IT_WORKS.length - 1 && (
            <ArrowRight size={14} className="hidden sm:block text-edge ml-2 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function PreviewExample({ onTryIt }) {
  return (
    <Card tone="sunk" className="border-dashed p-4">
      <div className="flex items-center justify-between mb-3">
        <span className={`${EYEBROW} text-siegel`}>
          Example result
        </span>
        <button
          type="button"
          onClick={onTryIt}
          className="text-xs font-bold text-siegel hover:text-siegel-deep transition-colors"
        >
          Try it yourself ↑
        </button>
      </div>
      <p className="text-sm font-medium text-graphite italic mb-3">
        "Ich gebe dir das Buch." — <span className="not-italic">I give you the book.</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {PREVIEW_WORDS.map((word) => {
          const style = getStyle(word.case);
          return (
            <div key={word.text} className="flex flex-col items-center gap-1">
              <span className={`${XR_CHIP} ${style.chip}`}>
                <span className={XR_WORD}>{word.text}</span>
                <span className={XR_ABBR}>{chipAbbr(word)}</span>
              </span>
              <span className="font-data text-[0.6875rem] text-graphite italic">{word.translation}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function UsageBar({ usage, isLoggedIn }) {
  if (!usage || usage.remaining === null) return null;

  const { limit, usedToday, remaining } = usage;
  const pct = Math.min(100, (usedToday / limit) * 100);
  const isLow = remaining <= 1;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-paper-sunk rounded-pill overflow-hidden">
        <div
          className={`h-full rounded-pill transition-all duration-500 ${isLow ? 'bg-accent-aprikose' : 'bg-siegel'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-data text-[0.75rem] font-medium whitespace-nowrap ${isLow ? 'text-accent-aprikose-ink' : 'text-graphite'}`}>
        {remaining} of {limit} left today
        {!isLoggedIn && (
          <Link to="/signup" className="ml-1.5 font-bold text-siegel hover:text-siegel-deep underline underline-offset-2">
            Sign up for more
          </Link>
        )}
      </span>
    </div>
  );
}

// The daily-limit prompt: an aprikose attention card (warning tone, tokens
// rule 2) with the one interactive colour on its CTA.
function LimitReachedBanner({ limit, isLoggedIn }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card raised tone="aprikose" edge="aprikose" className="p-5 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-clay bg-white mb-3">
          <Crown size={20} className="text-accent-aprikose-ink" />
        </div>
        <h3 className="font-display font-semibold text-ink text-base mb-1">
          {isLoggedIn
            ? `That's all ${limit} of today's analyses. More tomorrow — or:`
            : `That's your free analysis for today. A free account gives you ${TRIAL_DAILY_LIMIT} a day for your first week.`}
        </h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
          <Button href="/pricing/">
            <Crown size={14} />
            {isLoggedIn
              ? `Upgrade to Pro — ${PRO_DAILY_LIMIT} analyses a day`
              : `Try Pro — ${PRO_DAILY_LIMIT} analyses a day`}
          </Button>
          {!isLoggedIn && (
            <Button variant="secondary" to="/signup">
              Create a free account
            </Button>
          )}
        </div>
      </Card>
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

  // Every non-200 gets a message a learner can act on. Upstream failures are
  // ours, not theirs, and must not read like the sentence was rejected.
  const failureMessage = (status, data) => {
    if (data?.code?.startsWith('upstream_')) {
      return 'Sentence X-Ray is temporarily unavailable — this one is on us, not your sentence. Please try again in a few minutes.';
    }
    if (status >= 500) {
      return 'Sentence X-Ray is temporarily unavailable. Please try again in a few minutes.';
    }
    return data?.error || 'Analysis failed. Please try again.';
  };

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
      // Timeboxed: an LLM call that never resolves used to leave "Analyzing…"
      // spinning forever with no way out.
      const res = await withTimeout(
        fetch('/.netlify/functions/analyze-sentence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
          body: JSON.stringify({
            sentence:    trimmed,
            anonymousId: user?.id ? null : anonId,
          }),
        }),
        45000,
        'The analysis is taking longer than expected. Please try again.'
      );

      // A platform-level 502/504 (function crash or cold-start timeout) returns
      // an HTML error page, not JSON. Letting res.json() throw surfaced
      // "Unexpected token '<'" to the user instead of a real message.
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setLimitReached({ tier: data.tier, limit: data.limit });
        setUsage({ tier: data.tier, limit: data.limit, usedToday: data.usedToday, remaining: 0 });
        return;
      }

      if (!res.ok) {
        throw new Error(failureMessage(res.status, data));
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
    <div className="min-h-screen bg-paper text-ink pt-20 pb-16 relative overflow-hidden">
      <SEO
        {...seoProps('/analyze')}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Sentence X-Ray",
          "description": "Analyze any German sentence to see grammatical cases, word roles, and explanations.",
          "url": "https://deutsch-meister.de/analyze/",
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "Any",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "provider": {
            "@type": "Organization",
            "@id": "https://deutsch-meister.de/#organization",
            "name": "DeutschMeister",
            "url": "https://deutsch-meister.de"
          }
        }}
      />

      <Aurora />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="hero-line inline-flex items-center justify-center w-14 h-14 rounded-clay bg-siegel-wash text-siegel-deep mb-4" style={{ '--d': '0ms' }}>
            <Scan className="w-7 h-7" />
          </div>
          <SectionHeading
            level={1}
            size="page"
            align="center"
            title="Sentence X-Ray"
            lead="Paste any German sentence and see exactly how it works — cases, roles, and why."
          />
        </div>

        {/* Input — the big raised clay card */}
        <div className="hero-line mb-4" style={{ '--d': '160ms' }}>
          <Card raised className="p-4 sm:p-5">
            <textarea
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type or paste a German sentence… e.g. Die Mutter gibt dem Kind einen Apfel."
              rows={2}
              className="w-full resize-none rounded-clay border border-rule bg-paper px-4 py-3 text-base leading-relaxed text-ink placeholder:text-graphite focus:border-siegel"
            />
            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="flex-1 min-w-0">
                {usage ? (
                  <UsageBar usage={usage} isLoggedIn={!!user} />
                ) : (
                  <span className="font-data text-[0.75rem] text-graphite">{sentence.length}/500</span>
                )}
              </div>
              <Button
                shimmer
                onClick={() => analyze()}
                disabled={loading || !sentence.trim() || !!limitReached}
                className="flex-shrink-0"
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
              </Button>
            </div>
          </Card>
        </div>

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
              <Card className="px-4">
                <HowItWorks />
              </Card>

              <PreviewExample onTryIt={() => document.querySelector('textarea')?.focus()} />

              <div>
                <p className={`${EYEBROW} text-siegel mb-2 px-1`}>
                  Or try an example
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((ex) => (
                    <Chip key={ex} tone="quiet" size="md" raised onClick={() => analyze(ex)}>
                      {ex}
                    </Chip>
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
              className="flex items-start gap-3 p-4 mb-6 rounded-clay border border-accent-himbeer/30 bg-accent-himbeer-wash text-accent-himbeer-ink"
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
              <div className="mb-5 px-4 py-3 rounded-clay bg-ink text-paper text-sm">
                <span className={`${EYEBROW} text-paper/60 mr-2`}>Translation</span>
                <span className="font-medium">{result.fullTranslation}</span>
              </div>

              {/* Color legend */}
              <div className="mb-4">
                <CaseLegend />
              </div>

              {/* Word chips — the X-Ray stage */}
              <Card raised className="mb-6 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className={`${EYEBROW} text-siegel`}>Sentence X-Ray</p>
                  <span className="flex gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-pill bg-accent-himbeer" />
                    <span className="h-2.5 w-2.5 rounded-pill bg-accent-aprikose" />
                    <span className="h-2.5 w-2.5 rounded-pill bg-accent-limette" />
                  </span>
                </div>
                <div className="flex flex-wrap content-start items-start gap-2">
                  {result.words.map((word, i) => (
                    <WordChip
                      key={i}
                      word={word}
                      index={i}
                      isSelected={selectedWord === i}
                      onClick={() => setSelectedWord(selectedWord === i ? null : i)}
                    />
                  ))}
                </div>
              </Card>

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
                  className="mb-6"
                >
                  <Card tone="wash" className="p-5">
                    <p className={`${EYEBROW} text-siegel-deep mb-1`}>
                      Key Insight
                    </p>
                    <h3 className="font-display font-semibold text-ink text-base mb-2">
                      {result.insight.title}
                    </h3>
                    <p className="text-sm text-graphite leading-relaxed">
                      {result.insight.explanation}
                    </p>
                  </Card>
                </motion.div>
              )}

              {/* Analyze another */}
              <div className="text-center">
                <Button variant="ghost" onClick={reset}>
                  Analyze another sentence
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SentenceXRay;
