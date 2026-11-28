// Start Deutsch 1-style messages, offers and notices, within each A1.1 checkpoint.
// A paper has four texts: two statements (Richtig/Falsch, in no fixed number of each) and two questions
// with three answers, every answer in the text. Start Deutsch 1 has both formats. The papers before
// (2026-11-25) had four statements, always two of each, and „every word of the statement stands in the
// text → Richtig" passed eleven of the sixteen; the gate (scripts/a11-lesen-check.mjs) now declares that
// strategy and the shortcuts of a three-answer question.
//   said(type, text, statement, key, evidence, English reason)
//   asks(type, text, question, English question, [three answers], index of the key, evidence, English reason)
// Authored keys, reviewed blind before they shipped (tests/fixtures/a11-lesen-review.json): a changed unit
// needs that independent review again before it ships.
const said = (type, text, statement, right, evidence, rival) => ({
  type, format: 'trueFalse', text, statement,
  question: `Richtig oder falsch? „${statement}“`, questionEn: 'True or false, according to the text?',
  options: ['Richtig', 'Falsch'], answer: right ? 'Richtig' : 'Falsch', evidence, rival,
});
const asks = (type, text, question, questionEn, options, at, evidence, rival) => ({
  type, format: 'choice', text, question, questionEn, options, answer: options[at], evidence, rival,
});

