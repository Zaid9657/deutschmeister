# Wave 4 PR D1 — Goethe-Zertifikat A2 exam identity: author's notes

Deliverables in `S/wave4/exam/`:

| File | What it is |
| --- | --- |
| `goethe-a2.js` | Guide module → `astro-site/src/data/guides/goethe-a2.js` |
| `examTracks.entry.js` | The `goethe_a2` literal → **both** copies of `examTracks.js` |
| `hub-copy.js` | `HUB_COPY.goethe_a2` → `astro-site/src/data/exams/index.js` |
| `writingTasks.goethe-a2.js` | 4 tasks → **both** copies of the writing bank |
| `verify.mjs` | Hand-mirrored guard suite; `node verify.mjs` → PASS |

`node --check` passes on all five `.js`/`.mjs` files. `node verify.mjs` exits **0 with no
warnings** after round 2. Round-2 changes and the reply to `review-1.md` are in **§6**; the single
line the integrator must apply is in **§7**.

---

## 1. The verified fact table

Everything the guide, the hub copy and the writing tasks state about the exam.
`factsCheckedOn: '2026-09-05'`.

| Prüfungsteil | Dauer | Teile / Aufgaben | Punkte |
| --- | --- | --- | --- |
| Lesen | 30 Min. | 4 Teile, 20 Aufgaben (5 je Teil; Teile 1–3 Mehrfachauswahl, Teil 4 Zuordnung) | 25 |
| Hören | ca. 30 Min. | 4 Teile, 20 Aufgaben (Teile 1, 3, 4 zweimal; **Teil 2 nur einmal**) | 25 |
| Schreiben | 30 Min. | 2 Teile: SMS 20–30 Wörter / E-Mail 30–40 Wörter, je 3 Leitpunkte | 25 |
| Sprechen | ca. 15 Min. für 2 Teilnehmende | 3 Teile, Paarprüfung, ohne Vorbereitungszeit | 25 |

* Schriftliche Prüfung (Lesen + Hören + Schreiben): **90 Minuten ohne Pause, 75 Punkte**.
* Gesamt: **100 Punkte**.
* Umrechnung in den schriftlichen Teilen: **20 Messpunkte × 1,25 = 25 Prüfungspunkte**. Lesen und
  Hören have 20 countable answers; **Schreiben and Sprechen are criterion-rated** (Aufgaben-
  erfüllung / kommunikative Gestaltung / sprachliche Korrektheit), not scored by counting.
* Erreichen zum Studium (for the Ausbildung/Studium aside): DSH-2 or TestDaF 4×TDN 4 per the
  HRK Rahmenordnung — far above B2.
* Vorbereitungsdauer: Goethe rechnet mit **200–350 Unterrichtseinheiten à 45 Min.** bis A2 (from 0).
* Teilwiederholung: **nur in Ausnahmefällen** und nur, wenn die organisatorischen Bedingungen am
  Prüfungszentrum es zulassen (DFB) — round 1 could not resolve this; round 2 could.
* **Pass rule (the whole point of the guide):** at least **60 of 100** overall **and** at
  least **45 of 75** in the written parts **and** at least **15 of 25** in Sprechen, and all
  parts must have been sat. Missing either sub-threshold fails the *entire* exam.
* Erwachsenenfassung: **16 Jahre empfohlen — there is no minimum age**; the DFB states the exams
  "können unabhängig vom Erreichen eines Mindestalters … abgelegt werden". Below 16, *Fit in Deutsch*.
* The exam replaced the older *Start Deutsch 2*.
* Free material: Modellsatz + Übungssatz 01 Erwachsene (Kandidatenblätter, Lösungen,
  Audios) and the **Wortliste A2, ~1.300 lexikalische Einheiten**.
* Aufenthaltsrecht: **§ 25a** and **§ 25b AufenthG** name A2 explicitly, and only for
  *hinreichende **mündliche** Deutschkenntnisse*. § 20a (Chancenkarte) asks only for
  "einfache deutsche Sprachkenntnisse"; A2 scores in the Punktetabelle of the Anlage zu
  § 20b. Nothing beyond that is claimed.

---

## 2. Sources table — opened vs. blocked

