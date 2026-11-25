import { Clock3, Users } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import Reveal from '../ui/Reveal.jsx';
import CourseOutcomes from './CourseOutcomes.jsx';
import CharacterAvatar from '../illustrations/CharacterAvatar.jsx';
import { useLessonLang } from '../../lib/lesson/strings.js';

// The welcome screen of the free A1.1 course — the orientation a lost
// first-time learner needs before the path makes sense: what this is, how one
// Lektion works, how long it takes, who the people in the dialogues are, what
// they will be able to do, and the one thing to press.
//
// The panel follows the language toggle of the course home: English by default,
// German (Sie) in Deutsch-Modus, where it stayed English until 2026-11-25. The
// German inside the quotes is the course's own wording. Everything with a number in it is
// read from `curriculum` / `meta` (src/data/curricula/a11.meta.js), which
// derive it from the Lektionen — no figure is typed here.
//
// Props
//   curriculum    CURRICULUM_A11 (or any rebuilt curriculum)
//   meta          A11_META — chapters, characters, howItWorksEn, weeklyEstimate, outcomesEn/De, aboutEn/De
//   startHref     where "Start Lektion 1" goes; defaults to the first Lektion of the course
//   placementHref the placement test; defaults to the prerendered /level-test/ (trailing slash — case 2)
//
// Tokens rule 2: `siegel` is the only interactive colour, and the primary
// Button is the one primary action on the screen. The avatar circles render
// `CharacterAvatar` (src/components/illustrations/, Wave 2) — a flat-vector
// bust until the owner's photo lands in a11.art.js, never a colour swap. No
// case colours: nothing on this screen names a grammatical case.

