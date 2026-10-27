import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Calendar, BookOpen, MessageSquare, Award, Globe, Trash2, AlertTriangle, Crown, ArrowRight, GraduationCap, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useProgress } from '../contexts/ProgressContext';
import { levels } from '../data/content';
import { EXAM_TRACKS } from '../data/examTracks';
import { supabase, getAuthHeaders } from '../utils/supabase';
import { resetAnalytics } from '../lib/analytics';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import SupportRequestForm from '../components/SupportRequestForm.jsx';
import Chip from '../components/ui/Chip.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Stat from '../components/ui/Stat.jsx';
import { profilePlanAction } from '../lib/billingPortal.js';

const FIELD = 'w-full rounded-clay border border-rule bg-white px-4 py-3 text-sm text-ink placeholder:text-graphite focus:border-siegel focus:outline-none';

/** A local date as YYYY-MM-DD — the form a date input reads and writes (as in ExamDatePlan). */
const dateInput = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const EXAM_DATE_YEARS_AHEAD = 5;

// What a typed exam date may save: null clears it, a date from today to five
// years ahead is kept, anything else (undefined) is not saved. A date input
// reports each keystroke of the year as a valid value ('0002-05-12', then
// '0020-05-12'), and every one of them used to be written to profiles.exam_date,
// which feeds the dashboard countdown and the course plan.
const examDateToSave = (value, now = new Date()) => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const day = new Date(`${value}T12:00:00`);
  if (Number.isNaN(day.getTime()) || dateInput(day) !== value) return undefined; // e.g. 2026-02-31
  const latest = new Date(now);
  latest.setFullYear(latest.getFullYear() + EXAM_DATE_YEARS_AHEAD);
  return value >= dateInput(now) && value <= dateInput(latest) ? value : undefined;
};

