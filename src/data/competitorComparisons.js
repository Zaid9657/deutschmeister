const competitorComparisons = {
  babbel: {
    slug: 'babbel',
    name: 'babbel',
    displayName: 'Babbel',
    positioning: 'Strukturiertes Vokabel- und Grammatik-Training auf Abo-Basis.',
    priceRange: '€6,99 – €12,99/Monat (Stand: Mai 2026)',
    heroHeadline: 'Babbel lehrt dich Deutsch. Deutschmeister bringt es zum Sprechen.',
    heroSubheadline: 'Beide Plattformen haben gute Grammatik. Aber nur eine lässt dich wirklich sprechen üben — mit KI-Feedback in Echtzeit.',
    comparisonTable: [
      { feature: 'KI-Sprechtraining mit Live-Feedback', us: '✓ Unbegrenzte freie KI-Gespräche auf jedem Niveau — mit Auswertung von Grammatik, Wortschatz und Aussprache, abgestimmt auf Prüfungen', them: '○ Babbel Speak (seit 2025): KI-Gespräche in vorgegebenen Szenarien, Beta, nur in der App' },
      { feature: 'Sentence X-Ray (Satzanalyse)', us: '✓ Einzigartig: Jeder deutsche Satz wird zerlegt — Fälle, Satzglieder, Wortarten, farbcodiert', them: '✗ Nicht verfügbar' },
      { feature: 'Prüfungsvorbereitung (Goethe/telc/TestDaF)', us: '✓ Inhalte gezielt auf CEFR-Prüfungen abgestimmt, A1–B2', them: '○ Allgemeine Sprachkurse, nicht prüfungsspezifisch' },
      { feature: 'Grammatik-Erklärungen auf Englisch', us: '✓ Jedes Thema auf Englisch erklärt — ideal für Nicht-Muttersprachler', them: '✓ Erklärungen in 14 Ausgangssprachen verfügbar' },
      { feature: 'Offline-Modus', us: '✗ Browser-basiert, Internet erforderlich', them: '✓ Lektionen offline in der App verfügbar' },
      { feature: 'Einstufungstest', us: '✓ Kostenloser CEFR-Einstufungstest in 5 Minuten', them: '✓ Einstufungstest beim Kursstart' },
      { feature: 'Kostenlose Inhalte', us: '✓ A1.1 komplett kostenlos + 7 Tage Pro-Testphase', them: '○ Erste Lektion kostenlos, danach Abo nötig' },
      { feature: 'Preis (monatlich, Stand: Mai 2026)', us: '9,99 €/Monat (Pro)', them: 'ab 6,99 €/Monat (12-Monats-Abo) – 12,99 €/Monat (3-Monats-Abo)' },
      { feature: 'Von Muttersprachlern entwickelt', us: '✓ Gegründet von einem Arzt in Deutschland — kennt den Lernweg aus Erfahrung', them: '✓ Team aus Sprachwissenschaftlern in Berlin' },
      { feature: 'Hörübungen mit Alltagsdialogen', us: '✓ Hörverständnis auf jedem Niveau mit authentischen Dialogen', them: '✓ Dialoge und Hörübungen in jeder Lektion' },
      { feature: 'Werbung in der kostenlosen Version', us: '✗ Keine Werbung — auch nicht in der Gratisversion', them: '✗ Keine Werbung (reines Abo-Modell)' },
    ],
    whyUsBlocks: [
      {
        icon: 'Mic',
        title: 'Sprechtraining mit Prüfungs-Tiefe',
        body: 'Babbel hat mit Babbel Speak ein KI-Sprechtraining in vorgegebenen Szenarien (Beta, nur App). Bei Deutschmeister führst du unbegrenzte freie Gespräche auf jedem Niveau — und bekommst Feedback zu Grammatik, Ausdruck und Aussprache, gezielt auf deine Prüfung ausgerichtet. Der Unterschied liegt in Tiefe und Prüfungsfokus, nicht im Ob.',
      },
      {
        icon: 'ScanSearch',
        title: 'Sentence X-Ray — einzigartig bei Deutschmeister',
        body: 'Gib irgendeinen deutschen Satz ein und sieh sofort: Welcher Fall? Welches Satzglied? Warum „dem" und nicht „den"? Kein anderes Tool zerlegt deutsche Sätze so detailliert. Babbel bietet das nicht.',
      },
      {
        icon: 'GraduationCap',
        title: 'Prüfungsfokus, nicht nur Vokabeltraining',
        body: 'Deutschmeister wurde von einem Arzt gebaut, der selbst Sprachprüfungen bestehen musste. Die Inhalte sind auf Goethe, telc und TestDaF abgestimmt — nicht auf allgemeines Sprachgefühl.',
      },
    ],
    faq: [
      {
        q: 'Soll ich von Babbel zu Deutschmeister wechseln?',
        a: 'Wenn dir echtes Sprechtraining und Prüfungsvorbereitung wichtig sind — ja. Babbel ist gut für strukturiertes Vokabellernen. Aber wenn du frei sprechen willst und dich auf eine Prüfung vorbereitest, bietet Deutschmeister mehr.',
      },
      {
        q: 'Kann ich Babbel und Deutschmeister zusammen nutzen?',
        a: 'Ja, das machen einige Lerner. Babbel für Vokabeln und Wiederholung, Deutschmeister für Grammatik-Verständnis, Sprechtraining und Satzanalyse. Die Kombination kann sinnvoll sein.',
      },
      {
        q: 'Ist Deutschmeister günstiger als Babbel?',
        a: 'Ja. Deutschmeister Pro kostet 9,99 €/Monat oder 6,67 €/Monat im Jahresabo. Babbel liegt bei 6,99 – 12,99 €/Monat je nach Laufzeit. Und bei Deutschmeister gibt es A1.1 komplett kostenlos.',
      },
      {
        q: 'Hat Babbel auch KI-Sprechtraining?',
        a: 'Ja — Babbel hat seit 2025 „Babbel Speak", ein KI-Sprechtraining in vorgegebenen Szenarien (derzeit Beta, nur in der App). Bei Deutschmeister sind die KI-Gespräche unbegrenzt, auf jedem Niveau verfügbar und gezielt auf Goethe, telc und TestDaF abgestimmt.',
      },
      {
        q: 'Welche Plattform ist besser für Anfänger?',
        a: 'Beide sind für Anfänger geeignet. Babbel hat eine starke App mit Offline-Modus. Deutschmeister erklärt Grammatik auf Englisch und hat einen kostenlosen Einstufungstest, der dein Niveau sofort findet.',
      },
    ],
    ctaHeadline: 'Teste Deutschmeister kostenlos — und entscheide selbst.',
    ctaSubtext: 'A1.1 komplett kostenlos. 7 Tage Pro-Testphase. Kein Risiko.',
  },

  duolingo: {
    slug: 'duolingo',
    name: 'duolingo',
    displayName: 'Duolingo',
    positioning: 'Gamifiziertes Sprachlern-Spiel mit kostenloser Stufe.',
    priceRange: 'Kostenlos / Super: ab €6,99/Monat im Jahresabo (Stand: Mai 2026)',
    heroHeadline: 'Duolingo macht Spaß. Deutschmeister bringt dich durch die Prüfung.',
    heroSubheadline: 'Duolingo motiviert mit Streaks und Punkten. Aber wenn du Deutsch für Prüfungen, Arbeit oder das echte Leben brauchst — reicht das?',
    comparisonTable: [
      { feature: 'KI-Sprechtraining mit Live-Feedback', us: '✓ Freie Gespräche mit KI, sofortiges Feedback zu Grammatik und Ausdruck', them: '○ Roleplay (seit 2026 kostenlos): GPT-basierte Gespräche in Alltagsszenarien, spielerisch, kein Prüfungsfokus' },
      { feature: 'Sentence X-Ray (Satzanalyse)', us: '✓ Jeder Satz zerlegt in Fälle, Satzglieder, Wortarten', them: '✗ Nicht verfügbar' },
      { feature: 'Grammatik-Erklärungen', us: '✓ Ausführliche Erklärungen auf Englisch — das WARUM hinter jeder Regel', them: '○ Kurze Tips vor Lektionen, keine tiefgehenden Erklärungen' },
      { feature: 'Prüfungsvorbereitung (Goethe/telc/TestDaF)', us: '✓ Inhalte auf CEFR-Prüfungen abgestimmt, A1–B2', them: '✗ Kein Prüfungsfokus — allgemeines Sprachtraining' },
      { feature: 'B1+ tatsächlich erreichbar', us: '✓ Durchgängige Inhalte bis B2.2 mit steigender Komplexität', them: '○ Offiziell bis B2, aber Tiefe ab B1 stark begrenzt' },
      { feature: 'Kostenlose Version', us: '✓ A1.1 kostenlos, 7 Tage Pro-Testphase', them: '✓ Komplett kostenlos nutzbar (mit Werbung und Herzen-System)' },
      { feature: 'Werbung', us: '✗ Keine Werbung — niemals', them: '✓ Werbung in der Gratisversion (entfällt mit Super-Abo)' },
      { feature: 'Gamification (Streaks, XP, Liga)', us: '✗ Kein Gamification — Fokus auf echten Fortschritt', them: '✓ Stark gamifiziert: Streaks, XP, Ligen, Achievements' },
      { feature: 'Hörübungen mit echten Dialogen', us: '✓ Authentische Dialoge auf jedem Niveau', them: '○ TTS-generierte Sätze, nicht immer authentisch' },
      { feature: 'Preis (monatlich, Stand: Mai 2026)', us: '9,99 €/Monat (Pro)', them: 'Kostenlos / Super: ab 6,99 €/Monat (im Jahresabo)' },
      { feature: 'Offline-Modus', us: '✗ Browser-basiert', them: '✓ Lektionen offline verfügbar (mit Super)' },
      { feature: 'Einstufungstest', us: '✓ CEFR-Einstufungstest, 5 Minuten', them: '✓ Placement Test beim Start' },
    ],
    whyUsBlocks: [
      {
        icon: 'Brain',
        title: 'Tiefe statt Spielereien',
        body: 'Duolingo belohnt dich für richtige Antworten mit Punkten und Streaks. Deutschmeister erklärt dir, WARUM die Antwort richtig ist. Wenn du Deutsch wirklich verstehen willst — nicht nur Übungen abhaken — ist das der entscheidende Unterschied.',
      },
      {
        icon: 'Mic',
        title: 'Echte Konversation, nicht nur Multiple Choice',
        body: 'Bei Duolingo tippst du Wörter in die richtige Reihenfolge. Bei Deutschmeister sprichst du — und die KI hört zu, analysiert und korrigiert. Echte Sprechkompetenz baut man nur durch echtes Sprechen auf.',
      },
      {
        icon: 'GraduationCap',
        title: 'Prüfung bestehen, nicht nur Streak halten',
        body: 'Deutschmeister ist auf Goethe, telc und TestDaF abgestimmt. Wenn du eine Prüfung vor dir hast, brauchst du gezielte Vorbereitung — kein Spiel, das dich für 50 XP lobt.',
      },
    ],
    faq: [
      {
        q: 'Reicht Duolingo, um eine Deutschprüfung zu bestehen?',
        a: 'Für A1 vielleicht. Ab A2 wird es schwierig. Duolingo baut Vokabeln auf und ist motivierend, aber die Grammatiktiefe und das Sprechtraining reichen für Goethe oder telc nicht aus.',
      },
      {
        q: 'Ist Deutschmeister besser als Duolingo?',
        a: 'Kommt drauf an, was du brauchst. Für tägliche Motivation und Vokabelaufbau ist Duolingo stark. Für echtes Sprechen, Grammatik-Verständnis und Prüfungsvorbereitung ist Deutschmeister die bessere Wahl.',
      },
      {
        q: 'Warum ist Deutschmeister nicht kostenlos wie Duolingo?',
        a: 'Duolingo finanziert sich durch Werbung und Premium-Upsells. Deutschmeister hat keine Werbung und keine künstlichen Limits. A1.1 ist kostenlos, danach kosten die Inhalte — dafür bekommst du KI-Sprechtraining, Sentence X-Ray und prüfungsrelevante Tiefe.',
      },
      {
        q: 'Kann ich von Duolingo zu Deutschmeister wechseln?',
        a: 'Ja. Mach den kostenlosen Einstufungstest — er zeigt dir in 5 Minuten, wo du stehst. Du musst nicht bei Null anfangen.',
      },
      {
        q: 'Hat Duolingo auch KI-Sprechtraining?',
        a: 'Ja — Duolingos „Roleplay" ist seit Anfang 2026 für alle kostenlos und bietet GPT-basierte Gespräche in Alltagsszenarien. Es ist spielerisch angelegt, nicht auf Prüfungen ausgerichtet. Deutschmeisters KI-Sprechtraining ist auf Goethe, telc und TestDaF abgestimmt und auf jedem Niveau unbegrenzt nutzbar.',
      },
    ],
    ctaHeadline: 'Vom Spielen zum Sprechen — teste Deutschmeister kostenlos.',
    ctaSubtext: 'A1.1 kostenlos. 7 Tage Pro. Kein Streak nötig.',
  },

  lingoda: {
    slug: 'lingoda',
    name: 'lingoda',
    displayName: 'Lingoda',
    positioning: 'Live-Online-Unterricht mit echten Lehrern in Gruppen.',
    priceRange: 'ca. €7 – €15/Gruppenstunde je nach Abo (Stand: Mai 2026)',
    heroHeadline: 'Lingoda gibt dir Lehrer. Deutschmeister gibt dir Freiheit.',
    heroSubheadline: 'Live-Unterricht ist wertvoll. Aber was, wenn du um 23 Uhr üben willst — ohne auf einen Termin zu warten?',
    comparisonTable: [
      { feature: 'Verfügbarkeit', us: '✓ 24/7 — lerne wann du willst, keine Terminbuchung nötig', them: '○ Stundenplan nötig, Kurse zu festen Zeiten' },
      { feature: 'KI-Sprechtraining', us: '✓ Sofort verfügbar, unbegrenzt, auf deinem Niveau', them: '✗ Kein KI-Training — nur Live-Unterricht mit Lehrern' },
      { feature: 'Echte Lehrer', us: '✗ KI-basiert, keine menschlichen Lehrer', them: '✓ Zertifizierte Muttersprachler als Lehrer' },
      { feature: 'Sentence X-Ray (Satzanalyse)', us: '✓ Jeder Satz zerlegt und erklärt — jederzeit nutzbar', them: '✗ Nicht verfügbar' },
      { feature: 'Gruppenunterricht', us: '✗ Einzellernen mit KI', them: '✓ Kleine Gruppen (3–5 Teilnehmer) oder Einzelstunden' },
      { feature: 'Offizielle Zertifikate', us: '✗ Kein eigenes Zertifikat (bereitet auf externe Prüfungen vor)', them: '✓ Lingoda-Zertifikat nach Kursabschluss' },
      { feature: 'Wartezeit bis zur nächsten Übung', us: '✓ Keine — sofort loslegen, auch nachts', them: '○ Nächster freier Slot oft Stunden oder Tage entfernt' },
      { feature: 'Preis pro Monat (Stand: Mai 2026)', us: '9,99 €/Monat (Pro) — unbegrenzt', them: 'Sprint: €310 / 2 Monate (15 Std./Monat), 50% Cashback bei voller Teilnahme' },
      { feature: 'Grammatik-Erklärungen auf Englisch', us: '✓ Ausführlich, jederzeit nachschlagbar', them: '○ Abhängig vom Lehrer und der Unterrichtssprache' },
      { feature: 'Prüfungsvorbereitung', us: '✓ Gezielt auf Goethe/telc/TestDaF abgestimmt', them: '○ Allgemeine Sprachkurse, Sprint-Programme' },
      { feature: 'Stornierung / Flexibilität', us: '✓ Jederzeit kündbar, keine Vertragsbindung', them: '○ Sprint: 50% Cashback bei voller Teilnahme (Super Sprint: 100%), sonst keine Erstattung' },
    ],
    whyUsBlocks: [
      {
        icon: 'Clock',
        title: 'Lernen, wann DU willst — nicht wann der Kalender es sagt',
        body: 'Bei Lingoda buchst du Stunden Tage im Voraus. Bei Deutschmeister öffnest du die App und lernst — um 6 Uhr morgens oder um Mitternacht. Kein Stundenplan, keine Wartezeit.',
      },
      {
        icon: 'Mic',
        title: '24/7 Sprechpartner statt Terminstunde',
        body: 'Lingoda gibt dir eine Stunde Sprechtraining pro gebuchtem Slot. Deutschmeister gibt dir einen KI-Sprechpartner, der immer da ist — so oft und so lange du willst. Kein Buchen, kein Warten.',
      },
      {
        icon: 'Wallet',
        title: 'Bruchteil der Kosten, unbegrenzter Zugang',
        body: 'Lingoda kostet ab ~100 €/Monat für 8 Stunden. Deutschmeister Pro kostet 9,99 €/Monat — mit unbegrenztem Zugang zu allem. Das ist weniger als eine einzige Lingoda-Stunde.',
      },
    ],
    faq: [
      {
        q: 'Kann Deutschmeister einen echten Lehrer ersetzen?',
        a: 'Nicht komplett. Echte Lehrer können auf individuelle Fragen eingehen und Fehler im Kontext erklären. Aber für tägliches Üben, Grammatik-Verständnis und Sprechtraining ist Deutschmeister deutlich günstiger und flexibler.',
      },
      {
        q: 'Ist Lingoda besser für Fortgeschrittene?',
        a: 'Lingoda bietet Live-Konversation mit Muttersprachlern — das ist wertvoll ab B1+. Deutschmeister bietet KI-Sprechtraining bis B2.2 und das Sentence X-Ray Tool, das gerade bei komplexen Sätzen hilft.',
      },
      {
        q: 'Kann ich beides kombinieren?',
        a: 'Ja — eine sinnvolle Kombination. Deutschmeister für tägliches Training (Grammatik, Hören, Sprechen mit KI), Lingoda für gelegentliche Live-Stunden mit einem Lehrer. So sparst du Geld und lernst trotzdem intensiv.',
      },
      {
        q: 'Bekomme ich bei Deutschmeister ein Zertifikat?',
        a: 'Deutschmeister stellt kein eigenes Zertifikat aus. Die Plattform bereitet dich auf anerkannte Prüfungen (Goethe, telc, TestDaF) vor — deren Zertifikate sind international gültig.',
      },
      {
        q: 'Warum ist Deutschmeister so viel günstiger als Lingoda?',
        a: 'Lingoda bezahlt echte Lehrer für Live-Unterricht — das ist teuer. Deutschmeister nutzt KI für Sprechtraining und skalierbare Inhalte. Das ermöglicht denselben Lerneffekt zu einem Bruchteil der Kosten.',
      },
    ],
    ctaHeadline: 'Flexibel lernen, ohne auf einen Termin zu warten.',
    ctaSubtext: 'Starte jetzt kostenlos — 24/7 verfügbar, kein Kalender nötig.',
  },
};

export default competitorComparisons;
