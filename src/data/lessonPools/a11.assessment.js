// Reserved tasks of the A1.1 checkpoints, written 2026-11-25: four papers per checkpoint, each with six
// Sprachbausteine and two sentences to build. No practice, retry or remediation draw may serve them, so a
// checkpoint asks the rule and not a task the learner has met, and a retake repeats none (the papers drawn
// from the practice pool before repeated up to eight of twenty). Same mechanism as a12.assessment.js.
// In checkpoints 2–4 the fifth and sixth Baustein come from an earlier chapter.
//   gap(Lektion, sentence, answer, rule)          one word; what stands in brackets is the task
//   build(Lektion, bricks, answer, opening, rule) a statement or W-question; the opening is never the tested form
//   ask(Lektion, bricks, answer, rule)            a yes/no question: the verb comes first, so no opening is given
import { CURRICULUM_A11 } from '../curricula/a11.js';

const RULES = {
  heissen: ['heißen: ich heiße, du heißt, er/sie heißt, wir heißen, ihr heißt, sie/Sie heißen.', 'heißen: ich heiße, du heißt, er/sie heißt, wir heißen, ihr heißt, sie/Sie heißen.'],
  buchstabieren: ['man buchstabiert, ich buchstabiere, wir buchstabieren: Die Endung passt zur Person.', 'man buchstabiert, ich buchstabiere, wir buchstabieren: the ending goes with the person.'],
  geht: ['„Wie geht es …?“ fragt man mit „geht es“: Wie geht es dir? Wie geht es Ihnen?', '“Wie geht es …?” always has “geht es”: Wie geht es dir? Wie geht es Ihnen?'],
  anrede: ['Zu „du“ gehört „dir“, zu „Sie“ gehört „Ihnen“ mit großem I.', '“du” goes with “dir”, “Sie” goes with “Ihnen” with a capital I.'],
  buchstabe: ['Die Namen der Buchstaben: V heißt Vau, W heißt We, J heißt Jot, Y heißt Ypsilon.', 'The names of the letters: V is Vau, W is We, J is Jot, Y is Ypsilon.'],
  sein: ['sein: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind.', 'sein: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind.'],
  kommen: ['kommen: ich komme, du kommst, er/sie kommt, wir kommen, ihr kommt, sie/Sie kommen.', 'kommen: ich komme, du kommst, er/sie kommt, wir kommen, ihr kommt, sie/Sie kommen.'],
  wohnen: ['wohnen: ich wohne, du wohnst, er/sie wohnt, wir wohnen, ihr wohnt, sie/Sie wohnen.', 'wohnen: ich wohne, du wohnst, er/sie wohnt, wir wohnen, ihr wohnt, sie/Sie wohnen.'],
  zahl: ['Eine Zahl ist ein Wort. Ab einundzwanzig kommt zuerst die kleine Zahl: 36 ist sechsunddreißig.', 'A number is one word. From 21 on the small number comes first: 36 is sechsunddreißig.'],
  wer: ['er ist maskulin, sie ist feminin, es ist neutral; Plural: sie. Zu du und du gehört ihr, zu ich und du gehört wir.', 'er is masculine, sie feminine, es neuter; plural: sie. Several people you call du are ihr; you and others are wir.'],
  hoeflich: ['Zu Herr und Frau gehört das höfliche Sie mit großem S.', 'With Herr and Frau you use the polite Sie with a capital S.'],
  hoeflichIhr: ['Zum höflichen Sie gehört Ihr mit großem I.', 'The polite Sie goes with Ihr with a capital I.'],
  sprechen: ['sprechen: ich spreche, du sprichst, er/sie spricht, wir sprechen, ihr sprecht, sie/Sie sprechen.', 'sprechen: ich spreche, du sprichst, er/sie spricht, wir sprechen, ihr sprecht, sie/Sie sprechen.'],
  genus: ['Jedes Nomen hat ein Genus: Lernen Sie es mit der, die oder das.', 'Every noun has a gender: learn it with der, die or das.'],
  ding: ['Für der-Wörter sagt man er, für die-Wörter sie, für das-Wörter es, auch bei Sachen.', 'A der-word is er, a die-word sie, a das-word es, for things too.'],
  den: ['Nach kaufen und verkaufen wird maskulin der zu den: Ich kaufe den Stuhl.', 'After kaufen and verkaufen masculine der becomes den: Ich kaufe den Stuhl.'],
  kosten: ['Eine Sache kostet, mehrere Sachen kosten.', 'One thing kostet, several things kosten.'],
  plural: ['Im Plural haben alle Nomen die.', 'In the plural all nouns have die.'],
  bestimmt: ['Der bestimmte Artikel ist der (maskulin), die (feminin) oder das (neutral).', 'The definite article is der (masculine), die (feminine) or das (neuter).'],
  ein: ['ein steht vor der- und das-Wörtern, eine vor die-Wörtern.', 'ein stands before der- and das-words, eine before die-words.'],
  einen: ['Nach Verben wie brauchen, haben, kaufen wird maskulin ein zu einen: Ich brauche einen Computer.', 'After verbs like brauchen, haben, kaufen, masculine ein becomes einen: Ich brauche einen Computer.'],
  kein: ['kein verneint ein Nomen: Wir haben kein Handy.', 'kein makes a noun negative: Wir haben kein Handy.'],
  brauchen: ['brauchen: ich brauche, du brauchst, er/sie braucht, wir brauchen, ihr braucht, sie/Sie brauchen.', 'brauchen: ich brauche, du brauchst, er/sie braucht, wir brauchen, ihr braucht, sie/Sie brauchen.'],
  praesens: ['Die Endungen: ich -e, du -st, er/sie -t, wir -en, ihr -t, sie/Sie -en.', 'The endings: ich -e, du -st, er/sie -t, wir -en, ihr -t, sie/Sie -en.'],
  arbeiten: ['Ein Stamm auf -t bekommt ein e dazu: du arbeitest, er arbeitet.', 'A stem in -t takes an extra e: du arbeitest, er arbeitet.'],
  zeit: ['um steht vor der Uhrzeit, am vor dem Wochentag.', 'um stands before the time, am before the day.'],
  uhr: ['halb acht ist 7.30 Uhr; Viertel nach acht ist 8.15 Uhr; Viertel vor acht ist 7.45 Uhr.', 'halb acht is 7:30; Viertel nach acht is 8:15; Viertel vor acht is 7:45.'],
  woche: ['Die Woche: Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag.', 'The week: Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag.'],
  haben: ['haben: ich habe, du hast, er/sie hat, wir haben, ihr habt, sie/Sie haben.', 'haben: ich habe, du hast, er/sie hat, wir haben, ihr habt, sie/Sie haben.'],
  moechte: ['„Ich möchte …“ ist ein fester Ausdruck: So bestellt man höflich.', '“Ich möchte …” is a fixed phrase: you order politely with it.'],
  frage: ['In der Ja/Nein-Frage steht das Verb vorn: Fährt der Zug?', 'In a yes/no question the verb comes first: Fährt der Zug?'],
  fahren: ['fahren wechselt den Vokal: du fährst, er fährt.', 'fahren changes its vowel: du fährst, er fährt.'],
  trennbar: ['Bei trennbaren Verben steht die Vorsilbe am Ende: Ich stehe um sieben auf.', 'A separable verb puts its prefix at the end: Ich stehe um sieben auf.'],
  schlafen: ['schlafen wechselt den Vokal: du schläfst, er schläft.', 'schlafen changes its vowel: du schläfst, er schläft.'],
  mein: ['ich – mein, du – dein, er – sein, sie – ihr, wir – unser, ihr – euer, Sie – Ihr; vor die-Wörtern und im Plural mit -e.', 'ich – mein, du – dein, er – sein, sie – ihr, wir – unser, ihr – euer, Sie – Ihr; with -e before die-words and in the plural.'],
  zwei: ['Im Satz steht das Verb auf Platz zwei.', 'In a sentence the verb stands in second place.'],
  wfrage: ['In einer Frage mit Fragewort steht zuerst das Fragewort, dann das Verb.', 'In a question with a question word, the question word comes first, then the verb.'],
};

