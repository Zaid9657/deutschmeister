# Course v2 — E1 client track: integration verify

**Date:** 2026-09-27 · **Status:** the player core (E1-1) and the renderers (E1-2) are joined. The SCHEMA §15
fixture unit (`a2.1-u07`) plays **end to end** in headless Chromium at 360×640, in German and in English: Start,
seven Lernschritte and the recap. The runs also covered a deliberate miss with its requeue from the reserve index,
the „Ich kann das schon" test-out, and a failed Check with its recap. Binding documents:
[`BLUEPRINT.md`](BLUEPRINT.md), [`SCHEMA.md`](SCHEMA.md) (wins on any data question) and [`RAILS.md`](RAILS.md)
(compiler outputs). Screenshots: [`screens/`](screens/).

No real level can be played yet. `compile.mjs --all` refuses all eight levels (§4 item 1), so every real v2 route
says „kommt bald". Everything below was run against the compiled fixture.

---

## 1. What exists

### 1.1 Routes (inside the existing `netlify.toml` `/course/*` rewrite; no `netlify.toml` change)

| Route | Page | Chrome (`src/lib/chrome.js`) |
|---|---|---|
| `/course/:level/v2` | `src/pages/course-v2/CourseHomeV2Page.jsx`: Etappen, Plateaus, per-unit status, plan line, one pinned action | `course` (navbar and tabs, no marketing footer) |
| `/course/:level/u/:nr` | `src/pages/course-v2/UnitPlayerPage.jsx`: Start, then the steps, then the recap; a resume screen | `player` (no navbar, footer or tabs) |
| `/course/:level/p/:nr` | `src/pages/course-v2/PlateauPage.jsx`: an honest „kommt bald"; never marks a Plateau as submitted | `player` |

- All three are registered in `src/App.jsx` above the legacy catch-all `/course/:level/:itemId`.
- Each is wrapped in `LevelSubscriptionGuard` + `EmailVerificationGate`; on these paths the guard asks
  `hasCourseAccess(level)`.
- `COURSE_V2_LIVE` (`src/config/courseV2.js`) is `[]`, so `/course/:level` itself still renders the legacy course.

### 1.2 Player core: `src/lib/course-v2/` (E1-1)

| File | Decides |
|---|---|
| `unitPlan.js` | The seeded draw per unit, step and attempt: 12 practice items plus 3 exit items. Also the repeat exclusion, the requeue alternates (`alternateFor`), the Check with its runtime `earlierDraw`, and resume. `itemFromReserve`, `reserveItemsFor` and `withReserves` read the compiled reserve index. |
| `checkItem.js` | Grading through `check.js`, plus `exact: 'number' \| 'name'` and choice keys. Exports `attemptPayload()`. |
| `progress.js` | Saving to `lesson_progress` / `lesson_attempts`, with the unit id as `lektion_id`. One batch per step with a `lernschritt` marker. A status is never lowered. Seeds the review cards. Fails soft throughout. |
| `localState.js` | A signed-out learner's progress in localStorage, with try/catch around every access. |
| `homeModel.js`, `pacePlan.js` | The course home model and the one-line plan (never "behind"). |
| `loaders.js` | Lazy `import.meta.glob` loaders for the manifest (`manifest.json` or `course.json`), units, rule cards, Plateaus and the reserve index. `loadPlayableUnit` re-attaches each step's reserve. Holds the DEV-only fixture source (§2). |
| `completion.js` | E1-7's one completion function; read here, not changed. |

### 1.3 Renderers: `src/components/course-v2/` (E1-2)

- `StepView({ unit, step, level, onAttempt, onDone, …optional })` covers every SCHEMA §8 step kind.
- `StartView({ unit, level, onDone, …optional })` covers the Lernziele, the Prüfungsfokus, the Folge with its gist
  item, and the test-out.
- `ItemView({ item, level, onResult })` covers every SCHEMA §3.1 item type.

The directory also holds:

- `CheckView`, `ExamBlockView`, `WritingTaskView`, `SpeakingTaskView`, `MicroOutputView`
- `ItemRun`: the requeue and the stuck-point repair
- `strings.js`: German with Sie, and English; follows `dm_lesson_lang`
- `grade.js`: a thin adapter over `checkItem`

