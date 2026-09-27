# social-publishing

Das Veröffentlichungspaket für die erste Woche, gebaut ausschließlich aus
Material, das bereits existiert. Keine neuen Master.

Lies zuerst `reports/preflight-report.md` — dort stehen der Bestand und die
drei Blocker.

| Ordner | Inhalt |
|---|---|
| `inventory/` | jeder gefundene Asset mit Status und QA-Befund |
| `calendar/` | die sieben Tage mit Datum, Uhrzeit, Ziel-URL und UTM |
| `manifests/` | dieselben Einträge maschinenlesbar, inkl. Publish-Status |
| `captions/` | je Plattform eigener Text, nie derselbe Text zweimal |
| `carousels/` | die sechs Karussellbilder für Tag 3, fertig gerendert |
| `thumbnails/`, `subtitles/`, `exports/` | leer — brauchen Zugriff auf die Videodateien |
| `reports/` | Preflight, Publishing-Status, Backlog für neue Videos |

## Status-Werte

- `READY_TO_POST` — vollständig, kann von Hand hochgeladen werden.
- `BLOCKED_MEDIA_ACCESS` — Text fertig, Videodatei aus dieser Session nicht
  erreichbar (Storage-Egress 403). Lokale Session nötig.
- `BLOCKED_AUTH` — kein Veröffentlichungszugang bzw. Konto existiert noch nicht.
- `DO_NOT_PUBLISH` — QA-Befund, siehe Notiz in der Zeile.

## Regeln, die in jeder Datei gelten

Keine Kurse, keine Preise, kein Launch-Datum, keine Warteliste, kein Link auf
Pricing oder Checkout, kein C1, keine Musik. Ein Lernziel und ein CTA pro Post.
