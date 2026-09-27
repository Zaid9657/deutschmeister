# Can-do registry B1 — notes for the level curriculum agents

**Date:** 2026-09-27 · **Owner (sole writer):** cando-b1 · **Registry:**
[`content/course-v2/registries/cando/b1.json`](../../../content/course-v2/registries/cando/b1.json) (SCHEMA §4.1,
`course-v2/cando@1`) · **Status:** W2 draft, revised after the W2 DaF review ([`reviews/w2/daf-cando.json`](../reviews/w2/daf-cando.json),
2026-09-27; changes in §12), before the registry freeze (BLUEPRINT §10.3) ·
**Covers:** B1.1 and B1.2 · **Exam lane:** tb1 only (telc Deutsch B1; lean execution 2026-09-27 — no DTZ or
Goethe/ÖSD B1 lane can-dos were created, see §3) · **Inputs:** [`curriculum/b1-1.json`](../curriculum/b1-1.json) +
[`b1-2.json`](../curriculum/b1-2.json) (every can-do line), [BLUEPRINT](../BLUEPRINT.md) §2.2 rule 4, §2.8 (B1 rows),
§3.2, §3.9, §9.1 (ALL-02, ALL-04, ALL-06), §10.3; SCHEMA §2, §4.1, §8; research
[05](../research/05-cando-b1-b2.md) (inventory, ZM ladder, spiral threads), [14](../research/14-lehrwerke-curricula.md)
§B1–B3, §C (B1.1/B1.2 placements), [02](../research/02-exams-b1.md) §2, §6, §7 (telc B1 Teile);
`registries/lanes/tb1.json` (Teil ids); the sibling notes `cando-a1.md` and `cando-a2.md` (conventions).

**Size:** 96 can-dos — 47 with halfLevel b1.1, 49 with b1.2. All 88 can-do lines of the two
W2 plans map to an id (§6); they collapse into 76 ids through 12 merges (§5). 11 ids were added
for lane tb1, 8 for blueprint rows whose Kern-Kann-Beschreibung no draft line carries, and 1 for the
blueprint's HF 6 Fokus card on B1.2 U8 (§4).

## 1. How to use this

1. **Unit ids are the BLUEPRINT §2.8 rows, not the W2 draft numbers.** BLUEPRINT §10.3 has the curriculum agent convert
   the W2 draft onto the §2.8 rows, and the B1 drafts say so themselves („the unit rows are still to be reconciled with
   its §2.8“, `b1-1.md` header). The B1 drafts differ from the rows more than A1's did: seven rows per half have a
   draft unit with the same situation (renumbered); the other five are assembled from lines of several draft units. The last column of §2 names the draft lines each row draws on;
   §7 is the full crosswalk. (`cando-a1.md` keys on rows the same way; `cando-a2.md` keys on draft units and gives a
   crosswalk — both work, the row key saves the B1 curriculum agents a second translation.)
2. **Core** = the 3–5 can-dos the unit lists in its Lernziele box (`spec.canDos` = `lernziele`) and proves in
   „Das kann ich“ (ALL-02). Every core set has ≥ 1 productive or interaction can-do. **Each id is core in exactly one
   unit**, so a learner never „gains“ the same can-do twice. **More** = spiral reuse, a preview, a Fokus-Karte or an
   optional task; reference those ids in Aufgaben, lane blocks and review, not in the Lernziele box.
3. A curriculum agent may swap a core id for one from the same row's *more* column or from the registry with a logged
   `deviation`; it may **not** invent an id (REF-01). New wording or a new can-do goes through the registry owner, and a
   meaning change takes a new id (ID-01).
4. **No B1.1 unit references a B1.2 id** (checked). B1.2 units reuse B1.1 ids only in *more*.
5. **The planning round** (BLUEPRINT §3.2: ≥ 3 min in every B1 Sprechen session) trains `cd.b1.gemeinsam-planen` and
   `cd.b1.aufgaben-verteilen` (core B1.1 U2) and, in B1.2, `cd.b1.projekt-planen-einwaende` (core B1.2 U4). In every
   other unit the round references them as spiral; it does not make them Lernziele again.
6. **Quotas (ALL-06), on core ids.** Online interaction — B1.1: `cd.b1.online-austausch`; B1.2: `cd.b1.forum-stellung-nehmen`, `cd.b1.online-konversation`. Mediation —
   B1.1: `cd.b1.durchsage-weitergeben`; B1.2: `cd.b1.zwischen-positionen-vermitteln`, `cd.b1.meinungen-wiedergeben-vergleichen`, `cd.b1.infotext-zusammenfassen`, `cd.b1.besprechung-ergebnisse-weitergeben`, `cd.b1.nachricht-notieren`
   (counted by the `mediation` flag, §9). Keep at least one of each as core when swapping. Work units (HF 2 or 3), as
   the BLUEPRINT ALL-06 recount lists them: B1.1 U3, U7, U8 · B1.2 U3, U4, U12 (open issue 2).

## 2. Unit → can-do ids (BLUEPRINT §2.8 rows — use this table)

*Prüfungsteile* = the row's tB1 Teile (bold = full length in Prüfungsmodus, .2 only). *More* ids are written without
the `cd.b1.` prefix for width. *W2 lines* = draft unit and line number(s) whose ids the row carries (§6).

### B1.1 — „Im Alltag mitreden“

