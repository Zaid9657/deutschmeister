# A1.1 remediation — 2026-10-05/06

**What this is.** The review of checkout 4372e1a (≈ 6/10) asked for fixes to scoring, content, audio,
pronunciation claims, pacing, accessibility and saving, and for evidence. This report states what was
changed, what was measured, and what is still open. Branch `claude/amazing-goodall-j95hp3`; baseline
numbers in `docs/evaluation/a11-remediation-2026-10/baseline/`, after-numbers in `…/after/`.

**What this is not.** It does not show that the course works for learners. That needs the study and
measurements in `EVIDENCE-PLAN-2026-10.md`, which have not been run. Passing tests show that the code and
content obey their own rules; they do not show natural German, accurate AI grading, comprehension or
retention. Nothing here should be read as "finished" or "proven".

## 1. Findings and their status

Status: **fixed** (changed, and verified as the last column says) · **partly** · **open** · **blocked**
(external prerequisite) · **not changed** (deliberate, with the reason).

| # | Finding | Status | Verified by |
|---|---|---|---|
| A | A wrong match pairing was recorded as `correct:true, result:'typo'` ("just a typo") and never re-queued | **fixed** — any wrong pair makes the exercise `corrected` (complete, not first-try correct, tagged Wortschatz, confused pairs recorded once and re-queued as a mini-match) | browser (L1, one wrong pair → "Done — after a second try", attempt `correct:false, result:'corrected'`); `tests/lesson-scoring.test.mjs` |
| A11y | Match tiles named "German word 3", hiding the word and leaking the pairing | **fixed** — the name is the word; columns are named groups; `aria-pressed`; persistent live region; focus moves to the next German word | browser (announcements "Pair: … / Not a pair: …", focus); source pins |
| B | Retries inflated the first-try % (requeue variants have new ids) | **fixed** — `practiceScore` counts one first-pass response per (stage, item) | browser (L1 run: 3 of 11 → "27 %", unchanged by 4 retries and 1 reveal); `tests/lesson-scoring.test.mjs` |
| B2 | A "Show answer" reveal was stored as a plain wrong answer | **fixed** — `revealed` recorded; reveal offered on retries only | browser; unit tests |
| B3 | Missed dictation and writing items came back as broken practice items | **fixed** — dictation/match/word order/listen replay in their own component; writing is never re-queued | unit tests (`requeue`) |
| C | Gold implied all-skill mastery; skipped speaking/checklist writing invisible; a weaker repeat could downgrade a stored Gold | **fixed** — "Practice gold / Übungs-Gold" with its definition; separate Practice / Listening / Speaking / Writing lines; better run kept on server and device | browser (recap lines for skipped speaking, checklist writing, read-not-heard dictation); `tests/sync-outbox.test.mjs` |
| P | Completion writes were fire-and-forget, no state, no idempotency | **fixed** — local-first outbox, three idempotent steps, "Saved to your account / kept on this device · Try again" | unit tests (partial failure, retry, throw, concurrency, account scope, expiry). **Signed-in path not exercised in a browser** (no test account was used) |
| P2 | A failed guest merge deleted local progress | **fixed** — store cleared only when every write returned success | unit test (mutation-checked: removing the guard fails it) |
| P3 | Explain and read-aloud rows counted as completed runs | **fixed** | unit test |
| Resume | Snapshot was sessionStorage, 12 h | **fixed** — localStorage, 7 days; course home offers "Lektion N is half-done — pick up where you stopped" | browser (full reload resumed on the same stage); unit tests |
| Cert | Certificate unreachable (nothing wrote the final-test node), English body, claimed a "Start Deutsch 1 level" | **fixed** — a passed course final test writes the node; German Sie body: "Übungstest im Format Start Deutsch 1 — kein Goethe-/telc-Ergebnis" | unit/source tests. Not walked in a browser (needs the whole course done) |
| CP | Checkpoint read its attempt state before the write resolved; accuracy stored 0–100 vs 0–1 | **fixed** — awaited; 0–1 from 2026-10-05 (older rows keep their value) | unit tests |
| Transfer | Checkpoints re-used items the learner had just seen in the Lektion | **partly** — unseen items drawn first: lesson-seen pool items per checkpoint 5/3/5/5 → 1/1/2/0 | `tests/checkpoint.test.mjs` ratchet |
| 5A | L2 Phonetik "bin – bist – sind" has no long/short contrast; same slip in L6/L7 | **fixed** — L2 "Langes und kurzes i: Sie, wie [iː] – bin, sind [ɪ]"; L6 long vowels; L7 endings | validator; `tests/a11-content-classes.test.mjs` |
| 5B | L1 alphabet: "W sounds like an English v", English respellings, letter name vs sound conflated | **fixed** in the course (IPA, name vs sound, no respellings) | class test bans English respellings in notices |
| 5B-SEO | The public alphabet page (`astro-site/src/lib/topicSeo.js`) compares German sounds with English ones | **not changed** — there the comparisons describe SOUNDS and are phonetically right (W = [v] in *Wasser*); the course defect was name/sound conflation. Rewrite if the house rule is meant to cover SEO pages too |
| 5C | L8 "Uhr + hour + minutes"; root cause: the pool build preferred bank text over the reviewed English sidecar, silently ignoring 117 corrections | **fixed in the course** — corrections layer + sidecar precedence for reviewed levels; **DB half blocked** on the owner applying `migrations/2026-10-05-a11-exercise-text-fixes.sql` (115 rows) | pool build report; class test |
| 5D | L11 is set on Thursday, "Kaufst du heute ein?" → "Ja, am Freitag" | **fixed** — "Kaufst du morgen ein?" | class test |
| 5E | "Never 'ein Lehrer'" / "is wrong" across notice, cards, pool, a correction item | **fixed** — "meist ohne Artikel … Aber: Das ist ein Lehrer"; the correction item no longer calls a correct sentence wrong | class test |
| Edit | Editorial review of all 12 Lektionen (3 reviewer passes: 22 MAJOR, 48 MINOR raised) | **partly** — adjudicated one by one; most applied, several applied in different words where a validator rule forbade the reviewer's text (e.g. L8 kept its dialogue and gained one answer line instead of two; L12's Leitpunkt was reverted and the place moved into the task), and two not made: L12 `das Zuhause → zu Hause` (needs a new `words` row) and digit/word folding for the L4 number dictation (a checker change) | validator, pool build, tests |
| 7 | "The app scores your pronunciation" vs a word-recognition function | **fixed** on every learner-facing surface found (course meta, level-test results, FAQ, About, speaking page, offers, comparisons, SEO routes) | `tests/a11-content-classes.test.mjs` bans the claim |
| Audio | Empty manifest; `speakGerman` reported success when an utterance was merely queued; no speed control | **playback fixed; recordings blocked** — see §4 | browser + `tests/course-audio.test.mjs` |
| 8a | All 18–25 Wortfeld cards on one screen | **fixed** — balanced groups of ≤ 6 with the dialogue line each word was met in | browser (L1: 5/5/5/5, focus on each group heading); `tests/wortfeld-pacing.test.mjs` |
| 8b | "Optional" group for words on no input surface (owner choice) | **not changed** — measured: 25 of the 57 such words are asked in the Lektion's own items/task/speaking, and every Wortfeld word can appear in the match exercise, checkpoints and review cards. Labelling any of them optional would be false. Making them truly optional means removing them from those draws — a content decision for the owner |
| 8c | "15 min" per Lektion vs ≈ 25–30 min of content | **fixed as an estimate** — "≈ 20–40 / 20–45 min (estimate)", modelled from each Lektion's step counts; the 15-minute design target is no longer shown as a duration. Real times need the study | `tests/course-meta.test.mjs` |
| 8d | First-use worked examples; L1–3 writing sentence starters | **open** — writing already shows Leitpunkte, a live word counter and form checklist, and the model text after submitting; starters would be new learner-facing German needing a DaF pass |
| Cov | Lektionen without a linked listening exercise (L2, 3, 5, 7, 11, 12) or reading text (L2, 6) silently showed fewer links | **fixed** — the recap says so | test pins the gap list |
| 9 | Hub 416 px wide at 360; progressbar unnamed; prohibited aria; unreachable scroll strip; two h1; disabled `<Link>`; collapsed progress bar; focus lost after Check; no headings on items; contrast; touch targets; consent banner over the feedback sheet | **fixed** | browser + Lighthouse (§5) |
| Perf | Draft A1.2 and legacy programs in shared chunks | **partly** — legacy programs out of the entry chunk; A1.2 draft still in the course chunk (§7) | build output |
| Tool | `validate-curriculum.mjs` silently did nothing on Windows | **fixed** | ran it |

