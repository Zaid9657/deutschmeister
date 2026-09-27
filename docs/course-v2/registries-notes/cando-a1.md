# Can-do registry A1 — notes for the level curriculum agents

**Date:** 2026-09-27 · **Registry:** [`content/course-v2/registries/cando/a1.json`](../../../content/course-v2/registries/cando/a1.json)
(SCHEMA §4.1, `course-v2/cando@1`) · **Covers:** A1.1 and A1.2 · **Exam lane:** sd1 only (Goethe-Zertifikat A1:
Start Deutsch 1 = telc Deutsch A1; lean execution 2026-09-27 — no ÖSD ZA1 or other lane can-dos were created) ·
**Inputs:** `curriculum/a1-1.json`, `curriculum/a1-2.json` (every can-do line), BLUEPRINT §2.2 rule 4 and §2.8,
research 01 §1 and §7, 04 (inventory A1.1/A1.2, F5 precedence rule), 14 §C, `registries/lanes/sd1.json`.

**Size:** 115 can-dos — 60 introduced in A1.1, 55 in A1.2. All 105 can-do lines of
the two W2 plans map to an id (§6); 18 ids are new (sd1 needs and blueprint-row gaps, §4).

## 1. How to use this

1. **Unit ids are the BLUEPRINT §2.8 rows, not the W2 draft numbers.** The drafts are input, not law (BLUEPRINT §2.8).
   For A1.1 the two orders are identical except that **draft u05 (Wohnung) is blueprint U6 and draft u06 (Laptop/Büro)
   is blueprint U5**. A1.2 is reordered throughout; the last column of §2 names the draft unit(s) each row draws on.
2. **Core** = the 3–5 can-dos the unit lists in its Lernziele box and proves in LS7 / „Das kann ich“ (ALL-02). Every
   core set has ≥ 1 productive or interaction can-do. **Each id is core in exactly one unit**, so a learner never
   „gains“ the same can-do twice. The **more** column is spiral reuse, a Fokus-Karte or an optional task; reference those
   ids in Aufgaben and review, not in the unit's Lernziele box.
3. A curriculum agent may swap a core id for one from the same row's *more* column or from the registry with a
   logged `deviation`; it may **not** invent an id (REF-01). New wording or a new can-do goes through the registry
   owner, and a meaning change takes a new id (ID-01).
4. **Online-interaction quota (ALL-06):** A1.1 → `cd.a1.online-post` (core U11), `cd.a1.online-gruessen` (U1 more);
   A1.2 → `cd.a1.mitteilungen-austauschen` (core U5), `cd.a1.online-bestellen` (core U10). Keep at least one of each
   pair as core.
5. **Mediation:** no A1 can-do carries `mediation: true` (the quota starts at B1.1).

## 2. Unit → can-do ids (BLUEPRINT §2.8 rows — use this table)

| Unit | Titel | Prüfungsteile (SD1) | Core (Lernziele, 3–5) | More (spiral · Fokus · optional) | W2 draft source |
|---|---|---|---|---|---|
| `a1.1-u01` | Hallo, ich bin Priya | Sp1, H1 | `cd.a1.begruessen` · `cd.a1.verabschieden` · `cd.a1.sich-vorstellen` · `cd.a1.person-erfragen` · `cd.a1.sprachen-nennen` | `cd.a1.online-gruessen` (Chat-Aufgabe) | a1.1-u01 |
| `a1.1-u02` | Wie schreibt man das? | S1, Sp1, H1 | `cd.a1.buchstabieren` · `cd.a1.zahlen` · `cd.a1.formular-person` · `cd.a1.daten-angeben` · `cd.a1.nachfragen` | `cd.a1.beruf-nennen` · `cd.a1.gespraech-details` | a1.1-u02 |
| `a1.1-u03` | Meine Familie | Sp2, L1 | `cd.a1.familie-erzaehlen` · `cd.a1.personen-beschreiben` · `cd.a1.befinden` · `cd.a1.ueber-andere-schreiben` · `cd.a1.fragen-thema` | `cd.a1.kurze-mitteilungen` (L1-Vorschau) | a1.1-u03 |
| `a1.1-u04` | Was kostet das? | H1, H2, Sp3, L2 | `cd.a1.produkt-infos` · `cd.a1.preise` · `cd.a1.prospekt-preise` · `cd.a1.durchsage-geschaeft` · `cd.a1.gespraech-details` | `cd.a1.um-etwas-bitten` (Sp3-Vorschau) · `cd.a1.angebot-waehlen` | a1.1-u04 |
| `a1.1-u05` | Das brauche ich | Sp3, S2 (2 Leitpunkte) | `cd.a1.besitz-fragen` · `cd.a1.um-etwas-bitten` · `cd.a1.wort-fehlt` · `cd.a1.wort-pruefen` · `cd.a1.nachricht-anrede` | — | a1.1-u06 |
| `a1.1-u06` | Hier wohne ich | L2, L1 | `cd.a1.wohnort-beschreiben` · `cd.a1.wohnung-beschreiben` · `cd.a1.neuer-mieter` · `cd.a1.anzeigen-infos` · `cd.a1.angebot-waehlen` | `cd.a1.kurze-mitteilungen` | a1.1-u05 |
| `a1.1-u07` | Mein Tag | L3, H3 | `cd.a1.uhrzeit-tagesablauf` · `cd.a1.zeitangaben` · `cd.a1.oeffnungszeiten` · `cd.a1.ab-termin` | — | a1.1-u07 |
| `a1.1-u08` | Hast du am Samstag Zeit? | S2, Sp2, H3 | `cd.a1.verabreden` · `cd.a1.zeit-zusagen-absagen` · `cd.a1.gefallen` · `cd.a1.koennen-gern` | `cd.a1.fragen-thema` · `cd.a1.nachricht-anrede` · `cd.a1.ab-termin` | a1.1-u08 |
| `a1.1-u09` | Im Café | Sp3, H1 | `cd.a1.essen-vorlieben` · `cd.a1.ansprechen-bitten` · `cd.a1.speisekarte` · `cd.a1.bestellen-bezahlen` | `cd.a1.um-etwas-bitten` · `cd.a1.gespraech-details` | a1.1-u09 |
| `a1.1-u10` | Mit Bus und Bahn | H2, L3 | `cd.a1.fahrplan` · `cd.a1.fahrkarte-schalter` · `cd.a1.fahrkartenautomat` · `cd.a1.durchsage-bahnhof` · `cd.a1.platz-frei` | `cd.a1.oeffnungszeiten` | a1.1-u10 |
| `a1.1-u11` | Wie war dein Wochenende? | S2, L1, Sp2 | `cd.a1.wochenende-erzaehlen` · `cd.a1.zeitangaben-vergangen` · `cd.a1.kurze-mitteilungen` · `cd.a1.online-post` | `cd.a1.fragen-thema` · `cd.a1.nachricht-anrede` | a1.1-u11 |
| `a1.1-u12` | Deutsch lernen – mein Plan | Sp1, S1, H2, L3 → Halbtest | `cd.a1.vorstellung-sp1` · `cd.a1.herkunft-situation` · `cd.a1.lernziele` · `cd.a1.kurs-erfragen` · `cd.a1.anweisungen-kurs` | `cd.a1.glossar` · `cd.a1.formular-person` · `cd.a1.beruf-nennen` · `cd.a1.elternbrief-rueckmeldung` (Fokus DaZ, statt Kita-Anmeldung) | a1.1-u12 |
| `a1.2-u01` | Mein Arbeitsalltag | L1, Sp1, S1 | `cd.a1.arbeitsalltag` · `cd.a1.frueher-arbeit` · `cd.a1.frueher-war-hatte` · `cd.a1.arbeitsauftraege` · `cd.a1.dienstplan` | `cd.a1.stellenanzeigen` (Fokus Beruf / L2) · `cd.a1.koennen-gern` · `cd.a1.aussehen-charakter` · `cd.a1.kurze-mitteilungen` | a1.2-u02 + a1.2-u10 |
| `a1.2-u02` | Wie komme ich zum Rathaus? | L3, H1 | `cd.a1.weg-fragen` · `cd.a1.weg-folgen` · `cd.a1.wegweiser` · `cd.a1.aushang-hinweise` | `cd.a1.ansprechen-bitten` · `cd.a1.gespraech-details` | a1.2-u01 |
| `a1.2-u03` | Einen Termin machen | H3, S1 | `cd.a1.termin-vereinbaren` · `cd.a1.datum` · `cd.a1.sprachnachricht-verstehen` · `cd.a1.behoerde-internet` · `cd.a1.info-schalter` | `cd.a1.formular-hilfe` · `cd.a1.anweisungen-verstehen` · `cd.a1.formular-person` | a1.2-u04 (+ a1.2-u12 Datum) |
| `a1.2-u04` | Beim Arzt | Sp3, L3, H3 | `cd.a1.arzt-anmeldung` · `cd.a1.beschwerden` · `cd.a1.medikamente` · `cd.a1.anweisungen-verstehen` | `cd.a1.notruf` (Fokus) · `cd.a1.sprachnachricht-verstehen` | a1.2-u05 |
| `a1.2-u05` | Ich bin krank – ich sage ab | S2, H3, Sp3 | `cd.a1.krankmelden` · `cd.a1.absage-entschuldigung` · `cd.a1.mitteilungen-austauschen` | `cd.a1.kind-krankmelden` (Fokus DaZ) · `cd.a1.termin-vereinbaren` · `cd.a1.sprachnachricht-verstehen` | a1.2-u05 (Krankmeldung) + neu |
| `a1.2-u06` | Wohnung und Nachbarn | L2, L3, Sp1, Sp2 | `cd.a1.hausordnung` · `cd.a1.im-haus-regeln` · `cd.a1.vermieter-mitteilung` | `cd.a1.anzeigen-infos` · `cd.a1.neuer-mieter` · `cd.a1.aushang-hinweise` | a1.2-u03 |
| `a1.2-u07` | Die Jacke gefällt mir | Sp2, H1, H2 | `cd.a1.verkaufsgespraech` · `cd.a1.preisnachlass` · `cd.a1.kompliment` | `cd.a1.gefallen` · `cd.a1.durchsage-geschaeft` · `cd.a1.produkt-infos` | a1.2-u06 |
| `a1.2-u08` | Bahnhof und Flughafen | H2, L2 | `cd.a1.durchsage-reise` · `cd.a1.reise-erzaehlen` · `cd.a1.postkarte` · `cd.a1.foto-sprechen` | `cd.a1.anzeigen-infos` · `cd.a1.formular-person` (Hotel) · `cd.a1.fahrplan` | a1.2-u08 (+ a1.2-u10 Foto) |
| `a1.2-u09` | Kannst du mir helfen? | Sp3, L1 | `cd.a1.aufgaben-verteilen` · `cd.a1.nachbarn-hilfe` · `cd.a1.warnungen` | `cd.a1.kurze-mitteilungen` · `cd.a1.mitteilungen-austauschen` · `cd.a1.sprachnachricht-verstehen` | a1.2-u09 (+ a1.2-u03 Nachbarn) |
| `a1.2-u10` | Online bestellen | S1, H1, L1 | `cd.a1.online-bestellen` · `cd.a1.problem-melden` · `cd.a1.schalter-telefon-bitten` · `cd.a1.bestellt-bezahlt` · `cd.a1.ueberweisung` | `cd.a1.geldautomat` (Fokus Alltag) | a1.2-u07 + a1.2-u06 (Bestellformular) |
| `a1.2-u11` | Wetter und Wochenende | H1, H2, S2, L2, Sp2 | `cd.a1.wetter` · `cd.a1.vergleichen` · `cd.a1.besser-gefallen` · `cd.a1.veranstaltungen` · `cd.a1.einladung-antworten` | `cd.a1.handy-menue` · `cd.a1.aussehen-charakter` · `cd.a1.online-bestellen` (Ticket) | a1.2-u08 (Wetter) + a1.2-u10 + a1.2-u11 |
| `a1.2-u12` | Feste und Glückwünsche | Sp1–Sp3, S2 | `cd.a1.gratulieren` · `cd.a1.wuensche-danken` · `cd.a1.du-anbieten` · `cd.a1.feier-planen` | `cd.a1.einladung-antworten` · `cd.a1.datum` · `cd.a1.vorstellung-sp1` | a1.2-u12 |

