# Build report 5 — teach it before you ask it

Completed, 2026-11-14. Scope: brief 5 A–D, review 24 B1 and L1 spelling proof.
No commits, dependency changes, SQL, A1.2 edits, or changes to protected tests, CLAUDE.md or the Astro lockfile.

## A — reusable taught-set stage

Implemented `taught-set` as a lazy-loaded stage. Member screens use PlayButton and ReadAloudLine with existing audio/microphone fallbacks; check screens use checkAnswer/checkOptionsFor. Five members maximum per group (20 seconds/member assumed by the time model); 2–3 checked responses before further input. A saved stage key and itemIndex resume within groups. No learner text is persisted. Attempts are excluded from practice gold and requeue. Time estimates count actual built member/check steps. Analytics names are declared in events.js and synced. Focused set/guided tests, pool generation, curriculum validation and lint passed. The original curriculum was captured locally before edits
for the new rule's before/after measurement.

Every member below is written → said (letter names use readable pronunciation aids):

- alphabet: A → Ah; B → Beh; C → Zeh; D → Deh; E → Eh; F → Eff; G → Geh; H → Hah; I → Ih; J → Jot; K → Kah; L → Ell; M → Emm; N → Enn; O → Oh; P → Peh; Q → Kuh; R → Err; S → Ess; T → Teh; U → Uh; V → Vau; W → Weh; X → Iks; Y → Ypsilon; Z → Zett; Ä → Äh; Ö → Öh; Ü → Üh; ß → Eszett.
- ß note: also „scharfes S“; capital ẞ; keyboard alternative ss. Full-hour note: um ein Uhr, but um eins without Uhr.
- numbers-0-10: 0 → null; 1 → eins; 2 → zwei; 3 → drei; 4 → vier; 5 → fünf; 6 → sechs; 7 → sieben; 8 → acht; 9 → neun; 10 → zehn.
- numbers-11-100: 11 → elf; 12 → zwölf; 13 → dreizehn; 14 → vierzehn; 15 → fünfzehn; 16 → sechzehn; 17 → siebzehn; 18 → achtzehn; 19 → neunzehn; 20 → zwanzig; 30 → dreißig; 40 → vierzig; 50 → fünfzig; 60 → sechzig; 70 → siebzig; 80 → achtzig; 90 → neunzig; 100 → hundert.
- age-twenty: 10 → zehn; 20 → zwanzig (derived; not a separate number source).
- full-hour: 09:00 → um neun Uhr; 10:00 → um zehn Uhr; 11:00 → um elf Uhr; 01:00 → um ein Uhr.
- Compound rule: 21–99: say the unit first, then und, then the ten. Write one word: einundzwanzig is one-and-twenty. Before und, eins becomes ein. Exact tens keep their own names.
- Examples: 21 → einundzwanzig; 27 → siebenundzwanzig; 72 → zweiundsiebzig.
- Unshown transfer checks: 34 → vierunddreißig; 61 → einundsechzig; 98 → achtundneunzig.
- Letter groups also dictate these real words/names: Ada, Ehe, Mai, Post, Wut, süß. Each uses only letters already introduced.
- Separate pairs: E/I, G/J, V/W; 13/30, 14/40, 15/50, 16/60, 17/70, 18/80, 19/90. Both directions are checked.

## B — placement before first use

Placed before the **whole scene** in L1/L2/L4: the intact conversation then has one clear start, and every subsequent say/check has its prerequisite. The diagnostic remains first. L6 has a four-member full-hour chunk (including ein Uhr / um eins) before its scene, read and writing; its notice no longer says this is deferred. L8's existing notice is now in part 1 before scene/read, without rewriting a dialogue or removing any curriculum field.

The new class rule additionally found L3's **zwanzig** before L4's number set. A minimal L3 set derives 10 → zehn and 20 → zwanzig from the same canonical members and checks both before the age scene. This closes the same B1 class without changing its dialogue. Its members are part of the complete inventory above.

Gates: rebuilt pool, validator, shared sync and all twelve draft checks passed; guided-lesson (9), guided-rollout (9), course-meta (26) checks passed. Both pauses and requeue immediately before recap remain. No protected test forced a different placement. Unprotected guided order assertions were updated to include the added stages; existing equality, pause, practice and legacy assertions remain.

Built order and delivered counts (repeated contrast members are counted as delivered turns):

| Lesson | Stage key | Groups | Hear/see/say turns | Checked tasks | Placement |
| --- | --- | ---: | ---: | ---: | --- |
| L1 | set:alphabet | 9 | 36 | 18 | pretest → set → scene |
| L2 | set:numbers-0-10 | 3 | 11 | 6 | pretest → set → scene |
| L3 | set:age-twenty | 1 | 2 | 2 | pretest → set → scene |
| L4 | set:numbers-11-100 | 12 | 35 | 25 | pretest → set → scene |
| L6 | set:full-hour | 1 | 4 | 2 | pretest → set → scene |
| L8 | existing notice | — | — | — | pretest → notice → scene → read (with words/sound in between) |

