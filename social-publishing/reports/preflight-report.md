# Preflight-Report — Existing-Content-Launch (7 Tage)

Erstellt: 2026-09-06 · Quelle: Supabase-Projekt `omqyueddktqeyrrqvnyq`, Tabellen
`video_library`, `podcasts`, `storage.objects` (Bucket `video-library`,
`podcasts`) · Repository `Zaid9657/deutschmeister`.

## Kurzfassung

Das Material existiert und ist besser als erwartet: **11 A1-Videos, jedes in
zwei Sprachfassungen (Englisch und Arabisch), plus 14 veröffentlichte
Podcast-Folgen.** Der Sieben-Tage-Plan ist inhaltlich tragfähig.

Drei Dinge blockieren ihn trotzdem, und alle drei sind lösbar. Sie stehen unten
mit dem konkreten nächsten Schritt.

## Was gefunden wurde

| | Anzahl | Anmerkung |
|---|---|---|
| Videos (`video_library`) | 11, alle `published = true` | alle CEFR-Stufe **A1**, keine höhere Stufe |
| Sprachfassungen je Video | 2 (`video-en.mp4`, `video-ar.mp4`) | 15–30 MB je Datei |
| Videodateien im Bucket | 22 aktuelle + 5 Alt-Kopien + 6 Intro-Clips | Alt-Kopien liegen unter `german-pronouns/` und `german-pronouns-2/` |
| Podcast-Folgen gesamt | 24 | 14 veröffentlicht, 10 unveröffentlicht (B1.2, B2.1, B2.2 komplett) |
| Transkripte | **0** | `transcript_de` und `transcript_en` sind in allen 24 Zeilen leer |
| Untertiteldateien (.vtt/.srt) | **0** | weder im Repository noch im Storage |
| Thumbnails | **0** | `thumbnail_url` ist in allen 11 Videozeilen NULL |
| Folien / Mindmaps | **0** | `slides_url` und `mindmap_url` durchgängig NULL |

Wichtig zur Benennung: die Spalte heißt `audio_url`, enthält aber `.mp4`-Video.
Wer sie für Audio hält, unterschätzt den Bestand — das war der erste
Fehlschluss dieser Recherche und ist hier korrigiert.

## Die drei Blocker

### 1. Die Mediendateien sind aus dieser Session nicht erreichbar

`https://omqyueddktqeyrrqvnyq.supabase.co/...` antwortet dem Agent-Proxy mit
`CONNECT tunnel failed, 403`. Das ist eine Netzwerkgrenze der Cloud-Session,
kein Rechte- oder Kontoproblem.

Folge: **jeder Schritt, der die Datei selbst anfasst, ist von hier aus nicht
ausführbar** — 9:16-Zuschnitt, Untertitel einbrennen, Schnitt, Export, Prüfung
von Auflösung, Ton und Dauer.

Lösung: dieselben Schritte in einer **lokalen** Claude-Code-Session ausführen,
die die Dateien herunterladen darf. Dieses Paket ist so gebaut, dass es dort
ohne Nacharbeit weiterläuft.

### 2. Kein Veröffentlichungszugang

Diese Session hat keine YouTube-, Instagram- oder Facebook-Publishing-
Verbindung. Alle Einträge im Manifest stehen deshalb auf
`BLOCKED_AUTH`; nichts wurde veröffentlicht und nichts wird als
veröffentlicht ausgegeben.

Kürzester sicherer Weg je Plattform:
- **YouTube** — Upload von Hand über `@deutschmeister_de`, oder eine
  autorisierte Google-/YouTube-Verbindung einrichten.
- **Facebook / Instagram** — beide Konten in einem Meta-Business-Portfolio
  bündeln, dann über die Meta Business Suite planen. Instagram existiert noch
  nicht (Stand 2026-09-06).

### 3. Ein wahrscheinlich falsch abgelegtes Video

`mastering-der-die-das-german-articles-explained/video-en.mp4` ist **26.456.138
Byte groß — auf das Byte genau so groß wie**
`german-personal-pronouns-the-complete-guide/video-en.mp4` und wie die
Altkopie `german-pronouns/German_Personal_Pronouns.mp4`.

Das ist kein Beweis, aber ein starker Verdacht: unter dem Artikel-Slug liegt
vermutlich das Pronomen-Video. **Tag 3 und Tag 5 des Plans hängen beide an
genau dieser Datei.** Der Verdacht lässt sich hier nicht prüfen (siehe Blocker
1) und ist deshalb als `DO_NOT_PUBLISH` markiert, bis jemand die Datei öffnet.

Die arabische Fassung desselben Slugs hat eine abweichende Größe (23,7 MB) und
ist vermutlich das echte Artikel-Video — auch das ist zu prüfen, nicht zu
glauben.

## Sprach-QA: vier Titel mit falschen Umlauten

In den Podcast-Titeln steht die Umschreibung statt des Umlauts:

| Folge | ist | muss sein |
|---|---|---|
| A1.1 #2 | Zahlen und Zaehlen | Zahlen und **Zählen** |
| A1.1 #3 | Im Cafe | Im **Café** |
| B1.1 #1 | Ueber Nachrichten sprechen | **Über** Nachrichten sprechen |
| B1.1 #2 | Meinungen ausdruecken | Meinungen **ausdrücken** |

Auf einer Deutschlernmarke ist das kein Schönheitsfehler. Diese Strings dürfen
nicht in eine Caption. Die betroffenen Folgen stehen auf `DO_NOT_PUBLISH`
beziehungsweise `NEEDS_LANGUAGE_QA`; Tag 4 nutzt stattdessen A1.2, dessen Titel
sauber sind.

Nebenbefund: Die Dauerangaben sind je Stufe identisch (180 / 200 / 220
Sekunden). Das sind Platzhalter, keine Messungen — vor jeder Nutzung im
Metadatenfeld nachmessen.

## Sprache der Videos

Alle Videos sind englisch (bzw. arabisch) erklärt, mit deutschen Beispielen.
Für A1-Anfänger ist das in dieser Nische üblich und kein Ausschlussgrund. Zwei
Regeln daraus:
- Der deutsche Beispielsatz ist der visuelle Kern; die Erklärsprache steht im
  Titel.
- Englische und arabische Fassung nie unbeschriftet in dieselbe Playlist.

## Konten

| Plattform | Konto | Verifiziert |
|---|---|---|
| YouTube | `@deutschmeister_de` | vom Inhaber genannt, nicht per API geprüft |
| Facebook | `facebook.com/deutschmeister.de` | vom Inhaber genannt, nicht per API geprüft |
| Instagram | existiert noch nicht | — |

Die Website verlinkt den YouTube-Kanal bislang nicht. Das ist hier nur
gemeldet, nicht geändert.

## Was ohne die Blocker sofort läuft

Alles, was keine Videodatei anfasst, ist fertig und liegt in diesem Paket:
Kalender, Manifest, Captions je Plattform, UTM-Links, der Karussell-Satz für
Tag 3 als fertige Bilddateien und die Facebook-Textposts.

Konkret heute veröffentlichbar, ohne jede weitere Produktion: der
Facebook-Startpost und der Tag-3-Karussellsatz.
