// A1.2 CHECKPOINT LESEN — authored text–question units (DaF review #11, MAJOR M8).
//
// WHY THEY ARE AUTHORED. The section used to be generated from the Lektion dialogues: a report of one line
// against its falsification. Review #11 showed a sentence-overlap strategy solving 64 of 64 such items: the
// key always matched its source sentence better than its falsification did. Codex's design verdicts of
// 2026-10-19 (docs/course-factory/a12-rebuild/DESIGN-m8-lesen-2026-10-19.md) replaced them with NEW short
// texts — an exchange, a message, a note, an ad, a form, a notice — in the chapter's situations, written only
// with what the chapter has taught, each with a W-question whose two options BOTH stand in the text as
// competing information, so that only understanding tells them apart.
//
// THE SHAPE. Per checkpoint four papers (round 0–3 each read texts they have not seen), each four units,
// each paper two mirrored pairs (`pair`), approved AS A WHOLE against the frozen surface gate
// (tests/helpers/lesenGate.mjs). `options` is the order the learner sees; `evidence` is the span that
// answers; `rival` says why the other option, though in the text, does not.
//
// BANK ORDER (review #12). Each position and each question-type occurrence (Wer / other W-question,
// first / second in its paper) carries A and B equally often. Every fixed four-letter sequence and
// type-rank rule, including its inverse, scores at most 32/64. The original per-paper gates still apply.
// Rebalance only by reordering units or reversing BOTH option arrays of a mirrored pair.
// FEATURE × ORDER (review #13). Every surface feature the gate knows, including German alphabetical
// rank, character/word length, numeric value, first/last mention, identical option sets and pair role,
// is crossed with position, question-type occurrence and pair-member order. Every preference rule
// and its inverse scores at most 36/64 (ties ½, also checked with fixed A/B tie-breaks). Identical
// option-set occurrence and visible text form × position are audited too. Paired option reversals
// alone cannot balance answer VALUES: unit order and which mirrored member comes first matter.
//
// BEFORE ANY CHANGE: `node scripts/a12-lesen-check.mjs` (taught words and constructions, no practised
// sentence, pairs, the gate) must print OK, and a changed unit needs the independent semantic review again
// (tests/fixtures/a12-lesen-review.json). Edit this file — it is the source — and run sync-curricula.

