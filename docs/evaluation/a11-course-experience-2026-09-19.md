# A1.1 course experience: evaluation and rebuild plan (2026-09-19)

Owner directive (2026-09-19), on the finished free A1.1 course: it feels "very simple … no
curriculum, no clarity, no journey, no beginning, no end, no middle … the user is lost … no
guidelines, no directions … design is very boring", and — the money question — "why would I pay".
The goal set with it: the best, most fun, most beneficial German beginner course, head to head with
Babbel, Busuu, DW Nicos Weg and Duolingo. This document is the honest evaluation that directive
asked for and the rebuild plan the owner approved on the same day. Everything below is measured
against `main` @ `f2c9808` unless a line says otherwise; the working tree already carries the first
uncommitted Wave 0 edits (the Astro CTAs), so a reader diffing against the tree will find some
front-door findings already moved. A1.1 is the free funnel into the paid levels (`src/data/pricing.js`
`LEVEL_COURSES`); nobody buys A1.2 after a confusing free A1.1, so this is a money document as much
as a pedagogy one.

**Bottom line.** The course is linguistically rigorous and structurally complete, and it was never
designed or reviewed as an *experience*. Every one of the owner's complaints has a concrete root
cause in the code, and none of them is the content.

## 1. Method

Three exploration passes, one competitive check, and first-hand code reading:

1. **Content map** — `src/data/curricula/a11.js` (12 Lektionen, `notice`, `phonetik`, `links`,
   `schreiben`, `sprechen`), the built pools `src/data/lessonPools/a11.json` + `a11.extra.json`
   (614 items with `explanationDe`), `src/lib/lesson/buildLesson.js` (which authored fields reach a
   stage), `scripts/validate-curriculum.mjs`.
2. **Learner-journey trace** — a signed-out visitor from `/` to `/course/a1.1` to
   `/course/a1.1/l/1` and through the nine stages, driven by Playwright against a
   `scripts/serve-like-netlify.mjs` build, with screenshots (the "before" set is referenced from the
   walkthrough checklist in §7; per-wave sets go to `docs/evaluation/screenshots/a11-w<n>-*.jpg`).
3. **Docs digest** — `docs/course-standard-2026-09-12.md`, `docs/course-factory-tracker.md`,
   `docs/HANDOFF-2026-09-03.md` §5, the 23 DaF reviews under `docs/course-factory/a11-rebuild/`,
   `docs/language-strategy.md`.
4. **Competitive check** (web, 2026-09-19): Babbel is dialogue-led and highly visual, puts explicit
   grammar tips inside the lesson and has a review manager; Busuu sells a CEFR study plan,
   native-speaker video and a certificate; DW Nicos Weg opens every episode with a two-minute video
   story with transcript, free A1–B1; Duolingo is a path with guidebooks, streaks and one exercise
   per screen. Our real edge, which none of them has at this price: AI-graded Goethe writing on
   every Lektion plus per-word read-aloud scoring. Our real gap: comprehension, orientation, media,
   feel.

