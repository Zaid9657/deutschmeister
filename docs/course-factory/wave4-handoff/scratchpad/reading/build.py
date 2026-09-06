# Builds S/wave4/reading/rewrites-a2.1.json + exam-format-a2.1.json.
# word_count is computed here (whitespace-split of content_de), never typed by hand.
import json, os, re

OUT = os.path.dirname(os.path.abspath(__file__))

def wc(text):
    return len([t for t in text.split() if t.strip()])

def V(*pairs):
    return [{"de": d, "en": e} for d, e in pairs]

def Q(*quads):
    return [{"question_de": a, "question_en": b, "answer_de": c, "answer_en": d}
            for a, b, c, d in quads]

def rf(s_de, s_en, ans, expl):
    return {"type": "rf", "statement_de": s_de, "statement_en": s_en,
            "answer": ans, "explanation_de": expl}

def ch(s_de, s_en, ans, expl):
    return {"type": "choice", "statement_de": s_de, "statement_en": s_en,
            "options": ["a", "b", "c"], "answer": ans, "explanation_de": expl}


rewrites = []

# ---------------------------------------------------------------- 1 Wien
rewrites.append({
    "id": "a94a8a40-c8a6-4bed-bd79-a8b4dd9e05f8",
    "title_de": "Meine Reise nach Wien",
    "title_en": "My Trip to Vienna",
    "content_de": (
        "Letzten Monat habe ich eine Reise nach Wien gemacht. Wien ist die Hauptstadt "
        "von Österreich. Ich bin mit dem Zug gefahren, weil ich gern Zug fahre. Die Fahrt "
        "von München nach Wien hat vier Stunden gedauert.\n\n"
        "Im Zug hatte ich einen Platz am Fenster. Ich habe ein Buch gelesen und Kaffee "
        "getrunken.\n\n"
        "In Wien habe ich in einem kleinen Hotel im Zentrum übernachtet. Das Hotel war "
        "nicht teuer. Von dort konnte ich alles zu Fuß erreichen. Am ersten Tag bin ich "
        "die Ringstraße entlanggegangen.\n\n"
        "Am zweiten Tag habe ich das Schloss Schönbrunn besucht. Der große Garten hat "
        "mir sehr gut gefallen.\n\n"
        "Am Abend habe ich ein Wiener Schnitzel gegessen. Zum Nachtisch habe ich "
        "Sachertorte probiert. In einem Kaffeehaus habe ich noch eine Melange getrunken.\n\n"
        "Nach vier Tagen bin ich wieder nach Hause gefahren."
    ),
    "content_en": (
        "Last month I took a trip to Vienna. Vienna is the capital of Austria. I went by "
        "train, because I like going by train. The journey from Munich to Vienna "
        "took four hours.\n\n"
        "On the train I had a seat by the window. I read a book and drank coffee.\n\n"
        "In Vienna I stayed in a small hotel in the centre. The hotel was not expensive. "
        "From there I could reach everything on foot. On the first day I walked along the "
        "Ringstraße.\n\n"
        "On the second day I visited Schönbrunn Palace. I liked the big garden very much.\n\n"
        "In the evening I ate a Wiener Schnitzel. For dessert I tried Sachertorte. In a "
        "coffee house I also drank a Melange.\n\n"
        "After four days I travelled back home."
    ),
    "key_vocabulary": V(
        ("die Reise, -n", "trip, journey"),
        ("die Hauptstadt, ¨-e", "capital city"),
        ("der Zug, ¨-e", "train"),
        ("die Fahrt, -en", "journey, ride"),
        ("dauern", "to last, to take (time)"),
        ("der Platz, ¨-e", "seat, place"),
        ("übernachten", "to stay overnight"),
        ("das Zentrum, Zentren", "centre"),
        ("erreichen", "to reach"),
        ("das Schloss, ¨-er", "palace, castle"),
        ("der Garten, ¨-", "garden"),
        ("gefallen (+ Dat.)", "to please, to be liked by"),
        ("der Nachtisch, -e", "dessert"),
        ("probieren", "to try, to taste"),
    ),
    "questions": Q(
        ("Wann hat die Person die Reise gemacht?",
         "When did the person take the trip?",
         "Sie hat die Reise letzten Monat gemacht.",
         "She took the trip last month."),
        ("Was hat die Person im Zug gemacht?",
         "What did the person do on the train?",
         "Sie hat ein Buch gelesen und Kaffee getrunken.",
         "She read a book and drank coffee."),
        ("Was hat der Person im Schloss Schönbrunn gut gefallen?",
         "What did the person like at Schönbrunn Palace?",
         "Der große Garten hat ihr sehr gut gefallen.",
         "She liked the big garden very much."),
        ("Was hat die Person am Abend gegessen?",
         "What did the person eat in the evening?",
         "Sie hat ein Wiener Schnitzel gegessen.",
         "She ate a Wiener Schnitzel."),
        ("Wie lange war die Person in Wien?",
         "How long was the person in Vienna?",
         "Sie war vier Tage in Wien.",
         "She was in Vienna for four days."),
    ),
    "checks": [
        rf("Die Person ist mit dem Zug nach Wien gefahren.",
           "The person went to Vienna by train.", "richtig",
           "Im Text steht: Ich bin mit dem Zug gefahren."),
        rf("Die Person hat bei Freunden übernachtet.",
           "The person stayed with friends.", "falsch",
           "Im Text steht: In Wien habe ich in einem kleinen Hotel im Zentrum übernachtet."),
        rf("Im Zug hatte die Person einen Platz am Gang.",
           "On the train the person had an aisle seat.", "falsch",
           "Im Text steht: Im Zug hatte ich einen Platz am Fenster."),
        rf("Die Person konnte alles zu Fuß erreichen.",
           "The person could reach everything on foot.", "richtig",
           "Im Text steht: Von dort konnte ich alles zu Fuß erreichen."),
        rf("Die Person hat in einem Kaffeehaus eine Melange getrunken.",
           "The person drank a Melange in a coffee house.", "richtig",
           "Im Text steht: In einem Kaffeehaus habe ich noch eine Melange getrunken."),
        ch("Wie lange hat die Fahrt gedauert? a) zwei Stunden b) vier Stunden c) sechs Stunden",
           "How long did the journey take? a) two hours b) four hours c) six hours", "b",
           "Im Text steht: Die Fahrt von München nach Wien hat vier Stunden gedauert."),
    ],
})

