# 07 — Vocabulary: word-list sizes, per-unit allocation, and what we own

**Date:** 2026-09-26 (database figures from the orchestrator's snapshot of 2026-09-27)
**Scope:** How big each level's vocabulary is and how it is structured (Goethe A1/A2/B1 lists; what exists for B2).
How textbooks allocate words per unit. A target per half-level and per unit. What our `words` table holds and
where it falls short. How units should pick words, and how to make coverage auditable.

---

## Method

1. **Primary word lists, read in full.** WebFetch gets a 403 from `www.goethe.de`, but `curl` with a browser
   User-Agent downloads the PDFs under `goethe.de/pro/relaunch/prf/`. I pulled the three official Wortlisten and the
   Goethe B2 *Prüfungsziele*, extracted the text with `pypdf` and parsed the headwords with a script (heuristic,
   ±5 %). Sources: [GZ-A1], [GZ-A2], [GZ-B1], [GZ-B2]. I also read the telc B2 *Handbuch* [TELC-B2] and the table of
   contents of *Profile deutsch* [PD-TOC].
2. **Textbook word lists, counted per unit.** Hueber *Schritte international Neu 1* (Glossar Deutsch-Ungarisch)
   [SI1] and *3+4* (Glossar Deutsch-Englisch) [SI34]. These list every word at its first occurrence, with
   *Erweiterungswortschatz* set in italics, so I split core from extension by font. Klett *Linie 1 A1.1*
   Kapitelwortschatz [LIN1] and *Aspekte neu B2* Kapitelwortschatz [ASP-B2]. telc *Einfach besser! 500* (B2 Beruf)
   Wortschatzliste [EB500]. The *Netzwerk neu A1* Kapitelwortschatz [NW-A1] is image-only and was not counted.
3. **Research on frequency and vocabulary size:** Caglia & Tschirner 2025 [SJER]; ITT Leipzig [ITT];
   Tschirner/Hacking/Rubio slides [ILR]; the DAFlex slides [DAFLEX]; the licence pages for DeReWo [DEREWO], the
   Leipzig Corpora Collection [LCC] and KELLY [KELLY].
4. **What we own.** Per the 2026-09-27 override, no MCP calls: all counts come from
   `docs/course-v2/inputs/db-snapshot-2026-09-27.md`. Row samples come from the four local Wortliste migrations
   (`migrations/2026-09-0{5,6}-*-wortliste.sql`, 626 inserted rows). I measured the live A1.1 Wortfeld from
   `src/data/curricula/a11.js`. Our words were checked against the Goethe lists in two ways:
   - **text match** (upper bound): the lemma occurs anywhere in the list, including its example sentences;
   - **exact headword** (lower bound): the lemma equals a headword in the alphabetical section. This misses the
     Wortgruppen (numbers, countries, months).

   Both are my own measurements from the parse above and are marked as such.

---

## Findings

### 1. The Goethe/ÖSD lists: size and structure

| List | Stated size | My parse | Structure |
|---|---|---|---|
| **A1** (Start Deutsch 1, file stamp `VS_02_280312`) [GZ-A1] | „circa 650 Wörter"; „etwa die Hälfte" should be **active** | ≈637 main headwords in the alphabetical list | Themen inventory (Person, Wohnen, Umwelt, Reisen/Verkehr, Essen/Trinken, Einkaufen, Dienstleistungen, Ausbildung, Arbeit, Freizeit) + **13 Wortgruppen** + an alphabetical list with example sentences |
| **A2** (2016, stamp `A2_Wortliste_04_050526`) [GZ-A2] | „circa 1300 lexikalische Einheiten", at least **receptive** | ≈1,250–1,310 headword tokens (noisy) | Wortgruppen (Anweisungssprache, Berufe, Familie, Länder, Schulfächer, Zeit, Zahlen …) + alphabetical list. Verbs carry 3rd-person present + Perfekt („anfangen, fängt an, hat angefangen") |
| **B1** (Goethe + ÖSD + Uni Freiburg, 2016) [GZ-B1] | „circa 2400 lexikalische Einheiten", at least receptive | ≈2,950 headword-like tokens (includes Nebeneinträge) | 14 Wortgruppen (adds Anglizismen, Politische Begriffe, Tiere, Schulnoten) + alphabetical list. Verbs add the **Präteritum** („fing an"). Senses are numbered. The list is **plurizentric**: ≈70 lines are tagged (A)/(CH), e.g. *parken/parkieren*, *Treppe/Stiege* |

