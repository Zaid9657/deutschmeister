# Can-do registry B2 — notes for the level curriculum agents

**Date:** 2026-09-27 · **Owner (sole writer):** cando-b2 · **Registry:** [`content/course-v2/registries/cando/b2.json`](../../../content/course-v2/registries/cando/b2.json) (SCHEMA §4.1, `course-v2/cando@1`) ·
**Status:** W2 draft, revised after the W2 DaF review ([`reviews/w2/daf-cando.json`](../reviews/w2/daf-cando.json), 2026-09-27;
changes in §10), before the registry freeze (BLUEPRINT §10.3) · **Covers:** B2.1 and B2.2 · **Exam lane:** tb2 only.
**Inputs:** SCHEMA §2, §4.1, §8; BLUEPRINT §2.2, §2.3 (tb2 row), §2.8 (B2 rows), §9 (ALL-02, ALL-04, ALL-05, ALL-06, REF-01), §10.3;
[`curriculum/b2-1.json`](../curriculum/b2-1.json) + [`b2-2.json`](../curriculum/b2-2.json) (every can-do line);
research [05](../research/05-cando-b1-b2.md) (B2 can-do inventory, source codes, spiral threads), [14](../research/14-lehrwerke-curricula.md) §B5, §B6, §C
(Aspekte neu B2 / Sicher! aktuell B2 placement), [03](../research/03-exams-b2.md) §2 + §7 (telc Deutsch B2 Teile);
`registries/lanes/tb2.json` (Teil ids `tb2.lv1` … `tb2.m3`, read 2026-09-27: they match §5); the sibling notes
`cando-a1.md` and `cando-b1.md` (conventions, row key, B1 ids for §6).
**Lean execution (2026-09-27):** the only B2 lane is **tb2** (telc Deutsch B2). No can-do was added for Goethe B2 (gb2) or
DTB B2. Draft lines whose task shape is a Goethe Teil stay as course can-dos with the format kept in `source` (§5.2, last row).

## 1. What the registry holds

| Group | Items | What it is |
|---|---|---|
| Draft lines | 96 | every can-do line of `b2-1.json` (48) and `b2-2.json` (48), one id each, reworded (§2); no merges |
| tb2 and gate additions (W2 draft) | 11 | telc B2 Teile that no draft line trains (LV1, LV2 ×2, LV3, SB1, SB2, HV2, HV3) and three gate ids (ALL-02 writing, ALL-06 Konsultation) — §5.1 |
| Review additions | 8 | the §2.8 Kern-Kann lines no draft line carried (Mediation Sachtext, Kritik ×2, Bescheid, Varietäten), an interactive id for B2.1 U10, and one Sprachbausteine id each for B2.1 SB1 and B2.2 SB2 — §5.1 |
| Former reserve | 6 | now all placed: `reportagen-verstehen` core in B2.2 U11, the other five as *more* (§5.3) |
| **Total** | **121** | halfLevel b2.1: 60 · b2.2: 61 · core: 54 + 53 · never core (*more* only): 6 + 8 |

Modes: receptive-written 25 · receptive-spoken 16 · productive-written 25 · productive-spoken 18 · interaction-spoken 24 ·
interaction-written 3 · mediation 10. Band: B2 119 · B2+ 2 (no B1+ left, §2).

## 2. Conventions

- **Unit ids are the BLUEPRINT §2.8 rows, not the W2 draft numbers** (as in `cando-a1.md` and `cando-b1.md`). BLUEPRINT
  §10.3 has the curriculum agent convert the W2 draft onto the rows; the B2 drafts re-slot the rows (e.g. draft `b2.1-u05`
  is Konsum, row 5 is Zusammen wohnen), so the draft numbers appear only in the *W2 lines* column of §3 and in §4 and §8.
- **Core** = the 3–5 can-dos the unit lists in its Lernziele box (`spec.canDos` = `start.lernziele`) and proves in
  „Das kann ich" (ALL-02). Every core set has ≥ 1 `productive-*` or `interaction-*` id (what ALL-02 counts). **Each id is
  core in exactly one unit.** **More** = spiral reuse, a Vorschau inside the same half, a Fokus-Karte or an optional task;
  reference those ids in Aufgaben, lane blocks and review, not in the Lernziele box. A curriculum agent may swap a core id
  for one from the same row's *more* column with a logged `deviation`; it may not invent an id (REF-01).
- **No B2.1 unit references a B2.2 id** (checked). B2.2 rows reuse B2.1 ids only in *more*.
- **halfLevel** = the half where the id is core; a never-core id takes the half of its first *more* placement
  (`elterngespraech-fuehren` therefore moved from b2.2 to b2.1: its Fokus card sits on B2.1 U5).
- **band** = the CEFR level at which the course expects the performance (the A1/B1 reading, adopted after the review; the
  level of the source descriptor stays in the `source` tag): **B2** by default; **B2+** only where B2.2 expects a B2+
  performance and the source is a ZM B2+ feature (`schadensersatz-grenzen`, `an-andere-anknuepfen`, both B2.2 core). Memo 05
  puts B2.1 at „B1+ → B2 lower end" and B2.2 at „B2 → B2+"; a B1+ Lernziel in a B2 course would claim the course teaches
  B1+, so the two former B1+ ids were raised to a B2 performance (§6, §10) and no id is tagged below B2.
