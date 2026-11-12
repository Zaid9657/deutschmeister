# Guided A1.1 Lektion 1 — build report 1

Date: 2026-11-12. Scope: BUILD-BRIEF-1, steps 0 and 1 only.

## Result

A1.1 Lektion 1 now has an additive guided flow. It keeps every existing curriculum field,
including all 20 Wortfeld entries, all 10 dialogue lines, the existing pretest, three Phonetik
items, two dictations, two final read-aloud lines and `minutes: 15`.

Only L1 opts into the new learning flow. Lektionen 2–12 and A1.2 retain the legacy builder,
stage order, practice selection and scoring. Measurement changes apply to the shared player.
Nothing was committed, deployed or applied to production. `CLAUDE.md` and
`astro-site/package-lock.json` are unchanged.

## L1 data and stage order

`flow: 'guided'` adds four half-open dialogue ranges:

| Chunk | Original lines (zero-based, inclusive) | Meaning check | Ana's say line |
|---|---|---|---|
| 1 | 0–1 | Greeting and giving a name | 1, using the learner's own full name |
| 2 | 2–4 | Being asked to spell a name | 3, spelling the learner's own surname |
| 3 | 5–7 | Being fine and saying thank you | 7 |
| 4 | 8–9 | Goodbye and see you tomorrow | 9 |

Every chunk follows hear/read → checked meaning → say. All four meaning checks use English
choices with German Sie instructions and English twins. `checkAnswer` and `checkOptionsFor`
grade the choices. A wrong choice receives its correct meaning before continuing. Hint-first
correction remains for a later brief. The say screen uses the staff cue immediately before the
chosen Ana line, including when a chunk ends in a different staff question.

Built order without due review cards:

| Part | Stages |
|---|---|
| 1 | `pretest`, `scene` (12 item positions), `wortfeld` (11 scene words), `notice`, `phonetik` |
| 2 | `wortfeld-more` (9 remaining words), `practice` (7), `derived` (3), `dictation` (2) |
| 3 | `speaking`, `writing`, `requeue`, `recap` |

An existing due-card warm-up still precedes the pretest. Empty requeue remains skipped. Both
saved pauses remain, and the guest save ask replaces the first pause. The second word stage
is titled “More words for this topic” / “Mehr Wörter zu diesem Thema”; nothing is dropped.

The guided builder wraps the legacy build with the flag removed, retaining the original
curriculum/pool/attempt inputs. Every unchanged stage and all three seeded practice draws are
compared against that legacy result in tests. `buildLesson.js` has only its new import and
early guided branch; its legacy body is unchanged.

## Scene, speech and saving

The scene is lazy-loaded. It uses `GlossLine`, `PlayButton` (including `AudioSourceBadge`),
`ReadAloudLine` and the existing scoring endpoint and fallbacks. Signed-out learners, missing
microphones, denied capture, exhausted allowances and unavailable scoring retain the existing
honest “I said it” route. There is no new endpoint or limit.

The scene has a slim teal header, lesson/part label, three progress segments, the supplied
reception painting, German/English dialogue cards, “Now you say it”, and a large round recording
control. The language toggle sits below the header so the slim bar has room on phones. All
colours and fonts use existing tokens; coral text actions use the accessible coral token.
No teacher button is shipped. Audio remains labelled Computer voice / Computerstimme.

The art manifest now honestly says `mixed-painted-svg`, with no invented model name. L1 uses
the supplied 640/800/1168 WebP variants, real 1168×880 dimensions and the requested alt text.
Other manifest scenes and characters retain their SVGs.

`scene` is excluded from first-pass practice scoring. Its meaning outcomes cannot raise gold,
and its spoken results stay separate from the existing Part 3 speaking results. Practice gold,
completion, recap and outbox rules are unchanged.

Saved runs carry `flow`, the scene item position, and numeric/flag-only scene speech results.
The player and course-home resume offer reject a snapshot with a different flow. Untagged old
runs are legacy; L1's old run therefore starts fresh, while old runs in every legacy lesson
remain resumable. `RUN_VERSION` stays 1. Names, recordings and transcripts are not added to the
snapshot or analytics. Names entered for personalised speech remain in component memory.

The shown duration estimate adds one meaning check and one say turn per chunk. L1 currently
shows **20–50 minutes, estimated**; this is a count-based assumption, not a measured duration
or a claim that the later 60-minute design is already built. Practice and derived counts remain
7 and 3. The validator's 15-minute target remains unchanged and is not used as the shown duration.

## Step 0 and the owner-applied migration