# ---------------------------------------------------------------- 2 Arzt
rewrites.append({
    "id": "b3adfa93-d0f8-4c4f-851b-b161875fb5a3",
    "title_de": "Beim Arzt",
    "title_en": "At the Doctor",
    "content_de": (
        "Letzte Woche war ich krank. Ich hatte Kopfschmerzen, Halsschmerzen und Fieber. "
        "Nach zwei Tagen bin ich zum Arzt gegangen.\n\n"
        "In der Praxis musste ich zuerst zur Anmeldung gehen. Dort habe ich meine Karte "
        "gezeigt. Dann habe ich im Wartezimmer gewartet. Das Wartezimmer war voll. Nach "
        "dreißig Minuten konnte ich ins Sprechzimmer gehen.\n\n"
        "Die Ärztin war sehr freundlich. Ich habe ihr meine Probleme beschrieben. Sie hat "
        "mich untersucht und meine Temperatur gemessen: 38,5 Grad.\n\n"
        "Danach hat sie mir die Diagnose erklärt. Ich hatte eine starke Erkältung. Zum "
        "Glück war es nicht schlimm.\n\n"
        "Die Ärztin hat mir ein Rezept gegeben. Ich soll dreimal am Tag eine Tablette "
        "nehmen. Ich soll auch viel Tee trinken. Bis Freitag darf ich nicht arbeiten.\n\n"
        "Nach dem Termin bin ich in die Apotheke gegangen. Dort habe ich meine "
        "Medikamente geholt."
    ),
    "content_en": (
        "Last week I was ill. I had a headache, a sore throat and a fever. After two days "
        "I went to the doctor.\n\n"
        "At the practice I first had to go to the reception. There I showed my card. Then "
        "I waited in the waiting room. The waiting room was full. After thirty minutes I "
        "could go into the consulting room.\n\n"
        "The doctor was very friendly. I described my problems to her. She examined me and "
        "measured my temperature: 38.5 degrees.\n\n"
        "Afterwards she explained the diagnosis to me. I had a bad cold. Luckily it was "
        "not serious.\n\n"
        "The doctor gave me a prescription. I am supposed to take one tablet three times a "
        "day. I am also supposed to drink a lot of tea. Until Friday I am not allowed to "
        "work.\n\n"
        "After the appointment I went to the pharmacy. There I picked up my medicine."
    ),
    "key_vocabulary": V(
        ("der Arzt, ¨-e / die Ärztin, -nen", "doctor"),
        ("die Praxis, Praxen", "doctor's practice"),
        ("die Anmeldung, -en", "reception, registration desk"),
        ("das Wartezimmer, -", "waiting room"),
        ("krank", "ill, sick"),
        ("die Kopfschmerzen (Pl.)", "headache"),
        ("das Fieber", "fever"),
        ("untersuchen", "to examine"),
        ("messen", "to measure"),
        ("die Erkältung, -en", "cold (illness)"),
        ("das Rezept, -e", "prescription"),
        ("die Tablette, -n", "tablet, pill"),
        ("die Apotheke, -n", "pharmacy"),
        ("das Medikament, -e", "medicine"),
    ),
    "questions": Q(
        ("Welche Probleme hatte die Person?",
         "What problems did the person have?",
         "Sie hatte Kopfschmerzen, Halsschmerzen und Fieber.",
         "She had a headache, a sore throat and a fever."),
        ("Was hat die Person an der Anmeldung gemacht?",
         "What did the person do at the reception?",
         "Sie hat dort ihre Karte gezeigt.",
         "She showed the card there."),
        ("Wie war die Ärztin?",
         "What was the doctor like?",
         "Die Ärztin war sehr freundlich.",
         "The doctor was very friendly."),
        ("Was für eine Krankheit hatte die Person?",
         "What illness did the person have?",
         "Sie hatte eine starke Erkältung.",
         "She had a bad cold."),
        ("Was hat die Ärztin der Person gegeben?",
         "What did the doctor give the person?",
         "Sie hat ihr ein Rezept gegeben.",
         "She gave the person a prescription."),
    ),
    "checks": [
        rf("Die Person ist am ersten Tag zum Arzt gegangen.",
           "The person went to the doctor on the first day.", "falsch",
           "Im Text steht: Nach zwei Tagen bin ich zum Arzt gegangen."),
        rf("Die Person hat dreißig Minuten gewartet.",
           "The person waited for thirty minutes.", "richtig",
           "Im Text steht: Nach dreißig Minuten konnte ich ins Sprechzimmer gehen."),
        rf("Die Ärztin hat die Temperatur gemessen.",
           "The doctor measured the temperature.", "richtig",
           "Im Text steht: Sie hat mich untersucht und meine Temperatur gemessen."),
        rf("Die Person soll viel Tee trinken.",
           "The person is supposed to drink a lot of tea.", "richtig",
           "Im Text steht: Ich soll auch viel Tee trinken."),
        rf("Die Person hat die Medikamente im Supermarkt geholt.",
           "The person picked up the medicine at the supermarket.", "falsch",
           "Im Text steht: Nach dem Termin bin ich in die Apotheke gegangen. Dort habe ich "
           "meine Medikamente geholt."),
        ch("Wie hoch war das Fieber? a) 37,5 Grad b) 38,0 Grad c) 38,5 Grad",
           "How high was the fever? a) 37.5 degrees b) 38.0 degrees c) 38.5 degrees", "c",
           "Im Text steht: Sie hat mich untersucht und meine Temperatur gemessen: 38,5 Grad."),
    ],
})

