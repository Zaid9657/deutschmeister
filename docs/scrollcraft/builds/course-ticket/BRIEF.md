# BRIEF: the course pages' ticket ("der Fahrschein")

**Self-authored under explicit creative delegation.** On 2026-10-18 the owner asked to apply
scroll-craft to "a group of pages at the same time … the pages will be from your choice". The
choice and every answer below are authored decisions, grounded in the Die Linie record
(`docs/redesign-2026-10/`) and the course template. No user quotation is invented.

Scope: the level course pages, `astro-site/src/pages/courses/[level].astro`, one template. The
build arms on every level a visitor can start or buy (A1.1 free, A1.2, A2.1, A2.2). The four
Im Bau levels (B1.1 to B2.2) sell nothing, so they get no ticket and render as before.

## Why these pages

The homepage carries 42 of the 50 signups with a recorded landing page, and its line section (the
first build, `home-line`) sends readers on with "What's inside A1.2". These pages are where that
reader decides. The homepage itself stays untouched until E7 is read on 2026-11-01. Measure with
the click surfaces this build adds (`course_fahrschein`, `course_bar`) against course-page views:
E8 in `docs/redesign-2026-10/measurement.md`.

## The eight topics

1. **Vibe.** The same line as the homepage, one stop closer: a ticket you hold, stamped as you go.
2. **Journey.** Authored: arrive at the station (hero, price, door), read what the level holds part
   by part, and leave with a full ticket and the door beside it.
3. **Energy.** Calm and steady. Every stamp is small; the last few land together.
4. **Feeling, stage by stage, and the one moment.** See the curve below. The moment: the ticket
   filling up while you read, so the price arrives next to everything it buys.
5. **The thing no site does.** Authored signature move: a German transit ticket
   (Einzelfahrschein) that is stamped one German section name at a time (Grammatik, Lesen, Hören,
   Wortschatz, Sprechen, Abschlusstest, 28-Tage-Plan) as the reader passes each part, and links
   back to each part.
6. **Range.** Premium-minimal, as the design system already decided.
7. **One world or scenes.** Neither: one object that travels beside the whole page.
8. **Assets.** The tokens, the existing ticket language (`Ticket.astro`: "Einzelfahrschein · one
   ticket"), and the counts the page already shows. Nothing generated.

## Feeling curve

- Arrival: oriented. The hero says where the level sits on the line and what it costs.
- Reading: accumulation. Each part of the level, once read, lands on the ticket as a stamp.
- The last stamps: fullness. Wortschatz, Sprechen, Test and Plan sit in one grid, so they land
  close together, just before the closing door.
- Close: resolved. "Alles drin." on the ticket, the door on the ticket and in the closing block.

**Peak:** "the ticket on the course page fills itself up while you read what's in the course."
It lives in the last stamps, right before the close.

**Tell-someone sentence:** It's the site where the course page stamps your ticket with every part
of the course as you read about it.

**Authored silence:** the "What one ticket carries" block above the contents stamps nothing; it is
the ticket's own promise, not one of its parts.

## Fingerprint gate against `home-line`

| Dimension | home-line | course-ticket | Differs |
|---|---|---|---|
| Grammar | one section inside the homepage | a companion object across a whole page | yes |
| Nav treatment | inherited site header | inherited site header, plus the ticket as a table of contents | yes |
| Hero device | homepage hero and line board | the level hero with its lit stop, unchanged | yes |
| Act-sequence shape | one scrubbed section, three beats | five to eight stamps, one per part, the last ones bunched | yes |
| Close pattern | "Vorerst Endstation" sign | a full ticket ("Alles drin.") beside the closing door | yes |
| Signature move | German station announcements | a ticket stamped with German section names | yes |

Six of six. Passes.

## Rules carried in from the project

- No JS, or reduced motion: the ticket shows every stamp, as drawn, and nothing animates.
- Only transform and opacity move; colour changes ride the 220 ms control tier.
- No new colours, no hex, no prices typed (`eur(course.price)`), no invented numbers: every count
  on the ticket is a count the page already renders from data.
- From 1280px the ticket sits beside the contents; below that it is a bottom bar, which hides while
  the hero's door is on screen, leaves once the closing door has cleared it, and never shows beside
  the course return bar, so there is never a second fixed bar or two doors on screen together.
- No scroll cue anywhere: the ticket never tells the reader to scroll.

## Verification (2026-10-18)

Offline Astro build with `public/` overlaid, walked with Playwright (cookie choice pre-set, as
for a returning visitor) at eight scroll positions on A1.2 at 1440×900, 1100×760 and 390×844, A1.1
at 1280×720 and 390×844, A2.1 at 900×1100, A1.2 with reduced motion, and B1.1. Shots: `shots/`.

- A1.2 desktop: stamps land in page order (Grammatik, then Lesen and Hören together, then the four
  cards), "Alles drin." appears with the last one. The ticket is 589px tall and fits 1280×720.
- A1.1: the Lehrplan stamp lands first; the syllabus table fits the 702px column (no sideways
  scroll at 1280 or 1440).
- Below 1280px: the bar appears once the hero's door has scrolled away, counts the stamps as dots
  with the latest German name, shows "Alles drin." for the last ~40px and leaves as the closing door
  clears it (checked in 20px steps on the phone).
- Reduced motion: never armed; every stamp drawn, "Alles drin." shown, the bar appears without
  sliding.
- B1.1 (Im Bau): no ticket, no bar, page unchanged.
- No console errors. The buy buttons read "See pricing"/"Pricing" locally because the checkout ids
  are build-time env vars this sandbox does not have; production renders "Buy A1.2 — €40.00".

Not verified: a real phone, and the signed-in owner door on the ticket (it reuses
`data-course-door`, so CourseCheckout swaps it like the other two doors).
