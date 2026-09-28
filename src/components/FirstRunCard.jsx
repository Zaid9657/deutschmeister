import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import Chip from './ui/Chip.jsx';

// The dashboard's first-run state (work order #6): for a signed-in learner
// with no lesson activity, this card takes the hero's place and carries the
// ONE primary action on the screen — decided by src/lib/firstRun.js, never
// here. Everything else on the dashboard stays, but secondary.
//
// English chrome, like the rest of the dashboard; the German inside „…“ is
// the course's own wording. No minute figure for a Lektion: the test's 15–20
// minutes is the figure its own landing page states (LevelTestLanding.jsx);
// anything this card cannot derive, it does not claim.

const COPY = {
  lesson: (a) => ({
    title: 'Your first lesson: Lektion 1',
    lead: `The free ${a.level.toUpperCase()} course starts with the first „Hallo“ — one short step at a time, right here in your browser.`,
    cta: 'Start Lektion 1',
  }),
  placement: () => ({
    title: 'Find your level first',
    lead: 'The placement test (15–20 min) finds your exact level and the lesson to start with — so you never repeat what you already know.',
    cta: 'Start the placement test',
  }),
  placed: (a) => ({
    title: a.topic?.titleEn || `Your first ${a.level.toUpperCase()} lesson`,
    sub: a.topic?.titleDe,
    lead: `Your placement test suggests ${a.level.toUpperCase()}. Start with its first lesson.`,
    cta: 'Start the lesson',
  }),
  course: () => ({
    title: 'Your free course',
    lead: 'Your placement test suggests you are past the start — every Lektion of the free course is open, so begin wherever you like.',
    cta: 'Open the course',
  }),
};

const ALT_LABEL = {
  placement: 'Already know some German? Find your level first',
  lesson: 'Or start from zero with Lektion 1',
};

export default function FirstRunCard({ action }) {
  if (!action) return null;
  const copy = (COPY[action.kind] || COPY.lesson)(action);
  const alt = action.alternative;
  const primaryProps = action.fullLoad ? { href: action.href } : { to: action.href };

  return (
    <Card raised edge="siegel" className="p-6 sm:p-8" data-first-run={action.kind}>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <Chip tone="label" className="mb-4">
            <Sparkles className="w-3 h-3" />
            Start here
          </Chip>
          <h2 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] sm:text-[2.125rem]">
            {copy.title}
          </h2>
          {copy.sub && (
            <p className="mt-1 text-[0.9375rem] font-bold text-graphite">{copy.sub}</p>
          )}
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite">{copy.lead}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
          <Button {...primaryProps} size="lg" shimmer className="group w-full sm:w-auto">
            {copy.cta}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          {alt && (
            alt.fullLoad ? (
              <a href={alt.href} className="text-sm font-bold text-siegel transition-colors hover:text-siegel-deep">
                {ALT_LABEL[alt.kind]} →
              </a>
            ) : (
              <Link to={alt.href} className="text-sm font-bold text-siegel transition-colors hover:text-siegel-deep">
                {ALT_LABEL[alt.kind]} →
              </Link>
            )
          )}
        </div>
      </div>
    </Card>
  );
}