Counting rules that matter for any audit (all quoted from the list forewords):

- Derived **Nebeneinträge** are indented and „nicht mitgezählt" (*Ausland → Ausländer, ausländisch*).
- Female forms are not listed separately but belong to the inventory (*Kunde* implies *Kundin*).
- Compounds appear only when they carry a new meaning (*Kindergarten* yes, *Kinderbett* no) [GZ-A1].
- From A2 up, nouns derivable from verbs (*Drucker*) and transparent prefix verbs (*mitmachen, wegbringen*) are
  also omitted [GZ-A2], [GZ-B1].

**The A1 list is explicitly not frequency-based.** Entries were chosen for everyday communication in four
domains, plus the words needed to handle the exam paper (*Antwortbogen, ankreuzen, zuordnen*). The foreword
says: „Frequenzkriterien hinsichtlich der muttersprachlichen Kommunikation von Deutschen wurden hingegen nicht
herangezogen." Its basis is the *Grundbaustein zum Zertifikat Deutsch* (1991), cross-checked against *Profile
deutsch* (2002) [GZ-A1].

**The lists are cumulative.** In my measurement, 558 of 587 A1 headwords (95 %) recur in the A2 list and 581/587
(99 %) in the B1 list. The few A1 items the A2 list drops are dated ones such as *Fax*, *Zigarette* and
*Halbpension*.

The **net new vocabulary per level** is therefore about 650 (A1), +650 (A2) and +1,100 (B1).

All three lists say they are „weniger geeignet … für die Einübung und Festigung des Wortschatzes". They are a
reference, not a syllabus. They also carry a §52a UrhG notice: the work may not be „gespeichert und in ein
Netzwerk eingespielt" without consent [GZ-A2], [GZ-B1].

One counting discrepancy is worth knowing. Caglia & Tschirner say the German B1 list „comprises some 3,400
lexemes (Glaboniat et al., 2016)" [SJER], while Goethe says „circa 2400". The gap is almost certainly the counting
policy (main entries only vs. every lexeme including sub-entries). My ≈2,950 parse sits between the two. **We must
fix one counting policy and state it next to any public counter.**

### 2. B2: no official list, by design

- **Goethe.** The B2 *Prüfungsziele* (1st ed. 2007, the version served at the URL) has no list. It points to
  *Profile deutsch*: „Eine Zusammenstellung der sprachlichen Mittel (Grammatik und Wortschatz), die für Lernende auf
  der Stufe B2 relevant sind, findet sich auf der CD-ROM zu Profile deutsch (2005)" [GZ-B2].
- **telc (2019).** The refusal is explicit: „Auf den Versuch einer Erweiterung der Inventare von Wortschatz und
  Grammatik durch ergänzende Listen wurde bewusst verzichtet … jegliche Festlegung über das für B1 definierte
  Niveau hinaus [wäre] gleichermaßen beliebig wie unvollständig." The B1 inventories count as the minimum for B2
  [TELC-B2].
- **Profile deutsch** (Glaboniat et al., Langenscheidt 2005) holds thematic vocabulary, Sprachhandlungen and
  allgemeine Begriffe **for A1–B2 only** (TOC §3.4.1–3.4.3) [PD-TOC]. It exists as a CD-ROM database with 15
  Themenbereiche. For C levels it gives no linguistic inventories [ZUM-PD]. It is not openly downloadable.

