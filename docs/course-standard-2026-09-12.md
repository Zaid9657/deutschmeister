# The DeutschMeister course standard (2026-09-12)

Owner directive (2026-09-12): "be clear on what the courses are; they have to compete with the
best online German courses; research all aspects — curriculum, design, etc. — before we rebuild."
This document is that definition. It binds every later course build the way `design-tokens.js`
binds colour. Three research memos back it, all sourced and stamped 2026-09-12:

- `docs/research/research-curricula-2026-09-12.md` — how 20 products and 5 Lehrwerke structure A1–A2
- `docs/research/research-lesson-anatomy-2026-09-12.md` — what one lesson is, feedback, review, tests
- `docs/research/research-design-engagement-2026-09-12.md` — which design/engagement patterns have evidence

The earlier buyer/market/pricing work (`docs/course-research-2026-09-03.md` and `docs/research/*-2026-09-03.md`)
still stands: the buyer is an exam candidate with a date, the moat is curriculum **plus** instant AI
grading of every spoken and written exam task, and the law forbids promising personal feedback or a pass.

## 1. What a DeutschMeister course is — one paragraph

A DeutschMeister course is **one half-level (A1.1 … B2.2) taught as 12 situational Lektionen, each a
Kann-Beschreibung from the Goethe Prüfungsziele, closed by a checkpoint test every three Lektionen and a
full level test in the official exam format**, played inside our own lesson engine (dialogue in, one
grammar point, typed practice, speaking and writing graded by AI on the Goethe criteria, spaced review
of everything learned), planned backward from the learner's exam date, bought once and kept for life.
It is not a grammar reference, not a link list, and not a game: it is the Lehrwerk that
professional teachers use (Menschen / Schritte plus / Netzwerk) rebuilt as a web course, with the
speaking and writing feedback those books cannot give.

## 2. Curriculum specification

### 2.1 Unit = situation, not grammar topic

Every mainstream Lehrwerk and both serious online providers (Lingoda, Goethe Deutsch Online) build the
unit around a **Handlungsfeld** (shopping, doctor, housing) with the grammar inside it. Our four courses
today are sequenced by **grammar slug** ("Nominativ", "Akkusativ-Intro") — the one shape no
professional syllabus uses. The rebuild flips it: the unit is the situation; the grammar is one of its
steps.

Half-level size: **12 Lektionen** (matches Menschen and Lingoda, the two most-copied designs) with a
**checkpoint after Lektion 3, 6, 9, 12**. Hours: 4–5 h per Lektion incl. review ≈ 50–60 h per
half-level, inside Goethe's own guidance (A1 = 80–200 UE for the full level).

### 2.2 Topic sequence (consensus of Menschen, Schritte plus Neu, Netzwerk neu, Linie 1, Goethe DO, DUO)

