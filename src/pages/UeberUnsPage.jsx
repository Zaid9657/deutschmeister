import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Stethoscope, Target, ShieldCheck, Mic, ScanSearch, Heart, Rocket, Users, BookOpen, Briefcase } from 'lucide-react';
import SEO from '../components/SEO';
import { trackAboutViewed } from '../lib/funnelTracking';

const BADGES = [
  { icon: Stethoscope, label: 'Gebaut von einem Arzt' },
  { icon: Target, label: 'Für ernsthafte Lerner' },
  { icon: ShieldCheck, label: 'DSGVO-konform – Server in der EU' },
];

const DIFFERENTIATORS = [
  {
    icon: Mic,
    color: 'from-teal-400 to-emerald-500',
    title: 'Echtes Sprechen, nicht nur Klicken',
    body: 'KI bewertet deine Aussprache, Grammatik und Wortschatz wie ein echter Prüfer. Keine Multiple-Choice-Show.',
  },
  {
    icon: ScanSearch,
    color: 'from-violet-400 to-indigo-500',
    title: 'Grammatik, die haftet',
    body: 'Sentence X-Ray seziert echte Sätze. Du verstehst das Wieso, nicht nur das Was.',
  },
  {
    icon: Heart,
    color: 'from-amber-400 to-rose-500',
    title: 'Gebaut von jemandem, der’s selbst durchgemacht hat',
    body: 'Kein Konzern. Ein Arzt, ein Coder, der weiß wie es ist, wenn die Sprache zwischen dir und deinem Leben steht.',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <SEO
        title="Über uns"
        description="Deutschmeister wurde von Zaid gegründet — Arzt mit Blue Card in Deutschland. Mission: Das beste Werkzeug für alle, die Deutsch wirklich brauchen. KI-Sprechtraining, Sentence X-Ray, Prüfungsvorbereitung von A1 bis B2."
        keywords="Deutschmeister, Über uns, Deutsch lernen, Arzt, Blue Card, KI Sprechtraining, Goethe Prüfung, telc, TestDaF"
        path="/ueber-uns"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'DeutschMeister',
          url: 'https://deutsch-meister.de',
          founder: {
            '@type': 'Person',
            name: 'Zaid',
            jobTitle: 'Arzt & Gründer',
          },
          foundingDate: '2024',
          description: 'KI-gestützte Plattform zum Deutschlernen — Sprechtraining, Grammatik und Prüfungsvorbereitung von A1 bis B2.',
        }}
      />

      {/* HERO */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 60, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1/3 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-amber-200/25 to-rose-200/25 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], rotate: [0, -60, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-200/25 to-indigo-200/25 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
              Deutsch lernen sollte nicht{' '}
              <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">dein Albtraum</span>{' '}
              sein.
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Die meisten Apps machen Sprachenlernen zum Spiel — und umgehen dabei das Schwere: echtes Sprechen, echte Grammatik, echte Prüfungsvorbereitung. Deutschmeister macht das Gegenteil.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm text-slate-700 font-medium"
                >
                  <badge.icon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  {badge.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-6">
              Wer steckt dahinter
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4">
              <p>
                Ich bin Zaid. Arzt, Blue Card, Deutschland. Ich bin von außen gekommen und habe mich durch die Sprachbarriere gekämpft — jeden Tag, jede Prüfung, jedes Gespräch, bei dem mir die Worte fehlten.
              </p>
              <p>
                Ich habe Kollegen scheitern sehen. Nicht, weil sie dumm waren. Sondern weil ihr Deutsch nicht gut genug war. Brillante Ärzte, die an der Fachsprachprüfung hängengeblieben sind. Das hat mich nicht losgelassen.
              </p>
              <p>
                Zuerst habe ich MedMeister gebaut — eine Plattform speziell für Ärzte, die sich auf die Kenntnisprüfung vorbereiten. Dann habe ich gemerkt: Das gleiche Problem trifft jeden, der Deutsch unter Druck lernt. Nicht nur Mediziner. Pflegekräfte, Ingenieure, Studenten, Familien.
              </p>
              <p className="font-medium text-slate-800">
                Deutschmeister ist diese Idee — für alle geöffnet.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
              Warum Deutschmeister anders ist
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {DIFFERENTIATORS.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{card.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{card.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-6">
              Unsere Mission
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Den Menschen, die wirklich Deutsch brauchen — Migranten, Ärzte, Pflegekräfte, Studenten — das Werkzeug geben, das sie verdienen. Nicht das günstigste. Das beste. Weil ihre Zukunft davon abhängt, ob sie verstanden werden.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-8 text-center">
              Was kommt als Nächstes
            </h2>
            <div className="space-y-4">
              {ROADMAP.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 * i }}
                  className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-slate-700 font-medium pt-2">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-8">
              Bereit anzufangen?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="group w-full sm:w-auto px-8 py-4 bg-white text-rose-600 font-semibold rounded-2xl hover:bg-slate-50 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                Kostenlos testen
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/pricing"
                className="group w-full sm:w-auto px-8 py-4 border-2 border-white/40 text-white font-semibold rounded-2xl hover:border-white/70 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                Preise ansehen
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default UeberUnsPage;
