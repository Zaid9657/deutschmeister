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
  { icon: Stethoscope, label: 'Von Ärzten in Deutschland entwickelt' },
  { icon: Target, label: 'Für ernsthafte Lerner' },
  { icon: ShieldCheck, label: 'DSGVO-konform – Server in der EU' },
];

const DIFFERENTIATORS = [
  {
    icon: Mic,
    title: 'Echtes Sprechen, nicht nur Klicken',
    body: 'KI bewertet deine Aussprache, Grammatik und Wortschatz wie ein echter Prüfer. Keine Multiple-Choice-Show.',
  },
  {
    icon: ScanSearch,
    title: 'Grammatik, die haftet',
    body: 'Sentence X-Ray seziert echte Sätze. Du verstehst das Wieso, nicht nur das Was.',
  },
  {
    icon: Heart,
    title: 'Gebaut von Leuten, die’s selbst durchgemacht haben',
    body: 'Kein Konzern. Ein Team von Ärzten in Deutschland, das weiß, wie es ist, wenn die Sprache zwischen dir und deinem Leben steht.',
  },
];

const ROADMAP = [
  { icon: BookOpen, text: 'Mehr Sprachstufen — C1 und darüber hinaus' },
  { icon: Target, text: 'Live-Prüfungssimulationen für Goethe / telc / TestDaF' },
  { icon: Briefcase, text: 'Spezialisierte Module: Pflegedeutsch, Wirtschaftsdeutsch' },
  { icon: Users, text: 'Community — lerne mit anderen, nicht allein' },
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
            Deutsch lernen sollte nicht{' '}
            <span className="text-siegel">dein Albtraum</span>{' '}
            sein.
          </h1>
          <p
            className="hero-line text-[1.0625rem] leading-relaxed text-graphite max-w-2xl mx-auto mb-10 sm:text-[1.1875rem]"
            style={{ '--d': '120ms' }}
          >
            Die meisten Apps machen Sprachenlernen zum Spiel — und umgehen dabei das Schwere: echtes Sprechen, echte Grammatik, echte Prüfungsvorbereitung. Deutschmeister macht das Gegenteil.
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
          <SectionHeading title="Wer steckt dahinter" className="mb-6" />
          <div className="text-[0.9375rem] leading-relaxed text-graphite space-y-4 sm:text-base">
            <Reveal as="p" delay={80}>
              Ich bin Zaid. Arzt, Blue Card, Deutschland. Ich bin von außen gekommen und habe mich durch die Sprachbarriere gekämpft — jeden Tag, jede Prüfung, jedes Gespräch, bei dem mir die Worte fehlten.
            </Reveal>
            <Reveal as="p" delay={160}>
              Ich habe Kollegen scheitern sehen. Nicht, weil sie dumm waren. Sondern weil ihr Deutsch nicht gut genug war. Brillante Ärzte, die an der Fachsprachprüfung hängengeblieben sind. Das hat mich nicht losgelassen.
            </Reveal>
            <Reveal as="p" delay={240}>
              Zuerst habe ich MedMeister gebaut — eine Plattform speziell für Ärzte, die sich auf die Kenntnisprüfung vorbereiten. Dann habe ich gemerkt: Das gleiche Problem trifft jeden, der Deutsch unter Druck lernt. Nicht nur Mediziner. Pflegekräfte, Ingenieure, Studenten, Familien.
            </Reveal>
            <Reveal as="p" delay={320}>
              Heute steht hinter Deutschmeister ein Team von Ärzten in Deutschland — Leute, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind und die Plattform weiterentwickeln.
            </Reveal>
            <Reveal as="p" delay={400} className="font-medium text-ink">
              Deutschmeister ist diese Idee — für alle geöffnet.
            </Reveal>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title="Warum Deutschmeister anders ist"
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
            Unsere Mission
          </Reveal>
          <Reveal as="p" delay={80} className="text-[1.0625rem] leading-relaxed text-rule sm:text-[1.1875rem]">
            Den Menschen, die wirklich Deutsch brauchen — Migranten, Ärzte, Pflegekräfte, Studenten — das Werkzeug geben, das sie verdienen. Nicht das günstigste. Das beste. Weil ihre Zukunft davon abhängt, ob sie verstanden werden.
          </Reveal>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title="Was kommt als Nächstes"
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

      {/* CTA */}
      <section className="py-24 bg-ink">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Reveal as="h2" className="font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] text-white mb-8 sm:text-[3rem]">
            Bereit anzufangen?
          </Reveal>
          <Reveal delay={80} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* The one primary action on this screen — the only shimmer. */}
            <Button to="/signup" size="lg" shimmer className="group w-full sm:w-auto">
              Kostenlos testen
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button href="/pricing/" size="lg" variant="secondary" className="group w-full sm:w-auto">
              Preise ansehen
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default UeberUnsPage;
