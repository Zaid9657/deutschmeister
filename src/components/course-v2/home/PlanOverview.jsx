import { Check, ListOrdered, X } from 'lucide-react';
import CastAvatar from '../CastAvatar.jsx';
import { laneLabel } from '../content.js';
import GameButton from './GameButton.jsx';
import InhaltPlan from './InhaltPlan.jsx';
import KapitelAufbau from './KapitelAufbau.jsx';
import PacePicker from './PacePicker.jsx';
import ReferenceLinks from './ReferenceLinks.jsx';
import { hueVars } from './hue.js';

// The COURSE PLAN (#kursplan), built like a textbook's front matter: what the course
// is and what the learner can do after it, how every Kapitel is built (Einstieg → A, B,
// C → Prüfungstraining → Sprechen → Schreiben → Kapiteltest, a Plateau every 3
// Kapitel), what is in it (manifest content counts only), the pace, the exam in view,
// the grammar overview and the word list, and last — it is the long one, and the hero
// jumps to it — the „Inhalt": per Modul its Kapitel with Kommunikation, Grammatik,
// Wortschatz, Texte and Prüfung. Since round 3 (owner 2026-09-30: "too much … make it
// duolingo style") it no longer opens the page: it lives one tap deep, in the „Kursplan"
// sheet of the learn screen's tab bar (KursplanSheet.jsx). Every number is the
// manifest's; a section whose data a level does not have (no showcase yet, units still
// coming) is left out rather than filled with placeholders.

const CAST = ['Priya', 'Olena', 'Bilal', 'Emre'];
const TILE_HUES = ['tuerkis', 'orange', 'beere', 'gruen'];

const H2 = 'text-2xl font-black leading-tight';

