import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight, BookOpen, MessageSquare, CreditCard, GraduationCap, Monitor } from 'lucide-react';
import SEO from '../components/SEO';
import { trackFAQViewed } from '../lib/funnelTracking';
import { FAQ_CATEGORIES, faqPageJsonLd } from '../data/faqContent.js';
import { seoProps } from '../data/seoRoutes.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import { SUPPORT_LINK } from '../data/navigation';

// Content lives in src/data/faqContent.js so the prerender renders the same 21
// answers a crawler needs — the accordion only shows an answer on click, which
// used to leave the FAQPage JSON-LD promising text no crawler could see.
// Icons stay here: lucide components don't belong in a data module.
const CATEGORY_ICONS = {
  'About Deutschmeister': BookOpen,
  'Learning and content': MessageSquare,
  'Pricing and subscription': CreditCard,
  'Exam preparation': GraduationCap,
  'Technical and privacy': Monitor,
};

// An answer is reference material, so the entry is a FLAT card (tokens rule 3):
// hairline border, no resting shadow — nothing here pretends to be a key.
function AccordionItem({ q, a }) {
  return (
    <Card as="details" className="overflow-hidden">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-ink">
        {q}<ChevronDown className="h-5 w-5 shrink-0" aria-hidden="true" />
      </summary>
      <p className="border-t border-rule px-5 py-4 text-sm leading-relaxed text-graphite">{a}</p>
    </Card>
  );
}

const FAQPage = () => {
  useEffect(() => { trackFAQViewed(); }, []);

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <SEO {...seoProps('/faq')} structuredData={faqPageJsonLd()} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="relative overflow-hidden rounded-clay text-center mb-6 py-4">
          <div className="relative">
            <SectionHeading
              size="page"
              level={1}
              align="center"
              title="Frequently asked questions"
              lead="Clear answers about learning, speaking practice, exams, pricing, and privacy."
            />
          </div>
        </div>

        <nav className="mb-8 flex flex-wrap gap-2" aria-label="Question categories">
          {FAQ_CATEGORIES.map((category, i) => <a key={category.title} href={`#faq-category-${i}`} className="rounded-pill border border-rule bg-white px-4 py-2 text-sm font-bold text-siegel-deep">{category.title} <span className="text-graphite">({category.items.length})</span></a>)}
        </nav>
        <p className="mb-8 text-sm text-graphite">Choosing a course? <a href="/courses/" className="font-bold text-siegel-deep underline">See the levels and what is available.</a></p>
        <div className="space-y-12">
          {FAQ_CATEGORIES.map((category, catIdx) => {
            const Icon = CATEGORY_ICONS[category.title] ?? BookOpen;
            return (
            <Reveal as="section" id={`faq-category-${catIdx}`} className="scroll-mt-24" key={category.title} delay={Math.min(catIdx, 8) * 90}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-clay bg-siegel flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {category.title}
                </h2>
              </div>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <AccordionItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </Reveal>
            );
          })}
        </div>

        <Reveal delay={120} className="mt-16 text-center">
          <p className="text-graphite mb-4">Still have questions? Start with A1.1—it is completely free.</p>
          {/* The one primary action on this screen — the only shimmer. */}
          <Button to="/signup" size="lg" shimmer className="group">
            Start for free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          {/* Several answers say "contact support" — this is where that happens. */}
          <p className="mt-6 text-sm text-graphite">
            Your question isn&apos;t here?{' '}
            <Link to={SUPPORT_LINK.href} className="font-bold text-siegel hover:text-siegel-deep">
              {SUPPORT_LINK.labelEn}
            </Link>
          </p>
        </Reveal>
      </div>
    </div>
  );
};

export default FAQPage;
