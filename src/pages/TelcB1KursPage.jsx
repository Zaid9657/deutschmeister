import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, Gift, Mic, PenTool, RefreshCw, Search, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../utils/supabase';
import { PROGRAM, PROGRAM_KEY, EXAM_KEY, BONUSES, allDays } from '../data/programs/telcB1Komplett.js';
import { MOCK_DISCLAIMER_DE } from '../data/examTracks.js';
import { getProgramProgress, setProgramItemDone } from '../services/programProgress';
import { flattenCourse, currentItem, saveCourseContext, clearCourseContext, telcCourseContext } from '../lib/courseFlow.js';
import { gapPriorities, pilotEvidence, dayDone, rehearsalTopics, arrive } from '../lib/telcPilot.js';
import ExamDatePlan from '../components/course/ExamDatePlan.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';

// The course area of the telc B1 pilot: 20 Trainingseinheiten, exam tasks first
// (src/data/programs/telcB1Komplett.js). Reached only through PurchaseGuard
// (src/App.jsx), so everyone here owns the package. German, Sie, like the
// course (CLAUDE.md) — the learner is preparing for a German exam.
//
// What the page does on arrival, and why:
//   - clears any course context left by another course, so no stale return
//     bar follows the learner into this plan;
//   - marks onboarding done and sets exam_track = telc_b1 when they are still
//     empty. A buyer who came through the Buy flow skipped the intro, and the
//     OnboardingGate on /speaking, /schreiben and /modelltest would otherwise
//     show the intro instead of the task this page just opened. Both updates
//     are filtered to NULL only — exam_track 'none' is the learner's explicit
//     "no exam" choice and stays — and the task links go live only once the
//     writes have finished, so a fast click cannot reach a gate that still
//     reads the old profile (Codex review of PR B). Fields the loaded profile
//     already shows as set are not written again, and the wait is bounded
//     (arrive() in src/lib/telcPilot.js): a stalled write opens the plan
//     after ARRIVAL_TIMEOUT_MS rather than never (Codex review 2).
//
// The numbers it shows come from the server where they can (writing and
// speaking records) and from the learner's own ticks only for the units —
// src/lib/telcPilot.js says which and why.

const TYPE_ICON = {
  exam: ClipboardCheck,
  writing: PenTool,
  revise: RefreshCw,
  speaking: Mic,
  xray: Search,
  gap: Target,
};

/** One plan item as a link: speaking items hand their task to /speaking first. */
function ItemLink({ item, gap, ready, className, children }) {
  // Until the arrival writes are done the title is plain text, not a door.
  if (!ready) return <span className={className}>{children}</span>;
  if (item.type === 'gap' && gap) {
    return gap.external
      ? <a href={gap.href} className={className}>{children}</a>
      : <Link to={gap.href} className={className}>{children}</Link>;
  }
  if (item.type === 'speaking') {
    return <Link to={item.href} onClick={() => saveCourseContext(telcCourseContext(item))} className={className}>{children}</Link>;
  }
  return item.external
    ? <a href={item.href} className={className}>{children}</a>
    : <Link to={item.href} className={className}>{children}</Link>;
}

const startProps = (item, gap) => {
  if (item.type === 'gap' && gap) return gap.external ? { href: gap.href } : { to: gap.href };
  if (item.type === 'speaking') return { to: item.href, onClick: () => saveCourseContext(telcCourseContext(item)) };
  return item.external ? { href: item.href } : { to: item.href };
};

function Stat({ label, value, total }) {
  return (
    <div className="rounded-clay border border-rule bg-white px-4 py-3">
      <p className="font-data text-[0.625rem] font-bold uppercase tracking-[0.08em] text-graphite hyphens-auto">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">
        {value}<span className="text-base text-graphite"> / {total}</span>
      </p>
    </div>
  );
}

