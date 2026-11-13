# Guided A1.1 — build report 3

Date: 2026-11-12. Scope: BUILD-BRIEF-3, Parts A–D, in order. No commit or deployment.

Read CLAUDE.md, CONTENT-BRIEF.md, the preceding report, Team/Protocol v5, steward
guidance and all eleven draft notes. Protected tests, CLAUDE.md and
astro-site/package-lock.json must remain unchanged. Each part gets its fast gates
before the next starts. Gate logs are retained under /tmp/a11-guided-build3/.

## Part A — sound shapes (complete)

Implemented a shared shape classifier and derived checked questions for all
original Phonetik items, preserving their count and text. No per-lesson answer keys
or deliberately incorrect synthesized forms.

Part A complete: pool build, curriculum validator, sync, lint and full `npm test`
pass. All twelve draft checks also pass, with no sound exceptions. The draft
checker now treats unsupported sounds as blocking instead of reporting pending.

| Kind | Checked question and source |
|---|---|
| Word stress | Select the capitalized syllable pattern shown in the model |
| Stress with article/pronoun | Same, retaining the prefix outside the syllables |
| One-syllable sound word | Choose the real word/line played, among this lesson's items |
| Pair | Choose the real member played, among this lesson's words/phrase |
| Unmarked phrase | Choose the real phrase played, among this lesson's words/phrase |
| Sentence stress | Select the word capitalized in the visible sentence |
| Question melody | Select the direction of the visible arrow, with its bilingual rule |

`guidedSound.js` supplies the classifier to builder and validator. The model is
visible before answering stress/melody questions; computer stress and intonation
are explicitly not guaranteed. Audio fallback displays the actual spoken target.
All items still require listening/text fallback → common checked choice →
ReadAloudLine. Options use marked syllables (Part B item 2 completed here because
it belongs to question construction), with the existing `caseSensitive` item flag
so a differently capitalized stress pattern is wrong. No checker change.

Added two rollout regression tests covering all seven kinds, invalid markings,
all 36 original items, bilingual prompts, derived options, fairness and exact
common-checker outcomes. Existing focused step-2 tests pass unchanged.

## Part B — play-through fixes (complete)

Part B complete: pool build, validator, sync, lint and full `npm test` pass
(301 test files). The step-2 suite has four additional behavioral regressions:

- Sound feedback uses its own bilingual confirmation/correction. Stress options
  already became marked syllable patterns in Part A.
- The shell has no primary action while the choice owns Check/Continue; after
  checking it owns the single Continue, enabled only after speaking.
- Spelling detection reuses the checker's spelled-prompt/answer classifiers;
  sentence-building also has its missing word-order/verb-form hint. The existing
  bilingual answer-leak filter and safe fallback still apply to every hint.
- A choice's fieldset references the one visible prompt via aria-labelledby,
  avoiding a repeated hidden legend in either language or identical twins.
- PlayButton has one persistent live region that becomes visible on failure,
  replacing the duplicate hidden and visible error text. Text fallback still works.

Browser preflight: both installed Chromium and headless-shell were tried. The
sandbox denied `setsockopt` (Chromium crashpad, SIGTRAP) and `shutdown`
(headless-shell sandbox host). Browser screenshots/layout remain unverified;
component callback tests run successfully. No permission request was made.

## Part C — number-set read coverage (complete)

Part C complete: both simplified drafts pass; pool build, validator, sync, lint
and full `npm test` pass (301 test files). Added a regression proving that the
literal boolean `meta: true` exempts the two set headings, removing it restores
the coverage error, a string flag does not exempt anything, ordinary missing
words still fail, and the heading exemption does not bypass question validation.
Only the guided read-coverage loop changes; Wortfeld data, other rules and all
ratchets remain intact. Original writer notes remain with an appended resolution.

## Part D — merge and rollout (complete)

Merged the drafts additively and checked protected suites before finalizing
which lessons remain guided. L12's hook explicitly says “In A1.2”; the recap
can display this honest story preview independently of its unchanged checkpoint
and final-test primary path. A1.2 L1 is live and actually begins with Ana looking
for the Rathaus, so the cross-level hook is retained.

D progress: the protected curricula suite passes all 82 cases after merging all
11 drafts; no conflict has appeared. A structural comparison against HEAD,
removing only `flow`, `guided` and `nextHook` from L2–12, matches the entire
original A1.1 curriculum exactly. All original Phonetik, dialogue, Wortfeld,
practice and other fields are preserved. The synchronized Astro twin matches.