Migration: `migrations/2026-11-12-lesson-furthest-stage.sql` — **not applied**.
It idempotently adds nullable `lesson_progress.furthest_stage text` and
`furthest_at timestamptz`. Its header includes verification and rollback instructions. It adds
no grants, policies, endpoint, function, trigger or data backfill.

Opening the intro no longer calls `startLesson`. Pressing a ready Start writes the started row
and freezes the run; duplicate clicks do nothing. The existing ignore-duplicate write preserves
completed rows. Stage measurement waits for the Start write and excludes previews and stages
covered by a pause/save ask. A visible resumed run also ensures a missing own-account row once,
so work started as a guest can be measured after signing in at the saved pause. That ensure
ignores existing rows and cannot replace their completed status or accuracy.

The reach writer uses an own-user/level/lesson-scoped conditional UPDATE. It accepts only null
or earlier stored positions, so back, reload, repeats and concurrent updates cannot lower the
furthest position or restamp an equal position. The timestamp is captured when the step is
observed. Scene positions include `scene:1:hear`, `scene:1:meaning`, `scene:1:say`, through
`scene:4:say`. Existing consented funnel events keep the same `run_id` and carry those fixed
item labels. Analytics consent handling itself is unchanged.

Missing-column errors `42703` / `PGRST204` disable only reach writes for that client/page session.
Queued steps see the disabled flag, so even rapid advancement makes just one failed column
probe. There is no UI error, timer, automatic retry or outbox entry. Network errors also return
false without blocking playback. Existing completion saving remains independent.

The schema fixture's live table list and snapshot date are unchanged. A separate pending-columns
entry records the two intended columns. The column guard now validates pending additive columns
against their exact SQL declarations, their absence in the live snapshot, and the migration's
“NOT YET APPLIED” ledger status. After owner application, refresh the live snapshot and remove
that pending entry. Historical intro-based started rows are not rewritten; compare new starts
with that measurement change in mind.

## Files changed

- Data: `src/data/curricula/a11.js`, its synchronized Astro twin,
  `src/data/curricula/a11.meta.js`, `src/data/curricula/a11.art.js`,
  `src/data/events.js`, its synchronized Astro twin.
- Engine and persistence: new `src/lib/lesson/buildGuided.js`, `scene.js`, `stageReach.js`;
  `src/lib/lesson/buildLesson.js`, `sessions.js`, `runState.js`, `strings.js`;
  `src/services/lessonService.js`.
- Player and components: `src/pages/lesson/LessonPlayerPage.jsx`,
  `src/pages/CurriculumHomePage.jsx`, new `src/components/lesson/SceneStage.jsx`,
  `DialogStage.jsx` (exports the existing gloss), `ReadAloudLine.jsx` (opt-in guided appearance),
  `WortfeldStage.jsx` (optional bilingual title), `src/components/ui/Button.jsx` (coral/circle
  variants), `src/components/illustrations/SituationScene.jsx` (responsive manifest dimensions).
- Validation and records: new `scripts/lib/guided-content.mjs`,
  `scripts/validate-curriculum.mjs` (RULE 32), `scripts/README.md`, the migration and
  `migrations/README.md`, `tests/fixtures/db-schema.json`, this report.
- Test files are listed below. Generated lesson-pool content stayed byte-identical.

## Tests added and updated

New `tests/guided-lesson.test.mjs` covers:

- Guided stage order, both pauses, every original word/line, and unchanged L2/A1.2 order.
- Identical unchanged stages and seven-item draws across all three attempts.
- All meaning choices graded through the real checker; scene outcomes excluded from gold.
- Personalised speech, flow tags/mismatch rejection, unchanged run version, text-free snapshots.
- Mutation regressions for every new guided data field, enforced generically by RULE 32.
- Own-row, monotonic reach updates, guest-row adoption, missing-column concurrency and network failures.
- Start-only start wiring, preview/pause exclusion, waiting for the Start write, lazy loading,
  and the additive migration shape.
- The real scene JSX callbacks: hear → wrong meaning and feedback → personalised speech → next
  chunk, plus restoring a self-confirmed result and selecting the correct preceding staff cue.

Updated assertions retain their previous purpose:

