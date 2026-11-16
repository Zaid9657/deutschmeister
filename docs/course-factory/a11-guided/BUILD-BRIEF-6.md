# Codex build brief 6: checks that check, and every word taught — 2026-11-14

Follows briefs 1–5b. Read `CLAUDE.md`, then `REVIEW-daf-24-2026-11-14.md` in this folder: sections
**M1**, **M2**, **M4** and **M5**. This brief closes those four. Nothing else.

Agents are writing `proof` blocks into `docs/course-factory/a11-guided/content/l02.json` … `l12.json`
at the same time. **Do not edit those draft files** and do not merge proofs; Claude does that.

## Why

The founder: no teacher and no other source needed. Review 24 found that the lesson's own checks
often do not prove understanding, and that a third of the words are never properly taught:

- **M2:** all 58 scene meaning questions can be answered from the English translation shown on the
  hear screen just before.
- **M1:** 94 of 263 Wortfeld entries never get a word card; they are only tappable inside the read
  text. Practice then checks their article or meaning.
- **M5:** word cards come in blocks of up to 21 with no checked response; notices have no check.
- **M4:** many hints say nothing ("Once more.").

## Part A: the scene check must need the German (M2)

- On the scene's hear screen the German lines are shown and played; the **English is hidden by
  default**. Each line has its own control to show its English, and single words stay tappable for
  their meaning where the gloss data exists. Help stays one tap away; it is no longer in the way.
- Record, per chunk, whether the learner opened a line's English before answering. Keep it in the
  run and attempt data that already exists (content-free flags; no new SQL). The meaning check
  still counts as before for scoring (it is not practice for gold), but the recap and the funnel
  events can tell "answered unaided" from "answered with the translation".
- After the answer, the feedback shows the English of the whole exchange, as today.
- The first chunk of **Lektion 1** is a learner's first minute of German: there, show the English
  by default, and say in the report why you kept or changed this.
- Distractors: add a validator rule with tests that flags a scene or read question whose correct
  option is the single longest option by a clear margin, or whose options differ so much in detail
  that length alone picks the answer. **Report** the findings per Lektion; do not rewrite the
  questions (the content writers do that next).

## Part B: every word gets its card, in small groups with retrieval (M1, M5)

- Every Wortfeld entry of a guided Lektion gets the ordinary word-card presentation (article,
  plural, English, audio) before the first checked item that depends on it. The entries that today
  are only in `read.words` get cards too; the read text keeps its tappable glosses.
- Cards come in **groups of at most six**, each group followed by two or three **checked retrieval
  tasks** on that group through `checkAnswer` / `checkOptionsFor`: meaning (German → English choice),
  hear-and-pick, and for nouns the article. Reuse the existing derived/meaning item builders; do not
  write a second mechanism. Distractors come from the same Lektion.
- Place the scene's words where they are today; place the remaining words in a second card step
  before the read text. Keep `meta: true` headings out (their sets are taught by the set stage).
- These retrieval tasks are not practice for gold. First-response scoring is unchanged.
- The time model and the two-minute rule: extend the count-based estimator so that no modeled
  stretch of input without a checked response exceeds two minutes in the card steps, and add the
  rule to the validator (as RULE 37 does for sets). Report every Lektion's numbers before and after.
- Do **not** change the notices in this brief; say in the report what a later brief should do
  about the notice stretch.

## Part C: hints that help (M4)

- Inventory every place a learner can get the neutral fallback hint ("Once more." / „Noch einmal.“)
  and report the counts by item type and stage.
- Give each item **type** that reaches the fallback a real, type-derived hint that never contains
  an accepted answer (the existing rule and its test stay). A hint may point at where the answer
  was taught (the scene line number, the word card) or at what kind of thing is wrong (the article,
  the verb ending, the word order). Derive from data that exists; no hand-written hint per item.
- The scene meaning check's hint points back to the line it is about and offers the line's audio
  again.

## Rules that stay binding

As in briefs 1–5b: protected tests unedited; three parts with both pauses; the guest save-ask
replaces the first pause; `requeue` directly before `recap`; RULE 36 and RULE 37 stay at zero;
derive, never retype; analytics behind consent with step names through `src/data/events.js` and its
synced copies; flow-aware estimates follow the new steps; A1.2 unchanged; no SQL; do not edit
`CLAUDE.md` or `astro-site/package-lock.json`; never weaken an assertion; do not stop to ask
(a protected test wins over this brief; record it).

## Tests

English hidden by default and revealed per line; the opened-translation flag recorded and content-
free; Lektion 1's first chunk as decided; the distractor rule on constructed cases; every Wortfeld
entry of every guided Lektion has a card before its first dependent check, for all three seeded
draws; no card group above six; each group followed by checked retrieval; the two-minute rule on
the card steps (a mutation that merges two groups must fail); no fallback hint for the types you
covered; hints never contain an accepted answer; A1.2 unchanged.

## Gates and report

The same gates as brief 5, all green at the end from a clean `dist/`. Write
`docs/course-factory/a11-guided/build-report-6.md` as you go, a section per part with its gate
results, the before/after numbers and anything open. `.git` is read-only: do not commit.
`node_modules` and `astro-site/node_modules` are symlinks: do not install anything.
