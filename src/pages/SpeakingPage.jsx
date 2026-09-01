import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Mic, Crown, ArrowRight, Loader2, AlertTriangle, Monitor, Lock, Play,
  Wallet, MessageCircle, CheckCircle2, RotateCcw, Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase, getAuthHeaders } from '../utils/supabase';
import SEO from '../components/SEO';
import { seoProps } from '../data/seoRoutes.js';
import { TRIAL_SPEAKING_SESSIONS } from '../data/marketing.js';
import { getConfigForLevel } from '../constants/speakingPrompts';
import { checkSpeakingSupport } from '../components/speaking/mediaSupport';
import SpeakingSession from '../components/speaking/SpeakingSession';
import SpeakingEvaluationResults from '../components/SpeakingEvaluationResults';
import { LEVEL_ORDER } from '../config/levels';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import Tilt from '../components/ui/Tilt.jsx';

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

const FIELD_LABEL = 'block font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel mb-2';
const PRESS = 'transition-all duration-100 ease-snap active:translate-y-1 active:shadow-none';

function normalizePlacementLevel(raw) {
  if (!raw) return 'A1.1';
  const up = String(raw).toUpperCase().replace(/\s+/g, '');
  if (LEVEL_ORDER.includes(up)) return up;
  const coarse = (up.match(/^(A1|A2|B1|B2)/) || [])[1];
  return coarse ? `${coarse}.1` : 'A1.1';
}

// Next-level suggestion (re-enabled in renovation Phase 4b): when the
// evaluation recommends HÖHER, the results screen offers the next sublevel.
function nextSpeakingLevel(level) {
  const idx = LEVEL_ORDER.indexOf(String(level || '').toUpperCase());
  return idx >= 0 && idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null;
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
    <Card tone="aprikose" className="max-w-lg mx-auto mb-6 p-6 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-clay bg-white flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-accent-aprikose-ink" />
      </div>
      <h3 className="font-bold text-ink mb-2">
        {isInApp ? 'In-app browser detected' : 'Browser not supported'}
      </h3>
      <p className="text-sm text-graphite mb-4">
        {isInApp
          ? "Please open this page in Safari or Chrome. In-app browsers don't support the microphone."
          : "Your browser doesn't support the required audio features."}
      </p>
      {isInApp ? (
        <Button onClick={handleCopy}>
          Copy URL
        </Button>
      ) : (
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-clay bg-white border border-rule text-sm text-graphite">
          <Monitor className="w-4 h-4" /> Please use <strong>Chrome</strong>, <strong>Edge</strong> or <strong>Safari</strong>
        </div>
      )}
    </Card>
  );
}

