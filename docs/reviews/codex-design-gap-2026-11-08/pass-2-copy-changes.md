# Pass 2 · data-copy change ledger

Exact old → new reader-copy changes against the Pass 1 baseline. Template headlines and new preview labels are inventoried in the Pass 2 section of [build-report.md](build-report.md#pass-2). Price, claim-limit, exam-fact and review-date records were not advanced. The comparison registry’s Astro copy remains byte-identical to its canonical SPA source.

## astro-site/src/data/homepage.js

<details>
<summary>Copy change · source line 16</summary>

**Old**
```js
—
```

**New**
```js
realLife: {
id: 'realLife',
eyebrow: 'Learn it. Use it. Make it yours.',
lines: [[{ t: 'Your German.' }], [{ t: 'In real life.', de: false, mark: true }]],
lead: 'Your first conversation. Your next everyday win. Build German you can use, with situation-led courses and a clear next step. Start A1.1 free — no account, no card.',
},
```

</details>

<details>
<summary>Copy change · source line 52</summary>

**Old**
```js
export const ACTIVE_HERO = 'route';
```

**New**
```js
export const ACTIVE_HERO = 'realLife';
```

</details>

## astro-site/src/data/exams/index.js

<details>
<summary>Copy change · source line 84</summary>

**Old**
```js
'Der DTZ prüft Alltagsdeutsch auf zwei Niveaus gleichzeitig (A2–B1) — Ihr Ergebnis hängt davon ab, wie sicher Sie auf B1 antwortest. Dieser Weg durch DeutschMeister zielt genau darauf.',
```

**New**
```js
'Der DTZ prüft Alltagsdeutsch auf zwei Niveaus gleichzeitig (A2–B1) — Ihr Ergebnis hängt davon ab, wie sicher Sie auf B1 antworten. Dieser Weg durch DeutschMeister zielt genau darauf.',
```

</details>

## src/data/competitorComparisons.js

<details>
<summary>Copy change · source line 92</summary>

**Old**
```js
heroHeadline: 'Babbel lehrt dich Deutsch. Bei Deutschmeister sprichst du es frei.',
heroSubheadline: `Beide Plattformen haben gute Grammatik, und beide bieten KI-Gespräche. Bei Deutschmeister sprichst du frei auf jedem Niveau und bekommst nach dem Gespräch ${EVALUATION}.`,
```

**New**
```js
heroHeadline: 'Babbel lehrt Sie Deutsch. Bei Deutschmeister sprechen Sie es frei.',
heroSubheadline: `Beide Plattformen haben gute Grammatik, und beide bieten KI-Gespräche. Bei Deutschmeister sprechen Sie frei auf jedem Niveau und bekommen nach dem Gespräch ${EVALUATION}.`,
```

</details>

<details>
<summary>Copy change · source line 111</summary>

**Old**
```js
body: `Babbel hat mit Babbel Speak ein KI-Sprechtraining in vorgegebenen Szenarien (Beta, nur App). Bei Deutschmeister führst du mit Pro ${PRO_SPEAKING} frei auf jedem Niveau — und bekommst nach jedem Gespräch ${EVALUATION}. Der Unterschied liegt im freien Gespräch und in der Auswertung, nicht im Ob.`,
```

**New**
```js
body: `Babbel hat mit Babbel Speak ein KI-Sprechtraining in vorgegebenen Szenarien (Beta, nur App). Bei Deutschmeister führen Sie mit Pro ${PRO_SPEAKING} frei auf jedem Niveau — und bekommen nach jedem Gespräch ${EVALUATION}. Der Unterschied liegt im freien Gespräch und in der Auswertung, nicht im Ob.`,
```

</details>

<details>
<summary>Copy change · source line 127</summary>

**Old**
```js
a: 'Wenn dir freies Sprechtraining und Prüfungsvorbereitung wichtig sind — ja. Babbel ist gut für strukturiertes Vokabellernen. Aber wenn du frei sprechen willst und dich auf eine Prüfung vorbereitest, bietet Deutschmeister mehr.',
```

**New**
```js
a: 'Wenn Ihnen freies Sprechtraining und Prüfungsvorbereitung wichtig sind — ja. Babbel ist gut für strukturiertes Vokabellernen. Aber wenn Sie frei sprechen wollen und sich auf eine Prüfung vorbereiten, bietet Deutschmeister mehr.',
```

</details>

<details>
<summary>Copy change · source line 139</summary>

**Old**
```js
a: `Ja — Babbel hat seit 2025 „Babbel Speak", ein KI-Sprechtraining in vorgegebenen Szenarien (derzeit Beta, nur in der App). Bei Deutschmeister führst du mit Pro ${PRO_SPEAKING}, frei auf jedem Niveau, und bekommst nach jedem Gespräch ${EVALUATION}.`,
```

**New**
```js
a: `Ja — Babbel hat seit 2025 „Babbel Speak", ein KI-Sprechtraining in vorgegebenen Szenarien (derzeit Beta, nur in der App). Bei Deutschmeister führen Sie mit Pro ${PRO_SPEAKING}, frei auf jedem Niveau, und bekommen nach jedem Gespräch ${EVALUATION}.`,
```

</details>

<details>
<summary>Copy change · source line 143</summary>

**Old**
```js
a: 'Beide sind für Anfänger geeignet. Babbel hat eine starke App mit Offline-Modus. Deutschmeister erklärt Grammatik auf Englisch und hat einen kostenlosen Einstufungstest, der dein Niveau sofort findet.',
```

**New**
```js
a: 'Beide sind für Anfänger geeignet. Babbel hat eine starke App mit Offline-Modus. Deutschmeister erklärt Grammatik auf Englisch und hat einen kostenlosen Einstufungstest, der Ihr Niveau sofort findet.',
```

</details>

<details>
<summary>Copy change · source line 146</summary>

**Old**
```js
ctaHeadline: 'Teste Deutschmeister kostenlos — und entscheide selbst.',
```

**New**
```js
ctaHeadline: 'Testen Sie Deutschmeister kostenlos — und entscheiden Sie selbst.',
```

</details>

<details>
<summary>Copy change · source line 157</summary>

**Old**
```js
heroSubheadline: 'Duolingo motiviert mit Streaks und Punkten. Aber wenn du Deutsch für Prüfungen, Arbeit oder das echte Leben brauchst — reicht das?',
```

**New**
```js
heroSubheadline: 'Duolingo motiviert mit Streaks und Punkten. Aber wenn Sie Deutsch für Prüfungen, Arbeit oder das echte Leben brauchen — reicht das?',
```

</details>

<details>
<summary>Copy change · source line 159</summary>

**Old**
```js
{ feature: 'KI-Sprechtraining', us: `✓ Mit Pro ${PRO_SPEAKING}, freie Gespräche auf deinem Niveau — danach ${EVALUATION}`, them: '○ Roleplay (seit 2026 kostenlos): GPT-basierte Gespräche in Alltagsszenarien, spielerisch, kein Prüfungsfokus' },
```

**New**
```js
{ feature: 'KI-Sprechtraining', us: `✓ Mit Pro ${PRO_SPEAKING}, freie Gespräche auf Ihrem Niveau — danach ${EVALUATION}`, them: '○ Roleplay (seit 2026 kostenlos): GPT-basierte Gespräche in Alltagsszenarien, spielerisch, kein Prüfungsfokus' },
```

</details>

<details>
<summary>Copy change · source line 173</summary>

**Old**
```js
body: 'Duolingo belohnt dich für richtige Antworten mit Punkten und Streaks. Deutschmeister erklärt dir, WARUM die Antwort richtig ist. Wenn du Deutsch wirklich verstehen willst — nicht nur Übungen abhaken — ist das der entscheidende Unterschied.',
```

**New**
```js
body: 'Duolingo belohnt Sie für richtige Antworten mit Punkten und Streaks. Deutschmeister erklärt Ihnen, WARUM die Antwort richtig ist. Wenn Sie Deutsch wirklich verstehen wollen — nicht nur Übungen abhaken — ist das der entscheidende Unterschied.',
```

</details>

<details>
<summary>Copy change · source line 178</summary>

**Old**
```js
body: `Bei Deutschmeister sprichst du frei auf deinem Niveau, mit Pro ${PRO_SPEAKING}. Nach jedem Gespräch bekommst du ${EVALUATION}: was gut war und was du verbessern kannst. Sprechkompetenz baut man durch Sprechen auf.`,
```

**New**
```js
body: `Bei Deutschmeister sprechen Sie frei auf Ihrem Niveau, mit Pro ${PRO_SPEAKING}. Nach jedem Gespräch bekommen Sie ${EVALUATION}: was gut war und was Sie verbessern können. Sprechkompetenz baut man durch Sprechen auf.`,
```

</details>

<details>
<summary>Copy change · source line 183</summary>

**Old**
```js
body: 'Deutschmeister ist auf Goethe, telc und DTZ abgestimmt. Wenn du eine Prüfung vor dir hast, brauchst du gezielte Vorbereitung — kein Spiel, das dich für 50 XP lobt.',
```

**New**
```js
body: 'Deutschmeister ist auf Goethe, telc und DTZ abgestimmt. Wenn Sie eine Prüfung vor Ihnen haben, brauchen Sie gezielte Vorbereitung — kein Spiel, das Sie für 50 XP lobt.',
```

</details>

<details>
<summary>Copy change · source line 189</summary>

**Old**
```js
a: 'Das kann dir keine App versprechen. Entscheidend ist, dass du das Format deiner Prüfung kennst und übst: mit den offiziellen Modellsätzen des Prüfungsanbieters und, bei Deutschmeister, mit Leitfäden und Übungstests für Goethe, telc und DTZ.',
```

**New**
```js
a: 'Das kann Ihnen keine App versprechen. Entscheidend ist, dass Sie das Format Ihrer Prüfung kennen und üben: mit den offiziellen Modellsätzen des Prüfungsanbieters und, bei Deutschmeister, mit Leitfäden und Übungstests für Goethe, telc und DTZ.',
```

</details>

<details>
<summary>Copy change · source line 193</summary>

**Old**
```js
a: 'Kommt drauf an, was du brauchst. Für tägliche Motivation und Vokabelaufbau ist Duolingo stark. Für freies Sprechen mit Auswertung, Grammatik-Verständnis und Prüfungsvorbereitung ist Deutschmeister gebaut.',
```

**New**
```js
a: 'Kommt drauf an, was Sie brauchen. Für tägliche Motivation und Vokabelaufbau ist Duolingo stark. Für freies Sprechen mit Auswertung, Grammatik-Verständnis und Prüfungsvorbereitung ist Deutschmeister gebaut.',
```

</details>

<details>
<summary>Copy change · source line 197</summary>

**Old**
```js
a: 'Duolingo finanziert sich durch Werbung und Premium-Upsells. Deutschmeister hat keine Werbung. Die KI-Funktionen haben feste Nutzungslimits. A1.1 ist kostenlos, danach kosten die Inhalte — dafür bekommst du KI-Sprechtraining, Sentence X-Ray und prüfungsrelevante Tiefe.',
```

**New**
```js
a: 'Duolingo finanziert sich durch Werbung und Premium-Upsells. Deutschmeister hat keine Werbung. Die KI-Funktionen haben feste Nutzungslimits. A1.1 ist kostenlos, danach kosten die Inhalte — dafür bekommen Sie KI-Sprechtraining, Sentence X-Ray und prüfungsrelevante Tiefe.',
```

</details>

<details>
<summary>Copy change · source line 201</summary>

**Old**
```js
a: `Ja. Mach den kostenlosen Einstufungstest — er zeigt dir in etwa ${PLACEMENT_TEST_MINUTES} Minuten, wo du stehst. Du musst nicht bei Null anfangen.`,
```

**New**
```js
a: `Ja. Machen Sie den kostenlosen Einstufungstest — er zeigt Ihnen in etwa ${PLACEMENT_TEST_MINUTES} Minuten, wo Sie stehen. Sie müssen nicht bei Null anfangen.`,
```

</details>

<details>
<summary>Copy change · source line 205</summary>

**Old**
```js
a: `Ja — Duolingos „Roleplay" ist seit Anfang 2026 für alle kostenlos und bietet GPT-basierte Gespräche in Alltagsszenarien. Es ist spielerisch angelegt, nicht auf Prüfungen ausgerichtet. Bei Deutschmeister sprichst du frei auf jedem Niveau und bekommst nach jedem Gespräch ${EVALUATION} — mit Pro ${PRO_SPEAKING}.`,
```

**New**
```js
a: `Ja — Duolingos „Roleplay" ist seit Anfang 2026 für alle kostenlos und bietet GPT-basierte Gespräche in Alltagsszenarien. Es ist spielerisch angelegt, nicht auf Prüfungen ausgerichtet. Bei Deutschmeister sprechen Sie frei auf jedem Niveau und bekommen nach jedem Gespräch ${EVALUATION} — mit Pro ${PRO_SPEAKING}.`,
```

</details>

<details>
<summary>Copy change · source line 208</summary>

**Old**
```js
ctaHeadline: 'Vom Spielen zum Sprechen — teste Deutschmeister kostenlos.',
```

**New**
```js
ctaHeadline: 'Vom Spielen zum Sprechen — testen Sie Deutschmeister kostenlos.',
```

</details>

<details>
<summary>Copy change · source line 219</summary>

**Old**
```js
heroHeadline: 'Lingoda gibt dir Lehrer. Deutschmeister gibt dir Freiheit.',
heroSubheadline: 'Live-Unterricht ist wertvoll. Aber was, wenn du um 23 Uhr üben willst — ohne auf einen Termin zu warten?',
```

**New**
```js
heroHeadline: 'Lingoda gibt Ihnen Lehrer. Deutschmeister gibt Ihnen Freiheit.',
heroSubheadline: 'Live-Unterricht ist wertvoll. Aber was, wenn Sie um 23 Uhr üben wollen — ohne auf einen Termin zu warten?',
```

</details>

<details>
<summary>Copy change · source line 222</summary>

**Old**
```js
{ feature: 'Verfügbarkeit', us: '✓ 24/7 — lerne wann du willst, keine Terminbuchung nötig', them: '○ Stundenplan nötig, Kurse zu festen Zeiten' },
{ feature: 'KI-Sprechtraining', us: `✓ Sofort verfügbar, mit Pro ${PRO_SPEAKING}, auf deinem Niveau`, them: '✗ Kein KI-Training — nur Live-Unterricht mit Lehrern' },
```

**New**
```js
{ feature: 'Verfügbarkeit', us: '✓ 24/7 — lernen Sie, wann Sie wollen, keine Terminbuchung nötig', them: '○ Stundenplan nötig, Kurse zu festen Zeiten' },
{ feature: 'KI-Sprechtraining', us: `✓ Sofort verfügbar, mit Pro ${PRO_SPEAKING}, auf Ihrem Niveau`, them: '✗ Kein KI-Training — nur Live-Unterricht mit Lehrern' },
```

</details>

<details>
<summary>Copy change · source line 237</summary>

**Old**
```js
title: 'Lernen, wann DU willst — nicht wann der Kalender es sagt',
body: 'Bei Lingoda buchst du Stunden Tage im Voraus. Bei Deutschmeister öffnest du die App und lernst — um 6 Uhr morgens oder um Mitternacht. Kein Stundenplan, keine Wartezeit.',
```

**New**
```js
title: 'Lernen, wann Sie wollen — nicht wann der Kalender es sagt',
body: 'Bei Lingoda buchen Sie Stunden Tage im Voraus. Bei Deutschmeister öffnen Sie die App und lernen — um 6 Uhr morgens oder um Mitternacht. Kein Stundenplan, keine Wartezeit.',
```

</details>

<details>
<summary>Copy change · source line 243</summary>

**Old**
```js
body: `Bei Lingoda sprichst du im Live-Unterricht zu festen Zeiten. Deutschmeister gibt dir einen KI-Sprechpartner, der immer da ist — mit Pro ${PRO_SPEAKING}, wann immer du willst. Kein Buchen, kein Warten.`,
```

**New**
```js
body: `Bei Lingoda sprechen Sie im Live-Unterricht zu festen Zeiten. Deutschmeister gibt Ihnen einen KI-Sprechpartner, der immer da ist — mit Pro ${PRO_SPEAKING}, wann immer Sie wollen. Kein Buchen, kein Warten.`,
```

</details>

<details>
<summary>Copy change · source line 248</summary>

**Old**
```js
body: `Deutschmeister Pro kostet ${PRO_MONTHLY} — mit Zugang zu allen ${LEVEL_COUNT} Leveln und ${PRO_SPEAKING}. Den Lingoda-Preis findest du im Vergleich oben.`,
```

**New**
```js
body: `Deutschmeister Pro kostet ${PRO_MONTHLY} — mit Zugang zu allen ${LEVEL_COUNT} Leveln und ${PRO_SPEAKING}. Den Lingoda-Preis finden Sie im Vergleich oben.`,
```

</details>

<details>
<summary>Copy change · source line 262</summary>

**Old**
```js
a: 'Ja — eine sinnvolle Kombination. Deutschmeister für tägliches Training (Grammatik, Hören, Sprechen mit KI), Lingoda für gelegentliche Live-Stunden mit einem Lehrer. So sparst du Geld und lernst trotzdem intensiv.',
```

**New**
```js
a: 'Ja — eine sinnvolle Kombination. Deutschmeister für tägliches Training (Grammatik, Hören, Sprechen mit KI), Lingoda für gelegentliche Live-Stunden mit einem Lehrer. So sparen Sie Geld und lernen trotzdem intensiv.',
```

</details>

<details>
<summary>Copy change · source line 274</summary>

**Old**
```js
ctaSubtext: 'Starte jetzt kostenlos — 24/7 verfügbar, kein Kalender nötig.',
```

**New**
```js
ctaSubtext: 'Starten Sie jetzt kostenlos — 24/7 verfügbar, kein Kalender nötig.',
```

</details>

## astro-site/src/data/guides/dtz.js

<details>
<summary>Copy change · source line 23</summary>

**Old**
```js
'DTZ verstehen: skalierte Prüfung auf A2 und B1 gleichzeitig, Ablauf der vier Teile, Lernplan und was das Ergebnis für dich bedeutet.',
```

**New**
```js
'DTZ verstehen: skalierte Prüfung auf A2 und B1 gleichzeitig, Ablauf der vier Teile, Lernplan und was das Ergebnis für Sie bedeutet.',
```

</details>

<details>
<summary>Copy change · source line 28</summary>

**Old**
```js
'Der <strong>Deutsch-Test für Zuwanderer</strong> ist die Abschlussprüfung des Integrationskurses — und funktioniert anders als telc oder Goethe. Er ist <strong>skaliert</strong>: Du bestehst ihn nicht einfach oder fällst durch, sondern bekommst pro Prüfungsteil ein Ergebnis auf A2- oder B1-Niveau. Dieser Leitfaden erklärt, was das praktisch heißt, wie die Prüfung abläuft und wie du dich gezielt vorbereitest.',
```

**New**
```js
'Der <strong>Deutsch-Test für Zuwanderer</strong> ist die Abschlussprüfung des Integrationskurses — und funktioniert anders als telc oder Goethe. Er ist <strong>skaliert</strong>: Sie bestehen ihn nicht einfach oder fallen durch, sondern bekommen pro Prüfungsteil ein Ergebnis auf A2- oder B1-Niveau. Dieser Leitfaden erklärt, was das praktisch heißt, wie die Prüfung abläuft und wie Sie sich gezielt vorbereiten.',
```

</details>

<details>
<summary>Copy change · source line 31</summary>

**Old**
```js
'Der Deutsch-Test für Zuwanderer (DTZ) ist skaliert: Er prüft A2 und B1 gleichzeitig und weist für jeden Prüfungsteil einzeln aus, welches Niveau du erreicht hast. Ein Bestehen oder Durchfallen im üblichen Sinn gibt es deshalb nicht. Der schriftliche Teil dauert insgesamt rund 100 Minuten, die mündliche Prüfung wird als Paarprüfung abgenommen und dauert etwa 16 Minuten.',
```

**New**
```js
'Der Deutsch-Test für Zuwanderer (DTZ) ist skaliert: Er prüft A2 und B1 gleichzeitig und weist für jeden Prüfungsteil einzeln aus, welches Niveau Sie erreicht haben. Ein Bestehen oder Durchfallen im üblichen Sinn gibt es deshalb nicht. Der schriftliche Teil dauert insgesamt rund 100 Minuten, die mündliche Prüfung wird als Paarprüfung abgenommen und dauert etwa 16 Minuten.',
```

</details>

<details>
<summary>Copy change · source line 63</summary>

**Old**
```js
text: 'Bei <a href="/leitfaden/telc-b1/">telc B1</a> oder dem <a href="/leitfaden/goethe-b1/">Goethe-Zertifikat B1</a> gibt es eine Grenze: 60 % erreicht — bestanden. Der DTZ funktioniert anders. Er prüft <strong>A2 und B1 gleichzeitig</strong> und bewertet jeden Bereich auf der Skala. Im Zeugnis steht dann pro Bereich, welches Niveau du erreicht hast.',
```

**New**
```js
text: 'Bei <a href="/leitfaden/telc-b1/">telc B1</a> oder dem <a href="/leitfaden/goethe-b1/">Goethe-Zertifikat B1</a> gibt es eine Grenze: 60 % erreicht — bestanden. Der DTZ funktioniert anders. Er prüft <strong>A2 und B1 gleichzeitig</strong> und bewertet jeden Bereich auf der Skala. Im Zeugnis steht dann pro Bereich, welches Niveau Sie erreicht haben.',
```

</details>

<details>
<summary>Copy change · source line 67</summary>

**Old**
```js
text: 'Praktisch heißt das: Du kannst im Hören B1 erreichen und im Schreiben A2. Beides steht im Ergebnis. Es gibt kein „durchgefallen" im üblichen Sinn — es gibt ein Ergebnis, das für manche Zwecke ausreicht und für andere nicht.',
```

**New**
```js
text: 'Praktisch heißt das: Sie können im Hören B1 erreichen und im Schreiben A2. Beides steht im Ergebnis. Es gibt kein „durchgefallen" im üblichen Sinn — es gibt ein Ergebnis, das für manche Zwecke ausreicht und für andere nicht.',
```

</details>

<details>
<summary>Copy change · source line 71</summary>

**Old**
```js
text: 'Welches Gesamtergebnis für deinen Zweck nötig ist — Einbürgerung, Aufenthaltstitel, Kursabschluss — hängt vom Einzelfall ab, und die Regeln dazu ändern sich. <strong>Kläre das vor der Prüfung mit deinem Prüfungszentrum, deinem Kursträger oder der zuständigen Behörde</strong>, nicht danach.',
```

**New**
```js
text: 'Welches Gesamtergebnis für Ihren Zweck nötig ist — Einbürgerung, Aufenthaltstitel, Kursabschluss — hängt vom Einzelfall ab, und die Regeln dazu ändern sich. <strong>Klären Sie das vor der Prüfung mit Ihrem Prüfungszentrum, Ihrem Kursträger oder der zuständigen Behörde</strong>, nicht danach.',
```

</details>

<details>
<summary>Copy change · source line 75</summary>

**Old**
```js
text: 'Weil das Ergebnis pro Bereich ausgewiesen wird, lohnt sich die Vorbereitung dort am meisten, wo du knapp unter B1 liegst. Ein Bereich, der sicher auf B1 ist, bringt durch weiteres Üben nichts Zusätzliches.',
```

**New**
```js
text: 'Weil das Ergebnis pro Bereich ausgewiesen wird, lohnt sich die Vorbereitung dort am meisten, wo Sie knapp unter B1 liegen. Ein Bereich, der sicher auf B1 ist, bringt durch weiteres Üben nichts Zusätzliches.',
```

</details>

<details>
<summary>Copy change · source line 99</summary>

**Old**
```js
text: 'Die Zeiten sind Richtwerte des üblichen Prüfungsformats; die verbindlichen Angaben bekommst du von deinem Prüfungszentrum.',
```

**New**
```js
text: 'Die Zeiten sind Richtwerte des üblichen Prüfungsformats; die verbindlichen Angaben bekommen Sie von Ihrem Prüfungszentrum.',
```

</details>

<details>
<summary>Copy change · source line 104</summary>

**Old**
```js
text: 'Die mündliche Prüfung hat drei Abschnitte: Du stellst dich vor und beantwortest Fragen zur Person. Danach sprichst du über ein Thema anhand eines Bildes oder einer Situation. Zum Schluss plant ihr zu zweit etwas gemeinsam — einen Ausflug, ein Fest, einen Termin.',
```

**New**
```js
text: 'Die mündliche Prüfung hat drei Abschnitte: Sie stellen sich vor und beantworten Fragen zur Person. Danach sprechen Sie über ein Thema anhand eines Bildes oder einer Situation. Zum Schluss planen Sie zu zweit etwas gemeinsam — einen Ausflug, ein Fest, einen Termin.',
```

</details>

<details>
<summary>Copy change · source line 108</summary>

**Old**
```js
text: 'Bewertet wird, ob du verständlich kommunizierst und auf deinen Partner eingehst — nicht, ob jeder Satz fehlerfrei ist. Das <a href="/speaking/">KI-Sprechtraining</a> hilft, genau diese Situationen zu üben, wenn im Alltag die Gelegenheit zum Sprechen fehlt.',
```

**New**
```js
text: 'Bewertet wird, ob Sie verständlich kommunizieren und auf Ihren Partner eingehen — nicht, ob jeder Satz fehlerfrei ist. Das <a href="/speaking/">KI-Sprechtraining</a> hilft, genau diese Situationen zu üben, wenn im Alltag die Gelegenheit zum Sprechen fehlt.',
```

</details>

<details>
<summary>Copy change · source line 122</summary>

**Old**
```js
text: 'Vorab: Der <a href="/level-test/">kostenlose Einstufungstest</a> zeigt dir, wo du stehst — hilfreich, weil beim DTZ jeder Bereich einzeln zählt.',
```

**New**
```js
text: 'Vorab: Der <a href="/level-test/">kostenlose Einstufungstest</a> zeigt Ihnen, wo Sie stehen — hilfreich, weil beim DTZ jeder Bereich einzeln zählt.',
```

</details>

<details>
<summary>Copy change · source line 222</summary>

**Old**
```js
body: 'Manche versuchen, mit langen Nebensatzketten Niveau zu zeigen, und produzieren dabei Fehler. Bewertet wird, ob dein Anliegen klar ankommt. Einfache, korrekte Sätze mit passender Anrede schneiden besser ab.',
```

**New**
```js
body: 'Manche versuchen, mit langen Nebensatzketten Niveau zu zeigen, und produzieren dabei Fehler. Bewertet wird, ob Ihr Anliegen klar ankommt. Einfache, korrekte Sätze mit passender Anrede schneiden besser ab.',
```

</details>

<details>
<summary>Copy change · source line 234</summary>

**Old**
```js
text: 'Der DTZ prüft Alltagssprache in vier Bereichen, die einzeln bewertet werden. Genau dafür lässt sich gezielt üben — mit einer Plattform, die von einem Team von Ärzten in Deutschland gebaut wurde, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind:',
```

**New**
```js
text: `${FOUNDER_LINE_DE} Die folgenden Werkzeuge unterstützen Ihre Vorbereitung:`,
```

</details>

<details>
<summary>Copy change · source line 252</summary>

**Old**
```js
body: 'Grammatik auf Englisch erklärt, plus ein Werkzeug, das deine eigenen Sätze zerlegt und zeigt, wo der Fehler steckt.',
```

**New**
```js
body: 'Grammatik auf Englisch erklärt, plus ein Werkzeug, das Ihre eigenen Sätze zerlegt und zeigt, wo der Fehler steckt.',
```

</details>

<details>
<summary>Copy change · source line 263</summary>

**Old**
```js
text: 'Für den Sprung auf sicheres B1 lohnt sich zusätzlich die <a href="/grammar/b1.1/">B1-Grammatik</a>. Wenn du nach dem DTZ gezielt ein B1-Zertifikat brauchst, findest du im <a href="/leitfaden/telc-b1/">telc-B1-Leitfaden</a> den nächsten Schritt.',
```

**New**
```js
text: 'Für den Sprung auf sicheres B1 lohnt sich zusätzlich die <a href="/grammar/b1.1/">B1-Grammatik</a>. Wenn Sie nach dem DTZ gezielt ein B1-Zertifikat brauchen, finden Sie im <a href="/leitfaden/telc-b1/">telc-B1-Leitfaden</a> den nächsten Schritt.',
```

</details>

<details>
<summary>Copy change · source line 276</summary>

**Old**
```js
a: 'Der DTZ ist skaliert: Statt bestanden oder nicht bestanden bekommst du ein Ergebnis auf A2- oder B1-Niveau je Bereich. Ob dieses Ergebnis für deinen Zweck ausreicht — Einbürgerung, Aufenthalt, Kursabschluss —, entscheidet die zuständige Stelle. Kläre das vorher.',
```

**New**
```js
a: 'Der DTZ ist skaliert: Statt bestanden oder nicht bestanden bekommen Sie ein Ergebnis auf A2- oder B1-Niveau je Bereich. Ob dieses Ergebnis für Ihren Zweck ausreicht — Einbürgerung, Aufenthalt, Kursabschluss —, entscheidet die zuständige Stelle. Klären Sie das vorher.',
```

</details>

<details>
<summary>Copy change · source line 280</summary>

**Old**
```js
a: 'Der schriftliche Teil dauert insgesamt rund 100 Minuten (Hören ca. 25, Lesen ca. 45, Schreiben ca. 30 Minuten). Die mündliche Prüfung wird als Paarprüfung abgenommen und dauert etwa 16 Minuten. Verbindliche Angaben bekommst du von deinem Prüfungszentrum.',
```

**New**
```js
a: 'Der schriftliche Teil dauert insgesamt rund 100 Minuten (Hören ca. 25, Lesen ca. 45, Schreiben ca. 30 Minuten). Die mündliche Prüfung wird als Paarprüfung abgenommen und dauert etwa 16 Minuten. Verbindliche Angaben bekommen Sie von Ihrem Prüfungszentrum.',
```

</details>

<details>
<summary>Copy change · source line 284</summary>

**Old**
```js
a: 'Er ist anders. Der DTZ prüft A2 und B1 gleichzeitig, sodass ein Ergebnis unterhalb von B1 nicht automatisch ein Scheitern ist. telc B1 und Goethe B1 prüfen ausschließlich auf B1 mit einer festen Bestehensgrenze. Wenn du gezielt einen B1-Nachweis brauchst, ist eine reine B1-Prüfung der direktere Weg.',
```

**New**
```js
a: 'Er ist anders. Der DTZ prüft A2 und B1 gleichzeitig, sodass ein Ergebnis unterhalb von B1 nicht automatisch ein Scheitern ist. telc B1 und Goethe B1 prüfen ausschließlich auf B1 mit einer festen Bestehensgrenze. Wenn Sie gezielt einen B1-Nachweis brauchen, ist eine reine B1-Prüfung der direktere Weg.',
```

</details>

<details>
<summary>Copy change · source line 288</summary>

**Old**
```js
a: 'Ja, eine Anmeldung ist auch ohne Kursteilnahme über ein Prüfungszentrum möglich. Ob und wie oft eine Wiederholung gefördert wird, hängt von deiner Kursberechtigung ab — das klärt dein Kursträger oder das BAMF.',
```

**New**
```js
a: 'Ja, eine Anmeldung ist auch ohne Kursteilnahme über ein Prüfungszentrum möglich. Ob und wie oft eine Wiederholung gefördert wird, hängt von Ihrer Kursberechtigung ab — das klärt Ihr Kursträger oder das BAMF.',
```

</details>

<details>
<summary>Copy change · source line 292</summary>

**Old**
```js
a: 'Eine Wiederholung ist möglich; bei geförderten Integrationskursen gelten dafür eigene Regeln, die sich ändern können. Die für dich gültigen Bedingungen nennt dir dein Kursträger oder das BAMF.',
```

**New**
```js
a: 'Eine Wiederholung ist möglich; bei geförderten Integrationskursen gelten dafür eigene Regeln, die sich ändern können. Die für Sie gültigen Bedingungen nennt Ihnen Ihr Kursträger oder das BAMF.',
```

</details>

<details>
<summary>Copy change · source line 300</summary>

**Old**
```js
a: 'Für Teilnehmende an geförderten Integrationskursen ist die Prüfung in der Regel Teil des Kurses. Bei separater Anmeldung setzt das Prüfungszentrum die Gebühr fest — frag dort nach dem aktuellen Preis.',
```

**New**
```js
a: 'Für Teilnehmende an geförderten Integrationskursen ist die Prüfung in der Regel Teil des Kurses. Bei separater Anmeldung setzt das Prüfungszentrum die Gebühr fest — fragen Sie dort nach dem aktuellen Preis.',
```

</details>

<details>
<summary>Copy change · source line 305</summary>

**Old**
```js
heading: 'Finde heraus, wo du stehst',
body: 'Der Einstufungstest zeigt dir dein Niveau pro Fertigkeit — beim DTZ zählt genau das.',
```

**New**
```js
heading: 'Finden Sie heraus, wo Sie stehen',
body: 'Der Einstufungstest zeigt Ihnen Ihr Niveau pro Fertigkeit — beim DTZ zählt genau das.',
```

</details>

## astro-site/src/data/guides/goethe-b1.js

<details>
<summary>Copy change · source line 27</summary>

**Old**
```js
'Das <strong>Goethe-Zertifikat B1</strong> hat eine Eigenschaft, die keine andere große B1-Prüfung so bietet: Du kannst die vier Module einzeln ablegen und einzeln wiederholen. Das ändert die Vorbereitung grundlegend — richtig genutzt, ist es der größte strategische Vorteil dieser Prüfung. Dieser Leitfaden zeigt dir den Aufbau, die Punktegrenzen und einen Lernplan, der die Modulstruktur ausnutzt.',
```

**New**
```js
'Das <strong>Goethe-Zertifikat B1</strong> hat eine Eigenschaft, die keine andere große B1-Prüfung so bietet: Sie können die vier Module einzeln ablegen und einzeln wiederholen. Das ändert die Vorbereitung grundlegend — richtig genutzt, ist es der größte strategische Vorteil dieser Prüfung. Dieser Leitfaden zeigt Ihnen den Aufbau, die Punktegrenzen und einen Lernplan, der die Modulstruktur ausnutzt.',
```

</details>

<details>
<summary>Copy change · source line 45</summary>

**Old**
```js
text: 'B1 heißt: Du kommst in vertrauten Alltagssituationen zurecht, verstehst die Hauptpunkte, wenn klar und in Standardsprache gesprochen wird, kannst über Erlebnisse berichten und deine Meinung begründen. Für Aufenthaltstitel und Einbürgerung ist B1 die übliche Mindestanforderung.',
```

**New**
```js
text: 'B1 heißt: Sie kommen in vertrauten Alltagssituationen zurecht, verstehen die Hauptpunkte, wenn klar und in Standardsprache gesprochen wird, können über Erlebnisse berichten und Ihre Meinung begründen. Für Aufenthaltstitel und Einbürgerung ist B1 die übliche Mindestanforderung.',
```

</details>

<details>
<summary>Copy change · source line 49</summary>

**Old**
```js
text: 'Das Zertifikat ist zeitlich unbegrenzt gültig. Ob eine Behörde oder ein Arbeitgeber einen Nachweis akzeptiert, der älter als ein oder zwei Jahre ist, entscheidet allerdings die jeweilige Stelle — frag dort nach, bevor du dich auf ein altes Zertifikat verlässt.',
```

**New**
```js
text: 'Das Zertifikat ist zeitlich unbegrenzt gültig. Ob eine Behörde oder ein Arbeitgeber einen Nachweis akzeptiert, der älter als ein oder zwei Jahre ist, entscheidet allerdings die jeweilige Stelle — fragen Sie dort nach, bevor Sie sich auf ein altes Zertifikat verlassen.',
```

</details>

<details>
<summary>Copy change · source line 59</summary>

**Old**
```js
text: 'Das Goethe-Zertifikat B1 besteht aus vier Modulen: Lesen, Hören, Schreiben und Sprechen. Du kannst sie <strong>alle an einem Termin ablegen oder einzeln</strong>. Jedes Modul wird separat bewertet und separat bescheinigt.',
```

**New**
```js
text: 'Das Goethe-Zertifikat B1 besteht aus vier Modulen: Lesen, Hören, Schreiben und Sprechen. Sie können sie <strong>alle an einem Termin ablegen oder einzeln</strong>. Jedes Modul wird separat bewertet und separat bescheinigt.',
```

</details>

<details>
<summary>Copy change · source line 77</summary>

**Old**
```js
text: 'Nutze die Module strategisch: Wenn ein Fertigkeitsbereich klar schwächer ist, leg die drei starken Module zuerst ab und nimm dir für das vierte mehr Zeit. Du wiederholst dann nur dieses eine — nicht die ganze Prüfung.',
```

**New**
```js
text: 'Nutzen Sie die Module strategisch: Wenn ein Fertigkeitsbereich klar schwächer ist, legen Sie die drei starken Module zuerst ab und nehmen Sie sich für das vierte mehr Zeit. Sie wiederholen dann nur dieses eine — nicht die ganze Prüfung.',
```

</details>

<details>
<summary>Copy change · source line 87</summary>

**Old**
```js
text: 'In jedem Modul kannst du maximal <strong>100 Punkte</strong> erreichen. Bestanden ist ein Modul ab <strong>60 Punkten</strong>, also 60 %. Diese Grenze gilt für jedes Modul einzeln.',
```

**New**
```js
text: 'In jedem Modul können Sie maximal <strong>100 Punkte</strong> erreichen. Bestanden ist ein Modul ab <strong>60 Punkten</strong>, also 60 %. Diese Grenze gilt für jedes Modul einzeln.',
```

</details>

<details>
<summary>Copy change · source line 95</summary>

**Old**
```js
text: 'Praktisch bedeutet das für die Vorbereitung: Es lohnt sich nicht, dein stärkstes Modul von 85 auf 95 Punkte zu polieren. Diese zehn Punkte helfen dir nirgends. Die gleiche Lernzeit im schwächsten Modul entscheidet dagegen über Bestehen oder Nichtbestehen.',
```

**New**
```js
text: 'Praktisch bedeutet das für die Vorbereitung: Es lohnt sich nicht, Ihr stärkstes Modul von 85 auf 95 Punkte zu polieren. Diese zehn Punkte helfen Ihnen nirgends. Die gleiche Lernzeit im schwächsten Modul entscheidet dagegen über Bestehen oder Nichtbestehen.',
```

</details>

<details>
<summary>Copy change · source line 99</summary>

**Old**
```js
text: 'Plane mit 70–75 Punkten pro Modul, nicht mit 60. Am Prüfungstag kostet Nervosität Punkte, und beim Schreiben und Sprechen hängt die Bewertung stärker vom Gesamteindruck ab als beim Ankreuzen.',
```

**New**
```js
text: 'Planen Sie mit 70–75 Punkten pro Modul, nicht mit 60. Am Prüfungstag kostet Nervosität Punkte, und beim Schreiben und Sprechen hängt die Bewertung stärker vom Gesamteindruck ab als beim Ankreuzen.',
```

</details>

<details>
<summary>Copy change · source line 113</summary>

**Old**
```js
text: 'Starte mit dem <a href="/level-test/">kostenlosen Einstufungstest</a>, damit du deine Ausgangslage kennst statt sie zu schätzen.',
```

**New**
```js
text: 'Starten Sie mit dem <a href="/level-test/">kostenlosen Einstufungstest</a>, damit Sie Ihre Ausgangslage kennen statt sie zu schätzen.',
```

</details>

<details>
<summary>Copy change · source line 127</summary>

**Old**
```js
tip: 'Diese Woche fühlt sich unproduktiv an und ist die wichtigste. Ohne Messung optimierst du acht Wochen lang das, was du ohnehin schon kannst.',
```

**New**
```js
tip: 'Diese Woche fühlt sich unproduktiv an und ist die wichtigste. Ohne Messung optimieren Sie acht Wochen lang das, was Sie ohnehin schon können.',
```

</details>

<details>
<summary>Copy change · source line 139</summary>

**Old**
```js
tip: 'Die Grammatik-Lektionen erklären auf Englisch, warum eine Struktur so funktioniert. Das Sentence X-Ray zeigt dir an deinen eigenen Sätzen, was passiert.',
```

**New**
```js
tip: 'Die Grammatik-Lektionen erklären auf Englisch, warum eine Struktur so funktioniert. Das Sentence X-Ray zeigt Ihnen an Ihren eigenen Sätzen, was passiert.',
```

</details>

<details>
<summary>Copy change · source line 170</summary>

**Old**
```js
'Falls du modular antrittst: Termine für die starken Module fest buchen',
```

**New**
```js
'Falls Sie modular antreten: Termine für die starken Module fest buchen',
```

</details>

<details>
<summary>Copy change · source line 172</summary>

**Old**
```js
tip: 'Nutze das Sentence X-Ray für Sätze, die dir korrigiert wurden. Es zeigt Kasus, Wortstellung und Verbform an deinem eigenen Fehler.',
```

**New**
```js
tip: 'Nutzen Sie das Sentence X-Ray für Sätze, die Ihnen korrigiert wurden. Es zeigt Kasus, Wortstellung und Verbform an Ihrem eigenen Fehler.',
```

</details>

<details>
<summary>Copy change · source line 198</summary>

**Old**
```js
body: 'Alle vier Module an einem Tag abzulegen ist bequem, aber selten optimal. Wenn ein Modul deutlich schwächer ist, verschenkst du den größten Vorteil dieser Prüfung: Du könntest die starken Module früher abhaken und dir für das schwache Wochen mehr Zeit nehmen.',
```

**New**
```js
body: 'Alle vier Module an einem Tag abzulegen ist bequem, aber selten optimal. Wenn ein Modul deutlich schwächer ist, verschenken Sie den größten Vorteil dieser Prüfung: Sie könnten die starken Module früher abhaken und sich für das schwache Wochen mehr Zeit nehmen.',
```

</details>

<details>
<summary>Copy change · source line 202</summary>

**Old**
```js
body: 'Weil es sich gut anfühlt. Da zwischen den Modulen nicht verrechnet wird, sind Punkte oberhalb von 60 in einem Modul für das Bestehen wertlos. Lernzeit gehört dorthin, wo du unter der Grenze liegst.',
```

**New**
```js
body: 'Weil es sich gut anfühlt. Da zwischen den Modulen nicht verrechnet wird, sind Punkte oberhalb von 60 in einem Modul für das Bestehen wertlos. Lernzeit gehört dorthin, wo Sie unter der Grenze liegen.',
```

</details>

<details>
<summary>Copy change · source line 214</summary>

**Old**
```js
body: 'Im gemeinsamen Planungsteil wird bewertet, ob ihr miteinander sprecht. Wer seinen vorbereiteten Text abspult, ohne auf Vorschläge einzugehen, wirkt wie ein Monolog neben einem zweiten Monolog. Rückfragen und Zustimmung sind Teil der Leistung.',
```

**New**
```js
body: 'Im gemeinsamen Planungsteil wird bewertet, ob Sie miteinander sprechen. Wer seinen vorbereiteten Text abspult, ohne auf Vorschläge einzugehen, wirkt wie ein Monolog neben einem zweiten Monolog. Rückfragen und Zustimmung sind Teil der Leistung.',
```

</details>

<details>
<summary>Copy change · source line 226</summary>

**Old**
```js
text: 'Weil die Module einzeln bestanden werden müssen, braucht die Vorbereitung eine Diagnose und dann gezieltes Training pro Fertigkeit. Genau so ist Deutschmeister aufgebaut — von einem Team von Ärzten in Deutschland, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind:',
```

**New**
```js
text: `${FOUNDER_LINE_DE} Die folgenden Werkzeuge unterstützen Ihre Vorbereitung:`,
```

</details>

<details>
<summary>Copy change · source line 249</summary>

**Old**
```js
body: 'Grammatik auf Englisch erklärt, plus ein Werkzeug, das deine eigenen Sätze in Fälle und Satzglieder zerlegt — dort entstehen die Fehler, die im Schreiben Punkte kosten.',
```

**New**
```js
body: 'Grammatik auf Englisch erklärt, plus ein Werkzeug, das Ihre eigenen Sätze in Fälle und Satzglieder zerlegt — dort entstehen die Fehler, die im Schreiben Punkte kosten.',
```

</details>

<details>
<summary>Copy change · source line 264</summary>

**Old**
```js
a: 'Ja. Lesen, Hören, Schreiben und Sprechen können einzeln oder gemeinsam an einem Termin abgelegt werden, und jedes Modul wird separat bewertet. Bis wann einzeln bestandene Module zu einem Gesamtzertifikat kombiniert werden können, regelt dein Prüfungszentrum — frag dort nach, bevor du die Prüfung aufteilst.',
```

**New**
```js
a: 'Ja. Lesen, Hören, Schreiben und Sprechen können einzeln oder gemeinsam an einem Termin abgelegt werden, und jedes Modul wird separat bewertet. Bis wann einzeln bestandene Module zu einem Gesamtzertifikat kombiniert werden können, regelt Ihr Prüfungszentrum — fragen Sie dort nach, bevor Sie die Prüfung aufteilen.',
```

</details>

<details>
<summary>Copy change · source line 272</summary>

**Old**
```js
a: 'Nein. Du wiederholst nur das Modul, das du nicht bestanden hast. Das ist der wesentliche Vorteil der Modulstruktur gegenüber Prüfungen, die schriftlich und mündlich als Blöcke bewerten.',
```

**New**
```js
a: 'Nein. Sie wiederholen nur das Modul, das Sie nicht bestanden haben. Das ist der wesentliche Vorteil der Modulstruktur gegenüber Prüfungen, die schriftlich und mündlich als Blöcke bewerten.',
```

</details>

<details>
<summary>Copy change · source line 276</summary>

**Old**
```js
a: 'Beide weisen dasselbe GER-Niveau nach und werden für Aufenthalt und Einbürgerung anerkannt. Goethe ist modular, telc prüft in zwei Blöcken und hat zusätzlich Sprachbausteine als eigenen Teil. Wenn ein Fertigkeitsbereich bei dir deutlich schwächer ist, spricht die Modulstruktur für Goethe. Ansonsten entscheidet meist, welche Prüfung in deiner Nähe angeboten wird.',
```

**New**
```js
a: 'Beide weisen dasselbe GER-Niveau nach und werden für Aufenthalt und Einbürgerung anerkannt. Goethe ist modular, telc prüft in zwei Blöcken und hat zusätzlich Sprachbausteine als eigenen Teil. Wenn ein Fertigkeitsbereich bei Ihnen deutlich schwächer ist, spricht die Modulstruktur für Goethe. Ansonsten entscheidet meist, welche Prüfung in Ihrer Nähe angeboten wird.',
```

</details>

<details>
<summary>Copy change · source line 284</summary>

**Old**
```js
a: 'Die Gebühr setzt das jeweilige Prüfungszentrum fest und unterscheidet sich je nach Land und Ort; bei modularer Ablegung wird meist pro Modul abgerechnet. Die aktuellen Preise stehen beim Goethe-Institut oder Prüfungszentrum in deiner Nähe.',
```

**New**
```js
a: 'Die Gebühr setzt das jeweilige Prüfungszentrum fest und unterscheidet sich je nach Land und Ort; bei modularer Ablegung wird meist pro Modul abgerechnet. Die aktuellen Preise stehen beim Goethe-Institut oder Prüfungszentrum in Ihrer Nähe.',
```

</details>

<details>
<summary>Copy change · source line 292</summary>

**Old**
```js
a: 'Sprechen wird in der Regel als Paarprüfung abgenommen und dauert etwa 15 Minuten, mit rund 15 Minuten Vorbereitungszeit davor. Ihr plant gemeinsam etwas und präsentiert jeweils ein Thema. Bewertet wird auch, wie ihr aufeinander eingeht.',
```

**New**
```js
a: 'Sprechen wird in der Regel als Paarprüfung abgenommen und dauert etwa 15 Minuten, mit rund 15 Minuten Vorbereitungszeit davor. Sie planen gemeinsam etwas und präsentieren jeweils ein Thema. Bewertet wird auch, wie Sie aufeinander eingehen.',
```

</details>

<details>
<summary>Copy change · source line 297</summary>

**Old**
```js
heading: 'Finde heraus, welches Modul dich aufhält',
body: 'Der Einstufungstest zeigt dir in wenigen Minuten, wo du stehst — danach weißt du, wohin deine Lernzeit gehört.',
```

**New**
```js
heading: 'Finden Sie heraus, welches Modul Sie aufhält',
body: 'Der Einstufungstest zeigt Ihnen in wenigen Minuten, wo Sie stehen — danach wissen Sie, wohin Ihre Lernzeit gehört.',
```

</details>

## astro-site/src/data/guides/telc-b2.js

<details>
<summary>Copy change · source line 22</summary>

**Old**
```js
'B2 ist kein größeres B1. Auf B1 zeigst du, dass du dich verständigen kannst; auf B2 sollst du <strong>argumentieren, abwägen und zusammenhängend darstellen</strong> — und das unter deutlich mehr Zeitdruck. Dieser Leitfaden zeigt den Aufbau der telc Deutsch B2 Prüfung, wo die Punkte liegen und wie sich der Sprung von B1 planen lässt.',
```

**New**
```js
'B2 ist kein größeres B1. Auf B1 zeigen Sie, dass Sie sich verständigen können; auf B2 sollen Sie <strong>argumentieren, abwägen und zusammenhängend darstellen</strong> — und das unter deutlich mehr Zeitdruck. Dieser Leitfaden zeigt den Aufbau der telc Deutsch B2 Prüfung, wo die Punkte liegen und wie sich der Sprung von B1 planen lässt.',
```

</details>

<details>
<summary>Copy change · source line 25</summary>

**Old**
```js
'Die telc Deutsch B2 Prüfung besteht aus einem schriftlichen Teil (maximal 225 Punkte) und einer mündlichen Paarprüfung (maximal 75 Punkte). Zum Bestehen brauchst du mindestens 60 % in beiden Teilen getrennt: 135 der 225 Punkte schriftlich und 45 der 75 mündlich. Lesen und Hören bringen zusammen 150 der 225 schriftlichen Punkte, die Sprachbausteine nur 30 — der kleinste Posten der Prüfung.',
```

**New**
```js
'Die telc Deutsch B2 Prüfung besteht aus einem schriftlichen Teil (maximal 225 Punkte) und einer mündlichen Paarprüfung (maximal 75 Punkte). Zum Bestehen brauchen Sie mindestens 60 % in beiden Teilen getrennt: 135 der 225 Punkte schriftlich und 45 der 75 mündlich. Lesen und Hören bringen zusammen 150 der 225 schriftlichen Punkte, die Sprachbausteine nur 30 — der kleinste Posten der Prüfung.',
```

</details>

<details>
<summary>Copy change · source line 36</summary>

**Old**
```js
text: 'B2 ist die vierte Stufe des Gemeinsamen Europäischen Referenzrahmens. Du verstehst die Hauptinhalte komplexer Texte, kannst dich spontan und fließend verständigen und einen Standpunkt zu einer aktuellen Frage erklären — mit Vor- und Nachteilen.',
```

**New**
```js
text: 'B2 ist die vierte Stufe des Gemeinsamen Europäischen Referenzrahmens. Sie verstehen die Hauptinhalte komplexer Texte, können sich spontan und fließend verständigen und einen Standpunkt zu einer aktuellen Frage erklären — mit Vor- und Nachteilen.',
```

</details>

<details>
<summary>Copy change · source line 40</summary>

**Old**
```js
text: 'Der praktische Unterschied zu <a href="/leitfaden/telc-b1/">B1</a> ist weniger der Wortschatz als die <strong>Textsorte im Kopf</strong>. Auf B1 reicht es, zu berichten: was passiert ist, was du willst. Auf B2 musst du eine Position aufbauen, sie begründen, Gegenargumente einräumen und zu einem Schluss kommen. Genau daran scheitern Kandidaten, deren Grammatik längst gut genug ist.',
```

**New**
```js
text: 'Der praktische Unterschied zu <a href="/leitfaden/telc-b1/">B1</a> ist weniger der Wortschatz als die <strong>Textsorte im Kopf</strong>. Auf B1 reicht es, zu berichten: was passiert ist, was Sie wollen. Auf B2 müssen Sie eine Position aufbauen, sie begründen, Gegenargumente einräumen und zu einem Schluss kommen. Genau daran scheitern Kandidaten, deren Grammatik längst gut genug ist.',
```

</details>

<details>
<summary>Copy change · source line 44</summary>

**Old**
```js
text: 'telc Deutsch B2 wird von Arbeitgebern und Hochschulen häufig verlangt. In vielen Berufen — besonders im Gesundheitswesen — ist B2 die Schwelle für die Anerkennung. Welcher Nachweis für deinen Fall gilt, sagt dir die zuständige Stelle.',
```

**New**
```js
text: 'telc Deutsch B2 wird von Arbeitgebern und Hochschulen häufig verlangt. In vielen Berufen — besonders im Gesundheitswesen — ist B2 die Schwelle für die Anerkennung. Welcher Nachweis für Ihren Fall gilt, sagt Ihnen die zuständige Stelle.',
```

</details>

<details>
<summary>Copy change · source line 69</summary>

**Old**
```js
text: 'Die mündliche Prüfung findet meist als Paarprüfung statt und dauert etwa 15 Minuten pro Paar; davor bekommst du eine getrennte Vorbereitungszeit von rund 20 Minuten. Die genauen Zeiten können je nach Prüfungsversion abweichen — dein Prüfungszentrum sagt dir, welche Fassung geprüft wird.',
```

**New**
```js
text: 'Die mündliche Prüfung findet meist als Paarprüfung statt und dauert etwa 15 Minuten pro Paar; davor bekommen Sie eine getrennte Vorbereitungszeit von rund 20 Minuten. Die genauen Zeiten können je nach Prüfungsversion abweichen — Ihr Prüfungszentrum sagt Ihnen, welche Fassung geprüft wird.',
```

</details>

<details>
<summary>Copy change · source line 88</summary>

**Old**
```js
text: 'Du brauchst mindestens <strong>60 % in beiden Teilen getrennt</strong>: 135 der 225 Punkte im schriftlichen Teil und 45 der 75 Punkte im mündlichen. Ein sehr gutes Ergebnis in einem Teil gleicht ein schwaches im anderen nicht aus.',
```

**New**
```js
text: 'Sie brauchen mindestens <strong>60 % in beiden Teilen getrennt</strong>: 135 der 225 Punkte im schriftlichen Teil und 45 der 75 Punkte im mündlichen. Ein sehr gutes Ergebnis in einem Teil gleicht ein schwaches im anderen nicht aus.',
```

</details>

<details>
<summary>Copy change · source line 92</summary>

**Old**
```js
text: 'Wie auf B1 lassen sich die beiden Teile in der Regel getrennt wiederholen. Die Bedingungen und Fristen legt dein Prüfungszentrum fest.',
```

**New**
```js
text: 'Wie auf B1 lassen sich die beiden Teile in der Regel getrennt wiederholen. Die Bedingungen und Fristen legt Ihr Prüfungszentrum fest.',
```

</details>

<details>
<summary>Copy change · source line 110</summary>

**Old**
```js
text: 'Wenn du nicht sicher bist, ob dein B1 wirklich sitzt: <a href="/level-test/">Einstufungstest</a> zuerst.',
```

**New**
```js
text: 'Wenn Sie nicht sicher sind, ob Ihr B1 wirklich sitzt: <a href="/level-test/">Einstufungstest</a> zuerst.',
```

</details>

<details>
<summary>Copy change · source line 157</summary>

**Old**
```js
tip: 'Das Sentence X-Ray hilft bei den Sprachbausteinen: Es zeigt an deinen eigenen Sätzen, welcher Fall und welche Struktur verlangt ist.',
```

**New**
```js
tip: 'Das Sentence X-Ray hilft bei den Sprachbausteinen: Es zeigt an Ihren eigenen Sätzen, welcher Fall und welche Struktur verlangt ist.',
```

</details>

<details>
<summary>Copy change · source line 206</summary>

**Old**
```js
body: 'Im Diskussionsteil wird bewertet, ob du auf Argumente eingehst — zustimmst, einschränkst, widersprichst. Ein auswendig gelernter Vortrag neben einem zweiten Vortrag erfüllt die Aufgabe nicht.',
```

**New**
```js
body: 'Im Diskussionsteil wird bewertet, ob Sie auf Argumente eingehen — zustimmen, einschränken, widersprechen. Ein auswendig gelernter Vortrag neben einem zweiten Vortrag erfüllt die Aufgabe nicht.',
```

</details>

<details>
<summary>Copy change · source line 222</summary>

**Old**
```js
text: 'B2 verlangt Menge und Regelmäßigkeit — vor allem beim Hören und Sprechen. Deutschmeister wurde von einem Team von Ärzten in Deutschland gebaut, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind — und dafür ist die Plattform gebaut:',
```

**New**
```js
text: `${FOUNDER_LINE_DE} Die folgenden Werkzeuge unterstützen Ihre Vorbereitung:`,
```

</details>

<details>
<summary>Copy change · source line 230</summary>

**Old**
```js
body: 'Übe Position beziehen und begründen im freien Gespräch, danach mit einer Auswertung zu Grammatik und Ausdruck — täglich, ohne Termin.',
```

**New**
```js
body: 'Üben Sie Position beziehen und begründen im freien Gespräch, danach mit einer Auswertung zu Grammatik und Ausdruck — täglich, ohne Termin.',
```

</details>

<details>
<summary>Copy change · source line 251</summary>

**Old**
```js
text: 'Die <a href="/grammar/b2.1/">B2-Grammatik</a> deckt die Strukturen ab, die den Unterschied zwischen B1- und B2-Ausdruck ausmachen. Wenn du noch nicht sicher auf B1 bist, fang beim <a href="/leitfaden/telc-b1/">telc-B1-Leitfaden</a> an.',
```

**New**
```js
text: 'Die <a href="/grammar/b2.1/">B2-Grammatik</a> deckt die Strukturen ab, die den Unterschied zwischen B1- und B2-Ausdruck ausmachen. Wenn Sie noch nicht sicher auf B1 sind, beginnen Sie mit dem <a href="/leitfaden/telc-b1/">telc-B1-Leitfaden</a>.',
```

</details>

<details>
<summary>Copy change · source line 260</summary>

**Old**
```js
a: 'Der Aufbau ist ähnlich — schriftlicher und mündlicher Teil, Sprachbausteine als eigener Bereich — aber die Anforderung ist eine andere. Auf B1 berichtest du, auf B2 argumentierst du: Position beziehen, begründen, Gegenargumente einräumen. Texte und Hörbeiträge sind außerdem länger und dichter.',
```

**New**
```js
a: 'Der Aufbau ist ähnlich — schriftlicher und mündlicher Teil, Sprachbausteine als eigener Bereich — aber die Anforderung ist eine andere. Auf B1 berichten Sie, auf B2 argumentieren Sie: Position beziehen, begründen, Gegenargumente einräumen. Texte und Hörbeiträge sind außerdem länger und dichter.',
```

</details>

<details>
<summary>Copy change · source line 276</summary>

**Old**
```js
a: 'In der Regel lassen sich schriftlicher und mündlicher Teil getrennt wiederholen, sodass nicht die gesamte Prüfung noch einmal abgelegt werden muss. Die genauen Bedingungen und Fristen legt dein Prüfungszentrum fest.',
```

**New**
```js
a: 'In der Regel lassen sich schriftlicher und mündlicher Teil getrennt wiederholen, sodass nicht die gesamte Prüfung noch einmal abgelegt werden muss. Die genauen Bedingungen und Fristen legt Ihr Prüfungszentrum fest.',
```

</details>

<details>
<summary>Copy change · source line 280</summary>

**Old**
```js
a: 'Das hängt vom Beruf ab. In vielen reglementierten Berufen, besonders im Gesundheitswesen, ist B2 die übliche Schwelle, teils zusätzlich eine Fachsprachprüfung. Welcher Nachweis in deinem Fall verlangt wird, entscheidet die zuständige Anerkennungsstelle.',
```

**New**
```js
a: 'Das hängt vom Beruf ab. In vielen reglementierten Berufen, besonders im Gesundheitswesen, ist B2 die übliche Schwelle, teils zusätzlich eine Fachsprachprüfung. Welcher Nachweis in Ihrem Fall verlangt wird, entscheidet die zuständige Anerkennungsstelle.',
```

</details>

<details>
<summary>Copy change · source line 284</summary>

**Old**
```js
a: 'Die Gebühren setzt jedes Prüfungszentrum selbst fest und sie ändern sich regelmäßig. Frag bei einer Volkshochschule oder einem telc-Prüfungszentrum in deiner Nähe nach dem aktuellen Preis.',
```

**New**
```js
a: 'Die Gebühren setzt jedes Prüfungszentrum selbst fest und sie ändern sich regelmäßig. Fragen Sie bei einer Volkshochschule oder einem telc-Prüfungszentrum in Ihrer Nähe nach dem aktuellen Preis.',
```

</details>

<details>
<summary>Copy change · source line 288</summary>

**Old**
```js
a: 'Beide prüfen dasselbe GER-Niveau. telc hat Sprachbausteine als eigenen Teil und bewertet schriftlich und mündlich als Blöcke; das Goethe-Zertifikat ist modular aufgebaut. Welche Prüfung besser passt, hängt davon ab, ob du gleichmäßig stark bist oder einen Bereich einzeln angehen willst.',
```

**New**
```js
a: 'Beide prüfen dasselbe GER-Niveau. telc hat Sprachbausteine als eigenen Teil und bewertet schriftlich und mündlich als Blöcke; das Goethe-Zertifikat ist modular aufgebaut. Welche Prüfung besser passt, hängt davon ab, ob Sie gleichmäßig stark sind oder einen Bereich einzeln angehen wollen.',
```

</details>

<details>
<summary>Copy change · source line 294</summary>

**Old**
```js
body: 'Prüf zuerst, ob dein B1 wirklich sitzt — danach weißt du, ob du absichern oder schon argumentieren üben solltest.',
```

**New**
```js
body: 'Prüfen Sie zuerst, ob Ihr B1 wirklich sitzt — danach wissen Sie, ob Sie absichern oder schon argumentieren üben sollten.',
```

</details>

## astro-site/src/data/guides/goethe-a2.js

<details>
<summary>Copy change · source line 87</summary>

**Old**
```js
'Das <strong>Goethe-Zertifikat A2</strong> ist die erste Prüfung, bei der zwei Grenzen gleichzeitig gelten: Du brauchst genug Punkte <strong>im schriftlichen Teil</strong> und genug Punkte <strong>im Sprechen</strong>. Eine starke Lesenote rettet eine schwache mündliche Prüfung hier nicht mehr — anders als noch auf A1. Dieser Leitfaden zeigt dir den Aufbau der vier Teile, die genaue Punkterechnung, wie du dich anmeldest und einen realistischen Lernplan für 8 bis 12 Wochen.',
```

**New**
```js
'Das <strong>Goethe-Zertifikat A2</strong> ist die erste Prüfung, bei der zwei Grenzen gleichzeitig gelten: Sie brauchen genug Punkte <strong>im schriftlichen Teil</strong> und genug Punkte <strong>im Sprechen</strong>. Eine starke Lesenote rettet eine schwache mündliche Prüfung hier nicht mehr — anders als noch auf A1. Dieser Leitfaden zeigt Ihnen den Aufbau der vier Teile, die genaue Punkterechnung, wie Sie sich anmelden und einen realistischen Lernplan für 8 bis 12 Wochen.',
```

</details>

<details>
<summary>Copy change · source line 90</summary>

**Old**
```js
'Das Goethe-Zertifikat A2 ist die A2-Deutschprüfung des Goethe-Instituts für Erwachsene; empfohlen wird sie ab 16 Jahren, ein Mindestalter gibt es nicht. Sie besteht aus vier Teilen: Lesen (30 Minuten), Hören (ca. 30 Minuten), Schreiben (30 Minuten) und Sprechen (ca. 15 Minuten, als Paarprüfung zu zweit). Jeder Teil zählt 25 Punkte, zusammen also 100. Bestanden ist die Prüfung ab 60 Punkten insgesamt — dabei brauchst du mindestens 45 von 75 Punkten in den drei schriftlichen Teilen und mindestens 15 von 25 Punkten im Sprechen. Wer eine dieser beiden Grenzen verfehlt, hat die gesamte Prüfung nicht bestanden, auch bei 60 Punkten in der Summe.',
```

**New**
```js
'Das Goethe-Zertifikat A2 ist die A2-Deutschprüfung des Goethe-Instituts für Erwachsene; empfohlen wird sie ab 16 Jahren, ein Mindestalter gibt es nicht. Sie besteht aus vier Teilen: Lesen (30 Minuten), Hören (ca. 30 Minuten), Schreiben (30 Minuten) und Sprechen (ca. 15 Minuten, als Paarprüfung zu zweit). Jeder Teil zählt 25 Punkte, zusammen also 100. Bestanden ist die Prüfung ab 60 Punkten insgesamt — dabei brauchen Sie mindestens 45 von 75 Punkten in den drei schriftlichen Teilen und mindestens 15 von 25 Punkten im Sprechen. Wer eine dieser beiden Grenzen verfehlt, hat die gesamte Prüfung nicht bestanden, auch bei 60 Punkten in der Summe.',
```

</details>

<details>
<summary>Copy change · source line 134</summary>

**Old**
```js
text: 'Das <strong>Goethe-Zertifikat A2</strong> ist die A2-Deutschprüfung des Goethe-Instituts und weist die zweite Stufe des Gemeinsamen Europäischen Referenzrahmens (GER) nach: Du verstehst Sätze und häufige Ausdrücke aus dem eigenen Alltag — Arbeit, Wohnung, Einkaufen, Familie, Termine — und kannst dich in einfachen Routinesituationen verständigen.',
```

**New**
```js
text: 'Das <strong>Goethe-Zertifikat A2</strong> ist die A2-Deutschprüfung des Goethe-Instituts und weist die zweite Stufe des Gemeinsamen Europäischen Referenzrahmens (GER) nach: Sie verstehen Sätze und häufige Ausdrücke aus dem eigenen Alltag — Arbeit, Wohnung, Einkaufen, Familie, Termine — und können sich in einfachen Routinesituationen verständigen.',
```

</details>

<details>
<summary>Copy change · source line 138</summary>

**Old**
```js
text: 'Es gibt zwei Fassungen der Prüfung. Für die hier beschriebene Erwachsenenfassung wird ein Alter <strong>ab 16 Jahren empfohlen</strong> — eine Altersgrenze ist das nicht: Die Prüfungen des Goethe-Instituts können unabhängig vom Erreichen eines Mindestalters abgelegt werden. Für Jugendliche gibt es die inhaltlich passend zugeschnittene Variante <strong>Goethe-Zertifikat A2: Fit in Deutsch</strong>. Format, Punkte und Bestehensregel sind bei beiden gleich aufgebaut, die Themen und Textsorten unterscheiden sich. Die Erwachsenenprüfung hat die ältere Prüfung „Start Deutsch 2“ abgelöst — wenn dir dieser Name in älteren Kursbüchern begegnet, ist dieselbe Stufe gemeint.',
```

**New**
```js
text: 'Es gibt zwei Fassungen der Prüfung. Für die hier beschriebene Erwachsenenfassung wird ein Alter <strong>ab 16 Jahren empfohlen</strong> — eine Altersgrenze ist das nicht: Die Prüfungen des Goethe-Instituts können unabhängig vom Erreichen eines Mindestalters abgelegt werden. Für Jugendliche gibt es die inhaltlich passend zugeschnittene Variante <strong>Goethe-Zertifikat A2: Fit in Deutsch</strong>. Format, Punkte und Bestehensregel sind bei beiden gleich aufgebaut, die Themen und Textsorten unterscheiden sich. Die Erwachsenenprüfung hat die ältere Prüfung „Start Deutsch 2“ abgelöst — wenn Ihnen dieser Name in älteren Kursbüchern begegnet, ist dieselbe Stufe gemeint.',
```

</details>

<details>
<summary>Copy change · source line 146</summary>

**Old**
```js
text: 'Ob dein Antrag mit einem A2-Zeugnis vollständig ist, entscheidet immer die zuständige Ausländerbehörde oder Auslandsvertretung — nicht diese Seite und nicht ein Sprachkursanbieter. Frag dort nach, welches Niveau und welche Form des Nachweises in deinem Fall verlangt werden, bevor du einen Prüfungstermin buchst.',
```

**New**
```js
text: 'Ob Ihr Antrag mit einem A2-Zeugnis vollständig ist, entscheidet immer die zuständige Ausländerbehörde oder Auslandsvertretung — nicht diese Seite und nicht ein Sprachkursanbieter. Fragen Sie dort nach, welches Niveau und welche Form des Nachweises in Ihrem Fall verlangt werden, bevor Sie einen Prüfungstermin buchen.',
```

</details>

<details>
<summary>Copy change · source line 150</summary>

**Old**
```js
text: 'Daneben legen viele Menschen A2 ohne rechtlichen Anlass ab: als Zwischenziel auf dem Weg zu B1, als Nachweis für Arbeitgeber und Sprachschulen oder einfach, um nach einem Jahr Lernen einen belastbaren Beleg in der Hand zu haben. Für ein <strong>Studium</strong> reicht A2 nicht: Für die Zulassung verlangen deutsche Hochschulen nach der Rahmenordnung der Hochschulrektorenkonferenz einen Nachweis wie DSH-2 oder TestDaF mit 4×TDN 4 — also ein deutlich höheres Niveau. Welches Niveau ein <strong>Ausbildungsbetrieb</strong> erwartet, legt der Betrieb beziehungsweise die zuständige Kammer fest; frag dort nach, statt dich auf eine allgemeine Angabe zu verlassen.',
```

**New**
```js
text: 'Daneben legen viele Menschen A2 ohne rechtlichen Anlass ab: als Zwischenzielen Sie auf dem Weg zu B1, als Nachweis für Arbeitgeber und Sprachschulen oder einfach, um nach einem Jahr Lernen einen belastbaren Beleg in der Hand zu haben. Für ein <strong>Studium</strong> reicht A2 nicht: Für die Zulassung verlangen deutsche Hochschulen nach der Rahmenordnung der Hochschulrektorenkonferenz einen Nachweis wie DSH-2 oder TestDaF mit 4×TDN 4 — also ein deutlich höheres Niveau. Welches Niveau ein <strong>Ausbildungsbetrieb</strong> erwartet, legt der Betrieb beziehungsweise die zuständige Kammer fest; fragen Sie dort nach, statt sich auf eine allgemeine Angabe zu verlassen.',
```

</details>

<details>
<summary>Copy change · source line 166</summary>

**Old**
```js
['Lesen', '30 Min.', '4 Teile, 20 Aufgaben: kurze Mitteilungen und E-Mails, Anzeigen, Zeitungs- und Internettexte. In den Teilen 1–3 kreuzt du an, in Teil 4 ordnest du zu.', '25'],
```

**New**
```js
['Lesen', '30 Min.', '4 Teile, 20 Aufgaben: kurze Mitteilungen und E-Mails, Anzeigen, Zeitungs- und Internettexte. In den Teilen 1–3 kreuzen Sie an, in Teil 4 ordnen Sie zu.', '25'],
```

</details>

<details>
<summary>Copy change · source line 174</summary>

**Old**
```js
text: 'Im Hören gibt es eine Falle, die man vorher kennen sollte: Nicht jeder Text läuft zweimal. In den <strong>Teilen 1, 3 und 4</strong> hörst du zweimal, im <strong>Teil 2 nur einmal</strong>. Genau dort verlieren viele Punkte, weil sie an einem unbekannten Wort hängen bleiben und den Rest der Aufnahme verpassen. Wer weiß, dass dieser Teil nur einmal läuft, liest die Aufgaben vorher und hört gezielt.',
```

**New**
```js
text: 'Im Hören gibt es eine Falle, die man vorher kennen sollte: Nicht jeder Text läuft zweimal. In den <strong>Teilen 1, 3 und 4</strong> hören Sie zweimal, im <strong>Teil 2 nur einmal</strong>. Genau dort verlieren viele Punkte, weil sie an einem unbekannten Wort hängen bleiben und den Rest der Aufnahme verpassen. Wer weiß, dass dieser Teil nur einmal läuft, liest die Aufgaben vorher und hört gezielt.',
```

</details>

<details>
<summary>Copy change · source line 178</summary>

**Old**
```js
text: 'Das Sprechen ist eine <strong>Paarprüfung</strong> ohne Vorbereitungszeit: Du sprichst mit einer zweiten teilnehmenden Person, nicht nur mit der Prüferin oder dem Prüfer. Zuerst stellt ihr euch gegenseitig Fragen zur Person, dann erzählst du etwas aus deinem Alltag, und zum Schluss plant ihr gemeinsam etwas — zum Beispiel einen Ausflug oder ein Treffen. Der dritte Teil ist der, den man am wenigsten allein üben kann, und deshalb der, den die meisten unterschätzen.',
```

**New**
```js
text: 'Das Sprechen ist eine <strong>Paarprüfung</strong> ohne Vorbereitungszeit: Sie sprechen mit einer zweiten teilnehmenden Person, nicht nur mit der Prüferin oder dem Prüfer. Zuerst stellen Sie sich gegenseitig Fragen zur Person, dann erzählen Sie etwas aus Ihrem Alltag, und zum Schluss planen Sie gemeinsam etwas — zum Beispiel einen Ausflug oder ein Treffen. Der dritte Teil ist der, den man am wenigsten allein üben kann, und deshalb der, den die meisten unterschätzen.',
```

</details>

<details>
<summary>Copy change · source line 182</summary>

**Old**
```js
text: 'Der kostenlose Modellsatz zeigt dir alle vier Teile im Original-Layout, inklusive Antwortbogen. Ein einziger Durchgang damit erspart dir am Prüfungstag die Frage „Was soll ich hier eigentlich machen?“ — und die kostet mehr Zeit als jede Vokabellücke.',
```

**New**
```js
text: 'Der kostenlose Modellsatz zeigt Ihnen alle vier Teile im Original-Layout, inklusive Antwortbogen. Ein einziger Durchgang damit erspart Ihnen am Prüfungstag die Frage „Was soll ich hier eigentlich machen?“ — und die kostet mehr Zeit als jede Vokabellücke.',
```

</details>

<details>
<summary>Copy change · source line 196</summary>

**Old**
```js
text: 'Bestanden ist die Prüfung, wenn du insgesamt mindestens <strong>60 von 100 Punkten</strong> erreichst <strong>und</strong> dabei mindestens <strong>45 von 75 Punkten in der schriftlichen Prüfung</strong> sowie mindestens <strong>15 von 25 Punkten in der mündlichen Prüfung</strong>. Außerdem müssen alle Prüfungsteile abgelegt worden sein.',
```

**New**
```js
text: 'Bestanden ist die Prüfung, wenn Sie insgesamt mindestens <strong>60 von 100 Punkten</strong> erreichen <strong>und</strong> dabei mindestens <strong>45 von 75 Punkten in der schriftlichen Prüfung</strong> sowie mindestens <strong>15 von 25 Punkten in der mündlichen Prüfung</strong>. Außerdem müssen alle Prüfungsteile abgelegt worden sein.',
```

</details>

<details>
<summary>Copy change · source line 204</summary>

**Old**
```js
text: 'Rechne rückwärts, nicht vorwärts: 15 von 25 Punkten im Sprechen sind 60 % einer Prüfung, in der du unter Zeitdruck und mit einer fremden Partnerin sprichst. Wer das Sprechen bis zwei Wochen vor dem Termin aufschiebt, plant genau die Hürde ein, die am schwersten kurzfristig zu heben ist.',
```

**New**
```js
text: 'Rechnen Sie rückwärts, nicht vorwärts: 15 von 25 Punkten im Sprechen sind 60 % einer Prüfung, in der Sie unter Zeitdruck und mit einer fremden Partnerin sprechen. Wer das Sprechen bis zwei Wochen vor dem Termin aufschiebt, plant genau die Hürde ein, die am schwersten kurzfristig zu heben ist.',
```

</details>

<details>
<summary>Copy change · source line 208</summary>

**Old**
```js
text: 'Wie oft und in welcher Form du die Prüfung wiederholen kannst, regeln die Durchführungsbestimmungen. Wiederholen lässt sich dort entweder die <strong>mündliche</strong> oder die <strong>gesamte schriftliche</strong> Prüfung — nie ein einzelner Prüfungsteil, also zum Beispiel nicht Lesen allein. Und auch das nur in Ausnahmefällen und nur, wenn die organisatorischen Bedingungen am Prüfungszentrum es zulassen; verlass dich also nicht darauf. Frag dein Prüfungszentrum, bevor du dich zum zweiten Mal anmeldest.',
```

**New**
```js
text: 'Wie oft und in welcher Form Sie die Prüfung wiederholen können, regeln die Durchführungsbestimmungen. Wiederholen lässt sich dort entweder die <strong>mündliche</strong> oder die <strong>gesamte schriftliche</strong> Prüfung — nie ein einzelner Prüfungsteil, also zum Beispiel nicht Lesen allein. Und auch das nur in Ausnahmefällen und nur, wenn die organisatorischen Bedingungen am Prüfungszentrum es zulassen; verlassen Sie sich also nicht darauf. Fragen Sie Ihr Prüfungszentrum, bevor Sie sich zum zweiten Mal anmelden.',
```

</details>

<details>
<summary>Copy change · source line 218</summary>

**Old**
```js
text: 'Die Prüfung legst du an einem Goethe-Institut oder an einem lizenzierten Prüfungszentrum ab. Welche Zentren das in deiner Stadt oder deinem Land sind, steht auf goethe.de; Termine, Anmeldeweg und Fristen stehen auf der Seite des jeweiligen Zentrums. Plane den Vorlauf großzügig: In Städten mit wenigen Zentren sind A2-Termine oft Wochen im Voraus belegt.',
```

**New**
```js
text: 'Die Prüfung legen Sie an einem Goethe-Institut oder an einem lizenzierten Prüfungszentrum ab. Welche Zentren das in Ihrer Stadt oder Ihrem Land sind, steht auf goethe.de; Termine, Anmeldeweg und Fristen stehen auf der Seite des jeweiligen Zentrums. Planen Sie den Vorlauf großzügig: In Städten mit wenigen Zentren sind A2-Termine oft Wochen im Voraus belegt.',
```

</details>

<details>
<summary>Copy change · source line 234</summary>

**Old**
```js
'Die Terminliste deines Prüfungszentrums — der Engpass ist oft der Termin, nicht die Vorbereitung',
```

**New**
```js
'Die Terminliste Ihres Prüfungszentrums — der Engpass ist oft der Termin, nicht die Vorbereitung',
```

</details>

<details>
<summary>Copy change · source line 245</summary>

**Old**
```js
text: 'Das Goethe-Institut rechnet je nach Vorkenntnissen und Lernbedingungen mit <strong>200 bis 350 Unterrichtseinheiten à 45 Minuten</strong> bis zum Niveau A2 — das ist der Weg von null, nicht der Weg von A1. Dieser Plan setzt ein <strong>abgeschlossenes A1-Niveau</strong> voraus und deckt nur die letzte Etappe ab. Bei 45 bis 60 Minuten Lernzeit am Tag sind dafür 8 bis 12 Wochen realistisch. Wenn du weniger als vier Tage pro Woche lernst, plane eher am oberen Ende — und wenn du bei null anfängst, ist A1 der richtige Startpunkt, nicht dieser Plan.',
```

**New**
```js
text: 'Das Goethe-Institut rechnet je nach Vorkenntnissen und Lernbedingungen mit <strong>200 bis 350 Unterrichtseinheiten à 45 Minuten</strong> bis zum Niveau A2 — das ist der Weg von null, nicht der Weg von A1. Dieser Plan setzt ein <strong>abgeschlossenes A1-Niveau</strong> voraus und deckt nur die letzte Etappe ab. Bei 45 bis 60 Minuten Lernzeit am Tag sind dafür 8 bis 12 Wochen realistisch. Wenn Sie weniger als vier Tage pro Woche lernen, planen Sie eher am oberen Ende — und wenn Sie bei null anfangen, ist A1 der richtige Startpunkt, nicht dieser Plan.',
```

</details>

<details>
<summary>Copy change · source line 249</summary>

**Old**
```js
text: 'Bevor du loslegst: Mach den <a href="/level-test/">kostenlosen Einstufungstest</a>. Er zeigt dir in etwa 20 Minuten, ob du wirklich auf A1-Niveau stehst oder ob unten noch Lücken sind, die dich später Punkte kosten.',
```

**New**
```js
text: 'Bevor Sie loslegen: Machen Sie den <a href="/level-test/">kostenlosen Einstufungstest</a>. Er zeigt Ihnen in etwa 20 Minuten, ob Sie wirklich auf A1-Niveau stehen oder ob unten noch Lücken sind, die Sie später Punkte kosten.',
```

</details>

<details>
<summary>Copy change · source line 263</summary>

**Old**
```js
tip: 'Dativ und Akkusativ sind auf A2 kein Grammatikthema unter vielen — sie stecken in fast jedem Satz, den du in Schreiben und Sprechen produzierst. Wer sie hier sauber sortiert, spart in Woche 8 die Fehlersuche.',
```

**New**
```js
tip: 'Dativ und Akkusativ sind auf A2 kein Grammatikthema unter vielen — sie stecken in fast jedem Satz, den Sie in Schreiben und Sprechen produzieren. Wer sie hier sauber sortiert, spart in Woche 8 die Fehlersuche.',
```

</details>

<details>
<summary>Copy change · source line 274</summary>

**Old**
```js
tip: 'Im Sprechen Teil 2 erzählst du aus deinem Leben. Ohne sicheres Perfekt bleibt dieser Teil bei Aufzählungen im Präsens stecken, und genau dafür gibt es weniger Punkte.',
```

**New**
```js
tip: 'Im Sprechen Teil 2 erzählen Sie aus Ihrem Leben. Ohne sicheres Perfekt bleibt dieser Teil bei Aufzählungen im Präsens stecken, und genau dafür gibt es weniger Punkte.',
```

</details>

<details>
<summary>Copy change · source line 307</summary>

**Old**
```js
tip: 'Ein erstes Ergebnis unter 60 Punkten ist an dieser Stelle normal. Der Test ist eine Messung, keine Note — dafür machst du ihn zwei Wochen vorher und nicht am Vorabend.',
```

**New**
```js
tip: 'Ein erstes Ergebnis unter 60 Punkten ist an dieser Stelle normal. Der Test ist eine Messung, keine Note — dafür machen Sie ihn zwei Wochen vorher und nicht am Vorabend.',
```

</details>

<details>
<summary>Copy change · source line 388</summary>

**Old**
```js
body: 'Schreib die Aufgabenform der Prüfung — kurze Nachricht und halbformelle E-Mail — und bekomm sofort Rückmeldung zu Leitpunkten, Anrede, Gruß und Verbstellung an deinen eigenen Sätzen.',
```

**New**
```js
body: 'Schreiben Sie die Aufgabenform der Prüfung — kurze Nachricht und halbformelle E-Mail — und bekommen Sie sofort Rückmeldung zu Leitpunkten, Anrede, Gruß und Verbstellung an Ihren eigenen Sätzen.',
```

</details>

<details>
<summary>Copy change · source line 399</summary>

**Old**
```js
text: 'Der geführte Weg dorthin ist der A2.1-Kurs: <a href="/level/a2.1">A2.1 im Kursbereich öffnen</a>. Die Regeln zum Nachschlagen stehen in der <a href="/grammar/a2.1/">A2.1-Grammatikbibliothek</a>, und wie sich das gegen andere Anbieter schlägt, steht im <a href="/vergleich/">Vergleich</a>. Wenn du noch nicht weißt, wo du stehst, beginn mit dem <a href="/level-test/">Einstufungstest</a>.',
```

**New**
```js
text: 'Der geführte Weg dorthin ist der A2.1-Kurs: <a href="/level/a2.1">A2.1 im Kursbereich öffnen</a>. Die Regeln zum Nachschlagen stehen in der <a href="/grammar/a2.1/">A2.1-Grammatikbibliothek</a>, und wie sich das gegen andere Anbieter schlägt, steht im <a href="/vergleich/">Vergleich</a>. Wenn Sie noch nicht wissen, wo Sie stehen, beginnen Sie mit dem <a href="/level-test/">Einstufungstest</a>.',
```

</details>

<details>
<summary>Copy change · source line 420</summary>

**Old**
```js
a: 'Der Prüfungsteil Schreiben hat zwei Aufgaben und dauert 30 Minuten. In Teil 1 schreibst du eine kurze persönliche Nachricht, etwa eine SMS an eine Freundin oder einen Freund, mit rund 20 bis 30 Wörtern. In Teil 2 folgt eine halbformelle E-Mail mit rund 30 bis 40 Wörtern. Beide Aufgaben geben drei Leitpunkte vor, und alle drei müssen bearbeitet werden.',
```

**New**
```js
a: 'Der Prüfungsteil Schreiben hat zwei Aufgaben und dauert 30 Minuten. In Teil 1 schreiben Sie eine kurze persönliche Nachricht, etwa eine SMS an eine Freundin oder einen Freund, mit rund 20 bis 30 Wörtern. In Teil 2 folgt eine halbformelle E-Mail mit rund 30 bis 40 Wörtern. Beide Aufgaben geben drei Leitpunkte vor, und alle drei müssen bearbeitet werden.',
```

</details>

<details>
<summary>Copy change · source line 424</summary>

**Old**
```js
a: 'Lesen und Hören haben je vier Teile mit zusammen 20 Aufgaben. Im Lesen kreuzt du in den Teilen 1 bis 3 an und ordnest in Teil 4 zu. Im Hören hörst du die Teile 1, 3 und 4 zweimal, Teil 2 dagegen nur einmal — das ist die Stelle, an der ein unbekanntes Wort am meisten kostet.',
```

**New**
```js
a: 'Lesen und Hören haben je vier Teile mit zusammen 20 Aufgaben. Im Lesen kreuzen Sie in den Teilen 1 bis 3 an und ordnen in Teil 4 zu. Im Hören hören Sie die Teile 1, 3 und 4 zweimal, Teil 2 dagegen nur einmal — das ist die Stelle, an der ein unbekanntes Wort am meisten kostet.',
```

</details>

<details>
<summary>Copy change · source line 436</summary>

**Old**
```js
a: 'Das hängt vom Aufenthaltstitel ab und entscheidet die zuständige Behörde. Im Aufenthaltsgesetz wird A2 unter anderem in § 25a und § 25b ausdrücklich genannt, dort jeweils als „hinreichende mündliche Deutschkenntnisse im Sinne des Niveaus A2“. Für die Chancenkarte verlangt § 20a nur mindestens einfache Deutschkenntnisse oder Englisch auf B2; A2 bringt einen zusätzlichen Punkt in der Punktetabelle. Kläre deinen Fall vor der Anmeldung mit der Ausländerbehörde oder der Auslandsvertretung.',
```

**New**
```js
a: 'Das hängt vom Aufenthaltstitel ab und entscheidet die zuständige Behörde. Im Aufenthaltsgesetz wird A2 unter anderem in § 25a und § 25b ausdrücklich genannt, dort jeweils als „hinreichende mündliche Deutschkenntnisse im Sinne des Niveaus A2“. Für die Chancenkarte verlangt § 20a nur mindestens einfache Deutschkenntnisse oder Englisch auf B2; A2 bringt einen zusätzlichen Punkt in der Punktetabelle. Klären Sie Ihren Fall vor der Anmeldung mit der Ausländerbehörde oder der Auslandsvertretung.',
```

</details>

<details>
<summary>Copy change · source line 440</summary>

**Old**
```js
a: 'Das Goethe-Institut rechnet mit 200 bis 350 Unterrichtseinheiten à 45 Minuten bis zum Niveau A2 — von null gerechnet. Mit abgeschlossenem A1 und 45 bis 60 Minuten Lernzeit am Tag sind für die letzte Etappe 8 bis 12 Wochen realistisch, davon die letzten zwei bis vier Wochen als reine Prüfungsphase mit Modellsatz und Übungssatz. Wer seltener als viermal pro Woche lernt, sollte eher mit dem oberen Ende planen. Der Einstufungstest zeigt dir vorher, ob A1 wirklich sitzt.',
```

**New**
```js
a: 'Das Goethe-Institut rechnet mit 200 bis 350 Unterrichtseinheiten à 45 Minuten bis zum Niveau A2 — von null gerechnet. Mit abgeschlossenem A1 und 45 bis 60 Minuten Lernzeit am Tag sind für die letzte Etappe 8 bis 12 Wochen realistisch, davon die letzten zwei bis vier Wochen als reine Prüfungsphase mit Modellsatz und Übungssatz. Wer seltener als viermal pro Woche lernt, sollte eher mit dem oberen Ende planen. Der Einstufungstest zeigt Ihnen vorher, ob A1 wirklich sitzt.',
```

</details>

<details>
<summary>Copy change · source line 445</summary>

**Old**
```js
heading: 'Finde heraus, wo du vor dem Goethe-Zertifikat A2 stehst',
body: 'Der Einstufungstest zeigt dir in etwa 20 Minuten, ob dein A1 trägt und welche A2-Themen noch fehlen — danach weißt du, wie viel der 8 bis 12 Wochen du wirklich brauchst.',
```

**New**
```js
heading: 'Finden Sie heraus, wo Sie vor dem Goethe-Zertifikat A2 stehen',
body: 'Der Einstufungstest zeigt Ihnen in etwa 20 Minuten, ob Ihr A1 trägt und welche A2-Themen noch fehlen — danach wissen Sie, wie viel der 8 bis 12 Wochen Sie wirklich brauchen.',
```

</details>

## astro-site/src/data/guides/telc-b1.js

<details>
<summary>Copy change · source line 18</summary>

**Old**
```js
'telc Deutsch B1 Vorbereitung: 8-Wochen-Lernplan, Prüfungsaufbau, häufige Fehler und Tipps. Alles, was du zum Bestehen brauchst.',
```

**New**
```js
'telc Deutsch B1 Vorbereitung: 8-Wochen-Lernplan, Prüfungsaufbau, häufige Fehler und Tipps. Alles, was Sie zum Bestehen brauchen.',
```

</details>

<details>
<summary>Copy change · source line 23</summary>

**Old**
```js
'Du bereitest dich auf die <strong>telc Deutsch B1 Prüfung</strong> vor? Egal ob für den Aufenthaltstitel, die Einbürgerung oder den Beruf — dieser Leitfaden gibt dir alles, was du brauchst. Du erfährst, wie die Prüfung aufgebaut ist, was du Woche für Woche lernen solltest, und welche Fehler du vermeiden musst. Keine Theorie, keine Umwege.',
```

**New**
```js
'Sie bereiten sich auf die <strong>telc Deutsch B1 Prüfung</strong> vor? Egal ob für den Aufenthaltstitel, die Einbürgerung oder den Beruf — dieser Leitfaden gibt Ihnen alles, was Sie brauchen. Sie erfahren, wie die Prüfung aufgebaut ist, was Sie Woche für Woche lernen sollten, und welche Fehler Sie vermeiden müssen. Keine Theorie, keine Umwege.',
```

</details>

<details>
<summary>Copy change · source line 37</summary>

**Old**
```js
text: 'telc steht für „The European Language Certificates". Die telc Deutsch B1 Prüfung ist eine der anerkanntesten Sprachprüfungen für Deutsch als Fremdsprache. Sie prüft, ob du das Niveau B1 des Gemeinsamen Europäischen Referenzrahmens (GER) erreicht hast.',
```

**New**
```js
text: 'telc steht für „The European Language Certificates". Die telc Deutsch B1 Prüfung ist eine der anerkanntesten Sprachprüfungen für Deutsch als Fremdsprache. Sie prüft, ob Sie das Niveau B1 des Gemeinsamen Europäischen Referenzrahmens (GER) erreicht haben.',
```

</details>

<details>
<summary>Copy change · source line 41</summary>

**Old**
```js
text: 'B1 bedeutet: Du kannst dich in den meisten Alltagssituationen verständigen. Du verstehst die Hauptpunkte eines Gesprächs, wenn Standarddeutsch gesprochen wird. Du kannst über Erfahrungen berichten, Pläne erklären und kurze Texte zu vertrauten Themen schreiben.',
```

**New**
```js
text: 'B1 bedeutet: Sie können sich in den meisten Alltagssituationen verständigen. Sie verstehen die Hauptpunkte eines Gesprächs, wenn Standarddeutsch gesprochen wird. Sie können über Erfahrungen berichten, Pläne erklären und kurze Texte zu vertrauten Themen schreiben.',
```

</details>

<details>
<summary>Copy change · source line 50</summary>

**Old**
```js
text: 'Beide Prüfungen testen dasselbe Sprachniveau und werden für Aufenthalt und Einbürgerung anerkannt. Der wichtigste Unterschied liegt im Aufbau: telc hat einen eigenen Prüfungsteil „Sprachbausteine" (Grammatik und Wortschatz im Kontext), während das <a href="/leitfaden/goethe-b1/">Goethe-Zertifikat B1</a> aus vier einzeln ablegbaren Modulen besteht. Wähle die Prüfung, die in deiner Stadt leichter verfügbar ist — oder die, deren Format dir mehr liegt.',
```

**New**
```js
text: 'Beide Prüfungen testen dasselbe Sprachniveau und werden für Aufenthalt und Einbürgerung anerkannt. Der wichtigste Unterschied liegt im Aufbau: telc hat einen eigenen Prüfungsteil „Sprachbausteine" (Grammatik und Wortschatz im Kontext), während das <a href="/leitfaden/goethe-b1/">Goethe-Zertifikat B1</a> aus vier einzeln ablegbaren Modulen besteht. Wählen Sie die Prüfung, die in Ihrer Stadt leichter verfügbar ist — oder die, deren Format Ihnen mehr liegt.',
```

</details>

<details>
<summary>Copy change · source line 54</summary>

**Old**
```js
text: 'Auch der <a href="/leitfaden/dtz/">DTZ (Deutsch-Test für Zuwanderer)</a> kann B1 nachweisen. Er ist die Abschlussprüfung der Integrationskurse und testet auf A2–B1 gleichzeitig. Wenn du gezielt B1 brauchst, ist telc oder Goethe die sicherere Wahl.',
```

**New**
```js
text: 'Auch der <a href="/leitfaden/dtz/">DTZ (Deutsch-Test für Zuwanderer)</a> kann B1 nachweisen. Er ist die Abschlussprüfung der Integrationskurse und testet auf A2–B1 gleichzeitig. Wenn Sie gezielt B1 brauchen, ist telc oder Goethe die sicherere Wahl.',
```

</details>

<details>
<summary>Copy change · source line 80</summary>

**Old**
```js
text: '<strong>Leseverstehen:</strong> Du liest verschiedene Texte — von kurzen Anzeigen bis hin zu längeren Zeitungsartikeln. Die Aufgaben testen, ob du die Hauptaussagen verstehst und Details zuordnen kannst. Tipp: Lies zuerst die Aufgaben, dann den Text. So weißt du, wonach du suchst.',
```

**New**
```js
text: '<strong>Leseverstehen:</strong> Sie lesen verschiedene Texte — von kurzen Anzeigen bis hin zu längeren Zeitungsartikeln. Die Aufgaben testen, ob Sie die Hauptaussagen verstehen und Details zuordnen können. Tipp: Lesen Sie zuerst die Aufgaben, dann den Text. So wissen Sie, wonach Sie suchen.',
```

</details>

<details>
<summary>Copy change · source line 84</summary>

**Old**
```js
text: '<strong>Sprachbausteine:</strong> Dieser Teil ist typisch für telc. Du bekommst einen Lückentext und musst die richtige Grammatikform oder das richtige Wort aus mehreren Optionen wählen. Hier zeigt sich, ob du <a href="/grammar/b1.1/">Grammatik auf B1-Niveau</a> wirklich verstehst — nicht nur auswendig gelernt hast.',
```

**New**
```js
text: '<strong>Sprachbausteine:</strong> Dieser Teil ist typisch für telc. Sie bekommen einen Lückentext und müssen die richtige Grammatikform oder das richtige Wort aus mehreren Optionen wählen. Hier zeigt sich, ob Sie <a href="/grammar/b1.1/">Grammatik auf B1-Niveau</a> wirklich verstehen — nicht nur auswendig gelernt haben.',
```

</details>

<details>
<summary>Copy change · source line 88</summary>

**Old**
```js
text: '<strong>Hörverstehen:</strong> Du hörst Dialoge und Monologe — Alltagsgespräche, Durchsagen am Bahnhof, kurze Radioberichte. Die Aufgabe: Hauptaussagen erfassen und Detailinformationen zuordnen. Regelmäßiges <a href="/listening/">Hörtraining</a> ist hier der Schlüssel.',
```

**New**
```js
text: '<strong>Hörverstehen:</strong> Sie hören Dialoge und Monologe — Alltagsgespräche, Durchsagen am Bahnhof, kurze Radioberichte. Die Aufgabe: Hauptaussagen erfassen und Detailinformationen zuordnen. Regelmäßiges <a href="/listening/">Hörtraining</a> ist hier der Schlüssel.',
```

</details>

<details>
<summary>Copy change · source line 92</summary>

**Old**
```js
text: '<strong>Schriftlicher Ausdruck:</strong> Du schreibst einen Brief oder eine E-Mail zu einem vorgegebenen Thema. Typisch: Antwort auf eine Einladung, Beschwerde oder Anfrage. Achte auf die richtige Anrede, eine klare Struktur und einen passenden Schluss.',
```

**New**
```js
text: '<strong>Schriftlicher Ausdruck:</strong> Sie schreiben einen Brief oder eine E-Mail zu einem vorgegebenen Thema. Typisch: Antwort auf eine Einladung, Beschwerde oder Anfrage. Achten Sie auf die richtige Anrede, eine klare Struktur und einen passenden Schluss.',
```

</details>

<details>
<summary>Copy change · source line 97</summary>

**Old**
```js
text: 'Die mündliche Prüfung findet normalerweise als Paarprüfung statt — du sprichst mit einem anderen Kandidaten, zwei Prüfer bewerten euch.',
```

**New**
```js
text: 'Die mündliche Prüfung findet normalerweise als Paarprüfung statt — Sie sprechen mit einem anderen Kandidaten, zwei Prüfer bewerten Sie.',
```

</details>

<details>
<summary>Copy change · source line 101</summary>

**Old**
```js
text: 'Der Ablauf hat drei Teile: Zuerst stellst du dich kurz vor (Kontaktaufnahme). Dann sprichst du über ein vorgegebenes Thema — zum Beispiel Reisen, Gesundheit oder Medien. Im dritten Teil plant ihr gemeinsam etwas, etwa ein Fest oder einen Ausflug. Hier geht es nicht um perfekte Grammatik, sondern darum, dass du kommunizierst, auf deinen Partner eingehst und das Gespräch am Laufen hältst.',
```

**New**
```js
text: 'Der Ablauf hat drei Teile: Zuerst stellen Sie sich kurz vor (Kontaktaufnahme). Dann sprechen Sie über ein vorgegebenes Thema — zum Beispiel Reisen, Gesundheit oder Medien. Im dritten Teil planen Sie gemeinsam etwas, etwa ein Fest oder einen Ausflug. Hier geht es nicht um perfekte Grammatik, sondern darum, dass Sie kommunizieren, auf Ihren Partner eingehen und das Gespräch am Laufen halten.',
```

</details>

<details>
<summary>Copy change · source line 105</summary>

**Old**
```js
text: 'Das <a href="/speaking/">KI-Sprechtraining von Deutschmeister</a> simuliert genau solche Gesprächssituationen. Du übst, frei zu sprechen, und bekommst nach dem Gespräch eine Auswertung zu Grammatik und Ausdruck.',
```

**New**
```js
text: 'Das <a href="/speaking/">KI-Sprechtraining von Deutschmeister</a> simuliert genau solche Gesprächssituationen. Sie üben, frei zu sprechen, und bekommen nach dem Gespräch eine Auswertung zu Grammatik und Ausdruck.',
```

</details>

<details>
<summary>Copy change · source line 115</summary>

**Old**
```js
text: 'Um die telc Deutsch B1 Prüfung zu bestehen, brauchst du mindestens <strong>60 % der Punkte</strong> — und zwar in beiden Teilen getrennt. Du musst also sowohl den schriftlichen als auch den mündlichen Teil jeweils mit mindestens 60 % bestehen.',
```

**New**
```js
text: 'Um die telc Deutsch B1 Prüfung zu bestehen, brauchen Sie mindestens <strong>60 % der Punkte</strong> — und zwar in beiden Teilen getrennt. Sie müssen also sowohl den schriftlichen als auch den mündlichen Teil jeweils mit mindestens 60 % bestehen.',
```

</details>

<details>
<summary>Copy change · source line 119</summary>

**Old**
```js
text: 'Die schriftliche Prüfung bringt maximal 225 Punkte, die mündliche maximal 75 Punkte — zusammen 300. Du brauchst damit 135 Punkte im schriftlichen und 45 Punkte im mündlichen Teil.',
```

**New**
```js
text: 'Die schriftliche Prüfung bringt maximal 225 Punkte, die mündliche maximal 75 Punkte — zusammen 300. Sie brauchen damit 135 Punkte im schriftlichen und 45 Punkte im mündlichen Teil.',
```

</details>

<details>
<summary>Copy change · source line 123</summary>

**Old**
```js
text: 'Wenn du einen Teil nicht bestehst, kannst du ihn wiederholen, ohne den anderen noch einmal ablegen zu müssen. Die genauen Wiederholungsregeln legt dein Prüfungszentrum fest.',
```

**New**
```js
text: 'Wenn Sie einen Teil nicht bestehen, können Sie ihn wiederholen, ohne den anderen noch einmal ablegen zu müssen. Die genauen Wiederholungsregeln legt Ihr Prüfungszentrum fest.',
```

</details>

<details>
<summary>Copy change · source line 127</summary>

**Old**
```js
text: 'Ziel nicht auf 60 % — ziel auf 70–75 %. Das gibt dir einen Sicherheitspuffer, besonders beim Schreiben und Sprechen, wo die Bewertung stärker vom Eindruck abhängt.',
```

**New**
```js
text: 'Zielen Sie nicht auf 60 % — zielen Sie auf 70–75 %. Das gibt Ihnen einen Sicherheitspuffer, besonders beim Schreiben und Sprechen, wo die Bewertung stärker vom Eindruck abhängt.',
```

</details>

<details>
<summary>Copy change · source line 133</summary>

**Old**
```js
heading: 'Dein 8-Wochen-Lernplan für telc B1',
```

**New**
```js
heading: 'Ihr 8-Wochen-Lernplan für telc B1',
```

</details>

<details>
<summary>Copy change · source line 137</summary>

**Old**
```js
text: 'Dieser Plan geht davon aus, dass du bereits auf A2-Niveau bist und täglich 30–60 Minuten lernst. Wenn du weniger Zeit hast, streck den Plan. Wenn du mehr Zeit hast, mach die Übungen gründlicher — aber überspring keine Woche.',
```

**New**
```js
text: 'Dieser Plan geht davon aus, dass Sie bereits auf A2-Niveau sind und täglich 30–60 Minuten lernen. Wenn Sie weniger Zeit haben, strecken Sie den Plan. Wenn Sie mehr Zeit haben, machen Sie die Übungen gründlicher — aber überspringen Sie keine Woche.',
```

</details>

<details>
<summary>Copy change · source line 141</summary>

**Old**
```js
text: 'Bevor du loslegst: Mach den <a href="/level-test/">kostenlosen Einstufungstest</a>. In wenigen Minuten weißt du, wo du wirklich stehst — nicht, wo du glaubst zu stehen.',
```

**New**
```js
text: 'Bevor Sie loslegen: Machen Sie den <a href="/level-test/">kostenlosen Einstufungstest</a>. In wenigen Minuten wissen Sie, wo Sie wirklich stehen — nicht, wo Sie glauben zu stehen.',
```

</details>

<details>
<summary>Copy change · source line 155</summary>

**Old**
```js
tip: 'Nutze die Grammatik-Lektionen auf Deutschmeister — jedes Thema wird auf Englisch erklärt, damit du das WARUM verstehst, nicht nur das WAS.',
```

**New**
```js
tip: 'Nutzen Sie die Grammatik-Lektionen auf Deutschmeister — jedes Thema wird auf Englisch erklärt, damit Sie das WARUM verstehen, nicht nur das WAS.',
```

</details>

<details>
<summary>Copy change · source line 167</summary>

**Old**
```js
tip: 'Bei den Sprachbausteinen kommt genau diese Grammatik. Das Sentence X-Ray zeigt dir bei jedem Satz, welcher Fall und welche Struktur verwendet wird.',
```

**New**
```js
tip: 'Bei den Sprachbausteinen kommt genau diese Grammatik. Das Sentence X-Ray zeigt Ihnen bei jedem Satz, welcher Fall und welche Struktur verwendet wird.',
```

</details>

<details>
<summary>Copy change · source line 179</summary>

**Old**
```js
tip: 'Starte jetzt mit dem KI-Sprechtraining. Themen: Reisen, Gesundheit, Arbeit, Wohnen — genau die Themen, die in der Prüfung drankommen.',
```

**New**
```js
tip: 'Starten Sie jetzt mit dem KI-Sprechtraining. Themen: Reisen, Gesundheit, Arbeit, Wohnen — genau die Themen, die in der Prüfung drankommen.',
```

</details>

<details>
<summary>Copy change · source line 185</summary>

**Old**
```js
'Analysiere deine bisherigen Fehler: Wo verlierst du Punkte?',
```

**New**
```js
'Analysieren Sie Ihre bisherigen Fehler: Wo verlieren Sie Punkte?',
```

</details>

<details>
<summary>Copy change · source line 190</summary>

**Old**
```js
tip: 'Nutze das Sentence X-Ray für Sätze, die du falsch geschrieben hast. Es zeigt dir, wo der Fehler liegt — Kasus, Wortstellung, Verbform.',
```

**New**
```js
tip: 'Nutzen Sie das Sentence X-Ray für Sätze, die Sie falsch geschrieben haben. Es zeigt Ihnen, wo der Fehler liegt — Kasus, Wortstellung, Verbform.',
```

</details>

<details>
<summary>Copy change · source line 216</summary>

**Old**
```js
body: 'Der größte Fehler. Viele lernen monatelang Grammatik und Vokabeln, sprechen aber kaum. In der mündlichen Prüfung merkt man das sofort: lange Pausen, unsichere Satzstellung, kein natürlicher Gesprächsfluss. Übe jeden Tag mindestens 10 Minuten freies Sprechen — mit einem Partner, im Tandem oder mit dem KI-Sprechtraining.',
```

**New**
```js
body: 'Der größte Fehler. Viele lernen monatelang Grammatik und Vokabeln, sprechen aber kaum. In der mündlichen Prüfung merkt man das sofort: lange Pausen, unsichere Satzstellung, kein natürlicher Gesprächsfluss. Üben Sie jeden Tag mindestens 10 Minuten freies Sprechen — mit einem Partner, im Tandem oder mit dem KI-Sprechtraining.',
```

</details>

<details>
<summary>Copy change · source line 220</summary>

**Old**
```js
body: 'Der schriftliche Teil ist lang. Wenn du beim Leseverstehen zu viel Zeit verbrauchst, fehlt sie beim Schreiben. Lösung: vorab mit Stoppuhr üben. Lies zuerst die Aufgaben, dann den Text. Nicht jedes Wort muss verstanden werden — du suchst spezifische Informationen.',
```

**New**
```js
body: 'Der schriftliche Teil ist lang. Wenn Sie beim Leseverstehen zu viel Zeit verbrauchen, fehlt sie beim Schreiben. Lösung: vorab mit Stoppuhr üben. Lesen Sie zuerst die Aufgaben, dann den Text. Nicht jedes Wort muss verstanden werden — Sie suchen spezifische Informationen.',
```

</details>

<details>
<summary>Copy change · source line 224</summary>

**Old**
```js
body: 'Du sollst einen formellen Brief schreiben und schreibst wie eine WhatsApp-Nachricht — oder umgekehrt. Lerne die Unterschiede: „Sehr geehrte Damen und Herren" vs. „Liebe Frau Müller" vs. „Hallo Maria". Anrede, Schlussformel und Ton müssen zum Anlass passen.',
```

**New**
```js
body: 'Sie sollen einen formellen Brief schreiben und schreiben wie eine WhatsApp-Nachricht — oder umgekehrt. Lernen Sie die Unterschiede: „Sehr geehrte Damen und Herren" vs. „Liebe Frau Müller" vs. „Hallo Maria". Anrede, Schlussformel und Ton müssen zum Anlass passen.',
```

</details>

<details>
<summary>Copy change · source line 228</summary>

**Old**
```js
body: 'Die Sprachbausteine sehen einfach aus — mehrere Optionen, eine ist richtig. Aber hier werden genau die Grammatikfallen getestet, die Lernende am häufigsten machen: Dativ vs. Akkusativ, Adjektivendungen, Präpositionen. Regelmäßiges Training mit dem Sentence X-Ray hilft: Du lernst, jeden Satz zu analysieren.',
```

**New**
```js
body: 'Die Sprachbausteine sehen einfach aus — mehrere Optionen, eine ist richtig. Aber hier werden genau die Grammatikfallen getestet, die Lernende am häufigsten machen: Dativ vs. Akkusativ, Adjektivendungen, Präpositionen. Regelmäßiges Training mit dem Sentence X-Ray hilft: Sie lernen, jeden Satz zu analysieren.',
```

</details>

<details>
<summary>Copy change · source line 232</summary>

**Old**
```js
body: 'In der Paarprüfung wirst du nicht nur danach bewertet, was du sagst — sondern auch, wie du auf deinen Partner reagierst. Hör zu, stell Rückfragen, greif seine Ideen auf. Die Prüfer wollen echte Kommunikation sehen, nicht zwei Monologe nebeneinander.',
```

**New**
```js
body: 'In der Paarprüfung werden Sie nicht nur danach bewertet, was Sie sagen — sondern auch, wie Sie auf Ihren Partner reagieren. Hören Sie zu, stellen Sie Rückfragen, greifen Sie die Ideen Ihres Gegenübers auf. Die Prüfer wollen echte Kommunikation sehen, nicht zwei Monologe nebeneinander.',
```

</details>

<details>
<summary>Copy change · source line 240</summary>

**Old**
```js
heading: 'Wie Deutschmeister dich auf telc B1 vorbereitet',
```

**New**
```js
heading: 'Wie Deutschmeister Sie auf telc B1 vorbereitet',
```

</details>

<details>
<summary>Copy change · source line 244</summary>

**Old**
```js
text: 'Deutschmeister wurde von einem Team von Ärzten in Deutschland gebaut, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind. Die Plattform ist kein Spiel — sie ist ein Werkzeug für Leute, die eine Prüfung bestehen müssen. So passt sie zur telc B1 Vorbereitung:',
```

**New**
```js
text: `${FOUNDER_LINE_DE} Die folgenden Werkzeuge unterstützen Ihre Vorbereitung:`,
```

</details>

<details>
<summary>Copy change · source line 252</summary>

**Old**
```js
body: 'Übe Prüfungsthemen (Reisen, Wohnen, Gesundheit) im freien Gespräch. Danach wertet die KI Grammatik, Wortschatz und Ausdruck aus.',
```

**New**
```js
body: 'Üben Sie Prüfungsthemen (Reisen, Wohnen, Gesundheit) im freien Gespräch. Danach wertet die KI Grammatik, Wortschatz und Ausdruck aus.',
```

</details>

<details>
<summary>Copy change · source line 257</summary>

**Old**
```js
body: 'Authentische Dialoge und Monologe auf jedem Niveau. Trainiere dein Ohr für Alltagssprache, Durchsagen und Berichte.',
```

**New**
```js
body: 'Authentische Dialoge und Monologe auf jedem Niveau. Trainieren Sie Ihr Ohr für Alltagssprache, Durchsagen und Berichte.',
```

</details>

<details>
<summary>Copy change · source line 267</summary>

**Old**
```js
body: 'Übe mit steigender Textlänge und Komplexität. Von kurzen Anzeigen bis zu längeren Texten — genau wie in der Prüfung.',
```

**New**
```js
body: 'Üben Sie mit steigender Textlänge und Komplexität. Von kurzen Anzeigen bis zu längeren Texten — genau wie in der Prüfung.',
```

</details>

<details>
<summary>Copy change · source line 273</summary>

**Old**
```js
text: 'Dazu kommt ein <a href="/level-test/">kostenloser Einstufungstest</a>, der dir zeigt, wo du stehst, sowie <a href="/grammar/b1.2/">Grammatik-Lektionen bis B2</a> mit Erklärungen auf Englisch. Neugierig, wie Deutschmeister im Vergleich zu anderen Plattformen abschneidet? Schau dir den <a href="/vergleich/">ehrlichen Vergleich</a> an.',
```

**New**
```js
text: 'Dazu kommt ein <a href="/level-test/">kostenloser Einstufungstest</a>, der Ihnen zeigt, wo Sie stehen, sowie <a href="/grammar/b1.2/">Grammatik-Lektionen bis B2</a> mit Erklärungen auf Englisch. Neugierig, wie Deutschmeister im Vergleich zu anderen Plattformen abschneidet? Schauen Sie sich den <a href="/vergleich/">ehrlichen Vergleich</a> an.',
```

</details>

<details>
<summary>Copy change · source line 282</summary>

**Old**
```js
a: 'Mindestens 8 Wochen bei täglichem Lernen von 30–60 Minuten. Wenn du schon auf A2-Niveau bist und regelmäßig Deutsch sprichst, kann es schneller gehen. Wenn du von A1 startest, plane eher 4–6 Monate ein.',
```

**New**
```js
a: 'Mindestens 8 Wochen bei täglichem Lernen von 30–60 Minuten. Wenn Sie schon auf A2-Niveau sind und regelmäßig Deutsch sprechen, kann es schneller gehen. Wenn Sie von A1 starten, planen Sie eher 4–6 Monate ein.',
```

</details>

<details>
<summary>Copy change · source line 290</summary>

**Old**
```js
a: 'Viele bereiten sich im Selbststudium vor. Entscheidend ist, dass du regelmäßig übst und besonders das Sprechen nicht vernachlässigst. KI-Sprechtraining hilft dir, die mündliche Prüfung vorzubereiten, auch ohne Lehrer.',
```

**New**
```js
a: 'Viele bereiten sich im Selbststudium vor. Entscheidend ist, dass Sie regelmäßig üben und besonders das Sprechen nicht vernachlässigen. KI-Sprechtraining hilft Ihnen, die mündliche Prüfung vorzubereiten, auch ohne Lehrer.',
```

</details>

<details>
<summary>Copy change · source line 294</summary>

**Old**
```js
a: 'Bei telc kannst du den schriftlichen und den mündlichen Teil in der Regel getrennt wiederholen — du musst nicht die gesamte Prüfung noch einmal machen. Die genauen Bedingungen legt dein Prüfungszentrum fest.',
```

**New**
```js
a: 'Bei telc können Sie den schriftlichen und den mündlichen Teil in der Regel getrennt wiederholen — Sie müssen nicht die gesamte Prüfung noch einmal machen. Die genauen Bedingungen legt Ihr Prüfungszentrum fest.',
```

</details>

<details>
<summary>Copy change · source line 298</summary>

**Old**
```js
a: 'Die Gebühren setzt jedes Prüfungszentrum selbst fest und sie ändern sich regelmäßig. Frag direkt bei deiner Volkshochschule oder einem telc-Prüfungszentrum in deiner Nähe nach dem aktuellen Preis.',
```

**New**
```js
a: 'Die Gebühren setzt jedes Prüfungszentrum selbst fest und sie ändern sich regelmäßig. Fragen Sie direkt bei Ihrer Volkshochschule oder einem telc-Prüfungszentrum in Ihrer Nähe nach dem aktuellen Preis.',
```

</details>

<details>
<summary>Copy change · source line 302</summary>

**Old**
```js
a: 'Für die Einbürgerung in Deutschland sind Deutschkenntnisse auf B1-Niveau nachzuweisen. Sowohl telc Deutsch B1 als auch das Goethe-Zertifikat B1 und der DTZ kommen dafür in Frage. Welcher Nachweis in deinem Fall verlangt wird, sagt dir die zuständige Behörde.',
```

**New**
```js
a: 'Für die Einbürgerung in Deutschland sind Deutschkenntnisse auf B1-Niveau nachzuweisen. Sowohl telc Deutsch B1 als auch das Goethe-Zertifikat B1 und der DTZ kommen dafür in Frage. Welcher Nachweis in Ihrem Fall verlangt wird, sagt Ihnen die zuständige Behörde.',
```

</details>

<details>
<summary>Copy change · source line 310</summary>

**Old**
```js
a: 'telc-Prüfungen werden an Prüfungszentren weltweit angeboten. In Deutschland findest du sie über die telc-Website oder bei deiner lokalen Volkshochschule (VHS).',
```

**New**
```js
a: 'telc-Prüfungen werden an Prüfungszentren weltweit angeboten. In Deutschland finden Sie sie über die telc-Website oder bei Ihrer lokalen Volkshochschule (VHS).',
```

</details>

## astro-site/src/data/guides/start-deutsch-1.js

<details>
<summary>Copy change · source line 53</summary>

**Old**
```js
'Für die meisten, die diese Seite lesen, ist <strong>Start Deutsch 1</strong> keine akademische Übung, sondern ein Termin mit einem festen Datum davor — meist der <strong>Ehegattennachzug</strong>. Diese Prüfung unterscheidet sich von B1-Prüfungen in einem wichtigen Punkt: Es gibt <strong>keine Module und keine Mindestpunktzahl pro Teil</strong> — wer insgesamt durchfällt, wiederholt alles. Dieser Leitfaden zeigt dir den genauen Ablauf, die Punkteregel, wie du dich anmeldest und einen ehrlichen Lernplan.',
```

**New**
```js
'Für die meisten, die diese Seite lesen, ist <strong>Start Deutsch 1</strong> keine akademische Übung, sondern ein Termin mit einem festen Datum davor — meist der <strong>Ehegattennachzug</strong>. Diese Prüfung unterscheidet sich von B1-Prüfungen in einem wichtigen Punkt: Es gibt <strong>keine Module und keine Mindestpunktzahl pro Teil</strong> — wer insgesamt durchfällt, wiederholt alles. Dieser Leitfaden zeigt Ihnen den genauen Ablauf, die Punkteregel, wie Sie sich anmelden und einen ehrlichen Lernplan.',
```

</details>

<details>
<summary>Copy change · source line 86</summary>

**Old**
```js
text: 'Wichtig für die Visumstelle: Nur ein Zertifikat von Goethe-Institut, telc oder ÖSD zählt als offizieller A1-Nachweis für den Ehegattennachzug. Ein Kursabschluss, eine App-Zertifizierung oder ein Zertifikat von Deutschmeister ersetzt das nicht — wir bereiten dich auf genau diese Prüfung vor, stellen sie aber nicht aus.',
```

**New**
```js
text: 'Wichtig für die Visumstelle: Nur ein Zertifikat von Goethe-Institut, telc oder ÖSD zählt als offizieller A1-Nachweis für den Ehegattennachzug. Ein Kursabschluss, eine App-Zertifizierung oder ein Zertifikat von Deutschmeister ersetzt das nicht — wir bereiten Sie auf genau diese Prüfung vor, stellen sie aber nicht aus.',
```

</details>

<details>
<summary>Copy change · source line 96</summary>

**Old**
```js
text: 'Start Deutsch 1 hat vier Teile — Hören, Lesen, Schreiben, Sprechen — die an einem Termin nacheinander geprüft werden. Anders als beim Goethe-Zertifikat B1 gibt es <strong>keine Module</strong>: Du kannst die Teile nicht einzeln ablegen oder einzeln wiederholen.',
```

**New**
```js
text: 'Start Deutsch 1 hat vier Teile — Hören, Lesen, Schreiben, Sprechen — die an einem Termin nacheinander geprüft werden. Anders als beim Goethe-Zertifikat B1 gibt es <strong>keine Module</strong>: Sie können die Teile nicht einzeln ablegen oder einzeln wiederholen.',
```

</details>

<details>
<summary>Copy change · source line 114</summary>

**Old**
```js
text: 'Im Sprechteil laufen die drei Aufgaben in fester Reihenfolge ab: Zuerst stellst du dich vor — Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby — und buchstabierst dabei einen Namen sowie eine Telefonnummer — genau das übst du am besten separat und laut, bis es automatisch sitzt. Danach erfragt und gibt ihr in der Gruppe Informationen anhand von Wortkarten, und zum Schluss formuliert und reagiert ihr auf Bitten anhand von Bildkarten (zum Beispiel: „Kannst du bitte das Fenster schließen?“).',
```

**New**
```js
text: 'Im Sprechteil laufen die drei Aufgaben in fester Reihenfolge ab: Zuerst stellen Sie sich vor — Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby — und buchstabieren dabei einen Namen sowie eine Telefonnummer — genau das üben Sie am besten separat und laut, bis es automatisch sitzt. Danach erfragen und geben Sie in der Gruppe Informationen anhand von Wortkarten, und zum Schluss formulieren und reagieren Sie auf Bitten anhand von Bildkarten (zum Beispiel: „Kannst du bitte das Fenster schließen?“).',
```

</details>

<details>
<summary>Copy change · source line 132</summary>

**Old**
```js
text: 'Die Prüfung kann beliebig oft wiederholt werden. Bei einer erneuten Anmeldung nach einem nicht bestandenen Versuch lohnt es sich, gezielt die Teile zu stärken, in denen die letzte Auswertung die wenigsten Punkte zeigte — die Auswertung, die du nach der Prüfung erhältst, zeigt das Ergebnis pro Teil, auch wenn am Ende nur die Gesamtsumme über Bestehen entscheidet.',
```

**New**
```js
text: 'Die Prüfung kann beliebig oft wiederholt werden. Bei einer erneuten Anmeldung nach einem nicht bestandenen Versuch lohnt es sich, gezielt die Teile zu stärken, in denen die letzte Auswertung die wenigsten Punkte zeigte — die Auswertung, die Sie nach der Prüfung erhalten, zeigt das Ergebnis pro Teil, auch wenn am Ende nur die Gesamtsumme über Bestehen entscheidet.',
```

</details>

<details>
<summary>Copy change · source line 136</summary>

**Old**
```js
text: 'Plane mit einem Sicherheitsabstand über 60 Punkten statt genau auf der Grenze. Nervosität am Prüfungstag kostet Punkte, besonders im Sprechen und Schreiben, wo mehr vom Gesamteindruck abhängt als beim Ankreuzen.',
```

**New**
```js
text: 'Planen Sie mit einem Sicherheitsabstand über 60 Punkten statt genau auf der Grenze. Nervosität am Prüfungstag kostet Punkte, besonders im Sprechen und Schreiben, wo mehr vom Gesamteindruck abhängt als beim Ankreuzen.',
```

</details>

<details>
<summary>Copy change · source line 150</summary>

**Old**
```js
text: 'Auf der Website deines zuständigen Goethe-Instituts findest du die genauen Termine, den Anmeldeweg und — kostenlos zum Download — offizielle <strong>Modellsätze</strong> mit Audiodateien und einem Beispielvideo zum Sprechteil. Diese Modellsätze sind das zuverlässigste Übungsmaterial, weil sie exakt Format und Schwierigkeitsgrad der echten Prüfung zeigen.',
```

**New**
```js
text: 'Auf der Website Ihres zuständigen Goethe-Instituts finden Sie die genauen Termine, den Anmeldeweg und — kostenlos zum Download — offizielle <strong>Modellsätze</strong> mit Audiodateien und einem Beispielvideo zum Sprechteil. Diese Modellsätze sind das zuverlässigste Übungsmaterial, weil sie exakt Format und Schwierigkeitsgrad der echten Prüfung zeigen.',
```

</details>

<details>
<summary>Copy change · source line 164</summary>

**Old**
```js
text: 'Von null Vorkenntnissen rechnen Sprachschulen und das Goethe-Institut selbst mit insgesamt etwa <strong>60–80 Lernstunden à 60 Minuten</strong> bis A1. Bei täglich 45–60 Minuten Lernzeit sind das realistisch <strong>8 bis 12 Wochen</strong> — davon fließen die letzten <strong>rund 25–30 Stunden</strong> in die reine Prüfungsphase: Modelltests, gezieltes Schließen von Lücken, Generalprobe (Woche 8–12 im Plan unten). Wenn deine Muttersprache nicht das lateinische Alphabet verwendet (zum Beispiel Arabisch, Urdu, Persisch oder Kyrillisch), plane für dieselbe Stundenzahl <strong>etwa die doppelte Zeit</strong> ein — nicht weil Deutsch schwerer wird, sondern weil Lesen und Schreiben selbst noch automatisiert werden müssen.',
```

**New**
```js
text: 'Von null Vorkenntnissen rechnen Sprachschulen und das Goethe-Institut selbst mit insgesamt etwa <strong>60–80 Lernstunden à 60 Minuten</strong> bis A1. Bei täglich 45–60 Minuten Lernzeit sind das realistisch <strong>8 bis 12 Wochen</strong> — davon fließen die letzten <strong>rund 25–30 Stunden</strong> in die reine Prüfungsphase: Modelltests, gezieltes Schließen von Lücken, Generalprobe (Woche 8–12 im Plan unten). Wenn Ihre Muttersprache nicht das lateinische Alphabet verwendet (zum Beispiel Arabisch, Urdu, Persisch oder Kyrillisch), planen Sie für dieselbe Stundenzahl <strong>etwa die doppelte Zeit</strong> ein — nicht weil Deutsch schwerer wird, sondern weil Lesen und Schreiben selbst noch automatisiert werden müssen.',
```

</details>

<details>
<summary>Copy change · source line 168</summary>

**Old**
```js
text: 'Starte mit dem <a href="/level-test/">kostenlosen Einstufungstest</a>, damit du wirklich bei null beginnst und keine Zeit mit bereits Bekanntem verlierst.',
```

**New**
```js
text: 'Starten Sie mit dem <a href="/level-test/">kostenlosen Einstufungstest</a>, damit Sie wirklich bei null beginnen und keine Zeit mit bereits Bekanntem verlieren.',
```

</details>

<details>
<summary>Copy change · source line 279</summary>

**Old**
```js
text: 'Start Deutsch 1 prüft vier konkrete Fertigkeiten mit festen Aufgabentypen. Genau dafür lässt sich gezielt üben — mit einer Plattform, die von einem Team von Ärzten in Deutschland gebaut wurde, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind:',
```

**New**
```js
text: `${FOUNDER_LINE_DE} Die folgenden Werkzeuge unterstützen Ihre Vorbereitung:`,
```

</details>

<details>
<summary>Copy change · source line 345</summary>

**Old**
```js
a: 'Nein. Für Visumzwecke zählt ausschließlich ein Zeugnis von Goethe-Institut, telc oder ÖSD. Deutschmeister bereitet gezielt auf genau diese Prüfung vor, ersetzt sie aber nicht — den offiziellen Termin buchst du direkt beim Prüfungszentrum.',
```

**New**
```js
a: 'Nein. Für Visumzwecke zählt ausschließlich ein Zeugnis von Goethe-Institut, telc oder ÖSD. Deutschmeister bereitet gezielt auf genau diese Prüfung vor, ersetzt sie aber nicht — den offiziellen Termin buchen Sie direkt beim Prüfungszentrum.',
```

</details>

<details>
<summary>Copy change · source line 350</summary>

**Old**
```js
heading: 'Finde heraus, wo du vor Start Deutsch 1 stehst',
body: 'Der Einstufungstest zeigt dir in wenigen Minuten deinen Ausgangspunkt — danach weißt du, wie viel der 8–12 Wochen du wirklich brauchst.',
```

**New**
```js
heading: 'Finden Sie heraus, wo Sie vor Start Deutsch 1 stehen',
body: 'Der Einstufungstest zeigt Ihnen in wenigen Minuten Ihren Ausgangspunkt — danach wissen Sie, wie viel der 8–12 Wochen Sie wirklich brauchen.',
```

</details>

## New demonstration copy

The new `ProductWindow.astro` uses actual lesson titles, prompts, model answers, sequence numbers and can-do goals from the course data. Its new interface labels are: “Course preview · real content”, “The course”, “Example sequence, not your saved progress.”, “Lesson [actual number] · Your first situation”, “Model answer · try your own in the course”, “What you work towards”, “Learn in a situation. Then use it.”, “Try the free course” and “Open the course”.

`CourseMoment.jsx` uses the same A1.1 source on account and About pages. New labels: “A1.1 · Course preview · real content” and “Model answer · try your own in the free course.” Its prerender twin escapes all source text.

Guide header contents preview labels (new): “Understand. Plan. Practise.” / “Verstehen. Planen. Üben.” The linked section names come from the existing table of contents.
