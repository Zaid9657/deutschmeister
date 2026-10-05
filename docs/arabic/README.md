# The Arabic edition — pilot report

Branch `claude/dreamy-cerf-hzbi92`, 2026-10-05. **Status: built and machine-verified; NOT
reviewed by a native Arabic editor, NOT tested with learners, NOT deployed.** Nothing in this
report says the Arabic is correct, effective or production-ready — §4 and §10 say what has to
happen first.

## 1. What shipped

One product in three interface languages (`en | de | ar`) — same templates, curriculum, accounts
and progress. For an Arabic-speaking A0 beginner with little English:

- **Public pages (Astro, `lang="ar" dir="rtl"`):** `/ar/`, `/ar/courses/`, `/ar/courses/a1-1/`,
  `/ar/pricing/`, `/ar/help/`. Every start button opens `/course/a1.1?lang=ar`.
- **The app in Arabic** on the A1.1 course home, all twelve Lektionen' chrome, the review and the
  checkpoints, and the five account screens (login, signup, reset, update password, verify email).
- **Arabic learning support for A1.1 Lektionen 1–3** — instructions, word meanings, dialogue
  translations, grammar cards, hints, explanations, feedback, writing tasks: 363 reachable
  entries, all present, none stale, **all `draft`** (`coverage-a11.md`).
- Lektionen 4–12 keep Arabic chrome and say at their start, in Arabic, that the explanations are
  English for now; every English text there carries `lang="en"` and a visible „(بالإنجليزية)“.
- German stays German everywhere: dialogue, questions, answers, grading.

## 2. Decisions taken (all reversible)

| Decision | Why |
|---|---|
| Arabic A1.1 page at `/ar/courses/a1-1/` (+ 301 from `/ar/courses/a1.1`) | Mirrors the English slug, so the hreflang pair is clean. |
| One locale store replaces the two (`dm_lang` + `dm_lesson_lang`) | Two stores could disagree; the old keys are still written for old bundles. Side effect: „Deutsch“ in a lesson now also switches the app chrome to German. |
| Latin digits in Arabic (`ar-u-nu-latn`) | The learner is learning German numbers. |
| IBM Plex Sans Arabic 400 + 600, self-hosted, Arabic-only `unicode-range` (OFL, `docs/licenses/`) | Zero bytes on pages without Arabic; preloaded only on Arabic pages. |
| Writing/speaking grading stays German | No Arabic capability exists in those graders; the Arabic labels say so. `explain-answer` got Arabic (it already localised). |
| `/ar/pricing/` keeps buy buttons (variant-guarded, as everywhere) | Each paid course is labelled „شرح بالإنجليزية فقط“; the page says the checkout has no Arabic. |

## 3. Locale precedence and fallback

`src/lib/locale.js`, unit-tested in `tests/locale.test.mjs`:
1. a valid `?lang=` (stored as an explicit choice) →
2. the saved explicit choice (`dm_locale` `{lang, at, source}`; legacy keys migrate) →
3. the account's `user_metadata.ui_lang` — newer `at` wins, so an old account value never
   overrides a newer device choice →
4. English. An Arabic browser is *offered* Arabic (dismissible), never switched; never by IP.

The choice reaches the account at sign-up (`signUp` metadata) and on every explicit switch.
Arabic renders only on the routes in `AR_READY_PATTERN`; elsewhere the document is English with an
Arabic notice. `index.html` sets `lang/dir` and preloads the Arabic face before first paint, and
`main.jsx` loads the Arabic tables before the first render — the browser check confirms the first
rendered course screen is already Arabic and RTL (no English flash).

## 4. Translation layers, status and the review gate

| Layer | Where | Status |
|---|---|---|
| Lesson chrome | `src/lib/lesson/strings.js` (en/de) + `src/locales/ar/lesson.js` | 353 keys each, 0 missing, placeholders match |
| App chrome + account screens | `src/locales/ar/app.js` (i18next) | every key the translated screens use exists (test) |
| Learning support | `src/data/curricula/a11.ar.js` (+ Astro twin), keyed by stable ids, FNV-1a hash of the source | pilot 363/363 draft, 0 stale · Checkpoint 1: 38 missing · Lektionen 4–12: 982 missing (by design) |
| Public copy | `astro-site/src/data/i18n/ar.js` + the sidecar | draft |

Every Arabic string is machine-authored Modern Standard Arabic following
`translation-guide.md`. **Reviewed: 0.** An entry may only become `reviewed` with a named
reviewer and a date (the test refuses otherwise). The gate before any wider promotion is a native
Arabic editor (ideally DaF-trained) — owner prompt in `docs/owner-prompts.md`.

## 5. Public pages and SEO

- Reciprocal hreflang (`en`, `ar`, `x-default` = English) only for real twins: `/`↔`/ar/`,
  `/courses/`↔`/ar/courses/`, `/courses/a1-1/`↔`/ar/courses/a1-1/`, `/pricing/`↔`/ar/pricing/`.
  `/ar/help/` is self-canonical and names no twin.
- `og:locale` `ar_AR`; sitemap carries the five `/ar/` URLs; `check-built-html.mjs` now requires
  the five pages and checks `dir="rtl"` on Arabic documents and hreflang reciprocity on the build.
- The language switch („العربية · English · Deutsch“, no flags, 44 px targets) appears only on
  paired pages, writes the same store the app reads, and „Deutsch“ opens the English page with a
  one-line German notice (there is no German public twin).