B2 vocabulary therefore has to be **derived**. The evidence available for doing that:

- **Frequency bands map to CEFR reading levels.** ITT Leipzig's German tests are built on the Herder/BYU corpus.
  Knowing the top 1,000 + 2,000 words indicates A2 reading, the top 3,000 indicates B1, and all five bands (5,000)
  indicate B2 [ITT]. Tschirner et al.'s slides tabulate 2,000 → A2, 3,000 → B1 and 5,000 → C1 (Milton 2010;
  Huhta et al. 2011) [ILR].
- **Text coverage** [SJER, citing Tschirner 2009]:

  | Most frequent words known | Bestseller novels | Newspapers |
  |---|---|---|
  | 3,000 | ≈90 % of tokens | 85 % |
  | 5,000 | 93 % | 88 % |

  Comprehension needs 95–98 % known tokens (Hu & Nation 2000; Laufer & Ravenhorst-Kalovski 2010, cited in
  [DAFLEX]).
- **The B1 list is weak on written text.** It „does not contain 40 % of the 3,500 most frequent German words"
  (Routledge Frequency Dictionary), because it was built from everyday spoken encounters [SJER]. B2 reading is
  written text. So frequency has to fill that gap at B1.2–B2.
- **Graded lexicons and frequency lists**, and whether we may use them:

  | Resource | What it is | Can we use it? |
  |---|---|---|
  | **DAFlex** (CEFRLex) [DAFLEX] | 41,646 lemma–POS entries with a frequency per CEFR level, estimated from 4,463 textbook texts (809,824 tokens). B2 alone: 1,023 texts / 189,338 tokens | It shows at which level textbooks start using a word. Licence not verified |
  | **DeReWo** (IDS) [DEREWO] | Corpus-based lemma list | **No.** It is CC BY-NC, so commercial use is prohibited |
  | **Leipzig Corpora Collection** [LCC] | Frequency lists | Yes, with attribution: CC BY 4.0 (per its FAQ, via search snippet) |
  | **KELLY** [KELLY] | Learner word lists | No German list |

### 3. How textbooks allocate vocabulary per unit

These are my per-unit counts from the publishers' own lists. „Core" means *not* marked as Erweiterungswortschatz.

| Book (level, units) | Entries per unit | Notes |
|---|---|---|
| *Schritte international Neu 1* (A1.1, Vorkurs + 7 Lektionen) [SI1] | core **80–179** (L1 179, L2 163, L3 168, L4 139, L5 138, L6 135, L7 80); extension 57–94 | ≈1,000 core + ≈510 extension first occurrences, counting Kursbuch, Arbeitsbuch and Fokus Beruf |
| *Schritte international Neu 3+4* (A2, 14 Lektionen) [SI34] | core **37–102**, mean ≈63; extension 50–117 | ≈885 core + ≈1,150 extension |
| *Linie 1 A1.1* (8 Kapitel) [LIN1] | **93–192** distinct entries | Lists everything, including instruction language (*ankreuzen, markieren*) and function words |
| *Aspekte neu B2* (10 Kapitel) [ASP-B2] | **189–333** distinct entries, mean ≈245 | ≈2,440 distinct headwords, in order of appearance |
| *Einfach besser! 500* (telc, B2 Beruf, 17 Lektionen) [EB500] | **34–42**, mean 38 | ≈650 entries: a curated learning list, not an index of the book |

A textbook unit therefore has two numbers:

1. **Exposure:** every new word the unit's texts contain. This is 100–330 per unit, and grows with level.
2. **Lernwortschatz:** the curated list to learn, 35–140 per unit.

Hueber makes the split visible in type (italic = extension). telc publishes only the curated list.

**Core tracks the lists; extension does not.**

| Schritte book | List | Core on it (exact / text) | Extension on it (exact / text) |
|---|---|---|---|
| A1.1 | Goethe A1 | 45 % / 66 % | 2 % / 10 % |
| A1.1 | Goethe B1 | 73 % / 96 % | 6 % / 19 % |
| A2 | Goethe A2 | 33 % / 44 % | 9 % / 16 % |
| A2 | Goethe B1 | 79 % / 93 % | 25 % / 34 % |

