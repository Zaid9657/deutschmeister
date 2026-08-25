import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight, BookOpen, MessageSquare, CreditCard, GraduationCap, Monitor } from 'lucide-react';
import SEO from '../components/SEO';
import { trackFAQViewed } from '../lib/funnelTracking';
import { FAQ_CATEGORIES, faqPageJsonLd } from '../data/faqContent.js';
import { seoProps } from '../data/seoRoutes.js';
import Button from '../components/ui/Button';

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

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-rule rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
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
    </div>
  );
}

const FAQPage = () => {
  useEffect(() => { trackFAQViewed(); }, []);

  return (
    <div className="min-h-screen bg-paper">
      <SEO {...seoProps('/faq')} structuredData={faqPageJsonLd()} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink mb-4">
            Häufige Fragen
          </h1>
          <p className="text-lg text-graphite max-w-xl mx-auto">
            Alles, was du über Deutschmeister wissen musst — kurz und ehrlich.
          </p>
        </motion.div>

        <div className="space-y-12">
          {FAQ_CATEGORIES.map((category, catIdx) => {
            const Icon = CATEGORY_ICONS[category.title] ?? BookOpen;
            return (
            <motion.section
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * catIdx }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-md bg-siegel flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-display text-xl font-bold text-ink">
                  {category.title}
                </h2>
              </div>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <AccordionItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </motion.section>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-graphite mb-4">Noch Fragen? Einfach loslegen — A1.1 ist komplett kostenlos.</p>
          <Button to="/signup" size="lg" className="group">
            Kostenlos starten
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQPage;