## 3. sd1 coverage: every Start-Deutsch-1 Teil has can-dos in both halves

| Teil (sd1) | What it tests (lane file / memo 01) | A1.1 ids | A1.2 ids |
|---|---|---|---|
| H1 | number, price, time, place in short dialogues, 2× | `gespraech-details`, `preise`, `zahlen` | `weg-folgen`; `gespraech-details` as spiral in U2 |
| H2 | the instruction in a public announcement, **1×** | `durchsage-geschaeft`, `durchsage-bahnhof` | `durchsage-reise` |
| H3 | who/when/where/what to do on an answering machine, private and official | `ab-termin` | `sprachnachricht-verstehen`, `vermieter-mitteilung` |
| L1 | two short notes or e-mails, r/f | `kurze-mitteilungen` | `mitteilungen-austauschen` |
| L2 | need → the fitting ad or website (a/b) | `anzeigen-infos`, `angebot-waehlen`, `prospekt-preise`, `speisekarte` | `stellenanzeigen`, `behoerde-internet`, `veranstaltungen` |
| L3 | signs and notices, r/f | `oeffnungszeiten`, `fahrplan` | `aushang-hinweise`, `wegweiser`, `hausordnung` |
| S1 | 5 form fields from a situation text | `formular-person` | `dienstplan`, `online-bestellen`, `ueberweisung` |
| S2 | ≈ 30-word message, 3 Leitpunkte, Anrede/Gruß; apology, invitation, enquiry | `nachricht-anrede`, `kurs-erfragen`, `ueber-andere-schreiben`, `online-post` | `absage-entschuldigung`, `einladung-antworten`, `gratulieren`, `postkarte`, `krankmelden` |
| Sp1 | self-introduction from 7 keywords, spell, a number | `sich-vorstellen`, `vorstellung-sp1`, `buchstabieren`, `zahlen`, `beruf-nennen`, `sprachen-nennen` | `arbeitsalltag`, `frueher-arbeit` (the *früher* extension) |
| Sp2 | word card → ask (2 pts), answer (1 pt) | `fragen-thema`, `person-erfragen`, `besitz-fragen` | spiral of `fragen-thema` in U6, U7, U11, U12 |
| Sp3 | picture card → request (2 pts), react (1 pt) | `um-etwas-bitten`, `ansprechen-bitten`, `bestellen-bezahlen` | `aufgaben-verteilen`, `schalter-telefon-bitten`, `nachbarn-hilfe` |

(Ids above without the `cd.a1.` prefix for width.)

## 4. Ids added beyond the W2 plans, and why

