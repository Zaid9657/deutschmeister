import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, MessageSquare, Award, Crown, Clock, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';
import LevelCard from '../components/LevelCard';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { mainLevels, getSubLevels } from '../data/content';
import SEO from '../components/SEO';

const mainLevelInfo = {
  A1: { name: 'Sunrise Warmth', icon: '🌅', color: 'from-amber-400 to-orange-400' },
  A2: { name: 'Forest Calm', icon: '🌿', color: 'from-emerald-400 to-teal-400' },
  B1: { name: 'Ocean Depth', icon: '🌊', color: 'from-blue-400 to-indigo-400' },
  B2: { name: 'Twilight Elegance', icon: '🌙', color: 'from-purple-400 to-pink-400' },
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isInFreeTrial, getTrialDaysRemaining, hasActiveSubscription } = useSubscription();
  const { getOverallProgress, getTotalStats } = useProgress();
  const inTrial = user ? isInFreeTrial() : false;
  const isSubscribed = user ? hasActiveSubscription() : false;
  const trialDays = user ? getTrialDaysRemaining() : 0;

  const overallProgress = getOverallProgress();
  const stats = getTotalStats();

  const statCards = [
    {
      icon: BookOpen,
      label: t('profile.wordsLearned'),
      value: stats.vocabulary,
      gradient: 'from-amber-400 to-orange-500',
    },
    {
      icon: MessageSquare,
      label: t('profile.sentencesLearned'),
      value: stats.sentences,
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      icon: Award,
      label: t('profile.grammarLearned'),
      value: stats.grammar,
      gradient: 'from-blue-400 to-indigo-500',
    },
    {
      icon: TrendingUp,
      label: t('profile.totalProgress'),
      value: `${overallProgress}%`,
      gradient: 'from-purple-400 to-pink-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12">
      <SEO
        title="Dashboard - Your German Learning Progress"
        description="Track your German learning progress across all CEFR levels. Vocabulary, grammar, listening, and reading progress at a glance."
        path="/dashboard"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-800 mb-3">
            {t('dashboard.title')}
          </h1>
          <p className="text-xl text-slate-600">
            {t('dashboard.subtitle')}
          </p>
        </motion.div>

        {/* Trial Status Banner */}
        {inTrial && !isSubscribed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {trialDays} day{trialDays !== 1 ? 's' : ''} left in your free trial
                  </p>
                  <p className="text-sm text-slate-500">Upgrade to keep learning without limits</p>
                </div>
              </div>
              <Link
                to="/pricing"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-200 whitespace-nowrap"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.gradient} flex items-center justify-center mb-4`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Speaking Practice Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <Link
            to="/speaking"
            className="block bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:border-teal-200 hover:shadow-xl transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Mic className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-slate-800 mb-0.5">Sprechen üben</h3>
                <p className="text-sm text-slate-500">Übe Konversation mit einem KI-Gesprächspartner</p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Overall Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Overall Progress</h2>
            <span className="text-2xl font-bold text-slate-800">{overallProgress}%</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 rounded-full"
            />
          </div>
        </motion.div>

        {/* Level Cards Grouped by Main Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-display text-2xl font-bold text-slate-800 mb-6">
            Your Levels
          </h2>

          <div className="space-y-8">
            {mainLevels.map((mainLevel, groupIndex) => {
              const info = mainLevelInfo[mainLevel];
              const subLevels = getSubLevels(mainLevel);

              return (
                <motion.div
                  key={mainLevel}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + groupIndex * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
                >
                  {/* Main Level Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${info.color} flex items-center justify-center`}>
                      <span className="text-2xl">{info.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-slate-800">
                        {mainLevel} - {info.name}
                      </h3>
                      <p className="text-sm text-slate-500">2 sub-levels</p>
                    </div>
                  </div>

                  {/* Sub-Level Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subLevels.map((level, index) => (
                      <motion.div
                        key={level}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + groupIndex * 0.1 + index * 0.05 }}
                      >
                        <LevelCard level={level} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