AI results carry the fixed label „automatisierte Übungsbewertung". They never show a percentage or a pass verdict.

### 1.4 The contract between the two, as it now runs

The four contract props are unchanged. Everything below is additive.

**Data the player adds:**

- `unit` is the compiled chunk plus:
  - `ruleCards` (`{ id: card }`);
  - each step's `reserve`, put back from `reserve.json`.
- `step` carries `plan`, built by `unitPlan.js`:
  - pool steps: `practice`, `exit`, `spare`, `reserve`;
  - the Check: `items`, `proofItems`, `earlierIds`, `earlierMissing`.
- StepView serves `step.plan`. Generated items join the practice; `spare` and `reserve` feed the requeue.

**Props passed through `rendererSlots.jsx`** (`extra`, spread before the contract props):

| Receiver | Props |
|---|---|
| StepView | `ruleCards`; `course` (the manifest, for can-do wording); `earlierItems` (the plan's earlier draw); `aufgaben` (`{ sprechen, schreiben }` submitted) |
| StartView | `course`; `onAttempt` (the gist item and the test-out answers are stored) |

**Results the renderers report back:**

| Callback | Payload | What the player does with it |
|---|---|---|
| StartView `onDone` | `{ …, testOut: { correct, total } \| null }` | `testOutPassed()` decides the test-out |
| StepView `onDone`, `sprechen`/`schreiben` step | adds `{ submitted, bankKey }` | With `submitted: false` the step is not finished (§3 #6) |
| StepView `onDone`, Check step | adds `proofs: { canDoId: proven }` | The recap ticks exactly what the Check's „Das kann ich" ticked (§3 #14) |

---

## 2. How to run it

```bash
# 1. the fixture as dev content (writes only into the gitignored .cache/)
node scripts/course-v2/compile.mjs a2.1 --fixture \
  --out .cache/course-v2-fixture/data --banks-out .cache/course-v2-fixture/banks

# 2. the dev server
npx vite --port 5199

# 3. open signed out (a DEV-only bypass of the level guard, on the three v2 paths only)
#    http://localhost:5199/course/a2.1/u/7?preview      unit player
#    http://localhost:5199/course/a2.1/v2?preview       course home
#    http://localhost:5199/course/a2.1/p/1?preview      Plateau („kommt bald")

# 4. the click-through (headless Chromium 360×640, a screenshot per screen; no npm dependency)
PW=$(npm root -g)/playwright PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
  node scripts/course-v2/walk-fixture.mjs docs/course-v2/screens de 9 de-a2.1-u07-
#    args: <outDir> [de|en] [Lernschritte to walk; 9 = through to the recap] [file prefix]
#    env:  RELOAD_AT_END=1  also resume, course home, Plateau, and a unit that is not compiled
#          FULL_CHECK=1     a full-page shot of the Check summary
#          MISS_FIRST=1     answer the first practice item wrongly: the miss, then the requeued reserve item
#          TESTOUT=1        take „Ich kann das schon" at the Start instead of „Los geht's"
```

How the dev preview works. Both parts exist only when `import.meta.env.DEV` is true:

- **Fixture data.** `loaders.js` merges `.cache/course-v2-fixture/data/**` into its tables, but only for levels that
  have no real compiled manifest. Real content always wins, and no level ever mixes real and fixture files.
- **Guard bypass.** `LevelSubscriptionGuard` lets `?preview` through, on the three v2 paths only.

A production build turns both into dead code. Verified: after `npx vite build` with `.cache/` present, `dist/` contains
no `course-v2-fixture`, no `a2.1-u07` and no `preview` check. `tests/course-v2-player.test.mjs` pins both guards.

### 2.1 Gates run for this verify

| Command | Result |
|---|---|
| `npm run lint` | clean (0 errors, 0 warnings) |
| `npx vite build` | succeeds; `dist/` has no fixture or preview code; the v2 pages and renderers are their own lazy chunks |
| `node --test tests/course-v2-player.test.mjs` | 29/29: E1-1's 20, 5 seam tests from the first pass, 4 from this pass |
| `npm test` | 1469 tests: 1467 pass, 0 fail, 1 skipped, 1 todo. The todo is `completion.js` (§4 item 2). Mid-run, `course-v2-validate.test.mjs` failed for a while: another agent's `lib-validate/lexicon.mjs` imported `core-lexicon.mjs` before that file existed. It loads now. |
| `node scripts/course-v2/compile.mjs --all` | refuses every level (§4 item 1), so `src/data/course-v2/` does not exist |
| `node scripts/course-v2/lib/fixture.mjs --check` | the fixtures match SCHEMA.md §15 |
| Playwright 360×640 | the fixture plays Start → LS1 … LS7 → recap in `de` and `en`, with no horizontal overflow and no page errors (the only console error is the blocked Supabase request) |

### 2.2 Screens in [`screens/`](screens/)

| File | Shows |
|---|---|
| `de-a2.1-u07-01…22` | Start (screen and full page), the gist item, and every segment and item type of Lernschritt 1, each with its feedback |
| `-36…38` | the Prüfungstraining (Goethe A2 Hören Teil 1 in Lernmodus) |
| `-39`, `-40`, `-41`, `-42` | Sprechen, Schreiben, the Check, the Check summary |
| `-43` | the recap with both Aufgaben still open |
| `-44…47` | resume, course home (screen and full page), Plateau |
| `de-b1.1-u01-48` | a unit that is not compiled |
| `de-a2.1-u07-miss-01/02` | a miss, then its requeue: a reserve item of the same topic, marked „+1 Wiederholung" |
| `de-a2.1-u07-testout-01/02` | the test-out, then the landing on Sprechen with the credit note |
| `de-a2.1-u07-weak-01/02` | a Check at 1 of 8: its summary, then the recap with the step list and only the proven can-dos ticked |
| `en-a2.1-u07-*` | the English chrome: Start, LS1, Sprechen, the Check and its summary, the recap, resume |

LS2 and LS3 were walked too but are left out of the folder, because their screens repeat LS1's layout.

---

## 3. Seams found and fixed

Items 1–11 came from the first verify pass. Items 12–18 came from this pass, which re-ran every gate and all the
screenshots on the current tree.

| # | Seam | Effect before | Fix |
|---|---|---|---|
| 1 | StepView drew its own unseeded split and ignored `step.plan` | no repeat exclusion; a different draw on every mount; exit items not the plan's | StepView serves `plan.practice`/`exit`/`spare`/`reserve` (fallback kept) |
| 2 | StepView read rule cards only from a `ruleCards` prop; the player put them on `unit.ruleCards` | the Form segment showed only the model sentence; no stuck-point repair, no Rückschau | `ruleCards ?? unit.ruleCards` |
| 3 | The slots passed only the four contract props | StartView and the Check showed humanised ids instead of the manifest's can-do wording; „Das kann ich" always showed both Aufgaben open | `rendererSlots` passes `extra` |
| 4 | `reserve.json` `byUnit` lists **ids**; the loader treated them as items | the Check's `earlierDraw` was always empty | `reserveItemsFor()` resolves the ids and converts the lessonPools shape back to Items (`itemFromReserve`, incl. sentence-building tiles) |
| 5 | The compiler strips `reserve` from every chunk | `plan.reserve` was always `[]`, so the requeue never reached the reserve | `loadPlayableUnit()` re-attaches each step's reserve (`withReserves`); screenshot `miss-02` shows it working |
| 6 | An Aufgabe left via „Ohne Auswertung weiter" or „Ohne Mikrofon weiter" (`submitted: false`) got a step marker | its bank key counted as submitted, so a unit could be complete without any speaking or writing | no marker for an unsubmitted `sprechen`/`schreiben`; the recap lists it under „Noch offen" |
| 7 | `chrome.js` did not know the v2 paths | the player ran inside the navbar, the footer and the bottom tabs | `u/:nr` and `p/:nr` → `player`; `v2` → `course` |
| 8 | `ActionBar` lifted itself 64 px for a BottomNav that only signed-in users get | signed-out learners saw a gap under the pinned button | lift only for a signed-in user on a non-player route |
| 9 | The recap ticked every can-do while Aufgaben were open | the recap contradicted the Check | superseded by #14 |
| 10 | The player's own chrome was German-only while the renderers follow `dm_lesson_lang` | one flow mixed „Step 1 · Practice" with „Fast geschafft" | UnitPlayerPage uses `useV2Strings` |
| 11 | The Sie-register scan did not cover v2 | nothing guarded v2 against du-forms | `tests/course-player.test.mjs` scans `src/components/course-v2`, `src/pages/course-v2` and the v2 `strings.js` |
| 12 | CheckView said „12 kurze Aufgaben" whatever it asked | the fixture Check asks 8 (no earlier units to draw from) and announced 12 | `check.lead` takes `{n}`, the actual item count |
| 13 | StartView accepts `onAttempt`; the player never passed it | the gist answer and every test-out answer were lost | passed via `extra`; flushed when the Start is done, under stage `start` / `testout` so they never read as a step's items |
| 14 | After a weak Check (proof items wrong, Aufgaben submitted), the recap said „Das können Sie jetzt" and ticked all four can-dos, directly below „Das kann ich: noch offen". The Check's closing line „Geschafft! Sie können jetzt …" also showed at 1 of 8 | the learner was told they can do what the Check had just shown they cannot | CheckView reports `proofs`. The recap ticks each can-do by its proof rule: Aufgabe submitted, or the proof item right. The heading says „Das können Sie jetzt" only when all are proven. The closing line shows only when every proof holds. |
| 15 | Below 60 % the Check and the recap both say „repeat a Lernschritt", but the recap offered no way to do it. A repeat in the same visit would also have served the identical draw, because the attempt number was frozen at load. | a suggestion with no action behind it; the repeat exclusion lost within a visit | the step list appears under the tip. The attempt number is stored runs + runs in this visit + 1, so only the finished step re-draws. |
| 16 | The player's step list, resume button and recap named steps by German kind labels | English chrome showed „Prüfungstraining" where the step itself said „Exam training" | `kind.*` strings, and `stepTitle()` mirrors StepView's heading rule („Sprechen"/„Schreiben" stay German in both, as in StepView) |
| 17 | The test-out note said „Die Lernschritte sind angerechnet", but Sprechen and Schreiben are also labelled „Lernschritt 5/6" | ambiguous about what was credited | worded like the Start: „Die Übungsschritte sind angerechnet. Offen sind noch Sprechen und Schreiben." |
| 18 | The player's headings (resume, recap) were regular weight; the renderer's heading of the same unit title is semibold | the unit title changed weight between Start and resume | the player's headings use the renderer's weight and tracking |
| 19 | ItemView showed a non-exam choice item's options in authored order, and authors key most of them at `options[0]` (ITM-03 advisory) | a learner could answer by position | `unitPlan.orderedOptions` shuffles them seeded by unit + item + attempt (`step.plan.attempt`, now also on the Check plan); exam items (role `exam`, inside an ExamBlock) and R/F · Ja/Nein keep their order; grading stays by option string (2026-09-27) |

Files changed across both passes:

- **Player core:** `src/lib/course-v2/{unitPlan,loaders}.js`
- **Pages:** `src/pages/course-v2/{UnitPlayerPage,rendererSlots,ActionBar}.jsx`
- **Renderers:** `src/components/course-v2/{StepView.jsx,CheckView.jsx,strings.js}`
- **Shared app files:** `src/lib/chrome.js`; `src/components/LevelSubscriptionGuard.jsx` (the DEV bypass only)
- **Tests:** `tests/{course-v2-player,course-front-door,course-player}.test.mjs`
- **New:** `scripts/course-v2/walk-fixture.mjs`, this file, `screens/`

---

## 4. Still missing for launch

Ordered by what blocks first.

1. **Compiled content.** `compile.mjs --all` refuses every level, so no real level has `src/data/course-v2/`.
   - Each level has 1 of its 12 units authored (a2.1: `u04.json`), and `course.json` references all 12. That gives
     ≈ 646 REF-01 errors per level, from `course.json` and the lexicon.
   - The registries fail SCH-01 on every level: `text-types.json` 423 errors, `lanes/ga2.json` 48, `lanes/tb2.json` 45,
     `lanes/sd1.json` 41. These are other agents' files (RAILS §8).
   - Until the compiler can write a level with some units still missing (the manifest already has `chunk: null` rows
     for them), no authored unit can be previewed through the real routes.
2. **`completion.js` (E1-7)** throws on the revised SCHEMA §5 closing entry `{ kind: 'halbtest' | 'modelltest', lane:
   'learner' }`. Until it is fixed:
   - the player passes only `unitRules`;
   - the course home falls back to the default course rules, with a console warning;
   - the TODO in `course-v2-completion.test.mjs` tracks it.
3. **The migration** `migrations/2026-10-01-course-v2.sql` must be hand-applied before three things work:
   - status `tested_out` is stored (until then `lesson_progress` keeps `started`; the step markers still carry the
     credit);
   - `learner_goals` exists (until then the plan line uses the default pace);
   - `course_events` exists (until then `logCourseEvent` switches itself off after the first failure).
4. **Generated items.** The compiler records generator ids but no item bodies. The renderer builds only
   `dictation.fromInput` and `perception.pairs`. Not built:
   - `numbers.dictation`
   - `lex.articlePlural`, `lex.glossMatch`, `lex.glossTyped`
   - `perception.intonation`

   So fixture LS1 serves 9 authored and 2 generated items, 11 of the planned 12. The compiler, or the player core
   through StepView's `generated` prop, must provide the others.
5. **Exam blocks carry no `plays`.** `content.js` `LANE_PLAYS` copies the four launch lanes. The compiler should emit
   `plays` onto blocks, or a test should pin `LANE_PLAYS` against `registries/lanes/*.json`.
6. **Warm-up** (6 due review items per Lernschritt). The client has no compiled content for v2 card keys (`word:lx.*`,
   `pattern:…`); it needs a compiled card-content index.
7. **Submission trust.** A `sprechen`/`schreiben` step counts as submitted when StepView says `submitted: true` after a
   real grader result. A server-side confirmation (`course_ai_usage` / `writing_submissions`) should replace that
   trust, so a modified client cannot claim it.
8. **Proof results across visits.** The recap knows the Check's item proofs only in the visit where the Check was
   taken. After a reload it falls back to unit completion for those can-dos, and to the stored status (`accuracy`
   for signed-in learners) for the Siegel. Reading the proof items' rows from `lesson_attempts` (stage `check`) would
   close this.
9. **Signed-out progress** (free level a1.1) lives in localStorage and is not merged into Supabase on sign-up.
10. **`/course/:level` → v2 switch** for levels in `COURSE_V2_LIVE` is not wired. `isCourseV2Live()` exists; the
    legacy route line in `App.jsx` needs a small wrapper.
11. **Language gaps.**
    - `CourseHomeV2Page` and `PlateauPage` are German-only. The legacy course home is too, so this is consistent, but
      it is still a gap.
    - The reused `SpeakingSession` has English chrome („Teacher", „Finish & get feedback").
12. **Found at 360 px, not changed.**
    - StartView's „Los geht's" sits in the page flow, not pinned. That is deliberate: it stays disabled until the gist
      item right above it is answered.
    - Every step screen shows two progress bars, the Shell's (steps of the unit) and StepView's (segments of the step).
      They measure different things, but one of them could go.
    - Content note for the SCHEMA fixture's author: LS1 `p04` („Der Techniker ___ sich heute.") and `p08` (sentence
      building) have the same target sentence. When the draw puts one in practice and the other in the exit, the
      exit item repeats a practised sentence.
13. **Duplicate helper.** `attemptPayload()` exists twice: `src/lib/course-v2/checkItem.js` and `grade.js`. `grade.js`
    adds the retry and reveal flags. Both give the contract shape; merge them before a third caller appears.
14. **Not rendered yet.**
    - Images (`assetRef`, `imageRef`, `photos`): no approved asset URLs exist.
    - Prüfungsmodus (timed, no feedback): blocks always run in Lernmodus.
    - Writing drafts live only in this device's localStorage (`dm_v2_writing_<bankKey>`).
15. **Real devices.** All click-throughs ran in headless Chromium, signed out, with speech synthesis off, no
    microphone and Supabase blocked. Before launch:
    - a signed-in run against a Supabase branch: attempt batches, resume across devices, card seeding;
    - a real microphone run of Sprechen and read-aloud;
    - an iOS Safari pass.