Time assumptions are derived from those turns (10–20 seconds/member, 20–40 seconds/check), not measured durations. New set member speech results are saved per stable set id, with only counts/flags; resuming a completed member does not require another scored recording.

## C — built-order regression rule

RULE 36 inspects buildLesson output for all twelve lessons at attempts 1/2/3, with cumulative taught forms. Its number recognition and numeric mapping checks derive from the existing shared germanNumberWord reader, independently of the set data being validated. It recognizes number words/digits, German letter names and spelling, unit-before-ten compounds, full/half/quarter hours and official minutes. FUNCTION_WORDS, meta headings, tested stimulus text and later notices grant no teaching credit. Meta rows must reference a delivered set. Draft checking shares the same rule.

Before (captured original curriculum, same committed pool): **262 findings** = two missing meta references plus 260 built item/draw findings. Per lesson, including the two heading findings: L1: 33; L2: 15; L3: 10; L4: 42; L5: 11; L6: 23; L7: 6; L8: 33; L9: 9; L10: 42; L11: 25; L12: 13. These repeat affected checks across draws and later lessons; they are not 262 independent learner problems. They include the five review B1 gaps plus L3's premature age number. After: **0** across all 36 built lessons. The pretest remains a diagnostic exemption; learning-check screens themselves never count as prior instruction.

Regression checks cover removed member/stage/reference/rule, late clock notice, the L3 age, all four guided checked surfaces, every seed, actual placement, legacy A1.2, the draft path, incorrect number mappings, 21/22-hour forms and written-out official minutes. Added tests are tests/taught-set.test.mjs and tests/taught-order.test.mjs.

## D — spelling proof

Implemented `listen_spelling` for L1 goal 3. A validated pointer resolves the original C-H-A-K-I-R-I dialogue line and derives CHAKIRI plus German letter-name audio (Zeh. Hah. Ah. Kah. Ih. Err. Ih). The learner must play that audio, then transcribe the name through checkAnswer/checkOptionsFor. Entering their own surname alone fails; without playback there is no attempt or pass. The scored mic alternative asks for their own surname and expects its German letter names; it never displays/plays the answer and never accepts self-confirmation, unsure scores or an empty/unsupported name. Unsupported letters use the listening route.

RULE 35, the shared draft checker, content/l01.json and CONTENT-BRIEF.md describe/validate this form. The typed target and audio are derived from the dialogue and alphabet, not separately maintained. Re-teach/hint/retry and saved proof evidence remain. Names, audio, transcripts and answer text are absent from saved proof data. Only a heard-spelling/spoken-spelling evidence label joins the existing flags/counts; an old typed-own-surname pass is invalid for this task and resumes at the new spelling proof. Existing proof, proof-content and proof-parts checks pass, with new regressions for playback, wrong own-name transcription, mic fallback/self-confirmation and broken source pointers. The old separator assertions still check the legacy own-name adapter; L1’s live task tests the new listening form.

Unprotected tests updated: guided-lesson/guided-rollout assert the new exact stage orders; course-meta preserves all guided fields when doubling chunks; lesson-proof/proof-content/proof-parts cover the new task and retain the legacy separator checks; course-path-lock's successful-proof fixture now supplies a heard-name response. Course-player and repository-guidance assertions were preserved; their failures were resolved by moving chrome into strings.js and documenting the new pure script module. No assertion was weakened and no protected suite was edited.

## Final gates and limits

- Pool generation, curriculum validator (including RULE 36), shared sync and drafts 1–12: passed.
- ESLint (zero warnings), all 20 shared-file duplicate checks and git diff whitespace check: passed.
- Full npm test: **307 test files passed, 0 failed** in the final run (111.7 seconds), including every protected suite.
- node --check on every requested Netlify function/shared module: passed.
- Fresh Vite SPA build → app.html, offline Astro build (143 pages), merge, prerender and full built HTML: passed. Built HTML checked 151 pages and 146 sitemap URLs, with 0 failures and 0 warnings.

Environment adaptations: the stock Astro CLI could not refresh its default node_modules/.vite cache (EROFS on the supplied symlink). The same installed Astro build API, original astro.config.mjs and committed grammar cache passed with only vite.cacheDir redirected to /tmp/dm-brief5-astro-vite. No dependencies or symlinks were changed. The explicit shell rm command was unavailable; Vite's standard build cleared its output directory before the fresh build/prerender, as configured by its default emptyOutDir behavior.

A browser walkthrough/screenshot remains unverified: the local dev server was denied listen (EPERM), and a server-free Playwright attempt also failed when Chrome was denied its socket operation (SIGTRAP). Real JSX callback tests cover hear/say/check gates, typed/choice grading, resume and proof evidence, but do not establish installed voice quality, real microphone/STT behavior, actual two-minute durations or beginner learning outcomes. Those still require human listening/learner evidence. No release, commit or SQL was performed.
