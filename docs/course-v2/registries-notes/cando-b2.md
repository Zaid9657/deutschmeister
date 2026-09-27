# Can-do registry B2 — notes (unit id → can-do ids)

**Date:** 2026-09-27 · **Owner (sole writer):** cando-b2 · **Registry:** [`content/course-v2/registries/cando/b2.json`](../../../content/course-v2/registries/cando/b2.json) (SCHEMA §4.1, `course-v2/cando@1`) ·
**Status:** W2 draft, before the W2 DaF review and the registry freeze (BLUEPRINT §10.3).
**Inputs:** SCHEMA §2, §4.1, §8; BLUEPRINT §2.2, §2.3 (tb2 row), §2.8 (B2 rows), §9 (ALL-02, ALL-04, ALL-05, ALL-06, REF-01), §10.3;
[`curriculum/b2-1.json`](../curriculum/b2-1.json) + [`b2-2.json`](../curriculum/b2-2.json) (continuity pass of 2026-09-27);
research [05](../research/05-cando-b1-b2.md) (B2 can-do inventory, source codes, spiral threads), [14](../research/14-lehrwerke-curricula.md) §B5, §B6, §C
(Aspekte neu B2 / Sicher! aktuell B2 placement), [03](../research/03-exams-b2.md) §2 + §7 (telc Deutsch B2 Teile).
**Lean execution (2026-09-27):** the only B2 lane is **tb2** (telc Deutsch B2). `registries/lanes/tb2.json` did not exist when this
was written, so the Teil ids below (`tb2.lv1` … `tb2.m3`) follow the BLUEPRINT §2.3/§2.8 notation (LV1–3, SB1–2, HV1–3, SA, M1–M3)
and must match that file once its owner writes it. No can-do was added for Goethe B2 (gb2) or DTB B2; draft lines that name a
Goethe Teil are mapped like any other line.

## 1. What the registry holds

| Group | Items | What it is |
|---|---|---|
| Draft lines | 96 | every can-do line of `b2-1.json` (48) and `b2-2.json` (48), one id each, reworded (§2) |
| tb2 additions | 8 | telc B2 Teile that a unit's Prüfungsfokus or Leittext names but no draft line of that half-level trains (LV1, LV2, LV3, SB1, SB2, HV2, HV3) |
| Gate additions | 3 | two productive-written can-dos the unit's writing Aufgabe must prove (ALL-02: B2.1 u10, B2.2 u09) and the missing B2.2 step of the „Konsultation" spiral thread (ALL-06: B2.2 u03) |
| Reserve | 6 | memo-05 B2 goals no draft unit uses, plus an HF 6 id for a Fokus-Karte (ALL-04) — so a swap never has to invent an id |
| **Total** | **113** | halfLevel b2.1: 56 · b2.2: 57 (reserve counted by its target half-level: 2 + 4) |

Every placed id is used by exactly one unit (placement 1:1); no id is shared between units, so „Das kann ich" lists stay
distinct and a „can-dos confirmed" count never double-counts. Per unit: 4 draft lines + at most 1 addition, so every unit
stays inside ALL-02's 3–5 (B2.1: u03, u04, u05, u07, u10, u12 at 5; B2.2: u01, u03, u06, u08, u09 at 5; all others 4).

## 2. Conventions