# ---------------------------------------------------------------- 3 Beruf
rewrites.append({
    "id": "2625a371-4cc2-4a9e-b941-1a75c7eda792",
    "title_de": "Mein Beruf als Softwareentwickler",
    "title_en": "My Job as a Software Developer",
    "content_de": (
        "Ich arbeite als Softwareentwickler bei einer IT-Firma in Hamburg. Schon in der "
        "Schule habe ich gern am Computer gearbeitet. Später habe ich Informatik "
        "studiert.\n\n"
        "Mein Arbeitstag beginnt um neun Uhr. Ich fahre mit dem Fahrrad ins Büro. Die "
        "Fahrt dauert nur fünfzehn Minuten.\n\n"
        "Im Büro sitze ich mit meinem Team in einem großen Raum. Wir sind fünf "
        "Entwickler. Jeden Morgen haben wir ein kurzes Meeting. Dort besprechen wir "
        "unsere Aufgaben für den Tag.\n\n"
        "Meine Hauptaufgabe ist die Arbeit am Code. Ich entwickle Programme für unsere "
        "Kunden. Manchmal muss ich ein schwieriges Problem lösen.\n\n"
        "Von halb eins bis halb zwei mache ich Mittagspause. Oft gehe ich mit den "
        "Kollegen essen.\n\n"
        "Um 18 Uhr ist Feierabend. Zweimal pro Woche darf ich von zu Hause "
        "arbeiten. Ich bin sehr zufrieden mit meinem Beruf."
    ),
    "content_en": (
        "I work as a software developer at an IT company in Hamburg. Even at school I "
        "liked working at the computer. Later I studied computer science.\n\n"
        "My working day starts at nine o'clock. I ride my bicycle to the office. The ride "
        "only takes fifteen minutes.\n\n"
        "In the office I sit with my team in a big room. There are five of us developers. "
        "Every morning we have a short meeting. There we discuss our tasks for the day.\n\n"
        "My main task is working on the code. I develop programs for our customers. "
        "Sometimes I have to solve a difficult problem.\n\n"
        "From half past twelve until half past one I take my lunch break. I often go out "
        "to eat with my colleagues.\n\n"
        "At six p.m. the working day is over. Twice a week I am allowed to work from home. "
        "I am very happy with my job."
    ),
    "key_vocabulary": V(
        ("der Beruf, -e", "profession, job"),
        ("die Firma, Firmen", "company"),
        ("der Arbeitstag, -e", "working day"),
        ("das Büro, -s", "office"),
        ("das Team, -s", "team"),
        ("der Entwickler, -", "developer"),
        ("das Meeting, -s", "meeting"),
        ("besprechen", "to discuss"),
        ("die Aufgabe, -n", "task"),
        ("der Kunde, -n", "customer"),
        ("lösen", "to solve"),
        ("die Mittagspause, -n", "lunch break"),
        ("der Kollege, -n / die Kollegin, -nen", "colleague"),
        ("der Feierabend", "end of the working day"),
    ),
    "questions": Q(
        ("Wo arbeitet die Person?",
         "Where does the person work?",
         "Sie arbeitet bei einer IT-Firma in Hamburg.",
         "She works at an IT company in Hamburg."),
        ("Was hat die Person studiert?",
         "What did the person study?",
         "Sie hat Informatik studiert.",
         "She studied computer science."),
        ("Was machen die Kollegen jeden Morgen?",
         "What do the colleagues do every morning?",
         "Sie haben jeden Morgen ein kurzes Meeting.",
         "Every morning they have a short meeting."),
        ("Was ist ihre Hauptaufgabe?",
         "What is her main task?",
         "Ihre Hauptaufgabe ist die Arbeit am Code.",
         "The main task is working on the code."),
        ("Wann ist Feierabend?",
         "When does the working day end?",
         "Um 18 Uhr ist Feierabend.",
         "The working day ends at six p.m."),
    ),
    "checks": [
        rf("Die Fahrt ins Büro dauert fünfzehn Minuten.",
           "The ride to the office takes fifteen minutes.", "richtig",
           "Im Text steht: Die Fahrt dauert nur fünfzehn Minuten."),
        rf("Der Arbeitstag beginnt um neun Uhr.",
           "The working day starts at nine o'clock.", "richtig",
           "Im Text steht: Mein Arbeitstag beginnt um neun Uhr."),
        rf("Im Team sind acht Entwickler.",
           "There are eight developers in the team.", "falsch",
           "Im Text steht: Wir sind fünf Entwickler."),
        rf("Die Mittagspause beginnt um zwölf Uhr.",
           "The lunch break starts at twelve o'clock.", "falsch",
           "Im Text steht: Von halb eins bis halb zwei mache ich Mittagspause."),
        rf("Zweimal pro Woche darf die Person zu Hause arbeiten.",
           "Twice a week the person is allowed to work at home.", "richtig",
           "Im Text steht: Zweimal pro Woche darf ich von zu Hause arbeiten."),
        ch("Wie kommt die Person ins Büro? a) mit dem Fahrrad b) mit dem Bus c) zu Fuß",
           "How does the person get to the office? a) by bicycle b) by bus c) on foot", "a",
           "Im Text steht: Ich fahre mit dem Fahrrad ins Büro."),
    ],
})

# ---------------------------------------------------------------- 4 Stadt
rewrites.append({
    "id": "a1a4b941-81b1-4e42-b8a7-5afb2863f91a",
    "title_de": "Unterwegs in der Stadt",
    "title_en": "Getting Around in the City",
    "content_de": (
        "Ich wohne seit fünf Jahren in Berlin. Am Anfang musste ich oft nach dem Weg "
        "fragen. Hier gibt es viele Verkehrsmittel. Meistens fahre ich mit der "
        "U-Bahn.\n\n"
        "Mein Monatsticket kostet etwa 86 Euro. Damit kann ich jeden Tag fahren. Die "
        "U-Bahn ist schnell, denn sie fährt unter der Erde. Die Fahrt zur Arbeit dauert "
        "nur zwanzig Minuten. Am Morgen ist die U-Bahn oft sehr voll.\n\n"
        "Im Sommer nehme ich oft mein altes Fahrrad. In Berlin gibt es viele "
        "Fahrradwege.\n\n"
        "Manchmal fahre ich auch mit dem Bus. Aus dem Bus kann man die Straßen und die "
        "Parks sehen. Bei viel Verkehr ist der Bus aber langsam.\n\n"
        "Ein Auto habe ich nicht. Parkplätze sind teuer, und es gibt oft Stau. Zum Bäcker "
        "und zum Supermarkt gehe ich zu Fuß.\n\n"
        "Ich bin sehr zufrieden mit den Verkehrsmitteln in Berlin. Man kommt hier "
        "überall schnell hin."
    ),
    "content_en": (
        "I have been living in Berlin for five years. At the beginning I often had to ask "
        "for directions. There are many means of transport here. Usually I take the "
        "underground.\n\n"
        "My monthly ticket costs about 86 euros. With it I can travel every day. The "
        "underground is fast, because it runs below ground. The trip to work only takes "
        "twenty minutes. In the morning the underground is often very full.\n\n"
        "In summer I often take my old bicycle. In Berlin there are many cycle paths.\n\n"
        "Sometimes I also take the bus. From the bus you can see the streets and the "
        "parks. But when there is a lot of traffic, the bus is slow.\n\n"
        "I do not have a car. Parking spaces are expensive, and there are often traffic "
        "jams. To the baker's and to the supermarket I walk.\n\n"
        "I am very happy with the means of transport in Berlin. You get everywhere "
        "quickly here."
    ),
    "key_vocabulary": V(
        ("das Verkehrsmittel, -", "means of transport"),
        ("die U-Bahn, -en", "underground, subway"),
        ("das Monatsticket, -s", "monthly ticket"),
        ("die Fahrt, -en", "trip, ride"),
        ("voll", "full, crowded"),
        ("das Fahrrad, ¨-er", "bicycle"),
        ("der Fahrradweg, -e", "cycle path"),
        ("der Bus, -se", "bus"),
        ("der Verkehr", "traffic"),
        ("der Parkplatz, ¨-e", "parking space"),
        ("der Stau, -s", "traffic jam"),
        ("zu Fuß gehen", "to walk, to go on foot"),
        ("zufrieden", "satisfied, happy"),
    ),
    "questions": Q(
        ("Womit fährt die Person meistens?",
         "What does the person usually travel by?",
         "Sie fährt meistens mit der U-Bahn.",
         "She usually travels by underground."),
        ("Wann nimmt die Person oft das Fahrrad?",
         "When does the person often take the bicycle?",
         "Im Sommer nimmt sie oft ihr Fahrrad.",
         "In summer she often takes the bicycle."),
        ("Was kann man aus dem Bus sehen?",
         "What can you see from the bus?",
         "Man kann die Straßen und die Parks sehen.",
         "You can see the streets and the parks."),
        ("Wie sind die Parkplätze in Berlin?",
         "What are parking spaces like in Berlin?",
         "Die Parkplätze sind teuer.",
         "Parking spaces are expensive."),
        ("Wohin geht die Person zu Fuß?",
         "Where does the person walk to?",
         "Sie geht zum Bäcker und zum Supermarkt zu Fuß.",
         "She walks to the baker's and to the supermarket."),
    ),
    "checks": [
        rf("Die Person wohnt seit zehn Jahren in Berlin.",
           "The person has been living in Berlin for ten years.", "falsch",
           "Im Text steht: Ich wohne seit fünf Jahren in Berlin."),
        rf("Die U-Bahn fährt über der Erde.",
           "The underground runs above ground.", "falsch",
           "Im Text steht: Die U-Bahn ist schnell, denn sie fährt unter der Erde."),
        rf("Die Fahrt zur Arbeit dauert zwanzig Minuten.",
           "The trip to work takes twenty minutes.", "richtig",
           "Im Text steht: Die Fahrt zur Arbeit dauert nur zwanzig Minuten."),
        rf("Die Person hat kein Auto.",
           "The person does not have a car.", "richtig",
           "Im Text steht: Ein Auto habe ich nicht."),
        rf("Am Morgen ist die U-Bahn meistens leer.",
           "In the morning the underground is mostly empty.", "falsch",
           "Im Text steht: Am Morgen ist die U-Bahn oft sehr voll."),
        ch("Was kostet das Monatsticket ungefähr? a) 68 Euro b) 76 Euro c) 86 Euro",
           "About what does the monthly ticket cost? a) 68 euros b) 76 euros c) 86 euros",
           "c",
           "Im Text steht: Mein Monatsticket kostet etwa 86 Euro."),
    ],
})

