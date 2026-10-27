// Four separately authored papers at each checkpoint. Options stay in printed order.
// Rows: question, English question, three options, key, German evidence, English evidence.
function reading(cp, teil, sources) {
  return { papers: sources.map(([text, rows], round) => rows.map(([question, questionEn, options, key, explanationDe, explanationEn], i) => ({
    id: `a21-cp${cp}-lesen-r${round}-${i + 1}`, groupId: `a21-cp${cp}-lesen-r${round}`,
    teil, kind: teil === 'Lesen Teil 4' ? 'match' : 'mc3', text,
    question, questionEn, options, answer: options[key], explanationDe, explanationEn,
  }))) };
}

export const A21_LESEN = [
  reading(1, 'Lesen Teil 3', [
    ['Liebe Lena, am Samstag ziehen wir um. Mein Bruder kommt um neun mit dem Auto. Kannst du schon um acht kommen? Um sieben bin ich noch nicht da. Zuerst packen wir die Bücher ein. Die Küche räumen wir am Sonntag auf. Den Schlüssel hat jetzt meine Mutter. Kannst du sie bitte anrufen? Danke, Ana', [
      ['Wann soll Lena kommen?', 'When should Lena come?', ['um acht', 'um neun', 'um sieben'], 0, 'Ana bittet Lena um acht zu kommen.', 'Ana asks Lena to come at eight.'],
      ['Was machen sie zuerst?', 'What do they do first?', ['die Küche aufräumen', 'die Bücher einpacken', 'das Auto abholen'], 1, 'Zuerst packen sie die Bücher ein.', 'They first pack the books.'],
      ['Wer hat den Schlüssel?', 'Who has the key?', ['Anas Bruder', 'Lenas Mutter', 'Anas Mutter'], 2, 'Den Schlüssel hat Anas Mutter.', 'Ana’s mother has the key.'],
      ['Warum schreibt Ana?', 'Why is Ana writing?', ['Sie braucht Hilfe.', 'Sie sucht ein Auto.', 'Sie sucht Bücher.'], 0, 'Ana bittet Lena um Hilfe beim Umzug.', 'Ana asks Lena to help with the move.'],
    ]],
    ['Hallo Tim, danke für deine Hilfe! Das Sofa steht jetzt im Wohnzimmer. Der Tisch passt nicht in die Küche. Er steht auf dem Balkon. Die Lampe hängt schon über dem Sofa. Einen Tisch und eine Lampe haben wir also. Wir brauchen noch zwei Stühle. Kannst du die Stühle bei meinem Opa abholen? Meine Mutter arbeitet bis drei, mein Bruder bis neun. Mein Opa ist heute bis fünf zu Hause. Viele Grüße, Lena', [
      ['Wo steht der Tisch?', 'Where is the table?', ['im Wohnzimmer', 'auf dem Balkon', 'in der Küche'], 1, 'Der Tisch steht auf dem Balkon.', 'The table is on the balcony.'],
      ['Was braucht Lena noch?', 'What does Lena still need?', ['eine Lampe', 'einen Tisch', 'zwei Stühle'], 2, 'Lena braucht noch zwei Stühle.', 'Lena still needs two chairs.'],
      ['Bei wem soll Tim etwas abholen?', 'Who should Tim collect something from?', ['bei Lenas Opa', 'bei Lenas Mutter', 'bei Lenas Bruder'], 0, 'Die Stühle sind bei Lenas Opa.', 'The chairs are at Lena’s grandfather’s.'],
      ['Bis wann kann Tim die Stühle abholen?', 'Until when can Tim collect the chairs?', ['bis drei', 'bis fünf', 'bis neun'], 1, 'Er ist bis fünf zu Hause.', 'He is at home until five.'],
    ]],
    ['Liebe Ana, wir besuchen euch am Sonntag. Dein Vater hat den Computer für dich eingepackt. Bücher und Möbel bleiben hier. Ich bringe Omas Bilder mit. Dein Bruder kann nicht mitkommen; er arbeitet. Wir kommen um elf, nicht um zehn. Können wir das Auto vor eurem Haus parken? Kannst du uns bitte heute Abend anrufen? Liebe Grüße, Mama', [
      ['Wer kommt nicht mit?', 'Who is not coming?', ['Anas Vater', 'Anas Mutter', 'Anas Bruder'], 2, 'Anas Bruder muss arbeiten.', 'Ana’s brother is working.'],
      ['Was bekommt Ana von ihrer Mutter?', 'What does Ana receive from her mother?', ['Bilder', 'Bücher', 'Möbel'], 0, 'Die Mutter bringt Omas Bilder mit.', 'The mother is bringing Grandma’s pictures.'],
      ['Wann kommen die Eltern?', 'When are the parents arriving?', ['um zehn', 'um elf', 'am Abend'], 1, 'Die Eltern kommen um elf.', 'The parents are coming at eleven.'],
      ['Was soll Ana heute machen?', 'What should Ana do today?', ['das Auto abholen', 'den Computer einpacken', 'die Eltern anrufen'], 2, 'Ana soll ihre Eltern heute Abend anrufen.', 'Ana should call her parents this evening.'],
    ]],
    ['Guten Tag Frau Brandt, am Dienstag kommt Ihr Regal. Bitte bleiben Sie zwischen zehn und zwölf zu Hause. Unsere Mitarbeiter stellen es ins Wohnzimmer. Der Aufzug ist klein; das Regal passt nicht hinein. Deshalb nehmen sie die Treppe. Bitte stellen Sie Ihr Fahrrad in den Keller. Vielen Dank! Ihr Möbelhaus', [
      ['Was bekommt Frau Brandt?', 'What is Ms Brandt receiving?', ['ein Regal', 'ein Fahrrad', 'einen Tisch'], 0, 'Am Dienstag kommt ihr Regal.', 'Her shelf arrives on Tuesday.'],
      ['Wo soll das Regal stehen?', 'Where should the shelf go?', ['im Keller', 'im Wohnzimmer', 'auf dem Balkon'], 1, 'Die Mitarbeiter stellen es ins Wohnzimmer.', 'The staff put it in the living room.'],
      ['Wie kommt das Regal nach oben?', 'How does the shelf get upstairs?', ['mit dem Aufzug', 'über den Balkon', 'über die Treppe'], 2, 'Die Mitarbeiter nehmen die Treppe.', 'The staff use the stairs.'],
      ['Was soll Frau Brandt machen?', 'What should Ms Brandt do?', ['das Fahrrad wegstellen', 'den Aufzug öffnen', 'das Regal abholen'], 0, 'Sie soll ihr Fahrrad in den Keller stellen.', 'She should put her bicycle in the cellar.'],
    ]],
  ]),
  reading(2, 'Lesen Teil 2', [
    ['KAUFHAUS · Erdgeschoss: Lebensmittel, Blumen, Kasse. Erster Stock: Kleidung, Schuhe. Zweiter Stock: Bücher, Computer. Dritter Stock: Café, Toiletten. Heute: Das Café öffnet erst um zwölf. Im Café bekommen Sie heute keine Blumen. Kaufen Sie sie an der Kasse.', [
      ['Sie möchten einen Computer kaufen. Wohin gehen Sie?', 'Where can you buy a computer?', ['ins Erdgeschoss', 'in den zweiten Stock', 'in den dritten Stock'], 1, 'Computer gibt es in Etage 2.', 'Computers are on the second floor.'],
      ['Wo bekommen Sie heute Blumen?', 'Where can you get flowers today?', ['in Etage 1', 'im Café', 'an der Kasse'], 2, 'Heute gibt es Blumen an der Kasse.', 'Today flowers are at the checkout.'],
      ['Sie möchten um elf Kaffee trinken. Was stimmt?', 'You want coffee at eleven. What is true?', ['Das Café ist noch zu.', 'Das Café ist schon auf.', 'Das Café ist unten.'], 0, 'Das Café öffnet erst um zwölf.', 'The café does not open until twelve.'],
      ['Wo finden Sie Schuhe?', 'Where can you find shoes?', ['in Etage 2', 'in Etage 1', 'im Erdgeschoss'], 1, 'Schuhe gibt es in Etage 1.', 'Shoes are on the first floor.'],
    ]],
    ['MARKT · Stand A: Obst aus der Region. Stand B: Gemüse und Salat. Stand C: Käse und Brot. Stand D: Blumen und Pflanzen. Heute keine Tomaten an Stand B! Tomaten gibt es bei Stand A. Stand C schließt heute um eins, alle anderen um drei.', [
      ['Wo kaufen Sie heute Tomaten?', 'Where do you buy tomatoes today?', ['bei Stand B', 'bei Stand D', 'bei Stand A'], 2, 'Heute gibt es Tomaten bei Stand A.', 'Today tomatoes are at stall A.'],
      ['Wo bekommen Sie ein Brot?', 'Where can you get bread?', ['bei Stand C', 'bei Stand B', 'bei Stand D'], 0, 'Stand C verkauft Käse und Brot.', 'Stall C sells cheese and bread.'],
      ['Bis wann können Sie Käse kaufen?', 'Until when can you buy cheese?', ['bis drei', 'bis eins', 'bis zwölf'], 1, 'Stand C schließt um eins.', 'Stall C closes at one.'],
      ['Sie suchen eine Pflanze. Wohin gehen Sie?', 'Where do you go for a plant?', ['zu Stand A', 'zu Stand C', 'zu Stand D'], 2, 'Pflanzen gibt es bei Stand D.', 'Plants are at stall D.'],
    ]],
    ['HAUS AM MARKT · Erdgeschoss: Eingang, Information, Garderobe. Erster Stock: Raum 1 – Geburtstag Familie Sommer, Raum 2 – Deutschkurs. Zweiter Stock: Raum 3 – Essen für alle Gäste. Achtung: Der Deutschkurs findet heute im Erdgeschoss statt. Das Essen beginnt um sieben, die Geburtstagsfeier um sechs.', [
      ['Sie gehen heute zum Deutschkurs. Wohin gehen Sie?', 'Where is the German class today?', ['ins Erdgeschoss', 'in den ersten Stock', 'in den zweiten Stock'], 0, 'Heute ist der Deutschkurs im Erdgeschoss.', 'Today the German class is on the ground floor.'],
      ['Wo feiert Familie Sommer?', 'Where is the Sommer family celebrating?', ['in Raum 3', 'in Raum 1', 'in Raum 2'], 1, 'Der Geburtstag ist in Raum 1.', 'The birthday is in room 1.'],
      ['Wann beginnt das Essen?', 'When does the meal start?', ['um fünf', 'um sechs', 'um sieben'], 2, 'Das Essen beginnt um sieben.', 'The meal starts at seven.'],
      ['Wo können Sie Ihren Mantel lassen?', 'Where can you leave your coat?', ['im Erdgeschoss', 'in Etage 2', 'in Raum 2'], 0, 'Die Garderobe ist im Erdgeschoss.', 'The cloakroom is on the ground floor.'],
    ]],
    ['BUCHHAUS · Unten: Romane und Kasse. Mitte: Kinderbücher und Kalender. Oben: Bücher über Kochen und Reisen. Geschenke packen wir heute kostenlos an der Kasse ein. Die Veranstaltung mit Frau Sommer beginnt um vier oben. Die Abteilung Kochen schließt heute schon um drei.', [
      ['Sie suchen ein Kinderbuch für Ihre Tochter. Wohin gehen Sie?', 'Where do you look for a children’s book for your daughter?', ['nach oben', 'in die Mitte', 'nach unten'], 1, 'Kinderbücher finden Sie in der Mitte.', 'Children’s books are in the middle.'],
      ['Sie möchten ein Buch verschenken. Wo packt das Team Ihr Geschenk ein?', 'Where will the staff wrap your gift?', ['bei den Romanen', 'bei den Kalendern', 'an der Kasse'], 2, 'An der Kasse packt das Team Geschenke ein.', 'Gifts are wrapped at the checkout.'],
      ['Wann können Sie Frau Sommer hören?', 'When can you listen to Ms Sommer?', ['um vier', 'um drei', 'um fünf'], 0, 'Die Veranstaltung beginnt um vier.', 'The event starts at four.'],
      ['Wann können Sie ein Kochbuch kaufen?', 'When can you buy a cookbook?', ['um vier', 'um zwei', 'um fünf'], 1, 'Die Abteilung schließt schon um drei.', 'The department closes at three.'],
    ]],
  ]),
  reading(3, 'Lesen Teil 4', [
    ['A · Fußball am Montagabend. Nur für Erwachsene mit Erfahrung. B · Volleyball am Mittwoch, auch ohne Erfahrung. C · Schwimmen für Kinder, Samstagmorgen. D · Training zu Hause: Übungen als Video. E · Laufgruppe am Sonntag im Park. F · Tanzkurs für Paare am Freitag.', [
      ['Tim hat an Werktagen keine Zeit. Er möchte mit anderen Menschen draußen Sport machen.', 'Tim has no time on weekdays and wants to exercise outdoors with other people.', ['A', 'B', 'C', 'D', 'E', 'F'], 4, 'Die Laufgruppe ist sonntags im Park.', 'The running group meets outdoors on Sunday.'],
      ['Lena mag Musik. Ihr Mann auch. Sie suchen etwas für zwei Personen.', 'Lena and her husband enjoy music and want an activity for two people.', ['A', 'B', 'C', 'D', 'E', 'F'], 5, 'Der Tanzkurs ist für Paare.', 'The dance class is for couples.'],
      ['Bei einem Spiel mit Ball war Ana noch nie dabei. Sie möchte es jetzt lernen.', 'Ana has never played a ball game and wants to learn now.', ['A', 'B', 'C', 'D', 'E', 'F'], 1, 'Beim Volleyball braucht man keine Erfahrung.', 'The volleyball class accepts beginners.'],
      ['Jonas möchte in seiner Wohnung aktiv sein. Er hat keine Zeit für den Weg zum Verein.', 'Jonas wants to exercise in his flat because he has no time to travel to a club.', ['A', 'B', 'C', 'D', 'E', 'F'], 3, 'Das Video bietet Übungen für zu Hause.', 'The video provides exercises at home.'],
    ]],
    ['A · Praxis Sommer: Sprechstunde für Kinder. B · Computerhilfe: Wir erklären Ihnen Ihr neues Programm. C · Praxis Novak: Untersuchung nach einem Sportunfall. D · Apotheke am Markt: Medikamente, auch am Sonntag. E · Bürohilfe: Wir drucken Ihre Dateien. F · Verein: Beratung zu Sport und gesundem Essen.', [
      ['Ana braucht heute etwas gegen Husten. Gestern war Samstag.', 'Ana needs something for a cough today. Yesterday was Saturday.', ['A', 'B', 'C', 'D', 'E', 'F'], 3, 'Die Apotheke ist auch sonntags geöffnet.', 'The pharmacy is open on Sundays.'],
      ['Tims Tochter ist sechs Jahre alt. Sie hat Husten. Tim möchte eine Untersuchung für sie.', 'Tim’s daughter is six years old. She has a cough, and Tim wants her to be examined.', ['A', 'B', 'C', 'D', 'E', 'F'], 0, 'Praxis Sommer hat eine Sprechstunde für Kinder.', 'The Sommer practice has appointments for children.'],
      ['Lena ist beim Fußball gefallen. Ihr Bein tut weh.', 'Lena fell playing football and her leg hurts.', ['A', 'B', 'C', 'D', 'E', 'F'], 2, 'Praxis Novak untersucht Menschen nach Sportunfällen.', 'The Novak practice examines sports injuries.'],
      ['Jonas braucht seinen Vertrag auf Papier. Er hat ihn nur auf dem Computer.', 'Jonas needs a paper copy of a contract that he only has on his computer.', ['A', 'B', 'C', 'D', 'E', 'F'], 4, 'Die Bürohilfe druckt Dateien.', 'The office service prints files.'],
    ]],
    ['A · Firma Sommer sucht Bürokräfte für den Vormittag. B · Computerkurs am Abend: Dateien öffnen und speichern. C · Sportverein sucht Trainer für Kinder. D · Kostenlos: Hilfe bei Ihrer Bewerbung. E · Praxis sucht eine Kollegin für die Sprechstunde am Abend. F · Deutsch im Beruf: Kurs für Menschen mit Büroerfahrung.', [
      ['Lena möchte lernen, wie sie eine Datei speichert.', 'Lena wants to learn how to save a file.', ['A', 'B', 'C', 'D', 'E', 'F'], 1, 'Der Computerkurs erklärt das Speichern.', 'The computer course teaches saving files.'],
      ['Tim muss ab zwölf für sein Kind da sein. Bis dahin möchte er arbeiten.', 'Tim needs to care for his child from noon and wants to work before then.', ['A', 'B', 'C', 'D', 'E', 'F'], 0, 'Firma Sommer sucht Hilfe am Vormittag.', 'The Sommer company needs morning office staff.'],
      ['Ana arbeitet seit fünf Jahren im Büro. Sie möchte besser mit ihren Kollegen sprechen.', 'Ana has worked in an office for five years and wants to communicate better with her colleagues.', ['A', 'B', 'C', 'D', 'E', 'F'], 5, 'Der Deutschkurs ist für Menschen mit Büroerfahrung.', 'The German course is for experienced office workers.'],
      ['Jonas möchte Jungen und Mädchen Übungen zeigen.', 'Jonas wants to show boys and girls exercises.', ['A', 'B', 'C', 'D', 'E', 'F'], 2, 'Der Verein sucht einen Trainer für Kinder.', 'The club needs a children’s coach.'],
    ]],
    ['A · Hilfe bei Verträgen: Wir erklären Arbeitszeit und Gehalt. B · Arztpraxis: Neue Termine am Samstag. C · Sport für Erwachsene, Dienstag um acht. D · Büroservice: Computer abholen und reparieren. E · Deutschkurs: Schreiben Sie eine gute Bewerbung. F · Geschenke aus Blumen: Wir bringen sie zu Ihnen.', [
      ['Ana sucht Arbeit. Wie schreibt man dafür einen Brief?', 'Ana is looking for work and needs to learn how to write an application letter.', ['A', 'B', 'C', 'D', 'E', 'F'], 4, 'Im Deutschkurs schreiben Sie eine Bewerbung.', 'The German course covers application writing.'],
      ['Lena hat eine neue Stelle. Sie versteht die Angaben zu ihren Stunden und ihrem Geld nicht.', 'Lena has a new job and does not understand the information about her hours and pay.', ['A', 'B', 'C', 'D', 'E', 'F'], 0, 'Die Beratung erklärt Verträge.', 'The advice service explains contracts.'],
      ['Tim hat von Montag bis Freitag keine Zeit. Ein Arzt soll sein Bein untersuchen.', 'Tim has no time Monday to Friday and needs a doctor to examine his leg.', ['A', 'B', 'C', 'D', 'E', 'F'], 1, 'Die Praxis bietet Samstagstermine an.', 'The practice offers Saturday appointments.'],
      ['Jonas braucht Hilfe mit seinem kaputten PC. Er kann ihn nicht aus dem Haus tragen.', 'Jonas needs help with his broken PC and cannot carry it out of the house.', ['A', 'B', 'C', 'D', 'E', 'F'], 3, 'Der Büroservice holt Computer ab.', 'The office service collects computers.'],
    ]],
  ]),
  reading(4, 'Lesen Teil 1', [
    ['Neue Führung in Bremen. Jeden Samstag zeigt Frau Sommer Gästen die Stadt. Der Rundgang beginnt um zehn am Rathaus und endet um zwölf am Hafen. Erwachsene bezahlen acht Euro, Kinder vier. Mit einem Stadtplan kostet die Führung für Erwachsene zwölf Euro. Das Museum gehört nicht zur Führung. Bei Regen findet der Rundgang trotzdem statt. Bitte buchen Sie bis Freitag im Internet.', [
      ['Wo beginnt die Führung?', 'Where does the tour start?', ['am Hafen', 'am Rathaus', 'am Museum'], 1, 'Die Führung beginnt am Rathaus.', 'The tour begins at the town hall.'],
      ['Wie lange dauert der Rundgang?', 'How long is the walk?', ['eine Stunde', 'drei Stunden', 'zwei Stunden'], 2, 'Von zehn bis zwölf sind es zwei Stunden.', 'Ten until twelve is two hours.'],
      ['Was bezahlt ein Kind?', 'What does a child pay?', ['vier Euro', 'acht Euro', 'zwölf Euro'], 0, 'Kinder bezahlen vier Euro.', 'Children pay four euros.'],
      ['Was passiert bei Regen?', 'What happens if it rains?', ['Die Gäste gehen ins Museum.', 'Die Führung findet statt.', 'Die Gäste bekommen ihr Geld zurück.'], 1, 'Auch bei Regen findet der Rundgang statt.', 'The walk takes place even in rain.'],
    ]],
    ['Ein Museum für alle. Das kleine Museum an der Brücke ist ab Mai auch sonntags geöffnet. Am ersten Sonntag im Monat ist der Eintritt kostenlos. Fotos sind erlaubt. Bitte trinken Sie Kaffee und essen Sie Kuchen nur draußen. Familien bekommen am Eingang einen Stadtplan. Das Café neben dem Museum schließt schon um vier; das Museum öffnet um drei und ist bis sechs geöffnet.', [
      ['Was ist ab Mai neu?', 'What changes in May?', ['ein neues Café', 'ein neuer Stadtplan', 'sonntags geöffnet'], 2, 'Ab Mai öffnet das Museum auch sonntags.', 'From May the museum also opens on Sundays.'],
      ['Wann kostet der Eintritt nichts?', 'When is entry free?', ['am ersten Sonntag', 'an jedem Sonntag', 'an jedem Samstag'], 0, 'Am ersten Sonntag im Monat ist der Eintritt frei.', 'Entry is free on the first Sunday of the month.'],
      ['Was dürfen Gäste im Museum machen?', 'What may visitors do inside?', ['Kaffee trinken', 'Fotos machen', 'Kuchen essen'], 1, 'Fotos sind erlaubt.', 'Photographs are allowed.'],
      ['Wie lange ist das Museum geöffnet?', 'Until when is the museum open?', ['bis drei', 'bis vier', 'bis sechs'], 2, 'Das Museum schließt um sechs.', 'The museum closes at six.'],
    ]],
    ['Mit dem Bus zum Hafen. Ab Montag fährt die Linie 8 vom Bahnhof direkt zum Hafen. Die Fahrt dauert zwanzig Minuten. Am Wochenende fährt der Bus nur einmal pro Stunde, sonst zweimal. Die Linie 9 fährt dreimal pro Stunde. Eine Fahrkarte kostet drei Euro. Auch Gäste ohne Gepäck brauchen eine Fahrkarte. Wer eine Monatskarte hat, braucht keine neue Fahrkarte. Fahrräder können leider nicht mitfahren.', [
      ['Wo beginnt die neue Fahrt?', 'Where does the new service start?', ['am Bahnhof', 'am Rathaus', 'am Flughafen'], 0, 'Die Linie 8 fährt vom Bahnhof ab.', 'Route 8 starts at the station.'],
      ['Wie oft fährt der Bus samstags?', 'How often does the bus run on Saturdays?', ['zweimal pro Stunde', 'einmal pro Stunde', 'dreimal pro Stunde'], 1, 'Am Wochenende fährt er einmal pro Stunde.', 'At weekends it runs once an hour.'],
      ['Wer braucht keine neue Fahrkarte?', 'Who needs no new ticket?', ['Gäste mit Fahrrad', 'Gäste ohne Gepäck', 'Gäste mit Monatskarte'], 2, 'Die Monatskarte gilt auch hier.', 'The monthly pass is valid here too.'],
      ['Was darf nicht mit in den Bus?', 'What cannot be taken on the bus?', ['ein Fahrrad', 'ein Stadtplan', 'ein Koffer'], 0, 'Fahrräder können nicht mitfahren.', 'Bicycles cannot be carried.'],
    ]],
    ['Gäste kochen zusammen. Am Freitag kommen Menschen aus verschiedenen Ländern ins Haus am Markt. Jeder bringt Gemüse mit; Brot und Getränke gibt es im Haus. Um sechs beginnt das Kochen, um acht essen alle zusammen. Kinder können mitkommen. Erwachsene und Kinder bezahlen fünf Euro. Man muss kein Mitglied sein. Bitte buchen Sie bis Mittwoch telefonisch.', [
      ['Was bringen die Gäste mit?', 'What do guests bring?', ['Getränke', 'Gemüse', 'Brot'], 1, 'Jeder bringt Gemüse mit.', 'Everyone brings vegetables.'],
      ['Wann essen die Gäste?', 'When do the guests eat?', ['um sechs', 'um sieben', 'um acht'], 2, 'Um acht essen alle zusammen.', 'Everyone eats together at eight.'],
      ['Wer darf mitkommen?', 'Who may come too?', ['auch Kinder', 'nur Erwachsene', 'nur Mitglieder'], 0, 'Kinder können mitkommen.', 'Children may come too.'],
      ['Wie buchen Sie einen Platz?', 'How do you register?', ['per E-Mail', 'per Telefon', 'an der Kasse'], 1, 'Die Anmeldung ist telefonisch bis Mittwoch.', 'Registration is by phone by Wednesday.'],
    ]],
  ]),
];