// Pass = limette (success), miss = a calm siegel wash — never colour alone,
// the heading carries the verdict.
function MissionResultBanner({ passed }) {
  const isPassed = passed === true;
  return (
    <Card tone={isPassed ? 'limette' : 'wash'} className="max-w-lg mx-auto mb-6 p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-clay bg-white flex items-center justify-center flex-shrink-0">
        {isPassed ? <CheckCircle2 className="w-6 h-6 text-accent-limette-ink" /> : <RotateCcw className="w-6 h-6 text-siegel" />}
      </div>
      <div>
        <h3 className={`font-bold ${isPassed ? 'text-accent-limette-ink' : 'text-siegel-deep'}`}>
          {isPassed ? 'Mission complete!' : 'Almost there'}
        </h3>
        <p className="text-sm text-graphite">
          {isPassed ? 'You reached the mission goal. Keep it up!' : "You didn't quite reach the goal — give it another try."}
        </p>
      </div>
    </Card>
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
  // Not just a sign-in wall: this is the page an anonymous visitor (and the
  // crawler) actually gets, so it carries the real feature copy — mirrored into
  // scripts/prerender-spa-routes.mjs, keep the two in sync. Facts only, all of
  // them already true in this file (levels, durations, feedback dimensions);
  // the free-session count derives from marketing.js.
  if (!user) {
    return (
      <div className="min-h-screen bg-paper text-ink px-4 pt-24 pb-16 relative overflow-hidden">
        <Aurora />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="hero-line w-20 h-20 mx-auto mb-6 rounded-clay bg-siegel shadow-raise-siegel flex items-center justify-center" style={{ '--d': '0ms' }}>
            <Mic className="w-10 h-10 text-white" />
          </div>
          <SectionHeading
            level={1}
            size="page"
            align="center"
            title="German Speaking Practice"
            lead="Speak German out loud with an AI conversation partner that listens, answers at your level, and tells you afterwards what was right, what to fix, and what a native speaker would have said instead."
            className="mb-8"
          />
          <div className="grid sm:grid-cols-3 gap-4 text-left mb-8">
            <Reveal delay={0}>
              <Card className="p-5 h-full">
                <h2 className="font-semibold text-ink text-sm mb-1.5">Every level, A1 to B2</h2>
                <p className="text-sm text-graphite leading-relaxed">
                  The partner adapts its vocabulary and pace to your CEFR level — from
                  first sentences at A1.1 to open discussion at B2.2.
                </p>
              </Card>
            </Reveal>
            <Reveal delay={90}>
              <Card className="p-5 h-full">
                <h2 className="font-semibold text-ink text-sm mb-1.5">Missions or free talk</h2>
                <p className="text-sm text-graphite leading-relaxed">
                  Guided scenarios — ordering, appointments, small talk — or open
                  conversation. Sessions run 5, 10 or 15 minutes.
                </p>
              </Card>
            </Reveal>
            <Reveal delay={180}>
              <Card className="p-5 h-full">
                <h2 className="font-semibold text-ink text-sm mb-1.5">Feedback you can use</h2>
                <p className="text-sm text-graphite leading-relaxed">
                  After each session: grammar, vocabulary and pronunciation, with
                  concrete corrections — like a patient tutor with unlimited time.
                </p>
              </Card>
            </Reveal>
          </div>
          <Reveal delay={240} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button to="/signup" size="lg" shimmer>
              Sign up free <ArrowRight className="w-5 h-5" />
            </Button>
            <Button to="/login" size="lg" variant="secondary">
              Log in
            </Button>
          </Reveal>
          <p className="text-sm text-graphite mt-4">
            A free account includes {TRIAL_SPEAKING_SESSIONS} AI speaking sessions — no card needed.
          </p>
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
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center px-4 pt-20 pb-12">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-clay bg-accent-aprikose-wash flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-accent-aprikose-ink" />
          </div>
          <h2 className="font-display text-xl font-semibold text-ink mb-2">Evaluation failed</h2>
          <p className="text-sm text-graphite mb-6">{evaluation?.message || 'The evaluation could not be created.'}</p>
          <Button onClick={backToSetup} size="lg" className="w-full">
            Back to overview
          </Button>
        </Card>
      </div>
    );
  }

  // ---- results ----
  if (phase === 'results' && evaluation) {
    const isMissionResult = !!session?.mission;
    const resultLevel = session?.level || selectedLevel;
    const nextLevel = nextSpeakingLevel(resultLevel);
    return (
      <div className="min-h-screen bg-paper text-ink pt-20 pb-12 px-4">
        {isMissionResult && <MissionResultBanner passed={evaluation.passed} />}
        <SpeakingEvaluationResults
          level={resultLevel}
          evaluation={evaluation}
          onRetry={retrySession}
          onNextLevel={
            nextLevel
              ? () => {
                  setSelectedLevel(nextLevel);
                  backToSetup();
                }
              : undefined
          }
          onBack={backToSetup}
        />
      </div>
    );
  }

  // ---- setup screen ----
  const levelConfig = getConfigForLevel(selectedLevel);

  return (
    <div className="min-h-screen bg-paper text-ink pt-16">
      <SEO
        {...seoProps('/speaking')}
      />

      {/* Hero strip */}
      <div className="relative overflow-hidden">
        <Aurora />
        <div className="relative max-w-lg mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="hero-line" style={{ '--d': '0ms' }}>
              <Chip tone="label" className="mb-2">
                <Mic className="w-3 h-3" /> AI Speaking Practice
              </Chip>
              <h1 className="font-display text-[1.75rem] sm:text-[2.125rem] font-semibold leading-tight tracking-[-0.018em] text-ink">German Speaking Practice</h1>
            </div>
            <span className="hero-line inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-white border border-rule font-data text-[0.8125rem] font-bold text-ink shadow-raise" style={{ '--d': '120ms' }}>
              <Wallet className="w-4 h-4 text-siegel" />
              {metaLoading ? '…' : euros(walletCents)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-4 pb-6 sm:pb-10">
        {!browserSupport.supported && <BrowserUnsupportedBanner browserSupport={browserSupport} />}

        {/* Level */}
        <Reveal>
          <label className={FIELD_LABEL}>Level</label>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-1">
            {LEVEL_ORDER.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => { levelInitRef.current = true; setSelectedLevel(lvl); }}
                className={`flex-shrink-0 px-4 py-2 rounded-clay font-data text-sm font-bold ${PRESS} ${
                  lvl === selectedLevel
                    ? 'bg-siegel text-white shadow-raise-siegel'
                    : 'bg-white text-graphite border border-rule shadow-raise hover:border-siegel hover:text-siegel-deep'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          <p className="text-sm text-graphite mb-6">{LEVEL_NAMES_EN[selectedLevel] || levelConfig.name}</p>
        </Reveal>

        {/* Duration */}
        <Reveal delay={90}>
          <label className={FIELD_LABEL}>Duration</label>
          <div className="relative mb-6">
            <select
              value={selectedMinutes}
              onChange={(e) => setSelectedMinutes(Number(e.target.value))}
              className="w-full appearance-none rounded-clay border border-rule bg-white px-4 py-3.5 pr-10 text-ink font-medium focus:border-siegel"
            >
              {DURATIONS.map((m) => (
                <option key={m} value={m}>{durationLabel(m)}</option>
              ))}
            </select>
            <Clock className="w-4 h-4 text-graphite absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </Reveal>

        {/* Missions — clay cards the learner chooses from; the first mission of
            the level is the natural next one and gets the tilt. */}
        <Reveal delay={180}>
          <label className={FIELD_LABEL}>Mission (optional)</label>
          {missionsLoading ? (
            <div className="flex items-center gap-2 text-graphite text-sm py-3"><Loader2 className="w-4 h-4 animate-spin" /> Loading missions…</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Card
                as="button"
                type="button"
                interactive
                tone={selectedMissionId === null ? 'wash' : 'paper'}
                onClick={() => setSelectedMissionId(null)}
                className={`p-3.5 text-left ${selectedMissionId === null ? 'ring-2 ring-siegel ring-offset-2 ring-offset-paper' : ''}`}
              >
                <MessageCircle className={`w-4 h-4 mb-2 ${selectedMissionId === null ? 'text-siegel-deep' : 'text-graphite'}`} />
                <span className="block text-sm font-bold text-ink">Free Conversation</span>
              </Card>
              {missions.map((m, i) => {
                const locked = !m.is_free && !hasAccess;
                const selected = selectedMissionId === m.id;
                const card = (
                  <Card
                    as="button"
                    type="button"
                    interactive
                    tone={selected ? 'wash' : 'paper'}
                    onClick={() => setSelectedMissionId(selected ? null : m.id)}
                    className={`w-full h-full p-3.5 text-left ${selected ? 'ring-2 ring-siegel ring-offset-2 ring-offset-paper' : ''}`}
                  >
                    <span className="flex items-center justify-between gap-2 mb-2">
                      <span className={`font-data text-[0.6875rem] font-bold tracking-[0.13em] ${selected ? 'text-siegel-deep' : 'text-graphite'}`}>{m.mission_order}</span>
                      {m.is_free ? null : locked ? <Lock className="w-3.5 h-3.5 text-graphite" /> : null}
                    </span>
                    <span className="block text-sm font-bold text-ink leading-snug">{m.title_en || m.title_de}</span>
                  </Card>
                );
                return i === 0 ? <Tilt key={m.id}>{card}</Tilt> : <div key={m.id}>{card}</div>;
              })}
            </div>
          )}
        </Reveal>

        {/* Selected mission preview */}
        {activeMission && (
          <Card className="p-4 mb-5">
            <p className="text-sm text-graphite leading-relaxed">{activeMission.scenario_de}</p>
            {Array.isArray(activeMission.hint_words) && activeMission.hint_words.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {activeMission.hint_words.map((w, i) => (
                  <Chip key={i} tone="label" size="md">{w}</Chip>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Start error / notices */}
        {startError?.type === 'funds' && (
          <Card tone="wash" className="mb-4 p-3.5 text-sm text-siegel-deep text-center">
            Not enough credit — top-ups are coming soon.
          </Card>
        )}
        {startError?.type === 'error' && (
          <div className="mb-4 p-3.5 rounded-clay border border-accent-himbeer/30 bg-accent-himbeer-wash text-sm text-accent-himbeer-ink flex items-start justify-center gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{startError.message}</span>
          </div>
        )}
        {!canAfford && !startError && (
          <Card tone="wash" className="mb-4 p-3.5 text-sm text-siegel-deep text-center">
            Not enough credit — top-ups are coming soon.
          </Card>
        )}

        {/* Start / upgrade */}
        {missionLocked ? (
          <Button href="/pricing/" size="lg" className="w-full">
            <Crown className="w-5 h-5" /> Unlock with Pro
          </Button>
        ) : (
          <Button
            shimmer
            size="lg"
            onClick={handleStart}
            disabled={startDisabled}
            className="w-full"
          >
            {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {selectedCost > 0 ? `Start · ${euros(selectedCost)}` : 'Start'}
          </Button>
        )}
        <p className="text-center font-data text-[0.75rem] text-graphite mt-3">
          {activeMission ? 'Guided mission' : 'Free conversation'} · {selectedMinutes} minutes
        </p>
      </div>
    </div>
  );
};

export default SpeakingPage;