**Read this first: not one URL below was opened by me.** `goethe.de` is blocked as the
brief warned, and in this sandbox **`WebFetch` is blocked for *every* domain** — I tested
`upad.it`, `klett-sprachen.de`, `cornelsen.de`, `germantoenglish.de`, `zertifly.com`,
`faustacademy.com`, `swiss-exams.ch`, `vhs-saar.de`, `german-institute.org` and even
`de.wikipedia.org`; all returned `EGRESS_BLOCKED`. `curl` through `$HTTPS_PROXY` returns
`CONNECT tunnel failed, 403` for the same hosts. So every figure was established through
**retrieval channels that fetch server-side**: `WebSearch` (which returns extracted page
text), the Firecrawl index (which returned page bodies as descriptions), and a Perplexity
grounding run — including one **restricted to non-goethe.de domains**, so the corroboration
is not just the same PDF three times.

| URL | Opened? | What it confirmed |
| --- | --- | --- |
| `goethe.de/pro/relaunch/prf/en/Durchfuehrungsbestimmungen_A2.pdf` | **blocked** (cited) | Pass rule 60/100 + 45/75 + 15/25, "alle Prüfungsteile abgelegt". Surfaced by WebSearch and Firecrawl; the sentence was quoted back verbatim by two independent channels. |
| `goethe.de/pro/relaunch/prf/materialien/A2/A2_Modellsatz_Erwachsene.pdf` | **blocked** (cited) | Four parts; Lesen/Hören 4 Teile à 20 Aufgaben; Sprechen 3 Teile, Paarprüfung, 15 Min./2 TN, keine Vorbereitungszeit; ab 16 Jahren; replaced Start Deutsch 2. |
| `goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf` | **blocked** (cited) | Existence of the free Übungssatz; "entspricht in Aufgabentypen, Zahl der Aufgaben und Zeitvorgaben der Prüfung"; ab 16 Jahren. |
| `goethe.de/pro/relaunch/prf/de/Goethe-Zertifikat_A2_Wortliste.pdf` | **blocked** (cited) — but its **Vorwort came back verbatim** through the Firecrawl index | "circa 1300 lexikalische Einheiten"; Hueber-Publikation *Prüfungsziele, Testbeschreibung*; thematic + alphabetical structure. Strongest evidence of any single fact here. |
| `goethe.de/ins/de/de/prf/prf/gzsd2/wi2.html` | **blocked** (cited) | Appeared as a live result title ("Weitere Informationen Goethe-Zertifikat A2"), which is what makes the `/ins/de/de/prf/prf/gzsd2/` path safe to cite — the A1 guide's comment records that the `/de/spr/prf/…` form 404s. |
| `bfu.goethe.de/a2_mod_2MX5/{lesen,hoeren,schreiben,sprechen,bedingungen}.php` | **blocked** (not cited) | The Goethe practice-module pages. WebSearch extraction from them gave the per-Teil task types, "Teil 2 nur einmal", Hören Teil 4 = Interview, Aufgaben 16–20 Ja/Nein (⇒ 20 items), and Schreiben "SMS 20–30 Wörter". Not put in `sources[]` because it is a transient practice-app path, not a citable document. |
| `goethe.al/images/PDF/DFB_2023_Goethe-Zertifikat_A2_DE_EN.pdf` | **blocked** (not cited) | Third-party mirror of the Durchführungsbestimmungen — used as the *non-goethe.de* corroboration of the pass rule and the 25/75/100 split. |
| `goethe-kathmandu.edu.np/wp-content/uploads/2022/04/Durchfuehrungsbestimmungen_A2.pdf` | **blocked** (not cited) | Second independent mirror of the same document: 30/30/30 minutes, 90 min. written, points. |
| `vhs-saar.de/…/DFB%202025%20Goethe-Zertifikat%20A2.pdf` | **blocked** (not cited) | A **2025** copy of the Durchführungsbestimmungen — evidence the rules quoted are current, not a 2016 artefact. |
| `upad.it/…/Goethe-Zertifikat-A2-Übersicht.pdf` | **blocked** (not cited) | Overview table "Prüfungsteile · Aufgabenform · Zeit · Punkte max–min". Only its title/description was retrievable. |
| `faustacademy.com/goethe-a2`, `germantoenglish.de/blog/goethe-german-a2-exam-…`, `zertifly.com/en/blog/goethe-a2`, `thelanguageoffice.com/exam-pattern-of-goethe-institut-a2` | **blocked** (not cited) | Independent language-school restatements of 25 points per part / 100 total / 60 overall / 45/75 / 15/25. These are why the pass rule counts as multi-sourced rather than single-sourced. |
| `germanlanguagepractice.com/practice/goethe-a2-modelltest` | **blocked** (not cited) | Independent practice site with 20 Lese- and 20 Höraufgaben — corroborates the item counts from a source with no incentive to copy the DFB. |
| `gesetze-im-internet.de/aufenthg_2004/__25b.html` | **blocked** (cited) | § 25b Abs. 1 S. 2 Nr. 4: "über hinreichende mündliche Deutschkenntnisse im Sinne des Niveaus A2 … verfügt". |
| `gesetze-im-internet.de/aufenthg_2004/__25a.html` | **blocked** (cited) | Same wording for gut integrierte Jugendliche/junge Volljährige. |
| `gesetze-im-internet.de/aufenthg_2004/__20a.html` | **blocked** (not cited) | § 20a Abs. 4 Nr. 2: Chancenkarte asks for "mindestens einfache deutsche Sprachkenntnisse" *or* English B2 — A2 sits in the Anlage zu § 20b, not in § 20a. This is why the guide phrases the Chancenkarte sentence the way it does. |

