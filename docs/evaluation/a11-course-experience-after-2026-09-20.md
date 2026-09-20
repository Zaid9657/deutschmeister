# A1.1 course experience: the "after" evaluation (2026-09-20)

This is the honest re-play of the free A1.1 course the "before" document
(`docs/evaluation/a11-course-experience-2026-09-19.md`) called for after the rebuild waves —
played as an absolute-beginner, signed-out, on a 390×844 phone viewport, against `npm run dev`
on this branch (which is merged `main`). Driven with `playwright-core` 1.57 + the sandboxed
Chromium at `/opt/pw-browsers/chromium-1194`. Screenshots: `docs/evaluation/screenshots/after/`
(25 files, JPEG q60). Every claim below is grounded in one of those screenshots, a console log
line, or a source file read during this session — not in the wave plan's intentions.

**Sandbox caveat that affects two rows below.** This environment's egress proxy blocks
`supabase.co` (per `CLAUDE.md`), so every Supabase-backed call failed
(`net::ERR_TUNNEL_CONNECTION_FAILED`, `[lessonService] fetchWordsByIds: TypeError: Failed to
fetch`, on every lesson-page load). Word audio, the placement-test "endowed progress" path, and
anything reading `profiles`/`words` could not be exercised live. The UI degraded silently — no
broken layout, just silently absent audio — so this is a real resilience point in the app's
favour, but it means the audio and DB-personalisation rows below are read from code + the visible
"Computer voice" badges, not from a working fetch.

## Scorecard (before → after)

