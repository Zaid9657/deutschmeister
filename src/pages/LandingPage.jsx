import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, MessageSquare, Award, Sparkles, Sun, TreePine, Waves, Moon, Clock, Youtube, ExternalLink, Scan, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import SEO from '../components/SEO';

const BANNER_KEY = 'xray-banner-dismissed';

const LandingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isInFreeTrial, getTrialDaysRemaining, hasActiveSubscription } = useSubscription();

  const [bannerVisible, setBannerVisible] = useState(() => {
    try { return !localStorage.getItem(BANNER_KEY); } catch { return false; }
  });

  const dismissBanner = () => {
    setBannerVisible(false);
    try { localStorage.setItem(BANNER_KEY, '1'); } catch { /* ignore */ }
  };
  const inTrial = user ? isInFreeTrial() : false;
  const isSubscribed = user ? hasActiveSubscription() : false;
  const trialDays = user ? getTrialDaysRemaining() : 0;

  const features = [
    {
      icon: BookOpen,
      title: t('landing.features.levels.title'),
      description: t('landing.features.levels.description'),
      gradient: 'from-amber-400 to-orange-500',
    },
    {
      icon: Sparkles,
      title: t('landing.features.vocabulary.title'),
      description: t('landing.features.vocabulary.description'),
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      icon: Award,
      title: t('landing.features.grammar.title'),
      description: t('landing.features.grammar.description'),
      gradient: 'from-blue-400 to-indigo-500',
    },
    {
      icon: MessageSquare,
      title: t('landing.features.speaking.title'),
      description: t('landing.features.speaking.description'),
      gradient: 'from-purple-400 to-pink-500',
    },
  ];

  const levels = [
    { level: 'A1', icon: Sun,      color: 'from-[#F4B99A] to-[#D9A8B4]', name: 'Beginner' },
    { level: 'A2', icon: TreePine, color: 'from-[#7BAF8E] to-[#A8D4AC]', name: 'Elementary' },
    { level: 'B1', icon: Waves,    color: 'from-[#5A7A9A] to-[#B0D4E8]', name: 'Intermediate' },
    { level: 'B2', icon: Moon,     color: 'from-[#8A7AAF] to-[#BDB0D9]', name: 'Upper Intermediate' },
  ];

  return (
    <div className="min-h-screen">
      {/* Announcement Banner — logged-in users only */}
      <AnimatePresence>
        {user && bannerVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-[#E6F1FB] border-b border-[#378ADD]/20" style={{ minHeight: '48px' }}>
              <p className="text-sm font-medium text-[#0C447C] flex-1 min-w-0 no-underline not-italic" style={{ textDecoration: 'none' }}>
                <span style={{ textDecoration: 'none' }}>✨</span> <span className="font-semibold">New: Sentence X-Ray</span> — paste any German sentence, see exactly why each word works.
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to="/analyze"
                  onClick={dismissBanner}
                  className="px-3 py-1.5 rounded-lg bg-[#378ADD] text-white text-xs font-semibold hover:bg-[#2d6db5] transition-colors whitespace-nowrap"
                >
                  Try it →
                </Link>
                <button
                  onClick={dismissBanner}
                  className="p-1 rounded-md text-[#378ADD] hover:bg-[#378ADD]/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SEO
        title="Learn German Online - Free Lessons A1 to B2"
        description="Master German with free interactive lessons. Grammar, vocabulary, listening exercises, and podcasts for English speakers. CEFR levels A1.1 to B2.2."
        path="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "DeutschMeister",
          "url": "https://deutsch-meister.de/",
          "description": "Free German language learning platform for English speakers",
          "inLanguage": ["de", "en"],
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://deutsch-meister.de/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />

        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [0, -90, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-8 w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 flex items-center justify-center shadow-2xl shadow-rose-500/25"
            >
              <span className="text-white font-display font-bold text-5xl">D</span>
            </motion.div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-800 mb-6">
              {t('landing.title')}
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              {t('landing.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={user ? '/dashboard' : '/level/a1.1'}
                className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold rounded-2xl shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 transition-all flex items-center gap-2"
              >
                {user ? t('landing.getStarted') : 'Start Learning Free'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  {t('landing.login')}
                </Link>
              )}
            </div>
          </motion.div>

          {/* Level Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 flex flex-wrap justify-center gap-4"
          >
            {levels.map((item, index) => (
              <motion.div
                key={item.level}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className={`relative px-6 py-4 rounded-2xl bg-gradient-to-r ${item.color} text-white shadow-lg`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-6 h-6" />
                  <div className="text-left">
                    <span className="text-lg font-bold">{item.level}</span>
                    <p className="text-white/80 text-sm">{item.name}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Sentence X-Ray Feature Section */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row items-center gap-12"
          >
            {/* Left: copy + CTA */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-4">
                <Scan size={13} />
                New Tool
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                Understand Any German Sentence Instantly
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Paste any sentence. See cases, roles, and why — in seconds.
              </p>

              {/* Value props */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 mb-8">
                {['Works with any sentence', 'Color-coded cases', 'Explains the WHY'].map((v) => (
                  <span key={v} className="flex items-center gap-1.5 text-sm text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
                    {v}
                  </span>
                ))}
              </div>

              <Link
                to="/analyze"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold rounded-2xl hover:from-violet-600 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-200 text-base"
              >
                <Scan size={18} />
                Try Sentence X-Ray
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Right: static visual preview */}
            <div className="flex-1 w-full max-w-md lg:max-w-none">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-5"
              >
                {/* Mock input */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                  <span className="flex-1 text-sm text-slate-600 font-medium">Der Mann gibt dem Kind einen Apfel.</span>
                  <Link
                    to="/analyze"
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-violet-600 hover:to-indigo-700 transition-all"
                  >
                    <Scan size={12} />
                    Analyze
                  </Link>
                </div>

                {/* Color-coded chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { text: 'Der Mann',    bg: 'bg-[#E6F1FB]', border: 'border-[#378ADD]', color: 'text-[#0C447C]', label: 'Nominative · Subject' },
                    { text: 'gibt',        bg: 'bg-slate-100',  border: 'border-slate-300',  color: 'text-slate-700', label: 'Verb' },
                    { text: 'dem Kind',    bg: 'bg-[#E1F5EE]', border: 'border-[#1D9E75]', color: 'text-[#085041]', label: 'Dative · Indirect Obj.' },
                    { text: 'einen Apfel', bg: 'bg-[#FAECE7]', border: 'border-[#D85A30]', color: 'text-[#712B13]', label: 'Accusative · Direct Obj.' },
                  ].map((chip) => (
                    <div key={chip.text} className="flex flex-col gap-1">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${chip.bg} ${chip.border} ${chip.color}`}>
                        {chip.text}
                      </span>
                      <span className="text-[10px] text-slate-400 px-1">{chip.label}</span>
                    </div>
                  ))}
                </div>

                {/* Mini insight box */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-600 mb-0.5">Key Insight</p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Cases tell German who does what — not word order. <span className="font-medium">"dem Kind"</span> is dative because it receives the apple indirectly.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trial Banner for logged-in trial users */}
      {user && inTrial && !isSubscribed && (
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <p className="text-slate-700 font-medium">
                  You have <span className="text-amber-600 font-bold">{trialDays} day{trialDays !== 1 ? 's' : ''}</span> left in your free trial
                </p>
              </div>
              <Link
                to="/pricing"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-200 text-sm"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-800 mb-4">
              {t('landing.features.title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold text-slate-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Level Test CTA */}
      <section className="py-16 bg-gradient-to-br from-[#e1f5ee] to-[#e6f1fb]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Not sure where to start?
            </h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Take our free German level test to find out your CEFR level and get personalized recommendations.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6">
              <span className="text-[#1D9E75] font-medium">✓ 40 questions</span>
              <span className="text-[#1D9E75] font-medium">✓ 15-20 minutes</span>
              <span className="text-[#1D9E75] font-medium">✓ Instant results</span>
            </div>
            <Link
              to="/level-test"
              className="inline-block px-8 py-4 bg-[#1D9E75] hover:bg-[#178a66] text-white text-lg font-semibold rounded-xl transition-colors shadow-md shadow-emerald-200"
            >
              Take the Level Test
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Speaking Practice CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Practice Speaking with AI</h3>
              <p className="text-slate-600">
                Have real-time German conversations with an AI teacher. Get feedback on pronunciation, grammar, and vocabulary at your level.
              </p>
            </div>
            <Link
              to="/speaking"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors flex-shrink-0"
            >
              Try Speaking
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Grammar Topics Section */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Start with the Most Important Topics
              </h2>
              <p className="text-slate-600">
                Free grammar lessons explained in English — rules, examples, and exercises.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {[
                { href: '/grammar/a1.1/nouns-gender',          level: 'A1.1', label: 'Nouns & Gender',            desc: 'der / die / das — why every noun has a gender' },
                { href: '/grammar/a1.2/accusative-intro',       level: 'A1.2', label: 'Accusative Case',           desc: 'When "der" becomes "den" and why it matters' },
                { href: '/grammar/a2.1/prepositions-dative',    level: 'A2.1', label: 'Dative Prepositions',       desc: 'mit, nach, seit, von, zu, bei, aus, gegenüber' },
                { href: '/grammar/b1.1/konjunktiv-ii-wurde',    level: 'B1.1', label: 'Konjunktiv II (würde)',     desc: 'Express wishes, hypotheticals, and polite requests' },
              ].map(({ href, level, label, desc }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all group"
                >
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-bold mt-0.5">
                    {level}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 group-hover:text-amber-700 transition-colors text-sm">
                      German {label} Explained
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
            <div className="text-center">
              <a
                href="/grammar"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
              >
                Browse all 64 grammar topics
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Start Learning?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join thousands of learners mastering German with DeutschMeister's structured approach.
            </p>
            <Link
              to={user ? '/dashboard' : '/level/a1.1'}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-rose-600 font-semibold rounded-2xl hover:bg-slate-50 transition-colors shadow-lg"
            >
              {user ? 'Go to Dashboard' : 'Start A1.1 Free'}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Learn on YouTube */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-200">
              <Youtube className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
              Learn on YouTube
            </h2>
            <p className="text-slate-600 text-lg mb-8 max-w-lg mx-auto">
              Watch our German lessons on YouTube — new videos every week covering grammar, vocabulary, and real conversations.
            </p>
            <a
              href="https://www.youtube.com/@deutschmeister_de"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
            >
              <Youtube className="w-5 h-5" />
              Subscribe on YouTube
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-display font-bold text-xl">D</span>
            </div>
            <span className="font-display font-semibold text-xl text-white">
              DeutschMeister
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4">
            <Link
              to="/intro"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Intro Video
            </Link>
            <span className="text-slate-600">·</span>
            <a
              href="https://www.youtube.com/@deutschmeister_de"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors text-sm"
            >
              <Youtube className="w-4 h-4" />
              YouTube
            </a>
            <span className="text-slate-600">·</span>
            <Link
              to="/grammar"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Grammar
            </Link>
            <span className="text-slate-600">·</span>
            <Link
              to="/video-library"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Videos
            </Link>
            <span className="text-slate-600">·</span>
            <Link
              to="/podcasts"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Podcasts
            </Link>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} DeutschMeister. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
