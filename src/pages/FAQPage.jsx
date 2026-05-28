import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight, BookOpen, MessageSquare, CreditCard, GraduationCap, Monitor } from 'lucide-react';
import SEO from '../components/SEO';
import { trackFAQViewed } from '../lib/funnelTracking';

const FAQ_DATA = [
  {
    title: 'Über Deutschmeister',
    icon: BookOpen,
    color: 'from-amber-400 to-rose-400',
    items: [
      {
        q: 'Was ist Deutschmeister?',
        a: 'Deutschmeister ist eine Online-Plattform, die dir hilft, Deutsch zu lernen — mit Grammatik-Erklärungen auf Englisch, KI-Sprechtraining und dem Sentence X-Ray Tool. Alles an einem Ort, von A1 bis B2.',
      },
      {
        q: 'Für wen ist diese Plattform gedacht?',
        a: 'Für alle, die Deutsch wirklich sprechen wollen. Besonders für Migranten, Fachkräfte und Studierende, die sich auf Goethe, telc, TestDaF oder DTZ vorbereiten. Wenn du unter Zeitdruck lernst und keine Lust auf Spielchen hast — bist du hier richtig.',
      },
      {
        q: 'Wer steht hinter Deutschmeister?',
        a: 'Zaid — Arzt aus Deutschland. Er kennt das Problem aus erster Hand: eine neue Sprache lernen, während der Alltag weiterläuft. Prüfungsdruck, wenig Zeit, hohe Erwartungen. Deutschmeister ist aus genau dieser Erfahrung entstanden.',
      },
      {
        q: 'Welche Niveaus deckt ihr ab?',
        a: 'A1.1 bis B2.2 — also vom absoluten Anfänger bis zur gehobenen Mittelstufe. 64 Grammatik-Themen, Hörübungen, Lesetexte und Sprechtraining auf jedem Niveau.',
      },
    ],
  },
  {
    title: 'Lernen & Inhalte',
    icon: MessageSquare,
    color: 'from-teal-400 to-emerald-400',
    items: [
      {
        q: 'Wie unterscheidet sich Deutschmeister von Duolingo / Babbel?',
        a: 'Duolingo macht Spaß, bringt dir aber nicht bei, einen ganzen Satz zu bilden. Babbel ist solide, aber ohne echtes Sprechtraining. Deutschmeister erklärt dir das WARUM hinter der Grammatik — auf Englisch — und lässt dich dann mit KI sprechen üben. Das ist der Unterschied.',
      },
      {
        q: 'Bekomme ich echtes Sprechtraining oder nur Übungen?',
        a: 'Echtes Sprechtraining. Du sprichst mit einer KI, die auf dein Niveau abgestimmt ist. Du bekommst sofort Feedback zu Grammatik, Wortschatz und Aussprache. Kein Nachsprechen von Sätzen — echte Gespräche.',
      },
      {
        q: 'Wie funktioniert die KI-Auswertung beim Sprechen?',
        a: 'Du sprichst, die KI hört zu und analysiert deinen Satz in Echtzeit. Du siehst sofort: Was war richtig? Was kannst du verbessern? Welche Alternative wäre natürlicher? Wie ein geduldiger Lehrer, der immer Zeit hat.',
      },
      {
        q: 'Was ist das Sentence X-Ray Tool?',
        a: 'Du gibst einen deutschen Satz ein — egal welchen. Das Tool zerlegt ihn: Fälle, Satzglieder, Wortarten. Farbcodiert und erklärt. Du verstehst endlich, warum „dem" und nicht „den" steht. Kein anderes Tool kann das so.',
      },
      {
        q: 'Wie viel Zeit brauche ich pro Tag?',
        a: '15–20 Minuten reichen. Eine Grammatik-Lektion, ein paar Übungen, eine kurze Sprechübung. Jeden Tag ein bisschen ist besser als einmal pro Woche drei Stunden.',
      },
    ],
  },
  {
    title: 'Preise & Abo',
    icon: CreditCard,
    color: 'from-blue-400 to-indigo-400',
    items: [
      {
        q: 'Was kostet Deutschmeister?',
        a: 'Pro Monatlich: 9,99 € pro Monat. Pro Jährlich: 79,99 € pro Jahr (das sind 6,67 € pro Monat — weniger als 0,22 € am Tag). Günstiger als ein Kaffee.',
      },
      {
        q: 'Gibt es eine kostenlose Version?',
        a: 'Ja. A1.1 ist komplett kostenlos — ohne Anmeldung. Dazu bekommst du 2 kostenlose KI-Sprechübungen und 1 Sentence X-Ray Analyse pro Tag. Wenn du ein Konto erstellst, gibt es 7 Tage kostenlosen Pro-Zugang obendrauf.',
      },
      {
        q: 'Kann ich jederzeit kündigen?',
        a: 'Ja. Ein Klick, fertig. Keine Fragen, keine versteckten Kosten, keine Kündigungsfrist. Du behältst den Zugang bis zum Ende der bezahlten Periode.',
      },
      {
        q: 'Bekomme ich eine Rückerstattung, wenn ich nicht zufrieden bin?',
        a: '7 Tage Geld-zurück-Garantie. Kein Risiko. Wenn es nichts für dich ist, bekommst du dein Geld zurück.',
      },
      {
        q: 'Welche Zahlungsarten akzeptiert ihr?',
        a: 'Kreditkarte (Visa, Mastercard, AMEX), PayPal und Apple Pay. Alles über LemonSqueezy — sicher und verschlüsselt.',
      },
    ],
  },
  {
    title: 'Prüfungsvorbereitung',
    icon: GraduationCap,
    color: 'from-purple-400 to-pink-400',
    items: [
      {
        q: 'Bereitet Deutschmeister auf Goethe / telc / TestDaF / DTZ vor?',
        a: 'Ja. Die Grammatik und der Wortschatz decken genau die Themen ab, die in diesen Prüfungen vorkommen. Das Sprechtraining simuliert mündliche Prüfungssituationen. Für den DTZ (Deutsch-Test für Zuwanderer) ist besonders das B1-Material relevant.',
      },
      {
        q: 'Ist das genug für die B1-/B2-Prüfung?',
        a: 'Deutschmeister gibt dir eine solide Grundlage — Grammatik, Hörverständnis, Sprechen. Für die Prüfung selbst empfehle ich zusätzlich: offizielle Modellsätze vom Goethe-Institut oder telc durcharbeiten. Deutschmeister + Modellsätze = eine starke Kombination.',
      },
      {
        q: 'Wie viele Wochen vor der Prüfung sollte ich anfangen?',
        a: 'Mindestens 8–12 Wochen bei täglichem Lernen. Je früher, desto besser. Grammatik braucht Zeit zum Setzen. Das Sprechtraining hilft dir, sicherer zu werden — aber Sicherheit kommt nicht über Nacht.',
      },
      {
        q: 'Gibt es Probeprüfungen?',
        a: 'Noch nicht — aber das ist geplant. Aktuell kannst du mit den Übungen auf jedem Niveau testen, wo du stehst. Der kostenlose Einstufungstest zeigt dir sofort dein CEFR-Level.',
      },
    ],
  },
  {
    title: 'Technisches',
    icon: Monitor,
    color: 'from-slate-400 to-slate-500',
    items: [
      {
        q: 'Funktioniert das auf dem Handy?',
        a: 'Ja. Deutschmeister läuft im Browser — Desktop, Tablet, Handy. Keine App nötig. Einfach deutsch-meister.de öffnen und loslegen.',
      },
      {
        q: 'Brauche ich ein Mikrofon für das Sprechtraining?',
        a: 'Ja, aber jedes eingebaute Mikrofon reicht. Laptop, Handy, Tablet — alles funktioniert. Externe Mikrofone sind nicht nötig.',
      },
      {
        q: 'Wo werden meine Daten gespeichert?',
        a: 'Server in der EU (Supabase). DSGVO-konform. Deine Daten werden nicht verkauft, nicht weitergegeben, nicht für Werbung genutzt. Punkt.',
      },
    ],
  },
];

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-medium text-slate-800 pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <SEO
        title="Häufige Fragen"
        description="Häufige Fragen zu Deutschmeister — Preise, Prüfungsvorbereitung (Goethe, telc, TestDaF, DTZ), KI-Sprechtraining, Sentence X-Ray und mehr. Deutsch lernen von A1 bis B2."
        keywords="Deutschmeister FAQ, Deutsch lernen, Goethe Prüfung, telc Prüfung, TestDaF, DTZ, KI Sprechtraining, Sentence X-Ray, Deutsch Grammatik"
        path="/faq"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ_DATA.flatMap((cat) =>
            cat.items.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
              },
            }))
          ),
        }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-800 mb-4">
            Häufige Fragen
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Alles, was du über Deutschmeister wissen musst — kurz und ehrlich.
          </p>
        </motion.div>

        <div className="space-y-12">
          {FAQ_DATA.map((category, catIdx) => (
            <motion.section
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * catIdx }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                  <category.icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-display text-xl font-bold text-slate-800">
                  {category.title}
                </h2>
              </div>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <AccordionItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-600 mb-4">Noch Fragen? Einfach loslegen — A1.1 ist komplett kostenlos.</p>
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold rounded-2xl shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 transition-all"
          >
            Kostenlos starten
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQPage;
