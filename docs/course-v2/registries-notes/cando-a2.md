# Can-do registry A2 — notes (unit id → can-do ids)

**Date:** 2026-09-27 · **Owner (sole writer):** cando-a2 · **Registry:** [`content/course-v2/registries/cando/a2.json`](../../../content/course-v2/registries/cando/a2.json) (SCHEMA §4.1, `course-v2/cando@1`) ·
**Status:** W2 draft, before the W2 DaF review and the registry freeze (BLUEPRINT §10.3).
**Inputs:** SCHEMA §2, §4.1, §8, §15.1; BLUEPRINT §2.2, §2.8 (A2 rows), §9 (ALL-02, ALL-06, REF-01), §10.3;
[`curriculum/a2-1.json`](../curriculum/a2-1.json) + [`a2-2.json`](../curriculum/a2-2.json) (continuity pass of 2026-09-27);
research [04](../research/04-cando-a1-a2.md) (can-do inventory and source tags), [14](../research/14-lehrwerke-curricula.md) (placement),
[01](../research/01-exams-a1-a2.md) §3 + §7 (Goethe A2 Teile); `registries/lanes/ga2.json` (Teil ids, page references).

## 1. What the registry holds

| Group | Items | What it is |
|---|---|---|
| Draft lines | 81 | every can-do line of `a2-1.json` (40) and `a2-2.json` (41), one id each, reworded (§2) |
| ga2 lane | 28 | Goethe-Zertifikat A2 Prüfungsziele that no draft line covers, or productive can-dos the unit's writing/speaking Aufgabe needs to prove (ALL-02); each suggested for one draft unit |
| Quota | 1 | the A2.2 online-interaction can-do ALL-06 needs (`cd.a2.gruppenchat-absprechen`) |
| Reserve | 7 | memo-04 A2 goals no draft unit uses yet (DaZ/Kita, Notruf, Aushang …) — so a swap or Fokus-Karte never has to invent an id |
| **Total** | **117** | halfLevel a2.1: 56 · a2.2: 61 (reserve counted as a2.2) |

Every id is used by exactly one draft unit (placement 1:1), except the reserve. No id is shared between units, so
„Das kann ich" lists stay distinct and a „can-dos confirmed" count never double-counts. Secondary lanes (ta2, dtz) are
deferred (lean execution, 2026-09-27): no can-do was added for telc A2 or DTZ formats; the draft lines that name them are
mapped like any other line.

## 2. Conventions

- **Wording.** `de` is our own ich-Form sentence. The W2 drafts copy the source wording with only the person changed
  (a2-1.md header), so **every draft line was rewritten**, not transcribed. A scripted check compared each `de` against
  every draft line and every ich-Form line of memo 04: after the shared „Ich kann" the longest common word run is
  **4 words** (collocations such as „wie es mir geht", „und einen Kompromiss finden"); nothing reaches 5. The only
  exceptions are the four ids of SCHEMA §15.1 (¹ in the tables), whose wording the SCHEMA fixes and which are kept verbatim
  from there. Examples were made concrete for our situations (e.g. *Bankkarte sperren lassen* for RC 112's generic loss
  report); the function and level of the source are unchanged. Lernziele are addressed to the learner in ich-Form; the
  learner-facing unit title (`title.canDo`) stays in Sie (SCHEMA §8).
- **Ids.** `cd.a2.<slug>`, German slug, ASCII-folded (ä → ae, ß → ss), naming the function, not the unit number, so an id
  survives a unit move. A meaning change takes a new id (SCHEMA §0.3).
- **halfLevel** = the level of the unit that uses it; a ga2 addition takes the level of the unit it is suggested for.
- **band** = the CEFR band of the descriptor as its primary source tags it: **A2** by default; **A2+** only where the source
  is an A2+ descriptor (GER-M·A2+, GI-HB 34·A2+): `gespraech-in-gang-halten`, `dinge-beschreiben-vergleichen`,
  `zusammenhaengend-schreiben`, `leben-erzaehlen`. The RC tags only „A2", so RC goals placed in A2.2 stay A2 (memo 04,
  Unverified 1: the A2.1/A2.2 split of RC goals is an inference).
- **mode.** Hören/Lesen → `receptive-*`; a monologue or a description (Sprechen Teil 2 type) → `productive-spoken`;
  e-mails, SMS, letters, notes, CV → `productive-written` (the SCHEMA §15.1 precedent: `termin-absagen-mail`);
  dialogue, reacting, arranging → `interaction-spoken`; chat, posts, online orders and forms → `interaction-written`.
  No A2 line is mediation; `mediation` is `false` throughout (the SCHEMA example keeps `rueckruf-weitergeben` false, and
  ALL-06 asks for mediation only from B1.1).
- **hf** = BAMF Handlungsfeld(er) (1–12, A–E) of the RC page the line comes from, plus the unit's field where it differs.
  Cross-cutting areas by memo 04's page ranges (A 29–38, B 39–46, C 47–52, D 53–60, E 61–74); Handlungsfelder by the
  pages memo 04 cites for them (1 Ämter 76–77, 2 Arbeit 82–89, 3 Arbeitssuche 94–100, 5 Banken 110–112, 6 Kinder 117–119,
  7 Einkaufen 124–126, 8 Gesundheit 130–134, 9 Medien 138–139, 10 Mobilität 142–145, 11 Unterricht 148–149, 12 Wohnen
  154–157). Hence RC 89 (written directions) carries 2 besides the unit's 10, and RC 149 (sharing out tasks) carries 11
  besides 2. Non-RC sources take the unit's field.
- **source** keeps memo 04's tags: `RC n·A2`, `GER-R·A2`, `GER-M·A2+`, `GI-A2F n`, `PD/RC 161·A2`, `GI-HB 34·A2+`.
  ga2 additions cite **`US-A2 <Teil>`** — the Goethe-Zertifikat A2 Übungssatz (Prüfungsziel per Teil, overview p. 3; pages
  per Teil as in `lanes/ga2.json`), with the Teil in BLUEPRINT §2.8 notation (L1–L4, H1–H4, S1–S2, Sp1–Sp3), e.g.
  `US-A2 S2` = Schreiben Teil 2 as in SCHEMA §15.1 — plus `GER-R·A2` where the CEFR self-assessment grid names the same
  skill. The memo-04 inventory position and the draft's full tag are in the tables below, not in the JSON (unknown keys
  are an error there). Source tags stay in the data and never reach the screen (memo 04 implication 7).
