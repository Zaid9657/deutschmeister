import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, Mic, ScanSearch, RotateCcw, Crown, Clock,
  ArrowRight, Check, Lock, Trophy, BookOpen, Sparkles,
  Headphones, FileText, Target,
} from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getTopicsForLevel } from '../data/grammarTopics';
import { levels as ALL_LEVELS } from '../data/content';
import { deriveCurrent, isTopicCompleted, topicPercent } from '../services/currentPosition';
import { examTrackByKey } from '../data/examTracks';
import { LEVEL_COURSES } from '../data/pricing.js';
import { loadDashboardStats, DAILY_GOAL_TARGET } from '../services/dashboardStats';
import { GRAMMAR_TOPIC_COUNT } from '../data/marketing.js';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import Stat from '../components/ui/Stat.jsx';
import confettiBurst from '../lib/confetti.js';

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
  <div className={`animate-pulse rounded-clay bg-paper-sunk ${className}`} />
);

// ── main ──────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuth();
  const { progress, loading: progressLoading } = useProgress();
  const { isInFreeTrial, getTrialDaysRemaining, hasActiveSubscription, hasProduct, purchases, profile } = useSubscription();

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

  // Exam identity (profiles.exam_track/exam_date, renovation Phase 4a).
  // 'none' and unset both mean the library-first layout.
  const examTrack = profile?.exam_track && profile.exam_track !== 'none'
    ? examTrackByKey(profile.exam_track)
    : null;
  const examDaysLeft = (() => {
    if (!examTrack || !profile?.exam_date) return null;
    const days = Math.ceil((new Date(profile.exam_date) - Date.now()) / 86400000);
    return days >= 0 ? days : null;
  })();
  const goalTarget = profile?.daily_goal_target || DAILY_GOAL_TARGET;

  const loading = progressLoading || statsLoading;

  // Daily goal: a real win gets ONE confetti burst per visit — the ref keeps
  // re-renders (stats refresh, progress updates) from repeating it.
  const goalDone = stats?.activitiesToday ?? 0;
  const goalMet = !loading && goalDone >= goalTarget;
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (goalMet && !celebratedRef.current) {
      celebratedRef.current = true;
      confettiBurst();
    }
  }, [goalMet]);

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
    { title: 'Speaking', en: 'Say a few lines with your AI partner', Icon: Mic, to: '/speaking' },
    { title: 'Sentence X-Ray', en: 'X-ray any German sentence', Icon: ScanSearch, to: '/analyze' },
    // Listening and Reading are stocked (480 dialogues, 66 lessons) but had no
    // entry point once a user signed in — the only link lived in the logged-out nav.
    { title: 'Listening', en: 'A short dialogue at your level', Icon: Headphones,
      to: `/listening/${String(cur.level ?? '').toLowerCase()}` },
    { title: 'Reading', en: 'A short story with vocabulary help', Icon: FileText,
      to: `/reading/${cur.level}` },
    // No spaced-repetition flow exists yet → route Review to the next topic to
    // revisit. Grammar is Astro-served, so this card is a full-load link.
    { title: 'Review', en: 'Revisit your current grammar topic', Icon: RotateCcw,
      to: cur.nextTopic ? `/grammar/${cur.level}/${cur.nextTopic.slug}/` : '/grammar/', fullLoad: true },
    // The level hub (vocab/sentences/grammar/reading/listening/podcast tabs)
    // was unreachable for logged-in users — nothing in the app linked it.
    { title: 'Your level', en: `Everything in ${cur.level.toUpperCase()} — words, texts, audio`, Icon: BookOpen,
      to: `/level/${cur.level}` },
  ];

  // Course owners get their course back: /telc-b1-kurs previously had ONE
  // inbound link, buried on the /subscription account page.
  const ownsCourse = user ? hasProduct('telc_b1_komplett') : false;
  // Level courses the user owns — each gets its own strip straight into the
  // level, so a buyer never has to find their purchase through the paywalled
  // ladder. The bundle collapses to one strip.
  const ownedLevelCourses = user
    ? purchases.map((p) => LEVEL_COURSES[p.product_key]).filter(Boolean)
    : [];

  const statTiles = [
    { label: 'Day streak', value: stats?.streak ?? 0, Icon: Flame, edge: 'aprikose', iconClass: 'bg-accent-aprikose-wash text-accent-aprikose-ink' },
    { label: 'Topics mastered', value: completedInLevel + otherLevelsCompleted(progress, cur.level), Icon: Trophy, edge: 'paper', iconClass: 'bg-siegel-wash text-siegel' },
    { label: 'Speaking sessions', value: stats?.speakingSessions ?? 0, Icon: Mic, edge: 'paper', iconClass: 'bg-siegel-wash text-siegel' },
    { label: 'Sentence X-Ray', value: stats?.xrayChecks ?? 0, Icon: ScanSearch, edge: 'paper', iconClass: 'bg-siegel-wash text-siegel' },
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
    <div className="min-h-screen bg-paper font-body text-ink">
      <SEO
        title="Dashboard - Your German Learning Progress"
        description="Your personal German learning path — next lesson, streak, and progress across CEFR levels."
        path="/dashboard"
      />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-20 pb-12">

        {/* ── Greeting + today's momentum ──
            The dashboard used to render its own logo/avatar bar UNDER the
            global Navbar — two logos, two avatars on one screen. The global
            nav is the one header; the streak and goal live here now. */}
        <Reveal className="relative overflow-hidden rounded-clay mb-7 -mx-2 px-2 py-4 sm:-mx-4 sm:px-4">
          <Aurora />
          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div>
              <h1 className="font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[3rem]">
                {greetingWord()}, {firstName(user)}
              </h1>
              <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-graphite sm:text-base">
                {loading ? (
                  'Loading your path…'
                ) : cur.allDone ? (
                  <>You've completed every topic — <span className="font-bold text-ink">Meisterhaft.</span></>
                ) : isBrandNew ? (
                  <>Welcome to your German journey — let's take the <span className="font-bold text-ink">first step</span>.</>
                ) : (
                  <>Keep it going — <span className="font-bold text-ink">{remainingInLevel} topic{remainingInLevel !== 1 ? 's' : ''} left</span> in {levelLabel}.</>
                )}
              </p>
            </div>
            <div className="flex items-stretch gap-3 shrink-0">
              <Card raised edge="aprikose" className="flex items-center gap-3 px-4 py-3" title={`${stats?.streak ?? 0}-day streak`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent-aprikose-wash text-accent-aprikose-ink">
                  <Flame className="w-5 h-5" />
                </span>
                <Stat value={stats?.streak ?? 0} label="Day streak" size="sm" />
              </Card>
              <GoalCard done={goalDone} total={goalTarget} met={goalMet} />
            </div>
          </div>
        </Reveal>

        {/* ── Exam goal strip (exam-first hierarchy) ── */}
        {examTrack && (
          <Reveal delay={60} className="mb-6">
            <Card raised edge="siegel" className="flex flex-wrap items-center gap-3 px-5 py-4">
              <Button size="sm" href={`/pruefung/${examTrack.slug}/`}>
                <Trophy className="w-4 h-4" />
                Your goal: {examTrack.nameDe}
              </Button>
              {examDaysLeft !== null && (
                <Chip tone="aprikose" size="md">
                  <Clock className="w-4 h-4" />
                  {examDaysLeft === 0 ? 'Exam day is today' : `${examDaysLeft} day${examDaysLeft !== 1 ? 's' : ''} to your exam`}
                </Chip>
              )}
              <Button variant="secondary" size="sm" to={`/modelltest/${examTrack.slug}`}>
                Practice test
              </Button>
              <Button variant="secondary" size="sm" to={`/schreiben/${examTrack.slug}`}>
                Writing feedback
              </Button>
              <span className="font-data text-[0.8125rem] text-graphite">
                Your level: {levelLabel}
              </span>
            </Card>
          </Reveal>
        )}

        {/* ── Hero: next action ── */}
        <Reveal delay={120} className="mb-8">
          {loading ? (
            <Sk className="h-48 sm:h-52" />
          ) : (
            <Card raised edge={examTrack ? 'paper' : 'siegel'} className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="max-w-xl">
                  <Chip tone="label" className="mb-4">
                    <Sparkles className="w-3 h-3" />
                    {isBrandNew ? 'Start here' : cur.allDone ? 'All done' : 'Continue where you left off'}
                  </Chip>
                  <h2 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] sm:text-[2.125rem]">
                    {heroTitle}
                  </h2>
                  {heroDe && (
                    <p className="mt-1 text-[0.9375rem] text-graphite">
                      <span className="font-bold">{heroDe}</span>
                    </p>
                  )}
                  {!cur.allDone && (
                    <>
                      <div className="mt-5 flex flex-wrap items-center gap-4 font-data text-[0.8125rem] text-graphite">
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" /> Lesson {cur.nextIndex + 1} of {cur.topics.length}
                        </span>
                        <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" /> ~{heroMinutes} min</span>
                        <Chip tone="label">{levelLabel}</Chip>
                      </div>
                      <div className="mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-pill bg-paper-sunk">
                        <div className="h-full rounded-pill bg-siegel" style={{ width: `${heroProgress}%` }} />
                      </div>
                    </>
                  )}
                </div>
                <Button
                  href={heroHref}
                  size="lg"
                  shimmer
                  variant={goalMet ? 'celebrate' : 'primary'}
                  className="group shrink-0"
                >
                  {isBrandNew ? 'Start now' : cur.allDone ? 'Browse topics' : 'Keep learning'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </Card>
          )}
        </Reveal>

        {/* ── Your path (the learning path) ── */}
        <div className="mb-8">
          <SectionHeading
            eyebrow={`${levelLabel} · ${BAND_NAME[band]}`}
            title="Your path"
            lead={loading
              ? 'Mapping your path…'
              : cur.allDone
                ? 'Every topic complete — you\'ve reached the summit.'
                : `${completedInLevel} done, ${remainingInLevel} to go in ${levelLabel}.`}
          />
          <Reveal delay={180} className="mt-5">
            <Card raised className="p-6 sm:p-7">
              {loading ? (
                <Sk className="h-40 w-full" />
              ) : (
                <div className="w-full">
                  <svg viewBox="0 0 880 210" className="w-full h-auto"
                       role="img" aria-label={`Learning path for ${levelLabel}`}>
                    <path d="M70,150 C130,150 160,92 215,92 C275,92 300,150 360,150 C420,150 450,92 505,92 C565,92 590,150 650,150 C715,150 750,92 806,96"
                          fill="none" className="stroke-rule" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12" />
                    {PATH_SEGMENTS.slice(0, pathNodes.doneSegments).map((d) => (
                      <path key={d} d={d} fill="none" className="stroke-siegel-lift" strokeWidth="5" strokeLinecap="round" />
                    ))}
                    {pathNodes.nodes.map((n, i) => <Node key={i} {...n} />)}
                  </svg>
                </div>
              )}

              {/* overall arc */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.75rem] text-graphite">
                <Seg label="A1" done={band !== 'A1'} active={band === 'A1'} /><Dash />
                <Seg label="A2" done={['B1', 'B2'].includes(band)} active={band === 'A2'} /><Dash />
                <Seg label="B1" done={band === 'B2'} active={band === 'B1'} /><Dash />
                <Seg label="B2" active={band === 'B2'} />
                <span className="ml-2 font-data text-[0.75rem] text-graphite">you're here</span>
              </div>
            </Card>
          </Reveal>
        </div>

        {/* ── Practice today ── */}
        <div className="mb-8">
          <SectionHeading title="Practice today" className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {practice.map((p, i) => {
              const inner = (
                <>
                  <div className="w-11 h-11 rounded-clay bg-siegel-wash text-siegel flex items-center justify-center mb-3">
                    <p.Icon className="w-5 h-5" />
                  </div>
                  <div className="font-display font-semibold text-[1.0625rem] text-ink">{p.title}</div>
                  <div className="text-[0.8125rem] mt-0.5 text-graphite">{p.en}</div>
                </>
              );
              return (
                <Reveal key={p.title} delay={90 * i}>
                  {p.fullLoad ? (
                    <Card interactive as="a" href={p.to} className="block h-full p-5 text-left">{inner}</Card>
                  ) : (
                    <Card interactive as={Link} to={p.to} className="block h-full p-5 text-left">{inner}</Card>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* ── Momentum stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-28" />)
            : statTiles.map((s, i) => (
                <Reveal key={s.label} delay={80 * i}>
                  <Card raised edge={s.edge} className="p-5">
                    <div className={`w-10 h-10 rounded-clay flex items-center justify-center mb-3 ${s.iconClass}`}>
                      <s.Icon className="w-5 h-5" />
                    </div>
                    <Stat value={s.value} label={s.label} size="sm" />
                  </Card>
                </Reveal>
              ))}
        </div>

        {/* ── Course strip (owners only) ── */}
        {ownsCourse && (
          <Reveal className="mb-4">
            <Card interactive as={Link} to="/telc-b1-kurs" className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-clay bg-siegel text-white flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[0.875rem] text-ink">telc B1 Komplettvorbereitung</p>
                  <p className="text-[0.75rem] text-graphite">Continue your 4-week exam plan</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-siegel" />
            </Card>
          </Reveal>
        )}

        {ownedLevelCourses.map((c) => (
          <Reveal key={c.key} className="mb-4">
            <Card interactive as={Link} to={`/level/${c.levels[0]}`} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-clay bg-siegel text-white flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[0.875rem] text-ink">{c.name}</p>
                  <p className="text-[0.75rem] text-graphite">
                    Yours for life · {c.key === 'course_alle' ? 'all 8 levels' : c.levels.map((l) => l.toUpperCase()).join(' + ')}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-siegel" />
            </Card>
          </Reveal>
        ))}

        {/* ── Trial strip (hidden when subscribed) ── */}
        {inTrial && !isSubscribed && (
          <Reveal className="mb-4">
            <Card raised tone="aprikose" edge="aprikose" className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-clay bg-accent-aprikose text-white flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[0.875rem] text-accent-aprikose-ink">
                    {trialDays} day{trialDays !== 1 ? 's' : ''} left in your free trial
                  </p>
                  <p className="text-[0.75rem] text-accent-aprikose-ink">Keep your streak and unlock unlimited speaking</p>
                </div>
              </div>
              <Button href="/pricing/" className="whitespace-nowrap">
                <Crown className="w-4 h-4" /> Upgrade to Pro
              </Button>
            </Card>
          </Reveal>
        )}

        <a href="/grammar/"
           className="block w-full text-center text-[0.8125rem] py-3 font-bold text-siegel transition-colors hover:text-siegel-deep">
          Browse all {GRAMMAR_TOPIC_COUNT} grammar topics →
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
// Colours are Tailwind fill/stroke tokens: siegel for progress, the aprikose
// accent for the goal node's energy, rule/graphite for what is still locked.
function Node({ x, y, label, state }) {
  const done = state === 'done', current = state === 'current', goal = state === 'goal';
  const r = current ? 22 : goal ? 20 : 17;
  const fill = done ? 'fill-siegel-lift' : 'fill-white';
  const ring = done || current ? 'stroke-siegel-lift' : goal ? 'stroke-accent-aprikose' : 'stroke-edge';
  return (
    <g>
      {current && <circle cx={x} cy={y} r={r + 6} fill="none" className="stroke-siegel-lift dm-pulse" strokeWidth="2" />}
      <circle cx={x} cy={y} r={r} className={`${fill} ${ring}`} strokeWidth={current || goal ? 3 : 2.5} />
      {done && <path d={`M${x - 6},${y} l4,4 l8,-8`} fill="none" className="stroke-white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      {current && <circle cx={x} cy={y} r="6" className="fill-siegel-lift" />}
      {goal && <Trophy x={x - 9} y={y - 9} width="18" height="18" className="text-accent-aprikose" />}
      {state === 'todo' && <Lock x={x - 8} y={y - 8} width="16" height="16" className="text-graphite" />}
      <text x={x} y={y + r + 18} textAnchor="middle"
            className={`font-body text-[12px] ${current ? 'fill-ink font-bold' : 'fill-graphite font-medium'}`}>{label}</text>
    </g>
  );
}

// Today's goal: progress on siegel; once met, the card flips to the limette
// (success) tone — the confetti fires from the page, once.
function GoalCard({ done, total, met }) {
  const pct = Math.min(done / total, 1) * 100;
  return (
    <Card raised tone={met ? 'limette' : 'paper'} edge={met ? 'limette' : 'paper'} className="flex flex-col justify-center gap-2 px-4 py-3 min-w-[9rem]" title={`${done} / ${total} activities today`}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
          <Target className="w-3.5 h-3.5" /> Today
        </span>
        <span className="font-data text-[0.8125rem] font-bold text-ink">{done}/{total}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-paper-sunk">
        <div className={`h-full rounded-pill ${met ? 'bg-accent-limette' : 'bg-siegel'}`} style={{ width: `${pct}%` }} />
      </div>
      {met && (
        <Chip tone="limette" className="self-start animate-pop-in">
          <Check className="w-3 h-3" /> Goal met
        </Chip>
      )}
    </Card>
  );
}

const Seg = ({ label, done, active }) => (
  <Chip tone={done ? 'limette' : active ? 'ink' : 'quiet'}>
    {done && <Check className="w-3 h-3" />}{label}
  </Chip>
);
const Dash = () => <span className="text-rule">—</span>;

export default DashboardPage;
