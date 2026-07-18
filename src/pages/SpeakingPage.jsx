import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic, Crown, ArrowRight, Loader2, AlertTriangle, Monitor, Lock, Play,
  Wallet, MessageCircle, CheckCircle2, RotateCcw, Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase, getAuthHeaders } from '../utils/supabase';
import SEO from '../components/SEO';
import { getConfigForLevel } from '../constants/speakingPrompts';
import { checkSpeakingSupport } from '../components/speaking/mediaSupport';
import SpeakingSession from '../components/speaking/SpeakingSession';
import SpeakingEvaluationResults from '../components/SpeakingEvaluationResults';

const LEVEL_ORDER = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];
// English display names for the level picker (the German names in
// speakingPrompts.js are shared with the AI prompt config and stay unchanged).
const LEVEL_NAMES_EN = {
  'A1.1': 'Beginner 1', 'A1.2': 'Beginner 2',
  'A2.1': 'Elementary 1', 'A2.2': 'Elementary 2',
  'B1.1': 'Intermediate 1', 'B1.2': 'Intermediate 2',
  'B2.1': 'Upper Intermediate 1', 'B2.2': 'Upper Intermediate 2',
};
const DURATIONS = [5, 10, 15];
const PRICE_CENTS = { 5: 100, 10: 200, 15: 300 };
const SUB_FREE_5MIN_PER_DAY = 2;

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

function euros(cents) {
  if (!cents) return '€0';
  return cents % 100 === 0 ? `€${cents / 100}` : `€${(cents / 100).toFixed(2)}`;
}

function utcMidnightISO() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate())).toISOString();
}

function BrowserUnsupportedBanner({ browserSupport }) {
  const isInApp = browserSupport.reason === 'in_app_browser';
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); }
    catch { window.prompt('Copy URL:', window.location.href); }
  };
  return (
    <div className="max-w-lg mx-auto mb-6 bg-white rounded-2xl border border-amber-200 p-6 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-amber-500" />
      </div>
      <h3 className="font-bold text-slate-800 mb-2">
        {isInApp ? 'In-app browser detected' : 'Browser not supported'}
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        {isInApp
          ? "Please open this page in Safari or Chrome. In-app browsers don't support the microphone."
          : "Your browser doesn't support the required audio features."}
      </p>
      {isInApp ? (
        <button onClick={handleCopy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm transition-colors">
          Copy URL
        </button>
      ) : (
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
          <Monitor className="w-4 h-4" /> Please use <strong>Chrome</strong>, <strong>Edge</strong> or <strong>Safari</strong>
        </div>
      )}
    </div>
  );
}

function MissionResultBanner({ passed }) {
  const isPassed = passed === true;
  return (
    <div className={`max-w-lg mx-auto mb-6 rounded-2xl border p-5 flex items-center gap-4 ${isPassed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPassed ? 'bg-green-100' : 'bg-amber-100'}`}>
        {isPassed ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <RotateCcw className="w-6 h-6 text-amber-600" />}
      </div>
      <div>
        <h3 className={`font-bold ${isPassed ? 'text-green-700' : 'text-amber-700'}`}>
          {isPassed ? 'Mission complete!' : 'Almost there'}
        </h3>
        <p className={`text-sm ${isPassed ? 'text-green-600' : 'text-amber-600'}`}>
          {isPassed ? 'You reached the mission goal. Keep it up!' : "You didn't quite reach the goal — give it another try."}
        </p>
      </div>
    </div>
  );
}

