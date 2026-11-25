// Start Deutsch 1-style messages, offers and notices, within each A1.1 checkpoint.
// Each row is [type, text, statement, key, evidence, English exclusion rationale].
// Authored keys, reviewed blind before they shipped (tests/fixtures/a11-lesen-review.json): a changed unit
// needs that independent review again before it ships.
const papers = [
  [
    ['message', 'Hallo Mia, Sara wohnt in Bremen. Ihre Eltern wohnen auch in Bremen. Ich wohne in Berlin. Kommst du auch nach Berlin? Grüße, Jonas', 'Sara wohnt in Bremen.', true, 'Sara wohnt in Bremen.', 'Sara lives in Bremen; Berlin is Jonas’s home.'],
    ['message', 'Frau Novak, guten Morgen! Jonas kommt aus Österreich und wohnt in Berlin. Die Eltern von Jonas wohnen in Bremen. Grüße, Herr Seidel', 'Jonas wohnt in Bremen.', false, 'Jonas kommt aus Österreich und wohnt in Berlin.', 'Jonas lives in Berlin. Bremen is where his parents live.'],
    ['sign', 'Amt: Herr Krause ist hier. Frau Novak ist nicht hier. Formulare bitte hier ausfüllen: Name, Adresse und Familienstand.', 'Herr Krause ist hier.', true, 'Herr Krause ist hier.', 'The notice directs visitors to Krause; Novak is absent.'],
    ['ad', 'Englisch mit Mia! Mia spricht Englisch, aber nicht Deutsch. Sprichst du Deutsch und auch Englisch? Wir sprechen zusammen! Telefonnummer: 0173 2468501.', 'Mia spricht auch Deutsch.', false, 'Mia spricht Englisch, aber nicht Deutsch.', 'Mia explicitly says she does not speak German.'],
  ],
  [
    ['ad', 'Deutsch mit Frau Becker! Frau Becker ist Lehrerin aus Österreich, nicht Studentin. Sie spricht auch Arabisch. Sie wohnen in Köln? Frau Becker wohnt hier. Telefonnummer: 0176 3582604.', 'Frau Becker ist Studentin.', false, 'Frau Becker ist Lehrerin aus Österreich, nicht Studentin.', 'The offer explicitly identifies Becker as a teacher and not a student.'],
    ['message', 'Hallo Ben, Ali ist acht, Mia ist schon zehn. Die Kinder sprechen Deutsch und Englisch. Wie alt ist die Tochter von Frau Novak? Grüße, Thomas', 'Ali ist schon zehn.', false, 'Ali ist acht', 'Ali is eight; Mia is ten.'],
    ['notice', 'Frau Lorenz ist verheiratet und wohnt in Bremen. Bitte für das Formular nicht die Adresse von Frau Becker: Sie wohnt in Berlin.', 'Frau Lorenz ist verheiratet.', true, 'Frau Lorenz ist verheiratet und wohnt in Bremen.', 'The form note gives Lorenz’s marital status and distinguishes her address from Becker’s.'],
    ['message', 'Guten Abend, Mia! Ben ist schon zehn. Er spricht Deutsch und Englisch. Die Schwester von Ben ist acht und spricht Deutsch. Grüße, Sara', 'Ben ist schon zehn.', true, 'Ben ist schon zehn.', 'Ben is ten; the eight-year-old is his sister.'],
  ],
  [
    ['message', 'Hallo Ali! Mia wohnt in Polen. Thomas und ich wohnen nicht in Polen, wir wohnen in Berlin. Kommst du auch nach Berlin? Grüße, Ben', 'Mia wohnt in Polen.', true, 'Mia wohnt in Polen.', 'Mia lives in Poland; Ben and Thomas live in Berlin.'],
    ['sign', 'Frau Meyer wohnt nicht hier. Frau Brandt ist hier und spricht auch Englisch. Bitte sprechen Sie mit Frau Brandt.', 'Frau Meyer wohnt hier.', false, 'Frau Meyer wohnt nicht hier.', 'The sign explicitly says Meyer does not live here.'],
    ['ad', 'Deutsch mit Thomas: Thomas kommt aus Italien und spricht Deutsch und Englisch. Sprichst du auch Englisch? Wir sprechen zusammen Deutsch und Englisch! Wohnort: Bremen. Telefonnummer: 0172 5328640.', 'Thomas kommt aus Italien.', true, 'Thomas kommt aus Italien und spricht Deutsch und Englisch.', 'The writer is Thomas and gives Italy as his country of origin.'],
    ['message', 'Guten Tag, Herr Seidel! Frau Novak kommt aus Marokko. Sie ist Lehrerin, nicht Studentin. Ihre Tochter kommt aus Deutschland und ist Studentin. Grüße, Frau Becker', 'Frau Novak ist Studentin.', false, 'Sie ist Lehrerin, nicht Studentin.', 'Novak is explicitly not a student; her daughter is the student.'],
  ],
  [
    ['notice', 'Hier wohnt Familie Krause, nicht Familie Becker. Frau Becker wohnt in Berlin. Bitte sprechen Sie mit Frau Krause.', 'Hier wohnt Familie Becker.', false, 'Hier wohnt Familie Krause, nicht Familie Becker.', 'The sign identifies the resident family as Krause and explicitly excludes Becker.'],
    ['message', 'Hallo Sara, Herr Brandt kommt aus Spanien und wohnt in Köln. Frau Brandt kommt aus Italien. Sie spricht Deutsch mit mir. Grüße, Jonas', 'Herr Brandt kommt aus Spanien.', true, 'Herr Brandt kommt aus Spanien', 'Brandt is from Spain; Frau Brandt is from Italy.'],
    ['ad', 'Arabisch mit Ali: Ali spricht Arabisch und Englisch. Er wohnt in Bremen, nicht in Köln. Du wohnst auch in Bremen? Telefonnummer: 0421 5826349.', 'Ali wohnt auch in Köln.', false, 'Er wohnt in Bremen, nicht in Köln.', 'Ali explicitly lives in Bremen, not Cologne.'],
    ['message', 'Frau Lorenz, Ben wohnt mit Frau Brandt in Berlin. Herr Brandt wohnt in Österreich. Grüße, Mia', 'Ben wohnt in Berlin.', true, 'Ben wohnt mit Frau Brandt in Berlin.', 'Ben lives with Frau Brandt in Berlin; Herr Brandt lives in Austria.'],
  ],
  [
    ['ad', 'Ich verkaufe einen Tisch und einen Stuhl. Der Tisch kostet zwanzig Euro, der Stuhl acht Euro. Tisch und Stuhl sind weiß. Bitte Mail an Frau Becker.', 'Der Stuhl kostet acht Euro.', true, 'der Stuhl acht Euro.', 'The chair costs eight euros; the table costs twenty.'],
    ['message', 'Hallo Jonas, die Tasche ist für Sara. Der Rucksack ist hier im Büro. Die Tasche kostet zwölf Euro, der Rucksack kostet zwanzig Euro. Grüße, Ben', 'Die Tasche kostet zwanzig Euro.', false, 'Die Tasche kostet zwölf Euro', 'The bag costs twelve euros; twenty is the backpack’s price.'],
    ['sign', 'Büro Frau Novak: Frau Novak ist nicht im Büro. Frau Becker ist hier und hat das Telefon. Bitte sprechen Sie mit Frau Becker.', 'Frau Novak ist im Büro.', false, 'Frau Novak ist nicht im Büro.', 'The sign explicitly says Novak is absent; Becker is here.'],
    ['message', 'Guten Tag, Frau Brandt, Ihr Wörterbuch ist im Büro. Das Heft ist nicht hier, es ist bei Frau Novak. Brauchen Sie auch Papier? Das Papier ist hier. Grüße, Mia', 'Das Wörterbuch ist im Büro.', true, 'Ihr Wörterbuch ist im Büro.', 'The dictionary is in the office; Novak has the exercise book.'],
  ],
  [
    ['message', 'Hallo Ben, der Stuhl ist schwarz. Ich brauche den Stuhl für das Büro. Der Tisch ist weiß und ist für Sara. Grüße, Mia', 'Der Stuhl ist schwarz.', true, 'der Stuhl ist schwarz.', 'The chair is black; the table is white.'],
    ['ad', 'Lampe für das Büro: acht Euro! Die Lampe ist weiß. Das Regal ist braun und kostet dreißig Euro. Ich verkaufe auch Bücher. Frau Brandt, Telefonnummer 0174 5236802.', 'Die Lampe für das Büro ist braun.', false, 'Die Lampe ist weiß.', 'The lamp is white; brown describes the shelf.'],
    ['message', 'Frau Becker, Ihre Tasche ist hier bei mir. Die Tasche ist blau. Das Bild ist rot und ist von Jonas. Brauchen Sie das Bild auch? Grüße, Sara', 'Die Tasche ist rot.', false, 'Die Tasche ist blau.', 'The bag is blue; the picture is red.'],
    ['notice', 'Die Uhr für Frau Novak ist schwarz und kostet zehn Euro. Die Uhr für Frau Meyer ist weiß. Bitte die Uhr für Frau Novak kaufen!', 'Die Uhr für Frau Novak ist schwarz.', true, 'Die Uhr für Frau Novak ist schwarz und kostet zehn Euro.', 'The order notice assigns the black clock to Novak and the white clock to Meyer.'],
  ],
  [
    ['sign', 'Frau Meyer hat die Nummer drei zwei fünf. Bitte nicht die Nummer drei zwei vier! Die Nummer ist von Frau Becker. Frau Meyer ist hier im Büro.', 'Frau Meyer hat die Nummer drei zwei fünf.', true, 'Frau Meyer hat die Nummer drei zwei fünf.', 'The notice gives Meyer’s telephone contact and distinguishes Becker’s number.'],
    ['message', 'Hallo Sara! Das Lineal ist für Jonas. Ich brauche die Schere für das Büro. Bitte auch einen Stift für mich! Danke und Grüße, Ben', 'Das Lineal ist für Jonas.', true, 'Das Lineal ist für Jonas.', 'The ruler is for Jonas; the scissors are for Ben’s office.'],
    ['ad', 'Ich verkaufe ein Handy. Das Handy kostet vierzig Euro. Der Computer kostet hundert Euro. Handy und Computer sind von der Firma. Brauchen Sie ein Handy? Bitte Mail an Frau Becker.', 'Das Handy kostet hundert Euro.', false, 'Das Handy kostet vierzig Euro.', 'The mobile phone costs forty euros; one hundred is the computer’s price.'],
    ['message', 'Hallo Frau Meyer! Das Buch ist für Jonas, nicht für Frau Becker. Sara hat schon ein Buch. Das Heft ist für Sara. Grüße, Herr Seidel', 'Das Buch ist für Frau Becker.', false, 'Das Buch ist für Jonas, nicht für Frau Becker.', 'The book is explicitly for Jonas, not Becker; Sara gets the exercise book.'],
  ],
  [
    ['message', 'Hallo Mia, Herr Krause ist Ingenieur. Er ist nicht der Chef. Die Chefin heißt Frau Brandt. Ich brauche ihre Telefonnummer für das Formular. Grüße, Jonas', 'Herr Krause ist nicht Ingenieur.', false, 'Herr Krause ist Ingenieur.', 'Krause is explicitly an engineer; Brandt is the boss.'],
    ['notice', 'Firma Seidel: Frau Novak ist nicht hier im Büro. Bitte sprechen Sie mit Frau Becker. Sie ist Verkäuferin und hat die Telefonnummer von Frau Novak.', 'Frau Novak ist hier im Büro.', false, 'Frau Novak ist nicht hier im Büro.', 'The notice explicitly says Novak is absent from the office.'],
    ['message', 'Frau Meyer, die Chefin ist hier im Büro. Der Kollege ist bei Frau Becker. Brauchen Sie den Computer? Das Telefon ist auch hier. Grüße, Ben', 'Die Chefin ist hier im Büro.', true, 'die Chefin ist hier im Büro.', 'The boss is in this office; the colleague is with Becker.'],
    ['ad', 'Bücher für das Büro: Das Wörterbuch ist neu. Ich verkaufe es für zwölf Euro. Das Heft ist nicht neu und kostet einen Euro. Mail an Frau Lorenz.', 'Das Heft ist nicht neu.', true, 'Das Heft ist nicht neu', 'The exercise book is explicitly not new; the dictionary is new.'],
  ],
  [
    ['notice', 'Termin bei Frau Novak: Bitte um elf Uhr kommen. Frau Novak arbeitet heute bis zehn Uhr bei der Firma Becker. Sie hat um elf Uhr Zeit.', 'Frau Novak hat um elf Uhr Zeit.', true, 'Sie hat um elf Uhr Zeit.', 'Novak is available at eleven, after her work at Becker.'],
    ['message', 'Hallo Mia, am Dienstag habe ich einen Termin. Am Montag habe ich frei und arbeite nicht. Hast du am Montag auch Zeit? Wir gehen ins Kino! Grüße, Jonas', 'Jonas hat am Montag frei.', true, 'Am Montag habe ich frei und arbeite nicht.', 'Jonas is free on Monday; his appointment is on Tuesday.'],
    ['ad', 'Frühstück bei Frau Becker: Brot und Kaffee für fünf Euro. Tee kostet zwei Euro. Wir haben morgens Zeit für Sie. Kommen Sie zum Frühstück!', 'Der Tee kostet fünf Euro.', false, 'Tee kostet zwei Euro.', 'Tea costs two euros; five is the breakfast price.'],
    ['message', 'Guten Morgen, Herr Seidel! Ich arbeite am Montag. Die Pause ist um zwölf Uhr, nicht um zehn Uhr. Die Kollegin hat am Dienstag frei. Haben Sie dann Zeit? Grüße, Frau Brandt', 'Frau Brandt hat am Montag frei.', false, 'Ich arbeite am Montag.', 'Brandt works on Monday, so she does not have that day off.'],
  ],
  [
    ['message', 'Hallo Sara, ich bin heute krank. Wir gehen nicht ins Kino. Ich habe am Freitag Zeit. Gehen wir dann? Grüße, Ben', 'Ben geht heute ins Kino.', false, 'Wir gehen nicht ins Kino.', 'Ben cancels today’s cinema outing because he is ill.'],
    ['notice', 'Wir arbeiten heute im Büro bis zwölf Uhr. Frau Becker arbeitet bis elf Uhr. Bitte kommen Sie vor zwölf Uhr. Nachmittags haben wir Pause.', 'Wir arbeiten im Büro bis zwölf Uhr.', true, 'Wir arbeiten heute im Büro bis zwölf Uhr.', 'The office staff work until twelve; Becker finishes at eleven.'],
    ['ad', 'Kuchen und Brot von Frau Meyer: Der Kuchen kostet zehn Euro. Das Brot kostet drei Euro. Frau Meyer arbeitet morgens und hat nachmittags frei.', 'Der Kuchen von Frau Meyer kostet drei Euro.', false, 'Der Kuchen kostet zehn Euro.', 'The cake costs ten euros; three is the bread price.'],
    ['message', 'Jonas, ich gehe heute ins Kino. Sara hat nicht frei und arbeitet. Kommst du auch? Das Kino ist hier in Bremen. Grüße, Mia', 'Mia geht heute ins Kino.', true, 'ich gehe heute ins Kino.', 'Mia is going to the cinema; Sara is working.'],
  ],
  [
    ['ad', 'Suppe bei Frau Novak: Die Suppe kostet hier vier Euro, der Salat fünf Euro. Wir haben auch Mineralwasser. Bitte kommen Sie um zwölf Uhr zum Essen.', 'Die Suppe kostet hier vier Euro.', true, 'Die Suppe kostet hier vier Euro', 'Soup is four euros; salad is five.'],
    ['message', 'Hallo Ben, ich trinke nicht gern Kaffee. Bitte Tee für mich! Frau Becker trinkt gern Kaffee und möchte auch Brot. Wir kommen zum Frühstück. Grüße, Mia', 'Mia trinkt nicht gern Kaffee.', true, 'ich trinke nicht gern Kaffee.', 'Mia explicitly dislikes coffee; Becker likes it.'],
    ['notice', 'Die Pause ist heute um zehn Uhr! Wir haben Kuchen und Brot. Herr Seidel hat Mineralwasser für alle. Bitte kommen Sie pünktlich, wir arbeiten um elf Uhr.', 'Die Pause ist um elf Uhr.', false, 'Die Pause ist heute um zehn Uhr!', 'The break is at ten; work resumes at eleven.'],
    ['message', 'Guten Tag, Frau Brandt! Ich habe Hunger und möchte Suppe. Salat möchte ich nicht. Ali möchte Salat und ein Glas Wasser. Grüße, Thomas', 'Thomas möchte Salat, nicht Suppe.', false, 'Salat möchte ich nicht.', 'Thomas explicitly declines salad; Ali wants it.'],
  ],
  [
    ['message', 'Hallo Jonas, Frau Lorenz schwimmt nicht gern. Sie tanzt gern. Ich schwimme am Sonntag. Hast du am Sonntag Zeit? Kommst du auch? Grüße, Sara', 'Frau Lorenz schwimmt gern.', false, 'Frau Lorenz schwimmt nicht gern.', 'Lorenz explicitly dislikes swimming and likes dancing.'],
    ['message', 'Frau Becker, die Chefin arbeitet am Mittwoch. Sie hat am Donnerstag frei. Ich habe am Mittwoch frei und komme dann zu Ihnen. Grüße, Herr Seidel', 'Die Chefin arbeitet am Donnerstag.', false, 'Sie hat am Donnerstag frei.', 'The boss has Thursday off and works Wednesday.'],
    ['notice', 'Fußball am Wochenende: Herr Novak spielt am Samstag. Am Sonntag spielt Herr Meyer. Herr Novak und Herr Meyer kommen um zehn Uhr. Spielen Sie auch? Bitte kommen Sie pünktlich!', 'Herr Novak spielt am Samstag.', true, 'Herr Novak spielt am Samstag.', 'Novak plays Saturday; Meyer plays Sunday.'],
    ['ad', 'Deutsch und Musik mit Frau Brandt! Frau Brandt hört gern Musik und spricht Deutsch mit Ihnen. Wir hören zusammen Musik. Haben Sie am Freitag Zeit? Bitte Mail an Frau Brandt.', 'Frau Brandt hört gern Musik.', true, 'Frau Brandt hört gern Musik', 'The offer invites readers to listen to music and speak German with Brandt on Friday.'],
  ],
  [
    ['ad', 'Fahrt nach Berlin: Der Bus fährt um acht Uhr. Die Fahrkarte kostet zwanzig Euro. Kinder zahlen zehn Euro. Bitte kaufen Sie die Fahrkarte am Bahnhof.', 'Die Fahrkarte kostet dreißig Euro.', false, 'Die Fahrkarte kostet zwanzig Euro.', 'The regular ticket costs twenty euros and the child ticket ten; neither costs thirty.'],
    ['notice', 'Der Zug nach Köln fährt heute von Gleis vier. Bitte nicht zu Gleis drei gehen! Der Zug nach Berlin fährt von Gleis drei. Abfahrt nach Köln: neun Uhr.', 'Der Zug nach Köln fährt von Gleis vier.', true, 'Der Zug nach Köln fährt heute von Gleis vier.', 'Cologne departs from platform four; Berlin uses platform three.'],
    ['message', 'Hallo Ben, meine Ankunft in Bremen ist um zehn Uhr. Meine Abfahrt in Köln ist schon um sieben Uhr. Holst du mich am Bahnhof ab? Grüße, Mia', 'Mia kommt um zehn Uhr.', true, 'meine Ankunft in Bremen ist um zehn Uhr.', 'Mia arrives at ten; seven is her departure time.'],
    ['message', 'Hallo Sara, ich fahre um acht Uhr mit dem Bus nach Berlin. Der Zug fährt nicht nach Berlin, er fährt nach Köln. Kommst du auch nach Berlin? Grüße, Jonas', 'Jonas fährt um acht Uhr mit dem Zug.', false, 'ich fahre um acht Uhr mit dem Bus nach Berlin.', 'Jonas takes the bus to Berlin; the train goes to Cologne.'],
  ],
  [
    ['message', 'Mia, ich kaufe ein Buch für Sara. Eine Karte kaufe ich nicht. Jonas hat schon eine Karte für sie. Wir kommen auch am Freitag. Grüße, Ben', 'Ben kauft eine Karte für Sara.', false, 'Eine Karte kaufe ich nicht.', 'Ben explicitly does not buy a card; Jonas already has one.'],
    ['message', 'Hallo Jonas! Meine Schwester bringt Wein mit. Mein Bruder bringt Kuchen, aber nicht Wein mit. Wir feiern am Samstag bei Frau Becker. Kommst du? Grüße, Sara', 'Die Schwester bringt Wein mit.', true, 'Meine Schwester bringt Wein mit.', 'Sara’s sister brings wine; her brother brings cake.'],
    ['ad', 'Kuchen für Ihre Party: Frau Novak hat am Freitag Zeit und macht Kuchen für zwanzig Euro. Am Samstag arbeitet sie nicht. Bitte rufen Sie Frau Novak an.', 'Frau Novak arbeitet am Samstag nicht.', true, 'Am Samstag arbeitet sie nicht.', 'Novak explicitly does not work Saturday; the offer is for Friday.'],
    ['notice', 'Die Party bei Frau Becker ist am Sonntag, nicht am Samstag. Bitte bringen Sie kein Geschenk mit! Kuchen und Wein sind schon hier. Wir feiern zusammen!', 'Die Party ist nicht am Sonntag.', false, 'Die Party bei Frau Becker ist am Sonntag, nicht am Samstag.', 'The notice moves the party to Sunday and explicitly excludes Saturday.'],
  ],
  [
    ['notice', 'Frau Brandt ist heute nicht im Büro. Frau Brandt arbeitet morgen ab neun Uhr. Herr Seidel kommt um zehn Uhr. Bitte kommen Sie morgen oder rufen Sie an.', 'Frau Brandt arbeitet morgen ab neun Uhr.', true, 'Frau Brandt arbeitet morgen ab neun Uhr.', 'Brandt starts at nine tomorrow; Seidel arrives at ten.'],
    ['message', 'Hallo Ben, ich rufe um neun Uhr meine Schwester an. Mia ruft meine Schwester um zehn Uhr an. Die Kinder und ich kommen später zu dir. Grüße, Jonas', 'Jonas ruft um zehn Uhr die Schwester an.', false, 'ich rufe um neun Uhr meine Schwester an.', 'Jonas calls his sister at nine; Mia calls Jonas’s sister at ten.'],
    ['ad', 'Bücher für Kinder: Ich verkaufe drei Bücher zusammen für zehn Euro. Ein Wörterbuch kostet zwanzig Euro. Bitte nicht vor neun Uhr anrufen. Frau Meyer', 'Drei Bücher kosten zusammen zehn Euro.', true, 'Ich verkaufe drei Bücher zusammen für zehn Euro.', 'The three books together cost ten euros; twenty is the dictionary’s price.'],
    ['message', 'Sara, meine Mama arbeitet heute. Mein Papa hat frei und kocht Suppe. Mama hat morgen frei. Wir essen heute um eins, nicht um zwei Uhr. Kommst du auch? Grüße, Mia', 'Mia isst heute um zwei Uhr.', false, 'Wir essen heute um eins, nicht um zwei Uhr.', 'Mia explicitly gives one o’clock for their meal, not two.'],
  ],
  [
    ['notice', 'Abfahrt nach Österreich heute um elf Uhr! Der Bus um zehn Uhr fährt in die Schweiz. Fahrkarten für die Schweiz: beim Fahrer. Fahrkarten nach Österreich: am Bahnhof.', 'Der Bus um zehn Uhr fährt nach Österreich.', false, 'Der Bus um zehn Uhr fährt in die Schweiz.', 'The ten o’clock bus goes to Switzerland; Austria departs at eleven.'],
    ['message', 'Hallo Ali, das Buch ist von Frau Brandt. Die Karte ist von Ben. Buch und Karte sind für dich zum Geburtstag. Wir kommen am Sonntag! Grüße, Sara', 'Das Buch ist von Frau Brandt.', true, 'das Buch ist von Frau Brandt.', 'Brandt sent the book; Ben sent the card.'],
    ['message', 'Guten Morgen, Jonas! Herr Seidel feiert am Freitag. Frau Novak feiert schon am Montag. Ich komme am Freitag mit und bringe Kuchen mit. Grüße, Mia', 'Herr Seidel feiert am Montag.', false, 'Herr Seidel feiert am Freitag.', 'Seidel celebrates Friday; Novak celebrates Monday.'],
    ['ad', 'Am Sonntag fahren wir nach Bremen. Die Fahrt kostet zehn Euro. Am Samstag fahren wir nicht. Kommen Sie mit! Bitte rufen Sie Frau Becker an.', 'Die Fahrt kostet zehn Euro.', true, 'Die Fahrt kostet zehn Euro.', 'The Sunday trip costs ten euros; there is no Saturday departure.'],
  ],
];

export const LESEN_A11 = Object.fromEntries([1, 2, 3, 4].map((cp) => [`a1.1-cp${cp}`, {
  papers: papers.slice((cp - 1) * 4, cp * 4).map((paper, round) => paper.map(([type, text, statement, right, evidence, rival], i) => ({
    id: `a11-cp${cp}-p${round + 1}-u${i + 1}`, type, format: 'trueFalse', text,
    statement, question: `Steht das im Text? „${statement}“`, questionEn: 'Does the text say this?',
    options: ['Richtig', 'Falsch'], answer: right ? 'Richtig' : 'Falsch', evidence, rival,
    explanationDe: `„${evidence}“`, explanationEn: rival,
  }))),
}]));