| Dimension | Before | After | Evidence |
|---|---|---|---|
| Curriculum & pedagogy (DaF) | 8 | 8 | Unchanged — no content wave touched the German; still 12 situational Lektionen, 23 DaF reviews at 0/0. |
| Comprehensibility for a day-one beginner | 2 | **8** | Every screen shot now shows English first: intro (`04-lektion1-intro.jpg`), pretest, dialogue, notice (`11-stage-notice-en.jpg`), practice feedback (`13-practice-item1-wrong-feedback.jpg` reads "The answer is: Entschuldigung / Join the letters..." in plain English), writing task. A visible EN/DE pill toggles the whole chrome to German (`12-stage-notice-de-mode.jpg`: "SCHRITT 1 · ERST PROBIEREN"). Not a 10: dictation-type items and MatchItem/WordOrderItem instructions are still short imperative English but terse; a true beginner still has to infer "Tap the words in order" means build-a-sentence from zero context the first time. |
| Orientation / journey | 2 | **8** | `01-course-hub-top.jpg` now opens on a named Chapter 1 "Arriving" card with a 3-step "Quick tour" overlay (`02-course-hub-tour.jpg`); Lektion intro screens exist and show can-dos + a two-person cast with portraits before the lesson starts (`04-lektion1-intro.jpg`, `23-lektion2-intro.jpg`). Still missing a full "how this course works" explainer and a weekly-time estimate anywhere I saw. |
| Media / richness | 1 | **4** | Chapter cards carry a small flat SVG scene (orange sun, a shelf — `01-course-hub-top.jpg`); character avatars are simple flat portraits (`04-lektion1-intro.jpg`); Wortfeld cards got Lucide icons per word instead of bare text chips (`10-stage-wortfeld.jpg`). Still: every dialogue line and Wortfeld card is explicitly labelled **"COMPUTER VOICE"** (`07-stage-dialog-start.jpg`, `10-stage-wortfeld.jpg`) — the Azure audio run has not happened. No photography, no video, no per-Lektion illustrated scene (the chapter art is generic/reused, not scene-specific). |
| Visual design of the lesson | 4 | **7** | The lesson now renders in a focused shell with no site navbar/footer (confirmed in `App.jsx`: `{!focused && <Navbar/>}`), so every stage screenshot is just the lesson card on a calm paper background. Wrong-answer feedback is a real bottom sheet with icon + colour + explanation (`13-practice-item1-wrong-feedback.jpg`) — a clear step up from a text line. Still text-heavy and mostly white/paper; no per-stage visual variety beyond colour of the feedback sheet. |
| Use of authored content | 4 | **6** | Practice now draws real derived types — a match-the-pairs screen (`14-practice-item8-match.jpg`) and a tap-to-build word-order screen (`15-practice-item9-wordorder.jpg`) in addition to typed fill-in items — not just 7 static fill-blanks. Still unverified in this run: phonetik stage render, `links` usage, and whether all 24 pool items for L1 actually get surfaced across attempts (this run only saw ~9-12 in one pass). |
| Front door / funnel | 1 | **9** | `astro-site/src/pages/index.astro:268` and `pricing.astro:325` now link to `/course/a1.1`, not `/grammar/a1.1/` (grepped directly). `BottomNav.jsx` has a dedicated "Kurs" tab wired to `courseHomeFor()`. Course hub explicitly offers "Start Lektion 1 — no account needed" as the primary CTA. Not a 10 only because I didn't re-verify every one of the seven CTA sites named in the before-doc. |
| Lesson immersion | 3 | **8** | No marketing chrome inside the player (confirmed in code and every stage screenshot); "← A1.1" is the only way out. Clean, single-purpose screens throughout the run. |
| Motivation loop | 6 | 6 | Unchanged in this pass — same streak/plan/mailer mechanics; recap screen with word cards/milestones was not actually reached in this run (see walkthrough note below), so I can't confirm W2.2 shipped. |
| Seams / correctness | 5 | **4** | **New finding, this run**: `LessonPlayerPage.jsx` (~line 311) spreads a `derivedProps` object containing `key: item.id` into `<MatchItem {...derivedProps}/>` / `<WordOrderItem .../>` / `<ListenSelectItem .../>` — React logs "A props object containing a 'key' prop is being spread into JSX" on every derived-item render (seen twice in this run's console log). `key` set this way is silently dropped, which risks stale component state across item transitions in exactly the newest, least-tested stage type. Everything else scored unchanged. |
| Measurement | 1 | 1 | Not re-checked this run (out of scope for a UI walkthrough); no evidence it changed. |

## The 10-question walkthrough

| # | Question | Before | After |
|---|---|---|---|
| 1 | Do I know what this course is? | No — CTAs led to the grammar list | **Yes.** Hub opens on "Chapter 1 · Arriving", a tour, and "Start Lektion 1 — no account needed" as the loudest CTA. |
| 2 | Do I know where I am (chapter/Lektion/step)? | Partly | **Yes.** Every stage header reads "STEP n · <name>" plus "Lesson 1" at the top; the intro screen states the chapter and Lektion by name. |
| 3 | Do I understand what went wrong on a miss? | Not assessed | **Yes, clearly.** The wrong-answer sheet spells out the rule in plain English with the letters/word bolded (`13-practice-item1-wrong-feedback.jpg`). |
| 4 | Do I know how long this takes? | Not assessed | **Partial.** "ABOUT 15 MIN" badge on the intro screen; no weekly cadence or "X of 12 Lektionen" progress stated on that screen itself (the hub separately shows 0/4 done). |
| 5 | Can I tell German-only text from a translation? | No — all German | **Yes.** English renders first almost everywhere; a Deutsch-Modus toggle exists and visibly re-labels the whole chrome. |
| 6 | Is there a clear single next action per screen? | Mostly yes | **Yes**, consistently — one primary button per screen throughout the run (Start / Check / Continue / Submit). |
| 7 | Do I ever get stuck with no way forward? | Not assessed | **Partial — see below.** The requeue ("Step 7 · Try again") stage demands correct retries of missed items with no skip; my scripted run stalled there for several rounds. A real learner can type the right answer (given in the earlier feedback sheet) and move on, but there is no visible "skip" if they truly don't know it. |
| 8 | Does the writing task feel like a real task? | Not assessed | **Yes.** It's a structured registration-form fill-in (5 labelled fields) with a live, honest checklist ("Sign in to get an AI assession. This checklist only checks the form... It doesn't correct your German.") — sets expectations correctly for a signed-out user. |
| 9 | Is audio believable? | "Computerstimme" everywhere | **Still no** — every audio surface is explicitly badged "COMPUTER VOICE" in English now, which is honest labelling but the underlying gap (no real recordings) is unchanged. |
| 10 | Does finishing feel like an achievement? | Not assessed | **Not confirmed.** My run did not cleanly reach the "Lesson complete" recap screen (see below) — it stalled in the requeue loop, so I cannot honestly score the recap experience this round. |

**Note on #7/#10**: my scripted run answered the first 3 practice items wrong on purpose, which
correctly triggered a "Step 7 · Try again (1/4)" requeue of those misses — expected, intended
behaviour, not a bug. My driver script did not carry forward the correct answers into the requeue
stage, so it could not complete that stage in the time budgeted, and the true recap screen
(word cards, mastery, milestones) was not captured. This is a testing-harness limitation, not a
confirmed product gap — but it does mean the "after" recap experience (part of the before-doc's
Wave 2.2 plan) is **unverified**, not confirmed-good.

## Still weak vs. Babbel / Busuu / Nicos Weg / Duolingo — ranked

1. **Audio is still a synthetic voice on every line, badged as such.** `07-stage-dialog-start.jpg`,
   `10-stage-wortfeld.jpg` both say "COMPUTER VOICE" plainly. Nicos Weg and Babbel both open with
   real voice. Fix: run the pending Azure audio job (`docs/owner-prompts.md` §Audio).
2. **A real console bug in the newest stage types.** `key` passed via prop-spread in
   `LessonPlayerPage.jsx` for MatchItem/WordOrderItem/ListenSelectItem — React warns on every
   render of a derived item; on future React versions dropped keys can cause stale/duplicated
   component state exactly on transitions between exercise types. Fix: pass `key={item.id}`
   directly on the JSX tag, not inside the spread object.
3. **The requeue ("try again") stage has no visible skip or hint for someone who genuinely
   doesn't know the answer**, unlike Duolingo's hearts-based forgiveness or Babbel's "show me"
   option. A first-time learner who gets 3 items wrong on purpose (as instructed here) hits a
   wall with no escape hatch on screen. Fix: add a "Show the answer" fallback after N attempts,
   matching the pretest stage's own pattern.
4. **Illustration is a shared, generic scene per chapter, not a per-Lektion or per-situation
   image.** The Chapter 1 card art (`01-course-hub-top.jpg`) is a flat abstract shelf-and-sun
   graphic that reads as a placeholder rather than "Ana checks into a hostel" — it does not depict
   the situation the Lektion teaches, unlike Nicos Weg's story videos or Babbel's illustrated
   dialogues. Fix: Wave 2.3's planned Higgsfield-generated situation art has not shipped.
5. **Wortfeld cards use generic Lucide icons, not scene-appropriate art.** "Hallo" gets a waving
   hand, "Guten Morgen"/"Guten Abend" get sun/sunset icons — serviceable but generic stock-icon
   language, not a designed vocabulary system (`10-stage-wortfeld.jpg`).
6. **The "about 15 min" estimate is not visibly reconciled with what a learner actually does.**
   Nine-plus screens including a dictation, a match, a word-order and a full 5-field writing task
   with a form-check feels closer to 15–20 minutes done carefully, and the before-doc's own audit
   flagged `hoursTotal: 54` as an unverified aggregate — nothing on-screen during the lesson itself
   shows elapsed or remaining time, so "honest 15 min" is unverifiable from the UI alone.
7. **Dictation-type instructions assume the learner already knows the mechanic.** "What do you
   hear?" with a synthetic voice and no visible transcript-toggle parity with the dialogue stage's
   "Show all lines" — the dialogue stage got a comprehension safety net, the dictation stage did
   not appear to.
8. **No milestone/achievement moment was verifiable in this run.** Because the recap was not
   reached, I cannot confirm whether finishing a Lektion feels rewarding (Duolingo's streak
   animation, Babbel's review manager) — this is the single biggest verification gap in this
   evaluation and should be re-run by hand, not by script.
9. **Layout at 390px is clean but visually repetitive.** Every stage is the same white/paper card
   in the same position — functional, never cramped or overflowing in any of the 25 screenshots,
   but nothing distinguishes a grammar card from a writing task from a dialogue at a glance besides
   the small "STEP n" eyebrow text.

## Three things that are genuinely good

1. **The front door is fixed and verified in source, not just the plan.** `index.astro` and
   `pricing.astro` now link straight to `/course/a1.1`, and the course hub itself opens on a named
   chapter with a real CTA — the single biggest root cause from the before-doc is closed.
2. **The wrong-answer feedback is honestly excellent.** `13-practice-item1-wrong-feedback.jpg`
   gives a plain-English rule explanation with the exact spelling underlined, right where the
   mistake happened — better than a bare "incorrect" and on par with what a good textbook margin
   note does.
3. **The lesson is now a distraction-free surface.** No navbar, no footer, no pricing upsell
   inside any of the 25 screenshots taken mid-lesson — confirmed in `App.jsx`'s `focused` chrome
   flag as well as visually.

## Verdict

A beginner who plays through Lektion 1 today would, for the first time, actually understand what
they are doing and why — the front-door, English-chrome and immersive-shell fixes closed the three
worst complaints from the owner's 2026-09-19 directive ("no curriculum," "no clarity," "the design
distracts"). But nothing in this run demonstrates the payoff moment that makes someone want a
second Lektion, let alone A1.2: the voice is still a robot on every line, the artwork still reads
as decorative placeholder rather than the situation being taught, and the one screen designed to
be a reward — the Lektion recap — could not even be confirmed working in this pass. On the
evidence gathered here, a beginner would likely finish Lektion 1, notice it is well-explained and
frictionless, and still not feel the pull that Babbel's review manager or Duolingo's streak
animation creates — so today's honest answer is: better, not yet worth paying for.