- **online** = the can-do is defined by a digital channel: `fehlermeldungen-verstehen`, `online-bestellen`,
  `online-reagieren` (A2.1); `gruppenchat-absprechen`, `angebote-zuordnen`, `notiz-hinterlassen` (A2.2).

## 3. Unit id → can-do ids

The unit ids are those of the W2 drafts (`a2-1.json`, `a2-2.json`). Column 3 is the unit's draft can-do list, mapped
1:1 in line order. Column 4 lists the ga2 additions suggested for the unit (the Teil in parentheses); a unit spec takes
them as far as the ALL-02 limit of 5 allows — every row below stays at ≤ 5. Where a curriculum agent re-slots units onto
the BLUEPRINT §2.8 rows (§7), the ids move with their situation.

### A2.1

| Unit (draft) | Titel | `spec.canDos` from the draft lines, in line order | + ga2 / quota (suggested) | n |
|---|---|---|---|---|
| `a2.1-u01` | Kontakte knüpfen: Smalltalk bei der Arbeit | `cd.a2.ueber-mich-austauschen`<br>`cd.a2.kontakt-smalltalk`<br>`cd.a2.erlebnis-berichten`<br>`cd.a2.saetze-verbinden-weil` | `cd.a2.fragen-zur-person` (Sp1) | 5 |
| `a2.1-u02` | Eine Wohnung finden und einrichten | `cd.a2.wohnungsanzeigen-verstehen`<br>`cd.a2.besichtigung-vereinbaren`<br>`cd.a2.besichtigung-verstehen`<br>`cd.a2.wohnsituation-beschreiben` | `cd.a2.mail-an-vermieterin` (S2) | 5 |
| `a2.1-u03` | Immer online? Handy, Internet, Nachrichten | `cd.a2.fehlermeldungen-verstehen`<br>`cd.a2.kurzmeldung-mit-zahlen`<br>`cd.a2.gefallen-begruenden` | `cd.a2.nachricht-handyproblem` (S1)<br>`cd.a2.radiointerview-alltag` (H4) | 5 |
| `a2.1-u04` | Einkaufen: fragen, vergleichen, bestellen | `cd.a2.produktinfos-erfragen`<br>`cd.a2.online-bestellen`<br>`cd.a2.alltagsdinge-bewerten` | `cd.a2.wegweiser-nutzen` (L2)<br>`cd.a2.kurze-gespraeche-verstehen` (H3) | 5 |
| `a2.1-u05` | Essen gehen: reservieren, bestellen, bezahlen | `cd.a2.im-restaurant-bestellen`<br>`cd.a2.tisch-reservieren`<br>`cd.a2.bedienung-fragen-bezahlen` | `cd.a2.mail-an-restaurant` (S2)<br>`cd.a2.ueber-essengehen-erzaehlen` (Sp2) | 5 |
| `a2.1-u06` | Mit der Bahn unterwegs | `cd.a2.durchsagen-verstehen`<br>`cd.a2.zugreise-buchen`<br>`cd.a2.fahrplan-lesen`<br>`cd.a2.am-bahnhof-fragen` | `cd.a2.ankunft-mitteilen` (S1) | 5 |
| `a2.1-u07` | Im Verein: mitmachen und Termine abstimmen | `cd.a2.aktivitaet-vorschlagen`<br>`cd.a2.freizeit-absagen`<br>`cd.a2.alltagstexte-durchsuchen` | `cd.a2.gespraech-wochentage-folgen` (H2)<br>`cd.a2.vorschlag-ablehnen-schriftlich` (S1) | 5 |
| `a2.1-u08` | Im Job: Telefon, Mailbox, Termine | `cd.a2.mailbox-verstehen`<br>`cd.a2.rueckruf-weitergeben`<br>`cd.a2.arbeit-erzaehlen` | `cd.a2.termin-absagen-mail` (S2) | 4 |
| `a2.1-u09` | Gesund bleiben: beim Arzt und im Alltag | `cd.a2.beim-arzt-auskunft-geben`<br>`cd.a2.behandlung-verstehen`<br>`cd.a2.gesundheitstipps-geben` | `cd.a2.mail-an-chefin-krank` (S2)<br>`cd.a2.ratgeber-verstehen` (L1) | 5 |
| `a2.1-u10` | Gute und schlechte Nachrichten: Gefühle zeigen | `cd.a2.freude-zeigen`<br>`cd.a2.mitgefuehl-zeigen`<br>`cd.a2.online-reagieren` | `cd.a2.persoenliche-mail-verstehen` (L3)<br>`cd.a2.brief-gefuehle-hilfe` (S1) | 5 |
| `a2.1-u11` | Schulzeit und Ausbildung: hier und dort | `cd.a2.leben-hier-und-dort`<br>`cd.a2.vergangenes-aufschreiben`<br>`cd.a2.ausbildung-beschreiben` | — | 3 |
| `a2.1-u12` | Feste feiern, Geschenke machen | `cd.a2.zur-feier-einladen`<br>`cd.a2.einladung-beantworten`<br>`cd.a2.zum-fest-verabreden`<br>`cd.a2.dank-oder-entschuldigung-schreiben` | — | 4 |

### A2.2

