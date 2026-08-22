import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, Gamepad2, Users } from 'lucide-react';
import SEO from '../components/SEO';
import competitorComparisons from '../data/competitorComparisons';
import { trackComparisonHubViewed } from '../lib/funnelTracking';
import Button from '../components/ui/Button';

const ICON_MAP = {
  babbel: Globe,
  duolingo: Gamepad2,
  lingoda: Users,
};

const COLOR_MAP = {
  // Was a two-stop gradient per competitor, approximating brands we do not own
  // and inventing a fourth palette. A comparison tile is navigation: one mark.
  babbel: 'bg-siegel',
  duolingo: 'bg-siegel',
  lingoda: 'bg-siegel',
};

const competitors = Object.values(competitorComparisons);

export default function VergleichHubPage() {
  useEffect(() => { trackComparisonHubViewed(); }, []);

  return (
    <div className="min-h-screen bg-paper">
      <SEO
        title="Vergleich — Deutschmeister vs Babbel, Duolingo, Lingoda"
        description="Wie schneidet Deutschmeister im Vergleich ab? Ehrliche Vergleiche mit Babbel, Duolingo und Lingoda — Features, Preise, Sprechtraining. Du entscheidest."
        keywords="Deutschmeister Vergleich, Babbel Alternative, Duolingo Alternative, Lingoda Alternative, Deutsch lernen Vergleich"
        path="/vergleich"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink mb-4">
            Wie schneidet Deutschmeister im Vergleich ab?
          </h1>
          <p className="text-lg text-graphite max-w-xl mx-auto">
            Wir vergleichen uns fair mit den größten Namen. Du entscheidest.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {competitors.map((comp, i) => {
            const Icon = ICON_MAP[comp.slug] || Globe;
            const mark = COLOR_MAP[comp.slug] || 'bg-graphite';
            return (
              <motion.div
                key={comp.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/vergleich/${comp.slug}`}
                  className="block bg-white rounded-2xl border border-rule p-6 shadow-sm hover:shadow-md hover:border-rule transition-all group h-full"
                >
                  {/* TODO: Replace with actual competitor logo */}
                  <div className={`w-14 h-14 rounded-md ${mark} flex items-center justify-center mb-5`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-ink mb-2">
                    DeutschMeister vs {comp.displayName}
                  </h2>
                  <p className="text-sm text-graphite mb-4 leading-relaxed">
                    {comp.positioning}
                  </p>
                  <p className="text-xs text-graphite mb-5">{comp.priceRange}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-siegel group-hover:text-siegel-deep transition-colors">
                    Vergleichen
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-graphite mb-4">Noch nicht überzeugt?</p>
          <Button to="/signup">
            Einfach kostenlos ausprobieren
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