Two readings follow:

- Hueber bounds its core by the **B1 (Zertifikat) list, not by the level's own list**. This corrects memo 14's
  steal-list item 10 („bounded by the level's word list").
- One half-level book covers much of its level's list. *Schritte international Neu 1* core covers **353 of 585
  (60 %)** clean A1 alphabetical headwords by exact match.

### 4. What we own (`words` table, snapshot 2026-09-27)

The columns are `id, level, german, english, article, plural, example_sentence, audio_url, category`, with a
live `UNIQUE (german, level, category)`.

| Level | Rows | Audio | Article (≈ nouns) | Plural | Nouns without plural | Cumulative rows | Goethe cumulative |
|---|---|---|---|---|---|---|---|
| a1.1 | 375 | 339 (90 %) | 161 (43 %) | 145 | 16 | 375 | — |
| a1.2 | 413 | 413 | 269 (65 %) | 230 | 39 | 788 | ≈650 |
| a2.1 | 423 | 423 | 271 (64 %) | 246 | 25 | 1,211 | — |
| a2.2 | 373 | 373 | 224 (60 %) | 195 | 29 | 1,584 | ≈1,300 |
| b1.1 | 262 | 262 | 166 (63 %) | 166 | 0 | 1,846 | — |
| b1.2 | 261 | 261 | 149 (57 %) | 149 | 0 | 2,107 | ≈2,400 |
| b2.1 | 244 | 244 | 147 (60 %) | 147 | 0 | 2,351 | — |
| b2.2 | 246 | 246 | 117 (48 %) | 117 | 0 | 2,597 | no list (≈4,000 by frequency) |

Every level except a1.1 has an example sentence on every row; a1.1 has 339 of 375 (the same 36 rows lack audio
and an example). In total 2,561 of 2,597 rows (98.6 %) have both.

#### Samples (10 per level)

All samples come from the local migrations' inserted rows (seed 7). They are **not** a random sample of the
table: legacy rows are not in the repo. Each entry reads: German (plural) — gloss [category] — on the level list /
on the B1 list, by text match.

- **a1.1:**
  - *der Ingenieur* (-e) — engineer [Jobs & Work] — ✗/✓
  - *Spanisch* [Countries & Languages] — ✗/✓
  - *die Chefin* — ✓/✓
  - *das Wasser* — ✓/✓
  - *die Schweiz* — ✓/✓
  - *Syrien* — ✗/✗
  - *die Verspätung* — ✗/✓
  - *die Telefonnummer* — ✗/✓
  - *Indien* — ✗/✗
  - *der Krankenpfleger* — ✗/✓
- **a1.2:**
  - *achte* [Ordinals] — ✗/✗
  - *ankommen* — ✓/✓
  - *das Geschäft* — ✓/✓
  - *die Halsschmerzen* — ✗/✓
  - *das Flugzeug* — ✓/✓
  - *das Ticket* — ✓/✓
  - *fernsehen* — ✓/✓
  - *die Karte* — ✓/✓
  - *aussteigen* — ✓/✓
  - *die Praxis* — ✓/✓
- **a2.1:**
  - *der Dachboden* — ✗/✗
  - *die Kamera* — ✓/✓
  - *hübsch* — ✓/✓
  - *heilen* — ✗/✗
  - *der Lautsprecher* — ✗/✓
  - *der Schlüssel* — ✓/✓
  - *die Öffnungszeit* — ✗/✗
  - *der Glückwunsch* — ✓/✓
  - *der Blumenstrauß* — ✗/✗
  - *zurückrufen* — ✗/✓
- **a2.2:**
  - *höflich* — ✗/✓
  - *die Warnweste* — ✗/✗
  - *der Helm* — ✗/✗
  - *der Kochlöffel* — ✗/✗
  - *freundlich* — ✓/✓
  - *schriftlich* — ✓/✓
  - *schüchtern* — ✗/✗
  - *die Feuerwehr* — ✗/✓
  - *tanken* — ✗/✓
  - *unmöbliert* — ✗/✗
- **b1.1–b2.2:** no local source. The orchestrator should run the read-only SQL in *Open questions* §1.

#### Gaps

- **G1 — Size is lopsided.** The A levels hold more rows than the lists (788 vs ≈650; 1,584 vs ≈1,300). B1 holds
  523 new rows against ≈1,100 needed, and B2 holds 490 against roughly 1,600 (derived from the ≈4,000 frequency
  estimate, not from a Wortliste).
- **G2 — Row counts overstate list coverage.**
  - Share of the Course Factory additions on their level's list (text match, upper bound): a1.1 76/114 (67 %),
    a1.2 99/166 (60 %), **a2.1 69/175 (39 %)**, **a2.2 38/171 (22 %)**.
  - Many misses are legitimately derivable compounds (*Rückfahrkarte, Einzugstermin*), which Goethe does not list.
  - Others are off-list detail: *Warnweste, Kochlöffel, Wäscheleine, Kellerabteil, Rauchmelder*.
  - Level placement in earlier waves was judged against the Goethe A2 list „from memory"
    (`docs/course-factory/wave6/vocab-notes.md`).
  - The live A1.1 course has 263 Wortfeld entries (18–25 per Lektion). With its 159 `FUNCTION_WORDS`, it covers
    only **181 of 585 (31 %)** clean A1 headwords exactly. *Schritte Neu 1* core covers 60 %.
- **G3 — The schema cannot carry what the lists specify.** It has:
  - no part of speech;
  - no verb principal parts (A2 lists the Perfekt, B1 the Präteritum; a Course Factory brief put „(hat gebracht)"
    into `english`);
  - no reflexive or rection field (*sich freuen auf + A*);
  - no feminine pair, and no D/A/CH variety;
  - no word-list reference, unit, productive/receptive role or frequency rank.

  `plural = NULL` means both „no plural" (*Wasser*) and „missing".
- **G4 — `category` is a batch label, not a Wortfeld.**
  - Categories come in 25-row blocks and in English.
  - At B levels, grammar classes are used as vocabulary groups (*Reflexive Verbs, Passive Voice Verbs, Subjunctive,
    Conjunctions, Prepositions*).
  - B2 skews academic (*Philosophy & Ethics, Academic Writing, Advanced Medicine, Idioms, Nuanced Synonyms*), while
    telc's B2 lists are about working life [EB500].
  - „36 rows tagged for the old A1.1 course" shows `category` reused as a course tag.
- **G5 — Legacy defect classes, measured in the A-level fix migrations.** Four recur:
  - the article baked into `german` (117 of 248 A2.1 rows; 152 `german` fixes at A2.2);
  - the string `"null"` as a plural;
  - glosses that begin with „the";
  - out-of-level examples.

  **No B-level fix wave exists**, so the same classes are likely there (unverified).
- **G6 — Audio.** 36 a1.1 rows have no audio and no example (plausibly the course-seeded rows; unverified). Every
  new B-level word will need the owner's Azure run.

---

## Implications for the course blueprint

1. **Adopt these per-half-level targets.** They assume 12 units per half-level (memo 14 §G1). „New" means new
   *Lernwortschatz* entries that enter the SRS; exposure words in texts come on top.

   | Half-level | New entries | Per unit | Productive share | Coverage gate |
   |---|---|---|---|---|
   | A1.1 | 330–360 | 28–30 | ≈50 % | ≥55 % of A1 list headwords; ≥80 % of entries on the A1 list or derivable from it |
   | A1.2 | 300–330 | 25–28 | ≈50 % | cumulative ≥95 % of the A1 list; ≤10 % A2 preview |
   | A2.1 | 330–360 | 28–30 | ≈50 % | ≥50 % of A2-new headwords |
   | A2.2 | 330–360 | 28–30 | ≈50 % | cumulative ≥95 % of the A2 list |
   | B1.1 | 520–580 | 43–48 (≈25 productive + ≈20 receptive) | ≈45 % | ≥50 % of B1-new headwords |
   | B1.2 | 520–580 | 43–48 | ≈45 % | cumulative ≥95 % of the B1 list |
   | B2.1 | 700–850 | 60–70 (≈25 productive + ≈40 receptive; word families count once) | ≈35–40 % | frequency band 3,001–5,000 ∩ B2 topics |
   | B2.2 | 700–850 | 60–70 | ≈35–40 % | cumulative ≈4,000 lemmas; ≥90 % of the top-4,000 frequency band |

   Where the numbers come from:
   - Goethe's net sizes (650 / +650 / +1,100) and „etwa die Hälfte aktiv" at A1 [GZ-A1].
   - *Schritte* A1.1 covering 60 % of the A1 list in one half-level (§3).
   - ITT/Tschirner, who put B2 reading at ≈4,000–5,000 frequent words [ITT], [ILR].
   - telc's curated B2 lists of 34–42 per Lektion [EB500].
   - The productive shares beyond A1 are my proposal.
2. **Pick each unit's words in a fixed order**, written into the curriculum template:
   1. Start from the unit's situation and can-dos (memos 04/05).
   2. Take the list headwords of the matching Goethe Themen field.
   3. Add everything the unit's exam task needs (Anweisungssprache, Redemittel).
   4. Fill to target with the most frequent still-unassigned list words.
   5. Admit off-list words only when the situation requires them. Cap them at 15 % (A) or 25 % (B1). Tag them
      `extension` and make them receptive unless justified.
   6. At B1.2–B2, fill from the frequency bands the B1 list misses (Leipzig CC BY lists), ranked by DAFlex B2 use.
      Never use DeReWo (NC).
3. **Structure a Wortfeld as 3–4 thematic mini-blocks of 6–10 words**, taught blocked inside the unit and
   interleaved in review (memo 09). Always list feminine forms with the masculine (*der Lehrer / die Lehrerin*),
   since Goethe counts them as one entry.
4. **Recycle by rule, and check it by script.** Every new word appears ≥2× in the unit's own dialogue, reading or
   listening text, and again in ≥2 later units. Every reading or listening text must reach **≥95 % known-token
   coverage**, and extensive reading ≥98 % [DAFLEX]. „Known" means earlier units + this Wortfeld + function
   words + proper names.
5. **Extend the entry schema.** Authors write lemmas; the orchestrator matches ids. Fields:
   - `lemma`, `pos`, `article`;
   - `plural` plus an explicit `plural_kind`: regular, singular-only or plural-only;
   - `feminine`;
   - `verb_forms`: 3rd person singular, Präteritum, and Perfekt auxiliary + Partizip (from A2);
   - `reflexive`, `rection` (preposition + case);
   - `variety` (D/A/CH, from B1);
   - `list_ref`: `A1|A2|B1|derived:<head>|compound:<a+b>|off-list:<reason>`;
   - `role` (productive/receptive), `unit`, `freq_rank`, `example`, `audio`.
6. **Make coverage auditable** with a `validate-vocabulary` script in the style of `validate-curriculum.mjs`. It
   reports, per half-level:
   - new entries against the target;
   - the cumulative share of each list tier;
   - the off-list share per unit;
   - duplicates across units;
   - recycling and text-coverage violations.

   Ratchets may only go down. Count as Goethe does: main headwords only; feminine forms and Nebeneinträge are not
   separate entries. A learner-facing counter („412 von ≈650 A1-Wörtern") may show the number, but never the list.
7. **Keep the Goethe lists out of anything published.** The notice forbids storing or networking them without
   consent. Store only our own lemma + tier flags (`list_ref`), keep any parsed reference file outside the public
   repo, and get the owner's decision (Open questions §3).
8. **Reuse rows before creating them, after a cleanup.**
   - Match every new-curriculum lemma to an existing row, so the existing audio is kept (98.6 % of rows have it).
   - Run a fix pass on the B-level rows first, using the G5 defect classes.
   - Rough gap before the audit: B1 needs ≈+550–600 new rows, B2 ≈+1,100–1,500.
   - A levels need fewer new rows but a re-selection, because many rows are off-list.
9. **Retire `category` as the organising unit.** Vocabulary is grouped by unit and Wortfeld. Drop the
   grammar-class categories as vocabulary groups. Re-level the academic B2 categories: most become receptive
   `extension` or move out.
10. **Show the core/extension split to the learner, as Hueber does.** Productive words get two-way SRS cards and a
    production item. Receptive words get recognition-only cards. This keeps the B-level SRS load bounded while the
    exposure grows.

---

## Open questions

1. **B-level rows are unsampled.** Run this read-only query and append the result to this memo:
   ```sql
   select level, german, article, plural, english, category, left(example_sentence,60) ex,
          audio_url is not null has_audio
   from (select *, row_number() over (partition by level order by md5(id::text)) rn from public.words) s
   where rn <= 10 order by level, rn;
   ```
   Also run this quality query per level:
   ```sql
   count(*) filter (where german ~* '^(der|die|das) ')   -- article in headword
   count(*) filter (where plural = 'null')               -- string "null" as plural
   count(*) filter (where english ~* '^the ')            -- gloss begins with "the"
   ```
   And this one for lemmas duplicated across levels:
   ```sql
   select lower(german), array_agg(distinct level) from public.words
   group by 1 having count(distinct level) > 1;
   ```
2. **Which counting policy goes on the public counter?** Goethe's „circa 2400" (main entries), or the ≈3,400
   lexemes cited by [SJER]?
3. **Legal.** May we keep a parsed, non-public copy of the Goethe lists for validation, or only our own `list_ref`
   tags? The owner decides; this may need counsel.
4. **Is DAFlex's licence compatible with a commercial course?** And SUBTLEX-DE's? The Leipzig lists (CC BY 4.0) are
   the safe fallback.
5. **Should A1.1's productive target stay at ≈50 %?** A first-contact learner with an exam date abroad may prefer a
   larger receptive share. Test this against the activation data once the course is live.
6. **Does the ÖSD/telc B1 inventory differ materially from Goethe's for DTZ learners?** The Goethe B1 list is
   co-published with ÖSD, but telc's own lists were not checked.

## Unverified

- The Tschirner et al. (2019) reading-to-vocabulary mapping (A2 ≈1,600; B1.1 ≈2,400; B1.2 ≈3,200; B2 ≈4,000;
  C1 ≈5,000) is known only from search snippets. The primary report ([ResearchGate](https://www.researchgate.net/publication/378945160_EXAMINING_THE_RECEPTIVE_GERMAN_3_VOCABULARY_SIZE_TEST_VST_ITT_Technical_Reports_on_Language_Testing_1)) returned 403. The B2 ≈4,000 figure rests on ITT's „all five levels → B2" plus that snippet.
- Milton (2009) English ranges (B1 2,750–3,250; B2 3,250–3,750) are from search snippets
  ([EUROSLA](https://www.eurosla.org/monographs/EM01/211-232Milton.pdf)).
- The Leipzig Corpora Collection's CC BY 4.0 licence comes from a search snippet of its FAQ, not a page I read.
- DAFlex's licence and download terms were not checked: the live site reset the connection.
- The textbook per-unit counts are my own heuristic parses (±5–10 %; the *Schritte Neu 1* core includes ~17
  footer lines of noise). The Hungarian and English Hueber glossaries may differ in scope.
- The 36 a1.1 rows without audio are „probably the course-seeded rows": not checked against the database.
- The B-level defect classes are inferred from the A-level fix waves.
- Profile deutsch's entry counts per level are unknown. It is sold as a CD-ROM only.

## Sources

- [GZ-A1] Goethe-Zertifikat A1 Start Deutsch 1 Wortliste — https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf
- [GZ-A2] Goethe-Zertifikat A2 Wortliste — https://www.goethe.de/pro/relaunch/prf/de/Goethe-Zertifikat_A2_Wortliste.pdf
- [GZ-B1] Goethe-/ÖSD-Zertifikat B1 Wortliste — https://www.goethe.de/pro/relaunch/prf/de/Goethe-Zertifikat_B1_Wortliste.pdf
- [GZ-B2] Goethe-Zertifikat B2 Prüfungsziele, Testbeschreibung (2007), §4.4 — https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_B2.pdf
- [TELC-B2] telc Deutsch B2 Handbuch (8. Aufl. 2019), §4 Lernziele — https://www.telc.net/fileadmin/user_upload/pdfs/Handbuch_und_Tipps_fuer_Pruefungsvorbereitung/Deutsch_B2_Handbuch.pdf
- [PD-TOC] Profile deutsch, table of contents — https://external.dandelon.com/download/attachments/dandelon/ids/CH00111115C1172E53325C1257AE1004CDD1D.pdf
- [ZUM-PD] https://deutsch-lernen.zum.de/wiki/Profile_Deutsch
- [SJER] Caglia & Tschirner 2025, *Swiss Journal of Educational Research* 47(2), DOI 10.24452/sjer.47.2.9 — https://sjer.ch/article/download/10540/15525/59846
- [ITT] https://itt-leipzig.de/about-the-vocabulary-tests-2-2/?lang=en
- [ILR] Tschirner, Hacking, Rubio, *Vocabulary Size as a Screener for Reading Proficiency* — https://www.govtilr.org/TC/ILR%20Reading%20and%20Vocabulary%20Size.pdf
- [DAFLEX] François, Kerres, De Meyere, Suñer Muñoz 2021 (GR4L2 slides) — https://cental.uclouvain.be/team/seminaires/gr4l2_2021/francois_daflex.pdf ; resource: https://cental.uclouvain.be/cefrlex/daflex/
- [DEREWO] https://www.ids-mannheim.de/en/s/corpus-linguistics/projects/methods-of-analysis/corpus-based-lemma-and-word-form-lists/
- [LCC] https://wortschatz.uni-leipzig.de/en/documentation/faq
- [KELLY] https://www.hf.uio.no/iln/english/about/organisation/text-laboratory/services/kelly.html
- [SI1] https://www.hueber.de/media/36/Schritte_int_neu_1_Glossar_Deutsch-Ungarisch.pdf
- [SI34] https://www.hueber.de/media/36/Schritte_int_Neu_3_4_Glossar_Deutsch_Englisch.pdf
- [LIN1] https://www.klett-sprachen.de/download/7062/Linie1_A1-1_Mein-Kapitelwortschatz.pdf
- [ASP-B2] https://www.klett-sprachen.de/download/7059/aspekte-neu-b2-lb-kapitelwortschatz.pdf
- [NW-A1] https://www.klett-sprachen.de/download/22483/NWneu_A1_KB_K1-12_kapitelwortschatz.pdf (image-only; not counted)
- [EB500] https://www.telc.net/fileadmin/user_upload/Downloads_Verlag/Einfach_besser_100_400_500/Wortschatzlisten/Einfach_besser_500_Wortschatzliste_Deutsch.pdf
- Local:
  - `docs/course-v2/inputs/db-snapshot-2026-09-27.md`
  - `migrations/2026-09-05-a1-1-wortliste.sql`, `…a1-2…`, `2026-09-06-a2-1…`, `…a2-2…`
  - `src/data/curricula/a11.js`
  - `docs/course-factory/wave6/vocab-notes.md`
  - `docs/course-v2/research/09-learning-science.md`, `14-lehrwerke-curricula.md`