| Half-level | The 12 Lektionen, in order | Grammar ceiling |
|---|---|---|
| **A1.1** | Begrüßung & Vorstellen & Alphabet · Angaben zur Person, Beruf, Zahlen · Familie & Sprachen · Einkaufen, Möbel, Preise · Gegenstände & Farben · Büro, Technik, Telefon · Freizeit & Hobbys · Verabredungen, Uhrzeit, Tagesablauf · Essen & Trinken, Einladung · Verkehrsmittel & Reisen · Gestern (Perfekt mit haben) · Feste & Vergangenes (Perfekt mit sein) | sein/haben; Präsens incl. Vokalwechsel; W-/Ja-Nein-Fragen; Artikel def/indef/neg; Plural; Akkusativ; mein/dein; können/möchten; trennbare Verben; Perfekt regelmäßig + sein |
| **A1.2** | Wegbeschreibung · Wohnen & Wohnungsanzeigen · In der Stadt · Hotel, Termine, Reklamation · Pläne & Wünsche · Gesundheit, Körper, Arzt · Aussehen & Charakter · Haushalt · Regeln (Verkehr, Umwelt) · Kleidung & Vergleiche · Wetter · Feste & Feiern | Dativ (Präp., Verben, Pronomen); temporale Präp.; wollen/sollen/dürfen/müssen; Imperativ; war/hatte; Perfekt untrennbar; Komparation; denn; würde; Ordinalzahlen |
| **A2.1** | Berufe & Familiengeschichte · Wohnen & Umzug · Tourismus & Landschaft · Lebensmittel & Einkaufen · Stadtbesichtigung · Kultur & Veranstaltungen · Sport & Fitness · Gesundheit & Unfall · Arbeitsleben · Restaurant · Ernährung · Schule & Ausbildung | Perfekt/Präteritum Wdh.; Wechselpräpositionen; Adjektivdeklination; Konjunktiv II könnte/sollte; weil/dass/wenn; Reflexiv; Wortbildung |
| **A2.2** | Sprachen lernen · Post & Telekommunikation · Medien · Hotel & Reisen · Wetter & Klima · Kulturelle Veranstaltungen · Bücher & Presse · Ämter & Verwaltung · Mobilität & Verkehr · Ausbildung & Beruf · Arbeiten im Ausland · Online-Einkauf & Reklamation | Passiv Präsens; indirekte Fragen mit ob; Relativsatz; als/seit/bis; Präteritum Modalverben + starke Verben; Genitiv; Verben mit Dat+Akk |

Mapping rule for every Lektion: (i) 3–5 Kann-Beschreibungen quoted from the Goethe Prüfungsziele
(SD1 for A1, Goethe A2 for A2), (ii) its BAMF Handlungsfeld, (iii) the exam Teil it rehearses,
(iv) the slice of the official Wortliste it introduces (≈650 units at A1, ≈1,300 cumulative at A2),
so the running total is auditable on the public syllabus page.

### 2.3 Lektion anatomy (the 9 steps every teacher expects)

1. **Lernziele** — the can-do lines, visible before the content.
2. **Einstieg** — a 20–40 s audio/video dialogue that contains the target language before it is named.
3. **Wortfeld** — 15–25 words as a picture lexicon with article, plural and audio.
4. **2–3 Lernschritte** — one structure or Sprachhandlung each, with a Redemittel box, presented in a text then drilled.
5. **Skills block** — one Hören and one Lesen text; one Schreiben (Formular / SMS / E-Mail); one Sprechen task (Dialogkarte / Bitte formulieren) — the four exam parts in miniature.
6. **Phonetik** micro-slot.
7. **Grammatik + Kommunikation** overview page.
8. **Test + Selbstevaluation** ("Das kann ich") and the Lernwortschatz list.
9. Every 3 Lektionen: **Plateau** — Wiederholung, Landeskunde, exam-format checkpoint.

### 2.4 The public syllabus page (beats Goethe DO's grid and Lingoda's chapter cards)

Per half-level, before purchase: a 12 × 6 grid (Nr · Situation · Kann-Beschreibungen · Wortfeld
"+28 → 312/650" · Grammatik · Goethe-Teil trained), the Lektion anatomy with minutes, checkpoint
markers, running counters (words vs Wortliste, hours vs Goethe guidance, can-dos covered, exam Teile
rehearsed), one full sample Lektion open, and a provenance line naming the Prüfungsziele, Wortliste and
Rahmencurriculum editions. Downloadable as PDF.

## 3. Lesson engine specification

Target 12–15 min, ~22 items, one exercise per screen, primary action at the bottom.

