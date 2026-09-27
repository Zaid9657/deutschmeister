# Grammar spine — notes

**Date:** 2026-09-27 · **Owner:** spine agent, the sole writer of
[`content/course-v2/registries/grammar-spine.json`](../../../content/course-v2/registries/grammar-spine.json) and of
this file (BLUEPRINT §10.3, §10.8) · **Schema:** SCHEMA §4.2 (`course-v2/spine@1`) · **Checks:**
`node scripts/course-v2/check.mjs content/course-v2/registries/grammar-spine.json` → 0 errors, plus the GRM checks in §3.

**Inputs.** The eight level plans `docs/course-v2/curriculum/<level>.json` (field `grammar`, state after the
2026-09-27 continuity pass) are the source of every intro unit. Research memo 06 (F2 inventories, F3 consensus
tables) and memo 14 §C supply `lehrwerk` and `consensus`; BLUEPRINT §2.5 supplies the rules. The orchestrator's
instruction wins where the plans and BLUEPRINT §2.8 differ: **intro units come from the plans** (§6 lists every
difference from the blueprint rows).

## 1. What the file holds

| Level | New points (receptive intro here) | Productive steps of earlier points | Rule cards in this level |
|---|---|---|---|
| a1.1 | 23 | — | 24 |
| a1.2 | 21 | — | 21 |
| a2.1 | 18 | — | 19 |
| a2.2 | 17 | — | 17 |
| b1.1 | 15 | `g.praeteritum` | 16 |
| b1.2 | 18 | `g.passiv-praesens` | 19 |
| b2.1 | 19 | `g.konj2-vergangenheit` | 20 |
| b2.2 | 14 | — | 14 |
| **all** | **145** | 3 | **150** |

- **One point per grammar item the plans teach**: every plan item with `new: true`, and every chunk whose
  structure a later unit makes systematic. Review items (`new: false`, no chunk) create no point. They review
  the original point, which the unit spec lists under `grammar.review`, and their named increment (*Zuwachs*)
  lives on that point's rule card. Four pairs of plan items became one point each (D1, D4, D5, D6). One chunk
  became a point (D7). Four items moved to another unit to keep GRM-01 (D2, D3, D8, D9). All of them are listed
  in §4.
- **Three points are receptive first** and count as new in both of their units (as the BLUEPRINT §2.8 tables
  count them): `g.praeteritum` a2.2-u01 → b1.1-u01, `g.passiv-praesens` a2.2-u07 → b1.2-u06,
  `g.konj2-vergangenheit` b1.2-u11 → b2.1-u04. Every other point has `productive` = `receptive`.
- **The hinge decisions** (BLUEPRINT §2.5) are the intro units of these points: the Dativ through fixed-case
  prepositions (`g.praep-dativ` a1.2-u01) before the dative verbs and pronouns (`g.dativverben-pronomen` a1.2-u06);
  Wechselpräpositionen through verb pairs (`g.wechselpraep` + `g.positionsverben` a2.1-u02); *weil/dass/wenn*
  in A2.1 (u01/u03/u06); the Relativsatz ladder Nom a2.2-u09 → Akk a2.2-u10 → Dat/Präp b1.1-u03 → *was/wo*
  b1.2-u04 → *wer/was* b2.1-u07; Futur I b1.1-u05; the Konjunktiv II ladder formulas a1.2-u07 → *könnte*
  a2.1-u07 → *sollte* a2.1-u09 → *wäre/hätte/würde* a2.2-u02 → unreal present b1.1-u10 → past receptive
  b1.2-u11 → past productive b2.1-u04; two-part connectors b1.2-u03/u11 (review + *einerseits* b2.1-u05);
  Konjunktiv I b2.2-u01/u07 (receptive chunk b2.1-u11); the B2 split (Passiversatz b2.1-u06, NVV and
  Zustandspassiv b2.1-u08, Nominalisierung b2.2-u05).

## 2. Field conventions

