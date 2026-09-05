import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Headphones, Mic, PenTool, Search, Target, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PROGRAM, PROGRAM_KEY, allItemIds } from '../data/programs/a11Phase';
import { getProgramProgress, setProgramItemDone } from '../services/programProgress';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';

// The course area for "A1.1-Phase: 28 Tage bis zum Abschlusstest": the
// 4-week (28-day) plan over the FIRST half of the A1 band, ending at the
// Abschlusstest A1.1 course test rather than the real exam (that's the
// Start Deutsch 1 plan, StartDeutsch1KursPage.jsx). Structurally identical
// to that page — same per-item checkbox persisted to program_progress
// (generic by program_key), same layout; see its header for the rationale,
// not repeated here. Reached via LevelSubscriptionGuard (level="a1.1")
// rather than PurchaseGuard — a1.1 is a free level, so this plan is open to
// every logged-in user, same recorded decision as the Abschlusstest itself.

const TYPE_ICON = {
  lesson: BookOpen,
  listening: Headphones,
  reading: PenTool,
  speaking: Mic,
  xray: Search,
  exam: ClipboardCheck,
  review: Target,
};

const A11PhasePage = () => {
  const { user } = useAuth();
  const [done, setDone] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);

  const totalItems = useMemo(() => allItemIds().length, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getProgramProgress(user.id, PROGRAM_KEY).then((set) => {
      if (cancelled) return;
      setDone(set);
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [user]);

  const toggle = (itemId) => {
    const next = new Set(done);
    const nowDone = !next.has(itemId);
    if (nowDone) next.add(itemId);
    else next.delete(itemId);
    setDone(next); // optimistic; the write is fire-and-forget with a console error on failure
    setProgramItemDone(user.id, PROGRAM_KEY, itemId, nowDone);
  };

  const completed = done.size;
  const pct = totalItems ? Math.round((completed / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="relative overflow-hidden rounded-clay mb-8 -mx-2 px-2 py-4">
          <Aurora />
          <div className="relative">
            <Reveal as="div">
              <Chip tone="label">A1.1</Chip>
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

            <Reveal delay={160} className="mt-4">
              <Link
                to="/modelltest/abschlusstest-a1-1"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-siegel transition-colors hover:text-siegel-deep"
              >
                <ClipboardCheck className="w-4 h-4" /> Zum Abschlusstest A1.1
              </Link>
            </Reveal>

            <Reveal delay={200} className="mt-6">
              <Card raised edge="siegel" className="p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-semibold text-ink">Dein Fortschritt</span>
                  <span className="font-data text-[0.8125rem] text-graphite">{completed}/{totalItems} · {pct}%</span>
                </div>
                <div className="h-2 rounded-pill bg-siegel-wash overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-pill bg-siegel transition-all" style={{ width: `${pct}%` }} />
                </div>
              </Card>
            </Reveal>
          </div>
        </header>

        {PROGRAM.weeks.map((week, weekIndex) => (
          <Reveal as="section" key={week.title} delay={Math.min(weekIndex, 8) * 90} className="mb-10">
            <h2 className="font-display text-xl font-semibold text-ink border-b border-rule pb-2 mb-1">{week.title}</h2>
            <p className="text-sm text-graphite mb-4">{week.intro}</p>

            <ol className="space-y-3">
              {week.days.map((day) => (
                // A day is a reference checklist, not a control: flat card (rule 3).
                <Card as="li" key={day.label} className="p-4">
                  <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite mb-3">{day.label}</p>
                  <ul className="space-y-2">
                    {day.items.map((item) => {
                      const Icon = TYPE_ICON[item.type] || BookOpen;
                      const isDone = done.has(item.id);
                      return (
                        <li key={item.id} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`item-${item.id}`}
                            checked={isDone}
                            onChange={() => toggle(item.id)}
                            disabled={!loaded}
                            className="w-5 h-5 accent-siegel shrink-0"
                          />
                          <Icon size={16} className="text-siegel shrink-0" aria-hidden="true" />
                          {item.external ? (
                            <a
                              href={item.href}
                              className={`flex-1 text-ink transition-colors hover:text-siegel-deep ${isDone ? 'line-through text-graphite' : ''}`}
                            >
                              {item.title}
                            </a>
                          ) : (
                            <Link
                              to={item.href}
                              className={`flex-1 text-ink transition-colors hover:text-siegel-deep ${isDone ? 'line-through text-graphite' : ''}`}
                            >
                              {item.title}
                            </Link>
                          )}
                          {item.minutes ? (
                            <span className="font-data text-[0.8125rem] text-graphite shrink-0">{item.minutes} min</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ))}
            </ol>
          </Reveal>
        ))}

        <footer className="border-t border-rule pt-6 text-sm text-graphite">
          <p>
            Arbeite in deinem Tempo — der Plan geht von einer Einheit pro Tag aus, aber nichts läuft ab.
            A1.1 ist immer frei zugänglich; den Status siehst du auf{' '}
            <Link to="/subscription" className="font-bold text-siegel transition-colors hover:text-siegel-deep">deiner Abo-Seite</Link>.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default A11PhasePage;