| Test file | Reason |
|---|---|
| `course-value.test.mjs` | L1 translations now belong to scene; pause suppression uses item-level reach keys and dependencies. |
| `lesson-run-resume.test.mjs` | Resume now includes the current flow in addition to the owner. |
| `course-meta.test.mjs` | Adds count-based guided duration coverage; retains 7 practice / 3 derived assertions. |
| `course-art.test.mjs` | Checks mixed provenance, supplied asset dimensions/paths, responsive integration and unchanged other scenes. |
| `funnel-events.test.mjs` | Checks fixed scene item labels, run ids, updated event definitions and text exclusion. |
| `course-player.test.mjs` | Includes the new scene among sites required to use the common checker. |
| `course-home.test.mjs` | Start still freezes and tracks once; it now performs the authorized database start write. |
| `a11-finish.test.mjs` | Checks every word's contextual example across both word stages instead of only the first. |
| `b3-player-recovery.test.mjs` | Keeps owner-bound resume coverage with the additive flow argument. |
| `lesson-late-load.test.mjs` | Keeps ready-before-freeze coverage with the duplicate-Start guard. |
| `db-columns.test.mjs` | Adds exact migration validation for pending columns separately from the truthful live-schema snapshot. |

The brief's protected tests (`lesson-engine`, `lesson-scoring`, `lesson-back-skip`, `curricula`,
`save-progress-ask`, speaking suites, `explain-cache`, `explain-refund`) have no edits.
No meaningful assertion was removed, no test was skipped, and no ratchet was raised.

## Course rules bent or awaiting later change

1. L1's old dialogue → full word field sequence becomes checked scene chunks and a split word
   field, with explicit per-stage part overrides. Legacy lessons keep their existing sequence.
2. L1 now has four earlier say turns in addition to its two existing final read-aloud lines.
   The scorer still measures word recognition; spelling a name by voice is not a certified
   spelling assessment or a new pass gate.
3. L1's old snapshot is intentionally superseded by the guided flow tag; other legacy runs
   are not reset and the run version is unchanged.
4. The approved guided scene uses coral actions with teal brand surfaces, differing from the
   older global wording that calls siegel the action colour. Existing token values and legacy
   components' default appearance are retained. `CLAUDE.md` was not edited.
5. Art is now partly painted. Browser-voice labels stay honest; no generated-audio exception
   is claimed.
6. The shown duration becomes flow-aware, while `minutes: 15` and validator hour accounting
   remain unchanged. A full three-by-20-minute lesson is later work.

Proof/pass-based completion, locked-path access, hint-first correction, new sounds/read/fluency
stages, teacher questions, Arabic, role-play, subscription changes and generated audio were not
started. Their corresponding rule changes remain for later briefs and owner decisions.

## Gates and verification

Final gate results: all automated gates passed. Existing `dist/` directories were moved
to `/tmp/` before rebuilding, providing a clean build without altering `.git`.

| Gate | Result |
|---|---|
| `build-lesson-pool.mjs a1.1` → `validate-curriculum.mjs` → `sync-shared.mjs` | PASS |
| `npm run lint` (zero warnings) | PASS |
| `node scripts/check-duplicates.mjs` | PASS, all 19 manifest pairs identical |
| `npm test` | PASS, 299 test files, 0 failures, 0 skips; new guided suite also passes all 9 direct cases |
| `node --check` for every function/shared function in the brief's glob | PASS, 83 files |
| Clean SPA production build, then `index.html` → `app.html` | PASS; scene emitted as a separate lazy chunk |
| Offline Astro build using the committed grammar cache | PASS, 143 pages; content-cache mode confirmed |
| Merge → prerender → full `check-built-html.mjs dist` | PASS, 151 pages checked, 0 failures / 0 warnings; 146 sitemap URLs checked |
| `git diff --check`; protected-file and lockfile review | PASS |

Execution logs are retained locally under `.cache/evaluation/guided-1/`.

The build has the existing nonblocking Browserslist stale-data notice. The offline build checks
against the committed content snapshot, not live Supabase content.

## Open verification / owner handoff

- The migration is prepared and explicitly unapplied. No live production query or migration
  execution was performed; database behavior is verified with injected clients, SQL/ledger
  guards and concurrency-oriented regression tests.
- A phone-sized browser walkthrough, screenshot comparison against `lesson-screens.jpg`, and
  real signed-in microphone scoring still require the owner's preview environment. Attempts
  here were blocked: Vite listening on both `0.0.0.0:5173` and `127.0.0.1:5173` returns `EPERM`;
  the installed Playwright Chromium at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`
  exits with `SIGTRAP` after `setsockopt: Operation not permitted`. No screenshot or browser
  pass is claimed. Real scene callbacks were exercised through the repository's JSX harness.
- No effectiveness, completion-time or speech-quality claim was added. The owner/Claude phone
  review in the brief remains before shipping. There is no deploy or commit from this build.
