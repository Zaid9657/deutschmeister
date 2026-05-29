import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight, BookOpen, Clock, AlertTriangle, Target, CheckCircle2 } from 'lucide-react';
import SEO from '../../components/SEO';
import { trackLeitfadenViewed } from '../../lib/funnelTracking';

function FaqItem({ q, a }) {
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

const FAQ_ITEMS = [
  {
    q: 'Wie lange sollte ich mich auf telc B1 vorbereiten?',
    a: 'Mindestens 8 Wochen bei täglichem Lernen von 30–60 Minuten. Wenn du schon auf A2-Niveau bist und regelmäßig Deutsch sprichst, kann es schneller gehen. Wenn du von A1 startest, plan lieber 4–6 Monate ein.',
  },
  {
    q: 'Was ist der Unterschied zwischen telc B1 und Goethe B1?',
    a: 'Beide Prüfungen testen dasselbe CEFR-Niveau (B1). Der Aufbau unterscheidet sich leicht: telc hat Sprachbausteine als eigenen Teil, Goethe nicht. Beide werden für Aufenthalt und Einbürgerung anerkannt. Wähle die Prüfung, die in deiner Region leichter verfügbar ist.',
  },
  {
    q: 'Kann man telc B1 ohne Sprachkurs bestehen?',
    a: 'Ja — viele bestehen die Prüfung im Selbststudium. Entscheidend ist, dass du regelmäßig übst und besonders das Sprechen nicht vernachlässigst. KI-Sprechtraining wie bei Deutschmeister hilft dir, die mündliche Prüfung vorzubereiten, auch ohne Lehrer.',
  },
  {
    q: 'Was passiert, wenn ich einen Teil der Prüfung nicht bestehe?',
    a: 'Bei telc kannst du den schriftlichen und den mündlichen Teil getrennt wiederholen. Du musst nicht die gesamte Prüfung nochmal machen — nur den Teil, den du nicht bestanden hast.',
  },
  {
    q: 'Wie teuer ist die telc B1 Prüfung?',
    a: 'Die Gebühren variieren je nach Prüfungszentrum, liegen aber meist zwischen 150 und 200 Euro. Erkundige dich bei deiner lokalen VHS oder einem telc-Prüfungszentrum nach dem genauen Preis.',
  },
  {
    q: 'Brauche ich telc B1 für die Einbürgerung?',
    a: 'Für die Einbürgerung in Deutschland brauchst du Deutschkenntnisse auf B1-Niveau. Sowohl telc Deutsch B1 als auch Goethe-Zertifikat B1 und der DTZ (Deutsch-Test für Zuwanderer) werden anerkannt.',
  },
  {
    q: 'Ist telc B1 schwer?',
    a: 'Mit guter Vorbereitung ist telc B1 machbar. Die größte Hürde für die meisten Kandidaten ist die mündliche Prüfung — weil sie im Alltag zu wenig sprechen üben. Regelmäßiges Sprechtraining ist der Schlüssel.',
  },
  {
    q: 'Wo kann ich telc B1 ablegen?',
    a: 'telc-Prüfungen werden an über 3.000 Prüfungszentren weltweit angeboten. In Deutschland findest du Prüfungszentren über die telc-Website oder bei deiner lokalen Volkshochschule (VHS).',
  },
];

export default function TelcB1Page() {
  useEffect(() => { trackLeitfadenViewed('telc-b1'); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <SEO
        title="telc B1 Vorbereitung: Leitfaden 2026"
        description="telc Deutsch B1 Vorbereitung: 8-Wochen-Lernplan, Prüfungsaufbau, häufige Fehler und Tipps. Alles, was du zum Bestehen brauchst."
        keywords="telc Deutsch B1 Vorbereitung, telc B1 bestehen, telc B1 Prüfung Ablauf, telc B1 Lernplan, Deutsch B1 Prüfung"
        path="/leitfaden/telc-b1"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'telc Deutsch B1: Der komplette Leitfaden zur Vorbereitung (2026)',
            author: { '@type': 'Organization', name: 'DeutschMeister' },
            publisher: { '@type': 'Organization', name: 'DeutschMeister' },
            datePublished: '2026-05-28',
            dateModified: '2026-05-28',
            description: 'Kompletter Leitfaden zur telc Deutsch B1 Vorbereitung mit 8-Wochen-Lernplan, Prüfungsaufbau, Tipps und häufigen Fehlern.',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          },
        ]}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* H1 */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <BookOpen className="w-4 h-4" />
            Leitfaden
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-800 leading-tight mb-6">
            telc Deutsch B1: Der komplette Leitfaden zur Vorbereitung (2026)
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Du bereitest dich auf die <strong>telc Deutsch B1 Prüfung</strong> vor? Egal ob für den Aufenthaltstitel, die Einbürgerung oder den Beruf — dieser Leitfaden gibt dir alles, was du brauchst. Du erfährst, wie die Prüfung aufgebaut ist, was du Woche für Woche lernen solltest, und welche Fehler du vermeiden musst. Keine Theorie, keine Umwege. Nur das, was dich wirklich durch die telc B1 Prüfung bringt.
          </p>
          <p className="text-slate-500 text-sm mt-4">
            Lesezeit: ca. 15 Minuten · Zuletzt aktualisiert: Mai 2026
          </p>
        </motion.header>

        {/* Table of Contents */}
        <motion.nav
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16 bg-white rounded-2xl border border-slate-100 p-6"
        >
          <p className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Inhalt</p>
          <ol className="space-y-1.5 text-sm">
            {[
              ['#was-ist-telc', 'Was ist die telc B1 Prüfung?'],
              ['#aufbau', 'Der Aufbau der telc B1 Prüfung'],
              ['#bestehen', 'Wie viele Punkte braucht man zum Bestehen?'],
              ['#lernplan', 'Dein 8-Wochen-Lernplan für telc B1'],
              ['#fehler', 'Die 5 häufigsten Fehler bei der telc B1 Prüfung'],
              ['#deutschmeister', 'Wie Deutschmeister dich auf telc B1 vorbereitet'],
              ['#faq', 'Häufige Fragen zur telc B1 Prüfung'],
            ].map(([href, label], i) => (
              <li key={href}>
                <a href={href} className="text-amber-600 hover:text-amber-700 transition-colors">
                  {i + 1}. {label}
                </a>
              </li>
            ))}
          </ol>
        </motion.nav>

        {/* Section 1: Was ist telc B1? */}
        <section id="was-ist-telc" className="mb-16 scroll-mt-24">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-6">
            Was ist die telc B1 Prüfung?
          </h2>
          <div className="prose-custom">
            <p>
              telc steht für „The European Language Certificates". Die telc Deutsch B1 Prüfung ist eine der anerkanntesten Sprachprüfungen für Deutsch als Fremdsprache. Sie prüft, ob du das Niveau B1 des Gemeinsamen Europäischen Referenzrahmens (GER) erreicht hast.
            </p>
            <p>
              B1 bedeutet: Du kannst dich in den meisten Alltagssituationen verständigen. Du verstehst die Hauptpunkte eines Gesprächs, wenn Standarddeutsch gesprochen wird. Du kannst über Erfahrungen berichten, Pläne erklären und kurze Texte zu vertrauten Themen schreiben.
            </p>
            <p>
              telc Deutsch B1 wird in Deutschland von Behörden, Arbeitgebern und Bildungseinrichtungen anerkannt. Für den Aufenthaltstitel und die Einbürgerung ist B1 die Mindestanforderung. Die Prüfung wird auch international an Goethe-Instituten und Prüfungszentren angeboten.
            </p>

            <h3 className="font-display text-xl font-bold text-slate-800 mt-8 mb-4">
              telc B1 vs. Goethe B1: Was ist der Unterschied?
            </h3>
            <p>
              Beide Prüfungen testen dasselbe Sprachniveau und werden für Aufenthalt und Einbürgerung anerkannt. Der wichtigste Unterschied: telc hat einen eigenen Prüfungsteil „Sprachbausteine" (Grammatik und Wortschatz im Kontext), den Goethe nicht als separaten Teil hat. Manche Kandidaten empfinden telc als etwas praxisnäher. Letztlich ist der Unterschied gering — wähle die Prüfung, die in deiner Stadt leichter verfügbar ist.
            </p>
            <p>
              Auch der DTZ (Deutsch-Test für Zuwanderer) kann B1 nachweisen. Er ist die Abschlussprüfung der Integrationskurse und testet auf A2–B1 Niveau. Wenn du gezielt B1 brauchst, ist telc oder Goethe die sicherere Wahl.
            </p>
          </div>
        </section>

        {/* Section 2: Aufbau */}
        <section id="aufbau" className="mb-16 scroll-mt-24">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-6">
            Der Aufbau der telc B1 Prüfung
          </h2>
          <div className="prose-custom">
            <p>
              Die telc Deutsch B1 Prüfung besteht aus zwei Teilen: einer schriftlichen und einer mündlichen Prüfung. Der schriftliche Teil wird an einem Tag absolviert, die mündliche Prüfung kann am selben oder an einem anderen Tag stattfinden.
            </p>

            {/* VERIFY: These numbers are based on published telc B1 exam format. Verify against telc.net */}
            <div className="overflow-x-auto my-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Prüfungsteil</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Was wird geprüft?</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Dauer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">Leseverstehen</td>
                    <td className="px-4 py-3 text-slate-600">Texte verstehen: Anzeigen, E-Mails, Zeitungsartikel, Aushänge</td>
                    {/* VERIFY: telc B1 Leseverstehen duration — sources say approx. 90 min for LV + Sprachbausteine combined */}
                    <td className="px-4 py-3 text-slate-600">ca. 90 Min. (mit Sprachbausteinen)</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">Sprachbausteine</td>
                    <td className="px-4 py-3 text-slate-600">Grammatik und Wortschatz im Kontext: Lückentext mit Auswahlmöglichkeiten</td>
                    <td className="px-4 py-3 text-slate-600">(in den 90 Min. enthalten)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">Hörverstehen</td>
                    <td className="px-4 py-3 text-slate-600">Gespräche, Durchsagen, Radiosendungen verstehen</td>
                    {/* VERIFY: telc B1 Hörverstehen is approximately 30 minutes */}
                    <td className="px-4 py-3 text-slate-600">ca. 30 Min.</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">Schriftlicher Ausdruck</td>
                    <td className="px-4 py-3 text-slate-600">Einen persönlichen oder halbformellen Brief/E-Mail schreiben</td>
                    {/* VERIFY: telc B1 Schreiben is approximately 30 minutes */}
                    <td className="px-4 py-3 text-slate-600">ca. 30 Min.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-800">Mündliche Prüfung</td>
                    <td className="px-4 py-3 text-slate-600">Gespräch mit Partner: sich vorstellen, über ein Thema sprechen, gemeinsam etwas planen</td>
                    {/* VERIFY: telc B1 oral exam is approximately 15-20 minutes (usually with a partner) */}
                    <td className="px-4 py-3 text-slate-600">ca. 15–20 Min. (Paarprüfung)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-display text-xl font-bold text-slate-800 mt-8 mb-4">
              Der schriftliche Teil im Detail
            </h3>
            <p>
              <strong>Leseverstehen:</strong> Du liest verschiedene Texte — von kurzen Anzeigen bis hin zu längeren Zeitungsartikeln. Die Aufgaben testen, ob du die Hauptaussagen verstehst und Details zuordnen kannst. Tipp: Lies zuerst die Aufgaben, dann den Text. So weißt du, wonach du suchst.
            </p>
            <p>
              <strong>Sprachbausteine:</strong> Dieser Teil ist einzigartig für telc. Du bekommst einen Lückentext und musst die richtige Grammatikform oder das richtige Wort aus drei Optionen wählen. Hier zeigt sich, ob du <Link to="/grammar/b1.1" className="text-amber-600 hover:text-amber-700 font-medium">Grammatik auf B1-Niveau</Link> wirklich verstehst — nicht nur auswendig gelernt hast.
            </p>
            <p>
              <strong>Hörverstehen:</strong> Du hörst Dialoge und Monologe — Alltagsgespräche, Durchsagen am Bahnhof, kurze Radioberichte. Die Aufgabe: Hauptaussagen erfassen und Detailinformationen zuordnen. Das Audio wird zweimal abgespielt. Regelmäßiges <Link to="/listening" className="text-amber-600 hover:text-amber-700 font-medium">Hörtraining</Link> ist hier der Schlüssel.
            </p>
            <p>
              <strong>Schriftlicher Ausdruck:</strong> Du schreibst einen Brief oder eine E-Mail zu einem vorgegebenen Thema. Typisch: Antwort auf eine Einladung, Beschwerde, oder Anfrage. Achte auf die richtige Anrede, eine klare Struktur und einen passenden Schluss.
            </p>

            <h3 className="font-display text-xl font-bold text-slate-800 mt-8 mb-4">
              Die mündliche Prüfung
            </h3>
            <p>
              Die mündliche Prüfung findet normalerweise als Paarprüfung statt — du sprichst mit einem anderen Kandidaten. Zwei Prüfer bewerten euch.
            </p>
            {/* VERIFY: telc B1 oral exam has 3 parts: 1. contact, 2. conversation about a topic, 3. planning together */}
            <p>
              Der Ablauf hat drei Teile: Zuerst stellst du dich kurz vor (Kontaktaufnahme). Dann sprichst du über ein vorgegebenes Thema — zum Beispiel Reisen, Gesundheit oder Medien. Im dritten Teil plant ihr gemeinsam etwas — zum Beispiel ein Fest oder einen Ausflug. Hier geht es nicht um perfekte Grammatik. Es geht darum, dass du kommunizieren kannst, auf deinen Partner eingehst und das Gespräch am Laufen hältst.
            </p>
            <p>
              Das <Link to="/speaking" className="text-amber-600 hover:text-amber-700 font-medium">KI-Sprechtraining von Deutschmeister</Link> simuliert genau solche Gesprächssituationen. Du übst, frei zu sprechen, und bekommst sofort Feedback zu Grammatik und Ausdruck.
            </p>
          </div>
        </section>

        {/* Section 3: Punkte */}
        <section id="bestehen" className="mb-16 scroll-mt-24">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-6">
            Wie viele Punkte braucht man zum Bestehen?
          </h2>
          <div className="prose-custom">
            {/* VERIFY: telc B1 pass threshold — 60% in both written and oral parts separately */}
            <p>
              Um die telc Deutsch B1 Prüfung zu bestehen, brauchst du mindestens <strong>60% der Punkte</strong> — und zwar in beiden Teilen getrennt. Das heißt: Du musst sowohl den schriftlichen als auch den mündlichen Teil mit mindestens 60% bestehen.
            </p>
            <p>
              Wenn du einen Teil nicht bestehst, kannst du ihn einmal wiederholen, ohne den anderen Teil nochmal ablegen zu müssen. Das ist ein Vorteil gegenüber manchen anderen Prüfungen.
            </p>
            {/* VERIFY: telc B1 max points — commonly cited as 300 total (225 written + 75 oral) */}
            <p>
              Die schriftliche Prüfung bringt maximal 225 Punkte, die mündliche maximal 75 Punkte. Insgesamt also 300 Punkte. Du brauchst 135 Punkte im schriftlichen und 45 Punkte im mündlichen Teil.
            </p>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 mt-6">
              <p className="text-amber-800 text-sm font-medium flex items-start gap-2">
                <Target className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Ziel nicht auf 60% — ziel auf 70–75%. Das gibt dir einen Sicherheitspuffer. Besonders beim Schreiben und Sprechen, wo die Bewertung subjektiver ist.</span>
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: 8-Wochen-Lernplan */}
        <section id="lernplan" className="mb-16 scroll-mt-24">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-6">
            Dein 8-Wochen-Lernplan für telc B1
          </h2>
          <div className="prose-custom">
            <p>
              Dieser Plan geht davon aus, dass du bereits auf A2-Niveau bist und täglich 30–60 Minuten lernst. Wenn du weniger Zeit hast, streck den Plan. Wenn du mehr Zeit hast, mach die Übungen gründlicher — aber überspring keine Woche.
            </p>
            <p className="mb-6">
              Bevor du loslegst: Mach den <Link to="/level-test" className="text-amber-600 hover:text-amber-700 font-medium">kostenlosen Einstufungstest</Link>. In 5 Minuten weißt du, wo du wirklich stehst. Nicht wo du glaubst zu stehen.
            </p>

            {[
              {
                week: 'Woche 1–2',
                title: 'Grundlagen auffrischen',
                icon: '📖',
                tasks: [
                  'Grammatik A2 wiederholen: Perfekt, Modalverben, Nebensätze mit weil/dass/wenn',
                  'Wortschatz Alltag: 200 Wörter pro Woche aktiv üben',
                  'Täglich 1 Hörübung auf A2-Niveau — Ohren einstellen',
                  'Einstufungstest machen und Schwächen identifizieren',
                ],
                tip: 'Nutze die Grammatik-Lektionen auf Deutschmeister — jedes Thema wird auf Englisch erklärt, damit du das WARUM verstehst, nicht nur das WAS.',
              },
              {
                week: 'Woche 3–4',
                title: 'B1-Grammatik aufbauen',
                icon: '🧱',
                tasks: [
                  'Konjunktiv II (würde + Infinitiv, hätte, wäre)',
                  'Relativsätze (der, die, das als Relativpronomen)',
                  'Passiv Präsens und Präteritum',
                  'Konnektoren: obwohl, trotzdem, deshalb, deswegen',
                  'Tägliches Hörtraining auf B1-Niveau',
                ],
                tip: 'Bei den Sprachbausteinen kommt genau diese Grammatik. Das Sentence X-Ray Tool zeigt dir bei jedem Satz, welcher Fall und welche Struktur verwendet wird.',
              },
              {
                week: 'Woche 5–6',
                title: 'Prüfungsformat trainieren',
                icon: '📝',
                tasks: [
                  'Leseverstehen: Übungstexte mit Zeitlimit lesen',
                  'Sprachbausteine: Lückentext-Übungen mit Grammatikfokus',
                  'Schreiben: 2 Briefe pro Woche (Beschwerde, Einladungsantwort, Anfrage)',
                  'Hörverstehen: B1-Dialoge, Durchsagen, kurze Berichte',
                  'Sprechen: Täglich 10 Minuten freies Sprechen üben',
                ],
                tip: 'Starte jetzt mit dem KI-Sprechtraining. Themen: Reisen, Gesundheit, Arbeit, Wohnen — genau die Themen, die in der Prüfung drankommen.',
              },
              {
                week: 'Woche 7',
                title: 'Schwächen gezielt angehen',
                icon: '🎯',
                tasks: [
                  'Analysiere deine bisherigen Fehler: Wo verlierst du Punkte?',
                  'Grammatik-Lücken schließen: Nochmal die schwierigen Themen',
                  'Zeitmanagement: Schriftliche Übungen mit Stoppuhr',
                  'Mündliche Prüfung simulieren: Vorstellen, Thema, Planung',
                ],
                tip: 'Nutze den Sentence X-Ray für Sätze, die du falsch geschrieben hast. Er zeigt dir genau, wo der Fehler liegt — Kasus, Wortstellung, Verbform.',
              },
              {
                week: 'Woche 8',
                title: 'Generalprobe',
                icon: '🏁',
                tasks: [
                  'Komplette Schriftliche Prüfung unter Prüfungsbedingungen simulieren',
                  'Mündliche Prüfung mit Sprechpartner oder KI üben',
                  'Keine neuen Themen — nur wiederholen und festigen',
                  'Ausreichend schlafen, kein Last-Minute-Pauken am Prüfungstag',
                ],
                tip: 'Letzte Woche: Qualität vor Quantität. Lieber 3 gute Sprechübungen als 10 hastige.',
              },
            ].map((week, i) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 mb-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{week.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-600">{week.week}</p>
                    <h3 className="font-display text-lg font-bold text-slate-800">{week.title}</h3>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  {week.tasks.map((task) => (
                    <li key={task} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">
                    <strong className="text-slate-700">Deutschmeister-Tipp:</strong> {week.tip}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 5: Häufigste Fehler */}
        <section id="fehler" className="mb-16 scroll-mt-24">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-6">
            Die 5 häufigsten Fehler bei der telc B1 Prüfung
          </h2>
          <div className="prose-custom">
            {[
              {
                title: '1. Sprechen nicht genug geübt',
                body: 'Der größte Fehler. Viele lernen monatelang Grammatik und Vokabeln, sprechen aber kaum. In der mündlichen Prüfung merkt man das sofort: lange Pausen, unsichere Satzstellung, kein natürlicher Gesprächsfluss. Übe jeden Tag mindestens 10 Minuten freies Sprechen — mit einem Partner, einem Tandem oder dem KI-Sprechtraining.',
              },
              {
                title: '2. Zeitmanagement im schriftlichen Teil',
                body: 'Der schriftliche Teil ist lang. Wenn du beim Leseverstehen zu viel Zeit verbringst, fehlt sie beim Schreiben. Lösung: Übe vorab mit Stoppuhr. Lies zuerst die Aufgaben, dann den Text. Nicht jedes Wort muss verstanden werden — du suchst spezifische Informationen.',
              },
              {
                title: '3. Beim Schreiben: falsche Textsorte',
                body: 'Du sollst einen formellen Brief schreiben und schreibst wie eine WhatsApp-Nachricht. Oder umgekehrt. Lerne die Unterschiede: „Sehr geehrte Damen und Herren" vs. „Liebe Frau Müller" vs. „Hallo Maria". Anrede, Schlussformel und Ton müssen zum Anlass passen.',
              },
              {
                title: '4. Sprachbausteine unterschätzen',
                body: 'Die Sprachbausteine sehen einfach aus — drei Optionen, eine ist richtig. Aber hier werden genau die Grammatikfallen getestet, die Lerner am häufigsten machen: Dativ vs. Akkusativ, Adjektivendungen, Präpositionen. Regelmäßiges Training mit dem Sentence X-Ray hilft: Du lernst, jeden Satz zu analysieren.',
              },
              {
                title: '5. Nicht auf den Partner eingehen (mündliche Prüfung)',
                body: 'In der Paarprüfung wirst du nicht nur danach bewertet, was du sagst — sondern auch, wie du auf deinen Partner reagierst. Hör zu, stell Rückfragen, greif seine Ideen auf. Die Prüfer wollen echte Kommunikation sehen, nicht zwei Monologe.',
              },
            ].map((err, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                <h3 className="font-display text-lg font-bold text-slate-800 mb-2 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  {err.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{err.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 6: Wie Deutschmeister hilft */}
        <section id="deutschmeister" className="mb-16 scroll-mt-24">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-6">
            Wie Deutschmeister dich auf telc B1 vorbereitet
          </h2>
          <div className="prose-custom">
            <p>
              Deutschmeister wurde von einem Arzt in Deutschland gebaut, der selbst Sprachprüfungen bestehen musste. Die Plattform ist kein Spiel — sie ist ein Werkzeug für Leute, die eine Prüfung bestehen müssen. So passt sie zur telc B1 Vorbereitung:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 my-8">
              {[
                {
                  exam: 'Mündliche Prüfung',
                  feature: 'KI-Sprechtraining',
                  detail: 'Übe Prüfungsthemen (Reisen, Wohnen, Gesundheit) im freien Gespräch. Die KI gibt sofort Feedback zu Grammatik, Wortschatz und Ausdruck.',
                },
                {
                  exam: 'Hörverstehen',
                  feature: 'Hörübungen A1–B2',
                  detail: 'Authentische Dialoge und Monologe auf jedem Niveau. Trainiere dein Ohr für Alltagssprache, Durchsagen und Berichte.',
                },
                {
                  exam: 'Sprachbausteine',
                  feature: 'Grammatik + Sentence X-Ray',
                  detail: 'Verstehe Grammatik nicht nur als Regel, sondern im Kontext. Das Sentence X-Ray Tool zerlegt jeden Satz — Fälle, Wortarten, Satzglieder.',
                },
                {
                  exam: 'Leseverstehen',
                  feature: 'Lesetexte A1–B2',
                  detail: 'Übe mit steigender Textlänge und Komplexität. Von kurzen Anzeigen bis zu längeren Texten — genau wie in der Prüfung.',
                },
              ].map((item) => (
                <div key={item.exam} className="bg-white rounded-xl border border-slate-100 p-5">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Prüfungsteil: {item.exam}</p>
                  <p className="font-semibold text-slate-800 mb-2">{item.feature}</p>
                  <p className="text-sm text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>

            <p>
              Dazu kommt: Ein <Link to="/level-test" className="text-amber-600 hover:text-amber-700 font-medium">kostenloser Einstufungstest</Link>, der dir in 5 Minuten zeigt, wo du stehst. <Link to="/grammar/b1.2" className="text-amber-600 hover:text-amber-700 font-medium">Grammatik-Lektionen bis B2</Link> mit Erklärungen auf Englisch. Und <Link to="/pricing" className="text-amber-600 hover:text-amber-700 font-medium">Preise</Link>, die deutlich unter einer Sprachschule liegen. Neugierig, wie Deutschmeister im Vergleich zu anderen Plattformen abschneidet? Schau dir den <Link to="/vergleich" className="text-amber-600 hover:text-amber-700 font-medium">ehrlichen Vergleich</Link> an.
            </p>
          </div>
        </section>

        {/* Section 7: FAQ */}
        <section id="faq" className="mb-16 scroll-mt-24">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-8">
            Häufige Fragen zur telc B1 Prüfung
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <FaqItem {...item} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-center"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
            Starte deine telc B1 Vorbereitung
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Mach den Einstufungstest, finde dein Niveau und fang an zu lernen. A1.1 ist kostenlos, der Rest kostet weniger als ein Kaffee pro Tag.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/level-test"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/25 hover:from-amber-600 hover:to-rose-600 transition-all"
            >
              Einstufungstest starten
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-600 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors"
            >
              Kostenlos registrieren
            </Link>
          </div>
        </motion.section>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 text-center mt-8">
          Dieser Leitfaden dient der allgemeinen Information und ersetzt keine offizielle Prüfungsvorbereitung.
          Aktuelle Prüfungsformate und -gebühren findest du auf telc.net. Stand: Mai 2026.
        </p>
      </article>

      <style>{`
        .prose-custom p {
          color: #475569;
          line-height: 1.75;
          margin-bottom: 1rem;
        }
        .prose-custom strong {
          color: #1e293b;
        }
      `}</style>
    </div>
  );
}