export default function CourseWelcome({ curriculum, meta, startHref, placementHref = '/level-test/', className = '' }) {
  const [lang] = useLessonLang();
  const de = lang === 'de';
  if (!curriculum || !meta) return null;
  const level = curriculum.level;
  const firstNr = curriculum.lektionen[0]?.nr ?? 1;
  const start = startHref || `/course/${level}/l/${firstNr}`;
  const time = meta.weeklyEstimate(curriculum);
  const how = meta.howItWorksEn;
  const characters = meta.characters ?? [];
  const returning = characters.filter((c) => c.appearsIn.length > 1).length;

  return (
    <section className={`mx-auto max-w-2xl px-4 ${className}`.trim()} aria-labelledby="dm-course-welcome">
      {/* ── what this course is ─────────────────────────────────────────── */}
      <Reveal>
        <Chip tone="label">{curriculum.code} · {de ? 'Lektion 1 kostenlos' : 'Lektion 1 free'}</Chip>
        {/* h2: the course home's own header carries the page's one <h1> („German A1.1“). */}
        <h2 id="dm-course-welcome" className="mt-3 font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.022em] text-ink sm:text-[2.5rem]">
          {de ? `Deutsch ${curriculum.code}, vom ersten „Hallo“ an` : `German ${curriculum.code}, from the first „Hallo“`}
        </h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite sm:text-base">{de ? meta.aboutDe : meta.aboutEn}</p>
      </Reveal>

      {/* ── the one thing to press ─────────────────────────────────────── */}
      <Reveal delay={60} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button to={start} variant="primary" size="lg" shimmer className="w-full sm:w-auto">
          {de ? `Lektion ${firstNr} starten – ohne Konto` : `Start Lektion ${firstNr} — no account needed`}
        </Button>
        {/* No minute figure here: the test's own landing page (LevelTestLanding.jsx) says
            15–20 minutes, and a figure this screen cannot derive is a figure it must not claim. */}
        <Button to={placementHref} variant="secondary" className="w-full sm:w-auto">
          {de ? `Nicht sicher, ob ${curriculum.code} Ihr Niveau ist? Zum Einstufungstest` : `Not sure ${curriculum.code} is your level? Take the placement test`}
        </Button>
      </Reveal>

      {/* ── how a Lektion works ────────────────────────────────────────── */}
      <Reveal delay={100} as="section" aria-labelledby="dm-how-it-works" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="dm-how-it-works" className="font-display text-xl font-semibold leading-tight text-ink">{de ? 'So läuft eine Lektion ab' : 'How a Lektion works'}</h2>
          <p className="font-data text-[0.75rem] text-graphite">{de ? `etwa ${how.minutesEstimate.lo}–${how.minutesEstimate.hi} Min. pro Lektion (geschätzt)` : `about ${how.minutesEstimate.lo}–${how.minutesEstimate.hi} min each (estimate)`}</p>
        </div>
        {/* A wrapping grid, not a sideways strip: the steps are an ordinary list, and at 320 px a
            horizontal scroller inside a vertical page failed reflow (WCAG 1.4.10; Codex review).
            Every column count divides the number of steps, so no card stands alone in its row. */}
        <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {how.steps.map((step, i) => (
            <li key={step.key} className="flex min-w-0 flex-col rounded-clay border border-rule bg-white p-3">
              <span className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-siegel-deep">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="mt-1 font-bold text-ink [overflow-wrap:anywhere]">{de ? step.labelDe : step.label}</span>
              <span className="mt-1 text-[0.8125rem] leading-snug text-graphite">{de ? step.descriptionDe : step.descriptionEn}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 font-data text-[0.6875rem] text-graphite">
          {de ? 'Die Wiederholung kommt dazu, sobald Karten fällig sind.' : 'The warm-up appears once you have review cards due.'}
        </p>
      </Reveal>

      {/* ── time ───────────────────────────────────────────────────────── */}
      <Reveal delay={140} className="mt-8">
        <Card tone="sunk" className="flex items-start gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-ink">
              {de
                ? `Etwa ${how.minutesEstimate.lo}–${how.minutesEstimate.hi} Minuten pro Lektion – geschätzt, noch nicht mit Lernenden gemessen`
                : `About ${how.minutesEstimate.lo}–${how.minutesEstimate.hi} minutes per Lektion — an estimate, not yet measured with learners`}
            </p>
            <p className="mt-0.5 text-[0.875rem] leading-relaxed text-graphite">
              {de ? (
                <>
                  Bei {time.unitsPerWeek} Einheiten pro Woche – ein Tempo, das auch neben der Arbeit geht – dauern die {time.units} Einheiten
                  ({curriculum.lektionen.length} Lektionen, {curriculum.checkpoints.length} Checkpoints und der Abschlusstest) etwa {time.weeks} Wochen.
                  Es geht auch schneller oder langsamer. Eine Frist gibt es nicht.
                </>
              ) : (
                <>
                  At {time.unitsPerWeek} units a week — a pace you can hold next to a job — the {time.units} units
                  ({curriculum.lektionen.length} Lektionen, {curriculum.checkpoints.length} checkpoints and the final test) take
                  about {time.weeks} weeks. Faster is fine; slower is fine too. There is no deadline.
                </>
              )}
            </p>
          </div>
        </Card>
      </Reveal>

      {/* ── who you will meet ──────────────────────────────────────────── */}
      {characters.length > 0 && (
        <Reveal delay={180} as="section" aria-labelledby="dm-course-cast" className="mt-10">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-siegel" aria-hidden="true" />
            <h2 id="dm-course-cast" className="font-display text-xl font-semibold leading-tight text-ink">{de ? 'Wen Sie kennenlernen' : 'Who you will meet'}</h2>
          </div>
          <p className="mt-1 text-[0.875rem] text-graphite">
            {de
              ? `${returning} der ${characters.length} Personen kommen in mehreren Lektionen vor, die anderen in einer.`
              : `${returning} of the ${characters.length} people come back in several Lektionen, the others appear in one.`}
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {characters.map((c) => (
              <li key={c.name} className="flex items-start gap-3 rounded-clay border border-rule bg-white p-3">
                <span className="shrink-0 overflow-hidden rounded-full bg-siegel-wash" data-avatar-slot={c.name}>
                  <CharacterAvatar name={c.name} size={44} />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-ink">{c.name}</p>
                  <p className="text-[0.8125rem] leading-snug text-graphite">{de ? c.roleDe : c.roleEn}</p>
                  <p className="mt-1 font-data text-[0.6875rem] text-graphite">
                    {de ? 'Ab' : 'From'} Lektion {c.firstLektion}
                    {c.appearsIn.length > 1 ? ` · in ${c.appearsIn.length} Lektionen` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {/* ── outcomes ───────────────────────────────────────────────────── */}
      <Reveal delay={220} className="mt-10">
        <CourseOutcomes code={curriculum.code} outcomes={de ? meta.outcomesDe : meta.outcomesEn} lang={lang} />
      </Reveal>

      {/* ── the same door again, for whoever read to the end ───────────── */}
      <Reveal delay={260} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button to={start} variant="primary" size="lg" className="w-full sm:w-auto">
          {de ? `Lektion ${firstNr} starten – ohne Konto` : `Start Lektion ${firstNr} — no account needed`}
        </Button>
        <p className="font-data text-[0.75rem] text-graphite">{de ? 'Ihr Fortschritt bleibt in diesem Browser, bis Sie ihn speichern.' : 'Your progress is kept in this browser until you choose to save it.'}</p>
      </Reveal>
    </section>
  );
}
