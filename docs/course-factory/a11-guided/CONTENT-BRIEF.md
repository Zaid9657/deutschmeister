# Content brief: guided blocks for A1.1 Lektionen 2–12 (2026-11-12)

Lektion 1 is the model. You write the same content for the Lektionen you are given, as **drafts in
your own files**. You do not edit `src/`, tests, `CLAUDE.md` or any shared file. Claude merges
passing drafts later.

## Why

The founder's vision: a learner needs no teacher and no other source. The rule behind the design:
the learner never gets more than about two minutes of input without producing something that is
checked. So each Lektion's dialogue is played in short chunks (hear 2–3 lines, show you understood,
say one line aloud), followed by a short real text to read, and the recap ends on a story hook.

## Read first

1. `src/data/curricula/a11.js`, Lektion 1 (`nr: 1`): its `guided` block and `nextHook`. That is the
   exact shape. Then read **your** Lektionen completely (dialogue, Wortfeld, can-dos, situation)
   and the Lektion after each of yours (for the hook).
2. `scripts/lib/guided-content.mjs`: the rules your draft must pass.
3. `docs/course-factory/a11-guided/content/l01.json`: Lektion 1 as a draft file, the output format.

## What you write, per Lektion

One file `docs/course-factory/a11-guided/content/lNN.json` (two digits) with:

```json
{ "guided": { "read": { … }, "chunks": [ … ] }, "nextHook": { "de": "…", "en": "…" }, "notes": [ "…" ] }
```

### `guided.chunks`

- Contiguous, half-open `from`/`to` over the Lektion's `dialog.lines`; every line exactly once;
  each chunk 2 or 3 lines. Cut where the conversation turns, not mechanically.
- `meaning`: one question on what was said in that chunk. `promptDe` addresses the learner with
  **Sie**; `promptEn` is its English twin; 3 `options` in **English**, exactly one right, `answer`
  equal to that option's text. Wrong options must be plausible for the situation, clearly wrong for
  this chunk, and about the same length as the right one. Vary the position of the right option.
  The question asks for meaning, never for a word-for-word translation of a single word.
- `say`: `{ "line": n }` where line `n` lies in the chunk and is spoken by a learner-role speaker
  (`LEARNER_CAST` in `a11.js`: Ana, Tim, Lena). Choose the line most worth saying aloud for the
  Lektion's can-dos. Use `ownName` only as the validator allows (an "Ich heiße …" line → `"full"`;
  a spelled-out name → `"first"` or `"surname"`). If a chunk has no learner-role line, move the
  boundary; if that is impossible, say so in `notes` and do not invent a workaround.

### `guided.read`

- A short real-life text for the Lektion's situation (a form, a note, a sign, a message, a price
  list, a timetable: whatever a person in that situation would really read). 6–9 short lines,
  separated by `\n`.
- Only words the course has taught by this Lektion (its Wortfeld, its dialogue, earlier Lektionen).
  The checker reports every untaught word; rewrite until there is none.
- It must contain every Wortfeld entry of the Lektion that does **not** occur in the dialogue, in
  a form the gloss finder recognises (the checker tells you which are missing).
- Correct, natural German at A1. No sentence that only exists to list words if a natural line can
  carry them. Facts about the story's people must agree with the dialogues (names, jobs, cities).
- `titleDe`/`titleEn`, `instructionDe` (with **Sie**)/`instructionEn`.
- Exactly two `questions`, each with `promptDe` (Sie), `promptEn`, 3 English `options`, `answer`,
  `explanationDe`, `explanationEn`. Each must be answerable from the text alone and not from
  general knowledge.

### `nextHook`

One or two short sentences, German and English, that make the learner want the next Lektion. It
must be true to what the next Lektion really is (its situation and dialogue). Lektion 12 has no
next Lektion in A1.1: write a hook towards A1.2 only if you can ground it in
`src/data/curricula/a12.js` Lektion 1; otherwise leave `nextHook` out and say so in `notes`.

### `notes`

Anything Claude must know: a chunk boundary you were unsure about, a Wortfeld entry that would not
fit naturally, a fact in the existing dialogue that looks wrong, a Phonetik item that is not a
word-stress item (the sound step only handles word stress today; do not change Phonetik data).

## Check your work

```bash
node scripts/check-guided-draft.mjs <your Lektion numbers>
```

Run it after every edit until each of your Lektionen prints `✓`. A line "sound stage pending" is
expected for some Lektionen and is not yours to solve. Then re-read each draft once as a beginner
would meet it: is every question fair, is every German sentence something a native speaker would
write, does the text sound like the real thing?

## Report back

Per Lektion: the file path, the checker's final output, and your notes. No file dumps.