| Unit (draft) | Titel | `spec.canDos` from the draft lines, in line order | + ga2 / quota (suggested) | n |
|---|---|---|---|---|
| `a2.2-u01` | Deutsch lernen: meine Sprachbiografie | `cd.a2.meine-sprachen`<br>`cd.a2.gespraech-in-gang-halten`<br>`cd.a2.im-gespraech-nachfragen` | `cd.a2.mail-an-sprachschule` (S2)<br>`cd.a2.zeitungsartikel-verstehen` (L1) | 5 |
| `a2.2-u02` | Wünsche, Träume, Sorgen | `cd.a2.ziele-nennen`<br>`cd.a2.hoffnungen-aeussern`<br>`cd.a2.sorgen-aussprechen` | `cd.a2.wochenendwunsch-nachricht` (S1)<br>`cd.a2.laengere-mail-verstehen` (L3) | 5 |
| `a2.2-u03` | Im Hotel: höflich nachfragen | `cd.a2.hotelzimmer-reservieren`<br>`cd.a2.nach-gruenden-fragen`<br>`cd.a2.themenwechsel-folgen` | `cd.a2.mail-an-hotel` (S2)<br>`cd.a2.ueber-reisen-erzaehlen` (Sp2) | 5 |
| `a2.2-u04` | Ein Ausflug: Wege und Zwischenfälle | `cd.a2.weg-erklaeren`<br>`cd.a2.wegbeschreibung-schreiben`<br>`cd.a2.ausflug-mitplanen`<br>`cd.a2.unfall-melden` | `cd.a2.gruppenchat-absprechen` (ALL-06) | 5 |
| `a2.2-u05` | Tarife und Verträge: vergleichen und kündigen | `cd.a2.vertrag-kuendigen`<br>`cd.a2.dinge-beschreiben-vergleichen`<br>`cd.a2.hoeflich-widersprechen` | `cd.a2.angebote-zuordnen` (L4) | 4 |
| `a2.2-u06` | Probleme in der Wohnung | `cd.a2.schaden-melden`<br>`cd.a2.nachbarn-vorwarnen`<br>`cd.a2.mietvertrag-verstehen` | `cd.a2.mail-an-hausverwaltung` (S2)<br>`cd.a2.reparaturtermin-abstimmen` (Sp3) | 5 |
| `a2.2-u07` | Post von Amt, Bank und Versicherung | `cd.a2.behoerdenbrief-verstehen`<br>`cd.a2.am-amt-nachfragen`<br>`cd.a2.karte-verloren-melden`<br>`cd.a2.versicherungsbrief-verstehen`<br>`cd.a2.um-erklaerung-bitten` | — | 5 |
| `a2.2-u08` | Wetter und Umwelt: Was tun wir? | `cd.a2.radiomeldungen-verstehen`<br>`cd.a2.meinung-alltag-deutschland`<br>`cd.a2.einigung-vorschlagen` | — | 3 |
| `a2.2-u09` | Mein Weg: Schule, Ausbildung, Lebenslauf | `cd.a2.schulen-und-abschluesse`<br>`cd.a2.berufserfahrung-erzaehlen`<br>`cd.a2.lebenslauf-schreiben` | `cd.a2.wochenbericht-folgen` (H2) | 4 |
| `a2.2-u10` | Bewerbung und Vorstellungsgespräch | `cd.a2.bewerbungsgespraech-motivation`<br>`cd.a2.arbeitsbedingungen-klaeren`<br>`cd.a2.arbeitsvertrag-verstehen` | `cd.a2.mail-auf-stellenanzeige` (S2)<br>`cd.a2.interview-beruf-verstehen` (H4) | 5 |
| `a2.2-u11` | Im Job: Abläufe und Absprachen | `cd.a2.arbeitsablaeufe-erklaeren`<br>`cd.a2.arbeitsstand-absprechen`<br>`cd.a2.notiz-hinterlassen`<br>`cd.a2.urlaubsantrag-ausfuellen`<br>`cd.a2.aufgaben-verteilen` | — | 5 |
| `a2.2-u12` | Lebensstationen: meine Geschichte erzählen | `cd.a2.zusammenhaengend-schreiben`<br>`cd.a2.der-reihe-nach-erzaehlen`<br>`cd.a2.leben-erzaehlen` | — | 3 |

## 4. Draft line → id (with the draft's source tag)

`Line` = unit·line number in the draft's `canDo` array. ¹ = wording fixed by SCHEMA §15.1.

### A2.1