**Reviewer action:** re-check the five `goethe.de` URLs in `sources[]` with `curl -I` from an
unrestricted network before merge. The A1 guide's header records that two plausible-looking
goethe.de paths 404'd; the same risk applies here. The four PDF paths and `gzsd2/wi2.html`
all came back as live search results, which is the best evidence available from here.

---

## 3. Internal links and their trailing-slash case

| Link | Case | Why |
| --- | --- | --- |
| `/level-test/` | **slash** | Prerendered SPA route (CLAUDE.md case 2). Used twice: lernplan intro + the DeutschMeister section. |
| `/grammar/a2.1/` | **slash** | Astro page (case 1). |
| `/vergleich/` | **slash** | Astro page (case 1). |
| `/level/a2.1` | **no slash** | SPA route served by a `netlify.toml` rewrite to `/app.html` (case 3). This is the A2.1 course area the brief asked the guide to link. |

`verify.mjs` checks all five link occurrences against the same rule table the repo test uses.

> **Integration requirement (will fail CI otherwise):** `tests/guides.test.mjs`'s
> `internal links follow the three trailing-slash cases` knows `NO_SLASH_ROUTES =
> ['/faq','/ueber-uns','/signup','/login','/dashboard','/schreiben','/modelltest']` and a
> `SLASHED_PREFIXES` list. **Neither contains `/level/`**, so `/level/a2.1` currently falls
> through to `"matches no known route shape — add it to this test or fix the link"`. Add
> `'/level/a2.1'` to `NO_SLASH_ROUTES` **in the same PR** — the verbatim line is in §7.
> No other guide links into `/level/`, which is why the gap exists.

---

## 4. Coverage against the brief

* **Guide** — slug `goethe-a2`; title 36 chars; description 155 chars; `answer` 94 words,
  markup-free, and every figure in it also appears in a section (verified mechanically);
  7 sections with the exact ids the brief named; `aufbau` table with the head
  `Teil | Dauer | Aufgaben | Punkte`; `punkte` carries the pass rule; `lernplan` is a
  `steps` block over 8–12 weeks; `fehler` is a `warnings` block (6 items);
  `vorbereitung-mit-deutschmeister` is a `cards` block whose counts are **interpolated from
  `../marketing.js`** (`GRAMMAR_TOPIC_COUNT`, `LISTENING_EXERCISE_COUNT`,
  `READING_LESSON_COUNT`) — no count is typed; 9 FAQ entries (brief asked ≥6); `cta` present;
  ~14 min reading time (repo minimum is 5).
* **Track entry** — `hasMock: false` (there is no `MOCK_EXAMS.goethe_a2`; the flag is pinned
  both ways by `tests/exams.test.mjs`), `hasWriting: true` (unlocked by deliverable 4),
  `courseHref: null` with the PR D2 hand-off noted in the file.
* **Hub copy** — title 46 chars ending `| DeutschMeister`, description 154 chars, plus
  `intro` and `focus` in the voice of the existing entries.
