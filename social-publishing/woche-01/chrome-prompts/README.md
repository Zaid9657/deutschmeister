# Chrome-Extension-Prompts — Woche 1

Ein Prompt pro Beitrag. Nacheinander abarbeiten, nicht alle auf einmal.

## Was die Extension NICHT kann

Den Datei-Dialog des Betriebssystems bedienen. Das heißt: Videodatei,
Thumbnail und die Karussell-Bilder wählst du selbst aus. Alles danach —
Titel, Beschreibung, Tags, Sprache, Zielgruppe, Datum und Uhrzeit — macht
die Extension.

## Reihenfolge

| Datei | Wofür |
|---|---|
| `yt-t1.md` … `yt-t7.md` | YouTube, ein Video pro Tag |
| `fb-t1.md` … `fb-t7.md` | Facebook, ein Beitrag pro Tag |

Instagram fehlt bewusst: Das Konto existiert noch nicht. Sobald es da ist,
sind die Texte in `texte/instagram/` fertig — Business Suite plant Facebook
und Instagram im selben Dialog.

## Zwei Regeln, die in jedem Prompt stehen

**Der letzte Klick gehört dir.** Jeder Prompt endet mit „melde dich, klicke
nicht". So siehst du die Vorschau, bevor etwas terminiert wird — bei sieben
Beiträgen ist ein falsch gesetztes Datum sonst schnell unbemerkt.

**Kein Erfinden.** Die Prompts verbieten Kürzen, Umformulieren und Übersetzen
ausdrücklich. Der Text ist gegen `src/data/marketing.js` und die Lektionen
geprüft; eine freie Umformulierung wäre es nicht mehr.

## Wenn YouTube oder Meta die Oberfläche ändert

Dann bricht die Extension ab und sagt es dir — so steht es im Prompt. In dem
Fall den betroffenen Beitrag von Hand fertigstellen; die Texte liegen ja
alle in `texte/`.
