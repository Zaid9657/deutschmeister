# Codex build brief 7: a proof judge fit for open answers — 2026-11-14

Follows briefs 1–6. Read `CLAUDE.md` first. This brief changes how a proof answer is judged and
what a proof task may ask; then it carries the eleven written proofs into the course.

## Why

Four agents wrote proofs for Lektionen 2–12 (`docs/course-factory/a11-guided/content/l02.json` …
`l12.json`, each with a `proof` block and detailed `notes`) and tried hundreds of learner answers
with `scripts/try-proof-answer.mjs`. All drafts pass RULE 35. Their notes agree on where the judge
still fails a learner who is right, and where a task cannot ask what the can-do says. **Read the
`notes` of all eleven drafts before you design anything**; they are the evidence.

The pass rule (founder, 2026-11-14): the learner shows every goal once; a missed goal is taught
again and asked again. A proof that refuses a correct answer, or passes without the ability, is a
fault in the product.

## Part A: the judge

Keep the principle: the answer's sentences fulfil the task's parts, each judged by
`src/lib/lesson/check.js`. Change these rules, each with table tests in
`tests/helpers/proofCases.mjs` style (right answers that must pass, wrong ones that must fail):

1. **Courtesies are cumulative.** A taught standalone courtesy („Danke.“, „Bitte.“,
   „Entschuldigung!“) may stand before or after the answer in any Lektion **from the Lektion that
   taught it onward**, not only in its own Lektion. The same for a taught greeting in front
   („Guten Tag!“) where the situation is a first contact. Derive from the curriculum's Wortfeld up
   to that Lektion; no list in code.
2. **A polite return question does not fail an answer** („Und Sie?“, „Und du?“, „Und Ihnen?“), from
   the Lektion that teaches it onward.
3. **Addresses.** The optional address covers the first names of this Lektion's dialogue speakers
   as well as titled ones, at the **end or the beginning** of the sentence („Tim, was hast du …?“,
   „Bis bald, Lena!“). Then remove the address variants the writers had to list in `forms`.
4. **Order only where it matters.** A task may declare that its parts can come in any order
   (two independent facts, two independent questions). Dialogue-shaped tasks (answer a first turn,
   then a second) stay ordered. Review all eleven drafts and set this where the writer's notes say
   a correct reversed answer was refused.
5. **One part, several sentences.** A part may be fulfilled by two sentences where that is how a
   learner would naturally say it („Ich spreche Arabisch. Ich spreche Deutsch.“). Decide how a
   part declares this, and keep "a required part is missing" detectable.
6. **Frames instead of lists.** Two drafts needed 441 and 592 listed forms because every correct
   sentence had to be spelled out. Let a part be given as a **frame with slots** (a sentence
   pattern whose slots take values from named sets, such as the Lektion's colours, taught nouns
   with their articles, weekdays, taught verbs in one person), expanded by the builder and judged
   through the same checker. Convert the long lists; the short lists may stay. The validator still
   proves that every expanded form uses taught words only.
7. **ss for ß, and umlauts.** The own-name introduction must accept „Ich heisse …“ (Lektion 1
   teaches ss for keyboards without ß); check what the common checker does with ae/oe/ue and a
   missing umlaut, and make the proof agree with the rest of the course rather than be stricter.
8. **Hints say the right thing.** „Sagen Sie es höflich.“ / "Say it formally." only when the miss
   really is the informal form; otherwise name the part. An informal task whose answer was formal
   gets the matching hint.
9. **Spoken answers.** The microphone path scores against one model sentence only. Make it score
   against the same parts and forms as typing, or switch the spoken path off for tasks where it
   cannot (and say which, in the report). Never let a spoken answer pass that typing would refuse,
   or the reverse.
10. **Small faults found on the way:** the reference control opens the clock board for any task
    that mentions „Uhr“ even in Lektionen without a clock set; a `notice` re-teach pointer prints
    the notice body with its `**` marks.

## Part B: what a task may ask

1. **German instructions.** RULE 35 treats instruction words (fragen, sagen, antworten, Satz, …) as
   untaught, so German task prompts cannot carry an instruction and German-only view loses it.
   Course task prompts already use such words (see the pretest prompts). Define the course's
   instruction vocabulary once, from the words existing task prompts already use, and let proof
   prompts use it; it stays out of what the learner must **produce**. Keep **Sie**.
2. **A listening task.** Can-dos about understanding (numbers, prices, a phone number, an
   announcement) are today a text the learner reads. Add a task form where the learner **hears**
   the stimulus (browser voice, never shown before the answer) and answers a checked choice or
   writes what was heard, like the spelling task of brief 5. Playback must have happened before the
   answer counts; without a German voice the learner retries or uses another device, and the
   written stimulus is never shown as a way to pass. Convert the reading-only "verstehen" tasks
   (Lektion 2 goal 2, Lektion 4 goal 2, Lektion 6 goal 2, Lektion 10 goal 2).
3. **Numbers in proofs.** RULE 35 calls compound numbers untaught although Lektion 4 teaches the
   21–99 rule as a set. A number or clock form covered by a set delivered by that Lektion or an
   earlier one is taught.
4. **A choice task must not be passable by elimination.** After a miss and re-teach, a choice task
   comes back with the options reordered and, where the data allows, with another instance of the
   same task (another number, another price).

## Part C: carry the proofs into the course

- Convert the eleven drafts to the new shape (Parts A and B), run `check-guided-draft.mjs` and the
  writers' own answer lists from `notes` through `try-proof-answer.mjs`: every answer a writer
  marked as "correct but refused by the tool" must now pass unless it uses untaught German; every
  answer marked wrong must still fail. Report the table per Lektion.
- Merge each passing proof into `src/data/curricula/a11.js` (Lektionen 2–12), Astro twin through
  `sync-shared.mjs`. A Lektion whose proof cannot be made fair stays without a proof; say which
  and why.
- **Do not change dialogues, Wortfeld, notices or can-dos.** Where a writer found that a Lektion
  never teaches what its can-do promises (listed in the notes: Lektion 3 „ich spreche“, Lektion 6
  phone name, Lektion 8 „Wie spät ist es?“, Lektion 10 „Ich fahre …“ and the departure question,
  Lektion 11 when I work, Lektion 12 inviting and the birthday month), keep the proof task as the
  writer shaped it, and list the gap in the report under "content the course must add". That
  correction is a separate brief.

## Rules that stay binding

As in briefs 1–6: protected tests unedited; `check.js` decides answers and `accepted` is never
widened alone (frames, slots and the rules above are rule changes, with tests); scoring unchanged
and the proof is not practice for gold; self-confirmation never passes; three parts with both
pauses; `requeue` directly before `recap`; RULES 35–40 stay at zero findings; A1.2 unchanged; no
SQL; do not edit `CLAUDE.md` or `astro-site/package-lock.json`; never weaken an assertion; do not
stop to ask (a protected test wins over this brief; record it).

## Gates and report

The same gates as brief 6, all green at the end from a clean `dist/`. Write
`docs/course-factory/a11-guided/build-report-7.md` as you go, a section per part with its gate
results: each judging rule with its pass/fail table; the frame and slot shape; the listening task;
per Lektion the proof as merged and the answers table; the list "content the course must add";
anything open. `.git` is read-only: do not commit. `node_modules` and `astro-site/node_modules`
are symlinks: do not install anything.