## 2. Corrected learner-facing examples (before → after)

| Where | Before | After |
|---|---|---|
| L2 Phonetik | Lange und kurze Vokale: **bin – bist – sind** (`ich BIN`, `du BIST`, `Sie SIND`) | Langes und kurzes i: **Sie, wie [iː] – bin, sind [ɪ]** (`wie – Sie`, `bin – sind`, `Sie sind`) |
| L1 notice (EN) | … **V** is called **Vau**, **W** sounds like an English "v". | … **V** (**Vau**) and **W** (**We** [veː]). A letter's name is not its sound: W is called **We**, but in *Wasser* it sounds [v]. |
| L8 pool explanation | Official time: **Uhr + hour + minutes.** / Offizielle Zeit: Uhr + Stunde + Minuten. | Official (24-hour) time is **hour + Uhr + minutes**: 14:30 = vierzehn Uhr dreißig. / Offizielle Zeit: Stunde + Uhr + Minuten. |
| L8 notice | Offiziell (Bahn, Radio): **acht Uhr dreißig**. | Uhrzeit mit **um**: um acht Uhr. Aber: Es ist acht Uhr (ohne um). … Offiziell (Bahn, Radio) lautet die Uhrzeit Stunde + Uhr + Minuten, bis 24: **acht Uhr dreißig**, vierzehn Uhr dreißig. |
| L11 dialogue (Thursday) | Kaufst du **heute** ein? → Ja, ich kaufe am Freitag ein. | Kaufst du **morgen** ein? / Are you going shopping tomorrow? |
| L2 notice | Der Beruf ohne Artikel: Ich bin Lehrer. **Nicht: Ich bin ein Lehrer.** | Nach ich bin steht der Beruf **meist** ohne Artikel: Ich bin Lehrer. **Aber: Das ist ein Lehrer.** |
| L2 pool explanation | "Ein Lehrer" copies the English "a teacher" and **is wrong**. | After **ich bin** a job **usually** takes no article … With an adjective the article comes back: *Ich bin ein guter Lehrer.* |
| L10 dialogue | Der Zug nach Österreich hat Verspätung. Bitte umsteigen! | Durchsage: Der Zug hat Verspätung. Bitte an Gleis fünf umsteigen! |
| L8 dialogue | (Lena's "Kommst du heute pünktlich?" left unanswered) | + "Ich bin immer pünktlich. Mein Wecker ist gut." |
| Match feedback | "Almost — just a typo" (recorded correct) | "Done — after a second try · These pairs come back for review: Freut mich = Nice to meet you" (recorded not-first-try) |
| Recap | "Gold" from first-try practice alone | "Practice gold" + "What this lesson measured": Practice 3 of 11 · Listening 1 heard · 1 read as text (not counted as listening) · Speaking skipped — nothing recorded · Writing checked with the checklist only — not assessed |
| Lektion time | "about 15 min" | "about 20–40 min (estimate)" |

The full adjudicated list of the twelve-Lektion review is in the commit history of this branch (Phase B).

## 3. Scoring and mastery definitions (as of 2026-10-05)

| Term | Definition | Code |
|---|---|---|
| **Practice score** ("k of n right on the first try") | First response to each item of the **first pass** of practice, derived (match / word order / listen & select) and dictation; one response per (stage, item). Excluded: retries (`requeue`), revealed answers, warm-up, writing, speaking, and a dictation read as text. | `mastery.js` `practiceScore`, `isFirstPass` |
| **Practice gold** | Practice score ≥ 80 %. Labelled "Practice gold" / "Übungs-Gold". Says nothing about speaking or writing. A weaker repeat never takes it away (best run kept). | `mastery.js` `masteryStatus`, `betterRun` |
| **Lesson completed** | The recap was reached. Any score completes. | player recap effect |
| **Matching** | A wrong pair never commits; finishing after a wrong pair = `corrected` (complete, not first-try correct, tagged Wortschatz, the confused pairs recorded once and re-queued). | `check.js` `matchOutcome` |
| **Listening** | Dictations answered after hearing them; a line the learner read instead is "read, not heard" and is not listening evidence. | `skillStatus.js` |
| **Speaking** | skipped · self-confirmed (not measured) · recognised (speech recognition's share of understood words — a clarity signal, **not** a pronunciation grade). | `skillStatus.js` |
| **Writing** | assessed (AI, four exam criteria, %) · self-checked (checklist only, not assessed — never shown as a fail) · not reached. | `skillStatus.js` |
| **Checkpoint passed** | ≥ 60 % overall and no scored section < 40 %. Accuracy stored 0–1 from 2026-10-05 (earlier rows hold a percent). | `buildCheckpoint.js` |
| **Course certificate** | "Teilnahmebescheinigung": all Lektionen and checkpoints done **and** the course's own final test passed. Not a Goethe/telc result and not a CEFR-level certificate. | `CourseCertificatePage.jsx` |

Historical rows were **not** rewritten. When measured (Phase A), `lesson_attempts` held 5 rows (all
read-aloud) and `lesson_progress` 10 A1.1 rows, so the definition change touches almost no stored data.

## 4. Audio

- **Recordings: blocked.** The manifest is still the empty stub, so no clip exists. Generation needs
  `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` and `SUPABASE_SERVICE_ROLE_KEY` (absent here; checked by
  presence only) and the owner's run. Nothing was generated, uploaded or faked. The paste-ready run,
  with a 168-clip plan (120 dialogue lines that also serve dictation and checkpoint listening, 12 pretest
  models, 36 Phonetik items; 5,194 characters ≈ 8.3 US cents) and a listening checklist, is in
  `docs/owner-prompts.md` → "Run the A1.1 course audio".
- **Playback is now checked, not assumed.** `speakGermanChecked` / `playChecked` wait for the voice list,
  require a German voice, and report success only when the utterance has **started**; a recording resolves
  on `playing` and falls back to synthesis. Each failure is named on screen: "No German voice is available
  in this browser…" or "The audio did not start…", with "Try again", and in a dictation "Show the text
  instead" (recorded `listened:false`, excluded from the score, shown as "read as text"). A listen-and-select
  item offers "Skip this item" instead, never the answer. The dictation and listen-and-select players have a
  "Slower" control; the dialogue, pretest and Phonetik buttons do not (yet).
- **Observed in the real renderer:** with German voices present, playback started and no notice appeared;
  with the voice list stubbed to English-only and with an engine that never starts, the two notices
  appeared as above (L1 Phonetik and dictation). The badge says "Computer voice" everywhere, truthfully.
- **Integrity:** `tests/course-audio.test.mjs` fails if any future manifest entry's sha1 no longer matches
  the text it was rendered from, so a stale recording cannot be served.

## 5. Accessibility (WCAG 2.2 AA work, lab-verified only)

- Lighthouse accessibility: hub **90 → 100**, lesson intro 100 → 100 (3 mobile runs each). The hub's
  `aria-progressbar-name`, `aria-prohibited-attr` and `color-contrast` flags are gone; the intro's
  `label-content-name-mismatch` (back link) is gone. A new `listitem` flag introduced during this work (a
  `role` on the steps `<ol>`) was caught by the after-run and fixed.
- No horizontal scrolling at 320 (the 200 %-zoom reflow width), 360, 390, 768 or 1440 px on the hub or the
  Lektion intro (hub was 416 px wide at 360 and 446 at 390). Screenshots:
  `docs/evaluation/screenshots/a11-w3-{before,after}-*.png`, widths in `…-widths.json`.
- Keyboard and screen reader (checked in the browser's DOM/accessibility tree, not with NVDA/VoiceOver):
  focus moves to the heading of every new screen and Wortfeld group; the feedback sheet's verdict is read
  by a persistent live region and focus lands on Continue; match tiles are named by their word with
  pressed/matched state in words. **Found and fixed during the walk:** pressing Enter in an answer field
  checked the answer and then — because focus had moved to Continue — skipped the feedback; the audio
  failure was announced twice; the Wortfeld context line made a card's name disagree with its text.
- Not done: a real screen-reader session, a forced-colours/high-contrast pass, and a full keyboard-only
  run of all 12 Lektionen. These belong in the usability study's accessibility participant.

## 6. Saving and recovery

| Case | Result | Test |
|---|---|---|
| Network fails on one of the three writes | entry kept with only that step; retried on the recap button, `online`, the course home | `tests/sync-outbox.test.mjs` |
| A step succeeded but the response was lost | the stamped attempt batch is not written twice; run count unchanged | same |
| Writer throws | failure, kept, retried | same |
| Two flushes at once (recap + `online` + home) | one pass, no step twice | same |
| Another account on the same device | never sends someone else's run; entries expire after 30 days | same |
| Guest merge with any failed write | guest store kept; merged again next time | same (mutation-checked) |
| Weaker repeat | better run kept, on the device and in the account | same |
| Reload mid-Lektion | resumes on the same stage, same draw, same answers | browser + `tests/lesson-run-resume.test.mjs` |
| Return within 7 days | resumes; course home offers "pick up where you stopped" | unit test |
| Old/corrupt/future snapshot | starts fresh, never a broken screen | unit test |

Not verified in a browser: the signed-in flush against the real Supabase (no test account was used).

## 7. Performance (lab, local, Lighthouse 13 + Chrome 143, default mobile throttling, gzip like Netlify)

| Route (mobile, 3 runs) | Perf before → after | LCP before → after | TBT before → after | CLS before → after |
|---|---|---|---|---|
| `/course/a1.1` | 70 / 59 / 61 → **71 / 72 / 75** | 3.1 / 5.1 / 5.2 s → **3.2 / 3.2 / 3.1 s** | 750 / 710 / 580 → **670 / 640 / 570 ms** | 0 → **0** |
| `/course/a1.1/l/1` (intro) | 68 / 72 / 72 → 70 / 70 / 68 | 3.1 s → 3.1–3.2 s | 1000 / 740 / 730 → 860 / 890 / 970 ms | 0 → 0 |

- The hub improved; the lesson route did **not** (TBT median +150 ms, inside the baseline's own 730–1000 ms
  spread — no claim either way). Desktop stayed 95–99.
- **Entry chunk (every SPA page): 351,238 → 290,512 B raw, 105,286 → 90,919 B gzip** — `courseHomeFor` read
  the whole course registry (every legacy 28-day program) to ask whether a course exists; it now reads a
  four-item level list (`src/data/courses/levels.js`).
- Lesson-route chunks grew: `LessonPlayerPage` 22.9 → 25.5 KB gzip, the shared `strings` chunk 16.2 → 25.5 KB
  gzip (new chrome strings plus shared lesson modules Rollup now groups there).
- **CLS found and fixed:** under CPU throttling the course home shifted by 0.365 (the 2,585-px welcome panel
  appeared after first paint and pushed the path down). Measured with an injected layout-shift observer at
  4× CPU: HEAD 4/4 runs, now 0/4. Cause: a guest's progress is synchronous localStorage but was applied in
  an effect; it is now the first render's state.
- Not done (measured, recommended): the paused A1.2 draft curriculum is still in the course chunk
  (68.8 KB minified) because `quality.js` (imported by `buildLesson`) reads every curriculum at runtime;
  removing it means moving the pool's quality filter to build time.

## 8. Tests

Final run on this branch (Windows 11, Node 24, `npm test`, 2026-10-06): **1,639 tests — 1,623 pass,
15 fail, 1 skipped**, 755 s. HEAD of the branch before any code change (41579ad): 1,596 tests — 1,580 pass,
15 fail, 1 skipped. **The 15 failures are the same 15 in both runs** (compared by test name); none is new
and none was touched by this work:

- fonts: "both heads preload exactly the token fontPreloads…", "every @font-face file exists in public/fonts…";
- `llms.txt` stale ("committed llms files equal the generator output");
- static-site scans that walk `astro-site/src/pages` and fail on Windows with a doubled drive path
  (`C:\C:\…`): "every door to /login…", "the walk finds the pages…", "the known front-door CTAs…",
  "no colour literal in the static site…", "the shell identity <h1>…";
- "every table the app writes is classified…", "heartbeat: the hint states…", "link and copy only…",
  "no source file imports lucide-react as a namespace", "the dashboard renders the first-run card…",
  "the send script guards the live send…", "the supabase-js chains agree…".

They are expected to be checked by CI on Linux; that was not observable from here.

**+43 tests** in this work: new suites `lesson-scoring` (13), `a11-content-classes` (8), `sync-outbox` (11),
`wortfeld-pacing` (2); `course-audio` 22 → 28; one more each in `checkpoint`, `course-meta`,
`lesson-run-resume`. Per-file test counts were compared with HEAD for every modified test file: none
dropped. (During the work `course-audio.test.mjs` was briefly overwritten instead of extended; its 22
original guards were restored and its one now-stale pin was re-pointed from `playLine` to `playChecked`
with the same keys.) Every other changed assertion is a re-pin to the new contract, listed in the diff.

Other gates, all run on the final code:
- `npm run lint` — 0 errors, 0 warnings; `npm run check:duplicates` — all twins identical.
- `node scripts/build-lesson-pool.mjs a1.1` then `node scripts/validate-curriculum.mjs` — exit 0 for A1.1
  and A1.2, every ratchet equal to its measurement.
- CI sequence: `node --check` on every function, `npm run build`, offline Astro build from
  `grammar-content-cache.json`, merge, prerender, `check-built-html.mjs dist` — **138 pages, 0 failures,
  0 warnings**; crawl guard 133 sitemap URLs, 0 failures.
- Browser walk (built app, guest, 375 px): Lektion 1 end to end — pretest, dialogue, Wortfeld groups,
  notice, Phonetik (normal playback, no-German-voice, never-starting engine), 7 practice items (typo,
  wrong, Enter-to-check), match with a wrong pair, word order, listen-and-select, dictation read as text,
  speaking skipped, writing as a guest (checklist), retries with a reveal, recap; reload-resume; 320 px reflow.

The "full suite never finishes" scare during the work was not a hang: an isolated `curricula.test.mjs`
exits normally (82/82, ~17 min); the runs that looked stuck spanned a wall-clock gap consistent with
the machine sleeping.

## 8b. Independent review by Codex (OpenAI's official Claude Code plugin, 2026-10-07)

Run through `codex@openai-codex` 1.0.6 (Codex CLI 0.160.1): `/codex:review` and
`/codex:adversarial-review` against `origin/main`, and a read-only Codex task reviewing the twelve
Lektionen as a DaF teacher. Every finding was re-checked against the code before anything changed;
each fix has a regression test that fails on the old code (verified by running it there).

| Finding (Codex) | Verdict | What changed |
|---|---|---|
| P1/high: localStorage refusing the write lost the finished run, yet the recap said "Saved to your account" | **confirmed, fixed** | the outbox keeps the queue in memory when storage refuses it; the run is still sent |
| P2: a Lektion finished while another flush ran got that flush's "synced" without being sent | **confirmed, fixed** | a late caller gets one more pass after the running one |
| high: a stamped insert that committed but lost its response was inserted again unstamped (two runs) | **confirmed, fixed** | the stamp is re-checked before the unstamped fallback; an unknown state returns failure (retried with the same stamp) |
| medium: a failed read of the stored run let a weaker repeat overwrite Gold | **confirmed, fixed** | `completeLesson` returns false on a read error; the outbox retries |
| medium: a dictation answered after the audio failed still counted as heard | **confirmed, fixed** | listening credit needs a playback that started (`onPlayed`), in dictation and listen-and-select; the recap says "not heard — read as text or no sound" |
| P2: a passing attempt of another exam, opened under the A1.1 test URL, completed the course | **confirmed, fixed** | the attempt's `exam_key` must equal the test's key |
| L10 „umsteigen" translated "change to platform five" | **confirmed, fixed** | "change trains at platform five" |
| L9 „Habt ihr auch Tee?" translated "want" | **confirmed, fixed** | "Do you all have tea too?" |
| Rule cards still showed „Ich bin ein Lehrer." / „Ich bin eine Verkäuferin." as mistakes (class 5E, missed by the first pass) | **confirmed, fixed** | entries removed (the rule stays: "meist ohne Artikel"); the class test now covers the cards |
| Over-absolute card rules: das Kind "always" es; "-chen" nouns; "am for parts of the day" (am Nacht); Hunger/Durst/Zeit "ohne Artikel"; subject "direkt nach dem Verb"; the short-answer explanation | **confirmed, fixed** | each reworded to what is true at A1 ("meist", scoped examples); pinned by the class test |
| L2 "in a sentence, a nationality is a noun" (but „Meine Staatsangehörigkeit ist marokkanisch") | **confirmed, fixed** | "said of a person, a nationality is a noun" (notice, both languages, and the card) |
| pool EN: „du kommst" called the wrong verb form | **confirmed, fixed** | "answers about the other person, not about you"; migration row regenerated |
| 18:20 rejects „zehn vor halb sieben" | **adopted** | accepted (regional standard in the south and east); migration row regenerated |
| 7:45 / 8:15 reject „fünfzehn vor/nach" | **not adopted** | „Viertel vor/nach" is the standard form the Lektion teaches; „fünfzehn vor acht" is not idiomatic everyday German |
| L10 writing task `register: 'informell'` while the model text uses Sie | **real, left open — owner/DaF decision** | `tests/writing-course.test.mjs` encodes "a Kollegin on first-name terms → informell" while the curriculum comment says "die Kollegin wird gesiezt", and the grader marks greeting and sign-off against this field. Either the model switches to du (needs a du imperative L10 does not teach) or the register becomes formal (the grader then expects „Sehr geehrte … / Mit freundlichen Grüßen"). Not changed here. |

## 8c. Second Codex review, all aspects (2026-10-07)

Four Codex jobs through the official plugin: `/codex:review` and `/codex:adversarial-review` of the whole
branch (learner and buyer side), and two read-only tasks — the assessments (checkpoints, final test,
writing grader, read-aloud, certificate) and accessibility / mobile / test quality. Each finding was
checked against the code; "verified" below means re-read or reproduced here, not only by Codex.

**Defects in this chat's own work — fixed, each with a test that fails on the previous code**

| Finding | Fix |
|---|---|
| `safeSet` reported success when the storage object could not even be opened, so the outbox believed a run was stored that was not (high) | `safeSet`/`safeRemove` return false without storage — the shared root cause, not a caller patch |
| The 7-day run snapshot was shared by every account on a browser: learner B resumed — and submitted — learner A's answers (both reviews) | snapshots are keyed by user id; a guest's run can still be continued after signing in, never another account's |
| The unstamped insert fallback gave a run a second identity; a retry after reload wrote it again (two runs) (both reviews) | fallback removed: a refused or failed stamped insert is a visible, retried failure with the same stamp |
| A pass on the final test whose completion write failed left the certificate locked with no retry | the course home completes the final-test step from a saved passing attempt when it is the only open step |
| The recap could say "Saved to your account" from another run's success, and promised "kept on this device" while the run lived only in memory | success only when THIS run left the outbox; memory-only says "keep this page open" |
| Accessibility: mobile feedback sheet taller than the screen; flipped word card named without its English; typed answer field not tied to its question; focused heading left off-screen; Back to the first word group lost focus; header back link label-in-name; eyebrow 4.2:1 on wash grounds; the "How a Lektion works" steps scrolled sideways at 320 px | each fixed (scrolling sheet, `{word}: {en}` name, `aria-describedby`, focus with scroll, focus on every group change, visible text in the name, `siegel-deep`, wrapping grid) |

**Assessment problems that predate this chat — verified, NOT fixed here (the next work)**

| Severity | Finding | Verified how |
|---|---|---|
| BLOCKER | A final-test attempt resumed after the listening section loses the listening answer keys (registered only while that section is on screen), so listening drops out of the denominator and a reading-only score can pass | code read: `ModelltestRun.jsx` `listeningKeysRef` + `mergeListeningResult` returns the objective score when `listening.max` is 0 |
| BLOCKER | Self-confirming a read-aloud line after a measured mic attempt overwrites the result with "no mic", and Sprechen is scored only when every item has a mic result — a failed speaking section disappears from the checkpoint score | code read: `ReadAloudLine.jsx` `selfConfirm` → `{ pct: null, usedMic: false }`; `buildCheckpoint.js` `scored = inSection.every(itemIsScored …)` |
| MAJOR | Reading items are always two „richtig" and two „falsch": answering „Richtig" everywhere scores 50 % and clears the 40 % section floor | code read: `shuffle([true, true, false, false])` |
| MAJOR | Checkpoint dictation rejects „Chakiri" for the spelled line „C-H-A-K-I-R-I." (the full stop defeats spelling detection) and „042 3381" for a spoken phone number | reproduced with `checkAnswer` |
| MAJOR | (Codex, not yet re-verified here) the Schreiben section can pass on two sentence-building drills with a 0 % writing task; checkpoints reuse the Lektion's writing task after its model text was shown; retakes only reshuffle the revealed items; the writing rubric weights task fulfilment at 25 %; the final test uses untaught words (Aufzug, Treppe, gefährlich, anlassen); its instructions switch to du; word-order variants („Zusammen tanzen wir.") are rejected in two checkpoint items | see the Codex output in this branch's history |

What this means: the lesson engine is now honest about what it measured, but the checkpoints and the
final test are not yet dependable evidence of competence. The certificate already disclaims any
Goethe/telc result; it should not be promoted as proof of A1.1 until the two BLOCKERs and the reading
floor are fixed.

## 9. External blockers (owner actions)

1. **Audio:** run `docs/owner-prompts.md` → "Run the A1.1 course audio" (needs the Azure key/region and the
   Supabase service-role key on your machine), listen to the checklist, commit the manifest.
2. **DB text fixes:** apply `migrations/2026-10-05-a11-exercise-text-fixes.sql` (115 rows; public grammar
   pages and the next cache dump), then `node scripts/dump-grammar-cache.mjs grammar-content-cache.json`.
3. **Decide the "optional words":** keep all Wortfeld words as taught (today), or remove the 32 words that no
   exercise of their Lektion asks for from the match/checkpoint/review draws so they can honestly be optional.
4. **Run the usability study** in `EVIDENCE-PLAN-2026-10.md`; until then no effectiveness or duration claim.
5. **Analytics:** the new events (`lesson_resumed`, `lesson_stage_viewed`, `lesson_sync_failed`, `run_id`) fire
   only for consenting visitors; check them in PostHog after deploy.

## 10. What was deliberately not changed

- Historical `lesson_progress` / checkpoint rows (old definitions, documented above).
- The validator's `minutes === 15` design target and every ratchet (all still equal their measurements).
- `astro-site/src/lib/topicSeo.js` sound comparisons (see 5B-SEO).
- `llms.txt` / `llms-full.txt` (already stale at HEAD — a baseline test failure, regenerate with
  `node scripts/build-llms.mjs` in its own change).
- No production migration applied, nothing uploaded, no email or campaign sent, nothing published.