- **Wording.** `de` is our own ich-Form sentence. The W2 drafts copy CEFR/BSK/Begleitband wording with only the person
  changed (memo 05 §1), so every draft line was rewritten, and examples are concrete for the row's situation. Scripted check
  (re-run after the review fixes, for every changed or new `de`): after the shared „Ich kann" the longest common word run
  with any draft line of `b2-1/b2-2/b1-1/b1-2.json`, any „Ich kann …" line of memo 05 and any `de` of the B1 registry is
  **4 words** (`zeitungsartikel-wortwahl`, `nominalstil-umformen`, `konflikt-nachricht-vorgesetzte`, `erfahrung-erzaehlen`:
  frames like „in eine Lücke passt"); the unchanged items were at ≤ 4 in the first run. Items run 12–29 words (mean ≈ 20).
  **No exam lengths or Goethe formats in `de`:** word counts, minutes and „Prüfungslänge" belong in the unit's task spec;
  only the two ids filed under `tb2.sa` whose task is the telc e-mail keep „mit mindestens 150 Wörtern"
  (`anfrage-krankenkasse-mail`, `formelle-beschwerde-frist`).
- **Ids.** `cd.b2.<slug>`, German, ASCII-folded, naming the function or situation, never the unit number. An id is
  **renamed** when its function changes or its slug names a figure the text no longer carries; a sharper B2 step inside the
  same function keeps the id. Nothing references a B2 id yet and no ledger entry exists, so the five renames of §10 cost
  nothing downstream; the orchestrator's compile step should still record them as tombstones (ID-01).
- **mode.** Hören/Lesen → `receptive-*`; monologue, Vortrag, narrative (telc M1 type) → `productive-spoken`; e-mails,
  letters, posts, reviews, Widerspruch → `productive-written`; discussion, negotiation, planning, consultation, interview →
  `interaction-spoken`; chat, video conference, intranet forum → `interaction-written`; relaying or summarising for a third
  person, moderating → `mediation`. `luecken-umschreiben` and `eigene-fehler-kontrollieren` (strategies) are
  `productive-spoken` because they are practised and proven while speaking.
- **mediation — shared rule (as stated in `cando-b1.md` §9):**
  > `mediation: true` whenever the can-do relays or relates content for a third party, whatever its `mode`.
  > `mode: mediation` is used when the relaying itself is the proof channel (spoken relay, a note for someone else);
  > otherwise `mode` names the channel of the proof (a written summary is `productive-written`, a relayed opinion
  > in a discussion `interaction-spoken`). ALL-06 counts the flag, not the mode.

  In B2 every relaying id has `mode: mediation`, so the flag and the mode coincide (10 ids): B2.1 `telefonnotiz-weitergeben`,
  `aussagen-anderer-wiedergeben`, `sachtext-fuer-andere-zusammenfassen`, `vortrag-schriftlich-weitergeben`; B2.2
  `fachleute-muendlich-weitergeben`, `diskussion-buendeln`, `merkblatt-muendlich-erklaeren`, `zeitzeugin-wiedergeben`,
  `zur-beteiligung-einladen`, `gespraechskultur-foerdern`. `telefonnotiz-weitergeben` keeps mode `mediation` although it
  is written: the note for colleagues is the relay (Begleitband „Relaying specific information in writing").
- **online** = `true` only for interaction in a digital channel: `online-gruppe-zusammenarbeiten`, `online-ideen-rechtfertigen`
  (B2.1 U12), `intranet-forum-diskutieren` (B2.2 U12). A single forum post written as an exam genre is `productive-written`,
  `online: false` (same rule as A2 and B1).
- **hf** = BAMF Handlungsfeld(er) 1–12 and cross-cutting A–E of the **row where the id is core** (BLUEPRINT §2.8), narrowed
  per line; ids moved to a new row took its field (e.g. `radio-standpunkte-erfassen` 2, 9 → 9; `an-andere-anknuepfen`
  10 → 2, C, B). The drafts' **BSK** cross-cutting letters mean something else and were translated: BSK A soziale Kontakte →
  **D**, BSK B Dissens → **C**, BSK C Gefühle/Meinungen → **B**, BSK D Informationsaustausch → the row's field. Occurrences:
  1: 6 · 2: 38 · 3: 4 · 4: 16 · 5: 4 · 6: 1 · 7: 14 · 8: 16 · 9: 27 · 10: 3 · 11: 4 · 12: 5 · A: 7 · B: 23 · C: 17 · D: 16 · E: 7.
- **source** keeps memo 05's and memo 03's codes in `CODE·Band` style (never shown on screen):

| Tag | Document |
|---|---|
| `SB·B2`, `SB·B2 Online`, `SB·B2 Mediation` | Begleitband zum GER, Anhang 2 (self-assessment grid with online interaction and mediation) |
| `ZM·B2`, `ZM·B2+` | Begleitband, Anhang 1 *Zentrale Merkmale* (no `ZM·B1+` tag is left) |
| `E8·B2` | Begleitband, Anhang 8 *Ergänzende Deskriptoren* |
| `GER S. n·B2` | GER-2001 German scale as reprinted in the telc Deutsch B2 Handbuch, page n |
| `GER 4.4.3.1·B2` | GER-2001 §4.4.3.1, scale „Interviewgespräche", B2 row (section number, page not checked — open issue 5) |
| `BSK x.y·B2` · `BSK-Q·B2` | DeuFöV Lernzielkatalog A2–C1, Feinlernziel x.y, B2 descriptor · the B2 qualifier wording (memo 05 §2.3) |
| `KK-B2 GLZ 35` | BAMF Kurskonzept Basiskurs B2, Groblernziel 35 |
| `PZ-B2 4.2.2` | Goethe-Zertifikat B2 Prüfungsziele (2007) |
| `RC 117–119` | Rahmencurriculum, HF 6 pages (memo 04 page ranges) |
| `UT-B2 <Teil>` | telc Deutsch B2 Übungstest 1: `LV1–3`, `SB1–2`, `HV1–3`, `SA` (`SA-A` Bitte um Informationen, `SA-B` Beschwerde), `M1–M3` (memo 03 §2) = `tb2.<teil>` |
| `GI-B2 <Teil>` | Goethe-Zertifikat B2 (modular) Teil `L1–L5`, `H1–H4`, `S1–S2`, `Sp1–Sp2` (memo 03 §1) — a format provenance tag, not a lane reference |
| `As-B2 K#` · `Si-B2 L#` | Aspekte neu B2 Kapitel · Sicher! aktuell B2 Lektion (memo 14 §B5/§B6; BLUEPRINT §2.8 *Leaders*) — for form-focused lines and the Kritik/Varietäten rows |

## 3. Unit → can-do ids (BLUEPRINT §2.8 rows — use this table)

*Prüfungsteile* = the row's tB2 Teile (bold = full length in Prüfungsmodus, .2 only). *More* ids are written without the
`cd.b2.` prefix. *W2 lines* = draft unit and line number(s) (`#n` = position in the draft's `canDo` array) whose ids the
row carries, plus additions (§5.1); full line list in §4.

### B2.1 — „Argumentieren und im Detail verstehen“

| Unit | Titel | Prüfungsteile (tB2) | Core (Lernziele, 3–5) | More (spiral · Vorschau · Fokus · optional) | W2 lines |
|---|---|---|---|---|---|
| `b2.1-u01` | Heimat ist … | M1, LV1 | `cd.b2.heimat-stellung-nehmen` · `cd.b2.erfahrung-erzaehlen` · `cd.b2.forum-einstellungen-erkennen` · `cd.b2.erfahrungsberichte-ueberschriften` | `argumentation-aufbauen` · `korrespondenz-verstehen` | b2.1-u01 #1–#3 + b2.1-u03 LV1-Zusatz |
| `b2.1-u02` | Wie wir miteinander reden | M2, HV2 | `cd.b2.du-oder-sie-diskutieren` · `cd.b2.ansicht-verteidigen` · `cd.b2.luecken-umschreiben` · `cd.b2.missverstaendnis-klaeren-schriftlich` | `radio-standpunkte-erfassen` · `informell-mitdiskutieren` | b2.1-u02 #2–#4 + b2.1-u09 #3 |
| `b2.1-u03` | Arbeit ist das halbe Leben? | LV2, SB2, HV3 | `cd.b2.gehaltsabrechnung-verstehen` · `cd.b2.arbeitsvertrag-nachfragen` · `cd.b2.artikel-zusammenfassen-diskutieren` · `cd.b2.abrechnung-reklamieren-schriftlich` · `cd.b2.artikel-im-detail` | `bericht-lueckentext` · `reise-ansagen-einmal` · `missverstaendnis-klaeren-schriftlich` | b2.1-u03 #1–#4 + b2.1-u05 LV2-Zusatz |
| `b2.1-u04` | Beschwerde mit Anspruch | SA (B), SB1 | `cd.b2.zugestaendnisse-einfordern` · `cd.b2.schriftlich-reklamieren` · `cd.b2.reisebedingungen-verstehen` · `cd.b2.vorgehen-gemeinsam-planen` · `cd.b2.brief-grammatik-kontext` | `abrechnung-reklamieren-schriftlich` · `reise-ansagen-einmal` | b2.1-u04 #1–#4 + neu (SB1) |
| `b2.1-u05` | Zusammen wohnen | M3, LV3 | `cd.b2.informell-mitdiskutieren` · `cd.b2.fest-planen-kompromiss` · `cd.b2.leserkommentare-haltung` · `cd.b2.interview-wohnprojekt-einmal` · `cd.b2.brief-gefuehle-abstufen` | `elterngespraech-fuehren` · `korrespondenz-verstehen` · `kursanzeigen-auswaehlen` · `vorgehen-gemeinsam-planen` | b2.1-u07 #1–#4 + HV2-Zusatz |
| `b2.1-u06` | Presse mit Haltung | LV1, HV1 | `cd.b2.artikel-mit-haltung-lesen` · `cd.b2.zu-artikel-stellung-nehmen` · `cd.b2.aussagen-anderer-wiedergeben` | `nachrichten-einmal-hoeren` · `forum-einstellungen-erkennen` · `erfahrungsberichte-ueberschriften` | b2.1-u11 #1, #3, #4 |
| `b2.1-u07` | An die Vorgesetzte (Pflege 1) | SA, M3, SB1 | `cd.b2.uebergabe-einschaetzen` · `cd.b2.telefonnotiz-weitergeben` · `cd.b2.rueckmeldung-arbeit` · `cd.b2.dienstplan-loesung-aushandeln` · `cd.b2.engpass-an-leitung-schreiben` | `missverstaendnis-klaeren-schriftlich` · `brief-grammatik-kontext` · `fest-planen-kompromiss` | b2.1-u10 #1–#4 + Gate-Zusatz (SA) |
| `b2.1-u08` | Anerkennung und Bewerbung | SA (A), LV3, M1 | `cd.b2.anerkennung-beratung` · `cd.b2.qualifikationen-darstellen` · `cd.b2.anfrage-weiterbildung-mail` · `cd.b2.kursanzeigen-auswaehlen` · `cd.b2.anschreiben-verfassen` | `weiterbildungswunsch-begruenden` · `karriereforum-haltungen` · `erfahrung-erzaehlen` | b2.1-u08 #1, #3, #4 + b2.1-u09 #1, #2 (u08 #2, u09 #4 → more) |
| `b2.1-u09` | Ursachen und Folgen | M2, HV2 | `cd.b2.konsum-annahmen-aeussern` · `cd.b2.radiodiskussion-meinungen-zuordnen` · `cd.b2.pro-contra-schriftlich` · `cd.b2.forumsbeitrag-gliedern` | `argumentation-aufbauen` · `uebergabe-einschaetzen` · `artikel-zusammenfassen-diskutieren` | b2.1-u05 #1–#4 |
| `b2.1-u10` | Radio und Podcast | HV1, HV3 | `cd.b2.radio-standpunkte-erfassen` · `cd.b2.nachrichten-einmal-hoeren` · `cd.b2.reise-ansagen-einmal` · `cd.b2.podcast-interview-fuehren` | `radiodiskussion-meinungen-zuordnen` · `interview-wohnprojekt-einmal` · `aussagen-anderer-wiedergeben` | b2.1-u02 #1 + b2.1-u11 #2 + b2.1-u04 HV3-Zusatz + neu |
| `b2.1-u11` | Wissenschaft im Alltag | LV2, SB2 | `cd.b2.vortrag-gezielt-hoeren` · `cd.b2.sachtext-verweise-verstehen` · `cd.b2.sachtext-fuer-andere-zusammenfassen` · `cd.b2.anfrage-studie-mail` · `cd.b2.bericht-lueckentext` | `kurzvortrag-halten` · `artikel-im-detail` | b2.1-u06 #1, #3, #4 + b2.1-u12 SB2-Zusatz + neu (u06 #2 → more) |
| `b2.1-u12` | Online zusammenarbeiten | M1, SA → Halbtest | `cd.b2.online-gruppe-zusammenarbeiten` · `cd.b2.online-ideen-rechtfertigen` · `cd.b2.projekt-praesentieren` · `cd.b2.vortrag-schriftlich-weitergeben` · `cd.b2.eigene-fehler-kontrollieren` | `luecken-umschreiben` · `kurzvortrag-halten` · `engpass-an-leitung-schreiben` | b2.1-u12 #1–#4 + b2.1-u01 #4 |

### B2.2 — „Wirkungsvoll diskutieren, vortragen, vermitteln“

| Unit | Titel | Prüfungsteile (tB2) | Core (Lernziele, 3–5) | More (spiral · Vorschau · Fokus · optional) | W2 lines |
|---|---|---|---|---|---|
| `b2.2-u01` | Beziehungen | **LV1**, HV1 | `cd.b2.freundschaft-gefuehle` · `cd.b2.fachleute-muendlich-weitergeben` · `cd.b2.forumsbeitrag-ausfuehrlich` · `cd.b2.radiodiskussion-drei-stimmen` · `cd.b2.forum-aussagen-zuordnen` | `brief-gefuehle-abstufen` · `forum-einstellungen-erkennen` | b2.2-u01 #1–#4 + b2.2-u09 #4 |
| `b2.2-u02` | Ein Vortrag | **M1**, HV2 | `cd.b2.sachverhalt-darstellen` · `cd.b2.praesentation-abteilung` · `cd.b2.nominalstil-umformen` | `projekt-praesentieren` · `kurzvortrag-halten` · `vortrag-argumentation-folgen` | b2.2-u07 #2 + b2.2-u10 #1 + b2.2-u05 #4 |
| `b2.2-u03` | Dafür oder dagegen? | **M2**, LV2 | `cd.b2.pro-contra-diskutieren` · `cd.b2.an-andere-anknuepfen` · `cd.b2.diskussion-buendeln` · `cd.b2.magazinartikel-im-detail` · `cd.b2.forum-an-argumente-anknuepfen` | `ansicht-verteidigen` · `artikel-zusammenfassen-diskutieren` · `gespraechskultur-foerdern` | b2.2-u02 #3 + b2.2-u09 #1 + Gate-Zusatz + b2.2-u12 #2 + b2.2-u01 LV2-Zusatz |
| `b2.2-u04` | Service und Schadensersatz | **SA** (B, ≥ 150 W), M3 | `cd.b2.schadensersatz-grenzen` · `cd.b2.verhandeln-punkte-betonen` · `cd.b2.vertragsbedingungen-ansprueche` · `cd.b2.formelle-beschwerde-frist` · `cd.b2.beschwerde-beantworten` | `zugestaendnisse-einfordern` · `schriftlich-reklamieren` | b2.2-u04 #1–#4 + b2.2-u08 #2 |
| `b2.2-u05` | Essen, Gesundheit, Fitness | **HV2**, LV2 | `cd.b2.vortrag-argumentation-folgen` · `cd.b2.wege-zum-ziel-vergleichen` · `cd.b2.anfrage-krankenkasse-mail` · `cd.b2.merkblatt-muendlich-erklaeren` | `vor-nachteile-erlaeutern-patienten` · `forumsbeitrag-ausfuehrlich` · `vortrag-gezielt-hoeren` | b2.2-u02 #1, #2, #4 + b2.2-u08 #1 |
| `b2.2-u06` | An der Uni | **LV2**, HV2 | `cd.b2.studienordnung-verstehen` · `cd.b2.vorlesung-notieren` · `cd.b2.referat-halten` · `cd.b2.sprachforschung-interview` | `nominalstil-umformen` · `partizipialattribute-aufloesen` · `sachtext-verweise-verstehen` | b2.2-u05 #1–#3 + b2.2-u12 #3 |
| `b2.2-u07` | Kultur und Kunst | **LV1**, SB2 | `cd.b2.kritik-verstehen` · `cd.b2.kritik-schreiben` · `cd.b2.meldungen-ueberschriften` · `cd.b2.film-buch-erzaehlen` · `cd.b2.partizipialattribute-aufloesen` | `kulturnachrichten-hoeren` · `kulturpolitik-position` · `zeitungsartikel-wortwahl` | neu (2) + b2.2-u06 #1, #2 + b2.2-u10 #2 (u06 #3, #4 → more) |
| `b2.2-u08` | Aus der Geschichte | **HV1**, M2 | `cd.b2.zeitzeugin-wiedergeben` · `cd.b2.zeitzeugen-interview-einmal` · `cd.b2.anfrage-archiv-mail` | `sachverhalt-darstellen` · `reportagen-verstehen` · `aussagen-anderer-wiedergeben` | b2.2-u07 #1, #3, #4 |
| `b2.2-u09` | Das Mitarbeitergespräch (Pflege 2) | **M3**, SB1 | `cd.b2.mitarbeitergespraech-ziele` · `cd.b2.problem-benennen-verbessern` · `cd.b2.auf-kritik-reagieren` · `cd.b2.konflikt-beide-seiten` · `cd.b2.konflikt-nachricht-vorgesetzte` | `vor-nachteile-erlaeutern-patienten` · `empfang-telefon-einmal` · `rueckmeldung-arbeit` · `brief-sprachbausteine` | b2.2-u03 #1–#4 + Gate-Zusatz (u08 #3, #4 → more) |
| `b2.2-u10` | Widerspruch einlegen | **SA** (A/B), **SB1** | `cd.b2.bescheid-verstehen` · `cd.b2.widerspruch-begruenden` · `cd.b2.kuendigung-schreiben` · `cd.b2.formelle-konventionen` · `cd.b2.brief-sprachbausteine` | `stellungnahmen-einordnen` · `formelle-beschwerde-frist` | neu + b2.2-u11 #1–#3 + b2.2-u06 SB1-Zusatz (u11 #4 → more) |
| `b2.2-u11` | Sprache und Regionen | **HV3**, **LV3** | `cd.b2.reportagen-verstehen` · `cd.b2.varietaeten-erkennen` · `cd.b2.sprachen-dialekte-erzaehlen` · `cd.b2.beratungsangebote-auswaehlen` | `empfang-telefon-einmal` · `sprachforschung-interview` · `kursanzeigen-auswaehlen` | Reserve → Kern + neu + b2.2-u12 #4 + b2.2-u08 LV3-Zusatz |
| `b2.2-u12` | Ein Blick in die Zukunft | **SB2**, **M2**, LV3 | `cd.b2.fliessend-mitreden` · `cd.b2.rederecht-behalten` · `cd.b2.intranet-forum-diskutieren` · `cd.b2.zur-beteiligung-einladen` · `cd.b2.zeitungsartikel-wortwahl` | `arbeitsmarkt-interview-details` · `gespraech-lenken` · `gespraechskultur-foerdern` · `an-andere-anknuepfen` | b2.2-u09 #2, #3 + b2.2-u10 #4 + b2.2-u12 #1 + neu (u10 #3 → more) |

The Diagnose (B2.2, free), the Halbtest (after B2.1 U12) and the Prüfungswochen carry no Lernziele of their own; they
report per Teil (BLUEPRINT §5).

**Checks (scripted, 2026-09-27):** every one of the 121 ids is placed (core or *more*); 3–5 core per row; each id core
exactly once and in its halfLevel; ≥ 1 `productive-*`/`interaction-*` core id per row; no B2.1 row references a b2.2 id;
per half ≥ 1 online-interaction core id and ≥ 1 mediation core id; `mediation` flag = mode `mediation`; no band below B2.

## 4. W2 draft line → id (all 96 lines)

`Line` = draft unit·position in the draft's `canDo` array (W2 numbers, **not** rows). *Core in* = the §2.8 row where the id
is a Lernziel; `more:` = never core, listed as *more* in those rows. Draft tag = the draft line's `source` string, kept for
traceability.

### B2.1

| Line | id | Mode | Band | Core in (row) | tb2 Teil | Source tag(s) | Draft tag (W2 file) |
|---|---|---|---|---|---|---|---|
| u01·1 | `cd.b2.forum-einstellungen-erkennen` | Lesen | B2 | **B2.1 U01** | — (GI L1/L4) | GI-B2 L1; GI-B2 L4 | 05-cando-b1-b2 B2.1 #3 · ≈ GI-B2 Lesen T1/T4 |
| u01·2 | `cd.b2.heimat-stellung-nehmen` | Schreiben | B2 | **B2.1 U01** | — (GI S1) | SB·B2; GI-B2 S1 | 05-cando-b1-b2 B2.1 #2 (≈, auf B2.1-Länge verkürzt) · GI-B2 Schreiben T1 |
| u01·3 | `cd.b2.erfahrung-erzaehlen` | Sprechen (zus.) | B2 | **B2.1 U01** | M1 | UT-B2 M1 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T1 |
| u01·4 | `cd.b2.eigene-fehler-kontrollieren` | Sprechen (zus.) | B2 | **B2.1 U12** | — | ZM·B2 | 05-cando-b1-b2 B2.1 #13 · ZM B2 |
| u02·1 | `cd.b2.radio-standpunkte-erfassen` | Hören | B2 | **B2.1 U10** | HV2 | GER S. 73·B2 | 05-cando-b1-b2 B2.1 #7 · GER S. 73 B2 |
| u02·2 | `cd.b2.missverstaendnis-klaeren-schriftlich` | Schreiben | B2 | **B2.1 U02** | SA | GI-B2 S2 | 05-cando-b1-b2 B2.1 #10 (≈) · GI-B2 Schreiben T2 |
| u02·3 | `cd.b2.du-oder-sie-diskutieren` | Interaktion mdl. | B2 | **B2.1 U02** | M2 | GI-B2 Sp2 | ≈ 03-exams-b2 §1 · Goethe B2 Sprechen T2 (Kriterium Interaktion, Du/Sie-Register) |
| u02·4 | `cd.b2.luecken-umschreiben` | Sprechen (zus.) | B2 | **B2.1 U02** | — | GER S. 70·B2 | 05-cando-b1-b2 B2.1 #13 · GER S. 70 B2 |
| u03·1 | `cd.b2.gehaltsabrechnung-verstehen` | Lesen | B2 | **B2.1 U03** | — | BSK 38.1·B2 | 05-cando-b1-b2 B2.1 #11 · BSK 38.1 B1/B2 |
| u03·2 | `cd.b2.arbeitsvertrag-nachfragen` | Interaktion mdl. | B2 | **B2.1 U03** | — | BSK 36.2·B2 | 05-cando-b1-b2 B2.1 #11 · BSK 36.2 B2 |
| u03·3 | `cd.b2.artikel-zusammenfassen-diskutieren` | Sprechen (zus.) | B2 | **B2.1 U03** | M2 | SB·B2; UT-B2 M2 | 05-cando-b1-b2 B2.1 #1 · SB B2; ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T2 |
| u03·4 | `cd.b2.abrechnung-reklamieren-schriftlich` | Schreiben | B2 | **B2.1 U03** | SA | GI-B2 S2; BSK-Q·B2 | ≈ 05-cando-b1-b2 B2.1 #10 · GI-B2 Schreiben T2; BSK-Qualifikator B2 (05 §2.3) |
| u04·1 | `cd.b2.zugestaendnisse-einfordern` | Interaktion mdl. | B2 | **B2.1 U04** | — | ZM·B2 | 05-cando-b1-b2 B2.1 #4 · ZM B2 |
| u04·2 | `cd.b2.schriftlich-reklamieren` | Schreiben | B2 | **B2.1 U04** | SA | BSK 28.4·B2; UT-B2 SA-B | 05-cando-b1-b2 B2.1 #4 · BSK 28.4 B2 |
| u04·3 | `cd.b2.reisebedingungen-verstehen` | Lesen | B2 | **B2.1 U04** | — (GI L5) | GI-B2 L5 | ≈ 03-exams-b2 §1 · GI-B2 Lesen T5 |
| u04·4 | `cd.b2.vorgehen-gemeinsam-planen` | Interaktion mdl. | B2 | **B2.1 U04** | M3 | UT-B2 M3 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T3 |
| u05·1 | `cd.b2.forumsbeitrag-gliedern` (was `forumsbeitrag-vier-punkte`) | Schreiben | B2 | **B2.1 U09** | — (GI S1) | GI-B2 S1 | 05-cando-b1-b2 B2.1 #2 · ≈ GI-B2 Schreiben T1 |
| u05·2 | `cd.b2.pro-contra-schriftlich` | Schreiben | B2 | **B2.1 U09** | — | SB·B2 | 05-cando-b1-b2 B2.1 #2 · SB B2 |
| u05·3 | `cd.b2.konsum-annahmen-aeussern` | Sprechen (zus.) | B2 | **B2.1 U09** | — | ZM·B2; PZ-B2 4.2.2 | 05-cando-b1-b2 B2.1 #5 · ZM B2; PZ-B2 4.2.2 |
| u05·4 | `cd.b2.radiodiskussion-meinungen-zuordnen` | Hören | B2 | **B2.1 U09** | — (GI H3) | GI-B2 H3 | ≈ 03-exams-b2 §1 · GI-B2 Hören T3 |
| u06·1 | `cd.b2.vortrag-gezielt-hoeren` | Hören | B2 | **B2.1 U11** | — (GI H4) | GI-B2 H4 | 05-cando-b1-b2 B2.2 #8 (vorgezogen, verkürzt) · GI-B2 Hören T4 |
| u06·2 | `cd.b2.kurzvortrag-halten` | Sprechen (zus.) | B2 | more: U11, U12, U02 | M1 | GI-B2 Sp1 | 05-cando-b1-b2 B2.2 #1 (≈, verkürzt) · GI-B2 Sprechen T1 |
| u06·3 | `cd.b2.anfrage-studie-mail` | Schreiben | B2 | **B2.1 U11** | SA | UT-B2 SA-A | ≈ 03-exams-b2 §2 · telc B2 Schriftlicher Ausdruck, Aufgabe A |
| u06·4 | `cd.b2.sachtext-verweise-verstehen` | Lesen | B2 | **B2.1 U11** | — (GI L2) | GI-B2 L2 | ≈ 03-exams-b2 §7 · GI-B2 Lesen T2 (Kohäsion) |
| u07·1 | `cd.b2.leserkommentare-haltung` | Lesen | B2 | **B2.1 U05** | — (GI L4) | GI-B2 L4; SB·B2 | 05-cando-b1-b2 B2.1 #3 · ≈ GI-B2 Lesen T4 |
| u07·2 | `cd.b2.informell-mitdiskutieren` | Interaktion mdl. | B2 | **B2.1 U05** | M3 | GER S. 81·B2 | 05-cando-b1-b2 B2.1 #6 · GER S. 81 B2 |
| u07·3 | `cd.b2.brief-gefuehle-abstufen` | Schreiben | B2 | **B2.1 U05** | — | GER S. 86·B2 | 05-cando-b1-b2 B2.1 #12 · GER S. 86 B2 |
| u07·4 | `cd.b2.fest-planen-kompromiss` | Interaktion mdl. | B2 | **B2.1 U05** | M3 | UT-B2 M3 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T3 |
| u08·1 | `cd.b2.anerkennung-beratung` | Interaktion mdl. | B2 | **B2.1 U08** | — | BSK 2.5·B2 | 05-cando-b1-b2 B2.1 #9 · BSK 2.5 B2 |
| u08·2 | `cd.b2.weiterbildungswunsch-begruenden` | Sprechen (zus.) | B2 | more: U08 | M1 | BSK 41.3·B2 | 05-cando-b1-b2 B2.1 #9 · BSK 41.3 B2 |
| u08·3 | `cd.b2.kursanzeigen-auswaehlen` | Lesen | B2 | **B2.1 U08** | LV3 | UT-B2 LV3 | ≈ 03-exams-b2 §2 · telc B2 Leseverstehen T3 |
| u08·4 | `cd.b2.anfrage-weiterbildung-mail` | Schreiben | B2 | **B2.1 U08** | SA | UT-B2 SA-A | ≈ 03-exams-b2 §2 · telc B2 Schriftlicher Ausdruck, Aufgabe A |
| u09·1 | `cd.b2.anschreiben-verfassen` | Schreiben | B2 | **B2.1 U08** | SA | BSK 5.2·B2 | 05-cando-b1-b2 B2.1 #8 · BSK 5.2 B2 |
| u09·2 | `cd.b2.qualifikationen-darstellen` | Sprechen (zus.) | B2 | **B2.1 U08** | M1 | BSK 6.4·B2 | 05-cando-b1-b2 B2.1 #8 · BSK 6.4 B2 |
| u09·3 | `cd.b2.ansicht-verteidigen` | Interaktion mdl. | B2 | **B2.1 U02** | M2 | GER S. 81·B2 | 05-cando-b1-b2 B2.1 #6 · GER S. 81 B2 |
| u09·4 | `cd.b2.karriereforum-haltungen` | Lesen | B2 | more: U08 | — (GI L1) | GI-B2 L1 | ≈ 03-exams-b2 §1 · GI-B2 Lesen T1 |
| u10·1 | `cd.b2.uebergabe-einschaetzen` | Sprechen (zus.) | B2 | **B2.1 U07** | — | ZM·B2 | 05-cando-b1-b2 B2.1 #5 · ZM B2 |
| u10·2 | `cd.b2.telefonnotiz-weitergeben` | Mediation | B2 | **B2.1 U07** | HV3 | SB·B2 Mediation; UT-B2 HV3 | ≈ ZM B1+ (05 §2.2); Arbeitsplatzaufgabe, kein Prüfungsformat |
| u10·3 | `cd.b2.rueckmeldung-arbeit` | Interaktion mdl. | B2 | **B2.1 U07** | — | BSK 20.2·B2 | 05-cando-b1-b2 B2.1 #10 · BSK 20.2 B2 |
| u10·4 | `cd.b2.dienstplan-loesung-aushandeln` | Interaktion mdl. | B2 | **B2.1 U07** | M3 | UT-B2 M3 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T3 |
| u11·1 | `cd.b2.artikel-mit-haltung-lesen` | Lesen | B2 | **B2.1 U06** | LV2 | SB·B2 | 05-cando-b1-b2 B2.1 #3 · SB B2 |
| u11·2 | `cd.b2.nachrichten-einmal-hoeren` | Hören | B2 | **B2.1 U10** | HV1 | UT-B2 HV1 | ≈ 03-exams-b2 §2 · telc B2 Hörverstehen T1; 05 B2.2 #13 (vorbereitet) |
| u11·3 | `cd.b2.aussagen-anderer-wiedergeben` | Mediation | B2 | **B2.1 U06** | M2 | SB·B2 Mediation | ≈ eigene Formulierung nach SB B2 Mediation (05 B2.2 #9, vorbereitet) |
| u11·4 | `cd.b2.zu-artikel-stellung-nehmen` | Schreiben | B2 | **B2.1 U06** | — (GI S1) | SB·B2; GI-B2 S1 | 05-cando-b1-b2 B2.1 #2 (≈) · SB B2 |
| u12·1 | `cd.b2.online-gruppe-zusammenarbeiten` | Interaktion schr. (online) | B2 | **B2.1 U12** | — | SB·B2 Online | 05-cando-b1-b2 B2.1 #14 · SB B2 Online-Interaktion |
| u12·2 | `cd.b2.online-ideen-rechtfertigen` | Interaktion schr. (online) | B2 | **B2.1 U12** | — | SB·B2 Online | 05-cando-b1-b2 B2.1 #14 · SB B2 Online-Interaktion |
| u12·3 | `cd.b2.projekt-praesentieren` | Sprechen (zus.) | B2 | **B2.1 U12** | M1 | GI-B2 Sp1 | 05-cando-b1-b2 B2.2 #1 (≈, verkürzt) · GI-B2 Sprechen T1 |
| u12·4 | `cd.b2.vortrag-schriftlich-weitergeben` | Mediation | B2 | **B2.1 U12** | — | SB·B2 Mediation | ≈ SB B2 Mediation (05 B2.2 #9, vorbereitet) |

### B2.2

| Line | id | Mode | Band | Core in (row) | tb2 Teil | Source tag(s) | Draft tag (W2 file) |
|---|---|---|---|---|---|---|---|
| u01·1 | `cd.b2.fachleute-muendlich-weitergeben` | Mediation | B2 | **B2.2 U01** | M2 | SB·B2 Mediation | 05-cando-b1-b2 B2.2 #9 · SB B2 Mediation |
| u01·2 | `cd.b2.radiodiskussion-drei-stimmen` | Hören | B2 | **B2.2 U01** | — (GI H3) | GI-B2 H3 | ≈ 03-exams-b2 §1 · GI-B2 Hören T3 |
| u01·3 | `cd.b2.forumsbeitrag-ausfuehrlich` (was `forumsbeitrag-150-woerter`) | Schreiben | B2 | **B2.2 U01** | — (GI S1) | GI-B2 S1 | 05-cando-b1-b2 B2.1 #2 (Prüfungslänge) · GI-B2 Schreiben T1 |
| u01·4 | `cd.b2.freundschaft-gefuehle` | Sprechen (zus.) | B2 | **B2.2 U01** | M2 | GER S. 86·B2 | ≈ 05-cando-b1-b2 B2.1 #12 · GER S. 86 B2 |
| u02·1 | `cd.b2.vortrag-argumentation-folgen` | Hören | B2 | **B2.2 U05** | — | SB·B2 | 05-cando-b1-b2 B2.2 #8 · SB B2 |
| u02·2 | `cd.b2.wege-zum-ziel-vergleichen` (was `weg-zum-ziel-erklaeren`) | Sprechen (zus.) | B2 | **B2.2 U05** | — | ZM·B2; SB·B2 | ≈ eigene Formulierung nach ZM B1+ „beschreiben, wie man etwas macht“ (05 §2.2), auf B2-Niveau |
| u02·3 | `cd.b2.pro-contra-diskutieren` | Interaktion mdl. | B2 | **B2.2 U03** | M2 | GI-B2 Sp2; UT-B2 M2 | 05-cando-b1-b2 B2.2 #2 · GI-B2 Sprechen T2 |
| u02·4 | `cd.b2.anfrage-krankenkasse-mail` | Schreiben | B2 | **B2.2 U05** | SA | UT-B2 SA-A | ≈ 03-exams-b2 §2 · telc B2 Schriftlicher Ausdruck, Aufgabe A |
| u03·1 | `cd.b2.problem-benennen-verbessern` | Interaktion mdl. | B2 | **B2.2 U09** | M3 | BSK 52.1·B2 | 05-cando-b1-b2 B2.2 #5 · BSK 52.1 B2 |
| u03·2 | `cd.b2.auf-kritik-reagieren` | Interaktion mdl. | B2 | **B2.2 U09** | M2 | BSK 54.5·B2 | 05-cando-b1-b2 B2.2 #5 · BSK 54.5 B2 |
| u03·3 | `cd.b2.konflikt-beide-seiten` | Interaktion mdl. | B2 | **B2.2 U09** | M3 | BSK 54.2·B2 | 05-cando-b1-b2 B2.2 #6 · BSK 54.2 B2 |
| u03·4 | `cd.b2.konflikt-nachricht-vorgesetzte` (was `nachricht-vorgesetzte-100`) | Schreiben | B2 | **B2.2 U09** | SA | GI-B2 S2; BSK 54.2·B2 | 05-cando-b1-b2 B2.1 #10 (Prüfungslänge) · GI-B2 Schreiben T2 |
| u04·1 | `cd.b2.schadensersatz-grenzen` | Interaktion mdl. | B2+ | **B2.2 U04** | M3 | ZM·B2+ | 05-cando-b1-b2 B2.2 #4 (≈) · ZM B2+ |
| u04·2 | `cd.b2.verhandeln-punkte-betonen` | Interaktion mdl. | B2 | **B2.2 U04** | M3 | BSK 57.9·B2 | 05-cando-b1-b2 B2.2 #4 · BSK 57.9 B2 |
| u04·3 | `cd.b2.vertragsbedingungen-ansprueche` | Lesen | B2 | **B2.2 U04** | — (GI L5) | GI-B2 L5 | ≈ 05-cando-b1-b2 B2.2 #11 · GI-B2 Lesen T5 |
| u04·4 | `cd.b2.formelle-beschwerde-frist` | Schreiben | B2 | **B2.2 U04** | SA | UT-B2 SA-B | ≈ 03-exams-b2 §2 · telc B2 Schriftlicher Ausdruck, Aufgabe B |
| u05·1 | `cd.b2.studienordnung-verstehen` | Lesen | B2 | **B2.2 U06** | — (GI L5) | GI-B2 L5 | 05-cando-b1-b2 B2.2 #11 · GI-B2 Lesen T5 |
| u05·2 | `cd.b2.vorlesung-notieren` | Hören | B2 | **B2.2 U06** | — (GI H4) | GI-B2 H4 | 05-cando-b1-b2 B2.2 #8 · GI-B2 Hören T4 |
| u05·3 | `cd.b2.referat-halten` (was `referat-vier-minuten`) | Sprechen (zus.) | B2 | **B2.2 U06** | M1 | GI-B2 Sp1 | 05-cando-b1-b2 B2.2 #1 · GI-B2 Sprechen T1 |
| u05·4 | `cd.b2.nominalstil-umformen` | Schreiben | B2 | **B2.2 U02** | — | As-B2 K9; Si-B2 L5 | ≈ eigene Formulierung nach Aspekte neu B2 K9 / Sicher! aktuell B2 L5, L8 (06 F3 B2.2 #4) |
| u06·1 | `cd.b2.film-buch-erzaehlen` | Sprechen (zus.) | B2 | **B2.2 U07** | M1 | UT-B2 M1 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T1; Steigerung von 05 B1.1 #4 (SB B1) |
| u06·2 | `cd.b2.meldungen-ueberschriften` | Lesen | B2 | **B2.2 U07** | LV1 | UT-B2 LV1 | ≈ 03-exams-b2 §2 · telc B2 Leseverstehen T1 |
| u06·3 | `cd.b2.kulturnachrichten-hoeren` | Hören | B2 | more: U07 | HV1 | SB·B2; UT-B2 HV1 | ≈ 05-cando-b1-b2 B2.2 #13 · SB B2; telc B2 Hörverstehen T1 |
| u06·4 | `cd.b2.kulturpolitik-position` | Schreiben | B2 | more: U07 | — (GI S1) | GI-B2 S1 | 05-cando-b1-b2 B2.1 #2 · GI-B2 Schreiben T1 |
| u07·1 | `cd.b2.zeitzeugin-wiedergeben` | Mediation | B2 | **B2.2 U08** | M2 | SB·B2 Mediation | ≈ eigene Formulierung nach SB B2 Mediation (05 B2.2 #9) |
| u07·2 | `cd.b2.sachverhalt-darstellen` | Sprechen (zus.) | B2 | **B2.2 U02** | M1 | GER S. 64·B2 | 05-cando-b1-b2 B2.2 #1 · GER S. 64 B2 |
| u07·3 | `cd.b2.anfrage-archiv-mail` | Schreiben | B2 | **B2.2 U08** | SA | UT-B2 SA-A | ≈ 03-exams-b2 §2 · telc B2 Schriftlicher Ausdruck, Aufgabe A |
| u07·4 | `cd.b2.zeitzeugen-interview-einmal` | Hören | B2 | **B2.2 U08** | HV2 | UT-B2 HV2 | ≈ 03-exams-b2 §2 · telc B2 Hörverstehen T2 |
| u08·1 | `cd.b2.merkblatt-muendlich-erklaeren` | Mediation | B2 | **B2.2 U05** | M2 | SB·B2 Mediation | 05-cando-b1-b2 B2.2 #9 · SB B2 Mediation |
| u08·2 | `cd.b2.beschwerde-beantworten` | Schreiben | B2 | **B2.2 U04** | SA | UT-B2 SA | ≈ 03-exams-b2 §7 (formelle E-Mail: Antwort an eine Kundin) · telc B2 Schriftlicher Ausdruck |
| u08·3 | `cd.b2.empfang-telefon-einmal` | Hören | B2 | more: U09, U11 | HV3 | GI-B2 H1; UT-B2 HV3 | ≈ 05-cando-b1-b2 B2.1 #7 · GI-B2 Hören T1 |
| u08·4 | `cd.b2.vor-nachteile-erlaeutern-patienten` | Interaktion mdl. | B2 | more: U05, U09 | M2 | KK-B2 GLZ 35 | 05-cando-b1-b2 B2.2 #7 · KK-B2 Groblernziel 35 |
| u09·1 | `cd.b2.an-andere-anknuepfen` | Interaktion mdl. | B2+ | **B2.2 U03** | M2 | ZM·B2+ | 05-cando-b1-b2 B2.2 #2 · ZM B2+ |
| u09·2 | `cd.b2.rederecht-behalten` | Interaktion mdl. | B2 | **B2.2 U12** | M2 | ZM·B2 | 05-cando-b1-b2 B2.2 #3 · ZM B2 |
| u09·3 | `cd.b2.fliessend-mitreden` | Interaktion mdl. | B2 | **B2.2 U12** | M2 | ZM·B2 | 05-cando-b1-b2 B2.2 #14 · ZM B2 |
| u09·4 | `cd.b2.forum-aussagen-zuordnen` | Lesen | B2 | **B2.2 U01** | — (GI L1) | GI-B2 L1 | 05-cando-b1-b2 B2.1 #3 · GI-B2 Lesen T1 |
| u10·1 | `cd.b2.praesentation-abteilung` | Sprechen (zus.) | B2 | **B2.2 U02** | M1 | BSK 43.7·B2 | 05-cando-b1-b2 B2.2 #7 · BSK 43.7 B2 |
| u10·2 | `cd.b2.partizipialattribute-aufloesen` | Lesen | B2 | **B2.2 U07** | — | As-B2 K10; Si-B2 L12 | ≈ eigene Formulierung nach Aspekte neu B2 K10 / Sicher! aktuell B2 L12 (06 F3 B2.2 #5) |
| u10·3 | `cd.b2.arbeitsmarkt-interview-details` | Hören | B2 | more: U12 | HV2 | GI-B2 H2; UT-B2 HV2 | ≈ 03-exams-b2 §1 · GI-B2 Hören T2 |
| u10·4 | `cd.b2.intranet-forum-diskutieren` | Interaktion schr. (online) | B2 | **B2.2 U12** | — | SB·B2 Online; GI-B2 S1 | ≈ 05-cando-b1-b2 B2.1 #14 · SB B2 Online-Interaktion; GI-B2 Schreiben T1 |
| u11·1 | `cd.b2.widerspruch-begruenden` | Schreiben | B2 | **B2.2 U10** | SA | BSK 39.3·B2; UT-B2 SA-B | 05-cando-b1-b2 B2.2 #11 · BSK 39.3 B2 |
| u11·2 | `cd.b2.kuendigung-schreiben` | Schreiben | B2 | **B2.2 U10** | SA | BSK 45.1·B2 | 05-cando-b1-b2 B2.2 #12 · BSK 45.1 B2 |
| u11·3 | `cd.b2.formelle-konventionen` | Schreiben | B2 | **B2.2 U10** | SA | GER S. 118·B2 | 05-cando-b1-b2 B2.2 #12 · GER S. 118 B2 |
| u11·4 | `cd.b2.stellungnahmen-einordnen` | Lesen | B2 | more: U10 | — (GI L4) | GI-B2 L4 | ≈ 03-exams-b2 §1 · GI-B2 Lesen T4 |
| u12·1 | `cd.b2.zur-beteiligung-einladen` | Mediation | B2 | **B2.2 U12** | — | SB·B2 Mediation | 05-cando-b1-b2 B2.2 #10 · SB B2 Mediation |
| u12·2 | `cd.b2.diskussion-buendeln` | Mediation | B2 | **B2.2 U03** | M2 | E8·B2 | 05-cando-b1-b2 B2.2 #9 · E8 B2 |
| u12·3 | `cd.b2.sprachforschung-interview` | Hören | B2 | **B2.2 U06** | HV2 | GI-B2 H2; UT-B2 HV2 | ≈ 03-exams-b2 §1 · GI-B2 Hören T2 |
| u12·4 | `cd.b2.sprachen-dialekte-erzaehlen` | Sprechen (zus.) | B2 | **B2.2 U11** | M1 | UT-B2 M1 | ≈ 03-exams-b2 §2 · telc B2 Mündlicher Ausdruck T1 |


## 5. What lane tb2 needs

`registries/lanes/tb2.json` exists (read 2026-09-27); its Teil ids `tb2.lv1` … `tb2.m3` are the ones used here. A can-do
names the skill a Teil trains so the Lernziele box can say it; the coverage rules (COV-1…COV-5) count **blocks and
Aufgaben**, not can-dos, so §5.2 does not replace the lane coverage check.

### 5.1 Additions (ids no W2 draft line carries)

| id | halfLevel · row | Kind | Teil | Mode | Source tag(s) | Why |
|---|---|---|---|---|---|---|
| `cd.b2.erfahrungsberichte-ueberschriften` | b2.1 · U1 | tb2 | LV1 | Lesen | UT-B2 LV1; SB·B2 | LV1 is a Prüfungsteil of row 1; no draft line trains headline matching (W2: added in draft u03) |
| `cd.b2.artikel-im-detail` | b2.1 · U3 | tb2 | LV2 | Lesen | UT-B2 LV2; SB·B2 | LV2 of row 3; now set in the row's topic (Arbeitszeitmodelle) |
| `cd.b2.brief-grammatik-kontext` | b2.1 · U4 | tb2 (review) | SB1 | Lesen | UT-B2 SB1 | B2.1 had no genuine SB1 Lernziel (`brief-gefuehle-abstufen` is writing); row 4 carries SB1 and the Passiversatz grammar |
| `cd.b2.interview-wohnprojekt-einmal` | b2.1 · U5 | tb2 | HV2 | Hören | UT-B2 HV2 | the Wohnprojekt interview of the draft unit; no draft line is a listening goal |
| `cd.b2.engpass-an-leitung-schreiben` | b2.1 · U7 | gate | SA | Schreiben | GI-B2 S2; UT-B2 SA | ALL-02: the row's writing Aufgabe (Nachricht an die Pflegedienstleitung) proves no draft line |
| `cd.b2.reise-ansagen-einmal` | b2.1 · U10 | tb2 | HV3 | Hören | UT-B2 HV3 | HV3 of the Radio row; reworded to Radio- und Telefonansagen (W2: added in draft u04) |
| `cd.b2.podcast-interview-fuehren` | b2.1 · U10 | row (review) | — | Interaktion mdl. | GER 4.4.3.1·B2 | row 10 has no draft unit; its core needs one interactive can-do (ALL-02); memo 05 B2.1 #7 „Radio, Podcast, Interview" |
| `cd.b2.sachtext-fuer-andere-zusammenfassen` | b2.1 · U11 | row (review) | — | Mediation | SB·B2 Mediation | the row's Kern-Kann „Sachtexte … für andere zusammenfassen (Mediation)"; draft u06 had no mediation id |
| `cd.b2.bericht-lueckentext` | b2.1 · U11 | tb2 | SB2 | Lesen | UT-B2 SB2 | SB2 of row 11 (W2: added in draft u12) |
| `cd.b2.magazinartikel-im-detail` | b2.2 · U3 | tb2 | LV2 | Lesen | UT-B2 LV2 | LV2 of row 3 (W2: added in draft u01) |
| `cd.b2.forum-an-argumente-anknuepfen` | b2.2 · U3 | gate | — | Schreiben | GI-B2 S1; ZM·B2+ | written form of the Meinung thread's B2.2 step (ALL-02 writing Aufgabe of draft u09) |
| `cd.b2.kritik-verstehen` | b2.2 · U7 | row (review) | — | Lesen | SB·B2; As-B2 K7 | Kern-Kann „Kritiken verstehen" |
| `cd.b2.kritik-schreiben` | b2.2 · U7 | row (review) | — | Schreiben | SB·B2; As-B2 K7 | Kern-Kann „Kritiken verfassen" |
| `cd.b2.mitarbeitergespraech-ziele` | b2.2 · U9 | gate | M3 | Interaktion mdl. | BSK 20.4·B2 | ALL-06 Konsultation: the B2.2 step (BSK 20.4) no draft line carried |
| `cd.b2.bescheid-verstehen` | b2.2 · U10 | row (review) | — | Lesen | GI-B2 L5; BSK 39.3·B2 | Kern-Kann „Bescheide verstehen" (HF 1) |
| `cd.b2.brief-sprachbausteine` | b2.2 · U10 | tb2 | SB1 | Lesen | UT-B2 SB1 | SB1 (bold) of row 10; reworded to the formal register of the row (W2: added in draft u06) |
| `cd.b2.varietaeten-erkennen` | b2.2 · U11 | row (review) | HV3 | Hören | SB·B2; Si-B2 L12 | Kern-Kann „Varietäten erkennen" (HF 9, 10) |
| `cd.b2.beratungsangebote-auswaehlen` | b2.2 · U11 | tb2 | LV3 | Lesen | UT-B2 LV3 | LV3 (bold) of row 11 (W2: added in draft u08) |
| `cd.b2.zeitungsartikel-wortwahl` | b2.2 · U12 | tb2 (review) | SB2 | Lesen | UT-B2 SB2 | B2.2 had no genuine SB2 Lernziel (`nominalstil-umformen` is productive); row 12 carries SB2 (bold) |

### 5.2 tb2 Teil → can-dos that train it

In brackets: the row where the id is core, or `more` + the first row that lists it. The last row lists the course can-dos
whose task shape is a Goethe B2 Teil: they are Lernziele of their rows, but **no telc B2 Teil is proven by them** — an
author must not write LV1 items from a stance-reading id. With the additions, every telc B2 Teil has a core id in **both**
halves.

| tb2 Teil | Template | B2.1 | B2.2 |
|---|---|---|---|
| LV1 | `tb2.lv1` | `erfahrungsberichte-ueberschriften` (U01) | `meldungen-ueberschriften` (U07) |
| LV2 | `tb2.lv2` | `artikel-im-detail` (U03)<br>`artikel-mit-haltung-lesen` (U06) | `magazinartikel-im-detail` (U03) |
| LV3 | `tb2.lv3` | `kursanzeigen-auswaehlen` (U08) | `beratungsangebote-auswaehlen` (U11) |
| SB1 | `tb2.sb1` | `brief-grammatik-kontext` (U04) | `brief-sprachbausteine` (U10) |
| SB2 | `tb2.sb2` | `bericht-lueckentext` (U11) | `zeitungsartikel-wortwahl` (U12) |
| HV1 | `tb2.hv1` | `nachrichten-einmal-hoeren` (U10) | `reportagen-verstehen` (U11)<br>`kulturnachrichten-hoeren` (more U07) |
| HV2 | `tb2.hv2` | `interview-wohnprojekt-einmal` (U05)<br>`radio-standpunkte-erfassen` (U10) | `sprachforschung-interview` (U06)<br>`zeitzeugen-interview-einmal` (U08)<br>`arbeitsmarkt-interview-details` (more U12) |
| HV3 | `tb2.hv3` | `telefonnotiz-weitergeben` (U07)<br>`reise-ansagen-einmal` (U10) | `varietaeten-erkennen` (U11)<br>`empfang-telefon-einmal` (more U09) |
| SA | `tb2.sa` | `missverstaendnis-klaeren-schriftlich` (U02)<br>`abrechnung-reklamieren-schriftlich` (U03)<br>`schriftlich-reklamieren` (U04)<br>`engpass-an-leitung-schreiben` (U07)<br>`anfrage-weiterbildung-mail` (U08)<br>`anschreiben-verfassen` (U08)<br>`anfrage-studie-mail` (U11) | `formelle-beschwerde-frist` (U04)<br>`beschwerde-beantworten` (U04)<br>`anfrage-krankenkasse-mail` (U05)<br>`anfrage-archiv-mail` (U08)<br>`konflikt-nachricht-vorgesetzte` (U09)<br>`widerspruch-begruenden` (U10)<br>`kuendigung-schreiben` (U10)<br>`formelle-konventionen` (U10) |
| M1 | `tb2.m1` | `erfahrung-erzaehlen` (U01)<br>`qualifikationen-darstellen` (U08)<br>`projekt-praesentieren` (U12)<br>`weiterbildungswunsch-begruenden` (more U08)<br>`kurzvortrag-halten` (more U11) | `sachverhalt-darstellen` (U02)<br>`praesentation-abteilung` (U02)<br>`referat-halten` (U06)<br>`film-buch-erzaehlen` (U07)<br>`sprachen-dialekte-erzaehlen` (U11) |
| M2 | `tb2.m2` | `du-oder-sie-diskutieren` (U02)<br>`ansicht-verteidigen` (U02)<br>`artikel-zusammenfassen-diskutieren` (U03)<br>`aussagen-anderer-wiedergeben` (U06) | `fachleute-muendlich-weitergeben` (U01)<br>`freundschaft-gefuehle` (U01)<br>`pro-contra-diskutieren` (U03)<br>`an-andere-anknuepfen` (U03)<br>`diskussion-buendeln` (U03)<br>`merkblatt-muendlich-erklaeren` (U05)<br>`zeitzeugin-wiedergeben` (U08)<br>`auf-kritik-reagieren` (U09)<br>`rederecht-behalten` (U12)<br>`fliessend-mitreden` (U12)<br>`vor-nachteile-erlaeutern-patienten` (more U05) |
| M3 | `tb2.m3` | `vorgehen-gemeinsam-planen` (U04)<br>`informell-mitdiskutieren` (U05)<br>`fest-planen-kompromiss` (U05)<br>`dienstplan-loesung-aushandeln` (U07) | `schadensersatz-grenzen` (U04)<br>`verhandeln-punkte-betonen` (U04)<br>`problem-benennen-verbessern` (U09)<br>`konflikt-beide-seiten` (U09)<br>`mitarbeitergespraech-ziele` (U09) |
| — | course can-do, Goethe format (gb2 deferred) | `forum-einstellungen-erkennen` GI L1/L4 · `heimat-stellung-nehmen` GI S1 · `reisebedingungen-verstehen` GI L5 · `forumsbeitrag-gliedern` GI S1 · `radiodiskussion-meinungen-zuordnen` GI H3 · `vortrag-gezielt-hoeren` GI H4 · `sachtext-verweise-verstehen` GI L2 · `leserkommentare-haltung` GI L4 · `karriereforum-haltungen` GI L1 · `zu-artikel-stellung-nehmen` GI S1 | `radiodiskussion-drei-stimmen` GI H3 · `forumsbeitrag-ausfuehrlich` GI S1 · `vertragsbedingungen-ansprueche` GI L5 · `studienordnung-verstehen` GI L5 · `vorlesung-notieren` GI H4 · `kulturpolitik-position` GI S1 · `forum-aussagen-zuordnen` GI L1 · `forum-an-argumente-anknuepfen` GI S1 · `stellungnahmen-einordnen` GI L4 |

- **LV1** is headline matching (5 Berichte ↔ 10 Überschriften). Only the two headline ids train it. The stance-reading ids
  (`forum-einstellungen-erkennen`, `leserkommentare-haltung`, `karriereforum-haltungen`, `forum-aussagen-zuordnen`,
  `stellungnahmen-einordnen`) are course can-dos in Goethe L1/L4 format; they serve the gb2 pack when it is built.
- **SB1/SB2** have one form-focused id per half each (`brief-grammatik-kontext` → `brief-sprachbausteine`;
  `bericht-lueckentext` → `zeitungsartikel-wortwahl`). `brief-gefuehle-abstufen` (writing), `sachtext-verweise-verstehen`
  (Goethe L2 cohesion) and `nominalstil-umformen` (productive) are no longer filed under SB.
- **M1** is telc „über Erfahrungen sprechen" (≈ 1½ Min.). The Vortrag ids (`sachverhalt-darstellen`,
  `praesentation-abteilung`, `referat-halten`, `projekt-praesentieren`, `kurzvortrag-halten`) are filed under M1 because
  BLUEPRINT §4.4 puts tb2 M1 and gb2 Sp1 in the same `monologue` interaction family; their lengths live in the task spec.
- `partizipialattribute-aufloesen` (B2.2 U7) is a reading strategy that supports LV2 texts; it proves no Teil.

### 5.3 Never-core ids (*more* only)

| id | halfLevel | Mode | *More* in | Why not core |
|---|---|---|---|---|
| `cd.b2.argumentation-aufbauen` | b2.1 | Sprechen (zus.) | U1, U9 | ZM wording of the Meinung step; the rows carry it through `ansicht-verteidigen` (U2) and `pro-contra-schriftlich` (U9) |
| `cd.b2.korrespondenz-verstehen` | b2.1 | Lesen | U1, U5 | receptive partner of `brief-gefuehle-abstufen`; no Teil |
| `cd.b2.elterngespraech-fuehren` | b2.1 | Interaktion mdl. | U5 | Lernziel of the BLUEPRINT Fokus-DaZ „Elternabend: mit der Schule sprechen" (HF 6) on B2.1 U5 |
| `cd.b2.weiterbildungswunsch-begruenden` | b2.1 | Sprechen (zus.) | U8 | row 8 draws on two draft units (8 lines); the Weiterbildung wish is the optional M1 topic |
| `cd.b2.karriereforum-haltungen` | b2.1 | Lesen | U8 | Goethe L1 format; row 8 reads with LV3 |
| `cd.b2.kurzvortrag-halten` | b2.1 | Sprechen (zus.) | U11, U12 | row 11 has no spoken Teil; optional Vortrag, Vorschau on B2.2 U2 |
| `cd.b2.kulturnachrichten-hoeren` | b2.2 | Hören | U7 | row 7 carries no HV Teil; HV1 practice text |
| `cd.b2.kulturpolitik-position` | b2.2 | Schreiben | U7 | row 7's writing Lernziel is the Kritik |
| `cd.b2.vor-nachteile-erlaeutern-patienten` | b2.2 | Interaktion mdl. | U5, U9 | near-twin of `wege-zum-ziel-vergleichen` (U5); care role-play in U9 |
| `cd.b2.empfang-telefon-einmal` | b2.2 | Hören | U9, U11 | the Praxis draft unit has no row; HV3 practice in the care row |
| `cd.b2.stellungnahmen-einordnen` | b2.2 | Lesen | U10 | Goethe L4 format; row 10 reads the Bescheid |
| `cd.b2.arbeitsmarkt-interview-details` | b2.2 | Hören | U12 | row 12 carries no HV Teil |
| `cd.b2.gespraech-lenken` | b2.2 | Interaktion mdl. | U12 | memo 05 B2.2 #3; alternative for `rederecht-behalten` |
| `cd.b2.gespraechskultur-foerdern` | b2.2 | Mediation | U3, U12 | memo 05 B2.2 #10; alternative for `zur-beteiligung-einladen` |

## 6. B1 → B2: the step each B2 id adds

The telc formats are the same at B1 and B2, so a B2 Lernziel must say what is harder. For every B2 id the review found
too close to a B1 id, and for the other B2 ids that train the same Teil or function, the step is named in the wording:

| Function | B1 ids (`cd.b1.…`) | B2 id (`cd.b2.…`) · row | B2 step in the wording |
|---|---|---|---|
| Haltung in Kommentaren | `kommentare-haltung` (B1.1: dafür/dagegen/unentschieden) · `kommentare-einschraenkungen` (B1.2: mit Einschränkungen, angedeutet) | `forum-einstellungen-erkennen` · B2.1 U1 | longer posts; a person judges single aspects differently (mixed position) |
| | | `leserkommentare-haltung` · B2.1 U5 | **irony** and **concession-then-contradiction** (the clause removed from B1, `cando-b1.md` open issue 10) |
| | | `forum-aussagen-zuordnen` · B2.2 U1 | statements **paraphrase** the post and must be traced to the person |
| | | `stellungnahmen-einordnen` · more B2.2 U10 | **partial** agreement |
| Gemeinsam planen (M3) | `gemeinsam-planen`, `aufgaben-verteilen` (B1.1 U2, also a Fest) · `projekt-planen-einwaende` (B1.2) | `vorgehen-gemeinsam-planen` · B2.1 U4 | weigh steps by **effort and chance of success** |
| | | `fest-planen-kompromiss` · B2.1 U5 | plan **under fixed constraints** (budget, Hausordnung), negotiate priorities, **justify what is dropped** |
| | | `dienstplan-loesung-aushandeln` · B2.1 U7 | a solution both sides accept in a staffing conflict |
| Anzeigen (LV3) | `anzeigen-gezielt` (B1.1) · `angebot-fuer-andere` (B1.2) | `kursanzeigen-auswaehlen` · B2.1 U8 | **longer** ads, **several near-fits**, ads **paraphrase** the person's wish |
| | | `beratungsangebote-auswaehlen` · B2.2 U11 | match on **conditions** (Zielgruppe, Termine, Voraussetzungen) |
| Überschriften (LV1) | `kurzmeldungen-thema` (B1.1) · `pressemeldungen-ueberschriften` (B1.2: ähnliche Überschriften lenken ab) | `erfahrungsberichte-ueberschriften` · B2.1 U1 | reports of **up to half a page**; the headline **summarises** instead of repeating a keyword |
| | | `meldungen-ueberschriften` · B2.2 U7 | **two topic fields**; the headline **shares no word** with the text |
| Telefonnotiz (Mediation) | `nachricht-notieren` (B1.2, B1+: one caller, one problem) | `telefonnotiz-weitergeben` · B2.1 U7 | **several calls or a tangled request**, ordered by **urgency**, **next step** per point |
| Weg zum Ziel | `ablaeufe-erklaeren` (B1.2, B1+: how to do something, step by step) | `wege-zum-ziel-vergleichen` · B2.2 U5 | **compare alternative ways** and **justify** the choice |
| Sprachbausteine Grammatik (SB1) | `brief-formen-erkennen` (B1.1) | `brief-grammatik-kontext` · B2.1 U4 | **two options look right**; B2 structures (Passiversatz, Konnektoren) |
| | | `brief-sprachbausteine` · B2.2 U10 | **formal register**, gehobene Konnektoren, Präpositionen mit Genitiv, at speed |
| Sprachbausteine Lexik (SB2) | `wortwahl-brief` (B1.1) · `formelle-wendungen` (B1.2) | `bericht-lueckentext` · B2.1 U11 | a **sachlicher Bericht**; Verbindungswort, Präposition or feste Wendung |
| | | `zeitungsartikel-wortwahl` · B2.2 U12 | a **newspaper article**; **near-synonyms**, content and collocation both decide |
| Artikel im Detail (LV2) | `artikel-details` (B1.1) · `artikel-argumente` (B1.2) | `artikel-im-detail` · B2.1 U3 | check **which statements the text supports** |
| | | `magazinartikel-im-detail` · B2.2 U3 | **two articles**; distractors that „liegen nahe" |
| Radiodiskussion | `debatte-wer-meint-was` (B1.2) | `radiodiskussion-meinungen-zuordnen` · B2.1 U9 · `radiodiskussion-drei-stimmen` · B2.2 U1 | B2.2: three voices, **heard once** |
| Missverständnis / Nachricht an Vorgesetzte | `missverstaendnis-klaeren` (B1.2) | `missverstaendnis-klaeren-schriftlich` · B2.1 U2 → `konflikt-nachricht-vorgesetzte` · B2.2 U9 | B2.2: a team conflict, **both views, no blame**, a compromise |

## 7. Gate notes for the curriculum and spec agents

1. **ALL-02.** Every row's core has 3–5 ids and ≥ 1 `productive-*`/`interaction-*` id; map `proofs[].aufgabe` to one of
   them. Rows whose Aufgabe proof depends on an addition: **B2.1 U7** (the writing Aufgabe proves
   `engpass-an-leitung-schreiben`), **B2.1 U10** (its only interactive id is `podcast-interview-fuehren`) and **B2.2 U3**
   (the forum post proves `forum-an-argumente-anknuepfen`).
2. **ALL-06 online interaction.** B2.1: `online-gruppe-zusammenarbeiten`, `online-ideen-rechtfertigen` (U12). B2.2:
   `intranet-forum-diskutieren` (U12). Pass on core ids.
3. **ALL-06 mediation (flag, §2).** B2.1: `aussagen-anderer-wiedergeben` (U6), `telefonnotiz-weitergeben` (U7),
   `sachtext-fuer-andere-zusammenfassen` (U11 — the BLUEPRINT recount's mediation row), `vortrag-schriftlich-weitergeben`
   (U12). B2.2: `fachleute-muendlich-weitergeben` (U1), `diskussion-buendeln` (U3), `merkblatt-muendlich-erklaeren` (U5),
   `zeitzeugin-wiedergeben` (U8 — the recount's row), `zur-beteiligung-einladen` (U12). Pass.
4. **ALL-06 work and care rows** (row tags per BLUEPRINT): work B2.1 U2, U3, U7, U8 · B2.2 U3, U9, U12; care B2.1 U7
   (Pflege 1), B2.2 U9 (Pflege 2). The core ids of these rows carry HF 2 or 3.
5. **ALL-06 spiral threads (memo 05 §3), band steps on core ids:**

| Thread | B2.1 step | B2.2 step |
|---|---|---|
| Beschwerde | `zugestaendnisse-einfordern` (ZM B2) + `schriftlich-reklamieren` (BSK 28.4) — U4 | `schadensersatz-grenzen` (ZM B2+) + `formelle-beschwerde-frist` — U4 |
| Meinung | `ansicht-verteidigen` (GER S. 81, U2), `pro-contra-schriftlich` (SB B2, U9); ZM wording `argumentation-aufbauen` in *more* | `an-andere-anknuepfen` (ZM B2+) + `forum-an-argumente-anknuepfen` — U3 |
| Konsultation | `anerkennung-beratung` (BSK 2.5) — U8 | `mitarbeitergespraech-ziele` (BSK 20.4) — U9 |
| Weitergeben | `luecken-umschreiben` (U2), `eigene-fehler-kontrollieren` (U12) (GER/ZM B2); `aussagen-anderer-wiedergeben` (U6), `sachtext-fuer-andere-zusammenfassen` (U11) | `fachleute-muendlich-weitergeben` (U1), `merkblatt-muendlich-erklaeren` (U5), `zeitzeugin-wiedergeben` (U8), `zur-beteiligung-einladen` (U12) (SB B2 Mediation) |

6. **ALL-04 (advisory at B2).** Core ids cover HF 1–5, 7–12 and A–E. **HF 6** is carried by `elterngespraech-fuehren`
   (*more*, B2.1 U5, the BLUEPRINT's Fokus-DaZ „Elternabend"). The other B2 Fokus cards of §2.8 can reference existing ids:
   B2.2 U4 „Einen Schaden der Versicherung melden" (HF 5) → `vertragsbedingungen-ansprueche`, `formelle-beschwerde-frist`;
   B2.2 U11 „Unterwegs in Österreich und der Schweiz" (HF 10) → `varietaeten-erkennen`, `reise-ansagen-einmal`; B2.2 U2
   „Im Kurs: einem Vortrag Feedback geben" (HF 11) has **no id** (open issue 4). HF 11 is also reached by the U6 tags
   (`studienordnung-verstehen`, `vorlesung-notieren`, `referat-halten`, `sprachforschung-interview`).
7. **ALL-05 near-twins inside B2.** Functions that recur at a higher step, each with its own id: Vortrag verstehen (B2.1 U11
   → B2.2 U5, U6), Vortrag halten (B2.1 U12 → B2.2 U2, U6), halbformelle Anfrage (B2.1 U8, U11 → B2.2 U5, U8), Haltung in
   Meinungstexten (B2.1 U1, U5 → B2.2 U1), Radiodiskussion (B2.1 U9 → B2.2 U1), Anzeigen (B2.1 U8 → B2.2 U11), Nachricht an
   Vorgesetzte (B2.1 U2 → B2.2 U9), Sprachbausteine (§6). `wege-zum-ziel-vergleichen` and `vor-nachteile-erlaeutern-patienten`
   are close; the second is therefore *more* only.
8. **Never-core ids** (§5.3) are expected in a checker that lists ids no unit has in `spec.canDos`.

## 8. W2 draft units → BLUEPRINT §2.8 rows

| W2 draft unit | Lines → row (core) | | W2 draft unit | Lines → row (core) |
|---|---|---|---|---|
| b2.1-u01 Heimat ist … | #1–#3 → U1 · #4 → U12 | | b2.2-u01 Mit viel Gefühl | #1–#4 → U1 · LV2-Zusatz → U3 |
| b2.1-u02 Sprich mit mir! | #1 → U10 · #2–#4 → U2 | | b2.2-u02 Fit für die Zukunft? | #1, #2, #4 → U5 · #3 → U3 |
| b2.1-u03 Arbeit ist das halbe Leben? | #1–#4 → U3 · LV1-Zusatz → U1 | | b2.2-u03 Kritik, Konflikt, Kompromiss | #1–#4 + Gate-Zusatz → U9 |
| b2.1-u04 Beschwerde mit Anspruch | #1–#4 → U4 · HV3-Zusatz → U10 | | b2.2-u04 Verhandeln | #1–#4 → U4 |
| b2.1-u05 Weniger ist mehr? | #1–#4 → U9 · LV2-Zusatz → U3 | | b2.2-u05 An der Uni | #1–#3 → U6 · #4 → U2 |
| b2.1-u06 Wissen schafft Alltag | #1, #3, #4 → U11 · #2 → more U11 | | b2.2-u06 Kulturwelten | #1, #2 → U7 · #3, #4 → more U7 · SB1-Zusatz → U10 |
| b2.1-u07 Zusammen leben | #1–#4 + HV2-Zusatz → U5 | | b2.2-u07 Das macht(e) Geschichte | #1, #3, #4 → U8 · #2 → U2 |
| b2.1-u08 Anerkennung und Weiterbildung | #1, #3, #4 → U8 · #2 → more U8 | | b2.2-u08 Patienten gut informieren | #1 → U5 · #2 → U4 · #3 → more U9 · #4 → more U5, U9 · LV3-Zusatz → U11 |
| b2.1-u09 Qualifiziert bewerben | #1, #2 → U8 · #3 → U2 · #4 → more U8 | | b2.2-u09 Stadt, Land, Zukunft | #1 + Gate-Zusatz → U3 · #2, #3 → U12 · #4 → U1 |
| b2.1-u10 Schichtwechsel | #1–#4 + Gate-Zusatz → U7 | | b2.2-u10 Ein Blick in die Zukunft | #1 → U2 · #2 → U7 · #3 → more U12 · #4 → U12 |
| b2.1-u11 Presse mit Haltung | #1, #3, #4 → U6 · #2 → U10 | | b2.2-u11 Bescheid, Widerspruch, Kündigung | #1–#3 → U10 · #4 → more U10 |
| b2.1-u12 Gemeinsam online | #1–#4 → U12 · SB2-Zusatz → U11 | | b2.2-u12 Sprache und Regionen | #1 → U12 · #2 → U3 · #3 → U6 · #4 → U11 |
| — (no draft unit) | row 10 Radio und Podcast: draft lines of u02, u11 + `podcast-interview-fuehren` | | — (no draft unit) | row 7 Kritik, row 10 Bescheid, row 11 Varietäten: review additions (§5.1) |

Draft units that feed two rows (the review's examples: b2.2-u02 → rows 3 and 5, b2.2-u10 → rows 2, 7 and 12) are split so
that each id is core in exactly one row. The Praxis draft unit b2.2-u08 has no row; its lines went to rows 4, 5, 9 and 11.
If a curriculum agent keeps a draft situation that no row has, the ids move with it by a logged `deviation` that keeps
each id core in exactly one unit.

## 9. Open issues

1. **Goethe-format Aufgaben under the tb2-only lane.** Several draft units keep Goethe B2 writing/speaking formats as their
   Aufgabe (forum post, message to a superior, Sp1 Vortrag, Sp2 discussion). The can-dos are communicative goals and are now
   worded without Goethe lengths (§2); the spec agents decide whether an Aufgabe is re-cut to `tb2.sa` / `tb2.m1–m3` or kept
   as a course task with a course rubric, and re-check `proofs` after any re-cut. Forum posts have no telc B2 equivalent.
2. **„Productive" in ALL-02.** The validator (`rules/ALL-02.mjs`) counts `productive-*` and `interaction-*`, not
   `mediation`; every row passes on that reading (§3 checks).
3. **Form-focused Lernziele.** The four Sprachbausteine ids (§5.2) and `nominalstil-umformen`, `partizipialattribute-aufloesen`
   are form-focused. If the DaF reviewer rejects form-focused Lernziele, move them to *more* and train SB in LS4 only — the
   gates allow that. B2.1 U4, U11 and B2.2 U7, U10, U12 keep 4 core ids without them; **B2.2 U2 would drop to 2** without
   `nominalstil-umformen` and must then take a core id from its *more* column or the registry by a logged `deviation`.
4. **Fokus B2.2 U2 (HF 11, „einem Vortrag Feedback geben")** has no id; HF 11 is covered by the U6 tags, and ALL-04 is
   advisory at B2. If the card is built with a Lernziel, it needs a new id through this registry.
5. **Sources not re-checked against the primary PDFs** in this run (no network): tags come from memos 03, 05, 14, the W2
   drafts and BLUEPRINT *Leaders*. New tags to confirm: `GER 4.4.3.1·B2` (`podcast-interview-fuehren`, section number, page
   not checked); `As-B2 K7` (Kritik ids) and `Si-B2 L12` (`varietaeten-erkennen`) rest on the BLUEPRINT row placements;
   `BSK 39.3·B2` on `bescheid-verstehen` is by extension (the Widerspruch goal presupposes reading the Bescheid);
   `SB·B2` on `varietaeten-erkennen`: the CEFR puts full comprehension of regional varieties above B2, so the Lernziel is
   limited to recognising the national standard varieties and understanding marked regional words in context.
   `RC 117–119` is a page range (the RC has no B2 goals).
6. **Wording not yet run through LNG-01/02** (no Hunspell/LanguageTool here). Compounds to watch: *Studienteilnahme*,
   *Fördermöglichkeiten*, *Selbsthilfegruppen*, *Fachkraftstelle*, *Gesprächsrunde*, *Intranet-Forum*,
   *Forschungseinrichtung*, *Erfolgsaussicht*, *Themenfeldern*, *Schuldzuweisung*.
7. **Checks run** (2026-09-27, after the review fixes): `node scripts/course-v2/check.mjs content/course-v2/registries/cando/b2.json`
   → 0 errors; `node scripts/course-v2/validate.mjs content/course-v2/registries/cando/b2.json` → 38 rules skipped (no unit
   content yet), no blocker; `JSON.parse` OK; 121 unique ids; the scripted row checks of §3 and the wording check of §2.

## 10. Changes after the W2 DaF review (2026-09-27)

| Finding | Change |
|---|---|
| major — two B1+ core ids repeat B1.2 ids; `band` semantics | `telefonnotiz-weitergeben` (id kept, same function): several calls or a tangled request, ordered by urgency, next step per point; band B1+ → **B2**, source `ZM·B1+` → `SB·B2 Mediation`, `UT-B2 HV3`. **Id change `cd.b2.weg-zum-ziel-erklaeren` → `cd.b2.wege-zum-ziel-vergleichen`** (function changed: compare alternatives and justify one); band B1+ → **B2**, source `ZM·B2`, `SB·B2`. `band` now = level of the expected performance (A1/B1 reading), §2; no B1+ left. |
| major — ids with no step beyond a B1 id | Rewritten with the B2 step named (§6), ids kept: `leserkommentare-haltung` (irony, concession; + `SB·B2`), `fest-planen-kompromiss` (constraints, trade-offs), `kursanzeigen-auswaehlen`, `beratungsangebote-auswaehlen` (conditions), `meldungen-ueberschriften`. Same fix, not named in the finding: `vorgehen-gemeinsam-planen`, `forum-einstellungen-erkennen`, `karriereforum-haltungen`, `forum-aussagen-zuordnen`, `stellungnahmen-einordnen`, `erfahrungsberichte-ueberschriften`, `brief-sprachbausteine`. Every B1 → B2 pair is in §6. |
| major — notes keyed on W2 draft numbers | §3 re-keyed on the BLUEPRINT §2.8 rows with Core / More / W2 lines; the double-used drafts are split (each id core in exactly one row, scripted check); B2.1 row 10 Radio und Podcast gets `radio-standpunkte-erfassen`, `nachrichten-einmal-hoeren`, `reise-ansagen-einmal` (reworded) and the new `podcast-interview-fuehren`; the eigene-Fehler goal is core in row 12. §4 keeps the draft map as a secondary column, §8 is the crosswalk. hf, halfLevel and a few situations follow the new row (§2). |
| major — §2.8 Kern-Kann lines without an id | New: `sachtext-fuer-andere-zusammenfassen` (b2.1, mediation, SB·B2 Mediation, core U11), `kritik-verstehen` + `kritik-schreiben` (b2.2, HF 9, core U7), `bescheid-verstehen` (b2.2, HF 1, core U10), `varietaeten-erkennen` (b2.2, HF 9/10, core U11). `reportagen-verstehen` promoted from reserve to U11 core (hf + 10). |
| minor — §5.2 mis-files | LV1 lists only headline ids; stance-reading ids filed as course can-dos in Goethe format; `brief-gefuehle-abstufen`, `sachtext-verweise-verstehen`, `nominalstil-umformen` no longer under SB. New SB ids: `brief-grammatik-kontext` (B2.1 SB1, core U4) and `zeitungsartikel-wortwahl` (B2.2 SB2, core U12). |
| minor — Goethe lengths in learner-facing text | **Id changes** (slug named a count the text no longer carries): `forumsbeitrag-150-woerter` → `forumsbeitrag-ausfuehrlich`, `forumsbeitrag-vier-punkte` → `forumsbeitrag-gliedern`, `referat-vier-minuten` → `referat-halten`, `nachricht-vorgesetzte-100` → `konflikt-nachricht-vorgesetzte` (also given its B2.2 step over `missverstaendnis-klaeren-schriftlich`, + `BSK 54.2·B2`). „Prüfungslänge" dropped from `magazinartikel-im-detail`; „etwa anderthalb Minuten" dropped from `erfahrung-erzaehlen`. Only the tb2.sa ids `anfrage-krankenkasse-mail`, `formelle-beschwerde-frist` keep „mindestens 150 Wörtern" (telc form). |
| minor (cando-b1 finding) — two mediation rules | §2 states the shared rule in the words of `cando-b1.md` §9; no B2 flag changes. |
| (consequence) HF 6 Fokus | `elterngespraech-fuehren` halfLevel b2.2 → **b2.1**, *more* on B2.1 U5 (the BLUEPRINT's Fokus-DaZ „Elternabend"). |
