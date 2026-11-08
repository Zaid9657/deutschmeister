import { useEffect } from 'react';
import { ArrowRight, Stethoscope, Target, ShieldCheck, Mic, ScanSearch, Heart, BookOpen, Briefcase } from 'lucide-react';
import SEO from '../components/SEO';
import { trackAboutViewed } from '../lib/funnelTracking';
import { seoProps } from '../data/seoRoutes.js';
import { ORGANIZATION_FULL } from '../data/organization.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import CourseMoment from '../components/ui/CourseMoment.jsx';
import { FOUNDER_LINE_EN, GRAMMAR_TOPIC_COUNT, LEVEL_COUNT, FREE_LEVEL_LABEL } from '../data/marketing.js';

const BADGES = [
  { icon: Stethoscope, label: 'Built from experience' },
  { icon: Target, label: 'Built for serious learners' },
  { icon: ShieldCheck, label: 'Optional analytics only with consent' },
];

const DIFFERENTIATORS = [
  {
    icon: Mic,
    title: 'Real speaking, not just clicking',
    body: 'Practice complete responses and receive AI feedback on grammar, vocabulary and clarity—not only multiple-choice drills.',
  },
  {
    icon: ScanSearch,
    title: 'Grammar that makes sense',
    body: 'Sentence X-Ray breaks down real sentences so you can understand why the language works, not only what the answer is.',
  },
  {
    icon: Heart,
    title: 'Built from experience',
    body: FOUNDER_LINE_EN,
  },
];

const ROADMAP = [
  { icon: BookOpen, text: 'More guided courses in level order' },
  { icon: Target, text: 'Exam preparation after each complete level' },
  { icon: Briefcase, text: 'Clear availability information as each course is ready' },
];

