import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ArrowRight,
  Mic,
  ScanSearch,
  GraduationCap,
  Brain,
  Clock,
  Wallet,
  Check,
  X,
  Minus,
} from 'lucide-react';
import SEO from '../components/SEO';
import StatsBar from '../components/StatsBar';
import competitorComparisons from '../data/competitorComparisons';
import {
  trackComparisonPageViewed,
  trackComparisonCtaClicked,
} from '../lib/funnelTracking';
import Button from '../components/ui/Button';

const ICON_MAP = {
  Mic,
  ScanSearch,
  GraduationCap,
  Brain,
  Clock,
  Wallet,
};

function StatusIcon({ text }) {
  if (text.startsWith('✓'))
    return <Check className="w-4 h-4 text-siegel flex-shrink-0 mt-0.5" />;
  if (text.startsWith('✗'))
    return <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />;
  if (text.startsWith('○'))
    return <Minus className="w-4 h-4 text-siegel flex-shrink-0 mt-0.5" />;
  return null;
}

function stripPrefix(text) {
  return text.replace(/^[✓✗○]\s*/, '');
}

function FaqItem({ q, a }) {
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

export default function ComparisonPage() {
  const { slug } = useParams();
  const data = competitorComparisons[slug];

  useEffect(() => {
    if (data) trackComparisonPageViewed(data.displayName);
  }, [data]);

  if (!data) return <Navigate to="/vergleich" replace />;

  return (
    <div className="min-h-screen bg-paper">
      <SEO
        title={`Deutschmeister vs ${data.displayName} — Vergleich`}
        description={`${data.heroHeadline} Vergleiche Deutschmeister und ${data.displayName}: Features, Preise, Sprechtraining, Prüfungsvorbereitung. Ehrlich und fair.`}
        keywords={`Deutschmeister vs ${data.displayName}, ${data.displayName} Alternative, Deutsch lernen Vergleich, ${data.displayName} Erfahrungen`}
        path={`/vergleich/${data.slug}`}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: `Deutschmeister vs ${data.displayName} — Vergleich`,
          description: data.heroSubheadline,
          author: { '@type': 'Organization', '@id': 'https://deutsch-meister.de/#organization', name: 'DeutschMeister' },
          publisher: { '@type': 'Organization', '@id': 'https://deutsch-meister.de/#organization', name: 'DeutschMeister' },
          datePublished: '2026-05-28',
          dateModified: '2026-05-28',
        }}
      />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 bg-siegel-wash text-siegel-deep text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Vergleich
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink mb-4 leading-tight">
              {data.heroHeadline}
            </h1>
            <p className="text-lg text-graphite max-w-2xl mx-auto mb-8">
              {data.heroSubheadline}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button to="/signup" onClick={() => trackComparisonCtaClicked(data.displayName, 'hero-signup')}>
                Kostenlos testen
                <ArrowRight className="w-4 h-4" />
              </Button>
              <a
                href="/pricing/"
                onClick={() => trackComparisonCtaClicked(data.displayName, 'hero-pricing')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-rule text-ink font-medium rounded-xl hover:bg-siegel-wash transition-colors"
              >
                Preise ansehen
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-10"
          >
            Feature-Vergleich
          </motion.h2>

          {/* Desktop table */}
          <div className="hidden md:block">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-sm border border-rule overflow-hidden"
            >
              <div className="grid grid-cols-[1fr_1fr_1fr] bg-paper border-b border-rule">
                <div className="px-6 py-4 font-semibold text-graphite text-sm">Feature</div>
                <div className="px-6 py-4 font-semibold text-siegel text-sm">DeutschMeister</div>
                <div className="px-6 py-4 font-semibold text-graphite text-sm">{data.displayName}</div>
              </div>
              {data.comparisonTable.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[1fr_1fr_1fr] ${i % 2 === 0 ? 'bg-white' : 'bg-paper/50'} ${i < data.comparisonTable.length - 1 ? 'border-b border-rule' : ''}`}
                >
                  <div className="px-6 py-4 text-sm font-medium text-ink">{row.feature}</div>
                  <div className="px-6 py-4 text-sm text-graphite">
                    <div className="flex items-start gap-2">
                      <StatusIcon text={row.us} />
                      <span>{stripPrefix(row.us)}</span>
                    </div>
                  </div>
                  <div className="px-6 py-4 text-sm text-graphite">
                    <div className="flex items-start gap-2">
                      <StatusIcon text={row.them} />
                      <span>{stripPrefix(row.them)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-4">
            {data.comparisonTable.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-xl border border-rule p-4 shadow-sm"
              >
                <p className="font-medium text-ink text-sm mb-3">{row.feature}</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-siegel min-w-[24px] mt-0.5">DM</span>
                    <StatusIcon text={row.us} />
                    <span className="text-sm text-graphite">{stripPrefix(row.us)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-graphite min-w-[24px] mt-0.5">{data.displayName.substring(0, 2).toUpperCase()}</span>
                    <StatusIcon text={row.them} />
                    <span className="text-sm text-graphite">{stripPrefix(row.them)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-10"
          >
            Warum Deutschmeister statt {data.displayName}
          </motion.h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {data.whyUsBlocks.map((block, i) => {
              const Icon = ICON_MAP[block.icon] || GraduationCap;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl border border-rule p-6 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-md bg-siegel flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-ink mb-2">{block.title}</h3>
                  <p className="text-sm text-graphite leading-relaxed">{block.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <StatsBar />

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-10"
          >
            Häufige Fragen: Deutschmeister vs {data.displayName}
          </motion.h2>
          <div className="space-y-3">
            {data.faq.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <FaqItem {...item} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-ink rounded-lg p-8 sm:p-12 text-center"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
              {data.ctaHeadline}
            </h2>
            <p className="text-graphite mb-8">{data.ctaSubtext}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button to="/signup" onClick={() => trackComparisonCtaClicked(data.displayName, 'bottom-signup')}>
                Kostenlos starten
                <ArrowRight className="w-4 h-4" />
              </Button>
              <a
                href="/pricing/"
                onClick={() => trackComparisonCtaClicked(data.displayName, 'bottom-pricing')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-paper/30 text-paper font-medium rounded-md hover:bg-paper/10 transition-colors"
              >
                Preise ansehen
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto px-4 pb-12 text-center">
        <p className="text-xs text-graphite">
          Vergleichsdaten Stand: Mai 2026. Wir vergleichen objektiv und nach UWG §6 zulässig.
        </p>
      </div>
    </div>
  );
}
