# Codex build brief 5b: taught sets, compact and where they are needed — 2026-11-14

Follows brief 5 (built; Claude re-ran the gates: 3,032 tests pass; see `build-report-5.md`).
Read `CLAUDE.md` first. This reshapes what brief 5 built; it adds no new topic.

## What Claude found when playing it

The sets are correct German and the order rule (RULE 36) works. But Lektion 1 now runs
`pretest → set:alphabet → scene`, and the alphabet is **one letter per screen: 36 hear-and-say
turns and 18 checks before the story's first line** (your own estimate: 12 to 24 minutes).
Lektion 4 puts 35 turns and 25 checks in front of its scene.

The founder left his own German course because it "was throwing informations and hoping i would
learn somehow". The design's first promise is: in the first two minutes the learner sees the
scene, hears one line and has said „Ich heiße …“ aloud. A wall of letters before the story breaks
that. Teach the set, but compactly and at the point of need.

## The change

1. **A group is one screen (a board), not one screen per member.** All members of a group (about
   six) are on one board; each can be tapped to hear it; the learner says the group aloud in one
   go (`ReadAloudLine` on the group as one line, existing fallbacks), then answers that group's
   checked tasks. Keep the checked tasks and the confusable-pair checks; they are the point.
   Reduce what is merely ceremony.
2. **Time budget, enforced.** Model the time of each set stage from its real counts (as
   `a11.meta.js` already does for estimates) and add a validator rule: the upper estimate of one
   set stage must not exceed **6 minutes**, and no guided Lektion may place more than 6 modeled
   minutes of set teaching before the first scene line. Report every stage's numbers before and
   after.
3. **Lektion 1: story first, alphabet at the point of need.** Order: `pretest`, scene chunk 1
   (greeting and name, where the learner first says „Ich heiße …“), the alphabet, then scene chunks
   2–4 (chunk 2 is the one that asks for spelling). Let a guided set declare where it goes
   (before the scene, or after scene chunk *n*); build the scene as the needed number of scene
   stages so saved runs, Back, funnel step names, estimates and RULE 36 stay right. RULE 36 must
   still pass: nothing checked before it is taught.
4. **The learner's own name, spelled out.** Right after the alphabet board the learner sees their
   own surname with each letter and its German name (derived from the set, with the name they
   typed in the first-sentence step, held in memory only), hears it spelled and says it. That is
   the can-do "I can spell my name"; the whole alphabet is the means.
5. **A reference that is always one tap away.** Any task that asks for spelling or for a number
   offers a small help control that opens the relevant board (tap a member to hear it): the scene's
   say step, practice items, dictation. In the proof it is available on the re-teach card only,
   never while the proof task is being asked.
6. **Lektion 4:** before the scene teach what the scene's prices need (11–19 and the tens, with
   the -zehn / -zig contrasts). Move the 21–99 rule and its transfer checks to Part 2, before the
   practice that first needs a compound number; if no checked item needs one, say so in the report
   and still teach it there, since the can-do promises prices to a hundred.
7. **One source for letter names.** Lektion 1's notice names some letters („Jot“, „Vau“, „We“,
   „Zett“, „Eszett“); the set says „Weh“. What the learner **reads** as a letter's name must be the
   same everywhere and follow the usual German spelling of letter names; what the voice is
   **given to say** may differ where the browser voice needs it. Keep the two apart in the set data
   and derive the notice's names from the set.

Everything else from brief 5 stays: the sets as data, RULE 36, the spelling proof task, Lektion 2,
3, 6 and 8 placements (apply the board form and the time budget to them too).

## Rules that stay binding

As in briefs 1–5: protected tests unedited; three parts with both pauses; the guest save-ask
replaces the first pause; `requeue` directly before `recap`; first-response scoring unchanged and
set stages are not practice for gold; names never stored; derive, never retype; analytics behind
consent with step names through `src/data/events.js` and its synced copies; A1.2 unchanged; no SQL;
do not edit `CLAUDE.md` or `astro-site/package-lock.json`; never weaken an assertion; do not stop
to ask (a protected test wins over this brief; record it).

## Tests

The board renders a whole group and one group recording; the time-budget rule (a mutation that adds
members must fail it); Lektion 1's built order with the split scene, for all three seeded draws;
saved-run resume and Back across the split; RULE 36 still zero findings; the own-name spelling card
derives letter names from the set and stores nothing; the reference control is present on spelling
and number tasks and absent while a proof task is asked; Lektion 4's two placements; the notice's
letter names equal the set's.

## Gates and report

The same gates as brief 5, all green at the end from a clean `dist/`. Append a section "Brief 5b"
to `docs/course-factory/a11-guided/build-report-5.md`: the board, each set stage's modeled time
before and after, each Lektion's built order, and anything open. `.git` is read-only: do not
commit. `node_modules` and `astro-site/node_modules` are symlinks: do not install anything.
