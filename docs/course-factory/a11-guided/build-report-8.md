# Build report 8 — daily loop

Completed A–D, 2026-11-14. Automated gates green; browser verification unavailable in this sandbox. Brief 7 is present. No commits, dependency changes, SQL, endpoints, AI calls or mail changes.

## A — Today

Added a pure daily-opening model, existing-ledger read adapter and compact teacher card for A1.1 only. A1.2 keeps its previous home and lesson behavior. Reuses teacher identity/art, local and account progress, proof first-try attempts, pending outbox entries, saved run, planFor, part estimates, and ExamDatePlan's existing date write.

Greeting priority: yesterday's proof needing help, saved run, yesterday's completion, previous learning day / welcome, first session. No absence language. Names are read for signed-in learners only and never written.

Day N is calendar days since earliest available course evidence (not an invented enrolment date). Plan counts path steps, while Lektion X of 12 counts lessons; exam reach is planFor's sustainable planned pace, not an unmeasured personal pace or a promise of passing. No-date ask reuses ExamDatePlan in a compact disclosure. Completed can-dos and date planning share one compact row; A1.1 omits the catalogue subtitle and large chapter illustration/story above the first path node, while A1.2 retains its existing presentation.

Protected course-home tests require `fresh || showWelcome` and the expanded initial welcome. Kept that rule and moved initial orientation below the path for A1.1 so it cannot obscure the path. Legacy review/continue/plan blocks remain for other courses.

All bilingual templates are centralized in `src/lib/course/dailyLoop.js`; their exact text and derivation appear below. A-focused home/plan/value and constructed-data tests passed.

## B — Familiar start

Before: the player fetched the first four due rows in due-date order; `warmupCards` attached curriculum content and preserved each ladder step. `buildGuided` already placed warm-up before pretest. No preference for earlier success existed.

Now: A1.1 selects up to two earlier word cards with `last_result=correct` at the typed-recall rung. If unavailable, successful proof goals supply exact taught phrases from their existing model pointers. Saved runs can also supply phrases from passed scene checks and exact word-retrieval targets. These are practice-only typed recalls: they never advance a card that was not actually due. No success evidence means the original due-card fallback; a brand-new learner keeps the first-sentence step. Existing review renderer/checker and actual due cards' ladder modes are preserved, as protected tests require.

On a later-day resume, the same warm-up stage runs before the saved stage, with the saved stage/item retained. Snapshots are not overwritten during that warm-up. Its completion returns to the saved position; a reload before completion repeats the small warm-up safely. Start retains the existing four-second fail-soft bound and ignores late arrivals. Success is encouraged by selection, never fabricated: a learner can still answer incorrectly.

B focused course-player, course-value and guided-lesson suites passed; lint passed before C wiring.

## C — Pride and tomorrow

Added `DayDone` on the guided A1.1 recap, both saved pauses, and the guest's first-pause save ask. Completed can-dos lead, in real-life first-person wording derived from `canDoLines`. The course-wide count uses unique can-do IDs from completed lessons, including local-first completion and pending outbox evidence. A tap opens the complete list. At a pause, observed scene checks support “Today I practised”; they do not count unfinished goals as proved. Today's earlier completed lessons also appear. Tomorrow combines the existing story hook and the following lesson's first can-do; a pause additionally identifies the next saved part.

The existing dashboard forgiving-streak function already expresses the required rest day. `milestones.js` re-exports that function for the daily loop, and its optional injected clock makes deterministic tests possible. Protected VM tests require the dashboard function to remain self-contained, so its implementation stays there. The rule stays one forgiven rest day per rolling seven days, with only active days counted. The closing view uses available course evidence plus today's observed work. It cannot reconstruct older pauses whose only snapshot has since been replaced; it does not invent those days.

Protected `milestones.test.mjs` requires the original `loaded && <MilestoneCard .../>` mount. Restored that exact gate and kept A1.1 milestone encouragement after the path for compactness. No protected test changed. The focused A–C suites, lint and full final gates pass.

## D — Owner mail draft

