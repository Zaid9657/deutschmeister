# Can-do registry A2 — notes for the level curriculum agents

**Date:** 2026-09-27 · **Owner (sole writer):** cando-a2 · **Registry:** [`content/course-v2/registries/cando/a2.json`](../../../content/course-v2/registries/cando/a2.json) (SCHEMA §4.1, `course-v2/cando@1`) ·
**Status:** W2 draft, **revised after the W2 DaF review** (`docs/course-v2/reviews/w2/daf-cando.json`, 4 majors + 2 minors
for cando-a2, all applied — §4), before the registry freeze (BLUEPRINT §10.3). · **Exam lane:** ga2 only (Goethe-Zertifikat
A2; lean execution 2026-09-27 — no telc A2 / DTZ can-dos).
**Inputs:** SCHEMA §2, §4.1, §8, §15.1; BLUEPRINT §2.2, §2.8 (A2 rows), §9 (ALL-02, ALL-06, REF-01), §10.3;
[`curriculum/a2-1.json`](../curriculum/a2-1.json) + [`a2-2.json`](../curriculum/a2-2.json) (continuity pass of 2026-09-27);
research [04](../research/04-cando-a1-a2.md) (can-do inventory and source tags), [14](../research/14-lehrwerke-curricula.md) (placement),
[01](../research/01-exams-a1-a2.md) §3 + §7 (Goethe A2 Teile); `registries/lanes/ga2.json` (Teil ids, page references);
the sibling registries `cando/a1.json` and `cando/b1.json` (step pairs, §5).

## 1. How to use this

1. **Unit ids are the BLUEPRINT §2.8 rows, not the W2 draft numbers** — the same key as `cando-a1.md` and `cando-b1.md`.
   The A2 drafts order their units differently (A2.1 draft u03 „Immer online?“ is blueprint row 9, draft u08 „Im Job“ is
   row 7, draft u12 „Feste“ is row 3 …). In this file a draft unit is always written **W2 uNN** and a blueprint unit always
   as its full id (`a2.1-u07`). §3 is the table to build from; §10 is the full crosswalk.
2. **Core** = the 3–5 can-dos the unit lists in its Lernziele box (`spec.canDos` = `start.lernziele`) and proves in
   „Das kann ich“ (ALL-02). **Each id is core in exactly one unit**, always in its own `halfLevel`, so a learner never
   „gains“ the same can-do twice. **More** = spiral reuse, a Vorschau, a Fokus-Karte or an optional task; reference those ids
   in Aufgaben, lane blocks and review, never in the Lernziele box. An a2.1 unit never lists an a2.2 id, not even in More.
3. A curriculum agent may swap a core id for one from the same row's More column or from the registry with a logged
   `deviation`; it may **not** invent an id (REF-01). New wording or a new can-do goes through the registry owner, and a
   meaning change takes a new id (SCHEMA §0.3).
4. **ALL-02 (≥ 1 productive can-do proven by an Aufgabe).** The validator reads „productive“ as mode
   `productive-*` **or** `interaction-*` (`scripts/course-v2/rules/ALL-02.mjs`, `PRODUCTIVE = /^(productive|interaction)-/`).
   Every core set in §3 has at least one such id; the curriculum agent must still make an Aufgabe prove one of them.
5. **ALL-06 (≥ 1 online-interaction can-do per half-level), on core ids.** A2.1: `cd.a2.online-bestellung-klaeren`
   (core `a2.1-u04`) and `cd.a2.online-reagieren` (core `a2.1-u11`); A2.2: `cd.a2.gruppenchat-absprechen` (core
   `a2.2-u02`, no longer a suggestion). These three are the only `online: true` ids in the registry (§6). Keep at least one
   per half-level as core when swapping. Mediation: no A2 id carries `mediation: true` (the quota starts at B1.1).
6. The **Diagnose** (A2.2, free), the **Halbtest** (after A2.1 U12) and the **Prüfungswochen** carry no Lernziele of their
   own; they report per Teil (BLUEPRINT §5).

## 2. What the registry holds

| Group | Items | What it is |
|---|---|---|
| W2 draft lines | 81 | every can-do line of `a2-1.json` (40) and `a2-2.json` (41), one id each, reworded (§6); five renamed in this revision (§4.1) |
| ga2 lane | 28 | Goethe-Zertifikat A2 Prüfungsziele no draft line covers, or productive can-dos the unit's writing/speaking Aufgabe proves (§8.1) |
| ga2 twins | 2 | the A2.2 Lernziele for ga2 **L2** and **H3** that the first draft lacked (`infotafel-amt-nutzen`, `gespraeche-einmal-hoeren`) |
| neu (Blueprint-Zeile) | 8 | a BLUEPRINT §2.8 Kern-Kann line with no draft id (§4.2) |
| Fokus | 1 | `cd.a2.elternbrief-verstehen` for the A2.1 U10 Fokus-DaZ card „Ein Elternbrief aus Kita und Schule“ (HF 6) |
| Quota | 1 | `cd.a2.gruppenchat-absprechen` (ALL-06, A2.2) |
| Reserve | 7 | memo-04 A2 goals no draft unit used; four are now placed (§8.3), three HF 6 ids stay unplaced |
| **Total** | **128** | halfLevel a2.1: **62** · a2.2: **66** |

Placement (§3): **110 ids are core** in exactly one unit; **15 are More-only**; **3 are reserve** (no row). A scratch
check confirmed: 3–5 core per unit, ≥ 1 productive/interaction core per unit, no id core twice, every core id in its own
half-level, no a2.2 id referenced from an a2.1 row, every registry id placed on a row or listed as reserve, the ALL-06
quota met on core ids in both halves.

## 3. Unit → can-do ids (BLUEPRINT §2.8 rows — use this table)

*Prüfungsteile* = the row's GA2 Teile (bold = full length in Prüfungsmodus, .2 only). Core ids are written in full; More
ids without the `cd.a2.` prefix, with the reason in parentheses. *W2 lines* names the draft unit and line number(s)
(`W2 u07 #3` = draft unit 7, `canDo` line 3, §7), the ga2 additions by the draft unit they were first suggested for (§8.1),
and the ids that are new in this revision (**neu**, §4.2).

### A2.1 — „Kontakte pflegen, Dinge erledigen“