| # | Stage | Min | Items | Content |
|---|---|---|---|---|
| 0 | Warm-up retrieval | 1.5 | 4 | Due items from spaced review, interleaved from earlier Lektionen |
| 1 | Pretest | 1 | 1 | One production attempt before teaching, then the model answer |
| 2 | Input | 2 | 1 + 4–6 | Dialogue (native voice, tap-any-word gloss), then the new words with image, audio, article, plural |
| 3 | Notice | 1 | 1 | One grammar card ≤60 words, case-coloured, 2 examples from the dialogue |
| 4 | Controlled practice | 3 | 7 | 2 listening-select, 2 typed gap-fill, 1 word order, 1 match, 1 dictation |
| 5 | Speaking | 2 | 2 | Read-aloud with per-word score, then one 20 s open prompt in Goethe Sprechen format |
| 6 | Writing | 1.5 | 1 | A1: Formular or 2-sentence SMS; A2: 3-sentence E-Mail; AI-graded on the Goethe criteria |
| 7 | Re-queue | 1.5 | 0–4 | Every miss returns as a different variant |
| 8 | Recap | 0.5 | — | Words learned, grammar point, mastery delta, next review date |

Exercise mix per lesson: recognition 35 % · typed production 35 % · listening 15 % · speaking 10 % ·
writing 5 %, shifting to 25/40/15/12/8 by A2.2. Speaking from Lektion 1, open speaking from Lektion 4,
writing from Lektion 3 (the A1 exam has it).

**Wrong answers:** reveal immediately with a one-line why and a link to the Notice card; one retry for
typo-class errors (Levenshtein ≤ 1 on words ≥ 5 chars, diacritics, capitalisation); article and ending
errors are never typos; re-queue as a different variant, cap 4, then mark Weak and schedule for
tomorrow; no hearts; lesson complete at any accuracy, gold at ≥ 80 % first attempt; every error tagged
(Artikel, Kasus, Verbstellung, Konjugation, Plural, Rechtschreibung, Hören); an Explain-my-answer button
on every item, grounded in the item's rule card.

**Spaced review:** FSRS-5 via `ts-fsrs` with default weights (desired retention 0.90 vocab, 0.85
grammar, max interval 180 d); items = words, grammar patterns and production sentences; 4 due items
open every lesson, a Wiederholen tile on the dashboard (8–12 items, four modes: flashcard, listening,
speaking, writing), cap 30/day. Fallback if FSRS is too much: Babbel's ladder 1 → 4 → 7 → 14 → 60 →
180 d, lapse → 1 d (expanding vs uniform spacing differ by g = 0.03, so the ladder is defensible). Block
vocabulary by topic, interleave grammar forms (interleaving: g = 0.42 overall, g = −0.39 for words).

**Checkpoint (every 3 Lektionen, ~12 min, 20 items):** 5 Hören, 4 Lesen, 6 Sprachbausteine typed,
3 Schreiben, 2 Sprechen; 70 % from the chapter, 30 % from earlier; pass 60 % overall and no section
below 40 % (the Goethe/telc mirror); unlimited attempts, 3 per 8 h with a remediation set between;
sub-scores by skill and error tag. Mastery per Lektion: Begonnen → Vertraut (≥ 70 %) → Sicher
(checkpoint passed) → Gefestigt (checkpoint items correct again ≥ 14 d later), with downgrade.
**Level test:** 40 items, same rule, unlocks the existing Prüfungssimulation mock.

Evidence base (meta-analyses): retrieval practice g = 0.50–0.61; spaced retrieval g = 0.74; written
corrective feedback g = 0.54; oral corrective feedback d = 0.61; immediate feedback beats delayed in
applied studies. Sources in the lesson-anatomy memo.

## 4. Design and engagement specification

**Must have** (each has measured evidence): persistent syllabus + Next-lesson CTA + per-level %
(first-week lesson completion predicts finishing: 78 % vs 17 %); first lesson before sign-up, sign-up
framed as "save progress" (+20 % DAU at Duolingo); exam-date backward plan with weekly minutes and
on-track/behind, soft and resettable; reminders at last-practice-time + 23.5 h and a same-evening last
chance, by e-mail (Resend is wired) and web push where it works; a streak counted on any lesson,
decoupled from the daily goal, with 1–2 forgiveness days a week (+3.3 % D14, +40 % 7-day streaks);
endowed progress from the placement test (34 % vs 19 % completion); mastery states per Lektion fed by
spaced review; a level certificate after the level test, labelled "kein Goethe/telc-Ergebnis"; a
performance budget for entry Androids (LCP ≤ 2.5 s, INP ≤ 200 ms, first-screen image < 100 KB).