const PICTURES = {
  Fahrrad: ['fahrrad', 'Ein Fahrrad'], Bus: ['bus', 'Ein Bus'], 'zu Fuß': ['gehen', 'Eine Person geht zu Fuß'],
  Wasser: ['wasser', 'Ein Glas Wasser'], Kaffee: ['kaffee', 'Eine Tasse Kaffee'], Saft: ['saft', 'Ein Glas Orangensaft'],
  laufen: ['laufen', 'Eine Person läuft'], schwimmen: ['schwimmen', 'Eine Person schwimmt'], tanzen: ['tanzen', 'Zwei Personen tanzen'],
};
function listening(cp, teil, papers) {
  return { papers: papers.map((rows, round) => rows.map(([audioText, question, questionEn, options, key, explanationDe, explanationEn], i) => ({
    id: `a21-cp${cp}-hoeren-r${round}-${i + 1}`, groupId: `a21-cp${cp}-hoeren-r${round}`,
    teil, kind: options ? teil === 'Hören Teil 2' ? 'match' : teil === 'Hören Teil 4' ? 'trueFalse' : 'mc3' : 'dictation',
    audioText, question, questionEn, ...(options ? { options } : {}), answer: options ? options[key] : audioText,
    explanationDe, explanationEn,
    ...(teil === 'Hören Teil 3' ? { pictures: options.map(option => ({ option, src: `/images/course/a21/${PICTURES[option][0]}.svg`, alt: PICTURES[option][1] })) } : {}),
  }))) };
}
const dictation = (de, en) => [de, 'Hören Sie und schreiben Sie den Satz.', 'Listen and write the sentence.', null, null, `Der Satz lautet: ${de}`, `The sentence means: ${en}`];
const yn = (audio, question, questionEn, yes, de, en) => [audio, question, questionEn, ['Ja', 'Nein'], yes ? 0 : 1, de, en];

