import { ClipboardCheck, Clock, BarChart3, Lightbulb, PenTool, Headphones, Mic, ChevronRight, Award, Target } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import Reveal from '../ui/Reveal.jsx';
import Aurora from '../ui/Aurora.jsx';

// The front door of the free funnel — the first screen a stranger meets, so it
// carries the same aurora hero and clay depth as the homepage rather than the
// plain white panel it used to be (docs/design/playbook.md).
//
// Playful Depth reading of this screen: the three steps are what you are about
// to DO, so they rest raised on accent edges; "what you'll receive" is
// reference material and stays flat; the pro tip is a caution, so it takes the
// aprikose wash and says so in words. One primary action, and it is the only
// shimmer on the page.

const FACTS = [
  { key: 'minutes', icon: Clock, value: '15-20', label: 'Minutes' },
  { key: 'sections', icon: ClipboardCheck, value: '3', label: 'Sections' },
  { key: 'levels', icon: BarChart3, value: 'A1-B2', label: 'Levels' },
];

const STEPS = [
  {
    n: 1,
    icon: PenTool,
    edge: 'limette',
    badge: 'bg-accent-limette-wash text-accent-limette-ink',
    title: 'Written Test',
    body: '40 multiple choice questions on grammar, vocabulary & reading',
    time: '~12 min',
  },
  {
    n: 2,
    icon: Headphones,
    edge: 'aprikose',
    badge: 'bg-accent-aprikose-wash text-accent-aprikose-ink',
    title: 'Listening',
    body: 'Audio exercises with comprehension questions at your level',
    time: '~5 min',
  },
  {
    n: 3,
    icon: Mic,
    edge: 'himbeer',
    badge: 'bg-accent-himbeer-wash text-accent-himbeer-ink',
    title: 'Speaking',
    body: 'Short AI conversation to assess your speaking skills',
    time: '~3 min',
  },
];

const BENEFITS = [
  { icon: Award, title: 'Your CEFR Level', body: 'Precise placement from A1.1 to B2.2' },
  { icon: BarChart3, title: 'Skill Breakdown', body: 'See strengths & weaknesses' },
  { icon: Target, title: 'Personalized Path', body: 'Topics to focus on first' },
];

const LevelTestLanding = ({ onStart }) => {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 pb-16 sm:pt-20">
      {/* Hero */}
      <section className="relative -mx-2 overflow-hidden rounded-clay px-2 py-8 sm:-mx-4 sm:px-4 sm:py-12">
        <Aurora />
        <div className="hero-line relative">
          <SectionHeading
            size="page"
            level={1}
            align="center"
            eyebrow="Free Assessment"
            title="Discover Your German Level"
            lead="Take our comprehensive placement test and get personalized recommendations for your learning journey"
          />
        </div>
      </section>

      {/* At a glance */}
      <Reveal delay={90} className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FACTS.map((fact) => {
          const Icon = fact.icon;
          return (
            <Card key={fact.key} tone="sunk" className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-clay bg-white text-siegel shadow-raise">
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[1.125rem] font-semibold leading-tight text-ink">{fact.value}</span>
                <span className="block font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
                  {fact.label}
                </span>
              </span>
            </Card>
          );
        })}
      </Reveal>

      {/* Test structure */}
      <section className="mt-10">
        <SectionHeading align="center" title="How it works" />
        <div className="mt-5 flex flex-col gap-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.n} delay={90 * i}>
                <Card raised edge={step.edge} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:gap-4">
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-pill font-data text-[0.8125rem] font-bold ${step.badge}`}
                  >
                    {step.n}
                  </span>
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-clay bg-siegel-wash text-siegel">
                    <Icon size={24} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[1.0625rem] font-semibold leading-tight tracking-[-0.005em] text-ink sm:text-[1.125rem]">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[0.875rem] leading-snug text-graphite">{step.body}</p>
                  </div>
                  <Chip tone="quiet" className="ml-auto flex-shrink-0">{step.time}</Chip>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* What you get — reference material, so it stays flat */}
      <section className="mt-10">
        <SectionHeading align="center" title="What you'll receive" />
        <Reveal delay={90} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={benefit.title}
                className="flex flex-row items-center gap-3 p-4 text-left sm:flex-col sm:text-center"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-clay bg-siegel-wash text-siegel">
                  <Icon size={20} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-[0.9375rem] font-bold leading-tight text-ink">{benefit.title}</strong>
                  <span className="mt-1 block text-[0.8125rem] leading-snug text-graphite">{benefit.body}</span>
                </span>
              </Card>
            );
          })}
        </Reveal>
      </section>

      {/* Pro tip — a caution, named in words as well as colour */}
      <Reveal delay={60} className="mt-8">
        <Card tone="aprikose" className="flex items-start gap-3 border-l-4 border-l-accent-aprikose p-4">
          <Lightbulb size={20} className="mt-0.5 flex-shrink-0 text-accent-aprikose-ink" aria-hidden="true" />
          <div className="text-[0.9375rem] leading-relaxed text-accent-aprikose-ink">
            <strong>Pro tip:</strong> Answer honestly and skip questions you're unsure about. This helps us place you accurately — guessing can lead to content that's too difficult.
          </div>
        </Card>
      </Reveal>

      {/* The one primary action on the screen */}
      <Reveal delay={120} className="mt-8 text-center">
        <Button size="lg" shimmer onClick={onStart}>
          Start the Test
          <ChevronRight size={20} />
        </Button>
        <p className="mt-4 font-data text-[0.75rem] text-graphite">
          No account required • Results are instant • 100% free
        </p>
      </Reveal>
    </div>
  );
};

export default LevelTestLanding;
