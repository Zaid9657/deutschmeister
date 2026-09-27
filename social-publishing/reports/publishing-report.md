# Publishing-Report

Stand 2026-09-06. **Nichts wurde veröffentlicht.** Diese Session hat keinen
Veröffentlichungszugang zu YouTube, Instagram oder Facebook; ein Post wird erst
als veröffentlicht geführt, wenn die Plattform eine echte ID zurückgibt.

| content_id | Plattform | geplant (Europe/Berlin) | URL / ID | Quelle | CTA | Status | Problem |
|---|---|---|---|---|---|---|---|
| DM-W0-D0-FB-POST | facebook | 2026-09-06 19:00 | — | — | `/` | READY_TO_POST | keins — manuell postbar |
| DM-W0-D1-YT-LONG | youtube | 2026-09-07 18:30 | — | VID-A1-ALPHABET-EN | Videoseite | BLOCKED_MEDIA_ACCESS | Datei nicht herunterladbar |
| DM-W0-D1-IG-REEL | instagram | 2026-09-07 19:00 | — | VID-A1-ALPHABET-EN | Videoseite | BLOCKED_AUTH | Konto existiert noch nicht |
| DM-W0-D2-YT-SHORT | youtube | 2026-09-08 19:00 | — | VID-A1-LETTERCOMBI-EN | Videoseite | BLOCKED_MEDIA_ACCESS | Schnitt nicht möglich |
| DM-W0-D2-FB-REEL | facebook | 2026-09-08 19:00 | — | VID-A1-LETTERCOMBI-EN | Videoseite | BLOCKED_MEDIA_ACCESS | Schnitt nicht möglich |
| DM-W0-D3-FB-CAROUSEL | facebook | 2026-09-09 19:00 | — | Eigenproduktion | `/grammar/` | READY_TO_POST | keins — Bilder liegen bei |
| DM-W0-D3-IG-CAROUSEL | instagram | 2026-09-09 19:00 | — | Eigenproduktion | `/grammar/` | BLOCKED_AUTH | Konto existiert noch nicht |
| DM-W0-D4-FB-POST | facebook | 2026-09-10 19:00 | — | POD-A12-1 | `/podcasts` | READY_TO_POST | keins — manuell postbar |
| DM-W0-D4-IG-REEL | instagram | 2026-09-10 19:00 | — | POD-A12-1 | `/podcasts` | BLOCKED_MEDIA_ACCESS | kein Transkript für Untertitel |
| DM-W0-D5-YT-LONG | youtube | 2026-09-11 18:30 | — | VID-A1-DERDIEDAS-EN | `/grammar/` | DO_NOT_PUBLISH | Quelldatei vermutlich das falsche Video |
| DM-W0-D6-YT-SHORT | youtube | 2026-09-12 19:00 | — | VID-A1-EINEINE-EN | Videoseite | BLOCKED_MEDIA_ACCESS | Schnitt nicht möglich |
| DM-W0-D7-FB-POST | facebook | 2026-09-13 11:00 | — | — | `/grammar/` | READY_TO_POST | keins — manuell postbar |
| DM-W0-D7-IG-REEL | instagram | 2026-09-13 11:00 | — | Bildschirmaufnahme | `/` | BLOCKED_MEDIA_ACCESS | Aufnahme fehlt |

## Vier Posts sind sofort veröffentlichbar

DM-W0-D0, D3 (Facebook), D4 (Facebook) und D7 (Facebook) brauchen keine
Videodatei. Text und Bilder liegen fertig im Paket.

## Was die Blocker löst

1. **Videoschnitt** — dieselben Schritte in einer lokalen Claude-Code-Session
   ausführen, die `omqyueddktqeyrrqvnyq.supabase.co` erreichen darf. Die
   Kalenderzeilen sind so geschrieben, dass sie dort ohne Änderung weiterlaufen.
2. **Instagram** — Konto anlegen (Prompt liegt unter
   `docs/social/meta-accounts-prompt.md`), dann mit der Facebook-Seite in einem
   Business-Portfolio verbinden.
3. **Tag 5** — die Datei
   `mastering-der-die-das-german-articles-explained/video-en.mp4` öffnen und
   prüfen, ob sie wirklich die Artikel erklärt. Falls nicht: die arabische
   Fassung desselben Slugs prüfen und den englischen Master neu ablegen.
4. **Untertitel** — es gibt keine. Für jeden vertikalen Clip muss transkribiert
   werden; danach gehören die Transkripte in `podcasts.transcript_de`, damit die
   Website denselben Nutzen hat.
