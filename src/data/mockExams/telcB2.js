// telc Deutsch B2 practice exam (Kurzversion).
//
// HONESTY CONTRACT (enforced by tests/exams.test.mjs): original practice
// material in the STYLE of the exam — never official material; every surface
// renders MOCK_DISCLAIMER_DE; "Kurzversion" stays in the title; scores are
// Richtwert only. The 60% line mirrors the publicly documented rule (see
// astro-site/src/data/guides/telc-b2.js, factsCheckedOn there): at least 60%
// in the written and the oral part separately — this trainer covers the
// written side; Sprechen lives in the speaking trainer.
//
// Shape notes vs. the real exam: same section shapes at reduced length —
// Überschriften-matching and a Meinungstext (Leseverstehen), the B2
// Sprachbausteine cloze (connectors, register, fixed phrases in a formal
// letter), listening at B2, and the formal complaint letter the Schriftlicher
// Ausdruck asks for.

export const telcB2Mock = {
  examKey: 'telc_b2',
  title: 'telc B2 Übungstest (Kurzversion)',
  intro:
    'Vier Teile unter Zeitdruck: Lesen, Sprachbausteine und Hören werden automatisch ausgewertet, ' +
    'der Schreibteil kommt mit Aufgabe und Selbstcheck. Auf B2 zählt Präzision — die Sprachbausteine ' +
    'prüfen genau die Konnektoren und festen Wendungen, an denen sich B2 von B1 unterscheidet.',
  passPercent: 60,

  sections: [
    {
      key: 'lesen',
      title: 'Leseverstehen',
      minutes: 25,
      instructions:
        'Teil 1: Welche Überschrift passt zu welchem Text? Zwei Überschriften bleiben übrig. Teil 2: Lies den Kommentar und wähl die Antwort, die dem Text entspricht.',
      parts: [
        {
          key: 'lesen-1',
          type: 'matching',
          label: 'Teil 1 · Überschriften zuordnen',
          options: [
            { key: 'a', label: 'Immer weniger Freiwillige: Vereine schlagen Alarm' },
            { key: 'b', label: 'Studie: Homeoffice verändert die Innenstädte' },
            { key: 'c', label: 'Mehr Bäume gegen die Sommerhitze in den Städten' },
            { key: 'd', label: 'Streamingdienste setzen Kinos weiter unter Druck' },
            { key: 'e', label: 'Mikroplastik: Forscher finden Rückstände im Regenwasser' },
            { key: 'f', label: 'Neue Regeln für E-Scooter in der Diskussion' },
            { key: 'g', label: 'Vier-Tage-Woche: Pilotprojekt geht in die Verlängerung' },
          ],
          texts: [
            {
              id: 'b2l1',
              text: 'Wo früher Büroangestellte ihre Mittagspause verbrachten, bleiben Cafés und Läden heute oft leer. Eine aktuelle Untersuchung zeigt: Weil viele Beschäftigte nur noch an zwei oder drei Tagen ins Büro kommen, verlieren zentrale Lagen an Kaufkraft — und Stadtplaner suchen nach neuen Nutzungen für leerstehende Flächen.',
            },
            {
              id: 'b2l2',
              text: 'Ob Sportverein, freiwillige Feuerwehr oder Tafel: Überall fehlen Menschen, die regelmäßig und unbezahlt mit anpacken. Verbände sprechen von einem Rückgang, der sich seit Jahren abzeichnet, und fordern, Engagement stärker anzuerkennen — etwa durch Freistellungen und einfachere Strukturen.',
            },
            {
              id: 'b2l3',
              text: 'Wissenschaftler einer norddeutschen Universität haben Niederschläge an zwölf Standorten analysiert und wurden überall fündig: winzige Kunststoffpartikel, die mit dem Wind über weite Strecken transportiert werden. Wie sie in den Wasserkreislauf gelangen, ist erst teilweise verstanden.',
            },
            {
              id: 'b2l4',
              text: 'Asphalt speichert Wärme, und in dicht bebauten Vierteln kühlt es nachts kaum noch ab. Mehrere Kommunen reagieren nun mit einem Programm, das Schatten spenden soll: Zehntausende neue Stadtbäume, entsiegelte Plätze und begrünte Dächer stehen auf der Liste.',
            },
            {
              id: 'b2l5',
              text: 'Nach einem Jahr mit verkürzter Arbeitszeit bei vollem Lohn ziehen die beteiligten Unternehmen eine überwiegend positive Bilanz: weniger Krankheitstage, stabile Produktivität. Das Experiment wird deshalb um zwölf Monate ausgeweitet — nun auch mit Betrieben aus der Produktion.',
            },
          ],
          answers: { b2l1: 'b', b2l2: 'a', b2l3: 'e', b2l4: 'c', b2l5: 'g' },
        },
        {
          key: 'lesen-2',
          type: 'mc-group',
          label: 'Teil 2 · Einen Kommentar verstehen',
          text:
            'Lernen ohne Lehrer?\n\nSprachlern-Apps versprechen viel: zehn Minuten am Tag, spielerisch, jederzeit. Und tatsächlich — für den Einstieg leisten sie Erstaunliches. Wer aber glaubt, allein durch tägliches Tippen auf bunte Kärtchen eine Prüfung auf B2-Niveau zu erreichen, unterschätzt, was Sprache ist: ein Handeln zwischen Menschen. Argumentieren, widersprechen, einen Gedanken über drei Sätze tragen — das lernt niemand im Multiple-Choice-Modus. Die Konsequenz daraus ist allerdings nicht, die Technik zu verteufeln. Kluge Lernende kombinieren: die App für Wortschatz und Routine, echte Gespräche und geschriebene Texte für alles, was darüber hinausgeht. Nicht das Werkzeug entscheidet, sondern die Mischung.',
          items: [
            {
              id: 'b2-l2q1',
              prompt: 'Wie beurteilt die Autorin Sprachlern-Apps für Anfänger?',
              options: [
                { key: 'a', label: 'Sie hält sie am Anfang für überraschend leistungsfähig.' },
                { key: 'b', label: 'Sie hält sie schon für den Einstieg für ungeeignet.' },
                { key: 'c', label: 'Sie äußert sich dazu nicht.' },
              ],
              answer: 'a',
            },
            {
              id: 'b2-l2q2',
              prompt: 'Was fehlt Apps nach Meinung der Autorin für das B2-Niveau?',
              options: [
                { key: 'a', label: 'Genügend Wortschatzübungen' },
                { key: 'b', label: 'Das sprachliche Handeln zwischen Menschen — argumentieren und widersprechen' },
                { key: 'c', label: 'Eine Prüfungssimulation mit Zeitdruck' },
              ],
              answer: 'b',
            },
            {
              id: 'b2-l2q3',
              prompt: 'Welche Schlussfolgerung zieht die Autorin?',
              options: [
                { key: 'a', label: 'Man sollte auf Apps ganz verzichten.' },
                { key: 'b', label: 'Apps ersetzen inzwischen den Unterricht.' },
                { key: 'c', label: 'Entscheidend ist die Kombination aus App und echter Sprachpraxis.' },
              ],
              answer: 'c',
            },
          ],
        },
      ],
    },
    {
      key: 'sprachbausteine',
      title: 'Sprachbausteine',
      minutes: 15,
      instructions:
        'Lies den formellen Brief und wähl für jede Lücke die richtige Möglichkeit — Konnektoren, Präpositionen und feste Wendungen im Kontext.',
      parts: [
        {
          key: 'sb-1',
          type: 'cloze',
          label: 'Grammatik und Wortschatz im Kontext',
          textBefore: 'Sehr geehrte Damen und Herren,',
          gapsText: [
            { text: 'ich wende mich heute ' },
            { gap: 'b2g1' },
            { text: ' Sie, weil der Laptop, den ich vor zwei Wochen bei Ihnen bestellt habe, nicht funktioniert. Der Bildschirm zeigt seit dem ersten Tag Streifen, ' },
            { gap: 'b2g2' },
            { text: ' ich das Gerät ausschließlich vorsichtig behandelt habe. Ich habe zwar mehrfach versucht, Ihre Hotline zu erreichen, ' },
            { gap: 'b2g3' },
            { text: ' war die Leitung stets besetzt. ' },
            { gap: 'b2g4' },
            { text: ' der langen Wartezeit habe ich mich nun entschieden, Ihnen zu schreiben.\n\nDas Gerät, ' },
            { gap: 'b2g5' },
            { text: ' ich für meine Arbeit dringend brauche, ist in diesem Zustand nicht nutzbar. Ich bitte Sie daher, es ' },
            { gap: 'b2g6' },
            { text: ' oder mir den Kaufpreis zu erstatten. Sollten Sie bis zum 15. des Monats nicht reagieren, ' },
            { gap: 'b2g7' },
            { text: ' ich mich an die Verbraucherzentrale wenden.\n\nIm Anhang finden Sie eine Kopie der Rechnung ' },
            { gap: 'b2g8' },
            { text: ' einige Fotos des Bildschirms. Ich hoffe ' },
            { gap: 'b2g9' },
            { text: ' eine schnelle und unkomplizierte Lösung.\n\nMit ' },
            { gap: 'b2g10' },
            { text: ' Grüßen\nDaniel Petrescu' },
          ],
          gaps: [
            { id: 'b2g1', options: [{ key: 'a', label: 'an' }, { key: 'b', label: 'auf' }, { key: 'c', label: 'zu' }], answer: 'a' },
            { id: 'b2g2', options: [{ key: 'a', label: 'obwohl' }, { key: 'b', label: 'trotzdem' }, { key: 'c', label: 'dennoch' }], answer: 'a' },
            { id: 'b2g3', options: [{ key: 'a', label: 'doch' }, { key: 'b', label: 'denn' }, { key: 'c', label: 'weil' }], answer: 'a' },
            { id: 'b2g4', options: [{ key: 'a', label: 'Trotz' }, { key: 'b', label: 'Wegen' }, { key: 'c', label: 'Während' }], answer: 'b' },
            { id: 'b2g5', options: [{ key: 'a', label: 'das' }, { key: 'b', label: 'dem' }, { key: 'c', label: 'den' }], answer: 'a' },
            { id: 'b2g6', options: [{ key: 'a', label: 'austauschen' }, { key: 'b', label: 'auszutauschen' }, { key: 'c', label: 'ausgetauscht' }], answer: 'b' },
            { id: 'b2g7', options: [{ key: 'a', label: 'werde' }, { key: 'b', label: 'würde' }, { key: 'c', label: 'wurde' }], answer: 'a' },
            { id: 'b2g8', options: [{ key: 'a', label: 'sowie' }, { key: 'b', label: 'sondern' }, { key: 'c', label: 'sogar' }], answer: 'a' },
            { id: 'b2g9', options: [{ key: 'a', label: 'auf' }, { key: 'b', label: 'für' }, { key: 'c', label: 'über' }], answer: 'a' },
            { id: 'b2g10', options: [{ key: 'a', label: 'freundliche' }, { key: 'b', label: 'freundlichen' }, { key: 'c', label: 'freundlicher' }], answer: 'b' },
          ],
        },
      ],
    },
    {
      key: 'hoeren',
      title: 'Hörverstehen',
      minutes: 15,
      instructions:
        'Zwei Hörübungen mit Muttersprachler-Dialogen auf B2-Niveau. Du kannst jede Aufnahme wie in der Prüfung nur begrenzt oft abspielen.',
      parts: [
        {
          key: 'hoeren-1',
          type: 'listening',
          label: 'Hörtext 1',
          level: 'B2.1',
          exerciseNumber: 1,
        },
        {
          key: 'hoeren-2',
          type: 'listening',
          label: 'Hörtext 2',
          level: 'B2.2',
          exerciseNumber: 1,
        },
      ],
    },
    {
      key: 'schreiben',
      title: 'Schriftlicher Ausdruck',
      minutes: 30,
      instructions:
        'Schreib einen formellen Brief (ca. 150–180 Wörter) und behandle alle vier Leitpunkte. Dieser Teil wird nicht automatisch bewertet — nutze den Selbstcheck.',
      parts: [
        {
          key: 'schreiben-1',
          type: 'writing',
          label: 'Formelle Beschwerde',
          task:
            'Sie haben an einer zweitägigen beruflichen Fortbildung teilgenommen, die deutlich schlechter war als angekündigt: ' +
            'Der angekündigte Fachdozent wurde ersetzt, Unterlagen fehlten, und der zweite Tag endete drei Stunden früher. ' +
            'Schreiben Sie an den Veranstalter: Erläutern Sie, was Sie erwartet hatten, beschreiben Sie, was tatsächlich passiert ist, ' +
            'erklären Sie die Folgen für Sie, und formulieren Sie eine konkrete Forderung mit Frist.',
          criteria: [
            'Passende Anrede und Schlussformel (formell)',
            'Alle vier Leitpunkte behandelt',
            'Erkennbarer Aufbau: Anlass → Sachverhalt → Folgen → Forderung',
            'B2-Konnektoren und Nominalstil verwendet (aufgrund, infolgedessen, dennoch …)',
            'Sachlicher, höflicher Ton trotz Beschwerde',
            'Ungefähr 150–180 Wörter',
          ],
        },
      ],
    },
  ],
};
