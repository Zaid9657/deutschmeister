import { Check, Headphones, Mic, RefreshCw, X, Zap } from 'lucide-react';
import CastAvatar from '../CastAvatar.jsx';
import { laneLabel } from '../content.js';
import EtappenPlan from './EtappenPlan.jsx';
import GameButton from './GameButton.jsx';
import PacePicker from './PacePicker.jsx';
import { hueVars } from './hue.js';

// The COURSE PLAN (#kursplan): what the course is, what the learner can do after
// it, what is in it (manifest content counts only), how a learning day goes, the
// pace, the four Etappen and the exam in view. It opens the page on a first visit
// and folds out of „Kursplan ansehen" afterwards. Every number is the manifest's;
// a section whose data a level does not have (no showcase yet, units still coming)
// is left out rather than filled with placeholders.

const CAST = ['Priya', 'Olena', 'Bilal', 'Emre'];
const TILE_HUES = ['gruen', 'orange', 'beere', 'tuerkis'];

const H2 = 'text-2xl font-black leading-tight';

function Section({ title, lead = null, children }) {
  return (
    <section className="px-5 pt-7">
      <h2 className={H2}>{title}</h2>
      {lead && <p className="mt-1.5 text-base font-bold leading-relaxed text-game-muted">{lead}</p>}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function reviewLine(manifest) {
  const days = (manifest && manifest.review && Array.isArray(manifest.review.ladderDays) ? manifest.review.ladderDays : []).slice(0, 3);
  const spaced = days.length === 3 ? ` Mit Konto kommen Ihre Wörter nach ${days[0]}, ${days[1]} und ${days[2]} Tagen wieder.` : '';
  return `Nach jeder Etappe wartet eine Schatzkiste: Wiederholung mit Prüfungsteilen.${spaced}`;
}

export default function PlanOverview({
  manifest, code, level, firstVisit = true, startHref = null, startLabel = '', firstUnitTitle = null,
  tiles = [], etappen = [], parts = [], stepMinutes = null,
  paceOptions = [], pace, onPace, finishText = null, allDone = false, onClose,
}) {
  const title = (manifest && manifest.title && manifest.title.de) || `Kurs ${code}`;
  const showcase = (manifest && manifest.showcase) || null;
  const free = manifest && manifest.priceKey === null;
  const a1 = String(level || '').startsWith('a1');
  const lane = manifest && manifest.lanes && manifest.lanes.primary;
  const TitleTag = firstVisit ? 'h1' : 'h2';

  const how = [
    { icon: Headphones, title: '1. Hören und mitlesen', text: 'Eine kurze Szene aus dem Alltag: erst hören, dann den Text mitlesen.' },
    { icon: Zap, title: '2. Kurz üben', text: 'Kleine Aufgaben mit sofortigem Feedback. Was nicht klappt, kommt gleich noch einmal.' },
    { icon: Mic, title: '3. Selbst sprechen und schreiben', text: 'Die KI hört zu, liest mit und sagt Ihnen, was schon gut ist und was Sie noch verbessern können.' },
    { icon: RefreshCw, title: '4. Wiederholen, bevor Sie vergessen', text: reviewLine(manifest) },
  ];

  return (
    <div id="kursplan" className="scroll-mt-36 pb-8">
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

      <Section
        title="So lernen Sie jeden Tag"
        lead={stepMinutes ? `Ein Lernschritt dauert etwa ${stepMinutes} Minuten – kurz genug für jeden Tag.` : null}
      >
        <ol className="flex flex-col gap-2.5">
          {how.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} style={hueVars(TILE_HUES[i % TILE_HUES.length])} className="flex items-center gap-3.5 rounded-2xl border-2 border-b-4 border-game-line bg-white p-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[color:var(--hue)]" aria-hidden="true">
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.4} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[1.0625rem] font-black leading-snug">{s.title}</span>
                  <span className="block text-[0.9375rem] font-bold leading-snug text-game-muted">{s.text}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </Section>

      {paceOptions.length > 0 && (
        <Section title="Ihr Tempo" lead="Wählen Sie, wie oft Sie lernen.">
          <PacePicker options={paceOptions} pace={pace} onPace={onPace} code={code} finishText={finishText} allDone={allDone} />
        </Section>
      )}

      {etappen.length > 0 && (
        <Section title={`Ihr Weg in ${etappen.length} Etappen`}>
          <EtappenPlan etappen={etappen} />
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

      {firstVisit && startHref ? (
        <div className="mx-5 mt-7 flex flex-col gap-3 rounded-[20px] bg-course p-5 text-white shadow-course">
          <p className="text-[1.375rem] font-black leading-snug">
            {stepMinutes ? `Heute: etwa ${stepMinutes} Minuten.` : 'Heute: ein Lernschritt.'}
            {firstUnitTitle ? <> Ihre erste Lektion: „{firstUnitTitle}“.</> : null}
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
