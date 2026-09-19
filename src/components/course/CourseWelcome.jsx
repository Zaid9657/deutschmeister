import { Clock3, Users } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import Reveal from '../ui/Reveal.jsx';
import CourseOutcomes from './CourseOutcomes.jsx';
import CharacterAvatar from '../illustrations/CharacterAvatar.jsx';

// The welcome screen of the free A1.1 course — the orientation a lost
// first-time learner needs before the path makes sense: what this is, how one
// Lektion works, how long it takes, who the people in the dialogues are, what
// they will be able to do, and the one thing to press.
//
// English chrome (the course home is an English document; the German inside
// the quotes is the course's own wording). Everything with a number in it is
// read from `curriculum` / `meta` (src/data/curricula/a11.meta.js), which
// derive it from the Lektionen — no figure is typed here.
//
// Props
//   curriculum    CURRICULUM_A11 (or any rebuilt curriculum)
//   meta          A11_META — chapters, characters, howItWorksEn, weeklyEstimate, outcomesEn, aboutEn
//   startHref     where "Start Lektion 1" goes; defaults to the first Lektion of the course
//   placementHref the placement test; defaults to the prerendered /level-test/ (trailing slash — case 2)
//
// Tokens rule 2: `siegel` is the only interactive colour, and the primary
// Button is the one primary action on the screen. The avatar circles render
// `CharacterAvatar` (src/components/illustrations/, Wave 2) — a flat-vector
// bust until the owner's photo lands in a11.art.js, never a colour swap. No
// case colours: nothing on this screen names a grammatical case.

export default function CourseWelcome({ curriculum, meta, startHref, placementHref = '/level-test/', className = '' }) {
  if (!curriculum || !meta) return null;
  const level = curriculum.level;
  const firstNr = curriculum.lektionen[0]?.nr ?? 1;
  const start = startHref || `/course/${level}/l/${firstNr}`;
  const time = meta.weeklyEstimate(curriculum);
  const how = meta.howItWorksEn;
  const characters = meta.characters ?? [];

  return (
    <section className={`mx-auto max-w-2xl px-4 ${className}`.trim()} aria-labelledby="dm-course-welcome">
      {/* ── what this course is ─────────────────────────────────────────── */}
      <Reveal>
        <Chip tone="label">{curriculum.code} · Free course</Chip>
        <h1 id="dm-course-welcome" className="mt-3 font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.022em] text-ink sm:text-[2.5rem]">
          German {curriculum.code}, from the first „Hallo“
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite sm:text-base">{meta.aboutEn}</p>
      </Reveal>

      {/* ── the one thing to press ─────────────────────────────────────── */}
      <Reveal delay={60} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button to={start} variant="primary" size="lg" shimmer className="w-full sm:w-auto">
          Start Lektion {firstNr} — no account needed
        </Button>
        {/* No minute figure here: the test's own landing page (LevelTestLanding.jsx) says
            15–20 minutes, and a figure this screen cannot derive is a figure it must not claim. */}
        <Button to={placementHref} variant="secondary" className="w-full sm:w-auto">
          Not sure {curriculum.code} is your level? Take the placement test
        </Button>
      </Reveal>

      {/* ── how a Lektion works ────────────────────────────────────────── */}
      <Reveal delay={100} as="section" aria-labelledby="dm-how-it-works" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="dm-how-it-works" className="font-display text-xl font-semibold leading-tight text-ink">How a Lektion works</h2>
          <p className="font-data text-[0.75rem] text-graphite">about {how.minutesPerLektion} min each</p>
        </div>
        <ol className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {how.steps.map((step, i) => (
            <li key={step.key} className="flex w-36 shrink-0 snap-start flex-col rounded-clay border border-rule bg-white p-3">
              <span className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-siegel-deep">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="mt-1 font-bold text-ink">{step.label}</span>
              <span className="mt-1 text-[0.8125rem] leading-snug text-graphite">{step.descriptionEn}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 font-data text-[0.6875rem] text-graphite">
          Swipe for the rest. The warm-up appears once you have review cards due.
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
              About {how.minutesPerLektion} minutes per Lektion · about {time.hoursPerWeek} hours a week
            </p>
            <p className="mt-0.5 text-[0.875rem] leading-relaxed text-graphite">
              At {time.unitsPerWeek} units a week — a pace you can hold next to a job — the {time.units} units
              ({curriculum.lektionen.length} Lektionen, {curriculum.checkpoints.length} checkpoints and the final test) take
              about {time.weeks} weeks. Faster is fine; slower is fine too. Nothing here locks.
            </p>
          </div>
        </Card>
      </Reveal>

      {/* ── who you will meet ──────────────────────────────────────────── */}
      {characters.length > 0 && (
        <Reveal delay={180} as="section" aria-labelledby="dm-course-cast" className="mt-10">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-siegel" aria-hidden="true" />
            <h2 id="dm-course-cast" className="font-display text-xl font-semibold leading-tight text-ink">Who you will meet</h2>
          </div>
          <p className="mt-1 text-[0.875rem] text-graphite">
            The same people run through all {curriculum.lektionen.length} dialogues, so each new one starts on familiar ground.
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {characters.map((c) => (
              <li key={c.name} className="flex items-start gap-3 rounded-clay border border-rule bg-white p-3">
                <span className="shrink-0 overflow-hidden rounded-full bg-siegel-wash" data-avatar-slot={c.name}>
                  <CharacterAvatar name={c.name} size={44} />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-ink">{c.name}</p>
                  <p className="text-[0.8125rem] leading-snug text-graphite">{c.roleEn}</p>
                  <p className="mt-1 font-data text-[0.6875rem] text-graphite">
                    From Lektion {c.firstLektion}
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
        <CourseOutcomes code={curriculum.code} outcomes={meta.outcomesEn} />
      </Reveal>

      {/* ── the same door again, for whoever read to the end ───────────── */}
      <Reveal delay={260} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button to={start} variant="primary" size="lg" className="w-full sm:w-auto">
          Start Lektion {firstNr} — no account needed
        </Button>
        <p className="font-data text-[0.75rem] text-graphite">Your progress is kept in this browser until you choose to save it.</p>
      </Reveal>
    </section>
  );
}
