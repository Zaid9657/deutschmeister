import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic, Clock, ChevronRight, ChevronLeft, Crown, ArrowRight, Loader2,
  AlertTriangle, Monitor, Lock, Play, MessageCircle, Sparkles, Target,
  CheckCircle2, RotateCcw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase, getAuthHeaders } from '../utils/supabase';
import SEO from '../components/SEO';
import { getConfigForLevel } from '../constants/speakingPrompts';
import SpeakingPractice, { checkSpeakingSupport } from '../components/SpeakingPractice';
import SpeakingEvaluationResults from '../components/SpeakingEvaluationResults';
import SpeakingUsageIndicator from '../components/SpeakingUsageIndicator';

const LEVEL_ORDER = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];

// Map a stored placement value (e.g. 'a1', 'A2.1') onto a concrete sublevel we
// can select. Falls back to A1.1 when nothing usable is stored.
function normalizePlacementLevel(raw) {
  if (!raw) return 'A1.1';
  const up = String(raw).toUpperCase().replace(/\s+/g, '');
  if (LEVEL_ORDER.includes(up)) return up;
  const coarse = (up.match(/^(A1|A2|B1|B2)/) || [])[1];
  return coarse ? `${coarse}.1` : 'A1.1';
}

function getNextLevel(current) {
  const idx = LEVEL_ORDER.indexOf(current);
  if (idx === -1 || idx >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1];
}

function SoundWaveSVG() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-full opacity-60" aria-hidden="true">
      <path d="M20 60 Q30 20 40 60 Q50 100 60 60 Q70 20 80 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-300" />
      <path d="M60 60 Q70 30 80 60 Q90 90 100 60 Q110 30 120 60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-teal-400" />
      <path d="M100 60 Q110 15 120 60 Q130 105 140 60 Q150 15 160 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-300" />
      <path d="M140 60 Q150 35 160 60 Q170 85 180 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-teal-200" />
    </svg>
  );
}

function UsageGate({ usage }) {
  if (!usage || usage.allowed) return null;
  const { reason, used, limit } = usage;

  const configs = {
    subscription_required: {
      icon: Crown, iconBg: 'from-amber-400 to-orange-500',
      // EN: Your trial is over — but your progress isn't
      title: 'Deine Testphase ist vorbei — aber dein Fortschritt nicht',
      body: 'Mit Pro bekommst du 30 KI-Gespräche pro Monat und machst da weiter, wo du aufgehört hast.',
      cta: 'Weiter lernen mit Pro',
    },
    monthly_limit_reached: {
      icon: Mic, iconBg: 'from-yellow-400 to-orange-500',
      // EN: You're learning faster than expected
      title: 'Du lernst schneller als erwartet',
      body: `Du hast alle ${used}/${limit} Gespräche diesen Monat genutzt. Upgrade für mehr Übungszeit.`,
      cta: 'Mehr Gespräche freischalten',
    },
    trial_limit_reached: {
      icon: Mic, iconBg: 'from-blue-400 to-indigo-500',
      // EN: Your first impression of AI speaking practice
      title: 'Dein erster Eindruck von KI-Sprechübungen',
      body: `Du hast deine ${limit} kostenlosen Sitzungen genutzt. Mit Pro übst du 30 Mal pro Monat.`,
      cta: 'Mit Pro weitermachen',
    },
  };
  const c = configs[reason];
  if (!c) return null;
  const Icon = c.icon;

  return (
    <div className="max-w-md mx-auto mb-8 bg-white rounded-2xl border border-slate-200 p-6 text-center">
      <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="font-bold text-slate-800 mb-2">{c.title}</h3>
      <p className="text-sm text-slate-500 mb-4">{c.body}</p>
      <Link
        to="/pricing"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-200 text-sm"
      >
        <Crown className="w-4 h-4" />
        {c.cta}
      </Link>
    </div>
  );
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
          : 'Dein Browser unterstützt die benötigten Audio-Funktionen nicht.'}
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

