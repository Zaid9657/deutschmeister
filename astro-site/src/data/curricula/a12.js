// A1.2 — 12 situationale Lektionen (docs/course-factory/a12-rebuild/CONTRACT.md,
// docs/course-standard-2026-09-12.md §2.2, A1.2-Zeile). Gebaut auf der A1.1-Engine: gleiche
// Feldnamen, gleiche Regeln, gleiche Prüfung durch scripts/validate-curriculum.mjs. Die Einheit
// ist die Situation; die Grammatik ist ein Schritt darin.
//
// PROVENANCE. Kann-Beschreibungen folgen dem Goethe-Zertifikat A1 (Start Deutsch 1)
// Prüfungsziele/Testbeschreibung — A1.2 schließt dieselbe Prüfung ab wie A1.1 (`examKey`
// goethe_a1, `testSlug` 'abschlusstest-a1-2', siehe src/data/courses/index.js); die
// Handlungsfelder folgen dem BAMF-Rahmencurriculum; das Wortfeld stammt aus der Tabelle `words`
// (`wordId` = words.id, level a1.2), gezogen am 2026-09-13. Drei Einträge tragen keine id, weil
// die Tabelle sie nicht führt: „die Anzeige" (L2), „funktionieren" (L4) und „der Müll" (L9) —
// dazu die eine Meta-Zeile „die Zahlen 20–100" (L2), die eine MENGE benennt und darum nie eine
// einzelne Wortzeile sein kann. Wer sie in `words` nachpflegt, trägt die id hier nach.
//
// ORDNUNG DER 12 GRAMMATIKTHEMEN (`primarySlug`, eins pro Lektion) UND WARUM:
//   1 basic-sentence-structure  — die Wegbeschreibung lebt von der Inversion („Dann gehen Sie…"),
//                                 also steht der Satzrahmen am Anfang des Halbniveaus.
//   2 numbers-counting          — eine Wohnungsanzeige IST eine Zahl: Miete, Stockwerk, Quadratmeter,
//                                 Ordnungszahl. Zahlen ab 20 und die Ordinalia gehören hierher.
//   3 accusative-intro          — „In der Stadt" ist das erste Handlungsfeld mit Objekten:
//                                 einen Supermarkt brauchen, das Geld bezahlen.
//   4 negation                  — Hotel und Reklamation sind die Sprachhandlung „etwas ist NICHT
//                                 da / funktioniert NICHT". kein- braucht den Akkusativ aus 3.
//   5 question-words            — Pläne macht man mit W-Fragen: Wann? Wohin? Wie oft?
//   6 stem-changing-verbs       — die Arztpraxis fragt mit genau den Wechselverben: nimmt, hilft,
//                                 schläft, isst, sieht. A1.1 hat den Wechsel nur markiert (L3/L7/L11),
//                                 hier bekommt er seine Regel.
//   7 nominative-case           — „Wer ist das?" ist die Frage nach dem Subjekt; Aussehen und
//                                 Charakter beschreibt man mit sein + Nominativ. WARUM NACH DEM
//                                 AKKUSATIV (L3) UND NICHT DAVOR: der Grammatik-Cache führt für
//                                 A1.2 genau zwölf topic_order-Zeilen, es gibt keinen dreizehnten
//                                 Platz und keine Reihenfolge, die diese Datei erfinden darf. Die
//                                 Karte von L7 führt den Nominativ deshalb NICHT als Neueinführung,
//                                 sondern als KONTRAST zum Objekt aus L3 („den Onkel" gegen „der
//                                 Onkel") — die Form, die L3 schon voraussetzt, bekommt hier ihren
//                                 Namen (DaF-Review #1, MAJOR Grammatikdeckel).
//   8 imperative                — der Haushalt ist die Bitte: „Komm!", „Hilf mir bitte!",
//                                 „Machen Sie bitte…". Ohne Wechselverben (6) gäbe es kein „Hilf!".
//   9 modal-verbs-intro         — Regeln sind dürfen/müssen/können. Die Satzklammer (Modalverb
//                                 auf 2, Infinitiv am Ende) setzt den Satzrahmen aus 1 voraus.
//  10 prepositions-accusative   — für/ohne/gegen/um/durch braucht den Akkusativ aus 3; der
//                                 Kleidungskauf ist „für meinen Bruder, ohne den Schal".
//  11 dative-prepositions-intro — das Wetter trägt die temporalen und lokalen Dativpräpositionen:
//                                 im Sommer, am Abend, seit einer Woche, nach dem Regen.
//  12 perfekt-intro             — das Fest erzählt Vergangenes. Perfekt steht am Ende, weil es
//                                 das Partizip II jedes bis hier gelernten Verbs wiederholt.
//
// DIE ENTSCHEIDUNG, DIE DER AUFTRAG OFFEN LIESS: WEGBESCHREIBUNG → WELCHE PRÄPOSITIONEN?
// Weder `prepositions-accusative` noch `dative-prepositions-intro`. Beide setzen einen Kasus
// voraus, den A1.2 erst lehrt (Akkusativ in L3, Dativ in L11) — eine Präpositionsregel in L1
// wäre genau der Vorgriff, den die A1.1-Reviews vier Runden lang angemahnt haben. L1 lehrt
// stattdessen den Satzrahmen und nennt „zum Bahnhof / zur Kirche / an der Ecke" ausdrücklich als
// FESTE WENDUNGEN (so wie A1.1 „Ich habe gearbeitet" als Chunk lehrt); die Regel dahinter kommt
// in L11. Die Richtungspräpositionen des Akkusativs (durch, um) kommen in L10.
//
// WAS DIESE ORDNUNG NICHT TRAGEN KANN, UND WO ES STATTDESSEN STEHT:
//   *Modalverben* werden vor L9 gebraucht („Ich möchte ein Ticket", „Wo kann ich…?"). Sie sind
//   darum in FUNCTION_WORDS geführt und werden bis L9 als feste Wendungen benutzt, nicht erklärt.
//   *war/hatte* (Präteritum von sein/haben) steht im Grammatikdach des Standards, hat aber keinen
//   eigenen Slug. L12 benutzt „war" im Dialog und die notice sagt, dass es die einzige einfache
//   Vergangenheitsform dieses Kurses ist.
//   *Komparation* („billiger als") hat ebenfalls keinen Slug: L10 lehrt sie als Muster in der
//   notice, nicht als Lektionsthema.
//
// STUNDEN. Wie in A1.1 rechnet der Validator: 12 × 15 min + 4 × 12 min + 12 × 10 min Engine
// = 348 min ≈ 5,8 h, dazu 4 h begleitende Arbeit je Lektion = 48 h → `hoursTotal: 54`.
// EHRLICH GELESEN: nur die 5,8 h sind geführte Lektionszeit, die als Inhalt existiert. Von den
// begleitenden Materialien fehlen A1.2 sechs Hörübungen für zwölf Lektionen (sechs Lektionen
// haben keine) und zwei Lektionen haben keinen Lesetext. Eine Käuferseite muss beides getrennt
// ausweisen und darf keine „54 Stunden Kurs" behaupten (src/data/marketing.js: measure before
// you claim).
//
// REGISTER. du zwischen den Lernenden (Ana, Tim, Lena), Sie mit Personal und Fremden
// (Frau Fischer, Herr Berg, Frau Kaya, Frau Berger, Herr Schmidt). Die notices sprechen
// unpersönlich, die Aufgaben siezen — nur der Dialog duzt. Keine Erfolgsversprechen, keine
// Prüfungsgebühren in dieser Datei.
//
// ANREDE IM SPRECHAUFTRAG — eine Entscheidung, keine Voreinstellung. `sprechen.open.anrede`
// reist über `saveCourseContext` → `parseCourseTask` → `buildTeacherSystemPrompt` in
// netlify/functions/_shared/speakingAI.mjs; fehlt das Feld, fällt `normalizeAnrede` still auf
// 'Sie' zurück — A1.2 hatte es zwölfmal vergessen (DaF-Review #1, MAJOR anrede). Gesetzt ist es
// jetzt zwölfmal nach EINER Regel: die Anrede folgt dem Gegenüber, das der `promptDe` nennt.
// Nach der Neuzuordnung der Missionen ist dieses Gegenüber in allen zwölf Lektionen eine
// Prüferin, ein Prüfungspartner, Personal oder eine fremde Person — also zwölfmal `Sie`, jedes
// Mal mit der Begründung an der Zeile. Das ist ausdrücklich NICHT der Rückfallwert: unter
// Bekannten (L8 WG, L10 Freundin) spielt die SCHREIB- und die Dialogseite, nicht der
// Sprechauftrag, und der Sprechauftrag ist in jeder dieser Lektionen ein Prüfungsformat.
// DER OFFENE BRUCH, DEN DIESE DATEI NICHT SCHLIESSEN KANN: alle zwölf `speaking_missions` auf
// Level a1.2 duzen in `scenario_de` („Du meldest dich … an"), während jeder `promptDe` siezt.
// Beides anzugleichen heißt, `scenario_de` in der Datenbank auf Sie zu ziehen — eine SQL-
// Migration außerhalb dieser Datei. Bis dahin gilt hier die Prüfungsanrede.

import { FUNCTION_WORDS as FUNCTION_WORDS_A11, DIALOG_NAMES as DIALOG_NAMES_A11 } from './a11.js';

/**
 * A1.2 erbt die geschlossene Funktionswortliste von A1.1 und ergänzt sie um das, was ein
 * A1.2-Dialog strukturell braucht, ohne dass es Lektionslexik wäre:
 *  – die finiten Modalverbformen (bis L9 feste Wendungen, dort erst Regel),
 *  – war/hatte und sei/seien (Präteritum und Imperativ von sein/haben, im Standard ohne Slug),
 *  – „gibt" für die existenzielle Wendung „es gibt",
 *  – Konnektoren und Gradpartikeln (danach, zuerst, als, gleich, viel …),
 *  – die Demonstrativa dieser/diese/dieses.
 * Alles andere, was ein Lernender in einem Dialog hört, ist vorher gelehrt worden —
 * `scripts/validate-curriculum.mjs` prüft das durch Tokenisierung (RULE 5).
 */
export const FUNCTION_WORDS = [
  ...FUNCTION_WORDS_A11,
  // Modalverben — finite Formen, bis L9 als Wendung benutzt
  'kann', 'kannst', 'können', 'könnt', 'muss', 'musst', 'müssen', 'müsst',
  'darf', 'darfst', 'dürfen', 'dürft', 'will', 'willst', 'wollen', 'wollt',
  'soll', 'sollst', 'sollen', 'sollt', 'möchte', 'möchtest', 'möchten', 'möchtet',
  // sein und haben: Präteritum (Chunk, siehe L12) und Imperativ
  'war', 'warst', 'waren', 'wart', 'hatte', 'hattest', 'hatten', 'hattet', 'sei', 'seid', 'seien',
  // „es gibt"
  'gibt',
  // Die ausgeschriebenen Zahlwörter des Meta-Eintrags „die Zahlen 20–100" (L2). Sie sind keine
  // Lektionslexik — der Wortfeldeintrag benennt eine MENGE und ist darum von RULE 10 ausgenommen —,
  // aber eine Zahlenlektion, die kein Zahlwort schreiben darf, übt Ziffern statt Zahlen
  // (DaF-Review #1, BLOCKER 2). Aufgenommen ist genau, was die Dialoge benutzen.
  'zwanzig', 'einundzwanzig', 'dreißig', 'vierhundertachtzig',
  // Konnektoren, Gradpartikeln, Demonstrativa
  'danach', 'zuerst', 'dort', 'durch', 'gegenüber', 'als', 'denn', 'gleich', 'etwas', 'nichts', 'alles',
  'viel', 'wenig', 'lieber', 'natürlich', 'dieser', 'diese', 'dieses', 'diesen', 'diesem',
];

/** Eigennamen und Anreden, die eine Dialogzeile benutzen darf (A1.1-Besetzung plus Frau Fischer). */
export const DIALOG_NAMES = [...DIALOG_NAMES_A11, 'Fischer'];

