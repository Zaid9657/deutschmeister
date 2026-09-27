# Course v2 — E1 client track: integration verify

**Date:** 2026-09-27 · **Status:** the player core (E1-1) and the renderers (E1-2) are joined, and the SCHEMA §15
fixture unit (`a2.1-u07`) plays **end to end** in headless Chromium at 360×640: Start, seven Lernschritte and the
recap, in German and in English. Binding documents: [`BLUEPRINT.md`](BLUEPRINT.md), [`SCHEMA.md`](SCHEMA.md) (wins
on any data question) and [`RAILS.md`](RAILS.md) (compiler outputs). Screenshots:
[`screens/`](screens/).

---

## 1. What exists

### 1.1 Routes (inside the existing `netlify.toml` `/course/*` rewrite; no `netlify.toml` change)

| Route | Page | Chrome (`src/lib/chrome.js`) |
|---|---|---|
| `/course/:level/v2` | `src/pages/course-v2/CourseHomeV2Page.jsx` — Etappen, Plateaus, per-unit status, plan line, one pinned action | `course` (navbar + tabs, no marketing footer) |
| `/course/:level/u/:nr` | `src/pages/course-v2/UnitPlayerPage.jsx` — Start → steps → recap, resume screen | `player` (no navbar/footer/tabs) |
| `/course/:level/p/:nr` | `src/pages/course-v2/PlateauPage.jsx` — honest „kommt bald", never marks a Plateau submitted | `player` |

All three are registered in `src/App.jsx` above the legacy catch-all `/course/:level/:itemId`, wrapped in
`LevelSubscriptionGuard` + `EmailVerificationGate`. The guard asks `hasCourseAccess(level)` on these paths.
`COURSE_V2_LIVE` (`src/config/courseV2.js`) is `[]`, so `/course/:level` itself still renders the legacy course.

### 1.2 Player core — `src/lib/course-v2/` (E1-1)

| File | Decides |
|---|---|
| `unitPlan.js` | The seeded 12 + 3 practice draw per unit/step/attempt, repeat exclusion, requeue alternates (`alternateFor`), the Check with its runtime `earlierDraw`, resume. **New in this verify:** `itemFromReserve`, `reserveItemsFor` and `withReserves` (see §3). |
| `checkItem.js` | Grading via `check.js`, plus `exact: 'number' \| 'name'` and choice keys; `attemptPayload()`. |
| `progress.js` | `lesson_progress` / `lesson_attempts` with the unit id as `lektion_id`, one batch per step with a `lernschritt` marker, status never lowered, review-card seeding. Fails soft throughout. |
| `localState.js` | Signed-out progress in localStorage (try/catch everywhere). |
| `homeModel.js`, `pacePlan.js` | The course home model and the one-line plan (never "behind"). |
| `loaders.js` | Lazy `import.meta.glob` loaders for manifest (`manifest.json` or `course.json`), units, rule cards, Plateaus, reserve index. **New:** `loadReserveIndex`, `loadPlayableUnit`, and the DEV-only fixture source (§2). |
| `completion.js` | E1-7's one completion function (read, not changed here). |

### 1.3 Renderers — `src/components/course-v2/` (E1-2)

`StepView({ unit, step, level, onAttempt, onDone, …optional })` covers every SCHEMA §8 kind. `StartView({ unit,
level, onDone, …optional })` covers the Lernziele, Prüfungsfokus, Folge, gist item and test-out
(`testOut: { correct, total }`). `ItemView({ item, level, onResult })` covers every SCHEMA §3.1 item type. Also in the
directory:

- `CheckView`, `ExamBlockView`, `WritingTaskView`, `SpeakingTaskView`, `MicroOutputView`
- `ItemRun` (the requeue and the stuck-point repair)
- `strings.js`: German with Sie, English, following `dm_lesson_lang`
- `grade.js`: a thin adapter over `checkItem`

AI results carry the fixed label „automatisierte Übungsbewertung". They never show a percentage or a pass verdict.

### 1.4 The contract between the two, as it now runs

