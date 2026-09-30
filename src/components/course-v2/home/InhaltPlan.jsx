import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, FileText, MessageCircle, Trophy } from 'lucide-react';
import { SkillIcon } from '../SkillIcon.jsx';
import { Chest } from './StopNode.jsx';
import { hueVars } from './hue.js';

// The plan's textbook „Inhalt" (pathModel.js planInhalt): per Modul a header, per Kapitel
// a card with the columns every Lehrwerk Inhalt has — Kommunikation, Grammatik,
// Wortschatz, Texte, Prüfung — and the Plateau or the Abschlusstest that closes the
// Modul. A Kapitel's header opens the Kapitel page (the gate is soft). Each Modul carries
// the anchor #kursplan-modul-N (a link to #kursplan-modul-N opens the Kursplan sheet with
// that Modul unfolded). Every value is the manifest's; a column a Kapitel has no data for
// is left out.

// a column on phones ≥ 360 px (a textbook Inhalt), the label above its value below that
const DT = 'flex shrink-0 items-start gap-1.5 text-[0.8125rem] font-black text-game-text min-[360px]:w-[8rem]';
const ICON = 'mt-0.5 h-4 w-4 shrink-0 text-[color:var(--hue-edge)]';

function Row({ icon, label, children }) {
  return (
    <div className="flex flex-col gap-0.5 min-[360px]:flex-row min-[360px]:gap-1.5">
      <dt className={DT}>
        {icon}
        <span>{label}</span>
      </dt>
      <dd className="min-w-0 flex-1 font-bold text-game-muted">{children}</dd>
    </div>
  );
}

const joined = (list) => list.join(' · ');
// „Sprechen Teil 1 + 2" never breaks inside „Teil 1 + 2" (no orphaned numbers)
const keepTeil = (label) => String(label).replace(/Teil (\d)/g, 'Teil\u00a0$1').replace(/(\d) \+ (\d)/g, '$1\u00a0+\u00a0$2');

function KapitelCard({ k }) {
  const head = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--hue-edge)] text-lg font-black text-white" aria-hidden="true">
        {k.nr}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.75rem] font-black uppercase tracking-wider text-[color:var(--hue-edge)]">
          Kapitel {k.nr}
          {!k.available && <span className="text-game-muted"> · kommt bald</span>}
          <span className="sr-only">: </span>
        </span>
        <span className="block text-[1.0625rem] font-black leading-snug [hyphens:auto]" lang="de">{k.title}</span>
      </span>
      {k.done && (
        <>
          <Check className="h-5 w-5 shrink-0 text-[color:var(--hue-edge)]" strokeWidth={3.2} aria-hidden="true" />
          <span className="sr-only">geschafft</span>
        </>
      )}
      {k.current && !k.done && (
        <span className="shrink-0 rounded-full bg-course-ink px-2.5 py-0.5 text-[0.75rem] font-black uppercase tracking-wide text-white">Jetzt</span>
      )}
      {k.href && <ChevronRight className="h-5 w-5 shrink-0 text-game-muted" strokeWidth={3} aria-hidden="true" />}
    </>
  );
  const headClass = 'flex min-h-14 items-center gap-3 rounded-t-[14px] px-3.5 py-2.5';

  return (
    <article
      aria-label={`Kapitel ${k.nr}: ${k.title}`}
      className={`rounded-2xl border-2 border-b-4 bg-white ${k.current ? 'border-course' : 'border-game-line'}`}
    >
      {k.href
        ? <Link to={k.href} className={`${headClass} hover:bg-course-wash`}>{head}</Link>
        : <div className={`${headClass} text-game-muted`}>{head}</div>}
      <dl className="flex flex-col gap-2 border-t-2 border-game-line px-3.5 py-3 text-sm leading-snug">
        {k.kommunikation.length > 0 && (
          <Row icon={<MessageCircle className={ICON} strokeWidth={2.6} aria-hidden="true" />} label="Kommunikation">
            <span lang="de">{joined(k.kommunikation)}</span>
          </Row>
        )}
        {k.grammatik.length > 0 && (
          <Row icon={<SkillIcon skill="grammatik" className={ICON} />} label="Grammatik">
            <span lang="de">{joined(k.grammatik)}</span>
          </Row>
        )}
        {k.wortschatz && (
          <Row icon={<SkillIcon skill="wortschatz" className={ICON} />} label="Wortschatz">
            {k.wortschatz} neue Wörter
          </Row>
        )}
        {k.texte.length > 0 && (
          <Row icon={<FileText className={ICON} strokeWidth={2.6} aria-hidden="true" />} label="Texte">
            <ul className="flex flex-col gap-1">
              {k.texte.map((t, i) => (
                <li key={`${i}-${t.title}`} className="flex items-start gap-1.5">
                  <span className="mt-0.5 flex shrink-0 gap-0.5 text-course-ink">
                    {t.skills.map((sk) => <SkillIcon key={sk} skill={sk} className="h-3.5 w-3.5" />)}
                  </span>
                  <span className="sr-only">{t.skills.map((sk) => (sk === 'hoeren' ? 'Hören' : 'Lesen')).join(' und ')}: </span>
                  <span lang="de">{t.title}</span>
                </li>
              ))}
            </ul>
          </Row>
        )}
        {k.pruefung.length > 0 && (
          <Row icon={<SkillIcon skill="pruefung" className={ICON} />} label="Prüfung">
            {joined(k.pruefung.map(keepTeil))}
          </Row>
        )}
      </dl>
    </article>
  );
}

