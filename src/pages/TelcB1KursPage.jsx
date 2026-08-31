import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Headphones, Mic, PenTool, Search, Target, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PROGRAM, PROGRAM_KEY, allItemIds } from '../data/programs/telcB1Komplett';
import { getProgramProgress, setProgramItemDone } from '../services/programProgress';

// The course area for the telc B1 Komplettvorbereitung: the 4-week plan over
// existing content, with a per-item checkbox persisted to program_progress.
// Reached only through PurchaseGuard (src/App.jsx), so everyone here owns it.

const TYPE_ICON = {
  lesson: BookOpen,
  listening: Headphones,
  reading: PenTool,
  speaking: Mic,
  xray: Search,
  exam: ClipboardCheck,
  review: Target,
};

const TelcB1KursPage = () => {
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
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-8">
          <p className="font-data text-xs uppercase tracking-widest text-siegel mb-2">telc B1</p>
          <h1 className="font-display text-3xl md:text-4xl text-ink mb-2">{PROGRAM.title}</h1>
          <p className="text-graphite">{PROGRAM.subtitle}</p>

          <div className="mt-6 border border-rule rounded-lg p-4 bg-white">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm font-semibold text-ink">Your progress</span>
              <span className="font-data text-sm text-graphite">{completed}/{totalItems} · {pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-siegel-wash overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-siegel transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </header>

        {PROGRAM.weeks.map((week) => (
          <section key={week.title} className="mb-10">
            <h2 className="font-display text-xl text-ink border-b border-rule pb-2 mb-1">{week.title}</h2>
            <p className="text-sm text-graphite mb-4">{week.intro}</p>

            <ol className="space-y-3">
              {week.days.map((day) => (
                <li key={day.label} className="border border-rule rounded-lg bg-white p-4">
                  <p className="font-data text-xs uppercase tracking-wider text-graphite mb-3">{day.label}</p>
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
                              className={`flex-1 text-ink hover:text-siegel ${isDone ? 'line-through text-graphite' : ''}`}
                            >
                              {item.title}
                            </a>
                          ) : (
                            <Link
                              to={item.href}
                              className={`flex-1 text-ink hover:text-siegel ${isDone ? 'line-through text-graphite' : ''}`}
                            >
                              {item.title}
                            </Link>
                          )}
                          {item.minutes ? (
                            <span className="font-data text-xs text-graphite shrink-0">{item.minutes} min</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <footer className="border-t border-rule pt-6 text-sm text-graphite">
          <p>
            Work at your own pace — the plan assumes one session a day, but nothing expires.
            Your included Pro access covers every linked lesson; see{' '}
            <Link to="/subscription" className="text-siegel underline">your subscription page</Link>{' '}
            for its status.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default TelcB1KursPage;