- `unit` handed to the renderers is the compiled chunk, plus two additions:
  - `ruleCards` (`{ id: card }`);
  - each step's `reserve`, put back from `reserve.json`.
- `step` carries `plan`, built by `unitPlan.js`:
  - pool steps: `practice`, `exit`, `spare` and `reserve`;
  - the Check: `items`, `proofItems` and `earlierIds`.

  **StepView now serves `step.plan`.** Generated items join the practice; spare and reserve feed the requeue.
- The optional props now flow through `rendererSlots.jsx` (`extra`, spread before the contract props):

  | Receiver | Props |
  |---|---|
  | StepView | `ruleCards`, `course` (the manifest, for can-do wording), `earlierItems` (the plan's earlier draw), `aufgaben` (`{ sprechen, schreiben }` submitted) |
  | StartView | `course` |

- `onDone` of a `sprechen`/`schreiben` step with `submitted: false` does not finish the step (§3).

---

## 2. How to run it

```bash
# 1. the fixture as dev content (writes only to the gitignored .cache/)
node scripts/course-v2/compile.mjs a2.1 --fixture \
  --out .cache/course-v2-fixture/data --banks-out .cache/course-v2-fixture/banks

# 2. the dev server
npx vite --port 5199

# 3. open, signed out (DEV-only bypass of the level guard for the three v2 paths)
#    http://localhost:5199/course/a2.1/u/7?preview      unit player
#    http://localhost:5199/course/a2.1/v2?preview       course home
#    http://localhost:5199/course/a2.1/p/1?preview      Plateau („kommt bald")

# 4. the click-through (headless Chromium 360×640, screenshots per screen; no npm dependency)
PW=$(npm root -g)/playwright PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
  node scripts/course-v2/walk-fixture.mjs docs/course-v2/screens de 1 de-a2.1-u07-
#    args: <outDir> [de|en] [Lernschritte to walk, 9 = to the recap] [file prefix]
#    RELOAD_AT_END=1 → also resume, course home, Plateau, a missing unit; FULL_CHECK=1 → Check summary
```

How the dev preview works. Both parts exist only when `import.meta.env.DEV`:

- **Fixture data.** `loaders.js` merges `.cache/course-v2-fixture/data/**` into its tables, for levels that have no
  real compiled manifest. Real content always wins, and no level ever mixes real and fixture files.
- **Guard bypass.** `LevelSubscriptionGuard` lets `?preview` through, on the three v2 paths only.

A production build turns both into dead code. Verified: after `npx vite build` with `.cache/` present, `dist/`
contains no `course-v2-fixture`, `a2.1-u07` or `preview` bypass.
`tests/course-v2-player.test.mjs` pins both guards.

Gates run for this verify:

| Command | Result |
|---|---|
| `npm run lint` | clean (0 errors, 0 warnings) |
| `npx vite build` | succeeds; `dist/` free of fixture and preview code |
| `node --test tests/course-v2-player.test.mjs` | 25/25 (20 from E1-1 plus 5 new seam tests) |
| `npm test` | 1443 pass, 1 todo, 1 fail. The fail is `course-v2-validate` „--all on the repository content". It is not an E1 regression; see §4 item 1. |
| `node scripts/course-v2/compile.mjs --all` | refuses every level (565 SCH-01 errors in `registries/text-types.json` etc.; RAILS §8, other agents' files), so `src/data/course-v2/` does not exist and every **real** v2 route says „kommt bald" |
| Playwright 360×640 | the fixture plays **Start → LS1 … LS7 → recap** with no horizontal overflow and no page errors, in `de` and `en` |

Screens in [`screens/`](screens/):

| Prefix | Shows |
|---|---|
| `de-a2.1-u07-01…23` | Start, the gist item, and every segment and item type of Lernschritt 1 with its feedback |
| `-24` | resume |
| `-25`/`-26` | course home |
| `-27` | Plateau |
| `de-b1.1-u01-28` | a unit that is not compiled |
| `en-a2.1-u07-*` | the English chrome: Start, the Check summary, the recap |

---

## 3. Seams found and fixed in this verify

| # | Seam | Effect before | Fix |
|---|---|---|---|
| 1 | StepView drew its own unseeded split and ignored `step.plan` | no repeat exclusion, a different draw on every mount, exit items not the plan's | `StepView` serves `plan.practice`/`exit`/`spare`/`reserve` when present (fallback kept) |
| 2 | StepView read rule cards only from a `ruleCards` prop; the player put them on `unit.ruleCards` | Form segment showed only the model sentence plus „Regelkarte noch nicht geladen"; no stuck-point repair, no Rückschau | `ruleCards ?? unit.ruleCards` |
| 3 | The slots passed only the four contract props | StartView and the Check showed humanised ids („Mailbox verstehen") instead of the manifest's can-do wording; „Das kann ich" always showed both Aufgaben open | `rendererSlots` passes `extra`: `course`, `ruleCards`, `earlierItems`, `aufgaben` |
| 4 | `reserve.json` `byUnit` lists **ids**; the loader treated them as items | the Check's `earlierDraw` was always empty on real levels | `reserveItemsFor()` resolves ids through `items` and converts the lessonPools shape back to Items (`itemFromReserve`, incl. sentence-building tiles) |
| 5 | The compiler strips `reserve` from every chunk | `plan.reserve` always `[]`, so the requeue never reached the reserve | `loadPlayableUnit()` re-attaches each step's reserve from the index (`withReserves`) |
| 6 | An Aufgabe left via „Ohne Auswertung weiter" / „Ohne Mikrofon weiter" (`submitted: false`) got a step marker | its bank key counted as **submitted** in `completion.js`, so the unit could be complete without any speaking or writing | no marker for an unsubmitted `sprechen`/`schreiben`; the recap lists it under „Noch offen" (Überarbeiten stays skippable) |
| 7 | `chrome.js` did not know the v2 paths | the player ran inside navbar, marketing footer, „Watch Intro" pill and bottom tabs | `u/:nr`, `p/:nr` → `player`; `v2` → `course` (pinned in `tests/course-front-door.test.mjs`) |
| 8 | `ActionBar` lifted itself 64 px for a BottomNav that only signed-in users get | signed-out (free level) learners saw page content through a gap under the pinned button | lift only when a user is signed in and the route is not a stage |
| 9 | The recap ticked every can-do „Das können Sie jetzt" even with Aufgaben open | the recap contradicted the Check's own „Das kann ich" | ticks only when complete; otherwise „Ziele dieser Lektion" |
| 10 | The player's own chrome was German-only while the renderers follow `dm_lesson_lang` (English by default) | one flow mixed „Step 1 · Practice" with „Fast geschafft / Noch offen / Zur Kursübersicht" | UnitPlayerPage uses `useV2Strings` (`player.*` keys in both languages) |
| 11 | The Sie-register scan did not cover v2 | nothing guarded the v2 chrome against du-forms | `tests/course-player.test.mjs` scans `src/components/course-v2`, `src/pages/course-v2` and the v2 `strings.js`, with one documented waiver (the micro-output's „Anrede: du" names the register the task asks for) |

Files changed in this verify:

- **Player core:** `src/lib/course-v2/{unitPlan,loaders}.js`
- **Pages:** `src/pages/course-v2/{UnitPlayerPage,rendererSlots,ActionBar}.jsx`
- **Renderers:** `src/components/course-v2/{StepView.jsx,strings.js}`
- **Shared app files:** `src/lib/chrome.js`, `src/components/LevelSubscriptionGuard.jsx` (the DEV bypass only)
- **Tests:** `tests/{course-v2-player,course-front-door,course-player}.test.mjs`
- **New:** `scripts/course-v2/walk-fixture.mjs`, this file, and `screens/`

---

## 4. Still missing for launch

Ordered by what blocks first.

1. **Compiled content.** `compile.mjs --all` refuses until `registries/text-types.json` and
   `registries/lanes/{sd1,ga2,tb2}.json` pass the revised schema (RAILS §8). Until then no real level has
   `src/data/course-v2/`, and every real route says „kommt bald".
   - Also, `validate.mjs` ends with `console.log(json)` + `process.exit()`. That truncates piped `--json` output at
     64 KB, and it now breaks `tests/course-v2-validate.test.mjs` („--all on the repository content") because the
     repository content has grown. Fix for E0: `process.exitCode = report.exitCode` instead of `process.exit(...)`.
2. **`completion.js` (E1-7)** throws on the revised SCHEMA §5 closing entry `{ kind: 'halbtest' | 'modelltest', lane:
   'learner' }`. The player passes only `unitRules`, and the course home falls back to default course rules with a
   console warning. The TODO in `course-v2-completion.test.mjs` tracks this.
3. **The migration** `migrations/2026-10-01-course-v2.sql` must be hand-applied before three things work:
   - status `tested_out` is stored (until then `lesson_progress` keeps `started`; the step markers still carry the
     credit);
   - `learner_goals` exists (the plan line uses the default pace until then);
   - `course_events` exists (`logCourseEvent` switches itself off after the first failure).
4. **Generated items.** The compiler records generator ids but no item bodies. The renderer builds the two kinds
   whose inputs are inside the unit: `dictation.fromInput` and `perception.pairs`. Four kinds are skipped for now:
   - `numbers.dictation`
   - `lex.articlePlural`, `lex.glossMatch`, `lex.glossTyped`
   - `perception.intonation`

   The fixture LS1 therefore practises 9 authored + 2 generated items instead of 12. The compiler or the player core
   must emit them as StepView's `generated` prop.
5. **Exam blocks carry no `plays`.** `content.js` `LANE_PLAYS` copies the four launch lanes. The compiler should emit
   `plays` onto blocks, or a test should pin `LANE_PLAYS` against `registries/lanes/*.json`.
6. **Warm-up** (6 due review items per Lernschritt). The client has no compiled content for v2 card keys (`word:lx.*`,
   `pattern:…`); it needs a compiled card-content index.
7. **Submission trust.** A `sprechen`/`schreiben` step counts as submitted when StepView says `submitted: true`, after
   a real grader result. A later step should confirm this server-side (`course_ai_usage` / `writing_submissions`) so
   a modified client cannot claim it.
8. **Signed-out progress** (free level a1.1) lives in localStorage and is not merged into Supabase on sign-up.
9. **`/course/:level` → v2 switch** for levels in `COURSE_V2_LIVE` is not wired. `isCourseV2Live()` exists; the legacy
   route line in `App.jsx` needs a small wrapper.
10. **Language gaps.**
    - `CourseHomeV2Page` and `PlateauPage` are still German-only.
    - The reused `SpeakingSession` has English chrome („Teacher", „Finish & get feedback").
    - The step kind labels in the resume list (`KIND_LABEL_DE`) are German.
11. **UX found at 360 px.**
    - StartView's „Los geht's" is in the page flow, not pinned: at 360×640 the learner scrolls past Lernziele, Folge
      and gist item to reach it.
    - The player shows two progress bars on every step screen: the Shell's (steps) and StepView's (segments).
    - The fixture's exit item a2.1-u07-ls1 „Der Techniker ___ sich heute." repeats a practice sentence (p08) — a
      content note for the I-author.
12. **Not rendered yet.**
    - Images (`assetRef`, `imageRef`, `photos`): no approved asset URLs exist.
    - Prüfungsmodus (timed, no feedback): blocks always run in Lernmodus.
    - Writing drafts live only in this device's localStorage (`dm_v2_writing_<bankKey>`).
13. **Real devices.** The click-through is headless Chromium with speech synthesis off, no microphone and Supabase
    blocked. What those runs covered:
    - the signed-out path;
    - the „Ohne Mikrofon" / „Ohne Auswertung" ways on;
    - layout at 360 px.

    Still to do before launch: a signed-in run against a Supabase branch (attempt batches, resume across devices,
    card seeding), a real microphone run of Sprechen and read-aloud, and an iOS Safari pass.
