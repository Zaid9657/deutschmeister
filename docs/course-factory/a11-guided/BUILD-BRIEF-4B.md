# Codex build brief 4b: the proof must not reject correct German — 2026-11-14

Follows brief 4 (built, checked by Claude, committed as `53e6b5e`; see `build-report-4.md`).
Read `CLAUDE.md` first. Small and focused: do this and nothing else.

## What Claude found when playing the proof

The lock screen and the loop (hint, second try, re-teach, "Now without the model") work. But a
proof task holds **one whole answer string**, so the proof marks correct German wrong. Measured
with `checkAnswer` on Lektion 1's tasks:

| Goal | Learner's answer | Result today |
|---|---|---|
| 1 | „Guten Tag, Frau Kaya. Auf Wiedersehen, Frau Kaya.“ | wrong |
| 1 | „Guten Tag. Auf Wiedersehen, Frau Kaya!“ | wrong |
| 4 | „Wie geht es Ihnen? Gut, danke.“ | wrong |
| 4 | „Wie geht es Ihnen, Frau Kaya? Mir geht es gut, danke.“ | wrong |

A gate that opens the next Lektion must never fail a learner for a right answer. And the hint
after a first miss is only "Once more.", which helps nobody.

`CLAUDE.md` forbids widening `accepted` alone, so this is a change of the **rule**, with tests.

## The change

1. **A production task is made of parts.** Each proof production task lists the things the learner
   must do, in order (for goal 1: a formal greeting, a formal goodbye; for goal 4: the question,
   the answer). Each part has a short bilingual label ("der Gruß" / "the greeting") and the forms
   that fulfil it, taken from what the Lektion taught (goal 4's answer part accepts both
   „Mir geht es gut, danke.“ and „Gut, danke.“, because the dialogue teaches both). A task with one
   thing to do has one part.
2. **Judging.** The answer is split into its sentences; every part must be fulfilled by one
   sentence, in order, each sentence judged by `checkAnswer` / `checkOptionsFor` as today (so the
   existing TYPO and spelling-separator rules keep working, per part). Decide and document what
   happens with an extra sentence that fulfils no part; a polite extra such as „Danke.“ must not
   fail a learner, a sentence in place of a required part must.
3. **Address is optional, by rule.** A learner may add the name of the person they speak to
   („Guten Tag, Frau Kaya.“, „Auf Wiedersehen, Frau Kaya!“), with the title and name of a speaker of
   this Lektion's dialogue. Implement this once in the proof judging (not per task and not by
   listing variants in data), and keep it from accepting a wrong name form as a free pass for the
   rest of the sentence.
4. **Register still counts.** Where the can-do or the situation asks for the formal form,
   „Hallo.“ / „Tschüss.“ / „Wie geht es dir?“ stay wrong. Say in the report how a task declares this.
5. **A real hint.** After the first miss the hint names the part that is not right yet, by its
   label, without containing any accepted form ("Der Abschied stimmt noch nicht: Sagen Sie es
   höflich." / "The goodbye is not right yet: say it formally."). The rule "a hint never contains
   an accepted answer" keeps holding, by test, for all parts.
6. **Own-name tasks** (goals 2 and 3) keep working exactly as they do.
7. **Validator (RULE 35), draft checker, `content/l01.json` and the "Proof" section of
   `CONTENT-BRIEF.md`** follow the new shape. The content brief must tell a writer: list every form
   the Lektion taught for a part; never one frozen sentence.

Scoring, storage, the lock, the stage order and every protected test stay as they are. Lektionen
without a proof and all of A1.2 are untouched.

## Tests

For Lektion 1, a table test of answers that must pass and answers that must fail, at least: the
four rows above (pass); punctuation and capitalisation variants (pass or TYPO as the common
checker decides); „Hallo. Auf Wiedersehen.“, „Guten Tag. Tschüss.“, „Guten Tag.“ alone,
„Wie geht es dir? …“, parts in the wrong order, a wrong name form (all fail). By class: every
part of every proof has a label in both languages and at least one form; no hint contains a form;
the address rule accepts only speakers of that Lektion's dialogue.

## Gates and report

The same gates as brief 4, all green at the end from a clean `dist/`. Append a section
"Brief 4b" to `docs/course-factory/a11-guided/build-report-4.md` with the new shape, the judging
rule, the pass/fail table as run, and anything open. `.git` is read-only: do not commit. Do not
edit `CLAUDE.md` or `astro-site/package-lock.json`. Do not stop to ask; a protected test wins over
this brief.