Prepared `daily-message-drafts.md`, German and English, with optional name, a derived plan line, one course-home button, transparent AI-teacher signature and existing unsubscribe footer. Includes neutral missing-data fallback and checkpoint/test handling. No production mail code, flags, claims, audience or timing changed. Nothing sent or scheduled. Owner approval remains required for future use.

## Protected-test adjustments and environment

- The A1.2 render fixture stubs existing imports only. Home support is checked through the existing A11_META.level before calling new components; A1.2's existing rendered path and completion remain green.
- Protected late-load tests execute the original warm-up effect verbatim with deferred service responses. Kept its marker, dependencies and freeze check; the selection adapter runs before that effect resolves. The immutable, keyed Lektion route explains the single exhaustive-deps exception. Later-day warm-up has a separate fetch boundary and the same renderer/checker.
- Protected resume tests require saved warm-up inputs and proof-resume routing unchanged. Preserved them; the daily opening review is transient and never overwrites the saved stage/item.
- Protected guest-ask tests pin the entire JSX call. Kept that call and its callback, with the closing card immediately after it on the same pause screen. The ask itself is unchanged.
- Protected dashboard VM tests strip imports. Kept the forgiving algorithm self-contained instead of moving it behind an import. No protected assertion or existing test was changed.
- Read-only dependency symlinks prevent Astro's default Vite cache write. Used Astro's installed build API with only cacheDir overrides under /tmp; same offline cache, project config and generated output. No dependency or lockfile edits.
- Chromium launch fails before page creation: setsockopt is prohibited by this sandbox (SIGTRAP). Thus screenshots, hydration and measured phone fold/overflow remain unverified. Rendered-component tests exercise both languages, completed counts, pause evidence, next hooks, actual button targets and unsupported/null inputs. A1.1's expanded welcome and milestone are after the path, and the chapter's large illustration/story are omitted to keep the first path node near the Today card.

## Data behind each line

| Line | Existing data / rule |
|---|---|
| Teacher identity | A11_META.teacher (name, AI identity, small portrait) |
| Named greeting | Signed-in profile full_name/name, then existing auth metadata name; empty for guests; no write |
| Situation | Completed lesson timestamps, lesson_attempts proof first-try flags, local run stamps and current saved snapshot; newer proof evidence wins |
| Re-teach goal | Proof task index maps to its canDo index, rendered through canDoLines; proof-help records are produced only after every goal eventually passes; related taught word opens the review |
| Today's plan / primary button | Latest unfinished guided run, else first unfinished curriculumPath node; saved key maps to part; lektionPartEstimate, node minutes, review-card due count; placement suffix retained |
| Day and road | Local calendar days since earliest available course evidence; current lesson position and curriculum length |
| Exam reach | planFor status and perWeekTarget, expressed as planned course completion pace, never an exam-result promise; existing ExamDatePlan edits the date |
| Today I can | Today's completed lesson can-dos plus the current recap after proof completion; canonical German and reviewed English lines |
| Today I practised | Checked scene chunks map through proof re-teach source indices to can-dos; partial work does not increase completed count |
| Growing list | canDoList states from completed lesson IDs, unique IDs; local-first run and account pending outbox both included |
| Tomorrow | Existing lesson.nextHook and the next lesson's first can-do; at course end the existing A1.2 hook remains, with no invented next lesson |
| Next saved part | Pause's completed part + 1 and current lesson number |
| Streak | Existing course timestamps and today's observed work, shared forgiving rule; activity only, no points |
| Closing line | Fixed bilingual teacher template, teacher name from identity data |

## Exact new bilingual templates

All variable values derive from the table above. Can-do and story-hook content is read from the curriculum/meta, not re-authored here. Reused date-editor, review-grading and session chrome strings remain in their existing components/string table.