# ---------------------------------------------------------------- 5 Restaurant
rewrites.append({
    "id": "bd2adaeb-7f78-4d8c-b3e4-eb3ff231c2ae",
    "title_de": "Ein Abend im Restaurant",
    "title_en": "An Evening at the Restaurant",
    "content_de": (
        "Letzten Samstag habe ich mit meiner Freundin in einem italienischen Restaurant "
        "gegessen. Sie hatte Geburtstag. Ich wollte sie zu einem besonderen Abendessen "
        "einladen. Ich habe vorher einen Tisch reserviert.\n\n"
        "Um sieben Uhr sind wir angekommen. Der Kellner hat uns einen Platz am Fenster "
        "gegeben. Die Musik war leise. Auf den Tischen waren Kerzen.\n\n"
        "Zuerst hat uns der Kellner die Speisekarte gebracht. Ich habe einen Rotwein "
        "bestellt, meine Freundin ein Mineralwasser.\n\n"
        "Als Vorspeise haben wir Bruschetta gegessen. Danach habe ich Spaghetti bestellt "
        "und meine Freundin eine Pizza. Die Portionen waren groß, und alles hat sehr gut "
        "geschmeckt.\n\n"
        "Zum Nachtisch habe ich Tiramisu genommen. Dann haben wir noch einen Espresso "
        "getrunken.\n\n"
        "Das Essen hat 75 Euro gekostet. Ich habe mit Karte bezahlt und dem Kellner zehn "
        "Euro Trinkgeld gegeben. Meine Freundin war sehr glücklich."
    ),
    "content_en": (
        "Last Saturday I ate with my girlfriend at an Italian restaurant. It was her "
        "birthday. I wanted to invite her to a special dinner. I had reserved a table "
        "beforehand.\n\n"
        "At seven o'clock we arrived. The waiter gave us a seat by the window. The music "
        "was quiet. There were candles on the tables.\n\n"
        "First the waiter brought us the menu. I ordered a red wine, my girlfriend a "
        "mineral water.\n\n"
        "As a starter we ate bruschetta. Then I ordered spaghetti and my girlfriend a "
        "pizza. The portions were big, and everything tasted very good.\n\n"
        "For dessert I had tiramisu. Then we also drank an espresso.\n\n"
        "The meal cost 75 euros. I paid by card and gave the waiter ten euros as a tip. "
        "My girlfriend was very happy."
    ),
    "key_vocabulary": V(
        ("das Restaurant, -s", "restaurant"),
        ("der Kellner, - / die Kellnerin, -nen", "waiter, waitress"),
        ("reservieren", "to reserve"),
        ("der Tisch, -e", "table"),
        ("die Speisekarte, -n", "menu"),
        ("bestellen", "to order"),
        ("die Vorspeise, -n", "starter"),
        ("die Portion, -en", "portion"),
        ("schmecken", "to taste"),
        ("der Nachtisch, -e", "dessert"),
        ("bezahlen", "to pay"),
        ("das Trinkgeld, -er", "tip"),
        ("glücklich", "happy"),
    ),
    "questions": Q(
        ("Warum sind die beiden ins Restaurant gegangen?",
         "Why did the two of them go to the restaurant?",
         "Die Freundin hatte Geburtstag.",
         "It was the girlfriend's birthday."),
        ("Wann sind die beiden im Restaurant angekommen?",
         "When did the two of them arrive at the restaurant?",
         "Sie sind um sieben Uhr angekommen.",
         "They arrived at seven o'clock."),
        ("Was haben die beiden als Vorspeise gegessen?",
         "What did the two of them eat as a starter?",
         "Sie haben Bruschetta gegessen.",
         "They ate bruschetta."),
        ("Was hat die Person zum Nachtisch genommen?",
         "What did the person have for dessert?",
         "Sie hat Tiramisu genommen.",
         "She had tiramisu."),
        ("Wie viel Trinkgeld hat die Person gegeben?",
         "How much tip did the person give?",
         "Sie hat zehn Euro Trinkgeld gegeben.",
         "She gave ten euros as a tip."),
    ),
    "checks": [
        rf("Die Person hat vorher einen Tisch reserviert.",
           "The person had reserved a table beforehand.", "richtig",
           "Im Text steht: Ich habe vorher einen Tisch reserviert."),
        rf("Die beiden haben in einem griechischen Restaurant gegessen.",
           "The two of them ate at a Greek restaurant.", "falsch",
           "Im Text steht: Letzten Samstag habe ich mit meiner Freundin in einem "
           "italienischen Restaurant gegessen."),
        rf("Der Kellner hat ihnen einen Platz am Fenster gegeben.",
           "The waiter gave them a seat by the window.", "richtig",
           "Im Text steht: Der Kellner hat uns einen Platz am Fenster gegeben."),
        rf("Das Essen hat 75 Euro gekostet.",
           "The meal cost 75 euros.", "richtig",
           "Im Text steht: Das Essen hat 75 Euro gekostet."),
        rf("Die Person hat bar bezahlt.",
           "The person paid in cash.", "falsch",
           "Im Text steht: Ich habe mit Karte bezahlt."),
        ch("Was hat die Freundin gegessen? a) Spaghetti b) eine Pizza c) einen Salat",
           "What did the girlfriend eat? a) spaghetti b) a pizza c) a salad", "b",
           "Im Text steht: Danach habe ich Spaghetti bestellt und meine Freundin eine Pizza."),
    ],
})

