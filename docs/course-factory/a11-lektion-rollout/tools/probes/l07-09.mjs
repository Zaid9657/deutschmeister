// node docs/course-factory/a11-lektion-rollout/tools/probes/l07-09.mjs <repo>: right and wrong answers for the Lektion 7–9 checks, through the real grader.
import { pathToFileURL } from 'node:url';
const repo = process.argv[2];
const { CURRICULUM_A11: c } = await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`));
const f = await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`));
const lex = f.courseLexicon(c);
const s = (nr, r = 0) => f.checkTurns({ ...c.lektionen[nr - 1].guided.check, lexicon: lex }, r);
const cases = [
  // Lektion 7 — hobby
  [s(7)[0], 'Mein Hobby ist Musik.', 1], [s(7)[0], 'Mein Hobby ist Fußball.', 1], [s(7)[0], 'Meine Hobbys sind Sport und Kochen.', 1], [s(7)[0], 'Mein Hobby ist Yoga.', 1], [s(7)[0], 'Mein Hobby ist Fußball spielen.', 1],
  [s(7)[0], 'Ich spiele gern Fußball.', 1], [s(7)[0], 'Ich lese gern.', 1], [s(7)[0], 'mein hobby ist musik', 1],
  [s(7)[0], 'Mein Hobby ist gut.', 0], [s(7)[0], 'Mein Hobby sind Musik.', 0], [s(7)[0], 'Ich spielen gern Fußball.', 0], [s(7)[0], 'Meine Hobby ist Musik.', 0],
  // Lektion 7 — what I like doing
  [s(7)[1], 'Ich spiele gern Fußball.', 1], [s(7)[1], 'Am Wochenende spiele ich gern Fußball.', 1], [s(7)[1], 'Ich gehe gern ins Kino.', 1], [s(7)[1], 'Ich koche gern.', 1], [s(7)[1], 'Ich lese und koche gern.', 1],
  [s(7)[1], 'Ich tanze sehr gern.', 1], [s(7)[1], 'Ich höre gerne Musik.', 1], [s(7)[1], 'Am Wochenende schwimme ich.', 1], [s(7)[1], 'Ich wandere gern.', 1],
  [s(7)[1], 'Ich spielen gern Fußball.', 0], [s(7)[1], 'Ich spielt gern Fußball.', 0], [s(7)[1], 'Ich gern spiele Fußball.', 0], [s(7)[1], 'Am Wochenende ich spiele Fußball.', 0], [s(7)[1], 'Ich bin gern.', 0], [s(7)[1], 'Ich gern.', 0],
  // Lektion 7 — ask about the hobby
  [s(7)[2], 'Was ist dein Hobby?', 1], [s(7)[2], 'Und du?', 1], [s(7)[2], 'Lena, was ist dein Hobby?', 1], [s(7)[2], 'Was machst du gern?', 1],
  [s(7)[2], 'Was ist Ihr Hobby?', 0], [s(7)[2], 'Was ist deine Hobby?', 0], [s(7)[2], 'Was machst du gerne?', 1],
  // Lektion 7 — du-form
  [s(7)[3], 'Tanzt du gern?', 1], [s(7)[3], 'Tanzt du gerne?', 1], [s(7)[3], 'Tanzst du gern?', 0], [s(7)[3], 'Tanzen du gern?', 0], [s(7)[3], 'Tanzt Sie gern?', 0],
  [s(7, 1)[3], 'Kochst du gern?', 1], [s(7, 1)[3], 'Kocht du gern?', 0], [s(7, 2)[3], 'Schwimmst du gern?', 1], [s(7, 2)[3], 'Schwimmt du gern?', 0],
  // Lektion 7 — when free
  [s(7)[4], 'Am Wochenende bin ich frei.', 1], [s(7)[4], 'Ich bin am Wochenende frei.', 1], [s(7)[4], 'Am Sonntag bin ich frei.', 1], [s(7)[4], 'Ich bin abends frei.', 1], [s(7)[4], 'Am Samstag habe ich frei.', 1],
  [s(7)[4], 'Am Wochenende habe ich Zeit.', 1], [s(7)[4], 'Am Dienstag bin ich abends frei.', 1], [s(7)[4], 'Ich bin am Montag nach der Arbeit frei.', 1],
  [s(7)[4], 'Am Wochenende ich bin frei.', 0], [s(7)[4], 'Ich bin frei.', 0], [s(7)[4], 'Am Tisch bin ich frei.', 0], [s(7)[4], 'Ich bin am Wochenende müde.', 0], [s(7)[4], 'Am Wochenende sind ich frei.', 0],
  // Lektion 8 — tell the time
  [s(8)[0], 'Es ist halb neun.', 1], [s(8)[0], 'Halb neun.', 1], [s(8)[0], 'Es ist acht Uhr dreißig.', 1], [s(8)[0], 'Es ist 8.30 Uhr.', 1], 
  [s(8)[0], 'Es ist halb acht.', 0], [s(8)[0], 'Es ist um halb neun.', 0], [s(8)[0], 'Es ist halb neun Uhr.', 0], [s(8)[0], 'Es ist neun Uhr dreißig.', 0],
  [s(8, 1)[0], 'Es ist Viertel nach sieben.', 1], [s(8, 1)[0], 'Es ist sieben Uhr fünfzehn.', 1], [s(8, 1)[0], 'Es ist Viertel vor sieben.', 0],
  [s(8, 2)[0], 'Es ist Viertel vor zehn.', 1], [s(8, 2)[0], 'Es ist neun Uhr fünfundvierzig.', 1], [s(8, 2)[0], 'Es ist Viertel vor neun.', 0],
  // Lektion 8 — ask the time
  [s(8)[1], 'Wie spät ist es?', 1], [s(8)[1], 'Wie viel Uhr ist es?', 1], [s(8)[1], 'Lena, wie spät ist es?', 1], [s(8)[1], 'Wie spät es ist?', 0], [s(8)[1], 'Wann ist es?', 0],
  // Lektion 8 — when I get up
  [s(8)[2], 'Ich stehe um sechs Uhr auf.', 1], [s(8)[2], 'Ich stehe um halb sieben auf.', 1], [s(8)[2], 'Um sieben stehe ich auf.', 1], [s(8)[2], 'Ich stehe morgens um 7 Uhr auf.', 1],
  [s(8)[2], 'Ich stehe sechs Uhr auf.', 0], [s(8)[2], 'Ich stehe um sechs Uhr.', 0], [s(8)[2], 'Ich aufstehe um sechs Uhr.', 0], [s(8)[2], 'Ich stehen um sechs Uhr auf.', 0],
  // Lektion 8 — ask for an appointment
  [s(8)[3], 'Hast du am Freitag um zehn Uhr Zeit?', 1], [s(8)[3], 'Hast du Freitag um 10 Uhr Zeit?', 1], [s(8)[3], 'Bist du am Freitag um zehn frei?', 1], [s(8)[3], 'Lena, hast du am Freitag um zehn Uhr Zeit?', 1],
  [s(8)[3], 'Hast du am Montag um zehn Uhr Zeit?', 0], [s(8)[3], 'Hast du am Freitag um elf Uhr Zeit?', 0], [s(8)[3], 'Haben Sie am Freitag um zehn Uhr Zeit?', 0], [s(8)[3], 'Hast du Zeit?', 0],
  [s(8, 1)[3], 'Hast du am Donnerstag um Viertel nach vier Zeit?', 1], [s(8, 1)[3], 'Hast du am Donnerstag um 16.15 Uhr Zeit?', 1], [s(8, 2)[3], 'Hast du am Montag um halb zehn Zeit?', 1], [s(8, 2)[3], 'Hast du am Montag um halb neun Zeit?', 0],
  // Lektion 8 — when I have time
  [s(8)[5], 'Am Dienstag habe ich Zeit.', 1], [s(8)[5], 'Am Dienstag bin ich abends frei.', 1], [s(8)[5], 'Ich habe am Mittwoch um drei Uhr Zeit.', 1], [s(8)[5], 'Am Wochenende habe ich frei.', 1],
  [s(8)[5], 'Am Dienstag hast ich Zeit.', 0], [s(8)[5], 'Ich habe Zeit.', 0], [s(8)[5], 'Um Montag habe ich Zeit.', 0], [s(8)[5], 'Um zehn habe ich Zeit.', 1], [s(8)[5], 'Am zehn Uhr habe ich Zeit.', 0],
  // Lektion 8 — the appointment heard
  [s(8)[6], 'Dienstag, 9.30 Uhr', 1], [s(8)[6], 'am Dienstag um halb zehn', 1], [s(8)[6], 'Di 9:30', 1], [s(8)[6], 'Dienstag 9.30', 1],
  [s(8)[6], 'Dienstag 10.30', 0], [s(8)[6], 'Mittwoch 9.30', 0], [s(8)[6], '9.30', 0], [s(8)[6], 'Dienstag', 0],
  [s(8, 1)[6], 'Freitag um 16.15 Uhr', 1], [s(8, 1)[6], 'Donnerstag, 16.15 Uhr', 0], [s(8, 2)[6], 'Montag, 7.45 Uhr', 1], [s(8, 2)[6], 'Montag 8.45', 0],
  // second DaF review: a du-question about an activity, a plain Ja, Durst und Hunger
  [s(7)[2], 'Spielst du gern Fußball?', 1], [s(7)[2], 'Tanzt du?', 1], [s(7)[2], 'Gehst du gern ins Kino?', 1], [s(7)[2], 'Spielt du gern Fußball?', 0], [s(7)[2], 'Bist du gern?', 0], [s(8)[4], 'Ja.', 1], [s(9, 2)[0], 'Ich habe Durst und Hunger.', 1],
  // first Lektion 7–9 corpus and third DaF review
  [s(7)[1], 'am wochenende schwimme ich gern', 1], [s(7)[2], 'Und du, was machst du gern?', 1], [s(7)[2], 'was ist dein hobby lena?', 1], [s(7)[3], 'Du tanzt gern?', 1], [s(7)[3], 'Du tanzst gern?', 0], [s(7)[0], 'Ich spiele Fußball.', 1], [s(7)[0], 'Ich spielen Fußball.', 0],
  [s(8)[3], 'Am Freitag um zehn Uhr, hast du da Zeit?', 1], [s(8)[3], 'Am Montag um zehn Uhr, hast du da Zeit?', 0], [s(8)[4], 'Ja, das passt.', 1], [s(8)[4], 'Gut, am Freitag um zehn.', 1], [s(8)[4], 'Ja, am Freitag um elf.', 0], [s(8)[4], 'Gut, am Montag.', 0], [s(8, 1)[4], 'Ja, am Donnerstag um Viertel vor vier.', 0],
  [s(9)[0], 'Ja, ich habe Hunger, danke.', 1], [s(9)[4], 'Ein Glas Wasser, bitte.', 1], [s(9)[4], 'Ich möchte kein Wasser.', 0], [s(9, 1)[4], 'Ich möchte auch Tee, bitte.', 1], [s(9, 1)[4], 'Ich möchte keinen Tee.', 0], [s(9)[5], 'Ich möchte keinen Kuchen, danke.', 1], [s(9)[5], 'nein danke, kein kuchen', 1], [s(9)[5], 'Ich möchte einen Kuchen, danke.', 0], [s(9, 1)[5], 'nein, keine suppe, danke', 1],
  // Lektion 8 — agree the time (first DaF review)
  [s(8)[4], 'Ja, gern.', 1], [s(8)[4], 'Gut, bis Freitag!', 1], [s(8)[4], 'Super, bis dann!', 1], [s(8)[4], 'Bis Montag!', 0], [s(8)[4], 'Nein.', 0], [s(8, 2)[4], 'Bis Montag!', 1],
  // Lektion 8 — morning and evening (first DaF review)
  [s(8)[0], 'Es ist zwanzig Uhr dreißig.', 0], [s(8)[6], 'Dienstag, 21.30 Uhr', 0], [s(8, 1)[6], 'Freitag, 4.15 Uhr', 0], [s(8, 1)[6], 'Freitag, nachmittags um Viertel nach vier', 1], [s(8, 1)[6], 'Freitag Viertel nach vier', 0], [s(8, 1)[6], 'Fr. 16:15', 1], [s(8, 1)[6], 'Freitag, 16.15 Uhr', 1],
  // Lektion 9 — drink and food kept apart, the thing offered (first DaF review)
  [s(9)[1], 'Ich möchte Kuchen.', 0], [s(9)[2], 'Ich möchte Wasser.', 0], [s(9)[4], 'Ja, einen Kaffee, bitte.', 0], [s(9)[4], 'Ja, ein Glas Wasser, bitte.', 1], [s(9, 2)[4], 'Ja, einen Kaffee, bitte.', 1],
  // Lektion 9 — order a drink
  [s(9)[1], 'Ich möchte einen Kaffee, bitte.', 1], [s(9)[1], 'Einen Kaffee, bitte.', 1], [s(9)[1], 'Ich möchte ein Glas Mineralwasser.', 1], [s(9)[1], 'Ich nehme einen Tee.', 1], [s(9)[1], 'Kaffee, bitte.', 1],
  [s(9)[1], 'Ich möchte eine Tasse Tee.', 1], [s(9)[1], 'Ich möchte einen Kaffee mit Milch.', 1], [s(9)[1], 'Ich möchte einen Orangensaft und ein Wasser.', 1],
  [s(9)[1], 'Ich möchte ein Kaffee.', 0], [s(9)[1], 'Ich möchte der Kaffee.', 0], [s(9)[1], 'Ich möchten einen Kaffee.', 0], [s(9)[1], 'Ich möchte eine Glas Wasser.', 0], [s(9)[1], 'Ich möchte groß.', 0],
  // Lektion 9 — order food
  [s(9)[2], 'Ich möchte eine Suppe, bitte.', 1], [s(9)[2], 'Ich esse einen Kuchen.', 1], [s(9)[2], 'Ich möchte Kuchen.', 1], [s(9)[2], 'Ein Stück Kuchen, bitte.', 1], [s(9)[2], 'Ich möchte einen Salat.', 1],
  [s(9)[2], 'Ich möchte ein Suppe.', 0], [s(9)[2], 'Ich möchte einen Salat essen.', 1],
  // Lektion 9 — hunger, thirst
  [s(9)[0], 'Ja, ich habe Hunger.', 1], [s(9)[0], 'Ich habe Hunger.', 1], [s(9)[0], 'Ja, ich bin Hunger.', 0], [s(9)[0], 'Ja, ich hat Hunger.', 0], [s(9)[0], 'Ja, ich habe Durst.', 0],
  [s(9, 1)[0], 'Ja, ich habe Durst.', 1], [s(9, 1)[0], 'Ich bin durstig.', 1], [s(9, 2)[0], 'Ja, ich habe Hunger und Durst.', 1], [s(9, 2)[0], 'Ja, ich habe Hunger.', 0], [s(9)[0], 'Ja.', 0],
  // Lektion 9 — is there …?
  [s(9)[3], 'Haben Sie Tee?', 1], [s(9)[3], 'Gibt es Tee?', 1], [s(9)[3], 'Haben Sie bitte Tee?', 1], [s(9)[3], 'Hast du Tee?', 0], [s(9)[3], 'Haben Sie Kaffee?', 0],
  [s(9, 1)[3], 'Haben Sie Suppe?', 1], [s(9, 2)[3], 'Gibt es Orangensaft?', 1],
  // Lektion 9 — accept, decline
  [s(9)[4], 'Ja, gern.', 1], [s(9)[4], 'Ja, bitte.', 1], [s(9)[4], 'Ja, ein Glas, bitte.', 1], [s(9)[4], 'Ja, ich möchte ein Glas Wasser.', 1], [s(9)[4], 'Nein, danke.', 0],
  [s(9)[5], 'Nein, danke.', 1], [s(9)[5], 'Nein, danke. Ich habe keinen Hunger.', 1], [s(9)[5], 'Nein.', 0], [s(9)[5], 'Ja, gern.', 0], [s(9)[5], 'Nein, danke, ich möchte keinen Kuchen.', 1], [s(9)[5], 'Nein, danke, ich möchte kein Kuchen.', 0],
];
let bad = 0;
for (const [turn, answer, right] of cases) {
  const got = f.typedResult(turn, answer);
  if ((got === 'beyond' ? 'b' : got === 'wrong' ? 0 : 1) !== (right === 'b' ? 'b' : right ? 1 : 0)) { bad += 1; console.log(`FAIL want ${right === 'b' ? 'beyond' : right ? 'right' : 'wrong'} got ${got}: ${answer}`); }
}
console.log(bad ? `${bad} of ${cases.length} FAIL` : `all ${cases.length} as intended`);