const taskEn = (cue) => {
  if (!cue) return 'Fill the gap with one word.';
  if (/^\d+$/.test(cue)) return 'Write the number as a word, in German.';
  if (cue === 'der, die oder das?') return 'Fill the gap with der, die or das.';
  if (cue === 'den, die oder das?') return 'Fill the gap with den, die or das.';
  if (/oder (?:es|sie|um)\?$/.test(cue)) return `Fill the gap with ${cue.replace(' oder ', ' or ').replace('?', '')}.`;
  if (cue === 'bestimmter Artikel') return 'Fill the gap with the definite article.';
  if (cue === 'unbestimmter Artikel') return 'Fill the gap with the indefinite article.';
  if (cue === 'Verneinung') return 'Make the sentence negative: fill the gap with one word.';
  if (/^\d\d?\.\d\d$/.test(cue)) return 'Say this time: fill the gap with one word.';
  if (/^(?:ich|du|er|sie|wir|ihr|Sie)(?:, |$)/.test(cue)) return `Fill the gap with the word that goes with “${cue}”.`;
  return `Fill the gap with the right form of “${cue}”.`;
};
// The instruction would print the answer where the answer is „Sie“; the gap alone asks for it.
const gap = (nr, sentence, answer, rule) => {
  const cue = sentence.match(/\(([^()]*)\)/)?.[1] || '';
  return {
    nr, type: 'fill_blank', answer, rule,
    questionDe: `${answer === 'Sie' ? '' : 'Ergänzen Sie mit einem Wort: '}${sentence.replace(/\((\d+)\)/, '($1; Schreiben Sie die Zahl in Worten)')}`,
    questionEn: taskEn(cue),
  };
};
const build = (nr, bricks, answer, opening, rule) => ({
  nr, type: 'sentence_building', answer, rule,
  questionDe: `Bilden Sie ${answer.endsWith('?') ? 'die Frage' : 'den Satz'} (Beginnen Sie mit „${opening}“): [${bricks}]`,
  // (The opening is added to the English from the German cue: `taskConstraintsEn`.)
  questionEn: `Build the ${answer.endsWith('?') ? 'question' : 'sentence'}.`,
});
const ask = (nr, bricks, answer, rule) => ({
  nr, type: 'sentence_building', answer, rule,
  questionDe: `Schreiben Sie die Frage (das Verb steht vorn): [${bricks}]`,
  questionEn: 'Write the yes/no question: the verb comes first.',
});