# ---------------------------------------------------------------- 6 Umzug
rewrites.append({
    "id": "41c5fb24-317d-428a-977d-0bc2baba885c",
    "title_de": "Ein Umzug nach Hamburg",
    "title_en": "A Move to Hamburg",
    "content_de": (
        "Familie Weber hat zehn Jahre in Stuttgart gewohnt. Im März hat Frau Weber eine "
        "neue Stelle in Hamburg bekommen. Im Sommer ist die Familie umgezogen. Am "
        "Anfang wollten die Kinder nicht umziehen.\n\n"
        "Der Umzug hat viel Arbeit gemacht. Zuerst haben die Webers eine Wohnung gesucht. "
        "Das war nicht leicht, denn in "
        "Hamburg sind die Mieten hoch. Nach sechs Wochen haben sie eine helle Wohnung in "
        "Eimsbüttel gefunden. Die Wohnung liegt im dritten Stock, und es gibt keinen "
        "Aufzug.\n\n"
        "Dann haben alle geholfen. Herr Weber hat fünfzig Kartons gepackt. Die Kinder "
        "haben ihre Bücher eingepackt. Die Großeltern haben auf den Hund aufgepasst. "
        "Eine Firma hat die Möbel getragen.\n\n"
        "Am Umzugstag ist der Lastwagen um sieben Uhr losgefahren.\n\n"
        "In der neuen Wohnung hat Frau Weber die Küche eingeräumt. Herr Weber hat die "
        "Lampen aufgehängt. Die Nachbarn waren nett. Frau Schmidt hat der Familie einen "
        "Kuchen geschenkt."
    ),
    "content_en": (
        "The Weber family lived in Stuttgart for ten years. In March Mrs. Weber got a new "
        "job in Hamburg. In the summer the family moved. At first the children did not "
        "want to move.\n\n"
        "The move was a lot of work. First the Webers looked for an apartment. That was "
        "not easy, because rents in "
        "Hamburg are high. After six weeks they found a bright apartment in Eimsbüttel. "
        "The apartment is on the third floor, and there is no lift.\n\n"
        "Then everybody helped. Mr. Weber packed fifty boxes. The children packed their "
        "books. The grandparents looked after the dog. A company carried the furniture.\n\n"
        "On moving day the truck set off at seven o'clock.\n\n"
        "In the new apartment Mrs. Weber put away the kitchen things. Mr. Weber hung up "
        "the lamps. The neighbours were nice. Mrs. Schmidt gave the family a cake."
    ),
    "key_vocabulary": V(
        ("der Umzug, ¨-e", "move, relocation"),
        ("umziehen", "to move house"),
        ("die Stelle, -n", "job, position"),
        ("die Miete, -n", "rent"),
        ("die Wohnung, -en", "apartment"),
        ("hell", "bright"),
        ("der Stock, Stockwerke", "floor, storey"),
        ("der Aufzug, ¨-e", "lift, elevator"),
        ("der Karton, -s", "cardboard box"),
        ("einpacken", "to pack up"),
        ("aufpassen (auf + Akk.)", "to look after"),
        ("der Lastwagen, -", "truck"),
        ("einräumen", "to put away, to tidy in"),
        ("der Nachbar, -n / die Nachbarin, -nen", "neighbour"),
    ),
    "questions": Q(
        ("Wann hat Frau Weber eine neue Stelle bekommen?",
         "When did Mrs. Weber get a new job?",
         "Sie hat im März eine neue Stelle bekommen.",
         "She got a new job in March."),
        ("Warum war die Wohnungssuche nicht leicht?",
         "Why was looking for an apartment not easy?",
         "In Hamburg sind die Mieten hoch.",
         "Rents in Hamburg are high."),
        ("Wer hat die Möbel getragen?",
         "Who carried the furniture?",
         "Eine Firma hat die Möbel getragen.",
         "A company carried the furniture."),
        ("Was hat Frau Weber in der neuen Wohnung gemacht?",
         "What did Mrs. Weber do in the new apartment?",
         "Sie hat die Küche eingeräumt.",
         "She put away the kitchen things."),
        ("Was hat Frau Schmidt der Familie geschenkt?",
         "What did Mrs. Schmidt give the family?",
         "Sie hat der Familie einen Kuchen geschenkt.",
         "She gave the family a cake."),
    ),
    "checks": [
        rf("Familie Weber hat zwanzig Jahre in Stuttgart gewohnt.",
           "The Weber family lived in Stuttgart for twenty years.", "falsch",
           "Im Text steht: Familie Weber hat zehn Jahre in Stuttgart gewohnt."),
        rf("Die Familie ist im Sommer umgezogen.",
           "The family moved in the summer.", "richtig",
           "Im Text steht: Im Sommer ist die Familie umgezogen."),
        rf("Die Familie hat die Wohnung nach zwei Wochen gefunden.",
           "The family found the apartment after two weeks.", "falsch",
           "Im Text steht: Nach sechs Wochen haben sie eine helle Wohnung in Eimsbüttel gefunden."),
        rf("Die Wohnung liegt im ersten Stock.",
           "The apartment is on the first floor.", "falsch",
           "Im Text steht: Die Wohnung liegt im dritten Stock."),
        rf("Die Großeltern haben auf den Hund aufgepasst.",
           "The grandparents looked after the dog.", "richtig",
           "Im Text steht: Die Großeltern haben auf den Hund aufgepasst."),
        ch("Wie viele Kartons hat Herr Weber gepackt? a) fünfzig b) fünfzehn c) fünf",
           "How many boxes did Mr. Weber pack? a) fifty b) fifteen c) five", "a",
           "Im Text steht: Herr Weber hat fünfzig Kartons gepackt."),
    ],
})