export const A21_HOEREN = [
  listening(1, 'Hören Teil 4', [
    [
      dictation('Meine Schwester kommt am Samstag.', 'My sister is coming on Saturday.'),
      dictation('Das Bild hängt über dem Sofa.', 'The picture hangs above the sofa.'),
      yn('Ana: Kommst du morgen mit dem Auto? Tim: Nein, mein Bruder braucht es. Ich komme mit dem Bus.', 'Tim kommt mit dem Auto.', 'Tim is coming by car.', false, 'Tims Bruder braucht das Auto.', 'Tim’s brother needs the car.'),
      yn('Lena: Steht der Tisch in der Küche? Ana: Nein, dort ist wenig Platz. Er steht jetzt auf dem Balkon.', 'Der Tisch steht auf dem Balkon.', 'The table is on the balcony.', true, 'Ana hat den Tisch auf den Balkon gestellt.', 'Ana has put the table on the balcony.'),
      yn('Tim: Hast du die Bücher eingepackt? Ana: Ja. Jetzt packe ich noch die Bilder ein.', 'Ana hat die Bilder schon eingepackt.', 'Ana has already packed the pictures.', false, 'Ana packt die Bilder erst jetzt ein.', 'Ana is only packing the pictures now.'),
    ],
    [
      dictation('Unser Vater hat die Möbel abgeholt.', 'Our father collected the furniture.'),
      dictation('Die Lampe steht neben dem Fenster.', 'The lamp stands beside the window.'),
      yn('Lena: Hast du deinen Opa angerufen? Ana: Ja, er kommt am Sonntag. Seine Schwester kommt auch.', 'Anas Opa kommt am Sonntag.', 'Ana’s grandfather is coming on Sunday.', true, 'Ana sagt: Er kommt am Sonntag.', 'Ana says he is coming on Sunday.'),
      yn('Tim: Ist das dein Handy? Lena: Nein, das ist Anas Handy. Meins ist zu Hause.', 'Das Handy gehört Lena.', 'The phone belongs to Lena.', false, 'Das Handy gehört Ana.', 'The phone belongs to Ana.'),
      yn('Ana: Liegt der Schlüssel auf dem Tisch? Tim: Schau mal neben dem Computer. Ana: Ja, da ist er!', 'Der Schlüssel liegt neben dem Computer.', 'The key is beside the computer.', true, 'Ana findet den Schlüssel neben dem Computer.', 'Ana finds the key beside the computer.'),
    ],
    [
      dictation('Omas Garten ist sehr schön.', 'Grandma’s garden is very beautiful.'),
      dictation('Wir haben die Küche aufgeräumt.', 'We tidied the kitchen.'),
      yn('Ana: Hast du morgen Zeit? Lena: Am Morgen arbeite ich. Ab zwei kann ich helfen.', 'Lena kann am Morgen helfen.', 'Lena can help in the morning.', false, 'Lena arbeitet am Morgen.', 'Lena works in the morning.'),
      yn('Tim: Soll ich die Pflanze auf den Balkon stellen? Ana: Nein, die Pflanze kommt neben das Fenster.', 'Ana möchte die Pflanze neben dem Fenster haben.', 'Ana wants the plant beside the window.', true, 'Ana möchte die Pflanze neben das Fenster stellen.', 'Ana wants the plant placed beside the window.'),
      yn('Lena: Wohnst du jetzt mit deinem Bruder? Ana: Nein, mit meiner Schwester. Mein Bruder wohnt allein.', 'Ana wohnt mit ihrem Bruder.', 'Ana lives with her brother.', false, 'Ana wohnt mit ihrer Schwester.', 'Ana lives with her sister.'),
    ],
    [
      dictation('Das ist das Auto von meinem Bruder.', 'That is my brother’s car.'),
      dictation('Bitte stellen Sie das Regal an die Wand.', 'Please put the shelf against the wall.'),
      yn('Tim: Wann holst du die Möbel ab? Lena: Heute Abend. Mein Vater hilft mir.', 'Lenas Vater hilft beim Abholen.', 'Lena’s father helps with the collection.', true, 'Lenas Vater hilft ihr.', 'Lena’s father helps her.'),
      yn('Ana: Wohnt deine Mutter in Köln? Tim: Nein, mein Vater wohnt dort. Meine Mutter wohnt in Bremen.', 'Tims Mutter wohnt in Köln.', 'Tim’s mother lives in Cologne.', false, 'Tims Mutter wohnt in Bremen.', 'Tim’s mother lives in Bremen.'),
      yn('Lena: Ist die Lampe noch im Keller? Ana: Nein, ich habe sie geholt. Sie steht jetzt im Wohnzimmer.', 'Die Lampe ist jetzt im Wohnzimmer.', 'The lamp is now in the living room.', true, 'Ana hat die Lampe ins Wohnzimmer geholt.', 'Ana has brought the lamp into the living room.'),
    ],
  ]),
  listening(2, 'Hören Teil 1', [
    [
      ['Guten Tag, hier ist das Kaufhaus. Sie haben einen Tisch bestellt. Er kommt nicht am Dienstag, sondern am Donnerstag. Bitte bleiben Sie zwischen neun und elf zu Hause.', 'An welchem Tag kommt der Tisch?', 'On which day does the table arrive?', ['Dienstag', 'Mittwoch', 'Donnerstag'], 2, 'Der neue Tag ist Donnerstag.', 'The new day is Thursday.'],
      ['Hallo Ana, hier ist Lena. Zum Fest bringe ich einen Kuchen mit. Tim kauft Getränke. Kannst du bitte Salat machen? Brot habe ich schon.', 'Was soll Ana mitbringen?', 'What should Ana bring?', ['Salat', 'Brot', 'Kuchen'], 0, 'Lena bittet Ana um Salat.', 'Lena asks Ana for salad.'],
['Liebe Kunden, ein Kilo rote Äpfel kostet zwei Euro und ein Kilo Birnen drei Euro. Frische Tomaten bekommen Sie für einen Euro.', 'Was kostet ein Kilo Äpfel?', 'What does a kilo of apples cost?', ['einen Euro', 'zwei Euro', 'drei Euro'], 1, 'Die Äpfel kosten zwei Euro.', 'The apples cost two euros.'],
      ['Guten Tag Frau Chakiri, hier ist Frau Sommer. Unser Termin um drei geht leider nicht. Können Sie um fünf kommen? Um vier habe ich noch einen anderen Termin.', 'Wann möchte Frau Sommer Ana treffen?', 'When does Ms Sommer want to meet Ana?', ['um drei', 'um vier', 'um fünf'], 2, 'Frau Sommer schlägt fünf Uhr vor.', 'Ms Sommer suggests five o’clock.'],
      ['Hallo Tim, die Blumen für Oma habe ich schon gekauft. Kannst du sie im Laden am Markt abholen? Du brauchst nichts zu bezahlen.', 'Was soll Tim machen?', 'What should Tim do?', ['Blumen abholen', 'Blumen bezahlen', 'Blumen bestellen'], 0, 'Tim soll die gekauften Blumen abholen.', 'Tim should collect the flowers already bought.'],
    ],
    [
      ['Hallo Lena, unser Fest ist am Samstag. Wir essen diesmal nicht im Garten. Es regnet. Kannst du direkt in die Küche kommen? Dort ist der Tisch schon fertig.', 'Wo essen die Gäste?', 'Where will the guests eat?', ['im Garten', 'in der Küche', 'auf dem Balkon'], 1, 'Es regnet. Sie essen in der Küche.', 'They eat in the kitchen because of the rain.'],
      ['Guten Tag, hier ist Ihr Lebensmittelgeschäft. Wir schließen heute um sechs. Am Samstag sind wir bis acht für Sie da. Sonntags bleibt der Laden zu.', 'Sie kaufen am Samstag ein. Wann müssen Sie fertig sein?', 'When must you finish shopping on Saturday?', ['bis vier', 'bis sechs', 'bis acht'], 2, 'Samstags ist bis acht geöffnet.', 'On Saturday it is open until eight.'],
      ['Hallo Ana, danke für die Einladung. Ich konnte gestern nicht anrufen. Die Nummer war richtig, und ich hatte Zeit. Aber mein Handy war kaputt. Zum Geburtstag komme ich gern. Bis Sonntag!', 'Warum konnte der Gast nicht anrufen?', 'Why could the guest not call?', ['ein kaputtes Telefon', 'keine Zeit', 'eine falsche Nummer'], 0, 'Das Handy war kaputt.', 'The phone was broken.'],
      ['Guten Tag Frau Brandt, Ihre Kette ist fertig. Sie können sie am Freitag abholen. Bitte bringen Sie die Karte mit. Ohne die Karte können wir Ihnen die Kette nicht geben.', 'Was soll Frau Brandt mitbringen?', 'What should Ms Brandt bring?', ['ihren Schlüssel', 'ihre Karte', 'ihre Blumen'], 1, 'Sie braucht die Karte.', 'She needs the card.'],
      ['Achtung, liebe Gäste! Um sechs bekommen Sie Getränke im Garten und um sieben beginnt das Essen. Bitte nehmen Sie dort Platz.', 'Wann beginnt das Essen?', 'When does the meal begin?', ['um fünf', 'um sechs', 'um sieben'], 2, 'Das Essen beginnt um sieben.', 'The meal begins at seven.'],
    ],
    [
      ['Hallo Tim, ich kann am Dienstag nicht helfen. Mein Chef braucht mich im Büro. Am Mittwoch habe ich frei. Passt dir Mittwoch?', 'Wann kann die Person helfen?', 'When can the person help?', ['am Mittwoch', 'am Dienstag', 'am Donnerstag'], 0, 'Am Mittwoch hat die Person frei.', 'The person is free on Wednesday.'],
      ['Liebe Kunden, unser Käse ist heute besonders günstig. Ein Stück kostet vier Euro. Zwei Stück kosten zusammen sieben Euro. Das Brot kostet drei Euro.', 'Was kosten zwei Stück Käse?', 'What do two pieces of cheese cost?', ['vier Euro', 'sieben Euro', 'acht Euro'], 1, 'Zwei Stück kosten sieben Euro.', 'Two pieces cost seven euros.'],
      ['Guten Tag Frau Chakiri, hier ist das Café. Sie haben für sechs Personen bestellt. Ihr Tisch steht am Fenster. Nicht am Eingang! Wir sehen Sie um drei.', 'Wo steht der Tisch?', 'Where is the table?', ['am Eingang', 'im Garten', 'am Fenster'], 2, 'Der Tisch steht am Fenster.', 'The table is by the window.'],
      ['Hallo Lena, ich möchte meinem Onkel ein Geschenk kaufen. Ein neues Buch braucht er nicht, er hat schon viele Bücher. Einen kleinen Kuchen backe ich für alle Gäste. Als Geschenk kaufe ich ihm eine schöne Flasche Öl. Er kocht sehr gern.', 'Was kauft die Person als Geschenk für den Onkel?', 'What does the person buy as a gift for the uncle?', ['eine Flasche Öl', 'ein neues Buch', 'einen kleinen Kuchen'], 0, 'Die Person kauft dem Onkel Öl als Geschenk.', 'The person buys oil as a gift for the uncle.'],
      ['Liebe Gäste, bitte bezahlen Sie Ihr Essen an der Kasse. Getränke bezahlen Sie direkt im Café. Die Toiletten finden Sie neben dem Eingang.', 'Wo bezahlen Sie das Essen?', 'Where do you pay for the food?', ['im Café', 'an der Kasse', 'am Eingang'], 1, 'Das Essen bezahlen Sie an der Kasse.', 'Pay for food at the checkout.'],
    ],
    [
      ['Hallo Ana, ich komme zum Geburtstag. Ich bringe meine Schwester mit. Mein Bruder muss arbeiten und meine Mutter ist im Urlaub.', 'Wen bringt der Gast mit?', 'Who is the guest bringing?', ['seinen Bruder', 'seine Mutter', 'seine Schwester'], 2, 'Die Schwester kommt mit.', 'The sister is coming too.'],
      ['Guten Tag, Ihre Bestellung ist fertig. Der rote Salat war leider nicht da. Wir haben Ihnen grünen Salat eingepackt. Die Tomaten und das Brot sind dabei.', 'Was war nicht da?', 'What was unavailable?', ['roter Salat', 'frische Tomaten', 'kleines Brot'], 0, 'Der rote Salat war nicht da.', 'The red lettuce was unavailable.'],
      ['Hallo Tim, kannst du schon um vier kommen? Das Fest beginnt um fünf, aber ich brauche Hilfe in der Küche. Die anderen Gäste kommen erst um sechs.', 'Wann soll Tim kommen?', 'When should Tim arrive?', ['um fünf', 'um vier', 'um sechs'], 1, 'Tim soll um vier helfen.', 'Tim should help at four.'],
      ['Hier ist Frau Sommer. Unsere Veranstaltung findet am Freitag statt. Der Raum in Etage 1 ist leider zu klein. Wir nehmen den Raum in Etage 2.', 'Wo findet die Veranstaltung statt?', 'Where will the event take place?', ['im Erdgeschoss', 'in Etage 1', 'in Etage 2'], 2, 'Der Raum ist in Etage 2.', 'The room is on the second floor.'],
      ['Hallo Lena, am Sonntag wollte ich grillen. Leider regnet es. Ich möchte die Einladung auf Montag verschieben. Hast du dann Zeit?', 'An welchem Tag möchte die Person grillen?', 'On which day does the person now want to barbecue?', ['am Montag', 'am Sonntag', 'am Dienstag'], 0, 'Der neue Tag ist Montag.', 'The invitation moves to Monday.'],
    ],
  ]),
  listening(3, 'Hören Teil 3', [
    [
      ['Ana: Kommst du mit dem Bus zum Training? Tim: Nein, der fährt heute nicht. Ich nehme mein Fahrrad. Zu Fuß ist es zu weit.', 'Wie kommt Tim zum Training?', 'How does Tim get to training?', ['Bus', 'Fahrrad', 'zu Fuß'], 1, 'Tim nimmt sein Fahrrad.', 'Tim takes his bicycle.'],
      ['Lena: Möchtest du Kaffee? Ana: Lieber nicht, ich bin schon sehr aktiv. Saft ist mir zu süß. Hast du Wasser? Lena: Ja, hier.', 'Was trinkt Ana?', 'What does Ana drink?', ['Kaffee', 'Saft', 'Wasser'], 2, 'Ana möchte Wasser.', 'Ana wants water.'],
      ['Tim: Gehen wir heute schwimmen? Lena: Das Schwimmbad ist zu. Wir können im Park laufen. Zum Tanzen bin ich zu müde. Tim: Gut, dann zum Park.', 'Was machen die Freunde?', 'What do the friends do?', ['laufen', 'schwimmen', 'tanzen'], 0, 'Die Freunde laufen im Park.', 'The friends run in the park.'],
      ['Arzt: Wie kommen Sie nach Hause? Patient: Mit dem Fahrrad. Arzt: Ihr Bein braucht Ruhe. Nehmen Sie bitte den Bus. Patient: Gut, das mache ich.', 'Wie fährt der Patient nach Hause?', 'How will the patient go home?', ['Fahrrad', 'Bus', 'zu Fuß'], 1, 'Der Patient nimmt den Bus.', 'The patient takes the bus.'],
      ['Ana: Bestellst du einen Kaffee? Lena: Nein, ich hatte schon zwei. Wasser habe ich dabei. Ich nehme einen Saft.', 'Was bestellt Lena?', 'What does Lena order?', ['Wasser', 'Kaffee', 'Saft'], 2, 'Lena bestellt Saft.', 'Lena orders juice.'],
    ],
    [
      ['Lena: Fährst du mit dem Bus ins Büro? Ana: Nein, ich wohne jetzt ganz nah. Mein Fahrrad ist kaputt. Ich gehe.', 'Wie kommt Ana ins Büro?', 'How does Ana get to the office?', ['zu Fuß', 'Fahrrad', 'Bus'], 0, 'Ana geht ins Büro.', 'Ana walks to the office.'],
      ['Trainer: Was machen Sie gern? Ana: Ich schwimme gern. Tanzen mag ich nicht. Laufen tut meinem Bein weh. Trainer: Dann bleiben wir beim Schwimmen.', 'Welche Sportart passt zu Ana?', 'Which sport suits Ana?', ['tanzen', 'schwimmen', 'laufen'], 1, 'Ana schwimmt gern und hat dabei keine Beinschmerzen.', 'Ana enjoys swimming and it does not hurt her leg.'],
      ['Tim: Gibt es Kaffee? Lena: Ja, aber du wolltest doch Saft. Tim: Jetzt brauche ich etwas Warmes. Wasser möchte ich nicht.', 'Was möchte Tim jetzt?', 'What does Tim want now?', ['Saft', 'Wasser', 'Kaffee'], 2, 'Tim möchte jetzt warmen Kaffee.', 'Tim now wants warm coffee.'],
      ['Kollegin: Wir gehen zum Markt. Kommen Sie mit? Ana: Ja, aber mit meinem Fahrrad. Danach muss ich zum Arzt. Kollegin: Gut, wir gehen zu Fuß.', 'Wie kommt Ana zum Markt?', 'How does Ana get to the market?', ['Fahrrad', 'zu Fuß', 'Bus'], 0, 'Ana nimmt ihr Fahrrad.', 'Ana takes her bicycle.'],
      ['Tim: Laufen wir am Freitag? Lena: Ich habe einen Tanzkurs gebucht. Komm doch mit! Tim: Gut. Schwimmen können wir am Samstag.', 'Was machen die Freunde am Freitag?', 'What do the friends do on Friday?', ['schwimmen', 'tanzen', 'laufen'], 1, 'Am Freitag gehen sie zum Tanzkurs.', 'On Friday they go to the dance class.'],
    ],
    [
      ['Arzt: Trinken Sie genug? Patient: Viel Kaffee und Saft. Arzt: Nehmen Sie heute nur Wasser. Patient: Gut, danke.', 'Was soll der Patient heute trinken?', 'What should the patient drink today?', ['Saft', 'Kaffee', 'Wasser'], 2, 'Der Arzt empfiehlt Wasser.', 'The doctor recommends water.'],
      ['Lena: Soll ich dich mit dem Auto abholen? Ana: Danke, ich sitze schon im Bus. Mein Fahrrad steht noch im Büro.', 'Wie kommt Ana?', 'How is Ana travelling?', ['Bus', 'zu Fuß', 'Fahrrad'], 0, 'Ana sitzt schon im Bus.', 'Ana is already on the bus.'],
      ['Ana: Heute ist es schön. Gehen wir schwimmen? Tim: Das Wasser ist zu kalt. Lieber laufen! Ana: Gut. Tanzen können wir heute Abend.', 'Was machen sie jetzt?', 'What are they doing now?', ['schwimmen', 'laufen', 'tanzen'], 1, 'Sie laufen jetzt; Tanzen ist erst am Abend.', 'They run now; dancing is for the evening.'],
      ['Tim: Zum Büro sind es nur fünf Minuten. Nimmst du das Fahrrad? Lena: Nein, ich gehe. Der Bus braucht auch lange.', 'Wie kommt Lena ins Büro?', 'How does Lena get to the office?', ['Bus', 'Fahrrad', 'zu Fuß'], 2, 'Lena geht ins Büro.', 'Lena walks to the office.'],
      ['Ana: Was möchtest du zum Frühstück? Lena: Kaffee ist schon auf dem Tisch. Wasser habe ich in meiner Tasche. Bring mir bitte einen Saft.', 'Was soll Ana bringen?', 'What should Ana bring?', ['Saft', 'Kaffee', 'Wasser'], 0, 'Lena bittet um Saft.', 'Lena asks for juice.'],
    ],
    [
      ['Tim: Kommst du am Samstag laufen? Ana: Nein, ich gehe mit meiner Freundin ins Schwimmbad. Zum Tanzen habe ich auch keine Zeit.', 'Was macht Ana am Samstag?', 'What does Ana do on Saturday?', ['laufen', 'schwimmen', 'tanzen'], 1, 'Ana geht ins Schwimmbad.', 'Ana goes to the swimming pool.'],
      ['Lena: Hast du Saft bestellt? Tim: Nein, nur Wasser. Lena: Kann ich auch etwas bestellen? Tim: Klar. Lena: Dann einen Kaffee, bitte.', 'Was bestellt Lena?', 'What does Lena order?', ['Saft', 'Wasser', 'Kaffee'], 2, 'Lena bestellt einen Kaffee.', 'Lena orders coffee.'],
      ['Ana: Der Bus kommt in zehn Minuten. Warten wir? Tim: Nein, wir können zu Fuß gehen. Mein Fahrrad ist zu Hause. Ana: Gut, gehen wir.', 'Wie kommen die Freunde weiter?', 'How do the friends continue?', ['zu Fuß', 'Bus', 'Fahrrad'], 0, 'Die Freunde gehen zu Fuß.', 'The friends continue on foot.'],
      ['Trainer: Können Sie schon schwimmen? Ana: Ja. Ich möchte jetzt tanzen lernen. Laufen mache ich schon jeden Morgen. Trainer: Dann passt unser Tanzkurs.', 'Was möchte Ana lernen?', 'What does Ana want to learn?', ['laufen', 'tanzen', 'schwimmen'], 1, 'Ana möchte tanzen lernen.', 'Ana wants to learn to dance.'],
      ['Tim: Dein Fahrrad sieht neu aus. Fährst du damit zur Arbeit? Lena: Ja, jeden Tag. Der Bus ist zu voll und zu Fuß dauert es lange.', 'Wie kommt Lena zur Arbeit?', 'How does Lena get to work?', ['Bus', 'zu Fuß', 'Fahrrad'], 2, 'Lena fährt jeden Tag mit dem Fahrrad.', 'Lena cycles every day.'],
    ],
  ]),
];

