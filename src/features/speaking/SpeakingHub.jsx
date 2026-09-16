// The City Conversation Map hub — plan Task 4 (speaking-guided-city-map).
//
// The A1.1 speaking surface: twelve stations on one transit line, one current
// station, one primary action. Route states come from the pure routeModel;
// attempts come from the learner's own speaking_sessions rows; the balance is
// the server read-model. Access: 'owner' with the €39 course or an active
// subscription, otherwise 'preview' (stations 1–3 playable, 4–12 course-locked
// with the unlock treatment — routeModel owns that rule).
//
// URL entry (?level=A1.1&mission=N&return=…) goes through canOpenStation — a
// typed URL can never skip a locked station; ?return travels to the ticket.
// The visual identity (deep navy / cobalt / acid lime) is the approved scoped
// exception living under `.speaking-city` in src/index.css.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Play, Crown, MessageCircle, Mic } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase } from '../../utils/supabase';
import Button from '../../components/ui/Button.jsx';
import { buildA11Route, canOpenStation } from './routeModel.js';
import { A11_PRODUCT_KEY } from '../../lib/guidedCourseAccess.js';
import CityRouteMap from './CityRouteMap.jsx';
import SpeakingBalance from './SpeakingBalance.jsx';
import LiveSetup from './LiveSetup.jsx';
import LiveConversation from './LiveConversation.jsx';
import { fetchSpeakingBalance, startSpeakingSession, SpeakingApiError } from './speakingApi.js';
import { liveBetaEnabledClient } from './liveFlag.js';
import MissionPrep from './MissionPrep.jsx';
import GuidedMission from './GuidedMission.jsx';

const LEVEL = 'A1.1';

