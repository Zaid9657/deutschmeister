// Authored A2.1 course test: 20 listening + 20 reading items, writing and all three speaking parts.
// Recorded audio follows at the end of the build (D9); the runner labels its computer voice.
export const abschlusstestA21Course = {
  "examKey": "a2_1_course_abschluss",
  "courseLevel": "a2.1",
  "formatOf": "goethe_a2",
  "title": "Abschlusstest A2.1",
  "intro": "Dieser Abschlusstest umfasst 40 Aufgaben zu Hören und Lesen sowie Schreiben und Sprechen. Er stammt von DeutschMeister und ist kein offizielles Prüfungsmaterial. Hören und Lesen erhalten eine automatische Auswertung. Schreiben und Sprechen prüfen Sie mit den Checklisten und einer anderen Person. Das Ergebnis ist ein Richtwert für Ihren weiteren Lernweg.",
  "passPercent": 60,
  "sections": [
    {
      "key": "hoeren",
      "title": "Hören",
      "minutes": 30,
      "instructions": "Bearbeiten Sie alle vier Teile. In Teil 1 und 4 hören Sie jeden Text zweimal, in Teil 2 und 3 einmal. Wählen Sie jeweils eine Antwort.",
      "parts": [
        {
          "key": "h1-1",
          "type": "mc-group",
          "label": "Hören Teil 1 · Aufgabe 1",
          "audioText": "Guten Tag Frau Brandt, Ihre Bestellung ist da. Sie können den Tisch am Freitag abholen. Am Donnerstag ist unser Geschäft geschlossen. Am Samstag sind wir nur bis zwölf da.",
          "playsAllowed": 2,
          "items": [
            {
              "id": "a21-final-h1-1",
              "prompt": "Wann kann Frau Brandt den Tisch abholen?",
              "options": [
                {
                  "key": "a",
                  "label": "am Donnerstag"
                },
                {
                  "key": "b",
                  "label": "am Freitag"
                },
                {
                  "key": "c",
                  "label": "am Sonntag"
                }
              ],
              "answer": "b"
            }
          ]
        },
        {
          "key": "h1-2",
          "type": "mc-group",
          "label": "Hören Teil 1 · Aufgabe 2",
          "audioText": "Hallo Ana, der Sportkurs fällt heute aus. Der Trainer ist krank. Die nächste Stunde ist am Dienstag, wie immer um sechs. Bitte bringen Sie Ihre Schuhe mit.",
          "playsAllowed": 2,
          "items": [
            {
              "id": "a21-final-h1-2",
              "prompt": "Warum gibt es heute keinen Sportkurs?",
              "options": [
                {
                  "key": "a",
                  "label": "Der Raum ist geschlossen."
                },
                {
                  "key": "b",
                  "label": "Die Gruppe ist im Urlaub."
                },
                {
                  "key": "c",
                  "label": "Der Trainer ist krank."
                }
              ],
              "answer": "c"
            }
          ]
        },
        {
          "key": "h1-3",
          "type": "mc-group",
          "label": "Hören Teil 1 · Aufgabe 3",
          "audioText": "Liebe Gäste, die Führung beginnt in zehn Minuten. Bitte kommen Sie zum Brunnen vor dem Rathaus. Der Bus am Hafen gehört zu einer anderen Gruppe.",
          "playsAllowed": 2,
          "items": [
            {
              "id": "a21-final-h1-3",
              "prompt": "Wo sollen die Gäste warten?",
              "options": [
                {
                  "key": "a",
                  "label": "am Brunnen"
                },
                {
                  "key": "b",
                  "label": "am Hafen"
                },
                {
                  "key": "c",
                  "label": "im Rathaus"
                }
              ],
              "answer": "a"
            }
          ]
        },
        {
          "key": "h1-4",
          "type": "mc-group",
          "label": "Hören Teil 1 · Aufgabe 4",
          "audioText": "Guten Tag Herr Berger, hier ist Frau Yilmaz. Bitte schicken Sie mir heute den Vertrag. Die Datei für die Besprechung habe ich schon. Das Passwort brauchen wir erst morgen.",
          "playsAllowed": 2,
          "items": [
            {
              "id": "a21-final-h1-4",
              "prompt": "Was braucht Frau Yilmaz heute?",
              "options": [
                {
                  "key": "a",
                  "label": "das Passwort"
                },
                {
                  "key": "b",
                  "label": "den Vertrag"
                },
                {
                  "key": "c",
                  "label": "die Datei"
                }
              ],
              "answer": "b"
            }
          ]
        },
        {
          "key": "h1-5",
          "type": "mc-group",
          "label": "Hören Teil 1 · Aufgabe 5",
          "audioText": "Hallo Tim, ich habe die Fahrkarten für Samstag gekauft. Wir fahren um neun ab. Komm bitte schon um halb neun zum Bahnhof. Der Bus dorthin fährt um acht.",
          "playsAllowed": 2,
          "items": [
            {
              "id": "a21-final-h1-5",
              "prompt": "Wann soll Tim am Bahnhof sein?",
              "options": [
                {
                  "key": "a",
                  "label": "um acht"
                },
                {
                  "key": "b",
                  "label": "um neun"
                },
                {
                  "key": "c",
                  "label": "um halb neun"
                }
              ],
              "answer": "c"
            }
          ]
        },
        {
          "key": "h2",
          "type": "mc-group",
          "label": "Hören Teil 2 · Wer hat was gemacht?",
          "audioText": "Lena: Was habt ihr gestern gemacht? Ana: Mein Vater hat das Museum besichtigt. Meine Mutter war im Café, denn sie war müde. Tim hat zu Hause gekocht. Jonas hat am Hafen Fotos gemacht. Ich habe die Geschenke gekauft. Eine Führung haben wir nicht gemacht.",
          "playsAllowed": 1,
          "items": [
            {
              "id": "a21-final-h2-1",
              "prompt": "Anas Vater: Was hat die Person gemacht?",
              "options": [
                {
                  "key": "a",
                  "label": "im Café sitzen"
                },
                {
                  "key": "b",
                  "label": "Geschenke kaufen"
                },
                {
                  "key": "c",
                  "label": "das Museum besichtigen"
                },
                {
                  "key": "d",
                  "label": "eine Führung machen"
                },
                {
                  "key": "e",
                  "label": "Fotos machen"
                },
                {
                  "key": "f",
                  "label": "zu Hause kochen"
                }
              ],
              "answer": "c"
            },
            {
              "id": "a21-final-h2-2",
              "prompt": "Anas Mutter: Was hat die Person gemacht?",
              "options": [
                {
                  "key": "a",
                  "label": "im Café sitzen"
                },
                {
                  "key": "b",
                  "label": "Geschenke kaufen"
                },
                {
                  "key": "c",
                  "label": "das Museum besichtigen"
                },
                {
                  "key": "d",
                  "label": "eine Führung machen"
                },
                {
                  "key": "e",
                  "label": "Fotos machen"
                },
                {
                  "key": "f",
                  "label": "zu Hause kochen"
                }
              ],
              "answer": "a"
            },
            {
              "id": "a21-final-h2-3",
              "prompt": "Tim: Was hat die Person gemacht?",
              "options": [
                {
                  "key": "a",
                  "label": "im Café sitzen"
                },
                {
                  "key": "b",
                  "label": "Geschenke kaufen"
                },
                {
                  "key": "c",
                  "label": "das Museum besichtigen"
                },
                {
                  "key": "d",
                  "label": "eine Führung machen"
                },
                {
                  "key": "e",
                  "label": "Fotos machen"
                },
                {
                  "key": "f",
                  "label": "zu Hause kochen"
                }
              ],
              "answer": "f"
            },
            {
              "id": "a21-final-h2-4",
              "prompt": "Jonas: Was hat die Person gemacht?",
              "options": [
                {
                  "key": "a",
                  "label": "im Café sitzen"
                },
                {
                  "key": "b",
                  "label": "Geschenke kaufen"
                },
                {
                  "key": "c",
                  "label": "das Museum besichtigen"
                },
                {
                  "key": "d",
                  "label": "eine Führung machen"
                },
                {
                  "key": "e",
                  "label": "Fotos machen"
                },
                {
                  "key": "f",
                  "label": "zu Hause kochen"
                }
              ],
              "answer": "e"
            },
            {
              "id": "a21-final-h2-5",
              "prompt": "Ana: Was hat die Person gemacht?",
              "options": [
                {
                  "key": "a",
                  "label": "im Café sitzen"
                },
                {
                  "key": "b",
                  "label": "Geschenke kaufen"
                },
                {
                  "key": "c",
                  "label": "das Museum besichtigen"
                },
                {
                  "key": "d",
                  "label": "eine Führung machen"
                },
                {
                  "key": "e",
                  "label": "Fotos machen"
                },
                {
                  "key": "f",
                  "label": "zu Hause kochen"
                }
              ],
              "answer": "b"
            }
          ]
        },
        {
          "key": "h3-1",
          "type": "mc-group",
          "label": "Hören Teil 3 · Aufgabe 1",
          "audioText": "Ana: Gehst du zu Fuß zum Arzt? Tim: Heute nicht. Mein Bein tut weh. Ich nehme den Bus. Das Fahrrad bleibt zu Hause.",
          "playsAllowed": 1,
          "items": [
            {
              "id": "a21-final-h3-1",
              "prompt": "Wie kommt Tim zum Arzt?",
              "options": [
                {
                  "key": "a",
                  "label": "Fahrrad",
                  "picture": {
                    "src": "/images/course/a21/fahrrad.svg",
                    "alt": "Fahrrad"
                  }
                },
                {
                  "key": "b",
                  "label": "Bus",
                  "picture": {
                    "src": "/images/course/a21/bus.svg",
                    "alt": "Bus"
                  }
                },
                {
                  "key": "c",
                  "label": "zu Fuß",
                  "picture": {
                    "src": "/images/course/a21/gehen.svg",
                    "alt": "zu Fuß"
                  }
                }
              ],
              "answer": "b"
            }
          ]
        },
        {
          "key": "h3-2",
          "type": "mc-group",
          "label": "Hören Teil 3 · Aufgabe 2",
          "audioText": "Tim: Möchtest du Kaffee oder Saft? Lena: Lieber Wasser, bitte. Saft trinke ich nicht gern und Kaffee hatte ich schon.",
          "playsAllowed": 1,
          "items": [
            {
              "id": "a21-final-h3-2",
              "prompt": "Was trinkt Lena?",
              "options": [
                {
                  "key": "a",
                  "label": "Kaffee",
                  "picture": {
                    "src": "/images/course/a21/kaffee.svg",
                    "alt": "Kaffee"
                  }
                },
                {
                  "key": "b",
                  "label": "Saft",
                  "picture": {
                    "src": "/images/course/a21/saft.svg",
                    "alt": "Saft"
                  }
                },
                {
                  "key": "c",
                  "label": "Wasser",
                  "picture": {
                    "src": "/images/course/a21/wasser.svg",
                    "alt": "Wasser"
                  }
                }
              ],
              "answer": "c"
            }
          ]
        },
        {
          "key": "h3-3",
          "type": "mc-group",
          "label": "Hören Teil 3 · Aufgabe 3",
          "audioText": "Ana: Kommst du morgen zum Tanzkurs? Lena: Ich kann nicht. Ich gehe mit meiner Tochter schwimmen. Laufen wollen wir am Sonntag.",
          "playsAllowed": 1,
          "items": [
            {
              "id": "a21-final-h3-3",
              "prompt": "Was macht Lena morgen?",
              "options": [
                {
                  "key": "a",
                  "label": "schwimmen",
                  "picture": {
                    "src": "/images/course/a21/schwimmen.svg",
                    "alt": "schwimmen"
                  }
                },
                {
                  "key": "b",
                  "label": "laufen",
                  "picture": {
                    "src": "/images/course/a21/laufen.svg",
                    "alt": "laufen"
                  }
                },
                {
                  "key": "c",
                  "label": "tanzen",
                  "picture": {
                    "src": "/images/course/a21/tanzen.svg",
                    "alt": "tanzen"
                  }
                }
              ],
              "answer": "a"
            }
          ]
        },
        {
          "key": "h3-4",
          "type": "mc-group",
          "label": "Hören Teil 3 · Aufgabe 4",
          "audioText": "Lena: Ist dein Fahrrad noch kaputt? Ana: Nein, es ist wieder gut. Heute fahre ich damit zur Arbeit. Der Bus war gestern sehr voll.",
          "playsAllowed": 1,
          "items": [
            {
              "id": "a21-final-h3-4",
              "prompt": "Wie kommt Ana heute zur Arbeit?",
              "options": [
                {
                  "key": "a",
                  "label": "Bus",
                  "picture": {
                    "src": "/images/course/a21/bus.svg",
                    "alt": "Bus"
                  }
                },
                {
                  "key": "b",
                  "label": "Fahrrad",
                  "picture": {
                    "src": "/images/course/a21/fahrrad.svg",
                    "alt": "Fahrrad"
                  }
                },
                {
                  "key": "c",
                  "label": "zu Fuß",
                  "picture": {
                    "src": "/images/course/a21/gehen.svg",
                    "alt": "zu Fuß"
                  }
                }
              ],
              "answer": "b"
            }
          ]
        },
        {
          "key": "h3-5",
          "type": "mc-group",
          "label": "Hören Teil 3 · Aufgabe 5",
          "audioText": "Tim: Gehen wir heute laufen? Ana: Lieber nicht, es regnet. Das Schwimmbad ist auch zu. Aber unser Tanzkurs findet statt. Tim: Gut, dann tanzen wir.",
          "playsAllowed": 1,
          "items": [
            {
              "id": "a21-final-h3-5",
              "prompt": "Was machen die Freunde?",
              "options": [
                {
                  "key": "a",
                  "label": "laufen",
                  "picture": {
                    "src": "/images/course/a21/laufen.svg",
                    "alt": "laufen"
                  }
                },
                {
                  "key": "b",
                  "label": "schwimmen",
                  "picture": {
                    "src": "/images/course/a21/schwimmen.svg",
                    "alt": "schwimmen"
                  }
                },
                {
                  "key": "c",
                  "label": "tanzen",
                  "picture": {
                    "src": "/images/course/a21/tanzen.svg",
                    "alt": "tanzen"
                  }
                }
              ],
              "answer": "c"
            }
          ]
        },
        {
          "key": "h4",
          "type": "mc-group",
          "label": "Hören Teil 4 · Ein Besuch bei der Familie",
          "audioText": "Frage: Frau Brandt, haben Sie am Wochenende Ihre Großeltern besucht? Lena: Ja, am Samstag. Am Sonntag musste ich arbeiten. Frage: Wohnen Ihre Großeltern in Bremen? Lena: Nein, in Köln. Ich bin mit dem Zug gefahren. Mein Bruder ist mitgekommen. Frage: Was haben Sie gemacht? Lena: Wir haben im Garten gegrillt. Danach haben wir Fotos angeschaut. Frage: Bleiben Sie beim nächsten Besuch länger? Lena: Ja, ich bleibe drei Tage, wenn ich Urlaub habe.",
          "playsAllowed": 2,
          "items": [
            {
              "id": "a21-final-h4-1",
              "prompt": "Lena hat am Sonntag gearbeitet.",
              "options": [
                {
                  "key": "a",
                  "label": "Ja"
                },
                {
                  "key": "b",
                  "label": "Nein"
                }
              ],
              "answer": "a"
            },
            {
              "id": "a21-final-h4-2",
              "prompt": "Die Großeltern wohnen in Bremen.",
              "options": [
                {
                  "key": "a",
                  "label": "Ja"
                },
                {
                  "key": "b",
                  "label": "Nein"
                }
              ],
              "answer": "b"
            },
            {
              "id": "a21-final-h4-3",
              "prompt": "Lena ist allein gefahren.",
              "options": [
                {
                  "key": "a",
                  "label": "Ja"
                },
                {
                  "key": "b",
                  "label": "Nein"
                }
              ],
              "answer": "b"
            },
            {
              "id": "a21-final-h4-4",
              "prompt": "Die Familie hat im Garten gegessen.",
              "options": [
                {
                  "key": "a",
                  "label": "Ja"
                },
                {
                  "key": "b",
                  "label": "Nein"
                }
              ],
              "answer": "a"
            },
            {
              "id": "a21-final-h4-5",
              "prompt": "Beim nächsten Besuch möchte Lena nur einen Tag bleiben.",
              "options": [
                {
                  "key": "a",
                  "label": "Ja"
                },
                {
                  "key": "b",
                  "label": "Nein"
                }
              ],
              "answer": "b"
            }
          ]
        }
      ]
    },
    {
      "key": "lesen",
      "title": "Lesen",
      "minutes": 30,
      "instructions": "Lesen Sie die Texte und bearbeiten Sie alle vier Teile. Wählen Sie bei jeder Aufgabe eine Antwort. In Teil 4 ordnen Sie die passende Anzeige zu.",
      "parts": [
        {
          "key": "lesen-1",
          "type": "mc-group",
          "label": "Teil 1 · Nachbarschaftstreff",
          "text": "Der neue Nachbarschaftstreff in der Gartenstraße\nSeit dem 1. September gibt es den Nachbarschaftstreff in der Gartenstraße. Der große Raum im Erdgeschoss ist für alle da. Der Treff gehört einem Verein. Die Nachbarn wollten schon lange einen Treffpunkt haben. Der Treff ist von Montag bis Freitag von 15 bis 20 Uhr geöffnet. Am Mittwoch beginnt um 18 Uhr das Sprachcafé. Dort sprechen die Gäste Deutsch und trinken Kaffee. Der Kaffee ist kostenlos. Am Freitag gibt es ein kleines Abendessen für Familien. Kinder zahlen nur einen Euro. Vor einem Jahr konnte der Verein nur einen Raum in der Schule nutzen. Die Gruppen mussten dort oft warten. Ab Oktober gibt es auch einen Computerkurs. Haben Sie Fragen? Frau Kern hilft Ihnen gern. Rufen Sie sie bitte gegen 16 Uhr an.",
          "items": [
            {
              "id": "l1-1",
              "prompt": "Wann ist der Treff geöffnet?",
              "options": [
                {
                  "key": "a",
                  "label": "Nur am Mittwoch."
                },
                {
                  "key": "b",
                  "label": "Von Montag bis Freitag."
                },
                {
                  "key": "c",
                  "label": "Nur am Freitag."
                }
              ],
              "answer": "b"
            },
            {
              "id": "l1-2",
              "prompt": "Wann beginnt das Sprachcafé?",
              "options": [
                {
                  "key": "a",
                  "label": "Um 15 Uhr."
                },
                {
                  "key": "b",
                  "label": "Um 16 Uhr."
                },
                {
                  "key": "c",
                  "label": "Um 18 Uhr."
                }
              ],
              "answer": "c"
            },
            {
              "id": "l1-3",
              "prompt": "Was ist im Treff kostenlos?",
              "options": [
                {
                  "key": "a",
                  "label": "Das Abendessen."
                },
                {
                  "key": "b",
                  "label": "Der Kaffee."
                },
                {
                  "key": "c",
                  "label": "Der Computerkurs."
                }
              ],
              "answer": "b"
            },
            {
              "id": "l1-4",
              "prompt": "Wo war der Verein vor einem Jahr?",
              "options": [
                {
                  "key": "a",
                  "label": "In der Schule."
                },
                {
                  "key": "b",
                  "label": "In der Gartenstraße."
                },
                {
                  "key": "c",
                  "label": "Im Erdgeschoss."
                }
              ],
              "answer": "a"
            },
            {
              "id": "l1-5",
              "prompt": "Was gibt es ab Oktober?",
              "options": [
                {
                  "key": "a",
                  "label": "Ein Sprachcafé."
                },
                {
                  "key": "b",
                  "label": "Ein Abendessen."
                },
                {
                  "key": "c",
                  "label": "Einen Computerkurs."
                }
              ],
              "answer": "c"
            }
          ]
        },
        {
          "key": "lesen-2",
          "type": "mc-group",
          "label": "Lesen Teil 2 · Orientierung im Haus",
          "text": "HAUS AM PARK\nErdgeschoss: Information, Garderobe, Café.\nErster Stock: Raum A – Deutsch, Raum B – Computer.\nZweiter Stock: Raum C – Sport, Raum D – Kochen.\nHeute: Der Computerkurs findet in Raum A statt. Der Deutschkurs ist in Raum B. Das Café öffnet um zehn und schließt um vier. Der Sportkurs beginnt um sechs. Die Garderobe ist kostenlos.",
          "items": [
            {
              "id": "a21-final-l2-1",
              "prompt": "Wo ist heute der Computerkurs?",
              "options": [
                {
                  "key": "a",
                  "label": "in Raum A"
                },
                {
                  "key": "b",
                  "label": "in Raum B"
                },
                {
                  "key": "c",
                  "label": "in Raum C"
                }
              ],
              "answer": "a"
            },
            {
              "id": "a21-final-l2-2",
              "prompt": "Sie möchten etwas trinken. Wohin gehen Sie?",
              "options": [
                {
                  "key": "a",
                  "label": "in den ersten Stock"
                },
                {
                  "key": "b",
                  "label": "ins Erdgeschoss"
                },
                {
                  "key": "c",
                  "label": "in den zweiten Stock"
                }
              ],
              "answer": "b"
            },
            {
              "id": "a21-final-l2-3",
              "prompt": "Bis wann können Sie Kaffee trinken?",
              "options": [
                {
                  "key": "a",
                  "label": "bis sechs"
                },
                {
                  "key": "b",
                  "label": "bis zehn"
                },
                {
                  "key": "c",
                  "label": "bis vier"
                }
              ],
              "answer": "c"
            },
            {
              "id": "a21-final-l2-4",
              "prompt": "Was kostet die Garderobe?",
              "options": [
                {
                  "key": "a",
                  "label": "nichts"
                },
                {
                  "key": "b",
                  "label": "einen Euro"
                },
                {
                  "key": "c",
                  "label": "zwei Euro"
                }
              ],
              "answer": "a"
            },
            {
              "id": "a21-final-l2-5",
              "prompt": "Wo können Sie kochen lernen?",
              "options": [
                {
                  "key": "a",
                  "label": "in Raum C"
                },
                {
                  "key": "b",
                  "label": "in Raum D"
                },
                {
                  "key": "c",
                  "label": "in Raum B"
                }
              ],
              "answer": "b"
            }
          ]
        },
        {
          "key": "lesen-3",
          "type": "mc-group",
          "label": "Teil 3 · E-Mail von der Sprachschule",
          "text": "Von: Sabine Rot, Sprachschule Köln\nAn: Frau Peters\nBetreff: Ihr Deutschkurs im Oktober\nGuten Tag, Frau Peters,\nich habe zwei Informationen für Sie. Ab dem 5. Oktober ist unser Kurs in Raum 12. Der alte Raum im ersten Stock ist zu klein. Der neue Raum liegt im Erdgeschoss neben dem Büro. Die Zeit bleibt gleich: montags von 18 bis 20 Uhr. Am Samstag, dem 18. Oktober, machen wir einen Ausflug. Wir fahren mit dem Bus nach Bonn. Die Fahrt kostet acht Euro pro Person. Bitte geben Sie mir das Geld bis Freitag. Im letzten Jahr wollten viele Teilnehmer mitkommen. Der Bus war damals sehr schnell voll. Schreiben Sie mir bitte bis Freitag eine kurze Antwort.\nViele Grüße\nSabine Rot",
          "items": [
            {
              "id": "l3-1",
              "prompt": "Warum gibt es einen neuen Raum?",
              "options": [
                {
                  "key": "a",
                  "label": "Der alte Raum ist zu klein."
                },
                {
                  "key": "b",
                  "label": "Der alte Raum ist zu teuer."
                },
                {
                  "key": "c",
                  "label": "Der alte Raum ist zu laut."
                }
              ],
              "answer": "a"
            },
            {
              "id": "l3-2",
              "prompt": "Wo ist der neue Raum?",
              "options": [
                {
                  "key": "a",
                  "label": "Im ersten Stock."
                },
                {
                  "key": "b",
                  "label": "Im Erdgeschoss."
                },
                {
                  "key": "c",
                  "label": "Im Büro."
                }
              ],
              "answer": "b"
            },
            {
              "id": "l3-3",
              "prompt": "Wann beginnt der Kurs am Montag?",
              "options": [
                {
                  "key": "a",
                  "label": "Um 19 Uhr."
                },
                {
                  "key": "b",
                  "label": "Um 20 Uhr."
                },
                {
                  "key": "c",
                  "label": "Um 18 Uhr."
                }
              ],
              "answer": "c"
            },
            {
              "id": "l3-4",
              "prompt": "Was kostet der Ausflug pro Person?",
              "options": [
                {
                  "key": "a",
                  "label": "Acht Euro."
                },
                {
                  "key": "b",
                  "label": "Achtzehn Euro."
                },
                {
                  "key": "c",
                  "label": "Fünf Euro."
                }
              ],
              "answer": "a"
            },
            {
              "id": "l3-5",
              "prompt": "Was möchte Frau Rot bis Freitag von Frau Peters?",
              "options": [
                {
                  "key": "a",
                  "label": "Nur das Geld."
                },
                {
                  "key": "b",
                  "label": "Das Geld und eine Antwort."
                },
                {
                  "key": "c",
                  "label": "Nur eine neue Adresse."
                }
              ],
              "answer": "b"
            }
          ]
        },
        {
          "key": "lesen-4",
          "type": "mc-group",
          "label": "Lesen Teil 4 · Welche Anzeige passt?",
          "text": "A · Möbelhilfe: Wir holen Ihre Möbel ab. Jeden Samstag.\nB · Reisebüro: Fahrkarten und Hilfe bei der Reiseplanung.\nC · Arztpraxis: Sprechstunde für Kinder, Montag bis Freitag.\nD · Computerkurs: Schreiben und Speichern, auch ohne Erfahrung.\nE · Stadtführung für Familien, auch mit kleinen Kindern.\nF · Sportverein: Training am Abend für Erwachsene.",
          "items": [
            {
              "id": "a21-final-l4-1",
              "prompt": "Ana möchte mit ihren Eltern und ihrer kleinen Tochter die Stadt besichtigen.",
              "options": [
                {
                  "key": "a",
                  "label": "A"
                },
                {
                  "key": "b",
                  "label": "B"
                },
                {
                  "key": "c",
                  "label": "C"
                },
                {
                  "key": "d",
                  "label": "D"
                },
                {
                  "key": "e",
                  "label": "E"
                },
                {
                  "key": "f",
                  "label": "F"
                }
              ],
              "answer": "e"
            },
            {
              "id": "a21-final-l4-2",
              "prompt": "Tim zieht am Wochenende um und braucht Hilfe mit dem Sofa.",
              "options": [
                {
                  "key": "a",
                  "label": "A"
                },
                {
                  "key": "b",
                  "label": "B"
                },
                {
                  "key": "c",
                  "label": "C"
                },
                {
                  "key": "d",
                  "label": "D"
                },
                {
                  "key": "e",
                  "label": "E"
                },
                {
                  "key": "f",
                  "label": "F"
                }
              ],
              "answer": "a"
            },
            {
              "id": "a21-final-l4-3",
              "prompt": "Lena arbeitet am Tag. Nach der Arbeit möchte sie trainieren.",
              "options": [
                {
                  "key": "a",
                  "label": "A"
                },
                {
                  "key": "b",
                  "label": "B"
                },
                {
                  "key": "c",
                  "label": "C"
                },
                {
                  "key": "d",
                  "label": "D"
                },
                {
                  "key": "e",
                  "label": "E"
                },
                {
                  "key": "f",
                  "label": "F"
                }
              ],
              "answer": "f"
            },
            {
              "id": "a21-final-l4-4",
              "prompt": "Jonas braucht Fahrkarten und weiß noch nicht, welcher Zug passt.",
              "options": [
                {
                  "key": "a",
                  "label": "A"
                },
                {
                  "key": "b",
                  "label": "B"
                },
                {
                  "key": "c",
                  "label": "C"
                },
                {
                  "key": "d",
                  "label": "D"
                },
                {
                  "key": "e",
                  "label": "E"
                },
                {
                  "key": "f",
                  "label": "F"
                }
              ],
              "answer": "b"
            },
            {
              "id": "a21-final-l4-5",
              "prompt": "Herr Berger kann seine Dateien noch nicht selbst speichern. Er möchte es lernen.",
              "options": [
                {
                  "key": "a",
                  "label": "A"
                },
                {
                  "key": "b",
                  "label": "B"
                },
                {
                  "key": "c",
                  "label": "C"
                },
                {
                  "key": "d",
                  "label": "D"
                },
                {
                  "key": "e",
                  "label": "E"
                },
                {
                  "key": "f",
                  "label": "F"
                }
              ],
              "answer": "d"
            }
          ]
        }
      ]
    },
    {
      "key": "schreiben",
      "title": "Schreiben",
      "minutes": 30,
      "instructions": "Schreiben Sie eine SMS und eine E-Mail. Bearbeiten Sie jeweils alle drei Punkte. Nutzen Sie danach die Checkliste; diese Texte werden nicht automatisch bewertet.",
      "parts": [
        {
          "key": "schreiben-1",
          "type": "writing",
          "label": "Schreiben Teil 1 · SMS",
          "task": "Sie haben morgen einen Termin mit Ihrer Freundin Lena. Sie können nicht kommen. Schreiben Sie Lena eine SMS mit 20 bis 30 Wörtern: Schreiben Sie eine Entschuldigung. Nennen Sie den Grund. Machen Sie einen Vorschlag für einen neuen Termin.",
          "minWords": 20,
          "maxWords": 30,
          "criteria": [
            "Sie haben eine Entschuldigung geschrieben.",
            "Sie haben einen Grund genannt.",
            "Sie haben einen neuen Termin vorgeschlagen.",
            "Ihr Text hat 20 bis 30 Wörter."
          ]
        },
        {
          "key": "schreiben-2",
          "type": "writing",
          "label": "Schreiben Teil 2 · E-Mail",
          "task": "Ihre Eltern besuchen Sie. Schreiben Sie Ihrem Chef, Herrn Krüger, eine E-Mail mit 30 bis 40 Wörtern: Nennen Sie die Besuchszeit. Bitten Sie um einen freien Tag. Erklären Sie, wer Ihre Arbeit machen kann.",
          "minWords": 30,
          "maxWords": 40,
          "criteria": [
            "Sie haben die Besuchszeit genannt.",
            "Sie haben um einen freien Tag gebeten.",
            "Sie haben eine Person für Ihre Arbeit genannt.",
            "Sie haben eine Anrede und einen Gruß geschrieben.",
            "Ihr Text hat 30 bis 40 Wörter."
          ]
        }
      ]
    },
    {
      "key": "sprechen",
      "title": "Sprechen",
      "minutes": 15,
      "instructions": "Bearbeiten Sie die drei Aufgaben mit einer anderen Person. Wechseln Sie die Rollen. Sprechen wird hier nicht automatisch bewertet. Prüfen Sie danach gemeinsam die Checklisten.",
      "parts": [
        {
          "key": "sprechen-1",
          "type": "speaking",
          "label": "Sprechen Teil 1 · Fragen zur Person",
          "task": "Arbeiten Sie mit einer anderen Person. Stellen Sie zu jeder Karte eine Frage. Antworten Sie auch auf die Fragen Ihres Partners.",
          "cards": [
            "Geburtstag",
            "Familie",
            "Beruf",
            "Wohnort"
          ],
          "criteria": [
            "Ich habe zu jeder Karte eine Frage gestellt.",
            "Ich habe in ganzen Sätzen geantwortet."
          ]
        },
        {
          "key": "sprechen-2",
          "type": "speaking",
          "label": "Sprechen Teil 2 · Ein Besuch",
          "task": "Erzählen Sie von einem Besuch. Sprechen Sie über alle vier Punkte. Ihr Partner stellt danach eine Frage.",
          "prompts": [
            "Wen haben Sie besucht?",
            "Wann und wie lange waren Sie dort?",
            "Was haben Sie zusammen gemacht?",
            "Was hat Ihnen gefallen?"
          ],
          "criteria": [
            "Ich habe alle vier Punkte beantwortet.",
            "Ich habe auf eine Rückfrage geantwortet."
          ]
        },
        {
          "key": "sprechen-3",
          "type": "speaking",
          "label": "Sprechen Teil 3 · Zusammen planen",
          "task": "Sie möchten mit Ihrem Partner eine Stadtführung machen. Sie brauchen dafür zwei Stunden. Finden Sie gemeinsam einen Termin am Samstag. Machen Sie Vorschläge und reagieren Sie auf die Vorschläge Ihres Partners.",
          "calendar": [
            {
              "owner": "Person A",
              "slots": [
                {
                  "time": "9–11 Uhr",
                  "activity": "Arbeit"
                },
                {
                  "time": "11–15 Uhr",
                  "activity": "frei"
                },
                {
                  "time": "15–18 Uhr",
                  "activity": "Familie"
                }
              ]
            },
            {
              "owner": "Person B",
              "slots": [
                {
                  "time": "9–12 Uhr",
                  "activity": "Einkaufen"
                },
                {
                  "time": "12–16 Uhr",
                  "activity": "frei"
                },
                {
                  "time": "16–18 Uhr",
                  "activity": "Sport"
                }
              ]
            }
          ],
          "criteria": [
            "Wir haben Vorschläge gemacht und begründet.",
            "Wir haben einen gemeinsamen Termin mit zwei freien Stunden gefunden."
          ]
        }
      ]
    }
  ]
};