**Nice to have:** planning prompt at purchase; quiet combo sound with a mute toggle and
`prefers-reduced-motion`; milestone cards at day 7/30/100; a small same-exam-date cohort view;
difficulty-tied badges.

**Skip:** leagues and XP leaderboards (need 30-person cohorts, documented XP farming); hearts
(Duolingo dropped them for penalising beginners); an animated lip-synced mascot (team-scale, no
measured effect); gems, chests, loot; usage-count social proof (already banned); Lingoda-style
miss-one-lose-all refunds.

**Visual direction:** borrow Duolingo's production discipline, not its look — one exercise per
screen, a single primary action, a thin progress bar, feedback as text + icon + colour (never colour
alone; colour means grammatical case here), illustrations from few vector shapes with white space,
legible at 360 px. Keep the token system (Fraunces, hairline rules, one interactive teal, case colours
reserved for grammar). Credibility comes from structure — syllabus, mastery states, dated plan, honest
certificate; fun comes from pace and micro-feedback. The emotional peaks are the placement result, the
first lesson finished before sign-up, and "auf Kurs für deine Prüfung am <Datum>".

## 5. Measured gap: the four live courses against this standard

Counted 2026-09-12 from `src/data/programs/*Phase.js`, `src/data/courses/index.js` and
`grammar-content-cache.json` (audio column as cached; live audio may be ahead).

| Dimension | Standard | A1.1 | A1.2 | A2.1 | A2.2 |
|---|---|---|---|---|---|
| Unit = situation with can-dos | 12 Lektionen, Goethe can-dos | **✓ 12 situational Lektionen, each with 3–5 Goethe can-dos, Handlungsfeld and exam Teile** | same | same | same |
| Items in the 28-day sequence | ~22 items per lesson × 12 | **12 × 7 controlled items in the engine**, plus pretest, dictation, read-aloud and a writing task per Lektion | 92 → 27 | 93 → 27 | 87 → 27 |
| Hours | 50–60 h | **54 h** (`hoursTotal`, derived from the minutes) — of which ≈5.8 h are guided lesson time, 48 h budgeted linked practice | 29 h | 30 h | 28 h |
| Lesson engine | in-app 9-stage lesson | **✓ in-app 9-stage player** at `/course/a1.1/l/:nr` | same | same | same |
| Dialogue input per unit | 1 native-voice dialogue each | **✓ 12 dialogues, one per Lektion** — browser voice, labelled „Computerstimme", until the owner audio run fills the manifest | 0 | 0 | 0 |
| Grammar exercises available | typed-heavy pool | **347-item built pool, 119 of them hand-written situational items** | 287 (163) | 300 (183) | 262 (166) |
| Examples with audio (cache) | all | 0 / 118 — the recorded-audio pipeline ships, the manifest is an empty stub until the owner run | 0 / 143 | 0 / 151 | 0 / 142 |
| Vocabulary per unit with audio | 15–25 words + audio | **✓ 262 Wortfeld entries across the 12 Lektionen**, each keyed to a `words` row; recorded audio pending the run | same | same | same |
| Writing tasks, graded | 1 per lesson | **✓ 12 graded** (`a11-l01…a11-l12`, 6 Formular / 6 Mitteilung, Goethe criteria) | 0 | 0 | 0 |
| Speaking per lesson with score | read-aloud + open prompt | **✓ scored read-aloud + open prompt in every Lektion**; the coach works the Lektion's own task | 13 | 8 | 8 |
| Spaced review | FSRS or ladder over words + patterns | **✓ Babbel ladder over `review_cards`**, seeded on lesson completion, served as the warm-up and at `/course/a1.1/review` | same | same | same |
| Checkpoints | 4 per half-level, 5-section, 60 % + 40 % rule | **✓ 4** (20 items, five sections, 60/40, remediation sets) | 0 | 0 | 0 |
| Level test | 40 items, official format | existing `abschlusstest-a1-1` (SD1 format, free) | yes | yes | yes |
| Public syllabus | 12 × 6 grid + counters | **✓ 12 × 6 grid + running counters** on `/courses/a1-1/` | same | same | same |
| Dated plan | exam date → weekly targets | **✓ exam date → weekly targets** + on-track banner on the course home | same | same | same |
| Streak / reminders / certificate | forgiving streak, timed reminders, honest certificate | **✓ forgiving streak** (one missed day per week); reminder mailer live since 2026-09-12 (`COURSE_REMINDER_ENABLED=true`, migration applied, daily 18:00 UTC); certificate as before | same | same | same |