Cue derivation now takes the immediately preceding dialogue line, even outside
the chunk, and is shared by scene and fluency. L10's first say task has no cue;
the other four receive their preceding dialogue line. Meaning feedback quotes
all lines of the checked exchange: an opening say line must not truncate the
explanation before the answer. The short-read eyebrow is now generic in both
languages, and sound speaking shows the actual spoken target for pair items.

The new rollout suite also covers all lessons across all three seeded draws:
unchanged scoring stages, exact original lines, checked meanings, both pauses,
Wortfeld partition, cue rendering, saved guest/account legacy runs (with and
without flow tags), guided/A1.2 resumption, dynamic estimates, funnel step names,
all 11 SVG fallback scenes, and the grounded A1.2 hook. The two older guided
suites keep their assertions, replacing L2's old legacy witness with a synthetic
lesson without flow plus the existing real A1.2 witness. Their L1-only hook
expectation is expanded to all guided recaps and retained for legacy A1.2.

The first D full run found one more unprotected legacy witness in
`course-value.test.mjs`: L2's dialogue was expected to have translations closed,
while guided scenes carry the bilingual model. The false/closed assertion is
retained on both synthetic L2 without flow and real A1.2 L2, and guided L2 is
checked separately. The focused suite passes; no production behavior or
protected assertion was weakened to resolve this witness.

Part D fast gates complete: pool build, validator, sync, all 12 draft checks,
lint, duplicate check and the final full `npm test` pass (301 test files).
Function syntax checks and `git diff --check` pass. All twelve Lektionen are
merged; none was withheld and no protected-test conflict required an exception.
The initial D run's one stale unprotected witness is resolved as documented above.

## Final built-output gates (complete)

Starting from clean root dist, using the explicitly requested offline grammar
cache for Astro. The shell rejects rm-style commands, so the old generated dist
is moved to /tmp/a11-guided-build3/dist-before-final before rebuilding instead.
Browser layout and audible voice quality remain unverified due to the sandbox
failures above; no learner/server/database writes were performed.


The complete clean build passes: SPA → app.html, offline Astro (143 pages),
merge, prerender and full built-HTML verification. Final HTML: **151 pages,
0 failures, 0 warnings**; crawl guard: **146 sitemap URLs, 0 failures**.
Standalone Astro prints six font-resolution warnings; all six URLs exist in the
merged dist/fonts. Builds also report old Browserslist data. No dependency or
lockfile update was made for those notices.

| Final gate | Result |
|---|---|
| Pool build → validator → shared sync | pass |
| Draft checker, 1–12 | pass |
| Lint, duplicate check | pass |
| Full npm test | 301/301 test files pass |
| Function syntax | pass |
| Clean SPA and offline Astro builds | pass |
| Merge, prerender, full HTML/crawl checks | pass |
| Protected suites and forbidden files unchanged | verified against HEAD |
| Browser screenshot/walk and actual audio | blocked/unverified, as described above |

## Final scope and remaining limits

Merged L2, L3, L4, L5, L6, L7, L8, L9, L10, L11 and L12; L1 remains guided.
No lesson was left legacy. A1.2 data, art manifest and engine behavior are
unchanged; its real legacy path remains a test witness. Existing SVG scenes
satisfy the non-image branch, so no art-manifest edit or nonexistent image path
was needed. The estimate model, funnel naming and saved-flow mechanism already
operate by flow/content counts; the new all-lesson regressions prove them.

No course rule was bent beyond the brief's authorized guided-flow and number-set
coverage changes. Requeue stays directly before recap; first responses still
decide practice gold, with scene/sound/read/fluency excluded. No checker or
accepted-answer widening, ratchet change, authored dialogue correction, generated
audio, teacher control, proof/lock work, access/subscription change, SQL or deploy.
Writer-noted content observations remain in the draft notes, outside this brief.

Added tests/guided-rollout.test.mjs (8 cases); expanded guided-step2.test.mjs with
4 behavioral cases; updated the rollout/hook witnesses in guided-lesson.test.mjs,
guided-step2.test.mjs and course-value.test.mjs. Every protected test file,
CLAUDE.md and astro-site/package-lock.json is unchanged. No commit was made.