| Unit | Titel | Prüfungsteile (tB1) | Core (Lernziele, 3–5) | More (spiral · Vorschau · Fokus · optional) | W2 lines |
|---|---|---|---|---|---|
| `b1.1-u01` | Was gibt's Neues? | SA, M1, LV2, HV2 | `cd.b1.neuigkeiten-austauschen` · `cd.b1.persoenliche-mail` · `cd.b1.kennenlernen-gespraech` · `cd.b1.online-austausch` | `mail-vier-leitpunkte` · `gespraech-details` · `artikel-details` · `blog-im-detail` | b1.1-u01 |
| `b1.1-u02` | Wir organisieren ein Fest | M3, HV2 | `cd.b1.gemeinsam-planen` · `cd.b1.aufgaben-verteilen` · `cd.b1.enttaeuschung` · `cd.b1.rede-publikum` | `persoenliche-mail` · `gespraech-details` · `film-buch-wiedergeben` | b1.1-u06 (#3, #4) + b1.1-u11 (#2, #3) |
| `b1.1-u03` | Wenn die Bahn nicht fährt (Weg zur Arbeit · HF 10, 2) | HV3, LV3 | `cd.b1.durchsagen-stoerung` · `cd.b1.stoerung-umbuchen` · `cd.b1.durchsage-weitergeben` | `beschwerde-schriftlich` · `anzeigen-gezielt` | b1.1-u12 |
| `b1.1-u04` | Ärger mit der Wohnung | LV3, SA, SB1 | `cd.b1.vermieter-details-erfragen` · `cd.b1.mietvertrag-verstehen` · `cd.b1.mangel-melden` · `cd.b1.mail-vier-leitpunkte` | `anzeigen-gezielt` · `brief-formen-erkennen` · `gemeinsam-planen` | b1.1-u03 |
| `b1.1-u05` | Das Gerät ist kaputt | SB1, SA, M3 | `cd.b1.reklamieren` · `cd.b1.agb-verstehen` · `cd.b1.beschwerde-schriftlich` · `cd.b1.brief-formen-erkennen` | `mail-vier-leitpunkte` · `gemeinsam-planen` · `meinungen-austauschen` | b1.1-u04 (+ b1.1-u12 #4) |
| `b1.1-u06` | Alles digital? | HV1, LV1, M2 | `cd.b1.plaene-vermutungen` · `cd.b1.radio-kurzbeitraege` · `cd.b1.kommentare-haltung` · `cd.b1.meinung-forum` | `medienerfahrungen` · `kurzmeldungen-thema` · `meinungen-austauschen` | b1.1-u05 + b1.1-u10 (#2, #3) |
| `b1.1-u07` | Unter Kollegen | M3, HV3, SB2 | `cd.b1.absprachen-kollegen` · `cd.b1.krankmeldung-uebergabe` · `cd.b1.formelle-kurznachricht` · `cd.b1.wortwahl-brief` | `gemeinsam-planen` · `aufgaben-verteilen` · `durchsagen-stoerung` | b1.1-u02 |
| `b1.1-u08` | Weiterbildung im Betrieb (Beratung mit der Personalabteilung · HF 2, 4) | LV3, M1, LV2 | `cd.b1.beratung-gespraech` · `cd.b1.anzeigen-gezielt` · `cd.b1.artikel-details` · `cd.b1.kursanfrage-schreiben` | `kennenlernen-gespraech` · `gespraech-details` · `lernziele-beschreiben` · `mail-vier-leitpunkte` | b1.1-u08 (#3, #4) + b1.1-u03 #4 (LV3) |
| `b1.1-u09` | Beim Arzt und in der Apotheke | LV2, M2, SB2 | `cd.b1.beim-arzt-erklaeren` · `cd.b1.beipackzettel` · `cd.b1.rat-geben` | `meinungen-austauschen` · `wortwahl-brief` · `artikel-details` · `formelle-kurznachricht` · `kurz-praesentieren` | b1.1-u07 (#1, #2) |
| `b1.1-u10` | Glück gehabt! | HV2, SA | `cd.b1.erfahrungen-erzaehlen` · `cd.b1.film-buch-wiedergeben` · `cd.b1.gespraech-details` · `cd.b1.blog-im-detail` | `persoenliche-mail` · `mail-vier-leitpunkte` | b1.1-u09 (#2, #3) + b1.1-u06 (#1, #2) + b1.1-u08 #3 |
| `b1.1-u11` | Menschen, die mir wichtig sind | LV1, SB2, M1 | `cd.b1.person-portraetieren` · `cd.b1.familiengeschichte` · `cd.b1.beileid` · `cd.b1.kurzmeldungen-thema` | `kennenlernen-gespraech` · `wortwahl-brief` · `enttaeuschung` · `aufgaben-verteilen` · `persoenliche-mail` | b1.1-u11 (#1) + b1.1-u09 (#1) |
| `b1.1-u12` | Meine Ziele mit Deutsch | HV1, LV1, M2 → Halbtest | `cd.b1.lernziele-beschreiben` · `cd.b1.gefuehle-lernen` · `cd.b1.kurz-praesentieren` · `cd.b1.meinungen-austauschen` | `radio-kurzbeitraege` · `kurzmeldungen-thema` · `plaene-vermutungen` · `kennenlernen-gespraech` | b1.1-u08 (#1, #2) + b1.1-u07 #3 + b1.1-u10 #1 |

### B1.2 — „Selbstständig handeln und Stellung nehmen“

| Unit | Titel | Prüfungsteile (tB1) | Core (Lernziele, 3–5) | More (spiral · Vorschau · Fokus · optional) | W2 lines |
|---|---|---|---|---|---|
| `b1.2-u01` | Missverständnisse | **M2**, LV1 | `cd.b1.missverstaendnis-klaeren` · `cd.b1.interkulturelle-erfahrungen` · `cd.b1.forum-stellung-nehmen` · `cd.b1.online-konversation` | `meinungen-wiedergeben-vergleichen` · `pressemeldungen-ueberschriften` · `meinungsbeitraege-einmal` · `entschuldigen-erklaeren` | b1.2-u01 (#1–#3) |
| `b1.2-u02` | Weiterbildung | **LV3**, M1 | `cd.b1.angebot-fuer-andere` · `cd.b1.thema-praesentieren` · `cd.b1.grafik-organiser` | `ueber-mich-ausfuehrlich` · `kursanfrage-schreiben` · `beratung-gespraech` · `praesentation-rueckmeldung` | b1.2-u06 (#3, #4) + b1.2-u02 #2 |
| `b1.2-u03` | Die Bewerbung | **SA**, HV3 | `cd.b1.stelle-telefonisch-erfragen` · `cd.b1.bewerbung-schreiben` · `cd.b1.vorstellungsgespraech-erfahrung` · `cd.b1.gehalt-verhandeln` | `ansagen-handeln` · `mail-zusammenhaengend` · `ueber-mich-ausfuehrlich` · `brief-formen-erkennen` | b1.2-u03 |
| `b1.2-u04` | Konflikt im Team | **M3**, HV2 | `cd.b1.standpunkt-einbringen` · `cd.b1.kompromiss-vorschlagen` · `cd.b1.entschuldigen-erklaeren` · `cd.b1.projekt-planen-einwaende` | `interview-details` · `nachricht-notieren` · `formelle-kurznachricht` · `aufgaben-verteilen` | b1.2-u04 (#1, #3) + b1.2-u05 |
| `b1.2-u05` | Werbung, Konsum, Geld | **LV2**, LV1 | `cd.b1.artikel-argumente` · `cd.b1.pressemeldungen-ueberschriften` · `cd.b1.werbung-kritisch` · `cd.b1.kaufentscheidung-begruenden` | `angebot-fuer-andere` · `infotext-zusammenfassen` · `reklamieren` | b1.2-u02 #3 + b1.2-u01 #4 |
| `b1.2-u06` | Einspruch! | **SB1**, SA | `cd.b1.einspruch-schriftlich` · `cd.b1.schaden-melden` · `cd.b1.problem-erklaeren-loesung` · `cd.b1.versicherung-gespraech` | `symptome-genau` (Fokus-Karte Gesundheit — the Konsultation thread's B1.2 step, §10) · `unfall-schildern` · `brief-formen-erkennen` · `formelle-wendungen` · `ansagen-handeln` | b1.2-u08 + b1.2-u07 |
| `b1.2-u07` | Mitreden | **HV1**, M2 | `cd.b1.zwischen-positionen-vermitteln` · `cd.b1.meinungen-wiedergeben-vergleichen` · `cd.b1.position-werte` · `cd.b1.meinungsbeitraege-einmal` | `projekt-planen-einwaende` · `interview-details` · `debatte-wer-meint-was` · `formelle-kurznachricht` | b1.2-u11 (#1–#3) + b1.2-u10 #4 |
| `b1.2-u08` | Regeln und Anleitungen | **SB2**, HV3 | `cd.b1.ablaeufe-erklaeren` · `cd.b1.regeln-detail` · `cd.b1.formelle-wendungen` · `cd.b1.ansagen-handeln` | `betreuungsvertrag-verstehen` (Fokus-DaZ „Betreuungsvertrag und Kita-Ordnung“, HF 6) · `wortwahl-brief` · `mietvertrag-verstehen` · `thema-praesentieren` · `grafik-organiser` | b1.2-u06 (#1, #2) |
| `b1.2-u09` | Stadt oder Land? | **HV3**, LV2 | `cd.b1.fuehrung-verstehen` · `cd.b1.vor-nachteile-abwaegen` · `cd.b1.praesentation-rueckmeldung` | `artikel-argumente` · `ansagen-handeln` · `forum-stellung-nehmen` · `thema-praesentieren` · `pressemeldungen-ueberschriften` | b1.2-u09 |
| `b1.2-u10` | Geschichten von früher | **HV2**, M1 | `cd.b1.ueber-frueher-berichten` · `cd.b1.foto-beschreiben-vergleichen` · `cd.b1.interview-details` · `cd.b1.ueber-mich-ausfuehrlich` | `blog-im-detail` · `erfahrungen-erzaehlen` · `frueher-heute-vergleichen` | b1.2-u12 (#1, #4) + b1.2-u11 #4 + neu |
| `b1.2-u11` | Klima und Zukunft | **LV1**, SA | `cd.b1.artikel-zusammenfassen-stellung` · `cd.b1.debatte-wer-meint-was` · `cd.b1.kommentare-einschraenkungen` · `cd.b1.frueher-heute-vergleichen` | `meinungen-wiedergeben-vergleichen` · `forum-stellung-nehmen` · `plaene-vermutungen` · `persoenliche-mail` · `meinungsbeitraege-einmal` | b1.2-u10 (#1–#3) + b1.2-u12 #2 |
| `b1.2-u12` | Zurückblicken, weitergeben | **M1**, **SA**, SB2 | `cd.b1.infotext-zusammenfassen` · `cd.b1.besprechung-ergebnisse-weitergeben` · `cd.b1.nachricht-notieren` · `cd.b1.mail-zusammenhaengend` | `ueber-mich-ausfuehrlich` · `wortwahl-brief` · `meinungen-wiedergeben-vergleichen` · `projekt-planen-einwaende` · `plaene-vermutungen` · `lernziele-beschreiben` | b1.2-u04 (#2, #4) + b1.2-u02 #1 |

The Diagnose (B1.2, free) and the Prüfungswochen carry no Lernziele of their own; the Halbtest (after B1.1 U12) and
the Modelltests report per Teil (BLUEPRINT §5), so they need no can-do ids.

## 3. What lane tb1 needs: every Teil has a can-do in both halves

Teil templates as in `registries/lanes/tb1.json`. A can-do names the skill a Teil trains so the Lernziele box can say
it; the coverage rules (COV-1…COV-7) count **blocks**, not can-dos, so this table does not replace the lane coverage
check. In brackets: the unit where the id is core.

| Template | Teil (UT-B1) | B1.1 id | B1.2 id |
|---|---|---|---|
| `tb1.lv1` | LV1 Globalverstehen (5 Meldungen ↔ 10 Überschriften) | `kurzmeldungen-thema` (u11) | `pressemeldungen-ueberschriften` (u05) |
| `tb1.lv2` | LV2 Detailverstehen (Artikel, 5 × a/b/c) | `artikel-details` (u08) | `artikel-argumente` (u05) |
| `tb1.lv3` | LV3 Selektives Verstehen (10 Situationen ↔ 12 Anzeigen, x) | `anzeigen-gezielt` (u08) | `angebot-fuer-andere` (u02) |
| `tb1.sb1` | SB1 Grammatik (Brief, 10 × a/b/c) | `brief-formen-erkennen` (u05) | — (spiral of the B1.1 id) |
| `tb1.sb2` | SB2 Lexik (Brief, 10 Lücken, 15 Wörter) | `wortwahl-brief` (u07) | `formelle-wendungen` (u08) |
| `tb1.hv1` | HV1 Globalverstehen (5 Stellungnahmen, **1×**, r/f) | `radio-kurzbeitraege` (u06) | `meinungsbeitraege-einmal` (u07) |
| `tb1.hv2` | HV2 Detailverstehen (Interview, 10 × r/f, 2×) | `gespraech-details` (u10) | `interview-details` (u10) |
| `tb1.hv3` | HV3 Selektives Verstehen (5 Ansagen, 2×, r/f) | `durchsagen-stoerung` (u03) | `ansagen-handeln` (u08) |
| `tb1.sa` | SA E-Mail mit 4 Leitpunkten (30 Min.) | `persoenliche-mail` (u01), `mangel-melden` (u04), `mail-vier-leitpunkte` (u04), `beschwerde-schriftlich` (u05), `kursanfrage-schreiben` (u08) | `bewerbung-schreiben` (u03), `einspruch-schriftlich` (u06), `artikel-zusammenfassen-stellung` (u11), `mail-zusammenhaengend` (u12) |
| `tb1.m1` | M1 Einander kennenlernen | `kennenlernen-gespraech` (u01) | `ueber-mich-ausfuehrlich` (u10) |
| `tb1.m2` | M2 Über ein Thema sprechen | `meinungen-austauschen` (u12) | `meinungen-wiedergeben-vergleichen` (u07) |
| `tb1.m3` | M3 Gemeinsam etwas planen | `gemeinsam-planen` (u02), `aufgaben-verteilen` (u02) | `projekt-planen-einwaende` (u04) |

- **SA** has one format can-do per half (`mail-vier-leitpunkte` → `mail-zusammenhaengend`, the Kriterium-II step) and
  the task can-dos of the units that write an SA letter (Beschwerde, Mangel, Anfrage, Bewerbung, Einspruch, Stellungnahme).
- **SB1** in B1.2 is trained as spiral of `brief-formen-erkennen` (B1.2 U3, U6 *more*); a separate B1.2 id would only
  restate it. **SB2** steps up to `formelle-wendungen` (formal collocations, also productive in the U6 Einspruch letter).
- **HV1 vs Goethe H4:** `radio-kurzbeitraege` / `meinungsbeitraege-einmal` are the telc format (five statements, once,
  r/f); `debatte-wer-meint-was` is the „wer sagt was“ radio debate of the drafts (GI-B1 H4) and serves telc HV1 as a
  harder listening text.
- **Deferred lanes.** The drafts also map lines to Goethe/ÖSD B1 and DTZ Teile. Those lines are kept as course can-dos
  in format-neutral wording; their format tag stays in `source` (`GI-B1 …`, `DTZ S2`). When gb1 or dtz goes live, these
  ids already cover the Teile and no Spur can-do is needed: L1 `blog-im-detail` · L2 `artikel-argumente` · L3
  `anzeigen-gezielt`, `angebot-fuer-andere` · L4 `kommentare-haltung`, `kommentare-einschraenkungen` · L5 `mietvertrag-verstehen`,
  `regeln-detail` · H1 `durchsagen-stoerung`, `ansagen-handeln` · H2 `rede-publikum`, `fuehrung-verstehen` · H3
  `gespraech-details` · H4 `debatte-wer-meint-was` · Sch1 `persoenliche-mail` · Sch2 `meinung-forum`,
  `forum-stellung-nehmen` · Sch3 `formelle-kurznachricht` · Sp1 `gemeinsam-planen`, `projekt-planen-einwaende` · Sp2
  `kurz-praesentieren`, `thema-praesentieren`, `grafik-organiser` · Sp3 `praesentation-rueckmeldung` · DTZ S2
  `foto-beschreiben-vergleichen` · DTZ Schreiben `beschwerde-schriftlich`, `mangel-melden`, `einspruch-schriftlich`.

## 4. Ids added beyond the W2 plans, and why

| Id | Half | Origin | Reason |
|---|---|---|---|
| `cd.b1.durchsagen-stoerung` | b1.1 | neu (tb1) | **tb1 HV3** in B1.1 (short announcements, voicemail, weather; R/F, twice) and blueprint B1.1 U3 „Durchsagen verstehen“. Draft b1.1-u12 #1 (ZM B1, less routine transport situations) is the interaction side and went to `stoerung-umbuchen`. |
| `cd.b1.mail-vier-leitpunkte` | b1.1 | neu (tb1) | **tb1 SA** (format): four Leitpunkte, Betreff, Anrede, Einleitung, Schluss, one register — the telc criteria (Aufgabenbewältigung counts Leitpunkte; Kommunikative Gestaltung loses A on mixed register, unconnected Leitpunkte, mostly Ich/Wir starts). No draft line names the format. B1.1 twin of `cd.a1.nachricht-anrede` / the A2 e-mail ids. |
| `cd.b1.brief-formen-erkennen` | b1.1 | neu (tb1) | **tb1 SB1** (10 MC gaps in a personal letter: connectors, article/adjective endings, auxiliaries, relative pronouns, prepositions). No draft line; SB has no CEFR descriptor, so the source is the Teil only. |
| `cd.b1.wortwahl-brief` | b1.1 | neu (tb1) | **tb1 SB2** (10 gaps from 15 words in a formal letter: collocations). No draft line. |
| `cd.b1.beratung-gespraech` | b1.1 | neu (Blueprint-Zeile) | Blueprint B1.1 U8 „Weiterbildung im Betrieb“: „sich am Arbeitsplatz beraten lassen“, Beratungsgespräch mit der Personalabteilung (HF 2, 4); draft b1.1-u08 has a Beratungsgespräch as its speaking task but no can-do line for it. Source RC 105·B1 (HF 4 Beratung: Erfahrung und Weiterbildungsziele darlegen, nach Angeboten fragen, mit Rückfragen reagieren), page-checked 2026-09-27. |
| `cd.b1.artikel-details` | b1.1 | neu (tb1) | **tb1 LV2** in B1.1 (one press article, 5 MC, detail). The draft has a LV2 line only in B1.2 (b1.2-u02 #3 → `artikel-argumente`). |
| `cd.b1.kursanfrage-schreiben` | b1.1 | neu (tb1) | **tb1 SA** + blueprint B1.1 U8, which needs a productive-written can-do for its SA; draft b1.1-u08 writing task („Anfrage an die Volkshochschule, vier Leitpunkte“) had none. Addressee is the Personalabteilung or a Kursanbieter (work frame, HF 2, 4), so the same id serves B1.2 U2 as *more* (BLUEPRINT §3.9: e-mail to a language school). |
| `cd.b1.rat-geben` | b1.1 | neu (Blueprint-Zeile) | Blueprint B1.1 U9 „Rat geben“ (Konjunktiv II: Ratschlag). No draft line. Weak source tag (open issue 3). |
| `cd.b1.person-portraetieren` | b1.1 | neu (Blueprint-Zeile) | Blueprint B1.1 U11 „eine Person porträtieren; Menschen beschreiben“ (Vereinsblog). No draft line. |
| `cd.b1.kurzmeldungen-thema` | b1.1 | neu (tb1) | **tb1 LV1** in B1.1 (headline ↔ short news item, global reading). The draft has a LV1 line only in B1.2 (b1.2-u01 #4 → `pressemeldungen-ueberschriften`). |
| `cd.b1.missverstaendnis-klaeren` | b1.2 | neu (Blueprint-Zeile) | Blueprint B1.2 U1 „Missverständnisse klären“ (M13). The draft unit has the topic but no can-do for the clarifying move itself. Source RC 32·B1 (die eigene Sicht schildern und ein Missverständnis erklären), page-checked 2026-09-27. |
| `cd.b1.werbung-kritisch` | b1.2 | neu (Blueprint-Zeile) | Blueprint B1.2 U5 „Werbung kritisch lesen“. No draft line (draft b1.2-u02 is a consumer-article unit). Source = Lehrwerk placement only (open issue 3). |
| `cd.b1.kaufentscheidung-begruenden` | b1.2 | neu (Blueprint-Zeile) | Blueprint B1.2 U5 „Kaufentscheidungen begründen“. No draft line. Source RC 124·B1 (Preise vergleichen, Vor- und Nachteile einer Zahlungsart abwägen), page-checked 2026-09-27. |
| `cd.b1.meinungsbeitraege-einmal` | b1.2 | neu (tb1) | **tb1 HV1** at exam conditions (five short statements, **played once**, R/F) — blueprint B1.2 U7 **HV1** full length. B1.1 twin: `radio-kurzbeitraege`. |
| `cd.b1.formelle-wendungen` | b1.2 | neu (tb1) | **tb1 SB2** B1.2 step + the formal-letter collocations of draft b1.2-u08 (grammar line „Nomen-Verb-Verbindungen im formellen Brief“) and blueprint B1.2 U8 (**SB2** full length). Also serves the SA letters of U3/U6. |
| `cd.b1.ansagen-handeln` | b1.2 | neu (tb1) | **tb1 HV3** B1.2 step (voicemail and hotline messages from firms, offices, Hausverwaltung: deadlines, numbers, next steps) — blueprint B1.2 U8/U9 HV3; the listening texts of drafts b1.2-u07/u08 (Mailbox, Hotline) had no can-do. |
| `cd.b1.ueber-frueher-berichten` | b1.2 | neu (Blueprint-Zeile) | Blueprint B1.2 U10 „über früher berichten“ (Biografie, Heimat; M16–17). No draft unit carries this row. |
| `cd.b1.foto-beschreiben-vergleichen` | b1.2 | neu (Blueprint-Zeile) | Blueprint B1.2 U10 „ein Foto beschreiben und vergleichen“. The format source is DTZ Sprechen Teil 2 (photo + own experience + home country); DTZ is a deferred lane, so the can-do is written format-neutral and the tag is a format source, not a lane. |
| `cd.b1.betreuungsvertrag-verstehen` | b1.2 | neu (Blueprint-Fokus) | BLUEPRINT §2.8 B1.2 U8 Fokus column: Fokus-DaZ „Betreuungsvertrag und Kita-Ordnung“ (HF 6); ALL-04 is hard at B1 and HF 6 is in no B1 unit tag. Never core: *more* on B1.2 U8, proved in the Fokus card. Sources page-checked in the RC 2026-09-27 (open issue 4): RC 118·B1 is the HF 6 B1 goal (understand a description of how a procedure works), RC 116·A2 the situation (rules such as pick-up times, which are binding), GI-B1 L5 the reading operation (rules in detail, as `mietvertrag-verstehen` and `regeln-detail`). |
| `cd.b1.mail-zusammenhaengend` | b1.2 | neu (tb1) | **tb1 SA** at exam conditions (B1.2 step): connected Leitpunkte, varied sentence starts, register held — the Kriterium-II rules of UT-B1 pp. 36–38. |

## 5. Merges: one id where two draft lines mean the same

| Id | Draft lines it takes |
|---|---|
| `cd.b1.reklamieren` | b1.1-u04 #1 (RC 125) · #3 (ZM B1 „sich beschweren, auch nicht routinemäßig“) — the ZM feature is the performance level of the same complaint, so it became the „auch wenn der Fall nicht einfach ist“ clause |
| `cd.b1.film-buch-wiedergeben` | b1.1-u06 #1 (SB B1: Handlung wiedergeben + Reaktion) · #2 (ÖIF: Meinung über den Film) — the reaction *is* the opinion |
| `cd.b1.gemeinsam-planen` | b1.1-u02 #4 · b1.1-u06 #3 — both „etwas planen, Vorschläge machen, reagieren, sich einigen“ (GI-B1 Sp1 / tb1 M3) |
| `cd.b1.meinung-forum` | b1.1-u05 #4 (Einführung) · b1.1-u10 #3 (ca. 80 Wörter) — same forum-post can-do, two appearances |
| `cd.b1.stoerung-umbuchen` | b1.1-u12 #1 (ZM B1, weniger routinemäßige Situationen im Verkehr) · #2 (RC 142, am Schalter nach Verbindungen fragen) |
| `cd.b1.standpunkt-einbringen` | b1.2-u04 #1 (RC 86, Besprechung) · b1.2-u05 #3 (N7, Konfliktgespräch: Position ruhig vertreten) |
| `cd.b1.problem-erklaeren-loesung` | b1.2-u08 #2 (BSK 28.4/28.5, reklamieren + Lösung sagen) · #3 (ZM B1+, erklären, warum etwas ein Problem ist) — memo 05 B1.2 #5 pairs them as one situation |
| `cd.b1.projekt-planen-einwaende` | b1.2-u04 #3 (Projekt) · b1.2-u11 #3 (Aktion) — the same B1.2 planning step (Einwände, Aufgaben) |
| `cd.b1.blog-im-detail` | b1.1-u09 #3 (Ereignisse nicht in Reihenfolge) · b1.2-u12 #1 (Zeitformen und Konjunktiv wechseln) — one GI-B1 L1 operation; B1.2 reuses it as spiral |
| `cd.b1.plaene-vermutungen` | b1.1-u05 #3 · b1.2-u12 #3 — the identical SB B1 line („Meinungen und Pläne erklären und begründen“) appears in both drafts |
| `cd.b1.praesentation-rueckmeldung` | b1.1-u07 #4 · b1.2-u09 #3 — the Goethe Sp3 move (answer questions, give feedback); placed as a B1.2 Lernziel only (open issue 5) |
| `cd.b1.debatte-wer-meint-was` | b1.1-u08 #4 (Einführung, zweimal hören) · b1.2-u10 #2 — one GI-B1 H4 can-do; B1.1 practises it without a Lernziel (open issue 5) |

Kept **separate** on purpose (same field, different performance or band step):
`kennenlernen-gespraech` (B1.1, ask and tell) vs `ueber-mich-ausfuehrlich` (B1.2, detail and follow-up questions) ·
`neuigkeiten-austauschen` (the content: news both ways) vs `persoenliche-mail` (the text: describe, give reasons,
suggest) · `reklamieren` (spoken) vs `beschwerde-schriftlich` (written) vs `problem-erklaeren-loesung` (B1+ step) ·
`beim-arzt-erklaeren` (B1) vs `symptome-genau` (B1+) · `kurzmeldungen-thema` vs `pressemeldungen-ueberschriften` ·
`artikel-details` vs `artikel-argumente` · `anzeigen-gezielt` vs `angebot-fuer-andere` · `radio-kurzbeitraege` vs
`meinungsbeitraege-einmal` vs `debatte-wer-meint-was` · `durchsagen-stoerung` vs `ansagen-handeln` · `gespraech-details`
vs `interview-details` · `kommentare-haltung` vs `kommentare-einschraenkungen` · `meinung-forum` (post) vs
`forum-stellung-nehmen` (reply to another post, interaction) · `meinungen-austauschen` (ZM B1: exchange views) vs
`meinungen-wiedergeben-vergleichen` (relay a read opinion, mediation) vs `artikel-zusammenfassen-stellung` (ZM B1+) ·
`kurz-praesentieren` (template, ≈ 2 min) vs `thema-praesentieren` (free, ≈ 3 min) · `gemeinsam-planen` vs
`aufgaben-verteilen` vs `projekt-planen-einwaende` · `mail-vier-leitpunkte` vs `mail-zusammenhaengend` ·
`wortwahl-brief` vs `formelle-wendungen` · `mietvertrag-verstehen` (contract terms) vs `regeln-detail` (house and
workplace rules). Against A2: `cd.b1.mietvertrag-verstehen` asks for the rules in detail where `cd.a2.mietvertrag-verstehen`
finds three figures; `cd.b1.stoerung-umbuchen` is the less routine step of `cd.a2.zugreise-buchen`;
`cd.b1.aufgaben-verteilen` closes a plan where `cd.a2.aufgaben-verteilen` shares out chores.

## 6. W2 draft line → id (all 88 lines)

Draft unit ids here are the **W2 draft numbers** (`curriculum/b1-*.json`), not blueprint rows. The draft wording is
the source text with the person changed (internal mapping only, never for screen); the registry `de` is ours.

| Draft unit | # | Draft line (W2 wording, not for screen) | Draft source tag | Registry id |
|---|---|---|---|---|
| `b1.1-u01` Lange nicht gesehen! | 1 | Ich kann in einem Brief oder einer E-Mail Neuigkeiten mitteilen, nach Neuigkeiten fragen und von Ereignissen berichten und danach fragen. | 05-cando-b1-b2 (B1.1 #1) · RC 56 | `cd.b1.neuigkeiten-austauschen` |
|  | 2 | Ich kann mich online über Erfahrungen, Ereignisse, Eindrücke und Gefühle austauschen, sofern ich mich darauf vorbereiten kann. | 05-cando-b1-b2 (B1.1 #14) · SB B1, Online-Interaktion | `cd.b1.online-austausch` |
|  | 3 | Ich kann in einer persönlichen E-Mail (ca. 80 Wörter) etwas beschreiben, einen Grund nennen und einen Vorschlag machen. | 05-cando-b1-b2 (B1.1 #1) · ≈ GI-B1 Schreiben T1 | `cd.b1.persoenliche-mail` |
|  | 4 | Ich kann beim ersten Treffen mit einer neuen Person Fragen zu Herkunft, Arbeit, Sprachen und Plänen stellen und selbst ausführlich antworten. | 02-exams-b1 §2 · ≈ telc B1 Mündlicher Ausdruck T1 (Einander kennenlernen) | `cd.b1.kennenlernen-gespraech` |
| `b1.1-u02` Neu im Team | 1 | Ich kann mit Kolleginnen und Kollegen Absprachen treffen, z. B. über den Tausch einer Schicht oder über Urlaubszeiten. | 05-cando-b1-b2 (B1.1 #12) · ≈ RC 85 | `cd.b1.absprachen-kollegen` |
|  | 2 | Ich kann bei einer Krankmeldung mitteilen, welche Arbeiten ich nicht erledigen kann, und erklären, was zu tun ist. | 05-cando-b1-b2 (B1.1 #12) · RC 84 | `cd.b1.krankmeldung-uebergabe` |
|  | 3 | Ich kann mich in einer kurzen formellen Nachricht (ca. 40 Wörter) entschuldigen, einen Grund nennen und um etwas bitten. | 05-cando-b1-b2 (B1.1 #13) · ≈ GI-B1 Schreiben T3 | `cd.b1.formelle-kurznachricht` |
|  | 4 | Ich kann mit einer Kollegin oder einem Kollegen etwas planen, Vorschläge machen, darauf reagieren und mich einigen. | 05-cando-b1-b2 (B1.1 #3) · ≈ GI-B1 Sprechen T1 | `cd.b1.gemeinsam-planen` |
| `b1.1-u03` Die Wohnung, in die ich einziehe | 1 | Ich kann im Gespräch mit Vermietern Detailinformationen zur Wohnung und zum Vertrag erfragen, z. B. zu Einzugstermin, Nebenkosten und Kaution. | 05-cando-b1-b2 (B1.1 #9) · ≈ RC 155 | `cd.b1.vermieter-details-erfragen` |
|  | 2 | Ich kann die wichtigsten Regelungen eines Mietvertrags und einer Hausordnung im Detail verstehen, z. B. zu Nebenkosten, Kaution, Haustieren und Kündigung. | 02-exams-b1 §7 (G-L5/D-L4: Regeln und Bedingungen) · ≈ GI-B1 Lesen T5 | `cd.b1.mietvertrag-verstehen` |
|  | 3 | Ich kann mich schriftlich bei der Vermieterin melden, wenn nach der Übergabe ein Mangel auftaucht, und um eine Lösung bitten. | 05-cando-b1-b2 (B1.1 #9) · RC 156; ≈ telc B1 Schriftlicher Ausdruck | `cd.b1.mangel-melden` |
|  | 4 | Ich kann Anzeigen gezielt nach den Informationen durchsuchen, die ich brauche, und passende von unpassenden Angeboten unterscheiden. | 02-exams-b1 §7 (G-L3/t-LV3/D-L2) · ≈ GI-B1 Lesen T3 „Zur Orientierung lesen“ | `cd.b1.anzeigen-gezielt` |
| `b1.1-u04` Das ist nicht in Ordnung! | 1 | Ich kann mich mit einfachen Worten beschweren, z. B. über fehlerhafte Ware, und Umtausch oder Geldrückzahlung verlangen. | 05-cando-b1-b2 (B1.1 #8) · ≈ RC 125 | `cd.b1.reklamieren` |
|  | 2 | Ich kann bei Bestellungen die wichtigsten Punkte der Allgemeinen Geschäftsbedingungen verstehen. | 05-cando-b1-b2 (B1.1 #8) · RC 125 | `cd.b1.agb-verstehen` |
|  | 3 | Ich kann sprachliche Probleme des Alltags flexibel bewältigen und mich zum Beispiel beschweren, auch wenn die Situation nicht routinemäßig ist. | 05-cando-b1-b2 §2.2 · ZM B1 (Merkmal 2, in Ich-Form) | `cd.b1.reklamieren` |
| `b1.1-u05` Wie werden wir morgen leben? | 1 | Ich kann vielen Radio- oder Fernsehsendungen über aktuelle Ereignisse die Hauptinformation entnehmen, wenn relativ langsam und deutlich gesprochen wird. | 05-cando-b1-b2 (B1.1 #5) · SB B1 | `cd.b1.radio-kurzbeitraege` |
|  | 2 | Ich kann mich mit Bekannten oder Freunden über Medienerfahrungen austauschen, z. B. über Internetseiten, die ich häufig besuche. | 05-cando-b1-b2 (B1.1 #5) · RC 138 | `cd.b1.medienerfahrungen` |
|  | 3 | Ich kann kurz meine Meinungen und Pläne erklären und begründen. | 05-cando-b1-b2 (B1.2 #1) · SB B1 | `cd.b1.plaene-vermutungen` |
|  | 4 | Ich kann in einem kurzen Forumsbeitrag meine Meinung zu einem Alltagsthema äußern und begründen. | 05-cando-b1-b2 (B1.2 #1, hier als Einführung) · ≈ GI-B1 Schreiben T2 | `cd.b1.meinung-forum` |
| `b1.1-u06` Kino, Konzert oder Kabarett? | 1 | Ich kann eine Geschichte erzählen oder die Handlung eines Buches oder Films wiedergeben und meine Reaktionen beschreiben. | 05-cando-b1-b2 (B1.1 #4) · SB B1 | `cd.b1.film-buch-wiedergeben` |
|  | 2 | Ich kann nach einem Kinobesuch meine Meinung über den Film äußern. | 05-cando-b1-b2 (B1.1 #4) · ÖIF-B1 §3.1 | `cd.b1.film-buch-wiedergeben` |
|  | 3 | Ich kann mit einer Partnerin oder einem Partner etwas planen, Vorschläge machen, darauf reagieren und mich einigen. | 05-cando-b1-b2 (B1.1 #3) · ≈ GI-B1 Sprechen T1 | `cd.b1.gemeinsam-planen` |
|  | 4 | Ich kann einer kurzen Rede vor Publikum, z. B. bei der Eröffnung eines Festes, die wichtigsten Informationen entnehmen. | 02-exams-b1 §7 (G-H2) · ≈ GI-B1 Hören T2 „Als Zuhörer im Publikum verstehen“ | `cd.b1.rede-publikum` |
| `b1.1-u07` Was fehlt Ihnen genau? | 1 | Ich kann beim Arzt mit einfachen Worten erklären, was mir fehlt. | 05-cando-b1-b2 (B1.1 #6) · ÖIF-B1 §3.1 | `cd.b1.beim-arzt-erklaeren` |
|  | 2 | Ich kann den Beipackzetteln von Medikamenten Informationen über die Einnahmezeiten entnehmen. | 05-cando-b1-b2 (B1.1 #6) · ÖIF-B1 §3.1 | `cd.b1.beipackzettel` |
|  | 3 | Ich kann ein vertrautes Thema mit fünf Folien in ca. 3 Minuten präsentieren: eigene Erfahrung, Situation im Heimatland, Vor- und Nachteile, meine Meinung. | 05-cando-b1-b2 (B1.2 #2, hier mit Vorlage) · ≈ GI-B1 Sprechen T2 | `cd.b1.kurz-praesentieren` |
|  | 4 | Ich kann auf die Präsentation einer anderen Person mit einer kurzen Rückmeldung und einer Frage reagieren. | 02-exams-b1 §1 · ≈ GI-B1 Sprechen T3 | `cd.b1.praesentation-rueckmeldung` |
| `b1.1-u08` Weiterkommen: Kurse und Ziele | 1 | Ich kann die Ziele beschreiben, die ich mir für einen Sprachkurs oder eine Weiterbildung gesetzt habe. | 05-cando-b1-b2 (B1.1 #11) · ÖIF-B1 §3.1 (um Weiterbildung erweitert) | `cd.b1.lernziele-beschreiben` |
|  | 2 | Ich kann meine Gefühle im Hinblick auf das Lernen der deutschen Sprache äußern, z. B. Unsicherheit oder Freude über Erfolg. | 05-cando-b1-b2 (B1.1 #11) · RC 36 | `cd.b1.gefuehle-lernen` |
|  | 3 | Ich kann einem Radiointerview über Aus- und Weiterbildung die wichtigsten Informationen entnehmen, wenn deutlich gesprochen wird. | 05-cando-b1-b2 (B1.1 #5) · ≈ SB B1 (Hören) | `cd.b1.gespraech-details` |
|  | 4 | Ich kann in einer Radiodiskussion erkennen, welche Person welche Meinung vertritt, wenn ich den Text zweimal höre. | 05-cando-b1-b2 (B1.2 #14, hier als Einführung) · ≈ GI-B1 Hören T4 | `cd.b1.debatte-wer-meint-was` |
| `b1.1-u09` Neu anfangen | 1 | Ich kann eine mir bekannte Familiengeschichte erzählen. | 05-cando-b1-b2 (B1.1 #2) · ÖIF-B1 §3.1 | `cd.b1.familiengeschichte` |
|  | 2 | Ich kann in einfachen zusammenhängenden Sätzen sprechen, um Erfahrungen und Ereignisse oder meine Träume, Hoffnungen und Ziele zu beschreiben. | 05-cando-b1-b2 (B1.1 #2) · SB B1 | `cd.b1.erfahrungen-erzaehlen` |
|  | 3 | Ich kann einen persönlichen Blogbeitrag über ein Erlebnis im Detail verstehen, auch wenn die Ereignisse nicht in zeitlicher Reihenfolge erzählt werden. | 02-exams-b1 §7 (G-L1) · ≈ GI-B1 Lesen T1 „Korrespondenz lesen“ | `cd.b1.blog-im-detail` |
| `b1.1-u10` Vier Tage arbeiten, drei Tage frei? | 1 | Ich kann in einer Diskussion mit Freunden persönliche Standpunkte und Meinungen äußern und erfragen. | 05-cando-b1-b2 (B1.1 #3) · ZM B1 | `cd.b1.meinungen-austauschen` |
|  | 2 | Ich kann in kurzen Leserkommentaren erkennen, ob die Schreibenden für oder gegen etwas sind. | 02-exams-b1 §7 (G-L4) · ≈ GI-B1 Lesen T4 | `cd.b1.kommentare-haltung` |
|  | 3 | Ich kann in einem Forumsbeitrag (ca. 80 Wörter) meine Meinung zu einem Alltagsthema äußern und begründen. | 05-cando-b1-b2 (B1.2 #1) · ≈ GI-B1 Schreiben T2 | `cd.b1.meinung-forum` |
| `b1.1-u11` Im Namen des ganzen Teams | 1 | Ich kann im Trauerfall mein Beileid ausdrücken. | 05-cando-b1-b2 (B1.1 #10) · RC 40 | `cd.b1.beileid` |
|  | 2 | Ich kann mit einfachen Worten meine Enttäuschung ausdrücken, z. B. wenn eine geplante Feier ausfällt. | 05-cando-b1-b2 (B1.1 #10) · ≈ RC 40 | `cd.b1.enttaeuschung` |
|  | 3 | Ich kann mit Kolleginnen und Kollegen eine Feier planen, Aufgaben verteilen und mich einigen, wer was macht. | 02-exams-b1 §2 · ≈ telc B1 Mündlicher Ausdruck T3 | `cd.b1.aufgaben-verteilen` |
| `b1.1-u12` Leider fällt der Zug aus | 1 | Ich kann auch mit weniger routinemäßigen Situationen in öffentlichen Verkehrsmitteln umgehen. | 05-cando-b1-b2 (B1.1 #7) · ZM B1 | `cd.b1.stoerung-umbuchen` |
|  | 2 | Ich kann an Informationsschaltern nach Verbindungen fragen und auf entsprechende Fragen reagieren. | 05-cando-b1-b2 (B1.1 #7) · ≈ RC 142 | `cd.b1.stoerung-umbuchen` |
|  | 3 | Ich kann Informationen aus klaren, gut strukturierten Informationstexten über vertraute Themen mündlich weitergeben, z. B. eine Durchsage für eine Mitreisende. | 05-cando-b1-b2 (B1.2 #14) · SB B1, Mediation | `cd.b1.durchsage-weitergeben` (relay to the Team, as BLUEPRINT B1.1 U3 names it) |
|  | 4 | Ich kann mich schriftlich bei einem Verkehrsunternehmen beschweren und eine Entschädigung verlangen. | 05-cando-b1-b2 (B1.1 #8, Transfer) · ≈ RC 125; ZM B1 „sich beschweren“ | `cd.b1.beschwerde-schriftlich` |
| `b1.2-u01` Missverständnisse | 1 | Ich kann mich über interkulturelle Erfahrungen austauschen und erklären, warum ich bestimmte Verhaltensweisen als fremd empfunden habe. | 05-cando-b1-b2 (B1.2 #13) · RC 32 | `cd.b1.interkulturelle-erfahrungen` |
|  | 2 | Ich kann in einem Forumsbeitrag (ca. 80 Wörter, 25 Minuten) zu einer Diskussion Stellung nehmen, meine Meinung begründen und auf einen anderen Beitrag eingehen. | 05-cando-b1-b2 (B1.2 #1) · ≈ GI-B1 Schreiben T2 | `cd.b1.forum-stellung-nehmen` |
|  | 3 | Ich kann eine einfache Online-Konversation über vertraute Themen beginnen, aufrechterhalten und abschließen, auch wenn ich manchmal Pausen machen muss. | 05-cando-b1-b2 (B1.1 #14) · ≈ E8 B1, Online-Interaktion | `cd.b1.online-konversation` |
|  | 4 | Ich kann kurze Pressemeldungen schnell überfliegen und ihnen passende Überschriften zuordnen. | 02-exams-b1 §2 · ≈ telc B1 Leseverstehen T1 | `cd.b1.pressemeldungen-ueberschriften` |
| `b1.2-u02` Kaufen, vergleichen, sparen | 1 | Ich kann die Hauptpunkte schriftlich zusammenfassen, die in direkten Informationstexten über ein Thema von persönlichem oder aktuellem Interesse vorgebracht werden. | 05-cando-b1-b2 (B1.2 #3) · E8 B1, Mediation | `cd.b1.infotext-zusammenfassen` |
|  | 2 | Ich kann Angebote und Anzeigen vergleichen und für eine andere Person das passende Angebot finden. | 02-exams-b1 §7 (G-L3/t-LV3) · ≈ GI-B1 Lesen T3 | `cd.b1.angebot-fuer-andere` |
|  | 3 | Ich kann in Zeitungsartikeln Informationen und Argumente im Detail verstehen. | 02-exams-b1 §1–2 · ≈ GI-B1 Lesen T2 „Information und Argumentation verstehen“; telc LV2 | `cd.b1.artikel-argumente` |
| `b1.2-u03` Die Bewerbung | 1 | Ich kann telefonisch wichtige Informationen zur ausgeschriebenen Stelle erfragen, z. B. Arbeitszeiten, Antrittstermin und Befristung. | 05-cando-b1-b2 (B1.2 #9) · ≈ RC 98 | `cd.b1.stelle-telefonisch-erfragen` |
|  | 2 | Ich kann mithilfe einer Vorlage ein einfaches Bewerbungsschreiben verfassen und darin wichtige Auskünfte über mich geben. | 05-cando-b1-b2 (B1.2 #9) · RC 99 | `cd.b1.bewerbung-schreiben` |
|  | 3 | Ich kann im Vorstellungsgespräch über grundlegende berufliche Erfahrungen und Qualifikationen berichten und dabei auch auf Rollen und Funktionen eingehen. | 05-cando-b1-b2 (B1.2 #10) · RC 100 | `cd.b1.vorstellungsgespraech-erfahrung` |
|  | 4 | Ich kann im Vorstellungsgespräch meine Vorstellungen zur Bezahlung äußern, begründen und gegebenenfalls einen Kompromiss formulieren. | 05-cando-b1-b2 (B1.2 #10) · RC 100 | `cd.b1.gehalt-verhandeln` |
| `b1.2-u04` Was haben wir beschlossen? | 1 | Ich kann bei einer Besprechung angemessen meinen Standpunkt einbringen. | 05-cando-b1-b2 (B1.2 #11) · RC 86 | `cd.b1.standpunkt-einbringen` |
|  | 2 | Ich kann eine Nachricht notieren, wenn jemand nach Informationen fragt oder ein Problem erläutert. | 05-cando-b1-b2 (B1.2 #11) · ZM B1+ | `cd.b1.nachricht-notieren` |
|  | 3 | Ich kann mit Kolleginnen und Kollegen ein Projekt planen, Vorschläge machen, auf Einwände reagieren und Aufgaben verteilen. | 02-exams-b1 §6 (Planen in allen drei Prüfungen) · ≈ GI-B1 Sprechen T1; telc M3; DTZ Sprechen T3 | `cd.b1.projekt-planen-einwaende` |
|  | 4 | Ich kann einer Kollegin, die nicht dabei war, die Ergebnisse einer Besprechung schriftlich weitergeben. | 05-cando-b1-b2 §4 Implikation 3 (Mediation je Halbstufe) · ≈ SB B1, Mediation | `cd.b1.besprechung-ergebnisse-weitergeben` |
| `b1.2-u05` Ärger im Haus | 1 | Ich kann nach einem Konflikt, z. B. mit den Nachbarn, unterschiedliche Standpunkte vergleichen und einen Kompromiss vorschlagen. | 05-cando-b1-b2 (B1.2 #12) · ≈ RC 50 | `cd.b1.kompromiss-vorschlagen` |
|  | 2 | Ich kann um Entschuldigung bitten und erklären, warum ich mich in einer bestimmten Weise verhalten habe. | 05-cando-b1-b2 (B1.2 #12) · RC 58 | `cd.b1.entschuldigen-erklaeren` |
|  | 3 | Ich kann in einem Konfliktgespräch ruhig meine Position vertreten und auf die Argumente der anderen Seite eingehen. | 14-lehrwerke-curricula §B3 · Netzwerk neu B1 K7 (Clip „Konfliktgespräche führen“) | `cd.b1.standpunkt-einbringen` |
| `b1.2-u06` So wird das gemacht | 1 | Ich kann beschreiben, wie man etwas macht, und genaue Anweisungen geben. | 05-cando-b1-b2 (B1.2 #8) · ZM B1+ | `cd.b1.ablaeufe-erklaeren` |
|  | 2 | Ich kann Regeln wie eine Hausordnung oder eine Betriebsordnung im Detail verstehen. | 05-cando-b1-b2 (B1.2 #8) · ≈ GI-B1 Lesen T5 | `cd.b1.regeln-detail` |
|  | 3 | Ich kann ein Thema in ca. 3 Minuten präsentieren: eigene Erfahrung, Situation im Heimatland, Vor- und Nachteile, meine Meinung; danach beantworte ich Rückfragen. | 05-cando-b1-b2 (B1.2 #2) · ≈ GI-B1 Sprechen T2/T3 | `cd.b1.thema-praesentieren` |
|  | 4 | Ich kann unkomplizierte Informationen mithilfe eines grafischen „Organisers“ klar darstellen, z. B. mit einer Folie mit Vor- und Nachteilen. | 05-cando-b1-b2 (B1.2 #2) · E8 B1 | `cd.b1.grafik-organiser` |
| `b1.2-u07` Ein Unfall mit dem Fahrrad | 1 | Ich kann beim Arzt Symptome beschreiben, wenn auch mit begrenzter Genauigkeit. | 05-cando-b1-b2 (B1.2 #4) · ZM B1+ | `cd.b1.symptome-genau` |
|  | 2 | Ich kann der Versicherung in einem einfachen Schreiben einen Schadensfall mitteilen, z. B. einen Unfall. | 05-cando-b1-b2 (B1.2 #7) · RC 111 | `cd.b1.schaden-melden` |
|  | 3 | Ich kann im Gespräch mit Versicherungsmitarbeitern wichtige Informationen verstehen, z. B. zu Leistungen und Kosten. | 05-cando-b1-b2 (B1.2 #7) · ≈ RC 112 | `cd.b1.versicherung-gespraech` |
|  | 4 | Ich kann der Polizei erzählen, wie ein Unfall passiert ist. | 05-cando-b1-b2 (B1.2 #6) · ≈ ÖIF-B1 §3.1 (Transfer: Unfall statt Diebstahl) | `cd.b1.unfall-schildern` |
| `b1.2-u08` Diese Rechnung stimmt nicht | 1 | Ich kann mit einfachen, standardisierten Formulierungen bei ungerechtfertigten Forderungen schriftlich Einspruch erheben, z. B. bei Zahlungsaufforderungen. | 05-cando-b1-b2 (B1.2 #6) · RC 78 | `cd.b1.einspruch-schriftlich` |
|  | 2 | Ich kann bei der zuständigen Person reklamieren und sagen, wie das Problem gelöst werden soll. | 05-cando-b1-b2 (B1.2 #5) · ≈ BSK 28.4/28.5 B1 | `cd.b1.problem-erklaeren-loesung` |
|  | 3 | Ich kann erklären, warum etwas ein Problem ist. | 05-cando-b1-b2 (B1.2 #5) · ZM B1+ | `cd.b1.problem-erklaeren-loesung` |
| `b1.2-u09` Stadt oder Land? | 1 | Ich kann bei einer Führung die wichtigsten Informationen verstehen. | 05-cando-b1-b2 (B1.2 #14) · ≈ GI-B1 Hören T2 | `cd.b1.fuehrung-verstehen` |
|  | 2 | Ich kann Vor- und Nachteile von zwei Möglichkeiten vergleichen und meine Entscheidung begründen. | 02-exams-b1 §1 (Folie 4 der Präsentation) · ≈ GI-B1 Sprechen T2 | `cd.b1.vor-nachteile-abwaegen` |
|  | 3 | Ich kann Fragen zu meiner Präsentation beantworten und einer anderen Person eine Rückmeldung zu ihrer Präsentation geben. | 02-exams-b1 §1 · ≈ GI-B1 Sprechen T3 | `cd.b1.praesentation-rueckmeldung` |
| `b1.2-u10` Reparieren statt wegwerfen | 1 | Ich kann einen Artikel zusammenfassen, dazu Stellung nehmen und Informationsfragen dazu beantworten. | 05-cando-b1-b2 (B1.2 #3) · ≈ ZM B1+ | `cd.b1.artikel-zusammenfassen-stellung` |
|  | 2 | Ich kann in einer Radiodiskussion erkennen, wer was meint. | 05-cando-b1-b2 (B1.2 #14) · ≈ GI-B1 Hören T4 | `cd.b1.debatte-wer-meint-was` |
|  | 3 | Ich kann in Leserkommentaren auch bei Ironie und Einschränkungen erkennen, ob die Schreibenden für oder gegen etwas sind. | 02-exams-b1 §7 (G-L4) · ≈ GI-B1 Lesen T4 | `cd.b1.kommentare-einschraenkungen` (the irony clause is not carried: B2 step, §12) |
|  | 4 | Ich kann gelesene Meinungen wiedergeben, mit meiner eigenen Meinung vergleichen und darüber diskutieren. | 02-exams-b1 §2 · ≈ telc B1 Mündlicher Ausdruck T2 | `cd.b1.meinungen-wiedergeben-vergleichen` |
| `b1.2-u11` Sich engagieren | 1 | Ich kann über Unterschiede sprechen und meine eigene Position darstellen und begründen, z. B. zur Gleichberechtigung von Frau und Mann. | 05-cando-b1-b2 (B1.2 #13) · ≈ RC 30 | `cd.b1.position-werte` |
|  | 2 | Ich kann in einer Diskussion zwischen zwei Positionen vermitteln, indem ich beide Standpunkte kurz wiedergebe und einen Kompromiss vorschlage. | 14-lehrwerke-curricula §B3, §E15 · Netzwerk neu B1 K11 (Clip „in einer Diskussion vermitteln“); Begleitband, Mediation | `cd.b1.zwischen-positionen-vermitteln` |
|  | 3 | Ich kann mit einer Partnerin eine Aktion planen, Vorschläge machen, auf Einwände reagieren und Aufgaben verteilen. | 02-exams-b1 §6 · ≈ GI-B1 Sprechen T1; telc M3; DTZ Sprechen T3 | `cd.b1.projekt-planen-einwaende` |
|  | 4 | Ich kann einem Radiointerview mit einer Ehrenamtlichen Einzelheiten entnehmen, auch wenn sie erzählt, was sie bedauert oder anders gemacht hätte; in festen Mustern kann ich das auch selbst sagen (Ich hätte früher … sollen.). | 02-exams-b1 §2 · ≈ telc B1 Hörverstehen T2; 14-lehrwerke-curricula §B1 · Menschen B1 L10 „Verpasste Gelegenheiten“ (Lehrwerk-Lernziel) | `cd.b1.interview-details` |
| `b1.2-u12` Zukunftsvisionen | 1 | Ich kann einen persönlichen Blogbeitrag im Detail verstehen, auch wenn Zeitformen und Konjunktiv wechseln. | 02-exams-b1 §7 (G-L1: Vergangenheitsformen, Plusquamperfekt, Passiv) · ≈ GI-B1 Lesen T1 | `cd.b1.blog-im-detail` |
|  | 2 | Ich kann frühere Vorstellungen von der Zukunft mit der heutigen Wirklichkeit vergleichen und sagen, was anders gekommen wäre, wenn … | 14-lehrwerke-curricula §B1 · Menschen B1 L24 „Zukunftsvisionen“ (Lehrwerk-Lernziel); Transfer aus E10/E11 | `cd.b1.frueher-heute-vergleichen` |
|  | 3 | Ich kann kurz meine Meinungen und Pläne erklären und begründen. | 05-cando-b1-b2 (B1.2 #1) · SB B1 | `cd.b1.plaene-vermutungen` |
|  | 4 | Ich kann im Gespräch über mich (Herkunft, Ausbildung, Pläne) ausführlich Auskunft geben und auf Nachfragen reagieren. | 02-exams-b1 §2–3 · ≈ telc B1 Mündlicher Ausdruck T1; DTZ Sprechen T1 | `cd.b1.ueber-mich-ausfuehrlich` |

## 7. W2 draft units vs BLUEPRINT §2.8 rows

| B1.1 row | Draft unit(s) it draws on | | B1.2 row | Draft unit(s) it draws on |
|---|---|---|---|---|
| 1 Was gibt's Neues? | E1 Lange nicht gesehen! | | 1 Missverständnisse | E1 Missverständnisse (lines 1–3) |
| 2 Wir organisieren ein Fest | E6 lines 3–4 (Abend planen, Eröffnungsrede) + E11 lines 2–3 (Feier, Enttäuschung) | | 2 Weiterbildung | E6 lines 3–4 (Präsentation) + E2 line 2 — no B1.2 draft unit is about Weiterbildung (the draft put it in B1.1 E8) |
| 3 Wenn die Bahn nicht fährt | E12 Leider fällt der Zug aus (lines 1–3) | | 3 Die Bewerbung | E3 Die Bewerbung |
| 4 Ärger mit der Wohnung | E3 Die Wohnung, in die ich einziehe (lines 1–3) | | 4 Konflikt im Team | E4 lines 1, 3 + E5 Ärger im Haus (neighbours → team) |
| 5 Das Gerät ist kaputt | E4 Das ist nicht in Ordnung! + E12 line 4 | | 5 Werbung, Konsum, Geld | E2 line 3 + E1 line 4 |
| 6 Alles digital? | E5 Wie werden wir morgen leben? + E10 lines 2–3 | | 6 Einspruch! | E8 Diese Rechnung stimmt nicht + E7 Ein Unfall mit dem Fahrrad |
| 7 Unter Kollegen | E2 Neu im Team | | 7 Mitreden | E11 Sich engagieren (lines 1–3) + E10 line 4 |
| 8 Weiterbildung im Betrieb | E8 lines 3–4 + E3 line 4 (+ the E8 writing and speaking tasks, moved from the VHS to the Personalabteilung) | | 8 Regeln und Anleitungen | E6 So wird das gemacht (lines 1–2) |
| 9 Beim Arzt und in der Apotheke | E7 Was fehlt Ihnen genau? (lines 1–2) | | 9 Stadt oder Land? | E9 Stadt oder Land? |
| 10 Glück gehabt! | E9 Neu anfangen (lines 2–3) + E6 lines 1–2 (Film) + E8 line 3 | | 10 Geschichten von früher | E12 lines 1, 4 + E11 line 4 — the row's Kern (früher, Foto) has no draft unit |
| 11 Menschen, die mir wichtig sind | E11 line 1 + E9 line 1 — no draft unit is the Porträt/Vereinsblog | | 11 Klima und Zukunft | E10 Reparieren statt wegwerfen (lines 1–3) + E12 line 2 |
| 12 Meine Ziele mit Deutsch | E8 lines 1–2 + E7 line 3 + E10 line 1 | | 12 Zurückblicken, weitergeben | E4 lines 2, 4 + E2 line 1 |
| — (no row) | **E10** Vier Tage arbeiten (its lines went to rows 6 and 12) | | — (no row) | **E5** Ärger im Haus (→ row 4), **E7** Unfall (→ row 6), **E12** Zukunftsvisionen (→ rows 10, 11) |

If a curriculum agent keeps a draft situation that no row has, the ids move with it by a logged `deviation` that keeps
each id core in exactly one unit.

## 8. Registry index

*Origin:* **W2-Plan** = carries a draft line; **neu (tb1)** = added for the lane; **neu (Blueprint-Zeile)** = a Kern-Kann
of a §2.8 row that the drafts miss; **neu (Blueprint-Fokus)** = the Lernziel of a §2.8 Fokus card. *tb1* = the Teil(e) whose exam skill the can-do names. *Core in* = the blueprint
unit that lists it; never-core ids show their *more* placements.

| Id | halfLevel | band | mode | hf | online | mediation | tb1 | origin | core in |
|---|---|---|---|---|---|---|---|---|---|
| `cd.b1.neuigkeiten-austauschen` | b1.1 | B1 | interaction-written | D | — | — | — | W2-Plan | b1.1-u01 |
| `cd.b1.persoenliche-mail` | b1.1 | B1 | productive-written | D | — | — | sa | W2-Plan | b1.1-u01 |
| `cd.b1.kennenlernen-gespraech` | b1.1 | B1 | interaction-spoken | D, A | — | — | m1 | W2-Plan | b1.1-u01 |
| `cd.b1.online-austausch` | b1.1 | B1 | interaction-written | D, 9 | ja | — | — | W2-Plan | b1.1-u01 |
| `cd.b1.gemeinsam-planen` | b1.1 | B1 | interaction-spoken | D, 2 | — | — | m3 | W2-Plan | b1.1-u02 |
| `cd.b1.aufgaben-verteilen` | b1.1 | B1 | interaction-spoken | D, 2 | — | — | m3 | W2-Plan | b1.1-u02 |
| `cd.b1.enttaeuschung` | b1.1 | B1 | interaction-spoken | B, D | — | — | — | W2-Plan | b1.1-u02 |
| `cd.b1.rede-publikum` | b1.1 | B1 | receptive-spoken | D, 9 | — | — | — | W2-Plan | b1.1-u02 |
| `cd.b1.durchsagen-stoerung` | b1.1 | B1 | receptive-spoken | 10 | — | — | hv3 | neu (tb1) | b1.1-u03 |
| `cd.b1.stoerung-umbuchen` | b1.1 | B1 | interaction-spoken | 10 | — | — | — | W2-Plan | b1.1-u03 |
| `cd.b1.durchsage-weitergeben` | b1.1 | B1 | mediation | 10, 2 | — | ja | — | W2-Plan | b1.1-u03 |
| `cd.b1.vermieter-details-erfragen` | b1.1 | B1 | interaction-spoken | 12 | — | — | — | W2-Plan | b1.1-u04 |
| `cd.b1.mietvertrag-verstehen` | b1.1 | B1 | receptive-written | 12 | — | — | — | W2-Plan | b1.1-u04 |
| `cd.b1.mangel-melden` | b1.1 | B1 | productive-written | 12, C | — | — | sa | W2-Plan | b1.1-u04 |
| `cd.b1.mail-vier-leitpunkte` | b1.1 | B1 | productive-written | D | — | — | sa | neu (tb1) | b1.1-u04 |
| `cd.b1.reklamieren` | b1.1 | B1 | interaction-spoken | 7, C | — | — | — | W2-Plan | b1.1-u05 |
| `cd.b1.agb-verstehen` | b1.1 | B1 | receptive-written | 7 | — | — | — | W2-Plan | b1.1-u05 |
| `cd.b1.beschwerde-schriftlich` | b1.1 | B1 | productive-written | 7, 10, C | — | — | sa | W2-Plan | b1.1-u05 |
| `cd.b1.brief-formen-erkennen` | b1.1 | B1 | receptive-written | D, E | — | — | sb1 | neu (tb1) | b1.1-u05 |
| `cd.b1.plaene-vermutungen` | b1.1 | B1 | productive-spoken | 9, B | — | — | — | W2-Plan | b1.1-u06 |
| `cd.b1.radio-kurzbeitraege` | b1.1 | B1 | receptive-spoken | 9 | — | — | hv1 | W2-Plan | b1.1-u06 |
| `cd.b1.kommentare-haltung` | b1.1 | B1 | receptive-written | 9, B | — | — | — | W2-Plan | b1.1-u06 |
| `cd.b1.meinung-forum` | b1.1 | B1 | productive-written | 9, B | — | — | — | W2-Plan | b1.1-u06 |
| `cd.b1.medienerfahrungen` | b1.1 | B1 | interaction-spoken | 9, D | — | — | — | W2-Plan | — (more: b1.1-u06) |
| `cd.b1.absprachen-kollegen` | b1.1 | B1 | interaction-spoken | 2 | — | — | — | W2-Plan | b1.1-u07 |
| `cd.b1.krankmeldung-uebergabe` | b1.1 | B1 | interaction-spoken | 2, 8 | — | — | — | W2-Plan | b1.1-u07 |
| `cd.b1.formelle-kurznachricht` | b1.1 | B1 | productive-written | 2, D | — | — | — | W2-Plan | b1.1-u07 |
| `cd.b1.wortwahl-brief` | b1.1 | B1 | receptive-written | D, E | — | — | sb2 | neu (tb1) | b1.1-u07 |
| `cd.b1.beratung-gespraech` | b1.1 | B1 | interaction-spoken | 2, 4 | — | — | — | neu (Blueprint-Zeile) | b1.1-u08 |
| `cd.b1.anzeigen-gezielt` | b1.1 | B1 | receptive-written | 4, 7, 12 | — | — | lv3 | W2-Plan | b1.1-u08 |
| `cd.b1.artikel-details` | b1.1 | B1 | receptive-written | 4, 9 | — | — | lv2 | neu (tb1) | b1.1-u08 |
| `cd.b1.kursanfrage-schreiben` | b1.1 | B1 | productive-written | 2, 4 | — | — | sa | neu (tb1) | b1.1-u08 |
| `cd.b1.beim-arzt-erklaeren` | b1.1 | B1 | interaction-spoken | 8 | — | — | — | W2-Plan | b1.1-u09 |
| `cd.b1.beipackzettel` | b1.1 | B1 | receptive-written | 8 | — | — | — | W2-Plan | b1.1-u09 |
| `cd.b1.rat-geben` | b1.1 | B1 | interaction-spoken | 8, D | — | — | — | neu (Blueprint-Zeile) | b1.1-u09 |
| `cd.b1.erfahrungen-erzaehlen` | b1.1 | B1 | productive-spoken | B, D | — | — | — | W2-Plan | b1.1-u10 |
| `cd.b1.film-buch-wiedergeben` | b1.1 | B1 | productive-spoken | B, D | — | — | — | W2-Plan | b1.1-u10 |
| `cd.b1.gespraech-details` | b1.1 | B1 | receptive-spoken | D, 4 | — | — | hv2 | W2-Plan | b1.1-u10 |
| `cd.b1.blog-im-detail` | b1.1 | B1 | receptive-written | D, 9 | — | — | — | W2-Plan | b1.1-u10 |
| `cd.b1.person-portraetieren` | b1.1 | B1 | productive-written | D | — | — | — | neu (Blueprint-Zeile) | b1.1-u11 |
| `cd.b1.familiengeschichte` | b1.1 | B1 | productive-spoken | D, A | — | — | — | W2-Plan | b1.1-u11 |
| `cd.b1.beileid` | b1.1 | B1 | productive-written | D, B, 2 | — | — | — | W2-Plan | b1.1-u11 |
| `cd.b1.kurzmeldungen-thema` | b1.1 | B1 | receptive-written | 9, 2 | — | — | lv1 | neu (tb1) | b1.1-u11 |
| `cd.b1.lernziele-beschreiben` | b1.1 | B1 | productive-spoken | E, 4, 11 | — | — | — | W2-Plan | b1.1-u12 |
| `cd.b1.gefuehle-lernen` | b1.1 | B1 | productive-spoken | E, B | — | — | — | W2-Plan | b1.1-u12 |
| `cd.b1.kurz-praesentieren` | b1.1 | B1 | productive-spoken | E, 11 | — | — | — | W2-Plan | b1.1-u12 |
| `cd.b1.meinungen-austauschen` | b1.1 | B1 | interaction-spoken | B, D | — | — | m2 | W2-Plan | b1.1-u12 |
| `cd.b1.missverstaendnis-klaeren` | b1.2 | B1 | interaction-spoken | B, C, D | — | — | — | neu (Blueprint-Zeile) | b1.2-u01 |
| `cd.b1.interkulturelle-erfahrungen` | b1.2 | B1 | interaction-spoken | A, B | — | — | — | W2-Plan | b1.2-u01 |
| `cd.b1.forum-stellung-nehmen` | b1.2 | B1 | interaction-written | B, 9 | ja | — | — | W2-Plan | b1.2-u01 |
| `cd.b1.online-konversation` | b1.2 | B1 | interaction-written | D, 9 | ja | — | — | W2-Plan | b1.2-u01 |
| `cd.b1.angebot-fuer-andere` | b1.2 | B1 | receptive-written | 4, 7 | — | — | lv3 | W2-Plan | b1.2-u02 |
| `cd.b1.thema-praesentieren` | b1.2 | B1 | productive-spoken | 4, E | — | — | — | W2-Plan | b1.2-u02 |
| `cd.b1.grafik-organiser` | b1.2 | B1 | productive-written | 4, E | — | — | — | W2-Plan | b1.2-u02 |
| `cd.b1.stelle-telefonisch-erfragen` | b1.2 | B1 | interaction-spoken | 3 | — | — | — | W2-Plan | b1.2-u03 |
| `cd.b1.bewerbung-schreiben` | b1.2 | B1 | productive-written | 3 | — | — | sa | W2-Plan | b1.2-u03 |
| `cd.b1.vorstellungsgespraech-erfahrung` | b1.2 | B1 | interaction-spoken | 3, 2 | — | — | — | W2-Plan | b1.2-u03 |
| `cd.b1.gehalt-verhandeln` | b1.2 | B1 | interaction-spoken | 3 | — | — | — | W2-Plan | b1.2-u03 |
| `cd.b1.standpunkt-einbringen` | b1.2 | B1 | interaction-spoken | 2, C | — | — | — | W2-Plan | b1.2-u04 |
| `cd.b1.kompromiss-vorschlagen` | b1.2 | B1 | interaction-spoken | C, 12, 2 | — | — | — | W2-Plan | b1.2-u04 |
| `cd.b1.entschuldigen-erklaeren` | b1.2 | B1 | interaction-spoken | C, D | — | — | — | W2-Plan | b1.2-u04 |
| `cd.b1.projekt-planen-einwaende` | b1.2 | B1 | interaction-spoken | 2, D | — | — | m3 | W2-Plan | b1.2-u04 |
| `cd.b1.artikel-argumente` | b1.2 | B1 | receptive-written | 7, 9 | — | — | lv2 | W2-Plan | b1.2-u05 |
| `cd.b1.pressemeldungen-ueberschriften` | b1.2 | B1 | receptive-written | 9 | — | — | lv1 | W2-Plan | b1.2-u05 |
| `cd.b1.werbung-kritisch` | b1.2 | B1 | receptive-written | 7, 9 | — | — | — | neu (Blueprint-Zeile) | b1.2-u05 |
| `cd.b1.kaufentscheidung-begruenden` | b1.2 | B1 | productive-spoken | 7, 5, B | — | — | — | neu (Blueprint-Zeile) | b1.2-u05 |
| `cd.b1.einspruch-schriftlich` | b1.2 | B1 | productive-written | 1, 5, C | — | — | sa | W2-Plan | b1.2-u06 |
| `cd.b1.schaden-melden` | b1.2 | B1 | productive-written | 5 | — | — | — | W2-Plan | b1.2-u06 |
| `cd.b1.problem-erklaeren-loesung` | b1.2 | B1+ | interaction-spoken | 7, 5, C | — | — | — | W2-Plan | b1.2-u06 |
| `cd.b1.symptome-genau` | b1.2 | B1+ | interaction-spoken | 8 | — | — | — | W2-Plan | — (more + Fokus-Karte Gesundheit: b1.2-u06) |
| `cd.b1.versicherung-gespraech` | b1.2 | B1 | receptive-spoken | 5 | — | — | — | W2-Plan | b1.2-u06 |
| `cd.b1.unfall-schildern` | b1.2 | B1 | productive-spoken | 10, 1 | — | — | — | W2-Plan | — (more: b1.2-u06) |
| `cd.b1.zwischen-positionen-vermitteln` | b1.2 | B1 | mediation | B, C, A | — | ja | — | W2-Plan | b1.2-u07 |
| `cd.b1.meinungen-wiedergeben-vergleichen` | b1.2 | B1 | interaction-spoken | B, A | — | ja | m2 | W2-Plan | b1.2-u07 |
| `cd.b1.position-werte` | b1.2 | B1 | productive-spoken | A, B | — | — | — | W2-Plan | b1.2-u07 |
| `cd.b1.meinungsbeitraege-einmal` | b1.2 | B1 | receptive-spoken | 9, B | — | — | hv1 | neu (tb1) | b1.2-u07 |
| `cd.b1.ablaeufe-erklaeren` | b1.2 | B1+ | productive-spoken | 2, 12 | — | — | — | W2-Plan | b1.2-u08 |
| `cd.b1.regeln-detail` | b1.2 | B1 | receptive-written | 12, 2 | — | — | — | W2-Plan | b1.2-u08 |
| `cd.b1.formelle-wendungen` | b1.2 | B1 | productive-written | 1, 5, 12 | — | — | sb2 | neu (tb1) | b1.2-u08 |
| `cd.b1.ansagen-handeln` | b1.2 | B1 | receptive-spoken | 1, 2, 12 | — | — | hv3 | neu (tb1) | b1.2-u08 |
| `cd.b1.betreuungsvertrag-verstehen` | b1.2 | B1 | receptive-written | 6 | — | — | — | neu (Blueprint-Fokus) | — (more + Fokus-DaZ: b1.2-u08) |
| `cd.b1.fuehrung-verstehen` | b1.2 | B1 | receptive-spoken | 10, 12 | — | — | — | W2-Plan | b1.2-u09 |
| `cd.b1.vor-nachteile-abwaegen` | b1.2 | B1 | productive-spoken | 12, 10, B | — | — | — | W2-Plan | b1.2-u09 |
| `cd.b1.praesentation-rueckmeldung` | b1.2 | B1 | interaction-spoken | E, D | — | — | — | W2-Plan | b1.2-u09 |
| `cd.b1.ueber-frueher-berichten` | b1.2 | B1 | productive-spoken | A, D | — | — | — | neu (Blueprint-Zeile) | b1.2-u10 |
| `cd.b1.foto-beschreiben-vergleichen` | b1.2 | B1 | productive-spoken | A, D | — | — | — | neu (Blueprint-Zeile) | b1.2-u10 |
| `cd.b1.interview-details` | b1.2 | B1 | receptive-spoken | A, D, B | — | — | hv2 | W2-Plan | b1.2-u10 |
| `cd.b1.ueber-mich-ausfuehrlich` | b1.2 | B1 | interaction-spoken | D, A, 4 | — | — | m1 | W2-Plan | b1.2-u10 |
| `cd.b1.artikel-zusammenfassen-stellung` | b1.2 | B1+ | productive-written | 9, B | — | — | sa | W2-Plan | b1.2-u11 |
| `cd.b1.debatte-wer-meint-was` | b1.2 | B1 | receptive-spoken | 9, B | — | — | — | W2-Plan | b1.2-u11 |
| `cd.b1.kommentare-einschraenkungen` | b1.2 | B1 | receptive-written | 9, B | — | — | — | W2-Plan | b1.2-u11 |
| `cd.b1.frueher-heute-vergleichen` | b1.2 | B1 | productive-spoken | 9, B | — | — | — | W2-Plan | b1.2-u11 |
| `cd.b1.infotext-zusammenfassen` | b1.2 | B1 | productive-written | 7, 5, D | — | ja | — | W2-Plan | b1.2-u12 |
| `cd.b1.besprechung-ergebnisse-weitergeben` | b1.2 | B1 | productive-written | 2, D | — | ja | — | W2-Plan | b1.2-u12 |
| `cd.b1.nachricht-notieren` | b1.2 | B1+ | mediation | 2 | — | ja | — | W2-Plan | b1.2-u12 |
| `cd.b1.mail-zusammenhaengend` | b1.2 | B1 | productive-written | D, E | — | — | sa | neu (tb1) | b1.2-u12 |

## 9. Conventions used in the file

- **Wording.** Every `de` is our own ich-Form sentence in plain B1 German. The drafts carry the source descriptors with
  only the person changed (memo 05 conversion rule), so every draft line was **rewritten**, not transcribed. A scripted
  check compared each `de` with every draft line and every ich-Form line of memo 05: after the shared „Ich kann“ the
  longest common word run is **5 words**, and those runs are function-word frames, not descriptor
  phrases (top: `persoenliche-mail` 5 („in einer persönlichen e mail“); `wortwahl-brief` 5 („in einem brief oder einer“); `praesentation-rueckmeldung` 5 („beantworten und einer anderen person“); `kennenlernen-gespraech` 4 („arbeit sprachen und plänen“); `agb-verstehen` 4 („die wichtigsten punkte der“); `radio-kurzbeitraege` 4 („wenn deutlich gesprochen wird“)). Re-run 2026-09-27 after the review
  fixes, now also against every sentence of the RC full text: maximum **6 words**, `online-konversation` („ein
  Gespräch über ein vertrautes Thema“, a generic frame); the six reworded or new `de` texts share at most 4 words
  with any source (`kommentare-einschraenkungen`: „für oder gegen etwas“). Examples (Firmenzeitung, Repair-Café, Vereinsblog …) are ours.
- **Ids.** `cd.b1.<slug>`, German, ASCII-folded, naming the function rather than the unit, so an id survives a unit
  move. **halfLevel** = the half where the id is first a core Lernziel; the never-core ids take the half of their first
  placement (`medienerfahrungen`, `unfall-schildern`, `symptome-genau`, `betreuungsvertrag-verstehen`).
- **band** = the CEFR level at which the course expects the performance (as in `cando-a1.md`): **B1** by default,
  **B1+** only where the source is a B1+ key feature (`GER-M·B1+`): `problem-erklaeren-loesung`, `symptome-genau`,
  `ablaeufe-erklaeren`, `artikel-zusammenfassen-stellung`, `nachricht-notieren`. The exam level of both courses is B1,
  so no id is B2; no id is A2+ (every B1.1 source is a B1 descriptor or a B1 exam Teil).
- **mode** = the channel of the unit's proof: Hören/Lesen → `receptive-*`; monologue, narration, presentation →
  `productive-spoken`; letters, e-mails, posts, cards → `productive-written`; dialogue, negotiation, reacting →
  `interaction-spoken`; chat and forum replies → `interaction-written`; spoken or note-based relaying for a third
  person → `mediation`. Counts: receptive-spoken 10 · receptive-written 17 · productive-spoken 16 · productive-written 18 · interaction-spoken 28 · interaction-written 4 · mediation 3.
- **mediation — shared rule (proposed to cando-b2 and the validator owner, to be stated in these words in both notes):**
  > `mediation: true` whenever the can-do relays or relates content for a third party, whatever its `mode`.
  > `mode: mediation` is used when the relaying itself is the proof channel (spoken relay, a note for someone else);
  > otherwise `mode` names the channel of the proof (a written summary is `productive-written`, a relayed opinion
  > in a discussion `interaction-spoken`). ALL-06 counts the flag, not the mode.

  In B1 the flag is on six ids: the three with mode `mediation` (`durchsage-weitergeben`, `zwischen-positionen-vermitteln`,
  `nachricht-notieren`), the two written summaries for someone else (`infotext-zusammenfassen`,
  `besprechung-ergebnisse-weitergeben`, productive-written) and the telc M2 relay (`meinungen-wiedergeben-vergleichen`,
  interaction-spoken; BLUEPRINT B1.2 U7 calls „Meinungen wiedergeben“ mediation). Every id with mode `mediation` has
  the flag, so B2's current practice (flag exactly when mode is `mediation`) is a subset of this rule and stays valid.
- **online: true** = the can-do is carried out as interaction in a digital channel (mode `interaction-written`, or
  `interaction-spoken` in a video call) — the rule the DaF review proposed for all four registries: `online-austausch`
  (B1.1); `forum-stellung-nehmen`, `online-konversation` (B1.2). A single forum post (`meinung-forum`, productive-written),
  e-mails, reader comments and radio stay `false`. ALL-06 is then met by online ∧ interaction in both halves.
- **hf** = BAMF Handlungsfeld(er) (1–12, A–E) of the source page, plus the row's field where it differs. Occurrences in
  the registry: 1: 4 · 2: 19 · 3: 4 · 4: 10 · 5: 7 · 6: 1 · 7: 10 · 8: 5 · 9: 20 · 10: 7 · 11: 2 · 12: 11 · A: 10 · B: 23 · C: 10 · D: 34 · E: 9. HF 6 is carried by `betreuungsvertrag-verstehen` (Fokus card, open issue 4); HF 11 by B1.1 U12's tag (`lernziele-beschreiben`, `kurz-praesentieren`).
- **Source tags** (never shown on screen):

  | Tag | Document |
  |---|---|
  | `RC p·B1` | BAMF Rahmencurriculum für Integrationskurse (revision 2016), page · level. Every RC page in the file was read in the BAMF PDF (186 pp.) on 2026-09-27 (open issue 3) |
  | `GER-R·B1`, `GER-R·B1 Online`, `GER-R·B1 Mediation` | Begleitband 2020, Anhang 2 (Raster zur Selbstbeurteilung, with the online-interaction and mediation rows) — memo 05 „SB“ |
  | `GER-M·B1`, `GER-M·B1+` | Begleitband, Anhang 1 (Zentrale Merkmale der Niveaus) — memo 05 „ZM“ |
  | `GER-E·B1`, `GER-E·B1 Online`, `GER-E·B1 Mediation` | Begleitband, Anhang 8 (ergänzende Deskriptoren) — memo 05 „E8“ |
  | `ÖIF-B1 §3.1` | ÖIF Rahmencurriculum B1 (Fassung 01.08.2025), §3.1 |
  | `BSK x.y·B1` | BAMF/telc Lernziele Berufsbezogene Deutschsprachförderung (2019), Feinlernziel x.y, B1 column |
  | `UT-B1 <Teil>` | telc Deutsch B1 Übungstest 1 (the tb1 lane source): LV1–LV3, SB1–SB2, HV1–HV3, SA, M1–M3 |
  | `GI-B1 <Teil>` | Goethe-/ÖSD-Zertifikat B1 Modellsatz, Teil (L1–L5, H1–H4, Sch1–Sch3, Sp1–Sp3) — a format source; the gb1 lane is deferred |
  | `DTZ S2` | g.a.s.t. DTZ Übungssatz 1, Sprechen Teil 2 — a format source; the dtz lane is deferred |
  | `M#`, `N#`, `S6-L#`, `Si#` | Lehrwerk placement (Menschen B1 L#, Netzwerk neu B1 K#, Schritte plus Neu 6 L#, Sicher! L#), BLUEPRINT §2.2 key |

## 10. Spiral threads (ALL-06) — each B1 step named

| Thread (memo 05 §3) | B1.1 step | B1.2 step | Hand-over to B2 (memo 05) |
|---|---|---|---|
| Beschwerde | `reklamieren`, `beschwerde-schriftlich` (U5; GER-M·B1 „sich beschweren“) | `problem-erklaeren-loesung` (U6, B1+), `einspruch-schriftlich` (U6) | Zugeständnisse einfordern (B2.1) |
| Meinung | `meinungen-austauschen` (U12, GER-M·B1), `meinung-forum` (U6) | `meinungen-wiedergeben-vergleichen` (U7), `artikel-zusammenfassen-stellung` (U11, B1+) | Argumentation logisch aufbauen (B2.1) |
| Konsultation | `beim-arzt-erklaeren` (U9) | `symptome-genau` (B1+) — *more* on U6, proved in a Fokus-Karte Gesundheit (e.g. the doctor's visit after the accident whose damage U6 reports); open issue 1 | Beratung mit Nachfragen (B2.1) |
| Weitergeben | `online-austausch` (U1), `durchsage-weitergeben` (U3, mediation, to the Team) | `infotext-zusammenfassen`, `besprechung-ergebnisse-weitergeben`, `nachricht-notieren` (U12), `zwischen-positionen-vermitteln` (U7) | umschreiben, Fehler kontrollieren (B2.1) |
| Planen (course spine) | `gemeinsam-planen`, `aufgaben-verteilen` (U2) | `projekt-planen-einwaende` (U4) | — |

## 11. Open issues

1. **Blueprint rows vs W2 drafts.** §2 follows BLUEPRINT §2.8; the curriculum agents decide. One placement depends on a
   situation choice: the Konsultation step `symptome-genau` is core in **B1.2 U6 „Einspruch!“**, because B1.2 has no
   health row and draft b1.2-u07 (Fahrradunfall: Polizei, Ärztin, Versicherung) feeds U6's „einen Schaden melden“. If
   U6 is built around the wrong bill only, swap `symptome-genau` for `versicherung-gespraech` (a logged deviation) and
   carry `symptome-genau` in a Fokus-Karte Gesundheit, naming it as the thread's B1.2 step.
2. **B1.1 work units (ALL-06 ≥ 3).** Only two B1.1 rows are work situations (U7 Unter Kollegen · 2, U8 Weiterbildung ·
   4). Units whose core carries HF 2/3/4 — B1.1: `b1.1-u02`, `b1.1-u07`, `b1.1-u08`, `b1.1-u10`, `b1.1-u11`, `b1.1-u12`; B1.2: `b1.2-u02`, `b1.2-u03`, `b1.2-u04`, `b1.2-u08`, `b1.2-u10`, `b1.2-u12` — overstate it, because an HF tag
   on one can-do does not make the unit a work unit. Proposal: make B1.1 U2 a Betriebsfest (Menschen B1 L12 „Feiern im
   Betrieb“; the draft's own Feier was a Firmenabschied, b1.1-u11) or U11 a portrait of a colleague for the
   Firmenzeitung; either keeps the can-dos unchanged.
3. **Weak source tags (DaF reviewer to confirm).** `beratung-gespraech` (BSK 41.3·B1 — memo 05 quoted only the B2 cell;
   plus M7, Si5), `rat-geben` (M9, a Lehrwerk placement only), `missverstaendnis-klaeren` (M13 only),
   `werbung-kritisch` (S6-L10, N12 only), `kaufentscheidung-begruenden` (GER-R·B1 by extension + Si7),
   `ueber-frueher-berichten` (GER-R·B1 by extension + M16/M17), `foto-beschreiben-vergleichen` (DTZ S2, a format
   source), `frueher-heute-vergleichen` (M24, as in the draft), `formelle-wendungen` (RC 78 by extension). RC page·level
   tags are taken from memo 05 and the drafts; no RC page was re-read, and `RC 142·B1`, `RC 85·B1` and
   `RC 112·B1` are condensed („≈“) in memo 05. The ÖIF §3.1 lines are Profile-deutsch items per the ÖIF only (memo 05,
   unverified 2).
4. **HF 6 (Kinder) has no B1 can-do.** ALL-04 needs all 12 Handlungsfelder per band in units or Fokus-Karten. Neither
   memo 05 nor the drafts name a B1 RC goal in HF 6, and no RC page was read for one, so no id was invented. Options: a
   Fokus-DaZ card that reuses `cd.a2.nach-dem-kind-fragen` / `cd.a2.elternabend-verstehen` at a B1 depth, or a new
   `cd.b1.*` id through this registry once a B1 RC goal in HF 6 is verified. HF 11 is thin (3 ids) but present.
5. **Two B1.1 draft lines map to B1.2 ids** (b1.1-u07 #4 → `praesentation-rueckmeldung`, b1.1-u08 #4 →
   `debatte-wer-meint-was`; the draft calls both „Einführung“). They are kept out of every B1.1 unit so no B1.1 unit
   references a B1.2 id; the B1.1 units can still practise the formats in LS4 without a Lernziel. If the validator
   allows forward references in *more*, add them to B1.1 U12 and U8.
6. **`band` semantics** — as `cando-a1.md` open issue 3: this file uses the course level. No entry would change under
   the source-level reading except that none is lower than B1 anyway.
7. **Mediation: mode or flag?** SCHEMA §4.1 has both; ALL-06 does not say which one it counts. The flag is set on all
   six mediation can-dos and mode `mediation` on three; B1.1 passes under either reading (`durchsage-weitergeben` has
   both).
8. **tb1 lane file** (`registries/lanes/tb1.json`, read 2026-09-27): the Teil ids lv1 … m3 match §3. Its open question
   on `m1` (mutual „Einander kennenlernen“, not a monologue) agrees with the modes here: `kennenlernen-gespraech` and
   `ueber-mich-ausfuehrlich` are interaction-spoken.
9. **Checks run.** `node scripts/course-v2/check.mjs content/course-v2/registries/cando/b1.json` → 0 errors (SCH-01
   against `scripts/course-v2/lib/schemas/cando.mjs`, band prefix refine); `JSON.parse` OK;
   `scripts/course-v2/validate.mjs` does not exist yet. A scratch generator additionally checked: every draft line
   mapped (line counts equal to the drafts), every id placed, 3–5 core per unit, ≥ 1 productive/interaction core per
   unit, each id core at most once and in its halfLevel, no B1.1 → B1.2 reference, the online-interaction and mediation
   quotas per half, a B1.1 id for every tb1 Teil, and the wording distance above. ALL-02/ALL-06 proper run on the unit
   specs once they exist.
