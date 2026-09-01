import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight, BookOpen, MessageSquare, CreditCard, GraduationCap, Monitor } from 'lucide-react';
import SEO from '../components/SEO';
import { trackFAQViewed } from '../lib/funnelTracking';
import { FAQ_CATEGORIES, faqPageJsonLd } from '../data/faqContent.js';
import { seoProps } from '../data/seoRoutes.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Aurora from '../components/ui/Aurora.jsx';

// Content lives in src/data/faqContent.js so the prerender renders the same 21
// answers a crawler needs — the accordion only shows an answer on click, which
// used to leave the FAQPage JSON-LD promising text no crawler could see.
// Icons stay here: lucide components don't belong in a data module.
const CATEGORY_ICONS = {
  'Über Deutschmeister': BookOpen,
  'Lernen & Inhalte': MessageSquare,
  'Preise & Abo': CreditCard,
  'Prüfungsvorbereitung': GraduationCap,
  'Technisches': Monitor,
};

// An answer is reference material, so the entry is a FLAT card (tokens rule 3):
// hairline border, no resting shadow — nothing here pretends to be a key.
function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-siegel-wash transition-colors"
      >
        <span className="font-medium text-ink pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-graphite flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pb-5 text-graphite text-sm leading-relaxed border-t border-rule pt-4"
        >
          {a}
        </motion.div>
      )}
    </Card>
  );
}

const FAQPage = () => {
  useEffect(() => { trackFAQViewed(); }, []);

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <SEO {...seoProps('/faq')} structuredData={faqPageJsonLd()} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="relative overflow-hidden rounded-clay text-center mb-16 py-4">
          <Aurora />
          <div className="relative">
            <SectionHeading
              size="page"
              level={1}
              align="center"
              title="Häufige Fragen"
              lead="Alles, was du über Deutschmeister wissen musst — kurz und ehrlich."
            />
          </div>
        </div>

        <div className="space-y-12">
          {FAQ_CATEGORIES.map((category, catIdx) => {
            const Icon = CATEGORY_ICONS[category.title] ?? BookOpen;
            return (
            <Reveal as="section" key={category.title} delay={Math.min(catIdx, 8) * 90}>
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
          <p className="text-graphite mb-4">Noch Fragen? Einfach loslegen — A1.1 ist komplett kostenlos.</p>
          {/* The one primary action on this screen — the only shimmer. */}
          <Button to="/signup" size="lg" shimmer className="group">
            Kostenlos starten
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Reveal>
      </div>
    </div>
  );
};

export default FAQPage;
