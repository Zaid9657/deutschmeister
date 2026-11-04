// A1.2 reading: four independent short-answer texts per paper, four papers per checkpoint.
// The short frame asks for ONE word/number copied from the text, not a freely composed sentence.
// There are no visible answer options or complementary pair keys. Texts retain their previously
// reviewed situations; the extraction tasks were reviewed against their cited evidence in pass 2.
// 'rejected' records a competing detail for regression checks; it is never sent to the player.
// Run scripts/a12-lesen-check.mjs after edits. The legacy binary gate remains tested on its fixture.
export const LESEN_A12 = {
  "a1.2-cp1": {
    "papers": [
      [
        {
          "id": "a12-cp1-p1-u4",
          "type": "message",
          "text": "Hallo Tim,\nich habe eine Wohnung in Bremen! Die Miete ist 450 Euro. Die Wohnung hat auch einen Keller, er kostet 30 Euro.\nAna",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Die Miete ist ___ Euro.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "450",
          "evidence": "Die Miete ist 450 Euro.",
          "rival": "The rent is 450 euros; 30 euros is the cellar.",
          "explanationDe": "Hier steht: „Die Miete ist 450 Euro.“",
          "explanationEn": "The rent is 450 euros; 30 euros is the cellar.",
          "kind": "reading_gap",
          "rejected": [
            "30"
          ]
        },
        {
          "id": "a12-cp1-p1-u1",
          "type": "exchange",
          "text": "Ana: Ich kaufe heute das Brot. Kaufst du den Kuchen?\nTim: Ja, den Kuchen kaufe ich.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Tim kauft den ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Kuchen",
          "evidence": "Tim: Ja, den Kuchen kaufe ich.",
          "rival": "Tim buys the cake; Ana buys the bread.",
          "explanationDe": "Hier steht: „Tim: Ja, den Kuchen kaufe ich.“",
          "explanationEn": "Tim buys the cake; Ana buys the bread.",
          "kind": "reading_gap",
          "rejected": [
            "Brot"
          ]
        },
        {
          "id": "a12-cp1-p1-u3",
          "type": "exchange",
          "text": "Ana: Gehst du heute in die Apotheke? Ich arbeite heute im Büro.\nTim: Ja, das mache ich.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Ana arbeitet heute im ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Büro",
          "evidence": "Ich arbeite heute im Büro.",
          "rival": "Ana works in the office; Tim goes to the pharmacy.",
          "explanationDe": "Hier steht: „Ich arbeite heute im Büro.“",
          "explanationEn": "Ana works in the office; Tim goes to the pharmacy.",
          "kind": "reading_gap",
          "rejected": [
            "Apotheke"
          ]
        },
        {
          "id": "a12-cp1-p1-u2",
          "type": "ad",
          "text": "Wohnung in Köln frei! Drei Zimmer, Küche, Badezimmer und Balkon. Miete: 520 Euro. Keller: 20 Euro.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Die Wohnung ist in ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Köln",
          "evidence": "Wohnung in Köln frei!",
          "rival": "This advertisement offers a flat in Cologne.",
          "explanationDe": "Hier steht: „Wohnung in Köln frei!“",
          "explanationEn": "This advertisement offers a flat in Cologne.",
          "kind": "reading_gap",
          "rejected": [
            "Bremen"
          ]
        }
      ],
      [
        {
          "id": "a12-cp1-p2-u4",
          "type": "exchange",
          "text": "Tim: Kostet die Lampe vier Euro?\nFrau Wolf: Nein, zehn Euro. Das Buch kostet vier.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Die Lampe kostet ___ Euro.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "zehn",
          "evidence": "Nein, zehn Euro.",
          "rival": "The seller corrects the price of the lamp to ten euros.",
          "explanationDe": "Hier steht: „Nein, zehn Euro.“",
          "explanationEn": "The seller corrects the price of the lamp to ten euros.",
          "kind": "reading_gap",
          "rejected": [
            "vier"
          ]
        },
        {
          "id": "a12-cp1-p2-u1",
          "type": "message",
          "text": "Hallo Paul,\nich gehe heute in die Bibliothek. Bezahlst du bitte heute die Miete?\nLena",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Lena geht heute in die ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Bibliothek",
          "evidence": "ich gehe heute in die Bibliothek.",
          "rival": "Lena says she is going to the library.",
          "explanationDe": "Hier steht: „ich gehe heute in die Bibliothek.“",
          "explanationEn": "Lena says she is going to the library.",
          "kind": "reading_gap",
          "rejected": [
            "Büro"
          ]
        },
        {
          "id": "a12-cp1-p2-u2",
          "type": "exchange",
          "text": "Ana: Ist das Brot teuer?\nFrau Weber: Nein, es kostet drei Euro. Der Kuchen: vier Euro.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Der Kuchen kostet ___ Euro.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "vier",
          "evidence": "Der Kuchen: vier Euro.",
          "rival": "The cake costs four euros; the bread costs three.",
          "explanationDe": "Hier steht: „Der Kuchen: vier Euro.“",
          "explanationEn": "The cake costs four euros; the bread costs three.",
          "kind": "reading_gap",
          "rejected": [
            "drei"
          ]
        },
        {
          "id": "a12-cp1-p2-u3",
          "type": "message",
          "text": "Hallo Paul,\ndu hast heute Zeit. Kochst du am Abend? Ich bin im Büro.\nLena",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: ___ hat heute Zeit.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Paul",
          "evidence": "Hallo Paul,",
          "rival": "Paul is the addressee whom Lena asks to cook.",
          "explanationDe": "Hier steht: „Hallo Paul,“",
          "explanationEn": "Paul is the addressee whom Lena asks to cook.",
          "kind": "reading_gap",
          "rejected": [
            "Lena"
          ]
        }
      ],
      [
        {
          "id": "a12-cp1-p3-u2",
          "type": "message",
          "text": "Hallo Lena,\nam Freitag arbeite ich, am Samstag bin ich am Markt. Kommst du mit?\nPaul",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Paul ist am ___ am Markt.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Samstag",
          "evidence": "am Samstag bin ich am Markt.",
          "rival": "Paul works on Friday and visits the market on Saturday.",
          "explanationDe": "Hier steht: „am Samstag bin ich am Markt.“",
          "explanationEn": "Paul works on Friday and visits the market on Saturday.",
          "kind": "reading_gap",
          "rejected": [
            "Freitag"
          ]
        },
        {
          "id": "a12-cp1-p3-u4",
          "type": "message",
          "text": "Liebe Ana,\nam Freitag gehe ich in das Museum, am Samstag in das Kino. Hast du Zeit?\nTim",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Tim geht am Samstag in das ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Kino",
          "evidence": "am Samstag in das Kino.",
          "rival": "Saturday is the cinema visit; Friday is the museum visit.",
          "explanationDe": "Hier steht: „am Samstag in das Kino.“",
          "explanationEn": "Saturday is the cinema visit; Friday is the museum visit.",
          "kind": "reading_gap",
          "rejected": [
            "Museum"
          ]
        },
        {
          "id": "a12-cp1-p3-u3",
          "type": "exchange",
          "text": "Frau Kaya: Fahren Sie in die Stadt? Ich brauche Brot und Kaffee.\nHerr Wolf: Ja, ich bringe Brot und Kaffee mit.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Herr Wolf bringt Brot und ___ mit.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Kaffee",
          "evidence": "Ja, ich bringe Brot und Kaffee mit.",
          "rival": "Mr Wolf agrees to bring bread and coffee.",
          "explanationDe": "Hier steht: „Ja, ich bringe Brot und Kaffee mit.“",
          "explanationEn": "Mr Wolf agrees to bring bread and coffee.",
          "kind": "reading_gap",
          "rejected": [
            "Kuchen"
          ]
        },
        {
          "id": "a12-cp1-p3-u1",
          "type": "exchange",
          "text": "Frau Kaya: Ich habe einen Garten. Haben Sie einen Balkon?\nHerr Wolf: Ja, ich habe einen Balkon.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Frau Kaya hat einen ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Garten",
          "evidence": "Frau Kaya: Ich habe einen Garten.",
          "rival": "Ms Kaya has a garden; Mr Wolf has a balcony.",
          "explanationDe": "Hier steht: „Frau Kaya: Ich habe einen Garten.“",
          "explanationEn": "Ms Kaya has a garden; Mr Wolf has a balcony.",
          "kind": "reading_gap",
          "rejected": [
            "Balkon"
          ]
        }
      ],
      [
        {
          "id": "a12-cp1-p4-u2",
          "type": "message",
          "text": "Liebe Ana,\nmeine Wohnung ist im Zentrum. Rechts ist die Kirche, links die Bibliothek. Die Haltestelle ist an der Ecke.\nLena",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Die Haltestelle ist an der ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Ecke",
          "evidence": "Die Haltestelle ist an der Ecke.",
          "rival": "The stop is at the corner; the church is on the right.",
          "explanationDe": "Hier steht: „Die Haltestelle ist an der Ecke.“",
          "explanationEn": "The stop is at the corner; the church is on the right.",
          "kind": "reading_gap",
          "rejected": [
            "Kirche"
          ]
        },
        {
          "id": "a12-cp1-p4-u3",
          "type": "message",
          "text": "Hallo Thomas,\ndu kommst am Samstag nach Berlin. Schön! Ich hole dich am Bahnhof ab. Wann ist der Zug da?\nAli",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Thomas kommt am ___ nach Berlin.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Samstag",
          "evidence": "du kommst am Samstag nach Berlin.",
          "rival": "Ali writes to Thomas about his arrival on Saturday.",
          "explanationDe": "Hier steht: „du kommst am Samstag nach Berlin.“",
          "explanationEn": "Ali writes to Thomas about his arrival on Saturday.",
          "kind": "reading_gap",
          "rejected": [
            "Sonntag"
          ]
        },
        {
          "id": "a12-cp1-p4-u1",
          "type": "message",
          "text": "Hallo Thomas,\nich koche am Sonntag. Bringst du bitte den Kuchen mit?\nAli",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: ___ kocht am Sonntag.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Ali",
          "evidence": "ich koche am Sonntag.",
          "rival": "Ali signs the message, so the person saying I will cook is Ali.",
          "explanationDe": "Hier steht: „ich koche am Sonntag.“",
          "explanationEn": "Ali signs the message, so the person saying I will cook is Ali.",
          "kind": "reading_gap",
          "rejected": [
            "Thomas"
          ]
        },
        {
          "id": "a12-cp1-p4-u4",
          "type": "exchange",
          "text": "Herr Berg: Das ist das Haus. Rechts ist die Bank, links der Park.\nAna: Das ist gut.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Die Bank ist ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "rechts",
          "evidence": "Rechts ist die Bank, links der Park.",
          "rival": "The bank is on the right; the park is on the left.",
          "explanationDe": "Hier steht: „Rechts ist die Bank, links der Park.“",
          "explanationEn": "The bank is on the right; the park is on the left.",
          "kind": "reading_gap",
          "rejected": [
            "links"
          ]
        }
      ]
    ]
  },
  "a1.2-cp2": {
    "papers": [
      [
        {
          "id": "a12-cp2-p1-u3",
          "type": "exchange",
          "text": "Lena: Der Zug fährt um acht Uhr. Kommst du mit?\nTim: Nein, ich habe um neun Uhr einen Termin.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Tim hat um ___ Uhr einen Termin.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "neun",
          "evidence": "ich habe um neun Uhr einen Termin.",
          "rival": "Nine is the appointment time; eight is the train time.",
          "explanationDe": "Hier steht: „ich habe um neun Uhr einen Termin.“",
          "explanationEn": "Nine is the appointment time; eight is the train time.",
          "kind": "reading_gap",
          "rejected": [
            "acht"
          ]
        },
        {
          "id": "a12-cp2-p1-u2",
          "type": "exchange",
          "text": "Lena: Hast du Kopfschmerzen? Du bist heute so müde.\nPaul: Ja, und mein Hals tut weh.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Paul: Mein ___ tut weh.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Hals",
          "evidence": "mein Hals tut weh.",
          "rival": "Paul adds that his throat hurts.",
          "explanationDe": "Hier steht: „mein Hals tut weh.“",
          "explanationEn": "Paul adds that his throat hurts.",
          "kind": "reading_gap",
          "rejected": [
            "Bauch"
          ]
        },
        {
          "id": "a12-cp2-p1-u1",
          "type": "exchange",
          "text": "Lena: Ich habe am Samstag Geburtstag. Ich mache eine Party. Kommst du?\nPaul: Ja, gern! Ich bringe einen Kuchen mit.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Lena hat am ___ Geburtstag.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Samstag",
          "evidence": "Ich habe am Samstag Geburtstag.",
          "rival": "Lena says her birthday is on Saturday.",
          "explanationDe": "Hier steht: „Ich habe am Samstag Geburtstag.“",
          "explanationEn": "Lena says her birthday is on Saturday.",
          "kind": "reading_gap",
          "rejected": [
            "Sonntag"
          ]
        },
        {
          "id": "a12-cp2-p1-u4",
          "type": "exchange",
          "text": "Herr Wolf: Entschuldigung, ist das Frühstück um acht Uhr?\nFrau Kaya: Nein, um neun Uhr, im Restaurant.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Das Frühstück ist im ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Restaurant",
          "evidence": "Nein, um neun Uhr, im Restaurant.",
          "rival": "Ms Kaya gives the restaurant as the breakfast location.",
          "explanationDe": "Hier steht: „Nein, um neun Uhr, im Restaurant.“",
          "explanationEn": "Ms Kaya gives the restaurant as the breakfast location.",
          "kind": "reading_gap",
          "rejected": [
            "Zimmer"
          ]
        }
      ],
      [
        {
          "id": "a12-cp2-p2-u1",
          "type": "exchange",
          "text": "Ana: Ich gehe heute in die Praxis, denn mein Bauch tut weh. Wo ist meine Versichertenkarte?\nTim: Hier, bitte. Ich koche Tee.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Ana: Wo ist meine ___?",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Versichertenkarte",
          "evidence": "Wo ist meine Versichertenkarte?",
          "rival": "Ana asks for her insurance card before going to the practice.",
          "explanationDe": "Hier steht: „Wo ist meine Versichertenkarte?“",
          "explanationEn": "Ana asks for her insurance card before going to the practice.",
          "kind": "reading_gap",
          "rejected": [
            "Tablette"
          ]
        },
        {
          "id": "a12-cp2-p2-u3",
          "type": "exchange",
          "text": "Lena: Das Konzert in Köln ist am Samstag. Kommst du mit?\nPaul: Nein, ich arbeite. Am Sonntag habe ich Zeit.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Das Konzert ist in ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Köln",
          "evidence": "Das Konzert in Köln ist am Samstag.",
          "rival": "The concert is in Cologne.",
          "explanationDe": "Hier steht: „Das Konzert in Köln ist am Samstag.“",
          "explanationEn": "The concert is in Cologne.",
          "kind": "reading_gap",
          "rejected": [
            "Bremen"
          ]
        },
        {
          "id": "a12-cp2-p2-u4",
          "type": "exchange",
          "text": "Frau Schmidt: Guten Tag. Haben Sie am Samstag ein Zimmer frei?\nHerr Brandt: Nein, leider nur am Sonntag.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Ein Zimmer ist nur am ___ frei.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Sonntag",
          "evidence": "Nein, leider nur am Sonntag.",
          "rival": "The receptionist rejects Saturday and offers Sunday.",
          "explanationDe": "Hier steht: „Nein, leider nur am Sonntag.“",
          "explanationEn": "The receptionist rejects Saturday and offers Sunday.",
          "kind": "reading_gap",
          "rejected": [
            "Samstag"
          ]
        },
        {
          "id": "a12-cp2-p2-u2",
          "type": "exchange",
          "text": "Ana: Wer kauft die Fahrkarten? Der Ausflug ist am Samstag.\nTim: Ich! Ich bin heute am Bahnhof.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: ___ kauft die Fahrkarten.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Tim",
          "evidence": "Tim: Ich! Ich bin heute am Bahnhof.",
          "rival": "Tim volunteers to buy the tickets.",
          "explanationDe": "Hier steht: „Tim: Ich! Ich bin heute am Bahnhof.“",
          "explanationEn": "Tim volunteers to buy the tickets.",
          "kind": "reading_gap",
          "rejected": [
            "Ana"
          ]
        }
      ],
      [
        {
          "id": "a12-cp2-p3-u4",
          "type": "message",
          "text": "Guten Tag, Frau Weber,\nIhr Termin in der Praxis ist nicht am Donnerstag. Er ist am Freitag um acht Uhr. Sie brauchen Ihre Versichertenkarte.\nPraxis Berger",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Der Termin ist am ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Freitag",
          "evidence": "Er ist am Freitag um acht Uhr.",
          "rival": "The message explicitly corrects Thursday to Friday.",
          "explanationDe": "Hier steht: „Er ist am Freitag um acht Uhr.“",
          "explanationEn": "The message explicitly corrects Thursday to Friday.",
          "kind": "reading_gap",
          "rejected": [
            "Donnerstag"
          ]
        },
        {
          "id": "a12-cp2-p3-u1",
          "type": "message",
          "text": "Hallo Thomas,\ndie Lampe funktioniert nicht, und ich habe keine Bettdecke. Ich wechsele das Zimmer. Dein Zimmer ist gut, oder?\nAli",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Ali hat keine ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Bettdecke",
          "evidence": "ich habe keine Bettdecke.",
          "rival": "Ali has a broken lamp, but no duvet.",
          "explanationDe": "Hier steht: „ich habe keine Bettdecke.“",
          "explanationEn": "Ali has a broken lamp, but no duvet.",
          "kind": "reading_gap",
          "rejected": [
            "Lampe"
          ]
        },
        {
          "id": "a12-cp2-p3-u3",
          "type": "message",
          "text": "Hallo Ana,\ndie Party ist am Donnerstag um acht Uhr. Am Freitag habe ich keine Zeit. Bis bald!\nLena",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Die Party ist um ___ Uhr.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "acht",
          "evidence": "die Party ist am Donnerstag um acht Uhr.",
          "rival": "The party starts at eight.",
          "explanationDe": "Hier steht: „die Party ist am Donnerstag um acht Uhr.“",
          "explanationEn": "The party starts at eight.",
          "kind": "reading_gap",
          "rejected": [
            "neun"
          ]
        },
        {
          "id": "a12-cp2-p3-u2",
          "type": "message",
          "text": "Hallo Thomas,\nich bin krank und gehe heute nicht ins Büro. Am Montag habe ich einen Termin in der Praxis. Du hast am Montag frei. Kommst du mit?\nAli",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Thomas hat am ___ frei.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Montag",
          "evidence": "Du hast am Montag frei.",
          "rival": "Ali addresses Thomas as you and says he is free on Monday.",
          "explanationDe": "Hier steht: „Du hast am Montag frei.“",
          "explanationEn": "Ali addresses Thomas as you and says he is free on Monday.",
          "kind": "reading_gap",
          "rejected": [
            "Freitag"
          ]
        }
      ],
      [
        {
          "id": "a12-cp2-p4-u2",
          "type": "exchange",
          "text": "Lena: Hast du keinen Schlüssel? Wo ist das Zimmer?\nTim: Doch, hier ist er. Das Zimmer ist im Flur links.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Das Zimmer ist im Flur ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "links",
          "evidence": "Das Zimmer ist im Flur links.",
          "rival": "Tim locates the room on the left in the corridor.",
          "explanationDe": "Hier steht: „Das Zimmer ist im Flur links.“",
          "explanationEn": "Tim locates the room on the left in the corridor.",
          "kind": "reading_gap",
          "rejected": [
            "rechts"
          ]
        },
        {
          "id": "a12-cp2-p4-u3",
          "type": "exchange",
          "text": "Paul: Am Samstag machen wir einen Ausflug nach Köln. Kommst du mit?\nAna: Nein, ich fahre am Samstag nach Bremen.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Der Ausflug geht nach ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Köln",
          "evidence": "Am Samstag machen wir einen Ausflug nach Köln.",
          "rival": "The group excursion is to Cologne; Ana travels separately to Bremen.",
          "explanationDe": "Hier steht: „Am Samstag machen wir einen Ausflug nach Köln.“",
          "explanationEn": "The group excursion is to Cologne; Ana travels separately to Bremen.",
          "kind": "reading_gap",
          "rejected": [
            "Bremen"
          ]
        },
        {
          "id": "a12-cp2-p4-u4",
          "type": "exchange",
          "text": "Herr Berg: Entschuldigung, fährt der Bus hier nach Köln?\nFrau Chakiri: Nein, nach Bremen. Hier ist der Fahrplan.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Der Bus fährt nach ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Bremen",
          "evidence": "Nein, nach Bremen.",
          "rival": "Ms Chakiri corrects the destination to Bremen.",
          "explanationDe": "Hier steht: „Nein, nach Bremen.“",
          "explanationEn": "Ms Chakiri corrects the destination to Bremen.",
          "kind": "reading_gap",
          "rejected": [
            "Köln"
          ]
        },
        {
          "id": "a12-cp2-p4-u1",
          "type": "exchange",
          "text": "Lena: Ich habe eine Erkältung. Hast du keine Tabletten?\nTim: Doch, hier. Ich gehe heute in die Apotheke und kaufe Tee.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Tim kauft heute ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Tee",
          "evidence": "Ich gehe heute in die Apotheke und kaufe Tee.",
          "rival": "Tim already has tablets and says he will buy tea.",
          "explanationDe": "Hier steht: „Ich gehe heute in die Apotheke und kaufe Tee.“",
          "explanationEn": "Tim already has tablets and says he will buy tea.",
          "kind": "reading_gap",
          "rejected": [
            "Tabletten"
          ]
        }
      ]
    ]
  },
  "a1.2-cp3": {
    "papers": [
      [
        {
          "id": "a12-cp3-p1-u2",
          "type": "message",
          "text": "Hallo Ana,\nmein Zug kommt um acht Uhr in Köln an, nicht um neun Uhr. Hol mich bitte am Bahnhof ab!\nPaul",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Paul kommt um ___ Uhr an.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "acht",
          "evidence": "mein Zug kommt um acht Uhr in Köln an, nicht um neun Uhr.",
          "rival": "Paul explicitly says eight, not nine.",
          "explanationDe": "Hier steht: „mein Zug kommt um acht Uhr in Köln an, nicht um neun Uhr.“",
          "explanationEn": "Paul explicitly says eight, not nine.",
          "kind": "reading_gap",
          "rejected": [
            "neun"
          ]
        },
        {
          "id": "a12-cp3-p1-u3",
          "type": "exchange",
          "text": "Lena: Kaufst du das Brot? Ich koche heute Suppe.\nTim: Ja, gern. Ich gehe gleich.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Lena kocht heute ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Suppe",
          "evidence": "Ich koche heute Suppe.",
          "rival": "Lena cooks soup; Tim buys bread.",
          "explanationDe": "Hier steht: „Ich koche heute Suppe.“",
          "explanationEn": "Lena cooks soup; Tim buys bread.",
          "kind": "reading_gap",
          "rejected": [
            "Brot"
          ]
        },
        {
          "id": "a12-cp3-p1-u1",
          "type": "exchange",
          "text": "Lena: Ich kaufe die Tickets. Holst du die Koffer?\nTim: Ja, das mache ich.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Tim holt die ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Koffer",
          "evidence": "Holst du die Koffer?",
          "rival": "Tim agrees to get the suitcases; Lena buys the tickets.",
          "explanationDe": "Hier steht: „Holst du die Koffer?“",
          "explanationEn": "Tim agrees to get the suitcases; Lena buys the tickets.",
          "kind": "reading_gap",
          "rejected": [
            "Tickets"
          ]
        },
        {
          "id": "a12-cp3-p1-u4",
          "type": "notice",
          "text": "Achtung: Der Bus nach Bremen fährt heute nicht um acht Uhr ab, sondern um neun Uhr.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Der Bus fährt nach ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Bremen",
          "evidence": "Der Bus nach Bremen",
          "rival": "The notice concerns the bus to Bremen.",
          "explanationDe": "Hier steht: „Der Bus nach Bremen“",
          "explanationEn": "The notice concerns the bus to Bremen.",
          "kind": "reading_gap",
          "rejected": [
            "Köln"
          ]
        }
      ],
      [
        {
          "id": "a12-cp3-p2-u1",
          "type": "exchange",
          "text": "Ali: Ich hole den Teppich. Wer kauft heute das Brot?\nThomas: Ich! Ich habe Hunger.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Ali holt den ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Teppich",
          "evidence": "Ali: Ich hole den Teppich.",
          "rival": "Ali gets the carpet; Thomas buys bread.",
          "explanationDe": "Hier steht: „Ali: Ich hole den Teppich.“",
          "explanationEn": "Ali gets the carpet; Thomas buys bread.",
          "kind": "reading_gap",
          "rejected": [
            "Brot"
          ]
        },
        {
          "id": "a12-cp3-p2-u2",
          "type": "exchange",
          "text": "Paul: Ist Papa im Wohnzimmer?\nAna: Nein, er ist in der Küche. Er kocht.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Papa ist in der ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Küche",
          "evidence": "Nein, er ist in der Küche.",
          "rival": "Ana corrects the location to the kitchen.",
          "explanationDe": "Hier steht: „Nein, er ist in der Küche.“",
          "explanationEn": "Ana corrects the location to the kitchen.",
          "kind": "reading_gap",
          "rejected": [
            "Wohnzimmer"
          ]
        },
        {
          "id": "a12-cp3-p2-u4",
          "type": "exchange",
          "text": "Ana: Der Fernseher ist im Wohnzimmer. Ist das Radio auch da?\nPaul: Nein, das Radio ist in der Küche.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Im Wohnzimmer ist der ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Fernseher",
          "evidence": "Der Fernseher ist im Wohnzimmer.",
          "rival": "The television is in the living room; the radio is in the kitchen.",
          "explanationDe": "Hier steht: „Der Fernseher ist im Wohnzimmer.“",
          "explanationEn": "The television is in the living room; the radio is in the kitchen.",
          "kind": "reading_gap",
          "rejected": [
            "Radio"
          ]
        },
        {
          "id": "a12-cp3-p2-u3",
          "type": "exchange",
          "text": "Ali: Wer holt Oma am Flughafen ab? Ich muss arbeiten.\nThomas: Ich! Ich habe heute Zeit.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Thomas holt ___ am Flughafen ab.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Oma",
          "evidence": "Wer holt Oma am Flughafen ab?",
          "rival": "Thomas volunteers to pick up grandma because Ali has to work.",
          "explanationDe": "Hier steht: „Wer holt Oma am Flughafen ab?“",
          "explanationEn": "Thomas volunteers to pick up grandma because Ali has to work.",
          "kind": "reading_gap",
          "rejected": [
            "Opa"
          ]
        }
      ],
      [
        {
          "id": "a12-cp3-p3-u3",
          "type": "exchange",
          "text": "Ana: Am Samstag war ich nicht im Kino. Ich war krank. Und du?\nPaul: Ich war da. Der Film war gut.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Ana war am Samstag ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "krank",
          "evidence": "Ich war krank.",
          "rival": "Ana was ill; Paul was at the cinema.",
          "explanationDe": "Hier steht: „Ich war krank.“",
          "explanationEn": "Ana was ill; Paul was at the cinema.",
          "kind": "reading_gap",
          "rejected": [
            "gesund"
          ]
        },
        {
          "id": "a12-cp3-p3-u2",
          "type": "exchange",
          "text": "Tim: Ist Opa heute traurig?\nLena: Nein, er ist glücklich. Er war nur müde.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Opa ist heute ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "glücklich",
          "evidence": "Nein, er ist glücklich.",
          "rival": "Lena says he is happy now, not sad.",
          "explanationDe": "Hier steht: „Nein, er ist glücklich.“",
          "explanationEn": "Lena says he is happy now, not sad.",
          "kind": "reading_gap",
          "rejected": [
            "traurig"
          ]
        },
        {
          "id": "a12-cp3-p3-u1",
          "type": "exchange",
          "text": "Ana: Ich war gestern in Köln. Meine Tante wohnt da. Und du?\nPaul: Ich war zu Hause. Ich hatte keine Zeit.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Ana: Meine Tante wohnt in ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Köln",
          "evidence": "Ich war gestern in Köln. Meine Tante wohnt da.",
          "rival": "There refers back to Cologne.",
          "explanationDe": "Hier steht: „Ich war gestern in Köln. Meine Tante wohnt da.“",
          "explanationEn": "There refers back to Cologne.",
          "kind": "reading_gap",
          "rejected": [
            "Bremen"
          ]
        },
        {
          "id": "a12-cp3-p3-u4",
          "type": "exchange",
          "text": "Ali: Papa ist heute traurig, denn er muss am Samstag arbeiten. Und Mama?\nThomas: Nein, Mama ist glücklich. Sie fährt am Samstag nach Bremen.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Papa muss am ___ arbeiten.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Samstag",
          "evidence": "er muss am Samstag arbeiten.",
          "rival": "Having to work on Saturday is why dad is sad.",
          "explanationDe": "Hier steht: „er muss am Samstag arbeiten.“",
          "explanationEn": "Having to work on Saturday is why dad is sad.",
          "kind": "reading_gap",
          "rejected": [
            "Sonntag"
          ]
        }
      ],
      [
        {
          "id": "a12-cp3-p4-u4",
          "type": "message",
          "text": "Hallo Tim,\nsteig bitte nicht am Bahnhof aus, sondern am Flughafen. Ich warte da.\nAna",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Tim soll am ___ aussteigen.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Flughafen",
          "evidence": "sondern am Flughafen.",
          "rival": "Ana asks Tim to get off at the airport instead of the station.",
          "explanationDe": "Hier steht: „sondern am Flughafen.“",
          "explanationEn": "Ana asks Tim to get off at the airport instead of the station.",
          "kind": "reading_gap",
          "rejected": [
            "Bahnhof"
          ]
        },
        {
          "id": "a12-cp3-p4-u3",
          "type": "note",
          "text": "Hallo Paul,\nAli möchte im Garten helfen, aber er ist krank. Hilf du bitte Papa!\nMama",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: ___ soll Papa im Garten helfen.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Paul",
          "evidence": "Hilf du bitte Papa!",
          "rival": "The note addresses Paul; Ali wants to help but is ill.",
          "explanationDe": "Hier steht: „Hilf du bitte Papa!“",
          "explanationEn": "The note addresses Paul; Ali wants to help but is ill.",
          "kind": "reading_gap",
          "rejected": [
            "Ali"
          ]
        },
        {
          "id": "a12-cp3-p4-u2",
          "type": "notice",
          "text": "Achtung: Sie müssen am Bahnhof aussteigen, nicht am Flughafen. Bitte nehmen Sie dann ein Taxi.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Sie nehmen dann ein ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Taxi",
          "evidence": "Bitte nehmen Sie dann ein Taxi.",
          "rival": "After leaving at the station, the notice asks passengers to take a taxi.",
          "explanationDe": "Hier steht: „Bitte nehmen Sie dann ein Taxi.“",
          "explanationEn": "After leaving at the station, the notice asks passengers to take a taxi.",
          "kind": "reading_gap",
          "rejected": [
            "Fahrrad"
          ]
        },
        {
          "id": "a12-cp3-p4-u1",
          "type": "note",
          "text": "Hallo Paul,\nich komme spät. Ali kocht heute. Kauf du bitte das Brot!\nMama",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Ali ___ heute.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "kocht",
          "evidence": "Ali kocht heute.",
          "rival": "Ali cooks; Paul is asked to buy bread.",
          "explanationDe": "Hier steht: „Ali kocht heute.“",
          "explanationEn": "Ali cooks; Paul is asked to buy bread.",
          "kind": "reading_gap",
          "rejected": [
            "kommt"
          ]
        }
      ]
    ]
  },
  "a1.2-cp4": {
    "papers": [
      [
        {
          "id": "a12-cp4-p1-u3",
          "type": "exchange",
          "text": "Ana: Entschuldigung, ist die Jacke teuer?\nFrau Wolf: Nein, die Jacke kostet nur fünfzig Euro. Die Mütze ist billig: zehn Euro.\nAna: Gut, danke!",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Die Mütze kostet ___ Euro.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "zehn",
          "evidence": "Die Mütze ist billig: zehn Euro.",
          "rival": "Ten euros is the hat; fifty is the jacket.",
          "explanationDe": "Hier steht: „Die Mütze ist billig: zehn Euro.“",
          "explanationEn": "Ten euros is the hat; fifty is the jacket.",
          "kind": "reading_gap",
          "rejected": [
            "fünfzig"
          ]
        },
        {
          "id": "a12-cp4-p1-u1",
          "type": "exchange",
          "text": "Lena: Ich habe den Fisch gekocht. Hast du den Saft gekauft?\nTim: Ja, und das Obst auch.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Lena hat den ___ gekocht.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Fisch",
          "evidence": "Ich habe den Fisch gekocht.",
          "rival": "Lena cooked fish; Tim bought juice and fruit.",
          "explanationDe": "Hier steht: „Ich habe den Fisch gekocht.“",
          "explanationEn": "Lena cooked fish; Tim bought juice and fruit.",
          "kind": "reading_gap",
          "rejected": [
            "Saft"
          ]
        },
        {
          "id": "a12-cp4-p1-u2",
          "type": "exchange",
          "text": "Lena: Hast du die Suppe gekocht? Sie war sehr lecker!\nTim: Ja, das habe ich gemacht. Danke!",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: ___ hat die Suppe gekocht.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Tim",
          "evidence": "Tim: Ja, das habe ich gemacht.",
          "rival": "Tim confirms that he cooked the soup.",
          "explanationDe": "Hier steht: „Tim: Ja, das habe ich gemacht.“",
          "explanationEn": "Tim confirms that he cooked the soup.",
          "kind": "reading_gap",
          "rejected": [
            "Lena"
          ]
        },
        {
          "id": "a12-cp4-p1-u4",
          "type": "exchange",
          "text": "Lena: Kostet der Schal dreißig Euro?\nFrau Wolf: Nein, er kostet nur zehn Euro.\nLena: Gut, dann nehme ich ihn.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Lena nimmt den ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Schal",
          "evidence": "Kostet der Schal dreißig Euro?",
          "rival": "The scarf is the item Lena agrees to buy after its price is corrected.",
          "explanationDe": "Hier steht: „Kostet der Schal dreißig Euro?“",
          "explanationEn": "The scarf is the item Lena agrees to buy after its price is corrected.",
          "kind": "reading_gap",
          "rejected": [
            "Mantel"
          ]
        }
      ],
      [
        {
          "id": "a12-cp4-p2-u3",
          "type": "message",
          "text": "Hallo Paul,\nam Samstag ist es sonnig und warm. Wir fahren dann nach Köln. Am Sonntag kommt der Regen, dann fahre ich nicht.\nLena",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Am ___ fährt Lena nicht nach Köln.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Sonntag",
          "evidence": "Am Sonntag kommt der Regen, dann fahre ich nicht.",
          "rival": "She travels on Saturday and avoids the rain on Sunday.",
          "explanationDe": "Hier steht: „Am Sonntag kommt der Regen, dann fahre ich nicht.“",
          "explanationEn": "She travels on Saturday and avoids the rain on Sunday.",
          "kind": "reading_gap",
          "rejected": [
            "Samstag"
          ]
        },
        {
          "id": "a12-cp4-p2-u2",
          "type": "exchange",
          "text": "Ana: Kaufst du den Mantel? Er ist sehr schön.\nPaul: Ja, ich nehme ihn. Er passt mir.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Der Mantel passt ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Paul",
          "evidence": "Paul: Ja, ich nehme ihn. Er passt mir.",
          "rival": "Paul is speaking, so mir refers to Paul.",
          "explanationDe": "Hier steht: „Paul: Ja, ich nehme ihn. Er passt mir.“",
          "explanationEn": "Paul is speaking, so mir refers to Paul.",
          "kind": "reading_gap",
          "rejected": [
            "Ana"
          ]
        },
        {
          "id": "a12-cp4-p2-u4",
          "type": "message",
          "text": "Hallo Ali,\nam Dienstag ist es nicht sonnig. Es regnet und der Wind ist kalt. Am Mittwoch kommt die Sonne. Dann fahren wir nach Bremen.\nThomas",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Am Dienstag ist der Wind ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "kalt",
          "evidence": "Es regnet und der Wind ist kalt.",
          "rival": "Tuesday has rain and cold wind; sunshine comes on Wednesday.",
          "explanationDe": "Hier steht: „Es regnet und der Wind ist kalt.“",
          "explanationEn": "Tuesday has rain and cold wind; sunshine comes on Wednesday.",
          "kind": "reading_gap",
          "rejected": [
            "warm"
          ]
        },
        {
          "id": "a12-cp4-p2-u1",
          "type": "exchange",
          "text": "Ana: Ich kaufe das Kleid für meine Schwester. Gefällt dir der Pullover?\nPaul: Ja, er passt mir gut.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Ana kauft das Kleid für ihre ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Schwester",
          "evidence": "Ich kaufe das Kleid für meine Schwester.",
          "rival": "The dress is for Anas sister.",
          "explanationDe": "Hier steht: „Ich kaufe das Kleid für meine Schwester.“",
          "explanationEn": "The dress is for Anas sister.",
          "kind": "reading_gap",
          "rejected": [
            "Mutter"
          ]
        }
      ],
      [
        {
          "id": "a12-cp4-p3-u3",
          "type": "message",
          "text": "Hallo Ana,\ndas Fest war schön! Paul hat den Fisch gegessen. Die Wurst hat Tim gegessen, er isst nicht gern Fisch.\nLena",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Paul hat den ___ gegessen.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Fisch",
          "evidence": "Paul hat den Fisch gegessen.",
          "rival": "Paul ate fish; Tim ate sausage.",
          "explanationDe": "Hier steht: „Paul hat den Fisch gegessen.“",
          "explanationEn": "Paul ate fish; Tim ate sausage.",
          "kind": "reading_gap",
          "rejected": [
            "Wurst"
          ]
        },
        {
          "id": "a12-cp4-p3-u1",
          "type": "message",
          "text": "Liebe Ana,\nes regnet heute, aber Tim fährt mit dem Fahrrad zum Markt. Ich nehme den Bus, ich fahre bei Regen nicht gern.\nLena",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Lena nimmt den ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Bus",
          "evidence": "Ich nehme den Bus,",
          "rival": "Lena signs the message and says she takes the bus.",
          "explanationDe": "Hier steht: „Ich nehme den Bus,“",
          "explanationEn": "Lena signs the message and says she takes the bus.",
          "kind": "reading_gap",
          "rejected": [
            "Fahrrad"
          ]
        },
        {
          "id": "a12-cp4-p3-u4",
          "type": "message",
          "text": "Hallo Lena,\nAli hat gestern den Fisch nicht gegessen. Nur die Wurst hat er gegessen. Der Fisch war aber lecker!\nThomas",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Ali hat nur die ___ gegessen.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Wurst",
          "evidence": "Nur die Wurst hat er gegessen.",
          "rival": "Ali ate only sausage, not fish.",
          "explanationDe": "Hier steht: „Nur die Wurst hat er gegessen.“",
          "explanationEn": "Ali ate only sausage, not fish.",
          "kind": "reading_gap",
          "rejected": [
            "Fisch"
          ]
        },
        {
          "id": "a12-cp4-p3-u2",
          "type": "message",
          "text": "Liebe Ana,\nes schneit, und wir fahren heute nach Köln. Tim fährt nicht mit dem Fahrrad zum Bahnhof, er nimmt das Taxi. Ich nehme das Fahrrad, das Taxi ist teuer.\nLena",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Tim nimmt heute das ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Taxi",
          "evidence": "er nimmt das Taxi.",
          "rival": "Tim takes the taxi; Lena takes the bicycle.",
          "explanationDe": "Hier steht: „er nimmt das Taxi.“",
          "explanationEn": "Tim takes the taxi; Lena takes the bicycle.",
          "kind": "reading_gap",
          "rejected": [
            "Fahrrad"
          ]
        }
      ],
      [
        {
          "id": "a12-cp4-p4-u4",
          "type": "exchange",
          "text": "Lena: Ist der Rock blau? Er gefällt mir.\nAna: Nein, er ist grün.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Der Rock ist ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "grün",
          "evidence": "Nein, er ist grün.",
          "rival": "Ana corrects the colour to green.",
          "explanationDe": "Hier steht: „Nein, er ist grün.“",
          "explanationEn": "Ana corrects the colour to green.",
          "kind": "reading_gap",
          "rejected": [
            "blau"
          ]
        },
        {
          "id": "a12-cp4-p4-u1",
          "type": "exchange",
          "text": "Thomas: Ich bin früh gegangen. War das Fest noch schön?\nAli: Ja, wir haben viel getanzt.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Thomas ist früh ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "gegangen",
          "evidence": "Ich bin früh gegangen.",
          "rival": "Thomas says he left early; Ali stayed and danced.",
          "explanationDe": "Hier steht: „Ich bin früh gegangen.“",
          "explanationEn": "Thomas says he left early; Ali stayed and danced.",
          "kind": "reading_gap",
          "rejected": [
            "gefahren"
          ]
        },
        {
          "id": "a12-cp4-p4-u3",
          "type": "exchange",
          "text": "Lena: Der Mantel ist blau. Die Mütze ist grün. Kaufst du den Mantel?\nAna: Nein, er ist zu groß für mich.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Der Mantel ist für Ana zu ___.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "groß",
          "evidence": "er ist zu groß für mich.",
          "rival": "Ana does not buy the coat because it is too big.",
          "explanationDe": "Hier steht: „er ist zu groß für mich.“",
          "explanationEn": "Ana does not buy the coat because it is too big.",
          "kind": "reading_gap",
          "rejected": [
            "klein"
          ]
        },
        {
          "id": "a12-cp4-p4-u2",
          "type": "exchange",
          "text": "Thomas: Bist du mit dem Zug nach Köln gefahren?\nAli: Ja, der Zug war schnell.",
          "question": "Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: Ali ist mit dem ___ nach Köln gefahren.",
          "questionEn": "Complete the gap with one word or number from the text.",
          "answer": "Zug",
          "evidence": "Bist du mit dem Zug nach Köln gefahren?",
          "rival": "Ali confirms he travelled by train.",
          "explanationDe": "Hier steht: „Bist du mit dem Zug nach Köln gefahren?“",
          "explanationEn": "Ali confirms he travelled by train.",
          "kind": "reading_gap",
          "rejected": [
            "Bus"
          ]
        }
      ]
    ]
  }
};