function EndRow({ end }) {
  const icon = end.kind === 'closing'
    ? <Trophy className="h-7 w-7 shrink-0 fill-game-xp text-game-xp-ink" strokeWidth={1.8} aria-hidden="true" />
    : <span className="shrink-0"><Chest size={30} open={end.done} /></span>;
  const inner = (
    <>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-black leading-snug">{end.label}</span>
        <span className="block text-sm font-bold leading-snug">{end.available ? end.detail : 'kommt bald'}</span>
      </span>
      {end.done && (
        <>
          <Check className="h-5 w-5 shrink-0" strokeWidth={3.2} aria-hidden="true" />
          <span className="sr-only">geschafft</span>
        </>
      )}
    </>
  );
  const cls = 'flex min-h-14 items-center gap-3 rounded-2xl bg-game-xp-wash px-3.5 py-2.5 text-game-xp-ink';
  return end.href
    ? <Link to={end.href} className={`${cls} hover:brightness-95`}>{inner}</Link>
    : <div className={cls}>{inner}</div>;
}

// Folded per Modul so the Inhalt does not run to thousands of pixels on a phone: the Modul
// with the learner's current Kapitel (else Modul 1) starts open, every Modul header opens
// and closes its Kapitel, and a jump to #kursplan-modul-N opens N.
function initialOpen(modules) {
  const current = modules.find((m) => m.kapitel.some((k) => k.current && !k.done));
  return new Set([current ? current.nr : modules[0] && modules[0].nr]);
}

export default function InhaltPlan({ modules = [] }) {
  const [open, setOpen] = useState(() => initialOpen(modules));
  useEffect(() => {
    const fromHash = () => {
      const m = /^#kursplan-modul-(\d+)$/.exec(typeof window !== 'undefined' ? window.location.hash : '');
      if (m) setOpen((prev) => new Set([...prev, Number(m[1])]));
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);
  if (!modules.length) return null;
  const toggle = (nr) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(nr)) next.delete(nr); else next.add(nr);
    return next;
  });
  return (
    <div className="flex flex-col gap-4">
      {modules.map((m) => {
        const isOpen = open.has(m.nr);
        return (
          <section key={m.nr} id={`kursplan-modul-${m.nr}`} aria-labelledby={`dm-inhalt-modul-${m.nr}`} className="scroll-mt-36" style={hueVars(m.hue)}>
            <h3 id={`dm-inhalt-modul-${m.nr}`}>
              <button
                type="button"
                onClick={() => toggle(m.nr)}
                aria-expanded={isOpen}
                aria-controls={`dm-inhalt-modul-${m.nr}-list`}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-game-line bg-white px-3 py-2 text-left shadow-game-line"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--hue-edge)] text-lg font-black text-white" aria-hidden="true">
                  {m.nr}
                </span>
                <span className="min-w-0 flex-1">
                  {m.title && <span className="block text-[0.75rem] font-black uppercase tracking-wider text-[color:var(--hue-edge)]">{m.eyebrow}<span className="sr-only">: </span></span>}
                  <span className="block text-xl font-black leading-tight" lang="de">{m.title || m.eyebrow}</span>
                  <span className="block text-[0.8125rem] font-bold text-game-muted">{m.kapitel.map((k) => `Kapitel ${k.nr}`).join(' · ')}</span>
                </span>
                <ChevronDown className={isOpen ? 'h-6 w-6 shrink-0 rotate-180 text-game-muted transition-transform motion-reduce:transition-none' : 'h-6 w-6 shrink-0 text-game-muted transition-transform motion-reduce:transition-none'} strokeWidth={3} aria-hidden="true" />
              </button>
            </h3>
            {isOpen && (
              <ol id={`dm-inhalt-modul-${m.nr}-list`} className="mt-3 flex flex-col gap-3">
                {m.kapitel.map((k) => (
                  <li key={k.id}><KapitelCard k={k} /></li>
                ))}
                {m.end && <li><EndRow end={m.end} /></li>}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
