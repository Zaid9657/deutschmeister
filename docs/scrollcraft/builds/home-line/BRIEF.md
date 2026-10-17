# BRIEF: the homepage line section ("the ride")

**Authored from existing decisions, not interviewed.** The owner approved this section as the first
scroll-craft build on 2026-10-17 ("yes" to "the homepage line section"). Every answer below is taken
from the Die Linie redesign record (`docs/redesign-2026-10/`: strategy, art direction, copy deck) or
labelled as an authored decision. No user quotation is invented.

Scope: ONE section of an existing page (`astro-site/src/components/linie/LineSection.astro`), not a
page. So the page-level parts of the skill (grammar, nav, hero, close) are inherited from the
homepage as built, and the project rules in `.claude/skills/scroll-craft/SOURCE.md` win.

## Why this section

Of the 50 signups with a recorded landing page since attribution started (2026-09-20), 42 landed on
`/` (`profiles.acquisition_landing`, queried 2026-10-17). The line section is where the homepage
sells the offer: A1.1 free, then one ticket per level. The move is meant to raise the share of
homepage visitors who reach a station board's button. Measure it with what already exists:
`course_selected` with `surface=line`, and the `line` section view.

## The eight topics

1. **Vibe.** From the art direction: a transit line, a timetable, "Die Linie". Türkis on a light
   feature ground, hairlines over shadows, one action colour.
2. **Journey, in the section.** Authored: you board at A1.1 (free), ride past the three ticket
   stops, and reach the end of the built line, where B1 and B2 are under construction.
3. **Energy.** Authored: calm. The hero and the demo above are the loud part of the page; this
   section is the steady ride between them and the ticket.
4. **Feeling, stage by stage, and the one moment.** See the curve below. The moment: the
   announcement changing to the next stop under your own thumb.
5. **The thing no site does.** Authored signature move: the station announcements of a German train
   ("Bitte einsteigen", "Nächster Halt", "Vorerst Endstation") ride along with the scroll, so the
   section teaches A1 German while it sells the levels.
6. **Range.** Premium-minimal, as the design system already decided.
7. **One world or scenes.** Neither at page level: one continuous line inside one section.
8. **Assets.** The existing station art (`StationArt`), the tokens, and the train glyph from
   `FirstStop`. Nothing generated, no kie.ai spend.

## Feeling curve (one section, three beats)

- Boarding: oriented. The train sits at A1.1 and the sign says "Bitte einsteigen. A1.1 is free."
- Riding: momentum. The track fills behind the train, each stop lights as it is reached, the sign
  calls the next stop.
- Arrival: resolved, honest. "Vorerst Endstation": the built line ends at A2.2, B1/B2 are named as
  under construction rather than hidden.

**Peak:** "the sign on the deutsch-meister site calls the next stop in German as you scroll." It
lives in the riding beat.

**Tell-someone sentence:** It's the site where scrolling rides a German train line and the
announcements tell you what's next.

**Authored silence:** none. Every scroll position inside the section moves the train.

## Rules carried in from the project

- No JS, or reduced motion: the section renders exactly as before (the line fully drawn).
- Only transform and opacity move. The fill and the train follow the scroll with no transition;
  the dots change colour on the 220 ms control tier.
- No new colours, no hex, no prices typed, no invented numbers.
- The engine (`engine/scrollcraft.js`, 62 KB) is NOT shipped: one section needs one progress value,
  and a ~2 KB script in the component carries it. The skill's verification harness is not used
  either. It walks `data-sc-*` acts, and this section has none. Screenshots are taken with the
  repo's Playwright instead.

## Verification (2026-10-17)

Offline Astro build with `public/` overlaid (so the real faces load), walked with Playwright at six
(desktop 1440×900) and eight (phone 390×844) scroll positions, plus a reduced-motion phone pass.
Shots: `shots/ride-*.jpg`.

- Desktop: the ride runs while the track climbs from 85 % to 35 % of the screen (about 450 px of
  scroll). Sign sequence observed: Bitte einsteigen → Nächster Halt: A1.2 → … A2.2 → Vorerst
  Endstation. The train ends on the B1.1 dot.
- Phone: the train sits on the reading line (60 % down); every stop lit in order, A1.1 to the Im Bau
  dot. The sticky sign stays one line under the header (the end gloss was shortened for that).
- Reduced motion: not armed. The section renders fully drawn, as before.
- No console errors. CI gates run locally: lint, `npm test`, duplicates, SPA + offline Astro build,
  merge, prerender, `check-built-html` (138 pages, 0 failures).

Feel check (one word per beat, scrolled cold): boarding "oriented", riding "momentum", arrival
"resolved". Matches the curve.

Not verified: a real phone (iOS Safari touch scroll, Safari < 16 where `overflow-x: clip` falls
back to visible), and whether it moves the number. That is the experiment below.

## How to read the result

E7 in `docs/redesign-2026-10/measurement.md`: `course_selected` with `surface=line` per homepage
visitor, 14 days before against 14 days after the deploy, guardrail the hero's own CTA clicks.