// Horizontal, scrollable level selector.
function LevelSelector({ levels, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
      {levels.map((level) => {
        const isActive = level === selected;
        return (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isActive
                ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-600'
            }`}
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}

function MissionCard({ mission, index, locked, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="group relative w-full text-left rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 hover:border-slate-300 active:scale-[0.99]"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="p-5 flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
          locked ? 'bg-slate-100 text-slate-400' : 'bg-teal-50 text-teal-600'
        }`}>
          {mission.mission_order}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800 truncate group-hover:text-slate-900">
              {mission.title_de}
            </h3>
            {mission.is_free ? (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600">
                Frei
              </span>
            ) : locked ? (
              <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            ) : null}
          </div>
          <p className="text-xs text-slate-400 mb-1.5">{mission.title_en}</p>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
            {mission.scenario_de}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

// "Missions coming soon" state for levels without published missions.
function ComingSoon({ level, canStart, onStartFree }) {
  return (
    <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-slate-200 p-8">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
        <Sparkles className="w-7 h-7 text-white" />
      </div>
      <h3 className="font-bold text-slate-800 mb-2">Missionen kommen bald</h3>
      <p className="text-sm text-slate-500 mb-6">
        Für {level} sind noch keine Missionen verfügbar — aber du kannst jetzt ein freies Gespräch auf diesem Niveau führen.
      </p>
      <button
        onClick={onStartFree}
        disabled={!canStart}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-md shadow-teal-200 text-sm"
      >
        <MessageCircle className="w-4 h-4" />
        Freies Gespräch starten
      </button>
    </div>
  );
}

// Pre-session brief: scenario, goal, hint words, and Start (or upgrade CTA).
function MissionBrief({ mission, level, locked, onStart, onBack }) {
  const hintWords = Array.isArray(mission.hint_words) ? mission.hint_words : [];

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Zurück
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold">
                {level} · Mission {mission.mission_order}
              </span>
              {mission.is_free && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600">
                  Frei
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{mission.title_de}</h1>
            <p className="text-sm text-slate-400">{mission.title_en}</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Scenario */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Szenario
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">{mission.scenario_de}</p>
            </div>

            {/* Goal */}
            {mission.pass_criteria && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Ziel
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">{mission.pass_criteria}</p>
              </div>
            )}

            {/* Hint words */}
            {hintWords.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Hilfswörter
                </h2>
                <div className="flex flex-wrap gap-2">
                  {hintWords.map((word, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-medium"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 pt-2">
            {locked ? (
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 text-sm text-slate-500 mb-3">
                  <Lock className="w-4 h-4" />
                  Diese Mission ist Teil von Pro
                </div>
                <Link
                  to="/pricing"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-200"
                >
                  <Crown className="w-5 h-5" />
                  Mit Pro freischalten
                </Link>
              </div>
            ) : (
              <button
                onClick={onStart}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-colors shadow-md shadow-teal-200"
              >
                <Play className="w-5 h-5" />
                Mission starten
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionResultBanner({ passed }) {
  const isPassed = passed === true;
  return (
    <div className={`max-w-lg mx-auto mb-6 rounded-2xl border p-5 flex items-center gap-4 ${
      isPassed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
        isPassed ? 'bg-green-100' : 'bg-amber-100'
      }`}>
        {isPassed
          ? <CheckCircle2 className="w-6 h-6 text-green-600" />
          : <RotateCcw className="w-6 h-6 text-amber-600" />}
      </div>
      <div>
        <h3 className={`font-bold ${isPassed ? 'text-green-700' : 'text-amber-700'}`}>
          {isPassed ? 'Mission bestanden!' : 'Fast geschafft'}
        </h3>
        <p className={`text-sm ${isPassed ? 'text-green-600' : 'text-amber-600'}`}>
          {isPassed
            ? 'Du hast das Missionsziel erreicht. Weiter so!'
            : 'Du hast das Ziel noch nicht ganz erreicht — versuch es gleich nochmal.'}
        </p>
      </div>
    </div>
  );
}

const SpeakingPage = () => {
  const { user } = useAuth();
  const { profile, hasAccess, loading: subLoading } = useSubscription();

  const [phase, setPhase] = useState('select'); // select | brief | practice | results | eval_failed
  const [selectedLevel, setSelectedLevel] = useState('A1.1');
  const [missions, setMissions] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [missionsError, setMissionsError] = useState(false);
  const [activeMission, setActiveMission] = useState(null); // null = free conversation
  const [evaluation, setEvaluation] = useState(null);
  const [usage, setUsage] = useState(null);
  const [usageLoading, setUsageLoading] = useState(true);

  const levelInitRef = useRef(false);
  const browserSupport = useMemo(() => checkSpeakingSupport(), []);

  // Default the selector to the user's placement level, once, after the
  // subscription/profile data has loaded.
  useEffect(() => {
    if (levelInitRef.current || subLoading) return;
    levelInitRef.current = true;
    setSelectedLevel(normalizePlacementLevel(profile?.current_level));
  }, [subLoading, profile]);

  const fetchUsage = useCallback(async () => {
    if (!user?.id) { setUsageLoading(false); return; }
    try {
      const res = await fetch('/api/speaking/check-speaking-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({}),
      });
      if (res.ok) setUsage(await res.json());
    } catch (err) {
      console.error('Failed to check speaking usage:', err);
    } finally {
      setUsageLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  // Load published missions for the selected level (anon client; RLS exposes
  // only published rows).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setMissionsLoading(true);
      setMissionsError(false);
      const { data, error } = await supabase
        .from('speaking_missions')
        .select('id, mission_order, level, title_de, title_en, scenario_de, scenario_en, pass_criteria, hint_words, target_structures, is_free')
        .eq('level', selectedLevel)
        .eq('is_published', true)
        .order('mission_order', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error('Failed to load missions:', error);
        setMissionsError(true);
        setMissions([]);
      } else {
        setMissions(data || []);
      }
      setMissionsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [selectedLevel, user]);

  const handleSelectLevel = (level) => {
    levelInitRef.current = true;
    setSelectedLevel(level);
  };

  const handleOpenMission = (mission) => {
    setActiveMission(mission);
    setEvaluation(null);
    setPhase('brief');
  };

  const handleStartMission = () => {
    setEvaluation(null);
    setPhase('practice');
  };

  const handleStartFreeConversation = () => {
    if (usage && !usage.allowed) return;
    setActiveMission(null);
    setEvaluation(null);
    setPhase('practice');
  };

  const handleComplete = (result) => {
    if (result?.evaluation_failed) {
      setEvaluation(result);
      setPhase('eval_failed');
    } else if (result) {
      setEvaluation(result);
      setPhase('results');
    } else {
      setPhase('select');
    }
    fetchUsage();
  };

  const handleCancel = () => { setPhase('select'); };

  const handleRetry = () => {
    setEvaluation(null);
    setPhase('practice');
  };

  const handleBack = () => {
    setActiveMission(null);
    setEvaluation(null);
    setPhase('select');
  };

  const handleNextLevel = () => {
    const next = getNextLevel(selectedLevel);
    if (!next) return;
    levelInitRef.current = true;
    setSelectedLevel(next);
    setActiveMission(null);
    setEvaluation(null);
    setPhase('practice'); // free-conversation next-level flow
  };

  // ---- Guest gate: sign-in prompt ----
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 pt-20 pb-12">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-teal-200">
            <Mic className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">AI Speaking Practice</h1>
          <p className="text-lg text-slate-600 mb-2">
            Create your free account to try AI Speaking Practice.
          </p>
          <p className="text-slate-500 mb-8">
            Your first <strong className="text-teal-600">2 sessions are free</strong> — no credit card required. Practice real German conversations with an AI teacher and get instant feedback.
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
        </div>
      </div>
    );
  }

  // ---- Practice phase (mission or free conversation) ----
  if (phase === 'practice') {
    return (
      <SpeakingPractice
        level={selectedLevel}
        mission={activeMission}
        userId={user.id}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    );
  }

  // ---- Brief phase ----
  if (phase === 'brief' && activeMission) {
    const locked = !activeMission.is_free && !hasAccess;
    return (
      <MissionBrief
        mission={activeMission}
        level={selectedLevel}
        locked={locked}
        onStart={handleStartMission}
        onBack={handleBack}
      />
    );
  }

  // ---- Evaluation failed phase ----
  if (phase === 'eval_failed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 pt-20 pb-12">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Auswertung fehlgeschlagen</h2>
          <p className="text-sm text-slate-500 mb-6">
            {evaluation?.message || 'Auswertung konnte nicht erstellt werden, bitte versuche es erneut.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors shadow-md shadow-teal-200"
            >
              Nochmal üben
            </button>
            <button
              onClick={handleBack}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
            >
              Zurück zur Übersicht
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Results phase ----
  if (phase === 'results' && evaluation) {
    const isMissionResult = !!activeMission;
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12 px-4">
        {isMissionResult && <MissionResultBanner passed={evaluation.passed} />}
        <SpeakingEvaluationResults
          level={selectedLevel}
          evaluation={evaluation}
          onRetry={handleRetry}
          onNextLevel={!isMissionResult && getNextLevel(selectedLevel) ? handleNextLevel : undefined}
          onBack={handleBack}
        />
      </div>
    );
  }

  // ---- Select phase (level selector + mission list) ----
  const levelConfig = getConfigForLevel(selectedLevel);
  const freeBlocked = usage && !usage.allowed;

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <SEO
        title="AI German Speaking Practice | Conversation Missions | DeutschMeister"
        description="Practice speaking German with guided missions and free AI conversation. Get instant feedback on grammar, vocabulary, and fluency. A1 to B2."
        keywords="German speaking practice, AI German tutor, German conversation missions, speak German with AI"
        path="/speaking"
      />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-teal-500/10 via-teal-500/5 to-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 text-teal-700 text-xs font-semibold mb-4 tracking-wide uppercase">
                <Mic className="w-3.5 h-3.5" />
                KI-Sprachpraxis
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
                Sprechen üben
              </h1>
              <p className="text-base sm:text-lg text-slate-500 max-w-md leading-relaxed mb-4">
                Wähle dein Level und eine Mission — oder führe ein freies Gespräch mit deinem KI-Sprachpartner.
              </p>
              {usageLoading ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-400 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Laden…
                </div>
              ) : (
                <SpeakingUsageIndicator usage={usage} />
              )}
            </div>
            <div className="hidden sm:block w-44 h-24 flex-shrink-0 ml-8">
              <SoundWaveSVG />
            </div>
          </div>
        </div>
      </div>

      {!browserSupport.supported && <BrowserUnsupportedBanner browserSupport={browserSupport} />}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        {/* Level selector */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            Level
          </h2>
          <LevelSelector levels={LEVEL_ORDER} selected={selectedLevel} onSelect={handleSelectLevel} />
          <p className="text-sm text-slate-500 mt-2">{levelConfig.name} · ~{levelConfig.durationMinutes} Min</p>
        </div>

        {/* Free-conversation quota gate */}
        {browserSupport.supported && !usageLoading && <UsageGate usage={usage} />}

        {/* Mission list / coming soon */}
        <div className={!browserSupport.supported ? 'opacity-50 pointer-events-none' : ''}>
          {missionsLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : missionsError ? (
            <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-slate-200 p-8">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                Missionen konnten nicht geladen werden. Bitte lade die Seite neu.
              </p>
            </div>
          ) : missions.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Clock className="w-4 h-4" />
                {missions.length} {missions.length === 1 ? 'Mission' : 'Missionen'}
              </div>
              {missions.map((mission, index) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  index={index}
                  locked={!mission.is_free && !hasAccess}
                  onOpen={() => handleOpenMission(mission)}
                />
              ))}
            </div>
          ) : (
            <ComingSoon
              level={selectedLevel}
              canStart={!freeBlocked}
              onStartFree={handleStartFreeConversation}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingPage;