- **Wording.** `de` is our own ich-Form sentence. The W2 drafts copy CEFR/BSK/Begleitband wording with only the person changed
  (memo 05 §1 conversion rule), so **every draft line was rewritten**, and examples were made concrete for the unit's situation
  (e.g. *Posten wie Brutto, Steuern, Sozialabgaben und Überstunden* for BSK 38.1's generic „Detailinformationen"). A scripted
  check compared each `de` against every draft line of both files and every „Ich kann …" line and every quoted descriptor of
  memo 05: after the shared „Ich kann" the longest common word run is **4 words** (collocations such as „in einem persönlichen
  Brief", „mit einer anderen Person", „Vor- und Nachteile verschiedener"); nothing reaches 5. Function and level of the source
  are unchanged. Items run 12–26 words (mean ≈ 19).
- **Ids.** `cd.b2.<slug>`, German slug, ASCII-folded (ä → ae, ß → ss), naming the function or the situation, not the unit
  number, so an id survives a unit move. Where two draft lines are near-identical across units (e.g. „einem kurzen Vortrag
  gezielt Informationen entnehmen" in B2.1 u06 and B2.2 u05), each gets its own id and wording tied to its situation and its
  step (short Volkshochschul-Vortrag vs. Einführungsvorlesung), never a shared id.
- **halfLevel** = the level of the unit that uses it; an addition takes the level of its unit; a reserve id the level it fits.
- **band** = the CEFR band of the descriptor as its primary source tags it: **B2** by default; **B2+** where the source is a
  ZM B2+ feature (`schadensersatz-grenzen`, `an-andere-anknuepfen`); **B1+** where the draft line itself is derived from a
  ZM B1+ feature (`telefonnotiz-weitergeben`, `weg-zum-ziel-erklaeren` — the drafts raise them to B2 situations, the tag stays
  honest). The enum has no B2.1/B2.2 split; memo 05 §3 puts B2.1 at „B1+ → B2 lower end" and B2.2 at „B2 → B2+".
- **mode.** Hören/Lesen → `receptive-*`; monologue, Vortrag, narrative (telc M1 type) → `productive-spoken`; e-mails,
  letters, forum posts, Widerspruch → `productive-written`; discussion, negotiation, planning, consultation →
  `interaction-spoken`; chat, video conference, intranet forum as interaction → `interaction-written`; relaying or summarising
  for a third person, moderating → `mediation`. `luecken-umschreiben` and `eigene-fehler-kontrollieren` (strategies) are filed
  as `productive-spoken` because they are practised and proven while speaking.
- **mediation** = `true` exactly when `mode` is `mediation` (9 ids: B2.1 u10·2, u11·3, u12·4; B2.2 u01·1, u07·1, u08·1, u12·1,
  u12·2; reserve `gespraechskultur-foerdern`). `telefonnotiz-weitergeben` is mediation because the Begleitband scale
  „Relaying specific information in writing" is what the unit trains (call → note for colleagues).
- **online** = `true` only for the Begleitband online-interaction lines (`online-gruppe-zusammenarbeiten`,
  `online-ideen-rechtfertigen` in B2.1 u12; `intranet-forum-diskutieren` in B2.2 u10). Forum posts written as an exam genre
  (Goethe S1 type) are a writing genre, not online interaction, and stay `false` (same rule as the A2 registry).
- **hf** = RC Handlungsfeld(er) 1–12 and cross-cutting areas A–E (BLUEPRINT §2.8 key: A Migration, B Gefühle/Meinungen,
  C Konflikte, D Soziale Kontakte, E Lernen) of the unit, narrowed per line. The B2 drafts also cite the **BSK** cross-cutting
  fields, whose letters mean something else; they were translated: BSK A soziale Kontakte → **D**, BSK B Dissens → **C**,
  BSK C Gefühle/Meinungen → **B**, BSK D Informationsaustausch → the unit's field (usually **2**). Pflege and Praxis units carry
  **2** and **8**; Anerkennung **4** and **3**; the Uni unit B2.2 u05 carries **11** besides **4** (a Vorlesung and a Referat
  are the B2 form of „Unterricht"; see open issue 4).
- **source** keeps memo 05's and memo 03's codes, in the A2 registry's `CODE·Band` style (source tags stay in the data and
  never reach the screen):

| Tag | Document |
|---|---|
| `SB·B2`, `SB·B2 Online`, `SB·B2 Mediation` | Begleitband zum GER, Anhang 2 (self-assessment grid with online interaction and mediation) |
| `ZM·B1+`, `ZM·B2`, `ZM·B2+` | Begleitband, Anhang 1 *Zentrale Merkmale* |
| `E8·B2` | Begleitband, Anhang 8 *Ergänzende Deskriptoren* |
| `GER S. n·B2` | GER-2001 German scale as reprinted in the telc Deutsch B2 Handbuch, page n |
| `BSK x.y·B2` · `BSK-Q·B2` | DeuFöV Lernzielkatalog A2–C1, Feinlernziel x.y, B2 descriptor · the B2 qualifier wording (memo 05 §2.3) |
| `KK-B2 GLZ 35` | BAMF Kurskonzept Basiskurs B2, Groblernziel 35 |
| `PZ-B2 4.2.2` | Goethe-Zertifikat B2 Prüfungsziele (2007) |
| `RC 117–119` | Rahmencurriculum, HF 6 pages (memo 04 page ranges) |
| `UT-B2 <Teil>` | telc Deutsch B2 Übungstest 1: `LV1–3`, `SB1–2`, `HV1–3`, `SA` (`SA-A` Bitte um Informationen, `SA-B` Beschwerde), `M1–M3` (memo 03 §2) |
| `GI-B2 <Teil>` | Goethe-Zertifikat B2 (modular) Teil `L1–L5`, `H1–H4`, `S1–S2`, `Sp1–Sp2` (memo 03 §1) — kept where the draft's task shape comes from it; it is a provenance tag, not a lane reference |
| `As-B2 K#` · `Si-B2 L#` | Aspekte neu B2 Kapitel · Sicher! aktuell B2 Lektion (memo 14 §B5/§B6, memo 06 F3) — for the two form-focused lines that have no CEFR descriptor |


## 3. Unit id → can-do ids

### B2.1

| Unit | Titel | `spec.canDos` from the draft lines, in line order | + tb2 / gate addition | n |
|---|---|---|---|---|
| `b2.1-u01` | Heimat ist … | `cd.b2.forum-einstellungen-erkennen`<br>`cd.b2.heimat-stellung-nehmen`<br>`cd.b2.erfahrung-erzaehlen`<br>`cd.b2.eigene-fehler-kontrollieren` | — | 4 |
| `b2.1-u02` | Sprich mit mir! Gesprächskultur im Beruf | `cd.b2.radio-standpunkte-erfassen`<br>`cd.b2.missverstaendnis-klaeren-schriftlich`<br>`cd.b2.du-oder-sie-diskutieren`<br>`cd.b2.luecken-umschreiben` | — | 4 |
| `b2.1-u03` | Arbeit ist das halbe Leben? Vertrag, Gehalt, Abrechnung | `cd.b2.gehaltsabrechnung-verstehen`<br>`cd.b2.arbeitsvertrag-nachfragen`<br>`cd.b2.artikel-zusammenfassen-diskutieren`<br>`cd.b2.abrechnung-reklamieren-schriftlich` | `cd.b2.erfahrungsberichte-ueberschriften` (LV1) | 5 |
| `b2.1-u04` | Beschwerde mit Anspruch | `cd.b2.zugestaendnisse-einfordern`<br>`cd.b2.schriftlich-reklamieren`<br>`cd.b2.reisebedingungen-verstehen`<br>`cd.b2.vorgehen-gemeinsam-planen` | `cd.b2.reise-ansagen-einmal` (HV3) | 5 |
| `b2.1-u05` | Weniger ist mehr? Mode, Konsum und Verantwortung | `cd.b2.forumsbeitrag-vier-punkte`<br>`cd.b2.pro-contra-schriftlich`<br>`cd.b2.konsum-annahmen-aeussern`<br>`cd.b2.radiodiskussion-meinungen-zuordnen` | `cd.b2.artikel-im-detail` (LV2) | 5 |
| `b2.1-u06` | Wissen schafft Alltag | `cd.b2.vortrag-gezielt-hoeren`<br>`cd.b2.kurzvortrag-halten`<br>`cd.b2.anfrage-studie-mail`<br>`cd.b2.sachtext-verweise-verstehen` | — | 4 |
| `b2.1-u07` | Zusammen leben | `cd.b2.leserkommentare-haltung`<br>`cd.b2.informell-mitdiskutieren`<br>`cd.b2.brief-gefuehle-abstufen`<br>`cd.b2.fest-planen-kompromiss` | `cd.b2.interview-wohnprojekt-einmal` (HV2) | 5 |
| `b2.1-u08` | Anerkennung und Weiterbildung | `cd.b2.anerkennung-beratung`<br>`cd.b2.weiterbildungswunsch-begruenden`<br>`cd.b2.kursanzeigen-auswaehlen`<br>`cd.b2.anfrage-weiterbildung-mail` | — | 4 |
| `b2.1-u09` | Qualifiziert bewerben | `cd.b2.anschreiben-verfassen`<br>`cd.b2.qualifikationen-darstellen`<br>`cd.b2.ansicht-verteidigen`<br>`cd.b2.karriereforum-haltungen` | — | 4 |
| `b2.1-u10` | Schichtwechsel | `cd.b2.uebergabe-einschaetzen`<br>`cd.b2.telefonnotiz-weitergeben`<br>`cd.b2.rueckmeldung-arbeit`<br>`cd.b2.dienstplan-loesung-aushandeln` | `cd.b2.engpass-an-leitung-schreiben` (ALL-02 · SA) | 5 |
| `b2.1-u11` | Presse mit Haltung | `cd.b2.artikel-mit-haltung-lesen`<br>`cd.b2.nachrichten-einmal-hoeren`<br>`cd.b2.aussagen-anderer-wiedergeben`<br>`cd.b2.zu-artikel-stellung-nehmen` | — | 4 |
| `b2.1-u12` | Gemeinsam online | `cd.b2.online-gruppe-zusammenarbeiten`<br>`cd.b2.online-ideen-rechtfertigen`<br>`cd.b2.projekt-praesentieren`<br>`cd.b2.vortrag-schriftlich-weitergeben` | `cd.b2.bericht-lueckentext` (SB2) | 5 |

### B2.2

| Unit | Titel | `spec.canDos` from the draft lines, in line order | + tb2 / gate addition | n |
|---|---|---|---|---|
| `b2.2-u01` | Mit viel Gefühl | `cd.b2.fachleute-muendlich-weitergeben`<br>`cd.b2.radiodiskussion-drei-stimmen`<br>`cd.b2.forumsbeitrag-150-woerter`<br>`cd.b2.freundschaft-gefuehle` | `cd.b2.magazinartikel-im-detail` (LV2) | 5 |
| `b2.2-u02` | Fit für die Zukunft? Ernährung und Prävention | `cd.b2.vortrag-argumentation-folgen`<br>`cd.b2.weg-zum-ziel-erklaeren`<br>`cd.b2.pro-contra-diskutieren`<br>`cd.b2.anfrage-krankenkasse-mail` | — | 4 |
| `b2.2-u03` | Kritik, Konflikt, Kompromiss | `cd.b2.problem-benennen-verbessern`<br>`cd.b2.auf-kritik-reagieren`<br>`cd.b2.konflikt-beide-seiten`<br>`cd.b2.nachricht-vorgesetzte-100` | `cd.b2.mitarbeitergespraech-ziele` (ALL-06 · M3) | 5 |
| `b2.2-u04` | Verhandeln | `cd.b2.schadensersatz-grenzen`<br>`cd.b2.verhandeln-punkte-betonen`<br>`cd.b2.vertragsbedingungen-ansprueche`<br>`cd.b2.formelle-beschwerde-frist` | — | 4 |
| `b2.2-u05` | An der Uni | `cd.b2.studienordnung-verstehen`<br>`cd.b2.vorlesung-notieren`<br>`cd.b2.referat-vier-minuten`<br>`cd.b2.nominalstil-umformen` | — | 4 |
| `b2.2-u06` | Kulturwelten | `cd.b2.film-buch-erzaehlen`<br>`cd.b2.meldungen-ueberschriften`<br>`cd.b2.kulturnachrichten-hoeren`<br>`cd.b2.kulturpolitik-position` | `cd.b2.brief-sprachbausteine` (SB1) | 5 |
| `b2.2-u07` | Das macht(e) Geschichte | `cd.b2.zeitzeugin-wiedergeben`<br>`cd.b2.sachverhalt-darstellen`<br>`cd.b2.anfrage-archiv-mail`<br>`cd.b2.zeitzeugen-interview-einmal` | — | 4 |
| `b2.2-u08` | Patienten gut informieren | `cd.b2.merkblatt-muendlich-erklaeren`<br>`cd.b2.beschwerde-beantworten`<br>`cd.b2.empfang-telefon-einmal`<br>`cd.b2.vor-nachteile-erlaeutern-patienten` | `cd.b2.beratungsangebote-auswaehlen` (LV3) | 5 |
| `b2.2-u09` | Stadt, Land, Zukunft | `cd.b2.an-andere-anknuepfen`<br>`cd.b2.rederecht-behalten`<br>`cd.b2.fliessend-mitreden`<br>`cd.b2.forum-aussagen-zuordnen` | `cd.b2.forum-an-argumente-anknuepfen` (ALL-02) | 5 |
| `b2.2-u10` | Ein Blick in die Zukunft | `cd.b2.praesentation-abteilung`<br>`cd.b2.partizipialattribute-aufloesen`<br>`cd.b2.arbeitsmarkt-interview-details`<br>`cd.b2.intranet-forum-diskutieren` | — | 4 |
| `b2.2-u11` | Bescheid, Widerspruch, Kündigung | `cd.b2.widerspruch-begruenden`<br>`cd.b2.kuendigung-schreiben`<br>`cd.b2.formelle-konventionen`<br>`cd.b2.stellungnahmen-einordnen` | — | 4 |
| `b2.2-u12` | Sprache und Regionen | `cd.b2.zur-beteiligung-einladen`<br>`cd.b2.diskussion-buendeln`<br>`cd.b2.sprachforschung-interview`<br>`cd.b2.sprachen-dialekte-erzaehlen` | — | 4 |

## 4. Draft line → id

`Line` = unit·line in the draft's `canDo` array. Draft tag = the `source` string of the W2 draft line, kept for traceability.

### B2.1

| Line | id | Mode | Band | HF | Source tag(s) | tb2 Teil | Draft tag (W2 file) |
|---|---|---|---|---|---|---|---|
| u01·1 | `cd.b2.forum-einstellungen-erkennen` | Lesen | B2 | B, A | GI-B2 L1; GI-B2 L4 | LV1 | 05-cando-b1-b2 B2.1 #3 · ≈ GI-B2 Lesen T1/T4 |
| u01·2 | `cd.b2.heimat-stellung-nehmen` | Schreiben | B2 | A, B | SB·B2; GI-B2 S1 | — | 05-cando-b1-b2 B2.1 #2 (≈, auf B2.1-Länge verkürzt) · GI-B2 Schreiben T1 |
| u01·3 | `cd.b2.erfahrung-erzaehlen` | Sprechen (zus.) | B2 | A, D | UT-B2 M1 | M1 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T1 |
| u01·4 | `cd.b2.eigene-fehler-kontrollieren` | Sprechen (zus.) | B2 | E | ZM·B2 | — | 05-cando-b1-b2 B2.1 #13 · ZM B2 |
| u02·1 | `cd.b2.radio-standpunkte-erfassen` | Hören | B2 | 2, 9 | GER S. 73·B2 | HV2 | 05-cando-b1-b2 B2.1 #7 · GER S. 73 B2 |
| u02·2 | `cd.b2.missverstaendnis-klaeren-schriftlich` | Schreiben | B2 | 2, C | GI-B2 S2 | SA | 05-cando-b1-b2 B2.1 #10 (≈) · GI-B2 Schreiben T2 |
| u02·3 | `cd.b2.du-oder-sie-diskutieren` | Interaktion mdl. | B2 | 2, C | GI-B2 Sp2 | M2 | ≈ 03-exams-b2 §1 · Goethe B2 Sprechen T2 (Kriterium Interaktion, Du/Sie-Register) |
| u02·4 | `cd.b2.luecken-umschreiben` | Sprechen (zus.) | B2 | 2, E | GER S. 70·B2 | — | 05-cando-b1-b2 B2.1 #13 · GER S. 70 B2 |
| u03·1 | `cd.b2.gehaltsabrechnung-verstehen` | Lesen | B2 | 2, 5 | BSK 38.1·B2 | — | 05-cando-b1-b2 B2.1 #11 · BSK 38.1 B1/B2 |
| u03·2 | `cd.b2.arbeitsvertrag-nachfragen` | Interaktion mdl. | B2 | 2 | BSK 36.2·B2 | — | 05-cando-b1-b2 B2.1 #11 · BSK 36.2 B2 |
| u03·3 | `cd.b2.artikel-zusammenfassen-diskutieren` | Sprechen (zus.) | B2 | 2, B | SB·B2; UT-B2 M2 | M2 | 05-cando-b1-b2 B2.1 #1 · SB B2; ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T2 |
| u03·4 | `cd.b2.abrechnung-reklamieren-schriftlich` | Schreiben | B2 | 2, 5 | GI-B2 S2; BSK-Q·B2 | SA | ≈ 05-cando-b1-b2 B2.1 #10 · GI-B2 Schreiben T2; BSK-Qualifikator B2 (05 §2.3) |
| u04·1 | `cd.b2.zugestaendnisse-einfordern` | Interaktion mdl. | B2 | 7, C | ZM·B2 | — | 05-cando-b1-b2 B2.1 #4 · ZM B2 |
| u04·2 | `cd.b2.schriftlich-reklamieren` | Schreiben | B2 | 7, C | BSK 28.4·B2; UT-B2 SA-B | SA | 05-cando-b1-b2 B2.1 #4 · BSK 28.4 B2 |
| u04·3 | `cd.b2.reisebedingungen-verstehen` | Lesen | B2 | 7 | GI-B2 L5 | — | ≈ 03-exams-b2 §1 · GI-B2 Lesen T5 |
| u04·4 | `cd.b2.vorgehen-gemeinsam-planen` | Interaktion mdl. | B2 | 7, C | UT-B2 M3 | M3 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T3 |
| u05·1 | `cd.b2.forumsbeitrag-vier-punkte` | Schreiben | B2 | 7, B | GI-B2 S1 | — | 05-cando-b1-b2 B2.1 #2 · ≈ GI-B2 Schreiben T1 |
| u05·2 | `cd.b2.pro-contra-schriftlich` | Schreiben | B2 | 7, B | SB·B2 | — | 05-cando-b1-b2 B2.1 #2 · SB B2 |
| u05·3 | `cd.b2.konsum-annahmen-aeussern` | Sprechen (zus.) | B2 | 7, B | ZM·B2; PZ-B2 4.2.2 | — | 05-cando-b1-b2 B2.1 #5 · ZM B2; PZ-B2 4.2.2 |
| u05·4 | `cd.b2.radiodiskussion-meinungen-zuordnen` | Hören | B2 | 7, B | GI-B2 H3 | — | ≈ 03-exams-b2 §1 · GI-B2 Hören T3 |
| u06·1 | `cd.b2.vortrag-gezielt-hoeren` | Hören | B2 | 8, 4 | GI-B2 H4 | — | 05-cando-b1-b2 B2.2 #8 (vorgezogen, verkürzt) · GI-B2 Hören T4 |
| u06·2 | `cd.b2.kurzvortrag-halten` | Sprechen (zus.) | B2 | 8, 4 | GI-B2 Sp1 | M1 | 05-cando-b1-b2 B2.2 #1 (≈, verkürzt) · GI-B2 Sprechen T1 |
| u06·3 | `cd.b2.anfrage-studie-mail` | Schreiben | B2 | 8 | UT-B2 SA-A | SA | ≈ 03-exams-b2 §2 · telc B2 Schriftlicher Ausdruck, Aufgabe A |
| u06·4 | `cd.b2.sachtext-verweise-verstehen` | Lesen | B2 | 8, 4 | GI-B2 L2 | SB2 | ≈ 03-exams-b2 §7 · GI-B2 Lesen T2 (Kohäsion) |
| u07·1 | `cd.b2.leserkommentare-haltung` | Lesen | B2 | 12, D | GI-B2 L4 | LV1 | 05-cando-b1-b2 B2.1 #3 · ≈ GI-B2 Lesen T4 |
| u07·2 | `cd.b2.informell-mitdiskutieren` | Interaktion mdl. | B2 | 12, D | GER S. 81·B2 | M3 | 05-cando-b1-b2 B2.1 #6 · GER S. 81 B2 |
| u07·3 | `cd.b2.brief-gefuehle-abstufen` | Schreiben | B2 | 12, B, D | GER S. 86·B2 | SB1 | 05-cando-b1-b2 B2.1 #12 · GER S. 86 B2 |
| u07·4 | `cd.b2.fest-planen-kompromiss` | Interaktion mdl. | B2 | 12, D | UT-B2 M3 | M3 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T3 |
| u08·1 | `cd.b2.anerkennung-beratung` | Interaktion mdl. | B2 | 4, 3 | BSK 2.5·B2 | — | 05-cando-b1-b2 B2.1 #9 · BSK 2.5 B2 |
| u08·2 | `cd.b2.weiterbildungswunsch-begruenden` | Sprechen (zus.) | B2 | 4 | BSK 41.3·B2 | M1 | 05-cando-b1-b2 B2.1 #9 · BSK 41.3 B2 |
| u08·3 | `cd.b2.kursanzeigen-auswaehlen` | Lesen | B2 | 4 | UT-B2 LV3 | LV3 | ≈ 03-exams-b2 §2 · telc B2 Leseverstehen T3 |
| u08·4 | `cd.b2.anfrage-weiterbildung-mail` | Schreiben | B2 | 4 | UT-B2 SA-A | SA | ≈ 03-exams-b2 §2 · telc B2 Schriftlicher Ausdruck, Aufgabe A |
| u09·1 | `cd.b2.anschreiben-verfassen` | Schreiben | B2 | 3 | BSK 5.2·B2 | SA | 05-cando-b1-b2 B2.1 #8 · BSK 5.2 B2 |
| u09·2 | `cd.b2.qualifikationen-darstellen` | Sprechen (zus.) | B2 | 3 | BSK 6.4·B2 | M1 | 05-cando-b1-b2 B2.1 #8 · BSK 6.4 B2 |
| u09·3 | `cd.b2.ansicht-verteidigen` | Interaktion mdl. | B2 | 3, C | GER S. 81·B2 | M2 | 05-cando-b1-b2 B2.1 #6 · GER S. 81 B2 |
| u09·4 | `cd.b2.karriereforum-haltungen` | Lesen | B2 | 3, B | GI-B2 L1 | LV1 | ≈ 03-exams-b2 §1 · GI-B2 Lesen T1 |
| u10·1 | `cd.b2.uebergabe-einschaetzen` | Sprechen (zus.) | B2 | 2, 8 | ZM·B2 | — | 05-cando-b1-b2 B2.1 #5 · ZM B2 |
| u10·2 | `cd.b2.telefonnotiz-weitergeben` | Mediation | B1+ | 2, 8 | ZM·B1+ | HV3 | ≈ ZM B1+ (05 §2.2); Arbeitsplatzaufgabe, kein Prüfungsformat |
| u10·3 | `cd.b2.rueckmeldung-arbeit` | Interaktion mdl. | B2 | 2, 8 | BSK 20.2·B2 | — | 05-cando-b1-b2 B2.1 #10 · BSK 20.2 B2 |
| u10·4 | `cd.b2.dienstplan-loesung-aushandeln` | Interaktion mdl. | B2 | 2, 8 | UT-B2 M3 | M3 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T3 |
| u11·1 | `cd.b2.artikel-mit-haltung-lesen` | Lesen | B2 | 9, B | SB·B2 | LV2 | 05-cando-b1-b2 B2.1 #3 · SB B2 |
| u11·2 | `cd.b2.nachrichten-einmal-hoeren` | Hören | B2 | 9 | UT-B2 HV1 | HV1 | ≈ 03-exams-b2 §2 · telc B2 Hörverstehen T1; 05 B2.2 #13 (vorbereitet) |
| u11·3 | `cd.b2.aussagen-anderer-wiedergeben` | Mediation | B2 | 9, B | SB·B2 Mediation | M2 | ≈ eigene Formulierung nach SB B2 Mediation (05 B2.2 #9, vorbereitet) |
| u11·4 | `cd.b2.zu-artikel-stellung-nehmen` | Schreiben | B2 | 9, B | SB·B2; GI-B2 S1 | — | 05-cando-b1-b2 B2.1 #2 (≈) · SB B2 |
| u12·1 | `cd.b2.online-gruppe-zusammenarbeiten` | Interaktion schr. (online) | B2 | 2, 9 | SB·B2 Online | — | 05-cando-b1-b2 B2.1 #14 · SB B2 Online-Interaktion |
| u12·2 | `cd.b2.online-ideen-rechtfertigen` | Interaktion schr. (online) | B2 | 2, 9 | SB·B2 Online | — | 05-cando-b1-b2 B2.1 #14 · SB B2 Online-Interaktion |
| u12·3 | `cd.b2.projekt-praesentieren` | Sprechen (zus.) | B2 | 2 | GI-B2 Sp1 | M1 | 05-cando-b1-b2 B2.2 #1 (≈, verkürzt) · GI-B2 Sprechen T1 |
| u12·4 | `cd.b2.vortrag-schriftlich-weitergeben` | Mediation | B2 | 2 | SB·B2 Mediation | — | ≈ SB B2 Mediation (05 B2.2 #9, vorbereitet) |

### B2.2

| Line | id | Mode | Band | HF | Source tag(s) | tb2 Teil | Draft tag (W2 file) |
|---|---|---|---|---|---|---|---|
| u01·1 | `cd.b2.fachleute-muendlich-weitergeben` | Mediation | B2 | D, B | SB·B2 Mediation | M2 | 05-cando-b1-b2 B2.2 #9 · SB B2 Mediation |
| u01·2 | `cd.b2.radiodiskussion-drei-stimmen` | Hören | B2 | D, 9 | GI-B2 H3 | — | ≈ 03-exams-b2 §1 · GI-B2 Hören T3 |
| u01·3 | `cd.b2.forumsbeitrag-150-woerter` | Schreiben | B2 | D, B | GI-B2 S1 | — | 05-cando-b1-b2 B2.1 #2 (Prüfungslänge) · GI-B2 Schreiben T1 |
| u01·4 | `cd.b2.freundschaft-gefuehle` | Sprechen (zus.) | B2 | D, B | GER S. 86·B2 | M2 | ≈ 05-cando-b1-b2 B2.1 #12 · GER S. 86 B2 |
| u02·1 | `cd.b2.vortrag-argumentation-folgen` | Hören | B2 | 8 | SB·B2 | — | 05-cando-b1-b2 B2.2 #8 · SB B2 |
| u02·2 | `cd.b2.weg-zum-ziel-erklaeren` | Sprechen (zus.) | B1+ | 8 | ZM·B1+ | — | ≈ eigene Formulierung nach ZM B1+ „beschreiben, wie man etwas macht“ (05 §2.2), auf B2-Niveau |
| u02·3 | `cd.b2.pro-contra-diskutieren` | Interaktion mdl. | B2 | 8, B | GI-B2 Sp2; UT-B2 M2 | M2 | 05-cando-b1-b2 B2.2 #2 · GI-B2 Sprechen T2 |
| u02·4 | `cd.b2.anfrage-krankenkasse-mail` | Schreiben | B2 | 8, 5 | UT-B2 SA-A | SA | ≈ 03-exams-b2 §2 · telc B2 Schriftlicher Ausdruck, Aufgabe A |
| u03·1 | `cd.b2.problem-benennen-verbessern` | Interaktion mdl. | B2 | 2, C | BSK 52.1·B2 | M3 | 05-cando-b1-b2 B2.2 #5 · BSK 52.1 B2 |
| u03·2 | `cd.b2.auf-kritik-reagieren` | Interaktion mdl. | B2 | 2, C | BSK 54.5·B2 | M2 | 05-cando-b1-b2 B2.2 #5 · BSK 54.5 B2 |
| u03·3 | `cd.b2.konflikt-beide-seiten` | Interaktion mdl. | B2 | 2, C | BSK 54.2·B2 | M3 | 05-cando-b1-b2 B2.2 #6 · BSK 54.2 B2 |
| u03·4 | `cd.b2.nachricht-vorgesetzte-100` | Schreiben | B2 | 2, C | GI-B2 S2 | SA | 05-cando-b1-b2 B2.1 #10 (Prüfungslänge) · GI-B2 Schreiben T2 |
| u04·1 | `cd.b2.schadensersatz-grenzen` | Interaktion mdl. | B2+ | 7, C | ZM·B2+ | M3 | 05-cando-b1-b2 B2.2 #4 (≈) · ZM B2+ |
| u04·2 | `cd.b2.verhandeln-punkte-betonen` | Interaktion mdl. | B2 | 7, C | BSK 57.9·B2 | M3 | 05-cando-b1-b2 B2.2 #4 · BSK 57.9 B2 |
| u04·3 | `cd.b2.vertragsbedingungen-ansprueche` | Lesen | B2 | 7 | GI-B2 L5 | — | ≈ 05-cando-b1-b2 B2.2 #11 · GI-B2 Lesen T5 |
| u04·4 | `cd.b2.formelle-beschwerde-frist` | Schreiben | B2 | 7, C | UT-B2 SA-B | SA | ≈ 03-exams-b2 §2 · telc B2 Schriftlicher Ausdruck, Aufgabe B |
| u05·1 | `cd.b2.studienordnung-verstehen` | Lesen | B2 | 4, 11 | GI-B2 L5 | — | 05-cando-b1-b2 B2.2 #11 · GI-B2 Lesen T5 |
| u05·2 | `cd.b2.vorlesung-notieren` | Hören | B2 | 4, 11 | GI-B2 H4 | — | 05-cando-b1-b2 B2.2 #8 · GI-B2 Hören T4 |
| u05·3 | `cd.b2.referat-vier-minuten` | Sprechen (zus.) | B2 | 4, 11 | GI-B2 Sp1 | M1 | 05-cando-b1-b2 B2.2 #1 · GI-B2 Sprechen T1 |
| u05·4 | `cd.b2.nominalstil-umformen` | Schreiben | B2 | 4 | As-B2 K9; Si-B2 L5 | SB2 | ≈ eigene Formulierung nach Aspekte neu B2 K9 / Sicher! aktuell B2 L5, L8 (06 F3 B2.2 #4) |
| u06·1 | `cd.b2.film-buch-erzaehlen` | Sprechen (zus.) | B2 | 9, D | UT-B2 M1 | M1 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T1; Steigerung von 05 B1.1 #4 (SB B1) |
| u06·2 | `cd.b2.meldungen-ueberschriften` | Lesen | B2 | 9 | UT-B2 LV1 | LV1 | ≈ 03-exams-b2 §2 · telc B2 Leseverstehen T1 |
| u06·3 | `cd.b2.kulturnachrichten-hoeren` | Hören | B2 | 9 | SB·B2; UT-B2 HV1 | HV1 | ≈ 05-cando-b1-b2 B2.2 #13 · SB B2; telc B2 Hörverstehen T1 |
| u06·4 | `cd.b2.kulturpolitik-position` | Schreiben | B2 | 9, B | GI-B2 S1 | — | 05-cando-b1-b2 B2.1 #2 · GI-B2 Schreiben T1 |
| u07·1 | `cd.b2.zeitzeugin-wiedergeben` | Mediation | B2 | A, 9 | SB·B2 Mediation | M2 | ≈ eigene Formulierung nach SB B2 Mediation (05 B2.2 #9) |
| u07·2 | `cd.b2.sachverhalt-darstellen` | Sprechen (zus.) | B2 | A | GER S. 64·B2 | M1 | 05-cando-b1-b2 B2.2 #1 · GER S. 64 B2 |
| u07·3 | `cd.b2.anfrage-archiv-mail` | Schreiben | B2 | A, 9 | UT-B2 SA-A | SA | ≈ 03-exams-b2 §2 · telc B2 Schriftlicher Ausdruck, Aufgabe A |
| u07·4 | `cd.b2.zeitzeugen-interview-einmal` | Hören | B2 | A, 9 | UT-B2 HV2 | HV2 | ≈ 03-exams-b2 §2 · telc B2 Hörverstehen T2 |
| u08·1 | `cd.b2.merkblatt-muendlich-erklaeren` | Mediation | B2 | 8, 2 | SB·B2 Mediation | M2 | 05-cando-b1-b2 B2.2 #9 · SB B2 Mediation |
| u08·2 | `cd.b2.beschwerde-beantworten` | Schreiben | B2 | 2, 8 | UT-B2 SA | SA | ≈ 03-exams-b2 §7 (formelle E-Mail: Antwort an eine Kundin) · telc B2 Schriftlicher Ausdruck |
| u08·3 | `cd.b2.empfang-telefon-einmal` | Hören | B2 | 2, 8 | GI-B2 H1; UT-B2 HV3 | HV3 | ≈ 05-cando-b1-b2 B2.1 #7 · GI-B2 Hören T1 |
| u08·4 | `cd.b2.vor-nachteile-erlaeutern-patienten` | Interaktion mdl. | B2 | 2, 8 | KK-B2 GLZ 35 | M2 | 05-cando-b1-b2 B2.2 #7 · KK-B2 Groblernziel 35 |
| u09·1 | `cd.b2.an-andere-anknuepfen` | Interaktion mdl. | B2+ | 10, B, C | ZM·B2+ | M2 | 05-cando-b1-b2 B2.2 #2 · ZM B2+ |
| u09·2 | `cd.b2.rederecht-behalten` | Interaktion mdl. | B2 | 10, C | ZM·B2 | M2 | 05-cando-b1-b2 B2.2 #3 · ZM B2 |
| u09·3 | `cd.b2.fliessend-mitreden` | Interaktion mdl. | B2 | 10, B | ZM·B2 | M2 | 05-cando-b1-b2 B2.2 #14 · ZM B2 |
| u09·4 | `cd.b2.forum-aussagen-zuordnen` | Lesen | B2 | 10, B | GI-B2 L1 | LV1 | 05-cando-b1-b2 B2.1 #3 · GI-B2 Lesen T1 |
| u10·1 | `cd.b2.praesentation-abteilung` | Sprechen (zus.) | B2 | 2, 9 | BSK 43.7·B2 | M1 | 05-cando-b1-b2 B2.2 #7 · BSK 43.7 B2 |
| u10·2 | `cd.b2.partizipialattribute-aufloesen` | Lesen | B2 | 2, 9 | As-B2 K10; Si-B2 L12 | LV2 | ≈ eigene Formulierung nach Aspekte neu B2 K10 / Sicher! aktuell B2 L12 (06 F3 B2.2 #5) |
| u10·3 | `cd.b2.arbeitsmarkt-interview-details` | Hören | B2 | 2, 9 | GI-B2 H2; UT-B2 HV2 | HV2 | ≈ 03-exams-b2 §1 · GI-B2 Hören T2 |
| u10·4 | `cd.b2.intranet-forum-diskutieren` | Interaktion schr. (online) | B2 | 2, 9 | SB·B2 Online; GI-B2 S1 | — | ≈ 05-cando-b1-b2 B2.1 #14 · SB B2 Online-Interaktion; GI-B2 Schreiben T1 |
| u11·1 | `cd.b2.widerspruch-begruenden` | Schreiben | B2 | 1 | BSK 39.3·B2; UT-B2 SA-B | SA | 05-cando-b1-b2 B2.2 #11 · BSK 39.3 B2 |
| u11·2 | `cd.b2.kuendigung-schreiben` | Schreiben | B2 | 5, 1 | BSK 45.1·B2 | SA | 05-cando-b1-b2 B2.2 #12 · BSK 45.1 B2 |
| u11·3 | `cd.b2.formelle-konventionen` | Schreiben | B2 | 1 | GER S. 118·B2 | SA | 05-cando-b1-b2 B2.2 #12 · GER S. 118 B2 |
| u11·4 | `cd.b2.stellungnahmen-einordnen` | Lesen | B2 | 1 | GI-B2 L4 | LV1 | ≈ 03-exams-b2 §1 · GI-B2 Lesen T4 |
| u12·1 | `cd.b2.zur-beteiligung-einladen` | Mediation | B2 | D, E | SB·B2 Mediation | — | 05-cando-b1-b2 B2.2 #10 · SB B2 Mediation |
| u12·2 | `cd.b2.diskussion-buendeln` | Mediation | B2 | D, E | E8·B2 | M2 | 05-cando-b1-b2 B2.2 #9 · E8 B2 |
| u12·3 | `cd.b2.sprachforschung-interview` | Hören | B2 | E, 9 | GI-B2 H2; UT-B2 HV2 | HV2 | ≈ 03-exams-b2 §1 · GI-B2 Hören T2 |
| u12·4 | `cd.b2.sprachen-dialekte-erzaehlen` | Sprechen (zus.) | B2 | E, D | UT-B2 M1 | M1 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T1 |

## 5. What lane tb2 needs

The **tb2 Teil** column in §4 and the table in §5.2 name the telc B2 Teil a can-do prepares. Draft lines whose task shape
exists only in Goethe B2 (L2 gap text as cohesion, L4, L5 rules, H3 three-voice panel, H4 lecture, S1 forum post) carry **—**
unless the telc format trains the same operation; Goethe Sp1 (Vortrag) lines are filed under **M1** because BLUEPRINT §4.4
puts tb2 M1 and gb2 Sp1 in the same `monologue` interaction family.

### 5.1 The additions

| id | halfLevel · unit | Kind | Teil | Mode | Source tag(s) | Why |
|---|---|---|---|---|---|---|
| `cd.b2.erfahrungsberichte-ueberschriften` | b2.1 · u03 | tb2 | LV1 | Lesen | UT-B2 LV1; SB·B2 | LV1 (5 Texte, 10 Überschriften) ist der Lesetext der Einheit, aber keine Entwurfszeile trainiert globales Lesen |
| `cd.b2.reise-ansagen-einmal` | b2.1 · u04 | tb2 | HV3 | Hören | UT-B2 HV3 | HV3 (fünf Ansagen, einmal gehört) steht im Prüfungsfokus der Einheit, keine Entwurfszeile ist ein Hörziel |
| `cd.b2.artikel-im-detail` | b2.1 · u05 | tb2 | LV2 | Lesen | UT-B2 LV2; SB·B2 | LV2 (Detailverstehen, Mehrfachauswahl) ist der Lesetext der Einheit; B2.1 hatte keine LV2-Zeile |
| `cd.b2.interview-wohnprojekt-einmal` | b2.1 · u07 | tb2 | HV2 | Hören | UT-B2 HV2 | HV2 (langes Interview, einmal gehört, richtig/falsch) ist der Hörtext der Einheit; keine Entwurfszeile ist ein Hörziel |
| `cd.b2.engpass-an-leitung-schreiben` | b2.1 · u10 | gate | SA | Schreiben | GI-B2 S2; UT-B2 SA | ALL-02: die Schreibaufgabe (Nachricht an die Pflegedienstleitung) belegt sonst keine Zeile; die vier Entwurfszeilen sind mündlich oder Mediation |
| `cd.b2.bericht-lueckentext` | b2.1 · u12 | tb2 | SB2 | Lesen | UT-B2 SB2 | SB2 (Bericht, Wortkasten) ist der Lesetext der Einheit; Sprachbausteine hatten in B2.1 kein eigenes Lernziel |
| `cd.b2.magazinartikel-im-detail` | b2.2 · u01 | tb2 | LV2 | Lesen | UT-B2 LV2 | LV2 in voller Länge (zwei Artikel, ≈ 600 Wörter) ist der Lesetext der Einheit; B2.2 hatte kein eigenes LV2-Lernziel |
| `cd.b2.mitarbeitergespraech-ziele` | b2.2 · u03 | gate | M3 | Interaktion mdl. | BSK 20.4·B2 | ALL-06 Spiralfaden „Konsultation“: der B2.2-Schritt (Mitarbeitergespräch, BSK 20.4) fehlt in den Entwürfen |
| `cd.b2.brief-sprachbausteine` | b2.2 · u06 | tb2 | SB1 | Lesen | UT-B2 SB1 | SB1 (persönlicher Brief, Mehrfachauswahl) steht im Prüfungsfokus; Sprachbausteine hatten in B2.2 kein eigenes Lernziel |
| `cd.b2.beratungsangebote-auswaehlen` | b2.2 · u08 | tb2 | LV3 | Lesen | UT-B2 LV3 | LV3 in voller Länge (10 Situationen, 12 Anzeigen, „x“) ist der Lesetext der Einheit; B2.2 hatte kein LV3-Lernziel |
| `cd.b2.forum-an-argumente-anknuepfen` | b2.2 · u09 | gate | — | Schreiben | GI-B2 S1; ZM·B2+ | ALL-02: die Schreibaufgabe (Forumsbeitrag) belegt sonst keine Zeile; alle vier Entwurfszeilen sind Interaktion oder Lesen |

### 5.2 tb2 Teil → can-dos that train it

| tb2 Teil | Template | B2.1 | B2.2 |
|---|---|---|---|
| LV1 | `tb2.lv1` | `cd.b2.forum-einstellungen-erkennen` (u01)<br>`cd.b2.erfahrungsberichte-ueberschriften` (u03)<br>`cd.b2.leserkommentare-haltung` (u07)<br>`cd.b2.karriereforum-haltungen` (u09) | `cd.b2.meldungen-ueberschriften` (u06)<br>`cd.b2.forum-aussagen-zuordnen` (u09)<br>`cd.b2.stellungnahmen-einordnen` (u11) |
| LV2 | `tb2.lv2` | `cd.b2.artikel-im-detail` (u05)<br>`cd.b2.artikel-mit-haltung-lesen` (u11) | `cd.b2.magazinartikel-im-detail` (u01)<br>`cd.b2.partizipialattribute-aufloesen` (u10) |
| LV3 | `tb2.lv3` | `cd.b2.kursanzeigen-auswaehlen` (u08) | `cd.b2.beratungsangebote-auswaehlen` (u08) |
| SB1 | `tb2.sb1` | `cd.b2.brief-gefuehle-abstufen` (u07) | `cd.b2.brief-sprachbausteine` (u06) |
| SB2 | `tb2.sb2` | `cd.b2.sachtext-verweise-verstehen` (u06)<br>`cd.b2.bericht-lueckentext` (u12) | `cd.b2.nominalstil-umformen` (u05) |
| HV1 | `tb2.hv1` | `cd.b2.nachrichten-einmal-hoeren` (u11) | `cd.b2.kulturnachrichten-hoeren` (u06) |
| HV2 | `tb2.hv2` | `cd.b2.radio-standpunkte-erfassen` (u02)<br>`cd.b2.interview-wohnprojekt-einmal` (u07) | `cd.b2.zeitzeugen-interview-einmal` (u07)<br>`cd.b2.arbeitsmarkt-interview-details` (u10)<br>`cd.b2.sprachforschung-interview` (u12) |
| HV3 | `tb2.hv3` | `cd.b2.reise-ansagen-einmal` (u04)<br>`cd.b2.telefonnotiz-weitergeben` (u10) | `cd.b2.empfang-telefon-einmal` (u08) |
| SA | `tb2.sa` | `cd.b2.missverstaendnis-klaeren-schriftlich` (u02)<br>`cd.b2.abrechnung-reklamieren-schriftlich` (u03)<br>`cd.b2.schriftlich-reklamieren` (u04)<br>`cd.b2.anfrage-studie-mail` (u06)<br>`cd.b2.anfrage-weiterbildung-mail` (u08)<br>`cd.b2.anschreiben-verfassen` (u09)<br>`cd.b2.engpass-an-leitung-schreiben` (u10) | `cd.b2.anfrage-krankenkasse-mail` (u02)<br>`cd.b2.nachricht-vorgesetzte-100` (u03)<br>`cd.b2.formelle-beschwerde-frist` (u04)<br>`cd.b2.anfrage-archiv-mail` (u07)<br>`cd.b2.beschwerde-beantworten` (u08)<br>`cd.b2.widerspruch-begruenden` (u11)<br>`cd.b2.kuendigung-schreiben` (u11)<br>`cd.b2.formelle-konventionen` (u11) |
| M1 | `tb2.m1` | `cd.b2.erfahrung-erzaehlen` (u01)<br>`cd.b2.kurzvortrag-halten` (u06)<br>`cd.b2.weiterbildungswunsch-begruenden` (u08)<br>`cd.b2.qualifikationen-darstellen` (u09)<br>`cd.b2.projekt-praesentieren` (u12) | `cd.b2.referat-vier-minuten` (u05)<br>`cd.b2.film-buch-erzaehlen` (u06)<br>`cd.b2.sachverhalt-darstellen` (u07)<br>`cd.b2.praesentation-abteilung` (u10)<br>`cd.b2.sprachen-dialekte-erzaehlen` (u12) |
| M2 | `tb2.m2` | `cd.b2.du-oder-sie-diskutieren` (u02)<br>`cd.b2.artikel-zusammenfassen-diskutieren` (u03)<br>`cd.b2.ansicht-verteidigen` (u09)<br>`cd.b2.aussagen-anderer-wiedergeben` (u11) | `cd.b2.fachleute-muendlich-weitergeben` (u01)<br>`cd.b2.freundschaft-gefuehle` (u01)<br>`cd.b2.pro-contra-diskutieren` (u02)<br>`cd.b2.auf-kritik-reagieren` (u03)<br>`cd.b2.zeitzeugin-wiedergeben` (u07)<br>`cd.b2.merkblatt-muendlich-erklaeren` (u08)<br>`cd.b2.vor-nachteile-erlaeutern-patienten` (u08)<br>`cd.b2.an-andere-anknuepfen` (u09)<br>`cd.b2.rederecht-behalten` (u09)<br>`cd.b2.fliessend-mitreden` (u09)<br>`cd.b2.diskussion-buendeln` (u12) |
| M3 | `tb2.m3` | `cd.b2.vorgehen-gemeinsam-planen` (u04)<br>`cd.b2.informell-mitdiskutieren` (u07)<br>`cd.b2.fest-planen-kompromiss` (u07)<br>`cd.b2.dienstplan-loesung-aushandeln` (u10) | `cd.b2.problem-benennen-verbessern` (u03)<br>`cd.b2.konflikt-beide-seiten` (u03)<br>`cd.b2.mitarbeitergespraech-ziele` (u03)<br>`cd.b2.schadensersatz-grenzen` (u04)<br>`cd.b2.verhandeln-punkte-betonen` (u04) |

### 5.3 Reserve (no unit yet)

| id | halfLevel | Mode | HF | Source | Fits |
|---|---|---|---|---|---|
| `cd.b2.argumentation-aufbauen` | b2.1 | Sprechen (zus.) | B | ZM·B2 | Spiralfaden „Meinung“, B2.1-Schritt in ZM-Fassung; die Entwürfe tragen ihn über SB-/GER-Zeilen (u05·2, u09·3) |
| `cd.b2.korrespondenz-verstehen` | b2.1 | Lesen | D | GER S. 75·B2 | Memo 05 B2.1 #12, zweite Zeile; passt zu u07 (Brief) oder einer Fokus-Karte |
| `cd.b2.gespraech-lenken` | b2.2 | Interaktion mdl. | D | ZM·B2 | Memo 05 B2.2 #3, erste Zeile; Alternative für u09·2 oder u12 |
| `cd.b2.gespraechskultur-foerdern` | b2.2 | Mediation | D, C | SB·B2 Mediation | Memo 05 B2.2 #10, zweite Zeile; Alternative für u12 |
| `cd.b2.reportagen-verstehen` | b2.2 | Hören | 9 | SB·B2; GER S. 73·B2 | Memo 05 B2.2 #13 (Fernsehen, Reportage); keine Einheit trägt ihn |
| `cd.b2.elterngespraech-fuehren` | b2.2 | Interaktion mdl. | 6 | RC 117–119; ZM·B2 | ALL-04: HF 6 (Kinder) kommt in keiner B2-Einheit vor; Id für eine DaZ-Fokus-Karte |


## 6. Gate notes for the curriculum and spec agents

1. **tb2 coverage.** With the additions every telc B2 Teil has at least one can-do in **each** half-level (§5.2). The can-do
   layer is not the coverage gate: COV-1…COV-5 count LS4 blocks and Aufgaben against the Teil templates of
   `lanes/tb2.json`, not can-dos. The two Sprachbausteine additions (`bericht-lueckentext`, `brief-sprachbausteine`) are
   deliberately form-focused; if the DaF reviewer rejects form-focused Lernziele, drop them and train SB in LS4 only — the
   gates allow that.
2. **ALL-02 (≥ 1 productive can-do proven by an Aufgabe).** Every unit has a `productive-*` can-do once the gate additions
   are taken. Two units needed one: **B2.1 u10** (the four draft lines are spoken, interactive or mediation; the writing
   Aufgabe „Nachricht an die Pflegedienstleitung" proved nothing → `engpass-an-leitung-schreiben`) and **B2.2 u09** (all four
   lines are interaction or reading; the forum post proved nothing → `forum-an-argumente-anknuepfen`, the written form of the
   ZM B2+ „Meinung" step). Map `proofs[].aufgabe` accordingly.
3. **ALL-06 online interaction.** B2.1: `online-gruppe-zusammenarbeiten`, `online-ideen-rechtfertigen` (u12). B2.2:
   `intranet-forum-diskutieren` (u10). Both half-levels pass on draft lines.
4. **ALL-06 mediation (from B1.1).** B2.1: u10·2, u11·3, u12·4. B2.2: u01·1, u07·1, u08·1, u12·1, u12·2. Pass.
5. **ALL-06 spiral threads (memo 05 §3), band steps:**

| Thread | B2.1 step | B2.2 step |
|---|---|---|
| Beschwerde | `zugestaendnisse-einfordern` (ZM B2) + `schriftlich-reklamieren` (BSK 28.4) — u04 | `schadensersatz-grenzen` (ZM B2+) + `formelle-beschwerde-frist` — u04 |
| Meinung | `pro-contra-schriftlich` (SB B2, u05), `ansicht-verteidigen` (GER S. 81, u09); ZM wording in reserve `argumentation-aufbauen` | `an-andere-anknuepfen` (ZM B2+) + `forum-an-argumente-anknuepfen` — u09 |
| Konsultation | `anerkennung-beratung` (BSK 2.5) — u08 | `mitarbeitergespraech-ziele` (BSK 20.4) — u03, **added**: no draft line carried the B2.2 step |
| Weitergeben | `luecken-umschreiben`, `eigene-fehler-kontrollieren` (GER/ZM B2) — u02, u01; `aussagen-anderer-wiedergeben` — u11 | `fachleute-muendlich-weitergeben`, `merkblatt-muendlich-erklaeren` (SB B2 Mediation), `zur-beteiligung-einladen` — u01, u08, u12 |

6. **ALL-06 work and care units** (not a can-do gate, noted for the spec agents): work units B2.1 u02, u03, u08, u09, u10, u12;
   B2.2 u03, u08, u10. Care/health workplace: B2.1 u10 (Pflege), B2.2 u08 (Hausarztpraxis) — two, as required.
7. **ALL-04 (each band covers all 12 Handlungsfelder).** Placed ids cover HF 1–5, 7–12 and A–E. **HF 6 (Kinder) appears in no
   B2 unit.** `cd.b2.elterngespraech-fuehren` exists for a DaZ Fokus-Karte (suggested: B2.1 u07 Zusammen leben or B2.2 u12);
   without it ALL-04 fails for the band. HF 11 is reached only through the B2.2 u05 tags (open issue 4).
8. **ALL-05 near-twins.** Several functions recur across the band at a higher step, each with its own id and situation:
   Vortrag verstehen (B2.1 u06 → B2.2 u02, u05), Vortrag halten (B2.1 u06, u12 → B2.2 u05, u07, u10), halbformelle Anfrage
   (B2.1 u06, u08 → B2.2 u02, u07), Haltung in Meinungstexten (B2.1 u01, u07, u09 → B2.2 u09, u11), Radiodiskussion
   (B2.1 u05 → B2.2 u01), Anzeigen mit „x" (B2.1 u08 → B2.2 u08). The ids differ in situation and in length/step; the DaF
   reviewer should confirm each is „a new function or a new step", not a repeat.
9. **Reserve ids are not placed.** A checker that flags unused registry ids will list the six of §5.3; that is expected.

## 7. Draft units vs BLUEPRINT §2.8 rows

The drafts re-slot the blueprint's B2 rows (BLUEPRINT §2.2 lets the curriculum agent do so); ids follow their situation.

| BLUEPRINT row | B2.1 draft unit | | BLUEPRINT row | B2.2 draft unit |
|---|---|---|---|---|
| 1 Heimat ist … | u01 | | 1 Beziehungen | u01 |
| 2 Wie wir miteinander reden | u02 | | 2 Ein Vortrag | u05 (Referat), u10 (Präsentation) |
| 3 Arbeit ist das halbe Leben? | u03 | | 3 Dafür oder dagegen? | u02, u09 |
| 4 Beschwerde mit Anspruch | u04 | | 4 Service und Schadensersatz | u04 |
| 5 Zusammen wohnen | u07 | | 5 Essen, Gesundheit, Fitness | u02 |
| 6 Presse mit Haltung | u11 | | 6 An der Uni | u05 |
| 7 An die Vorgesetzte (Pflege 1) | u10 | | 7 Kultur und Kunst | u06 |
| 8 Anerkennung und Bewerbung | u08 + u09 | | 8 Aus der Geschichte | u07 |
| 9 Ursachen und Folgen | u05 | | 9 Das Mitarbeitergespräch (Pflege 2) | u03 (+ `mitarbeitergespraech-ziele`); the second care unit is u08 (Praxis) |
| 10 Radio und Podcast | — (u02·1, u11·2 carry the listening goals) | | 10 Widerspruch einlegen | u11 |
| 11 Wissenschaft im Alltag | u06 | | 11 Sprache und Regionen | u12 |
| 12 Online zusammenarbeiten | u12 | | 12 Ein Blick in die Zukunft | u10 (+ u09 debate) |

## 8. Open issues

1. **Goethe-format Aufgaben under the tb2-only lane.** Many draft units keep Goethe B2 writing/speaking formats as their
   Aufgabe (writing: B2.1 u01, u02, u03, u05, u10, u11; B2.2 u01, u03, u05, u06, u09, u10, u12 — forum post or message to a
   superior; speaking Sp1/Sp2: B2.1 u02, u05, u06, u09, u12; B2.2 u02, u05, u07, u09, u10). The can-dos are communicative
   goals and stay valid, but the spec agents must decide whether these Aufgaben are re-cut to `tb2.sa` / `tb2.m1–m3` or kept
   as course tasks with a course rubric, and re-check the `proofs` mapping after any re-cut. Forum posts have no telc B2
   equivalent.
2. **„Productive" in ALL-02** is undefined for `mediation` and `interaction-*` (the same open issue as in the A2 notes). This
   registry was built so that every unit has a `productive-*` id, which passes under the strictest reading.
3. **B1+ items in a B2 course** (`telefonnotiz-weitergeben`, `weg-zum-ziel-erklaeren`): allowed by the enum; if a validator
   rule wants `band ≥ B2` for B2 half-levels, re-tag them after the DaF review rather than inventing a B2 source.
4. **HF 11 reading.** Tagging the Uni unit with HF 11 (Unterricht) is an interpretation; if the validator owner reads HF 11
   strictly as the Integrationskurs classroom, the band needs a Fokus-Karte for it too (no reserve id was made for it).
5. **Sources not re-checked against the primary PDFs** in this run (no network use): all tags come from memos 03, 05, 14 and
   the W2 drafts' own `source` strings. `RC 117–119` is a page range, not a single goal (the RC has no B2 goals; the B2 step of
   `elterngespraech-fuehren` rests on ZM B2). The `UT-B2` Teil tags must be aligned with `lanes/tb2.json` once it exists.
6. **Wording is ours but not yet reviewed** by the W2 DaF reviewer or run through LNG-01/02 (no Hunspell/LanguageTool here).
   Compounds to watch: *Studienteilnahme*, *Fördermöglichkeiten*, *Selbsthilfegruppen*, *Fachkraftstelle*, *Gesprächsrunde*,
   *Intranet-Forum*, *Forschungseinrichtung*, and the hyphenated „Was wäre, wenn …"-Überlegungen.
7. **Lernziel length.** 12–26 words (mean ≈ 19). No gate limits it; a shorter `de` is a meaning-preserving edit and keeps the id.