| Field | Rule used in this file |
|---|---|
| `id` | `g.<slug>`. The four ids SCHEMA §15 names are kept: `g.reflexiv-akk`, `g.akk-personalpronomen`, `g.wenn`, `g.perfekt-haben`. They are also the fixture's stub ids. |
| `label` | German, learner-facing (SCHEMA §12: the syllabus page shows it), with one short example. |
| `intro` | Unit ids from the plans (§4 lists every change). `productive` is always written, even when it equals `receptive`. |
| `chunkFrom` | The first unit in which a plan uses the point's form as a fixed phrase (productive or receptive). **At most one point per unit** has that unit as `chunkFrom`, because a unit spec carries at most one chunk preview (GRM-01, `grammar.chunk {0..1}`). Where a plan unit names two chunks, the spine records one, and §4 D10 says what happens to the other. A later unit may still use the chunk before the intro and list the point in `grammar.chunk`: a1.1-u10 *mit dem Zug* → `g.praep-dativ`; a1.2-u05 *Mir tut der Kopf weh* → `g.dativverben-pronomen`; b1.2-u08 *Widerspruch einlegen* → `g.nomen-verb-verbindungen`. |
| `contrast` | Always a point introduced **in the same or an earlier unit**, because GRM-06 interleaves the partner in the warm-ups from the point's second Lernschritt, so the partner must already be licensed. Partners come from the plans' own contrasts, the blueprint's interleaving pairs (Akk/Dat, Perfekt *haben/sein*, *weil/denn*, *wenn/als*, *deshalb/trotzdem*) and the "classic difficulty" column of memo 06 F3 (*konnte/könnte*, *wird/würde*, *mich/mir*, *nicht/kein*, zu after modal verbs). The first points of A1.1 have none. |
| `errorTags` | SCHEMA §3.1 enum only. The enum has no tag for conjugation, for negation or for Mittelfeld order (b2-1.md §8 asks for one; see §8 item 4). `register` marks du/Sie, politeness and formal-style points. `spelling-meaning` marks forms whose spelling changes the meaning (*konnte/könnte*, *wurde/würde*, *fährt/fahrt*, umlaut comparatives). |
| `lehrwerk` | Compact codes in the SCHEMA §15.1 style: **M** Menschen (`M A1 L13`), **S*n*** Schritte plus Neu volume *n* (`S2 L11`), **N** Netzwerk neu (`N A1 K7`, `N B1 K12`), **NW** Netzwerk B1 first edition (`NW B1 K6`), **LIN** (Die neue) Linie 1 (`LIN A1 K3`), **As** Aspekte neu (`As B1+ K2`, `As B2 K1`), **Si** Sicher! B1+ / Sicher! aktuell B2 (`Si B1+ L5`, `Si B2 L7`), **MOT** Motive. Taken from the plans' `lehrwerk` strings, checked against memo 06 F3. A placement in another half-level (e.g. `M A2 L21` for *welch-/dies-*) is listed on purpose: it documents the split. |
| `consensus` | The memo 06 F3 label where the point matches an F3 row. Otherwise it is derived from the placements (strong = every family covering the level puts it here; majority = most do; split = they disagree; single = one book, one inventory or the plan's own design). The B2 labels inherit memo 06's caveat that the Sicher! aktuell B2 L1–6 mapping is (unverified). |
| `ruleCards` | `rc.<slug>` is the depth-1 card in the level of `intro.receptive`. `rc.<slug>-2` is a depth-2 card where the productive step or a named increment lies in a later unit. There are five: `rc.praesens-2`, `rc.komparation-2`, `rc.praeteritum-2`, `rc.passiv-praesens-2`, `rc.konj2-vergangenheit-2`. §7 lists which `<level>/rule-cards.json` must hold each card. The cards are written later, per level. Until they exist, REF-01 only checks the format of these ids. |
| `inventory` | `gz-a1` / `gz-a2` per memo 06 F2 (Goethe SD1 Prüfungsziele pp. 100–106; Fit in Deutsch 2 pp. 106–109). Items F2 names explicitly are tagged as listed. The A1 basics (Präsens, question types, articles, negation, possessives, Akk/Dat, pronouns, separable verbs) are tagged by inference from the inventory's scope ("Nominativ, Akkusativ und Dativ aller Nomen der Wortliste"). Points whose inventory status is unclear stay untagged: temporal prepositions, *denn*, weather *es*, ordinals, compounds, time phrases. That way GRM-03 can under-check but never fail a correct course. Komparation is `gz-a2` (F2: in Fit 2, not in GZ-A1). |
| `detectors` | `[]` on every point. `registries/detectors.json` belongs to E0-4 and does not exist yet, so REF-01 would not resolve any id written here. §8 item 1 proposes the mapping. |

## 3. GRM checks on this file

All checks were run by script over the JSON, and all pass:

- **GRM-01:** at most two intros per unit, with a productive step counted as an intro. At most one `chunkFrom`
  per unit. The table shows `new/chunk` per unit.
- **GRM-02:** `receptive` ≤ `productive`, `chunkFrom` before `receptive`, and every `contrast` introduced no
  later than the point itself.
- **GRM-03:** every `gz-a1` point is in by a1.2-u12 and every `gz-a2` point by a2.2-u12. The A1.2 Perfekt
  milestones hold: *haben* a1.1-u11 ≤ a1.2-u05, *sein* a1.1-u12 ≤ a1.2-u08, *trennbar/untrennbar/-ieren*
  a1.2-u07 ≤ a1.2-u10. The Goethe A2 Präteritum of *kommen/sagen* is receptive at a2.2-u01, which counts as
  introduced. Productive use follows at b1.1-u01.

| Level | u01 | u02 | u03 | u04 | u05 | u06 | u07 | u08 | u09 | u10 | u11 | u12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a1.1 | 2/1 | 2/1 | 2/0 | 2/1 | 2/1 | 2/1 | 2/0 | 2/1 | 2/0 | 1/0 | 2/1 | 2/1 |
| a1.2 | 2/1 | 2/0 | 2/0 | 2/1 | 1/0 | 2/0 | 2/0 | 2/1 | 2/0 | 2/1 | 2/0 | 0/0 |
| a2.1 | 1/0 | 2/0 | 2/0 | 2/0 | 1/0 | 2/0 | 2/1 | 1/0 | 2/0 | 1/0 | 1/0 | 1/0 |
| a2.2 | 2/0 | 2/0 | 1/0 | 2/0 | 2/0 | 2/0 | 1/1 | 1/0 | 2/0 | 1/0 | 1/0 | 0/0 |
| b1.1 | 2/0 | 1/0 | 1/0 | 1/0 | 2/0 | 1/0 | 1/0 | 2/0 | 2/0 | 1/0 | 1/0 | 1/0 |
| b1.2 | 1/0 | 1/0 | 1/0 | 2/0 | 2/0 | 2/0 | 2/0 | 2/0 | 2/0 | 2/0 | 2/0 | 0/0 |
| b2.1 | 2/0 | 2/0 | 2/0 | 2/1 | 1/0 | 2/0 | 2/0 | 2/0 | 1/0 | 1/0 | 1/1 | 2/0 |
| b2.2 | 1/0 | 1/0 | 1/0 | 1/0 | 2/0 | 1/0 | 2/0 | 0/0 | 2/0 | 2/0 | 1/0 | 0/0 |

## 4. Deviations from the plans

Each item names the point, the unit and what the level's curriculum agent does in its unit specs. The plan files
are not edited: this agent is sole writer of the spine only. Where they disagree, the spine is the registry
position GRM-02 checks.

| # | Point → unit | Plan said | Spine says | Why | Unit spec consequence |
|---|---|---|---|---|---|
| D1 | `g.praesens` → a1.1-u01 | two new points: u01 Präsens Sg. + *sein*, u02 Präsens all persons + *haben* | **one point** at u01; u02's plural persons and *haben* are its named increment, on card `rc.praesens-2` (depth 2) | a1.1-u02 had three new points and u03 three (GRM-01). Memo 06 F3 A1.1 #1/#3 treats Präsens incl. *sein/haben* as one point across L1–2. | u02 lists `g.praesens` under `review` and uses `rc.praesens-2` in its Präsens LS |
| D2 | `g.ja-nein-frage` → **a1.1-u02** | a1.1-u03 | moved one unit earlier | frees u03, which now has Possessiv + Vokalwechsel. Netzwerk neu K2 and Linie 1 K2 place it in the second chapter. u02 is a natural home, since the plan's own negation example *Ich bin nicht Lehrerin* answers a Ja/Nein question. *doch* needs *nicht*, which is new in the same unit. | u02 new: `g.negation-nicht`, `g.ja-nein-frage`; u03 Sprechen Teil 2 cards review it |
| D3 | `g.wortbildung-er-in` → **a1.1-u10** (`chunkFrom` a1.1-u02) | a1.1-u02 new: "Berufe maskulin und feminin: -in" | *Lehrer – Lehrerin* are lexical pairs in u02 (the lexicon's `feminine` field licenses them). The systematic point, *-in* plus *-er* from verbs (*fahren → Fahrer → Fahrerin*), comes at u10. | u02's third new point (GRM-01). u10 was a review unit with no new grammar and has room; *Fahrer/Fahrerin* is its Wortfeld. The Goethe A1 inventory needs *-er* and *-in* as a point (GRM-03), and the plans had *-er* only as vocabulary (A1.2 u02). | u02 lists it as `chunk`. u10 lists it as `new`. A1.2 u02's job nouns and A2.1 u06's "-er Wiederholung" review it. |
| D4 | `g.artikel-genus-plural` → a1.1-u04 | two new points: Artikel/Genus, Plural/Nullartikel | one point | u04 had three new points. Memo 06 F3 A1.1 #5 treats articles, gender and plural as one point. | one LS may carry both, or two LS share the point |
| D5 | `g.zeitangaben-inversion` → a1.1-u07 | two new points: Uhrzeit + Inversion; *und/aber/oder*, *zuerst … dann* | one point: inversion after a time phrase and after *zuerst/dann*, against Position 0 for *und/aber/oder* | u07 had three new points. The connectors are the contrast case of the same word-order rule (error tag `connector-position`). Memo 06 F3 #11 is the placement. | rule card `rc.zeitangaben-inversion` shows both positions |
| D6 | `g.praep-dativ` → a1.2-u01 (`chunkFrom` a1.1-u05) | two new points: Dativ after *mit/zu/bei/von/aus/nach*; *Wo?* + Dativ | one point | a1.2-u01 had three new points with Imperativ *Sie*. Memo 06 F3 A1.2 #1 treats them as one point. | — |
| D7 | `g.konj2-hoeflichkeit` → **a1.2-u07** (`chunkFrom` a1.2-u04) | a1.2-u07 chunk: *Könnten Sie …? Würden Sie …?*. a1.2-u04 and u12 chunks. a2.1-u05 "Wiederholung der Chunks". | **promoted to a point**: the polite formulas *hätte gern, könnten/würden Sie, würde gern*, and later *Wie wäre es mit …?* | The plans review these formulas in a2.1-u05, a2.2-u03 and b1.2-u03, but nothing ever introduced them (§5 E1). The Goethe A1 inventory lists Konjunktiv II "als lexikalische Einheiten". a1.2-u07 had one new point. | a1.2-u07 new: Perfekt trennbar + formulas. a1.2-u12, a2.1-u05, a2.1-u07 (*Wie wäre es mit*), a2.2-u03 and b1.2-u03 list it as `review`. The detector whitelists the formulas from a1.2-u07 and *könnte/wäre…* as grammar only from their own points (§8 item 1). |
| D8 | `g.werden-vollverb` → **a2.2-u04** | a2.2-u02 | moved two units later | a2.2-u02 had three new points. It keeps *wäre/hätte/würde* and the dative reflexive: memo 06 F3 backs both, and *sich etwas wünschen* is the unit's core. *werden* only needs to come before the Passiv (a2.2-u07), and u04 (*Zwischenfälle*: *es wird dunkel, mir wird schlecht*) had one new point. | u02 materials use *werden* only as an infinitive after a modal verb (*Was möchtest du werden?*), never conjugated (*ich werde, sie wird*) |
| D9 | `g.brauchen-zu` → **b1.2-u04** | b1.2-u06 (third new point, flagged in b1-2.md §8 as open) | moved two units earlier | GRM-01. u04 (*Was haben wir beschlossen?*) needs *nicht brauchen … zu* = *nicht müssen* for who does not have to do what. The zu-infinitive is in from b1.1-u07. | u06 new: Passiv Präsens productive + Passiv mit Modalverb. u04 new: Relativsatz *was/wo* + *brauchen … zu*. |
| D10 | chunk budget | several units name two chunks | one `chunkFrom` per unit | GRM-01 | see below |
| D11 | `g.zeitangaben-akkusativ` → a2.1-u07 | new: *von … an, ab, über; jeden/letzten/nächsten* + Akk | label without *ab* | *ab* + time is already `g.temporal-praepositionen` (a1.2-u04), so the plan teaches it twice (§5 E6) | *ab* is review in u07 |
| D12 | `g.konj2-hoeflichkeit` absorbs *Wie wäre es mit …?* | a2.1-u07 chunk "*Wie wäre es mit …?* und *Hast du Lust, … zu …?*" (two targets) | *Wie wäre es mit* is a reviewed formula of D7. u07's one chunk slot is `g.zu-infinitiv` (*Hast du Lust, … zu …?*, `chunkFrom` a2.1-u07). | both forms would otherwise need a chunk slot, and both detectors (Konjunktiv II list, zu-infinitive) are exact | a2.1-u07 `chunk`: `g.zu-infinitiv` |

**D10 in detail.** Here is where each unit's single chunk slot goes (`chunkFrom`) and what happens to the other
chunk(s) the plan names:

- **a1.1-u01** → `g.imperativ-sie`, the plan's receptive chunk (Arbeitsanweisungen). *Ich komme aus der Türkei /
  Wie geht's? / Sprichst du …?* are Redemittel, whitelisted as phrases, not chunk previews. `g.praep-dativ` and
  `g.vokalwechsel` take no chunk slot here.
- **a1.1-u05** → `g.praep-dativ` (*im Wohnzimmer*, productive). The receptive *ein großes Zimmer* in ads is
  glossed receptive input (GRM-04). `g.adj-dekl-unbestimmt` takes its `chunkFrom` at the plan's next receptive
  chunk, a1.2-u10 (*ein netter Mann*).
- **a1.1-u06** → `g.dativverben-pronomen` (*Kannst du mir … geben?*; a1-1.md §9 maps the chunk to *mir* →
  A1.2). The same phrase previews *können* (a1.1-u08) and the Dat + Akk objects (a2.1-u03). Neither takes a
  `chunkFrom`; the phrase is whitelisted whole.
- **a1.1-u08** → `g.muessen-duerfen-man` (*Ich muss arbeiten*). *Gehen wir ins Kino?* (a1-1.md §9) is a Redemittel.
- **a1.2-u08** → `g.komparation` (*gern – lieber – am liebsten*), because the comparison detector is exact. *ans
  Meer, in die Berge* are Redemittel, so `g.wechselpraep` has no `chunkFrom`.
- **a1.2-u12**: the plan's chunk *würde gern / hätte gern* is now a review of `g.konj2-hoeflichkeit` (D7).

## 5. Progression errors found, and the fixes

"A point used as new before it is licensed". None of these changes an intro unit beyond §4. Items E2, E3 and E8
are instructions to the unit authors of those levels.

| # | Where | Finding | Fix |
|---|---|---|---|
| E1 | a2.1-u05 (also a1.2-u12, a2.2-u03, b1.2-u03) | "Höfliche Bitten: *Ich hätte gern … / Könnten Sie …?* (Wiederholung der Chunks aus A1.2)" reviews forms that no point ever introduced. *könnten* belongs to `g.konj2-koennte` (a2.1-u07, two units **later**) and *hätte* to a2.2-u02, and the exact Konjunktiv II detector would block them in a2.1-u05's production lines | D7: `g.konj2-hoeflichkeit` a1.2-u07, so every later "Wiederholung" reviews a licensed point |
| E2 | a1.1-u05 | The plan's fixed phrase *Die Wohnung hat einen Balkon* is a masculine accusative one unit before `g.akkusativ` (a1.1-u06). It would be the unit's second chunk preview, but the slot is taken by *im Wohnzimmer*. | Use objects that are not masculine (*ein Bad, eine Küche, zwei Zimmer*), as the plan itself prescribes for *Ich habe einen Bruder* in u03, or use *einen Balkon* only in glossed receptive input |
| E3 | A2.2 (all units), esp. a2.2-u01 | `g.praeteritum` is **receptive** a2.2-u01 → productive b1.1-u01, yet a2.2-u01's read-aloud model line is *Als ich nach Wien kam, konnte ich kein Wort.* The lexicon-driven Präteritum detector (BLUEPRINT §9.3, exact) blocks full-verb Präteritum in production lines, read-aloud lines, model texts and expected answers | Use *Als ich nach Wien gekommen bin, …* or *Als ich in Wien war, …* (*war/hatte* and modal Präteritum are licensed). The same rule holds for the Passiv (receptive a2.2-u07 → b1.2-u06) in A2.2–B1.1 production, and for Konjunktiv II der Vergangenheit (b1.2-u11 → b2.1-u04) outside the plan's fixed frames |
| E4 | b2.1-u06 / b2.1-u09 (b2-1.md) | The plan says "-bar/-lich als Wortbildung sind seit A1.2 bekannt". A1.2 teaches **-bar** only (`g.wortbildung-ung-bar`, a1.2-u11). *-lich* is first licensed as a suffix inside `g.passiversatz` (b2.1-u06). | No intro change: b2.1-u09's "-bar/-lich: Wiederholung" is valid through b2.1-u06. The b2-1 text needs a documentation fix by its owner. |
| E5 | b2.2-u02, b2-1.md §8 | Both cite *indem* at "b1-2 E10". The continuity pass moved it to b1.2-u08. | `g.indem` intro b1.2-u08. Documentation fix for the plan owners. |
| E6 | a2.1-u07 | *ab* + time is taught as new a second time (first in a1.2-u04) | D11 |
| E7 | b1.1-u06 | The re-teach step "falls A2.2 E5 den attributiven Komparativ nur rezeptiv geführt hat" is moot. `g.komparation-attributiv` is productive at a2.2-u05, and the a2-2 continuity pass dropped the fallback. | b1.1-u06 treats it as review only |
| E8 | a2.1-u06, a2.2-u02 (writing tasks) | The task wording "fragen, ob …" comes before `g.indirekte-frage` (a2.2-u03). This is advisory only: GRM-04 does not cover instructions. | Model texts and expected answers keep direct questions (*Kannst du mich abholen?*) until a2.2-u03 |

## 6. Where the spine (= the plans) differs from BLUEPRINT §2.5 / §2.8

The per-level curriculum agents "convert the W2 draft onto the §2.8 rows" (BLUEPRINT §10.3). They must **not**
move a grammar point against this file. A different placement goes through the spine owner, because GRM-02 reads
the position from here. Every earlier placement below has its written reason (GRM-02).

| Point | BLUEPRINT | Spine | Note |
|---|---|---|---|
| Perfekt *haben* / *sein* / trennbar | chunks A1.1 U11 → A1.2 U5 / U8 / U10 | a1.1-u11 / a1.1-u12 / a1.2-u07 | Earlier. The GRM-03 milestones (≤) hold. Reason: Menschen L11–12 and Schritte 1 L7 end A1.1 with the systematic Perfekt (memo 14 §C A1.1 #11; memo 06 F3 #13 split), and A1.2 then reviews it against *war/hatte* (a1.2-u10). |
| Dativ prepositions / dative verbs | A1.2 U3 / U7 | a1.2-u01 / a1.2-u06 | The prepositions-first order is kept |
| *war/hatte* · Imperativ *Sie* | A1.2 U1 · U4 | a1.2-u02 · a1.2-u01 | — |
| Komparation · Wortbildung | A1.2 U11 · U12 | a1.2-u10 · a1.1-u10 (-er/-in), a1.2-u10 (un-/-los), a1.2-u11 (-ung/-bar) | a1.2-u12 is the transfer unit (the .2 template) |
| *könnte/sollte* | A2.1 U8 | *könnte* a2.1-u07, *sollte* a2.1-u09 | — |
| reflexive Akk | A2.1 U7 | a2.1-u08 | The SCHEMA §15 fixture (A2.1 U7 as the phone unit) resolves against its own `content/course-v2/fixtures/registries/grammar-spine.json` and is unaffected. The live A2.1 phone unit is a2.1-u08. |
| *einer/keiner/welche* | A2.1 U12 | a2.1-u04 | — |
| Präteritum receptive · Passiv receptive | A2.2 U10 · U5 | a2.2-u01 · a2.2-u07 | — |
| Relativsatz Nom/Akk · *wer/was* | A2.2 U9 · B2.1 U5 | a2.2-u09/u10 · b2.1-u07 | — |
| Futur I · *falls* · *um … zu* / zu-Inf. | B1.1 U6 · U2 · U7/U8 | b1.1-u05 · b1.1-u06 · b1.1-u08 / b1.1-u07 | The blueprint row has *um … zu* (U7) **before** the zu-infinitive (U8), a progression error the plans avoid |
| Konj. II unreal · past rec. · past prod. | B1.1 U9 · B1.2 U10 · B2.1 U7 | b1.1-u10 · b1.2-u11 · b2.1-u04 | — |
| two-part connectors | B1.2 U3/U7 | b1.2-u03/u11 | — |
| Konjunktiv I | B2.2 U4 (Einstieg), U8 | b2.2-u01, b2.2-u07 (receptive chunk b2.1-u11) | — |
| Modalpartikeln | B1.2 U12 receptive; B2.2 U9 | b1.2-u05 (`g.modalpartikeln`), b2.2-u03 (`g.modalpartikeln-system`) | two points, because the plans count both as new |
| A1.1 rows | *kein* U4, Akkusativ U5, *es gibt* + Adj. prädikativ U6, *wollen* U8, Vokalwechsel U9 | *kein* + Akkusativ a1.1-u06, Adj. prädikativ a1.1-u05 (*es gibt* is lexical, not a point), *wollen* a1.1-u12, Vokalwechsel a1.1-u03 | Vokalwechsel moved earlier in the a1-1 continuity pass, because u07–u09 need *fährst, schläft, nimmst* |

The other rows differ from the blueprint in unit order only (*dass* a2.1-u03 vs U9, *deshalb* a2.1-u09 vs U8, verbs
with prepositions a2.1-u10 vs U11, Präteritum of the modal verbs a2.1-u11 vs U10, and the B1/B2 orders). The
plans' own Lehrwerk sections log those rows (`<level>.md` §13/§14), and the reconciliation onto the §2.8 rows
must keep this file's intro units or change them through the spine owner.

## 7. Rule-card index (for the per-level `rule-cards.json` authors)

Each card's `spine` field is the point. `depth` 1 is the card of the intro unit; depth 2 is the later step.

| Card | Level file | Depth | Unit | Spine point |
|---|---|---|---|---|
| `rc.verbposition-2` | `a1.1/rule-cards.json` | 1 | a1.1-u01 | `g.verbposition-2` |
| `rc.praesens` | `a1.1/rule-cards.json` | 1 | a1.1-u01 | `g.praesens` |
| `rc.negation-nicht` | `a1.1/rule-cards.json` | 1 | a1.1-u02 | `g.negation-nicht` |
| `rc.ja-nein-frage` | `a1.1/rule-cards.json` | 1 | a1.1-u02 | `g.ja-nein-frage` |
| `rc.praesens-2` | `a1.1/rule-cards.json` | 2 | a1.1-u02 | `g.praesens` |
| `rc.possessiv-mein-dein` | `a1.1/rule-cards.json` | 1 | a1.1-u03 | `g.possessiv-mein-dein` |
| `rc.vokalwechsel` | `a1.1/rule-cards.json` | 1 | a1.1-u03 | `g.vokalwechsel` |
| `rc.artikel-genus-plural` | `a1.1/rule-cards.json` | 1 | a1.1-u04 | `g.artikel-genus-plural` |
| `rc.moechte` | `a1.1/rule-cards.json` | 1 | a1.1-u04 | `g.moechte` |
| `rc.pronomen-er-es-sie` | `a1.1/rule-cards.json` | 1 | a1.1-u05 | `g.pronomen-er-es-sie` |
| `rc.adjektiv-praedikativ` | `a1.1/rule-cards.json` | 1 | a1.1-u05 | `g.adjektiv-praedikativ` |
| `rc.akkusativ` | `a1.1/rule-cards.json` | 1 | a1.1-u06 | `g.akkusativ` |
| `rc.kein` | `a1.1/rule-cards.json` | 1 | a1.1-u06 | `g.kein` |
| `rc.trennbare-verben` | `a1.1/rule-cards.json` | 1 | a1.1-u07 | `g.trennbare-verben` |
| `rc.zeitangaben-inversion` | `a1.1/rule-cards.json` | 1 | a1.1-u07 | `g.zeitangaben-inversion` |
| `rc.koennen` | `a1.1/rule-cards.json` | 1 | a1.1-u08 | `g.koennen` |
| `rc.nicht-position-gern` | `a1.1/rule-cards.json` | 1 | a1.1-u08 | `g.nicht-position-gern` |
| `rc.moegen` | `a1.1/rule-cards.json` | 1 | a1.1-u09 | `g.moegen` |
| `rc.komposita` | `a1.1/rule-cards.json` | 1 | a1.1-u09 | `g.komposita` |
| `rc.wortbildung-er-in` | `a1.1/rule-cards.json` | 1 | a1.1-u10 | `g.wortbildung-er-in` |
| `rc.perfekt-haben` | `a1.1/rule-cards.json` | 1 | a1.1-u11 | `g.perfekt-haben` |
| `rc.zeitangaben-vergangenheit` | `a1.1/rule-cards.json` | 1 | a1.1-u11 | `g.zeitangaben-vergangenheit` |
| `rc.perfekt-sein` | `a1.1/rule-cards.json` | 1 | a1.1-u12 | `g.perfekt-sein` |
| `rc.wollen` | `a1.1/rule-cards.json` | 1 | a1.1-u12 | `g.wollen` |
| `rc.imperativ-sie` | `a1.2/rule-cards.json` | 1 | a1.2-u01 | `g.imperativ-sie` |
| `rc.praep-dativ` | `a1.2/rule-cards.json` | 1 | a1.2-u01 | `g.praep-dativ` |
| `rc.praeteritum-sein-haben` | `a1.2/rule-cards.json` | 1 | a1.2-u02 | `g.praeteritum-sein-haben` |
| `rc.temporal-seit-vor` | `a1.2/rule-cards.json` | 1 | a1.2-u02 | `g.temporal-seit-vor` |
| `rc.muessen-duerfen-man` | `a1.2/rule-cards.json` | 1 | a1.2-u03 | `g.muessen-duerfen-man` |
| `rc.possessiv-sein-ihr` | `a1.2/rule-cards.json` | 1 | a1.2-u03 | `g.possessiv-sein-ihr` |
| `rc.temporal-praepositionen` | `a1.2/rule-cards.json` | 1 | a1.2-u04 | `g.temporal-praepositionen` |
| `rc.ordinalzahlen-datum` | `a1.2/rule-cards.json` | 1 | a1.2-u04 | `g.ordinalzahlen-datum` |
| `rc.sollen` | `a1.2/rule-cards.json` | 1 | a1.2-u05 | `g.sollen` |
| `rc.dativverben-pronomen` | `a1.2/rule-cards.json` | 1 | a1.2-u06 | `g.dativverben-pronomen` |
| `rc.welch-dies` | `a1.2/rule-cards.json` | 1 | a1.2-u06 | `g.welch-dies` |
| `rc.perfekt-trennbar-untrennbar` | `a1.2/rule-cards.json` | 1 | a1.2-u07 | `g.perfekt-trennbar-untrennbar` |
| `rc.konj2-hoeflichkeit` | `a1.2/rule-cards.json` | 1 | a1.2-u07 | `g.konj2-hoeflichkeit` |
| `rc.denn` | `a1.2/rule-cards.json` | 1 | a1.2-u08 | `g.denn` |
| `rc.wetter-es` | `a1.2/rule-cards.json` | 1 | a1.2-u08 | `g.wetter-es` |
| `rc.imperativ-du-ihr` | `a1.2/rule-cards.json` | 1 | a1.2-u09 | `g.imperativ-du-ihr` |
| `rc.akk-personalpronomen` | `a1.2/rule-cards.json` | 1 | a1.2-u09 | `g.akk-personalpronomen` |
| `rc.komparation` | `a1.2/rule-cards.json` | 1 | a1.2-u10 | `g.komparation` |
| `rc.wortbildung-un-los` | `a1.2/rule-cards.json` | 1 | a1.2-u10 | `g.wortbildung-un-los` |
| `rc.praep-akkusativ` | `a1.2/rule-cards.json` | 1 | a1.2-u11 | `g.praep-akkusativ` |
| `rc.wortbildung-ung-bar` | `a1.2/rule-cards.json` | 1 | a1.2-u11 | `g.wortbildung-ung-bar` |
| `rc.weil` | `a2.1/rule-cards.json` | 1 | a2.1-u01 | `g.weil` |
| `rc.wechselpraep` | `a2.1/rule-cards.json` | 1 | a2.1-u02 | `g.wechselpraep` |
| `rc.positionsverben` | `a2.1/rule-cards.json` | 1 | a2.1-u02 | `g.positionsverben` |
| `rc.dass` | `a2.1/rule-cards.json` | 1 | a2.1-u03 | `g.dass` |
| `rc.dat-akk-objekte` | `a2.1/rule-cards.json` | 1 | a2.1-u03 | `g.dat-akk-objekte` |
| `rc.adj-dekl-unbestimmt` | `a2.1/rule-cards.json` | 1 | a2.1-u04 | `g.adj-dekl-unbestimmt` |
| `rc.indefinitpronomen` | `a2.1/rule-cards.json` | 1 | a2.1-u04 | `g.indefinitpronomen` |
| `rc.komparation-2` | `a2.1/rule-cards.json` | 2 | a2.1-u04 | `g.komparation` |
| `rc.adj-dekl-bestimmt` | `a2.1/rule-cards.json` | 1 | a2.1-u05 | `g.adj-dekl-bestimmt` |
| `rc.wenn` | `a2.1/rule-cards.json` | 1 | a2.1-u06 | `g.wenn` |
| `rc.wortbildung-t-kunft` | `a2.1/rule-cards.json` | 1 | a2.1-u06 | `g.wortbildung-t-kunft` |
| `rc.konj2-koennte` | `a2.1/rule-cards.json` | 1 | a2.1-u07 | `g.konj2-koennte` |
| `rc.zeitangaben-akkusativ` | `a2.1/rule-cards.json` | 1 | a2.1-u07 | `g.zeitangaben-akkusativ` |
| `rc.reflexiv-akk` | `a2.1/rule-cards.json` | 1 | a2.1-u08 | `g.reflexiv-akk` |
| `rc.konj2-sollte` | `a2.1/rule-cards.json` | 1 | a2.1-u09 | `g.konj2-sollte` |
| `rc.deshalb` | `a2.1/rule-cards.json` | 1 | a2.1-u09 | `g.deshalb` |
| `rc.verben-praeposition` | `a2.1/rule-cards.json` | 1 | a2.1-u10 | `g.verben-praeposition` |
| `rc.praeteritum-modalverben` | `a2.1/rule-cards.json` | 1 | a2.1-u11 | `g.praeteritum-modalverben` |
| `rc.dat-akk-stellung` | `a2.1/rule-cards.json` | 1 | a2.1-u12 | `g.dat-akk-stellung` |
| `rc.als-temporal` | `a2.2/rule-cards.json` | 1 | a2.2-u01 | `g.als-temporal` |
| `rc.praeteritum` | `a2.2/rule-cards.json` | 1 | a2.2-u01 | `g.praeteritum` |
| `rc.konj2-waere-haette-wuerde` | `a2.2/rule-cards.json` | 1 | a2.2-u02 | `g.konj2-waere-haette-wuerde` |
| `rc.reflexiv-dat` | `a2.2/rule-cards.json` | 1 | a2.2-u02 | `g.reflexiv-dat` |
| `rc.indirekte-frage` | `a2.2/rule-cards.json` | 1 | a2.2-u03 | `g.indirekte-frage` |
| `rc.lokale-praep-weg` | `a2.2/rule-cards.json` | 1 | a2.2-u04 | `g.lokale-praep-weg` |
| `rc.werden-vollverb` | `a2.2/rule-cards.json` | 1 | a2.2-u04 | `g.werden-vollverb` |
| `rc.komparation-attributiv` | `a2.2/rule-cards.json` | 1 | a2.2-u05 | `g.komparation-attributiv` |
| `rc.adj-dekl-nullartikel` | `a2.2/rule-cards.json` | 1 | a2.2-u05 | `g.adj-dekl-nullartikel` |
| `rc.lassen` | `a2.2/rule-cards.json` | 1 | a2.2-u06 | `g.lassen` |
| `rc.trotzdem` | `a2.2/rule-cards.json` | 1 | a2.2-u06 | `g.trotzdem` |
| `rc.passiv-praesens` | `a2.2/rule-cards.json` | 1 | a2.2-u07 | `g.passiv-praesens` |
| `rc.praepositionaladverb` | `a2.2/rule-cards.json` | 1 | a2.2-u08 | `g.praepositionaladverb` |
| `rc.relativsatz-nom` | `a2.2/rule-cards.json` | 1 | a2.2-u09 | `g.relativsatz-nom` |
| `rc.zeitadverbien-erzaehlen` | `a2.2/rule-cards.json` | 1 | a2.2-u09 | `g.zeitadverbien-erzaehlen` |
| `rc.relativsatz-akk` | `a2.2/rule-cards.json` | 1 | a2.2-u10 | `g.relativsatz-akk` |
| `rc.bis-seitdem` | `a2.2/rule-cards.json` | 1 | a2.2-u11 | `g.bis-seitdem` |
| `rc.adjektiv-nomen` | `b1.1/rule-cards.json` | 1 | b1.1-u01 | `g.adjektiv-nomen` |
| `rc.praeteritum-2` | `b1.1/rule-cards.json` | 2 | b1.1-u01 | `g.praeteritum` |
| `rc.n-deklination` | `b1.1/rule-cards.json` | 1 | b1.1-u02 | `g.n-deklination` |
| `rc.relativsatz-dat-praep` | `b1.1/rule-cards.json` | 1 | b1.1-u03 | `g.relativsatz-dat-praep` |
| `rc.obwohl` | `b1.1/rule-cards.json` | 1 | b1.1-u04 | `g.obwohl` |
| `rc.futur1` | `b1.1/rule-cards.json` | 1 | b1.1-u05 | `g.futur1` |
| `rc.vermutung-modalwoerter` | `b1.1/rule-cards.json` | 1 | b1.1-u05 | `g.vermutung-modalwoerter` |
| `rc.falls` | `b1.1/rule-cards.json` | 1 | b1.1-u06 | `g.falls` |
| `rc.zu-infinitiv` | `b1.1/rule-cards.json` | 1 | b1.1-u07 | `g.zu-infinitiv` |
| `rc.um-zu-damit` | `b1.1/rule-cards.json` | 1 | b1.1-u08 | `g.um-zu-damit` |
| `rc.da-kausal` | `b1.1/rule-cards.json` | 1 | b1.1-u08 | `g.da-kausal` |
| `rc.plusquamperfekt` | `b1.1/rule-cards.json` | 1 | b1.1-u09 | `g.plusquamperfekt` |
| `rc.nachdem-bevor` | `b1.1/rule-cards.json` | 1 | b1.1-u09 | `g.nachdem-bevor` |
| `rc.konj2-irreal-gegenwart` | `b1.1/rule-cards.json` | 1 | b1.1-u10 | `g.konj2-irreal-gegenwart` |
| `rc.genitiv` | `b1.1/rule-cards.json` | 1 | b1.1-u11 | `g.genitiv` |
| `rc.praep-genitiv` | `b1.1/rule-cards.json` | 1 | b1.1-u12 | `g.praep-genitiv` |
| `rc.kausaladverbien-naemlich` | `b1.2/rule-cards.json` | 1 | b1.2-u01 | `g.kausaladverbien-naemlich` |
| `rc.partizip-adjektiv` | `b1.2/rule-cards.json` | 1 | b1.2-u02 | `g.partizip-adjektiv` |
| `rc.nicht-nur-sowohl` | `b1.2/rule-cards.json` | 1 | b1.2-u03 | `g.nicht-nur-sowohl` |
| `rc.relativsatz-was-wo` | `b1.2/rule-cards.json` | 1 | b1.2-u04 | `g.relativsatz-was-wo` |
| `rc.brauchen-zu` | `b1.2/rule-cards.json` | 1 | b1.2-u04 | `g.brauchen-zu` |
| `rc.sodass` | `b1.2/rule-cards.json` | 1 | b1.2-u05 | `g.sodass` |
| `rc.modalpartikeln` | `b1.2/rule-cards.json` | 1 | b1.2-u05 | `g.modalpartikeln` |
| `rc.passiv-modalverb` | `b1.2/rule-cards.json` | 1 | b1.2-u06 | `g.passiv-modalverb` |
| `rc.passiv-praesens-2` | `b1.2/rule-cards.json` | 2 | b1.2-u06 | `g.passiv-praesens` |
| `rc.passiv-vergangenheit` | `b1.2/rule-cards.json` | 1 | b1.2-u07 | `g.passiv-vergangenheit` |
| `rc.temporal-waehrend-sobald` | `b1.2/rule-cards.json` | 1 | b1.2-u07 | `g.temporal-waehrend-sobald` |
| `rc.praep-innerhalb-ausserhalb` | `b1.2/rule-cards.json` | 1 | b1.2-u08 | `g.praep-innerhalb-ausserhalb` |
| `rc.indem` | `b1.2/rule-cards.json` | 1 | b1.2-u08 | `g.indem` |
| `rc.je-desto` | `b1.2/rule-cards.json` | 1 | b1.2-u09 | `g.je-desto` |
| `rc.praep-entlang-herum` | `b1.2/rule-cards.json` | 1 | b1.2-u09 | `g.praep-entlang-herum` |
| `rc.statt-ohne` | `b1.2/rule-cards.json` | 1 | b1.2-u10 | `g.statt-ohne` |
| `rc.als-ob` | `b1.2/rule-cards.json` | 1 | b1.2-u10 | `g.als-ob` |
| `rc.weder-entweder-zwar` | `b1.2/rule-cards.json` | 1 | b1.2-u11 | `g.weder-entweder-zwar` |
| `rc.konj2-vergangenheit` | `b1.2/rule-cards.json` | 1 | b1.2-u11 | `g.konj2-vergangenheit` |
| `rc.mittelfeld-angaben` | `b2.1/rule-cards.json` | 1 | b2.1-u01 | `g.mittelfeld-angaben` |
| `rc.negation-system` | `b2.1/rule-cards.json` | 1 | b2.1-u01 | `g.negation-system` |
| `rc.korrelat-es-da` | `b2.1/rule-cards.json` | 1 | b2.1-u02 | `g.korrelat-es-da` |
| `rc.textverweise` | `b2.1/rule-cards.json` | 1 | b2.1-u02 | `g.textverweise` |
| `rc.infinitiv-oder-dass` | `b2.1/rule-cards.json` | 1 | b2.1-u03 | `g.infinitiv-oder-dass` |
| `rc.infinitiv-passiv-perfekt` | `b2.1/rule-cards.json` | 1 | b2.1-u03 | `g.infinitiv-passiv-perfekt` |
| `rc.konj2-bedeutungen` | `b2.1/rule-cards.json` | 1 | b2.1-u04 | `g.konj2-bedeutungen` |
| `rc.konj2-vergangenheit-2` | `b2.1/rule-cards.json` | 2 | b2.1-u04 | `g.konj2-vergangenheit` |
| `rc.einerseits-andererseits` | `b2.1/rule-cards.json` | 1 | b2.1-u05 | `g.einerseits-andererseits` |
| `rc.passiversatz` | `b2.1/rule-cards.json` | 1 | b2.1-u06 | `g.passiversatz` |
| `rc.haben-zu` | `b2.1/rule-cards.json` | 1 | b2.1-u06 | `g.haben-zu` |
| `rc.relativsatz-wer-was` | `b2.1/rule-cards.json` | 1 | b2.1-u07 | `g.relativsatz-wer-was` |
| `rc.relativpronomen-genitiv` | `b2.1/rule-cards.json` | 1 | b2.1-u07 | `g.relativpronomen-genitiv` |
| `rc.nomen-verb-verbindungen` | `b2.1/rule-cards.json` | 1 | b2.1-u08 | `g.nomen-verb-verbindungen` |
| `rc.zustandspassiv` | `b2.1/rule-cards.json` | 1 | b2.1-u08 | `g.zustandspassiv` |
| `rc.wortbildung-adjektive` | `b2.1/rule-cards.json` | 1 | b2.1-u09 | `g.wortbildung-adjektive` |
| `rc.futur2` | `b2.1/rule-cards.json` | 1 | b2.1-u10 | `g.futur2` |
| `rc.redewiedergabe` | `b2.1/rule-cards.json` | 1 | b2.1-u11 | `g.redewiedergabe` |
| `rc.vergleichssaetze` | `b2.1/rule-cards.json` | 1 | b2.1-u12 | `g.vergleichssaetze` |
| `rc.als-irreal` | `b2.1/rule-cards.json` | 1 | b2.1-u12 | `g.als-irreal` |
| `rc.konj1-gegenwart` | `b2.2/rule-cards.json` | 1 | b2.2-u01 | `g.konj1-gegenwart` |
| `rc.dadurch-dass` | `b2.2/rule-cards.json` | 1 | b2.2-u02 | `g.dadurch-dass` |
| `rc.modalpartikeln-system` | `b2.2/rule-cards.json` | 1 | b2.2-u03 | `g.modalpartikeln-system` |
| `rc.konditional-konnektoren` | `b2.2/rule-cards.json` | 1 | b2.2-u04 | `g.konditional-konnektoren` |
| `rc.nominalisierung` | `b2.2/rule-cards.json` | 1 | b2.2-u05 | `g.nominalisierung` |
| `rc.nominalgruppen` | `b2.2/rule-cards.json` | 1 | b2.2-u05 | `g.nominalgruppen` |
| `rc.nomen-adjektiv-praeposition` | `b2.2/rule-cards.json` | 1 | b2.2-u06 | `g.nomen-adjektiv-praeposition` |
| `rc.konj1-vergangenheit` | `b2.2/rule-cards.json` | 1 | b2.2-u07 | `g.konj1-vergangenheit` |
| `rc.modalverben-subjektiv` | `b2.2/rule-cards.json` | 1 | b2.2-u07 | `g.modalverben-subjektiv` |
| `rc.konzessive-konnektoren` | `b2.2/rule-cards.json` | 1 | b2.2-u09 | `g.konzessive-konnektoren` |
| `rc.konsekutiv-adversativ` | `b2.2/rule-cards.json` | 1 | b2.2-u09 | `g.konsekutiv-adversativ` |
| `rc.partizipialattribut` | `b2.2/rule-cards.json` | 1 | b2.2-u10 | `g.partizipialattribut` |
| `rc.partizip-nomen` | `b2.2/rule-cards.json` | 1 | b2.2-u10 | `g.partizip-nomen` |
| `rc.praep-genitiv-formell` | `b2.2/rule-cards.json` | 1 | b2.2-u11 | `g.praep-genitiv-formell` |

## 8. Open issues

1. **Detectors (GRM-04).** `detectors` is `[]` until E0-4 publishes `registries/detectors.json`; then the spine
   owner adds the ids. Proposed mapping from the BLUEPRINT §9.3 rows:

   | §9.3 detector class | Points |
   |---|---|
   | unambiguous subordinators (exact) | `g.weil`, `g.dass`, `g.wenn`, `g.indirekte-frage` (*ob*), `g.obwohl`, `g.nachdem-bevor`, `g.falls`, `g.sodass`, `g.indem`, `g.dadurch-dass` |
   | ambiguous subordinators (heuristic) | `g.als-temporal`, `g.temporal-waehrend-sobald`, `g.bis-seitdem`, `g.um-zu-damit` (*damit*), `g.da-kausal` |
   | two-part connectors (exact) | `g.nicht-nur-sowohl`, `g.weder-entweder-zwar`, `g.je-desto`, `g.einerseits-andererseits` |
   | Konjunktiv II closed list (exact) | `g.moechte` (*möchte*, whitelisted from a1.1-u04), `g.konj2-hoeflichkeit` (the formulas as phrases from a1.2-u07), `g.konj2-koennte`, `g.konj2-sollte`, `g.konj2-waere-haette-wuerde` |
   | Präteritum (lexicon) | `g.praeteritum-sein-haben`, `g.praeteritum-modalverben`, `g.praeteritum` (full verbs; productive only from b1.1-u01) |
   | Perfekt (lexicon) | `g.perfekt-haben`, `g.perfekt-sein`, `g.perfekt-trennbar-untrennbar` |
   | Passiv | `g.passiv-praesens` (productive b1.2-u06), `g.passiv-modalverb`, `g.passiv-vergangenheit` (*worden*, exact), `g.zustandspassiv` |
   | Futur | `g.futur1`, `g.futur2` |
   | zu-infinitive (lexicon) | `g.zu-infinitiv`, `g.brauchen-zu`, `g.haben-zu`, `g.statt-ohne` |
   | reflexive (lexicon) | `g.reflexiv-akk` (SCHEMA §15.1: `det.reflexiv-pronomen`), `g.reflexiv-dat` |
   | Genitiv | `g.genitiv`, `g.praep-genitiv`, `g.praep-innerhalb-ausserhalb`, `g.praep-genitiv-formell` |
   | relative clause | `g.relativsatz-nom`, `-akk`, `-dat-praep`, `-was-wo`, `-wer-was`, `g.relativpronomen-genitiv` |
   | imperative du/ihr | `g.imperativ-du-ihr` |
   | attributive adjective endings | `g.adj-dekl-unbestimmt`, `g.adj-dekl-bestimmt`, `g.adj-dekl-nullartikel` |
   | comparison (exact) | `g.komparation` (*am -sten* regular only from a2.1-u04, card `rc.komparation-2`), `g.komparation-attributiv` |
   | Konjunktiv I, extended participle (advisory) | `g.konj1-gegenwart`, `g.konj1-vergangenheit`, `g.partizipialattribut` |

   The detector needs **form-level** scope in two places. The comparison detector must let *am besten / am
   liebsten* through from a1.2-u10, but regular *am -sten* only from a2.1-u04. The Konjunktiv II detector must
   let the D7 formulas through as phrases from a1.2-u07, but free *könnte / wäre / hätte / würde* only from
   their own points.
2. **REF-01 on unit ids.** The spine references units in all eight levels. Once the first unit file is indexed,
   the checker treats the `unit` kind as loaded, and every intro in a level not yet authored fails REF-01. The
   E0-1/E0-2 owners should resolve spine intros against the plans' unit lists (or a stub file), not only against
   authored units.
3. **Consensus and placement uncertainty.** These labels are inherited from memos 06 and 14: the Sicher!
   aktuell B2 L1–6 mapping is (unverified); the Netzwerk neu chapters come via the Bard syllabus; Menschen B1
   L19–21 for *sodass* and the Modalpartikeln is (unverified); `g.als-irreal` cites `As B2` without a chapter;
   `g.redewiedergabe` and `g.werden-vollverb` are plan designs (`single`).
4. **Error-tag gaps.** The SCHEMA §3.1 enum has no value for Mittelfeld order, negation or verb conjugation.
   b2-1.md §8 wants a Mittelfeld tag from B2.1. That is a SCHEMA owner decision. Until then
   `g.mittelfeld-angaben` carries `v2-inv` and the negation points carry no tag.
5. **Plan texts not updated.** D1–D12 and E4/E5 mean the plan files (`a1-1`, `a1-2`, `a2-1`, `a2-2`, `b1-2`,
   `b2-1`, `b2-2` .md/.json) differ from the spine in the places listed. The level curriculum agents follow the
   spine in the unit specs. The plan owners may fix the text.
6. **Inventory tags** on the A1 basics are inferred (§2), and the paid Goethe A2/B1 inventories were not read
   (memo 06 open question 3).
7. **A1.1 load.** After D1–D5, A1.1 has 23 points in 12 units: 11 units carry two, and u10 carries one. That is
   well above memo 06 implication 1 (11–15 points per half-level). GRM-01 holds, but the W4 DaF review should
   watch u02 (Präsens increment + *nicht* + Ja/Nein) and u07 (the widest merged point).

## Appendix: point index (point id → level / unit)

Intro = `receptive` (→ `productive` where different). *Plan item* cites the plan unit and the position of the
item in its `grammar` array.

### A1.1

| Point | Intro | chunkFrom | Contrast | Consensus | Plan item |
|---|---|---|---|---|---|
| `g.verbposition-2` | a1.1-u01 | — | — | strong | a1.1-u01 #1 |
| `g.praesens` | a1.1-u01 | — | — | strong | a1.1-u01 #2 (Singular + sein) + a1.1-u02 #1 (alle Personen + haben) — MERGED |
| `g.negation-nicht` | a1.1-u02 | — | — | strong | a1.1-u02 #2 |
| `g.ja-nein-frage` | a1.1-u02 | — | `g.verbposition-2` | strong | a1.1-u03 #2 — MOVED to a1.1-u02 |
| `g.possessiv-mein-dein` | a1.1-u03 | — | — | strong | a1.1-u03 #1 |
| `g.vokalwechsel` | a1.1-u03 | — | `g.praesens` | strong | a1.1-u03 #3 |
| `g.artikel-genus-plural` | a1.1-u04 | — | `g.possessiv-mein-dein` | strong | a1.1-u04 #1 (Artikel, Genus) + a1.1-u04 #2 (Plural, Nullartikel) — MERGED |
| `g.moechte` | a1.1-u04 | — | — | strong | a1.1-u04 #3 |
| `g.pronomen-er-es-sie` | a1.1-u05 | — | `g.artikel-genus-plural` | strong | a1.1-u05 #1 |
| `g.adjektiv-praedikativ` | a1.1-u05 | — | — | majority | a1.1-u05 #2 |
| `g.akkusativ` | a1.1-u06 | a1.1-u04 | `g.artikel-genus-plural` | strong | a1.1-u06 #1; chunk „Ich möchte einen Kaffee“ in a1.1-u04 |
| `g.kein` | a1.1-u06 | — | `g.negation-nicht` | strong | a1.1-u06 #2 |
| `g.trennbare-verben` | a1.1-u07 | — | `g.verbposition-2` | strong | a1.1-u07 #1 |
| `g.zeitangaben-inversion` | a1.1-u07 | — | `g.verbposition-2` | strong | a1.1-u07 #2 (Uhrzeit, Inversion) + a1.1-u07 #3 (und/aber/oder, zuerst … dann) — MERGED |
| `g.koennen` | a1.1-u08 | — | `g.trennbare-verben` | strong | a1.1-u08 #1 |
| `g.nicht-position-gern` | a1.1-u08 | — | `g.negation-nicht` | majority | a1.1-u08 #2 |
| `g.moegen` | a1.1-u09 | — | `g.moechte` | strong | a1.1-u09 #1 |
| `g.komposita` | a1.1-u09 | — | `g.artikel-genus-plural` | single | a1.1-u09 #3 |
| `g.wortbildung-er-in` | a1.1-u10 | a1.1-u02 | `g.komposita` | single | a1.1-u02 #3 (-in) — DEMOTED to chunk in a1.1-u02, systematic point (with -er, A1.2 u02 vocabulary) MOVED to a1.1-u10 |
| `g.perfekt-haben` | a1.1-u11 | — | `g.koennen` | split | a1.1-u11 #1 |
| `g.zeitangaben-vergangenheit` | a1.1-u11 | — | `g.zeitangaben-inversion` | single | a1.1-u11 #2 |
| `g.perfekt-sein` | a1.1-u12 | — | `g.perfekt-haben` | split | a1.1-u12 #1 |
| `g.wollen` | a1.1-u12 | — | `g.moechte` | split | a1.1-u12 #2 |

### A1.2

| Point | Intro | chunkFrom | Contrast | Consensus | Plan item |
|---|---|---|---|---|---|
| `g.imperativ-sie` | a1.2-u01 | a1.1-u01 | `g.ja-nein-frage` | split | a1.2-u01 #3; receptive chunk (Arbeitsanweisungen) in a1.1-u01 |
| `g.praep-dativ` | a1.2-u01 | a1.1-u05 | `g.akkusativ` | strong | a1.2-u01 #1 (mit/zu/bei/von/aus/nach) + a1.2-u01 #2 (Wo? + Dativ) — MERGED; chunks „im Wohnzimmer“ a1.1-u05, „mit dem Zug“ a1.1-u10 |
| `g.praeteritum-sein-haben` | a1.2-u02 | a1.1-u11 | `g.perfekt-haben` | majority | a1.2-u02 #1; chunk „Wie war …? – Es war super.“ in a1.1-u11 |
| `g.temporal-seit-vor` | a1.2-u02 | a1.1-u12 | `g.zeitangaben-vergangenheit` | strong | a1.2-u02 #2; chunk „seit drei Monaten“ in a1.1-u12 |
| `g.muessen-duerfen-man` | a1.2-u03 | a1.1-u08 | `g.koennen` | strong | a1.2-u03 #1; chunk „Ich muss arbeiten“ in a1.1-u08 |
| `g.possessiv-sein-ihr` | a1.2-u03 | — | `g.possessiv-mein-dein` | strong | a1.2-u03 #2 |
| `g.temporal-praepositionen` | a1.2-u04 | — | `g.temporal-seit-vor` | strong | a1.2-u04 #1 |
| `g.ordinalzahlen-datum` | a1.2-u04 | — | `g.zeitangaben-inversion` | majority | a1.2-u04 #2 |
| `g.sollen` | a1.2-u05 | — | `g.muessen-duerfen-man` | strong | a1.2-u05 #1 |
| `g.dativverben-pronomen` | a1.2-u06 | a1.1-u06 | `g.akkusativ` | strong | a1.2-u06 #1; chunks „Kannst du mir … geben?“ a1.1-u06, „Mir tut der Kopf weh“ a1.2-u05 |
| `g.welch-dies` | a1.2-u06 | — | `g.artikel-genus-plural` | split | a1.2-u06 #2 |
| `g.perfekt-trennbar-untrennbar` | a1.2-u07 | — | `g.perfekt-haben` | majority | a1.2-u07 #1 |
| `g.konj2-hoeflichkeit` | a1.2-u07 | a1.2-u04 | `g.moechte` | majority | a1.2-u07 #2 (chunk) — PROMOTED to a point (Goethe-A1-Inventar: Konjunktiv II als lexikalische Einheiten); chunk „Ich hätte gern einen Termin“ a1.2-u04; reviewed a1.2-u12, a2.1-u05, a2.1-u07 („Wie wäre es mit …?“), a2.2-u03, b1.2-u03 |
| `g.denn` | a1.2-u08 | — | `g.zeitangaben-inversion` | strong | a1.2-u08 #1 |
| `g.wetter-es` | a1.2-u08 | — | `g.pronomen-er-es-sie` | single | a1.2-u08 #2 |
| `g.imperativ-du-ihr` | a1.2-u09 | — | `g.imperativ-sie` | strong | a1.2-u09 #1 |
| `g.akk-personalpronomen` | a1.2-u09 | — | `g.dativverben-pronomen` | majority | a1.2-u09 #2 |
| `g.komparation` | a1.2-u10 | a1.2-u08 | `g.adjektiv-praedikativ` | split | a1.2-u10 #1; chunk „gern – lieber – am liebsten“ a1.2-u08; increment am -(e)sten a2.1-u04 |
| `g.wortbildung-un-los` | a1.2-u10 | — | `g.negation-nicht` | single | a1.2-u10 #2 |
| `g.praep-akkusativ` | a1.2-u11 | — | `g.praep-dativ` | single | a1.2-u11 #1 |
| `g.wortbildung-ung-bar` | a1.2-u11 | — | `g.wortbildung-un-los` | single | a1.2-u11 #2 |

### A2.1

| Point | Intro | chunkFrom | Contrast | Consensus | Plan item |
|---|---|---|---|---|---|
| `g.weil` | a2.1-u01 | — | `g.denn` | strong | a2.1-u01 #1 |
| `g.wechselpraep` | a2.1-u02 | — | `g.praep-dativ` | majority | a2.1-u02 #1 |
| `g.positionsverben` | a2.1-u02 | — | `g.wechselpraep` | majority | a2.1-u02 #2 |
| `g.dass` | a2.1-u03 | — | `g.weil` | strong | a2.1-u03 #1 |
| `g.dat-akk-objekte` | a2.1-u03 | — | `g.dativverben-pronomen` | split | a2.1-u03 #2 |
| `g.adj-dekl-unbestimmt` | a2.1-u04 | a1.2-u10 | `g.adjektiv-praedikativ` | split | a2.1-u04 #1; receptive chunks „ein großes Zimmer“ a1.1-u05, „ein netter Mann“ a1.2-u10 |
| `g.indefinitpronomen` | a2.1-u04 | — | `g.kein` | split | a2.1-u04 #2 |
| `g.adj-dekl-bestimmt` | a2.1-u05 | — | `g.adj-dekl-unbestimmt` | split | a2.1-u05 #1 |
| `g.wenn` | a2.1-u06 | — | `g.weil` | strong | a2.1-u06 #1 |
| `g.wortbildung-t-kunft` | a2.1-u06 | — | `g.wortbildung-ung-bar` | single | a2.1-u06 #2 |
| `g.konj2-koennte` | a2.1-u07 | — | `g.konj2-hoeflichkeit` | strong | a2.1-u07 #1 |
| `g.zeitangaben-akkusativ` | a2.1-u07 | — | `g.temporal-praepositionen` | single | a2.1-u07 #3 („ab“ is review from a1.2-u04) |
| `g.reflexiv-akk` | a2.1-u08 | — | `g.akk-personalpronomen` | strong | a2.1-u08 #1 |
| `g.konj2-sollte` | a2.1-u09 | — | `g.konj2-koennte` | strong | a2.1-u09 #1 |
| `g.deshalb` | a2.1-u09 | — | `g.weil` | split | a2.1-u09 #2 |
| `g.verben-praeposition` | a2.1-u10 | — | `g.wechselpraep` | split | a2.1-u10 #1 |
| `g.praeteritum-modalverben` | a2.1-u11 | — | `g.konj2-koennte` | majority | a2.1-u11 #1 |
| `g.dat-akk-stellung` | a2.1-u12 | — | `g.dat-akk-objekte` | split | a2.1-u12 #1 |

### A2.2

| Point | Intro | chunkFrom | Contrast | Consensus | Plan item |
|---|---|---|---|---|---|
| `g.als-temporal` | a2.2-u01 | — | `g.wenn` | split | a2.2-u01 #1 |
| `g.praeteritum` | a2.2-u01 → b1.1-u01 | — | `g.perfekt-haben` | split | a2.2-u01 #2 (receptive) + b1.1-u01 #1 (productive) |
| `g.konj2-waere-haette-wuerde` | a2.2-u02 | — | `g.konj2-koennte` | majority | a2.2-u02 #1 |
| `g.reflexiv-dat` | a2.2-u02 | — | `g.reflexiv-akk` | single | a2.2-u02 #2 |
| `g.indirekte-frage` | a2.2-u03 | — | `g.wenn` | strong | a2.2-u03 #1 |
| `g.lokale-praep-weg` | a2.2-u04 | a1.2-u01 | `g.wechselpraep` | strong | a2.2-u04 #1; receptive chunk „gegenüber, an … vorbei“ in a1.2-u01 |
| `g.werden-vollverb` | a2.2-u04 | — | `g.konj2-waere-haette-wuerde` | single | a2.2-u02 #3 — MOVED to a2.2-u04 (GRM-01) |
| `g.komparation-attributiv` | a2.2-u05 | — | `g.komparation` | split | a2.2-u05 #1 |
| `g.adj-dekl-nullartikel` | a2.2-u05 | — | `g.adj-dekl-bestimmt` | split | a2.2-u05 #2 |
| `g.lassen` | a2.2-u06 | — | `g.muessen-duerfen-man` | majority | a2.2-u06 #1 |
| `g.trotzdem` | a2.2-u06 | — | `g.deshalb` | majority | a2.2-u06 #2 |
| `g.passiv-praesens` | a2.2-u07 → b1.2-u06 | — | `g.werden-vollverb` | split | a2.2-u07 #1 (receptive) + b1.2-u06 #1 (productive) |
| `g.praepositionaladverb` | a2.2-u08 | — | `g.verben-praeposition` | majority | a2.2-u08 #1 |
| `g.relativsatz-nom` | a2.2-u09 | — | `g.artikel-genus-plural` | split | a2.2-u09 #1 |
| `g.zeitadverbien-erzaehlen` | a2.2-u09 | — | `g.zeitangaben-inversion` | majority | a2.2-u09 #3 |
| `g.relativsatz-akk` | a2.2-u10 | — | `g.relativsatz-nom` | split | a2.2-u10 #1 |
| `g.bis-seitdem` | a2.2-u11 | — | `g.temporal-seit-vor` | split | a2.2-u11 #1 |

### B1.1

| Point | Intro | chunkFrom | Contrast | Consensus | Plan item |
|---|---|---|---|---|---|
| `g.adjektiv-nomen` | b1.1-u01 | — | `g.adj-dekl-bestimmt` | split | b1.1-u01 #2 |
| `g.n-deklination` | b1.1-u02 | — | `g.akkusativ` | split | b1.1-u02 #1 |
| `g.relativsatz-dat-praep` | b1.1-u03 | — | `g.relativsatz-akk` | majority | b1.1-u03 #1 |
| `g.obwohl` | b1.1-u04 | — | `g.trotzdem` | strong | b1.1-u04 #1 |
| `g.futur1` | b1.1-u05 | — | `g.werden-vollverb` | majority | b1.1-u05 #1 |
| `g.vermutung-modalwoerter` | b1.1-u05 | — | `g.futur1` | majority | b1.1-u05 #2 |
| `g.falls` | b1.1-u06 | — | `g.wenn` | split | b1.1-u06 #1 |
| `g.zu-infinitiv` | b1.1-u07 | a2.1-u07 | `g.koennen` | strong | b1.1-u07 #1; chunk „Hast du Lust, … zu …?“ in a2.1-u07 |
| `g.um-zu-damit` | b1.1-u08 | — | `g.weil` | split | b1.1-u08 #1 |
| `g.da-kausal` | b1.1-u08 | — | `g.weil` | split | b1.1-u08 #2 |
| `g.plusquamperfekt` | b1.1-u09 | — | `g.praeteritum` | split | b1.1-u09 #1 |
| `g.nachdem-bevor` | b1.1-u09 | — | `g.als-temporal` | split | b1.1-u09 #2 |
| `g.konj2-irreal-gegenwart` | b1.1-u10 | — | `g.wenn` | majority | b1.1-u10 #1 |
| `g.genitiv` | b1.1-u11 | — | `g.praep-dativ` | strong | b1.1-u11 #1 |
| `g.praep-genitiv` | b1.1-u12 | — | `g.weil` | strong | b1.1-u12 #1 |

### B1.2

| Point | Intro | chunkFrom | Contrast | Consensus | Plan item |
|---|---|---|---|---|---|
| `g.kausaladverbien-naemlich` | b1.2-u01 | — | `g.deshalb` | majority | b1.2-u01 #1 |
| `g.partizip-adjektiv` | b1.2-u02 | — | `g.adj-dekl-bestimmt` | strong | b1.2-u02 #1 |
| `g.nicht-nur-sowohl` | b1.2-u03 | — | `g.zeitangaben-inversion` | majority | b1.2-u03 #1 |
| `g.relativsatz-was-wo` | b1.2-u04 | — | `g.relativsatz-dat-praep` | strong | b1.2-u04 #1 |
| `g.brauchen-zu` | b1.2-u04 | — | `g.muessen-duerfen-man` | strong | b1.2-u06 #3 — MOVED to b1.2-u04 (GRM-01) |
| `g.sodass` | b1.2-u05 | — | `g.deshalb` | majority | b1.2-u05 #1 |
| `g.modalpartikeln` | b1.2-u05 | — | `g.imperativ-sie` | split | b1.2-u05 #2 |
| `g.passiv-modalverb` | b1.2-u06 | — | `g.passiv-praesens` | strong | b1.2-u06 #2 |
| `g.passiv-vergangenheit` | b1.2-u07 | — | `g.passiv-praesens` | strong | b1.2-u07 #1 |
| `g.temporal-waehrend-sobald` | b1.2-u07 | — | `g.praep-genitiv` | majority | b1.2-u07 #2 |
| `g.praep-innerhalb-ausserhalb` | b1.2-u08 | — | `g.praep-genitiv` | strong | b1.2-u08 #1 |
| `g.indem` | b1.2-u08 | — | `g.um-zu-damit` | majority | b1.2-u08 #2 |
| `g.je-desto` | b1.2-u09 | — | `g.komparation` | strong | b1.2-u09 #1 |
| `g.praep-entlang-herum` | b1.2-u09 | — | `g.lokale-praep-weg` | strong | b1.2-u09 #2 |
| `g.statt-ohne` | b1.2-u10 | — | `g.um-zu-damit` | majority | b1.2-u10 #1 |
| `g.als-ob` | b1.2-u10 | — | `g.konj2-irreal-gegenwart` | majority | b1.2-u10 #2 |
| `g.weder-entweder-zwar` | b1.2-u11 | — | `g.nicht-nur-sowohl` | majority | b1.2-u11 #1 |
| `g.konj2-vergangenheit` | b1.2-u11 → b2.1-u04 | — | `g.konj2-irreal-gegenwart` | split | b1.2-u11 #2 (receptive, fixed frames) + b2.1-u04 #1 (productive, auch mit Modalverb) |

### B2.1

| Point | Intro | chunkFrom | Contrast | Consensus | Plan item |
|---|---|---|---|---|---|
| `g.mittelfeld-angaben` | b2.1-u01 | — | `g.dat-akk-stellung` | strong | b2.1-u01 #1 |
| `g.negation-system` | b2.1-u01 | — | `g.nicht-position-gern` | strong | b2.1-u01 #3 |
| `g.korrelat-es-da` | b2.1-u02 | — | `g.praepositionaladverb` | majority | b2.1-u02 #1 |
| `g.textverweise` | b2.1-u02 | — | `g.korrelat-es-da` | split | b2.1-u02 #2 |
| `g.infinitiv-oder-dass` | b2.1-u03 | — | `g.zu-infinitiv` | strong | b2.1-u03 #1 |
| `g.infinitiv-passiv-perfekt` | b2.1-u03 | — | `g.passiv-modalverb` | majority | b2.1-u03 #2 |
| `g.konj2-bedeutungen` | b2.1-u04 | — | `g.konj2-vergangenheit` | single | b2.1-u04 #2 |
| `g.einerseits-andererseits` | b2.1-u05 | — | `g.weder-entweder-zwar` | strong | b2.1-u05 #1 |
| `g.passiversatz` | b2.1-u06 | — | `g.passiv-modalverb` | split | b2.1-u06 #1 |
| `g.haben-zu` | b2.1-u06 | — | `g.passiversatz` | single | b2.1-u06 #3 |
| `g.relativsatz-wer-was` | b2.1-u07 | — | `g.relativsatz-was-wo` | split | b2.1-u07 #1 |
| `g.relativpronomen-genitiv` | b2.1-u07 | — | `g.relativsatz-dat-praep` | single | b2.1-u07 #2 |
| `g.nomen-verb-verbindungen` | b2.1-u08 | a2.2-u07 | `g.verben-praeposition` | strong | b2.1-u08 #1; chunks „einen Antrag stellen“ a2.2-u07, „Widerspruch einlegen“ b1.2-u08 |
| `g.zustandspassiv` | b2.1-u08 | — | `g.passiv-praesens` | split | b2.1-u08 #2 |
| `g.wortbildung-adjektive` | b2.1-u09 | — | `g.wortbildung-ung-bar` | single | b2.1-u09 #2 |
| `g.futur2` | b2.1-u10 | — | `g.futur1` | single | b2.1-u10 #1 |
| `g.redewiedergabe` | b2.1-u11 | — | `g.dass` | single | b2.1-u11 #1 |
| `g.vergleichssaetze` | b2.1-u12 | — | `g.komparation` | majority | b2.1-u12 #1 |
| `g.als-irreal` | b2.1-u12 | — | `g.als-ob` | single | b2.1-u12 #2 |

### B2.2

| Point | Intro | chunkFrom | Contrast | Consensus | Plan item |
|---|---|---|---|---|---|
| `g.konj1-gegenwart` | b2.2-u01 | b2.1-u11 | `g.redewiedergabe` | strong | b2.2-u01 #1; receptive chunk „sei, habe, werde, gebe“ in b2.1-u11 |
| `g.dadurch-dass` | b2.2-u02 | — | `g.indem` | strong | b2.2-u02 #1 |
| `g.modalpartikeln-system` | b2.2-u03 | — | `g.modalpartikeln` | single | b2.2-u03 #1 |
| `g.konditional-konnektoren` | b2.2-u04 | — | `g.falls` | strong | b2.2-u04 #1 |
| `g.nominalisierung` | b2.2-u05 | — | `g.praep-genitiv` | strong | b2.2-u05 #1 |
| `g.nominalgruppen` | b2.2-u05 | — | `g.genitiv` | strong | b2.2-u05 #2 |
| `g.nomen-adjektiv-praeposition` | b2.2-u06 | — | `g.verben-praeposition` | strong | b2.2-u06 #1 |
| `g.konj1-vergangenheit` | b2.2-u07 | — | `g.konj1-gegenwart` | strong | b2.2-u07 #1 |
| `g.modalverben-subjektiv` | b2.2-u07 | — | `g.vermutung-modalwoerter` | single | b2.2-u07 #2 |
| `g.konzessive-konnektoren` | b2.2-u09 | — | `g.obwohl` | strong | b2.2-u09 #1 |
| `g.konsekutiv-adversativ` | b2.2-u09 | — | `g.sodass` | strong | b2.2-u09 #2 |
| `g.partizipialattribut` | b2.2-u10 | — | `g.partizip-adjektiv` | strong | b2.2-u10 #1 |
| `g.partizip-nomen` | b2.2-u10 | — | `g.adjektiv-nomen` | strong | b2.2-u10 #2 |
| `g.praep-genitiv-formell` | b2.2-u11 | b2.1-u04 | `g.praep-genitiv` | strong | b2.2-u11 #1; chunk „aufgrund der Mängel“ in b2.1-u04 |