- Cookie banner in Arabic (and German) by `<html lang>`.

## 6. Defects fixed on the way (each blocked or degraded the Arabic journey; all languages benefit)

G1 requeue pulled items of later Lektionen into a Lektion's retry (now bounded by `minLektion`) ·
G2 match tiles were named "German word 3"/"English word 3" (gave the answer away; now the visible
word, announced in words) · G2b derived match pairs had no `wordId`, so the meaning column was
English in every language · G3 the recap promised review "tomorrow" while cards are due now ·
G4 requeue variants and transcript-supported answers counted as first-try evidence · G5 a weaker
repeat could downgrade gold to complete · G6 article printed twice on word cards · G7 the static
pages relabelled every document `lang="en"` for English users (would have hit `/ar/`) · a save
failure lost the run (now kept locally, and the recap says so) · the language switch spent a
second AI explanation call · `lesson_completed` fired on every recap mount (now once per run) ·
course home a11y: nameless progress bar, `aria-label` on bare spans, white-on-teal text below
4.5:1, an unfocusable scrolling list · reset/update-password inputs had no labels · the navbar's
switch had pulled the lesson string tables into the main bundle (removed before release; see §8).

Documented, not fixed (outside the Arabic scope): `countCompletedRuns` counts explanation and
read-aloud rows; the guest store holds one level; guest checkpoint passes are not saved (the help
page says so); the English hub footer says "saves on every step" more strongly than true.

## 7. Test changes — moved, not weakened

| Test | Change | Why |
|---|---|---|
| `checkpoint`, `course-front-door`, `course-player` du-register scans | strip the attribute name `dir=` before scanning | `dir="ltr"` on German runs is the HTML attribute, not the pronoun; a German „dir“ is never followed by `=` |
| `course-front-door` free finish line, `course-home` endowed/footer/intro table | assert the same English/German values in `STRINGS` and the key usage | the copy moved from inline literals into the string tables |
| `course-home` lesson_completed | requires the run-id dedupe | the event now fires once per run |
| `course-home` WordsLearnedCards, `course-player` toggle | new prop/class pinned exactly | |
| `attribution` signup metadata | the attribution record is still spread whole into `options.data` | `ui_lang` joins the same object |
| `language-strategy` | `LESSON_LANGS` = en, de, ar | third locale |
| `site-audit-regressions` | the globe button became the three-pill switch; pins its group name and 44 × 44 targets | |
| `onsite-attribution` | three trial buttons via `signupHref` (Arabic pages → `/signup?lang=ar`, others unchanged) | |
| `linie-design`, `web-performance` | `<html dir>`; Arabic preload swap pinned exactly | |
| `claims` PRICE_FREE_SURFACES, `astro-course-front-door` | **extended** to the five Arabic pages and the copy module | |
| `course-meta` | unchanged — the source sentence was shortened to ≤ 10 words instead | |

New suites: `locale` (15), `arabic-coverage` (11), `arabic-journey` (15), `arabic-public` (11).

## 8. Verification results

{{VERIFICATION}}

Screenshots: `screenshots/before/` (12, English, taken before any change) and `screenshots/after/`
(from `node scripts/evaluate-arabic.mjs`; the full machine report is `walkthrough.json`).

## 9. Not verifiable here — externally blocked or needs people

- Live sign-in, sign-up, password reset, email confirmation, account save and the guest→account
  merge (Supabase is unreachable from this environment; the Arabic screens, error mapping and
  merge logic are tested, the round trip is not).
- The `ui_lang` account round trip on a real account.
- AI writing/speaking grading and the Arabic explain prompt (functions answered 503 in the browser
  run; the prompt and the language whitelist are unit-checked).
- Real audio output, real-device screen readers (VoiceOver, TalkBack, NVDA), real phones.
- Lemon Squeezy checkout (no Arabic exists; stated on the page).
- Whether any of it helps a learner: needs the usability study (`usability-study.md`) and the
  measurement plan (`measurement.md`).

## 10. Owner actions and rollout

1. Native Arabic (+ DaF) review of the draft text — prompt in `docs/owner-prompts.md`.
2. Supabase confirm/reset templates in Arabic via `{{ if eq .Data.ui_lang "ar" }}` — same file.
3. Run the 5–8 person usability study before translating Lektionen 4–12.
4. Soft launch: share `https://deutsch-meister.de/ar/?ref=<channel>` in one or two Arabic
   channels; read the numbers in `measurement.md` after ≥ 30 Arabic starters.

## 11. Extending it

- **Lektionen 4–12:** add the Lektion id to `SUPPORT_SCOPE['ar:a1.1']` (`src/lib/lesson/support.js`),
  run `node scripts/i18n-coverage.mjs` — the report lists every missing key — translate into the
  sidecar (+ copy to the Astro twin), and the pilot test then gates the new scope too. Add the
  Lektion's route nothing: the routes are already Arabic-ready.
- **Another level:** a new sidecar `<level>.ar.js`, its `SUPPORT_SCOPE` entry, a coverage run.
- **Another language:** add it to `SUPPORTED_LOCALES`, `LOCALE_NAMES` and the first-paint whitelist
  in `index.html` (a test keeps them equal), a `src/locales/<lang>/` folder registered in
  `src/locales/index.js`, and its own route pattern.