export const CURRICULUM_A12 = {
  level: 'a1.2',
  code: 'A1.2',
  examKey: 'goethe_a1',
  examName: 'Start Deutsch 1',
  testSlug: 'abschlusstest-a1-2',
  provenance: {
    canDo: 'Goethe-Zertifikat A1 Start Deutsch 1 — Prüfungsziele, Testbeschreibung (Goethe-Institut/telc, 2016 ed.)',
    wortliste: 'Goethe-Zertifikat A1 Wortliste (≈650 units), zweite Hälfte',
    themen: 'BAMF Rahmencurriculum Integrationskurs (Handlungsfelder)',
  },
  hoursTotal: 54,
  lektionen: [
    {
      nr: 1,
      id: 'a1.2-l01',
      slug: 'wie-komme-ich-zum-rathaus',
      title: 'Wie komme ich zum Rathaus?',
      situation: 'Wegbeschreibung: nach dem Weg fragen und ihn verstehen',
      handlungsfeld: 'Mobilität: sich in der Stadt orientieren',
      canDo: [
        'Ich kann höflich nach dem Weg fragen.',
        'Ich kann eine Wegbeschreibung mit links, rechts und geradeaus verstehen.',
        'Ich kann sagen, wo die Haltestelle ist.',
        'Ich kann in einem Satz erklären, wie man zum Rathaus kommt.',
      ],
      examTeile: ['Hören Teil 1', 'Sprechen Teil 3', 'Schreiben Teil 1'],
      grammarSlugs: ['basic-sentence-structure'],
      primarySlug: 'basic-sentence-structure',
      minutes: 15,
      wortfeld: [
        { de: 'der Weg', word: 'Weg', article: 'der', plural: 'Wege', en: 'way, path', wordId: 'ba975b9a-7b1f-4ed7-a19e-c5d4392d6e56' },
        { de: 'geradeaus', word: 'geradeaus', article: null, plural: null, en: 'straight ahead', wordId: '52e3479c-a64e-4b60-a32e-79d907d868d6' },
        { de: 'links', word: 'links', article: null, plural: null, en: 'left, on the left', wordId: 'b69a07dd-e79c-47d5-aed2-dcd5d4666e32' },
        { de: 'rechts', word: 'rechts', article: null, plural: null, en: 'right, on the right', wordId: 'cc7e1cdc-58d7-459a-846d-4707165d36ce' },
        { de: 'die Ecke', word: 'Ecke', article: 'die', plural: 'Ecken', en: 'corner', wordId: '93189677-985d-44c5-af26-efc7596eede0' },
        { de: 'die Kirche', word: 'Kirche', article: 'die', plural: 'Kirchen', en: 'church', wordId: '2dca7ab3-2cd3-464d-8dd7-072507c83664' },
        { de: 'die Apotheke', word: 'Apotheke', article: 'die', plural: 'Apotheken', en: 'pharmacy', wordId: '1c064585-6ce1-4c96-8cb2-a09e3487e8de' },
        { de: 'die Bank', word: 'Bank', article: 'die', plural: 'Banken', en: 'bank', wordId: '88bc189a-41fe-452b-9961-8eec2a852c95' },
        { de: 'die Haltestelle', word: 'Haltestelle', article: 'die', plural: 'Haltestellen', en: 'stop', wordId: '73e7c80c-9bc2-4b15-b363-46ebb76ff433' },
        { de: 'die Brücke', word: 'Brücke', article: 'die', plural: 'Brücken', en: 'bridge', wordId: '1698d6ad-6223-419d-98fd-e0ea0139a997' },
        { de: 'der Platz', word: 'Platz', article: 'der', plural: 'Plätze', en: 'square, place', wordId: 'e175e730-63e8-4225-a513-62f31d2e4fb5' },
        { de: 'das Rathaus', word: 'Rathaus', article: 'das', plural: 'Rathäuser', en: 'town hall', wordId: '457964de-1284-47aa-a6ef-76204a614eef' },
        { de: 'das Zentrum', word: 'Zentrum', article: 'das', plural: 'Zentren', en: 'centre, downtown', wordId: 'bf28dfb3-6f9b-480c-bb82-e031c69bd132' },
        { de: 'die U-Bahn', word: 'U-Bahn', article: 'die', plural: 'U-Bahnen', en: 'underground, metro', wordId: '43e2d6f9-c713-4542-8861-d482e6008be6' },
        { de: 'die Straßenbahn', word: 'Straßenbahn', article: 'die', plural: 'Straßenbahnen', en: 'tram', wordId: '0354cc31-12ff-47e4-9768-77984c109ba6' },
        { de: 'die Stadt', word: 'Stadt', article: 'die', plural: 'Städte', en: 'city, town', wordId: '4ef48528-9278-4ebb-b2bc-e4d43c4b1418' },
      ],
      dialog: {
        title: 'Am Platz vor der Kirche',
        setting: 'Ana sucht das Rathaus. Frau Fischer wohnt in der Stadt.',
        lines: [
          { speaker: 'Ana', de: 'Entschuldigung, wie komme ich zum Rathaus?', en: 'Excuse me, how do I get to the town hall?' },
          { speaker: 'Frau Fischer', de: 'Zuerst gehen Sie geradeaus bis zur Kirche.', en: 'First you go straight ahead as far as the church.' },
          { speaker: 'Ana', de: 'Und dann? Ist der Weg weit?', en: 'And then? Is it far?' },
          { speaker: 'Frau Fischer', de: 'Nein. Dann gehen Sie an der Ecke links.', en: 'No. Then you go left at the corner.' },
          { speaker: 'Ana', de: 'Ist die Apotheke auch da?', en: 'Is the pharmacy there too?' },
          { speaker: 'Frau Fischer', de: 'Ja. Da ist die Apotheke und auch die Bank.', en: 'Yes. There is the pharmacy and the bank too.' },
          { speaker: 'Ana', de: 'Wo ist die Haltestelle für die Straßenbahn in der Stadt?', en: 'Where is the tram stop in town?' },
          { speaker: 'Frau Fischer', de: 'Am Platz. Da ist auch die Brücke.', en: 'At the square. The bridge is there too.' },
          { speaker: 'Ana', de: 'Und die U-Bahn? Fährt sie ins Zentrum?', en: 'And the metro? Does it go to the centre?' },
          { speaker: 'Frau Fischer', de: 'Ja. Rechts ist die Haltestelle. Die U-Bahn fährt ins Zentrum.', en: 'Yes. The stop is on the right. The metro goes to the centre.' },
        ],
      },
      pretest: {
        promptDe: 'Fragen Sie nach dem Weg zum Rathaus.',
        promptEn: 'Ask the way to the town hall.',
        model: 'Wie komme ich zum Rathaus?',
        accepted: ['Wie komme ich', 'Wo ist', 'Entschuldigung'],
      },
      notice: {
        title: 'Der Satz: das Verb steht auf Position 2',
        bodyDe: 'Im Aussagesatz steht das Verb an zweiter Stelle: Sie **gehen** geradeaus. Steht eine Angabe vorn, rutscht das Subjekt hinter das Verb: Dann **gehen** Sie links. Auch in der W-Frage steht das Verb auf Position 2: Wie **komme** ich zum Rathaus? Feste Wendungen für den Weg: **zum** Rathaus, **zur** Kirche, **an der** Ecke — die Regel kommt in Lektion 11.',
        examples: ['Zuerst gehen Sie geradeaus bis zur Kirche.', 'Nein. Dann gehen Sie an der Ecke links.'],
        ruleSlug: 'basic-sentence-structure',
      },
      phonetik: { focus: 'Langes und kurzes e: Weg – Ecke', items: ['der WEG', 'die E-cke', 'ge-ra-de-AUS'] },
      hoeren: { kind: 'dictation', lines: [1, 5] },
      sprechen: {
        readAloud: [0, 3],
        open: {
          teil: 'Sprechen Teil 3',
          promptDe: 'Bitten Sie eine fremde Person höflich um den Weg zur Apotheke.',
          hintWords: ['der Weg', 'geradeaus', 'die Apotheke'],
          // Sie — mission 5 lässt eine fremde Passantin fragen; die Wegfrage ist eine Fremdansprache.
          anrede: 'Sie',
          missionOrder: 5,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a12-l01',
        taskDe: 'Ana Chakiri wohnt in Bremen am Platz 4. Sie fährt mit der Straßenbahn zum Kurs. Ihre Haltestelle heißt Rathaus. Füllen Sie die Anmeldung für die Stadtbibliothek aus.',
        fields: ['Familienname', 'Vorname', 'Stadt', 'Haltestelle', 'Unterschrift'],
        minWords: 5,
        maxWords: 40,
        sample: 'Familienname: Chakiri / Vorname: Ana / Stadt: Bremen / Haltestelle: Rathaus / Unterschrift: A. Chakiri',
      },
      links: { listeningExercise: 2, readingOrder: null },
      practiceRule: { topics: ['basic-sentence-structure'], typedMin: 3 },
    },
    {
      nr: 2,
      id: 'a1.2-l02',
      slug: 'die-wohnungsanzeige',
      title: 'Die Wohnungsanzeige',
      situation: 'Wohnen und Wohnungsanzeigen lesen',
      handlungsfeld: 'Wohnen: eine Wohnung suchen und Angaben verstehen',
      canDo: [
        'Ich kann eine Wohnungsanzeige mit Zahlen verstehen.',
        'Ich kann nach der Miete fragen.',
        'Ich kann die Zimmer einer Wohnung nennen.',
        'Ich kann sagen, in welchem Stockwerk ich wohne.',
      ],
      examTeile: ['Hören Teil 2', 'Lesen Teil 2', 'Sprechen Teil 2'],
      grammarSlugs: ['numbers-counting', 'basic-sentence-structure'],
      primarySlug: 'numbers-counting',
      minutes: 15,
      wortfeld: [
        { de: 'die Anzeige', word: 'Anzeige', article: 'die', plural: 'Anzeigen', en: 'advertisement, listing', wordId: null },
        { de: 'das Haus', word: 'Haus', article: 'das', plural: 'Häuser', en: 'house', wordId: '8e26fe11-dd8b-459c-8a66-72adb820b1d4' },
        { de: 'die Küche', word: 'Küche', article: 'die', plural: 'Küchen', en: 'kitchen', wordId: '996c3f03-04ad-4d68-8987-edf5b13fb254' },
        { de: 'das Badezimmer', word: 'Badezimmer', article: 'das', plural: 'Badezimmer', en: 'bathroom', wordId: '3d647194-b864-43ec-9964-243fd7d3b31d' },
        { de: 'das Schlafzimmer', word: 'Schlafzimmer', article: 'das', plural: 'Schlafzimmer', en: 'bedroom', wordId: '2f38f72f-b9c2-4508-97e6-150ae81ad7e2' },
        { de: 'das Wohnzimmer', word: 'Wohnzimmer', article: 'das', plural: 'Wohnzimmer', en: 'living room', wordId: '55609a80-dda1-4f19-81b1-fa5fc7e07229' },
        { de: 'der Balkon', word: 'Balkon', article: 'der', plural: 'Balkone', en: 'balcony', wordId: '8de2953e-6d0e-42ba-b873-2f1df61e705f' },
        { de: 'der Keller', word: 'Keller', article: 'der', plural: 'Keller', en: 'basement', wordId: 'a6a76ec8-dcba-4777-934a-ad5bd4abf4d2' },
        { de: 'der Garten', word: 'Garten', article: 'der', plural: 'Gärten', en: 'garden', wordId: 'd8a4170e-a7c9-47c3-9819-54ddc644ae91' },
        { de: 'das Stockwerk', word: 'Stockwerk', article: 'das', plural: 'Stockwerke', en: 'floor, storey', wordId: '9e3614a0-7ea8-4b4c-9c5b-0c8b826c9c6b' },
        { de: 'die Treppe', word: 'Treppe', article: 'die', plural: 'Treppen', en: 'stairs', wordId: '8b05b898-ee1e-49a3-a0c7-5eb0d6db36ea' },
        { de: 'die Miete', word: 'Miete', article: 'die', plural: '—', en: 'rent', wordId: '582d88d5-aadf-446a-b39d-89f16591d0e3' },
        { de: 'der Vermieter', word: 'Vermieter', article: 'der', plural: 'Vermieter', en: 'landlord', wordId: '467e1cf5-1284-447e-9073-c582edf604ce' },
        { de: 'die Nachbarin', word: 'Nachbarin', article: 'die', plural: 'Nachbarinnen', en: 'neighbour (f)', wordId: 'abf29b90-6d9b-4a82-92a0-ee32101f5d31' },
        { de: 'erste', word: 'erste', article: null, plural: null, en: 'first', wordId: '92b88dbd-471d-46f8-91c5-b328d6e2b592' },
        { de: 'dritte', word: 'dritte', article: null, plural: null, en: 'third', wordId: '464e78df-75ee-4ecf-89a8-f661a9c9f8f1' },
        // Eine MENGE, kein Wort: „die Zahlen 20–100" kann in keinem Input wörtlich vorkommen.
        // Wie in A1.1 („die Zahlen 0–10") als Meta-Eintrag geführt und von RULE 10 ausgenommen.
        { de: 'die Zahlen 20–100', word: 'Zahlen 20–100', article: 'die', plural: '—', en: 'the numbers 20–100 (zwanzig … hundert)', meta: true, wordId: null },
      ],
      dialog: {
        title: 'Ein Anruf beim Vermieter',
        setting: 'Ana ruft den Vermieter Herrn Berg an.',
        lines: [
          { speaker: 'Ana', de: 'Guten Tag, Herr Berg. Die Anzeige ist von Ihnen?', en: 'Good day, Mr Berg. The listing is yours?' },
          { speaker: 'Herr Berg', de: 'Ja. Das Haus hat drei Stockwerke und einen Garten.', en: 'Yes. The house has three floors and a garden.' },
          { speaker: 'Ana', de: 'Was kostet die Wohnung? Wie ist die Miete?', en: 'What does the flat cost? What is the rent?' },
          { speaker: 'Herr Berg', de: 'Die Miete ist vierhundertachtzig Euro. Der Keller kostet zwanzig Euro.', en: 'The rent is four hundred and eighty euros. The basement costs twenty euros.' },
          { speaker: 'Ana', de: 'Und die Wohnung? Wie viele Zimmer hat sie?', en: 'And the flat? How many rooms does it have?' },
          { speaker: 'Herr Berg', de: 'Vier: Küche, Badezimmer, Wohnzimmer und Schlafzimmer.', en: 'Four: kitchen, bathroom, living room and bedroom.' },
          { speaker: 'Ana', de: 'Hat die Wohnung auch einen Balkon?', en: 'Does the flat also have a balcony?' },
          { speaker: 'Herr Berg', de: 'Ja, der Balkon ist da. Das dritte Stockwerk ist frei.', en: 'Yes, the balcony is there. The third floor is free.' },
          { speaker: 'Ana', de: 'Ist die Treppe da? Ich habe viele Bücher.', en: 'Are the stairs there? I have a lot of books.' },
          { speaker: 'Herr Berg', de: 'Die erste Wohnung ist frei. Die Nachbarin ist einundzwanzig.', en: 'The first flat is free. The neighbour is twenty-one.' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie, wie viele Zimmer Ihre Wohnung hat.',
        promptEn: 'Say how many rooms your flat has.',
        model: 'Meine Wohnung hat drei Zimmer.',
        accepted: ['Meine Wohnung hat', 'Ich habe', 'Das Haus hat'],
      },
      notice: {
        title: 'Zahlen ab 20 und die Ordnungszahlen',
        bodyDe: 'Zahlen über 20 liest man von hinten nach vorn: 21 ist **einundzwanzig**, 48 ist achtundvierzig. Der Hunderter steht vorn: 480 ist **vierhundertachtzig**. Die Ordnungszahl bekommt bis 19 die Endung -te: das **dritte** Stockwerk, die **erste** Wohnung. Ab 20 heißt die Endung -ste: der zwanzigste Mai.',
        examples: ['Die Miete ist vierhundertachtzig Euro. Der Keller kostet zwanzig Euro.', 'Ja, der Balkon ist da. Das dritte Stockwerk ist frei.'],
        ruleSlug: 'numbers-counting',
      },
      phonetik: { focus: 'Wortakzent bei zusammengesetzten Zahlen', items: ['ein-und-ZWAN-zig', 'VIER-hun-dert', 'das DRIT-te'] },
      hoeren: { kind: 'dictation', lines: [3, 7] },
      sprechen: {
        readAloud: [2, 5],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Wohnen: Zimmer? Stockwerk? Miete?',
          hintWords: ['das Stockwerk', 'die Miete', 'die Küche'],
          // Sie — der Gegenüber ist der Vermieter bzw. der Schalterbeamte aus Mission 4.
          anrede: 'Sie',
          // Mission 4 „Zugzeiten am Bahnhof“ trägt „numbers up to 100, clock times, prices“ —
          // die Zielstruktur dieser Lektion. Vorher hing hier Mission 11 (W-Fragen), die zu L5 gehört.
          missionOrder: 4,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a12-l02',
        taskDe: 'Sie möchten die Wohnung aus der Anzeige besichtigen. Schreiben Sie dem Vermieter eine kurze Nachricht. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Warum Sie schreiben', 'Wann Sie die Wohnung sehen möchten', 'Ihre Frage zur Miete'],
        minWords: 25,
        maxWords: 45,
        sample: 'Sehr geehrter Herr Berg, ich möchte die Wohnung sehen. Geht es am Montag um 17 Uhr? Wie hoch ist die Miete? Viele Grüße, Ana Chakiri',
      },
      links: { listeningExercise: 5, readingOrder: 10 },
      practiceRule: { topics: ['numbers-counting', 'basic-sentence-structure'], typedMin: 3 },
    },
    {
      nr: 3,
      id: 'a1.2-l03',
      slug: 'in-der-stadt-unterwegs',
      title: 'In der Stadt unterwegs',
      situation: 'In der Stadt: Wege erledigen und einkaufen',
      handlungsfeld: 'Einkaufen und Dienstleistungen: Erledigungen in der Stadt machen',
      canDo: [
        'Ich kann sagen, was ich in der Stadt brauche.',
        'Ich kann an der Kasse bezahlen und nach der Quittung fragen.',
        'Ich kann nennen, welche Geschäfte es in der Stadt gibt.',
        'Ich kann eine Menge angeben: ein Kilo, ein Stück.',
      ],
      examTeile: ['Lesen Teil 3', 'Sprechen Teil 2', 'Schreiben Teil 1'],
      grammarSlugs: ['accusative-intro', 'basic-sentence-structure'],
      primarySlug: 'accusative-intro',
      minutes: 15,
      wortfeld: [
        { de: 'der Supermarkt', word: 'Supermarkt', article: 'der', plural: 'Supermärkte', en: 'supermarket', wordId: '0e507c5f-9057-4202-b753-a266af2c0845' },
        { de: 'das Kaufhaus', word: 'Kaufhaus', article: 'das', plural: 'Kaufhäuser', en: 'department store', wordId: 'fc1826c4-09d4-48b0-8973-34eea007a845' },
        { de: 'das Geschäft', word: 'Geschäft', article: 'das', plural: 'Geschäfte', en: 'shop, store', wordId: 'ee7de14f-c44a-48b3-9a3a-df80dc49094e' },
        { de: 'der Markt', word: 'Markt', article: 'der', plural: 'Märkte', en: 'market', wordId: 'e9e7158e-da91-4113-9fc0-0a6d835bfeec' },
        { de: 'die Bibliothek', word: 'Bibliothek', article: 'die', plural: 'Bibliotheken', en: 'library', wordId: 'a902212b-82bb-44f3-beca-1013d6001d13' },
        { de: 'das Museum', word: 'Museum', article: 'das', plural: 'Museen', en: 'museum', wordId: '2a9d1fd1-7930-4010-954d-108c77e4005c' },
        { de: 'der Park', word: 'Park', article: 'der', plural: 'Parks', en: 'park', wordId: '98c38429-2843-41c4-952a-5a13a8ca5cad' },
        { de: 'das Restaurant', word: 'Restaurant', article: 'das', plural: 'Restaurants', en: 'restaurant', wordId: '52e90e80-5aaa-4e64-a587-451295dfe8a4' },
        { de: 'das Krankenhaus', word: 'Krankenhaus', article: 'das', plural: 'Krankenhäuser', en: 'hospital', wordId: 'b7c2b223-9854-4b28-b09d-496dca4d8415' },
        { de: 'die Schule', word: 'Schule', article: 'die', plural: 'Schulen', en: 'school', wordId: '60094c99-4e45-4c20-84e9-d512865c3d59' },
        { de: 'die Kasse', word: 'Kasse', article: 'die', plural: 'Kassen', en: 'checkout, cash desk', wordId: '7dc7fef3-0e10-4ee0-8b2d-7b1494839873' },
        { de: 'die Quittung', word: 'Quittung', article: 'die', plural: 'Quittungen', en: 'receipt', wordId: '346be142-ee35-4acc-afb0-385aa8e7ff5e' },
        { de: 'bezahlen', word: 'bezahlen', article: null, plural: null, en: 'to pay', wordId: 'e98a75ce-591d-4672-a789-2851e2989a5b' },
        { de: 'das Geld', word: 'Geld', article: 'das', plural: '—', en: 'money', wordId: 'a2a37658-f0f4-4778-8ea0-68344661d168' },
        { de: 'das Kilo', word: 'Kilo', article: 'das', plural: 'Kilo', en: 'kilo(gram)', wordId: '6969abbd-5859-4552-83c2-140cf5ebb7a5' },
        { de: 'das Stück', word: 'Stück', article: 'das', plural: 'Stück', en: 'piece', wordId: '0cc9de6f-ba21-49b0-948e-1ce70e45ae02' },
      ],
      dialog: {
        title: 'Erledigungen am Nachmittag',
        setting: 'Lena und Ana gehen zusammen in die Stadt.',
        lines: [
          { speaker: 'Lena', de: 'Ana, was machst du heute in der Stadt?', en: 'Ana, what are you doing in town today?' },
          { speaker: 'Ana', de: 'Ich brauche einen Supermarkt und einen Markt.', en: 'I need a supermarket and a market.' },
          { speaker: 'Lena', de: 'Der Markt am Park hat auch Brot. Gehst du?', en: 'The market by the park has bread too. Are you going?' },
          { speaker: 'Ana', de: 'Ja. Danach brauche ich Geld für das Museum.', en: 'Yes. After that I need money for the museum.' },
          { speaker: 'Lena', de: 'Und die Kasse? Bezahlst du ein Kilo Brot?', en: 'And the till? Are you paying for a kilo of bread?' },
          { speaker: 'Ana', de: 'Ja. Ich bezahle das Brot und den Kuchen.', en: 'Yes. I pay for the bread and the cake.' },
          { speaker: 'Lena', de: 'Und danach? Gehst du in das Museum oder das Restaurant?', en: 'And after that? Are you going to the museum or the restaurant?' },
          { speaker: 'Ana', de: 'Zuerst das Museum, dann das Restaurant.', en: 'First the museum, then the restaurant.' },
          { speaker: 'Lena', de: 'Und die Quittung? Meine Schule ist hier, das Krankenhaus auch.', en: 'And the receipt? My school is here, the hospital too.' },
          { speaker: 'Ana', de: 'Gut. Ich hole ein Stück Kuchen für dich!', en: 'Good. I will get a piece of cake for you!' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie, was Sie heute in der Stadt brauchen.',
        promptEn: 'Say what you need in town today.',
        model: 'Ich brauche einen Supermarkt.',
        accepted: ['Ich brauche', 'Ich kaufe', 'Ich gehe'],
      },
      notice: {
        title: 'Der Akkusativ: den und einen',
        bodyDe: 'Viele Verben verlangen ein Objekt im Akkusativ: brauchen, kaufen, bezahlen. Nur der Maskulinum ändert die Form: der Kuchen → **den** Kuchen, ein Supermarkt → **einen** Supermarkt. Feminin, Neutrum und Plural bleiben gleich: die Quittung, das Geld, das Museum. Die Form keinen kommt in Lektion 4 dazu.',
        examples: ['Ich brauche einen Supermarkt und einen Markt.', 'Ja. Ich bezahle das Brot und den Kuchen.'],
        ruleSlug: 'accusative-intro',
      },
      phonetik: { focus: 'Die Endung -en klingt kurz: einen, den', items: ['ei-nen MARKT', 'den KU-chen', 'den SU-per-markt'] },
      hoeren: { kind: 'dictation', lines: [1, 5] },
      sprechen: {
        readAloud: [4, 7],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Sagen Sie im Kaufhaus, was Sie brauchen, und fragen Sie nach dem Geschäft.',
          hintWords: ['das Kaufhaus', 'das Geschäft', 'brauchen'],
          // Sie — der Gegenüber ist Verkaufspersonal (Mission 3, „helpful supermarket employee“).
          anrede: 'Sie',
          missionOrder: 3,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a12-l03',
        taskDe: 'Ana Chakiri wohnt in Bremen und hat am Donnerstag Kurs. Sie möchte Bücher lesen und geht in die Bibliothek. Füllen Sie die Anmeldung für die Bibliothek aus.',
        fields: ['Familienname', 'Vorname', 'Stadt', 'Tag', 'Unterschrift'],
        minWords: 5,
        maxWords: 40,
        sample: 'Familienname: Chakiri / Vorname: Ana / Stadt: Bremen / Tag: Donnerstag / Unterschrift: A. Chakiri',
      },
      links: { listeningExercise: null, readingOrder: 8 },
      practiceRule: { topics: ['accusative-intro'], typedMin: 4 },
    },
    {
      nr: 4,
      id: 'a1.2-l04',
      slug: 'im-hotel-reklamieren',
      title: 'Im Hotel reklamieren',
      situation: 'Hotel, Termine und Reklamation',
      handlungsfeld: 'Dienstleistungen: eine Reklamation vorbringen',
      canDo: [
        'Ich kann sagen, dass etwas nicht funktioniert.',
        'Ich kann sagen, dass etwas im Zimmer nicht da ist.',
        'Ich kann höflich nach einer neuen Rechnung fragen.',
        'Ich kann mit kein und nicht verneinen.',
      ],
      examTeile: ['Lesen Teil 1', 'Schreiben Teil 2', 'Sprechen Teil 3'],
      grammarSlugs: ['negation', 'accusative-intro'],
      primarySlug: 'negation',
      minutes: 15,
      wortfeld: [
        { de: 'das Hotel', word: 'Hotel', article: 'das', plural: 'Hotels', en: 'hotel', wordId: 'dcd12df5-ed28-48cf-ac98-c9dc6f9b6e45' },
        { de: 'der Eingang', word: 'Eingang', article: 'der', plural: 'Eingänge', en: 'entrance', wordId: '2ae922cc-8b4c-4488-b51a-656fa22275a0' },
        { de: 'der Flur', word: 'Flur', article: 'der', plural: 'Flure', en: 'hallway', wordId: '38d7c958-c092-480e-932d-9b0d5dd6d48b' },
        { de: 'die Toilette', word: 'Toilette', article: 'die', plural: 'Toiletten', en: 'toilet', wordId: 'db86c2ed-1690-4272-bdbe-bfdaa219c362' },
        { de: 'die Bettdecke', word: 'Bettdecke', article: 'die', plural: 'Bettdecken', en: 'duvet, blanket', wordId: 'dff15507-4d53-4e47-9457-2f74677920a0' },
        { de: 'das Kissen', word: 'Kissen', article: 'das', plural: 'Kissen', en: 'pillow', wordId: '8164a329-85a2-4db4-98d0-cc3b81242485' },
        { de: 'die Steckdose', word: 'Steckdose', article: 'die', plural: 'Steckdosen', en: 'power socket', wordId: '660e96a4-476f-4220-85cd-fd13afa16933' },
        { de: 'der Spiegel', word: 'Spiegel', article: 'der', plural: 'Spiegel', en: 'mirror', wordId: '81e1ed22-daee-4c9b-913e-19aa19b01e62' },
        { de: 'der Vorhang', word: 'Vorhang', article: 'der', plural: 'Vorhänge', en: 'curtain', wordId: '65781e6c-dba2-4557-a894-4b84ace840d2' },
        { de: 'die Wand', word: 'Wand', article: 'die', plural: 'Wände', en: 'wall', wordId: '35a36571-e600-4077-9591-50d97a266bd5' },
        { de: 'die Decke', word: 'Decke', article: 'die', plural: 'Decken', en: 'ceiling', wordId: 'c55f9792-c0e3-47e7-8a5e-2fc32ab39a9c' },
        { de: 'der Boden', word: 'Boden', article: 'der', plural: 'Böden', en: 'floor', wordId: '4e639868-e973-4960-b3db-27577296d3bb' },
        { de: 'die Rechnung', word: 'Rechnung', article: 'die', plural: 'Rechnungen', en: 'bill, invoice', wordId: '9964166d-1c8d-46ca-b25d-ee064c6ebf36' },
        { de: 'der Rabatt', word: 'Rabatt', article: 'der', plural: 'Rabatte', en: 'discount', wordId: 'd1f454c9-742f-4da4-8a5d-9899c4d7d5d7' },
        { de: 'das Angebot', word: 'Angebot', article: 'das', plural: 'Angebote', en: 'offer, deal', wordId: '5ef9ab3c-a1bd-42b5-8feb-75de1a60860a' },
        { de: 'wechseln', word: 'wechseln', article: null, plural: null, en: 'to change, to swap', wordId: '6fa716be-64cf-4015-8e62-a9c22afe81b5' },
        { de: 'funktionieren', word: 'funktionieren', article: null, plural: null, en: 'to work, to function', wordId: null },
      ],
      dialog: {
        title: 'An der Rezeption, am Abend',
        setting: 'Ana übernachtet vor dem Umzug im Hotel. Frau Kaya arbeitet an der Rezeption.',
        lines: [
          { speaker: 'Ana', de: 'Guten Abend, Frau Kaya. Im Zimmer ist keine Bettdecke.', en: 'Good evening, Mrs Kaya. There is no duvet in the room.' },
          { speaker: 'Frau Kaya', de: 'Entschuldigung! Und das Kissen? Ist es nicht da?', en: 'Sorry! And the pillow? Is it not there?' },
          { speaker: 'Ana', de: 'Das Kissen ist da, aber die Steckdose funktioniert nicht.', en: 'The pillow is there, but the socket does not work.' },
          { speaker: 'Frau Kaya', de: 'Wir wechseln das Zimmer. Der Flur hat keine Lampe?', en: 'We will change the room. Does the hallway have no lamp?' },
          { speaker: 'Ana', de: 'Nein. Hier ist keine Lampe und kein Spiegel.', en: 'No. Here there is no lamp and no mirror.' },
          { speaker: 'Frau Kaya', de: 'Und der Vorhang? Ist der Vorhang am Fenster?', en: 'And the curtain? Is the curtain at the window?' },
          { speaker: 'Ana', de: 'Nein. Die Decke und die Wand sind nicht schön.', en: 'No. The ceiling and the wall are not nice.' },
          { speaker: 'Frau Kaya', de: 'Ja, der Boden ist alt. Der Eingang ist auch alt.', en: 'Yes, the floor is old. The entrance is old too.' },
          { speaker: 'Ana', de: 'Und die Rechnung? Haben Sie keinen Rabatt?', en: 'And the bill? Do you have no discount?' },
          { speaker: 'Frau Kaya', de: 'Ja. Das Angebot ist gut: Sie bezahlen die Nacht nicht.', en: 'Yes. The offer is good: you do not pay for the night.' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie, was im Zimmer nicht funktioniert.',
        promptEn: 'Say what is not working in the room.',
        model: 'Die Steckdose funktioniert nicht.',
        // Die Präfixe tragen die Verneinung, nicht den Satzanfang: „Die Lampe ist schön.“ darf
        // diesen Vortest nicht bestehen (PretestStage.jsx prüft mit startsWith).
        accepted: ['Die Steckdose funktioniert nicht', 'Die Lampe ist nicht', 'Das ist nicht', 'Das ist kein'],
      },
      notice: {
        title: 'nicht oder kein?',
        bodyDe: '**kein** verneint ein Nomen mit unbestimmtem Artikel oder ohne Artikel: eine Lampe → **keine** Lampe, ein Spiegel → **kein** Spiegel, im Akkusativ **keinen** Rabatt. **nicht** verneint alles andere: ein Verb (funktioniert **nicht**), ein Adjektiv (**nicht** schön) oder ein Nomen mit bestimmtem Artikel. **nicht** steht am Satzende oder direkt vor dem Wort.',
        examples: ['Nein. Hier ist keine Lampe und kein Spiegel.', 'Das Kissen ist da, aber die Steckdose funktioniert nicht.'],
        ruleSlug: 'negation',
      },
      phonetik: { focus: 'Die Verneinung wird betont', items: ['NICHT gut', 'KEIN Spiegel', 'KEI-ne Lam-pe'] },
      hoeren: { kind: 'dictation', lines: [2, 6] },
      sprechen: {
        readAloud: [4, 8],
        open: {
          teil: 'Sprechen Teil 3',
          promptDe: 'Reklamieren Sie höflich an der Rezeption: Im Zimmer fehlt etwas.',
          hintWords: ['nicht', 'kein', 'die Rechnung'],
          // Sie — der Gegenüber ist die Rezeption; die höfliche Absage in Mission 6 siezt ebenso.
          anrede: 'Sie',
          // Mission 6 „Eine Einladung absagen“ trägt „negation with nicht / kein“ — die Zielstruktur
          // dieser Lektion; höflich reklamieren und höflich absagen sind dieselbe Sprachhandlung.
          missionOrder: 6,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a12-l04',
        taskDe: 'Sie wohnen im Hotel. Im Zimmer funktioniert etwas nicht. Schreiben Sie dem Hotel eine kurze Nachricht. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Ihre Zimmernummer und der Tag', 'Was im Zimmer nicht funktioniert', 'Ihre Frage zur Toilette im Flur'],
        minWords: 25,
        maxWords: 45,
        sample: 'Sehr geehrte Damen und Herren, ich bin in Zimmer 12. Die Steckdose funktioniert nicht. Ist die Toilette im Flur frei? Viele Grüße, Ana Chakiri',
      },
      links: { listeningExercise: null, readingOrder: 9 },
      practiceRule: { topics: ['negation', 'accusative-intro'], typedMin: 3 },
    },
    {
      nr: 5,
      id: 'a1.2-l05',
      slug: 'plaene-fuer-das-wochenende',
      title: 'Pläne für das Wochenende',
      situation: 'Pläne und Wünsche: einen Ausflug verabreden',
      handlungsfeld: 'Freizeit: Verabredungen treffen und Pläne machen',
      canDo: [
        'Ich kann mit W-Fragen nach der Abfahrt fragen.',
        'Ich kann sagen, wann ein Zug oder ein Bus fährt.',
        'Ich kann sagen, wie oft ich etwas mache.',
        'Ich kann einen Ausflug oder ein Konzert verabreden.',
      ],
      examTeile: ['Hören Teil 1', 'Sprechen Teil 2', 'Schreiben Teil 1'],
      grammarSlugs: ['question-words', 'basic-sentence-structure'],
      primarySlug: 'question-words',
      minutes: 15,
      wortfeld: [
        { de: 'jetzt', word: 'jetzt', article: null, plural: null, en: 'now', wordId: 'f83cc466-8786-4551-9503-76694340a72c' },
        { de: 'bald', word: 'bald', article: null, plural: null, en: 'soon', wordId: 'c4e66eae-5ae1-4e92-94fe-7dba0a1c6269' },
        { de: 'oft', word: 'oft', article: null, plural: null, en: 'often', wordId: '4416d7a3-6e8f-47c2-b5f0-28a377bd507f' },
        { de: 'manchmal', word: 'manchmal', article: null, plural: null, en: 'sometimes', wordId: 'f53ef92d-3fb0-4776-ad6e-f5596eb510a0' },
        { de: 'nie', word: 'nie', article: null, plural: null, en: 'never', wordId: '654ab276-e58b-4ef1-a4fc-fa7d716a8039' },
        { de: 'wieder', word: 'wieder', article: null, plural: null, en: 'again', wordId: 'd7e01d71-6baf-425e-9b6c-8c9f0071dfc2' },
        { de: 'früh', word: 'früh', article: null, plural: null, en: 'early', wordId: '925e1016-9fb3-42f6-99b5-2e1b82c771c9' },
        { de: 'spät', word: 'spät', article: null, plural: null, en: 'late', wordId: 'b36c2b8c-7a0e-4542-8df9-8be83aab3195' },
        { de: 'die Stunde', word: 'Stunde', article: 'die', plural: 'Stunden', en: 'hour', wordId: 'ad917256-a010-4a24-9fe2-8854985fb7eb' },
        { de: 'die Minute', word: 'Minute', article: 'die', plural: 'Minuten', en: 'minute', wordId: 'e3333a7e-6372-4006-a260-05f356b95ed0' },
        { de: 'der Fahrplan', word: 'Fahrplan', article: 'der', plural: 'Fahrpläne', en: 'timetable', wordId: '345bd31e-1077-4cdf-8845-c1ecaab2de03' },
        { de: 'der Ausflug', word: 'Ausflug', article: 'der', plural: 'Ausflüge', en: 'outing, excursion', wordId: '3f6463b5-cb47-4ed2-882b-50eb2c80bdd9' },
        { de: 'das Konzert', word: 'Konzert', article: 'das', plural: 'Konzerte', en: 'concert', wordId: '95721d1b-ebbc-48a5-982c-254c78293732' },
        { de: 'der Urlaub', word: 'Urlaub', article: 'der', plural: '—', en: 'holiday, vacation', wordId: '52f2ad78-3002-412f-ac0d-42616c8c573f' },
        { de: 'die Ferien', word: 'Ferien', article: 'die', plural: '—', en: 'school holidays (pl.)', wordId: '9510b1b9-49cd-4235-9c0e-9c49e6cb7fd2' },
        { de: 'der Film', word: 'Film', article: 'der', plural: 'Filme', en: 'film, movie', wordId: '1689cbe4-dc7d-4a43-9cd3-b19c5a1874be' },
      ],
      dialog: {
        title: 'Zwei Pläne und ein Fahrplan',
        setting: 'Tim und Lena planen das Wochenende.',
        lines: [
          { speaker: 'Lena', de: 'Tim, was machst du am Wochenende? Hast du Zeit?', en: 'Tim, what are you doing at the weekend? Do you have time?' },
          { speaker: 'Tim', de: 'Ja. Wo und wohin fahren wir? Ich habe den Fahrplan.', en: 'Yes. Where are we and where are we going? I have the timetable.' },
          { speaker: 'Lena', de: 'Wann fährt der Zug? Um wie viel Uhr?', en: 'When does the train leave? At what time?' },
          { speaker: 'Tim', de: 'Früh. Wer kommt mit? Das Konzert ist in zwei Stunden.', en: 'Early. Who is coming along? The concert is in two hours.' },
          { speaker: 'Lena', de: 'Warum so früh? Ich stehe nie früh auf.', en: 'Why so early? I never get up early.' },
          { speaker: 'Tim', de: 'Der Ausflug ist weit. Wie oft fährt der Bus?', en: 'The outing is far. How often does the bus run?' },
          { speaker: 'Lena', de: 'Manchmal jede Stunde. Ich bin oft zu spät.', en: 'Sometimes every hour. I am often too late.' },
          { speaker: 'Tim', de: 'Jetzt nicht. In zehn Minuten gehen wir wieder.', en: 'Not now. In ten minutes we will go again.' },
          { speaker: 'Lena', de: 'Und die Ferien? Wohin fahren wir im Urlaub?', en: 'And the school holidays? Where are we going on holiday?' },
          { speaker: 'Tim', de: 'Bald nach Italien. Und danach kommt der Film ins Kino!', en: 'To Italy soon. And after that the film comes to the cinema!' },
        ],
      },
      pretest: {
        promptDe: 'Fragen Sie nach der Abfahrt des Zuges.',
        promptEn: 'Ask when the train leaves.',
        model: 'Wann fährt der Zug?',
        accepted: ['Wann', 'Um wie viel', 'Wie'],
      },
      notice: {
        title: 'W-Fragen: das Fragewort steht vorn',
        bodyDe: 'In der W-Frage steht das Fragewort auf Position 1 und das Verb direkt dahinter: **Wann** fährt der Zug? **Wohin** fahren wir? **Wie oft** kommt der Bus? **Wer** fragt nach der Person, **was** nach der Sache, **wo** nach dem Ort, **wohin** nach der Richtung, **warum** nach dem Grund, **wie viel** nach der Menge und wie lange nach der Dauer.',
        examples: ['Wann fährt der Zug? Um wie viel Uhr?', 'Der Ausflug ist weit. Wie oft fährt der Bus?'],
        ruleSlug: 'question-words',
      },
      phonetik: { focus: 'Die W-Frage endet fallend', items: ['WANN fährt der Zug', 'WO-hin fahren wir', 'WIE oft kommt der Bus'] },
      hoeren: { kind: 'dictation', lines: [2, 5] },
      sprechen: {
        // [1] und [4] statt [0] und [8]: die alten Zeilen trugen „am Wochenende“ und „im Urlaub“,
        // also Dativpräpositionen sechs Lektionen vor ihrer Regel — in einer Produktionszeile.
        readAloud: [1, 4],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen Sie am Schalter nach dem Zug: Wann? Wohin? Wie lange?',
          hintWords: ['wann', 'wohin', 'der Fahrplan'],
          // Sie — Teil 2 spielt mit einem Prüfungspartner, die Prüfungsanrede bleibt Sie.
          anrede: 'Sie',
          // Mission 11 trägt „W-Fragen: Wo, Wie viele, Wann, Wie oft“ — die Zielstruktur dieser
          // Lektion. Vorher hing hier Mission 4 (Zahlen), die zu L2 gehört.
          missionOrder: 11,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a12-l05',
        // KEIN erfundenes „Formular für den Ausflug“ (es stand zweimal im Kurs): Schreiben Teil 1
        // von SD1 ist eine Anmeldung mit echten Formularfeldern und Unterschrift.
        taskDe: 'Tim Berger fährt am Samstag zum Konzert nach Köln. Der Zug fährt um 8 Uhr. Er bleibt zwei Tage. Füllen Sie die Anmeldung für die Fahrt zum Konzert aus.',
        fields: ['Familienname', 'Vorname', 'Tag', 'Uhrzeit', 'Unterschrift'],
        minWords: 5,
        maxWords: 40,
        sample: 'Familienname: Berger / Vorname: Tim / Tag: Samstag / Uhrzeit: 8 Uhr / Unterschrift: T. Berger',
      },
      links: { listeningExercise: 4, readingOrder: 6 },
      practiceRule: { topics: ['question-words', 'basic-sentence-structure'], typedMin: 3 },
    },
    {
      nr: 6,
      id: 'a1.2-l06',
      slug: 'in-der-arztpraxis',
      title: 'In der Arztpraxis',
      situation: 'Gesundheit, Körper und der Arzt',
      handlungsfeld: 'Gesundheit: Beschwerden nennen und Rat verstehen',
      canDo: [
        'Ich kann sagen, was mir wehtut.',
        'Ich kann Körperteile wie Kopf und Hals nennen.',
        'Ich kann in der Praxis nach einem Termin fragen.',
        'Ich kann verstehen, wann ich eine Tablette nehmen soll.',
      ],
      examTeile: ['Sprechen Teil 3', 'Schreiben Teil 2'],
      grammarSlugs: ['stem-changing-verbs', 'basic-sentence-structure'],
      primarySlug: 'stem-changing-verbs',
      minutes: 15,
      wortfeld: [
        { de: 'der Kopf', word: 'Kopf', article: 'der', plural: 'Köpfe', en: 'head', wordId: '21f8773e-1d39-445f-9d7e-b00f8efc6e0d' },
        { de: 'der Hals', word: 'Hals', article: 'der', plural: 'Hälse', en: 'neck, throat', wordId: '08422dbf-347a-47c1-b3d6-7d565b49362e' },
        { de: 'der Bauch', word: 'Bauch', article: 'der', plural: 'Bäuche', en: 'belly, stomach', wordId: '24c34d7f-beaf-4d7b-b1ef-bdcec5250b78' },
        { de: 'der Rücken', word: 'Rücken', article: 'der', plural: 'Rücken', en: 'back', wordId: '338bc35e-06c7-4614-98d7-f2fbcb6369ee' },
        { de: 'die Hand', word: 'Hand', article: 'die', plural: 'Hände', en: 'hand', wordId: 'e20f412a-587a-4894-9320-62db71b0f88a' },
        { de: 'der Fuß', word: 'Fuß', article: 'der', plural: 'Füße', en: 'foot', wordId: 'dbc2e7fd-17a2-4ff3-b589-a4cb6f8ee65d' },
        { de: 'das Auge', word: 'Auge', article: 'das', plural: 'Augen', en: 'eye', wordId: 'eaf9c7c0-45d1-464c-a1c6-1ac2ac77731b' },
        { de: 'der Zahn', word: 'Zahn', article: 'der', plural: 'Zähne', en: 'tooth', wordId: '3f4c6a8d-ed4d-46f2-aac9-ec4260e084d2' },
        { de: 'die Kopfschmerzen', word: 'Kopfschmerzen', article: 'die', plural: '—', en: 'headache (pl.)', wordId: '574ced72-4355-4245-bde7-b4dff61318fd' },
        { de: 'das Fieber', word: 'Fieber', article: 'das', plural: '—', en: 'fever', wordId: '1cc46ae8-3a05-48d4-8436-b3d6d488d8de' },
        { de: 'die Erkältung', word: 'Erkältung', article: 'die', plural: 'Erkältungen', en: 'cold (illness)', wordId: 'a1f9804e-af57-4bdf-a829-6fa560f1948d' },
        { de: 'die Tablette', word: 'Tablette', article: 'die', plural: 'Tabletten', en: 'tablet, pill', wordId: '380367a8-d8b8-40e5-a6c4-889fff19337b' },
        { de: 'die Praxis', word: 'Praxis', article: 'die', plural: 'Praxen', en: 'doctor’s practice', wordId: '11395bb1-1b3b-4684-8302-f8d125e9666c' },
        { de: 'die Versichertenkarte', word: 'Versichertenkarte', article: 'die', plural: 'Versichertenkarten', en: 'health insurance card', wordId: '87bb8fdf-2d08-4177-8695-38949bd4fd43' },
        { de: 'gesund', word: 'gesund', article: null, plural: null, en: 'healthy', wordId: '9d6b775f-c800-4635-a927-84d396e4588e' },
        { de: 'wehtun', word: 'wehtun', article: null, plural: null, en: 'to hurt', wordId: '79a1905a-16c7-4928-a094-6ff4b97b5a3d' },
        { de: 'nehmen', word: 'nehmen', article: null, plural: null, en: 'to take (er nimmt)', wordId: '49f9ed42-7512-49bf-9606-2186311f04c0' },
        { de: 'helfen', word: 'helfen', article: null, plural: null, en: 'to help (er hilft)', wordId: '6b6abaa2-a1ac-40e7-a07d-a583f403067f' },
        { de: 'sehen', word: 'sehen', article: null, plural: null, en: 'to see (er sieht)', wordId: '549cdf79-b797-4410-b3b7-eb0fe90cc476' },
      ],
      dialog: {
        title: 'Der Hals tut weh',
        setting: 'Ana ist in der Praxis. Frau Berger ist Ärztin.',
        lines: [
          { speaker: 'Frau Berger', de: 'Guten Tag, Frau Chakiri. Was tut Ihnen weh?', en: 'Good day, Mrs Chakiri. What hurts?' },
          { speaker: 'Ana', de: 'Mein Hals tut weh und der Kopf auch.', en: 'My throat hurts and my head too.' },
          { speaker: 'Frau Berger', de: 'Haben Sie Fieber? Ist das eine Erkältung?', en: 'Do you have a fever? Is it a cold?' },
          { speaker: 'Ana', de: 'Nein, ich habe kein Fieber. Ich schlafe nicht gut.', en: 'No, I do not have a fever. I do not sleep well.' },
          { speaker: 'Frau Berger', de: 'Sie nehmen eine Tablette. Die Tablette hilft gegen Kopfschmerzen.', en: 'You take a tablet. The tablet helps against headaches.' },
          { speaker: 'Ana', de: 'Wie oft nimmt man die Tablette? Und wann isst man?', en: 'How often does one take the tablet? And when does one eat?' },
          { speaker: 'Frau Berger', de: 'Am Morgen und am Abend. Wer krank ist, schläft viel.', en: 'In the morning and in the evening. Whoever is ill sleeps a lot.' },
          { speaker: 'Ana', de: 'Und mein Zahn? Der Rücken und der Bauch tun weh.', en: 'And my tooth? My back and my stomach hurt.' },
          { speaker: 'Frau Berger', de: 'Ihr Auge ist gesund. Die Hand und der Fuß sehen gut aus.', en: 'Your eye is healthy. The hand and the foot look fine.' },
          { speaker: 'Ana', de: 'Danke. Hier ist meine Versichertenkarte für die Praxis.', en: 'Thank you. Here is my health insurance card for the practice.' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie in einem Satz, was Ihnen wehtut.',
        promptEn: 'Say in one sentence what hurts.',
        model: 'Mein Kopf tut weh.',
        accepted: ['Mein Kopf tut weh', 'Mein Hals tut weh', 'Ich habe Fieber', 'Ich habe Kopfschmerzen'],
      },
      notice: {
        title: 'Verben mit Vokalwechsel',
        bodyDe: 'Einige Verben ändern im Präsens den Stammvokal, aber nur in den Formen mit -st und -t: nehmen → man **nimmt**, helfen → sie **hilft**, essen → man **isst**, schlafen → wer **schläft**. Bei ich, wir, ihr und Sie bleibt der Vokal: ich **schlafe**, Sie **nehmen**.',
        examples: ['Sie nehmen eine Tablette. Die Tablette hilft gegen Kopfschmerzen.', 'Ihr Auge ist gesund. Die Hand und der Fuß sehen gut aus.'],
        ruleSlug: 'stem-changing-verbs',
      },
      phonetik: { focus: 'Der Umlaut ä in schlafen – schläft', items: ['ich SCHLA-fe', 'er SCHLÄFT', 'er NIMMT'] },
      hoeren: { kind: 'dictation', lines: [1, 3] },
      sprechen: {
        readAloud: [4, 8],
        open: {
          // NICHT Teil 1: Teil 1 von Start Deutsch 1 ist ausschließlich „sich vorstellen“ (das liegt
          // jetzt in L7, mit mission_order 9). Sich anmelden und um einen Termin bitten ist Teil 3.
          teil: 'Sprechen Teil 3',
          promptDe: 'Melden Sie sich in der Praxis an und bitten Sie um einen Termin.',
          hintWords: ['die Praxis', 'wehtun', 'die Versichertenkarte'],
          // Sie — der Gegenüber ist das Praxispersonal (Mission 1, „calm medical receptionist“).
          anrede: 'Sie',
          missionOrder: 1,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a12-l06',
        taskDe: 'Sie sind krank. Sie kommen heute nicht in die Praxis. Schreiben Sie der Praxis eine kurze Nachricht. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Warum Sie schreiben', 'Was Ihnen wehtut', 'Ihre Frage nach einem neuen Termin'],
        minWords: 25,
        maxWords: 45,
        sample: 'Sehr geehrte Damen und Herren, ich bin krank. Mein Hals tut weh und ich habe Fieber. Wann ist ein neuer Termin frei? Viele Grüße, Ana Chakiri',
      },
      // Kein A1.2-Lesetext handelt von Gesundheit und keine der sechs Hörübungen von der Praxis —
      // das ist der ehrliche Zustand; ein falsches Etikett wäre schlechter als eine Lücke.
      links: { listeningExercise: null, readingOrder: null },
      practiceRule: { topics: ['stem-changing-verbs'], typedMin: 4 },
    },
    {
      nr: 7,
      id: 'a1.2-l07',
      slug: 'wer-ist-das',
      title: 'Wer ist das?',
      situation: 'Aussehen und Charakter beschreiben',
      handlungsfeld: 'Soziale Kontakte: Personen beschreiben',
      canDo: [
        'Ich kann fragen, wer die Frau auf dem Foto ist.',
        'Ich kann sagen, ob eine Person groß oder klein ist.',
        'Ich kann Personen in meiner Familie nennen.',
        'Ich kann sagen, ob jemand glücklich oder traurig ist.',
      ],
      examTeile: ['Lesen Teil 2', 'Sprechen Teil 1', 'Schreiben Teil 1'],
      grammarSlugs: ['nominative-case', 'basic-sentence-structure'],
      primarySlug: 'nominative-case',
      minutes: 15,
      wortfeld: [
        { de: 'das Gesicht', word: 'Gesicht', article: 'das', plural: 'Gesichter', en: 'face', wordId: '24489dc0-e403-403b-b8eb-3b8b0775e78e' },
        { de: 'das Haar', word: 'Haar', article: 'das', plural: 'Haare', en: 'hair', wordId: 'b3f6bdcb-9821-47ca-b13d-e0ed422218b7' },
        { de: 'die Nase', word: 'Nase', article: 'die', plural: 'Nasen', en: 'nose', wordId: 'a20c544d-e311-45b8-a0fe-f57256868541' },
        { de: 'der Mund', word: 'Mund', article: 'der', plural: 'Münder', en: 'mouth', wordId: 'e67b8ff5-f67a-4aa5-adb0-60fd351d81e2' },
        { de: 'der Arm', word: 'Arm', article: 'der', plural: 'Arme', en: 'arm', wordId: '5266caa4-5ae6-4977-ac95-9931b3e43dbf' },
        { de: 'das Bein', word: 'Bein', article: 'das', plural: 'Beine', en: 'leg', wordId: '3a5e6c5a-98fd-415f-9fff-4c12f5c7fed1' },
        { de: 'der Körper', word: 'Körper', article: 'der', plural: 'Körper', en: 'body', wordId: '8e5396ef-78c1-4c98-97a6-6e9fe9242a35' },
        { de: 'groß', word: 'groß', article: null, plural: null, en: 'big, tall', wordId: 'fdb3c007-c2a6-492a-998d-70d2e2581a3f' },
        { de: 'klein', word: 'klein', article: null, plural: null, en: 'small, short', wordId: '7f113edd-414b-4112-a130-5d8da4beb50b' },
        { de: 'lang', word: 'lang', article: null, plural: null, en: 'long', wordId: 'cfb065d9-d0ac-4a05-82f2-817c1bb97974' },
        { de: 'kurz', word: 'kurz', article: null, plural: null, en: 'short', wordId: 'fb6a41a3-4393-40be-b24b-fad2f05945e6' },
        { de: 'glücklich', word: 'glücklich', article: null, plural: null, en: 'happy', wordId: '9226e1d8-d6a7-488b-b054-84737b11c654' },
        { de: 'traurig', word: 'traurig', article: null, plural: null, en: 'sad', wordId: 'b4cede8e-35c4-46ed-b555-da3f3074a1b3' },
        { de: 'die Oma', word: 'Oma', article: 'die', plural: 'Omas', en: 'grandma', wordId: '5d8320e0-eddf-46ec-a151-b2ca754924d0' },
        { de: 'der Opa', word: 'Opa', article: 'der', plural: 'Opas', en: 'grandpa', wordId: '504d525a-403b-484d-aef8-8c022e35695e' },
        { de: 'der Onkel', word: 'Onkel', article: 'der', plural: 'Onkel', en: 'uncle', wordId: '06e0961f-5fc3-4097-a8eb-e4c179c3f8d3' },
        { de: 'die Tante', word: 'Tante', article: 'die', plural: 'Tanten', en: 'aunt', wordId: 'a9f1d4e3-7beb-4ba2-a3bb-4577d0f7e007' },
      ],
      dialog: {
        title: 'Fotos aus Marokko',
        setting: 'Lena sieht Fotos von Anas Familie.',
        lines: [
          { speaker: 'Lena', de: 'Wer ist die Frau da? Sie hat lange Haare.', en: 'Who is the woman there? She has long hair.' },
          { speaker: 'Ana', de: 'Das ist meine Tante. Ihr Gesicht ist schön.', en: 'That is my aunt. Her face is beautiful.' },
          { speaker: 'Lena', de: 'Und der Mann? Wer ist das? Dein Onkel?', en: 'And the man? Who is that? Your uncle?' },
          { speaker: 'Ana', de: 'Ja, mein Onkel. Er ist groß und immer glücklich.', en: 'Yes, my uncle. He is tall and always happy.' },
          { speaker: 'Lena', de: 'Und das Kind da? Der Mund ist klein.', en: 'And the child there? The mouth is small.' },
          { speaker: 'Ana', de: 'Das sind meine Oma und mein Opa. Sie sind alt.', en: 'Those are my grandma and my grandpa. They are old.' },
          { speaker: 'Lena', de: 'Deine Oma ist traurig? Ihre Nase ist wie deine.', en: 'Is your grandma sad? Her nose is like yours.' },
          { speaker: 'Ana', de: 'Nein, sie ist nicht traurig. Sie ist müde.', en: 'No, she is not sad. She is tired.' },
          { speaker: 'Lena', de: 'Wer ist der Mann mit dem kurzen Haar?', en: 'Who is the man with the short hair?' },
          { speaker: 'Ana', de: 'Das ist mein Bruder. Sein Bein und sein Arm sind lang.', en: 'That is my brother. His leg and his arm are long.' },
        ],
      },
      pretest: {
        promptDe: 'Beschreiben Sie eine Person: Gesicht, Haare und Körper.',
        promptEn: 'Describe a person: face, hair and body.',
        model: 'Mein Onkel ist groß.',
        accepted: ['Mein Onkel ist', 'Meine Tante ist', 'Das ist mein', 'Er ist groß', 'Sie ist klein'],
      },
      notice: {
        title: 'Der Nominativ: wer oder was?',
        bodyDe: 'Lektion 3 hat das Objekt gezeigt: den Onkel. Das Subjekt dagegen steht im Nominativ, und danach fragt man mit **wer**: **Wer** ist das? — **Mein Onkel** ist groß. Nach sein steht das zweite Nomen ebenfalls im Nominativ: **Das ist** mein Bruder. Die Artikel im Nominativ: **der** Opa, **die** Oma.',
        examples: ['Wer ist die Frau da? Sie hat lange Haare.', 'Das ist mein Bruder. Sein Bein und sein Arm sind lang.'],
        ruleSlug: 'nominative-case',
      },
      // Der Kontrast muss im KLANG liegen, nicht in der Bedeutung: „lang“ [laŋ] und „kurz“ [kʊʁts]
      // haben beide einen kurzen Vokal. Haar [haːɐ̯] ist lang, Arm [aʁm] und Mund [mʊnt] sind kurz.
      phonetik: { focus: 'Langer und kurzer Vokal: Haar – Arm', items: ['das HAAR', 'der ARM', 'der MUND'] },
      hoeren: { kind: 'dictation', lines: [1, 5] },
      sprechen: {
        readAloud: [0, 9],
        open: {
          // Sprechen Teil 1 von Start Deutsch 1 ist das vollständige Sich-Vorstellen — und
          // mission_order 9 heißt wörtlich so. Vorher behauptete L6 diesen Teil und niemand
          // verlinkte die Mission, die ihn trainiert.
          teil: 'Sprechen Teil 1',
          promptDe: 'Stellen Sie sich vollständig vor: Name, Alter, Land, Wohnort, Sprachen, Beruf und Familie.',
          hintWords: ['der Name', 'das Land', 'die Familie'],
          // Sie — die Gegenüber ist die Prüferin (Mission 9).
          anrede: 'Sie',
          missionOrder: 9,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a12-l07',
        // KEIN „Steckbrief“ mit dem Feld „Aussehen“: Schreiben Teil 1 von SD1 ist immer eine
        // ANMELDUNG (Kurs, Bibliothek, Verein, Kasse) mit echten Formularfeldern und Unterschrift.
        taskDe: 'Lena Berg ist 24 Jahre alt und wohnt in der Kölner Straße 12 in Köln. Sie ist am 3. März 2002 geboren. Füllen Sie die Anmeldung für den Sportverein aus.',
        fields: ['Familienname', 'Vorname', 'Geburtsdatum', 'Straße', 'Unterschrift'],
        minWords: 5,
        maxWords: 40,
        sample: 'Familienname: Berg / Vorname: Lena / Geburtsdatum: 3. März 2002 / Straße: Kölner Straße 12 / Unterschrift: L. Berg',
      },
      links: { listeningExercise: null, readingOrder: 1 },
      practiceRule: { topics: ['nominative-case'], typedMin: 3 },
    },
    {
      nr: 8,
      id: 'a1.2-l08',
      slug: 'im-haushalt-helfen',
      title: 'Im Haushalt helfen',
      situation: 'Haushalt: Aufgaben in der Wohnung',
      handlungsfeld: 'Wohnen: Aufgaben im Haushalt verteilen',
      canDo: [
        'Ich kann jemanden höflich um Hilfe bitten.',
        'Ich kann die Geräte im Haushalt nennen.',
        'Ich kann sagen, wo ein Möbelstück steht.',
        'Ich kann auf eine Bitte reagieren.',
      ],
      examTeile: ['Sprechen Teil 3', 'Schreiben Teil 2'],
      grammarSlugs: ['imperative', 'basic-sentence-structure'],
      primarySlug: 'imperative',
      minutes: 15,
      wortfeld: [
        { de: 'die Waschmaschine', word: 'Waschmaschine', article: 'die', plural: 'Waschmaschinen', en: 'washing machine', wordId: '1afe6215-47d4-4e6e-904c-e3cd9c52ce04' },
        { de: 'der Kühlschrank', word: 'Kühlschrank', article: 'der', plural: 'Kühlschränke', en: 'fridge', wordId: 'dc6a02cd-527c-4b8b-bfff-9e7a6483983c' },
        { de: 'der Herd', word: 'Herd', article: 'der', plural: 'Herde', en: 'stove', wordId: 'eed546a1-8361-424d-97fc-3c10412f56e7' },
        { de: 'der Fernseher', word: 'Fernseher', article: 'der', plural: 'Fernseher', en: 'television set', wordId: 'f1a1e033-5019-43b7-bd4b-04a8540328a0' },
        { de: 'der Teppich', word: 'Teppich', article: 'der', plural: 'Teppiche', en: 'carpet, rug', wordId: 'a8ae5ff7-ce59-4a47-8f99-f2b031497eec' },
        { de: 'das Sofa', word: 'Sofa', article: 'das', plural: 'Sofas', en: 'sofa', wordId: 'e56efd3f-2f78-4735-90fe-3df01a4f0ef1' },
        { de: 'der Schrank', word: 'Schrank', article: 'der', plural: 'Schränke', en: 'wardrobe, cupboard', wordId: '917632df-ecb9-4862-9a7b-68529421a9ce' },
        { de: 'das Bett', word: 'Bett', article: 'das', plural: 'Betten', en: 'bed', wordId: 'be670228-8583-41c1-89dc-73cf3237f683' },
        { de: 'die Möbel', word: 'Möbel', article: 'die', plural: '—', en: 'furniture (pl.)', wordId: '52176219-4783-468f-8f4b-2a4a96b10cdc' },
        { de: 'fernsehen', word: 'fernsehen', article: null, plural: null, en: 'to watch TV', wordId: 'c55cc22b-6962-41af-b67a-f9c4af7e80f9' },
        { de: 'der Nachbar', word: 'Nachbar', article: 'der', plural: 'Nachbarn', en: 'neighbour (m)', wordId: '6d7e337f-8994-46b5-baa8-c7f68f23bb54' },
        { de: 'die Garage', word: 'Garage', article: 'die', plural: 'Garagen', en: 'garage', wordId: '23767ce1-4250-4e3d-bba0-565901bb2c27' },
        { de: 'die Terrasse', word: 'Terrasse', article: 'die', plural: 'Terrassen', en: 'terrace', wordId: '8a510115-80a1-4c50-962b-3af1ee01fef5' },
        { de: 'das Dach', word: 'Dach', article: 'das', plural: 'Dächer', en: 'roof', wordId: '2f5bf08c-afb5-42fa-834d-d4766e4c2df1' },
        { de: 'warten', word: 'warten', article: null, plural: null, en: 'to wait', wordId: 'd120268f-1f3c-45d1-8f96-790720cd4e3c' },
        { de: 'das Kinderzimmer', word: 'Kinderzimmer', article: 'das', plural: 'Kinderzimmer', en: 'children’s room', wordId: 'f073f446-a844-446a-9df7-22f1517d37cc' },
      ],
      dialog: {
        title: 'Samstag in der WG',
        setting: 'Tim und Lena räumen die Wohnung auf.',
        lines: [
          { speaker: 'Lena', de: 'Tim, die Waschmaschine ist da. Hilf mir bitte!', en: 'Tim, the washing machine is here. Help me, please!' },
          { speaker: 'Tim', de: 'Ja, gleich. Ich sehe fern.', en: 'Yes, in a moment. I am watching TV.' },
          { speaker: 'Lena', de: 'Nein, komm jetzt! Der Kühlschrank hat kein Brot.', en: 'No, come now! The fridge has no bread.' },
          { speaker: 'Tim', de: 'Gut. Wo hast du die Möbel für das Kinderzimmer?', en: 'Fine. Where do you have the furniture for the children’s room?' },
          { speaker: 'Lena', de: 'Das Sofa und der Schrank sind in der Garage.', en: 'The sofa and the wardrobe are in the garage.' },
          { speaker: 'Tim', de: 'Und das Bett? Warte, ich frage die Nachbarin.', en: 'And the bed? Wait, I will ask the neighbour.' },
          { speaker: 'Lena', de: 'Gut. Der Teppich ist auf der Terrasse. Hol ihn!', en: 'Good. The carpet is on the terrace. Get it!' },
          { speaker: 'Tim', de: 'Und der Herd? Der Herd ist neu, das Dach ist alt.', en: 'And the stove? The stove is new, the roof is old.' },
          { speaker: 'Lena', de: 'Mach den Fernseher aus und hilf mir bitte!', en: 'Turn off the television and help me, please!' },
          { speaker: 'Tim', de: 'Ja, ja. Ich komme jetzt. Der Nachbar wartet!', en: 'Yes, yes. I am coming now. The neighbour is waiting!' },
        ],
      },
      pretest: {
        promptDe: 'Bitten Sie Ihre Mitbewohnerin höflich um Hilfe im Haushalt.',
        promptEn: 'Politely ask your flatmate for help with the housework.',
        model: 'Hilf mir bitte!',
        accepted: ['Hilf mir', 'Hilfst du', 'Kannst du bitte', 'Bitte hilf'],
      },
      notice: {
        title: 'Der Imperativ: bitten und auffordern',
        bodyDe: 'Der Imperativ steht auf Position 1. Bei **du** fällt das Pronomen weg und die Endung -st fällt mit: **Komm!**, **Warte!**, **Hilf!** Trennbare Verben schicken die Vorsilbe ans Ende: **Mach** den Fernseher **aus**! Bei Sie bleibt das Pronomen stehen: Helfen Sie bitte! Das Wort **bitte** macht jede Aufforderung höflich.',
        examples: ['Tim, die Waschmaschine ist da. Hilf mir bitte!', 'Mach den Fernseher aus und hilf mir bitte!'],
        ruleSlug: 'imperative',
      },
      phonetik: { focus: 'Der Imperativ endet fallend', items: ['KOMM', 'WAR-te', 'HILF mir'] },
      hoeren: { kind: 'dictation', lines: [2, 5] },
      sprechen: {
        readAloud: [0, 8],
        open: {
          teil: 'Sprechen Teil 3',
          promptDe: 'Formulieren Sie drei höfliche Bitten in der Sie-Form und reagieren Sie auf eine Bitte.',
          hintWords: ['bitte', 'helfen', 'die Waschmaschine'],
          // Sie — die Gegenüber ist die Prüferin (Mission 12, Sprechen Teil 3); die Sie-Bitte ist
          // die Prüfungsform, die du-Bitte übt der Dialog.
          anrede: 'Sie',
          missionOrder: 12,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a12-l08',
        taskDe: 'Sie sind heute nicht zu Hause. Schreiben Sie Tim eine kurze Nachricht mit drei Bitten für den Haushalt. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Was in der Küche zu tun ist', 'Wohin der Teppich soll', 'Wann Sie nach Hause kommen'],
        minWords: 25,
        maxWords: 45,
        sample: 'Hallo Tim, mach bitte den Kühlschrank leer. Der Teppich kommt auf die Terrasse. Ich komme um sechs Uhr. Bis später, Lena',
      },
      links: { listeningExercise: null, readingOrder: 4 },
      practiceRule: { topics: ['imperative'], typedMin: 4 },
    },
    {
      nr: 9,
      id: 'a1.2-l09',
      slug: 'regeln-unterwegs',
      title: 'Regeln unterwegs',
      situation: 'Regeln im Verkehr und für die Umwelt',
      handlungsfeld: 'Mobilität und Umwelt: Regeln verstehen und erfragen',
      canDo: [
        'Ich kann fragen, was ich darf und was nicht.',
        'Ich kann sagen, was ich machen muss.',
        'Ich kann eine Regel im Verkehr verstehen.',
        'Ich kann sagen, wohin der Müll kommt.',
      ],
      examTeile: ['Lesen Teil 3', 'Sprechen Teil 2', 'Schreiben Teil 1'],
      grammarSlugs: ['modal-verbs-intro', 'basic-sentence-structure'],
      primarySlug: 'modal-verbs-intro',
      minutes: 15,
      wortfeld: [
        { de: 'das Ticket', word: 'Ticket', article: 'das', plural: 'Tickets', en: 'ticket', wordId: '1c7dea4c-000f-40d3-a8db-56522ccd2db1' },
        { de: 'einsteigen', word: 'einsteigen', article: null, plural: null, en: 'to get on, to board', wordId: '1b893628-7139-44fc-9320-cb9b9c1934ad' },
        { de: 'aussteigen', word: 'aussteigen', article: null, plural: null, en: 'to get off', wordId: '6eb82871-60b9-43f9-9bd3-16c41abff4b2' },
        { de: 'abfahren', word: 'abfahren', article: null, plural: null, en: 'to depart', wordId: '49fbe306-6da9-4576-aa23-0c905db08bef' },
        { de: 'ankommen', word: 'ankommen', article: null, plural: null, en: 'to arrive', wordId: 'b7050b8c-8005-4501-b7c9-8e558c4d6c3b' },
        { de: 'das Fahrrad', word: 'Fahrrad', article: 'das', plural: 'Fahrräder', en: 'bicycle', wordId: '4fafefeb-d11d-46e0-805d-bb88fad20d27' },
        { de: 'das Taxi', word: 'Taxi', article: 'das', plural: 'Taxis', en: 'taxi', wordId: '00f9b10e-a8f0-4959-9f09-8056be46f066' },
        { de: 'der Koffer', word: 'Koffer', article: 'der', plural: 'Koffer', en: 'suitcase', wordId: '19b9bb08-6dc3-4723-9830-af363fdb48e3' },
        { de: 'die Reise', word: 'Reise', article: 'die', plural: 'Reisen', en: 'trip, journey', wordId: '9ab444e1-f9ce-46ab-bec9-d3f51d6dcc98' },
        { de: 'das Flugzeug', word: 'Flugzeug', article: 'das', plural: 'Flugzeuge', en: 'aeroplane', wordId: 'cb17abc8-2bb2-4fad-9d59-171db582ce8b' },
        { de: 'der Flughafen', word: 'Flughafen', article: 'der', plural: 'Flughäfen', en: 'airport', wordId: 'bc1169cf-dfdf-42a0-9071-b0a320d0393d' },
        { de: 'fliegen', word: 'fliegen', article: null, plural: null, en: 'to fly', wordId: 'efcb7b1c-2664-4e5e-8d21-c94ac2ede328' },
        { de: 'laufen', word: 'laufen', article: null, plural: null, en: 'to run, to walk (er läuft)', wordId: '40591236-9146-4b9c-8c74-5700492dcfa9' },
        { de: 'langsam', word: 'langsam', article: null, plural: null, en: 'slow', wordId: 'a66e49c4-82bd-4f11-8c4a-6707fd323b4a' },
        { de: 'schnell', word: 'schnell', article: null, plural: null, en: 'fast, quick', wordId: '45358979-cee8-40e2-a2cd-d17729ac377a' },
        { de: 'der Müll', word: 'Müll', article: 'der', plural: '—', en: 'rubbish, waste', wordId: null },
      ],
      dialog: {
        title: 'Am Eingang zum Bahnhof',
        setting: 'Herr Schmidt arbeitet am Bahnhof. Ana kommt mit dem Fahrrad.',
        lines: [
          { speaker: 'Herr Schmidt', de: 'Guten Tag. Hier dürfen Sie nicht mit dem Fahrrad fahren.', en: 'Good day. You may not cycle here.' },
          { speaker: 'Ana', de: 'Entschuldigung. Wo darf ich langsam fahren?', en: 'Sorry. Where may I ride slowly?' },
          { speaker: 'Herr Schmidt', de: 'Am Platz. Den Müll müssen Sie nach Hause nehmen.', en: 'At the square. You must take the rubbish home.' },
          { speaker: 'Ana', de: 'Gut. Ich will zum Flughafen. Der Koffer ist da.', en: 'Fine. I want to go to the airport. The suitcase is here.' },
          { speaker: 'Herr Schmidt', de: 'Mit dem Taxi schnell, mit dem Bus langsam.', en: 'Quick by taxi, slow by bus.' },
          { speaker: 'Ana', de: 'Ich möchte ein Ticket. Wo soll ich einsteigen?', en: 'I would like a ticket. Where should I get on?' },
          { speaker: 'Herr Schmidt', de: 'Hier. Sie dürfen langsam laufen, aber nicht schnell.', en: 'Here. You may walk slowly, but not fast.' },
          { speaker: 'Ana', de: 'Und wo muss ich aussteigen? Das Flugzeug fliegt bald.', en: 'And where do I have to get off? The plane leaves soon.' },
          { speaker: 'Herr Schmidt', de: 'Ja. Das Flugzeug fliegt um 9 Uhr. Die Reise ist kurz.', en: 'Yes. The plane leaves at 9 o’clock. The journey is short.' },
          { speaker: 'Ana', de: 'Wann fährt der Bus ab? Wann kommt er an?', en: 'When does the bus depart? When does it arrive?' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie, was man hier nicht machen darf.',
        promptEn: 'Say what one may not do here.',
        model: 'Hier darf man nicht fahren.',
        accepted: ['Hier darf', 'Man darf', 'Hier muss'],
      },
      notice: {
        title: 'Modalverben: können, müssen, dürfen, wollen, sollen',
        bodyDe: 'Das Modalverb steht auf Position 2, das zweite Verb im Infinitiv ganz am Ende: Hier **dürfen** Sie nicht **fahren**. dürfen heißt Erlaubnis, **müssen** Notwendigkeit, wollen Absicht, sollen Auftrag, können Fähigkeit. In der ich-Form und in der er-Form fehlt die Endung: ich **will**, ich **muss**, sie **darf**.',
        examples: ['Guten Tag. Hier dürfen Sie nicht mit dem Fahrrad fahren.', 'Am Platz. Den Müll müssen Sie nach Hause nehmen.'],
        ruleSlug: 'modal-verbs-intro',
      },
      phonetik: { focus: 'Kurze Vokale in kann, muss, darf', items: ['ich KANN', 'ich MUSS', 'ich DARF'] },
      hoeren: { kind: 'dictation', lines: [1, 7] },
      sprechen: {
        // [5] und [6] statt [2] und [6]: die alte Zeile [2] trug „Am Platz“ und [6] „mit dem Koffer“ —
        // Dativpräpositionen zwei Lektionen vor ihrer Regel, in einer Nachsprechzeile.
        readAloud: [5, 6],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen Sie nach den Regeln im Haus: Was ist erlaubt, was nicht?',
          hintWords: ['dürfen', 'müssen', 'der Müll'],
          // Sie — der Gegenüber ist der Hausmeister (Mission 7, „strict but kind caretaker“).
          anrede: 'Sie',
          missionOrder: 7,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a12-l09',
        taskDe: 'Ana Chakiri fliegt am 14. Juli nach Marokko. Sie wohnt in Bremen und fährt mit dem Taxi zum Flughafen. Füllen Sie die Anmeldung für die Reise aus.',
        fields: ['Familienname', 'Vorname', 'Datum', 'Land', 'Unterschrift'],
        minWords: 5,
        maxWords: 40,
        sample: 'Familienname: Chakiri / Vorname: Ana / Datum: 14. Juli / Land: Marokko / Unterschrift: A. Chakiri',
      },
      links: { listeningExercise: null, readingOrder: 7 },
      practiceRule: { topics: ['modal-verbs-intro'], typedMin: 4 },
    },
    {
      nr: 10,
      id: 'a1.2-l10',
      slug: 'kleidung-kaufen',
      title: 'Kleidung kaufen',
      situation: 'Kleidung kaufen und Vergleiche ziehen',
      handlungsfeld: 'Einkaufen: Kleidung auswählen und vergleichen',
      canDo: [
        'Ich kann sagen, für wen ich etwas kaufe.',
        'Ich kann nach der Größe fragen.',
        'Ich kann sagen, welche Jacke mir passt.',
        'Ich kann zwei Sachen vergleichen: billiger oder teurer.',
      ],
      examTeile: ['Hören Teil 1', 'Sprechen Teil 2', 'Schreiben Teil 2'],
      grammarSlugs: ['prepositions-accusative', 'accusative-intro'],
      primarySlug: 'prepositions-accusative',
      minutes: 15,
      wortfeld: [
        { de: 'die Hose', word: 'Hose', article: 'die', plural: 'Hosen', en: 'trousers', wordId: '636e69c5-0948-43a5-8602-8e2a0eda9ae1' },
        { de: 'das Hemd', word: 'Hemd', article: 'das', plural: 'Hemden', en: 'shirt', wordId: '84f8218f-6655-4f36-8f8b-12010d211318' },
        { de: 'die Jacke', word: 'Jacke', article: 'die', plural: 'Jacken', en: 'jacket', wordId: 'cdc34efe-228a-4f92-860a-41e0a1805a9b' },
        { de: 'der Mantel', word: 'Mantel', article: 'der', plural: 'Mäntel', en: 'coat', wordId: '4b602571-d3b7-477e-8598-8cd1c4290684' },
        { de: 'der Schuh', word: 'Schuh', article: 'der', plural: 'Schuhe', en: 'shoe', wordId: '5af4dd5a-7956-4dac-96e1-77b10efd976e' },
        { de: 'die Socke', word: 'Socke', article: 'die', plural: 'Socken', en: 'sock', wordId: '718a698f-879c-4e5b-973e-04338846c883' },
        { de: 'der Pullover', word: 'Pullover', article: 'der', plural: 'Pullover', en: 'pullover', wordId: '79225b71-9462-4839-9f6a-de9d7c8b5026' },
        { de: 'das Kleid', word: 'Kleid', article: 'das', plural: 'Kleider', en: 'dress', wordId: 'f4bd3e60-96a3-4f29-9bf9-a3fe581f3fb9' },
        { de: 'der Rock', word: 'Rock', article: 'der', plural: 'Röcke', en: 'skirt', wordId: '15695b2f-0465-4e9d-b07d-127b67ef94cd' },
        { de: 'die Mütze', word: 'Mütze', article: 'die', plural: 'Mützen', en: 'cap', wordId: '8af6ff9b-ba55-448d-9bc6-01dbd255aad4' },
        { de: 'der Schal', word: 'Schal', article: 'der', plural: 'Schals', en: 'scarf', wordId: '8bdc3b8e-d118-4f49-a22b-e4c13cf93128' },
        { de: 'die Größe', word: 'Größe', article: 'die', plural: 'Größen', en: 'size', wordId: 'e7bb95a2-51f8-4603-8c63-9f5adae6584b' },
        { de: 'tragen', word: 'tragen', article: null, plural: null, en: 'to wear (er trägt)', wordId: '753a4cc5-087a-424f-8b35-c7eedff05a4d' },
        { de: 'anziehen', word: 'anziehen', article: null, plural: null, en: 'to put on', wordId: 'c5a3a2ce-5066-4e81-9ec0-e62a4b3020d6' },
        { de: 'passen', word: 'passen', article: null, plural: null, en: 'to fit', wordId: '28162199-b453-48cb-9b78-455fdfd9ec39' },
        { de: 'billig', word: 'billig', article: null, plural: null, en: 'cheap', wordId: '1f291da6-52ee-438c-9e70-9e9e212a301a' },
      ],
      dialog: {
        title: 'Im Kaufhaus',
        setting: 'Ana und Lena kaufen Kleidung im Kaufhaus.',
        lines: [
          { speaker: 'Lena', de: 'Ana, die Jacke ist für dich zu groß.', en: 'Ana, the jacket is too big for you.' },
          { speaker: 'Ana', de: 'Ja. Welche Größe hat der Mantel für meinen Bruder?', en: 'Yes. What size is the coat for my brother?' },
          { speaker: 'Lena', de: 'Größe 50. Ohne den Schal ist er billig.', en: 'Size 50. Without the scarf it is cheap.' },
          { speaker: 'Ana', de: 'Ich trage gern eine Hose, ein Hemd und ein Kleid.', en: 'I like wearing trousers, a shirt and a dress.' },
          { speaker: 'Lena', de: 'Und der Rock? Der Pullover passt gut zu dir.', en: 'And the skirt? The pullover suits you.' },
          { speaker: 'Ana', de: 'Den Pullover ziehe ich morgen an.', en: 'I will put the pullover on tomorrow.' },
          { speaker: 'Lena', de: 'Und die Schuhe? Ohne Socken gehe ich nicht.', en: 'And the shoes? I do not go without socks.' },
          { speaker: 'Ana', de: 'Ich kaufe die Mütze für meine Oma.', en: 'I am buying the cap for my grandma.' },
          { speaker: 'Lena', de: 'Die Mütze ist billiger als der Schal.', en: 'The cap is cheaper than the scarf.' },
          { speaker: 'Ana', de: 'Gut. Ich gehe durch das Kaufhaus und bezahle.', en: 'Good. I will walk through the store and pay.' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie, für wen Sie etwas kaufen.',
        promptEn: 'Say who you are buying something for.',
        model: 'Ich kaufe eine Mütze für meine Oma.',
        accepted: ['Ich kaufe', 'Für', 'Ich brauche'],
      },
      notice: {
        title: 'Präpositionen mit Akkusativ',
        bodyDe: 'Nach **für**, **ohne** und **durch** steht immer der Akkusativ: **für den** Bruder, **ohne den** Schal, **durch das** Kaufhaus. Nur der Maskulinum ändert die Form; feminin, neutrum und Plural bleiben gleich: für **die** Oma, für **das** Kind. Beim Vergleich hilft **als**: Die Mütze ist **billiger als** der Schal.',
        examples: ['Die Mütze ist billiger als der Schal.', 'Ich kaufe die Mütze für meine Oma.'],
        ruleSlug: 'prepositions-accusative',
      },
      phonetik: { focus: 'Die Endung -er im Vergleich', items: ['BIL-lig', 'BIL-li-ger', 'GRÖ-ßer'] },
      hoeren: { kind: 'dictation', lines: [2, 6] },
      sprechen: {
        readAloud: [0, 8],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie im Geschäft: Für wen? Welche Größe? Ohne was?',
          hintWords: ['die Jacke', 'die Größe', 'passen'],
          // Sie — der Gegenüber ist Verkaufspersonal (Mission 8, „quick café barista“).
          anrede: 'Sie',
          // Mission 8 trägt „accusative prepositions für, ohne, um“ — buchstäblich die Regelkarte
          // dieser Lektion. Sie lag ungenutzt, während diese Lektion keine Mission hatte.
          missionOrder: 8,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a12-l10',
        taskDe: 'Sie kaufen Kleidung für eine Freundin. Schreiben Sie ihr eine kurze Nachricht. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Was Sie kaufen', 'Welche Größe die Jacke hat', 'Wann Sie die Sachen bringen'],
        minWords: 25,
        maxWords: 45,
        sample: 'Hallo Lena, ich kaufe eine Jacke für dich. Die Größe ist 38. Der Pullover ist billiger. Ich bringe alles am Montag. Viele Grüße, Ana',
      },
      links: { listeningExercise: 1, readingOrder: 3 },
      practiceRule: { topics: ['prepositions-accusative', 'accusative-intro'], typedMin: 3 },
    },
    {
      nr: 11,
      id: 'a1.2-l11',
      slug: 'wie-ist-das-wetter',
      title: 'Wie ist das Wetter?',
      situation: 'Wetter und Jahreszeiten',
      handlungsfeld: 'Alltag: über das Wetter sprechen',
      canDo: [
        'Ich kann sagen, wie das Wetter heute ist.',
        'Ich kann die Temperatur in Grad nennen.',
        'Ich kann sagen, wie das Wetter im Sommer und im Winter ist.',
        'Ich kann sagen, seit wann es regnet.',
      ],
      examTeile: ['Hören Teil 3', 'Sprechen Teil 2', 'Schreiben Teil 1'],
      grammarSlugs: ['dative-prepositions-intro', 'basic-sentence-structure'],
      primarySlug: 'dative-prepositions-intro',
      minutes: 15,
      wortfeld: [
        { de: 'das Wetter', word: 'Wetter', article: 'das', plural: '—', en: 'weather', wordId: 'a0851ddb-2700-4c1b-8832-43509cf4e6cf' },
        { de: 'der Regen', word: 'Regen', article: 'der', plural: '—', en: 'rain', wordId: '6eae65fa-5294-4088-98fd-4a018b47a735' },
        { de: 'regnen', word: 'regnen', article: null, plural: null, en: 'to rain', wordId: 'a089c0f1-4e30-43bd-b431-42a362604ccd' },
        { de: 'der Schnee', word: 'Schnee', article: 'der', plural: '—', en: 'snow', wordId: 'e36f1a51-1c06-440b-8cc7-a5d98834dd0f' },
        { de: 'schneien', word: 'schneien', article: null, plural: null, en: 'to snow', wordId: 'dd1fa1ef-9d1f-4739-8f18-908e3c1e180a' },
        { de: 'die Sonne', word: 'Sonne', article: 'die', plural: '—', en: 'sun', wordId: '20981a4e-fbac-4dd7-af79-39ab73d40e2b' },
        { de: 'sonnig', word: 'sonnig', article: null, plural: null, en: 'sunny', wordId: 'bb575dc6-c790-48f2-8c49-58cb073a21dc' },
        { de: 'die Wolke', word: 'Wolke', article: 'die', plural: 'Wolken', en: 'cloud', wordId: '6e580815-beb6-418e-a0f4-cb2039c14941' },
        { de: 'wolkig', word: 'wolkig', article: null, plural: null, en: 'cloudy', wordId: '576ed14b-6df3-4fac-b5cd-e9002691d01c' },
        { de: 'der Wind', word: 'Wind', article: 'der', plural: '—', en: 'wind', wordId: '6b40474c-7baf-41c9-a303-c92925fe6a9e' },
        { de: 'windig', word: 'windig', article: null, plural: null, en: 'windy', wordId: '3672ec34-1f26-4ff5-b22e-7e9ae67fcfb7' },
        { de: 'das Gewitter', word: 'Gewitter', article: 'das', plural: 'Gewitter', en: 'thunderstorm', wordId: 'f5721c99-1ca7-4e74-971c-df81a4acf224' },
        { de: 'der Grad', word: 'Grad', article: 'der', plural: 'Grad', en: 'degree', wordId: '74dcdbbc-5f88-45dc-b2bc-826b3a214ea8' },
        { de: 'die Temperatur', word: 'Temperatur', article: 'die', plural: 'Temperaturen', en: 'temperature', wordId: 'b51d1900-e5c9-4aca-9fea-c97e9b36f9f2' },
        { de: 'der Sommer', word: 'Sommer', article: 'der', plural: 'Sommer', en: 'summer', wordId: '0492dd0c-3134-4adb-aa54-0d62babf5fd4' },
        { de: 'der Winter', word: 'Winter', article: 'der', plural: 'Winter', en: 'winter', wordId: '035a2260-b7ee-4c97-8fa5-19c3fa33815f' },
        { de: 'die Jahreszeit', word: 'Jahreszeit', article: 'die', plural: 'Jahreszeiten', en: 'season', wordId: '5ffa8aa3-7dce-48df-b325-54320b8901ff' },
        { de: 'kalt', word: 'kalt', article: null, plural: null, en: 'cold', wordId: 'ea1aa9b9-fc98-4a69-ba58-2ee5d362a77c' },
        { de: 'warm', word: 'warm', article: null, plural: null, en: 'warm', wordId: '0f405621-8137-4e2c-a69b-205f0b41cf0a' },
      ],
      dialog: {
        title: 'Seit einer Woche regnet es',
        // Tim und Lena teilen sich in Lektion 8 eine WG — „bei dir“ und „bei uns“ setzen aber zwei
      // Wohnorte voraus. Ana wohnt nicht bei ihnen und kommt aus Marokko: derselbe Dativ, ohne Umzug.
      setting: 'Tim fragt Ana nach dem Wetter in Marokko.',
        lines: [
          { speaker: 'Tim', de: 'Wie ist das Wetter im Sommer bei dir?', en: 'What is the weather like in summer where you are?' },
          { speaker: 'Ana', de: 'Im Sommer ist es sonnig, bei dreißig Grad.', en: 'In summer it is sunny, around thirty degrees.' },
          { speaker: 'Tim', de: 'Und im Winter? Bei uns schneit es oft.', en: 'And in winter? Where we live it often snows.' },
          { speaker: 'Ana', de: 'Bei uns kommt der Schnee nie.', en: 'Where we live the snow never comes.' },
          { speaker: 'Tim', de: 'Seit einer Woche regnet es. Es ist wolkig.', en: 'It has been raining for a week. It is cloudy.' },
          { speaker: 'Ana', de: 'Die Wolke ist da und der Wind ist kalt.', en: 'The cloud is there and the wind is cold.' },
          { speaker: 'Tim', de: 'Heute ist es windig. Am Abend kommt ein Gewitter.', en: 'Today it is windy. In the evening a thunderstorm is coming.' },
          { speaker: 'Ana', de: 'Die Temperatur ist bei zehn Grad. Zum Bahnhof gehe ich nicht.', en: 'The temperature is around ten degrees. I am not walking to the station.' },
          { speaker: 'Tim', de: 'Welche Jahreszeit ist bei dir schön?', en: 'Which season is nice where you are?' },
          { speaker: 'Ana', de: 'Der Sommer. Nach dem Regen gehe ich zur Brücke.', en: 'Summer. After the rain I walk to the bridge.' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie, wie das Wetter heute ist.',
        promptEn: 'Say what the weather is like today.',
        model: 'Heute ist es sonnig.',
        accepted: ['Heute ist', 'Es ist', 'Das Wetter ist'],
      },
      notice: {
        title: 'Präpositionen mit Dativ',
        bodyDe: 'Nach mit, nach, bei, seit, von, zu und aus steht der Dativ: **nach dem** Regen, **bei** zehn Grad, **seit einer** Woche. Oft verschmelzen Präposition und Artikel: in dem wird **im** Sommer, an dem wird **am** Abend, zu der wird **zur** Brücke, zu dem wird **zum** Bahnhof — die drei Wendungen aus Lektion 1 bekommen hier ihre Regel.',
        examples: ['Seit einer Woche regnet es. Es ist wolkig.', 'Der Sommer. Nach dem Regen gehe ich zur Brücke.'],
        ruleSlug: 'dative-prepositions-intro',
      },
      // „Sonne“ [ˈzɔnə] hat ein KURZES, offenes o — der Kontrast heißt langes e gegen kurzes o.
      phonetik: { focus: 'Langes e, kurzes o: Schnee – Sonne', items: ['der SCHNEE', 'die SON-ne', 'das GE-wit-ter'] },
      hoeren: { kind: 'dictation', lines: [1, 4] },
      sprechen: {
        readAloud: [0, 9],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Wetter: Sommer? Winter? Temperatur?',
          hintWords: ['das Wetter', 'sonnig', 'die Temperatur'],
          // Sie — Teil 2 spielt mit einem Prüfungspartner.
          anrede: 'Sie',
          // Der ehrliche Rest: keine der zwölf A1.2-Missionen handelt vom Wetter. Ein Etikett ohne
          // Mission wäre schlechter als die Lücke — RULE 13 steht deshalb auf 1, nicht auf 0.
          missionOrder: null,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a12-l11',
        // KEIN Formular fragt „Wetter“ und „Temperatur“ ab — die beiden Felder standen dort, weil
        // das Wortfeld sie liefert. Das Wetter gehört in sprechen.open, wo es schon steht.
        taskDe: 'Lena Berg meldet sich für den Ausflug am Sonntag an. Sie wohnt in Köln und fährt mit dem Bus. Füllen Sie die Anmeldung für den Ausflug aus.',
        fields: ['Familienname', 'Vorname', 'Stadt', 'Verkehrsmittel', 'Unterschrift'],
        minWords: 5,
        maxWords: 40,
        sample: 'Familienname: Berg / Vorname: Lena / Stadt: Köln / Verkehrsmittel: Bus / Unterschrift: L. Berg',
      },
      links: { listeningExercise: 6, readingOrder: null },
      practiceRule: { topics: ['dative-prepositions-intro'], typedMin: 4 },
    },
    {
      nr: 12,
      id: 'a1.2-l12',
      slug: 'das-fest-war-schoen',
      title: 'Das Fest war schön',
      situation: 'Feste und Feiern: über das Fest von gestern sprechen',
      handlungsfeld: 'Freizeit und soziale Kontakte: von einem Fest erzählen',
      canDo: [
        'Ich kann mit dem Perfekt sagen, was ich gemacht habe.',
        'Ich kann sagen, was ich auf dem Fest gegessen habe.',
        'Ich kann Lebensmittel für ein Fest nennen.',
        'Ich kann sagen, ob etwas lecker war.',
      ],
      examTeile: ['Lesen Teil 1', 'Sprechen Teil 2', 'Schreiben Teil 2'],
      grammarSlugs: ['perfekt-intro', 'accusative-intro', 'basic-sentence-structure'],
      primarySlug: 'perfekt-intro',
      minutes: 15,
      wortfeld: [
        { de: 'das Getränk', word: 'Getränk', article: 'das', plural: 'Getränke', en: 'drink, beverage', wordId: '989548a3-32aa-4a2f-8da0-e866461d9403' },
        { de: 'der Saft', word: 'Saft', article: 'der', plural: 'Säfte', en: 'juice', wordId: '521b5ca3-895c-4ebb-8c44-68d377ee6869' },
        { de: 'die Milch', word: 'Milch', article: 'die', plural: '—', en: 'milk', wordId: 'e375caea-4bd4-46f9-95b5-dd52bc001a18' },
        { de: 'der Käse', word: 'Käse', article: 'der', plural: 'Käse', en: 'cheese', wordId: 'dc6aabfa-77d5-4d70-a56b-0035ccda6d8d' },
        { de: 'die Wurst', word: 'Wurst', article: 'die', plural: 'Würste', en: 'sausage', wordId: '5f23590d-738b-47a6-a09a-9d23bbb54ba1' },
        { de: 'das Fleisch', word: 'Fleisch', article: 'das', plural: '—', en: 'meat', wordId: '926c21fe-7efe-4643-bc04-f9971202b5bd' },
        { de: 'der Fisch', word: 'Fisch', article: 'der', plural: 'Fische', en: 'fish', wordId: 'c354428f-316c-4038-990d-8c817c18b125' },
        { de: 'das Ei', word: 'Ei', article: 'das', plural: 'Eier', en: 'egg', wordId: 'f6988f4f-ab42-422e-b658-41bf38ebbf84' },
        { de: 'das Gemüse', word: 'Gemüse', article: 'das', plural: '—', en: 'vegetables', wordId: 'd98a2b8c-d860-45d6-9f48-96754c44a124' },
        { de: 'das Obst', word: 'Obst', article: 'das', plural: '—', en: 'fruit', wordId: '5daed8d9-a6ba-4be5-90e7-6da8ffa2c0d0' },
        { de: 'die Kartoffel', word: 'Kartoffel', article: 'die', plural: 'Kartoffeln', en: 'potato', wordId: '9ccb38ce-b999-438b-a782-fe7dfa69645b' },
        { de: 'die Nudel', word: 'Nudel', article: 'die', plural: 'Nudeln', en: 'noodle, pasta', wordId: 'c62272dd-a182-432d-adb0-da9e5579bff7' },
        { de: 'der Reis', word: 'Reis', article: 'der', plural: '—', en: 'rice', wordId: 'b09e72f3-0f09-4ef4-ba0c-72949f852061' },
        { de: 'die Schokolade', word: 'Schokolade', article: 'die', plural: '—', en: 'chocolate', wordId: '9de2f04c-1958-45a5-9915-8fc00038f3eb' },
        { de: 'der Zucker', word: 'Zucker', article: 'der', plural: '—', en: 'sugar', wordId: 'e14cd229-6a6c-4b37-ac46-7af3cc053272' },
        { de: 'lecker', word: 'lecker', article: null, plural: null, en: 'tasty, delicious', wordId: '668ae9e2-9e26-4181-a520-98a002ef2557' },
      ],
      dialog: {
        title: 'Der Tag nach dem Fest',
        setting: 'Ana und Lena sprechen über das Fest von gestern.',
        lines: [
          { speaker: 'Lena', de: 'Ana, wir haben gestern schön gefeiert!', en: 'Ana, we celebrated nicely yesterday!' },
          { speaker: 'Ana', de: 'Ja! Ich habe Kuchen und Schokolade gegessen.', en: 'Yes! I ate cake and chocolate.' },
          { speaker: 'Lena', de: 'Und das Getränk? Hast du den Saft getrunken?', en: 'And the drink? Did you drink the juice?' },
          { speaker: 'Ana', de: 'Nein, ich habe Milch getrunken. Der Käse war lecker.', en: 'No, I drank milk. The cheese was delicious.' },
          { speaker: 'Lena', de: 'Die Wurst und das Fleisch haben wir gekauft.', en: 'We bought the sausage and the meat.' },
          { speaker: 'Ana', de: 'Und den Fisch? Tim hat ihn gekocht.', en: 'And the fish? Tim cooked it.' },
          { speaker: 'Lena', de: 'Das Ei und das Gemüse hat meine Oma gemacht.', en: 'My grandma made the egg and the vegetables.' },
          { speaker: 'Ana', de: 'Das Obst und die Kartoffeln habe ich gekauft.', en: 'I bought the fruit and the potatoes.' },
          { speaker: 'Lena', de: 'Die Nudeln und den Reis hat Tim gekocht.', en: 'Tim cooked the noodles and the rice.' },
          { speaker: 'Ana', de: 'Im Kuchen war zu viel Zucker. Aber es war schön!', en: 'There was too much sugar in the cake. But it was lovely!' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie, was Sie gestern gegessen haben.',
        promptEn: 'Say what you ate yesterday.',
        model: 'Ich habe Käse gegessen.',
        accepted: ['Ich habe', 'Gestern habe ich'],
      },
      notice: {
        title: 'Das Perfekt: haben und Partizip II',
        bodyDe: 'Über Vergangenes spricht man im Perfekt: **haben** steht auf Position 2, das Partizip II ganz am Ende. Regelmäßig entsteht es mit **ge- …-t**: feiern → **gefeiert**, kaufen → **gekauft**, kochen → **gekocht**. Unregelmäßig endet es auf **-en**: essen → **gegessen**, trinken → **getrunken**. **war** ist die einzige einfache Vergangenheitsform in diesem Kurs.',
        examples: ['Ana, wir haben gestern schön gefeiert!', 'Nein, ich habe Milch getrunken. Der Käse war lecker.'],
        ruleSlug: 'perfekt-intro',
      },
      phonetik: { focus: 'Die Vorsilbe ge- ist unbetont', items: ['ge-FEI-ert', 'ge-GES-sen', 'ge-KAUFT'] },
      hoeren: { kind: 'dictation', lines: [1, 4] },
      sprechen: {
        readAloud: [0, 8],
        open: {
          // Mission 6 hing hier und kehrte die Rollen um: die Lektion sagte „einladen“, der Coach
          // ließ absagen. Mission 10 ist die Wortkarten-Aufgabe zum Thema Essen & Trinken — das
          // Thema dieser Lektion — und Mission 6 (Verneinung) ist jetzt bei L4.
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie mit einer Wortkarte zum Thema Essen und Trinken.',
          hintWords: ['das Fest', 'lecker', 'gefeiert'],
          // Sie — Teil 2 spielt mit einem Prüfungspartner.
          anrede: 'Sie',
          missionOrder: 10,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a12-l12',
        taskDe: 'Sie haben ein Fest gefeiert. Schreiben Sie einer Freundin eine kurze Nachricht über das Fest. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Wann Sie gefeiert haben', 'Was Sie gegessen und getrunken haben', 'Wen Sie eingeladen haben'],
        minWords: 25,
        maxWords: 45,
        sample: 'Hallo Lena, ich habe am Samstag gefeiert. Wir haben Fisch und Kartoffeln gegessen. Meine Oma hat auch getanzt. Viele Grüße, Ana',
      },
      links: { listeningExercise: null, readingOrder: 2 },
      practiceRule: { topics: ['perfekt-intro', 'accusative-intro'], typedMin: 4 },
    },
  ],
  checkpoints: [
    { nr: 1, id: 'a1.2-cp1', afterLektion: 3, title: 'Checkpoint 1: Lektion 1–3' },
    { nr: 2, id: 'a1.2-cp2', afterLektion: 6, title: 'Checkpoint 2: Lektion 4–6' },
    { nr: 3, id: 'a1.2-cp3', afterLektion: 9, title: 'Checkpoint 3: Lektion 7–9' },
    { nr: 4, id: 'a1.2-cp4', afterLektion: 12, title: 'Checkpoint 4: Lektion 10–12' },
  ],
};