const activities = ['Fotos machen', 'Essen kochen', 'Fahrkarten kaufen', 'Führung buchen', 'Gepäck abholen', 'Stadtplan schicken'];
const matchPaper = (audio, assignments) => assignments.map(([person, key, evidence, en]) => [audio, `Was hat ${person} gemacht?`, `What did ${person} do?`, activities, key, evidence, en]);
A21_HOEREN.push(listening(4, 'Hören Teil 2', [
  matchPaper('Lena: Wie war der Besuch? Ana: Sehr gut! Mein Vater hat viele Fotos gemacht. Meine Mutter hat gekocht. Tim hat unsere Fahrkarten gekauft. Ich habe die Führung gebucht. Jonas hat das Gepäck am Flughafen abgeholt. Den Stadtplan hatten wir schon.', [
    ['Tim', 2, 'Tim hat die Fahrkarten gekauft.', 'Tim bought the tickets.'], ['Ana', 3, 'Ana hat die Führung gebucht.', 'Ana booked the tour.'], ['Anas Vater', 0, 'Ihr Vater hat Fotos gemacht.', 'Her father took photos.'], ['Jonas', 4, 'Jonas hat das Gepäck abgeholt.', 'Jonas collected the luggage.'], ['Anas Mutter', 1, 'Ihre Mutter hat gekocht.', 'Her mother cooked.'],
  ]),
  matchPaper('Tim: Habt ihr den Besuch zusammen geplant? Ana: Ja. Lena hat mir einen Stadtplan geschickt. Jonas hat die Führung gebucht. Mein Vater hat das Gepäck abgeholt. Meine Mutter hat die Fahrkarten gekauft. Ich habe das Essen gekocht. Fotos hat diesmal niemand gemacht.', [
    ['Anas Mutter', 2, 'Ihre Mutter hat die Fahrkarten gekauft.', 'Her mother bought the tickets.'], ['Anas Vater', 4, 'Ihr Vater hat das Gepäck abgeholt.', 'Her father collected the luggage.'], ['Lena', 5, 'Lena hat den Stadtplan geschickt.', 'Lena sent the map.'], ['Ana', 1, 'Ana hat gekocht.', 'Ana cooked.'], ['Jonas', 3, 'Jonas hat die Führung gebucht.', 'Jonas booked the tour.'],
  ]),
  matchPaper('Lena: Wer hat dieses Mal geholfen? Ana: Tim hat am Flughafen das Gepäck abgeholt. Meine Mutter hat alle fotografiert. Jonas hat gekocht. Mein Vater hat mir den Stadtplan geschickt. Ich habe die Fahrkarten gekauft. Eine Führung wollten wir diesmal nicht.', [
    ['Anas Vater', 5, 'Ihr Vater hat den Stadtplan geschickt.', 'Her father sent the map.'], ['Tim', 4, 'Tim hat das Gepäck abgeholt.', 'Tim collected the luggage.'], ['Ana', 2, 'Ana hat die Fahrkarten gekauft.', 'Ana bought the tickets.'], ['Jonas', 1, 'Jonas hat gekocht.', 'Jonas cooked.'], ['Anas Mutter', 0, 'Ihre Mutter hat alle fotografiert.', 'Her mother photographed everyone.'],
  ]),
  matchPaper('Tim: Was habt ihr für den Besuch gemacht? Ana: Mein Vater hat die Führung gebucht. Lena hat Fotos gemacht. Jonas hat mir den Stadtplan geschickt. Meine Mutter hat das Gepäck abgeholt. Ich habe die Fahrkarten gekauft. Wir haben kein Essen gekocht.', [
    ['Lena', 0, 'Lena hat Fotos gemacht.', 'Lena took photos.'], ['Anas Mutter', 4, 'Ihre Mutter hat das Gepäck abgeholt.', 'Her mother collected the luggage.'], ['Jonas', 5, 'Jonas hat den Stadtplan geschickt.', 'Jonas sent the map.'], ['Anas Vater', 3, 'Ihr Vater hat die Führung gebucht.', 'Her father booked the tour.'], ['Ana', 2, 'Ana hat die Fahrkarten gekauft.', 'Ana bought the tickets.'],
  ]),
]));

// Authored presentation order: no matching-answer position repeats in the same
// question slot over the four rounds. Unit ids stay attached to their content.
for (const [bank, orders] of [[A21_LESEN[2], [[0,1,2,3],[0,1,2,3],[0,3,1,2],[1,0,3,2]]], [A21_HOEREN[3], [[0,1,2,3,4],[1,0,2,3,4],[0,1,3,2,4],[0,2,1,3,4]]]]) {
  bank.papers = bank.papers.map((paper, round) => orders[round].map(i => paper[i]));
}