// Keyboard focus may only move between the controls of an open dialog.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isInFreeTrial, getTrialDaysRemaining, hasActiveSubscription, subscription, profile, refreshSubscription } = useSubscription();
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
  // The exam date is typed into a draft and saved once — on blur or Enter —
  // and only when it is a real date (examDateToSave), never per keystroke.
  const [examDateDraft, setExamDateDraft] = useState(null);
  const examDateValue = examDateDraft ?? (profile?.exam_date || '');
  // Only what the learner is typing is judged: a saved date that has since
  // passed shows as it is.
  const examDateValid = examDateDraft === null || examDateToSave(examDateDraft) !== undefined;
  const saveExamDate = () => {
    if (examDateDraft === null) return;
    const value = examDateToSave(examDateDraft);
    if (value === undefined) return; // keep the draft; the field says why
    setExamDateDraft(null);
    if (value !== (profile?.exam_date || null)) saveGoalField({ exam_date: value });
  };
  const isSubscribed = user ? hasActiveSubscription() : false;
  const inTrial = user ? isInFreeTrial() : false;
  const trialDays = user ? getTrialDaysRemaining() : 0;
  // A Lemon Squeezy subscriber manages billing in the portal; /pricing/ cannot.
  // Comped and course rows get a support line instead: the portal has nothing
  // of theirs (lib/billingPortal.js, tests/profile-plan-button.test.mjs).
  const plan = profilePlanAction(isSubscribed, subscription);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const deletionPending = useRef(false);
  // The exact address, or the same address in another case: 'Anna@Gmail.com'
  // confirms anna@gmail.com (Delete used to stay disabled with no hint).
  const emailMatches = !!user?.email
    && (deleteEmail.trim() === user.email || deleteEmail.trim().toLowerCase() === user.email.trim().toLowerCase());

  // The confirmation is a modal dialog (the SessionTimeoutModal pattern): focus
  // moves into it, Tab stays inside, Escape cancels, and focus returns to the
  // button that opened it. It was a plain overlay: assistive tech never heard
  // of the irreversible step and keyboard focus stayed on the page behind it.
  const deleteTriggerRef = useRef(null);
  const deleteDialogRef = useRef(null);
  const deleteInputRef = useRef(null);
  useEffect(() => {
    if (!showDeleteConfirm) return undefined;
    const trigger = deleteTriggerRef.current;
    deleteInputRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!deletionPending.current) setShowDeleteConfirm(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = [...(deleteDialogRef.current?.querySelectorAll(FOCUSABLE) || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const inside = deleteDialogRef.current.contains(document.activeElement);
      if (!inside || (e.shiftKey && document.activeElement === first)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, [showDeleteConfirm]);

  const deleteAccount = async () => {
    if (!emailMatches || deletionPending.current) return;
    deletionPending.current = true;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (!accountDeleted) {
        const res = await fetch('/.netlify/functions/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
          body: '{}',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.deleted) throw new Error(data.error || 'Account deletion failed. Please try again.');
        setAccountDeleted(true);
        resetAnalytics();
      }
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw new Error('Your account was deleted, but sign-out failed. Please try again to finish signing out.');
      window.location.assign('/');
    } catch (error) {
      setDeleteError(error.message || 'Account deletion failed. Please try again.');
    } finally {
      deletionPending.current = false;
      setDeleting(false);
    }
  };

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
                  {plan.kind === 'support' ? (
                    <p className="mt-1 text-xs text-graphite">
                      {plan.hint}{' '}
                      <Link to={plan.href} className="font-bold text-siegel hover:text-siegel-deep">{plan.label}</Link>
                    </p>
                  ) : (
                    plan.hint && <p className="mt-1 text-xs text-graphite">{plan.hint}</p>
                  )}
                </div>
              </div>
              {plan.kind !== 'support' && (
                <Button href={plan.href} variant={isSubscribed ? 'secondary' : 'primary'} shimmer={!isSubscribed}>
                  {plan.label}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
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
                    min={dateInput(new Date())}
                    value={examDateValue}
                    onChange={(e) => setExamDateDraft(e.target.value)}
                    onBlur={saveExamDate}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveExamDate(); }}
                    aria-invalid={!examDateValid}
                    aria-describedby={examDateValid ? undefined : 'profile-exam-date-hint'}
                    className={FIELD}
                  />
                  {!examDateValid && (
                    <span id="profile-exam-date-hint" role="alert" className="mt-2 block text-xs text-accent-himbeer-ink">
                      Choose a date from today up to {EXAM_DATE_YEARS_AHEAD} years ahead.
                    </span>
                  )}
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
                ref={deleteTriggerRef}
                type="button"
                onClick={() => { setDeleteEmail(''); setDeleteError(null); setShowDeleteConfirm(true); }}
                className="flex items-center gap-3 font-bold text-accent-himbeer-ink transition-colors hover:opacity-80"
              >
                <Trash2 className="w-5 h-5" />
                <span>{t('profile.deleteAccount')}</span>
              </button>
            </div>
          </Card>
        </Reveal>

        {/* Support — opens a ticket in the admin panel's support centre */}
        <Reveal>
          <Card raised className="p-8">
            <h3 className="font-display text-xl font-semibold text-ink mb-2">Support</h3>
            <p className="text-sm text-graphite mb-4">Frage, Fehler oder Problem mit der Zahlung? Schreiben Sie uns — die Antwort kommt per E-Mail.</p>
            <SupportRequestForm />
          </Card>
        </Reveal>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div ref={deleteDialogRef} className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4">
            <Card
              raised
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              aria-describedby="delete-account-desc"
              className="animate-pop-in p-8 max-w-md w-full shadow-overlay"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-pill bg-accent-himbeer-wash flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-accent-himbeer-ink" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="delete-account-title" className="font-display font-semibold text-ink">Delete Account?</h3>
                  <p className="text-graphite text-sm">This action cannot be undone.</p>
                </div>
              </div>
              <p id="delete-account-desc" className="text-graphite mb-4">
                Your account and linked learning progress will be permanently deleted. Support correspondence and payment records may be retained. Deleting your account does not cancel a paid subscription; manage it above first.
              </p>
              <label className="block mb-4">
                <span className="block text-sm text-graphite mb-2">Type your account email ({user?.email}) to confirm.</span>
                <input ref={deleteInputRef} type="email" value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} disabled={deleting} autoComplete="off" className={FIELD} />
              </label>
              {deleteError && <p role="alert" className="text-sm text-accent-himbeer-ink mb-4">{deleteError}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" disabled={deleting} onClick={() => setShowDeleteConfirm(false)}>
                  {t('common.cancel')}
                </Button>
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={!emailMatches || deleting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-clay border border-accent-himbeer-ink bg-accent-himbeer-wash px-5 py-2.5 text-sm font-bold text-accent-himbeer-ink shadow-raise-himbeer transition-all duration-100 ease-snap active:translate-y-1 active:shadow-none"
                >
                  <Trash2 className="w-4 h-4" /> {deleting ? 'Please wait…' : accountDeleted ? 'Finish signing out' : 'Delete'}
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