export default function SpeakingHub({ initialMissionOrder, returnTo, onExitToLegacy }) {
  const { user } = useAuth();
  const { hasProduct, hasActiveSubscription } = useSubscription();
  const access = hasProduct(A11_PRODUCT_KEY) || hasActiveSubscription() ? 'owner' : 'preview';

  const [missions, setMissions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ monthlySeconds: 0, permanentSeconds: 0, totalSeconds: 0 });
  const [includedAttempts, setIncludedAttempts] = useState([]);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [view, setView] = useState({ name: 'map' }); // map | prep | active | live-setup | live
  const [liveStarting, setLiveStarting] = useState(false);
  const [liveError, setLiveError] = useState(null);

  // Live Conversation is behind the beta flag (spec §11.3 stage 3): the
  // server refuses a credential when it is off, so the entry point stays
  // hidden rather than offering a door that 503s.
  const liveAvailable = liveBetaEnabledClient();

  const startLive = async ({ durationSeconds, scenarioId }) => {
    setLiveStarting(true);
    setLiveError(null);
    try {
      const session = await startSpeakingSession({
        level: 'A1.1', mode: 'live', durationSeconds, missionId: scenarioId || undefined,
      });
      setView({ name: 'live', session, durationSeconds, missionId: scenarioId || null });
    } catch (err) {
      setLiveError(err instanceof SpeakingApiError && err.code === 'INSUFFICIENT_ALLOWANCE'
        ? 'Not enough speaking time left for that length.'
        : 'The session could not be started. Nothing was charged.');
    } finally {
      setLiveStarting(false);
    }
  };
  const deepLinkRef = useRef(false);

  const loadRoute = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data: missionRows, error } = await supabase
      .from('speaking_missions')
      .select('id, mission_order, level, title_de, title_en, scenario_de, pass_criteria, hint_words, target_structures, is_free')
      .eq('level', LEVEL).eq('is_published', true)
      .order('mission_order', { ascending: true });
    if (error) {
      console.error('Failed to load missions:', error);
      setMissions([]);
    } else {
      setMissions((missionRows || []).map((m) => ({ ...m, order: m.mission_order })));
    }
    // The learner's own passed missions (RLS-scoped rows; counts, not words).
    const { data: passedRows, error: attemptsError } = await supabase
      .from('speaking_sessions')
      .select('mission_id, passed')
      .eq('user_id', user.id).eq('mode', 'mission').eq('passed', true);
    if (attemptsError) {
      console.error('Failed to load attempts:', attemptsError);
      setAttempts([]);
    } else {
      const orderById = new Map((missionRows || []).map((m) => [m.id, m.mission_order]));
      setAttempts((passedRows || [])
        .map((r) => ({ missionOrder: orderById.get(r.mission_id), passed: r.passed === true }))
        .filter((a) => Number.isFinite(a.missionOrder)));
    }
    setLoading(false);
  }, [user?.id]);

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const res = await fetchSpeakingBalance();
      if (res && Number.isFinite(res.totalSeconds)) {
        setBalance({
          monthlySeconds: res.monthlySeconds || 0,
          permanentSeconds: res.permanentSeconds || 0,
          totalSeconds: res.totalSeconds || 0,
        });
        setIncludedAttempts(Array.isArray(res.includedMissionAttempts) ? res.includedMissionAttempts : []);
      }
    } catch { /* display-only — the ledger still decides every charge */ }
    setBalanceLoading(false);
  }, []);

  useEffect(() => { loadRoute(); }, [loadRoute]);
  useEffect(() => { loadBalance(); }, [loadBalance]);

  const route = buildA11Route({ missions, attempts, access });
  const current = route.find((s) => s.state === 'current') || null;
  const allComplete = route.length > 0 && route.every((s) => s.state === 'complete');

  // ?mission=N entry — through the same gate the map buttons use.
  useEffect(() => {
    if (loading || deepLinkRef.current || !initialMissionOrder) return;
    deepLinkRef.current = true;
    if (canOpenStation({ missions, attempts, order: initialMissionOrder, access })) {
      const station = route.find((s) => s.order === Number(initialMissionOrder));
      if (station) setView({ name: 'prep', station });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, initialMissionOrder]);

  const openStation = (station) => {
    if (!canOpenStation({ missions, attempts, order: station.order, access })) return;
    setView({ name: 'prep', station });
  };

  const missionFinished = () => {
    setView({ name: 'map' });
    loadRoute();
    loadBalance();
  };

  const includedForStation = (station) =>
    !!station && includedAttempts.includes(`a11-m${station.order}`);

  // ---- shell ----
  return (
    <div className="speaking-city min-h-screen bg-[var(--city-night)] pt-16 text-[var(--city-mist)]">
      <a
        href="#city-current"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-50 focus:rounded-clay focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink"
      >
        Skip to your current mission
      </a>

      {view.name === 'prep' ? (
        <MissionPrep
          station={view.station}
          includedAttempt={includedForStation(view.station)}
          onBack={() => setView({ name: 'map' })}
          onStarted={(session) => setView({ name: 'active', station: view.station, session })}
        />
      ) : view.name === 'live-setup' ? (
        <LiveSetup
          balance={balance}
          scenarios={missions}
          starting={liveStarting}
          error={liveError}
          onStart={startLive}
          onBack={() => { setLiveError(null); setView({ name: 'map' }); }}
        />
      ) : view.name === 'live' ? (
        <LiveConversation
          sessionToken={view.session.sessionToken}
          missionId={view.missionId}
          missionTitle={missions.find((m) => m.id === view.missionId)?.title_de}
          durationSeconds={view.durationSeconds}
          onExit={() => { setView({ name: 'map' }); loadBalance(); loadRoute(); }}
          onFallbackToGuided={() => {
            // Same mission, guided mode — the task goal survives the drop.
            const station = route.find((st) => st.id === view.missionId);
            setView(station ? { name: 'prep', station } : { name: 'map' });
          }}
        />
      ) : view.name === 'active' ? (
        <GuidedMission
          station={view.station}
          session={view.session}
          returnTo={returnTo}
          onFinished={missionFinished}
        />
      ) : (
        <div className="mx-auto max-w-4xl px-4 pb-10">
          <header className="pt-4">
            <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">
              A1.1 · Guided speaking
            </p>
            <h1 className="mt-1 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.018em] sm:text-[2.125rem]">
              Your City Conversation Map
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-[var(--city-mist-dim)]">
              Twelve real-life stations, one route. Pass a station to unlock the next —
              completed stations stay open for replay.
            </p>
          </header>

          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-[var(--city-mist-dim)]" role="status">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading your route…
            </div>
          ) : (
            <div className="mt-6 md:grid md:grid-cols-[minmax(0,1fr)_18rem] md:items-start md:gap-8">
              {/* The map column — a vertical transit line on every width. */}
              <CityRouteMap stations={route} onOpen={openStation} />

              {/* The ticket column: current station, primary action, balance. */}
              <div className="mt-6 space-y-4 md:sticky md:top-20 md:mt-0">
                <section
                  id="city-current"
                  aria-labelledby="current-station-heading"
                  className="rounded-clay border border-[var(--city-hairline-strong)] bg-white/5 p-4"
                >
                  <h2 id="current-station-heading" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">
                    Current station
                  </h2>
                  {current ? (
                    <>
                      <p className="mt-2 text-base font-bold">
                        Station {current.order}: {current.title_en || current.title_de}
                      </p>
                      {current.scenario_de && (
                        <p className="mt-1.5 text-sm leading-relaxed text-[var(--city-mist-dim)]">{current.scenario_de}</p>
                      )}
                      {/* THE one primary action — the sticky bar carries it on mobile. */}
                      <Button size="lg" shimmer onClick={() => openStation(current)} className="mt-4 hidden w-full md:inline-flex">
                        <Play className="h-5 w-5" aria-hidden="true" /> Start mission
                      </Button>
                    </>
                  ) : allComplete ? (
                    <p className="mt-2 text-sm text-[var(--city-mist-dim)]">
                      All twelve stations complete — replay any station from the map.
                    </p>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-[var(--city-mist-dim)]">
                        The rest of the route comes with the A1.1 course — your first three
                        stations stay replayable.
                      </p>
                      <Button href="/courses/a1-1/" size="lg" className="mt-4 hidden w-full md:inline-flex">
                        <Crown className="h-5 w-5" aria-hidden="true" /> Unlock the full route
                      </Button>
                    </>
                  )}
                </section>

                <SpeakingBalance balance={balance} loading={balanceLoading} />

                {liveAvailable && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setView({ name: 'live-setup' })}
                    className="w-full"
                  >
                    <Mic className="h-4 w-4" aria-hidden="true" /> Live conversation (beta)
                  </Button>
                )}

                <button
                  type="button"
                  onClick={onExitToLegacy}
                  className="inline-flex items-center gap-1.5 rounded-clay px-2 py-1.5 text-sm text-[var(--city-mist-faint)] hover:text-[var(--city-mist)]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> Free conversation &amp; other levels
                </button>
              </div>

              {/* Sticky bottom action on mobile — sits above the app's bottom nav. */}
              <div className="sticky bottom-16 z-30 -mx-4 mt-4 border-t border-[var(--city-hairline)] bg-[var(--city-night-veil)] px-4 py-3 backdrop-blur md:hidden">
                {current ? (
                  <Button size="lg" shimmer onClick={() => openStation(current)} className="w-full">
                    <Play className="h-5 w-5" aria-hidden="true" /> Start mission
                  </Button>
                ) : allComplete ? (
                  <p className="text-center text-sm text-[var(--city-mist-dim)]">All stations complete — replay any station above.</p>
                ) : (
                  <Button href="/courses/a1-1/" size="lg" className="w-full">
                    <Crown className="h-5 w-5" aria-hidden="true" /> Unlock the full route
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
