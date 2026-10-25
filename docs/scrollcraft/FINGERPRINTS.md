# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| home-line (2026-10-17) | One section inside the homepage's own page (no page grammar of its own) | Inherited: the site header | Inherited: the homepage hero and its line board | One scrubbed section, three beats: board, ride, arrival | "Vorerst Endstation": the sign resolves at the end of the built line | German station announcements ride with the scroll ("Bitte einsteigen", "Nächster Halt", "Vorerst Endstation") | Die Linie tokens, existing station art, nothing generated | `astro-site/src/components/linie/LineSection.astro` |
| course-ticket (2026-10-18) | A companion object across a whole page (the level course pages, one template) | Inherited header, plus the ticket as a table of contents | Inherited: the level hero with its lit stop | Five to eight stamps, one per part, the last ones bunched before the close | A full ticket ("Alles drin.") beside the closing door | A German transit ticket stamped one German section name at a time as each part is read | Die Linie tokens and the existing ticket language, nothing generated | `astro-site/src/pages/courses/[level].astro` |

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

Nothing is taken yet.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