# ---------------------------------------------------------------- 7 Verein
rewrites.append({
    "id": "671fefe0-de8f-4db2-957d-7616be5e35d2",
    "title_de": "Der Sportverein",
    "title_en": "The Sports Club",
    "content_de": (
        "Lena kommt aus Spanien. Vor einem Jahr ist sie nach Köln gezogen. Am Anfang hat "
        "sie hier niemanden gekannt. Sie konnte damals auch noch nicht gut Deutsch.\n\n"
        "Eine Kollegin hat ihr einen guten Tipp gegeben: „Geh zu einem Sportverein! Dort "
        "findest du schnell Freunde.“ Lena hat im Internet gesucht und einen "
        "Volleyballverein gefunden. Der Verein ist in ihrem Stadtteil.\n\n"
        "Zuerst hat Lena ein Probetraining gemacht. Das war kostenlos. Das Training hat "
        "ihr sofort gefallen. Dann hat sie ein Formular ausgefüllt. Jetzt ist sie "
        "Mitglied. Der Beitrag kostet nur zwölf Euro im Monat.\n\n"
        "Lena trainiert zweimal pro Woche, dienstags und donnerstags von 19 bis 21 Uhr. "
        "Am Wochenende spielt ihre Mannschaft manchmal gegen Teams aus der Region.\n\n"
        "Im Sommer hat der Verein ein Grillfest gemacht. Die Trainerin bekommt kein Geld "
        "für ihre Arbeit. Lena sagt: „Der Verein ist für mich wie eine zweite Familie.“"
    ),
    "content_en": (
        "Lena comes from Spain. A year ago she moved to Cologne. At the beginning she did "
        "not know anybody here. Back then her German was not good yet.\n\n"
        "A colleague gave her a good tip: \"Go to a sports club! You will find friends "
        "there quickly.\" Lena searched on the internet and found a volleyball club. The "
        "club is in her district.\n\n"
        "First Lena did a trial training session. It was free. She liked the training "
        "straight away. Then she filled in a form. Now she is a member. The fee is only "
        "twelve euros a month.\n\n"
        "Lena trains twice a week, on Tuesdays and Thursdays from 7 to 9 p.m. At the "
        "weekend her team sometimes plays against teams from the region.\n\n"
        "In the summer the club had a barbecue party. The coach does not get any money "
        "for her work. Lena says: \"The club is like a second family for me.\""
    ),
    "key_vocabulary": V(
        ("der Verein, -e", "club, association"),
        ("das Mitglied, -er", "member"),
        ("der Tipp, -s", "tip, piece of advice"),
        ("der Stadtteil, -e", "district"),
        ("das Probetraining, -s", "trial training session"),
        ("kostenlos", "free of charge"),
        ("das Training, -s", "training"),
        ("das Formular, -e", "form"),
        ("ausfüllen", "to fill in"),
        ("der Beitrag, ¨-e", "membership fee"),
        ("die Mannschaft, -en", "team"),
        ("die Trainerin, -nen", "coach (female)"),
        ("das Grillfest, -e", "barbecue party"),
    ),
    "questions": Q(
        ("Woher kommt Lena?",
         "Where does Lena come from?",
         "Lena kommt aus Spanien.",
         "Lena comes from Spain."),
        ("Wo hat Lena einen Verein gesucht?",
         "Where did Lena look for a club?",
         "Sie hat im Internet gesucht.",
         "She looked on the internet."),
        ("Was hat Lena nach dem Probetraining gemacht?",
         "What did Lena do after the trial training session?",
         "Sie hat ein Formular ausgefüllt.",
         "She filled in a form."),
        ("Gegen wen spielt die Mannschaft am Wochenende?",
         "Who does the team play against at the weekend?",
         "Sie spielt manchmal gegen Teams aus der Region.",
         "It sometimes plays against teams from the region."),
        ("Bekommt die Trainerin Geld für ihre Arbeit?",
         "Does the coach get money for her work?",
         "Nein, sie bekommt kein Geld für ihre Arbeit.",
         "No, the coach does not get any money for her work."),
    ),
    "checks": [
        rf("Lena spielt Volleyball.",
           "Lena plays volleyball.", "richtig",
           "Im Text steht: Lena hat im Internet gesucht und einen Volleyballverein "
           "gefunden. ... Jetzt ist sie Mitglied."),
        rf("Das Probetraining war kostenlos.",
           "The trial training session was free.", "richtig",
           "Im Text steht: Zuerst hat Lena ein Probetraining gemacht. Das war kostenlos."),
        rf("Der Beitrag kostet zwanzig Euro im Monat.",
           "The fee is twenty euros a month.", "falsch",
           "Im Text steht: Der Beitrag kostet nur zwölf Euro im Monat."),
        rf("Eine Kollegin hat Lena den Tipp gegeben.",
           "A colleague gave Lena the tip.", "richtig",
           "Im Text steht: Eine Kollegin hat ihr einen guten Tipp gegeben."),
        rf("Der Verein hat im Winter ein Grillfest gemacht.",
           "The club had a barbecue party in winter.", "falsch",
           "Im Text steht: Im Sommer hat der Verein ein Grillfest gemacht."),
        ch("Wie oft trainiert Lena? a) einmal pro Woche b) dreimal pro Woche c) zweimal pro Woche",
           "How often does Lena train? a) once a week b) three times a week c) twice a week", "c",
           "Im Text steht: Lena trainiert zweimal pro Woche, dienstags und donnerstags."),
    ],
})

# ---------------------------------------------------------------- 8 Markt
rewrites.append({
    "id": "5fe05477-4bb9-4814-bd73-049713182fbc",
    "title_de": "Ein Besuch auf dem Wochenmarkt",
    "title_en": "A Visit to the Weekly Market",
    "content_de": (
        "Samstagmorgen in Freiburg. Auf dem Platz vor dem Münster ist Wochenmarkt. Die "
        "ersten Stände öffnen schon um halb acht.\n\n"
        "Jonas geht fast jeden Samstag mit seiner Tochter Emma zum Markt. Sie fahren mit "
        "der Straßenbahn in die Stadt, denn Parkplätze sind teuer.\n\n"
        "Zuerst gehen die beiden zu einem Gemüsestand. Der Bauer kommt aus einem Dorf bei "
        "Freiburg. „Was darf es sein?“, fragt er. Jonas kauft ein Kilo Tomaten und einen "
        "Salat. Am Obststand nebenan probiert Emma eine Erdbeere. Danach kaufen die "
        "beiden noch Eier und ein Brot.\n\n"
        "Auf dem Markt bezahlt man oft bar, denn viele Stände nehmen keine Karte. Die "
        "Preise sind manchmal höher als im Supermarkt. Aber die Waren kommen direkt vom "
        "Bauernhof.\n\n"
        "Zum Schluss kauft Jonas seiner Tochter eine Brezel. Dann fahren die beiden nach "
        "Hause und kochen zusammen."
    ),
    "content_en": (
        "Saturday morning in Freiburg. On the square in front of the cathedral there is a "
        "weekly market. The first stalls open as early as half past seven.\n\n"
        "Almost every Saturday Jonas goes to the market with his daughter Emma. They take "
        "the tram into town, because parking spaces are expensive.\n\n"
        "First the two of them go to a vegetable stall. The farmer comes from a village "
        "near Freiburg. \"What can I get you?\" he asks. Jonas buys a kilo of tomatoes and "
        "a lettuce. At the fruit stall next to it Emma tries a strawberry. After that the "
        "two of them also buy eggs and a loaf of bread.\n\n"
        "At the market people often pay in cash, because many stalls do not take cards. "
        "The prices are sometimes higher than at the supermarket. But the goods come "
        "straight from the farm.\n\n"
        "Finally Jonas buys his daughter a pretzel. Then the two of them go home and cook "
        "together."
    ),
    "key_vocabulary": V(
        ("der Wochenmarkt, ¨-e", "weekly market"),
        ("der Stand, ¨-e", "stall, stand"),
        ("die Straßenbahn, -en", "tram"),
        ("der Parkplatz, ¨-e", "parking space"),
        ("der Gemüsestand, ¨-e", "vegetable stall"),
        ("der Bauer, -n", "farmer"),
        ("das Dorf, ¨-er", "village"),
        ("probieren", "to try, to taste"),
        ("die Erdbeere, -n", "strawberry"),
        ("bar bezahlen", "to pay in cash"),
        ("der Preis, -e", "price"),
        ("die Ware, -n", "goods"),
        ("der Bauernhof, ¨-e", "farm"),
        ("die Brezel, -n", "pretzel"),
    ),
    "questions": Q(
        ("Wie oft geht Jonas zum Markt?",
         "How often does Jonas go to the market?",
         "Er geht fast jeden Samstag zum Markt.",
         "He goes to the market almost every Saturday."),
        ("Was kauft Jonas am Gemüsestand?",
         "What does Jonas buy at the vegetable stall?",
         "Er kauft ein Kilo Tomaten und einen Salat.",
         "He buys a kilo of tomatoes and a lettuce."),
        ("Was probiert Emma am Obststand?",
         "What does Emma try at the fruit stall?",
         "Sie probiert eine Erdbeere.",
         "She tries a strawberry."),
        ("Woher kommen die Waren?",
         "Where do the goods come from?",
         "Die Waren kommen direkt vom Bauernhof.",
         "The goods come straight from the farm."),
        ("Was machen Jonas und Emma zu Hause?",
         "What do Jonas and Emma do at home?",
         "Sie kochen zusammen.",
         "They cook together."),
    ),
    "checks": [
        rf("Der Markt ist auf dem Platz vor dem Bahnhof.",
           "The market is on the square in front of the station.", "falsch",
           "Im Text steht: Auf dem Platz vor dem Münster ist Wochenmarkt."),
        rf("Die ersten Stände öffnen um halb neun.",
           "The first stalls open at half past eight.", "falsch",
           "Im Text steht: Die ersten Stände öffnen schon um halb acht."),
        rf("Jonas und Emma fahren mit der Straßenbahn in die Stadt.",
           "Jonas and Emma take the tram into town.", "richtig",
           "Im Text steht: Sie fahren mit der Straßenbahn in die Stadt."),
        rf("Auf dem Markt bezahlt man immer mit Karte.",
           "At the market people always pay by card.", "falsch",
           "Im Text steht: Auf dem Markt bezahlt man oft bar, denn viele Stände nehmen "
           "keine Karte."),
        rf("Der Bauer kommt aus einem Dorf bei Freiburg.",
           "The farmer comes from a village near Freiburg.", "richtig",
           "Im Text steht: Der Bauer kommt aus einem Dorf bei Freiburg."),
        ch("Was kauft Jonas zum Schluss für Emma? a) eine Erdbeere b) eine Brezel c) ein Brot",
           "What does Jonas buy for Emma at the end? a) a strawberry b) a pretzel c) bread",
           "b",
           "Im Text steht: Zum Schluss kauft Jonas seiner Tochter eine Brezel."),
    ],
})