* **Writing tasks** — 4 tasks, `examKey: 'goethe_a2'`; two `sms-…` (informell, 20/40) and
  two `email-…` (halbformell, 30/60); 3 Leitpunkte each; `pointsNote` states the Schreiben
  points **and** both pass thresholds.

### Deliberate exclusions

* **No fee figure anywhere** (CLAUDE.md + `tests/guides.test.mjs` both ban it).
* **No outcome or pass-rate promise**; no "du bestehst". `verify.mjs` runs the repo's own
  `OUTCOME`/`FEE` regexes plus a literal `du bestehst` check.
* **No repetition / Teilwiederholung rule.** Sources contradicted each other (one said the
  whole exam must be retaken, another said partial retakes are possible within a year at the
  same centre). The guide points at the Prüfungszentrum and the Durchführungsbestimmungen
  instead. This is the single biggest thing a reader would want that the guide does not say.
* **No third writing task on "Nachbarn um Hilfe bitten".** The brief listed three scenarios
  for two Teil-2 slots; that one is *informell*, and a Teil-2 task must be halbformell —
  and the repo already has `mitteilung-nachbarn-um-hilfe-bitten` under `goethe_a1`.
  Kursanmeldung and Termin beim Amt were chosen instead.
* **No claim about Ausbildung requirements.** The guide says only that A2 "in aller Regel
  nicht" suffices and that B1/B2 are usually asked — deliberately soft, because I could not
  source a rule, only common practice.
* **No `/listening/…` or `/speaking/` link in the guide.** `buildPath` in the exams module
  already emits those on the hub; adding a second, differently-shaped copy here is how the
  trailing-slash bugs start.
* **No `<em>`.** The renderer styles only `>a` and `>strong` inside `set:html` paragraphs.

---

## 5. The level-constraint boundary (read this, reviewer)

`S/wave4/level-a2.1.md` is binding for **learner-facing German**. I applied it as:

* **`writingTasks.goethe-a2.js` — fully constrained.** Every `title`, `task` and `leitpunkt`
  is producible with A1 + A2.1 topics 1–12, and every sentence is ≤14 words (mechanically
  checked per field, not on a joined blob). Specifically avoided, all banned at A2.1:
  reflexive verbs (so *"Melde dich an"* → `Frag nach der Anmeldung`; *"Stell dich vor"* →
  `Schreib deinen Namen und dein Niveau`; *"Bedank dich"* → `Sag Danke`), infinitive clauses
  with `zu`, `dass`/`weil`-Nebensätze (the existing `goethe_a1` tasks use both — these do
  not), Komparativ, Futur, Genitiv, Präteritum of full verbs. Names are German-keyboard
  typeable (Nina, Jonas).
* **`goethe-a2.js` and `hub-copy.js` — NOT constrained**, and I want that decision on the
  record. These are native marketing/SEO prose for an adult deciding whether to sit an exam,
  and the brief's own instruction is "German, du-form consistent with `start-deutsch-1.js`"
  / "in the voice of the existing entries" — a template that uses Genitiv, relative clauses
  and long periods throughout. A guide written under the A2.1 production constraint would
  read as broken German and would not match any sibling guide. I did keep the register
  deliberately plainer than the A1 guide's (short main clauses, few nested constructions),
  since the reader is an A2 candidate. **If the reviewer disagrees, this is the one thing to
  overturn — it is a judgement call, not an oversight.**

---

## 6. Round 2 changes (2026-09-06) — response to `review-1.md`

Verdict was FAIL: 6 blocking + 1 integration blocker + 15 minor. **All 22 findings addressed.**
`node --check` clean on all five files; `node verify.mjs` PASS, exit 0, no warnings (the round-1
`datePublished` warning is gone — today *is* 2026-09-06). Every blocking finding now has a
regression pin in `verify.mjs`; I proved the pins bite by re-introducing all six defects and
confirming 9 failures, then restoring.

### Blocking