| Key | German | English |
|---|---|---|
| date | Prüfungstermin planen | Plan an exam date |
| today | Heute | Today |
| teacher | KI-Lehrerin | AI teacher |
| hello | Guten Tag{name}. | Hello{name}. |
| first | Wir beginnen mit Ihrem ersten Satz. | We will start with your first sentence. |
| nextDay | Willkommen zurück. Ihr nächster Schritt ist bereit. | Welcome back. Your next step is ready. |
| break | Willkommen. Ihr Platz ist für Sie bewahrt. | Welcome. Your place is kept for you. |
| saved | Ihr Platz in Lektion {nr} ist gespeichert. Dort machen wir weiter. | Your place in Lektion {nr} is saved. We will continue there. |
| finished | Gestern haben Sie Lektion {nr} abgeschlossen. Heute bauen wir darauf auf. | Yesterday you finished Lektion {nr}. Today we build on it. |
| reteach | Gestern brauchte dieses Ziel einen weiteren Versuch: {goal} Heute beginnen wir damit. | Yesterday this goal needed another try: {goal} Today we start with it. |
| plan | Lektion {nr}, Teil {part} · etwa {lo}–{hi} Min. (Schätzung) · {due} Karten zur Wiederholung. | Lektion {nr}, part {part} · about {lo}–{hi} min (estimate) · {due} review cards due. |
| node | {title} · etwa {minutes} Min. · {due} Karten zur Wiederholung. | {title} · about {minutes} min · {due} review cards due. |
| complete | Ihr Kurs ist abgeschlossen. Ihr Deutsch können Sie weiter üben. | Your course is complete. Your German is ready to practise again. |
| road | Tag {day} · Lektion {nr} von {total}. | Day {day} · Lektion {nr} of {total}. |
| reachable | Im geplanten Tempo passt dieser Kurs vor Ihre Prüfung: {n} Schritte pro Woche. | At the planned pace, this course fits before your exam: {n} steps a week. |
| closer | Für diesen Kurs vor Ihrer Prüfung sind {n} Schritte pro Woche nötig. Wir können den Termin gemeinsam anpassen. | Finishing this course before your exam needs {n} steps a week. We can adjust the date together. |
| past | Sie können einen neuen Prüfungstermin wählen. Wir planen von hier aus weiter. | You can choose a new exam date. We will plan from here. |
| start | Heute starten | Start today |
| resume | Hier weitermachen | Continue here |
| result | Zum Ergebnis | See your result |
| quick | Das können Sie noch | You still can |
| quickLead | Beginnen Sie mit etwas, das Sie schon gezeigt haben. | Start with something you have already shown. |
| shown | Heute kann ich | Today I can |
| practised | Heute habe ich geübt | Today I practised |
| count | Sie können jetzt {n} Dinge auf Deutsch | You can now do {n} things in German |
| list | Alles ansehen, was ich kann | See everything I can do |
| tomorrow | Morgen: {goal} | Tomorrow: {goal} |
| nextPart | Beim nächsten Mal: Teil {part} von Lektion {nr}. | Next time: part {part} of Lektion {nr}. |
| streak | {n} Lerntage in Folge. Ein Ruhetag in je sieben Tagen gehört dazu. | {n} learning days in a row. One rest day in every seven is welcome. |
| close | Wir bauen darauf auf, was Sie heute gezeigt haben. — {teacher} | We will build on what you showed today. — {teacher} |
| pauseClose | Ihr Platz ist gespeichert. Hier machen wir weiter. — {teacher} | Your place is saved. We will continue from here. — {teacher} |

## Final gates