# ---------------------------------------------------------------- exam rows
exam = []

exam.append({
    "level": "a2.1",
    "topic": "Prüfungsformat",
    "difficulty": 2,
    "order_index": 9,
    "title_de": "Lesen Teil 1: Ein Zeitungstext (wie in der Prüfung)",
    "title_en": "Reading Part 1: A newspaper text (exam-style)",
    "content_de": (
        "Lies den Text. Wähle die richtige Antwort: a, b oder c.\n\n"
        "Stadtfest in Lindau: drei Tage Musik und Essen\n\n"
        "Am Wochenende gibt es wieder das große Stadtfest in Lindau. Es beginnt am "
        "Freitag um 16 Uhr und endet am Sonntag um 22 Uhr.\n\n"
        "Auf dem Marktplatz spielen zwanzig Bands. Fast alle Konzerte am Abend sind "
        "kostenlos. "
        "Nur für das Konzert am Samstagabend braucht man eine Karte. Sie kostet acht "
        "Euro.\n\n"
        "Es gibt auch viele Stände mit Essen und Getränken aus der Region. Das "
        "Stadtfest gibt es schon seit dreißig Jahren.\n\n"
        "Für die Kinder gibt es einen Platz vor dem Rathaus. Dort können sie von 11 bis 18 "
        "Uhr spielen und malen.\n\n"
        "Am Wochenende darf man nicht mit dem Auto ins Zentrum fahren. Bitte kommen Sie "
        "mit dem Bus. Die Stadt Lindau schreibt: „Kommen Sie vorbei und feiern Sie mit "
        "uns!“"
    ),
    "content_en": (
        "Read the text. Choose the correct answer: a, b or c.\n\n"
        "Town festival in Lindau: three days of music and food\n\n"
        "This weekend there is the big town festival in Lindau again. It starts on Friday "
        "at 4 p.m. and ends on Sunday at 10 p.m.\n\n"
        "Twenty bands play on the market square. Almost all evening concerts are free. "
        "Only for the concert on Saturday evening do you need a ticket. It costs eight "
        "euros.\n\n"
        "There are also many stalls with food and drinks from the region. The town "
        "festival has existed for thirty years.\n\n"
        "For the children there is a square in front of the town hall. They can play "
        "and paint there from 11 a.m. to 6 p.m.\n\n"
        "At the weekend you are not allowed to drive into the centre by car. Please come "
        "by bus. The town of Lindau writes: \"Come along and celebrate with us!\""
    ),
    "key_vocabulary": V(
        ("das Stadtfest, -e", "town festival"),
        ("beginnen", "to begin"),
        ("enden", "to end"),
        ("der Marktplatz, ¨-e", "market square"),
        ("das Konzert, -e", "concert"),
        ("kostenlos", "free of charge"),
        ("die Karte, -n", "ticket"),
        ("der Stand, ¨-e", "stall, stand"),
        ("das Rathaus, ¨-er", "town hall"),
        ("feiern", "to celebrate"),
    ),
    "questions": Q(
        ("Was gibt es am Wochenende in Lindau?",
         "What is happening in Lindau this weekend?",
         "In Lindau gibt es das große Stadtfest.",
         "In Lindau there is the big town festival."),
        ("Was kann man an den Ständen kaufen?",
         "What can you buy at the stalls?",
         "Man kann Essen und Getränke aus der Region kaufen.",
         "You can buy food and drinks from the region."),
        ("Wie soll man zum Stadtfest kommen?",
         "How should you come to the town festival?",
         "Man soll mit dem Bus kommen.",
         "You should come by bus."),
    ),
    "checks": [
        ch("Wann beginnt das Stadtfest? a) am Freitag b) am Samstag c) am Sonntag",
           "When does the town festival start? a) on Friday b) on Saturday c) on Sunday",
           "a",
           "Im Text steht: Es beginnt am Freitag um 16 Uhr."),
        ch("Wo spielen die Bands? a) vor dem Rathaus b) auf dem Marktplatz c) am Bahnhof",
           "Where do the bands play? a) in front of the town hall b) on the market "
           "square c) at the station",
           "b",
           "Im Text steht: Auf dem Marktplatz spielen zwanzig Bands."),
        ch("Was kostet die Karte am Samstagabend? a) achtzehn Euro b) nichts c) acht Euro",
           "What does the ticket for Saturday evening cost? a) eighteen euros b) nothing "
           "c) eight euros",
           "c",
           "Im Text steht: Sie kostet acht Euro."),
        ch("Was können die Kinder vor dem Rathaus machen? a) spielen und malen "
           "b) Musik machen c) Essen kaufen",
           "What can the children do in front of the town hall? a) play and paint "
           "b) make music c) buy food",
           "a",
           "Im Text steht: Dort können sie von 11 bis 18 Uhr spielen und malen."),
        ch("Wie lange gibt es das Stadtfest schon? a) seit dreizehn Jahren "
           "b) seit zwanzig Jahren c) seit dreißig Jahren",
           "How long has the town festival existed? a) for thirteen years b) for twenty "
           "years c) for thirty years",
           "c",
           "Im Text steht: Das Stadtfest gibt es schon seit dreißig Jahren."),
    ],
})