One thing must be said plainly. The 23 adversarial DaF reviews (5 BLOCKER / 45 MAJOR at #1 down to
0 / 0 at #23) measured **German correctness and exam fidelity** — dialogues, notices, items,
checker, checkpoints, the KI prompt. They did not measure whether a day-one English speaker can
follow the course, and review #23 says so itself: "der Kurs ist nicht auf einem echten Gerät mit
einem echten A1-Lernenden gemessen worden — alles hier ist gegen den Code gemessen, nicht gegen
einen Menschen; `weekly_metrics` wird das zeigen, nicht dieses Review"
(`docs/course-factory/a11-rebuild/REVIEW-daf-23-2026-09-12.md:435–437`). Nobody has used the
rebuilt course as a learner.

## 2. Scorecard

Scores out of 10; evidence is what a reader can open.

| Dimension | Score | Evidence |
|---|---|---|
| Curriculum & pedagogy (DaF) | 8 | 12 situational Lektionen with Goethe can-dos; pretest → input → notice → practice → speak → write → recap (`src/lib/lesson/buildLesson.js`); 4 exam-format checkpoints; AI-graded writing (`netlify/functions/evaluate-writing.mjs`); scored read-aloud (`src/lib/lesson/readaloud.js`); Babbel review ladder 1→4→7→14→60→180 d (`src/lib/lesson/mastery.js:44`). 23 DaF reviews, 0 BLOCKER / 0 MAJOR at #23. |
| Comprehensibility for a day-one beginner | **2** | Every grammar explanation (`notice.bodyDe`), every wrong-answer explanation (`explanationDe` on all 614 pool items) and the whole lesson chrome (`Schritt 4 · Üben` `PracticeItem.jsx:109`, `Schritt 3 · Grammatik` / `Verstanden` `NoticeStage.jsx:24`, `Ihre Antwort` `PracticeItem.jsx:138`, `Prüfen` `PracticeItem.jsx:180`, `DictationItem.jsx:99`) are German only. `docs/language-strategy.md:5` says grammar explanations are English-first; the course breaks the site's own rule. |
| Orientation / journey | **2** | `src/pages/CurriculumHomePage.jsx`: "German A1.1", XP/streak/done tiles, a path of 17 nodes in chapters titled literally `Lektion ${first}–${last}` (line 145). No welcome, no "how this works", no "by the end you can…", no character intro, no weekly time estimate, no placement hook. Lektion 1 opens cold on a pretest: „Wie heißen Sie? Antworten Sie mit einem Satz." (`a11.js:219`). |
| Media / richness | **1** | No image or illustration anywhere (`public/` holds logos); no video; audio is browser TTS labelled „Computerstimme" on every line (`DialogStage.jsx:33`) because `src/data/curricula/a11.audio.js` is the empty manifest stub — the Azure pipeline exists (`scripts/generate-course-audio.mjs`), the owner run is pending. Wortfeld = text chips (`WortfeldStage.jsx`). |
| Visual design of the lesson | 4 | Tokens are correct (Fraunces, hairline rules, `siegel` teal) but the lesson screens are text on paper; the Playful Depth pass of the design renovation reached the marketing pages, not the engine. Feedback is a text line, option chips are small, no per-stage variety, no moments. |
| Use of authored content | 4 | `phonetik` authored for all 12 Lektionen (`a11.js:230, 443, 602, 703 …`) and never rendered — `buildLesson.js` has no phonetik stage; `links` (`a11.js:255, 511`) never read; only 7 of 614 pool items reach a learner per Lektion (review #23's own draw: 252 items over three attempts); warm-up review cards are read-only. |
| Front door / funnel | **1** | At `f2c9808` six of seven public "Start A1.1 free" CTAs point at `/grammar/a1.1/` (the grammar topic list), not at `/course/a1.1`: `astro-site/src/pages/index.astro:268`, `pricing.astro:325` ("Explore A1.1"), `courses/index.astro:109`, `courses/[level].astro:108` and `:311`. The only link to the real course is a tertiary "Lektion 1 ansehen →" that lands mid-lesson. `src/components/BottomNav.jsx:12` has no course tab and its Home tab is `/dashboard`, a guarded route. Three competing A1.1 surfaces: `/course/a1.1`, `/a1-1-phase` (`App.jsx:230`), `/level/a1.1` (`App.jsx:334`). The path's last node and the footer "Final test" (`CurriculumHomePage.jsx:39, 144, 204`) go to `/modelltest/*` behind `ExamSubscriptionGuard` — see root cause (e) for what that guard actually does. |
| Lesson immersion | 3 | Screenshots: every lesson stage renders the full site `Navbar` (`App.jsx:117`) and the full marketing `Footer` (`App.jsx:533` — grammar hub links, exam guides, pricing) under a mostly empty screen; the dialogue needs nine taps of „Nächste Zeile" (`DialogStage.jsx:57`); the automated walkthrough showed a possible Sprechen↔Hören loop around `LessonPlayerPage.jsx:151–162` (verify by hand in Wave 0). |
| Motivation loop | 6 | Forgiving streak, exam-date plan (`src/lib/course/plan.js`), signed-out first lesson + merge (`src/lib/course/localProgress.js`), course-reminder mailer — right, and shipped. Missing: milestones, recap word cards, combo / micro-feedback, endowed progress from the placement test. |
| Seams / correctness | 5 | `CourseCertificatePage.jsx:23` reads `course.programKey` (the legacy grammar program), not the curriculum ledger; two disjoint SRS systems (`review_cards` in `src/services/reviewService.js` vs `vocab_srs_cards` in `srsService.js`); `hoursTotal: 54` (`a11.js:150`) against 5.8 h of real content plus an assumed 48 h of "accompanying work" (`a11.js:43`); the standard's own pool figures are stale; no Landeskunde; no tap-word gloss. |
| Measurement | 1 | `public.weekly_truth_metrics()` measures the grammar hub (`weekly-truth.mjs:53` renders `grammar.one_and_done_14d`), not the course — `lesson_progress` is not in it. The one-and-done fix of 2026-09-03 was never verified. No human has used the rebuilt course. |

## 3. Root causes, in order of leverage

**(a) The front door points at the grammar list.** A visitor who clicks "Start A1.1 free" on the
homepage, the pricing page, the courses hub or the level page lands on `/grammar/a1.1/` — a list of
grammar topics in the old, slug-sequenced shape the standard explicitly retired ("the one shape no
professional syllabus uses", `docs/course-standard-2026-09-12.md` §2.1). The 12-Lektion course
exists one click away and nothing on the page says so. This alone explains "no curriculum, no
beginning": the owner, like every visitor, was probably never on `/course/a1.1`. The handoff's leak
is the same leak: of 167 users who ever did a grammar topic, 69 did exactly one, 35 of them the old
first lesson, "21% of everyone who has ever done a lesson … They quit on the first lesson they are
given" (`docs/HANDOFF-2026-09-03.md` §5, lines 179–186). The reorder of 2026-09-03 changed which
grammar topic comes first; it did not change that the door opens onto the grammar hub.

**(b) German-only explanations and chrome for a day-one beginner.** Someone on Lektion 1 knows no
German by definition. The rule card they are asked to read, the explanation of why their answer was
wrong, and the buttons around both are all in German. `docs/language-strategy.md` sets the opposite
rule for the whole site; `notice.bodyDe` has no `bodyEn`, the 614 `explanationDe` have no English
twin, `explain-answer.mjs` has no `lang`. The DaF reviews could not see this because their brief was
the German. This is the "no clarity" complaint, and it is a data gap first (Wave 1.1) and a chrome
gap second (Wave 1.2).

**(c) No orientation layer.** There is no welcome, no journey description, no outcomes, no
Lektion intro. `CurriculumHomePage.jsx` shows tiles and a path whose chapter headings are number
ranges; `LessonPlayerPage.jsx` opens on the pretest. A learner is never told what the course is,
how a Lektion is built, how long it takes, who Ana and Tim are, or what they will be able to do at
the end — although every one of those facts is already authored (`canDo`, `minutes`, `DIALOG_NAMES`,
`SUSTAINABLE_PER_WEEK`). "No journey, no beginning, no end, no middle … the user is lost" is
literally the absence of this layer.

**(d) No media, and the site footer inside the lesson.** Zero illustrations, no video, TTS audio
marked „Computerstimme" on every line, Wortfeld as text chips — against competitors whose A1 opens
with a video story (Nicos Weg), a native-speaker clip (Busuu) or an illustrated dialogue (Babbel).
Then every lesson stage is framed by the marketing navbar and the full footer with grammar links,
exam guides and pricing, so a mostly empty practice screen sits above a wall of unrelated links.
"Design is very boring" is this: the token system is sound, the engine never got a design pass.

**(e) Authored content never rendered, plus seams.** `phonetik` for all 12 Lektionen and `links`
are dead data; the review warm-up is read-only; 7 of 614 items per Lektion reach a learner. The
certificate page reads the legacy program key, so a finished curriculum does not certify. Two SRS
systems never meet. `hoursTotal: 54` is an assumption stacked on 5.8 h. And the finish line: the
last path node and the footer "Final test" go to `/modelltest/<slug>` under `ExamSubscriptionGuard`.
Read carefully, that guard admits any signed-in user to the A1.1 Abschlusstest
(`src/components/ExamSubscriptionGuard.jsx:22–26`: `hasLevelAccess('a1.1')` is always true, a
recorded decision), so for the signed-in learner it is free — but an anonymous learner who did the
free Lektion 1 hits `/login` there with no label saying the test is free, and nothing on the course
page says so either. Unmarked, it reads as a paywall. Finally, none of this is measured:
`weekly_truth_metrics()` has no course block, so the one signal review #23 deferred to
("`weekly_metrics` wird das zeigen") does not exist yet.

## 4. What is genuinely strong (keep)

- **Curriculum rigour.** Situation-first Lektionen with quoted Goethe can-dos, checkpoints every
  three, the 9-step anatomy, ratchets in `scripts/validate-curriculum.mjs` that only go down. The
  content survived 23 adversarial reviews; it is not the problem and the waves below do not touch
  its German.
- **One grader.** `src/lib/lesson/check.js` decides every answer (separator folding, TYPO vs WRONG,
  `caseSensitive` where capitalisation is the task). Every wave keeps it the single grader.
- **AI writing + read-aloud scoring** on every Lektion — the moat no competitor offers at this
  price; the standard's "checklist decides form, KI decides meaning" rule is settled.
- **Forgiving streak, exam-date plan, signed-out first lesson with merge on signup**, and the live
  course-reminder mailer — the motivation scaffold is right; it lacks moments, not mechanics.
- **The token system.** `src/data/design-tokens.js`, one button, one card, colour = grammatical
  case, one interactive colour, brand ratchets at 0. The redesign of the engine happens inside
  these rules, not around them.

## 5. Rebuild plan — four waves, one PR each

Working rules for every agent: JS only; keep `src/lib/lesson/check.js` the single grader; keep
Sie in every German string; never edit A1.2 (`a12.js`, `a12.*.json`); after any content edit run
`node scripts/build-lesson-pool.mjs a1.1` then `node scripts/validate-curriculum.mjs`; full CI
sequence from `.claude/skills/steward/SKILL.md` before push; never commit
`astro-site/package-lock.json`; colour = grammatical case, one interactive colour, no retired
palette (`tests/brand.test.mjs` at 0); no price literals, usage counts or pass promises.

### Wave 0 — Front door (one day, ships first, biggest lift per hour)

Agent owns Astro CTAs + nav + player shell. No new routes.

- Point every "Start A1.1 free" CTA at `/course/a1.1` (index, pricing, courses hub,
  `courses/[level].astro` hero + bottom; keep the grammar hub reachable as "Browse grammar").
  `tests/language-strategy.test.mjs` / `conversion-trust.test.mjs`: add a test that no Astro page
  labels a `/grammar/` link "Start … course".
- `BottomNav.jsx`: add a "Kurs" tab → `/course/a1.1` (or the learner's level); free learners'
  Home tab must not be a paywall (route Home to the course when `!isSubscribed`).
- Lesson player shell: render `/course/:level/l/*`, `/checkpoint/*`, `/review` **without the
  site navbar and footer** (a focused player layout in `App.jsx` — check how `Navbar`/`Footer`
  are mounted); one exit control (`← A1.1`).
- Free finish line: verify `abschlusstest-a1-1` is free (`hasLevelAccess('a1.1')` per
  tracker) and that `/modelltest/<slug>` is not blocked by `ExamSubscriptionGuard` for it; if it
  is, route the last node/footer to the free course test and label it. Never an unmarked paywall.
- `DialogStage.jsx`: "Alle Zeilen zeigen" secondary; reproduce and fix the Sprechen↔Hören loop.
- Retire the competing A1.1 surfaces from navigation: `/a1-1-phase` and `/level/a1.1` link
  to `/course/a1.1` as the course; leave the routes (no 404s) but no CTA points at them.

### Wave 1 — Orientation & comprehension (fixes "lost")

**W1.1 Bilingual explanations (data).** Agent A owns `src/data/curricula/a11.js`, the pool
files, the validator.

- Add `bodyEn` to all 12 `notice`s, `taskEn` to the 12 `schreiben`, `promptEn` to the 12
  `sprechen.open` (hand-written; ≤80 words, German forms bold).
- New sidecar `src/data/lessonPools/a11.explanationsEn.json` `{ itemId: "≤35-word English" }`
  for all 614 pool items, **authored by agents in batches** (no `ANTHROPIC_API_KEY` in this
  environment, so no script); `scripts/build-lesson-pool.mjs` merges `explanationEn` from the
  bank cache (`explanation_en || why_correct_en`) → sidecar → templates for its 25 generated items.
- Validator RULE 25 (a1.1 hard 0; a1.2 measured ratchet in `LEVELS`): every notice/pretest/
  schreiben/sprechen has its English twin, every built item has `explanationEn`. Tests in
  `tests/curricula.test.mjs` + `tests/lesson-pool-rules.test.mjs`.

**W1.2 English chrome + Deutsch-Modus.** Agent B owns `src/components/lesson/*.jsx`,
`src/pages/lesson/*.jsx`, `src/components/course/*.jsx`, `tests/course-player.test.mjs`.

- New `src/lib/lesson/strings.js`: `STRINGS.en` / `STRINGS.de`, `useLessonLang()` (flag
  `dm_lesson_lang` via `src/utils/safeStorage.js`, default `en`), `t(key)`. Every German literal
  in the lesson chrome → `t()`. Toggle "Deutsch-Modus" in the player header and course footer.
- Register test: add `strings.js` to `CHROME_FILES` (de table stays Sie); new test: both tables
  have the same keys, and no component carries a banned German chrome literal.
- Render `bodyEn` first in `NoticeStage.jsx` with "Auf Deutsch" disclosure; `explanationEn` first
  in `PracticeItem` feedback; `ExplainAnswer.jsx` + `netlify/functions/explain-answer.mjs` get a
  `lang` field with an English system-prompt variant (still grounded in the rule card).

**W1.3 Course meta, Welcome, map, outcomes, placement hook.** Agent C owns new
`src/data/curricula/a11.meta.js`, `src/pages/CurriculumHomePage.jsx`, new
`src/components/course/{CourseWelcome,CourseOutcomes,FirstRunTour,PathNode}.jsx`, and
`src/components/LevelTest/LevelTestResults.jsx` (one CTA).

- `a11.meta.js`: 4 named chapters with a story line ("Ankommen" L1–3, "Einkaufen & Dinge" L4–6,
  "Alltag & Freizeit" L7–9, "Unterwegs & Feiern" L10–12), characters (Ana, Tim, Lena, Frau Kaya,
  Herr Weber, Paul: role, blurb, first appearance), `lektionIntro` per Lektion (`situationEn`,
  `canDoEn[]` parallel to `canDo`), outcomes derived from can-dos, weekly estimate derived from
  `minutes` + `SUSTAINABLE_PER_WEEK` in `src/lib/course/plan.js` (never a retyped hour figure).
  Test: intro for every Lektion, `canDoEn.length === canDo.length`, chapters partition 1..12,
  characters ⊂ `DIALOG_NAMES`.
- Course home: chapter names + story replace "Lektion 1–3"; `CourseWelcome` (what it is, the
  9-step lesson in one row, minutes/week, characters strip, "By the end you can…", "Start Lektion
  1 — no account needed"); `FirstRunTour` (3 coach-marks, once, `dm_tour_a11`); footer link "How
  this course works". Endowed progress: if `profiles.current_level` > a1.1, unlock all nodes and
  show a "placed by your test" segment (copy: "your test suggests", no level promises).

**W1.4 Lektion intro screen + funnel events.** Agent D (integrator) owns
`src/pages/lesson/LessonPlayerPage.jsx` + new `src/components/lesson/IntroStage.jsx`:
player-level `introDone` state (not a `buildLesson` stage): title, `situationEn`, "By the end
you can…", characters here, minutes, Start. Fires `trackLessonStarted/Completed` from
`src/lib/funnelTracking.js` (consent-gated). Agent D merges A–C, runs the content gates + CI,
takes the Playwright screenshots, opens PR W1.

### Wave 2 — Feel (premium and fun, inside the token rules)

- **W2.1 Stage screens + feedback sheet + combo** (`StageShell`, `PracticeItem`,
  `DictationItem`, new `FeedbackSheet.jsx`, `ComboChip.jsx`): 44-px full-width option chips,
  correct/typo/wrong as a bottom sheet with icon + text + tone and the single Continue action,
  combo after ≥3 first-try corrects (no XP inflation), optional quiet sound behind a mute toggle
  (default off), all motion under `prefers-reduced-motion`; per-stage `variant` tones (input =
  paper, practice = white card, speaking = wash), never kasus colours.
- **W2.2 Progress ring, recap cards, milestones** (`RecapStage`, new `LessonRing.jsx`,
  `MilestoneCard.jsx`, `WordsLearnedCards.jsx`): ring per node, recap shows the Lektion's words
  as flip cards + the grammar point + next review date, milestone cards on streak day 1/7/30
  from `streakForgiving`.
- **W2.3 Illustrations — owner decided: AI-generated flat art via Higgsfield.** One style
  sheet first (flat vector look, warm paper background, palette from `design-tokens.js`, no text
  in image), then 6 character portraits (Ana, Tim, Lena, Frau Kaya, Herr Weber, Paul) and 12
  situation scenes, generated with the Higgsfield image MCP (character-sheet workflow for
  consistency), saved as WebP ≤60 KB each into `public/art/a11/` with a manifest
  `src/data/curricula/a11.art.js` (`{ characters: {name: src, alt}, situations: {lektionId:
  {src, alt}} }`), rendered with `loading="lazy"` + fixed aspect box (CLS) and a token-coloured
  placeholder when missing; the manifest is validated by a test (every Lektion + every
  DIALOG_NAMES character has an entry with alt). Used by IntroStage, chapter headers, Welcome
  characters strip, DialogStage speaker avatars. Owner cost: Higgsfield credits (~25 images with
  retries). Fallback if generation quality is inconsistent: inline SVG for that asset.
- **W2.4 Wortfeld picture cards** (`WortfeldStage.jsx` + `a11.meta.js wortfeldIcons`): 2-up
  cards with icon/scene, word, article chip, plural, audio; tap flips to English. Test: every icon
  resolves in `lucide-react`.

### Wave 3 — Use everything authored

- **W3.1 Phonetik stage** in `buildLesson.js` after the notice + `PhonetikStage.jsx`
  (audio key `phonetik-<i>` already planned by `scripts/generate-course-audio.mjs`).
- **W3.2 Interactive warm-up**: extract `ReviewPage.jsx` mode renderer into
  `components/lesson/ReviewCard.jsx`, grade through `gradeCard()`.
- **W3.3 Three derived item types per Lektion (7 → 10 items)**: `match` (Wortfeld pairs),
  `word_order` (tap-to-build a dialogue line), `listen_select`; derived from the Lektion's own
  data so the pool draw and ratchets don't move; `checkOptionsFor`/`tagError` learn the types.
- **W3.4 Tap-word gloss** in `DialogStage.jsx` against this + earlier Wortfelder.
- **W3.5 Certificate/complete page on the curriculum ledger** (`programKeyFor`,
  `curriculumPath`), wording "Teilnahmebescheinigung — kein Goethe-/telc-Ergebnis".
- **W3.6 Landeskunde card per checkpoint, "Go deeper" links from `links`, "Add these words to
  my vocab deck" bridge via `src/services/srsService.js`.**

### Wave 4 — Audio & measurement

- **Owner:** run the Azure audio job per `docs/owner-prompts.md` §Audio (`node
  scripts/generate-course-audio.mjs a1.1 --dry`, then live; needs `AZURE_SPEECH_KEY/REGION` +
  Supabase service role, which agents cannot reach), commit `a11.audio.js`. The „Computerstimme"
  badge flips to "Recording" automatically.
- **Agent:** `migrations/2026-09-19-course-funnel.sql` extends `weekly_truth_metrics()` with a
  `course` block from `lesson_progress` (L1 started/finished, L2 started, L3 finished, course
  one-and-done 14 d, placement→course 7 d); `netlify/functions/weekly-truth.mjs` renders it;
  `tests/weekly-truth.test.mjs` pins keys. Owner applies the SQL (schema change).

### Deliverables, verification and conflict map

- Per wave: one draft PR on `claude/intelligent-bell-lx6k0j` (W0 first, then W1), squash; gates
  from the steward skill from a clean `dist/`; Playwright shots of `/course/a1.1` and
  `/course/a1.1/l/1` (Welcome, Intro, Notice, Practice feedback, Recap) at 360×800 and 1280×800
  served via `scripts/serve-like-netlify.mjs`, stored as
  `docs/evaluation/screenshots/a11-w<n>-*.jpg`; screenshots eyeballed before merge.
- This document's §7 checklist is re-filled after each wave.
- Conflict map (one owner per file per wave): `a11.js` (W1.1 only) · lesson components (W1.2,
  then W2.1) · `buildLesson.js` (W3 only) · `validate-curriculum.mjs` (W1.1, then W3.3) ·
  `LessonPlayerPage.jsx` (integrator only) · `CurriculumHomePage.jsx` (W1.3, then W2.2) ·
  `a11.meta.js` (W1.3 creates, W2/W3 append) · A1.2 files never.

## 6. Wave table

| Wave | Fixes | Touches | Depends on |
|---|---|---|---|
| W0 Front door | (a), finish line of (e), footer-in-lesson of (d) | Astro CTAs, `BottomNav.jsx`, `App.jsx` player layout, `DialogStage.jsx` | — |
| W1 Orientation & comprehension | (b), (c) | `a11.js` + pools + validator; lesson chrome; course home + meta; `LessonPlayerPage.jsx` | W0 |
| W2 Feel | (d) | stage components, recap, art manifest, Wortfeld | W1 (meta, intro) |
| W3 Use everything authored | (e) | `buildLesson.js`, review card, item types, gloss, certificate | W1, W2 |
| W4 Audio & measurement | (d) audio, (e) measurement | `a11.audio.js` (owner), funnel SQL + `weekly-truth.mjs` | W1 (events) |

## 7. First-time learner walkthrough

Ten yes/no questions a first-time learner should be able to answer; "before" is filled from the
findings above against `f2c9808`, the wave columns are filled after each merge from the
screenshots.

| # | Can the learner answer… | Before | After W0 | After W1 | After W2 | After W3 |
|---|---|---|---|---|---|---|
| 1 | Do I know what this course is (a 12-Lektion A1.1 course, not a grammar list)? | No — six of seven CTAs land on `/grammar/a1.1/` | | | | |
| 2 | Do I know where I am (chapter, Lektion, step)? | Partly — a progress bar and „Schritt 4 · Üben", chapters are number ranges | | | | |
| 3 | Do I know what I will be able to do at the end? | No — `canDo` is authored, never shown | | | | |
| 4 | Do I know how long a Lektion takes and how much per week? | No — `minutes` authored, never shown; `hoursTotal: 54` unexplained | | | | |
| 5 | Do I understand the grammar rule, in my language? | No — `notice.bodyDe` only | | | | |
| 6 | Do I know what to do when I am wrong? | Partly — a TYPO retry exists; the explanation is German only | | | | |
| 7 | Do I know who the characters are? | No — Ana and Tim appear unintroduced in the first dialogue | | | | |
| 8 | Do I know what comes next after this Lektion? | Partly — the path shows the next node; the recap names a review date, no story | | | | |
| 9 | Do I know whether my progress is saved? | Partly — signed-out progress is local and merged on signup, but the player does not say so | | | | |
| 10 | Do I know where the course ends and what it costs? | No — the last node goes to `/modelltest/*` and, signed out, to `/login`; nothing says it is free | | | | |

## 8. Owner actions and success metric

Owner, by hand (agents cannot reach these):

1. Approve this plan — done 2026-09-19; the illustration path is decided (Higgsfield).
2. After W1 merges: run the Azure audio job (`docs/owner-prompts.md` §Audio; one command, about
   seven cents), commit `src/data/curricula/a11.audio.js`.
3. After W4: apply `migrations/2026-09-19-course-funnel.sql` in Supabase.
4. During W2: Higgsfield credits for roughly 25 image generations including retries.

Success metric — measured, not claimed, per the `weekly_metrics` rule in `CLAUDE.md`: the new
`course` block in `weekly_metrics` shows L1→L2 continuation rising above the baseline the handoff
measured, where 21 % of everyone who ever did a lesson quit on the first one
(`docs/HANDOFF-2026-09-03.md` §5). Until that row exists, no wave may claim the course is "less
confusing"; review #23 already deferred that judgement to the same table.
