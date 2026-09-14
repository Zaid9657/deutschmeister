# Automatisch posten — was heute geht und was nicht

Recherchiert am 2026-09-08. Die kurze Antwort: **Planen statt Programmieren.**
Alle drei Plattformen haben einen kostenlosen eigenen Planer. Eine Sitzung von
etwa 40 Minuten, und die ganze Woche läuft ohne weiteres Zutun.

## Warum keine API-Pipeline (jetzt)

Der naheliegende Gedanke — eine Netlify-Funktion, die nach `plan.csv` postet —
scheitert nicht an der Technik, sondern an den Freigaben der Plattformen:

- **Facebook & Instagram.** Öffentliches Posten über die Graph API braucht
  `pages_manage_posts` bzw. `instagram_business_content_publish` mit *Advanced
  Access*, und den gibt es nur nach dem Meta App Review. Ein Prüfzyklus dauert
  rund 20 Tage, mehrere Zyklen sind normal — realistisch sechs bis acht Wochen.
  Im *Development Mode* funktioniert die API sofort, aber die Beiträge sind
  **nur für Seitenadmins sichtbar**. Für Reichweite also wertlos.
- **YouTube.** `videos.insert` läuft mit dem eigenen Konto, doch der
  Upload-Scope gilt bei Google als sensibel: Solange die App im Status
  *Testing* steht, verfällt der Refresh-Token nach sieben Tagen. Man müsste
  sich also wöchentlich neu anmelden — das Gegenteil von automatisch. Der
  Ausweg ist die Google-Verifizierung, wieder Wochen.

Sechs bis acht Wochen Freigabeverfahren, um sieben Posts zu sparen, die in
40 Minuten geplant sind. Das lohnt sich erst bei täglichem Volumen über
Monate — nicht bei der ersten Woche.

## Die 40-Minuten-Sitzung

### 1 · Facebook + Instagram — Meta Business Suite (kostenlos)

`business.facebook.com` → **Planer**. Beiträge lassen sich von 20 Minuten bis
75 Tage im Voraus terminieren, Feed-Posts und Karussells inklusive. Die ganze
Woche passt also in einen Termin.

Pro Tag: Bilder aus `woche-01/bilder/` hochladen, Text aus
`woche-01/texte/facebook/tN-facebook.txt` einfügen, Datum und Uhrzeit aus
`plan.csv` setzen, planen. Instagram im selben Dialog mitauswählen — dann den
IG-Text aus `texte/instagram/` nehmen, er ist kürzer und anders geschnitten.

Wichtig fürs Karussell: **Das erste Bild bestimmt das Seitenverhältnis**, alle
weiteren werden darauf zugeschnitten. Unsere Bilder sind durchgängig 1:1,
damit passiert nichts — nur nicht mit einem Hochformat mischen.

### 2 · YouTube — Studio (kostenlos)

`studio.youtube.com` → Hochladen. Im letzten Schritt "Planen" statt "Sofort
veröffentlichen" wählen und Datum/Uhrzeit aus `plan.csv` eintragen. Sieben
Videos, sieben Termine, ein Durchgang. Titel, Beschreibung und Tags stehen
fertig in `texte/youtube/`, das Thumbnail liegt daneben.

Vorher einmal `download/herunterladen.sh` laufen lassen — dann liegen alle
Dateien lokal und sind unverändert hochladbar.

## Was danach wirklich automatisch ist

Nach der Sitzung passiert eine Woche lang nichts mehr von Hand. Die Plattformen
veröffentlichen selbst, auch wenn niemand am Rechner sitzt.

## Wann sich die Pipeline doch lohnt

Wenn drei Dinge zusammenkommen: tägliches Posten über mehrere Monate, mehr als
eine Plattformfamilie, und Inhalte, die aus der Datenbank kommen statt aus
einer Datei. Dann rechnet sich der App Review. Der Zeitpunkt dafür ist nach
den ersten tausend Followern, nicht davor — vorher ist Reichweite der Engpass,
nicht der Aufwand pro Post.

Zwischenschritt, falls es früher drängt: Ein Drittanbieter (Buffer, Metricool,
Later) hat den Meta-Review bereits bestanden. Man hängt sein Konto dort ein und
umgeht das Verfahren — dafür kostet es monatlich und die Inhalte liegen bei
einem Dritten. Für eine Woche pro Monat ist der native Planer günstiger und
schneller.

## Quellen

- Meta Business Suite Planer, 75 Tage Vorlauf — https://www.crowbert.com/how-to-schedule-facebook-posts
- Instagram Content Publishing API, Anforderungen und Limits — https://developers.facebook.com/docs/instagram-platform/content-publishing/
- App Review für Page-Berechtigungen, Dauer und Development-Mode-Sichtbarkeit — https://singhamandeep.com/facebook-page-api-permissions-app-review/