| Id | Half | Reason |
|---|---|---|
| `cd.a1.gespraech-details` | a1.1 | **sd1 H1** — no draft line names the listening skill itself (numbers/prices/times/places in dialogue). |
| `cd.a1.durchsage-geschaeft` | a1.1 | **sd1 H2** — shop announcements; blueprint A1.1 U4 lists „Durchsagen im Laden“, and A1.2 U7 (Kaufhaus) reuses it. |
| `cd.a1.durchsage-reise` | a1.2 | **sd1 H2** full format (airport, U-Bahn, delays, platform changes). RC 143 places this at A2; the F5 precedence rule (memo 04 impl. 3, BLUEPRINT §2.2 rule 4) moves it to A1 because SD1 tests it. |
| `cd.a1.sprachnachricht-verstehen` | a1.2 | **sd1 H3** full format (official messages from a practice or office, *what to do*, not only day/time). Also takes the *Sprachnachrichten* half of draft a1.2-u09 line 4. |
| `cd.a1.angebot-waehlen` | a1.1 | **sd1 L2** — the Teil's operation (compare two offers against a need) had no can-do; the drafts only had „find information in an ad“. |
| `cd.a1.aushang-hinweise` | a1.2 | **sd1 L3** — rules and changes on notices („heute geschlossen“, „Eingang hinten“), beyond opening hours. |
| `cd.a1.nachricht-anrede` | a1.1 | **sd1 S2** — Anrede/Gruß and the du/Sie choice are the text-type criterion of every S2 task; scaffolded from U5 (2 Leitpunkte). |
| `cd.a1.kurs-erfragen` | a1.1 | **sd1 S2** *Anfrage* genre + blueprint A1.1 U12 „sich für einen Kurs anmelden“; tagged HF 4 because RC has no A1 goal in HF 4. |
| `cd.a1.absage-entschuldigung` | a1.2 | **sd1 S2** *Entschuldigung* genre + blueprint A1.2 U5 „sich entschuldigen und einen Grund nennen“ (RC 149·A1). |
| `cd.a1.fragen-thema` | a1.1 | **sd1 Sp2** — the Teil's core operation (question from a keyword) had no can-do; question forms earn 2 of 3 points. |
| `cd.a1.beruf-nennen` | a1.1 | **sd1 Sp1** keyword „Beruf“ (memo 04 A1.1 #2, GI-A1 15); not in any draft line. |
| `cd.a1.person-erfragen` | a1.1 | Blueprint A1.1 U1 „… nennen **und erfragen**“; the draft U1 had only the telling side. |
| `cd.a1.lernziele` | a1.1 | Blueprint A1.1 U12 „über Lernziele sprechen“. See open issue 2 (source tag). |
| `cd.a1.arbeitsalltag` | a1.2 | Blueprint A1.2 U1 „über die Arbeit sprechen“; the draft job unit had only *früher* and *gern tun*. |
| `cd.a1.reise-erzaehlen` | a1.2 | Blueprint A1.2 U8 „von einer Reise berichten“ (Perfekt mit *sein* milestone ≤ U8, GRM-03). |
| `cd.a1.problem-melden` | a1.2 | Blueprint A1.2 U10 „ein Problem melden“ (the draft's broken-phone scene had no can-do). See open issue 2. |
| `cd.a1.elternbrief-rueckmeldung` | a1.1 | Fokus-DaZ card for A1.1 U12 (blueprint: Kita-Anmeldung becomes a Fokus card). The verified A1 goal is RC 117 (return slips), not a Kita registration. HF 6. |
| `cd.a1.kind-krankmelden` | a1.2 | Fokus-DaZ card for A1.2 U5 (RC 117·A1, memo 04 reserve goal). HF 6. |

## 5. Merges: one id where two draft lines mean the same

| Id | Draft lines it takes |
|---|---|
| `cd.a1.um-etwas-bitten` | a1.1-u04 #3 (GI-A1 15) · a1.1-u06 #2 (GI-A1 15 + TB-A1 Sp3) — both are the Sp3 request/react pair |
| `cd.a1.formular-person` | a1.1-u02 #1 · a1.1-u12 #5 (course form) · a1.2-u08 #3 (hotel form) — personal data into a form |
| `cd.a1.anzeigen-infos` | a1.1-u05 #4 (flat ads) · a1.2-u08 #4 (holiday-flat ads) |
| `cd.a1.koennen-gern` | a1.1-u08 #4 · a1.2-u02 #1 — both RC 95·A1 |
| `cd.a1.ansprechen-bitten` | a1.1-u09 #2 (RC 55) · a1.2-u01 #4 (RC 55, adapted: ask a passer-by for help) |
| `cd.a1.online-bestellen` | a1.2-u06 #4 (clothes) · a1.2-u11 #3 (ticket) — both RC 125·A1 order forms |
| `cd.a1.kurze-mitteilungen` | a1.1-u11 #3 · the *Notizen* half of a1.2-u09 #4 (the *Sprachnachrichten* half → `sprachnachricht-verstehen`) |

Kept **separate** on purpose (same source, different performance): `gefallen` (RC 41, leisure) vs `essen-vorlieben`
(RC 42, food) vs `besser-gefallen` (comparison + reason); `zeitangaben` (present) vs `zeitangaben-vergangen`;
`familie-erzaehlen` vs `herkunft-situation` (both RC 30: family vs profession); `sich-vorstellen` (U1, three facts)
vs `vorstellung-sp1` (U12, the full seven-keyword Sp1 monologue); `personen-beschreiben` (who/age/job) vs
`aussehen-charakter`; `oeffnungszeiten` vs `wegweiser` vs `aushang-hinweise`; the four instruction can-dos
(`anweisungen-kurs` course, `arbeitsauftraege` work, `medikamente` doctor/pharmacy, `anweisungen-verstehen` counters).

## 6. W2 draft line → id (all 105 lines)

Draft unit ids here are the **W2 draft numbers** (`curriculum/a1-*.json`), not blueprint rows.

| Draft unit | # | Draft line (W2 wording, not for screen) | Registry id |
|---|---|---|---|
| `a1.1-u01` Freut mich! | 1 | Ich kann jemanden begrüßen und auf einen Gruß reagieren. | `cd.a1.begruessen` |
| `a1.1-u01`  | 2 | Ich kann mich mit einfachen Worten vorstellen: Name, Herkunft, Wohnort. | `cd.a1.sich-vorstellen` |
| `a1.1-u01`  | 3 | Ich kann sagen, welche Sprachen ich spreche. | `cd.a1.sprachen-nennen` |
| `a1.1-u01`  | 4 | Ich kann mich verabschieden und ein Gespräch einfach und höflich beenden. | `cd.a1.verabschieden` |
| `a1.1-u01`  | 5 | Ich kann online einfache Begrüßungs- und Abschiedsformeln benutzen. | `cd.a1.online-gruessen` |
| `a1.1-u02` Wie ist Ihre Telefonnummer? | 1 | Ich kann in Formulare persönliche Daten wie Name, Nationalität, Alter und Geburtsdatum eintragen. | `cd.a1.formular-person` |
| `a1.1-u02`  | 2 | Ich kann mit einfachen Worten auf einfache Fragen nach meinen persönlichen Daten antworten. | `cd.a1.daten-angeben` |
| `a1.1-u02`  | 3 | Ich kann buchstabierte Namen und Adressen verstehen und meinen Namen buchstabieren. | `cd.a1.buchstabieren` |
| `a1.1-u02`  | 4 | Ich komme mit Zahlen zurecht, z. B. mit Telefonnummern, Hausnummern und dem Alter. | `cd.a1.zahlen` |
| `a1.1-u02`  | 5 | Ich kann nachfragen und mit einfachen Worten um Wiederholung bitten, wenn ich etwas nicht verstanden habe. | `cd.a1.nachfragen` |
| `a1.1-u03` Das ist meine Familie | 1 | Ich kann einfache Wendungen und Sätze gebrauchen, um Leute zu beschreiben, die ich kenne. | `cd.a1.personen-beschreiben` |
| `a1.1-u03`  | 2 | Ich kann mit ganz einfachen Mitteln über meine Familie im Herkunftsland sprechen. | `cd.a1.familie-erzaehlen` |
| `a1.1-u03`  | 3 | Ich kann einfache Sätze über andere schreiben: wo sie leben und was sie tun. | `cd.a1.ueber-andere-schreiben` |
| `a1.1-u03`  | 4 | Ich kann jemanden fragen, wie es ihm geht, und auf die Frage nach meinem Befinden reagieren. | `cd.a1.befinden` |
| `a1.1-u04` Was kostet das? | 1 | Ich kann einfache Informationen zu Produkten erfragen und geben, z. B. Preise, Mengen und wo etwas steht. | `cd.a1.produkt-infos` |
| `a1.1-u04`  | 2 | Ich kann Zahlen und Preise verstehen und gut verständlich wiederholen. | `cd.a1.preise` |
| `a1.1-u04`  | 3 | Ich kann jemanden um etwas bitten und jemandem etwas geben. | `cd.a1.um-etwas-bitten` |
| `a1.1-u04`  | 4 | Ich kann Werbeanzeigen in Prospekten relevante Informationen entnehmen, z. B. Preise. | `cd.a1.prospekt-preise` |
| `a1.1-u05` Meine Wohnung | 1 | Ich kann einfache Wendungen und Sätze gebrauchen, um zu beschreiben, wo ich wohne. | `cd.a1.wohnort-beschreiben` |
| `a1.1-u05`  | 2 | Ich kann eine Wohnung und die Einrichtung beschreiben. | `cd.a1.wohnung-beschreiben` |
| `a1.1-u05`  | 3 | Ich kann mich bei den anderen Hausbewohnern als neuer Mieter vorstellen. | `cd.a1.neuer-mieter` |
| `a1.1-u05`  | 4 | Ich kann Anzeigen konkrete Informationen entnehmen, z. B. Zimmerzahl, Größe und Preis. | `cd.a1.anzeigen-infos` |
| `a1.1-u06` Ich brauche einen Laptop | 1 | Ich kann Fragen zu Dingen stellen, die man hat, und auf solche Fragen antworten. | `cd.a1.besitz-fragen` |
| `a1.1-u06`  | 2 | Ich kann Kolleginnen und Kollegen um einen Gegenstand bitten und reagieren, wenn mich jemand um etwas bittet. | `cd.a1.um-etwas-bitten` |
| `a1.1-u06`  | 3 | Ich kann sagen, dass ich nicht weiß, wie etwas auf Deutsch heißt, und mir mit Zeigen oder Umschreiben helfen. | `cd.a1.wort-fehlt` |
| `a1.1-u06`  | 4 | Ich kann nachfragen, ob ein Wort oder eine Formulierung richtig ist. | `cd.a1.wort-pruefen` |
| `a1.1-u07` Von morgens bis abends | 1 | Ich kann nach der Uhrzeit fragen und antworten und einen einfachen Tagesablauf beschreiben. | `cd.a1.uhrzeit-tagesablauf` |
| `a1.1-u07`  | 2 | Ich kann Zeitangaben machen, z. B. »am Montag«, »um drei Uhr«, »von neun bis fünf«. | `cd.a1.zeitangaben` |
| `a1.1-u07`  | 3 | Ich kann vertraute Wörter und ganz einfache Sätze auf Schildern verstehen, z. B. Öffnungszeiten. | `cd.a1.oeffnungszeiten` |
| `a1.1-u07`  | 4 | Ich kann einer einfachen Nachricht auf dem Anrufbeantworter Tag und Uhrzeit entnehmen. | `cd.a1.ab-termin` |
| `a1.1-u08` Hast du am Samstag Zeit? | 1 | Ich kann Freunde fragen, ob sie Zeit haben, gemeinsam etwas zu unternehmen. | `cd.a1.verabreden` |
| `a1.1-u08`  | 2 | Ich kann sagen, ob ich zu einem Termin Zeit habe oder dass ich keine Zeit habe. | `cd.a1.zeit-zusagen-absagen` |
| `a1.1-u08`  | 3 | Ich kann mit einfachen Worten sagen, was mir gefällt und was nicht, z. B. welche Musik ich gern höre. | `cd.a1.gefallen` |
| `a1.1-u08`  | 4 | Ich kann sagen, was ich gut kann und was ich gern mache. | `cd.a1.koennen-gern` |
| `a1.1-u09` Guten Appetit! | 1 | Ich kann mit einfachen Worten über Vorlieben und Abneigungen beim Essen und Trinken sprechen. | `cd.a1.essen-vorlieben` |
| `a1.1-u09`  | 2 | Ich kann jemanden ansprechen und mit einfachen Worten um konkrete, alltägliche Dinge bitten. | `cd.a1.ansprechen-bitten` |
| `a1.1-u09`  | 3 | Ich kann in einer Speisekarte konkrete Informationen finden, z. B. Gerichte und Preise. | `cd.a1.speisekarte` |
| `a1.1-u09`  | 4 | Ich kann im Café etwas bestellen und bezahlen. | `cd.a1.bestellen-bezahlen` |
| `a1.1-u10` Mit Bus und Bahn | 1 | Ich kann Fahrplänen relevante Informationen entnehmen, z. B. Abfahrtszeiten und Orte. | `cd.a1.fahrplan` |
| `a1.1-u10`  | 2 | Ich kann am Schalter Informationen erfragen und geben, die vor allem auf Zahlen basieren, z. B. Abfahrtszeiten und Preise. | `cd.a1.fahrkarte-schalter` |
| `a1.1-u10`  | 3 | Ich kann das Wesentliche von illustrierten Anleitungen an Fahrkartenautomaten verstehen. | `cd.a1.fahrkartenautomat` |
| `a1.1-u10`  | 4 | Ich kann einer einfachen Durchsage am Bahnhof die wichtigste Information entnehmen, z. B. das Gleis. | `cd.a1.durchsage-bahnhof` |
| `a1.1-u10`  | 5 | Ich kann Mitreisende fragen, ob ein Platz frei ist, und auf eine solche Frage reagieren. | `cd.a1.platz-frei` |
| `a1.1-u11` Wie war dein Wochenende? | 1 | Ich kann mit einfachen Worten über Vergangenes sprechen, z. B. über mein Wochenende. | `cd.a1.wochenende-erzaehlen` |
| `a1.1-u11`  | 2 | Ich kann Zeitangaben wie »gestern«, »letzten Freitag« oder »am Wochenende« machen. | `cd.a1.zeitangaben-vergangen` |
| `a1.1-u11`  | 3 | Ich kann sehr kurze, einfache Mitteilungen verstehen, z. B. Postkarten und E-Mails. | `cd.a1.kurze-mitteilungen` |
| `a1.1-u11`  | 4 | Ich kann kurze, einfache Online-Grüße posten und sagen, was ich getan habe und wie es mir gefallen hat. | `cd.a1.online-post` |
| `a1.1-u12` Deutsch und ich | 1 | Ich kann mich zusammenhängend vorstellen: Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby. | `cd.a1.vorstellung-sp1` |
| `a1.1-u12`  | 2 | Ich kann mit ganz einfachen Mitteln über mich und meine Situation im Herkunftsland sprechen, z. B. über den erlernten Beruf. | `cd.a1.herkunft-situation` |
| `a1.1-u12`  | 3 | Ich kann einfache mündliche und schriftliche Arbeitsanweisungen verstehen. | `cd.a1.anweisungen-kurs` |
| `a1.1-u12`  | 4 | Ich kann mir ein persönliches Glossar anlegen und Wörter nach Themen ordnen. | `cd.a1.glossar` |
| `a1.1-u12`  | 5 | Ich kann ein Anmeldeformular für einen Kurs ausfüllen. | `cd.a1.formular-person` |
| `a1.2-u01` Neu in der Stadt | 1 | Ich kann Passanten nach dem Weg fragen und das Wesentliche einer Wegbeschreibung verstehen. | `cd.a1.weg-fragen` |
| `a1.2-u01`  | 2 | Ich kann kurzen, einfachen mündlichen und schriftlichen Wegerklärungen folgen. | `cd.a1.weg-folgen` |
| `a1.2-u01`  | 3 | Ich kann einfache Schilder und Wegweiser in der Stadt verstehen. | `cd.a1.wegweiser` |
| `a1.2-u01`  | 4 | Ich kann jemanden auf der Straße höflich ansprechen und um Hilfe bitten. | `cd.a1.ansprechen-bitten` |
| `a1.2-u02` Mein neuer Job | 1 | Ich kann mitteilen, was ich besonders gut oder gern tue. | `cd.a1.koennen-gern` |
| `a1.2-u02`  | 2 | Ich kann das Wesentliche ganz einfacher Arbeitsaufträge verstehen und sagen, dass ich einen Auftrag verstanden habe. | `cd.a1.arbeitsauftraege` |
| `a1.2-u02`  | 3 | Ich kann Dienstpläne verstehen und einfache Stundenzettel ausfüllen. | `cd.a1.dienstplan` |
| `a1.2-u02`  | 4 | Ich kann die wichtigsten Informationen in Stellenanzeigen verstehen, z. B. den gesuchten Beruf. | `cd.a1.stellenanzeigen` |
| `a1.2-u02`  | 5 | Ich kann sagen, was ich früher gemacht habe und seit wann ich hier arbeite. | `cd.a1.frueher-arbeit` |
| `a1.2-u03` Liebe Nachbarn … | 1 | Ich kann die wichtigsten Informationen der Hausordnung verstehen, z. B. Ruhezeiten und Müll. | `cd.a1.hausordnung` |
| `a1.2-u03`  | 2 | Ich kann Nachbarn mit einfachen Worten um Hilfe bitten, z. B. ein Paket anzunehmen. | `cd.a1.nachbarn-hilfe` |
| `a1.2-u03`  | 3 | Ich kann, auch am Telefon, einfache Mitteilungen des Vermieters verstehen, z. B. wann der Handwerker kommt. | `cd.a1.vermieter-mitteilung` |
| `a1.2-u03`  | 4 | Ich kann sagen, was man im Haus darf und was man muss. | `cd.a1.im-haus-regeln` |
| `a1.2-u04` Ich brauche einen Termin | 1 | Ich kann dem Internet Adressen und Öffnungszeiten von Behörden entnehmen. | `cd.a1.behoerde-internet` |
| `a1.2-u04`  | 2 | Ich kann in einfacher Form einen Terminvorschlag machen und auf einen Terminvorschlag reagieren. | `cd.a1.termin-vereinbaren` |
| `a1.2-u04`  | 3 | Ich kann am Informationsschalter gezielt Auskünfte erfragen, z. B. nach dem richtigen Ansprechpartner. | `cd.a1.info-schalter` |
| `a1.2-u04`  | 4 | Ich kann Sachbearbeiter um Hilfe beim Ausfüllen eines Formulars bitten. | `cd.a1.formular-hilfe` |
| `a1.2-u04`  | 5 | Ich kann Anweisungen verstehen, die langsam und deutlich an mich gerichtet werden. | `cd.a1.anweisungen-verstehen` |
| `a1.2-u05` Gute Besserung! | 1 | Ich kann bei der Anmeldung beim Arzt Auskünfte zur Person geben, z. B. Name, Versicherung und Grund des Besuchs. | `cd.a1.arzt-anmeldung` |
| `a1.2-u05`  | 2 | Ich kann mitteilen, wie es mir geht, und – auch mit Gesten – beschreiben, was mir wehtut. | `cd.a1.beschwerden` |
| `a1.2-u05`  | 3 | Ich kann einfache Anweisungen von Ärzten oder Apothekern zur Einnahme von Medikamenten verstehen. | `cd.a1.medikamente` |
| `a1.2-u05`  | 4 | Ich kann mich mit einfachen Worten telefonisch und schriftlich krankmelden. | `cd.a1.krankmelden` |
| `a1.2-u05`  | 5 | Ich kann einen Notruf machen und die wichtigsten Informationen nennen, z. B. den Ort. | `cd.a1.notruf` |
| `a1.2-u06` Die Jacke gefällt mir! | 1 | Ich kann ein einfaches Verkaufsgespräch führen. | `cd.a1.verkaufsgespraech` |
| `a1.2-u06`  | 2 | Ich kann mit einfachen Worten fragen, ob es bei einer Ware einen Preisnachlass gibt. | `cd.a1.preisnachlass` |
| `a1.2-u06`  | 3 | Ich kann mit sehr einfachen Worten ein Kompliment machen, z. B. dass ein Kleidungsstück jemandem steht. | `cd.a1.kompliment` |
| `a1.2-u06`  | 4 | Ich kann im Internet etwas bestellen und in Bestellformulare Größe, Anzahl und Lieferadresse eingeben. | `cd.a1.online-bestellen` |
| `a1.2-u07` Kann ich Ihnen helfen? | 1 | Ich kann bei Geldautomaten die einfachsten Anweisungen verstehen und die erforderlichen Daten eingeben. | `cd.a1.geldautomat` |
| `a1.2-u07`  | 2 | Ich kann wichtige Formulare im Zahlungsverkehr ausfüllen, z. B. eine Überweisung. | `cd.a1.ueberweisung` |
| `a1.2-u07`  | 3 | Ich kann am Schalter oder am Telefon höflich um etwas bitten und einfache Rückfragen stellen. | `cd.a1.schalter-telefon-bitten` |
| `a1.2-u07`  | 4 | Ich kann sagen, was ich bestellt, bezahlt oder abgeholt habe. | `cd.a1.bestellt-bezahlt` |
| `a1.2-u08` Endlich Urlaub! | 1 | Ich kann über das Wetter sprechen. | `cd.a1.wetter` |
| `a1.2-u08`  | 2 | Ich kann eine kurze, einfache Postkarte schreiben, z. B. Feriengrüße. | `cd.a1.postkarte` |
| `a1.2-u08`  | 3 | Ich kann auf Formularen, z. B. im Hotel, Namen, Adresse und Nationalität eintragen. | `cd.a1.formular-person` |
| `a1.2-u08`  | 4 | Ich kann in Anzeigen und Prospekten konkrete Informationen finden, z. B. Preise und Zimmer. | `cd.a1.anzeigen-infos` |
| `a1.2-u08`  | 5 | Ich kann sagen, was mir besser gefällt, und einen Grund nennen. | `cd.a1.besser-gefallen` |
| `a1.2-u09` Wer macht was? | 1 | Ich kann Mitbewohnern oder Familienmitgliedern mit einfachen Worten Aufgaben geben und selbst um Hilfe bitten. | `cd.a1.aufgaben-verteilen` |
| `a1.2-u09`  | 2 | Ich kann in kurzen Mitteilungen Informationen aus dem Alltag erfragen oder weitergeben. | `cd.a1.mitteilungen-austauschen` |
| `a1.2-u09`  | 3 | Ich kann einfache mündliche Warnungen verstehen und andere zur Vorsicht auffordern. | `cd.a1.warnungen` |
| `a1.2-u09`  | 4 | Ich kann kurze Notizen und Sprachnachrichten verstehen, z. B. wer was einkaufen soll. | `cd.a1.kurze-mitteilungen` + `cd.a1.sprachnachricht-verstehen` |
| `a1.2-u10` Früher und heute | 1 | Ich kann das Aussehen und den Charakter von Menschen, die ich kenne, mit einfachen Worten beschreiben. | `cd.a1.aussehen-charakter` |
| `a1.2-u10`  | 2 | Ich kann mit einfachen Worten sagen, wer größer, älter oder jünger ist. | `cd.a1.vergleichen` |
| `a1.2-u10`  | 3 | Ich kann über ein Foto sprechen: Wer ist das? Wo sind die Personen? Was machen sie? | `cd.a1.foto-sprechen` |
| `a1.2-u10`  | 4 | Ich kann sagen, wie jemand früher war und was er früher hatte. | `cd.a1.frueher-war-hatte` |
| `a1.2-u11` Was ist los in der Stadt? | 1 | Ich kann Ankündigungen für Veranstaltungen wesentliche Informationen entnehmen, z. B. Beginn und Ort. | `cd.a1.veranstaltungen` |
| `a1.2-u11`  | 2 | Ich kann einfache Menüpunkte im Handy verstehen und einfache Anweisungen im Internet befolgen. | `cd.a1.handy-menue` |
| `a1.2-u11`  | 3 | Ich kann online ein Ticket bestellen und dabei Anzahl, Datum und Zahlungsart eingeben. | `cd.a1.online-bestellen` |
| `a1.2-u11`  | 4 | Ich kann eine Einladung annehmen oder absagen und einen Grund nennen. | `cd.a1.einladung-antworten` |
| `a1.2-u12` Herzlichen Glückwunsch! | 1 | Ich kann jemandem gratulieren, auch in einer E-Mail oder auf einer Karte. | `cd.a1.gratulieren` |
| `a1.2-u12`  | 2 | Ich kann gute Wünsche aussprechen und mich für Glückwünsche bedanken. | `cd.a1.wuensche-danken` |
| `a1.2-u12`  | 3 | Ich kann Bekannten das Du anbieten und reagieren, wenn man mir das Du anbietet. | `cd.a1.du-anbieten` |
| `a1.2-u12`  | 4 | Ich kann Daten verstehen und nennen, z. B. Geburtstage und Feiertage. | `cd.a1.datum` |
| `a1.2-u12`  | 5 | Ich kann mit Hilfe eine kleine Feier mitplanen: Vorschläge machen und sagen, was ich mitbringe. | `cd.a1.feier-planen` |

## 7. Registry index

Origin: *W2-Plan* = carries a draft line; *neu (sd1)* = added for the exam lane; *neu (Blueprint-Zeile)* = a Kern-Kann
of a §2.8 row the drafts miss; *neu (Fokus)* = Fokus-DaZ card. „Core in“ = the blueprint unit that lists it.

| Id | halfLevel | mode | hf | online | origin | core in |
|---|---|---|---|---|---|---|
| `cd.a1.begruessen` | a1.1 | interaction-spoken | D | — | W2-Plan | a1.1-u01 |
| `cd.a1.verabschieden` | a1.1 | interaction-spoken | D | — | W2-Plan | a1.1-u01 |
| `cd.a1.sich-vorstellen` | a1.1 | productive-spoken | D | — | W2-Plan | a1.1-u01 |
| `cd.a1.person-erfragen` | a1.1 | interaction-spoken | D | — | neu (Blueprint-Zeile) | a1.1-u01 |
| `cd.a1.sprachen-nennen` | a1.1 | productive-spoken | A, D | — | W2-Plan | a1.1-u01 |
| `cd.a1.online-gruessen` | a1.1 | interaction-written | D, 9, 11 | ja | W2-Plan | — |
| `cd.a1.buchstabieren` | a1.1 | interaction-spoken | 1, D | — | W2-Plan | a1.1-u02 |
| `cd.a1.zahlen` | a1.1 | interaction-spoken | 1, D | — | W2-Plan | a1.1-u02 |
| `cd.a1.formular-person` | a1.1 | productive-written | 1, 11, 10 | — | W2-Plan | a1.1-u02 |
| `cd.a1.daten-angeben` | a1.1 | interaction-spoken | 1 | — | W2-Plan | a1.1-u02 |
| `cd.a1.nachfragen` | a1.1 | interaction-spoken | A, 11 | — | W2-Plan | a1.1-u02 |
| `cd.a1.beruf-nennen` | a1.1 | productive-spoken | 2, D | — | neu (sd1) | — |
| `cd.a1.familie-erzaehlen` | a1.1 | productive-spoken | A, D | — | W2-Plan | a1.1-u03 |
| `cd.a1.personen-beschreiben` | a1.1 | productive-spoken | D | — | W2-Plan | a1.1-u03 |
| `cd.a1.befinden` | a1.1 | interaction-spoken | D | — | W2-Plan | a1.1-u03 |
| `cd.a1.ueber-andere-schreiben` | a1.1 | productive-written | D | — | W2-Plan | a1.1-u03 |
| `cd.a1.fragen-thema` | a1.1 | interaction-spoken | D | — | neu (sd1) | a1.1-u03 |
| `cd.a1.produkt-infos` | a1.1 | interaction-spoken | 7 | — | W2-Plan | a1.1-u04 |
| `cd.a1.preise` | a1.1 | receptive-spoken | 7 | — | W2-Plan | a1.1-u04 |
| `cd.a1.prospekt-preise` | a1.1 | receptive-written | 9, 7 | — | W2-Plan | a1.1-u04 |
| `cd.a1.durchsage-geschaeft` | a1.1 | receptive-spoken | 7 | — | neu (sd1) | a1.1-u04 |
| `cd.a1.gespraech-details` | a1.1 | receptive-spoken | 7, D | — | neu (sd1) | a1.1-u04 |
| `cd.a1.besitz-fragen` | a1.1 | interaction-spoken | 2, 11 | — | W2-Plan | a1.1-u05 |
| `cd.a1.um-etwas-bitten` | a1.1 | interaction-spoken | 2, 7, D | — | W2-Plan | a1.1-u05 |
| `cd.a1.wort-fehlt` | a1.1 | interaction-spoken | A, E | — | W2-Plan | a1.1-u05 |
| `cd.a1.wort-pruefen` | a1.1 | interaction-spoken | E, 11 | — | W2-Plan | a1.1-u05 |
| `cd.a1.nachricht-anrede` | a1.1 | productive-written | D, 11 | — | neu (sd1) | a1.1-u05 |
| `cd.a1.wohnort-beschreiben` | a1.1 | productive-spoken | 12 | — | W2-Plan | a1.1-u06 |
| `cd.a1.wohnung-beschreiben` | a1.1 | productive-spoken | 12 | — | W2-Plan | a1.1-u06 |
| `cd.a1.neuer-mieter` | a1.1 | interaction-spoken | 12, D | — | W2-Plan | a1.1-u06 |
| `cd.a1.anzeigen-infos` | a1.1 | receptive-written | 12, 7 | — | W2-Plan | a1.1-u06 |
| `cd.a1.angebot-waehlen` | a1.1 | receptive-written | 7, 9 | — | neu (sd1) | a1.1-u06 |
| `cd.a1.uhrzeit-tagesablauf` | a1.1 | productive-spoken | 2, D | — | W2-Plan | a1.1-u07 |
| `cd.a1.zeitangaben` | a1.1 | productive-spoken | D, 2 | — | W2-Plan | a1.1-u07 |
| `cd.a1.oeffnungszeiten` | a1.1 | receptive-written | 7, 1 | — | W2-Plan | a1.1-u07 |
| `cd.a1.ab-termin` | a1.1 | receptive-spoken | D, 2 | — | W2-Plan | a1.1-u07 |
| `cd.a1.verabreden` | a1.1 | interaction-spoken | D | — | W2-Plan | a1.1-u08 |
| `cd.a1.zeit-zusagen-absagen` | a1.1 | interaction-spoken | D | — | W2-Plan | a1.1-u08 |
| `cd.a1.gefallen` | a1.1 | productive-spoken | B, D | — | W2-Plan | a1.1-u08 |
| `cd.a1.koennen-gern` | a1.1 | productive-spoken | 3, D | — | W2-Plan | a1.1-u08 |
| `cd.a1.essen-vorlieben` | a1.1 | productive-spoken | B, 7 | — | W2-Plan | a1.1-u09 |
| `cd.a1.ansprechen-bitten` | a1.1 | interaction-spoken | D, 10 | — | W2-Plan | a1.1-u09 |
| `cd.a1.speisekarte` | a1.1 | receptive-written | 7 | — | W2-Plan | a1.1-u09 |
| `cd.a1.bestellen-bezahlen` | a1.1 | interaction-spoken | 7 | — | W2-Plan | a1.1-u09 |
| `cd.a1.fahrplan` | a1.1 | receptive-written | 10 | — | W2-Plan | a1.1-u10 |
| `cd.a1.fahrkarte-schalter` | a1.1 | interaction-spoken | 10 | — | W2-Plan | a1.1-u10 |
| `cd.a1.fahrkartenautomat` | a1.1 | receptive-written | 10 | — | W2-Plan | a1.1-u10 |
| `cd.a1.durchsage-bahnhof` | a1.1 | receptive-spoken | 10 | — | W2-Plan | a1.1-u10 |
| `cd.a1.platz-frei` | a1.1 | interaction-spoken | 10 | — | W2-Plan | a1.1-u10 |
| `cd.a1.wochenende-erzaehlen` | a1.1 | productive-spoken | D | — | W2-Plan | a1.1-u11 |
| `cd.a1.zeitangaben-vergangen` | a1.1 | productive-spoken | D | — | W2-Plan | a1.1-u11 |
| `cd.a1.kurze-mitteilungen` | a1.1 | receptive-written | D | — | W2-Plan | a1.1-u11 |
| `cd.a1.online-post` | a1.1 | interaction-written | 9, D | ja | W2-Plan | a1.1-u11 |
| `cd.a1.vorstellung-sp1` | a1.1 | productive-spoken | D, 11 | — | W2-Plan | a1.1-u12 |
| `cd.a1.herkunft-situation` | a1.1 | productive-spoken | A | — | W2-Plan | a1.1-u12 |
| `cd.a1.lernziele` | a1.1 | productive-spoken | E, A, 11 | — | neu (Blueprint-Zeile) | a1.1-u12 |
| `cd.a1.kurs-erfragen` | a1.1 | productive-written | 11, 4 | — | neu (sd1) | a1.1-u12 |
| `cd.a1.anweisungen-kurs` | a1.1 | receptive-written | 11 | — | W2-Plan | a1.1-u12 |
| `cd.a1.glossar` | a1.1 | productive-written | E | — | W2-Plan | — |
| `cd.a1.elternbrief-rueckmeldung` | a1.1 | productive-written | 6 | — | neu (Fokus) | — |
| `cd.a1.arbeitsalltag` | a1.2 | productive-spoken | 2 | — | neu (Blueprint-Zeile) | a1.2-u01 |
| `cd.a1.frueher-arbeit` | a1.2 | productive-spoken | 2, A | — | W2-Plan | a1.2-u01 |
| `cd.a1.frueher-war-hatte` | a1.2 | productive-spoken | D, A | — | W2-Plan | a1.2-u01 |
| `cd.a1.arbeitsauftraege` | a1.2 | interaction-spoken | 2 | — | W2-Plan | a1.2-u01 |
| `cd.a1.dienstplan` | a1.2 | productive-written | 2 | — | W2-Plan | a1.2-u01 |
| `cd.a1.stellenanzeigen` | a1.2 | receptive-written | 3 | — | W2-Plan | — |
| `cd.a1.aussehen-charakter` | a1.2 | productive-spoken | D | — | W2-Plan | — |
| `cd.a1.weg-fragen` | a1.2 | interaction-spoken | 10 | — | W2-Plan | a1.2-u02 |
| `cd.a1.weg-folgen` | a1.2 | receptive-spoken | 10 | — | W2-Plan | a1.2-u02 |
| `cd.a1.wegweiser` | a1.2 | receptive-written | 10, 1 | — | W2-Plan | a1.2-u02 |
| `cd.a1.aushang-hinweise` | a1.2 | receptive-written | 1, 7 | — | neu (sd1) | a1.2-u02 |
| `cd.a1.termin-vereinbaren` | a1.2 | interaction-spoken | 2, 8, 1 | — | W2-Plan | a1.2-u03 |
| `cd.a1.datum` | a1.2 | interaction-spoken | 1, D | — | W2-Plan | a1.2-u03 |
| `cd.a1.sprachnachricht-verstehen` | a1.2 | receptive-spoken | 8, 1, D | — | neu (sd1) | a1.2-u03 |
| `cd.a1.behoerde-internet` | a1.2 | receptive-written | 1, 9 | — | W2-Plan | a1.2-u03 |
| `cd.a1.info-schalter` | a1.2 | interaction-spoken | 1 | — | W2-Plan | a1.2-u03 |
| `cd.a1.formular-hilfe` | a1.2 | interaction-spoken | 1 | — | W2-Plan | — |
| `cd.a1.arzt-anmeldung` | a1.2 | interaction-spoken | 8 | — | W2-Plan | a1.2-u04 |
| `cd.a1.beschwerden` | a1.2 | productive-spoken | 8 | — | W2-Plan | a1.2-u04 |
| `cd.a1.medikamente` | a1.2 | receptive-spoken | 8 | — | W2-Plan | a1.2-u04 |
| `cd.a1.anweisungen-verstehen` | a1.2 | receptive-spoken | 1, 8 | — | W2-Plan | a1.2-u04 |
| `cd.a1.notruf` | a1.2 | interaction-spoken | 8 | — | W2-Plan | — |
| `cd.a1.krankmelden` | a1.2 | interaction-spoken | 2, 11 | — | W2-Plan | a1.2-u05 |
| `cd.a1.absage-entschuldigung` | a1.2 | productive-written | 11, 2, D | — | neu (sd1) | a1.2-u05 |
| `cd.a1.mitteilungen-austauschen` | a1.2 | interaction-written | D, 9, 12 | ja | W2-Plan | a1.2-u05 |
| `cd.a1.kind-krankmelden` | a1.2 | interaction-spoken | 6 | — | neu (Fokus) | — |
| `cd.a1.hausordnung` | a1.2 | receptive-written | 12 | — | W2-Plan | a1.2-u06 |
| `cd.a1.im-haus-regeln` | a1.2 | productive-spoken | 12 | — | W2-Plan | a1.2-u06 |
| `cd.a1.vermieter-mitteilung` | a1.2 | receptive-spoken | 12 | — | W2-Plan | a1.2-u06 |
| `cd.a1.verkaufsgespraech` | a1.2 | interaction-spoken | 7 | — | W2-Plan | a1.2-u07 |
| `cd.a1.preisnachlass` | a1.2 | interaction-spoken | 7 | — | W2-Plan | a1.2-u07 |
| `cd.a1.kompliment` | a1.2 | interaction-spoken | D | — | W2-Plan | a1.2-u07 |
| `cd.a1.durchsage-reise` | a1.2 | receptive-spoken | 10 | — | neu (sd1) | a1.2-u08 |
| `cd.a1.reise-erzaehlen` | a1.2 | productive-spoken | 10, D | — | neu (Blueprint-Zeile) | a1.2-u08 |
| `cd.a1.postkarte` | a1.2 | productive-written | D | — | W2-Plan | a1.2-u08 |
| `cd.a1.foto-sprechen` | a1.2 | productive-spoken | D | — | W2-Plan | a1.2-u08 |
| `cd.a1.aufgaben-verteilen` | a1.2 | interaction-spoken | 12, D | — | W2-Plan | a1.2-u09 |
| `cd.a1.nachbarn-hilfe` | a1.2 | interaction-spoken | 12, D | — | W2-Plan | a1.2-u09 |
| `cd.a1.warnungen` | a1.2 | interaction-spoken | 2, 12 | — | W2-Plan | a1.2-u09 |
| `cd.a1.online-bestellen` | a1.2 | interaction-written | 7, 9 | ja | W2-Plan | a1.2-u10 |
| `cd.a1.problem-melden` | a1.2 | interaction-spoken | 7 | — | neu (Blueprint-Zeile) | a1.2-u10 |
| `cd.a1.schalter-telefon-bitten` | a1.2 | interaction-spoken | 5, 7 | — | W2-Plan | a1.2-u10 |
| `cd.a1.bestellt-bezahlt` | a1.2 | productive-spoken | 7, 5 | — | W2-Plan | a1.2-u10 |
| `cd.a1.ueberweisung` | a1.2 | productive-written | 5 | — | W2-Plan | a1.2-u10 |
| `cd.a1.geldautomat` | a1.2 | receptive-written | 5 | — | W2-Plan | — |
| `cd.a1.wetter` | a1.2 | productive-spoken | D, 9 | — | W2-Plan | a1.2-u11 |
| `cd.a1.vergleichen` | a1.2 | productive-spoken | D | — | W2-Plan | a1.2-u11 |
| `cd.a1.besser-gefallen` | a1.2 | productive-spoken | B | — | W2-Plan | a1.2-u11 |
| `cd.a1.veranstaltungen` | a1.2 | receptive-written | 9 | — | W2-Plan | a1.2-u11 |
| `cd.a1.einladung-antworten` | a1.2 | interaction-written | D | — | W2-Plan | a1.2-u11 |
| `cd.a1.handy-menue` | a1.2 | receptive-written | 9 | — | W2-Plan | — |
| `cd.a1.gratulieren` | a1.2 | productive-written | D | — | W2-Plan | a1.2-u12 |
| `cd.a1.wuensche-danken` | a1.2 | interaction-spoken | D | — | W2-Plan | a1.2-u12 |
| `cd.a1.du-anbieten` | a1.2 | interaction-spoken | D | — | W2-Plan | a1.2-u12 |
| `cd.a1.feier-planen` | a1.2 | interaction-spoken | D | — | W2-Plan | a1.2-u12 |

## 8. Conventions used in the file

- **Wording.** Every `de` is our own ich-Form sentence in plain A1-near German. Measured 2026-09-27 (longest shared
  run of words, case and punctuation ignored, over all 115 `de` values):
  - **against memo 04 (the source descriptors): max 6 words** — no descriptor text is quoted.
  - **against the W2 draft lines (our own team's plan wording, itself derived from memo 04): max 14 words.** Two
    `de` values are identical to their draft line — `frueher-arbeit` (= draft a1.2-u02 #5) and `bestellt-bezahlt`
    (= a1.2-u07 #4) — and eight more share runs of 8–14 words: `gefallen` 14 (a1.1-u08 #3), `koennen-gern` 12
    (a1.1-u08 #4), `schalter-telefon-bitten` 12 (a1.2-u07 #3), `im-haus-regeln` 11 (draft a1.2-u03 #4),
    `besser-gefallen` 9, `um-etwas-bitten` 8, `ab-termin` 8, `feier-planen` 8. The draft lines are our text, so this
    is legally harmless; an earlier version of this note said no draft line was copied, which was inaccurate.
  Examples (`z. B. „Vorsicht, heiß!“`) are ours.
- **`halfLevel`** = the half-level where the can-do is first a core Lernziel. A1.2 units reuse A1.1 ids only in *more*.
- **`band`** = the CEFR level at which our course expects the performance. It is `A1` for every entry. Where a
  source places the descriptor elsewhere, the source tag keeps the original level and the reason is:
  - exam precedence (the target exam tests it at A1, memo 04 F5 / impl. 3): `bestellen-bezahlen` (RC 125·A2),
    `einladung-antworten` (RC 57·A2), `durchsage-reise` (RC 143·A2) — each carries a `TB-A1` tag naming the Teil;
  - reduced A1 form with support, from the Lehrwerk consensus: `vergleichen` (GER-M·A2+; Komparation in M22, S13,
    blueprint A1.2 U11) and `feier-planen` (GER-R·A2; „mit Hilfe“, a preview of Goethe A2 Sprechen 3);
  - below A1: `online-gruessen` (GER-E·vor A1).
- **`mode`** = the mode the unit's proof tests. A few descriptors name two channels („am Telefon oder in einer kurzen
  Nachricht"); the mode is the primary one (e.g. `krankmelden` = interaction-spoken; its written twin for S2 is
  `absage-entschuldigung`).
- **`online: true`** = an **online-interaction** can-do (the CEFR „Online-Interaktion“ scale, the item ALL-06 counts):
  mode `interaction-written` and performed in a digital medium by definition (chat, post, messenger, web order form).
  Shared rule with the A2/B1/B2 registries: a receptive can-do stays `false` even when its text is on a screen.
  A1: `online-gruessen`, `online-post`, `mitteilungen-austauschen`, `online-bestellen`. `false` although digital:
  `behoerde-internet` (reading a website) and `handy-menue` (reading app/web menus) — both receptive-written, set
  to `false` after the W2 review 2026-09-27; e-mails and paper-or-web reading tasks (`angebot-waehlen`) stay `false`.
- **`hf`** follows the RC page of the source (A pp. 29–38, B 39–46, D 53–60, E 61–74; HF 1–12
  pp. 75–157), plus the situation's field where the course uses it elsewhere. Registry coverage: HF 1–12 and A, B, D, E
  all occur; **C (Konflikte) does not** (the RC's four C goals at A1 need no A1 unit; ALL-04 counts HF 1–12 only).
- **Source tags** (memo 04 §Method unless noted):

  | Tag | Document |
  |---|---|
  | `RC p·Lvl` | BAMF Rahmencurriculum für Integrationskurse, revision 2016, page · level the RC assigns |
  | `GI-A1 p` | Goethe-Zertifikat A1: Start Deutsch 1, Prüfungsziele/Testbeschreibung, 4th ed. 2022, Kannbeschreibungen pp. 14–17 |
  | `TB-A1 <Teil>` | the same document's Teil description (memo 01 tag): H pp. 27, L pp. 32–34, S pp. 37–38, Sp pp. 44–52 — used where the exam Teil itself is the reason for the can-do |
  | `GER-R·Lvl`, `GER-M·Lvl`, `GER-E·vor A1` | GER Begleitband 2020: Anhang 2 (self-assessment grid), Anhang 1 (key features), Anhang 8 (supplementary descriptors) |
  | `PD/RC p·A1` | Profile deutsch Kannbeschreibungen as reprinted in RC Anhang 1 |
  | `ÖIF p` | ÖIF Rahmencurriculum für A1-Kurse |
  | `MS-ZA1 Sp2` | ÖSD Zertifikat A1 Modellsatz, Sprechen (photo description) — memo 01 §2; a format source, not a lane (ZA1 is deferred) |
  | `M22`, `S13` | Lehrwerk placement (Menschen A1 L22, Schritte plus Neu L13), BLUEPRINT §2.2 key |

## 9. Open issues

1. **Blueprint vs W2 draft order.** §2 follows BLUEPRINT §2.8. If a level curriculum agent keeps a draft situation that
   the blueprint row does not have (draft a1.2-u10 „Früher und heute“, a1.2-u11 „Was ist los in der Stadt?“), its
   can-dos are already placed on U1/U8/U11 here; a logged `deviation` must keep each id core in exactly one unit.
2. **Weak source tags (DaF reviewer to confirm):** `lernziele` (RC 30·A1 by extension — no verified RC goal for
   „say why I learn German“), `problem-melden` (GI-A1 15 „um etwas bitten“ by extension), `arbeitsalltag`
   (GI-A1 15 + ÖIF 6 by extension), `foto-sprechen` (an ÖSD format source; no CEFR A1 descriptor for photo
   description was checked). `TB-A1` and `GI-A1` are one document; the page ranges above come from memo 01 and the
   sd1 lane file, not from a new read of the PDF.
3. **`band` semantics.** The schema does not say whether `band` is the source level or the course level. This file
   uses the course level (all `A1`) and keeps the source level in the tag; if the validator or the DaF review wants
   the source level, five entries change (`bestellen-bezahlen`, `einladung-antworten`, `durchsage-reise` → A2;
   `vergleichen` → A2+; `feier-planen` → A2).
4. **Fokus-DaZ Kita card.** The blueprint names a Kita-Anmeldung card for A1.1 U12; no A1 RC goal for a Kita
   registration was found, so the card should use `elternbrief-rueckmeldung` (RC 117) or be written as a form task
   under `formular-person`.
5. **Checks run.** `node scripts/course-v2/check.mjs content/course-v2/registries/cando/a1.json` → 0 errors
   (SCH-01 against `scripts/course-v2/lib/schemas/cando.mjs`), re-run 2026-09-27 after the W2 review fixes (A1.2 U2/U3
   rows swapped to match BLUEPRINT §2.8, `online` set to `false` on `behoerde-internet` and `handy-menue`).
   `node scripts/course-v2/validate.mjs a1.1|a1.2` now exists and reports 0 blockers, all 38 rules skipped (no unit
   content yet);
   a scratch script additionally checked every draft line's mapping and the §1 rules for §2 (3–5 core, ≥ 1
   productive/interaction core, each id core once, online-interaction quota per half-level, every id placed on a row).
   ALL-02/ALL-06 proper run on the units once they exist.