| # | Fix |
| --- | --- |
| 1 | § `punkte` now reads "**20 Messpunkte** × 1,25", separates Lesen/Hören (20 richtige Antworten) from **Schreiben und Sprechen, die nach Kriterien bewertet werden** (Aufgabenerfüllung / kommunikative Gestaltung / sprachliche Korrektheit). The mistranslation is gone. |
| 2 | Age is a **recommendation** everywhere: in `answer` ("empfohlen wird sie ab 16 Jahren, ein Mindestalter gibt es nicht"), in § `ueberblick`, and in the FAQ — whose *question* was reworded from "Ab welchem Alter kann man die Prüfung ablegen?" to "**Für welches Alter ist die Prüfung gedacht?**", because a question presupposing a bar cannot be answered with a recommendation. Re-verified: the DFB wording "unabhängig vom Erreichen eines Mindestalters" came back from a fresh search. |
| 3 | "gegenüber wen?" → "**wem? statt wen?**". Plus the sweep the coordinator asked for: `verify.mjs` now checks every dative-only preposition (aus, bei, mit, nach, seit, von, zu, gegenüber) for accusative complements and every accusative-only preposition (für, ohne, gegen, um, durch) for dative ones, across the whole rendered guide. Clean. |
| 4 | Replaced with a sourced split: **Studium** = DSH-2 / TestDaF 4×TDN 4 per the HRK Rahmenordnung (new source added); **Ausbildung** = set by the Betrieb/Kammer, "frag dort nach". The wrong "meist B1 oder B2" is gone. |
| 5 | "Teil 1 und Teil 2 zählen gleich viel" **deleted from all four `pointsNote`s**. Only the verified 25/100, 45/75 and 15/25 remain. Round 1 flagged this as doubt #4 and shipped it anyway — that was the right diagnosis and the wrong action. |
| 6 | `sms-treffen-verschieben` LP1 → "**Schreib Jonas: Dienstag passt nicht**" (the coordinator's wording). The old LP put *dir* after a colon, so the modelled sentence addressed Jonas and meant the opposite. `verify.mjs` now fails any Leitpunkt whose post-colon quotation contains a 2nd-person pronoun. |
| 7 | See §7 below — the integration line, restated as a single applicable instruction. |

### Minor (all 15)

8 — **not adopted, with evidence.** The review says the `/de/` DFB path "is live and surfaced in
search". I could not reproduce that: a Firecrawl query on the exact filename returned the `/en/`,
`/ru/`, `/tr/`, `/zh/` and `/pl/` variants and **no `/de/`**, and a quoted WebSearch for the `/de/`
URL returned `/de/` DFBs for A1-Fit, B2 and C2 but again not for A2. The `/en/` document is the
bilingual German/English one and is the variant that surfaces; the A1 guide's own header records
that citing a plausible-looking-but-unverified goethe.de path is exactly the trap. I kept `/en/`
and **relabelled it accurately** ("deutsch/englisch"). If the reviewer can produce a 200 for the
`/de/` path from unrestricted egress, swap it — it is a one-line change.
9 — **not adopted, with evidence.** The review says `…/ins/de/de/prf/prf/gzsd2/wi2.html` "never
appeared in any result". It appeared in round 1 *and* again in round 2, as the titled result
"Weitere Informationen Goethe-Zertifikat A2 — Goethe-Institut Deutschland". The suggested
replacement (`/de/spr/prf/pes/paa2.html`) never surfaced for me; the neighbouring path that did is
`pes/pa2f.html`, which is **Fit in Deutsch**, not this exam. Kept.
10 "an zwei Stellen" → "unter anderem in § 25a und § 25b". · 11 § 20a now reads "mindestens
einfache deutsche Sprachkenntnisse **oder** Englischkenntnisse auf Niveau B2" (guide + FAQ 8). ·
12 Both invented arithmetic claims replaced with the criterion argument ("trifft ein eigenes
Bewertungskriterium"). · 13 Wortliste "deckt die Prüfung ab" → "orientiert sich an dem, was die
Prüfung voraussetzt". · 14 Goethe's **200–350 UE à 45 Min.** now anchors the Lernplan intro *and*
the duration FAQ, with the plan explicitly framed as the last leg from A1. · 15 Volkshochschule
claim removed → "Welche Zentren das … sind, steht auf goethe.de". · 16 "im Teil 4" → "in Teil 4"
(×2); FAQ 5 → "Lesen und Hören haben je vier Teile mit zusammen 20 Aufgaben." · 17 "der Teil, der
nur einmal **läuft**". · 18 Sprechen Teil 2 no longer addressed to the examiner (×2). ·
19 Leitpunkte **nominalised** across all four tasks ("Dank für die Einladung", "Grund für die
Absage", "Vorschlag für einen neuen Termin", "Termin am Montag", "Frage nach der Uhrzeit") — the
reflexive-avoidance constraint still holds, and nominalising is what satisfies it *and* the Goethe
register at once. One deliberate exception: LP1 of `sms-treffen-verschieben` stays imperative
because the coordinator specified that exact string as the blocking-6 fix; the nominal
alternative, if the reviewer prefers consistency, is `'Absage für den Dienstag'`. ·
20 Register divergence **documented in the task file's header** for the D2 author: `halbformell` is
the exam's own label for Teil 2 and the brief mandates it, while the shipped `goethe_a1` bank calls
a letter to an authority `formell`. Scenario kept (the brief names it). · 21 "gratis" →
"**kostenlos**", the house line every shipped hub uses; pinned. · 22 `intro`/`focus` reduced to
**positioning only** — the pass mechanism and the Paarprüfung format are gone; `verify.mjs` now
fails the hub copy on any points figure, duration, "Paarprüfung" or pass wording.

### Round-2 sources (new or re-verified this round)

| URL | Opened? | What it confirmed |
| --- | --- | --- |
| Goethe institute A2 pages (`/ins/**/de/spr/prf/gzsd2.cfm`, `…/prf/prf/gzsd2/wi2.html`) | **blocked** (wi2 cited) | "können unabhängig vom Erreichen eines Mindestalters … abgelegt werden"; "Für das Goethe-Zertifikat A2 wird ein Alter von 16 Jahren empfohlen"; "200 bis 350 Unterrichtseinheiten à 45 Minuten". Returned consistently across several country institutes — i.e. many independent pages, one wording. Fixes blocking 2 and minor 14. |
| `hrk.de/…/sprachnachweis-deutsch/` **(new `sources[]` entry)** | **blocked** (cited) | DSH-2 / TestDaF 4×TDN 4 as the standard Studium requirement; corroborated by `testdaf.de`, `uni-frankfurt.de`, `frankfurt-university.de`, `thws.de` and the HRK RO-DT PDF. Fixes blocking 4. |
| `goethe.de/pro/relaunch/prf/en/Durchfuehrungsbestimmungen_A2.pdf` | **blocked** (cited, relabelled) | Re-surfaced twice this round; also yielded the Teilwiederholung rule ("in Ausnahmefällen … wenn die organisatorischen Bedingungen am Prüfungszentrum es zulassen"), which closes round-1 doubt #7. |
| Firecrawl filename query + quoted WebSearch for the `/de/` DFB path | n/a | **Negative result**, recorded deliberately: the `/de/` A2 variant does not surface, which is why minor 8 was not adopted. |

All round-1 sources stand unchanged; nothing in the §2 table was retracted.

## 7. Integration line for the integrator (apply verbatim)

> In `tests/guides.test.mjs`, in the test `internal links follow the three trailing-slash cases`,
> add `'/level/a2.1'` to the `NO_SLASH_ROUTES` array:
>
> ```js
> const NO_SLASH_ROUTES = ['/faq', '/ueber-uns', '/signup', '/login', '/dashboard', '/schreiben', '/modelltest', '/level/a2.1'];
> ```
>
> Without it the suite fails with `goethe-a2: /level/a2.1 matches no known route shape — add it to
> this test or fix the link`. The **link is correct** (`netlify.toml` rewrites `/level/*` →
> `/app.html`, so no trailing slash); the test simply has no `/level/` entry because no shipped
> guide links there. Confirmed independently by the reviewer, who re-ran the test's own matcher.

The rest of the integration checklist is in `examTracks.entry.js` (paste into both registry twins,
register the guide, add HUB_COPY, merge the writing tasks into both bank twins, add both
`check-built-html` MANIFEST lines) and was verified line-by-line by the reviewer.

## 8. Round 3 changes (2026-09-06) — response to `review-2.md`

Verdict was **PASS, 0 blocking, 7 minor**. All seven applied; four now carry regression pins.
`node --check` clean on all five files, `node verify.mjs` PASS exit 0.

| # | Fix |
| --- | --- |
| 1 | `sources[0]` → `…/pro/relaunch/prf/**de**/Durchfuehrungsbestimmungen_A2.pdf`, label "(PDF, deutsch)". **I was wrong in round 2**: my non-adoption rested on a failed search, and the reviewer settled it with a domain-restricted query returning that exact URL as the top titled result, last updated 1 Sep 2025. A German guide citing the English-market copy was a needless mismatch. Pinned: `verify.mjs` now fails any DFB citation that is not on the `/de/` path. |
| 2 | `sources[4]` (`/ins/de/de/prf/prf/gzsd2/wi2.html`) left as-is per the reviewer's own ruling, and stays on the pre-merge `curl -I` list — with the `/m/` variant named as the fallback if it 404s. Carried in §9. |
| 3 | Teilwiederholung scope made exact: "entweder die **mündliche** oder die **gesamte schriftliche** Prüfung — nie ein einzelner Prüfungsteil, also zum Beispiel nicht Lesen allein". The round-2 wording ("einzelner Prüfungsteile") invited exactly the wrong inference. Pinned both ways. |
| 4 | § `punkte` split: Schreiben keeps the Leitpunkte/Text criteria; **Sprechen gets its own sentence** (Aufgabenerfüllung, Verständigung mit der Partnerin oder dem Partner, Wortschatz, **Aussprache**) — it has neither Leitpunkte nor a text, and "dagegen" wrongly contrasted it against the three written parts it is not one of. Pinned. |
| 5 | hub `intro`: "die zweite besteht aus Sprechen" → "**die zweite ist das Sprechen**". `bestehen aus` takes constituent parts; a hurdle does not consist of speaking. |
| 6 | The last imperative Leitpunkt → **`'Absage für den Dienstag'`**. All twelve Leitpunkte are now noun phrases; the round-2 exception was made only because the coordinator quoted that string, and the reviewer explicitly ruled to take the nominal drop-in. Pinned: any Leitpunkt starting with an imperative verb now fails. The colon/pronoun pin still scans all four tasks, so it keeps guarding the class even though no Leitpunkt uses a colon any more. |
| 7 | Stale header comment in `writingTasks.goethe-a2.js` requoted — it explained the reflexive-avoidance with two strings that round 2 had replaced. The round-2 note about LP1 was also rewritten so it describes the current text rather than an intermediate one. |

No figure, claim or link shape changed in round 3; `answer` (102 w), hub description (157 ch),
section ids, the `aufbau` table, the track literal and all five internal links are untouched.

## 9. Doubts for the reviewer

Round 1 listed seven. The review closed four (#1 date — today is 2026-09-06 and the repo date
logic passes; #3 per-Teil task types — confirmed from two channels; #5 `Volkshochschule`/`Niveau`
vocabulary — house-safe; #6/#7 `hasMock: false` and the absent "keine Module" claim — both
correct). Round 2 closed #4 by deleting the claim and resolved the Teilwiederholung question the guide had
previously ducked; round 3 made that answer exact and settled the `/de/` source dispute. What
remains:

1. **`/level/a2.1` still needs the test change in §7.** The one hard CI blocker; nothing in the
   artefacts can fix it.
2. **One source URL still unverified:** `sources[4]`, `…/ins/de/de/prf/prf/gzsd2/wi2.html`. The
   reviewer's searches resolve that page title to the `/m/` (mobile) variant instead. Left in
   place on the reviewer's own ruling; `curl -I` it before merge and swap to
   `…/ins/de/de/m/prf/prf/gzsd2/wi2.html` if it 404s. (The `/de/` DFB dispute from round 2 is
   settled — the reviewer was right and it is fixed.)
3. **Still no source opened directly.** `WebFetch` remains blocked for every domain and `curl`
   through the proxy returns `CONNECT tunnel failed, 403`; the reviewer independently reproduced
   this. Everything here rests on server-side retrieval across ≥2 channels. The five goethe.de
   URLs in `sources[]` should get a `curl -I` before merge.
4. **`email-termin-beim-amt` register divergence** (`halbformell` here vs. `formell` in the
   goethe_a1 bank for a letter to an authority). Documented in the task file for the D2 author;
   a house-wide register vocabulary is a separate decision, not this PR's.
5. ~~Leitpunkt register~~ — **resolved in round 3**: all twelve Leitpunkte are noun phrases.