Measured 2026-09-13 after PRs #114–#120 (Wave 8). The A1.1 column now reads the rebuilt course, not
the 2026-09-12 baseline; the `same`/`0` entries in the A1.2–A2.2 columns still refer to that baseline
reading of A1.1, which is what those levels still are. Each ✓ rests on: `src/data/curricula/a11.js`
(Lektionen, can-dos, Wortfeld, dialogues, writing and speaking tasks, `hoursTotal: 54`);
`src/lib/lesson/*` + `src/components/lesson/*` + `src/pages/lesson/LessonPlayerPage.jsx` (engine);
`src/lib/checkpoint/buildCheckpoint.js` (checkpoints); `src/services/reviewService.js` +
`review_cards` in `migrations/2026-09-12-lesson-engine.sql` (review ladder);
`src/data/writingTasks.js` + `netlify/functions/evaluate-writing.mjs` (graded writing);
`netlify/functions/score-readaloud.mjs` + `src/lib/lesson/readaloud.js` + `src/pages/SpeakingPage.jsx`
(speaking); `src/data/lessonPools/a11.json` (347) + `a11.extra.json` (119);
`astro-site/src/pages/courses/[level].astro` + `astro-site/src/lib/syllabus.js` (public grid);
`src/components/course/ExamDatePlan.jsx` and `computeStreakForgiving` in
`src/services/dashboardStats.js` (plan and streak); `src/data/curricula/a11.audio.js` (the empty
manifest stub) and `netlify/functions/course-reminder.mjs` + `netlify.toml` (the mailer, live since 2026-09-12).

What to keep as-is: the typed exercise pool (about 1,100 items across the four levels, two-thirds typed),
the listening dialogues, the speaking missions, the four final tests and the mock-exam runner, the design
tokens and `ui/` components, the purchase and entitlement path.

## 6. Rebuild plan (ordered by what makes the €40–50 price honest per hour of work)

Sequence: **A1.1 first as the template** (free, the entry to every paid level, the course with the most
traffic), then A1.2, A2.1, A2.2. Each phase ships behind the existing `/course/:level` routes; nothing
below touches pricing, Lemon Squeezy or e-mail.

