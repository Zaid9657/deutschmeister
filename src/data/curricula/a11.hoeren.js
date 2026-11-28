// What a checkpoint says aloud, and the lines its learner reads aloud: new sentences, written for the
// checkpoint, in words and forms the course has taught by then. Until 2026-11-25 every checkpoint
// dictation and read-aloud was a line of a scene the learner had already played (36 of 36 and 24 of 24)
// and no listening task had a new text, so Hören and Sprechen measured memory, not listening.
// Four papers per checkpoint, like the reading bank (a11.lesen.js): paper r serves round r. One paper:
//   say   two sentences the learner writes down,
//   hear  three short spoken texts (a message, an announcement, a person), each with one question and
//         three answers: numbers that sound alike, or things the text names for something else,
//   read  two sentences the learner reads aloud.
// Gate: scripts/a11-hoeren-check.mjs. Keys were reviewed blind (tests/fixtures/a11-hoeren-review.json):
// a changed text needs that review again.
const hear = (voice, text, question, questionEn, options, at, evidence, why) => ({
  voice, text, question, questionEn, options, answer: options[at], evidence, why,
});

const papers = [
  // ── Checkpoint 1: Lektion 1–3 ──
  [
    {
      say: [['Wir kommen aus Italien und wohnen in Berlin.', 'We come from Italy and live in Berlin.'], ['Wie alt ist der Bruder von Frau Krause?', 'How old is Frau Krause’s brother?']],
      hear: [
        hear('m', 'Hallo, hier ist Thomas Vogt. Ich komme aus Österreich und wohne in Bremen. Frau Vogt ist noch in Berlin. Auf Wiedersehen!', 'Wo wohnt Thomas Vogt?', 'Where does Thomas Vogt live?', ['In Österreich.', 'In Bremen.', 'In Berlin.'], 1, 'Ich komme aus Österreich und wohne in Bremen.', 'He lives in Bremen; he comes from Austria, and Frau Vogt is in Berlin.'),
        hear('f', 'Hallo Sara, hier ist Mia. Ben ist schon sieben, und ich bin sechs. Und du? Wie alt bist du?', 'Wie alt ist Mia?', 'How old is Mia?', ['6', '7', '9'], 0, 'ich bin sechs', 'Mia says “ich bin sechs”: she is 6. Ben is 7.'),
        hear('m', 'Das ist Frau Krüger. Sie ist Lehrerin und spricht Deutsch und Englisch. Der Mann von Frau Krüger spricht nur Arabisch.', 'Welche Sprache spricht der Mann von Frau Krüger?', 'Which language does Frau Krüger’s husband speak?', ['Deutsch.', 'Englisch.', 'Arabisch.'], 2, 'Der Mann von Frau Krüger spricht nur Arabisch.', 'Her husband speaks only Arabic; she speaks German and English.'),
      ],
      read: [['Sind Sie ledig oder verheiratet, Frau Lorenz?', 'Are you single or married, Ms Lorenz?'], ['Die Eltern von Ben sprechen auch Englisch.', 'Ben’s parents speak English too.']],
    },
    {
      say: [['Sprechen die Kinder auch Arabisch?', 'Do the children speak Arabic too?'], ['Herr Krause ist Lehrer und wohnt in Berlin.', 'Mr Krause is a teacher and lives in Berlin.']],
      hear: [
        hear('f', 'Guten Morgen, hier ist Frau Krause vom Amt. Das Formular für Frau Lorenz ist schon da. Die Adresse und die Telefonnummer sind noch nicht da.', 'Was ist schon da?', 'What is there already?', ['Die Adresse.', 'Das Formular.', 'Die Telefonnummer.'], 1, 'Das Formular für Frau Lorenz ist schon da.', 'The form is there; address and phone number are still missing.'),
        hear('m', 'Die Telefonnummer von Frau Becker ist null vier zwei eins, fünf acht zwei sechs drei.', 'Wie ist die Telefonnummer von Frau Becker?', 'What is Frau Becker’s phone number?', ['0421 52863', '0412 58263', '0421 58263'], 2, 'null vier zwei eins, fünf acht zwei sechs drei', 'You hear 0-4-2-1, 5-8-2-6-3.'),
        hear('f', 'Ali ist Lehrer, er ist der Mann von Sara. Jonas ist der Bruder von Sara. Er ist noch Student. Und Ben? Er ist auch Student.', 'Wer ist Lehrer?', 'Who is a teacher?', ['Ali.', 'Jonas.', 'Ben.'], 0, 'Ali ist Lehrer', 'Ali is a teacher; Jonas and Ben are students.'),
      ],
      read: [['Das Baby von Frau Meyer heißt Mia.', 'Frau Meyer’s baby is called Mia.'], ['Sie ist verheiratet und wohnt in Köln.', 'She is married and lives in Cologne.']],
    },
    {
      say: [['Guten Tag, ich bin die Mutter von Ali.', 'Good day, I am Ali’s mother.'], ['Woher kommen die Eltern von Jonas?', 'Where do Jonas’s parents come from?']],
      hear: [
        hear('f', 'Guten Morgen! Ich bin Frau Meyer. Ich spreche Englisch und Deutsch. Der Sohn spricht Deutsch und Arabisch, die Tochter spricht nur Deutsch.', 'Wer spricht Englisch?', 'Who speaks English?', ['Die Tochter.', 'Frau Meyer.', 'Der Sohn.'], 1, 'Ich spreche Englisch und Deutsch.', 'Frau Meyer speaks English and German; the son and the daughter do not speak English.'),
        hear('m', 'Das ist die Familie Novak. Der Sohn heißt Jonas und ist schon neun. Die Tochter heißt Mia und ist fünf.', 'Wie alt ist die Tochter?', 'How old is the daughter?', ['4', '9', '5'], 2, 'Die Tochter heißt Mia und ist fünf.', 'The daughter is 5; the son is 9.'),
        hear('m', 'Hallo, hier ist Ben. Ich bin in Köln, Sara ist in Berlin. Morgen kommen wir nach Bremen. Tschüss!', 'Wo ist Ben?', 'Where is Ben?', ['In Köln.', 'In Bremen.', 'In Berlin.'], 0, 'Ich bin in Köln, Sara ist in Berlin.', 'Ben is in Cologne; he comes to Bremen tomorrow.'),
      ],
      read: [['Und wie geht es Frau Krause?', 'And how is Ms Krause?'], ['Die Geschwister sprechen zusammen Arabisch.', 'The brothers and sisters speak Arabic together.']],
    },
    {
      say: [['Wie heißt der Sohn von Frau Becker?', 'What is the name of Frau Becker’s son?'], ['Das Baby heißt Ali, die Mutter heißt Sara.', 'The baby is called Ali, the mother is called Sara.']],
      hear: [
        hear('m', 'Hallo, hier ist Jonas Seidel. Ich buchstabiere Seidel: S, E, I, D, E, L. Danke und auf Wiedersehen!', 'Wie heißt der Mann?', 'What is the man called?', ['Jonas Seibel.', 'Jonas Seidel.', 'Jonas Seitel.'], 1, 'S, E, I, D, E, L', 'He spells Seidel with a D.'),
        hear('m', 'Frau Becker, hier ist Herr Vogt vom Amt. Geburtsdatum und Adresse sind da. Die Telefonnummer ist noch nicht da.', 'Was ist noch nicht da?', 'What is not there yet?', ['Die Telefonnummer.', 'Das Geburtsdatum.', 'Die Adresse.'], 0, 'Die Telefonnummer ist noch nicht da.', 'The phone number is still missing.'),
        hear('f', 'Mia kommt aus Polen. Thomas kommt aus Deutschland, aber die Eltern von Thomas kommen aus Spanien.', 'Woher kommt Thomas?', 'Where does Thomas come from?', ['Aus Polen.', 'Aus Spanien.', 'Aus Deutschland.'], 2, 'Thomas kommt aus Deutschland', 'Thomas comes from Germany; Spain is where his parents come from.'),
      ],
      read: [['Entschuldigung, sprechen Sie Deutsch?', 'Excuse me, do you speak German?'], ['Der Bruder von Mia ist Student in Berlin.', 'Mia’s brother is a student in Berlin.']],
    },
  ],
  // ── Checkpoint 2: Lektion 4–6 ──
  [
    {
      say: [['Das Regal kostet vierzig Euro, das ist teuer.', 'The shelf costs forty euros, that is expensive.'], ['Wir brauchen einen Stift und Papier.', 'We need a pen and paper.']],
      hear: [
        hear('f', 'Guten Tag! Der Tisch kostet fünfzig Euro, die Lampe kostet fünf Euro, und der Stuhl kostet fünfzehn Euro.', 'Was kostet der Stuhl?', 'What does the chair cost?', ['5 Euro.', '50 Euro.', '15 Euro.'], 2, 'der Stuhl kostet fünfzehn Euro', 'Fünfzehn is 15. Fünfzig is 50.'),
        hear('m', 'Frau Meyer, hier ist Jonas. Der Schlüssel ist bei Frau Becker. Die Tasche ist im Büro. Und das Buch? Das Buch ist bei mir.', 'Wo ist der Schlüssel?', 'Where is the key?', ['Bei Frau Becker.', 'Im Büro.', 'Bei Jonas.'], 0, 'Der Schlüssel ist bei Frau Becker.', 'Frau Becker has the key; the bag is in the office, Jonas has the book.'),
        hear('f', 'Guten Morgen! Um zehn kommt die Chefin, um elf ist die Pause, um zwölf kommt ein Verkäufer.', 'Wann ist die Pause?', 'When is the break?', ['Um zehn.', 'Um elf.', 'Um zwölf.'], 1, 'um elf ist die Pause', 'The break is at eleven.'),
      ],
      read: [['Ist das Fenster braun oder weiß?', 'Is the window brown or white?'], ['Wir haben kein Papier, aber zwei Stifte.', 'We have no paper, but two pens.']],
    },
    {
      say: [['Die Kollegin kauft ein Wörterbuch.', 'The colleague buys a dictionary.'], ['Wie viel kosten die Tasche und die Uhr?', 'How much do the bag and the watch cost?']],
      hear: [
        hear('m', 'Im Büro ist der Stuhl grün, der Tisch ist weiß, und die Lampe ist blau.', 'Welche Farbe hat der Tisch?', 'What colour is the table?', ['Blau.', 'Weiß.', 'Grün.'], 1, 'der Tisch ist weiß', 'The table is white, the chair green and the lamp blue.'),
        hear('f', 'Hallo Ben, hier ist Sara. Ein Lineal ist schon da. Ich brauche noch ein Heft und eine Schere. Danke!', 'Was ist schon da?', 'What is there already?', ['Ein Lineal.', 'Ein Heft.', 'Eine Schere.'], 0, 'Ein Lineal ist schon da.', 'The ruler is there; she still needs an exercise book and scissors.'),
        hear('m', 'Firma Krause, guten Tag! Frau Lorenz ist nicht im Büro. Die Nummer von Frau Lorenz ist sieben vier, drei drei acht.', 'Wie ist die Nummer?', 'What is the number?', ['47 338', '74 383', '74 338'], 2, 'sieben vier, drei drei acht', 'You hear 7-4, 3-3-8.'),
      ],
      read: [['Ich verkaufe den Rucksack für zwanzig Euro.', 'I am selling the backpack for twenty euros.'], ['Das ist kein Bild, das ist eine Tafel.', 'That is not a picture, that is a board.']],
    },
    {
      say: [['Der Chef hat ein Büro und zwei Computer.', 'The boss has one office and two computers.'], ['Ist die Tasche von Mia rot oder schwarz?', 'Is Mia’s bag red or black?']],
      hear: [
        hear('f', 'Flohmarkt in Bremen! Frau Novak verkauft Bücher, Herr Seidel verkauft Lampen, und Ali verkauft Stühle.', 'Was verkauft Herr Seidel?', 'What does Herr Seidel sell?', ['Bücher.', 'Stühle.', 'Lampen.'], 2, 'Herr Seidel verkauft Lampen', 'He sells lamps; Frau Novak sells books and Ali chairs.'),
        hear('m', 'Hallo, hier ist Thomas. Ich bin Ingenieur. Die Chefin ist auch Ingenieurin, und Frau Lorenz ist Verkäuferin.', 'Wer ist Verkäuferin?', 'Who is a saleswoman?', ['Die Chefin.', 'Frau Lorenz.', 'Thomas.'], 1, 'Frau Lorenz ist Verkäuferin', 'Frau Lorenz is the saleswoman; Thomas and the boss are engineers.'),
        hear('m', 'Das Handy kostet siebzehn Euro, der Computer kostet siebzig Euro. Das macht zusammen siebenundachtzig Euro.', 'Was kostet das Handy?', 'What does the mobile phone cost?', ['17 Euro.', '70 Euro.', '87 Euro.'], 0, 'Das Handy kostet siebzehn Euro', 'Siebzehn is 17. Siebzig is 70.'),
      ],
      read: [['Wo ist der Bleistift von Ben?', 'Where is Ben’s pencil?'], ['Die Firma braucht eine Ingenieurin.', 'The company needs an engineer.']],
    },
    {
      say: [['Ich brauche eine Lampe, aber kein Regal.', 'I need a lamp, but no shelf.'], ['Um zwei kommt ein Kollege von Jonas.', 'At two a colleague of Jonas’s is coming.']],
      hear: [
        hear('f', 'Zwei Hefte kosten vier Euro, drei Stifte kosten sechs Euro. Das macht zusammen zehn Euro.', 'Was kosten die Hefte?', 'What do the exercise books cost?', ['10 Euro.', '4 Euro.', '6 Euro.'], 1, 'Zwei Hefte kosten vier Euro', 'The exercise books cost four euros, the pens six, together ten.'),
        hear('f', 'Frau Becker, hier ist Mia. Das Wörterbuch ist noch nicht da. Der Rucksack ist da, die Tasche auch.', 'Was ist noch nicht da?', 'What is not there yet?', ['Das Wörterbuch.', 'Der Rucksack.', 'Die Tasche.'], 0, 'Das Wörterbuch ist noch nicht da.', 'The dictionary is missing; backpack and bag are there.'),
        hear('m', 'Hier ist das Zimmer. Ein Stuhl und ein Tisch sind schon da. Sie brauchen noch eine Lampe.', 'Was brauchen Sie noch?', 'What do you still need?', ['Einen Stuhl.', 'Einen Tisch.', 'Eine Lampe.'], 2, 'Sie brauchen noch eine Lampe.', 'Chair and table are there; a lamp is still needed.'),
      ],
      read: [['Entschuldigung, wie ist Ihre E-Mail-Adresse?', 'Excuse me, what is your e-mail address?'], ['Die Schere ist rot, und das Lineal ist gelb.', 'The scissors are red, and the ruler is yellow.']],
    },
  ],
  // ── Checkpoint 3: Lektion 7–9 ──
  [
    {
      say: [['Am Samstag kochen wir zusammen Suppe.', 'On Saturday we cook soup together.'], ['Der Termin mit Frau Becker ist um halb zwei.', 'The appointment with Frau Becker is at half past one.']],
      hear: [
        hear('m', 'Hallo Mia, hier ist Ben. Heute arbeite ich bis acht Uhr. Gehen wir am Freitag ins Kino? Am Samstag spiele ich Fußball.', 'Wann möchte Ben ins Kino?', 'When would Ben like to go to the cinema?', ['Heute.', 'Am Freitag.', 'Am Samstag.'], 1, 'Gehen wir am Freitag ins Kino?', 'Ben asks about Friday; today he works, on Saturday he plays football.'),
        hear('f', 'Guten Tag! Ich möchte Suppe, bitte, und ein Glas Wasser. Brot möchte ich nicht, und Kuchen habe ich schon.', 'Was möchte die Frau essen?', 'What would the woman like to eat?', ['Suppe.', 'Kuchen.', 'Brot.'], 0, 'Ich möchte Suppe, bitte', 'She would like soup; she does not want bread, and she already has cake.'),
        hear('f', 'Guten Morgen, hier ist Radio Bremen. Es ist Viertel vor sieben. Um halb acht hören Sie Musik.', 'Wann hören Sie Musik?', 'When do you hear music?', ['Um 6:45 Uhr.', 'Um 8:30 Uhr.', 'Um 7:30 Uhr.'], 2, 'Um halb acht hören Sie Musik.', 'Halb acht is 7:30. It is a quarter to seven now.'),
      ],
      read: [['Ich trinke morgens immer Tee.', 'I always drink tea in the morning.'], ['Spielt ihr am Wochenende Fußball?', 'Do you play football at the weekend?']],
    },
    {
      say: [['Am Mittwoch habe ich nachmittags keinen Termin.', 'On Wednesday I have no appointment in the afternoon.'], ['Die Kellnerin hat heute viel Arbeit.', 'The waitress has a lot of work today.']],
      hear: [
        hear('m', 'Hier ist das Büro von Frau Lorenz. Montag bis Donnerstag arbeiten wir bis vier Uhr. Am Freitag haben wir frei.', 'Wann haben alle frei?', 'When is everybody off?', ['Am Donnerstag.', 'Am Montag.', 'Am Freitag.'], 2, 'Am Freitag haben wir frei.', 'They are off on Friday; Monday to Thursday they work.'),
        hear('f', 'Jonas, hier ist Sara. Ich lese gern. Ich tanze nicht gern, und ich schwimme nicht gern. Hast du ein Buch für mich?', 'Was macht Sara gern?', 'What does Sara like doing?', ['Lesen.', 'Tanzen.', 'Schwimmen.'], 0, 'Ich lese gern.', 'Sara likes reading; she does not like dancing or swimming.'),
        hear('m', 'Der Kaffee kostet zwei Euro, das Glas Wein kostet drei Euro, und der Kuchen kostet vier Euro.', 'Was kostet der Wein?', 'What does the wine cost?', ['2 Euro.', '3 Euro.', '4 Euro.'], 1, 'das Glas Wein kostet drei Euro', 'The wine costs three euros, the coffee two and the cake four.'),
      ],
      read: [['Wir tanzen heute nicht, wir sind krank.', 'We are not dancing today, we are ill.'], ['Ich habe Durst und möchte Orangensaft.', 'I am thirsty and would like orange juice.']],
    },
    {
      say: [['Frau Krause hört gern Musik und spielt Fußball.', 'Frau Krause likes listening to music and plays football.'], ['Am Dienstag ist Thomas nicht pünktlich.', 'On Tuesday Thomas is not on time.']],
      hear: [
        hear('m', 'Frau Novak, hier ist Herr Seidel. Um zwei habe ich einen Termin beim Arzt. Haben Sie um drei Uhr Zeit? Um vier arbeite ich.', 'Wann hat Herr Seidel Zeit?', 'When does Herr Seidel have time?', ['Um zwei.', 'Um drei.', 'Um vier.'], 1, 'Haben Sie um drei Uhr Zeit?', 'He asks about three o’clock; at two he is at the doctor’s, at four he works.'),
        hear('f', 'Guten Abend! Wir haben heute Suppe, Brot und Salat. Kuchen haben wir heute nicht.', 'Was hat das Café heute nicht?', 'What does the café not have today?', ['Salat.', 'Brot.', 'Kuchen.'], 2, 'Kuchen haben wir heute nicht.', 'There is no cake today.'),
        hear('m', 'Hallo Ali, hier ist Jonas. Ich bin krank und spiele heute nicht. Ben und Mia spielen. Tschüss!', 'Wer spielt heute nicht?', 'Who does not play today?', ['Jonas.', 'Ben.', 'Mia.'], 0, 'Ich bin krank und spiele heute nicht.', 'Jonas speaks: he is ill and does not play.'),
      ],
      read: [['Möchten Sie auch ein Glas Wein?', 'Would you like a glass of wine too?'], ['Um Viertel vor neun habe ich einen Termin.', 'At a quarter to nine I have an appointment.']],
    },
    {
      say: [['Die Suppe ist gut, der Tee ist auch gut.', 'The soup is good, the tea is good too.'], ['Wann hast du am Donnerstag Pause?', 'When is your break on Thursday?']],
      hear: [
        hear('f', 'Morgens trinke ich immer Kaffee, nachmittags trinke ich Tee, und abends trinke ich nur Wasser.', 'Was trinkt die Frau nachmittags?', 'What does the woman drink in the afternoon?', ['Wasser.', 'Tee.', 'Kaffee.'], 1, 'nachmittags trinke ich Tee', 'Coffee in the morning, tea in the afternoon, water in the evening.'),
        hear('m', 'Frau Meyer, es ist schon Viertel vor neun! Um neun Uhr haben Sie einen Termin mit Frau Krüger, und um Viertel nach neun ist Pause.', 'Wann ist der Termin?', 'When is the appointment?', ['Um 9:00 Uhr.', 'Um 8:45 Uhr.', 'Um 9:15 Uhr.'], 0, 'Um neun Uhr haben Sie einen Termin mit Frau Krüger', 'The appointment is at nine; it is a quarter to nine now.'),
        hear('f', 'Thomas arbeitet am Wochenende nicht. Am Samstag spielt er Fußball, am Sonntag hört er Musik und kocht.', 'Was macht Thomas am Sonntag?', 'What does Thomas do on Sunday?', ['Er arbeitet.', 'Er spielt Fußball.', 'Er kocht.'], 2, 'am Sonntag hört er Musik und kocht', 'On Sunday he listens to music and cooks.'),
      ],
      read: [['Arbeitet ihr am Wochenende oder habt ihr frei?', 'Do you work at the weekend or are you free?'], ['Eine Tasse Tee und Brot, bitte.', 'A cup of tea and bread, please.']],
    },
  ],
  // ── Checkpoint 4: Lektion 10–12 ──
  [
    {
      say: [['Fährt der Bus am Sonntag auch nach Köln?', 'Does the bus go to Cologne on Sunday too?'], ['Meine Kollegin bringt am Freitag den Kuchen mit.', 'My colleague is bringing the cake on Friday.']],
      hear: [
        hear('f', 'Achtung, Durchsage: Der Zug nach Berlin fährt heute von Gleis sechs, nicht von Gleis fünf. Abfahrt um sieben Uhr.', 'Wo ist der Zug nach Berlin?', 'Where is the train to Berlin?', ['Gleis 5.', 'Gleis 6.', 'Gleis 7.'], 1, 'Der Zug nach Berlin fährt heute von Gleis sechs', 'Platform six, not five. Seven is the hour.'),
        hear('m', 'Hallo Sara, hier ist Jonas. Am Sonntag komme ich gern zum Fest. Am Samstag arbeite ich leider, und am Freitag habe ich einen Termin.', 'Wann kommt Jonas?', 'When is Jonas coming?', ['Am Sonntag.', 'Am Samstag.', 'Am Freitag.'], 0, 'Am Sonntag komme ich gern zum Fest.', 'He comes on Sunday.'),
        hear('m', 'Ich stehe um sieben Uhr auf. Um halb acht frühstücke ich, und um acht fahre ich mit dem Bus ins Büro.', 'Wann frühstückt der Mann?', 'When does the man have breakfast?', ['Um 8:00 Uhr.', 'Um 7:00 Uhr.', 'Um 7:30 Uhr.'], 2, 'Um halb acht frühstücke ich', 'Halb acht is 7:30.'),
      ],
      read: [['Rufst du mich morgen an?', 'Will you call me tomorrow?'], ['Sein Geburtstag ist im August.', 'His birthday is in August.']],
    },
    {
      say: [['Holen Sie bitte die Gäste am Bahnhof ab!', 'Please pick up the guests at the station!'], ['Unser Zug hat leider zehn Minuten Verspätung.', 'Our train is ten minutes late, unfortunately.']],
      hear: [
        hear('f', 'Frau Becker, hier ist Mia. Ich kaufe heute Kaffee und Kuchen ein. Wein kaufe ich nicht, Wein haben wir schon.', 'Was kauft Mia nicht?', 'What does Mia not buy?', ['Kaffee.', 'Wein.', 'Kuchen.'], 1, 'Wein kaufe ich nicht', 'She does not buy wine: there is some already.'),
        hear('m', 'Der Zug nach Köln: Abfahrt um neun Uhr, Ankunft um zwölf Uhr. Um drei Uhr fährt ein Bus in die Schweiz.', 'Wann ist der Zug in Köln?', 'When is the train in Cologne?', ['Um 9 Uhr.', 'Um 3 Uhr.', 'Um 12 Uhr.'], 2, 'Ankunft um zwölf Uhr', 'Arrival is at twelve; nine is the departure.'),
        hear('f', 'Heute lerne ich zu Hause. Gestern habe ich gearbeitet, und morgen schlafe ich bis neun.', 'Was macht die Frau heute?', 'What does the woman do today?', ['Sie lernt.', 'Sie arbeitet.', 'Sie schläft.'], 0, 'Heute lerne ich zu Hause.', 'Today she studies at home; she worked yesterday and sleeps late tomorrow.'),
      ],
      read: [['Das ist ihr Geschenk, und das ist seine Karte.', 'That is her present, and that is his card.'], ['Kommt der Bus pünktlich oder hat er Verspätung?', 'Is the bus on time or is it late?']],
    },
    {
      say: [['Mein Vater schläft am Wochenende bis zehn.', 'My father sleeps until ten at the weekend.'], ['Wir laden die Gäste ein und kochen zusammen.', 'We invite the guests and cook together.']],
      hear: [
        hear('m', 'Guten Tag! Die Fahrkarte nach Köln kostet dreizehn Euro, die Fahrkarte nach Bremen dreißig. Kinder zahlen drei Euro.', 'Was kostet die Fahrkarte nach Köln?', 'What does the ticket to Cologne cost?', ['30 Euro.', '13 Euro.', '3 Euro.'], 1, 'Die Fahrkarte nach Köln kostet dreizehn Euro', 'Dreizehn is 13. Dreißig is 30.'),
        hear('m', 'Hier ist Thomas. Mein Bruder feiert im Juli, meine Schwester feiert im Juni, und ich feiere im Mai.', 'Wer feiert im Juli?', 'Who celebrates in July?', ['Der Bruder.', 'Die Schwester.', 'Thomas.'], 0, 'Mein Bruder feiert im Juli', 'July is the brother’s month; June is the sister’s.'),
        hear('f', 'Hallo Jonas! Heute fährt kein Bus in die Schweiz, und das Auto braucht mein Vater. Wir fahren mit dem Zug!', 'Wie fährt die Frau in die Schweiz?', 'How does the woman go to Switzerland?', ['Mit dem Bus.', 'Mit dem Auto.', 'Mit dem Zug.'], 2, 'Wir fahren mit dem Zug!', 'There is no bus, and her father needs the car: they take the train.'),
      ],
      read: [['Ich kaufe heute ein und koche abends Suppe.', 'I am going shopping today and cooking soup in the evening.'], ['Ist Ihr Büro weit vom Bahnhof?', 'Is your office far from the station?']],
    },
    {
      say: [['Steht ihr am Sonntag auch um sieben auf?', 'Do you get up at seven on Sunday too?'], ['Ihre Party ist im September, nicht im Oktober.', 'Her party is in September, not in October.']],
      hear: [
        hear('f', 'Ben, hier ist Mia. Ich bringe am Samstag Musik mit, Jonas bringt Kuchen mit, und Ali macht Salat.', 'Was bringt Jonas mit?', 'What does Jonas bring?', ['Musik.', 'Kuchen.', 'Salat.'], 1, 'Jonas bringt Kuchen mit', 'Jonas brings cake; Mia brings music and Ali makes salad.'),
        hear('f', 'Hallo, hier ist Frau Novak. Um zehn ist die Abfahrt in Köln. Um elf bin ich am Bahnhof in Bremen, und um zwölf habe ich einen Termin.', 'Wann ist Frau Novak in Bremen?', 'When is Frau Novak in Bremen?', ['Um 12 Uhr.', 'Um 10 Uhr.', 'Um 11 Uhr.'], 2, 'Um elf bin ich am Bahnhof in Bremen', 'She is at the station in Bremen at eleven.'),
        hear('m', 'Am Mittwoch bin ich frei, dann rufe ich dich an. Am Montag und am Dienstag arbeite ich noch.', 'Wann ruft der Mann an?', 'When does the man call?', ['Am Mittwoch.', 'Am Montag.', 'Am Dienstag.'], 0, 'Am Mittwoch bin ich frei, dann rufe ich dich an.', 'He calls on Wednesday; Monday and Tuesday he works.'),
      ],
      read: [['Nächste Woche fahren wir nach Österreich.', 'Next week we are going to Austria.'], ['Deine Karte kommt morgen, liebe Mia.', 'Your card comes tomorrow, dear Mia.']],
    },
  ],
];

export const HOEREN_A11 = Object.fromEntries(papers.map((bank, c) => [`a1.1-cp${c + 1}`, {
  papers: bank.map((paper, round) => {
    const id = (kind, i) => `a11-cp${c + 1}-p${round + 1}-${kind}${i + 1}`;
    return {
      say: paper.say.map(([de, en], i) => ({ id: id('s', i), de, en })),
      hear: paper.hear.map((unit, i) => ({ id: id('h', i), ...unit })),
      read: paper.read.map(([de, en], i) => ({ id: id('r', i), de, en })),
    };
  }),
}]));
