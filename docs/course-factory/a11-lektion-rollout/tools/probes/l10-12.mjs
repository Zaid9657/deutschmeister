// node docs/course-factory/a11-lektion-rollout/tools/probes/l10-12.mjs <repo>: right and wrong answers for the Lektion 10–12 checks, through the real grader.
import { pathToFileURL } from 'node:url';
const repo = process.argv[2];
const { CURRICULUM_A11: c } = await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`));
const f = await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`));
const lex = f.courseLexicon(c);
const s = (nr, r = 0) => f.checkTurns({ ...c.lektionen[nr - 1].guided.check, lexicon: lex }, r);
const cases = [
  // Lektion 10 — where to
  [s(10)[0], 'Ich fahre nach Berlin.', 1], [s(10)[0], 'Nach Köln.', 1], [s(10)[0], 'Ich fahre in die Schweiz.', 1], [s(10)[0], 'Ich fahre nach Damaskus.', 1], [s(10)[0], 'Ich möchte nach Österreich fahren.', 1],
  [s(10)[0], 'Ich fahre nach Hause.', 1], [s(10)[0], 'Ich fahre heute nach Bremen.', 1], [s(10)[0], 'Herr Schmidt, ich fahre nach Berlin.', 1],
  [s(10)[0], 'Ich fahre in Berlin.', 0], [s(10)[0], 'Ich fahren nach Berlin.', 0], [s(10)[0], 'Ich fahre nach die Schweiz.', 0], [s(10)[0], 'Ich fahre nach Zug.', 0], [s(10)[0], 'Ich fahre nach.', 0],
  // Lektion 10 — a yes/no question
  [s(10)[1], 'Fährt der Zug nach Berlin?', 1], [s(10)[1], 'Entschuldigung, fährt der Zug nach Berlin?', 1], [s(10)[1], 'Fährt der Zug auch nach Berlin?', 1], [s(10)[1], 'Ist das der Zug nach Berlin?', 1],
  [s(10)[1], 'Der Zug fährt nach Berlin?', 1], [s(10)[1], 'Fahrt der Zug nach Berlin?', 1], [s(10)[1], 'Fährt der Zug nach Köln?', 0], [s(10)[1], 'Fahren der Zug nach Berlin?', 0], [s(10)[1], 'Wann fährt der Zug nach Berlin?', 0],
  [s(10, 1)[1], 'Fährt der Zug nach Österreich?', 1], [s(10, 2)[1], 'Fährt der Zug nach Köln?', 1],
  // Lektion 10 — when
  [s(10)[2], 'Wann fährt der Zug?', 1], [s(10)[2], 'Um wie viel Uhr fährt der Zug?', 1], [s(10)[2], 'Wann fährt der Zug nach Berlin?', 1], [s(10)[2], 'Wann ist die Abfahrt?', 1], [s(10)[2], 'Wann fährt der Zug ab?', 1],
  [s(10)[2], 'Wann fahrt der Zug?', 1], [s(10)[2], 'Wann der Zug fährt?', 0], [s(10)[2], 'Wann fahren der Zug?', 0], [s(10)[2], 'Fährt der Zug?', 0], [s(10)[2], 'Wo fährt der Zug?', 0],
  // Lektion 10 — the price
  [s(10)[3], 'Was kostet die Fahrkarte?', 1], [s(10)[3], 'Wie viel kostet die Fahrkarte nach Berlin?', 1], [s(10)[3], 'Kostet die Fahrkarte zwanzig Euro?', 1], [s(10)[3], 'Wieviel kostet eine Fahrkarte?', 1], [s(10)[3], 'Wie teuer ist die Fahrkarte?', 1],
  [s(10)[3], 'Was kostet der Fahrkarte?', 0], [s(10)[3], 'Was kosten die Fahrkarte?', 0], [s(10)[3], 'Die Fahrkarte kostet?', 0], [s(10)[3], 'Was kostet ein Fahrkarte?', 0],
  [s(10)[4], '15', 1], [s(10)[4], '15 Euro', 1], [s(10)[4], '15,00 €', 1], [s(10)[4], '50', 0], [s(10, 1)[4], '18', 1], [s(10, 2)[4], '30 Euro', 1], [s(10, 2)[4], '13', 0],
  // Lektion 10 — announcements
  [s(10)[5], '9.30', 1], [s(10)[5], '9:30 Uhr', 1], [s(10)[5], 'halb zehn', 1], [s(10)[5], '21.30', 0], [s(10)[5], '9.00', 0], [s(10)[5], '10.30', 0],
  [s(10, 1)[5], '10.15 Uhr', 1], [s(10, 1)[5], 'Viertel nach zehn', 1], [s(10, 2)[5], '11.40', 1], [s(10, 2)[5], '11.14', 0],
  [s(10)[6], '7', 1], [s(10)[6], 'Gleis 7', 1], [s(10)[6], 'Gleis sieben', 1], [s(10)[6], '17', 0], [s(10, 1)[6], '3', 1], [s(10, 2)[6], '12', 1], [s(10, 2)[6], '2', 0],
  // Lektion 11 — yesterday
  [s(11)[0], 'Ich habe gearbeitet.', 1], [s(11)[0], 'Gestern habe ich gearbeitet.', 1], [s(11)[0], 'Ich habe nicht gearbeitet.', 1], [s(11)[0], 'Lena, ich habe gestern gearbeitet.', 1],
  [s(11)[0], 'Ich gearbeitet.', 0], [s(11)[0], 'Ich habe arbeiten.', 0], [s(11)[0], 'Ich arbeite.', 0], [s(11)[0], 'Ich bin gearbeitet.', 0],
  [s(11)[1], 'Was hast du gestern gemacht?', 1], [s(11)[1], 'Und du? Was hast du gestern gemacht?', 1], [s(11)[1], 'Was hast du gemacht?', 1],
  [s(11)[1], 'Was hast du gestern machen?', 0], [s(11)[1], 'Was hat du gestern gemacht?', 0], [s(11)[1], 'Was haben Sie gestern gemacht?', 0], [s(11)[1], 'Und du?', 1],
  // Lektion 11 — the morning, getting up, work
  [s(11)[2], 'Ich dusche und frühstücke.', 1], [s(11)[2], 'Morgens dusche ich.', 1], [s(11)[2], 'Ich stehe um sechs auf und dusche.', 1], [s(11)[2], 'Ich trinke Kaffee.', 1], [s(11)[2], 'Ich frühstücke um sieben Uhr.', 1],
  [s(11)[2], 'Ich duschen.', 0], [s(11)[2], 'Ich bin müde.', 0], [s(11)[2], 'Ich Kaffee.', 0],
  [s(11)[3], 'Ich stehe um sechs auf.', 1], [s(11)[3], 'Um halb sieben stehe ich auf.', 1], [s(11)[3], 'Ich stehe um 6 Uhr auf.', 1],
  [s(11)[3], 'Ich stehe um sechs.', 0], [s(11)[3], 'Ich aufstehe um sechs.', 0], [s(11)[3], 'Ich stehe sechs auf.', 0],
  [s(11)[4], 'Ich arbeite von acht bis vier.', 1], [s(11)[4], 'Ich arbeite jeden Tag.', 1], [s(11)[4], 'Am Montag arbeite ich.', 1], [s(11)[4], 'Ich arbeite am Montag und am Dienstag.', 1], [s(11)[4], 'Ich arbeite nicht.', 1], [s(11)[4], 'Ich habe keine Arbeit.', 1],
  [s(11)[4], 'Ich arbeite in Bremen.', 0], [s(11)[4], 'Ich arbeiten am Montag.', 0], [s(11)[4], 'Ich arbeite um Montag.', 0],
  // Lektion 11 — shopping together
  [s(11)[5], 'Kaufst du am Samstag ein?', 1], [s(11)[5], 'Gehst du am Samstag einkaufen?', 1], [s(11)[5], 'Du kaufst am Samstag ein?', 1],
  [s(11)[5], 'Kaufst du am Samstag?', 0], [s(11)[5], 'Einkaufst du am Samstag?', 0], [s(11)[5], 'Kaufst du am Freitag ein?', 0], [s(11)[5], 'Kauft du am Samstag ein?', 0],
  [s(11, 1)[5], 'Kaufst du am Freitag ein?', 1], [s(11, 2)[5], 'Kaufst du am Montag ein?', 1],
  [s(11)[6], 'Ja, ich komme mit.', 1], [s(11)[6], 'Ja, gern, ich komme mit.', 1], [s(11)[6], 'Ich komme gern mit.', 1], [s(11)[6], 'Super, ich komme mit!', 1],
  [s(11)[6], 'Ja, gern.', 0], [s(11)[6], 'Ja.', 0], [s(11)[6], 'Ich mitkomme.', 0], [s(11)[6], 'Ich komme.', 1], [s(11)[6], 'Ja, ich kommen mit.', 0],
  // Lektion 12 — inviting
  [s(12)[0], 'Ich lade dich zum Fest ein.', 1], [s(12)[0], 'Ich lade dich zu meiner Party ein.', 1], [s(12)[0], 'Ich lade dich ein.', 1], [s(12)[0], 'Kommst du zu meiner Party?', 1], [s(12)[0], 'Ich möchte dich zu meinem Geburtstag einladen.', 1],
  [s(12)[0], 'Kommst du am Samstag zum Fest?', 1], [s(12)[0], 'Möchtest du zur Party kommen?', 1],
  [s(12)[0], 'Ich lade dich zum Party ein.', 0], [s(12)[0], 'Ich einlade dich.', 0], [s(12)[0], 'Ich lade du ein.', 0], [s(12)[0], 'Ich lade dich zu meinem Party ein.', 0], [s(12)[0], 'Kommst du zu Hause?', 0],
  // Lektion 12 — the birthday
  [s(12)[1], 'Mein Geburtstag ist im Mai.', 1], [s(12)[1], 'Ich habe im März Geburtstag.', 1], [s(12)[1], 'Im Oktober.', 1], [s(12)[1], 'Mein Geburtstag ist am 3. Mai.', 1], [s(12)[1], 'Mein Geburtstag ist am 12.3.', 1],
  [s(12)[1], 'Mein Geburtstag ist im mai.', 1], [s(12)[1], 'Mein Geburtstag ist am Mai.', 0], [s(12)[1], 'Mein Geburtstag ist im Montag.', 0], [s(12)[1], 'Meine Geburtstag ist im Mai.', 0], [s(12)[1], 'Mein Geburtstag ist in Mai.', 0],
  [s(12)[2], 'Wann ist dein Geburtstag?', 1], [s(12)[2], 'Und wann hast du Geburtstag?', 1], [s(12)[2], 'In welchem Monat ist dein Geburtstag?', 1],
  [s(12)[2], 'Wann ist deine Geburtstag?', 0], [s(12)[2], 'Wann ist Ihr Geburtstag?', 0], [s(12)[2], 'Wann ist mein Geburtstag?', 0],
  // Lektion 12 — guests, a present
  [s(12)[3], 'Meine Mama und mein Papa kommen.', 1], [s(12)[3], 'Mein Bruder und seine Frau kommen.', 1], [s(12)[3], 'Meine Kollegin kommt.', 1], [s(12)[3], 'Meine Eltern kommen auch.', 1], [s(12)[3], 'Lena und Tim kommen.', 1], [s(12)[3], 'Meine Familie kommt.', 1],
  [s(12)[3], 'Mein Mama kommt.', 0], [s(12)[3], 'Meine Bruder kommt.', 0], [s(12)[3], 'Meine Eltern kommt.', 0], [s(12)[3], 'Meine Mama kommen.', 0], [s(12)[3], 'Mein Bruder und sein Frau kommen.', 0],
  [s(12)[4], 'Ich möchte ein Buch.', 1], [s(12)[4], 'Vielleicht eine Tasche.', 1], [s(12)[4], 'Ich möchte einen Kuchen.', 1],
  [s(12)[4], 'Ich möchte ein Tasche.', 0], [s(12)[4], 'Ich möchte schön.', 0], [s(12)[4], 'Ich möchte nichts.', 0],
  // Lektion 12 — goodbye and a wish
  [s(12)[6], 'Mach’s gut!', 1], [s(12)[6], "Mach's gut, Lena!", 1], [s(12)[6], 'Bis bald!', 1], [s(12)[6], 'Tschüss, bis bald!', 1], [s(12)[6], 'Bis Samstag!', 1], [s(12)[6], 'Machs gut, bis später!', 1],
  [s(12)[6], 'Tschüss!', 1], [s(12)[6], 'Guten Tag!', 0], [s(12)[6], 'Danke.', 0],
  [s(12)[5], 'Schönen Tag noch!', 1], [s(12)[5], 'Tschüss, schönen Tag noch!', 1], [s(12)[5], 'Einen schönen Tag noch!', 1],
  [s(12)[5], 'Schöne Tag noch!', 0], [s(12)[5], 'Guten Tag!', 0], [s(12)[5], 'Tschüss!', 0],
  // One journey per sitting: a destination named is the sitting's (second DaF review).
  [s(10, 1)[2], 'Wann fährt der Zug nach Berlin?', 0], [s(10, 1)[2], 'Wann fährt der Zug nach Österreich?', 1], [s(10, 1)[2], 'Wann fährt der Zug?', 1], [s(10, 2)[2], 'Wann fährt der Zug nach Köln?', 1], [s(10, 2)[2], 'Wann fährt der Zug nach Berlin?', 0],
  [s(10, 1)[3], 'Was kostet die Fahrkarte nach Österreich?', 1], [s(10, 1)[3], 'Was kostet die Fahrkarte nach Berlin?', 0], [s(10, 2)[3], 'Wie viel kostet die Fahrkarte nach Köln?', 1], [s(10, 2)[3], 'Wie viel kostet die Fahrkarte nach Berlin?', 0],
  [s(10)[0], 'Nach Hause.', 1], [s(11)[0], 'Ich habe eine Pause gemacht.', 1], [s(11)[0], 'Ich habe Lesen gemacht.', 0], [s(11)[0], 'Ich habe nichts gemacht.', 1], [s(11)[1], 'Was hast du morgen gemacht?', 0], [s(11)[5], 'Kaufst du am Samstag Brot ein?', 1],
  [s(12)[6], 'Tschüss, bis bald!', 1], [s(12)[6], 'Auf Wiedersehen!', 1],
  // The courses session's findings (2026-11-20): verbs of two parts, the past, two-sentence invitations, goodbyes, guests.
  [s(11)[2], 'Ich aufstehe.', 0], [s(11)[2], 'Ich einkaufe.', 0], [s(11)[2], 'Ich fernsehe.', 0], [s(11)[2], 'Ich aufstehe um 7 Uhr.', 0], [s(11)[2], 'Ich sehe fern.', 1], [s(11)[2], 'Ich stehe auf und dusche.', 1], [s(11)[2], 'Ich dusche und aufstehe.', 0],
  [s(7)[1], 'Ich einkaufe gern.', 0], [s(7)[1], 'Ich sehe gern fern.', 1], [s(7)[0], 'Ich einkaufe gern.', 0], [s(7)[2], 'Einkaufst du gern?', 0], [s(7)[2], 'Kaufst du gern ein?', 1], [s(7)[2], 'Siehst du gern fern?', 1],
  [s(11)[0], 'Ich habe Fußball gespielt.', 'b'], [s(11)[0], 'Ich habe gekocht.', 'b'], [s(11)[0], 'Ich habe eingekauft.', 'b'], [s(11)[0], 'Ich habe Deutsch gelernt.', 'b'], [s(11)[0], 'Ich habe Musik gehört.', 'b'], [s(11)[0], 'Ich habe geschlafen.', 'b'],
  [s(11)[0], 'Ich bin ins Kino gegangen.', 'b'], [s(11)[0], 'Ich war zu Hause.', 'b'], [s(11)[0], 'Am Sonntag habe ich gekocht.', 'b'], [s(11)[0], 'Gestern habe ich ferngesehen.', 'b'], [s(11)[0], 'Ich habe meine Mutter besucht.', 'b'], [s(11)[0], 'Ich habe telefoniert.', 'b'],
  [s(11)[0], 'Ich habe arbeiten.', 0], [s(11)[0], 'Ich bin gearbeitet.', 0], [s(11)[0], 'Ich habe gearbeiten.', 0], [s(11)[0], 'Ich habe aufgestanden.', 0], [s(11)[0], 'Ich habe geschlaft.', 0], [s(11)[0], 'Ich bin gekocht.', 0], [s(11)[0], 'Ich habe gegangen.', 0],
  [s(12)[0], 'Ich mache ein Fest. Kommst du auch?', 1], [s(12)[0], 'Ich feiere meinen Geburtstag. Ich lade dich ein.', 1], [s(12)[0], 'Am Samstag feiere ich. Kommst du?', 1], [s(12)[0], 'Am Samstag ist meine Party. Kommst du?', 1],
  [s(12)[0], 'Ich feiere am Sonntag. Kommst du?', 0], [s(12)[0], 'Ich habe Hunger. Kommst du?', 0], [s(12)[0], 'Ich mache ein Party. Kommst du?', 0],
  [s(12)[6], 'Bis dann!', 1], [s(12)[6], 'Bis Montag!', 0], [s(12)[4], 'Ich wünsche mir ein Buch.', 1], [s(10)[3], 'Was kostet das Ticket?', 1], [s(10)[3], 'Was kostet das?', 1],
  [s(12)[3], 'Ein Stuhl kommt.', 0], [s(12)[3], 'Meine Nachbarin kommt.', 1], [s(12)[3], 'Lena kommt.', 1],
];
let bad = 0;
for (const [turn, answer, right] of cases) {
  const got = f.typedResult(turn, answer);
  if ((got === 'beyond' ? 'b' : got === 'wrong' ? 0 : 1) !== (right === 'b' ? 'b' : right ? 1 : 0)) { bad += 1; console.log(`FAIL want ${right === 'b' ? 'beyond' : right ? 'right' : 'wrong'} got ${got}: ${answer}`); }
}
console.log(bad ? `${bad} of ${cases.length} FAIL` : `all ${cases.length} as intended`);
