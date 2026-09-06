# Social-Media-Konten: Setup-Kit (Facebook · Instagram · YouTube)

Stand: 2026-09-06. Zweck: drei Kanäle aufsetzen, die auf deutsch-meister.de
einzahlen. Alle Konten hängen an **socialmedia@deutsch-meister.de**.

Was hier steht, ist die Vorbereitung. Das Anlegen der Konten selbst passiert
von Hand (Telefonverifizierung + CAPTCHA) — ein Agent kann das nicht.

---

## 0. Blocker zuerst: die Mailadresse muss EMPFANGEN können

`deutsch-meister.de` ist bei Resend nur zum **Senden** verifiziert
(`Receiving: disabled`, geprüft 2026-09-06). Meta und Google schicken
Bestätigungscodes — ohne Posteingang kommt kein Konto zustande.

Günstigster Weg: kostenloses Forwarding auf ein bestehendes Postfach.
- DNS liegt auf Cloudflare → **Cloudflare Email Routing** (kostenlos, MX in
  einem Klick gesetzt).
- Sonst → **ImprovMX** Free (1 Domain, 500 Weiterleitungen/Tag).

Testkriterium: eine Testmail an socialmedia@deutsch-meister.de kommt an.
Erst danach Schritt 1.

---

## 1. Kontenarchitektur (die Reihenfolge ist nicht beliebig)

Falsche Reihenfolge = später Umzug mit Reichweitenverlust. Richtig:

1. **Google-Konto** mit socialmedia@deutsch-meister.de als Login
   (Google-Konto mit vorhandener Adresse anlegen, kein neues Gmail).
2. **YouTube-Kanal als Brand Account**, nicht als Personenkanal.
   Ein Brand Account lässt sich später an mehrere Menschen übergeben; ein
   Personenkanal klebt an einer Privatperson.
3. **Facebook-Profil** (persönlich, Pflicht — Meta vergibt keine Seiten ohne
   Profil dahinter), dann **Facebook-Seite "Deutsch Meister"**.
4. **Instagram-Konto**, direkt beim Anlegen auf **Professional → Creator**
   umstellen, und in der Seiteneinstellung mit der Facebook-Seite verknüpfen.
5. **Meta Business Suite**: Seite + Instagram in einem Business-Portfolio
   bündeln. Danach lassen sich beide aus einem Posteingang bespielen.

Zwei-Faktor auf allen drei Konten aktivieren, Wiederherstellungscodes
sichern. Ein gesperrtes Meta-Konto ohne 2FA-Backup ist praktisch verloren.

---

## 2. Namen und Handles

Primär überall dieselbe Schreibweise, damit die Kanäle auffindbar sind.
Verfügbarkeit erst beim Anlegen prüfbar — Reihenfolge = Priorität.

| Plattform | Anzeigename | Handle (1. Wahl) | Ausweichen |
|---|---|---|---|
| YouTube | Deutsch Meister | `@deutschmeister` | `@deutschmeister_de`, `@deutschmeisterde` |
| Instagram | Deutsch Meister | `deutschmeister.de` | `deutschmeister_de`, `deutsch.meister.de` |
| Facebook | Deutsch Meister | `deutschmeister.de` | `deutschmeisterde` |

Regel: Wenn die erste Wahl auf einer Plattform belegt ist, auf **allen**
Plattformen die gleiche Ausweichvariante nehmen. Drei verschiedene Handles
sind ein Auffindbarkeitsproblem, kein Detail.

---

## 3. Bios (fertig zum Einfügen)

Alle Zahlen unten stammen aus `src/data/marketing.js` und sind gegen die
Datenbank gezählt. Keine Zahl frei ergänzen — die Datei ist die Quelle.

**Instagram (150 Zeichen)**
```
Deutsch lernen von A1 bis B2 — Grammatik, Hören, Sprechen.
80 Grammatikthemen, KI-Feedback. A1.1 kostenlos.
👇 deutsch-meister.de
```

**Facebook-Seite — Kurzbeschreibung (255 Zeichen)**
```
Deutsch Meister ist eine Lernplattform für Deutsch von A1.1 bis B2.2:
80 Grammatikthemen, 74 Lesetexte, 48 Hörübungen und KI-Feedback zu
Aussprache und Schreiben. Die komplette Stufe A1.1 ist kostenlos.
```

**YouTube — Kanalbeschreibung**
```
Hier lernst du Deutsch von A1.1 bis B2.2 — verständlich erklärt, ohne
Grammatik-Nebel.

In jedem Video: eine Regel, ein echtes Beispiel, eine Übung zum Mitmachen.
Themen: Grammatik, Wortschatz, Hörverstehen und typische Fehler.

Alle 80 Grammatikthemen mit Übungen und KI-Feedback:
https://deutsch-meister.de

Stufe A1.1 ist komplett kostenlos — ohne Konto.
```

**Kanal-Stichworte / Keywords (YouTube-Einstellungen)**
```
Deutsch lernen, Deutsch A1, Deutsch B1, deutsche Grammatik, German for
beginners, Deutsch als Fremdsprache, DaF, Deutschkurs online
```

---

## 4. Grafik-Assets, die vor dem ersten Post fertig sein müssen

- Profilbild: 1:1, mindestens 400×400 — auf allen drei Kanälen identisch.
- YouTube-Banner: 2560×1440, sicherer Bereich 1546×423.
- Facebook-Titelbild: 1640×624.
- Farben und Schrift kommen aus `src/data/design-tokens.js` (Fraunces als
  Display-Schrift, Siegel-Teal als einzige interaktive Farbe). Nicht neu
  erfinden — die Kanäle sollen wie die Seite aussehen.

---

## 5. Tracking ab dem ersten Link

Jeder Link aus einem Profil oder Video bekommt UTM-Parameter, sonst ist in
drei Monaten nicht beantwortbar, welcher Kanal Nutzer bringt.

```
https://deutsch-meister.de/?utm_source=instagram&utm_medium=bio&utm_campaign=profil
https://deutsch-meister.de/?utm_source=youtube&utm_medium=description&utm_campaign=kanal
https://deutsch-meister.de/?utm_source=facebook&utm_medium=page&utm_campaign=profil
```

---

## 6. Checkliste

- [ ] Weiterleitung für socialmedia@deutsch-meister.de aktiv, Testmail kommt an
- [ ] Google-Konto auf dieser Adresse
- [ ] YouTube-Kanal als Brand Account, Beschreibung + Keywords gesetzt
- [ ] Facebook-Seite live, Kurzbeschreibung gesetzt
- [ ] Instagram auf Creator umgestellt und mit der Seite verknüpft
- [ ] Beide Meta-Kanäle in einem Business-Portfolio
- [ ] 2FA + Wiederherstellungscodes auf allen drei Konten
- [ ] Profilbild und Banner hochgeladen
- [ ] Bio-Links mit UTM