const PAPERS = [
  // ── Checkpoint 1: Lektion 1–3 ──
  [
    [
      gap(1, 'Wie ___ man Novak? (buchstabieren)', 'buchstabiert', 'buchstabieren'),
      gap(2, 'Mia und ich ___ ledig. (sein)', 'sind', 'sein'),
      gap(3, 'Das ist Herr Krüger. ___ ist Lehrer. (er, sie oder es?)', 'Er', 'wer'),
      gap(2, 'Hier wohnen ___ Familien. (7)', 'sieben', 'zahl'),
      gap(3, 'Du ___ gut Deutsch. (sprechen)', 'sprichst', 'sprechen'),
      gap(1, 'Hallo Ben, wie geht es ___? (du)', 'dir', 'anrede'),
      build(2, 'die Eltern / kommen / aus Italien', 'Die Eltern kommen aus Italien.', 'Die Eltern', 'kommen'),
      build(3, 'ihr / sprechen / gut Arabisch', 'Ihr sprecht gut Arabisch.', 'Ihr', 'sprechen'),
    ],
    [
      gap(1, 'Frau Becker, wie ___ Sie mit Vornamen? (heißen)', 'heißen', 'heissen'),
      gap(2, 'Wo ___ du, Ben? (wohnen)', 'wohnst', 'wohnen'),
      gap(3, 'Das Kind ist acht. ___ wohnt in Köln. (er, sie oder es?)', 'Es', 'wer'),
      gap(2, 'Ihr ___ noch jung. (sein)', 'seid', 'sein'),
      gap(3, 'Mia und Jonas, sprecht ___ Deutsch?', 'ihr', 'wer'),
      gap(1, 'Welcher Buchstabe heißt Vau? ___', 'V', 'buchstabe'),
      build(1, 'wie / buchstabieren / man / Seidel', 'Wie buchstabiert man Seidel?', 'Wie', 'buchstabieren'),
      build(3, 'der Sohn / sprechen / Arabisch', 'Der Sohn spricht Arabisch.', 'Der Sohn', 'sprechen'),
    ],
    [
      gap(1, 'Ich ___ Thomas Vogt. (heißen)', 'heiße', 'heissen'),
      gap(2, 'Frau Krause, ___ Sie verheiratet? (sein)', 'sind', 'sein'),
      gap(3, 'Das sind die Geschwister von Ali. ___ kommen morgen. (wir, ihr oder sie?)', 'Sie', 'wer'),
      gap(2, 'Die Tochter ist ___. (9)', 'neun', 'zahl'),
      gap(3, 'Ihr ___ auch Arabisch. (sprechen)', 'sprecht', 'sprechen'),
      gap(1, 'Guten Abend, Herr Vogt. Wie geht es ___? (Sie)', 'Ihnen', 'anrede'),
      build(2, 'der Vater / kommen / aus Spanien', 'Der Vater kommt aus Spanien.', 'Der Vater', 'kommen'),
      build(1, 'ich / buchstabieren / Lorenz', 'Ich buchstabiere Lorenz.', 'Ich', 'buchstabieren'),
    ],
    [
      gap(1, 'Und wie ___ es Frau Krause? (gehen)', 'geht', 'geht'),
      gap(2, 'Ben und Ali, ___ ihr Studenten? (sein)', 'seid', 'sein'),
      gap(3, 'Das ist die Schwester von Jonas. ___ wohnt auch hier. (er, sie oder es?)', 'Sie', 'wer'),
      gap(2, 'Ich ___ aus Spanien. (kommen)', 'komme', 'kommen'),
      gap(3, 'Ben und ich sind Brüder. ___ wohnen zusammen. (wir, ihr oder sie?)', 'Wir', 'wer'),
      gap(1, 'Welcher Buchstabe heißt Jot? ___', 'J', 'buchstabe'),
      build(2, 'wo / wohnen / die Kinder', 'Wo wohnen die Kinder?', 'Wo', 'wohnen'),
      build(3, 'die Kinder / sprechen / drei Sprachen', 'Die Kinder sprechen drei Sprachen.', 'Die Kinder', 'sprechen'),
    ],
  ],
  // ── Checkpoint 2: Lektion 4–6, dazu Lektion 1–3 ──
  [
    [
      gap(4, 'Ist ___ Rucksack neu? (der, die oder das?)', 'der', 'genus'),
      gap(5, 'Wo sind ___ Hefte von Mia? (bestimmter Artikel)', 'die', 'plural'),
      gap(6, 'Ich brauche ___ Bleistift. (unbestimmter Artikel)', 'einen', 'einen'),
      gap(4, 'Die Uhr ist alt. ___ kostet nur vier Euro. (er, sie oder es?)', 'Sie', 'ding'),
      gap(2, 'Ihr ___ Kollegen. (sein)', 'seid', 'sein'),
      gap(3, 'Frau Krüger, buchstabieren ___ bitte!', 'Sie', 'hoeflich'),
      build(4, 'was / kosten / das Telefon', 'Was kostet das Telefon?', 'Was', 'kosten'),
      build(6, 'die Chefin / brauchen / eine Uhr', 'Die Chefin braucht eine Uhr.', 'Die Chefin', 'brauchen'),
    ],
    [
      gap(4, 'Das macht zusammen ___ Euro. (36)', 'sechsunddreißig', 'zahl'),
      gap(5, '___ Bleistift ist grün. (bestimmter Artikel)', 'Der', 'bestimmt'),
      gap(6, 'Das ist ___ Firma in Köln. (unbestimmter Artikel)', 'eine', 'ein'),
      gap(4, 'Ich kaufe ___ Tisch. (den, die oder das?)', 'den', 'den'),
      gap(1, 'Wie ___ man Krause? (buchstabieren)', 'buchstabiert', 'buchstabieren'),
      gap(3, 'Das ist der Vater von Ben. ___ heißt Thomas. (er, sie oder es?)', 'Er', 'wer'),
      build(5, 'wo / sein / die Bücher', 'Wo sind die Bücher?', 'Wo', 'plural'),
      build(6, 'Jonas / brauchen / ein Heft', 'Jonas braucht ein Heft.', 'Jonas', 'brauchen'),
    ],
    [
      gap(4, 'Die Stühle ___ zusammen zehn Euro. (kosten)', 'kosten', 'kosten'),
      gap(5, 'Das Fenster ist alt. ___ ist braun. (er, sie oder es?)', 'Es', 'ding'),
      gap(6, 'Das ist ___ Büro, das ist eine Wohnung. (Verneinung)', 'kein', 'kein'),
      gap(6, 'Frau Lorenz braucht ___ Tasche. (unbestimmter Artikel)', 'eine', 'ein'),
      gap(2, 'Woher ___ du, Mia? (kommen)', 'kommst', 'kommen'),
      gap(3, 'Ihr ___ gut Englisch. (sprechen)', 'sprecht', 'sprechen'),
      build(4, 'die Lampe / sein / nicht / teuer', 'Die Lampe ist nicht teuer.', 'Die Lampe', 'zwei'),
      build(5, 'welche Farbe / haben / der Rucksack', 'Welche Farbe hat der Rucksack?', 'Welche Farbe', 'wfrage'),
    ],
    [
      gap(4, 'Das Wörterbuch kostet ___ Euro. (17)', 'siebzehn', 'zahl'),
      gap(5, 'Wo ist ___ Bild? (bestimmter Artikel)', 'das', 'bestimmt'),
      gap(6, 'Hier ist ___ Telefon für Sie. (unbestimmter Artikel)', 'ein', 'ein'),
      gap(4, '___ Preis ist gut. (bestimmter Artikel)', 'Der', 'bestimmt'),
      gap(1, 'Wie ___ Sie bitte? (heißen)', 'heißen', 'heissen'),
      gap(2, 'Du ___ Verkäufer von Beruf. (sein)', 'bist', 'sein'),
      build(6, 'der Kollege / brauchen / ein Regal', 'Der Kollege braucht ein Regal.', 'Der Kollege', 'brauchen'),
      build(4, 'ich / verkaufen / den Rucksack', 'Ich verkaufe den Rucksack.', 'Ich', 'den'),
    ],
  ],
  // ── Checkpoint 3: Lektion 7–9, dazu Lektion 2–6 ──
  [
    [
      gap(7, 'Du ___ gern Suppe. (kochen)', 'kochst', 'praesens'),
      gap(8, 'Der Termin ist ___ Mittwoch. (am oder um?)', 'am', 'zeit'),
      gap(9, 'Ihr ___ heute frei. (haben)', 'habt', 'haben'),
      gap(7, 'Ich ___ gern. (schwimmen)', 'schwimme', 'praesens'),
      gap(4, 'Das Zimmer kostet ___ Euro. (94)', 'vierundneunzig', 'zahl'),
      gap(6, 'Ich kaufe ___ Computer. (unbestimmter Artikel)', 'einen', 'einen'),
      build(7, 'Frau Krause / hören / gern / Musik', 'Frau Krause hört gern Musik.', 'Frau Krause', 'zwei'),
      build(8, 'wann / kommen / der Kellner', 'Wann kommt der Kellner?', 'Wann', 'wfrage'),
    ],
    [
      gap(7, 'Ihr ___ gut Fußball. (spielen)', 'spielt', 'praesens'),
      gap(8, 'Es ist ___ acht. (7.30)', 'halb', 'uhr'),
      gap(9, 'Ihr ___ heute Zeit. (haben)', 'habt', 'haben'),
      gap(9, 'Ich möchte ___ Salat, bitte. (unbestimmter Artikel)', 'einen', 'einen'),
      gap(5, '___ Tür ist braun. (bestimmter Artikel)', 'Die', 'bestimmt'),
      gap(2, 'Mia und Ben ___ Kollegen. (sein)', 'sind', 'sein'),
      build(8, 'am Sonntag / ich / kochen', 'Am Sonntag koche ich.', 'Am Sonntag', 'zwei'),
      build(9, 'wir / haben / Hunger', 'Wir haben Hunger.', 'Wir', 'haben'),
    ],
    [
      gap(7, 'Du ___ heute nicht. (arbeiten)', 'arbeitest', 'arbeiten'),
      gap(8, 'Die Pause ist ___ neun Uhr. (am oder um?)', 'um', 'zeit'),
      gap(9, 'Mia ___ viel Arbeit. (haben)', 'hat', 'haben'),
      gap(7, 'Was ___ du gern? (machen)', 'machst', 'praesens'),
      gap(3, 'Mein Vater ___ Englisch. (sprechen)', 'spricht', 'sprechen'),
      gap(4, 'Der Wecker ist gut. ___ kostet acht Euro. (er, sie oder es?)', 'Er', 'ding'),
      build(9, 'ich / möchten / eine Tasse Tee', 'Ich möchte eine Tasse Tee.', 'Ich', 'moechte'),
      build(7, 'wir / spielen / zusammen Fußball', 'Wir spielen zusammen Fußball.', 'Wir', 'praesens'),
    ],
    [
      gap(7, 'Ali ___ sehr gern. (tanzen)', 'tanzt', 'praesens'),
      gap(8, 'Nach Donnerstag kommt ___.', 'Freitag', 'woche'),
      gap(9, 'Herr Vogt ___ einen Termin. (haben)', 'hat', 'haben'),
      gap(8, 'Es ist halb ___. (10.30)', 'elf', 'uhr'),
      gap(6, 'Herr Seidel hat ___ Telefon. (Verneinung)', 'kein', 'kein'),
      gap(5, 'Wo sind ___ Schlüssel von Ben und Mia? (bestimmter Artikel)', 'die', 'plural'),
      build(7, 'er / arbeiten / am Dienstag', 'Er arbeitet am Dienstag.', 'Er', 'arbeiten'),
      build(9, 'das Café / haben / Suppe und Kuchen', 'Das Café hat Suppe und Kuchen.', 'Das Café', 'haben'),
    ],
  ],
  // ── Checkpoint 4: Lektion 10–12, dazu Lektion 4–9 ──
  [
    [
      gap(10, '___ du morgen mit dem Auto? (fahren)', 'Fährst', 'fahren'),
      gap(11, 'Ich stehe jeden Tag um sechs ___. (aufstehen)', 'auf', 'trennbar'),
      gap(12, 'Das ist Ben. Das ist ___ Geschenk. (er)', 'sein', 'mein'),
      gap(11, 'Wann ___ ihr auf? (aufstehen)', 'steht', 'trennbar'),
      gap(9, 'Wir ___ morgen frei. (haben)', 'haben', 'haben'),
      gap(7, 'Herr Meyer ___ zu Hause. (arbeiten)', 'arbeitet', 'arbeiten'),
      ask(10, 'der Bus / fahren / nach Bremen', 'Fährt der Bus nach Bremen?', 'frage'),
      build(11, 'die Eltern / einkaufen / morgen', 'Die Eltern kaufen morgen ein.', 'Die Eltern', 'trennbar'),
    ],
    [
      gap(10, '___ ihr nächste Woche frei? (haben)', 'Habt', 'frage'),
      gap(11, 'Ben ___ die Gäste ab. (abholen)', 'holt', 'trennbar'),
      gap(12, 'Wo ist ___ Tasche, Mia? (du)', 'deine', 'mein'),
      gap(11, 'Das Kind ___ noch. (schlafen)', 'schläft', 'schlafen'),
      gap(8, 'Ben kommt ___ Dienstag. (am oder um?)', 'am', 'zeit'),
      gap(6, 'Ich habe ___ Termin. (unbestimmter Artikel)', 'einen', 'einen'),
      ask(10, 'die Fahrkarte / kosten / zehn Euro', 'Kostet die Fahrkarte zehn Euro?', 'frage'),
      build(12, 'mein Bruder / feiern / am Sonntag', 'Mein Bruder feiert am Sonntag.', 'Mein Bruder', 'mein'),
    ],
    [
      gap(10, '___ Sie auch nach Österreich, Frau Vogt? (fahren)', 'Fahren', 'frage'),
      gap(11, 'Ich ___ heute leider nicht mit. (mitkommen)', 'komme', 'trennbar'),
      gap(12, 'Frau Novak, ist das ___ Zug? (Sie)', 'Ihr', 'hoeflichIhr'),
      gap(11, 'Wir ___ dich morgen an. (anrufen)', 'rufen', 'trennbar'),
      gap(9, 'Du ___ Hunger. (haben)', 'hast', 'haben'),
      gap(5, 'Wo ist ___ Karte für Ali? (bestimmter Artikel)', 'die', 'bestimmt'),
      ask(10, 'der Bus / haben / Verspätung', 'Hat der Bus Verspätung?', 'frage'),
      build(11, 'Sara / mitbringen / den Salat', 'Sara bringt den Salat mit.', 'Sara', 'trennbar'),
    ],
    [
      gap(10, '___ der Bahnhof weit? (sein)', 'Ist', 'frage'),
      gap(11, 'Mia kauft heute ___. (einkaufen)', 'ein', 'trennbar'),
      gap(12, 'Das sind ___ Gäste. (wir)', 'unsere', 'mein'),
      gap(12, 'Sara feiert. ___ Gäste kommen am Freitag. (sie)', 'Ihre', 'mein'),
      gap(8, 'Es ist halb ___. (8.30)', 'neun', 'uhr'),
      gap(7, 'Was ___ Sie heute, Herr Krause? (machen)', 'machen', 'praesens'),
      ask(10, 'du / haben / viel Zeit', 'Hast du viel Zeit?', 'frage'),
      build(12, 'meine Eltern / kommen / später', 'Meine Eltern kommen später.', 'Meine Eltern', 'mein'),
    ],
  ],
];

const slugOf = new Map(CURRICULUM_A11.lektionen.map((l) => [l.nr, l.primarySlug]));

export const ASSESSMENT_A11 = PAPERS.flatMap((papers, cp) => papers.flatMap((rows, paper) => rows.map((row, index) => ({
  id: `extra-a11-l${String(row.nr).padStart(2, '0')}-assessment-${cp + 1}-${paper + 1}-${index + 1}`,
  topic: slugOf.get(row.nr),
  type: row.type, stage: row.type === 'sentence_building' ? 5 : 4, difficulty: 2, order: 100 + paper * 8 + index,
  questionDe: row.questionDe, questionEn: row.questionEn, options: null,
  answer: row.answer, accepted: [row.answer],
  explanationDe: RULES[row.rule][0], explanationEn: RULES[row.rule][1], hint: null,
  assessment: { checkpoint: `a1.1-cp${cp + 1}`, paper, section: index < 6 ? 'bausteine' : 'schreiben',
    source: cp > 0 && index >= 4 && index < 6 ? 'earlier' : 'chapter' },
}))));