const TelcB1KursPage = () => {
  const { user } = useAuth();
  const { profile, refreshSubscription } = useSubscription();
  const [done, setDone] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [writingRows, setWritingRows] = useState([]);
  const [speakingRows, setSpeakingRows] = useState([]);
  const [arrived, setArrived] = useState(false);

  const items = useMemo(() => flattenCourse({ program: PROGRAM }), []);
  const days = useMemo(() => allDays(), []);

  // Arrival: a clean context, and the profile fields the gates read.
  useEffect(() => {
    if (!user) return undefined;
    clearCourseContext();
    let alive = true;
    arrive({
      profile,
      markOnboarded: () => supabase.from('profiles').update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', user.id).is('onboarding_completed_at', null).select('id'),
      setExamTrack: () => supabase.from('profiles').update({ exam_track: EXAM_KEY })
        .eq('id', user.id).is('exam_track', null).select('id'),
    }).then(({ changed, timedOut, errors }) => {
      for (const message of errors) console.error('[TelcB1KursPage] arrival:', message);
      if (timedOut) console.warn('[TelcB1KursPage] arrival writes still pending — opening the plan anyway');
      // Written, failed or timed out, the links open now: a gate that still reads
      // the old profile shows the intro, which leads on — a detour, never a lock.
      if (!alive) return;
      setArrived(true);
      if (changed) refreshSubscription();
    });
    return () => { alive = false; };
    // profile and refreshSubscription come from context; the arrival work runs once per account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // The learner's records: ticks, the latest short test, letters, rehearsals.
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    (async () => {
      const [progress, attemptRes, writingRes, speakingRes] = await Promise.all([
        getProgramProgress(user.id, PROGRAM_KEY),
        supabase.from('exam_attempts').select('section_scores, answers, completed_at')
          .eq('user_id', user.id).eq('exam_key', EXAM_KEY).eq('status', 'completed')
          .order('completed_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('writing_submissions').select('exam_key, task_key, feedback, created_at')
          .eq('user_id', user.id).eq('exam_key', EXAM_KEY)
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('speaking_sessions').select('topic, status')
          .eq('user_id', user.id).in('topic', rehearsalTopics()),
      ]);
      if (!alive) return;
      for (const [name, res] of [['exam_attempts', attemptRes], ['writing_submissions', writingRes], ['speaking_sessions', speakingRes]]) {
        if (res.error) console.error(`[TelcB1KursPage] ${name}:`, res.error.message);
      }
      setDone(progress);
      setAttempt(attemptRes.data || null);
      setWritingRows(writingRes.data || []);
      setSpeakingRows(speakingRes.data || []);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, [user]);

  const toggle = (itemId) => {
    const next = new Set(done);
    const nowDone = !next.has(itemId);
    if (nowDone) next.add(itemId);
    else next.delete(itemId);
    setDone(next); // optimistic; the write logs its own failure
    setProgramItemDone(user.id, PROGRAM_KEY, itemId, nowDone);
  };

  const current = currentItem(items, done);
  const gaps = gapPriorities({ attempt, writing: writingRows[0] || null });
  const topGap = gaps[0] || null;
  const evidence = pilotEvidence({ doneIds: done, writingRows, speakingRows });
  const doneDays = new Set(days.filter((d) => dayDone(d, done)).map((d) => d.id));
  const pct = Math.round((evidence.units.done / evidence.units.total) * 100);

  return (
    <div className="min-h-screen bg-paper font-body text-ink" lang="de">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="relative overflow-hidden rounded-clay mb-8 -mx-2 px-2 py-4">
          <Aurora />
          <div className="relative">
            <Reveal as="div">
              <Chip tone="label">telc B1</Chip>
            </Reveal>
            <Reveal
              as="h1"
              delay={60}
              className="mt-3 font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] text-ink sm:text-[3rem]"
            >
              {PROGRAM.title}
            </Reveal>
            <Reveal as="p" delay={120} className="mt-3 text-[0.9375rem] leading-relaxed text-graphite sm:text-base">
              {PROGRAM.subtitle}
            </Reveal>

            <Reveal delay={180} className="mt-6">
              <Card raised edge="siegel" className="p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-semibold text-ink">Ihr Fortschritt</span>
                  <span className="font-data text-[0.8125rem] text-graphite">{evidence.units.done}/{evidence.units.total} Einheiten · {pct} %</span>
                </div>
                <div className="h-2 rounded-pill bg-siegel-wash overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Erledigte Einheiten">
                  <div className="h-full rounded-pill bg-siegel transition-all" style={{ width: `${pct}%` }} />
                </div>
              </Card>
            </Reveal>

            <ExamDatePlan curriculum={{ examKey: EXAM_KEY }} path={days} doneIds={doneDays} lang="de" unit="unit" />
          </div>
        </header>

        {/* Today: the first open item, with its short version for a busy day. */}
        {loaded && arrived && (
          <Reveal as="section" className="mb-10" aria-labelledby="heute-h">
            {current ? (
              <Card raised edge="siegel" className="p-5">
                <p id="heute-h" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">Heute · {current.dayLabel}</p>
                <p className="mt-2 font-display text-xl font-semibold leading-snug text-ink">{current.title}</p>
                {current.type === 'gap' && topGap && <p className="mt-1 text-sm text-ink">→ {topGap.label}</p>}
                {current.note && <p className="mt-2 text-sm leading-relaxed text-graphite">{current.note}</p>}
                <p className="mt-2 text-sm leading-relaxed text-graphite">{current.minimum}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button {...startProps(current, topGap)}>
                    Jetzt starten <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <span className="font-data text-[0.75rem] text-graphite">{current.minutes} Min. · danach unten abhaken</span>
                </div>
              </Card>
            ) : (
              <Card raised edge="siegel" className="p-5">
                <p id="heute-h" className="font-display text-xl font-semibold text-ink">Alle {evidence.units.total} Einheiten erledigt.</p>
                <p className="mt-2 text-sm leading-relaxed text-graphite">
                  Wiederholen Sie bis zur Prüfung, was Ihnen am schwersten fällt – Ihre Lücken stehen unten.
                </p>
              </Card>
            )}
          </Reveal>
        )}

        {/* Where the points go, and how far the route is done. */}
        {loaded && (
          <section className="mb-10 grid gap-4 sm:grid-cols-2" aria-label="Ihr Stand">
            <Card className="p-5">
              <p className="text-sm font-bold text-ink">Ihre Lücken</p>
              {gaps.length > 0 ? (
                <ol className="mt-3 space-y-2">
                  {gaps.map((g) => (
                    <li key={g.key} className="flex items-start gap-2 text-sm">
                      <Target className="mt-0.5 h-4 w-4 shrink-0 text-siegel" aria-hidden="true" />
                      {g.external
                        ? <a href={g.href} className="text-ink transition-colors hover:text-siegel-deep">{g.label}</a>
                        : <Link to={g.href} className="text-ink transition-colors hover:text-siegel-deep">{g.label}</Link>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-graphite">
                  {attempt || writingRows.length
                    ? 'In Ihren Ergebnissen ist gerade keine Lücke gemessen.'
                    : 'Machen Sie zuerst den Kurztest (Tag 1) – danach steht hier, wo Sie die meisten Punkte verlieren.'}
                </p>
              )}
            </Card>
            <div className="grid grid-cols-3 gap-2 self-start">
              <Stat label="Einheiten" value={evidence.units.done} total={evidence.units.total} />
              <Stat label="Korrekturen" value={evidence.corrections.done} total={evidence.corrections.total} />
              <Stat label="Sprechproben" value={evidence.rehearsals.done} total={evidence.rehearsals.total} />
            </div>
          </section>
        )}

        {PROGRAM.weeks.map((week, weekIndex) => (
          <Reveal as="section" key={week.title} delay={Math.min(weekIndex, 8) * 90} className="mb-10">
            <h2 className="font-display text-xl font-semibold text-ink border-b border-rule pb-2 mb-1">{week.title}</h2>
            <p className="text-sm text-graphite mb-4">{week.intro}</p>

            <ol className="space-y-3">
              {week.days.map((day) => (
                // A day is a reference checklist, not a control: flat card (rule 3).
                <Card as="li" key={day.id} className="p-4">
                  <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite mb-3">
                    {day.label}{doneDays.has(day.id) ? ' · erledigt' : ''}
                  </p>
                  <ul className="space-y-3">
                    {day.items.map((item) => {
                      const Icon = TYPE_ICON[item.type] || ClipboardCheck;
                      const isDone = done.has(item.id);
                      return (
                        <li key={item.id}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`item-${item.id}`}
                              checked={isDone}
                              onChange={() => toggle(item.id)}
                              disabled={!loaded}
                              aria-label={`${item.title} erledigt`}
                              className="w-5 h-5 accent-siegel shrink-0"
                            />
                            <Icon size={16} className="text-siegel shrink-0" aria-hidden="true" />
                            <ItemLink
                              item={item}
                              gap={topGap}
                              ready={arrived}
                              className={`flex-1 text-ink transition-colors hover:text-siegel-deep ${isDone ? 'line-through text-graphite' : ''}`}
                            >
                              {item.title}
                              {item.type === 'gap' && topGap ? ` → ${topGap.label}` : ''}
                            </ItemLink>
                            <span className="font-data text-[0.8125rem] text-graphite shrink-0">{item.minutes} Min.</span>
                          </div>
                          {item.type === 'exam' && (
                            <p className="mt-1.5 pl-[3.25rem] font-data text-[0.6875rem] leading-relaxed text-graphite">{MOCK_DISCLAIMER_DE}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ))}
            </ol>
          </Reveal>
        ))}

        {/* Extras outside the 20 units. */}
        <section className="mb-10" aria-labelledby="extras-h">
          <h2 id="extras-h" className="font-display text-xl font-semibold text-ink border-b border-rule pb-2 mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-siegel" aria-hidden="true" /> Extras
          </h2>
          <div className="space-y-3">
            {BONUSES.map((bonus) => (
              <Card key={bonus.id} tone="sunk" className="p-4">
                <details>
                  <summary className="cursor-pointer font-bold text-ink">{bonus.title}</summary>
                  {bonus.lead && <p className="mt-3 text-sm leading-relaxed text-graphite">{bonus.lead}</p>}
                  {bonus.lines && (
                    <ul className="mt-3 space-y-1.5">
                      {bonus.lines.map((line) => <li key={line} className="text-sm leading-relaxed text-ink">· {line}</li>)}
                    </ul>
                  )}
                  {bonus.prompts && (
                    <ol className="mt-3 space-y-3">
                      {bonus.prompts.map((p) => (
                        <li key={p.teil} className="text-sm leading-relaxed">
                          <span className="block font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{p.teil}</span>
                          <span className="text-ink">{p.prompt}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {bonus.link && (
                    <a href={bonus.link.href} className="mt-3 inline-block text-sm font-bold text-siegel transition-colors hover:text-siegel-deep">{bonus.link.label} →</a>
                  )}
                </details>
              </Card>
            ))}
          </div>
        </section>

        <footer className="border-t border-rule pt-6 text-sm text-graphite">
          <p>
            Der Plan bleibt dauerhaft in Ihrem Konto. KI-Korrekturen und Sprechproben laufen über den
            enthaltenen Pro-Zugang; seinen Stand sehen Sie unter{' '}
            <Link to="/subscription" className="font-bold text-siegel transition-colors hover:text-siegel-deep">Abo</Link>.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default TelcB1KursPage;
