// „Sich auf Deutsch vorstellen" — organic launch week 2
// (docs/marketing/a11-organic-launch-calendar.md). Data module, not a page:
// see the header of ./deutsch-a1-anfaenger-start.js for why.
//
// SEARCH INTENT: „sich auf Deutsch vorstellen“, „Vorstellung Deutsch A1
// Beispiel“, „ich heiße oder mein Name ist“. The searcher usually has a
// concrete appointment — a class, an interview, an exam — and wants sentences
// they can say tomorrow, plus the two or three mistakes that give a beginner
// away. So: a fixed sentence order, the Sie/du decision, the six questions that
// come back, and a self-check.
//
// OVERLAP RULE (tests/a11-organic-content.test.mjs): week 1 also touches the
// five sentences. It does so as ONE exercise inside a four-week route; this
// article is the full treatment — order, register, questions asked back,
// pitfalls, exam use. No paragraph is shared between the two, and the test
// fails the build if one ever is.
//
// FACT DISCIPLINE: only the A1 speaking-part format is asserted as an exam
// fact, from the Goethe Prüfungsziele/Testbeschreibung listed in `sources`.

export const sichAufDeutschVorstellen = {
  slug: 'sich-auf-deutsch-vorstellen',
  title: 'Sich auf Deutsch vorstellen: Sätze, die sitzen',
  h1: 'Sich auf Deutsch vorstellen: die Sätze, die Reihenfolge und die Fallen',
  description:
    'Sich auf Deutsch vorstellen — mit fester Satzreihenfolge, Sie oder du, den sechs Rückfragen und einer Übung, die du heute laut sprechen kannst.',
  keywords:
    'sich auf Deutsch vorstellen, Vorstellung Deutsch A1, ich heiße, mein Name ist, Deutsch Selbstvorstellung Beispiel',
  badge: 'Leitfaden',
  lead:
    'Die Selbstvorstellung ist der eine deutsche Text, den du <strong>jede Woche</strong> brauchst — im Kurs, beim Amt, beim ersten Arbeitstag und in der A1-Prüfung. Sie besteht aus sechs Sätzen in fester Reihenfolge. Wer diese sechs sicher kann, wirkt nicht „wie ein Anfänger mit Glück“, sondern wie jemand, der Deutsch gelernt hat.',
  datePublished: '2026-09-16',
  answer:
    'Eine deutsche Selbstvorstellung folgt einer festen Reihenfolge: Begrüßung, Name, Herkunft, Wohnort, Beruf oder Studium, Sprachen, und zum Schluss ein Satz zu Hobbys oder zum Grund, warum du Deutsch lernst. „Ich heiße Ana“ und „Mein Name ist Ana Chakiri“ sind beide korrekt; mit dem Nachnamen wirkt die zweite Form förmlicher. Beim Beruf steht kein Artikel: „Ich bin Lehrerin“, nicht „eine Lehrerin“. Rechne fest damit, dass du deinen Namen buchstabieren musst — das ist in Deutschland Alltag und in der A1-Prüfung eine eigene Aufgabe.',
  factsCheckedOn: '2026-09-03',
  sources: [
    { label: 'Goethe-Institut — Prüfungsziele/Testbeschreibung A1', url: 'https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf' },
    { label: 'Goethe-Institut — Start Deutsch 1 (Modellsätze, Sprechteil)', url: 'https://www.goethe.de/ins/de/de/prf/prf/gzsd1/ueb.html' },
  ],

  sections: [
    {
      id: 'reihenfolge',
      heading: 'Die sechs Sätze, in dieser Reihenfolge',
      blocks: [
        {
          type: 'p',
          text: 'Deutsche Selbstvorstellungen sind kürzer und sachlicher, als Lernende erwarten. Niemand erwartet eine Geschichte — erwartet werden Informationen in einer Reihenfolge, die jede:r kennt. Diese Reihenfolge ist auch die des Sprechteils der A1-Prüfung.',
        },
        {
          type: 'table',
          head: ['Nr.', 'Satz', 'Beispiel'],
          rows: [
            ['1', 'Begrüßung', 'Guten Tag!'],
            ['2', 'Name', 'Ich heiße Ana Chakiri. / Mein Name ist Ana Chakiri.'],
            ['3', 'Herkunft', 'Ich komme aus Marokko.'],
            ['4', 'Wohnort', 'Ich wohne in Leipzig.'],
            ['5', 'Beruf oder Studium', 'Ich bin Studentin. / Ich arbeite als Krankenpflegerin.'],
            ['6', 'Sprachen und ein Hobby', 'Ich spreche Arabisch, Französisch und ein bisschen Deutsch. Ich koche gern.'],
          ],
        },
        {
          type: 'p',
          text: 'Alle sechs Sätze stehen im Präsens und haben dieselbe Struktur: <strong>ich</strong> + Verb an Position zwei. Genau das macht sie zum idealen Einstieg — du übst die deutsche Satzstellung an Inhalten, die du sowieso brauchst. Die Formen stehen in <a href="/grammar/a1.1/verb-sein/">Das Verb „sein“</a> und <a href="/grammar/a1.1/present-tense-regular/">Präsens (regelmäßig)</a>.',
        },
        {
          type: 'callout',
          text: '„Ich heiße“ und „Mein Name ist“ sind beide richtig. Unterschied: „Ich heiße“ klingt neutral bis freundlich und wird meist mit dem Vornamen benutzt; „Mein Name ist“ ist etwas förmlicher und kommt öfter mit dem vollen Namen — beim Amt, am Telefon, im Bewerbungsgespräch.',
        },
      ],
    },
    {
      id: 'sie-oder-du',
      heading: 'Sie oder du — die Entscheidung vor dem ersten Satz',
      blocks: [
        {
          type: 'p',
          text: 'Bevor du sprichst, entscheidest du eine Sache: Wie sprichst du die andere Person an? Die Selbstvorstellung selbst ändert sich dadurch kaum (du sprichst ja über dich), aber die Frage danach schon — und daran wird der Unterschied gehört.',
        },
        {
          type: 'table',
          head: ['Situation', 'Anrede', 'Deine Rückfrage'],
          rows: [
            ['Amt, Arzt, Vermieter, Vorgesetzte, Fremde', 'Sie', 'Und wie heißen Sie?'],
            ['Sprachkurs, Uni, Sport, gleichaltrige Kolleg:innen', 'du (oft direkt angeboten)', 'Und wie heißt du?'],
            ['Unsicher', 'Sie — und abwarten', 'Die andere Person bietet das „du“ an.'],
          ],
        },
        {
          type: 'p',
          text: 'Faustregel: Das „du“ bietet die ältere oder die dienstältere Person an, nicht die jüngere. Mit „Sie“ zu starten ist nie ein Fehler; mit „du“ zu starten kann einer sein. Wer unsicher ist, benutzt einen Satz ohne Anrede: „Freut mich!“',
        },
        {
          type: 'callout',
          text: 'Gesiezte Personen werden mit Nachnamen angesprochen: „Guten Tag, Frau Kaya.“ Vorname plus „Sie“ ist eine Mischung, die es im Deutschen praktisch nicht gibt.',
        },
      ],
    },
    {
      id: 'rueckfragen',
      heading: 'Die sechs Fragen, die zurückkommen',
      blocks: [
        {
          type: 'p',
          text: 'Eine Vorstellung ist selten ein Monolog. Rechne mit diesen sechs Fragen — sie kommen fast immer, und sie kommen in dieser Form:',
        },
        {
          type: 'list',
          items: [
            '<strong>Wie heißen Sie?</strong> / Wie heißt du? → Ich heiße …',
            '<strong>Wie schreibt man das?</strong> → Buchstabe für Buchstabe: C-H-A-K-I-R-I.',
            '<strong>Woher kommen Sie?</strong> → Ich komme aus …',
            '<strong>Wo wohnen Sie?</strong> → Ich wohne in …',
            '<strong>Was machen Sie beruflich?</strong> → Ich bin … / Ich arbeite als …',
            '<strong>Sprechen Sie Deutsch?</strong> → Ein bisschen. Können Sie bitte langsam sprechen?',
          ],
        },
        {
          type: 'p',
          text: 'Der letzte Satz ist der wichtigste der Liste. „Können Sie bitte langsam sprechen?“ verwandelt ein Gespräch, das zu schnell wird, in eines, das weitergeht. Wie solche Fragen gebaut sind, steht in <a href="/grammar/a1.1/yes-no-questions/">Ja/Nein-Fragen</a>; die Pronomen dazu in <a href="/grammar/a1.1/personal-pronouns/">Personalpronomen</a>.',
        },
      ],
    },
    {
      id: 'uebung',
      heading: 'Übung: die 60-Sekunden-Vorstellung',
      blocks: [
        {
          type: 'p',
          text: 'Nimm dein Telefon, starte die Sprachaufnahme und sprich eine Minute. Danach hörst du dir die Aufnahme einmal an. Das ist unangenehm und es ist die schnellste Korrektur, die es kostenlos gibt.',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Schritt 1',
              title: 'Die sechs Sätze aufschreiben',
              tasks: [
                'Trage deine eigenen Angaben in die sechs Sätze aus der Tabelle oben ein',
                'Beruf ohne Artikel prüfen: „Ich bin Ingenieur“ — nicht „ein Ingenieur“',
                'Ein Hobby mit „gern“ ergänzen: Ich lese gern. / Ich koche gern.',
              ],
              tip: 'Bleib bei sechs Sätzen. Eine längere Vorstellung ist auf A1 nicht besser, sondern nur fehleranfälliger.',
            },
            {
              label: 'Schritt 2',
              title: 'Aufnehmen — ohne auf das Blatt zu sehen',
              tasks: [
                'Sprich die sechs Sätze frei, mit Pausen, aber ohne abzulesen',
                'Buchstabiere danach deinen Nachnamen laut',
                'Nenne zum Schluss deine Telefonnummer in Zweierpaaren, wie in Deutschland üblich',
              ],
              tip: 'Zahlen in Zweierpaaren („dreiundzwanzig — siebenundvierzig“) sind am Telefon Standard und im Sprechteil der A1-Prüfung eine eigene Aufgabe.',
            },
            {
              label: 'Schritt 3',
              title: 'Die Aufnahme gegen drei Punkte prüfen',
              tasks: [
                'Steht das Verb in jedem Satz an zweiter Stelle?',
                'Sagst du „ich bin Lehrer“ ohne Artikel?',
                'Hört man bei „ei“ und „ie“ den Unterschied (mein / die)?',
              ],
              tip: 'Drei Punkte reichen. Wer auf alles gleichzeitig achtet, korrigiert nichts.',
            },
          ],
        },
        {
          type: 'callout',
          text: 'Wiederhole die Aufnahme an drei aufeinanderfolgenden Tagen. Ab Tag drei kommt die Vorstellung ohne Nachdenken — und genau das ist das Ziel, denn im echten Gespräch ist der Kopf mit dem beschäftigt, was danach kommt.',
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Vier Fehler, die sofort auffallen',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: '„Ich bin ein Lehrer“',
              body: 'Berufe stehen im Deutschen ohne Artikel: Ich bin Lehrer. Ich bin Studentin. Der Artikel klingt nach wörtlicher Übersetzung aus dem Englischen und ist der häufigste Fehler in der ganzen Vorstellung.',
            },
            {
              title: '„Ich komme von Marokko“',
              body: 'Herkunft heißt „aus“, nicht „von“: Ich komme aus Marokko. „Von“ benutzt man für Personen und Ausgangspunkte („von meiner Schwester“, „von zu Hause“).',
            },
            {
              title: '„Ich lebe in Leipzig seit zwei Jahre“',
              body: 'Nach „seit“ steht der Dativ: seit zwei Jahren. Auf A1 ist der einfachere Ausweg oft besser: „Ich wohne in Leipzig.“ Punkt.',
            },
            {
              title: 'Den eigenen Namen nicht buchstabieren können',
              body: 'Das Alphabet ist der Teil, den fast alle überspringen — und der in Deutschland ständig verlangt wird. Übe besonders die Paare E/I, G/J und V/W, die beim Hören verwechselt werden.',
            },
          ],
        },
      ],
    },
    {
      id: 'weiter',
      heading: 'Wo du das mit Rückmeldung üben kannst',
      blocks: [
        {
          type: 'p',
          text: 'Eine Vorstellung wird nicht durch Lesen besser, sondern durch Sprechen mit Korrektur. Kostenlos und ohne Termin geht das so:',
        },
        {
          type: 'list',
          items: [
            'Die Grammatik dahinter: <a href="/grammar/a1.1/verb-sein/">sein</a>, <a href="/grammar/a1.1/personal-pronouns/">Personalpronomen</a> und <a href="/grammar/a1.1/alphabet-pronunciation/">Alphabet und Aussprache</a> — alle mit Beispielen zum Anhören.',
            'Hörverstehen mit echten Dialogen: die <a href="/listening/">Hörübungen</a> ab A1.1 enthalten mehrere Begrüßungs- und Vorstellungsszenen.',
            'Kurze Lesetexte, in denen sich Personen vorstellen: <a href="/reading/">Lesetexte</a> ab A1.1.',
          ],
        },
        {
          type: 'p',
          text: 'Wenn du die Vorstellung lieber geführt übst — mit Dialog, Aussprache, einer Sprechaufgabe und einem korrigierten Anmeldeformular —, ist das Lektion 2 des A1.1-Kurses: <a href="/course/a1.1/l/2?source=organic-guide-vorstellen">Lektion 2 kostenlos starten</a>.',
        },
        {
          type: 'p',
          text: 'Und wenn die Vorstellung für eine Prüfung sitzen muss: Im Sprechteil von <a href="/leitfaden/start-deutsch-1/">Start Deutsch 1</a> ist sie die erste von drei Aufgaben.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Sagt man „Ich heiße“ oder „Mein Name ist“?',
      a: 'Beides ist korrekt. „Ich heiße …“ ist neutral und alltäglich, oft mit dem Vornamen. „Mein Name ist …“ wirkt etwas förmlicher und kommt häufiger mit dem vollen Namen vor, etwa am Telefon, beim Amt oder im Bewerbungsgespräch.',
    },
    {
      q: 'Wie stelle ich mich in der A1-Prüfung vor?',
      a: 'Im Sprechteil von Start Deutsch 1 stellst du dich mit Name, Alter, Land, Wohnort, Sprachen, Beruf und Hobby vor und buchstabierst zusätzlich einen Namen und nennst eine Telefonnummer. Es gibt keine Vorbereitungszeit, deshalb lohnt es sich, diese Reihenfolge auswendig sprechen zu können.',
    },
    {
      q: 'Wie lang sollte eine Selbstvorstellung auf Deutsch sein?',
      a: 'Auf A1 reichen sechs bis acht Sätze, etwa 30 bis 60 Sekunden. Länger wird sie erst, wenn nachgefragt wird — und dann antwortest du auf die Frage, statt weiterzuerzählen.',
    },
    {
      q: 'Duzen oder siezen bei der ersten Begegnung?',
      a: 'Im Zweifel „Sie“. Im Sprachkurs, an der Uni und unter gleichaltrigen Kolleg:innen ist „du“ üblich, wird aber meist ausdrücklich angeboten. Das Angebot kommt von der älteren oder dienstälteren Person.',
    },
    {
      q: 'Was antworte ich, wenn ich nichts verstanden habe?',
      a: '„Entschuldigung, können Sie das bitte wiederholen?“ oder „Können Sie bitte langsam sprechen?“ Beide Sätze sind höflich, vollständig und retten mehr Gespräche als jede zusätzliche Vokabel.',
    },
    {
      q: 'Muss ich mein Alter nennen?',
      a: 'Im Alltag nicht — das gilt eher als private Information. In der A1-Prüfung gehört das Alter dagegen zu den Angaben, die im Sprechteil erwartet werden: „Ich bin 29 Jahre alt.“',
    },
  ],

  cta: {
    heading: 'Übe deine Vorstellung mit Rückmeldung',
    body: 'Der Einstufungstest zeigt dir in wenigen Minuten, ob A1.1 dein Startpunkt ist — danach übst du genau die Sätze, die du brauchst.',
  },
};