| Gate | Result |
|---|---|
| A: constructed greetings, plan targets, goal states, guest-name boundary | Pass |
| B: measured-success preference, typed first check, original fresh-stage order and later-day resume boundary | Pass |
| C: rendered recap/pause, unique counts, full-list disclosure, next hook/can-do, supported-course boundary, rest day | Pass |
| D: bilingual owner draft, production reminder preserved | Pass |
| New daily-loop suite | 11 tests pass, including real JSX execution through the existing render helper |
| npm run lint | Pass, zero warnings |
| npm run check:duplicates | Pass |
| npm test | **313 files pass, 0 failures, 0 skips** (132.3 seconds) |
| Existing protected late-load/resume/save-ask/dashboard/A1.2 fixtures | All pass, assertions unedited |
| Netlify function/shared-module node --check (CI globs) | Pass |
| build-lesson-pool.mjs a1.1 → validate-curriculum.mjs | Pass; regenerated pool byte-identical to HEAD |
| check-guided-draft.mjs 1 … 12 | All twelve pass |
| RULE 35 / 36 / 37 / 39 / 40 | Zero findings; content unchanged |
| RULE 38 | Two unchanged L1 authoring advisories (scene 1: 8/5/3; scene 3: 3/4/7). Protected tests preserve them; no assertion/ratchet weakened |
| Clean Vite build → app.html carve | Pass; Vite empties dist before building |
| Offline Astro build | Pass: 143 pages, content-cache use confirmed; only temporary cache locations overridden |
| Merge → prerender → complete built-HTML check | Pass: **151 pages, 146 sitemap URLs, 0 failures, 0 warnings**; prerender ran once after each fresh build |
| git diff --check | Pass |
| Protected-file integrity | CLAUDE.md, astro-site/package-lock.json, existing tests, A1.2 curriculum, reminder function, and generated lesson pool unchanged |
| Dependencies / Git / external actions | No installs, dependency changes, commits, SQL, endpoints, AI calls, sends or scheduling |
| Browser screenshot / hydration / measured phone viewport | Unavailable: Chromium fails at launch on the sandbox's prohibited socket syscall; not represented as a passing check |

The offline grammar snapshot is dated 2026-08-24 (82 days old). Build verification uses that committed snapshot, not live database content; it was not refreshed or misrepresented as current. No grammar or curriculum content changed in this brief.

Available-evidence limits: day N begins at the earliest retained course evidence; account reads use up to the latest 2,000 attempts and local snapshots last seven days. No enrolment date, missing historical pause, personal exam pace or guaranteed correct first response is invented. If success evidence is absent or the four-second read bound expires, the established lesson path remains available. Mail copy remains an owner draft. Browser verification is the only outstanding execution check.

## Claude's check (2026-11-14)

Gates re-run by Claude on the final tree from a clean `dist/`: pool build, validator, sync, lint,
duplicates, `npm test` (3,076 of 3,076), SPA and offline Astro builds, merge, prerender, built HTML
(151 pages, 0 failures). Protected tests, `CLAUDE.md` and `astro-site/package-lock.json` unchanged.

Played as a guest in a phone-sized browser against the built site; the screens are in
`docs/strategy/lesson-look-2026-11-12/daily-loop-built-2026-11-14.jpg`:

- Course home, first visit: Frau Hoffmann's card (portrait, "AI teacher", "Today"), "Hello. We will
  start with your first sentence.", today's part with its time estimate, "Day 1 · Lektion 1 of 12",
  one button "Start today". The path stays visible below it.
- Recap after passing Lektion 1's proof: four "Today I can …" lines, "You can now do 4 things in
  German", the story hook, tomorrow's goal, the first-learning-day line, a closing line from the
  teacher.
- Course home afterwards: "Welcome back. Your next step is ready.", Lektion 2 as today's plan, and
  "You can now do 4 things in German".

Corrected by Claude: "0 review cards due" no longer appears when nothing is due; "1 learning days"
became "Your first learning day"; "Tomorrow: I can say …" became "Tomorrow's goal: '…'"; the German
"Ihr Platz ist für Sie bewahrt" became "freigehalten". Test added in `tests/daily-loop.test.mjs`.

Not seen by Claude, because a guest on one day cannot produce them: the greetings for a signed-in
learner by name, the next day, after a break, mid-Lektion and "yesterday this goal needed another
try"; the quick win at the start of a returning day; the day-done card at a saved pause; the exam
date line. They rest on the tests.

Open:

- The recap card has an empty band above the first "Today I can" line.
- The greeting for a guest has no name, so "taken care of" is weakest for the learner who has not
  signed up.
- The daily message texts in `daily-message-drafts.md` are drafts; nothing is sent.
