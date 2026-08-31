import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Flame, Mic, ScanSearch, RotateCcw, Crown, Clock,
  ArrowRight, Check, Lock, Trophy, BookOpen, Sparkles,
  Headphones, FileText,
} from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getTopicsForLevel } from '../data/grammarTopics';
import { levels as ALL_LEVELS } from '../data/content';
import { deriveCurrent, isTopicCompleted, topicPercent } from '../services/currentPosition';
import { loadDashboardStats, DAILY_GOAL_TARGET } from '../services/dashboardStats';
import SEO from '../components/SEO';
import { font } from '../data/design-tokens';

const INK = '#0C2A33';
const fade = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: d, ease: [0.22, 1, 0.36, 1] },
});

// Map a sub-level (a2.1) to its main band (A2) and a friendly name.
const MAIN_BAND = { a1: 'A1', a2: 'A2', b1: 'B1', b2: 'B2' };
const BAND_NAME = { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper Int.' };
const bandOf = (subLevel) => MAIN_BAND[subLevel.split('.')[0]] || 'A1';

// ── helpers ───────────────────────────────────────────────────

const firstName = (user) => {
  const meta = user?.user_metadata || {};
  const raw = meta.full_name || meta.name || user?.email || '';
  const name = String(raw).split('@')[0].split(' ')[0].trim();
  if (!name) return 'there';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const greetingWord = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Good morning';
  if (h < 18) return 'Hello';
  return 'Good evening';
};

// ── skeleton ──────────────────────────────────────────────────
const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`} />
);

// ── main ──────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuth();
  const { progress, loading: progressLoading } = useProgress();
  const { isInFreeTrial, getTrialDaysRemaining, hasActiveSubscription, hasProduct, profile } = useSubscription();

  const inTrial = user ? isInFreeTrial() : false;
  const isSubscribed = user ? hasActiveSubscription() : false;
  const trialDays = user ? getTrialDaysRemaining() : 0;

  const [stats, setStats] = useState(null); // Supabase-backed metrics
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!user) { setStats(null); setStatsLoading(false); return; }
    setStatsLoading(true);
    loadDashboardStats(user.id).then((s) => {
      if (alive) { setStats(s); setStatsLoading(false); }
    });
    return () => { alive = false; };
  }, [user]);

  // The level test writes profiles.current_level; the walk floors there so a
  // B1 placer is never routed back to a1.1 topic 1 (see currentPosition.js).
  const cur = useMemo(
    () => deriveCurrent(progress, profile?.current_level),
    [progress, profile?.current_level]
  );
  const completedInLevel = useMemo(
    () => cur.topics.filter((t) => isTopicCompleted(progress, cur.level, t.id)).length,
    [cur, progress]
  );
  const remainingInLevel = cur.topics.length - completedInLevel;
  const band = bandOf(cur.level);
  const levelLabel = cur.level.toUpperCase();

  const loading = progressLoading || statsLoading;

  // ── path nodes: up to 5 topics around the current one + a "goal" node ──
  const pathNodes = useMemo(() => {
    if (!cur.topics.length) return { nodes: [], doneSegments: 0 };
    const WINDOW = 5;
    let start = Math.max(0, cur.nextIndex - 2);
    start = Math.min(start, Math.max(0, cur.topics.length - WINDOW));
    const slice = cur.topics.slice(start, start + WINDOW);
    // node x/y positions echo the mockup's alternating high/low rhythm
    const xs = [70, 215, 360, 505, 650];
    const ys = [150, 92, 150, 92, 150];
    const nodes = slice.map((t, i) => {
      const done = isTopicCompleted(progress, cur.level, t.id);
      const current = !cur.allDone && t.id === cur.nextTopic?.id;
      return {
        x: xs[i], y: ys[i],
        label: (t.titleDe || t.titleEn || '').split(' ').slice(0, 2).join(' '),
        state: done ? 'done' : current ? 'current' : 'todo',
      };
    });
    // goal node → next band
    const nextBand = { A1: 'A2', A2: 'B1', B1: 'B2', B2: 'B2' }[band];
    nodes.push({ x: 806, y: 96, label: nextBand, state: 'goal' });
    // Completed stroke covers exactly the leading run of done nodes — the
    // green line and the checkmarks can never disagree again.
    let doneSegments = 0;
    while (doneSegments < slice.length && nodes[doneSegments].state === 'done') doneSegments += 1;
    return { nodes, doneSegments };
  }, [cur, progress, band]);

  // The dotted spine, split at each node so the completed portion can be
  // stroked truthfully (segment i connects node i to node i+1).
  const PATH_SEGMENTS = [
    'M70,150 C130,150 160,92 215,92',
    'M215,92 C275,92 300,150 360,150',
    'M360,150 C420,150 450,92 505,92',
    'M505,92 C565,92 590,150 650,150',
    'M650,150 C715,150 750,92 806,96',
  ];

  const practice = [
    { title: 'Speaking', en: 'Say a few lines with your AI partner', Icon: Mic, tint: '#0D9488', to: '/speaking' },
    { title: 'Sentence X-Ray', en: 'X-ray any German sentence', Icon: ScanSearch, tint: '#0891B2', to: '/analyze' },
    // Listening and Reading are stocked (480 dialogues, 66 lessons) but had no
    // entry point once a user signed in — the only link lived in the logged-out nav.
    { title: 'Listening', en: 'A short dialogue at your level', Icon: Headphones, tint: '#7C3AED',
      to: `/listening/${String(cur.level ?? '').toLowerCase()}` },
    { title: 'Reading', en: 'A short story with vocabulary help', Icon: FileText, tint: '#DB2777',
      to: `/reading/${cur.level}` },
    // No spaced-repetition flow exists yet → route Review to the next topic to
    // revisit. Grammar is Astro-served, so this card is a full-load link.
    { title: 'Review', en: 'Revisit your current grammar topic', Icon: RotateCcw, tint: '#F59E0B',
      to: cur.nextTopic ? `/grammar/${cur.level}/${cur.nextTopic.slug}/` : '/grammar/', fullLoad: true },
    // The level hub (vocab/sentences/grammar/reading/listening/podcast tabs)
    // was unreachable for logged-in users — nothing in the app linked it.
    { title: 'Your level', en: `Everything in ${cur.level.toUpperCase()} — words, texts, audio`, Icon: BookOpen, tint: '#334155',
      to: `/level/${cur.level}` },
  ];

  // Course owners get their course back: /telc-b1-kurs previously had ONE
  // inbound link, buried on the /subscription account page.
  const ownsCourse = user ? hasProduct('telc_b1_komplett') : false;

  const statTiles = [
    { label: 'Day streak', value: stats?.streak ?? 0, Icon: Flame, from: '#F59E0B', to: '#FB923C' },
    { label: 'Topics mastered', value: completedInLevel + otherLevelsCompleted(progress, cur.level), Icon: Trophy, from: '#0F766E', to: '#14B8A6' },
    { label: 'Speaking sessions', value: stats?.speakingSessions ?? 0, Icon: Mic, from: '#0891B2', to: '#22D3EE' },
    { label: 'Sentence X-Ray', value: stats?.xrayChecks ?? 0, Icon: ScanSearch, from: '#0D9488', to: '#06B6D4' },
  ];

  // Grammar lessons are Astro-served — the hero is a full-load <a>, trailing-slash class.
  const heroHref = cur.nextTopic ? `/grammar/${cur.level}/${cur.nextTopic.slug}/` : '/grammar/';
  const heroTitle = cur.allDone ? 'All done!' : (cur.nextTopic?.titleEn || 'Start here');
  const heroDe = cur.allDone ? "You've finished every topic." : (cur.nextTopic?.titleDe || '');
  const heroMinutes = cur.nextTopic?.estimatedTime || 15;
  const heroProgress = cur.nextTopic ? topicPercent(progress, cur.level, cur.nextTopic.id) : 100;
  const isBrandNew = !loading && stats && stats.streak === 0 && completedInLevel === 0
    && !cur.started && stats.speakingSessions === 0 && stats.xrayChecks === 0;

  return (
    <div className="dm-scope" style={{ background: '#F3F7F7', color: INK, minHeight: '100vh' }}>
      <SEO
        title="Dashboard - Your German Learning Progress"
        description="Your personal German learning path — next lesson, streak, and progress across CEFR levels."
        path="/dashboard"
      />
      <div className="dm-body max-w-6xl mx-auto px-5 sm:px-8 pt-20 pb-12">

        {/* ── Greeting + today's momentum ──
            The dashboard used to render its own logo/avatar bar UNDER the
            global Navbar — two logos, two avatars on one screen. The global
            nav is the one header; the streak and goal ring live here now. */}
        <motion.div {...fade(0)} className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="dm-display text-3xl sm:text-[2.6rem] leading-tight font-semibold">
              {greetingWord()}, {firstName(user)}
            </h1>
            <p className="mt-1.5 text-[15px]" style={{ color: '#5B6B72' }}>
              {loading ? (
                'Loading your path…'
              ) : cur.allDone ? (
                <>You've completed every topic — <span style={{ color: INK, fontWeight: 600 }}>Meisterhaft.</span></>
              ) : isBrandNew ? (
                <>Welcome to your German journey — let's take the <span style={{ color: INK, fontWeight: 600 }}>first step</span>.</>
              ) : (
                <>Keep it going — <span style={{ color: INK, fontWeight: 600 }}>{remainingInLevel} topic{remainingInLevel !== 1 ? 's' : ''} left</span> in {levelLabel}.</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                 style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}
                 title={`${stats?.streak ?? 0}-day streak`}>
              <Flame className="w-4 h-4" style={{ color: '#F59E0B' }} />
              <span className="text-sm font-semibold" style={{ color: '#B45309' }}>{stats?.streak ?? 0}</span>
            </div>
            <GoalRing done={stats?.activitiesToday ?? 0} total={DAILY_GOAL_TARGET} />
          </div>
        </motion.div>

        {/* ── Hero: next action ── */}
        <motion.div {...fade(0.06)} className="mb-8">
          {loading ? (
            <Sk className="h-48 sm:h-52 rounded-3xl" />
          ) : (
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
                 style={{ background: 'linear-gradient(120deg,#0F766E 0%,#0D9488 45%,#0E7490 100%)',
                          boxShadow: '0 24px 48px -20px rgba(15,118,110,.55)' }}>
              <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full"
                   style={{ background: 'radial-gradient(circle,rgba(251,191,36,.35),transparent 60%)' }} />
              <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full"
                   style={{ background: 'radial-gradient(circle,rgba(255,255,255,.14),transparent 60%)' }} />
              <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4"
                       style={{ background: 'rgba(255,255,255,.16)', color: '#EAFBF7' }}>
                    <Sparkles className="w-3 h-3" />
                    {isBrandNew ? 'Start here' : cur.allDone ? 'All done' : 'Continue where you left off'}
                  </div>
                  <h2 className="dm-display text-white text-[1.9rem] sm:text-4xl font-semibold leading-tight">
                    {heroTitle}
                  </h2>
                  {heroDe && (
                    <p className="mt-1 text-teal-50/90 text-[15px]">
                      <span className="font-semibold">{heroDe}</span>
                    </p>
                  )}
                  {!cur.allDone && (
                    <>
                      <div className="mt-5 flex flex-wrap items-center gap-4 text-teal-50/80 text-[13px]">
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" /> Lesson {cur.nextIndex + 1} of {cur.topics.length}
                        </span>
                        <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" /> ~{heroMinutes} min</span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,.16)' }}>{levelLabel}</span>
                      </div>
                      <div className="mt-3 h-1.5 w-full max-w-sm rounded-full" style={{ background: 'rgba(255,255,255,.22)' }}>
                        <div className="h-full rounded-full" style={{ width: `${heroProgress}%`, background: 'linear-gradient(90deg,#FDE68A,#FBBF24)' }} />
                      </div>
                    </>
                  )}
                </div>
                <a href={heroHref}
                      className="group shrink-0 inline-flex items-center gap-2 rounded-2xl px-6 py-4 font-semibold text-[15px] transition-transform hover:-translate-y-0.5"
                      style={{ background: '#FFFFFF', color: '#0F766E', boxShadow: '0 10px 24px -8px rgba(0,0,0,.35)' }}>
                  {isBrandNew ? 'Start now' : cur.allDone ? 'Browse topics' : 'Keep learning'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Your path (the learning path) ── */}
        <motion.div {...fade(0.12)} className="mb-8 rounded-3xl bg-white p-6 sm:p-7"
                    style={{ border: '1px solid #E5EEEE', boxShadow: '0 12px 30px -22px rgba(12,42,51,.4)' }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="dm-display text-xl font-semibold">Your path</h3>
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
              {levelLabel} · {BAND_NAME[band]}
            </span>
          </div>
          <p className="text-[13px] mb-2" style={{ color: '#5B6B72' }}>
            {loading
              ? 'Mapping your path…'
              : cur.allDone
                ? 'Every topic complete — you\'ve reached the summit.'
                : `${completedInLevel} done, ${remainingInLevel} to go in ${levelLabel}.`}
          </p>

          {loading ? (
            <Sk className="h-40 w-full" />
          ) : (
            <div className="w-full">
              <svg viewBox="0 0 880 210" className="w-full" style={{ height: 'auto' }}
                   role="img" aria-label={`Learning path for ${levelLabel}`}>
                <path d="M70,150 C130,150 160,92 215,92 C275,92 300,150 360,150 C420,150 450,92 505,92 C565,92 590,150 650,150 C715,150 750,92 806,96"
                      fill="none" stroke="#E2E8F0" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12" />
                {PATH_SEGMENTS.slice(0, pathNodes.doneSegments).map((d) => (
                  <path key={d} d={d} fill="none" stroke="#0D9488" strokeWidth="5" strokeLinecap="round" />
                ))}
                {pathNodes.nodes.map((n, i) => <Node key={i} {...n} />)}
              </svg>
            </div>
          )}

          {/* overall arc */}
          <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ color: '#64748B' }}>
            <Seg label="A1" done={band !== 'A1'} active={band === 'A1'} /><Dash />
            <Seg label="A2" done={['B1', 'B2'].includes(band)} active={band === 'A2'} /><Dash />
            <Seg label="B1" done={band === 'B2'} active={band === 'B1'} /><Dash />
            <Seg label="B2" active={band === 'B2'} />
            <span className="ml-2" style={{ color: '#94A3B8' }}>you're here</span>
          </div>
        </motion.div>

        {/* ── Practice today ── */}
        <motion.div {...fade(0.18)} className="mb-8">
          <h3 className="dm-display text-xl font-semibold mb-3">Practice today</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {practice.map((p) => {
              const cardClass = 'text-left rounded-2xl bg-white p-5 transition-transform hover:-translate-y-0.5 block';
              const cardStyle = { border: '1px solid #E5EEEE', boxShadow: '0 10px 24px -20px rgba(12,42,51,.5)' };
              const inner = (
                <>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                       style={{ background: `${p.tint}14` }}>
                    <p.Icon className="w-5 h-5" style={{ color: p.tint }} />
                  </div>
                  <div className="dm-display font-semibold text-[17px]">{p.title}</div>
                  <div className="text-[13px] mt-0.5" style={{ color: '#5B6B72' }}>{p.en}</div>
                </>
              );
              return p.fullLoad ? (
                <a key={p.title} href={p.to} className={cardClass} style={cardStyle}>{inner}</a>
              ) : (
                <Link key={p.title} to={p.to} className={cardClass} style={cardStyle}>{inner}</Link>
              );
            })}
          </div>
        </motion.div>

        {/* ── Momentum stats ── */}
        <motion.div {...fade(0.24)} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-28" />)
            : statTiles.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white p-5" style={{ border: '1px solid #E5EEEE' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                       style={{ background: `linear-gradient(135deg,${s.from},${s.to})` }}>
                    <s.Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="dm-display text-2xl font-semibold">{s.value}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#5B6B72' }}>{s.label}</div>
                </div>
              ))}
        </motion.div>

        {/* ── Course strip (owners only) ── */}
        {ownsCourse && (
          <motion.div {...fade(0.27)} className="mb-4">
            <Link to="/telc-b1-kurs"
                  className="flex items-center justify-between gap-3 rounded-2xl px-5 py-4 bg-white transition-transform hover:-translate-y-0.5"
                  style={{ border: '1px solid #E5EEEE', boxShadow: '0 10px 24px -20px rgba(12,42,51,.5)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg,#0F766E,#0D9488)' }}>
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[14px]">telc B1 Komplettvorbereitung</p>
                  <p className="text-[12px]" style={{ color: '#5B6B72' }}>Continue your 4-week exam plan</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: '#0F766E' }} />
            </Link>
          </motion.div>
        )}

        {/* ── Trial strip (hidden when subscribed) ── */}
        {inTrial && !isSubscribed && (
          <motion.div {...fade(0.3)}
               className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl px-5 py-4 mb-4"
               style={{ background: 'linear-gradient(90deg,#FFFBEB,#FFF7ED)', border: '1px solid #FDE68A' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg,#F59E0B,#FB923C)' }}>
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[14px]" style={{ color: '#92400E' }}>
                  {trialDays} day{trialDays !== 1 ? 's' : ''} left in your free trial
                </p>
                <p className="text-[12px]" style={{ color: '#B45309' }}>Keep your streak and unlock unlimited speaking</p>
              </div>
            </div>
            <a href="/pricing/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[14px] text-white whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg,#F59E0B,#FB923C)' }}>
              <Crown className="w-4 h-4" /> Upgrade to Pro
            </a>
          </motion.div>
        )}

        <a href="/grammar/"
              className="block w-full text-center text-[13px] py-3 rounded-xl transition-colors hover:bg-white/60"
              style={{ color: '#64748B' }}>
          Browse all 64 grammar topics →
        </a>
      </div>
    </div>
  );
};

// Count completed topics in every level EXCEPT the given one (for the mastered tile).
function otherLevelsCompleted(progress, exceptLevel) {
  let n = 0;
  ALL_LEVELS.forEach((level) => {
    if (level === exceptLevel) return;
    const topics = getTopicsForLevel(level) || [];
    topics.forEach((t) => { if (progress?.[level]?.grammarTopics?.[t.id]?.completed) n += 1; });
  });
  return n;
}

// ── Path node (from the approved mockup) ──
function Node({ x, y, label, state }) {
  const done = state === 'done', current = state === 'current', goal = state === 'goal';
  const r = current ? 22 : goal ? 20 : 17;
  const fill = done ? '#0D9488' : '#FFFFFF';
  const ring = done ? '#0D9488' : current ? '#0D9488' : goal ? '#F59E0B' : '#CBD5E1';
  return (
    <g>
      {current && <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#0D9488" strokeWidth="2" className="dm-pulse" />}
      <circle cx={x} cy={y} r={r} fill={fill} stroke={ring} strokeWidth={current || goal ? 3 : 2.5}
              style={{ filter: current ? 'drop-shadow(0 6px 12px rgba(13,148,136,.45))' : goal ? 'drop-shadow(0 6px 12px rgba(245,158,11,.35))' : 'none' }} />
      {done && <path d={`M${x - 6},${y} l4,4 l8,-8`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      {current && <circle cx={x} cy={y} r="6" fill="#0D9488" />}
      {goal && <Trophy x={x - 9} y={y - 9} width="18" height="18" color="#F59E0B" />}
      {state === 'todo' && <Lock x={x - 8} y={y - 8} width="16" height="16" color="#94A3B8" />}
      <text x={x} y={y + r + 18} textAnchor="middle" fontSize="12"
            fontFamily={font.body} fontWeight={current ? 700 : 500}
            fill={current ? INK : '#64748B'}>{label}</text>
    </g>
  );
}

function GoalRing({ done, total }) {
  const pct = Math.min(done / total, 1), R = 15, C = 2 * Math.PI * R;
  return (
    <div className="relative w-9 h-9" title={`${done} / ${total} activities today`}>
      <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={R} fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
        <circle cx="18" cy="18" r={R} fill="none" stroke="#0D9488" strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: '#0F766E' }}>
        {done}
      </span>
    </div>
  );
}

const Seg = ({ label, done, active }) => (
  <span className="inline-flex items-center gap-1 font-semibold"
        style={{ color: done ? '#0D9488' : active ? INK : '#94A3B8' }}>
    {done && <Check className="w-3.5 h-3.5" />} {label}
  </span>
);
const Dash = () => <span style={{ color: '#CBD5E1' }}>—</span>;

export default DashboardPage;