| Unit | Titel | Prüfungsteile (GA2) | Core (Lernziele) | n | More (spiral · Vorschau · Fokus · optional) | Origin (W2 lines · ga2 · neu) |
|---|---|---|---|---|---|---|
| `a2.1-u01` | Neu hier: Kontakte knüpfen | Sp1, Sp2, L3 | `cd.a2.ueber-mich-austauschen` · `cd.a2.kontakt-smalltalk` · `cd.a2.erlebnis-berichten` · `cd.a2.saetze-verbinden-weil` · `cd.a2.nachfragen-ausfuehrlich-antworten` | 5 | persoenliche-mail-verstehen (L3-Vorschau) | W2 u01 #1–4 · ga2 Sp1 (W2 u01) |
| `a2.1-u02` | Die neue Wohnung | H2, Sp3, L4 | `cd.a2.moebel-platzieren` · `cd.a2.wohnsituation-beschreiben` · `cd.a2.wohnungsanzeigen-verstehen` · `cd.a2.besichtigung-vereinbaren` · `cd.a2.mail-an-vermieterin` | 5 | besichtigung-verstehen (W2 u02 #3) · gespraech-wochentage-folgen (H2-Vorschau) | W2 u02 #1, #2, #4 · ga2 S2 (W2 u02) · **neu** moebel-platzieren |
| `a2.1-u03` | Kommst du zu meiner Feier? | S1, Sp3, H3 | `cd.a2.zur-feier-einladen` · `cd.a2.einladung-schriftlich-beantworten` · `cd.a2.geschenke-besprechen` · `cd.a2.zum-fest-absprechen` · `cd.a2.dank-oder-entschuldigung-schreiben` | 5 | freizeit-absagen (W2 u07 #2) · vorschlag-ablehnen-schriftlich (ga2 S1, W2 u07) · kurze-gespraeche-verstehen (H3-Vorschau) · freude-zeigen (Geschenk) | W2 u12 #1–4 · **neu** geschenke-besprechen |
| `a2.1-u04` | Einkaufen: vergleichen und bestellen | L2, L4, S2 | `cd.a2.produktinfos-erfragen` · `cd.a2.alltagsdinge-bewerten` · `cd.a2.wegweiser-nutzen` · `cd.a2.alltagstexte-durchsuchen` · `cd.a2.online-bestellung-klaeren` | 5 | kurze-gespraeche-verstehen (H3-Vorschau) | W2 u04 #1–3 · W2 u07 #3 · ga2 L2 (W2 u04) |
| `a2.1-u05` | Im Restaurant | H3, S2, Sp1 | `cd.a2.tisch-reservieren` · `cd.a2.im-restaurant-bestellen` · `cd.a2.im-restaurant-reklamieren` · `cd.a2.mail-an-restaurant` · `cd.a2.kurze-gespraeche-verstehen` | 5 | bedienung-fragen-bezahlen (W2 u05 #3) · ueber-essengehen-erzaehlen (ga2 Sp2, optional) | W2 u05 #1, #2 · ga2 S2 (W2 u05) · ga2 H3 (W2 u04) · **neu** im-restaurant-reklamieren |
| `a2.1-u06` | Mit der Bahn unterwegs | H1, L2 | `cd.a2.durchsage-anschluss-verstehen` · `cd.a2.zugreise-buchen` · `cd.a2.fahrplan-lesen` · `cd.a2.am-bahnhof-fragen` · `cd.a2.ankunft-mitteilen` | 5 | alltagstexte-durchsuchen | W2 u06 #1–4 · ga2 S1 (W2 u06) |
| `a2.1-u07` | Am Telefon im Job — **SCHEMA §15 fixture** | H1, S2, Sp1 | `cd.a2.mailbox-verstehen` · `cd.a2.rueckruf-weitergeben` · `cd.a2.arbeit-erzaehlen` · `cd.a2.termin-absagen-mail` | 4 | — | W2 u08 #1–3 · ga2 S2 (W2 u08) |
| `a2.1-u08` | Gesund bleiben | H4, Sp2, S1 | `cd.a2.beim-arzt-auskunft-geben` · `cd.a2.behandlung-verstehen` · `cd.a2.gesundheitstipps-geben` · `cd.a2.mail-an-chefin-krank` · `cd.a2.ratgeber-verstehen` | 5 | radiointerview-alltag | W2 u09 #1–3 · ga2 S2, L1 (W2 u09) |
| `a2.1-u09` | Immer online? | L1, S1 | `cd.a2.fehlermeldungen-verstehen` · `cd.a2.kurzmeldung-mit-zahlen` · `cd.a2.gefallen-begruenden` · `cd.a2.nachricht-handyproblem` · `cd.a2.radiointerview-alltag` | 5 | online-reagieren | W2 u03 #1–3 · ga2 S1, H4 (W2 u03) |
| `a2.1-u10` | Schule, Ausbildung, Kurse | L3, Sp2 | `cd.a2.ausbildung-beschreiben` · `cd.a2.vergangenes-aufschreiben` · `cd.a2.persoenliche-mail-verstehen` | 3 | elternbrief-verstehen (Fokus-DaZ HF 6) · leben-hier-und-dort (Vorschau U12) · freizeit-absagen (W2 u07 #2) | W2 u11 #2, #3 · ga2 L3 (W2 u10) · Fokus-DaZ: **neu** elternbrief-verstehen |
| `a2.1-u11` | Gefühle, auch online | S1, L1, H4 | `cd.a2.freude-zeigen` · `cd.a2.aerger-ausdruecken` · `cd.a2.mitgefuehl-zeigen` · `cd.a2.online-reagieren` · `cd.a2.brief-gefuehle-hilfe` | 5 | radiointerview-alltag · kurzmeldung-mit-zahlen | W2 u10 #1–3 · ga2 S1 (W2 u10) · **neu** aerger-ausdruecken |
| `a2.1-u12` | Hier und dort | H2, L4, Sp3 → Halbtest | `cd.a2.leben-hier-und-dort` · `cd.a2.reise-erzaehlen` · `cd.a2.gespraech-wochentage-folgen` · `cd.a2.aktivitaet-vorschlagen` | 4 | freizeit-absagen (W2 u07 #2) · vorschlag-ablehnen-schriftlich (ga2 S1, W2 u07) · wohnsituation-beschreiben | W2 u11 #1 · W2 u07 #1 · ga2 H2 (W2 u07) · **neu** reise-erzaehlen |

### A2.2 — „Gespräche führen, Probleme lösen“

| Unit | Titel | Prüfungsteile (GA2) | Core (Lernziele) | n | More (spiral · Vorschau · Fokus · optional) | Origin (W2 lines · ga2 · neu) |
|---|---|---|---|---|---|---|
| `a2.2-u01` | Sprachen lernen | **Sp1**, L1, H3 | `cd.a2.meine-sprachen` · `cd.a2.gespraech-in-gang-halten` · `cd.a2.im-gespraech-nachfragen` · `cd.a2.themenwechsel-folgen` · `cd.a2.zeitungsartikel-verstehen` | 5 | mail-an-sprachschule (ga2 S2, optional) | W2 u01 #1–3 · W2 u03 #3 · ga2 L1 (W2 u01) |
| `a2.2-u02` | Wir planen einen Ausflug | **Sp3**, H2, L4 | `cd.a2.ausflug-mitplanen` · `cd.a2.einigung-vorschlagen` · `cd.a2.gruppenchat-absprechen` · `cd.a2.wochenendwunsch-nachricht` · `cd.a2.angebote-zuordnen` | 5 | hoffnungen-aeussern (W2 u02 #2) · aktivitaet-vorschlagen | W2 u04 #3 · W2 u08 #3 · ga2 S1 (W2 u02) · ga2 L4 (W2 u05) · quota gruppenchat-absprechen |
| `a2.2-u03` | Im Hotel | **S2**, L2, H1 | `cd.a2.hotelzimmer-reservieren` · `cd.a2.buchung-aendern` · `cd.a2.nach-gruenden-fragen` · `cd.a2.mail-an-hotel` · `cd.a2.ueber-reisen-erzaehlen` | 5 | zugreise-buchen | W2 u03 #1, #2 · ga2 S2, Sp2 (W2 u03) · **neu** buchung-aendern |
| `a2.2-u04` | Unterwegs: Wege und Zwischenfälle | **H1**, L4, S1 | `cd.a2.weg-erklaeren` · `cd.a2.wegbeschreibung-schreiben` · `cd.a2.unfall-melden` · `cd.a2.notruf-anweisungen-folgen` | 4 | durchsage-anschluss-verstehen | W2 u04 #1, #2, #4 · reserve notruf-anweisungen-folgen |
| `a2.2-u05` | Handy, Vertrag, Kündigung | **L1**, S2 | `cd.a2.vertrag-kuendigen` · `cd.a2.dinge-beschreiben-vergleichen` · `cd.a2.hoeflich-widersprechen` | 3 | online-bestellung-klaeren · angebote-zuordnen | W2 u05 #1–3 |
| `a2.2-u06` | Mein Geld | **Sp2**, H3, L3, H2 | `cd.a2.bankgeschaefte-erledigen` · `cd.a2.karte-verloren-melden` · `cd.a2.versicherungsbrief-verstehen` · `cd.a2.aenderungen-melden` · `cd.a2.gespraeche-einmal-hoeren` | 5 | — | W2 u07 #3, #4 · reserve aenderungen-melden · **neu** bankgeschaefte-erledigen · **neu** ga2 H3 twin |
| `a2.2-u07` | Die Heizung ist kaputt | **S2**, H4, L3, Sp3 | `cd.a2.schaden-melden` · `cd.a2.nachbarn-vorwarnen` · `cd.a2.mietvertrag-verstehen` · `cd.a2.mail-an-hausverwaltung` · `cd.a2.reparaturtermin-abstimmen` | 5 | neue-adresse-mitteilen (reserve) | W2 u06 #1–3 · ga2 S2, Sp3 (W2 u06) |
| `a2.2-u08` | Wetter, Klima, Umwelt | **H4**, H1, L1, Sp2 | `cd.a2.radiomeldungen-verstehen` · `cd.a2.meinung-alltag-deutschland` · `cd.a2.sorgen-aussprechen` | 3 | einigung-vorschlagen | W2 u08 #1, #2 · W2 u02 #3 |
| `a2.2-u09` | Mein Weg | **L3**, Sp2, H4 | `cd.a2.schulen-und-abschluesse` · `cd.a2.berufserfahrung-erzaehlen` · `cd.a2.lebenslauf-schreiben` · `cd.a2.laengere-mail-verstehen` · `cd.a2.interview-beruf-verstehen` | 5 | ziele-nennen | W2 u09 #1–3 · ga2 L3 (W2 u02) · ga2 H4 (W2 u10) |
| `a2.2-u10` | Bewerbung und Vorstellungsgespräch | **L4**, Sp1, H2 | `cd.a2.stellenanzeigen-verstehen` · `cd.a2.bewerbungsgespraech-motivation` · `cd.a2.arbeitsbedingungen-klaeren` · `cd.a2.mail-auf-stellenanzeige` · `cd.a2.arbeitsablaeufe-erklaeren` | 5 | arbeitsvertrag-verstehen (W2 u10 #3) · arbeitsstand-absprechen (W2 u11 #2) · aufgaben-verteilen (W2 u11 #5, Sp3) · notiz-hinterlassen (W2 u11 #3) · urlaubsantrag-ausfuellen (W2 u11 #4) · aushang-hilfe-anbieten (reserve) · wochenbericht-folgen (H2) | W2 u10 #1, #2 · W2 u11 #1 · ga2 S2 (W2 u10) · **neu** stellenanzeigen-verstehen |
| `a2.2-u11` | Post vom Amt | **L2**, S1, H3, Sp3 | `cd.a2.behoerdenbrief-verstehen` · `cd.a2.am-amt-nachfragen` · `cd.a2.um-erklaerung-bitten` · `cd.a2.infotafel-amt-nutzen` | 4 | neue-adresse-mitteilen (reserve) · gespraeche-einmal-hoeren | W2 u07 #1, #2, #5 · **neu** ga2 L2 twin |
| `a2.2-u12` | Lebensstationen | **S1**, **H2**, **H3**, Sp2 | `cd.a2.zusammenhaengend-schreiben` · `cd.a2.der-reihe-nach-erzaehlen` · `cd.a2.leben-erzaehlen` · `cd.a2.wochenbericht-folgen` · `cd.a2.ziele-nennen` | 5 | hoffnungen-aeussern (W2 u02 #2) | W2 u12 #1–3 · ga2 H2 (W2 u09) · W2 u02 #1 |

**Why these placements** (the non-obvious ones):

- `a2.1-u07` carries exactly the four ids of the SCHEMA §15.1 fixture (`content/course-v2/fixtures/a2.1-u07.json`), so the
  fixture resolves against this registry unchanged. Its More column is empty on purpose (the fixture is the contract).
- The ids of the three orphan draft units (no blueprint row) are placed as follows. **W2 a2.1 u07 „Im Verein“:**
  `aktivitaet-vorschlagen` → core `a2.1-u12` (its Sp3), `alltagstexte-durchsuchen` → core `a2.1-u04` (Prospekte, L2/L4),
  `gespraech-wochentage-folgen` → core `a2.1-u12` (its H2); `freizeit-absagen` and `vorschlag-ablehnen-schriftlich` → More
  (U3, U12). **W2 a2.2 u02 „Wünsche, Träume, Sorgen“:** `ziele-nennen` → core `a2.2-u12` (Lebensstationen: past → future),
  `sorgen-aussprechen` → core `a2.2-u08` (Umwelt), `wochenendwunsch-nachricht` → core `a2.2-u02` (Konjunktiv II *würde gern*,
  the row's grammar), `laengere-mail-verstehen` → core `a2.2-u09` (its bold L3), `hoffnungen-aeussern` → More (U2, U12).
  **W2 a2.2 u11 „Im Job: Abläufe“:** `arbeitsablaeufe-erklaeren` → core `a2.2-u10` (Auskunft im Vorstellungsgespräch);
  `arbeitsstand-absprechen`, `notiz-hinterlassen`, `urlaubsantrag-ausfuellen`, `aufgaben-verteilen` → More in `a2.2-u10`
  (optional work tasks; B1.1 U2/U7 take the work thread up as core — `cd.b1.aufgaben-verteilen`, `cd.b1.absprachen-kollegen`).
- Blueprint rows the drafts did not have as a unit are now full sets: `a2.1-u12` (4 core), `a2.2-u02` (5 core, incl. the
  ALL-06 id), `a2.2-u06` (5 core: two draft lines, the reserve `aenderungen-melden`, two new ids).
- `themenwechsel-folgen` (W2 a2.2 u03 #3) moved from the hotel to `a2.2-u01`, whose Kern-Kann is the conversation strategy
  (begin, keep going, end).
- **More-only ids (15).** `besichtigung-verstehen`, `bedienung-fragen-bezahlen` (≈ `cd.a1.bestellen-bezahlen`, so no second
  core), `ueber-essengehen-erzaehlen`, `freizeit-absagen`, `vorschlag-ablehnen-schriftlich`, `elternbrief-verstehen` (Fokus),
  `mail-an-sprachschule`, `hoffnungen-aeussern`, `arbeitsvertrag-verstehen`, `arbeitsstand-absprechen`, `notiz-hinterlassen`,
  `urlaubsantrag-ausfuellen`, `aufgaben-verteilen`, `aushang-hilfe-anbieten`, `neue-adresse-mitteilen`. They are valid ids
  for Aufgaben, lane blocks, review and swaps (with a `deviation`); none is a Lernziel as placed.

## 4. What this revision changed (W2 DaF review, 2026-09-27)

### 4.1 Renamed ids (old → new): the A2 step named in the wording

The review found five A2 ids that described the same performance as an A1 core id. Each was reworded to name its A2 step;
because that is a meaning change, each takes a **new id** (SCHEMA §0.3). No other file referenced the old ids (checked:
fixtures, tests, SCHEMA, sibling notes), so nothing else changes.

| Old id | New id | A1 twin | The A2 step now in the wording |
|---|---|---|---|
| `cd.a2.online-bestellen` | `cd.a2.online-bestellung-klaeren` | `cd.a1.online-bestellen` (order, fill in the form) | the order goes wrong: write to customer service in chat or a contact form what is wrong and what I want (Umtausch) |
| `cd.a2.durchsagen-verstehen` | `cd.a2.durchsage-anschluss-verstehen` | `cd.a1.durchsage-reise` (delay, new platform) | announcements with several pieces of information (Ersatzverkehr, missed Anschluss) and knowing what to do now |
| `cd.a2.einladung-beantworten` | `cd.a2.einladung-schriftlich-beantworten` | `cd.a1.einladung-antworten` (accept/decline, short reason) | written, in the right register (du to friends, Sie to colleagues and superiors), with a reason **and** a counter-proposal; now one channel (productive-written) |
| `cd.a2.fragen-zur-person` | `cd.a2.nachfragen-ausfuehrlich-antworten` | `cd.a1.fragen-thema` (question from a keyword, answer) | a follow-up question on the partner's answer, and an own answer in two or three connected sentences (ga2 Sp1) |
| `cd.a2.zum-fest-verabreden` | `cd.a2.zum-fest-absprechen` | `cd.a1.verabreden`, `cd.a1.feier-planen` | several points at once (who picks up whom, when we leave, who brings what) and an alternative when something does not work, without help (ga2 Sp3) |

### 4.2 New ids

| Id | halfLevel · core in | Mode | Source tag(s) | Origin · why |
|---|---|---|---|---|
| `cd.a2.moebel-platzieren` | a2.1 · `a2.1-u02` | interaction-spoken | GI-A2F 16; GER-R·A2 | **neu (Blueprint-Zeile)** A2.1 U2 „sagen, wohin etwas kommt und wo es steht“ (Wechselpräpositionen). Step vs `cd.a1.wohnung-beschreiben`: directing where things go (*wohin* + Akk.) and saying where they are (*wo* + Dat.) in one exchange |
| `cd.a2.geschenke-besprechen` | a2.1 · `a2.1-u03` | interaction-spoken | GI-A2F 16; US-A2 Sp3 | **neu (Blueprint-Zeile)** A2.1 U3 „über Geschenke sprechen“ (Dativ + Akkusativ: *wem wir was schenken*) |
| `cd.a2.im-restaurant-reklamieren` | a2.1 · `a2.1-u05` | interaction-spoken | RC 48·A2; RC 126·A2 | **neu (Blueprint-Zeile)** A2.1 U5 „höflich reklamieren“. Step vs `cd.a1.problem-melden`: polite but clear disagreement plus a request for a solution |
| `cd.a2.aerger-ausdruecken` | a2.1 · `a2.1-u11` | interaction-spoken | RC 48·A2 | **neu (Blueprint-Zeile)** A2.1 U11 „Ärger ausdrücken“ (*sich ärgern über*, the row's Verb + Präposition) |
| `cd.a2.reise-erzaehlen` | a2.1 · `a2.1-u12` | productive-spoken | GI-A2F 16; RC 30·A2 | **neu (Blueprint-Zeile)** A2.1 U12 „von einer Reise erzählen“. Step vs `cd.a1.reise-erzaehlen` (where I went, what I did): comparing there and here, saying what I liked better |
| `cd.a2.buchung-aendern` | a2.2 · `a2.2-u03` | interaction-spoken | RC 125·A2; RC 144·A2 | **neu (Blueprint-Zeile)** A2.2 U3 „eine Buchung ändern“ (indirect question *ob* — the row's grammar) |
| `cd.a2.bankgeschaefte-erledigen` | a2.2 · `a2.2-u06` | interaction-spoken | RC 77·A2; RC 112·A2 | **neu (Blueprint-Zeile)** A2.2 U6 „Bankgeschäfte erledigen“. Step vs `cd.a1.ueberweisung`/`geldautomat` (a form, a screen): stating a banking request at the counter or by phone and asking back. Tags by extension (§11 item 3) |
| `cd.a2.stellenanzeigen-verstehen` | a2.2 · `a2.2-u10` | receptive-written | US-A2 L4; RC 100·A2 | **neu (Blueprint-Zeile)** A2.2 U10 „Stellenanzeigen verstehen“. Step vs `cd.a1.stellenanzeigen` (which job, where, when): what the firm expects and offers, and whether the job fits me (the L4 operation) |
| `cd.a2.infotafel-amt-nutzen` | a2.2 · `a2.2-u11` | receptive-written | US-A2 L2 | **ga2 twin, L2.** Step vs `cd.a2.wegweiser-nutzen` (a2.1, shop directory): an office board or website where the learner's need is worded differently from the entry |
| `cd.a2.gespraeche-einmal-hoeren` | a2.2 · `a2.2-u06` | receptive-spoken | US-A2 H3 | **ga2 twin, H3.** Step vs `cd.a2.kurze-gespraeche-verstehen` (a2.1, shop/restaurant/phone): public-service settings (bank, office, practice), normal tempo, heard once, the final agreement |
| `cd.a2.elternbrief-verstehen` | a2.1 · More `a2.1-u10` | receptive-written | RC 118·A2; RC 117·A1 | **Fokus-DaZ** card of A2.1 U10 (HF 6). Step vs `cd.a1.elternbrief-rueckmeldung` (fill in the return slip): read the letter itself — what is planned, what to bring, the deadline. Tag by extension (§11 item 3) |

### 4.3 Other changes (ids kept)

| Id | Change | Why |
|---|---|---|
| `fehlermeldungen-verstehen`, `angebote-zuordnen`, `notiz-hinterlassen` | `online: true` → **false** | one rule for online (§6): only interaction in a digital channel |
| `persoenliche-mail-verstehen` | wording limited to a **kurze, einfache** e-mail and **konkrete Angaben**; source `US-A2 L3` only (GER-R·A2 dropped) | the GER-R·A2 reading cell covers short, simple personal letters; the old wording described the B1 cell |
| `laengere-mail-verstehen` | source `US-A2 L3` only (GER-R·A2 dropped); „längere“ stays, a2.2 only | as above; the exam tests the full-length e-mail at A2 |
| `zeitungsartikel-verstehen` | „die Hauptaussagen und wichtige Einzelheiten“ → „die wichtigsten Informationen (wer, was, wann, warum)“ of a **kurzen** article; source `US-A2 L1` only | the old wording read above A2 |
| `urlaubsantrag-ausfuellen` | mode interaction-written → **productive-written** | forms are productive-written in all registries (A1: `formular-person`, `ueberweisung`, `dienstplan`) |
| `besichtigung-vereinbaren`, `produktinfos-erfragen` | „oder schriftlich“ / „oder online“ removed | one channel per id; both are `interaction-spoken` (the online side is `online-bestellung-klaeren`) |
| `kurze-gespraeche-verstehen` | „im Geschäft, **im Restaurant** oder am Telefon“ | core now in `a2.1-u05` Restaurant (its H3); meaning unchanged |
| `ankunft-mitteilen` | „auch wenn sich meine Reise ändert“ added | the row's Kern-Kann „Reisepläne ändern“ (A2.1 U6, *wenn*); same function (a message about my arrival), so the id stays |

## 5. A1 → A2 step pairs

Every A2 core id whose situation an A1 core id already covers names its A2 step (memo 04 F3: recombined chunks,
*und/aber/weil*, normal tempo, less support). Pairs from §4.1 and §4.2, plus the older ones the reviewer did not flag:

| A1 id (core in) | A2 id (core in) | The A2 step |
|---|---|---|
| `online-bestellen` (a1.2-u10) | `online-bestellung-klaeren` (a2.1-u04) | order goes wrong → written contact with customer service |
| `durchsage-reise` (a1.2-u08) | `durchsage-anschluss-verstehen` (a2.1-u06) | several items per announcement + the action to take |
| `einladung-antworten` (a1.2-u11) | `einladung-schriftlich-beantworten` (a2.1-u03) | register choice + reason + counter-proposal |
| `fragen-thema` (a1.1-u03) | `nachfragen-ausfuehrlich-antworten` (a2.1-u01) | follow-up question + connected answer |
| `verabreden` (a1.1-u08), `feier-planen` (a1.2-u12) | `zum-fest-absprechen` (a2.1-u03) | several points, alternatives, without help |
| `reise-erzaehlen` (a1.2-u08) | `reise-erzaehlen` (a2.1-u12) | comparison there/here, preference |
| `stellenanzeigen` (a1.2-u01 More) | `stellenanzeigen-verstehen` (a2.2-u10) | requirements and conditions, fit judgement |
| `wohnung-beschreiben` (a1.1-u06) | `moebel-platzieren` (a2.1-u02), `wohnsituation-beschreiben` (a2.1-u02) | *wohin/wo* in interaction; connected description of how I live |
| `problem-melden` (a1.2-u10) | `im-restaurant-reklamieren` (a2.1-u05) | disagreement stated politely + a solution requested |
| `bestellen-bezahlen` (a1.1-u09) | `im-restaurant-bestellen` (a2.1-u05); `bedienung-fragen-bezahlen` More only | asking what is in a dish (RC 125·A2); paying stays a More item because A1 already made it core |
| `absage-entschuldigung` (a1.2-u05) | `termin-absagen-mail` (a2.1-u07) | e-mail genre (S2) with a new date proposed |
| `durchsage-bahnhof` (a1.1-u10) | `durchsage-anschluss-verstehen` (a2.1-u06) | see above |
| `elternbrief-rueckmeldung` (a1.1-u12 More) | `elternbrief-verstehen` (a2.1-u10 More) | reading the letter, not only the slip |
| `mitteilungen-austauschen` (a1.2-u05) | `gruppenchat-absprechen` (a2.2-u02) | a group arrangement with proposals, reactions and a confirmed result |

B1 continues these threads (`cando-b1.md` §5 records the A2 → B1 steps, e.g. `cd.a2.mietvertrag-verstehen` →
`cd.b1.mietvertrag-verstehen`, `cd.a2.zugreise-buchen` → `cd.b1.stoerung-umbuchen`).

## 6. Conventions

- **Wording.** `de` is our own ich-Form sentence. The W2 drafts copy the source wording with only the person changed
  (a2-1.md header), so **every draft line was rewritten**, not transcribed. A scripted check (re-run after this revision on
  all 128 items) compared each `de` against every draft line and every ich-Form line of memo 04: after the shared „Ich kann“
  the longest common word run is **4 words** (collocations such as „wie es mir geht“, „und einen Kompromiss finden“,
  „zu einer Feier einladen“); nothing reaches 5. The four ids of SCHEMA §15.1 keep the wording the SCHEMA fixes. Lernziele
  are addressed to the learner in ich-Form; the learner-facing unit title (`title.canDo`) stays in Sie (SCHEMA §8).
- **Ids.** `cd.a2.<slug>`, German slug, ASCII-folded (ä → ae, ß → ss), naming the function, not the unit number, so an id
  survives a unit move. A meaning change takes a new id (SCHEMA §0.3; §4.1).
- **halfLevel** = the half-level of the unit whose core carries the id (for More-only and reserve ids: where they fit).
- **band** = the CEFR band of the descriptor as its primary source tags it: **A2** by default; **A2+** only where the source
  is an A2+ descriptor (GER-M·A2+, GI-HB 34·A2+): `gespraech-in-gang-halten`, `dinge-beschreiben-vergleichen`,
  `zusammenhaengend-schreiben`, `leben-erzaehlen`. A1 and B1 read `band` as the level of the expected performance; see
  §11 item 4 for the one-rule question.
- **mode.** One mode and **one channel** per id. Hören/Lesen → `receptive-*`; a monologue or a description (Sprechen Teil 2
  type) → `productive-spoken`; e-mails, SMS, letters, notes, CV **and forms** → `productive-written` (SCHEMA §15.1 precedent
  `termin-absagen-mail`; A1 forms); dialogue, reacting, arranging → `interaction-spoken`; chat, posts and exchanges with a
  service in a digital channel → `interaction-written`. No A2 line is mediation; `mediation` is `false` throughout.
- **online** = `true` **only when the can-do is carried out as interaction in a digital channel** (mode
  `interaction-written`, or `interaction-spoken` in a video call). A2 has three: `online-bestellung-klaeren`,
  `online-reagieren` (A2.1), `gruppenchat-absprechen` (A2.2). Reading a web page, an error message or online offers, and
  writing an e-mail or a note, stay `false` — they are text types, not online interaction. This is the rule B2 already uses
  and the reviewer proposed for all four registries; A1 (`behoerde-internet`, `handy-menue`) and B1 (`meinung-forum`) still
  differ (§11 item 1).
- **hf** = BAMF Handlungsfeld(er) (1–12, A–E) of the RC page the line comes from, plus the unit's field where it differs.
  Cross-cutting areas by memo 04's page ranges (A 29–38, B 39–46, C 47–52, D 53–60, E 61–74); Handlungsfelder by the
  pages memo 04 cites for them (1 Ämter 76–77, 2 Arbeit 82–89, 3 Arbeitssuche 94–100, 5 Banken 110–112, 6 Kinder 117–119,
  7 Einkaufen 124–126, 8 Gesundheit 130–134, 9 Medien 138–139, 10 Mobilität 142–145, 11 Unterricht 148–149, 12 Wohnen
  154–157). Non-RC sources take the unit's field.
- **source** keeps memo 04's tags: `RC n·A2`, `GER-R·A2`, `GER-M·A2+`, `GI-A2F n`, `PD/RC 161·A2`, `GI-HB 34·A2+`.
  ga2 ids cite **`US-A2 <Teil>`** — the Goethe-Zertifikat A2 Übungssatz (Prüfungsziel per Teil, overview p. 3; pages per
  Teil as in `lanes/ga2.json`), Teil in BLUEPRINT §2.8 notation (L1–L4, H1–H4, S1–S2, Sp1–Sp3). **Precedence:** where an
  exam Teil tests a text at A2 that the CEFR grid words more narrowly (the L1/L3 texts), the `US-A2` tag is the only
  source and the wording stays within what the Teil asks (§4.3); `GER-R·A2` is added only where the grid cell names the
  same skill at the same length. Source tags stay in the data and never reach the screen (memo 04 implication 7).

## 7. W2 draft line → id (with the draft's source tag)

`Line` = W2 draft unit · line number in the draft's `canDo` array. ¹ = wording fixed by SCHEMA §15.1. ² = renamed in this
revision (§4.1). The row that carries each id is in §3.

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
| u04·2 | `cd.a2.online-bestellung-klaeren` ² | Interaktion schr. (online) | A2 | 7, 9 | GER-R·A2; RC 124·A2 | 04-cando-a1-a2 (A2.1 #4) · GER-R·A2 (Online-Interaktion) |
| u04·3 | `cd.a2.alltagsdinge-bewerten` | Sprechen (zus.) | A2 | 7, B | RC 43·A2 | 04-cando-a1-a2 (A2.1 #4) · RC 43·A2 |
| u05·1 | `cd.a2.im-restaurant-bestellen` | Interaktion mdl. | A2 | 7 | RC 125·A2 | 04-cando-a1-a2 (A2.1 #5) · RC 125·A2 |
| u05·2 | `cd.a2.tisch-reservieren` | Interaktion mdl. | A2 | 7 | RC 125·A2 | 04-cando-a1-a2 (A2.1 #5) · RC 125·A2 (gekürzt; Hotelzimmer in A2.2 E3) |
| u05·3 | `cd.a2.bedienung-fragen-bezahlen` | Interaktion mdl. | A2 | 7 | RC 126·A2 | 04-cando-a1-a2 (A2.1 #5) · RC 126·A2 |
| u06·1 | `cd.a2.durchsage-anschluss-verstehen` ² | Hören | A2 | 10 | RC 143·A2; US-A2 H1 | 04-cando-a1-a2 (A2.1 #6) · RC 143·A2 |
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
| u10·3 | `cd.a2.online-reagieren` | Interaktion schr. (online) | A2 | B, D | GER-R·A2 | 04-cando-a1-a2 (A2.1 #11) · GER-R·A2 (Online-Interaktion) |
| u11·1 | `cd.a2.leben-hier-und-dort` | Sprechen (zus.) | A2 | A, 4 | RC 30·A2 | 04-cando-a1-a2 (A2.1 #12) · RC 30·A2 |
| u11·2 | `cd.a2.vergangenes-aufschreiben` | Schreiben | A2 | 4 | GI-A2F 17 | 04-cando-a1-a2 (A2.1 #13) · GI-A2F 17 |
| u11·3 | `cd.a2.ausbildung-beschreiben` | Sprechen (zus.) | A2 | 4 | GER-R·A2 | 04-cando-a1-a2 (A2.1 #1) · GER-R·A2 (gekürzt) |
| u12·1 | `cd.a2.zur-feier-einladen` | Schreiben | A2 | D | RC 57·A2 | 04-cando-a1-a2 (A2.1 #2) · RC 57·A2 |
| u12·2 | `cd.a2.einladung-schriftlich-beantworten` ² | Schreiben | A2 | D | RC 57·A2; US-A2 S1 | 04-cando-a1-a2 (A2.1 #2) · RC 57·A2 |
| u12·3 | `cd.a2.zum-fest-absprechen` ² | Interaktion mdl. | A2 | D | RC 57·A2; US-A2 Sp3 | 04-cando-a1-a2 (A2.1 #2) · RC 57·A2 |
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
| u11·4 | `cd.a2.urlaubsantrag-ausfuellen` | Schreiben (Formular) | A2 | 2 | RC 88·A2 | 04-cando-a1-a2 (A2.2 #7) · RC 88·A2 |
| u11·5 | `cd.a2.aufgaben-verteilen` | Interaktion mdl. | A2 | 2, 11 | RC 149·A2 | 04-cando-a1-a2 (A2.2 #2) · RC 149·A2 |
| u12·1 | `cd.a2.zusammenhaengend-schreiben` | Schreiben | A2+ | A, D | GI-HB 34·A2+ | 04-cando-a1-a2 (A2.2 #14) · GI-HB 34·A2+ |
| u12·2 | `cd.a2.der-reihe-nach-erzaehlen` | Sprechen (zus.) | A2 | A, D | PD/RC 161·A2 | 04-cando-a1-a2 (A2.2 #14) · PD/RC 161·A2 |
| u12·3 | `cd.a2.leben-erzaehlen` | Sprechen (zus.) | A2+ | A, D | GER-M·A2+ | 04-cando-a1-a2 (A2.2 #14) · GER-M·A2+ |

## 8. What lane ga2 needs

### 8.1 The ga2 additions (28 first-draft ids + 2 twins)

„Suggested for“ = the W2 draft unit the id was written for; „placed“ = the blueprint row that carries it now (§3).

| id | halfLevel | Suggested for → placed | Teil | Mode | Source tag(s) | Why the lane needs it |
|---|---|---|---|---|---|---|
| `cd.a2.nachfragen-ausfuehrlich-antworten` ² | a2.1 | W2 u01 → core `a2.1-u01` | Sp1 | Interaktion mdl. | US-A2 Sp1 | Sp1 tests question and answer from word cards; draft line 1 covers the exchange, not the card step |
| `cd.a2.mail-an-vermieterin` | a2.1 | W2 u02 → core `a2.1-u02` | S2 | Schreiben | US-A2 S2 | the unit's writing Aufgabe (S2) proves no draft can-do |
| `cd.a2.nachricht-handyproblem` | a2.1 | W2 u03 → core `a2.1-u09` | S1 | Schreiben | US-A2 S1 | the unit's S1 message proves no draft can-do |
| `cd.a2.radiointerview-alltag` | a2.1 | W2 u03 → core `a2.1-u09` | H4 | Hören | US-A2 H4; GER-R·A2 | first H4 (radio interview, Ja/Nein) of the band |
| `cd.a2.wegweiser-nutzen` | a2.1 | W2 u04 → core `a2.1-u04` | L2 | Lesen | US-A2 L2; GER-R·A2 | L2 (directory/information board, „andere …“ option) had no draft line |
| `cd.a2.kurze-gespraeche-verstehen` | a2.1 | W2 u04 → core `a2.1-u05` | H3 | Hören | US-A2 H3; GER-R·A2 | H3 (five short everyday dialogues, heard once) had no draft line |
| `cd.a2.mail-an-restaurant` | a2.1 | W2 u05 → core `a2.1-u05` | S2 | Schreiben | US-A2 S2 | the unit's S2 e-mail proves no draft can-do (all draft lines are spoken) |
| `cd.a2.ueber-essengehen-erzaehlen` | a2.1 | W2 u05 → More `a2.1-u05` | Sp2 | Sprechen (zus.) | US-A2 Sp2 | an optional Sp2 card; the blueprint row trains Sp1, not Sp2 |
| `cd.a2.ankunft-mitteilen` | a2.1 | W2 u06 → core `a2.1-u06` | S1 | Schreiben | US-A2 S1 | the unit's S1 message proves no draft can-do |
| `cd.a2.gespraech-wochentage-folgen` | a2.1 | W2 u07 → core `a2.1-u12` | H2 | Hören | US-A2 H2; GER-R·A2 | H2 (one long conversation → day/picture matching) |
| `cd.a2.vorschlag-ablehnen-schriftlich` | a2.1 | W2 u07 → More `a2.1-u03`, `a2.1-u12` | S1 | Schreiben | US-A2 S1 | an S1 message for the draft Verein unit, which has no row |
| `cd.a2.termin-absagen-mail` ¹ | a2.1 | W2 u08 → core `a2.1-u07` | S2 | Schreiben | US-A2 S2 | fixed by SCHEMA §15.1 (the fixture's S2 Aufgabe) |
| `cd.a2.mail-an-chefin-krank` | a2.1 | W2 u09 → core `a2.1-u08` | S2 | Schreiben | US-A2 S2 | the unit's e-mail proves no draft can-do |
| `cd.a2.ratgeber-verstehen` | a2.1 | W2 u09 → core `a2.1-u08` | L1 | Lesen | US-A2 L1; GER-R·A2 | L1 at article length (the draft L1 line is a short numeric report only) |
| `cd.a2.persoenliche-mail-verstehen` | a2.1 | W2 u10 → core `a2.1-u10` | L3 | Lesen | US-A2 L3 | L3 (personal e-mail); a2.1 wording limited to short, simple, concrete (§4.3) |
| `cd.a2.brief-gefuehle-hilfe` | a2.1 | W2 u10 → core `a2.1-u11` | S1 | Schreiben | US-A2 S1; GER-R·A2 | the unit's writing (a letter to a friend) proves no draft can-do |
| `cd.a2.mail-an-sprachschule` | a2.2 | W2 u01 → More `a2.2-u01` | S2 | Schreiben | US-A2 S2 | optional; the row's Teile are Sp1, L1, H3 |
| `cd.a2.zeitungsartikel-verstehen` | a2.2 | W2 u01 → core `a2.2-u01` | L1 | Lesen | US-A2 L1 | L1 at full official length in A2.2 (§4.3) |
| `cd.a2.wochenendwunsch-nachricht` | a2.2 | W2 u02 → core `a2.2-u02` | S1 | Schreiben | US-A2 S1 | the S1 message; Konjunktiv II *würde gern* |
| `cd.a2.laengere-mail-verstehen` | a2.2 | W2 u02 → core `a2.2-u09` | L3 | Lesen | US-A2 L3 | L3 at full official length in A2.2 |
| `cd.a2.mail-an-hotel` | a2.2 | W2 u03 → core `a2.2-u03` | S2 | Schreiben | US-A2 S2 | the row's bold S2 |
| `cd.a2.ueber-reisen-erzaehlen` | a2.2 | W2 u03 → core `a2.2-u03` | Sp2 | Sprechen (zus.) | US-A2 Sp2 | the unit's Sp2 task card proves no draft can-do |
| `cd.a2.angebote-zuordnen` | a2.2 | W2 u05 → core `a2.2-u02` | L4 | Lesen | US-A2 L4; GER-R·A2 | L4 with the no-match option (X); the row's L4 (Ausflugsangebote); `online` now false (§6) |
| `cd.a2.mail-an-hausverwaltung` | a2.2 | W2 u06 → core `a2.2-u07` | S2 | Schreiben | US-A2 S2 | the row's bold S2 |
| `cd.a2.reparaturtermin-abstimmen` | a2.2 | W2 u06 → core `a2.2-u07` | Sp3 | Interaktion mdl. | US-A2 Sp3 | Sp3 (two diaries) |
| `cd.a2.wochenbericht-folgen` | a2.2 | W2 u09 → core `a2.2-u12` | H2 | Hören | US-A2 H2; GER-R·A2 | the row's bold H2 |
| `cd.a2.mail-auf-stellenanzeige` | a2.2 | W2 u10 → core `a2.2-u10` | S2 | Schreiben | US-A2 S2 | the unit's S2 e-mail proves no draft can-do |
| `cd.a2.interview-beruf-verstehen` | a2.2 | W2 u10 → core `a2.2-u09` | H4 | Hören | US-A2 H4; GER-R·A2 | H4 at full length in A2.2 |
| `cd.a2.infotafel-amt-nutzen` (new) | a2.2 | → core `a2.2-u11` | L2 | Lesen | US-A2 L2 | A2.2 L2 Lernziel of its own (review minor, §4.2) |
| `cd.a2.gespraeche-einmal-hoeren` (new) | a2.2 | → core `a2.2-u06` | H3 | Hören | US-A2 H3 | A2.2 H3 Lernziel of its own (review minor, §4.2) |

### 8.2 ga2 Teil → core can-dos that train it (by blueprint row)

| ga2 Teil | Template | A2.1 | A2.2 |
|---|---|---|---|
| L1 | `ga2.l1` | `kurzmeldung-mit-zahlen` (U9) · `ratgeber-verstehen` (U8) | `zeitungsartikel-verstehen` (U1) |
| L2 | `ga2.l2` | `wegweiser-nutzen` (U4) · `alltagstexte-durchsuchen` (U4) | `infotafel-amt-nutzen` (U11) |
| L3 | `ga2.l3` | `persoenliche-mail-verstehen` (U10) | `laengere-mail-verstehen` (U9) |
| L4 | `ga2.l4` | `wohnungsanzeigen-verstehen` (U2) | `angebote-zuordnen` (U2) · `stellenanzeigen-verstehen` (U10) |
| H1 | `ga2.h1` | `durchsage-anschluss-verstehen` (U6) · `mailbox-verstehen` (U7) | `radiomeldungen-verstehen` (U8) · `notruf-anweisungen-folgen` (U4) |
| H2 | `ga2.h2` | `gespraech-wochentage-folgen` (U12) | `wochenbericht-folgen` (U12) |
| H3 | `ga2.h3` | `kurze-gespraeche-verstehen` (U5) | `gespraeche-einmal-hoeren` (U6) |
| H4 | `ga2.h4` | `radiointerview-alltag` (U9) | `interview-beruf-verstehen` (U9) |
| S1 | `ga2.s1` | `saetze-verbinden-weil` (U1) · `zur-feier-einladen` (U3) · `einladung-schriftlich-beantworten` (U3) · `ankunft-mitteilen` (U6) · `nachricht-handyproblem` (U9) · `brief-gefuehle-hilfe` (U11) | `wochenendwunsch-nachricht` (U2) · `wegbeschreibung-schreiben` (U4) |
| S2 | `ga2.s2` | `mail-an-vermieterin` (U2) · `mail-an-restaurant` (U5) · `termin-absagen-mail` (U7) · `mail-an-chefin-krank` (U8) | `mail-an-hotel` (U3) · `vertrag-kuendigen` (U5) · `aenderungen-melden` (U6) · `mail-an-hausverwaltung` (U7) · `mail-auf-stellenanzeige` (U10) |
| Sp1 | `ga2.sp1` | `ueber-mich-austauschen` (U1) · `nachfragen-ausfuehrlich-antworten` (U1) · `arbeit-erzaehlen` (U7) | `meine-sprachen` (U1) · `bewerbungsgespraech-motivation` (U10) |
| Sp2 | `ga2.sp2` | `gesundheitstipps-geben` (U8) · `gefallen-begruenden` (U9) · `ausbildung-beschreiben` (U10) · `reise-erzaehlen` (U12) | `ueber-reisen-erzaehlen` (U3) · `dinge-beschreiben-vergleichen` (U5) · `schulen-und-abschluesse` (U9) · `leben-erzaehlen` (U12) |
| Sp3 | `ga2.sp3` | `moebel-platzieren` (U2) · `geschenke-besprechen` (U3) · `zum-fest-absprechen` (U3) · `aktivitaet-vorschlagen` (U12) | `ausflug-mitplanen` (U2) · `einigung-vorschlagen` (U2) · `reparaturtermin-abstimmen` (U7) |

(Ids without the `cd.a2.` prefix for width.) Every Teil of the Goethe-Zertifikat A2 now has a **core** can-do in **both**
halves — the A2.2 gap for L2 and H3 of the first draft is closed. The can-do layer is not the coverage gate: COV-1…COV-5
count LS4 blocks and Aufgaben against the Teil templates of `lanes/ga2.json`, not can-dos.

### 8.3 Reserve ids

| id | Mode | HF | Source | Now |
|---|---|---|---|---|
| `cd.a2.aenderungen-melden` | Schreiben | 5, 8 | RC 111·A2; RC 134·A2 | **core `a2.2-u06`** (Mein Geld: the productive-written line) |
| `cd.a2.notruf-anweisungen-folgen` | Hören | 8 | RC 132·A2 | **core `a2.2-u04`** (Zwischenfälle) |
| `cd.a2.aushang-hilfe-anbieten` | Schreiben | 3 | RC 98·A2 | More `a2.2-u10` |
| `cd.a2.neue-adresse-mitteilen` | Schreiben | 12 | RC 156·A2 | More `a2.2-u07`, `a2.2-u11` |
| `cd.a2.elternabend-verstehen` | Hören | 6 | RC 118·A2 | unplaced — HF 6 has no A2.2 Fokus in BLUEPRINT §2.8 |
| `cd.a2.entschuldigung-fuer-kind` | Schreiben | 6 | RC 119·A2 | unplaced, as above |
| `cd.a2.nach-dem-kind-fragen` | Interaktion mdl. | 6 | RC 119·A2 | unplaced, as above |

## 9. Gate notes for the curriculum agents

1. **ALL-06.** Met on core ids in both halves (§1 item 5). A2.2 depends on `gruppenchat-absprechen` staying core in
   `a2.2-u02`; a swap there needs another `online ∧ interaction-*` id as core elsewhere in A2.2, and the registry has none —
   ask the registry owner first.
2. **ALL-02.** Every core set has ≥ 1 `productive-*`/`interaction-*` id, which is what the validator counts. The question
   the first draft left open (A2.2 E7, spoken interaction only) is gone: that draft unit is now split over `a2.2-u06` and
   `a2.2-u11`, and `a2.2-u06` has the written `aenderungen-melden`.
3. **Unit sizes.** Core counts per unit: A2.1 5·5·5·5·5·5·4·5·5·3·5·4, A2.2 5·5·5·4·3·5·5·3·5·5·4·5. Rows at 5 cannot take
   a More id as core without dropping one.
4. **The fixture.** `a2.1-u07` = SCHEMA §15.1: `mailbox-verstehen`, `rueckruf-weitergeben`, `arbeit-erzaehlen`,
   `termin-absagen-mail`. Do not add to it.
5. **Unplaced ids.** Only the three HF 6 reserve ids (§8.3). If a checker flags registry ids no unit uses, those three are
   the expected finding, plus any More-only id a unit spec does not reference.

## 10. W2 draft units vs BLUEPRINT §2.8 rows (crosswalk)

Secondary lookup, from the draft side. „#n“ = draft line; ga2 additions follow their id (§8.1).

| W2 draft unit (A2.1) | → blueprint row(s) | | W2 draft unit (A2.2) | → blueprint row(s) |
|---|---|---|---|---|
| u01 Smalltalk bei der Arbeit | `a2.1-u01` | | u01 Sprachbiografie | `a2.2-u01` |
| u02 Wohnung finden und einrichten | `a2.1-u02` (#3 More) | | u02 Wünsche, Träume, Sorgen (**no row**) | #1 → `a2.2-u12`, #2 More, #3 → `a2.2-u08` |
| u03 Immer online? | `a2.1-u09` | | u03 Im Hotel | `a2.2-u03`; #3 → `a2.2-u01` |
| u04 Einkaufen | `a2.1-u04` | | u04 Ausflug: Wege und Zwischenfälle | #1, #2, #4 → `a2.2-u04`; #3 → `a2.2-u02` |
| u05 Essen gehen | `a2.1-u05` (#3 More) | | u05 Tarife und Verträge | `a2.2-u05` |
| u06 Mit der Bahn | `a2.1-u06` | | u06 Probleme in der Wohnung | `a2.2-u07` |
| u07 Im Verein (**no row**) | #1 → `a2.1-u12`, #2 More, #3 → `a2.1-u04` | | u07 Post von Amt, Bank, Versicherung | #1, #2, #5 → `a2.2-u11`; #3, #4 → `a2.2-u06` |
| u08 Im Job: Telefon | `a2.1-u07` (fixture) | | u08 Wetter und Umwelt | #1, #2 → `a2.2-u08`; #3 → `a2.2-u02` |
| u09 Gesund bleiben | `a2.1-u08` | | u09 Schule, Ausbildung, Lebenslauf | `a2.2-u09` |
| u10 Gefühle zeigen | `a2.1-u11` | | u10 Bewerbung | `a2.2-u10` (#3 More) |
| u11 Schulzeit und Ausbildung | #1 → `a2.1-u12`; #2, #3 → `a2.1-u10` | | u11 Im Job: Abläufe (**no row**) | #1 → `a2.2-u10`; #2–#5 More in `a2.2-u10` |
| u12 Feste feiern, Geschenke | `a2.1-u03` | | u12 Lebensstationen | `a2.2-u12` |

## 11. Open issues

1. **One `online` rule for all four registries** (review major, adopted here, §6). Owners of `cando/a1.json`
   (`behoerde-internet`, `handy-menue`) and `cando/b1.json` (`meinung-forum`) still set `online: true` on non-interaction
   ids. **Request to the validator owner:** count ALL-06 as `online === true` **and** `mode` ∈ {`interaction-written`,
   `interaction-spoken`}, so a reading or writing id can never satisfy the quota even while the flags differ.
2. **Draft order vs blueprint order.** Resolved for the can-do layer (§3); the level curriculum agent still has to convert
   the drafts' texts, vocabulary sets and exam mappings onto the rows (BLUEPRINT §2.8). A situation swap needs a logged
   `deviation` that keeps each id core once.
3. **Source tags by extension (DaF reviewer to confirm).** Memo 04 quotes only part of the RC's A2 goals, and no primary PDF
   was re-read in this run (no network use). The new ids therefore cite memo-04-verified A2 tags whose function is the
   nearest match, not a goal written for the exact situation: `bankgeschaefte-erledigen` (RC 77·A2 „Wünsche klar
   formulieren“, RC 112·A2), `aerger-ausdruecken` (RC 48·A2, area C, not B), `moebel-platzieren` and
   `geschenke-besprechen` (GI-A2F 16), `elternbrief-verstehen` (RC 118·A2 is the Elternabend, RC 117·A1 the return slip —
   an HF 6 A2 reading goal should exist among the 30 HF 6 A2 goals memo 04 counts, but none was quoted). A reviewer with the
   RC PDF can replace these with the exact page. The ga2 ids cite the Übungssatz Teil descriptions (US-A2) because the
   Goethe A2 adult Prüfungsziele (Hueber) were not available to memo 04.
4. **`band` semantics.** This file keeps the source level (A2, four A2+ ids). The review asks B2 to adopt the A1/B1
   reading (level of the expected performance); if that becomes the one rule, A2.2 core ids may move to A2+ (memo 04 treats
   A2.2 as „A2+, starke Waystage“). Decide once for all four registries.
5. **Wording not yet run through LNG-01/02** (no Hunspell or LanguageTool here). Compounds to watch: *Einstufungstest*,
   *Gepäckaufbewahrung*, *Buchungsbestätigung*, *Ersatzverkehr*, *Kontaktformular*, *Dauerauftrag*, *Informationstafel*,
   *Leitstelle*, *Ratgeber-Artikel*.
6. **Lernziel length.** Items run 12–34 words; the longest are the reworded step ids (`online-bestellung-klaeren`,
   `einladung-schriftlich-beantworten`). No gate limits can-do length; if the Start screen's Lernziele box needs a cap, a
   shorter `de` is a meaning-preserving edit and keeps the id.
7. **Checks run.** `node scripts/course-v2/check.mjs content/course-v2/registries/cando/a2.json` → 0 errors (SCH-01).
   `JSON.parse` OK. `scripts/course-v2/validate.mjs` runs on unit specs, which do not exist yet for A2; a scratch script
   checked the §1/§3 rules listed under §2 and the 4-word maximum of §6.
