import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, Gamepad2, Users } from 'lucide-react';
import SEO from '../components/SEO';
import competitorComparisons from '../data/competitorComparisons';
import { trackComparisonHubViewed } from '../lib/funnelTracking';

const ICON_MAP = {
  babbel: Globe,
  duolingo: Gamepad2,
  lingoda: Users,
};

const COLOR_MAP = {
  babbel: 'from-orange-400 to-red-500',
  duolingo: 'from-green-400 to-emerald-500',
  lingoda: 'from-blue-400 to-indigo-500',
};

const competitors = Object.values(competitorComparisons);

export default function VergleichHubPage() {
  useEffect(() => { trackComparisonHubViewed(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
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
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
            Wie schneidet Deutschmeister im Vergleich ab?
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Wir vergleichen uns fair mit den größten Namen. Du entscheidest.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {competitors.map((comp, i) => {
            const Icon = ICON_MAP[comp.slug] || Globe;
            const gradient = COLOR_MAP[comp.slug] || 'from-slate-400 to-slate-500';
            return (
              <motion.div
                key={comp.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/vergleich/${comp.slug}`}
                  className="block bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group h-full"
                >
                  {/* TODO: Replace with actual competitor logo */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-slate-800 mb-2">
                    DeutschMeister vs {comp.displayName}
                  </h2>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                    {comp.positioning}
                  </p>
                  <p className="text-xs text-slate-400 mb-5">{comp.priceRange}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 group-hover:text-amber-700 transition-colors">
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
          <p className="text-slate-500 mb-4">Noch nicht überzeugt?</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/25 hover:from-amber-600 hover:to-rose-600 transition-all"
          >
            Einfach kostenlos ausprobieren
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
