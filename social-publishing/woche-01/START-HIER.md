# Woche 1 — komplett fertig, 09.09. bis 15.09.2026

Ein Thema pro Tag, auf allen drei Plattformen. 21 Posts. Alle Bilder gerendert,
alle Texte geschrieben, alle Links mit UTM. Nichts muss geschnitten oder
gestaltet werden.

## Was pro Tag zu tun ist

**YouTube** — die Videodatei liegt fertig im Speicher. Herunterladen mit
`download/herunterladen.sh` (oder `.ps1`), dann unverändert hochladen. Titel,
Beschreibung und Tags stehen in `texte/youtube/tN-youtube.txt`, das Thumbnail
in `bilder/yt-tN-thumb.png`. Kein Schnitt.

**Instagram** — Bilder aus `bilder/` als Karussell hochladen, Caption aus
`texte/instagram/tN-instagram.txt` kopieren. Der UTM-Link gehört in die Bio
oder den Story-Sticker, nicht in die Caption (Instagram verlinkt sie nicht).

**Facebook** — dieselben Bilder, längerer Text aus
`texte/facebook/tN-facebook.txt`. Der Link steht direkt im Text.

## Der Wochenplan

| Tag | Datum | Thema | YouTube-Video |
|---|---|---|---|
| 1 | Mi 09.09. | Das Alphabet & Ä Ö Ü ß | German Alphabet & Pronunciation Rules |
| 2 | Do 10.09. | ei, ie, eu, ch | German Letter Combinations |
| 3 | Fr 11.09. | Der Nominativ | The Nominative Case |
| 4 | Sa 12.09. | Der Akkusativ | The Accusative Case |
| 5 | So 13.09. | Das Verb sein | German Verb Sein |
| 6 | Mo 14.09. | Das Verb haben | German Verb Haben |
| 7 | Di 15.09. | ein oder eine? | Ein & Eine Explained |

Die genauen Zeiten und Dateizuordnungen stehen in `plan.csv`.

## Warum diese Reihenfolge

Sie baut aufeinander auf: erst die Laute (Tag 1–2), dann die zwei Fälle, die
ein A1-Lerner zuerst braucht (Tag 3–4), dann die zwei häufigsten Verben
(Tag 5–6), und am Ende der unbestimmte Artikel, der nur funktioniert, wenn
der bestimmte sitzt (Tag 7). Wer die Woche mitliest, hat ein zusammenhängendes
Kapitel gelernt und keine sieben Einzelposts gesehen.

## Was bewusst NICHT drin ist

- Keine Kurse, keine Preise, kein Starttermin, keine Warteliste. Reiner
  Unterricht. Das ist die Entscheidung aus dem Publishing-Prompt und sie
  bleibt bis mindestens 1.000 Follower bestehen.
- Kein Reel und kein Short. Beides bräuchte Videoschnitt; die vorhandenen
  Videos sind Langformate. Ein vertikaler Zuschnitt kann später nachgeliefert
  werden, ohne die Woche zu blockieren.
- Das Video "Mastering Der, Die, Das" fehlt absichtlich: Die Datei steht unter
  Verdacht, ein anderes Video zu sein (siehe `reports/preflight-report.md`).
  Es kommt erst rein, wenn jemand sie geöffnet hat.

## Instagram existiert noch nicht

Die 7 Instagram-Posts sind fertig und warten auf das Konto. Der Prompt zum
Anlegen liegt in `docs/social/meta-accounts-prompt.md`. Bis dahin läuft die
Woche auf YouTube und Facebook — die Bilder sind dieselben.

## Bildsprache

Alle Bilder sind aus `src/data/design-tokens.js` gerendert: Fraunces als
Displayschrift, Siegel-Teal als einzige Interaktionsfarbe, Gold nur als
Akzent. Die Kasus-Farben erscheinen ausschließlich an den zwei Tagen, an
denen ein Fall benannt wird — Blau am Nominativ-Tag, Orange am
Akkusativ-Tag. Das ist Regel 1 des Designsystems und gilt auch hier.