| Line | id | Mode | Band | HF | Source tag(s) | Draft tag (W2 file) |
|---|---|---|---|---|---|---|
| u01·1 | `cd.a2.ueber-mich-austauschen` | Interaktion mdl. | A2 | D, A | RC 56·A2 | 04-cando-a1-a2 (A2.1 #1) · RC 56·A2 |
| u01·2 | `cd.a2.kontakt-smalltalk` | Interaktion mdl. | A2 | D | GER-R·A2 | 04-cando-a1-a2 (A2.1 #1) · GER-R·A2 (Begleitband Anh. 2) |
| u01·3 | `cd.a2.erlebnis-berichten` | Sprechen (zus.) | A2 | D, A | GI-A2F 16 | 04-cando-a1-a2 (A2.1 #13) · GI-A2F 16 |
| u01·4 | `cd.a2.saetze-verbinden-weil` | Schreiben | A2 | D | GER-R·A2 | 04-cando-a1-a2 (A2.1 #13) · GER-R·A2 (Begleitband Anh. 2) |
| u02·1 | `cd.a2.wohnungsanzeigen-verstehen` | Lesen | A2 | 12 | RC 154·A2 | 04-cando-a1-a2 (A2.1 #8) · RC 154·A2 |
| u02·2 | `cd.a2.besichtigung-vereinbaren` | Interaktion mdl. | A2 | 12 | RC 155·A2 | 04-cando-a1-a2 (A2.1 #8) · RC 155·A2 |
| u02·3 | `cd.a2.besichtigung-verstehen` | Hören | A2 | 12 | RC 155·A2 | 04-cando-a1-a2 (A2.1 #8) · RC 155·A2 |
| u02·4 | `cd.a2.wohnsituation-beschreiben` | Sprechen (zus.) | A2 | 12 | GER-R·A2 | 04-cando-a1-a2 (A2.1 #1) · GER-R·A2 (gekürzt) |
| u03·1 | `cd.a2.fehlermeldungen-verstehen` | Lesen | A2 | 9 | RC 139·A2 | 04-cando-a1-a2 (A2.1 #10) · RC 139·A2 |
| u03·2 | `cd.a2.kurzmeldung-mit-zahlen` | Lesen | A2 | 9 | RC 138·A2 | 04-cando-a1-a2 (A2.1 #10) · RC 138·A2 |
| u03·3 | `cd.a2.gefallen-begruenden` | Sprechen (zus.) | A2 | 9, B | GI-A2F 16 | 04-cando-a1-a2 (A2.1 #3) · GI-A2F 16 |
| u04·1 | `cd.a2.produktinfos-erfragen` | Interaktion mdl. | A2 | 7 | RC 124·A2 | 04-cando-a1-a2 (A2.1 #4) · RC 124·A2 |
| u04·2 | `cd.a2.online-bestellen` | Interaktion schr. | A2 | 7 | GER-R·A2 | 04-cando-a1-a2 (A2.1 #4) · GER-R·A2 (Online-Interaktion) |
| u04·3 | `cd.a2.alltagsdinge-bewerten` | Sprechen (zus.) | A2 | 7, B | RC 43·A2 | 04-cando-a1-a2 (A2.1 #4) · RC 43·A2 |
| u05·1 | `cd.a2.im-restaurant-bestellen` | Interaktion mdl. | A2 | 7 | RC 125·A2 | 04-cando-a1-a2 (A2.1 #5) · RC 125·A2 |
| u05·2 | `cd.a2.tisch-reservieren` | Interaktion mdl. | A2 | 7 | RC 125·A2 | 04-cando-a1-a2 (A2.1 #5) · RC 125·A2 (gekürzt; Hotelzimmer in A2.2 E3) |
| u05·3 | `cd.a2.bedienung-fragen-bezahlen` | Interaktion mdl. | A2 | 7 | RC 126·A2 | 04-cando-a1-a2 (A2.1 #5) · RC 126·A2 |
| u06·1 | `cd.a2.durchsagen-verstehen` | Hören | A2 | 10 | RC 143·A2 | 04-cando-a1-a2 (A2.1 #6) · RC 143·A2 |
| u06·2 | `cd.a2.zugreise-buchen` | Interaktion mdl. | A2 | 10 | RC 144·A2 | 04-cando-a1-a2 (A2.1 #6) · RC 144·A2 |
| u06·3 | `cd.a2.fahrplan-lesen` | Lesen | A2 | 10 | RC 142·A2 | 04-cando-a1-a2 (A2.1 #6) · RC 142·A2 |
| u06·4 | `cd.a2.am-bahnhof-fragen` | Interaktion mdl. | A2 | 10 | RC 143·A2 | 04-cando-a1-a2 (A2.1 #7) · RC 143·A2 |
| u07·1 | `cd.a2.aktivitaet-vorschlagen` | Interaktion mdl. | A2 | D | GI-A2F 16 | 04-cando-a1-a2 (A2.1 #3) · GI-A2F 16 |
| u07·2 | `cd.a2.freizeit-absagen` | Interaktion mdl. | A2 | D | RC 58·A2 | 04-cando-a1-a2 (A2.1 #3) · RC 58·A2 |
| u07·3 | `cd.a2.alltagstexte-durchsuchen` | Lesen | A2 | D | GER-R·A2 | 04-cando-a1-a2 (F5) · GER-R·A2 (Begleitband Anh. 2, S. 3) |
| u08·1 | `cd.a2.mailbox-verstehen` ¹ | Hören | A2 | 2 | GI-A2F 17 | 04-cando-a1-a2 (A2.1 #14) · GI-A2F 17 |
| u08·2 | `cd.a2.rueckruf-weitergeben` ¹ | Interaktion mdl. | A2 | 2 | RC 84·A2 | 04-cando-a1-a2 (A2.1 #14) · RC 84·A2 |
| u08·3 | `cd.a2.arbeit-erzaehlen` ¹ | Interaktion mdl. | A2 | 2 | GER-R·A2 | 04-cando-a1-a2 (A2.1 #1) · GER-R·A2 (gekürzt) |
| u09·1 | `cd.a2.beim-arzt-auskunft-geben` | Interaktion mdl. | A2 | 8 | RC 131·A2 | 04-cando-a1-a2 (A2.1 #9) · RC 131·A2 |
| u09·2 | `cd.a2.behandlung-verstehen` | Interaktion mdl. | A2 | 8 | RC 131·A2 | 04-cando-a1-a2 (A2.1 #9) · RC 131·A2 |
| u09·3 | `cd.a2.gesundheitstipps-geben` | Sprechen (zus.) | A2 | 8 | RC 133·A2 | 04-cando-a1-a2 (A2.1 #9) · RC 133·A2 |
| u10·1 | `cd.a2.freude-zeigen` | Interaktion mdl. | A2 | B | RC 40·A2 | 04-cando-a1-a2 (A2.1 #11) · RC 40·A2 |
| u10·2 | `cd.a2.mitgefuehl-zeigen` | Interaktion mdl. | A2 | B, D | RC 40·A2; RC 59·A2 | 04-cando-a1-a2 (A2.1 #11) · RC 40, 59·A2 |
| u10·3 | `cd.a2.online-reagieren` | Interaktion schr. | A2 | B, D | GER-R·A2 | 04-cando-a1-a2 (A2.1 #11) · GER-R·A2 (Online-Interaktion) |
| u11·1 | `cd.a2.leben-hier-und-dort` | Sprechen (zus.) | A2 | A, 4 | RC 30·A2 | 04-cando-a1-a2 (A2.1 #12) · RC 30·A2 |
| u11·2 | `cd.a2.vergangenes-aufschreiben` | Schreiben | A2 | 4 | GI-A2F 17 | 04-cando-a1-a2 (A2.1 #13) · GI-A2F 17 |
| u11·3 | `cd.a2.ausbildung-beschreiben` | Sprechen (zus.) | A2 | 4 | GER-R·A2 | 04-cando-a1-a2 (A2.1 #1) · GER-R·A2 (gekürzt) |
| u12·1 | `cd.a2.zur-feier-einladen` | Schreiben | A2 | D | RC 57·A2 | 04-cando-a1-a2 (A2.1 #2) · RC 57·A2 |
| u12·2 | `cd.a2.einladung-beantworten` | Interaktion schr. | A2 | D | RC 57·A2 | 04-cando-a1-a2 (A2.1 #2) · RC 57·A2 |
| u12·3 | `cd.a2.zum-fest-verabreden` | Interaktion mdl. | A2 | D | RC 57·A2 | 04-cando-a1-a2 (A2.1 #2) · RC 57·A2 |
| u12·4 | `cd.a2.dank-oder-entschuldigung-schreiben` | Schreiben | A2 | D | GI-A2F 16 | 04-cando-a1-a2 (A2.1 #14) · GI-A2F 16 |

### A2.2

| Line | id | Mode | Band | HF | Source tag(s) | Draft tag (W2 file) |
|---|---|---|---|---|---|---|
| u01·1 | `cd.a2.meine-sprachen` | Sprechen (zus.) | A2 | A, E | RC 36·A2 | 04-cando-a1-a2 (A2.1 #12, nach A2.2 verschoben) · RC 36·A2 |
| u01·2 | `cd.a2.gespraech-in-gang-halten` | Interaktion mdl. | A2+ | D | PD/RC 161·A2; GER-M·A2+ | 04-cando-a1-a2 (A2.2 #1) · PD/RC 161·A2; GER-M·A2+ |
| u01·3 | `cd.a2.im-gespraech-nachfragen` | Interaktion mdl. | A2 | D | GER-R·A2 | 04-cando-a1-a2 (A2.2 #1) · GER-R·A2 (Begleitband Anh. 2) |
| u02·1 | `cd.a2.ziele-nennen` | Sprechen (zus.) | A2 | 3, B | RC 95·A2 | 04-cando-a1-a2 (A2.2 #3) · RC 95·A2 |
| u02·2 | `cd.a2.hoffnungen-aeussern` | Sprechen (zus.) | A2 | B | RC 41·A2 | 04-cando-a1-a2 (A2.2 #3) · RC 41·A2 |
| u02·3 | `cd.a2.sorgen-aussprechen` | Interaktion mdl. | A2 | B | RC 41·A2 | 04-cando-a1-a2 (A2.2 #3) · RC 41·A2 |
| u03·1 | `cd.a2.hotelzimmer-reservieren` | Interaktion mdl. | A2 | 10, 7 | RC 125·A2 | 04-cando-a1-a2 (A2.1 #5) · RC 125·A2 (gekürzt; Tisch in A2.1 E5) |
| u03·2 | `cd.a2.nach-gruenden-fragen` | Interaktion mdl. | A2 | C, 10 | RC 49·A2 | 04-cando-a1-a2 (A2.2 #11) · RC 49·A2 |
| u03·3 | `cd.a2.themenwechsel-folgen` | Interaktion mdl. | A2 | D, 10 | PD/RC 161·A2 | 04-cando-a1-a2 (A2.2 #1) · PD/RC 161·A2 |
| u04·1 | `cd.a2.weg-erklaeren` | Interaktion mdl. | A2 | 10 | RC 145·A2 | 04-cando-a1-a2 (A2.1 #7, nach A2.2 verschoben) · RC 145·A2 |
| u04·2 | `cd.a2.wegbeschreibung-schreiben` | Schreiben | A2 | 10, 2 | RC 89·A2 | 04-cando-a1-a2 (A2.1 #7, nach A2.2 verschoben) · RC 89·A2 |
| u04·3 | `cd.a2.ausflug-mitplanen` | Interaktion mdl. | A2 | D, 10 | GER-R·A2 | 04-cando-a1-a2 (A2.2 #2) · GER-R·A2 (Begleitband Anh. 2) |
| u04·4 | `cd.a2.unfall-melden` | Interaktion mdl. | A2 | 8, 10, 2 | RC 84·A2; RC 144·A2 | 04-cando-a1-a2 (A2.2 #13) · RC 84, 144·A2 |
| u05·1 | `cd.a2.vertrag-kuendigen` | Schreiben | A2 | 7, 5 | RC 125·A2 | 04-cando-a1-a2 (A2.2 #11) · RC 125·A2 |
| u05·2 | `cd.a2.dinge-beschreiben-vergleichen` | Sprechen (zus.) | A2+ | 7 | GER-M·A2+; GI-A2F 16 | 04-cando-a1-a2 (A2.2 #14) · GER-M·A2+; GI-A2F 16 |
| u05·3 | `cd.a2.hoeflich-widersprechen` | Interaktion mdl. | A2 | C | RC 48·A2 | 04-cando-a1-a2 (A2.2 #11) · RC 48·A2 |
| u06·1 | `cd.a2.schaden-melden` | Interaktion mdl. | A2 | 12 | RC 156·A2 | 04-cando-a1-a2 (A2.2 #8) · RC 156·A2 |
| u06·2 | `cd.a2.nachbarn-vorwarnen` | Interaktion mdl. | A2 | 12 | RC 157·A2 | 04-cando-a1-a2 (A2.2 #8) · RC 157·A2 |
| u06·3 | `cd.a2.mietvertrag-verstehen` | Lesen | A2 | 12 | RC 155·A2 | 04-cando-a1-a2 (A2.2 #7) · RC 155·A2 |
| u07·1 | `cd.a2.behoerdenbrief-verstehen` | Lesen | A2 | 1 | RC 76·A2 | 04-cando-a1-a2 (A2.2 #9) · RC 76·A2 |
| u07·2 | `cd.a2.am-amt-nachfragen` | Interaktion mdl. | A2 | 1 | RC 77·A2 | 04-cando-a1-a2 (A2.2 #9) · RC 77·A2 |
| u07·3 | `cd.a2.karte-verloren-melden` | Interaktion mdl. | A2 | 5 | RC 112·A2 | 04-cando-a1-a2 (A2.2 #10) · RC 112·A2 |
| u07·4 | `cd.a2.versicherungsbrief-verstehen` | Lesen | A2 | 5 | RC 111·A2 | 04-cando-a1-a2 (A2.2 #10) · RC 111·A2 |
| u07·5 | `cd.a2.um-erklaerung-bitten` | Interaktion mdl. | A2 | A, 1 | RC 34·A2 | 04-cando-a1-a2 (A2.2 #9) · RC 34·A2 |
| u08·1 | `cd.a2.radiomeldungen-verstehen` | Hören | A2 | 9 | RC 138·A2 | 04-cando-a1-a2 (A2.1 #10, nach A2.2 verschoben) · RC 138·A2 |
| u08·2 | `cd.a2.meinung-alltag-deutschland` | Sprechen (zus.) | A2 | A | RC 31·A2 | ≈ 04-cando-a1-a2 (A2.1 #12) · RC 31·A2 (Beispiel angepasst) |
| u08·3 | `cd.a2.einigung-vorschlagen` | Interaktion mdl. | A2 | D, C | GER-R·A2 | 04-cando-a1-a2 (A2.2 #2) · GER-R·A2 (Begleitband Anh. 2) |
| u09·1 | `cd.a2.schulen-und-abschluesse` | Sprechen (zus.) | A2 | 3, 4 | RC 94·A2 | 04-cando-a1-a2 (A2.2 #4) · RC 94·A2 |
| u09·2 | `cd.a2.berufserfahrung-erzaehlen` | Sprechen (zus.) | A2 | 3 | RC 94·A2 | 04-cando-a1-a2 (A2.2 #4) · RC 94·A2 |
| u09·3 | `cd.a2.lebenslauf-schreiben` | Schreiben | A2 | 3 | RC 99·A2 | 04-cando-a1-a2 (A2.2 #4) · RC 99·A2 |
| u10·1 | `cd.a2.bewerbungsgespraech-motivation` | Interaktion mdl. | A2 | 3 | RC 100·A2 | 04-cando-a1-a2 (A2.2 #5) · RC 100·A2 |
| u10·2 | `cd.a2.arbeitsbedingungen-klaeren` | Interaktion mdl. | A2 | 3 | RC 100·A2 | 04-cando-a1-a2 (A2.2 #5) · RC 100·A2 |
| u10·3 | `cd.a2.arbeitsvertrag-verstehen` | Lesen | A2 | 2, 3 | RC 87·A2 | 04-cando-a1-a2 (A2.2 #7) · RC 87·A2 |
| u11·1 | `cd.a2.arbeitsablaeufe-erklaeren` | Sprechen (zus.) | A2 | 2 | RC 82·A2 | 04-cando-a1-a2 (A2.2 #6) · RC 82·A2 |
| u11·2 | `cd.a2.arbeitsstand-absprechen` | Interaktion mdl. | A2 | 2 | RC 85·A2 | 04-cando-a1-a2 (A2.2 #6) · RC 85·A2 |
| u11·3 | `cd.a2.notiz-hinterlassen` | Schreiben | A2 | 2 | RC 84·A2 | 04-cando-a1-a2 (A2.2 #6) · RC 84·A2 |
| u11·4 | `cd.a2.urlaubsantrag-ausfuellen` | Interaktion schr. | A2 | 2 | RC 88·A2 | 04-cando-a1-a2 (A2.2 #7) · RC 88·A2 |
| u11·5 | `cd.a2.aufgaben-verteilen` | Interaktion mdl. | A2 | 2, 11 | RC 149·A2 | 04-cando-a1-a2 (A2.2 #2) · RC 149·A2 |
| u12·1 | `cd.a2.zusammenhaengend-schreiben` | Schreiben | A2+ | A, D | GI-HB 34·A2+ | 04-cando-a1-a2 (A2.2 #14) · GI-HB 34·A2+ |
| u12·2 | `cd.a2.der-reihe-nach-erzaehlen` | Sprechen (zus.) | A2 | A, D | PD/RC 161·A2 | 04-cando-a1-a2 (A2.2 #14) · PD/RC 161·A2 |
| u12·3 | `cd.a2.leben-erzaehlen` | Sprechen (zus.) | A2+ | A, D | GER-M·A2+ | 04-cando-a1-a2 (A2.2 #14) · GER-M·A2+ |

## 5. What lane ga2 needs

### 5.1 The additions

| id | halfLevel · unit | Teil | Mode | Source tag(s) | Why the lane needs it |
|---|---|---|---|---|---|
| `cd.a2.fragen-zur-person` | a2.1 · u01 | Sp1 | Interaktion mdl. | US-A2 Sp1 | Sp1 tests forming a question from a word card; draft line 1 covers the exchange of information, not the card step |
| `cd.a2.mail-an-vermieterin` | a2.1 · u02 | S2 | Schreiben | US-A2 S2 | the unit’s writing Aufgabe (S2) proves no draft can-do |
| `cd.a2.nachricht-handyproblem` | a2.1 · u03 | S1 | Schreiben | US-A2 S1 | the unit’s S1 SMS proves no draft can-do |
| `cd.a2.radiointerview-alltag` | a2.1 · u03 | H4 | Hören | US-A2 H4; GER-R·A2 | first H4 (radio interview, Ja/Nein) of the band; no draft line is about interviews |
| `cd.a2.wegweiser-nutzen` | a2.1 · u04 | L2 | Lesen | US-A2 L2; GER-R·A2 | L2 (directory/information board, „andere …“ option) had no draft line |
| `cd.a2.kurze-gespraeche-verstehen` | a2.1 · u04 | H3 | Hören | US-A2 H3; GER-R·A2 | H3 (five short everyday dialogues, heard once) had no draft line |
| `cd.a2.mail-an-restaurant` | a2.1 · u05 | S2 | Schreiben | US-A2 S2 | the unit’s S2 e-mail proves no draft can-do (all three are spoken) |
| `cd.a2.ueber-essengehen-erzaehlen` | a2.1 · u05 | Sp2 | Sprechen (zus.) | US-A2 Sp2 | the unit’s Sp2 task card proves no draft can-do |
| `cd.a2.ankunft-mitteilen` | a2.1 · u06 | S1 | Schreiben | US-A2 S1 | the unit’s S1 SMS proves no draft can-do |
| `cd.a2.gespraech-wochentage-folgen` | a2.1 · u07 | H2 | Hören | US-A2 H2; GER-R·A2 | H2 (one long conversation → day/picture matching) had no draft line |
| `cd.a2.vorschlag-ablehnen-schriftlich` | a2.1 · u07 | S1 | Schreiben | US-A2 S1 | the unit’s S1 message proves no draft can-do (the draft lines are spoken or receptive) |
| `cd.a2.termin-absagen-mail` ¹ | a2.1 · u08 | S2 | Schreiben | US-A2 S2 | fixed by SCHEMA §15.1 (the E1 fixture’s S2 Aufgabe) |
| `cd.a2.mail-an-chefin-krank` | a2.1 · u09 | S2 | Schreiben | US-A2 S2 | the unit’s S2 e-mail proves no draft can-do |
| `cd.a2.ratgeber-verstehen` | a2.1 · u09 | L1 | Lesen | US-A2 L1; GER-R·A2 | L1 at article length (the draft L1 line is a short numeric report only) |
| `cd.a2.persoenliche-mail-verstehen` | a2.1 · u10 | L3 | Lesen | US-A2 L3; GER-R·A2 | L3 (personal e-mail, ≈ 260 words) had no draft line |
| `cd.a2.brief-gefuehle-hilfe` | a2.1 · u10 | S1 | Schreiben | US-A2 S1; GER-R·A2 | the unit’s writing (a letter to a friend, telc S2 in the draft) proves no draft can-do; its ga2 equivalent is an S1 message |
| `cd.a2.mail-an-sprachschule` | a2.2 · u01 | S2 | Schreiben | US-A2 S2 | the unit’s S2 e-mail proves no draft can-do |
| `cd.a2.zeitungsartikel-verstehen` | a2.2 · u01 | L1 | Lesen | US-A2 L1; GER-R·A2 | L1 at full official length (≈ 190–220 words) in A2.2 |
| `cd.a2.wochenendwunsch-nachricht` | a2.2 · u02 | S1 | Schreiben | US-A2 S1 | the unit’s S1 SMS proves no draft can-do |
| `cd.a2.laengere-mail-verstehen` | a2.2 · u02 | L3 | Lesen | US-A2 L3; GER-R·A2 | L3 at full official length in A2.2 |
| `cd.a2.mail-an-hotel` | a2.2 · u03 | S2 | Schreiben | US-A2 S2 | the unit’s S2 e-mail proves no draft can-do |
| `cd.a2.ueber-reisen-erzaehlen` | a2.2 · u03 | Sp2 | Sprechen (zus.) | US-A2 Sp2 | the unit’s Sp2 task card proves no draft can-do |
| `cd.a2.angebote-zuordnen` | a2.2 · u05 | L4 | Lesen | US-A2 L4; GER-R·A2 | L4 with the no-match option (X) in A2.2; the A2.1 L4 line is flat ads only |
| `cd.a2.mail-an-hausverwaltung` | a2.2 · u06 | S2 | Schreiben | US-A2 S2 | the unit’s S2 e-mail; draft line 1 is spoken („auch telefonisch“) |
| `cd.a2.reparaturtermin-abstimmen` | a2.2 · u06 | Sp3 | Interaktion mdl. | US-A2 Sp3 | the unit’s Sp3 (two diaries) proves no draft can-do |
| `cd.a2.wochenbericht-folgen` | a2.2 · u09 | H2 | Hören | US-A2 H2; GER-R·A2 | H2 in A2.2 (the draft lines of the unit are all productive) |
| `cd.a2.mail-auf-stellenanzeige` | a2.2 · u10 | S2 | Schreiben | US-A2 S2 | the unit’s S2 e-mail proves no draft can-do (draft lines are the interview) |
| `cd.a2.interview-beruf-verstehen` | a2.2 · u10 | H4 | Hören | US-A2 H4; GER-R·A2 | H4 at full length in A2.2 |

### 5.2 ga2 Teil → can-dos that train it

Only placed ids are listed (draft lines and suggested additions), with the draft unit that carries them.

| ga2 Teil | Template | A2.1 | A2.2 |
|---|---|---|---|
| L1 | `ga2.l1` | `cd.a2.kurzmeldung-mit-zahlen` (A2.1 E3)<br>`cd.a2.ratgeber-verstehen` (A2.1 E9) | `cd.a2.zeitungsartikel-verstehen` (A2.2 E1) |
| L2 | `ga2.l2` | `cd.a2.wegweiser-nutzen` (A2.1 E4)<br>`cd.a2.alltagstexte-durchsuchen` (A2.1 E7) | — (see §6) |
| L3 | `ga2.l3` | `cd.a2.persoenliche-mail-verstehen` (A2.1 E10) | `cd.a2.laengere-mail-verstehen` (A2.2 E2) |
| L4 | `ga2.l4` | `cd.a2.wohnungsanzeigen-verstehen` (A2.1 E2) | `cd.a2.angebote-zuordnen` (A2.2 E5) |
| H1 | `ga2.h1` | `cd.a2.durchsagen-verstehen` (A2.1 E6)<br>`cd.a2.mailbox-verstehen` (A2.1 E8) | `cd.a2.radiomeldungen-verstehen` (A2.2 E8) |
| H2 | `ga2.h2` | `cd.a2.gespraech-wochentage-folgen` (A2.1 E7) | `cd.a2.wochenbericht-folgen` (A2.2 E9) |
| H3 | `ga2.h3` | `cd.a2.kurze-gespraeche-verstehen` (A2.1 E4) | — (see §6) |
| H4 | `ga2.h4` | `cd.a2.radiointerview-alltag` (A2.1 E3) | `cd.a2.interview-beruf-verstehen` (A2.2 E10) |
| S1 | `ga2.s1` | `cd.a2.saetze-verbinden-weil` (A2.1 E1)<br>`cd.a2.nachricht-handyproblem` (A2.1 E3)<br>`cd.a2.ankunft-mitteilen` (A2.1 E6)<br>`cd.a2.vorschlag-ablehnen-schriftlich` (A2.1 E7)<br>`cd.a2.brief-gefuehle-hilfe` (A2.1 E10)<br>`cd.a2.zur-feier-einladen` (A2.1 E12) | `cd.a2.wochenendwunsch-nachricht` (A2.2 E2)<br>`cd.a2.wegbeschreibung-schreiben` (A2.2 E4) |
| S2 | `ga2.s2` | `cd.a2.mail-an-vermieterin` (A2.1 E2)<br>`cd.a2.mail-an-restaurant` (A2.1 E5)<br>`cd.a2.termin-absagen-mail` (A2.1 E8)<br>`cd.a2.mail-an-chefin-krank` (A2.1 E9) | `cd.a2.mail-an-sprachschule` (A2.2 E1)<br>`cd.a2.mail-an-hotel` (A2.2 E3)<br>`cd.a2.vertrag-kuendigen` (A2.2 E5)<br>`cd.a2.mail-an-hausverwaltung` (A2.2 E6)<br>`cd.a2.mail-auf-stellenanzeige` (A2.2 E10) |
| Sp1 | `ga2.sp1` | `cd.a2.ueber-mich-austauschen` (A2.1 E1)<br>`cd.a2.fragen-zur-person` (A2.1 E1)<br>`cd.a2.arbeit-erzaehlen` (A2.1 E8) | `cd.a2.meine-sprachen` (A2.2 E1)<br>`cd.a2.bewerbungsgespraech-motivation` (A2.2 E10) |
| Sp2 | `ga2.sp2` | `cd.a2.gefallen-begruenden` (A2.1 E3)<br>`cd.a2.ueber-essengehen-erzaehlen` (A2.1 E5)<br>`cd.a2.gesundheitstipps-geben` (A2.1 E9)<br>`cd.a2.ausbildung-beschreiben` (A2.1 E11) | `cd.a2.ueber-reisen-erzaehlen` (A2.2 E3)<br>`cd.a2.dinge-beschreiben-vergleichen` (A2.2 E5)<br>`cd.a2.schulen-und-abschluesse` (A2.2 E9)<br>`cd.a2.leben-erzaehlen` (A2.2 E12) |
| Sp3 | `ga2.sp3` | `cd.a2.aktivitaet-vorschlagen` (A2.1 E7)<br>`cd.a2.zum-fest-verabreden` (A2.1 E12) | `cd.a2.ausflug-mitplanen` (A2.2 E4)<br>`cd.a2.reparaturtermin-abstimmen` (A2.2 E6)<br>`cd.a2.aufgaben-verteilen` (A2.2 E11)<br>`cd.a2.einigung-vorschlagen` (A2.2 E8) |

Every Teil of the Goethe-Zertifikat A2 has at least one can-do in A2.1; in A2.2 every Teil but **L2** and **H3** has one of
its own (see §6, item 3). The can-do layer is not the coverage gate: COV-1…COV-5 count LS4 blocks and Aufgaben against the
Teil templates of `lanes/ga2.json`, not can-dos.

### 5.3 Reserve (no unit yet)

| id | Mode | HF | Source | Fits |
|---|---|---|---|---|
| `cd.a2.aushang-hilfe-anbieten` | Schreiben | 3 | RC 98·A2 | A2.2 E10 (Bewerbung) or a DaZ Fokus-Karte; memo 04 A2.2 #5 |
| `cd.a2.neue-adresse-mitteilen` | Schreiben | 12 | RC 156·A2 | A2.2 E6 Fokus or a swap in E7; memo 04 A2.2 #8 |
| `cd.a2.aenderungen-melden` | Schreiben | 5, 8 | RC 111·A2; RC 134·A2 | **A2.2 E7** — the productive-written line that unit lacks (see §6); memo 04 A2.2 #10 |
| `cd.a2.elternabend-verstehen` | Hören | 6 | RC 118·A2 | HF 6 (Kinder) is Fokus-only in both A2 drafts; memo 04 A2.2 #12 |
| `cd.a2.entschuldigung-fuer-kind` | Schreiben | 6 | RC 119·A2 | as above |
| `cd.a2.nach-dem-kind-fragen` | Interaktion mdl. | 6 | RC 119·A2 | as above |
| `cd.a2.notruf-anweisungen-folgen` | Hören | 8 | RC 132·A2 | A2.2 E4 (Zwischenfall) or its Fokus-Karte; memo 04 A2.2 #13 |

## 6. Gate notes for the curriculum agents

1. **ALL-06 (≥ 1 online-interaction can-do per half-level).** A2.1: `online-bestellen` (E4) and `online-reagieren` (E10),
   both draft lines. A2.2 has **no** online-interaction draft line; `cd.a2.gruppenchat-absprechen` exists for it and is
   suggested for E4 (the Ausflug SMS to friends is a group message). If E4 does not take it, another A2.2 unit must, or
   ALL-06 fails for A2.2.
2. **ALL-02 (≥ 1 productive can-do proven by an Aufgabe).** Every unit has a `productive-*` can-do once the suggested
   additions are taken, **except A2.2 E7** (Post von Amt, Bank und Versicherung): its five draft lines are two receptive and
   three spoken-interaction can-dos, and the unit is already at five. If the validator reads „productive" as
   `productive-*`, swap draft line 5 (`um-erklaerung-bitten`, RC 34, a strategy line) for the reserve
   `cd.a2.aenderungen-melden` (RC 111/134, written, same situation), or let the Aufgabe prove `karte-verloren-melden`
   if interaction counts. Decide the reading of „productive" once for all bands (open issue 1).
3. **ga2 L2 and H3 in A2.2** have no can-do of their own: the units whose Prüfungsfokus names them (E3 Hotel, E7 Amt, E11
   Job) are at five. They are trained in LS4 without a separate Lernziel, which the gates allow. If a slot frees up, ask the
   registry owner for an A2.2 twin rather than reusing the A2.1 id, so placement stays 1:1.
4. **E8 of A2.1 = the SCHEMA fixture.** Its four ids (`mailbox-verstehen`, `rueckruf-weitergeben`, `arbeit-erzaehlen`,
   `termin-absagen-mail`) are exactly SCHEMA §15.1's, so the fixture resolves against this registry unchanged. The fixture
   calls the unit `a2.1-u07` (BLUEPRINT row 7); the draft calls it `a2.1-u08` (§7).
5. **Reserve ids are not placed.** If a checker ever flags registry ids that no unit uses, the reserve (§5.3) is the
   expected finding; it stays unless the W2 DaF reviewer says otherwise.

## 7. Draft units vs BLUEPRINT §2.8 rows

BLUEPRINT §2.8 lets the curriculum agent carry the W2 draft's can-dos onto its rows. The two orders differ; ids follow their
situation, so this is the lookup:

| BLUEPRINT row | A2.1 draft unit | | BLUEPRINT row | A2.2 draft unit |
|---|---|---|---|---|
| 1 Neu hier: Kontakte knüpfen | E1 | | 1 Sprachen lernen | E1 |
| 2 Die neue Wohnung | E2 | | 2 Wir planen einen Ausflug | E4 line 3 (`ausflug-mitplanen`), E8 line 3 (`einigung-vorschlagen`) — no draft unit |
| 3 Kommst du zu meiner Feier? | E12 | | 3 Im Hotel | E3 |
| 4 Einkaufen | E4 | | 4 Unterwegs: Wege und Zwischenfälle | E4 |
| 5 Im Restaurant | E5 | | 5 Handy, Vertrag, Kündigung | E5 |
| 6 Mit der Bahn unterwegs | E6 | | 6 Mein Geld | E7 lines 3–4 (`karte-verloren-melden`, `versicherungsbrief-verstehen`) |
| 7 Am Telefon im Job (fixture) | **E8** | | 7 Die Heizung ist kaputt | E6 |
| 8 Gesund bleiben | E9 | | 8 Wetter, Klima, Umwelt | E8 |
| 9 Immer online? | E3 | | 9 Mein Weg | E9 |
| 10 Schule, Ausbildung, Kurse | E11 | | 10 Bewerbung und Vorstellungsgespräch | E10 |
| 11 Gefühle, auch online | E10 | | 11 Post vom Amt | E7 lines 1, 2, 5 |
| 12 Hier und dort | E11 line 1 (`leben-hier-und-dort`) + E1 line 3 — no draft unit | | 12 Lebensstationen | E12 |
| — (no row) | **E7 Im Verein** | | — (no row) | **E2 Wünsche, Träume, Sorgen**, **E11 Im Job: Abläufe** |

## 8. Open issues

1. **„Productive" in ALL-02** is undefined for interaction modes (A2.2 E7, §6 item 2). One rule for all four can-do
   registries is needed from the validator owner.
2. **Draft order vs blueprint order** (§7): A2.1 E7 (Verein) and A2.2 E2/E11 have no blueprint row, and blueprint rows A2.1-12
   and A2.2-2/6 have no draft unit. The ids cover both orders; which order wins is the curriculum agents' call.
3. **A2.2 online interaction depends on a suggestion** (`gruppenchat-absprechen`, §6 item 1).
4. **Source tags were not re-checked against the primary PDFs** in this run (no network use): RC pages and levels, and the
   GER/GI/PD tags, come from memo 04 and the W2 drafts. The Goethe A2 adult Prüfungsziele (Hueber) were not available to
   memo 04 either, so the ga2 additions cite the Übungssatz Teil descriptions (US-A2) and the CEFR grid (GER-R·A2) rather
   than Goethe Kannbeschreibungen.
5. **Wording is ours but not yet reviewed** by the W2 DaF reviewer or run through LNG-01/02 (no Hunspell or LanguageTool in
   this environment). Compounds to watch: *Einstufungstest*, *Gepäckaufbewahrung*, *Buchungsbestätigung*, *Zugausfall*,
   *Leitstelle*, *Ratgeber-Artikel*.
6. **Lernziel length.** Items run 12–26 words (mean ≈ 19). No gate limits can-do length; if the Start screen's Lernziele box
   needs a cap, a short `de` is a meaning-preserving edit and keeps the id.
