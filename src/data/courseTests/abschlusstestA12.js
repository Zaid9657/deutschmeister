// A1.2 course test: 10 listening questions, 8 reading questions, one unscored writing task.
// The existing listening reference (A1.2 #4, questionMax 10) and scoring/access rules are unchanged.
// Reading and writing use taught A1.1/A1.2 language; this is our own practice material, not an
// official exam or a full assessment of four skills. Live audio/questions require owner verification.
export const abschlusstestA12 = {
  "examKey": "a1_2_abschluss",
  "courseLevel": "a1.2",
  "formatOf": "goethe_a1",
  "title": "Abschlusstest A1.2 · Übungstest (Kurzversion)",
  "intro": "Dieser Übungstest gehört zu Ihrem A1.2-Kurs. Er enthält Hören, Lesen und eine Schreibaufgabe. Automatisch bewertet werden nur Hören und Lesen; die Grenze in diesem Kurstest liegt bei 60 %. Schreiben prüfen Sie mit dem Selbstcheck. Sprechen üben Sie in den Lektionen und Checkpoints. Dieser Test ist eigenes Übungsmaterial von DeutschMeister, keine offizielle Prüfung und kein Nachweis eines Sprachniveaus. Danach können Sie Inhalte wiederholen oder mit dem Kurs A2.1 weiterlernen.",
  "passPercent": 60,
  "sections": [
    {
      "key": "hoeren",
      "title": "Hören",
      "minutes": 15,
      "instructions": "Eine Hörübung zum Thema Freizeit mit zehn bewerteten Fragen. Sie dürfen die Aufnahme zweimal abspielen.",
      "parts": [
        {
          "key": "hoeren-1",
          "type": "listening",
          "label": "Hörtext · Freizeit",
          "level": "A1.2",
          "exerciseNumber": 4,
          "questionMax": 10
        }
      ]
    },
    {
      "key": "lesen",
      "title": "Lesen",
      "minutes": 15,
      "instructions": "Teil 1: Lesen Sie die E-Mail und entscheiden Sie: richtig oder falsch? Teil 2: Lesen Sie die Situation und die zwei Anzeigen. Welche Anzeige passt? Teil 3: Lesen Sie die Schilder und entscheiden Sie: richtig oder falsch?",
      "parts": [
        {
          "key": "lesen-1",
          "type": "mc-group",
          "label": "Teil 1 · E-Mail",
          "text": "Guten Tag, Frau Kaya,\nam Montag war ich im Hotel. Das Zimmer war schön, aber die Lampe hat nicht funktioniert. Ich habe die Rechnung schon bezahlt. Am Freitag komme ich wieder, um 19 Uhr. Ich brauche dann ein Zimmer mit Balkon. Haben Sie ein Zimmer frei?\nDanke und Grüße\nLena",
          "items": [
            {
              "id": "l1-1",
              "prompt": "Lena muss die Rechnung vom Montag noch bezahlen.",
              "options": [
                {
                  "key": "r",
                  "label": "Richtig"
                },
                {
                  "key": "f",
                  "label": "Falsch"
                }
              ],
              "answer": "f",
              "evidence": "Ich habe die Rechnung schon bezahlt.",
              "explanationDe": "Lena hat schon bezahlt. Die Rechnung vom Montag ist also nicht mehr offen."
            },
            {
              "id": "l1-2",
              "prompt": "Lena möchte am Freitag ein Zimmer mit Balkon.",
              "options": [
                {
                  "key": "r",
                  "label": "Richtig"
                },
                {
                  "key": "f",
                  "label": "Falsch"
                }
              ],
              "answer": "r",
              "evidence": "Ich brauche dann ein Zimmer mit Balkon.",
              "explanationDe": "Am Freitag kommt Lena wieder. Für diesen Tag braucht sie das Zimmer mit Balkon."
            },
            {
              "id": "l1-3",
              "prompt": "Die Lampe im Zimmer hat am Montag nicht funktioniert.",
              "options": [
                {
                  "key": "r",
                  "label": "Richtig"
                },
                {
                  "key": "f",
                  "label": "Falsch"
                }
              ],
              "answer": "r",
              "evidence": "die Lampe hat nicht funktioniert.",
              "explanationDe": "Lena schreibt: Die Lampe hat nicht funktioniert."
            }
          ]
        },
        {
          "key": "lesen-2a",
          "type": "mc-group",
          "label": "Teil 2 · Situation 1",
          "text": "Paul möchte am Samstag ein Fahrrad kaufen. Er hat 100 Euro.\nAnzeige a) Fahrrad, 90 Euro. Am Montag abholen.\nAnzeige b) Fahrrad, 95 Euro. Am Samstag abholen.",
          "items": [
            {
              "id": "l2a-1",
              "prompt": "Welche Anzeige passt?",
              "options": [
                {
                  "key": "a",
                  "label": "Anzeige a"
                },
                {
                  "key": "b",
                  "label": "Anzeige b"
                }
              ],
              "answer": "b",
              "evidence": "Anzeige b) Fahrrad, 95 Euro. Am Samstag abholen.",
              "explanationDe": "Beide Fahrräder kosten weniger als 100 Euro. Nur Fahrrad b kann Paul am Samstag abholen."
            }
          ]
        },
        {
          "key": "lesen-2b",
          "type": "mc-group",
          "label": "Teil 2 · Situation 2",
          "text": "Ana braucht eine Jacke in Größe 40 für den Winter. Sie hat 60 Euro.\nAnzeige a) Jacke, Größe 40, warm, 55 Euro.\nAnzeige b) Jacke, Größe 38, warm, 45 Euro.",
          "items": [
            {
              "id": "l2b-1",
              "prompt": "Welche Anzeige passt?",
              "options": [
                {
                  "key": "a",
                  "label": "Anzeige a"
                },
                {
                  "key": "b",
                  "label": "Anzeige b"
                }
              ],
              "answer": "a",
              "evidence": "Anzeige a) Jacke, Größe 40, warm, 55 Euro.",
              "explanationDe": "Beide Jacken sind warm und kosten weniger als 60 Euro. Nur Jacke a hat Größe 40."
            }
          ]
        },
        {
          "key": "lesen-3",
          "type": "mc-group",
          "label": "Teil 3 · Schilder und Aushänge",
          "items": [
            {
              "id": "l3-1",
              "prompt": "Schild: „Zug nach Bremen: heute Gleis 6, nicht Gleis 2.“ — Sie müssen heute an Gleis 6 einsteigen.",
              "options": [
                {
                  "key": "r",
                  "label": "Richtig"
                },
                {
                  "key": "f",
                  "label": "Falsch"
                }
              ],
              "answer": "r",
              "evidence": "heute Gleis 6, nicht Gleis 2.",
              "explanationDe": "Der Zug fährt heute von Gleis 6."
            },
            {
              "id": "l3-2",
              "prompt": "Schild: „Praxis: Freitag von 8 bis 12 Uhr.“ — Sie können am Freitag um 13 Uhr in die Praxis kommen.",
              "options": [
                {
                  "key": "r",
                  "label": "Richtig"
                },
                {
                  "key": "f",
                  "label": "Falsch"
                }
              ],
              "answer": "f",
              "evidence": "Freitag von 8 bis 12 Uhr.",
              "explanationDe": "Die Zeit endet um 12 Uhr. 13 Uhr ist später."
            },
            {
              "id": "l3-3",
              "prompt": "Schild: „Heute Regen. Bitte im Haus warten. Morgen Sonne.“ — Sie sollen heute im Garten warten.",
              "options": [
                {
                  "key": "r",
                  "label": "Richtig"
                },
                {
                  "key": "f",
                  "label": "Falsch"
                }
              ],
              "answer": "f",
              "evidence": "Bitte im Haus warten.",
              "explanationDe": "Heute sollen Sie im Haus warten; der Garten ist draußen."
            }
          ]
        }
      ]
    },
    {
      "key": "schreiben",
      "title": "Schreiben",
      "minutes": 10,
      "instructions": "Kurze Mitteilung: Schreiben Sie Ihren Text in das Textfeld. Diese Aufgabe wird nicht automatisch bewertet. Prüfen Sie Ihren Text mit dem Selbstcheck; er zählt nicht zum Prozentwert.",
      "parts": [
        {
          "key": "schreiben-1",
          "type": "writing",
          "label": "Teil 2 · Mitteilung",
          "task": "Sie haben eine Jacke gekauft. Sie ist zu klein. Schreiben Sie eine Mitteilung (ca. 30 Wörter) an das Geschäft. Schreiben Sie zu diesen drei Punkten: Was haben Sie gekauft? Warum passt die Jacke nicht? Wann können Sie ins Geschäft kommen? Schreiben Sie auch eine Anrede und einen Gruß.",
          "criteria": [
            "Ich habe geschrieben, was ich gekauft habe.",
            "Ich habe geschrieben, warum die Jacke nicht passt.",
            "Ich habe einen Tag oder eine Uhrzeit für meinen Besuch genannt.",
            "Ich habe eine Anrede und einen Gruß geschrieben.",
            "Ich habe kurze, verständliche Sätze geschrieben."
          ]
        }
      ]
    }
  ],
  "verdictCopyDe": {
    "solide": {
      "title": "Hören und Lesen: über der Kursgrenze",
      "body": "Ihr Ergebnis in Hören und Lesen liegt deutlich über der 60%-Grenze dieses Kurstests. Schreiben und Sprechen sind in dieser Zahl nicht enthalten. Nutzen Sie den Selbstcheck für Ihren Text und die Sprechaufgaben im Kurs."
    },
    "knapp": {
      "title": "Hören und Lesen: Kursgrenze erreicht",
      "body": "Ihr Ergebnis in Hören und Lesen erreicht die 60%-Grenze dieses Kurstests. Sehen Sie sich die Aufgaben noch einmal an. Schreiben und Sprechen sind in dieser Zahl nicht enthalten."
    },
    "nicht-bereit": {
      "title": "Hören und Lesen: weiter üben",
      "body": "Ihr Ergebnis in Hören und Lesen liegt unter der 60%-Grenze dieses Kurstests. Wiederholen Sie die passenden Lektionen und versuchen Sie den Test später erneut. Schreiben und Sprechen sind in dieser Zahl nicht enthalten."
    }
  }
};
