import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Calendar, BookOpen, MessageSquare, Award, Globe, Trash2, AlertTriangle, Crown, ArrowRight, GraduationCap, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useProgress } from '../contexts/ProgressContext';
import { levels } from '../data/content';
import { EXAM_TRACKS } from '../data/examTracks';
import { supabase } from '../utils/supabase';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Stat from '../components/ui/Stat.jsx';

const FIELD = 'w-full rounded-clay border border-rule bg-white px-4 py-3 text-sm text-ink placeholder:text-graphite focus:border-siegel focus:outline-none';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isInFreeTrial, getTrialDaysRemaining, hasActiveSubscription, profile, refreshSubscription } = useSubscription();
  const { getTotalStats, getOverallProgress, getLevelProgress } = useProgress();

  // Exam goal settings (profiles.exam_track/exam_date/daily_goal_target —
  // client-writable preferences, renovation Phase 4a).
  const [savingGoal, setSavingGoal] = useState(false);
  const saveGoalField = async (fields) => {
    if (!user) return;
    setSavingGoal(true);
    const { error } = await supabase.from('profiles').update(fields).eq('id', user.id);
    if (error) console.error('goal save failed:', error.message);
    await refreshSubscription();
    setSavingGoal(false);
  };
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
      iconClasses: 'bg-siegel-wash text-siegel',
    },
    {
      icon: BookOpen,
      label: 'Reading lessons finished',
      value: stats.readingLessons,
      iconClasses: 'bg-accent-aprikose-wash text-accent-aprikose-ink',
    },
    {
      icon: MessageSquare,
      label: 'Listening exercises done',
      value: stats.listening,
      iconClasses: 'bg-accent-limette-wash text-accent-limette-ink',
    },
  ];

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const examTrackValue = profile?.exam_track || 'none';
  const dailyGoalValue = profile?.daily_goal_target || 3;

  return (
    <div className="min-h-screen bg-paper text-ink pt-20 pb-12">
      <SEO title="Your Profile" description="Manage your DeutschMeister profile and learning preferences." path="/profile" noindex />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <SectionHeading size="page" level={1} title={t('profile.title')} className="mb-8" />

        {/* User Info Card */}
        <Reveal delay={60} className="mb-8">
          <Card raised className="p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-pill bg-siegel flex items-center justify-center shadow-raise-siegel">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="font-display text-2xl font-semibold text-ink mb-1">
                  {user?.email}
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-graphite">
                  <Calendar className="w-4 h-4" />
                  <span>{t('profile.memberSince')}: {memberSince}</span>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Subscription Card */}
        <Reveal delay={120} className="mb-8">
          <Card raised edge={isSubscribed ? 'siegel' : 'paper'} className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-clay flex items-center justify-center ${
                  isSubscribed
                    ? 'bg-siegel text-white'
                    : 'bg-paper-sunk text-graphite'
                }`}>
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-ink">
                    {isSubscribed ? 'Active plan' : inTrial ? 'Free trial' : 'No plan'}
                  </h3>
                  <p className="text-sm text-graphite">
                    {isSubscribed
                      ? 'You have full access to everything.'
                      : inTrial
                        ? `${trialDays} days left in your free trial.`
                        : 'Upgrade for full access to everything.'}
                  </p>
                </div>
              </div>
              <Button href="/pricing/" variant={isSubscribed ? 'secondary' : 'primary'} shimmer={!isSubscribed}>
                {isSubscribed ? 'Manage plan' : 'Upgrade'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </Reveal>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <Reveal key={stat.label} delay={90 * i}>
              <Card raised className="p-6">
                <div className={`w-12 h-12 rounded-clay flex items-center justify-center mb-4 ${stat.iconClasses}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <Stat value={stat.value} label={stat.label} />
              </Card>
            </Reveal>
          ))}
        </div>

        {/* Level Progress */}
        <Reveal className="mb-8">
          <Card raised className="p-8">
            <h3 className="font-display text-xl font-semibold text-ink mb-6">Level Progress</h3>
            <div className="space-y-4">
              {levels.map((level) => {
                const progress = getLevelProgress(level);
                // One neutral row per level: the code in a data-face chip, the
                // fill on siegel. (Per-level gradients were a level-colour
                // system — tokens rule 1 says colour means case, nothing else.)
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-2">
                      <Chip tone="label">{level.toUpperCase()}</Chip>
                      <span className="font-data text-[0.8125rem] text-graphite">{progress}%</span>
                    </div>
                    <div className="h-3 bg-paper-sunk rounded-pill overflow-hidden">
                      <div
                        className="h-full bg-siegel rounded-pill transition-[width] duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall */}
            <div className="mt-6 pt-6 border-t border-rule">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-ink">{t('profile.totalProgress')}</span>
                <span className="font-data text-lg font-bold text-ink">{overallProgress}%</span>
              </div>
              <div className="h-4 bg-paper-sunk rounded-pill overflow-hidden">
                <div
                  className="h-full bg-siegel rounded-pill transition-[width] duration-1000 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Settings */}
        <Reveal>
          <Card raised className="p-8">
            <h3 className="font-display text-xl font-semibold text-ink mb-6">{t('profile.settings')}</h3>

            {/* Exam goal */}
            <div className="py-4 border-b border-rule">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-clay bg-siegel-wash flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-siegel" />
                </div>
                <span className="font-bold text-ink">Exam goal</span>
                {savingGoal && <span className="font-data text-xs text-graphite">Saving…</span>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs text-graphite mb-2">Which exam?</span>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Which exam?">
                    <Chip
                      raised
                      size="md"
                      tone={examTrackValue === 'none' ? 'label' : 'quiet'}
                      role="radio"
                      aria-checked={examTrackValue === 'none'}
                      onClick={() => saveGoalField({ exam_track: 'none' })}
                    >
                      Just learning — no exam
                    </Chip>
                    {EXAM_TRACKS.map((track) => (
                      <Chip
                        key={track.key}
                        raised
                        size="md"
                        tone={examTrackValue === track.key ? 'label' : 'quiet'}
                        role="radio"
                        aria-checked={examTrackValue === track.key}
                        onClick={() => saveGoalField({ exam_track: track.key })}
                      >
                        {track.nameDe}
                      </Chip>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="block text-xs text-graphite mb-2">Exam date (optional)</span>
                  <input
                    type="date"
                    value={profile?.exam_date || ''}
                    onChange={(e) => saveGoalField({ exam_date: e.target.value || null })}
                    className={FIELD}
                  />
                </label>
              </div>
            </div>

            {/* Daily goal */}
            <div className="py-4 border-b border-rule">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-clay bg-siegel-wash flex items-center justify-center">
                  <Target className="w-5 h-5 text-siegel" />
                </div>
                <span className="font-bold text-ink">Daily goal</span>
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Daily goal">
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <Chip
                    key={n}
                    raised
                    size="md"
                    tone={dailyGoalValue === n ? 'label' : 'quiet'}
                    role="radio"
                    aria-checked={dailyGoalValue === n}
                    onClick={() => saveGoalField({ daily_goal_target: Number(n) })}
                  >
                    {n} activit{n === 1 ? 'y' : 'ies'} a day
                  </Chip>
                ))}
              </div>
            </div>

            {/* Language Setting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-rule">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-clay bg-siegel-wash flex items-center justify-center">
                  <Globe className="w-5 h-5 text-siegel" />
                </div>
                <span className="font-bold text-ink">{t('profile.language')}</span>
              </div>
              <div className="flex gap-2">
                <Chip
                  raised
                  size="md"
                  tone={i18n.language === 'en' ? 'label' : 'quiet'}
                  aria-pressed={i18n.language === 'en'}
                  onClick={() => changeLanguage('en')}
                >
                  English
                </Chip>
                <Chip
                  raised
                  size="md"
                  tone={i18n.language === 'de' ? 'label' : 'quiet'}
                  aria-pressed={i18n.language === 'de'}
                  onClick={() => changeLanguage('de')}
                >
                  Deutsch
                </Chip>
              </div>
            </div>

            {/* Delete Account */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-3 font-bold text-accent-himbeer-ink transition-colors hover:opacity-80"
              >
                <Trash2 className="w-5 h-5" />
                <span>{t('profile.deleteAccount')}</span>
              </button>
            </div>
          </Card>
        </Reveal>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4">
            <Card raised className="animate-pop-in p-8 max-w-md w-full shadow-overlay">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-pill bg-accent-himbeer-wash flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-accent-himbeer-ink" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-ink">Delete Account?</h3>
                  <p className="text-graphite text-sm">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-graphite mb-6">
                All your progress and data will be permanently deleted. Are you sure you want to continue?
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
                  {t('common.cancel')}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    // Handle account deletion
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-clay border border-accent-himbeer-ink bg-accent-himbeer-wash px-5 py-2.5 text-sm font-bold text-accent-himbeer-ink shadow-raise-himbeer transition-all duration-100 ease-snap active:translate-y-1 active:shadow-none"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
