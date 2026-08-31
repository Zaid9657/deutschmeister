import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User, Calendar, BookOpen, MessageSquare, Award, Globe, Trash2, AlertTriangle, Crown, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useProgress } from '../contexts/ProgressContext';
import { levels } from '../data/content';
import SEO from '../components/SEO';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isInFreeTrial, getTrialDaysRemaining, hasActiveSubscription } = useSubscription();
  const { getTotalStats, getOverallProgress, getLevelProgress } = useProgress();
  const isSubscribed = user ? hasActiveSubscription() : false;
  const inTrial = user ? isInFreeTrial() : false;
  const trialDays = user ? getTrialDaysRemaining() : 0;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const stats = getTotalStats();
  const overallProgress = getOverallProgress();

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  // Persisted completions only (see ProgressContext) — the old
  // words/sentences counters read arrays that were never written to the
  // database for logged-in users, so every card was a permanent 0.
  const statCards = [
    {
      icon: Award,
      label: 'Grammar topics completed',
      value: stats.grammarTopics,
      iconClasses: 'bg-teal-50 text-teal-700',
    },
    {
      icon: BookOpen,
      label: 'Reading lessons finished',
      value: stats.readingLessons,
      iconClasses: 'bg-amber-50 text-amber-700',
    },
    {
      icon: MessageSquare,
      label: 'Listening exercises done',
      value: stats.listening,
      iconClasses: 'bg-sky-50 text-sky-700',
    },
  ];

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12">
      <SEO title="Your Profile" description="Manage your DeutschMeister profile and learning preferences." path="/profile" noindex />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl font-bold text-slate-800 mb-2">
            {t('profile.title')}
          </h1>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-siegel flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                {user?.email}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>{t('profile.memberSince')}: {memberSince}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subscription Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isSubscribed
                  ? 'bg-siegel'
                  : 'bg-slate-100'
              }`}>
                <Crown className={`w-6 h-6 ${isSubscribed ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">
                  {isSubscribed ? 'Active plan' : inTrial ? 'Free trial' : 'No plan'}
                </h3>
                <p className="text-sm text-slate-500">
                  {isSubscribed
                    ? 'You have full access to everything.'
                    : inTrial
                      ? `${trialDays} days left in your free trial.`
                      : 'Upgrade for full access to everything.'}
                </p>
              </div>
            </div>
            <a
              href="/pricing/"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isSubscribed
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-siegel text-white hover:bg-siegel-lift active:bg-siegel-deep'
              }`}
            >
              {isSubscribed ? 'Manage plan' : 'Upgrade'}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.iconClasses}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-8"
        >
          <h3 className="font-semibold text-slate-800 mb-6">Level Progress</h3>
          <div className="space-y-4">
            {levels.map((level) => {
              const progress = getLevelProgress(level);
              // The config's level colours are keyed 'a1-1'…'b2-2' (see
              // tailwind.config.js); the old map indexed with 'a1.1' AND named
              // tokens that don't exist, so every bar rendered
              // `bg-gradient-to-r undefined`. Full literal strings so the
              // Tailwind JIT scanner emits them.
              const gradients = {
                'a1.1': 'from-a1-1-primary to-a1-1-secondary',
                'a1.2': 'from-a1-2-primary to-a1-2-secondary',
                'a2.1': 'from-a2-1-primary to-a2-1-secondary',
                'a2.2': 'from-a2-2-primary to-a2-2-secondary',
                'b1.1': 'from-b1-1-primary to-b1-1-secondary',
                'b1.2': 'from-b1-2-primary to-b1-2-secondary',
                'b2.1': 'from-b2-1-primary to-b2-1-secondary',
                'b2.2': 'from-b2-2-primary to-b2-2-secondary',
              };
              const gradient = gradients[level] || 'from-siegel to-siegel';
              return (
                <div key={level}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700">{level.toUpperCase()}</span>
                    <span className="text-slate-500">{progress}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800">{t('profile.totalProgress')}</span>
              <span className="text-lg font-bold text-slate-800">{overallProgress}%</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-siegel rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8"
        >
          <h3 className="font-semibold text-slate-800 mb-6">{t('profile.settings')}</h3>

          {/* Language Setting */}
          <div className="flex items-center justify-between py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-slate-600" />
              </div>
              <span className="font-medium text-slate-700">{t('profile.language')}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  i18n.language === 'en'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('de')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  i18n.language === 'de'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Deutsch
              </button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="pt-4">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-3 text-red-600 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">{t('profile.deleteAccount')}</span>
            </button>
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Delete Account?</h3>
                  <p className="text-slate-500 text-sm">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-slate-600 mb-6">
                All your progress and data will be permanently deleted. Are you sure you want to continue?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => {
                    // Handle account deletion
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