const papers = [
  // ── Checkpoint 1: Lektion 1–3 ──
  [
    asks('message', 'Hallo Mia, Sara wohnt in Bremen. Ihre Eltern wohnen auch in Bremen. Ich wohne in Köln und komme aus Polen. Kommst du auch nach Bremen? Grüße, Jonas', 'Wo wohnt Jonas?', 'Where does Jonas live?', ['In Bremen.', 'In Polen.', 'In Köln.'], 2, 'Ich wohne in Köln und komme aus Polen.', 'Jonas writes “ich”: he lives in Cologne. Bremen is Sara’s home, Poland is where he comes from.'),
    said('ad', 'Englisch mit Mia! Mia spricht Englisch und Arabisch, aber noch nicht Deutsch. Sprechen Sie Deutsch? Dann sprechen wir zusammen! Telefonnummer: 0173 2468501.', 'Mia spricht Arabisch, Englisch und Deutsch.', false, 'Mia spricht Englisch und Arabisch, aber noch nicht Deutsch.', 'Mia does not speak German yet.'),
    said('sign', 'Amt Bremen: Herr Krause ist hier, Frau Novak kommt morgen. Formulare bitte hier ausfüllen: Vorname, Nachname, Adresse und Familienstand.', 'Frau Novak ist noch nicht da.', true, 'Frau Novak kommt morgen.', 'Frau Novak comes tomorrow, so she is not there yet.'),
    asks('message', 'Guten Abend, Frau Becker! Ali ist drei, Mia ist neun. Die Kinder sprechen Deutsch und Englisch. Die Tochter von Frau Novak ist schon zehn. Grüße, Sara', 'Wie alt ist Mia?', 'How old is Mia?', ['Drei.', 'Neun.', 'Zehn.'], 1, 'Mia ist neun.', 'Mia is nine; Ali is three and Frau Novak’s daughter is ten.'),
  ],
  [
    said('ad', 'Arabisch mit Ali! Ali kommt aus Marokko und wohnt in Bremen. Er ist Student und spricht Arabisch, Deutsch und Englisch. Sprechen wir zusammen Arabisch? Telefonnummer: 0421 5826349.', 'Ali spricht drei Sprachen.', true, 'Er ist Student und spricht Arabisch, Deutsch und Englisch.', 'Arabic, German and English are three languages.'),
    asks('message', 'Hallo Ben, ich bin Sara, die Schwester von Jonas. Jonas wohnt in Köln, ich wohne noch in Berlin. Die Frau von Jonas heißt Mia und wohnt auch in Köln. Bist du Student? Grüße, Sara', 'Wer wohnt in Berlin?', 'Who lives in Berlin?', ['Sara.', 'Mia.', 'Jonas.'], 0, 'ich wohne noch in Berlin.', 'Sara writes “ich wohne noch in Berlin”; Jonas and Mia live in Cologne.'),
    said('sign', 'Deutsch für Kinder! Die Lehrerin heißt Frau Novak und kommt aus Österreich. Bitte hier: Vorname, Nachname und Adresse vom Kind, Telefonnummer vom Vater oder von der Mutter.', 'Frau Novak ist aus Italien.', false, 'Die Lehrerin heißt Frau Novak und kommt aus Österreich.', 'The teacher, Frau Novak, comes from Austria.'),
    asks('message', 'Guten Tag, Frau Meyer! Ich heiße Thomas Vogt, komme aus Österreich und wohne in Köln. Frau Vogt kommt aus Spanien und spricht noch nicht Deutsch. Grüße, Thomas Vogt', 'Woher kommt Thomas Vogt?', 'Where does Thomas Vogt come from?', ['Aus Köln.', 'Aus Österreich.', 'Aus Spanien.'], 1, 'Ich heiße Thomas Vogt, komme aus Österreich und wohne in Köln.', 'He comes from Austria, lives in Cologne, and Frau Vogt comes from Spain.'),
  ],
  [
    said('message', 'Hallo Ali! Mia wohnt in Polen. Ben und Thomas wohnen nicht in Polen, sie wohnen in Berlin. Kommst du auch nach Berlin? Grüße, Sara', 'Mia und Ben wohnen in Berlin.', false, 'Mia wohnt in Polen.', 'Ben lives in Berlin, but Mia lives in Poland.'),
    asks('sign', 'Hier wohnen Familie Krause und Familie Becker. Frau Novak ist nicht hier, sie wohnt in Berlin. Telefonnummer von Frau Novak: 0176 3582604.', 'Wer wohnt nicht hier?', 'Who does not live here?', ['Frau Novak.', 'Familie Becker.', 'Familie Krause.'], 0, 'Frau Novak ist nicht hier, sie wohnt in Berlin.', 'Frau Novak lives in Berlin; the two families live here.'),
    said('ad', 'Deutsch mit Frau Becker! Frau Becker ist Lehrerin aus Österreich. Sie spricht auch Arabisch. Sie wohnen in Köln? Frau Becker wohnt auch hier! Telefonnummer: 0173 5824061.', 'Frau Becker kommt aus Deutschland.', false, 'Frau Becker ist Lehrerin aus Österreich.', 'Frau Becker is a teacher from Austria; she lives in Cologne.'),
    asks('message', 'Frau Krüger, das Kind heißt Jonas Seidel und ist acht. Der Vater heißt Thomas Seidel, die Mutter heißt Sara Novak. Bitte das Formular für Jonas ausfüllen! Danke, Mia', 'Wie heißt die Mutter von Jonas?', 'What is the name of Jonas’s mother?', ['Frau Seidel.', 'Frau Krüger.', 'Frau Novak.'], 2, 'die Mutter heißt Sara Novak.', 'The mother is Sara Novak; Seidel is the father, and the message is to Frau Krüger.'),
  ],
  [
    asks('message', 'Hallo Sara, Herr Krüger kommt aus Spanien und spricht Deutsch. Frau Krüger kommt aus Italien und spricht Arabisch und Englisch, aber noch nicht Deutsch. Ich spreche nicht Arabisch, aber Deutsch und Englisch. Grüße, Ben', 'Welche Sprache spricht Ben mit Frau Krüger?', 'Which language does Ben speak with Frau Krüger?', ['Deutsch.', 'Arabisch.', 'Englisch.'], 2, 'Frau Krüger kommt aus Italien und spricht Arabisch und Englisch, aber noch nicht Deutsch.', 'She speaks Arabic and English but no German yet, he speaks German and English: together they speak English.'),
    said('notice', 'Formular vom Amt. Vorname: Mia. Nachname: Lorenz. Geburtsdatum: 3.5.1998. Familienstand: ledig. Beruf: Studentin. Wohnort: Bremen. Staatsangehörigkeit: marokkanisch.', 'Frau Lorenz ist nicht verheiratet.', true, 'Familienstand: ledig.', 'The form says “ledig”: single, not married.'),
    asks('ad', 'Deutsch in Köln: Mia spricht Deutsch und Arabisch, Sara spricht Deutsch, Englisch und Arabisch, Ben spricht nur Deutsch. Sprechen Sie mit Mia, Sara und Ben!', 'Wer spricht drei Sprachen?', 'Who speaks three languages?', ['Ben.', 'Sara.', 'Mia.'], 1, 'Sara spricht Deutsch, Englisch und Arabisch', 'Sara speaks three languages, Mia two and Ben one.'),
    said('message', 'Frau Lorenz, Ben wohnt mit Frau Krüger in Berlin. Herr Krüger wohnt in Österreich, nicht in Berlin. Er kommt morgen. Grüße, Mia', 'Frau Krüger wohnt in Berlin.', true, 'Ben wohnt mit Frau Krüger in Berlin.', 'Ben lives with Frau Krüger in Berlin; it is Herr Krüger who lives in Austria.'),
  ],
  // ── Checkpoint 2: Lektion 4–6 ──
  [
    asks('ad', 'Ich verkaufe einen Tisch, einen Stuhl und ein Regal. Das Regal ist alt, aber gut: Es kostet zwölf Euro. Der Tisch kostet zwanzig Euro, der Stuhl acht Euro. Frau Lorenz, Handynummer 0174 5236802', 'Was kostet zwölf Euro?', 'What costs twelve euros?', ['Der Tisch.', 'Das Regal.', 'Der Stuhl.'], 1, 'Das Regal ist alt, aber gut: Es kostet zwölf Euro.', '“Es” is the shelf: it costs twelve euros. The table costs twenty, the chair eight.'),
    said('message', 'Hallo Jonas, ich kaufe die Tasche für Sara. Den Rucksack kaufe ich nicht, er ist teuer. Brauchst du auch eine Tasche? Grüße, Ben', 'Ben kauft den Rucksack für Sara.', false, 'Den Rucksack kaufe ich nicht, er ist teuer.', 'Ben buys the bag for Sara, not the backpack.'),
    said('sign', 'Büro Frau Novak: Frau Novak hat Pause. Frau Becker ist hier und hat das Telefon. Bitte sprechen Sie mit Frau Becker oder kommen Sie um eins.', 'Frau Novak macht Pause.', true, 'Frau Novak hat Pause.', '“Pause haben” and “Pause machen” say the same: she is on her break.'),
    asks('message', 'Guten Tag, Frau Krüger, Ihr Wörterbuch ist im Büro. Das Heft ist bei Frau Novak, der Schlüssel ist bei Jonas. Brauchen Sie auch Papier? Grüße, Mia', 'Wo ist das Wörterbuch?', 'Where is the dictionary?', ['Im Büro.', 'Bei Frau Novak.', 'Bei Jonas.'], 0, 'Ihr Wörterbuch ist im Büro.', 'The dictionary is in the office; Frau Novak has the exercise book and Jonas the key.'),
  ],
  [
    said('message', 'Hallo Ben, der Stuhl ist schwarz. Ich brauche den Stuhl für das Büro. Der Tisch ist nicht für das Büro, er ist für Sara. Grüße, Mia', 'Der Tisch ist für das Büro.', false, 'Der Tisch ist nicht für das Büro, er ist für Sara.', 'The table is for Sara; the chair is for the office.'),
    asks('ad', 'Die Lampe ist weiß und kostet neun Euro. Das Regal ist braun und kostet dreißig Euro. Ich verkaufe auch zwei Bilder, sie sind blau. Frau Seidel, Telefonnummer 0176 4725083.', 'Welche Farbe hat das Regal?', 'What colour is the shelf?', ['Braun.', 'Weiß.', 'Blau.'], 0, 'Das Regal ist braun und kostet dreißig Euro.', 'The shelf is brown, the lamp is white and the pictures are blue.'),
    said('message', 'Frau Becker, Ihre Tasche ist hier bei mir. Die Tasche ist blau, der Schlüssel ist auch hier. Kommen Sie um zwei? Grüße, Sara', 'Der Schlüssel ist nicht bei Sara.', false, 'der Schlüssel ist auch hier.', 'Bag and key are both with Sara.'),
    asks('notice', 'Bitte für das Büro kaufen: eine Lampe für mich, eine Uhr für Frau Novak und zwei Stühle für Frau Meyer. Danke! Thomas', 'Was braucht Thomas?', 'What does Thomas need?', ['Eine Uhr.', 'Zwei Stühle.', 'Eine Lampe.'], 2, 'eine Lampe für mich', 'Thomas writes “für mich”: the lamp is for him.'),
  ],
  [
    said('sign', 'Firma Krause: Frau Meyer hat die Nummer drei zwei fünf, Frau Becker hat die Nummer drei zwei vier. Herr Vogt hat kein Telefon, er hat ein Handy.', 'Die Nummer drei zwei vier hat Frau Becker.', true, 'Frau Becker hat die Nummer drei zwei vier.', 'Frau Becker’s number is three two four; Frau Meyer’s is three two five.'),
    asks('message', 'Hallo Sara! Ich brauche eine Schere und ein Lineal. Ein Stift ist schon hier. Das Papier ist für Jonas. Danke und Grüße, Ben', 'Was braucht Ben?', 'What does Ben need?', ['Papier.', 'Eine Schere.', 'Einen Stift.'], 1, 'Ich brauche eine Schere und ein Lineal.', 'Ben needs scissors and a ruler; there is a pen already, and the paper is for Jonas.'),
    asks('ad', 'Flohmarkt in Köln! Der Tisch kostet zwanzig Euro, der Stuhl zehn Euro, die Lampe fünf Euro. Das Regal verkaufe ich nicht. Frau Lorenz, Telefonnummer 0221 4758612', 'Sie kaufen den Tisch und den Stuhl. Was macht das zusammen?', 'You buy the table and the chair. How much is that together?', ['Fünfzehn Euro.', 'Zwanzig Euro.', 'Dreißig Euro.'], 2, 'Der Tisch kostet zwanzig Euro, der Stuhl zehn Euro', 'Twenty and ten euros are thirty euros.'),
    said('message', 'Hallo Frau Meyer! Das Buch ist für Jonas, nicht für Frau Becker. Sara hat schon ein Buch, sie braucht nur ein Heft. Grüße, Herr Seidel', 'Sara braucht kein Buch.', true, 'Sara hat schon ein Buch, sie braucht nur ein Heft.', 'Sara already has a book; she only needs an exercise book.'),
  ],
  [
    asks('message', 'Hallo Mia, Herr Krause ist Ingenieur, er ist nicht der Chef. Die Chefin heißt Frau Krüger. Ihre Nummer ist nicht hier. Herr Krause und Herr Seidel haben sie nicht, Frau Lorenz hat sie. Grüße, Jonas', 'Wer hat die Nummer von Frau Krüger?', 'Who has Frau Krüger’s number?', ['Herr Seidel.', 'Frau Lorenz.', 'Herr Krause.'], 1, 'Frau Lorenz hat sie.', '“Sie” is the number of the boss: Herr Krause and Herr Seidel do not have it, Frau Lorenz has it.'),
    said('notice', 'Firma Seidel: Frau Novak ist nicht im Büro. Bitte sprechen Sie mit Frau Becker. Sie ist nicht Ingenieurin, sie ist Verkäuferin, aber sie hat die Handynummer von Frau Novak.', 'Frau Becker ist Ingenieurin.', false, 'Sie ist nicht Ingenieurin, sie ist Verkäuferin', 'Frau Becker is a saleswoman, not an engineer.'),
    said('message', 'Frau Meyer, die Chefin ist hier im Büro. Der Kollege ist bei Frau Becker. Brauchen Sie den Computer? Das Telefon ist auch hier. Grüße, Ben', 'Das Telefon ist im Büro.', true, 'Das Telefon ist auch hier.', '“Auch hier” is the office: boss and telephone are both there.'),
    asks('ad', 'Firma Krause verkauft Bücher! Ein Buch kostet acht Euro, ein Wörterbuch zwölf Euro. Drei Hefte kosten zusammen vier Euro. Alle Bücher sind neu. Telefonnummer 0421 3647285', 'Sie kaufen ein Buch und ein Wörterbuch. Was macht das zusammen?', 'You buy a book and a dictionary. How much is that together?', ['Zwanzig Euro.', 'Zwölf Euro.', 'Acht Euro.'], 0, 'Ein Buch kostet acht Euro, ein Wörterbuch zwölf Euro.', 'Eight and twelve euros are twenty euros.'),
  ],
  // ── Checkpoint 3: Lektion 7–9 ──
  [
    said('notice', 'Termin bei Frau Novak: Bitte um elf Uhr kommen. Frau Novak arbeitet heute bis zehn Uhr bei der Firma Becker. Um elf Uhr hat sie Zeit.', 'Um elf Uhr ist Frau Novak frei.', true, 'Um elf Uhr hat sie Zeit.', '“Sie” is Frau Novak: she has time at eleven, so she is free.'),
    asks('message', 'Hallo Mia, am Dienstag habe ich einen Termin beim Arzt. Am Freitag bin ich frei. Am Samstag arbeite ich bis acht Uhr. Grüße, Jonas', 'Wann hat Jonas Zeit?', 'When does Jonas have time?', ['Am Dienstag.', 'Am Freitag.', 'Am Samstag.'], 1, 'Am Freitag bin ich frei.', '“Frei” means he has time: on Friday.'),
    asks('ad', 'Café Krause in Köln: Morgens haben wir Brot und Kaffee für fünf Euro, nachmittags Kuchen und Tee für vier Euro. Abends hören wir zusammen Musik. Kommen Sie!', 'Wann hat das Café Kuchen?', 'When does the café have cake?', ['Nachmittags.', 'Abends.', 'Morgens.'], 0, 'nachmittags Kuchen und Tee für vier Euro.', 'Cake and tea are in the afternoon.'),
    said('message', 'Guten Morgen, Herr Seidel! Ich arbeite am Montag. Die Pause ist um zwölf Uhr, nicht um zehn Uhr. Die Kollegin hat am Dienstag frei. Grüße, Frau Krüger', 'Die Kollegin arbeitet am Dienstag.', false, 'Die Kollegin hat am Dienstag frei.', 'The colleague has Tuesday off.'),
  ],
  [
    said('message', 'Hallo Sara, ich bin krank. Mia und Ali gehen heute ins Kino, nicht am Freitag. Ich habe am Freitag Zeit. Gehen wir dann? Grüße, Ben', 'Mia und Ali gehen am Freitag ins Kino.', false, 'Mia und Ali gehen heute ins Kino, nicht am Freitag.', 'They go today, not on Friday.'),
    asks('notice', 'Büro Frau Becker: Montag bis Donnerstag arbeiten wir bis vier Uhr, am Freitag bis zwölf Uhr. Am Wochenende sind wir nicht hier. Bitte pünktlich kommen!', 'Wann haben alle um zwei Uhr frei?', 'On which day is everybody off at two o’clock?', ['Am Freitag.', 'Am Donnerstag.', 'Am Montag.'], 0, 'am Freitag bis zwölf Uhr.', 'On Friday they work only until twelve, so at two they are off.'),
    said('ad', 'Kuchen und Brot von Frau Meyer: Der Kuchen kostet zehn Euro, das Brot drei Euro. Frau Meyer kocht auch Suppe! Nachmittags hat sie frei.', 'Suppe macht Frau Meyer nicht.', false, 'Frau Meyer kocht auch Suppe!', 'Frau Meyer cooks soup too.'),
    asks('message', 'Jonas, ich gehe heute ins Kino. Ben kommt gern. Sara arbeitet und Thomas ist krank, sie kommen nicht. Und du? Grüße, Mia', 'Wer geht mit Mia ins Kino?', 'Who is going to the cinema with Mia?', ['Sara.', 'Thomas.', 'Ben.'], 2, 'Ben kommt gern.', 'Sara works and Thomas is ill; Ben comes along.'),
  ],
  [
    said('ad', 'Suppe bei Frau Novak: Die Suppe kostet hier vier Euro, der Salat fünf Euro. Bier haben wir nicht, nur Mineralwasser. Bitte kommen Sie um zwölf Uhr zum Essen.', 'Das Essen ist um zwölf Uhr.', true, 'Bitte kommen Sie um zwölf Uhr zum Essen.', 'Guests come to eat at twelve.'),
    asks('message', 'Hallo Ben, ich trinke nicht gern Kaffee. Bitte Tee für mich! Frau Becker trinkt gern Kaffee, Ali möchte Orangensaft. Wir kommen zum Frühstück. Grüße, Mia', 'Was möchte Mia?', 'What would Mia like?', ['Kaffee.', 'Tee.', 'Orangensaft.'], 1, 'Bitte Tee für mich!', 'Mia writes “Tee für mich”; the coffee is for Frau Becker and the juice for Ali.'),
    said('notice', 'Die Pause ist heute um zehn Uhr! Wir haben Kuchen und Brot. Herr Seidel hat Mineralwasser für alle. Bitte pünktlich kommen, um elf arbeiten wir.', 'Die Pause ist nicht um zehn.', false, 'Die Pause ist heute um zehn Uhr!', 'The break is at ten; at eleven they work.'),
    asks('message', 'Guten Tag, Frau Krüger! Ich habe Hunger und möchte Suppe. Thomas möchte Salat. Ali hat nur Durst, er möchte ein Glas Wasser. Grüße, Sara', 'Wer möchte nur trinken?', 'Who only wants something to drink?', ['Sara.', 'Thomas.', 'Ali.'], 2, 'Ali hat nur Durst, er möchte ein Glas Wasser.', 'Ali is only thirsty; Sara and Thomas would like to eat.'),
  ],
  [
    said('message', 'Hallo Jonas, Frau Lorenz schwimmt nicht gern, aber sie tanzt gern. Ich schwimme am Sonntag. Hast du auch frei? Dann gehen wir zusammen. Grüße, Sara', 'Sara schwimmt am Sonntag.', true, 'Ich schwimme am Sonntag.', 'Sara writes “ich”: she swims on Sunday.'),
    asks('message', 'Frau Becker, die Chefin arbeitet am Mittwoch und am Freitag. Am Donnerstag hat sie frei. Ich habe am Mittwoch frei und komme dann zu Ihnen. Grüße, Herr Seidel', 'Wann arbeitet Herr Seidel nicht?', 'When does Herr Seidel not work?', ['Am Mittwoch.', 'Am Donnerstag.', 'Am Freitag.'], 0, 'Ich habe am Mittwoch frei und komme dann zu Ihnen.', 'Herr Seidel is off on Wednesday; the boss is off on Thursday.'),
    said('notice', 'Fußball am Wochenende: Herr Novak spielt nur am Samstag, Herr Meyer spielt nur am Sonntag. Sie kommen um zehn Uhr. Spielen Sie auch? Bitte kommen Sie pünktlich!', 'Herr Meyer spielt am Samstag.', false, 'Herr Meyer spielt nur am Sonntag.', 'Herr Meyer plays only on Sunday; Herr Novak plays on Saturday.'),
    asks('ad', 'Ein Abend für alle: Frau Krüger spricht Deutsch mit Ihnen. Herr Vogt spricht nicht Deutsch und tanzt nicht, er kocht. Mia tanzt. Am Freitag um sechs Uhr im Café Krause.', 'Was macht Herr Vogt?', 'What does Herr Vogt do?', ['Er tanzt.', 'Er kocht.', 'Er spricht Deutsch.'], 1, 'er kocht', 'Herr Vogt cooks; he does not speak German or dance. Mia dances, Frau Krüger speaks German with the guests.'),
  ],
  // ── Checkpoint 4: Lektion 10–12 ──
  [
    asks('ad', 'Fahrt nach Berlin am Samstag: Der Bus fährt um acht Uhr. Die Fahrkarte kostet zwanzig Euro, für Kinder zehn Euro. Fahrkarten bitte am Bahnhof kaufen, nicht beim Fahrer!', 'Wo kaufen Sie die Fahrkarte?', 'Where do you buy the ticket?', ['Am Bahnhof.', 'Beim Fahrer.', 'In Berlin.'], 0, 'Fahrkarten bitte am Bahnhof kaufen, nicht beim Fahrer!', 'Tickets are sold at the station, not by the driver.'),
    said('notice', 'Der Zug nach Köln fährt heute von Gleis vier. Bitte nicht zu Gleis drei gehen! Der Zug nach Berlin fährt von Gleis drei. Abfahrt nach Köln: neun Uhr.', 'Der Zug nach Berlin fährt von Gleis vier.', false, 'Der Zug nach Berlin fährt von Gleis drei.', 'Berlin leaves from platform three, Cologne from platform four.'),
    asks('message', 'Hallo Ben, um sieben Uhr ist die Abfahrt in Köln. Um zehn Uhr ist meine Ankunft in Bremen, und um elf Uhr habe ich einen Termin. Holst du mich ab? Grüße, Mia', 'Wann kommt Mia nach Bremen?', 'When does Mia arrive in Bremen?', ['Um sieben Uhr.', 'Um elf Uhr.', 'Um zehn Uhr.'], 2, 'Um zehn Uhr ist meine Ankunft in Bremen', '“Ankunft” is the arrival: ten o’clock. Seven is the departure, eleven the appointment.'),
    said('message', 'Hallo Sara, ich fahre um acht Uhr mit dem Bus nach Berlin. Der Zug kommt heute leider zu spät. Kommst du auch mit? Grüße, Jonas', 'Jonas fährt mit dem Auto.', false, 'ich fahre um acht Uhr mit dem Bus nach Berlin.', 'Jonas goes by bus.'),
  ],
  [
    said('message', 'Mia, ich kaufe ein Buch für Sara. Eine Karte für Sara kaufe ich nicht, die hat Jonas schon. Wir kommen am Freitag. Grüße, Ben', 'Jonas hat schon eine Karte für Sara.', true, 'Eine Karte für Sara kaufe ich nicht, die hat Jonas schon.', 'Jonas already has the card for Sara; Ben buys the book.'),
    asks('message', 'Hallo Jonas! Meine Schwester bringt Wein mit, mein Bruder macht Kuchen, und ich bringe Musik mit. Wir feiern am Samstag bei Frau Becker. Kommst du? Grüße, Sara', 'Wer macht den Kuchen?', 'Who makes the cake?', ['Frau Becker.', 'Der Bruder von Sara.', 'Die Schwester von Sara.'], 1, 'mein Bruder macht Kuchen', 'Sara writes “mein Bruder”: her brother makes the cake.'),
    asks('ad', 'Kuchen für Ihre Party am Samstag: Frau Novak macht Kuchen für zwanzig Euro. Sie arbeitet von Montag bis Freitag. Am Wochenende hat sie frei. Bitte rufen Sie an: 0176 3582604', 'Wann hat Frau Novak frei?', 'When is Frau Novak off?', ['Am Samstag.', 'Am Montag.', 'Am Freitag.'], 0, 'Am Wochenende hat sie frei.', 'She is off at the weekend, so on Saturday too.'),
    said('notice', 'Die Party bei Frau Becker ist am Sonntag, nicht am Samstag. Bitte bringen Sie kein Geschenk mit! Kuchen und Wein sind schon hier.', 'Frau Becker möchte ein Geschenk.', false, 'Bitte bringen Sie kein Geschenk mit!', 'Guests are asked to bring no present.'),
  ],
  [
    asks('notice', 'Frau Krüger ist heute krank und nicht im Büro. Herr Seidel ist von zehn bis zwölf Uhr im Büro. Frau Lorenz arbeitet heute zu Hause. Bitte rufen Sie Frau Lorenz an: 0174 5236802', 'Wer ist um elf Uhr im Büro?', 'Who is in the office at eleven?', ['Frau Krüger.', 'Herr Seidel.', 'Frau Lorenz.'], 1, 'Herr Seidel ist von zehn bis zwölf Uhr im Büro.', 'Herr Seidel is there from ten to twelve; Frau Krüger is ill and Frau Lorenz works at home.'),
    said('message', 'Hallo Ben, um neun Uhr rufe ich meine Schwester an. Mia ruft um zehn Uhr an. Die Kinder und ich kommen später zu dir. Grüße, Jonas', 'Mia ruft um neun Uhr an.', false, 'Mia ruft um zehn Uhr an.', 'Mia calls at ten; Jonas calls at nine.'),
    said('ad', 'Drei Bücher zusammen kosten zehn Euro, ein Wörterbuch zwanzig Euro. Alle Bücher sind schon alt, aber gut. Bitte nicht vor neun Uhr anrufen! Frau Meyer', 'Ein Wörterbuch kostet zwanzig Euro.', true, 'Drei Bücher zusammen kosten zehn Euro, ein Wörterbuch zwanzig Euro.', 'The dictionary costs twenty euros; ten is the price of the three books.'),
    asks('message', 'Sara, meine Mama arbeitet heute. Mein Papa hat frei und kocht Suppe. Ich kaufe Brot ein. Wir essen um eins, nicht um zwei. Kommst du auch? Grüße, Mia', 'Wer kocht?', 'Who is cooking?', ['Mia.', 'Die Mama von Mia.', 'Der Papa von Mia.'], 2, 'Mein Papa hat frei und kocht Suppe.', 'Mia writes “mein Papa”: her father cooks.'),
  ],
  [
    asks('notice', 'Abfahrt nach Österreich: heute um elf Uhr. Der Bus um zehn Uhr fährt in die Schweiz. Der Bus nach Berlin kommt leider zu spät. Fahrkarten: am Bahnhof', 'Welcher Bus hat Verspätung?', 'Which bus is late?', ['Der Bus nach Österreich.', 'Der Bus nach Berlin.', 'Der Bus in die Schweiz.'], 1, 'Der Bus nach Berlin kommt leider zu spät.', '“Zu spät” means the bus to Berlin is delayed.'),
    said('message', 'Hallo Ali, das Buch ist von Frau Krüger, die Karte ist von Ben. Buch und Karte sind für dich zum Geburtstag. Wir kommen am Sonntag! Grüße, Sara', 'Die Karte zum Geburtstag ist von Ben.', true, 'die Karte ist von Ben.', 'The card is from Ben, the book from Frau Krüger.'),
    said('message', 'Guten Morgen, Jonas! Herr Seidel feiert nicht am Samstag, er feiert schon am Freitag. Frau Novak feiert am Montag. Ich komme am Freitag mit und bringe Kuchen mit. Grüße, Mia', 'Am Montag feiert Frau Novak.', true, 'Frau Novak feiert am Montag.', 'Frau Novak celebrates on Monday, Herr Seidel on Friday.'),
    asks('ad', 'Am Sonntag fahren wir nach Bremen! Die Fahrt kostet zehn Euro, das Essen fünf Euro. Am Samstag fahren wir nicht. Bitte rufen Sie Frau Becker an!', 'Sie möchten die Fahrt und das Essen. Was macht das zusammen?', 'You would like the trip and the meal. How much is that together?', ['Fünf Euro.', 'Zehn Euro.', 'Fünfzehn Euro.'], 2, 'Die Fahrt kostet zehn Euro, das Essen fünf Euro.', 'Ten and five euros are fifteen euros.'),
  ],
];

export const LESEN_A11 = Object.fromEntries([1, 2, 3, 4].map((cp) => [`a1.1-cp${cp}`, {
  papers: papers.slice((cp - 1) * 4, cp * 4).map((paper, round) => paper.map((unit, i) => ({
    id: `a11-cp${cp}-p${round + 1}-u${i + 1}`, ...unit,
    explanationDe: `„${unit.evidence}“`, explanationEn: unit.rival,
  }))),
}]));