function Section({ id = undefined, title, lead = null, children }) {
  return (
    <section id={id} className="scroll-mt-20 px-5 pt-7">
      <h2 className={H2}>{title}</h2>
      {lead && <p className="mt-1.5 text-base font-bold leading-relaxed text-game-muted">{lead}</p>}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

export default function PlanOverview({
  manifest, code, level, firstVisit = true, startHref = null, startLabel = '', firstUnitTitle = null,
  tiles = [], aufbau = [], inhalt = [], links = [], parts = [], stepMinutes = null,
  paceOptions = [], pace, onPace, finishText = null, allDone = false, onClose,
}) {
  const title = (manifest && manifest.title && manifest.title.de) || `Kurs ${code}`;
  const showcase = (manifest && manifest.showcase) || null;
  const free = manifest && manifest.priceKey === null;
  const a1 = String(level || '').startsWith('a1');
  const lane = manifest && manifest.lanes && manifest.lanes.primary;
  const TitleTag = firstVisit ? 'h1' : 'h2';
  const kapitelCount = inhalt.reduce((n, m) => n + m.kapitel.length, 0);
  const showInhalt = () => {
    const el = document.getElementById('kursplan-inhalt');
    if (!el) return;
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { reduce = false; }
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    const heading = el.querySelector('h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  };

  return (
    <div id="kursplan" className="scroll-mt-20 pb-8">
      <div className="bg-course-wash px-5 pb-7 pt-6">
        <p className="inline-block rounded-full border-2 border-course-soft bg-white px-3 py-1 text-[0.8125rem] font-black uppercase tracking-wider text-course-ink">
          {code}{free ? ' · kostenlos' : ''}
        </p>
        <TitleTag className="mt-3.5 text-[2.25rem] font-black leading-[1.08] [hyphens:auto]">{title}</TitleTag>
        {showcase && showcase.promiseDe && (
          <p className="mt-3 text-[1.0625rem] font-bold leading-relaxed text-game-text">{showcase.promiseDe}</p>
        )}
        {showcase && a1 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex shrink-0">
              {CAST.map((name, i) => (
                <CastAvatar key={name} name={name} size={52} decorative className={`rounded-full ring-[3px] ring-white ${i ? '-ml-3.5' : ''}`} />
              ))}
            </div>
            <p className="text-sm font-extrabold leading-snug text-game-text">Priya, Olena, Bilal und Emre lernen mit Ihnen.</p>
          </div>
        )}
        {firstVisit && startHref && (
          <>
            <GameButton to={startHref} className="mt-5 w-full">{free ? 'Kostenlos starten' : startLabel}</GameButton>
            <p className="mt-3 text-center text-sm font-bold text-game-muted">
              {level === 'a1.1' ? 'Ohne Vorkenntnisse · Sie brauchen nur Ihr Handy' : 'Sie brauchen nur Ihr Handy'}
            </p>
          </>
        )}
        {kapitelCount > 0 && (
          // a button, not an #anchor: the plan lives in the #kursplan sheet, and a hash
          // change would leave it (the sheet is open while the URL says #kursplan)
          <button
            type="button"
            onClick={showInhalt}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-clay border-2 border-b-4 border-course-soft bg-white px-4 py-2.5 text-base font-black text-course-ink hover:bg-course-wash"
          >
            <ListOrdered className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
            Inhalt ansehen · {kapitelCount} Kapitel
          </button>
        )}
      </div>

      {showcase && Array.isArray(showcase.outcomesDe) && showcase.outcomesDe.length > 0 && (
        <Section title={'Nach diesem Kurs können Sie\u00a0…'}>
          <ul className="flex flex-col gap-2.5">
            {showcase.outcomesDe.map((o) => (
              <li key={o} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-course" aria-hidden="true">
                  <Check className="h-4 w-4 text-white" strokeWidth={3.6} />
                </span>
                <span className="text-base font-bold leading-relaxed">{o}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {aufbau.length > 0 && (
        <Section
          title="So ist jedes Kapitel aufgebaut"
          lead={stepMinutes ? `Wie in einem Lehrbuch, nur zum Mitmachen. Jeder Schritt dauert etwa ${stepMinutes} Minuten.` : 'Wie in einem Lehrbuch, nur zum Mitmachen.'}
        >
          <KapitelAufbau stations={aufbau} />
        </Section>
      )}

      {tiles.length > 0 && (
        <Section title="Das steckt im Kurs">
          <ul className="grid grid-cols-2 gap-2.5">
            {tiles.map((t, i) => (
              <li key={t.key} style={hueVars(TILE_HUES[i % TILE_HUES.length])} className="rounded-2xl border-2 border-b-4 border-game-line bg-white p-3.5">
                <span className="block text-[1.75rem] font-black leading-tight text-[color:var(--hue-edge)]">{t.n}</span>
                <span className="block text-sm font-extrabold leading-snug text-game-text">
                  {t.label}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {paceOptions.length > 0 && (
        <Section title="Ihr Tempo" lead="Wählen Sie, wie oft Sie lernen.">
          <PacePicker options={paceOptions} pace={pace} onPace={onPace} code={code} finishText={finishText} allDone={allDone} />
        </Section>
      )}

      {manifest && manifest.honestyLineDe && (
        <section className="mx-5 mt-7 rounded-[18px] border-2 border-b-4 border-game-line bg-white p-4">
          <h2 className="text-xl font-black">Die Prüfung im Blick</h2>
          {lane && <p className="mt-0.5 text-sm font-extrabold text-course-ink">{laneLabel(lane)}</p>}
          <p className="mt-1.5 text-[0.9375rem] font-bold leading-relaxed text-game-text">{manifest.honestyLineDe}</p>
          {parts.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {parts.map((p) => (
                <li key={p} className="rounded-xl bg-course-wash px-2.5 py-2.5 text-center text-[0.9375rem] font-black text-course-ink">{p}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {links.length > 0 && (
        <Section title="Zum Nachschlagen">
          <ReferenceLinks links={links} />
        </Section>
      )}

      {inhalt.length > 0 && (
        <Section
          id="kursplan-inhalt"
          title="Inhalt"
          lead={`${inhalt.length} Module mit ${kapitelCount} Kapiteln. Tippen Sie auf ein Kapitel, um es zu öffnen.`}
        >
          <InhaltPlan modules={inhalt} />
        </Section>
      )}

      {firstVisit && startHref ? (
        <div className="mx-5 mt-7 flex flex-col gap-3 rounded-[20px] bg-course p-5 text-white shadow-course">
          <p className="text-[1.375rem] font-black leading-snug">
            {stepMinutes ? `Heute: etwa ${stepMinutes} Minuten.` : 'Heute: ein Lernschritt.'}
            {firstUnitTitle ? <> Ihr erstes Kapitel: „{firstUnitTitle}“.</> : null}
          </p>
          <GameButton to={startHref} tone="white" className="w-full">{startLabel}</GameButton>
        </div>
      ) : (
        typeof onClose === 'function' && (
          <div className="mt-7 flex justify-center px-5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-b-4 border-game-line bg-white px-4 py-2 text-[0.9375rem] font-black text-course-ink hover:bg-course-wash"
            >
              <X className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> Kursplan schließen
            </button>
          </div>
        )
      )}
    </div>
  );
}