exam.append({
    "level": "a2.1",
    "topic": "Prüfungsformat",
    "difficulty": 2,
    "order_index": 10,
    "title_de": "Lesen Teil 3: Eine E-Mail (wie in der Prüfung)",
    "title_en": "Reading Part 3: An email (exam-style)",
    "content_de": (
        "Lies die E-Mail. Wähle die richtige Antwort: a, b oder c.\n\n"
        "Von: m.hoffmann@sprachschule-nord.de\n"
        "An: kurs-a2@sprachschule-nord.de\n"
        "Betreff: Ihr Deutschkurs ab Oktober\n\n"
        "Sehr geehrte Damen und Herren,\n\n"
        "Ihr Kurs A2.2 beginnt am Dienstag, 6. Oktober. Der Unterricht ist immer "
        "dienstags und donnerstags von 18 bis 20 Uhr. Wir arbeiten in Raum 12 im zweiten "
        "Stock. Im Kurs sind zwölf Personen.\n\n"
        "Bitte bringen Sie das Buch „Deutsch im Alltag“ mit. Sie können es in der Schule "
        "für 22 Euro kaufen.\n\n"
        "Am ersten Abend gibt es einen kleinen Test. Der Test ist nicht schwer. Am 3. "
        "November gibt es keinen Unterricht. Bitte kommen Sie immer pünktlich zum "
        "Unterricht.\n\n"
        "Der Kurs kostet 180 Euro. Bitte bezahlen Sie bis zum 30. September.\n\n"
        "Haben Sie noch Fragen? Rufen Sie mich an: 0451 998877.\n\n"
        "Mit freundlichen Grüßen\n"
        "Maria Hoffmann"
    ),
    "content_en": (
        "Read the email. Choose the correct answer: a, b or c.\n\n"
        "From: m.hoffmann@sprachschule-nord.de\n"
        "To: kurs-a2@sprachschule-nord.de\n"
        "Subject: Your German course from October\n\n"
        "Dear Sir or Madam,\n\n"
        "Your course A2.2 starts on Tuesday, 6 October. The lessons are always on Tuesdays "
        "and Thursdays from 6 to 8 p.m. We work in room 12 on the second floor. The "
        "course has twelve people in it.\n\n"
        "Please bring the book \"Deutsch im Alltag\" with you. You can buy it at the "
        "school for 22 euros.\n\n"
        "On the first evening there is a small test. The test is not difficult. On 3 "
        "November there are no lessons. Please always come to the lesson on time.\n\n"
        "The course costs 180 euros. Please pay by 30 September.\n\n"
        "Do you have any questions? Call me: 0451 998877.\n\n"
        "Kind regards\n"
        "Maria Hoffmann"
    ),
    "key_vocabulary": V(
        ("der Kurs, -e", "course"),
        ("der Unterricht", "lessons, class"),
        ("der Raum, ¨-e", "room"),
        ("der Stock, Stockwerke", "floor, storey"),
        ("mitbringen", "to bring along"),
        ("der Deutschkurs, -e", "German course"),
        ("der Test, -s", "test"),
        ("bezahlen", "to pay"),
        ("die Frage, -n", "question"),
        ("anrufen", "to call, to phone"),
    ),
    "questions": Q(
        ("Was soll man zum Unterricht mitbringen?",
         "What should you bring to the lesson?",
         "Man soll das Buch „Deutsch im Alltag“ mitbringen.",
         "You should bring the book \"Deutsch im Alltag\"."),
        ("Was gibt es am ersten Abend?",
         "What is there on the first evening?",
         "Am ersten Abend gibt es einen kleinen Test.",
         "On the first evening there is a small test."),
        ("Was kann man bei Fragen machen?",
         "What can you do if you have questions?",
         "Man kann Frau Hoffmann anrufen.",
         "You can call Mrs. Hoffmann."),
    ),
    "checks": [
        ch("Wann beginnt der Kurs? a) am Montag b) am Dienstag c) am Donnerstag",
           "When does the course start? a) on Monday b) on Tuesday c) on Thursday", "b",
           "In der E-Mail steht: Ihr Kurs A2.2 beginnt am Dienstag, 6. Oktober."),
        ch("Wann ist der Unterricht? a) 16 bis 18 Uhr b) 17 bis 19 Uhr c) 18 bis 20 Uhr",
           "When are the lessons? a) 4 to 6 p.m. b) 5 to 7 p.m. c) 6 to 8 p.m.", "c",
           "In der E-Mail steht: Der Unterricht ist immer dienstags und donnerstags von 18 "
           "bis 20 Uhr."),
        ch("Wo ist der Unterricht? a) in Raum 12 b) in Raum 2 c) im ersten Stock",
           "Where are the lessons? a) in room 12 b) in room 2 c) on the first floor", "a",
           "In der E-Mail steht: Wir arbeiten in Raum 12 im zweiten Stock."),
        ch("Was kostet das Buch? a) 12 Euro b) 22 Euro c) 180 Euro",
           "What does the book cost? a) 12 euros b) 22 euros c) 180 euros", "b",
           "In der E-Mail steht: Sie können es in der Schule für 22 Euro kaufen."),
        ch("Bis wann soll man bezahlen? a) bis zum 30. September b) bis zum 6. Oktober "
           "c) bis zum 30. Oktober",
           "By when should you pay? a) by 30 September b) by 6 October c) by 30 October",
           "a",
           "In der E-Mail steht: Bitte bezahlen Sie bis zum 30. September."),
    ],
})

# ---------------------------------------------------------------- emit
# Review round 2, finding 8: German forces "sie" for "die Person"; English does not,
# so the EN model answers of the five lessons with an unnamed protagonist must say
# "the person". Lessons 6–8 name Familie Weber / Lena / Jonas and keep their pronouns.
UNNAMED = {r["id"] for r in rewrites[:5]}
for r in rewrites:
    if r["id"] in UNNAMED:
        for q in r["questions"]:
            q["answer_en"] = re.sub(r"\bShe\b", "The person", q["answer_en"])
            q["answer_en"] = re.sub(r"\bshe\b", "the person", q["answer_en"])

for r in rewrites:
    r["word_count"] = wc(r["content_de"])
    r["estimated_reading_time"] = 2 if r["word_count"] <= 134 else 3

for r in exam:
    r["word_count"] = wc(r["content_de"])
    r["estimated_reading_time"] = 2 if r["word_count"] <= 134 else 3

REWRITE_ORDER = ["id", "title_de", "title_en", "content_de", "content_en",
                 "key_vocabulary", "questions", "checks", "word_count",
                 "estimated_reading_time"]
EXAM_ORDER = ["level", "topic", "difficulty", "order_index", "title_de", "title_en",
              "content_de", "content_en", "key_vocabulary", "questions", "checks",
              "word_count", "estimated_reading_time"]

rewrites = [{k: r[k] for k in REWRITE_ORDER} for r in rewrites]
exam = [{k: r[k] for k in EXAM_ORDER} for r in exam]

with open(os.path.join(OUT, "rewrites-a2.1.json"), "w", encoding="utf-8") as f:
    json.dump(rewrites, f, ensure_ascii=False, indent=2)
    f.write("\n")
with open(os.path.join(OUT, "exam-format-a2.1.json"), "w", encoding="utf-8") as f:
    json.dump(exam, f, ensure_ascii=False, indent=2)
    f.write("\n")

for r in rewrites:
    print(f"{r['word_count']:4d}  {r['estimated_reading_time']}  {r['title_de']}")
for r in exam:
    print(f"{r['word_count']:4d}  {r['estimated_reading_time']}  {r['title_de']}")