| # | Phase | What ships | Effort (agent sessions + owner) | Moves | A1.1 status |
|---|---|---|---|---|---|
| 1 | Curriculum data | `src/data/curricula/<level>.js`: 12 Lektionen per level with situation, Goethe can-dos, Handlungsfeld, exam Teil, grammar slugs, Wortfeld drawn from the cached examples; public syllabus grid on `/courses/<level>/` and in the player | ~2 sessions; owner reads the A1.1 grid once | Buyers can audit before paying; every later phase hangs off this table | **shipped** #114 (curriculum module, public 12×6 Lehrplan, curriculum course home) |
| 2 | Lesson engine | `/course/:level/:lektion` 9-stage screen: warm-up, pretest, dialogue, notice card, 7 controlled items from the pool, re-queue, recap; typo rules, error tags, mastery states; program items replaced by Lektionen | ~4 sessions | The course stops linking out; the "not an online course" complaint ends | **shipped** #114 (`/course/:level/l/:nr`, 9 stages, typo rules, error tags, mastery) |
| 3 | Checkpoints + level test wiring | 4 checkpoints per level from the pool + listening + reading; 60 %/40 % rule; remediation sets; certificate wording | ~2 sessions | Finishing means something; refunds drop | **shipped** #114 (4 checkpoints, 60/40, remediation sets) |
| 4 | Speaking + writing in every lesson | A1 writing tasks (6 Formular + 6 Mitteilung per half-level) on the existing AI-writing runner with the Goethe criteria; read-aloud + open prompt on the existing speaking coach; results logged to error tags | ~3 sessions | The moat: nobody else grades every exam task instantly | **shipped** #116, hardened #117–#120 (12 graded writing tasks; scored read-aloud + the Lektion task on the coach) |
| 5 | Dialogues + audio | 12 unit dialogues per level (scripted to the Wortfeld, recorded via the Azure TTS pipeline already used for B1.1), audio for every Wortfeld word and example | ~2 sessions + one owner Azure run per level | Input before output; removes the "no audio" false claim | **shipped** #116 — 12 dialogues written and the Azure pipeline + manifest in place; the OWNER RUN is still open, so playback says „Computerstimme" |
| 6 | Spaced review | `ts-fsrs` over words, grammar patterns and production sentences; 4 due items per lesson; dashboard Wiederholen tile | ~2 sessions | Retention; the universal "nothing comes back" complaint | **shipped** #114 — Babbel ladder over `review_cards`, not `ts-fsrs` |
| 7 | Plan + habit layer | Exam-date input → weekly targets, on-track banner; forgiving streak; Resend reminders at last-practice + 23.5 h; first lesson open before sign-up | ~2 sessions | Completion (the strongest predictors in the evidence) | **shipped** #116 (exam-date plan, on-track banner, forgiving streak, signed-out first lesson); the reminder mailer is live (`COURSE_REMINDER_ENABLED=true` set 2026-09-12, migration applied) |
| 8 | Native review | A DaF teacher reads the four grids and one full Lektion per level; corrections applied | owner hires; ~4 h per level | The credibility the research says buyers check | **in progress**: five adversarial DaF reviews (`docs/course-factory/a11-rebuild/REVIEW-daf-*.md`), ladder 5/45 → 1/35 → 3/11 → 3/11 → #5 pending; the standard requires **0 BLOCKER / 0 MAJOR** |

Status 2026-09-13: phases 1–7 are shipped for A1.1 (PRs #114–#120, Wave 8 of the course-factory
tracker); phase 8 is in progress. Phases 1–3 make A1.1 a course in the professional sense in roughly eight sessions; phases 4–6 make it
the best one; 7–8 make people finish it. A2 follows the same track with the same engine, so each later
level costs content sessions only.

## 7. Rules carried forward (binding)

- Never sequence a course by grammar slug again; the unit is the situation.
- Every Lektion carries quoted Goethe can-dos and its exam Teil; the syllabus page derives from the
  same data the player reads (derive, never retype).
- No hearts, leagues, gems, usage counts, or pass promises; the AI grading is described as an
  automated tool (FernUSG, see `docs/course-research-2026-09-03.md` §4).
- Colour is grammatical case; correctness is text + icon + colour.
- Counts on any public page are counted against the data at build time, with a provenance line.

## 8. Open owner decisions

1. Approve this standard and the A1.1-first sequence (§6).
2. Pick the Azure/TTS voice run per level when phase 5 arrives (owner action, one run per level).
3. Name a DaF reviewer for phase 8 (or approve skipping it for A1.1 and doing it once for A2).
