# Was es gibt — Videos und Podcasts, Stand 2026-09-07

Gezählt gegen die Datenbank (`video_library`, `podcasts`), nicht gegen die
gerenderte Seite.

## Videos — 11, alle veröffentlicht, alle A1

Jedes Video existiert **zweimal**: englisch erklärt (`video-en.mp4`) und
arabisch erklärt (`video-ar.mp4`). Beispiele immer auf Deutsch.

| # | Titel | Slug im Storage | EN | AR |
|---|---|---|---|---|
| 1 | German Alphabet & Pronunciation Rules | `german-alphabet-pronunciation-rules` | 24,9 MB | 24,4 MB |
| 2 | German Letter Combinations: Mastering Pronunciation | `german-letter-combinations-mastering-pronunciation` | 20,3 MB | 20,7 MB |
| 3 | Mastering Der, Die, Das: German Articles Explained | `mastering-der-die-das-german-articles-explained` | 26,5 MB ⚠️ | 23,7 MB |
| 4 | German Indefinite Articles: Ein & Eine Explained | `german-indefinite-articles-ein-eine-explained` | 26,6 MB | 17,0 MB |
| 5 | German Personal Pronouns: The Complete Guide | `german-personal-pronouns-the-complete-guide` | 26,5 MB | 20,5 MB |
| 6 | German Pronoun Cases: Nominative, Accusative & Dative | `german-pronoun-cases-nominative-accusative-dative` | 15,2 MB | 21,1 MB |
| 7 | German Verb Sein: How to Say "To Be" | `german-verb-sein-how-to-say-to-be` | 29,8 MB | 20,6 MB |
| 8 | German Verb Haben: How to Say "To Have" | `german-verb-haben-how-to-say-to-have` | 24,4 MB | 19,5 MB |
| 9 | The Nominative Case: Subjects in German | `the-nominative-case-subjects-in-german` | 26,1 MB | 19,3 MB |
| 10 | Asking Questions in the Nominative Case | `asking-questions-in-the-nominative-case` | 20,9 MB | 15,8 MB |
| 11 | The Accusative Case: Direct Objects in German | `the-accusative-case-direct-objects-in-german` | 25,4 MB | 21,6 MB |

Download: `https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library/<slug>/video-en.mp4`

⚠️ Nummer 3 ist auf das Byte genau so groß wie Nummer 5. Vermutlich liegt dort
das Pronomen-Video. Vor dem Hochladen öffnen.

Was es NICHT gibt: Thumbnails, Folien, Mindmaps, Untertitel — alle
entsprechenden Spalten sind leer.

Über A1 hinaus gibt es kein einziges Video. Alles A2 und höher ist auf der
Website Text, Audio und Übung, aber kein Film.

## Podcasts — 24 Folgen, davon 14 veröffentlicht

Download: `https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/podcasts/<Stufe>/<Nr>.mp4`

### Veröffentlicht (14)

| Stufe | Nr | Titel |
|---|---|---|
| A1.1 | 1 | Erste Schritte auf Deutsch |
| A1.1 | 2 | Zahlen und Zaehlen ⚠️ Umlaut falsch |
| A1.1 | 3 | Im Cafe ⚠️ Akzent fehlt |
| A1.2 | 1 | Mein Tagesablauf |
| A1.2 | 2 | Einkaufen im Supermarkt |
| A1.2 | 3 | Familie und Freunde |
| A2.1 | 1 | Im Restaurant |
| A2.1 | 2 | Unterwegs in der Stadt |
| A2.1 | 3 | Hobbys und Freizeit |
| A2.2 | 1 | Beim Arzt |
| A2.2 | 2 | Einen Ausflug planen |
| A2.2 | 3 | Beruf und Arbeitsplatz |
| B1.1 | 1 | Ueber Nachrichten sprechen ⚠️ Umlaut falsch |
| B1.1 | 2 | Meinungen ausdruecken ⚠️ Umlaut falsch |

### Fertig, aber nicht sichtbar (10) — und der Grund ist NICHT der Schalter

Die Dateien liegen im Storage, aber **unter einem anderen Namen, als die
Datenbank erwartet**. Die Zeile zeigt auf `B1.2/1.mp4`; im Speicher liegt
`B1.2/1 (2).mp4`. Bei allen zehn Folgen dasselbe: eine Klammer und eine Zahl,
die beim Hochladen entstanden sind.

`is_published = true` zu setzen würde deshalb zehn kaputte Player erzeugen,
keine zehn neuen Folgen. Erst muss eines von beiden stimmen — die Dateien
umbenennen oder die Pfade in der Datenbank korrigieren.

| Stufe | Nr | Titel |
|---|---|---|
| B1.1 | 3 | Leben in Deutschland |
| B1.2 | 1 | Umweltthemen |
| B1.2 | 2 | Deutsche Kultur und Traditionen |
| B1.2 | 3 | Bildung und Berufsziele |
| B2.1 | 1 | Politik und Gesellschaft |
| B2.1 | 2 | Technologie und Innovation |
| B2.1 | 3 | Die deutsche Wirtschaft |
| B2.2 | 1 | Philosophie und Ethik |
| B2.2 | 2 | Deutsche Literatur und Film |
| B2.2 | 3 | Debatten und Argumentation |

## Drei Dinge, die für alle 24 Podcasts gelten

1. **Kein Transkript.** `transcript_de` und `transcript_en` sind überall leer.
   Für Untertitel muss erst transkribiert werden.
2. **Keine Vokabelliste.** Das `vocabulary`-Feld ist überall ein leeres Array.
3. **Die Dauer ist nicht gemessen.** Sie ist je Stufe konstant
   (A1.1/A2.2/B1 = 180 s, A1.2 = 200 s, A2.1 = 220 s) — ein Platzhalter.
