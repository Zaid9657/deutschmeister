// Start Deutsch 1-style messages, offers and notices, within each A1.1 checkpoint.
// Each row is [type, text, statement, key, evidence, English exclusion rationale].
// Authored keys, reviewed blind before they shipped (tests/fixtures/a11-lesen-review.json): a changed unit
// needs that independent review again before it ships.
const papers = [
  [
    ['message', 'Hallo Lena, Ana wohnt in Bremen. Ihre Eltern wohnen auch in Bremen. Ich wohne in Berlin. Kommst du auch nach Berlin? Grüße, Tim', 'Ana wohnt in Bremen.', true, 'Ana wohnt in Bremen.', 'Ana lives in Bremen; Berlin is Tim’s home.'],
    ['message', 'Frau Kaya, guten Morgen! Tim kommt aus Österreich und wohnt in Berlin. Die Familie von Tim wohnt in Bremen. Grüße, Herr Berg', 'Tim wohnt in Bremen.', false, 'Tim kommt aus Österreich und wohnt in Berlin.', 'Tim lives in Berlin. Bremen is where his family lives.'],
    ['sign', 'Amt: Herr Weber ist hier. Frau Kaya ist nicht hier. Formulare bitte hier ausfüllen: Name, Adresse und Familienstand.', 'Herr Weber ist hier.', true, 'Herr Weber ist hier.', 'The notice directs visitors to Weber; Kaya is absent.'],
    ['ad', 'Englisch mit Lena! Lena spricht Englisch, aber nicht Deutsch. Sprichst du Deutsch und auch Englisch? Wir sprechen zusammen! Telefonnummer: 0173 2468501.', 'Lena spricht auch Deutsch.', false, 'Lena spricht Englisch, aber nicht Deutsch.', 'Lena explicitly says she does not speak German.'],
  ],
  [
    ['ad', 'Deutsch mit Frau Wolf! Frau Wolf ist Lehrerin aus Österreich, nicht Studentin. Sie spricht auch Arabisch. Sie wohnen in Köln? Frau Wolf wohnt hier. Telefonnummer: 0176 3582604.', 'Frau Wolf ist Studentin.', false, 'Frau Wolf ist Lehrerin aus Österreich, nicht Studentin.', 'The offer explicitly identifies Wolf as a teacher and not a student.'],
    ['message', 'Hallo Paul, Ali ist acht, Lena ist schon zehn. Die Kinder sprechen Deutsch und Englisch. Wie alt ist die Tochter von Frau Kaya? Grüße, Thomas', 'Ali ist schon zehn.', false, 'Ali ist acht', 'Ali is eight; Lena is ten.'],
    ['notice', 'Frau Berger ist verheiratet und wohnt in Bremen. Bitte für das Formular nicht die Adresse von Frau Wolf: Sie wohnt in Berlin.', 'Frau Berger ist verheiratet.', true, 'Frau Berger ist verheiratet und wohnt in Bremen.', 'The form note gives Berger’s marital status and distinguishes her address from Wolf’s.'],
    ['message', 'Guten Abend, Lena! Paul ist schon zehn. Er spricht Deutsch und Englisch. Die Schwester von Paul ist acht und spricht Deutsch. Grüße, Ana', 'Paul ist schon zehn.', true, 'Paul ist schon zehn.', 'Paul is ten; the eight-year-old is his sister.'],
  ],
  [
    ['message', 'Hallo Ali! Lena wohnt in Polen. Thomas und ich wohnen nicht in Polen, wir wohnen in Berlin. Kommst du auch nach Berlin? Grüße, Paul', 'Lena wohnt in Polen.', true, 'Lena wohnt in Polen.', 'Lena lives in Poland; Paul and Thomas live in Berlin.'],
    ['sign', 'Frau Schmidt wohnt nicht hier. Frau Brandt ist hier und spricht auch Englisch. Bitte sprechen Sie mit Frau Brandt.', 'Frau Schmidt wohnt hier.', false, 'Frau Schmidt wohnt nicht hier.', 'The sign explicitly says Schmidt does not live here.'],
    ['ad', 'Deutsch mit Thomas: Thomas kommt aus Italien und spricht Deutsch und Englisch. Sprichst du auch Englisch? Wir sprechen zusammen Deutsch und Englisch! Wohnort: Bremen. Telefonnummer: 0172 5328640.', 'Thomas kommt aus Italien.', true, 'Thomas kommt aus Italien und spricht Deutsch und Englisch.', 'The writer is Thomas and gives Italy as his country of origin.'],
    ['message', 'Guten Tag, Herr Berg! Frau Kaya kommt aus Marokko. Sie ist Lehrerin, nicht Studentin. Ihre Tochter kommt aus Deutschland und ist Studentin. Grüße, Frau Wolf', 'Frau Kaya ist Studentin.', false, 'Sie ist Lehrerin, nicht Studentin.', 'Kaya is explicitly not a student; her daughter is the student.'],
  ],
  [
    ['notice', 'Hier wohnt Familie Weber, nicht Familie Wolf. Frau Wolf wohnt in Berlin. Bitte sprechen Sie mit Frau Weber.', 'Hier wohnt Familie Wolf.', false, 'Hier wohnt Familie Weber, nicht Familie Wolf.', 'The sign identifies the resident family as Weber and explicitly excludes Wolf.'],
    ['message', 'Hallo Ana, Herr Brandt kommt aus Spanien und wohnt in Köln. Frau Brandt kommt aus Italien. Sie spricht Deutsch mit mir. Grüße, Tim', 'Herr Brandt kommt aus Spanien.', true, 'Herr Brandt kommt aus Spanien', 'Brandt is from Spain; Frau Brandt is from Italy.'],
    ['ad', 'Arabisch mit Ali: Ali spricht Arabisch und Englisch. Er wohnt in Bremen, nicht in Köln. Du wohnst auch in Bremen? Telefonnummer: 0421 5826349.', 'Ali wohnt auch in Köln.', false, 'Er wohnt in Bremen, nicht in Köln.', 'Ali explicitly lives in Bremen, not Cologne.'],
    ['message', 'Frau Berger, Paul wohnt mit Frau Brandt in Berlin. Herr Brandt wohnt in Österreich. Grüße, Lena', 'Paul wohnt in Berlin.', true, 'Paul wohnt mit Frau Brandt in Berlin.', 'Paul lives with Frau Brandt in Berlin; Herr Brandt lives in Austria.'],
  ],
  [
    ['ad', 'Ich verkaufe einen Tisch und einen Stuhl. Der Tisch kostet zwanzig Euro, der Stuhl acht Euro. Tisch und Stuhl sind weiß. Bitte Mail an Frau Wolf.', 'Der Stuhl kostet acht Euro.', true, 'der Stuhl acht Euro.', 'The chair costs eight euros; the table costs twenty.'],
    ['message', 'Hallo Tim, die Tasche ist für Ana. Der Rucksack ist hier im Büro. Die Tasche kostet zwölf Euro, der Rucksack kostet zwanzig Euro. Grüße, Paul', 'Die Tasche kostet zwanzig Euro.', false, 'Die Tasche kostet zwölf Euro', 'The bag costs twelve euros; twenty is the backpack’s price.'],
    ['sign', 'Büro Frau Kaya: Frau Kaya ist nicht im Büro. Frau Wolf ist hier und hat das Telefon. Bitte sprechen Sie mit Frau Wolf.', 'Frau Kaya ist im Büro.', false, 'Frau Kaya ist nicht im Büro.', 'The sign explicitly says Kaya is absent; Wolf is here.'],
    ['message', 'Guten Tag, Frau Brandt, Ihr Wörterbuch ist im Büro. Das Heft ist nicht hier, es ist bei Frau Kaya. Brauchen Sie auch Papier? Das Papier ist hier. Grüße, Lena', 'Das Wörterbuch ist im Büro.', true, 'Ihr Wörterbuch ist im Büro.', 'The dictionary is in the office; Kaya has the exercise book.'],
  ],
  [
    ['message', 'Hallo Paul, der Stuhl ist schwarz. Ich brauche den Stuhl für das Büro. Der Tisch ist weiß und ist für Ana. Grüße, Lena', 'Der Stuhl ist schwarz.', true, 'der Stuhl ist schwarz.', 'Paul’s chair is black; the table is white.'],
    ['ad', 'Lampe für das Büro: acht Euro! Die Lampe ist weiß. Das Regal ist braun und kostet dreißig Euro. Ich verkaufe auch Bücher. Frau Brandt, Telefonnummer 0174 5236802.', 'Die Lampe für das Büro ist braun.', false, 'Die Lampe ist weiß.', 'The lamp is white; brown describes the shelf.'],
    ['message', 'Frau Wolf, Ihre Tasche ist hier bei mir. Die Tasche ist blau. Das Bild ist rot und ist von Tim. Brauchen Sie das Bild auch? Grüße, Ana', 'Die Tasche ist rot.', false, 'Die Tasche ist blau.', 'The bag is blue; the picture is red.'],
    ['notice', 'Die Uhr für Frau Kaya ist schwarz und kostet zehn Euro. Die Uhr für Frau Schmidt ist weiß. Bitte die Uhr für Frau Kaya kaufen!', 'Die Uhr für Frau Kaya ist schwarz.', true, 'Die Uhr für Frau Kaya ist schwarz und kostet zehn Euro.', 'The order notice assigns the black clock to Kaya and the white clock to Schmidt.'],
  ],
  [
    ['sign', 'Frau Schmidt hat die Nummer drei zwei fünf. Bitte nicht die Nummer drei zwei vier! Die Nummer ist von Frau Wolf. Frau Schmidt ist hier im Büro.', 'Frau Schmidt hat die Nummer drei zwei fünf.', true, 'Frau Schmidt hat die Nummer drei zwei fünf.', 'The notice gives Schmidt’s telephone contact and distinguishes Wolf’s number.'],
    ['message', 'Hallo Ana! Das Lineal ist für Tim. Ich brauche die Schere für das Büro. Bitte auch einen Stift für mich! Danke und Grüße, Paul', 'Das Lineal ist für Tim.', true, 'Das Lineal ist für Tim.', 'The ruler is for Tim; the scissors are for Paul’s office.'],
    ['ad', 'Ich verkaufe ein Handy. Das Handy kostet vierzig Euro. Der Computer kostet hundert Euro. Handy und Computer sind von der Firma. Brauchen Sie ein Handy? Bitte Mail an Frau Wolf.', 'Das Handy kostet hundert Euro.', false, 'Das Handy kostet vierzig Euro.', 'The mobile phone costs forty euros; one hundred is the computer’s price.'],
    ['message', 'Hallo Frau Schmidt! Das Buch ist für Tim, nicht für Frau Wolf. Ana hat schon ein Buch. Das Heft ist für Ana. Grüße, Herr Berg', 'Das Buch ist für Frau Wolf.', false, 'Das Buch ist für Tim, nicht für Frau Wolf.', 'The book is explicitly for Tim, not Wolf; Ana gets the exercise book.'],
  ],
  [
    ['message', 'Hallo Lena, Herr Weber ist Ingenieur. Er ist nicht der Chef. Die Chefin heißt Frau Brandt. Ich brauche ihre Telefonnummer für das Formular. Grüße, Tim', 'Herr Weber ist nicht Ingenieur.', false, 'Herr Weber ist Ingenieur.', 'Weber is explicitly an engineer; Brandt is the boss.'],
    ['notice', 'Firma Berg: Frau Kaya ist nicht hier im Büro. Bitte sprechen Sie mit Frau Wolf. Sie ist Verkäuferin und hat die Telefonnummer von Frau Kaya.', 'Frau Kaya ist hier im Büro.', false, 'Frau Kaya ist nicht hier im Büro.', 'The notice explicitly says Kaya is absent from the office.'],
    ['message', 'Frau Schmidt, die Chefin ist hier im Büro. Der Kollege ist bei Frau Wolf. Brauchen Sie den Computer? Das Telefon ist auch hier. Grüße, Paul', 'Die Chefin ist hier im Büro.', true, 'die Chefin ist hier im Büro.', 'The boss is in this office; the colleague is with Wolf.'],
    ['ad', 'Bücher für das Büro: Das Wörterbuch ist neu. Ich verkaufe es für zwölf Euro. Das Heft ist nicht neu und kostet einen Euro. Mail an Frau Berger.', 'Das Heft ist nicht neu.', true, 'Das Heft ist nicht neu', 'The exercise book is explicitly not new; the dictionary is new.'],
  ],
  [
    ['notice', 'Termin bei Frau Kaya: Bitte um elf Uhr kommen. Frau Kaya arbeitet heute bis zehn Uhr bei der Firma Wolf. Sie hat um elf Uhr Zeit.', 'Frau Kaya hat um elf Uhr Zeit.', true, 'Sie hat um elf Uhr Zeit.', 'Kaya is available at eleven, after her work at Wolf.'],
    ['message', 'Hallo Lena, der Termin ist am Dienstag. Am Montag habe ich frei und arbeite nicht. Hast du am Montag auch Zeit? Wir gehen ins Kino! Grüße, Tim', 'Tim hat am Montag frei.', true, 'Am Montag habe ich frei und arbeite nicht.', 'Tim is free on Monday; his appointment is on Tuesday.'],
    ['ad', 'Frühstück bei Frau Wolf: Brot und Kaffee für fünf Euro. Tee kostet zwei Euro. Wir haben morgens Zeit für Sie. Kommen Sie zum Frühstück!', 'Der Tee kostet fünf Euro.', false, 'Tee kostet zwei Euro.', 'Tea costs two euros; five is the breakfast price.'],
    ['message', 'Guten Morgen, Herr Berg! Ich arbeite am Montag. Die Pause ist um zwölf Uhr, nicht um zehn Uhr. Die Kollegin hat am Dienstag frei. Haben Sie dann Zeit? Grüße, Frau Brandt', 'Frau Brandt hat am Montag frei.', false, 'Ich arbeite am Montag.', 'Brandt works on Monday, so she does not have that day off.'],
  ],
  [
    ['message', 'Hallo Ana, ich bin heute krank. Wir gehen nicht ins Kino. Ich habe am Freitag Zeit. Gehen wir dann? Grüße, Paul', 'Paul geht heute ins Kino.', false, 'Wir gehen nicht ins Kino.', 'Paul cancels today’s cinema outing because he is ill.'],
    ['notice', 'Wir arbeiten heute im Büro bis zwölf Uhr. Frau Wolf arbeitet bis elf Uhr. Bitte kommen Sie vor zwölf Uhr. Nachmittags haben wir Pause.', 'Wir arbeiten im Büro bis zwölf Uhr.', true, 'Wir arbeiten heute im Büro bis zwölf Uhr.', 'The office staff work until twelve; Wolf finishes at eleven.'],
    ['ad', 'Kuchen und Brot von Frau Schmidt: Der Kuchen kostet zehn Euro. Das Brot kostet drei Euro. Frau Schmidt arbeitet morgens und hat nachmittags frei.', 'Der Kuchen von Frau Schmidt kostet drei Euro.', false, 'Der Kuchen kostet zehn Euro.', 'The cake costs ten euros; three is the bread price.'],
    ['message', 'Tim, ich gehe heute ins Kino. Ana hat nicht frei und arbeitet. Kommst du auch? Das Kino ist hier in Bremen. Grüße, Lena', 'Lena geht heute ins Kino.', true, 'ich gehe heute ins Kino.', 'Lena is going to the cinema; Ana is working.'],
  ],
  [
    ['ad', 'Suppe bei Frau Kaya: Die Suppe kostet hier vier Euro, der Salat fünf Euro. Wir haben auch Mineralwasser. Bitte kommen Sie um zwölf Uhr zum Essen.', 'Die Suppe kostet hier vier Euro.', true, 'Die Suppe kostet hier vier Euro', 'Soup is four euros; salad is five.'],
    ['message', 'Hallo Paul, ich trinke nicht gern Kaffee. Bitte Tee für mich! Frau Wolf trinkt gern Kaffee und möchte auch Brot. Wir kommen zum Frühstück. Grüße, Lena', 'Lena trinkt nicht gern Kaffee.', true, 'ich trinke nicht gern Kaffee.', 'Lena explicitly dislikes coffee; Wolf likes it.'],
    ['notice', 'Die Pause ist heute um zehn Uhr! Wir haben Kuchen und Brot. Herr Berg hat Mineralwasser für alle. Bitte kommen Sie pünktlich, wir arbeiten um elf Uhr.', 'Die Pause ist um elf Uhr.', false, 'Die Pause ist heute um zehn Uhr!', 'The break is at ten; work resumes at eleven.'],
    ['message', 'Guten Tag, Frau Brandt! Ich habe Hunger und möchte Suppe. Salat möchte ich nicht. Ali möchte Salat und ein Glas Wasser. Grüße, Thomas', 'Thomas möchte Salat, nicht Suppe.', false, 'Salat möchte ich nicht.', 'Thomas explicitly declines salad; Ali wants it.'],
  ],
  [
    ['message', 'Hallo Tim, Frau Berger schwimmt nicht gern. Sie tanzt gern. Ich schwimme am Sonntag. Hast du am Sonntag Zeit? Kommst du auch? Grüße, Ana', 'Frau Berger schwimmt gern.', false, 'Frau Berger schwimmt nicht gern.', 'Berger explicitly dislikes swimming and likes dancing.'],
    ['message', 'Frau Wolf, die Chefin arbeitet am Mittwoch. Sie hat am Donnerstag frei. Ich habe am Mittwoch frei und komme dann zu Ihnen. Grüße, Herr Berg', 'Die Chefin arbeitet am Donnerstag.', false, 'Sie hat am Donnerstag frei.', 'The boss has Thursday off and works Wednesday.'],
    ['notice', 'Fußball am Wochenende: Herr Kaya spielt am Samstag. Am Sonntag spielt Herr Schmidt. Herr Kaya und Herr Schmidt kommen um zehn Uhr. Spielen Sie auch? Bitte kommen Sie pünktlich!', 'Herr Kaya spielt am Samstag.', true, 'Herr Kaya spielt am Samstag.', 'Kaya plays Saturday; Schmidt plays Sunday.'],
    ['ad', 'Deutsch und Musik mit Frau Brandt! Frau Brandt hört gern Musik und spricht Deutsch mit Ihnen. Wir hören zusammen Musik. Haben Sie am Freitag Zeit? Bitte Mail an Frau Brandt.', 'Frau Brandt hört gern Musik.', true, 'Frau Brandt hört gern Musik', 'The offer invites readers to listen to music and speak German with Brandt on Friday.'],
  ],
  [
    ['ad', 'Fahrt nach Berlin: Der Bus fährt um acht Uhr. Die Fahrkarte kostet zwanzig Euro. Kinder zahlen zehn Euro. Bitte kaufen Sie die Fahrkarte am Bahnhof.', 'Die Fahrkarte kostet dreißig Euro.', false, 'Die Fahrkarte kostet zwanzig Euro.', 'The regular ticket costs twenty euros and the child ticket ten; neither costs thirty.'],
    ['notice', 'Der Zug nach Köln fährt heute von Gleis vier. Bitte nicht zu Gleis drei gehen! Der Zug nach Berlin fährt von Gleis drei. Abfahrt nach Köln: neun Uhr.', 'Der Zug nach Köln fährt von Gleis vier.', true, 'Der Zug nach Köln fährt heute von Gleis vier.', 'Cologne departs from platform four; Berlin uses platform three.'],
    ['message', 'Hallo Paul, meine Ankunft in Bremen ist um zehn Uhr. Meine Abfahrt in Köln ist schon um sieben Uhr. Holst du mich am Bahnhof ab? Grüße, Lena', 'Lena kommt um zehn Uhr.', true, 'meine Ankunft in Bremen ist um zehn Uhr.', 'Lena arrives at ten; seven is her departure time.'],
    ['message', 'Hallo Ana, ich fahre um acht Uhr mit dem Bus nach Berlin. Der Zug fährt nicht nach Berlin, er fährt nach Köln. Kommst du auch nach Berlin? Grüße, Tim', 'Tim fährt um acht Uhr mit dem Zug.', false, 'ich fahre um acht Uhr mit dem Bus nach Berlin.', 'Tim takes the bus to Berlin; the train goes to Cologne.'],
  ],
  [
    ['message', 'Lena, ich kaufe ein Buch für Ana. Eine Karte kaufe ich nicht. Tim hat schon eine Karte für sie. Wir kommen auch am Freitag. Grüße, Paul', 'Paul kauft eine Karte für Ana.', false, 'Eine Karte kaufe ich nicht.', 'Paul explicitly does not buy a card; Tim already has one.'],
    ['message', 'Hallo Tim! Meine Schwester bringt Wein mit. Mein Bruder bringt Kuchen, aber nicht Wein mit. Wir feiern am Samstag bei Frau Wolf. Kommst du? Grüße, Ana', 'Die Schwester bringt Wein mit.', true, 'Meine Schwester bringt Wein mit.', 'Ana’s sister brings wine; her brother brings cake.'],
    ['ad', 'Kuchen für Ihre Party: Frau Kaya hat am Freitag Zeit und macht Kuchen für zwanzig Euro. Am Samstag arbeitet sie nicht. Bitte rufen Sie Frau Kaya an.', 'Frau Kaya arbeitet am Samstag nicht.', true, 'Am Samstag arbeitet sie nicht.', 'Kaya explicitly does not work Saturday; the offer is for Friday.'],
    ['notice', 'Die Party bei Frau Wolf ist am Sonntag, nicht am Samstag. Bitte bringen Sie kein Geschenk mit! Kuchen und Wein sind schon hier. Wir feiern zusammen!', 'Die Party ist nicht am Sonntag.', false, 'Die Party bei Frau Wolf ist am Sonntag, nicht am Samstag.', 'The notice moves the party to Sunday and explicitly excludes Saturday.'],
  ],
  [
    ['notice', 'Frau Brandt ist heute nicht im Büro. Frau Brandt arbeitet morgen ab neun Uhr. Herr Berg kommt um zehn Uhr. Bitte kommen Sie morgen oder rufen Sie an.', 'Frau Brandt arbeitet morgen ab neun Uhr.', true, 'Frau Brandt arbeitet morgen ab neun Uhr.', 'Brandt starts at nine tomorrow; Berg arrives at ten.'],
    ['message', 'Hallo Paul, ich rufe um neun Uhr meine Schwester an. Lena ruft meine Schwester um zehn Uhr an. Die Kinder und ich kommen später zu dir. Grüße, Tim', 'Tim ruft um zehn Uhr die Schwester an.', false, 'ich rufe um neun Uhr meine Schwester an.', 'Tim calls his sister at nine; Lena calls Tim’s sister at ten.'],
    ['ad', 'Bücher für Kinder: Ich verkaufe drei Bücher zusammen für zehn Euro. Ein Wörterbuch kostet zwanzig Euro. Bitte nicht vor neun Uhr anrufen. Frau Schmidt', 'Drei Bücher kosten zusammen zehn Euro.', true, 'Ich verkaufe drei Bücher zusammen für zehn Euro.', 'The three books together cost ten euros; twenty is the dictionary’s price.'],
    ['message', 'Ana, meine Mama arbeitet heute. Mein Papa hat frei und kocht Suppe. Mama hat morgen frei. Wir essen heute um eins, nicht um zwei Uhr. Kommst du auch? Grüße, Lena', 'Lena isst heute um zwei Uhr.', false, 'Wir essen heute um eins, nicht um zwei Uhr.', 'Lena explicitly gives one o’clock for their meal, not two.'],
  ],
  [
    ['notice', 'Abfahrt nach Österreich heute um elf Uhr! Der Bus um zehn Uhr fährt in die Schweiz. Fahrkarten für die Schweiz: beim Fahrer. Fahrkarten nach Österreich: am Bahnhof.', 'Der Bus um zehn Uhr fährt nach Österreich.', false, 'Der Bus um zehn Uhr fährt in die Schweiz.', 'The ten o’clock bus goes to Switzerland; Austria departs at eleven.'],
    ['message', 'Hallo Ali, das Buch ist von Frau Brandt. Die Karte ist von Paul. Buch und Karte sind für dich zum Geburtstag. Wir kommen am Sonntag! Grüße, Ana', 'Das Buch ist von Frau Brandt.', true, 'das Buch ist von Frau Brandt.', 'Brandt sent the book; Paul sent the card.'],
    ['message', 'Guten Morgen, Tim! Herr Berg feiert am Freitag. Frau Kaya feiert schon am Montag. Ich komme am Freitag mit und bringe Kuchen mit. Grüße, Lena', 'Herr Berg feiert am Montag.', false, 'Herr Berg feiert am Freitag.', 'Berg celebrates Friday; Kaya celebrates Monday.'],
    ['ad', 'Am Sonntag fahren wir nach Bremen. Die Fahrt kostet zehn Euro. Am Samstag fahren wir nicht. Kommen Sie mit! Bitte rufen Sie Frau Wolf an.', 'Die Fahrt kostet zehn Euro.', true, 'Die Fahrt kostet zehn Euro.', 'The Sunday trip costs ten euros; there is no Saturday departure.'],
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