export const LESEN_A12 = {
  "a1.2-cp1": {
    "papers": [
      [
        {
          "id": "a12-cp1-p1-u4",
          "pair": 2,
          "type": "message",
          "text": "Hallo Tim,\nich habe eine Wohnung in Bremen! Die Miete ist 450 Euro. Die Wohnung hat auch einen Keller, er kostet 30 Euro.\nAna",
          "question": "Was kostet die Wohnung?",
          "questionEn": "What does the flat cost?",
          "options": [
            "30 Euro",
            "450 Euro"
          ],
          "answer": "450 Euro",
          "evidence": "Die Miete ist 450 Euro.",
          "rival": "30 euros is the price of the cellar, not of the flat.",
          "explanationDe": "Hier steht: „Die Miete ist 450 Euro.“ Der Keller kostet 30 Euro.",
          "explanationEn": "The rent, i.e. what the flat costs, is 450 euros. The cellar costs 30 euros."
        },
        {
          "id": "a12-cp1-p1-u1",
          "pair": 1,
          "type": "exchange",
          "text": "Ana: Ich kaufe heute das Brot. Kaufst du den Kuchen?\nTim: Ja, den Kuchen kaufe ich.",
          "question": "Wer kauft heute das Brot?",
          "questionEn": "Who buys the bread today?",
          "options": [
            "Ana",
            "Tim"
          ],
          "answer": "Ana",
          "evidence": "Ich kaufe heute das Brot.",
          "rival": "Tim buys the cake, not the bread.",
          "explanationDe": "Ana sagt: „Ich kaufe heute das Brot.“ Tim kauft den Kuchen.",
          "explanationEn": "Ana says she buys the bread today. Tim buys the cake."
        },
        {
          "id": "a12-cp1-p1-u3",
          "pair": 1,
          "type": "exchange",
          "text": "Ana: Gehst du heute in die Apotheke? Ich arbeite heute im Büro.\nTim: Ja, das mache ich.",
          "question": "Wer geht heute in die Apotheke?",
          "questionEn": "Who goes to the pharmacy today?",
          "options": [
            "Ana",
            "Tim"
          ],
          "answer": "Tim",
          "evidence": "Ja, das mache ich.",
          "rival": "Ana only asks; she works at the office today.",
          "explanationDe": "Ana fragt nur. Sie arbeitet heute im Büro. Tim sagt: „Ja, das mache ich.“",
          "explanationEn": "Ana only asks; she is working at the office today. Tim says he will do it."
        },
        {
          "id": "a12-cp1-p1-u2",
          "pair": 2,
          "type": "ad",
          "text": "Wohnung in Köln frei! Drei Zimmer, Küche, Badezimmer und Balkon. Miete: 520 Euro. Keller: 20 Euro.",
          "question": "Was kostet der Keller?",
          "questionEn": "What does the cellar cost?",
          "options": [
            "20 Euro",
            "520 Euro"
          ],
          "answer": "20 Euro",
          "evidence": "Keller: 20 Euro.",
          "rival": "520 euros is the rent, not the cellar.",
          "explanationDe": "In der Anzeige steht: „Keller: 20 Euro.“ 520 Euro ist die Miete.",
          "explanationEn": "The ad says the cellar costs 20 euros; 520 euros is the rent."
        }
      ],
      [
        {
          "id": "a12-cp1-p2-u4",
          "pair": 2,
          "type": "exchange",
          "text": "Tim: Kostet die Lampe vier Euro?\nFrau Wolf: Nein, zehn Euro. Das Buch kostet vier.",
          "question": "Was kostet die Lampe?",
          "questionEn": "What does the lamp cost?",
          "options": [
            "zehn Euro",
            "vier Euro"
          ],
          "answer": "zehn Euro",
          "evidence": "Nein, zehn Euro.",
          "rival": "Four euros is only Tim's guess and the price of the book.",
          "explanationDe": "Tim fragt nur: „vier Euro?“ Frau Wolf sagt: „Nein, zehn Euro.“ Das Buch kostet vier Euro.",
          "explanationEn": "Tim guesses four euros, but the lamp costs ten. The book costs four."
        },
        {
          "id": "a12-cp1-p2-u1",
          "pair": 1,
          "type": "message",
          "text": "Hallo Paul,\nich gehe heute in die Bibliothek. Bezahlst du bitte heute die Miete?\nLena",
          "question": "Wer geht heute in die Bibliothek?",
          "questionEn": "Who goes to the library today?",
          "options": [
            "Lena",
            "Paul"
          ],
          "answer": "Lena",
          "evidence": "ich gehe heute in die Bibliothek",
          "rival": "Paul is only asked to pay the rent; Lena, who signs, goes to the library.",
          "explanationDe": "Lena ist „ich“: „ich gehe heute in die Bibliothek“. Paul ist „du“: „Bezahlst du bitte heute die Miete?“",
          "explanationEn": "Lena signed the note, so „ich“ is Lena: she goes to the library. Paul („du“) is asked to pay the rent."
        },
        {
          "id": "a12-cp1-p2-u2",
          "pair": 2,
          "type": "exchange",
          "text": "Ana: Ist das Brot teuer?\nFrau Weber: Nein, es kostet drei Euro. Der Kuchen: vier Euro.",
          "question": "Was kostet das Brot?",
          "questionEn": "What does the bread cost?",
          "options": [
            "vier Euro",
            "drei Euro"
          ],
          "answer": "drei Euro",
          "evidence": "Nein, es kostet drei Euro.",
          "rival": "Four euros is the price of the cake.",
          "explanationDe": "Frau Weber sagt: „Nein, es kostet drei Euro.“ Der Kuchen kostet vier Euro.",
          "explanationEn": "The bread costs three euros; four euros is the cake."
        },
        {
          "id": "a12-cp1-p2-u3",
          "pair": 1,
          "type": "message",
          "text": "Hallo Paul,\ndu hast heute Zeit. Kochst du am Abend? Ich bin im Büro.\nLena",
          "question": "Wer hat heute Zeit?",
          "questionEn": "Who has time today?",
          "options": [
            "Lena",
            "Paul"
          ],
          "answer": "Paul",
          "evidence": "du hast heute Zeit",
          "rival": "Lena, who signs, is at the office; the note tells Paul that he has time.",
          "explanationDe": "Paul ist „du“: „du hast heute Zeit“. Lena ist „ich“: „Ich bin im Büro.“",
          "explanationEn": "The note is to Paul, so „du“ is Paul: he has time today. Lena is at the office."
        }
      ],
      [
        {
          "id": "a12-cp1-p3-u2",
          "pair": 2,
          "type": "message",
          "text": "Hallo Lena,\nam Freitag arbeite ich, am Samstag bin ich am Markt. Kommst du mit?\nPaul",
          "question": "Wann ist Paul am Markt?",
          "questionEn": "When is Paul at the market?",
          "options": [
            "am Samstag",
            "am Freitag"
          ],
          "answer": "am Samstag",
          "evidence": "am Samstag bin ich am Markt",
          "rival": "On Friday Paul works; he is at the market on Saturday.",
          "explanationDe": "Paul ist „ich“: „am Samstag bin ich am Markt“. Am Freitag arbeitet er.",
          "explanationEn": "Paul signed the message: he is at the market on Saturday. On Friday he works."
        },
        {
          "id": "a12-cp1-p3-u4",
          "pair": 2,
          "type": "message",
          "text": "Liebe Ana,\nam Freitag gehe ich in das Museum, am Samstag in das Kino. Hast du Zeit?\nTim",
          "question": "Wann geht Tim in das Museum?",
          "questionEn": "When does Tim go to the museum?",
          "options": [
            "am Samstag",
            "am Freitag"
          ],
          "answer": "am Freitag",
          "evidence": "am Freitag gehe ich in das Museum",
          "rival": "On Saturday Tim goes to the cinema, not to the museum.",
          "explanationDe": "Tim ist „ich“: „am Freitag gehe ich in das Museum“. Am Samstag geht er in das Kino.",
          "explanationEn": "Tim signed the message: he goes to the museum on Friday and to the cinema on Saturday."
        },
        {
          "id": "a12-cp1-p3-u3",
          "pair": 1,
          "type": "exchange",
          "text": "Frau Kaya: Fahren Sie in die Stadt? Ich brauche Brot und Kaffee.\nHerr Wolf: Ja, ich bringe Brot und Kaffee mit.",
          "question": "Wer fährt in die Stadt?",
          "questionEn": "Who is going into town?",
          "options": [
            "Frau Kaya",
            "Herr Wolf"
          ],
          "answer": "Herr Wolf",
          "evidence": "Ja, ich bringe Brot und Kaffee mit.",
          "rival": "Frau Kaya only asks; she needs bread and coffee.",
          "explanationDe": "Frau Kaya fragt nur: „Fahren Sie in die Stadt?“ Herr Wolf sagt: „Ja“. Er bringt Brot und Kaffee mit.",
          "explanationEn": "Frau Kaya only asks. Herr Wolf says yes: he goes and brings bread and coffee."
        },
        {
          "id": "a12-cp1-p3-u1",
          "pair": 1,
          "type": "exchange",
          "text": "Frau Kaya: Ich habe einen Garten. Haben Sie einen Balkon?\nHerr Wolf: Ja, ich habe einen Balkon.",
          "question": "Wer hat einen Garten?",
          "questionEn": "Who has a garden?",
          "options": [
            "Frau Kaya",
            "Herr Wolf"
          ],
          "answer": "Frau Kaya",
          "evidence": "Ich habe einen Garten.",
          "rival": "Herr Wolf has a balcony, not a garden.",
          "explanationDe": "Frau Kaya sagt: „Ich habe einen Garten.“ Herr Wolf hat einen Balkon.",
          "explanationEn": "Frau Kaya has a garden; Herr Wolf has a balcony."
        }
      ],
      [
        {
          "id": "a12-cp1-p4-u2",
          "pair": 2,
          "type": "message",
          "text": "Liebe Ana,\nmeine Wohnung ist im Zentrum. Rechts ist die Kirche, links die Bibliothek. Die Haltestelle ist an der Ecke.\nLena",
          "question": "Wo ist die Bibliothek?",
          "questionEn": "Where is the library?",
          "options": [
            "links",
            "rechts"
          ],
          "answer": "links",
          "evidence": "links die Bibliothek",
          "rival": "On the right is the church, not the library.",
          "explanationDe": "Hier steht: „Rechts ist die Kirche, links die Bibliothek.“",
          "explanationEn": "The church is on the right, the library on the left."
        },
        {
          "id": "a12-cp1-p4-u3",
          "pair": 1,
          "type": "message",
          "text": "Hallo Thomas,\ndu kommst am Samstag nach Berlin. Schön! Ich hole dich am Bahnhof ab. Wann ist der Zug da?\nAli",
          "question": "Wer kommt am Samstag nach Berlin?",
          "questionEn": "Who comes to Berlin on Saturday?",
          "options": [
            "Ali",
            "Thomas"
          ],
          "answer": "Thomas",
          "evidence": "du kommst am Samstag nach Berlin",
          "rival": "Ali, who signs, only picks Thomas up at the station.",
          "explanationDe": "Thomas ist „du“: „du kommst am Samstag nach Berlin“. Ali holt Thomas am Bahnhof ab.",
          "explanationEn": "The message is to Thomas, so „du“ is Thomas: he comes to Berlin. Ali picks him up at the station."
        },
        {
          "id": "a12-cp1-p4-u1",
          "pair": 1,
          "type": "message",
          "text": "Hallo Thomas,\nich koche am Sonntag. Bringst du bitte den Kuchen mit?\nAli",
          "question": "Wer kocht am Sonntag?",
          "questionEn": "Who cooks on Sunday?",
          "options": [
            "Ali",
            "Thomas"
          ],
          "answer": "Ali",
          "evidence": "ich koche am Sonntag",
          "rival": "Thomas is only asked to bring the cake; Ali, who signs, cooks.",
          "explanationDe": "Ali ist „ich“: „ich koche am Sonntag“. Thomas ist „du“: „Bringst du bitte den Kuchen mit?“",
          "explanationEn": "Ali signed the message, so he is the one who cooks. Thomas is asked to bring the cake."
        },
        {
          "id": "a12-cp1-p4-u4",
          "pair": 2,
          "type": "exchange",
          "text": "Herr Berg: Das ist das Haus. Rechts ist die Bank, links der Park.\nAna: Das ist gut.",
          "question": "Wo ist die Bank?",
          "questionEn": "Where is the bank?",
          "options": [
            "links",
            "rechts"
          ],
          "answer": "rechts",
          "evidence": "Rechts ist die Bank",
          "rival": "On the left is the park, not the bank.",
          "explanationDe": "Herr Berg sagt: „Rechts ist die Bank, links der Park.“",
          "explanationEn": "The bank is on the right; the park is on the left."
        }
      ]
    ]
  },
  "a1.2-cp2": {
    "papers": [
      [
        {
          "id": "a12-cp2-p1-u3",
          "pair": 2,
          "type": "exchange",
          "text": "Lena: Der Zug fährt um acht Uhr. Kommst du mit?\nTim: Nein, ich habe um neun Uhr einen Termin.",
          "question": "Wann fährt der Zug?",
          "questionEn": "When does the train leave?",
          "options": [
            "um acht Uhr",
            "um neun Uhr"
          ],
          "answer": "um acht Uhr",
          "evidence": "Der Zug fährt um acht Uhr.",
          "rival": "Nine o'clock is the time of Tim's appointment, not of the train.",
          "explanationDe": "Lena sagt: „Der Zug fährt um acht Uhr.“ Um neun Uhr hat Tim einen Termin.",
          "explanationEn": "Lena says the train leaves at eight. At nine Tim has an appointment."
        },
        {
          "id": "a12-cp2-p1-u2",
          "pair": 1,
          "type": "exchange",
          "text": "Lena: Hast du Kopfschmerzen? Du bist heute so müde.\nPaul: Ja, und mein Hals tut weh.",
          "question": "Wer hat Kopfschmerzen?",
          "questionEn": "Who has a headache?",
          "options": [
            "Lena",
            "Paul"
          ],
          "answer": "Paul",
          "evidence": "Ja, und mein Hals tut weh.",
          "rival": "Lena only asks; Paul answers yes.",
          "explanationDe": "Lena fragt nur. Paul sagt: „Ja, und mein Hals tut weh.“",
          "explanationEn": "Lena only asks. Paul says yes, and his throat hurts too."
        },
        {
          "id": "a12-cp2-p1-u1",
          "pair": 1,
          "type": "exchange",
          "text": "Lena: Ich habe am Samstag Geburtstag. Ich mache eine Party. Kommst du?\nPaul: Ja, gern! Ich bringe einen Kuchen mit.",
          "question": "Wer hat am Samstag Geburtstag?",
          "questionEn": "Whose birthday is on Saturday?",
          "options": [
            "Lena",
            "Paul"
          ],
          "answer": "Lena",
          "evidence": "Ich habe am Samstag Geburtstag.",
          "rival": "Paul only accepts the invitation and brings a cake.",
          "explanationDe": "Lena sagt: „Ich habe am Samstag Geburtstag.“ Paul kommt und bringt einen Kuchen mit.",
          "explanationEn": "Lena says her birthday is on Saturday. Paul comes and brings a cake."
        },
        {
          "id": "a12-cp2-p1-u4",
          "pair": 2,
          "type": "exchange",
          "text": "Herr Wolf: Entschuldigung, ist das Frühstück um acht Uhr?\nFrau Kaya: Nein, um neun Uhr, im Restaurant.",
          "question": "Wann ist das Frühstück?",
          "questionEn": "When is breakfast?",
          "options": [
            "um acht Uhr",
            "um neun Uhr"
          ],
          "answer": "um neun Uhr",
          "evidence": "Nein, um neun Uhr, im Restaurant.",
          "rival": "Eight o'clock is only Herr Wolf's guess, and Frau Kaya says no.",
          "explanationDe": "Herr Wolf fragt nur. Frau Kaya sagt: „Nein, um neun Uhr.“",
          "explanationEn": "Herr Wolf only asks about eight o'clock. Frau Kaya says no, at nine."
        }
      ],
      [
        {
          "id": "a12-cp2-p2-u1",
          "pair": 1,
          "type": "exchange",
          "text": "Ana: Ich gehe heute in die Praxis, denn mein Bauch tut weh. Wo ist meine Versichertenkarte?\nTim: Hier, bitte. Ich koche Tee.",
          "question": "Wer geht heute in die Praxis?",
          "questionEn": "Who is going to the doctor's practice today?",
          "options": [
            "Tim",
            "Ana"
          ],
          "answer": "Ana",
          "evidence": "Ich gehe heute in die Praxis, denn mein Bauch tut weh.",
          "rival": "Tim only finds her card and makes tea.",
          "explanationDe": "Ana sagt: „Ich gehe heute in die Praxis.“ Tim kocht Tee.",
          "explanationEn": "Ana says she is going to the practice today. Tim makes tea."
        },
        {
          "id": "a12-cp2-p2-u3",
          "pair": 2,
          "type": "exchange",
          "text": "Lena: Das Konzert in Köln ist am Samstag. Kommst du mit?\nPaul: Nein, ich arbeite. Am Sonntag habe ich Zeit.",
          "question": "Wann ist das Konzert?",
          "questionEn": "When is the concert?",
          "options": [
            "am Sonntag",
            "am Samstag"
          ],
          "answer": "am Samstag",
          "evidence": "Das Konzert in Köln ist am Samstag.",
          "rival": "Sunday is when Paul has time, not the day of the concert.",
          "explanationDe": "Lena sagt: „Das Konzert in Köln ist am Samstag.“ Am Sonntag hat Paul Zeit.",
          "explanationEn": "Lena says the concert is on Saturday. Paul has time on Sunday."
        },
        {
          "id": "a12-cp2-p2-u4",
          "pair": 2,
          "type": "exchange",
          "text": "Frau Schmidt: Guten Tag. Haben Sie am Samstag ein Zimmer frei?\nHerr Brandt: Nein, leider nur am Sonntag.",
          "question": "Wann ist ein Zimmer frei?",
          "questionEn": "When is a room free?",
          "options": [
            "am Sonntag",
            "am Samstag"
          ],
          "answer": "am Sonntag",
          "evidence": "Nein, leider nur am Sonntag.",
          "rival": "Saturday is only in Frau Schmidt's question, and Herr Brandt says no.",
          "explanationDe": "Frau Schmidt fragt nur. Herr Brandt sagt: „Nein, leider nur am Sonntag.“",
          "explanationEn": "Frau Schmidt only asks about Saturday. Herr Brandt says no, only on Sunday."
        },
        {
          "id": "a12-cp2-p2-u2",
          "pair": 1,
          "type": "exchange",
          "text": "Ana: Wer kauft die Fahrkarten? Der Ausflug ist am Samstag.\nTim: Ich! Ich bin heute am Bahnhof.",
          "question": "Wer kauft die Fahrkarten?",
          "questionEn": "Who buys the tickets?",
          "options": [
            "Tim",
            "Ana"
          ],
          "answer": "Tim",
          "evidence": "Ich! Ich bin heute am Bahnhof.",
          "rival": "Ana only asks the question; Tim answers it with „Ich!“.",
          "explanationDe": "Ana fragt nur. Tim sagt: „Ich!“ Er ist heute am Bahnhof.",
          "explanationEn": "Ana only asks. Tim says: „Me!“ He is at the station today."
        }
      ],
      [
        {
          "id": "a12-cp2-p3-u4",
          "pair": 2,
          "type": "message",
          "text": "Guten Tag, Frau Weber,\nIhr Termin in der Praxis ist nicht am Donnerstag. Er ist am Freitag um acht Uhr. Sie brauchen Ihre Versichertenkarte.\nPraxis Berger",
          "question": "Wann ist der Termin?",
          "questionEn": "When is the appointment?",
          "options": [
            "am Donnerstag",
            "am Freitag"
          ],
          "answer": "am Freitag",
          "evidence": "Er ist am Freitag um acht Uhr.",
          "rival": "Thursday is negated: the appointment is not on Thursday.",
          "explanationDe": "In der Mail steht: „Er ist am Freitag um acht Uhr.“ Der Termin ist nicht am Donnerstag.",
          "explanationEn": "The message says the appointment is on Friday at eight, not on Thursday."
        },
        {
          "id": "a12-cp2-p3-u1",
          "pair": 1,
          "type": "message",
          "text": "Hallo Thomas,\ndie Lampe funktioniert nicht, und ich habe keine Bettdecke. Ich wechsele das Zimmer. Dein Zimmer ist gut, oder?\nAli",
          "question": "Wer wechselt das Zimmer?",
          "questionEn": "Who is changing rooms?",
          "options": [
            "Ali",
            "Thomas"
          ],
          "answer": "Ali",
          "evidence": "Ich wechsele das Zimmer.",
          "rival": "Thomas is the one Ali writes to; Ali only asks him whether his room is fine.",
          "explanationDe": "In der Mail steht: „Ich wechsele das Zimmer.“ Das ist Ali. Er fragt Thomas nur: „Dein Zimmer ist gut, oder?“",
          "explanationEn": "The message says „I am changing rooms“, and Ali signs it. He only asks Thomas whether his room is fine."
        },
        {
          "id": "a12-cp2-p3-u3",
          "pair": 2,
          "type": "message",
          "text": "Hallo Ana,\ndie Party ist am Donnerstag um acht Uhr. Am Freitag habe ich keine Zeit. Bis bald!\nLena",
          "question": "Wann ist die Party?",
          "questionEn": "When is the party?",
          "options": [
            "am Donnerstag",
            "am Freitag"
          ],
          "answer": "am Donnerstag",
          "evidence": "die Party ist am Donnerstag um acht Uhr.",
          "rival": "Friday is the day Lena has no time, not the day of the party.",
          "explanationDe": "In der Mail steht: „die Party ist am Donnerstag um acht Uhr.“ Am Freitag hat Lena keine Zeit.",
          "explanationEn": "The message says the party is on Thursday at eight. On Friday Lena has no time."
        },
        {
          "id": "a12-cp2-p3-u2",
          "pair": 1,
          "type": "message",
          "text": "Hallo Thomas,\nich bin krank und gehe heute nicht ins Büro. Am Montag habe ich einen Termin in der Praxis. Du hast am Montag frei. Kommst du mit?\nAli",
          "question": "Wer hat am Montag frei?",
          "questionEn": "Who is off on Monday?",
          "options": [
            "Ali",
            "Thomas"
          ],
          "answer": "Thomas",
          "evidence": "Du hast am Montag frei.",
          "rival": "On Monday Ali has an appointment at the practice; „du“ is Thomas.",
          "explanationDe": "In der Mail steht: „Du hast am Montag frei.“ Das ist Thomas. Ali hat am Montag einen Termin.",
          "explanationEn": "The message says „you are off on Monday“, and it is written to Thomas. Ali has an appointment on Monday."
        }
      ],
      [
        {
          "id": "a12-cp2-p4-u2",
          "pair": 1,
          "type": "exchange",
          "text": "Lena: Hast du keinen Schlüssel? Wo ist das Zimmer?\nTim: Doch, hier ist er. Das Zimmer ist im Flur links.",
          "question": "Wer hat den Schlüssel?",
          "questionEn": "Who has the key?",
          "options": [
            "Tim",
            "Lena"
          ],
          "answer": "Tim",
          "evidence": "Doch, hier ist er.",
          "rival": "Lena only asks; Tim answers „Doch“ and has the key.",
          "explanationDe": "Lena fragt nur. Tim sagt: „Doch, hier ist er.“",
          "explanationEn": "Lena only asks. Tim says: „Yes, here it is.“"
        },
        {
          "id": "a12-cp2-p4-u3",
          "pair": 2,
          "type": "exchange",
          "text": "Paul: Am Samstag machen wir einen Ausflug nach Köln. Kommst du mit?\nAna: Nein, ich fahre am Samstag nach Bremen.",
          "question": "Wohin geht der Ausflug?",
          "questionEn": "Where is the outing going?",
          "options": [
            "nach Köln",
            "nach Bremen"
          ],
          "answer": "nach Köln",
          "evidence": "Am Samstag machen wir einen Ausflug nach Köln.",
          "rival": "Bremen is where Ana goes on Saturday, not the outing.",
          "explanationDe": "Paul sagt: „Am Samstag machen wir einen Ausflug nach Köln.“ Ana fährt nach Bremen.",
          "explanationEn": "Paul says the outing on Saturday goes to Cologne. Ana goes to Bremen."
        },
        {
          "id": "a12-cp2-p4-u4",
          "pair": 2,
          "type": "exchange",
          "text": "Herr Berg: Entschuldigung, fährt der Bus hier nach Köln?\nFrau Chakiri: Nein, nach Bremen. Hier ist der Fahrplan.",
          "question": "Wohin fährt der Bus?",
          "questionEn": "Where does the bus go?",
          "options": [
            "nach Köln",
            "nach Bremen"
          ],
          "answer": "nach Bremen",
          "evidence": "Nein, nach Bremen.",
          "rival": "Cologne is only in Herr Berg's question, and Frau Chakiri says no.",
          "explanationDe": "Herr Berg fragt nur. Frau Chakiri sagt: „Nein, nach Bremen.“",
          "explanationEn": "Herr Berg only asks about Cologne. Frau Chakiri says no, to Bremen."
        },
        {
          "id": "a12-cp2-p4-u1",
          "pair": 1,
          "type": "exchange",
          "text": "Lena: Ich habe eine Erkältung. Hast du keine Tabletten?\nTim: Doch, hier. Ich gehe heute in die Apotheke und kaufe Tee.",
          "question": "Wer hat eine Erkältung?",
          "questionEn": "Who has a cold?",
          "options": [
            "Tim",
            "Lena"
          ],
          "answer": "Lena",
          "evidence": "Ich habe eine Erkältung.",
          "rival": "Tim only has tablets for her and goes to the pharmacy.",
          "explanationDe": "Lena sagt: „Ich habe eine Erkältung.“ Tim hat Tabletten und geht in die Apotheke.",
          "explanationEn": "Lena says she has a cold. Tim has tablets and goes to the pharmacy."
        }
      ]
    ]
  },
  "a1.2-cp3": {
    "papers": [
      [
        {
          "id": "a12-cp3-p1-u2",
          "pair": 2,
          "type": "message",
          "text": "Hallo Ana,\nmein Zug kommt um acht Uhr in Köln an, nicht um neun Uhr. Hol mich bitte am Bahnhof ab!\nPaul",
          "question": "Um wie viel Uhr kommt Paul in Köln an?",
          "questionEn": "At what time does Paul arrive in Cologne?",
          "options": [
            "um neun Uhr",
            "um acht Uhr"
          ],
          "answer": "um acht Uhr",
          "evidence": "mein Zug kommt um acht Uhr in Köln an",
          "rival": "Nine o'clock is in the message too, but negated: „nicht um neun Uhr“.",
          "explanationDe": "In der Mail steht: „mein Zug kommt um acht Uhr in Köln an, nicht um neun Uhr.“",
          "explanationEn": "Paul's train arrives at eight o'clock, not at nine."
        },
        {
          "id": "a12-cp3-p1-u3",
          "pair": 1,
          "type": "exchange",
          "text": "Lena: Kaufst du das Brot? Ich koche heute Suppe.\nTim: Ja, gern. Ich gehe gleich.",
          "question": "Wer kauft das Brot?",
          "questionEn": "Who buys the bread?",
          "options": [
            "Tim",
            "Lena"
          ],
          "answer": "Tim",
          "evidence": "Ja, gern. Ich gehe gleich.",
          "rival": "Lena only asks for the bread; she cooks soup. Tim says yes.",
          "explanationDe": "Lena fragt nur, sie kocht Suppe. Tim sagt: „Ja, gern.“",
          "explanationEn": "Lena only asks; she is cooking soup. Tim says yes and goes."
        },
        {
          "id": "a12-cp3-p1-u1",
          "pair": 1,
          "type": "exchange",
          "text": "Lena: Ich kaufe die Tickets. Holst du die Koffer?\nTim: Ja, das mache ich.",
          "question": "Wer kauft die Tickets?",
          "questionEn": "Who buys the tickets?",
          "options": [
            "Tim",
            "Lena"
          ],
          "answer": "Lena",
          "evidence": "Ich kaufe die Tickets.",
          "rival": "Tim is in the text too, but he agrees to fetch the suitcases, not to buy the tickets.",
          "explanationDe": "Lena sagt: „Ich kaufe die Tickets.“ Tim holt die Koffer.",
          "explanationEn": "Lena says she is buying the tickets. Tim fetches the suitcases."
        },
        {
          "id": "a12-cp3-p1-u4",
          "pair": 2,
          "type": "notice",
          "text": "Achtung: Der Bus nach Bremen fährt heute nicht um acht Uhr ab, sondern um neun Uhr.",
          "question": "Um wie viel Uhr fährt der Bus nach Bremen heute ab?",
          "questionEn": "At what time does the bus to Bremen leave today?",
          "options": [
            "um neun Uhr",
            "um acht Uhr"
          ],
          "answer": "um neun Uhr",
          "evidence": "sondern um neun Uhr",
          "rival": "Eight o'clock is in the notice too, but negated: today the bus does not leave at eight.",
          "explanationDe": "Hier steht: „nicht um acht Uhr …, sondern um neun Uhr“. Der Bus fährt heute um neun Uhr ab.",
          "explanationEn": "Today the bus does not leave at eight but at nine."
        }
      ],
      [
        {
          "id": "a12-cp3-p2-u1",
          "pair": 1,
          "type": "exchange",
          "text": "Ali: Ich hole den Teppich. Wer kauft heute das Brot?\nThomas: Ich! Ich habe Hunger.",
          "question": "Wer holt den Teppich?",
          "questionEn": "Who fetches the rug?",
          "options": [
            "Thomas",
            "Ali"
          ],
          "answer": "Ali",
          "evidence": "Ich hole den Teppich.",
          "rival": "Thomas is in the text too, but his „Ich!“ answers the question about the bread.",
          "explanationDe": "Ali sagt: „Ich hole den Teppich.“ Thomas kauft das Brot.",
          "explanationEn": "Ali says he fetches the rug. Thomas buys the bread."
        },
        {
          "id": "a12-cp3-p2-u2",
          "pair": 2,
          "type": "exchange",
          "text": "Paul: Ist Papa im Wohnzimmer?\nAna: Nein, er ist in der Küche. Er kocht.",
          "question": "Wo ist Papa?",
          "questionEn": "Where is Dad?",
          "options": [
            "im Wohnzimmer",
            "in der Küche"
          ],
          "answer": "in der Küche",
          "evidence": "Nein, er ist in der Küche.",
          "rival": "The living room is only in Paul's question, and Ana says no.",
          "explanationDe": "Paul fragt: „Ist Papa im Wohnzimmer?“ Ana sagt: „Nein, er ist in der Küche.“",
          "explanationEn": "Paul asks about the living room; Ana says no, Dad is in the kitchen."
        },
        {
          "id": "a12-cp3-p2-u4",
          "pair": 2,
          "type": "exchange",
          "text": "Ana: Der Fernseher ist im Wohnzimmer. Ist das Radio auch da?\nPaul: Nein, das Radio ist in der Küche.",
          "question": "Wo ist der Fernseher?",
          "questionEn": "Where is the television?",
          "options": [
            "im Wohnzimmer",
            "in der Küche"
          ],
          "answer": "im Wohnzimmer",
          "evidence": "Der Fernseher ist im Wohnzimmer.",
          "rival": "The kitchen is in the text too, but it is where the radio is.",
          "explanationDe": "Ana sagt: „Der Fernseher ist im Wohnzimmer.“ Das Radio ist in der Küche.",
          "explanationEn": "Ana says the TV is in the living room. The radio is in the kitchen."
        },
        {
          "id": "a12-cp3-p2-u3",
          "pair": 1,
          "type": "exchange",
          "text": "Ali: Wer holt Oma am Flughafen ab? Ich muss arbeiten.\nThomas: Ich! Ich habe heute Zeit.",
          "question": "Wer holt Oma am Flughafen ab?",
          "questionEn": "Who picks Grandma up at the airport?",
          "options": [
            "Thomas",
            "Ali"
          ],
          "answer": "Thomas",
          "evidence": "Ich! Ich habe heute Zeit.",
          "rival": "Ali only asks the question; he has to work.",
          "explanationDe": "Ali fragt nur, er muss arbeiten. Thomas sagt: „Ich! Ich habe heute Zeit.“",
          "explanationEn": "Ali only asks; he has to work. Thomas says he will do it, he has time today."
        }
      ],
      [
        {
          "id": "a12-cp3-p3-u3",
          "pair": 1,
          "type": "exchange",
          "text": "Ana: Am Samstag war ich nicht im Kino. Ich war krank. Und du?\nPaul: Ich war da. Der Film war gut.",
          "question": "Wer war am Samstag im Kino?",
          "questionEn": "Who was at the cinema on Saturday?",
          "options": [
            "Paul",
            "Ana"
          ],
          "answer": "Paul",
          "evidence": "Ich war da. Der Film war gut.",
          "rival": "Ana talks about the cinema too, but she says she was not there: she was ill.",
          "explanationDe": "Ana war nicht im Kino, sie war krank. Paul sagt: „Ich war da.“",
          "explanationEn": "Ana was not at the cinema; she was ill. Paul says he was there."
        },
        {
          "id": "a12-cp3-p3-u2",
          "pair": 2,
          "type": "exchange",
          "text": "Tim: Ist Opa heute traurig?\nLena: Nein, er ist glücklich. Er war nur müde.",
          "question": "Wie ist Opa heute?",
          "questionEn": "How is Grandpa today?",
          "options": [
            "glücklich",
            "traurig"
          ],
          "answer": "glücklich",
          "evidence": "Nein, er ist glücklich.",
          "rival": "Sad is only in Tim's question, and Lena says no.",
          "explanationDe": "Tim fragt: „Ist Opa heute traurig?“ Lena sagt: „Nein, er ist glücklich.“",
          "explanationEn": "Tim asks if Grandpa is sad; Lena says no, he is happy. He was only tired."
        },
        {
          "id": "a12-cp3-p3-u1",
          "pair": 1,
          "type": "exchange",
          "text": "Ana: Ich war gestern in Köln. Meine Tante wohnt da. Und du?\nPaul: Ich war zu Hause. Ich hatte keine Zeit.",
          "question": "Wer war gestern in Köln?",
          "questionEn": "Who was in Cologne yesterday?",
          "options": [
            "Paul",
            "Ana"
          ],
          "answer": "Ana",
          "evidence": "Ich war gestern in Köln.",
          "rival": "Paul is in the text too, but he was at home.",
          "explanationDe": "Ana sagt: „Ich war gestern in Köln.“ Paul war zu Hause.",
          "explanationEn": "Ana was in Cologne yesterday. Paul was at home; he had no time."
        },
        {
          "id": "a12-cp3-p3-u4",
          "pair": 2,
          "type": "exchange",
          "text": "Ali: Papa ist heute traurig, denn er muss am Samstag arbeiten. Und Mama?\nThomas: Nein, Mama ist glücklich. Sie fährt am Samstag nach Bremen.",
          "question": "Wie ist Papa heute?",
          "questionEn": "How is Dad today?",
          "options": [
            "glücklich",
            "traurig"
          ],
          "answer": "traurig",
          "evidence": "Papa ist heute traurig",
          "rival": "Happy is in the text too, but that is Mum, not Dad.",
          "explanationDe": "Ali sagt: „Papa ist heute traurig.“ Mama ist glücklich.",
          "explanationEn": "Ali says Dad is sad today because he has to work on Saturday. Mum is happy."
        }
      ],
      [
        {
          "id": "a12-cp3-p4-u4",
          "pair": 2,
          "type": "message",
          "text": "Hallo Tim,\nsteig bitte nicht am Bahnhof aus, sondern am Flughafen. Ich warte da.\nAna",
          "question": "Wo soll Tim aussteigen?",
          "questionEn": "Where is Tim supposed to get off?",
          "options": [
            "am Bahnhof",
            "am Flughafen"
          ],
          "answer": "am Flughafen",
          "evidence": "sondern am Flughafen",
          "rival": "The station is in the message too, but negated: „nicht am Bahnhof“.",
          "explanationDe": "In der Mail steht: „steig bitte nicht am Bahnhof aus, sondern am Flughafen.“",
          "explanationEn": "Ana asks Tim to get off at the airport, not at the station; she waits there."
        },
        {
          "id": "a12-cp3-p4-u3",
          "pair": 1,
          "type": "note",
          "text": "Hallo Paul,\nAli möchte im Garten helfen, aber er ist krank. Hilf du bitte Papa!\nMama",
          "question": "Wer soll im Garten helfen?",
          "questionEn": "Who is supposed to help in the garden?",
          "options": [
            "Ali",
            "Paul"
          ],
          "answer": "Paul",
          "evidence": "Hilf du bitte Papa!",
          "rival": "Ali would like to help, but he is ill; Mama asks Paul instead.",
          "explanationDe": "Ali möchte helfen, aber er ist krank. Paul soll helfen: „Hilf du bitte Papa!“",
          "explanationEn": "Ali would like to help but he is ill, so Mama asks Paul to help Dad."
        },
        {
          "id": "a12-cp3-p4-u2",
          "pair": 2,
          "type": "notice",
          "text": "Achtung: Sie müssen am Bahnhof aussteigen, nicht am Flughafen. Bitte nehmen Sie dann ein Taxi.",
          "question": "Wo müssen Sie aussteigen?",
          "questionEn": "Where do you have to get off?",
          "options": [
            "am Bahnhof",
            "am Flughafen"
          ],
          "answer": "am Bahnhof",
          "evidence": "Sie müssen am Bahnhof aussteigen",
          "rival": "The airport is in the notice too, but negated: „nicht am Flughafen“.",
          "explanationDe": "Hier steht: „Sie müssen am Bahnhof aussteigen, nicht am Flughafen.“",
          "explanationEn": "You have to get off at the station, not at the airport, and then take a taxi."
        },
        {
          "id": "a12-cp3-p4-u1",
          "pair": 1,
          "type": "note",
          "text": "Hallo Paul,\nich komme spät. Ali kocht heute. Kauf du bitte das Brot!\nMama",
          "question": "Wer kocht heute?",
          "questionEn": "Who is cooking today?",
          "options": [
            "Ali",
            "Paul"
          ],
          "answer": "Ali",
          "evidence": "Ali kocht heute.",
          "rival": "Paul is in the note too, but Mama asks him to buy the bread.",
          "explanationDe": "Hier steht: „Ali kocht heute.“ Paul soll das Brot kaufen.",
          "explanationEn": "The note says Ali is cooking today. Paul is asked to buy the bread."
        }
      ]
    ]
  },
  "a1.2-cp4": {
    "papers": [
      [
        {
          "id": "a12-cp4-p1-u3",
          "pair": 2,
          "type": "exchange",
          "text": "Ana: Entschuldigung, ist die Jacke teuer?\nFrau Wolf: Nein, die Jacke kostet nur fünfzig Euro. Die Mütze ist billig: zehn Euro.\nAna: Gut, danke!",
          "question": "Was kostet die Jacke?",
          "questionEn": "What does the jacket cost?",
          "options": [
            "zehn Euro",
            "fünfzig Euro"
          ],
          "answer": "fünfzig Euro",
          "evidence": "die Jacke kostet nur fünfzig Euro",
          "rival": "Ten euros is the price of the hat, not of the jacket.",
          "explanationDe": "Frau Wolf sagt: „Nein, die Jacke kostet nur fünfzig Euro.“ Zehn Euro kostet die Mütze.",
          "explanationEn": "Frau Wolf says the jacket costs only fifty euros. The hat costs ten euros."
        },
        {
          "id": "a12-cp4-p1-u1",
          "pair": 1,
          "type": "exchange",
          "text": "Lena: Ich habe den Fisch gekocht. Hast du den Saft gekauft?\nTim: Ja, und das Obst auch.",
          "question": "Wer hat den Fisch gekocht?",
          "questionEn": "Who cooked the fish?",
          "options": [
            "Tim",
            "Lena"
          ],
          "answer": "Lena",
          "evidence": "Ich habe den Fisch gekocht.",
          "rival": "Tim answers about the juice and the fruit, which he bought; the fish is Lena's.",
          "explanationDe": "Lena sagt: „Ich habe den Fisch gekocht.“ Tim hat den Saft und das Obst gekauft.",
          "explanationEn": "Lena says she cooked the fish. Tim bought the juice and the fruit."
        },
        {
          "id": "a12-cp4-p1-u2",
          "pair": 1,
          "type": "exchange",
          "text": "Lena: Hast du die Suppe gekocht? Sie war sehr lecker!\nTim: Ja, das habe ich gemacht. Danke!",
          "question": "Wer hat die Suppe gekocht?",
          "questionEn": "Who cooked the soup?",
          "options": [
            "Tim",
            "Lena"
          ],
          "answer": "Tim",
          "evidence": "Ja, das habe ich gemacht.",
          "rival": "Lena only asks about the soup; Tim says he made it.",
          "explanationDe": "Lena fragt nur. Tim sagt: „Ja, das habe ich gemacht.“",
          "explanationEn": "Lena only asks. Tim says yes, he made it."
        },
        {
          "id": "a12-cp4-p1-u4",
          "pair": 2,
          "type": "exchange",
          "text": "Lena: Kostet der Schal dreißig Euro?\nFrau Wolf: Nein, er kostet nur zehn Euro.\nLena: Gut, dann nehme ich ihn.",
          "question": "Was kostet der Schal?",
          "questionEn": "What does the scarf cost?",
          "options": [
            "zehn Euro",
            "dreißig Euro"
          ],
          "answer": "zehn Euro",
          "evidence": "Nein, er kostet nur zehn Euro.",
          "rival": "Thirty euros is only Lena's guess, and Frau Wolf says no.",
          "explanationDe": "Lena fragt: „Kostet der Schal dreißig Euro?“ Frau Wolf sagt: „Nein, er kostet nur zehn Euro.“",
          "explanationEn": "Lena asks if the scarf costs thirty euros. Frau Wolf says no, it costs only ten euros."
        }
      ],
      [
        {
          "id": "a12-cp4-p2-u3",
          "pair": 2,
          "type": "message",
          "text": "Hallo Paul,\nam Samstag ist es sonnig und warm. Wir fahren dann nach Köln. Am Sonntag kommt der Regen, dann fahre ich nicht.\nLena",
          "question": "Wann ist es sonnig?",
          "questionEn": "When is it sunny?",
          "options": [
            "am Samstag",
            "am Sonntag"
          ],
          "answer": "am Samstag",
          "evidence": "am Samstag ist es sonnig und warm.",
          "rival": "Sunday is the day the rain comes.",
          "explanationDe": "In der Mail steht: „am Samstag ist es sonnig und warm.“ Am Sonntag kommt der Regen.",
          "explanationEn": "The mail says it is sunny and warm on Saturday. On Sunday the rain comes."
        },
        {
          "id": "a12-cp4-p2-u2",
          "pair": 1,
          "type": "exchange",
          "text": "Ana: Kaufst du den Mantel? Er ist sehr schön.\nPaul: Ja, ich nehme ihn. Er passt mir.",
          "question": "Wer kauft den Mantel?",
          "questionEn": "Who buys the coat?",
          "options": [
            "Paul",
            "Ana"
          ],
          "answer": "Paul",
          "evidence": "Ja, ich nehme ihn.",
          "rival": "Ana only asks; Paul says he will take the coat.",
          "explanationDe": "Ana fragt nur. Paul sagt: „Ja, ich nehme ihn.“",
          "explanationEn": "Ana only asks. Paul says yes, he will take it."
        },
        {
          "id": "a12-cp4-p2-u4",
          "pair": 2,
          "type": "message",
          "text": "Hallo Ali,\nam Dienstag ist es nicht sonnig. Es regnet und der Wind ist kalt. Am Mittwoch kommt die Sonne. Dann fahren wir nach Bremen.\nThomas",
          "question": "Wann ist es sonnig?",
          "questionEn": "When is it sunny?",
          "options": [
            "am Dienstag",
            "am Mittwoch"
          ],
          "answer": "am Mittwoch",
          "evidence": "Am Mittwoch kommt die Sonne.",
          "rival": "Tuesday is named with „nicht sonnig“: it rains that day.",
          "explanationDe": "Am Dienstag ist es nicht sonnig, es regnet. In der Mail steht: „Am Mittwoch kommt die Sonne.“",
          "explanationEn": "On Tuesday it is not sunny; it rains. The mail says the sun comes on Wednesday."
        },
        {
          "id": "a12-cp4-p2-u1",
          "pair": 1,
          "type": "exchange",
          "text": "Ana: Ich kaufe das Kleid für meine Schwester. Gefällt dir der Pullover?\nPaul: Ja, er passt mir gut.",
          "question": "Wer kauft das Kleid?",
          "questionEn": "Who buys the dress?",
          "options": [
            "Paul",
            "Ana"
          ],
          "answer": "Ana",
          "evidence": "Ich kaufe das Kleid für meine Schwester.",
          "rival": "Paul answers about the pullover, which fits him; the dress is Ana's purchase.",
          "explanationDe": "Ana sagt: „Ich kaufe das Kleid für meine Schwester.“ Der Pullover passt Paul gut.",
          "explanationEn": "Ana says she is buying the dress for her sister. The pullover fits Paul well."
        }
      ],
      [
        {
          "id": "a12-cp4-p3-u3",
          "pair": 2,
          "type": "message",
          "text": "Hallo Ana,\ndas Fest war schön! Paul hat den Fisch gegessen. Die Wurst hat Tim gegessen, er isst nicht gern Fisch.\nLena",
          "question": "Was hat Paul gegessen?",
          "questionEn": "What did Paul eat?",
          "options": [
            "den Fisch",
            "die Wurst"
          ],
          "answer": "den Fisch",
          "evidence": "Paul hat den Fisch gegessen.",
          "rival": "The sausage is what Tim ate.",
          "explanationDe": "In der Mail steht: „Paul hat den Fisch gegessen.“ Die Wurst hat Tim gegessen.",
          "explanationEn": "The mail says Paul ate the fish. Tim ate the sausage."
        },
        {
          "id": "a12-cp4-p3-u1",
          "pair": 1,
          "type": "message",
          "text": "Liebe Ana,\nes regnet heute, aber Tim fährt mit dem Fahrrad zum Markt. Ich nehme den Bus, ich fahre bei Regen nicht gern.\nLena",
          "question": "Wer fährt mit dem Fahrrad zum Markt?",
          "questionEn": "Who rides the bike to the market?",
          "options": [
            "Tim",
            "Lena"
          ],
          "answer": "Tim",
          "evidence": "Tim fährt mit dem Fahrrad zum Markt.",
          "rival": "Lena writes the mail, and she („ich“) takes the bus.",
          "explanationDe": "In der Mail steht: „Tim fährt mit dem Fahrrad zum Markt.“ Lena nimmt den Bus.",
          "explanationEn": "The mail says Tim rides his bike to the market. Lena, who writes it, takes the bus."
        },
        {
          "id": "a12-cp4-p3-u4",
          "pair": 2,
          "type": "message",
          "text": "Hallo Lena,\nAli hat gestern den Fisch nicht gegessen. Nur die Wurst hat er gegessen. Der Fisch war aber lecker!\nThomas",
          "question": "Was hat Ali gegessen?",
          "questionEn": "What did Ali eat?",
          "options": [
            "den Fisch",
            "die Wurst"
          ],
          "answer": "die Wurst",
          "evidence": "Nur die Wurst hat er gegessen.",
          "rival": "The fish is named with Ali, but negated: he did not eat it.",
          "explanationDe": "Ali hat den Fisch nicht gegessen. In der Mail steht: „Nur die Wurst hat er gegessen.“",
          "explanationEn": "Ali did not eat the fish. The mail says he only ate the sausage."
        },
        {
          "id": "a12-cp4-p3-u2",
          "pair": 1,
          "type": "message",
          "text": "Liebe Ana,\nes schneit, und wir fahren heute nach Köln. Tim fährt nicht mit dem Fahrrad zum Bahnhof, er nimmt das Taxi. Ich nehme das Fahrrad, das Taxi ist teuer.\nLena",
          "question": "Wer fährt mit dem Fahrrad zum Bahnhof?",
          "questionEn": "Who rides the bike to the station?",
          "options": [
            "Tim",
            "Lena"
          ],
          "answer": "Lena",
          "evidence": "Ich nehme das Fahrrad",
          "rival": "Tim is named with the bike, but he does not ride it: he takes a taxi.",
          "explanationDe": "Tim fährt nicht mit dem Fahrrad, er nimmt das Taxi. Die Mail ist von Lena: „Ich nehme das Fahrrad.“",
          "explanationEn": "Tim does not ride his bike; he takes a taxi. The mail is from Lena, and she takes the bike."
        }
      ],
      [
        {
          "id": "a12-cp4-p4-u4",
          "pair": 2,
          "type": "exchange",
          "text": "Lena: Ist der Rock blau? Er gefällt mir.\nAna: Nein, er ist grün.",
          "question": "Welche Farbe hat der Rock?",
          "questionEn": "What colour is the skirt?",
          "options": [
            "blau",
            "grün"
          ],
          "answer": "grün",
          "evidence": "Nein, er ist grün.",
          "rival": "Blue is only Lena's guess, and Ana says no.",
          "explanationDe": "Lena fragt: „Ist der Rock blau?“ Ana sagt: „Nein, er ist grün.“",
          "explanationEn": "Lena asks if the skirt is blue. Ana says no, it is green."
        },
        {
          "id": "a12-cp4-p4-u1",
          "pair": 1,
          "type": "exchange",
          "text": "Thomas: Ich bin früh gegangen. War das Fest noch schön?\nAli: Ja, wir haben viel getanzt.",
          "question": "Wer ist früh gegangen?",
          "questionEn": "Who left early?",
          "options": [
            "Ali",
            "Thomas"
          ],
          "answer": "Thomas",
          "evidence": "Ich bin früh gegangen.",
          "rival": "Ali stayed at the party and danced.",
          "explanationDe": "Thomas sagt: „Ich bin früh gegangen.“ Ali hat viel getanzt.",
          "explanationEn": "Thomas says he left early. Ali danced a lot."
        },
        {
          "id": "a12-cp4-p4-u3",
          "pair": 2,
          "type": "exchange",
          "text": "Lena: Der Mantel ist blau. Die Mütze ist grün. Kaufst du den Mantel?\nAna: Nein, er ist zu groß für mich.",
          "question": "Welche Farbe hat der Mantel?",
          "questionEn": "What colour is the coat?",
          "options": [
            "blau",
            "grün"
          ],
          "answer": "blau",
          "evidence": "Der Mantel ist blau.",
          "rival": "Green is the colour of the hat.",
          "explanationDe": "Lena sagt: „Der Mantel ist blau.“ Die Mütze ist grün.",
          "explanationEn": "Lena says the coat is blue. The hat is green."
        },
        {
          "id": "a12-cp4-p4-u2",
          "pair": 1,
          "type": "exchange",
          "text": "Thomas: Bist du mit dem Zug nach Köln gefahren?\nAli: Ja, der Zug war schnell.",
          "question": "Wer ist mit dem Zug nach Köln gefahren?",
          "questionEn": "Who went to Cologne by train?",
          "options": [
            "Ali",
            "Thomas"
          ],
          "answer": "Ali",
          "evidence": "Ja, der Zug war schnell.",
          "rival": "Thomas only asks; Ali answers yes.",
          "explanationDe": "Thomas fragt nur. Ali sagt: „Ja, der Zug war schnell.“",
          "explanationEn": "Thomas only asks. Ali says yes, the train was fast."
        }
      ]
    ]
  }
};
