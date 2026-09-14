import { useEffect } from 'react';
import { ArrowRight, Stethoscope, Target, ShieldCheck, Mic, ScanSearch, Heart, Users, BookOpen, Briefcase } from 'lucide-react';
import SEO from '../components/SEO';
import { trackAboutViewed } from '../lib/funnelTracking';
import { seoProps } from '../data/seoRoutes.js';
import { ORGANIZATION_FULL } from '../data/organization.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';

const BADGES = [
  { icon: Stethoscope, label: 'Developed by doctors in Germany' },
  { icon: Target, label: 'Built for serious learners' },
  { icon: ShieldCheck, label: 'Optional analytics only with consent' },
];

const DIFFERENTIATORS = [
  {
    icon: Mic,
    title: 'Real speaking, not just clicking',
    body: 'Practice complete responses and receive AI feedback on pronunciation, grammar, and vocabulary—not only multiple-choice drills.',
  },
  {
    icon: ScanSearch,
    title: 'Grammar that makes sense',
    body: 'Sentence X-Ray breaks down real sentences so you can understand why the language works, not only what the answer is.',
  },
  {
    icon: Heart,
    title: 'Built by people who faced the same barrier',
    body: 'Deutschmeister is developed by a team of doctors in Germany who know what it means when language stands between you and your work or daily life.',
  },
];

const ROADMAP = [
  { icon: BookOpen, text: 'More levels, including C1 and beyond' },
  { icon: Target, text: 'Live exam simulations for Goethe, telc, and TestDaF' },
  { icon: Briefcase, text: 'Specialist modules for nursing and business German' },
  { icon: Users, text: 'A learning community for practising with others' },
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
      <section className="relative pt-28 pb-20 overflow-hidden">
        <Aurora />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="hero-line font-display text-[2.25rem] font-semibold leading-[1.02] tracking-[-0.025em] text-ink mb-6 sm:text-[3rem] lg:text-[3.5rem]">
            Learning German should not feel like{' '}
            <span className="text-siegel">a nightmare.</span>
          </h1>
          <p
            className="hero-line text-[1.0625rem] leading-relaxed text-graphite max-w-2xl mx-auto mb-10 sm:text-[1.1875rem]"
            style={{ '--d': '120ms' }}
          >
            Many language apps make learning playful but avoid the difficult parts: speaking freely, understanding grammar, and preparing for a real exam. Deutschmeister focuses on those parts.
          </p>

          <div className="hero-line flex flex-wrap justify-center gap-3" style={{ '--d': '240ms' }}>
            {BADGES.map((badge) => (
              <Chip key={badge.label} tone="quiet" size="md">
                <badge.icon className="w-4 h-4 text-siegel flex-shrink-0" />
                {badge.label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="py-20 bg-white border-y border-rule">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <SectionHeading title="Who is behind Deutschmeister" className="mb-6" />
          <div className="text-[0.9375rem] leading-relaxed text-graphite space-y-4 sm:text-base">
            <Reveal as="p" delay={80}>
              I am Zaid, a doctor living in Germany on an EU Blue Card. I arrived from abroad and worked through the language barrier—through daily life, exams, and conversations where the right words were missing.
            </Reveal>
            <Reveal as="p" delay={160}>
              I watched capable colleagues struggle, not because they lacked professional knowledge, but because their German was not yet strong enough for the medical language exam. That problem stayed with me.
            </Reveal>
            <Reveal as="p" delay={240}>
              I first built MedMeister for doctors preparing for the medical knowledge exam. Then I realised that the same challenge affects many people learning German under pressure: nurses, engineers, students, and families—not only doctors.
            </Reveal>
            <Reveal as="p" delay={320}>
              Today, Deutschmeister is developed by a team of doctors in Germany who have taken the path through German language exams themselves.
            </Reveal>
            <Reveal as="p" delay={400} className="font-medium text-ink">
              Deutschmeister opens that idea to every serious German learner.
            </Reveal>
          </div>
        </div>
      </section>

      {/* FACT DISCIPLINE — the "How" of E-E-A-T, and it happens to be true:
          provenance renders on every guide, counts are measured, and there
          are no reviews on this site until real learners write them.
          Mirrored in scripts/prerender-spa-routes.mjs — keep in sync. */}
      <section className="py-20 bg-paper-sunk">
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
      <section className="py-20">
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
      <section className="py-20 bg-ink">
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
      <section className="py-20">
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
      <section className="border-y border-rule bg-white py-20">
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