const UeberUnsPage = () => {
  useEffect(() => { trackAboutViewed(); }, []);

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <SEO
        {...seoProps('/ueber-uns')}
        // Was an inline literal with no @id, so the node Helmet added on mount
        // was a SECOND, unequal organisation sitting beside the prerendered one
        // that does carry @id — the exact entity split src/data/organization.js
        // exists to prevent. Same constant both sides: one entity, one @id.
        structuredData={{ '@context': 'https://schema.org', ...ORGANIZATION_FULL }}
      />

      {/* HERO */}
      <section className="dm-public-heading relative pt-24 pb-12 overflow-hidden">


        <div className="relative z-10 max-w-6xl mx-auto px-5 dm-about-grid">
          <div>
          <p className="mb-4 font-data text-xs font-bold uppercase tracking-widest text-siegel-deep">Our reason to build</p>
          <h1 className="hero-line font-display text-dm-editorial sm:text-dm-editorial-wide text-ink mb-6">
            A language opens doors.{' '}
            <span className="text-siegel-deep">Let’s open yours.</span>
          </h1>
          <p
            className="hero-line text-[1.0625rem] leading-relaxed text-graphite max-w-2xl mx-auto mb-10 sm:text-[1.1875rem]"
            style={{ '--d': '120ms' }}
          >
            {FOUNDER_LINE_EN}
          </p>

          <div className="mb-6 flex flex-wrap gap-3">
            <Button href="/course/a1.1">Start A1.1 free</Button>
            <Button href="/courses/a1-2/" variant="secondary">Inspect the A1.2 course</Button>
          </div>
          <div className="hero-line flex flex-wrap gap-3" style={{ '--d': '240ms' }}>
            {BADGES.map((badge) => (
              <Chip key={badge.label} tone="quiet" size="md">
                <badge.icon className="w-4 h-4 text-siegel flex-shrink-0" />
                {badge.label}
              </Chip>
            ))}
          </div>
          </div>
          <div className="self-center"><CourseMoment /><a className="mt-4 inline-block font-bold text-siegel-deep underline underline-offset-4" href="/course/a1.1">Explore the free first course →</a></div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 pb-8">
        <dl className="grid gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-3" aria-label="Inspect the product">
          <div className="bg-white p-5"><dt className="font-data text-2xl">{GRAMMAR_TOPIC_COUNT}</dt><dd className="mt-2 text-sm text-graphite">Public grammar topics to inspect</dd></div>
          <div className="bg-white p-5"><dt className="font-data text-2xl">{LEVEL_COUNT}</dt><dd className="mt-2 text-sm text-graphite">Practice levels, with guided courses built in order</dd></div>
          <div className="bg-white p-5"><dt className="font-data text-2xl">{FREE_LEVEL_LABEL}</dt><dd className="mt-2 text-sm text-graphite">The free first course · no account needed</dd></div>
        </dl>
      </div>

      {/* FOUNDER */}
      <section className="py-12 bg-white border-y border-rule">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <SectionHeading title="Who is behind Deutschmeister" className="mb-6" />
          <div className="text-[0.9375rem] leading-relaxed text-graphite space-y-4 sm:text-base">
            <Reveal as="p" delay={80}>
              The learning path begins with the free A1.1 course. A1.2 is the next guided course; later courses follow level by level.
            </Reveal>
            <Reveal as="p" delay={160}>
              Inspect a real task before creating an account. Course demonstrations show their source and distinguish automatic form checks from AI feedback.
            </Reveal>
            <Reveal as="p" delay={400} className="font-medium text-ink">
              DeutschMeister brings that learning path to everyday conversations, work and exams.
            </Reveal>
          </div>
        </div>
      </section>

      {/* FACT DISCIPLINE — the "How" of E-E-A-T, and it happens to be true:
          provenance renders on every guide, counts are measured, and there
          are no reviews on this site until real learners write them.
          Mirrored in scripts/prerender-spa-routes.mjs — keep in sync. */}
      <section className="py-12 bg-paper-sunk">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <SectionHeading title="How we handle factual claims" className="mb-6" />
          <div className="text-[0.9375rem] leading-relaxed text-graphite space-y-4 sm:text-base">
            <Reveal as="p" delay={80}>
              Exam facts carry a visible review date and their sources on the page itself. If an exam provider
              changes something, you can see when we last checked it.
            </Reveal>
            <Reveal as="p" delay={160}>
              Every published content count is measured against the product data rather than estimated. If we
              have not measured it, we do not publish a number.
            </Reveal>
            <Reveal as="p" delay={240}>
              We do not invent reviews. Testimonials will appear only after real learners provide them and give
              permission for publication.
            </Reveal>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title="What makes Deutschmeister different"
            align="center"
            className="mb-12"
          />

          <div className="grid sm:grid-cols-3 gap-6">
            {DIFFERENTIATORS.map((card, i) => (
              <Reveal key={card.title} delay={90 * i}>
                <Card raised className="h-full p-6">
                  <div className="w-12 h-12 rounded-clay bg-siegel flex items-center justify-center mb-4">
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-ink mb-2">{card.title}</h3>
                  <p className="text-sm text-graphite leading-relaxed">{card.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-12 bg-ink">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <Reveal as="h2" className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-white mb-6 sm:text-[2.125rem]">
            Our mission
          </Reveal>
          <Reveal as="p" delay={80} className="text-[1.0625rem] leading-relaxed text-rule sm:text-[1.1875rem]">
            To give people who genuinely need German—migrants, doctors, nurses, students, and professionals—focused tools for being understood in real life, at work, and in exams.
          </Reveal>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title="What comes next"
            align="center"
            className="mb-8"
          />
          <div className="space-y-4">
            {ROADMAP.map((item, i) => (
              <Reveal key={item.text} delay={90 * i}>
                {/* Reference list, not a control: flat hairline card (rule 3). */}
                <Card className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 rounded-clay bg-siegel-wash flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-siegel" />
                  </div>
                  <p className="text-ink font-medium pt-2">{item.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL CAPTURE — feedback is reviewed and permissioned before publication. */}
      <section className="border-y border-rule bg-white py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <Reveal as="h2" className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink sm:text-[2.125rem]">
            Real stories start with permission
          </Reveal>
          <Reveal as="p" delay={80} className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-graphite sm:text-base">
            Used Deutschmeister? Tell us what helped and what should improve. Submissions are reviewed, verified where possible, and never published automatically.
          </Reveal>
          <Reveal delay={160} className="mt-7">
            <Button href="/share-your-story/" size="lg" variant="secondary">Share your experience</Button>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Reveal as="h2" className="font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] text-white mb-8 sm:text-[3rem]">
            Ready to begin?
          </Reveal>
          <Reveal delay={80} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* The one primary action on this screen — the only shimmer. */}
            <Button to="/signup" size="lg" shimmer className="group w-full sm:w-auto">
              Start for free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button href="/pricing/" size="lg" variant="secondary" className="group w-full sm:w-auto">
              View pricing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default UeberUnsPage;