const SpeakingPage = () => {
  const { user } = useAuth();
  const { profile, hasAccess, hasActiveSubscription, loading: subLoading } = useSubscription();

  const [phase, setPhase] = useState('setup'); // setup | session | results | eval_failed
  const [selectedLevel, setSelectedLevel] = useState('A1.1');
  const [selectedMinutes, setSelectedMinutes] = useState(5);
  const [selectedMissionId, setSelectedMissionId] = useState(null);

  const [missions, setMissions] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(true);

  const [walletCents, setWalletCents] = useState(0);
  const [freeFiveUsed, setFreeFiveUsed] = useState(0); // subscriber daily count
  const [usage, setUsage] = useState(null);            // non-subscriber trial state
  const [metaLoading, setMetaLoading] = useState(true);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null); // { type:'funds'|'error', ... }
  const [session, setSession] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  const levelInitRef = useRef(false);
  const browserSupport = useMemo(() => checkSpeakingSupport(), []);
  const subscriber = !subLoading && typeof hasActiveSubscription === 'function' && hasActiveSubscription();

  // Default the level to the user's placement level, once.
  useEffect(() => {
    if (levelInitRef.current || subLoading) return;
    levelInitRef.current = true;
    setSelectedLevel(normalizePlacementLevel(profile?.current_level));
  }, [subLoading, profile]);

  // Wallet balance + free-session allowance + trial usage (anon client / API).
  const loadMeta = useCallback(async () => {
    if (!user?.id) { setMetaLoading(false); return; }
    setMetaLoading(true);
    try {
      const [{ data: wallet }, { count }, usageRes] = await Promise.all([
        supabase.from('speaking_wallet').select('balance_cents').eq('user_id', user.id).maybeSingle(),
        supabase.from('speaking_sessions').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('planned_minutes', 5).eq('cost_cents', 0).neq('mode', 'placement')
          .gte('started_at', utcMidnightISO()),
        fetch('/api/speaking/check-speaking-usage', {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) }, body: '{}',
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      setWalletCents(wallet?.balance_cents ?? 0);
      setFreeFiveUsed(count || 0);
      setUsage(usageRes);
    } catch (err) {
      console.error('Failed to load speaking meta:', err);
    } finally {
      setMetaLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  // Missions for the selected level (public read via anon client).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setMissionsLoading(true);
      const { data, error } = await supabase
        .from('speaking_missions')
        .select('id, mission_order, level, title_de, title_en, scenario_de, pass_criteria, hint_words, target_structures, is_free')
        .eq('level', selectedLevel).eq('is_published', true)
        .order('mission_order', { ascending: true });
      if (cancelled) return;
      if (error) { console.error('Failed to load missions:', error); setMissions([]); }
      else setMissions(data || []);
      setSelectedMissionId(null); // reset selection when level changes
      setMissionsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [selectedLevel, user]);

  // ---- pricing / allowance ----
  const fiveMinFreeRemaining = subscriber
    ? Math.max(0, SUB_FREE_5MIN_PER_DAY - freeFiveUsed)
    : (usage && usage.allowed && Number.isFinite(usage.limit - usage.used) ? Math.max(0, usage.limit - usage.used) : (usage?.allowed ? 1 : 0));
  const fiveMinIsFree = subscriber ? fiveMinFreeRemaining > 0 : !!usage?.allowed;
  const costFor = (m) => (m === 5 ? (fiveMinIsFree ? 0 : PRICE_CENTS[5]) : PRICE_CENTS[m]);
  const selectedCost = costFor(selectedMinutes);

  let fiveMinLabel;
  if (subscriber) {
    fiveMinLabel = fiveMinIsFree ? `5 min · ${fiveMinFreeRemaining}/${SUB_FREE_5MIN_PER_DAY} free today` : '5 min — €1';
  } else if (usage?.unlimited) {
    fiveMinLabel = '5 min · free';
  } else {
    fiveMinLabel = fiveMinIsFree ? `5 min · ${fiveMinFreeRemaining} free left` : '5 min — €1';
  }
  const durationLabel = (m) => (m === 5 ? fiveMinLabel : `${m} min — ${euros(PRICE_CENTS[m])}`);

  const activeMission = missions.find((m) => m.id === selectedMissionId) || null;
  const missionLocked = !!activeMission && !activeMission.is_free && !hasAccess;
  const canAfford = selectedCost === 0 || walletCents >= selectedCost;
  const startDisabled = starting || metaLoading || missionLocked || !canAfford || !browserSupport.supported;

  // ---- start ----
  const handleStart = async () => {
    if (startDisabled) return;
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch('/api/speaking/speaking-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ action: 'start', level: selectedLevel, minutes: selectedMinutes, ...(selectedMissionId ? { missionId: selectedMissionId } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setStartError({ type: 'funds', balance: data.balance_cents ?? walletCents, cost: data.cost_cents ?? selectedCost });
        return;
      }
      if (!res.ok) {
        setStartError({ type: 'error', message: data.error || 'The session could not be started.' });
        return;
      }
      setSession({
        sessionToken: data.session_token,
        plannedMinutes: data.planned_minutes || selectedMinutes,
        level: data.level || selectedLevel,
        mission: activeMission,
        opening: { text: data.replyText, audioBase64: data.replyAudioBase64 },
      });
      setEvaluation(null);
      setPhase('session');
    } catch (err) {
      console.error('start error:', err);
      setStartError({ type: 'error', message: 'Network error — please try again.' });
    } finally {
      setStarting(false);
    }
  };

  const handleComplete = (result) => {
    if (result?.evaluation_failed) { setEvaluation(result); setPhase('eval_failed'); }
    else if (result) { setEvaluation(result); setPhase('results'); }
    else { setPhase('setup'); }
    loadMeta();
  };

  const backToSetup = () => { setSession(null); setEvaluation(null); setPhase('setup'); };
  const retrySession = () => { setEvaluation(null); setPhase('setup'); };

  // ---- guest gate ----
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 pt-20 pb-12">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-teal-200">
            <Mic className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">German Speaking Practice</h1>
          <p className="text-slate-500 mb-8">
            Sign in to practice speaking German with your AI conversation partner — with instant feedback.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold rounded-2xl shadow-lg shadow-rose-200 hover:shadow-xl transition-all">
              Sign up free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all">
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- session ----
  if (phase === 'session' && session) {
    return (
      <SpeakingSession
        level={session.level}
        mission={session.mission}
        sessionToken={session.sessionToken}
        plannedMinutes={session.plannedMinutes}
        opening={session.opening}
        onComplete={handleComplete}
        onCancel={backToSetup}
      />
    );
  }

  // ---- evaluation failed ----
  if (phase === 'eval_failed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 pt-20 pb-12">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Evaluation failed</h2>
          <p className="text-sm text-slate-500 mb-6">{evaluation?.message || 'The evaluation could not be created.'}</p>
          <button onClick={backToSetup} className="w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors">
            Back to overview
          </button>
        </div>
      </div>
    );
  }

  // ---- results ----
  if (phase === 'results' && evaluation) {
    const isMissionResult = !!session?.mission;
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12 px-4">
        {isMissionResult && <MissionResultBanner passed={evaluation.passed} />}
        <SpeakingEvaluationResults
          level={session?.level || selectedLevel}
          evaluation={evaluation}
          onRetry={retrySession}
          onNextLevel={undefined}
          onBack={backToSetup}
        />
      </div>
    );
  }

  // ---- setup screen ----
  const levelConfig = getConfigForLevel(selectedLevel);

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <SEO
        title="German Speaking Practice with an AI Partner | DeutschMeister"
        description="Practice speaking German with an AI conversation partner: guided missions or free conversation, with instant feedback. Levels A1 to B2."
        path="/speaking/"
      />

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header + wallet */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100/80 text-teal-700 text-[11px] font-semibold mb-2 tracking-wide uppercase">
              <Mic className="w-3 h-3" /> AI Speaking Practice
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">German Speaking Practice</h1>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm">
            <Wallet className="w-4 h-4 text-teal-500" />
            {metaLoading ? '…' : euros(walletCents)}
          </div>
        </div>

        {!browserSupport.supported && <BrowserUnsupportedBanner browserSupport={browserSupport} />}

        {/* Level */}
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Level</label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-1">
          {LEVEL_ORDER.map((lvl) => (
            <button
              key={lvl}
              onClick={() => { levelInitRef.current = true; setSelectedLevel(lvl); }}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                lvl === selectedLevel
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-600'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500 mb-6">{LEVEL_NAMES_EN[selectedLevel] || levelConfig.name}</p>

        {/* Duration */}
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Duration</label>
        <div className="relative mb-6">
          <select
            value={selectedMinutes}
            onChange={(e) => setSelectedMinutes(Number(e.target.value))}
            className="w-full appearance-none bg-white border border-slate-200 rounded-2xl px-4 py-3.5 pr-10 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
          >
            {DURATIONS.map((m) => (
              <option key={m} value={m}>{durationLabel(m)}</option>
            ))}
          </select>
          <Clock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Missions */}
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Mission (optional)</label>
        {missionsLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-3"><Loader2 className="w-4 h-4 animate-spin" /> Loading missions…</div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-2">
            <button
              onClick={() => setSelectedMissionId(null)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedMissionId === null ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" /> Free Conversation
            </button>
            {missions.map((m) => {
              const locked = !m.is_free && !hasAccess;
              const selected = selectedMissionId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMissionId(selected ? null : m.id)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selected ? 'bg-teal-500 text-white shadow-md shadow-teal-200' : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <span className={`text-[11px] font-bold ${selected ? 'text-teal-100' : 'text-slate-400'}`}>{m.mission_order}</span>
                  <span className="truncate max-w-[9rem]">{m.title_en || m.title_de}</span>
                  {m.is_free ? null : locked ? <Lock className="w-3 h-3" /> : null}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected mission preview */}
        {activeMission && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
            <p className="text-sm text-slate-600 leading-relaxed">{activeMission.scenario_de}</p>
            {Array.isArray(activeMission.hint_words) && activeMission.hint_words.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {activeMission.hint_words.map((w, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-medium">{w}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Start error / notices */}
        {startError?.type === 'funds' && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-700 text-center">
            Not enough credit — top-ups are coming soon.
          </div>
        )}
        {startError?.type === 'error' && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 text-center">
            {startError.message}
          </div>
        )}
        {!canAfford && !startError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-700 text-center">
            Not enough credit — top-ups are coming soon.
          </div>
        )}

        {/* Start / upgrade */}
        {missionLocked ? (
          <Link to="/pricing" className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl shadow-md shadow-amber-200 transition-all">
            <Crown className="w-5 h-5" /> Unlock with Pro
          </Link>
        ) : (
          <button
            onClick={handleStart}
            disabled={startDisabled}
            className="flex items-center justify-center gap-2 w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-teal-200 transition-all active:scale-[0.99]"
          >
            {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {selectedCost > 0 ? `Start · ${euros(selectedCost)}` : 'Start'}
          </button>
        )}
        <p className="text-center text-xs text-slate-400 mt-3">
          {activeMission ? 'Guided mission' : 'Free conversation'} · {selectedMinutes} minutes
        </p>
      </div>
    </div>
  );
};

export default SpeakingPage;
