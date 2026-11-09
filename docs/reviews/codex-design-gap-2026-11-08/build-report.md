# DeutschMeister design-gap build · 2026-11-08

Branch: `claude/admiring-cerf-wmolgb`. Authority: BUILD-BRIEF.md, with the founder's level-first decision overriding the review's exam-first recommendation. Expected commercial effect: fewer decisions between the free first course and the next available level; no conversion uplift is claimed without measured orders.

## Final verification status

All five implementation phases were completed in order, with each gate sequence green before the next phase began. All changes remain uncommitted because the sandbox mounts `.git` read-only.

| Phase | Lint / twins | Full test files | Vite + offline Astro | Merge / prerender / built HTML | Commit |
| --- | --- | --- | --- | --- | --- |
| 1 · Money pages | Pass | 295/295 | Pass | Pass · 148 pages, 0 failures, 0 warnings | Blocked: read-only `.git` |
| 2 · System | Pass | 295/295 | Pass | Pass · 148 pages, 0 failures, 0 warnings | Blocked: read-only `.git` |
| 3 · Product proof | Pass | 295/295 | Pass | Pass · 148 pages, 0 failures, 0 warnings | Blocked: read-only `.git` |
| 4 · Editorial/trust | Pass | 295/295 | Pass | Pass · 148 pages, 0 failures, 0 warnings | Blocked: read-only `.git` |
| 5 · Entry/account visuals | Pass | 295/295 | Pass | Pass · 148 pages, 0 failures, 0 warnings | Blocked: read-only `.git` |

Each verification began from a clean `dist/`. Final output is the merged site in `dist/`; telc sale gate is off, with zero Buy buttons and no Offer, and all 143 sitemap URLs pass the crawl guard. Token twins are byte-identical. Additional function syntax checks and `git diff --check` pass. Gate logs are `/tmp/p{1,2,3,4,5}-{lint,duplicates,tests,vite,astro,merge,prerender,html}.log` in this executor. The required commands were run with the sandbox runtime accommodations below; no assertions or gate commands were skipped.

## Phase 1 · Money pages

- `astro-site/src/pages/index.astro`: course/exam routes before the animation; keep the working exercise, deterministic correction and attributed account door.
- `pricing.astro`: compact opening purchase choice; selector goes directly to courses; replace the repeated ticket with a concise account of what remains after Pro.
- `courses/index.astro`: one course catalogue, available guided curricula first; unfinished guided courses grouped separately with honest practice-library availability.
- `courses/[level].astro`: real first-lesson goals beside a labelled preview; full syllabus in a keyboard-operable disclosure; preserve purchase block and all purchase attributes.
- `pruefung/[slug].astro`, `data/exams/index.js`: relevant practice action before exam definition, neutral surfaces, Sie register, remove unsupported failure claim.
- `components/LanguageNotice.astro`: compact utility instead of a raised interruption.
- `lib/track.js`: only consume once-events after consent and a successful handoff to analytics. No event queue or consent change.
- Regression tests: route-before-animation, one catalogue, disclosed syllabus, consent/once-event behavior. Existing copy assertions updated for the new pricing heading/spacing. `tests/sync-outbox.test.mjs` uses current timestamps in its concurrent-flush fixture instead of expired October dates; no outbox logic changed.

## Verification environment

- Astro telemetry must be disabled (`ASTRO_TELEMETRY_DISABLED=1`), because its default configuration directory is outside writable roots.
- Synchronous subprocess capture through pipes returns EPERM here. `/tmp/sandbox-stdio.cjs` captures the same child stdout/stderr through temporary regular files, preserving exit status and errors. It is a runtime-only adapter, not repository code or a skipped assertion. Gate runs use `NODE_OPTIONS="--use-openssl-ca --require=/tmp/sandbox-stdio.cjs"`.
- Browser attempt: Google Chrome via Playwright exits with SIGTRAP after `setsockopt: Operation not permitted`; a Python static server also fails with `socket: Operation not permitted`. Therefore screenshots, live viewport/overflow measurements, zoom, hydration and interactive browser checks cannot be certified in this sandbox. Supplied before/reference captures were inspected, including MedMeister below-fold home, course, pricing and simulation panels.

## Brand message: needs founder OK

Every changed headline/tagline is listed here for review, not represented as approved.

| Surface | Old → New |
| --- | --- |
| Home route choice (new) | — → “Build your German, level by level” / “Already working towards an exam?” |
| Pricing H1 | “Own a level, or rent the whole line.” → “Own a level, or choose Pro.” |
| Pricing supporting panel | Repeated ticket → “Your level, after Pro” |
| Courses hub H2 | “What each stop contains” → “Choose your next level” |
| Courses future group (new) | — → “Next on the line” |
| Course preview (new) | — → Actual first-lesson title, derived from curriculum |
| Course syllabus | “Lehrplan: 12 Lektionen” → “Lesson plan · [measured count] lessons” |
| Exam H1, all tracks | “[Exam]: Deine Vorbereitung mit DeutschMeister” → “[Exam]: Ihre Vorbereitung mit DeutschMeister” |
| Exam path | “Dein Weg zur Prüfung” → “Ihr Weg zur Prüfung” |
| Exam closing CTA heading | “Fang dort an, wo du stehst” → “Beginnen Sie dort, wo Sie stehen” |
| Exam placement step | “Wo stehst du wirklich?” → “Wo stehen Sie gerade?” |

## Remaining release observations

No prices, product keys, limits, sale gates, payment/auth/redirect/access logic, legal pages, functions, database policies, migrations, lesson player or exercise rules are changed. Founder approval of copy remains on the PR. A language/assessment reviewer and five target-learner observations cannot be substituted by automated checks.

## Phase 1 gates and commit boundary

All required gates passed, 295/295 test files, merged HTML 148 pages: zero failures/warnings, telc off sale and crawl guard clean. Intended commit: `Redesign money pages around the level-first journey`. `git add` failed: `.git/index.lock: Read-only file system`. No commit was created; the phase remains in the working tree, as the brief permits.

## Phase 2 · System consolidation

- Token twins: resting raise/ticket aliases flattened; legacy timing aliases now match 140/220/420; type-size roles exported to both Tailwind adapters. Existing per-level colour aliases moved out of Tailwind into tokens without changing their values or exercise logic.
- Both Tailwind configurations: token-derived type roles, only `rounded-pill` wired; defaults untouched. Legacy `clay` Button shape now maps to Tailwind's existing `rounded-xl`.
- `components/ui/{Button,Card,Chip,SectionHeading,Tilt}.jsx`: hairlines, explicit transitions, shared heading roles, fine-pointer/reduced-motion tilt gate.
- `styles/linie.css`, `styles/showtime.css`, `src/index.css`, `styles/global.css`: flat controls, tier timings, visible reference/sales content independent of observer completion; no deferred blank sections; calm grounds. Keep selective Archivo preloads.
- `FloatingIntroButton.jsx`: suppressed on FAQ/About; `Layout.astro`: flat return-bar action. Menus retain overlay elevation.
- Added regression guards for flat aliases, primitives, radius/type adapters, animation-independent visibility and intro suppression. No headline changes in this phase.

Phase 2 gates: lint, duplicate check, 295/295 test files, SPA/Astro builds, merge/prerender, 148-page HTML/crawl/sale checks all pass. The performance regression now enforces visible sales sections instead of requiring deferred rendering. Intended commit: `Consolidate flat surfaces, typography and motion across renderers`; blocked by the same read-only `.git` mount.

## Phase 3 · Product proof

- `data/productProof.js` derives the path and tasks from live A1.1/A1.2 curricula and `writingTasks.js`, invokes the actual `scoreWriting` and `alignTranscript` functions, and fails the build if a referenced writing task disappears.
- `components/proof/CourseProof.astro`: faithful static course path/task panel, draft → real checklist → model revision, and speaking word-recognition panel. Reused on home and live course offer pages before the syllabus. All content is labelled as demonstration; simulated transcript is explicit; undecidable checklist rows stay undecided.
- `components/proof/ExamTaskPreview.astro`: track-specific tasks from the real bank beside the opening exam action, also on the off-sale telc package page. No invented assessment or purchase button.
- Existing `RecordedCorrection.astro` stays checker-validated and clearly distinguished from AI writing assessment.
- No recorded/reviewed AI assessment payload exists in the supplied repository. Consequently the demonstration proves the actual deterministic form/word checks, with their limits stated, and shows authentic exam tasks. A full AI writing/conversation-feedback capture remains a release-review item requiring a real run and qualified language review; fabricating an AI response would violate the brief.

Additional brand messages needing founder OK: new demonstration headings “One situation. A clear next step.”, “Your learning path”, “Your task”, “Write, check, revise”, “Speaking, made visible word by word” and their literal German counterparts in `CourseProof.astro`; authentic curriculum/task titles are displayed from their sources, not rewritten. The prior Phase 1 course-goal preview is replaced by this larger demonstration.

Phase 3 gates: all required commands pass, 295/295 test files, 148 HTML pages without failures/warnings. Compact journey panel also reused on pricing. Intended commit: `Show reproducible course and exam product demonstrations`; blocked by read-only `.git`.

## Phase 4 · Editorial and trust

- Grammar index/level/topic templates: compact level links and a labelled text/level filter, live result count and empty state; literal/accent-insensitive matching, no regex evaluation or injected HTML. All topics remain accessible without JS. Useful level descriptors replace poetic colour names. Topic actions appear near the heading; keep the summary, canonical, examples, exercises and schemas.
- Guide index/template: exam jump links, desktop sticky contents rail, mobile native contents disclosure, introductory practice action, and exam definition separated from the short introduction. Keep source dates, source links, facts and structured data.
- FAQ: category jump links with derived counts, course-selection door and native disclosures (answers present without JS). Sanctioned founder line replaces the contradictory team claim in the shared answer bank.
- About: sanctioned anonymous `FOUNDER_LINE_EN` in the opening and product explanation; remove the named/Blue Card/team claims. Add measured product evidence and course entrances. Replace speculative C1/specialist roadmap with the founder's level-order roadmap.
- Prerender mirrors updated for FAQ/About; FAQ lastmod updated for the actual copy change. `public/llms*.txt` regenerated using the generator. Existing About claim regression now accepts the six retained substantive paragraphs after private biography removal, while preserving content/mirror and exam-support checks.
- Added search/empty-state, sanctioned-founder, native FAQ and guide-contents regression guards.

Additional brand messages needing founder OK:

| Old | New |
| --- | --- |
| Sunrise Warmth I / II | First words and sentences / Everyday exchanges |
| Forest Calm I / II | Connect your ideas / Talk about experience |
| Ocean Depth I / II | Independent everyday German / Explain and discuss |
| Twilight Elegance I / II | Develop an argument / Express nuance |
| Developed by doctors in Germany | Built from experience (badge); sanctioned founder sentence in the opening |
| Built by people who faced the same barrier | Built from experience |
| More levels, including C1 and beyond | More guided courses in level order |
| Live exam simulations for Goethe and telc | Exam preparation after each complete level |
| Specialist modules for nursing and business German / A learning community for practising with others | Clear availability information as each course is ready |

About's generic app-comparison introduction and personal biography are replaced by the sanctioned founder line and a factual explanation of course availability and inspectable demonstrations. The original H1, mission and factual-claims policy are retained. No new founder identity, operator/legal claim or customer endorsement is introduced. German editorial UI speaks Sie; quoted learner examples and existing long-form source content are preserved.

Phase 4 gates: all required checks pass, 295/295 test files, 148 built pages, zero failures/warnings. The introductory guide action remains the placement test, preserving the existing rule that the telc offer follows useful content and FAQ. Intended commit: `Unify editorial navigation and sanctioned founder trust content`; blocked by read-only `.git`.

## Phase 5 · Entry and account presentation

- `LevelTestLanding.jsx`, `PlacementPreview.jsx`, `data/placementPreview.js`: preserve Start/Resume under the heading; add a labelled actual-bank sample with native answer disclosure. Replace “Precise placement” with a qualified starting-point description and quiet the decorative step colours.
- `LevelTestResults.jsx`: suggested-level wording; existing available-course/Pro/free-course destinations move before the detailed scores; other practice links stay available inside a disclosure. All destination calculations and existing callbacks remain unchanged.
- `SignupPage.jsx`, `LoginPage.jsx`, `ui/AccountPreview.jsx`: flat forms and shared type roles; no entrance opacity gate; compact mobile login logo treatment; desktop learning-route panel distinguishes trial, course ownership and Pro and links to the real demonstration.
- `SubscriptionSuccessPage.jsx`: shared width, hairlines and compact states; retains purchased-product naming, included-Pro expiry and the existing start action.
- Prerendered placement landing has the same sample and qualified wording, with Start preceding the detail panels. Product proof has an anchor for account-entry links. The legacy celebration Button variant now uses siegel, so its existing callers do not introduce another action colour. Remaining touched exam navigation controls use explicit transform transitions.
- Before/after byte comparison: the functional component bodies preceding the returned page markup in Signup, Login, SubscriptionSuccess and LevelTestResults are identical to the Phase 5 starting point. Auth handlers, redirects, purchase intent, polling, entitlement checks and result/route calculations were not edited. The 10-file focused purchase/auth/placement/provenance preflight passes.

Additional brand messages needing founder OK:

| Old | New |
| --- | --- |
| Precise placement from A1.1 to B2.2 | A suggested starting point from A1.1 to B2.2 |
| Your German Level | Your suggested German level |
| Recommended Next Steps | Choose your next step |
| Separate practice recommendation cards | Other ways to practise (disclosure label; existing destinations retained) |
| Take our comprehensive placement test and get personalized recommendations for your learning journey (static introduction) | Get a suggested starting point for practice, with a breakdown of the skills you tried. |
| — (new account panel) | Your next step has a place. |
| — (new sample panel) | Sample question · from the real test bank |

## Before → after

| Journey | Before | After |
| --- | --- | --- |
| Home | Animation before useful route/offer choices | Level/exam choice first, real course evidence, retained interactive exercise and correction |
| Pricing | Long metaphor introduction and repeated ticket | Compact paid choice, inspectable journey, one ownership comparison and clear post-Pro access |
| Courses | Two catalogues; guided-course/material availability blurred | One catalogue of live guided courses, separate future-course/material group |
| Course offer | Feature lists before a large open syllabus | Real task, checklist and speaking example; syllabus available on request |
| Exam | Long definition before practice; unsupported failure statement | Relevant task/action first, sourced format reference below, honest sale state |
| System | Extrusions, competing timings, observer-dependent visibility | Flat hairlines, shared type roles, tier timings, always-readable content |
| Grammar | Eight decorative level cards and poetic names | Search, compact level navigation, useful descriptors and immediate practice shortcuts |
| Guides | Narrow single-column contents and duplicated definition opening | Desktop rail/mobile disclosure, short introduction and separate reference |
| FAQ/About | No category jumps; obstructing intro; contradictory team biography | Native category navigation, no floating prompt, sanctioned founder and measured product evidence |
| Assessment/account | Decorative panels and a long results-first list | Real sample, qualified result, next actions first, matching account and purchase surfaces |

## Complete additional demonstration heading inventory

These are new UI headings (`— → …`), included for founder review alongside the tables above; existing real lesson/exam task titles are read from their canonical data.

- English: “Demonstration · real course content”, “One situation. A clear next step.”, “Your learning path”, “Your task”, “Write, check, revise”, “Draft without a sign-off”, “Course form check”, “Revised model answer”, “Speaking, made visible word by word”, “Read aloud”, “Simulated transcript”, “Then speak freely”.
- German: “Demonstration · echte Kursinhalte”, “So wird aus einer Situation Ihr nächster Schritt.”, “Ihr Lernweg”, “Ihre Aufgabe”, “Schreiben, prüfen, überarbeiten”, “Entwurf ohne Gruß”, “Formale Selbstkontrolle”, “Überarbeitete Musterantwort”, “Sprechen: Wort für Wort sichtbar”, “Zum Nachsprechen”, “Simuliertes Transkript”, “Danach frei sprechen”.
- New exam-preview eyebrow: “Beispiel · eigene Übungsaufgabe”. New curriculum group: “Next on the line”. Existing About “Who is behind Deutschmeister”, “How we handle factual claims”, mission, FAQ categories, guide/topic headings and all commerce hero messages other than the listed pricing H1 are retained.

## Release limitations and remaining review

- No phase commit can be created in this executor: `.git` is read-only. Each phase was verified separately and a commit was attempted at its boundary. Changes remain on the requested branch; no push, merge, PR or deployment was attempted.
- No viewport screenshots or live overflow, zoom, hydration/focus and actual-pointer checks could run because sockets and Chromium startup are denied. Run the existing browser walkthrough against the final merged `dist/` at 390×844 and 1440×900 (also 360px and 200% zoom) before release. Automated HTML tests establish structure, crawlability and source rules, not visual parity.
- Demonstrations are faithful static presentations of actual content and computed local checks. No live microphone/AI request or captured AI assessment is claimed. Review the language and assessment limits; obtain a real, approved AI response before adding an AI-results capture. Existing editorial telc writing example remains explicitly labelled as editorial, not captured AI output.
- Founder review is still required for the message changes listed above. The sanctioned anonymous founder line is used as supplied; removed personal/operator assertions are not replaced with guesses.
- Existing long-form guide facts, dates and learner dialogue examples are preserved. German UI and new copy use Sie; a full language edit of legacy guide prose (which still includes informal address) remains separate from this presentation build.
- Five target-learner observations, commercial progression/verified-order analysis and owner-controlled payment/replay/refund release checks require external participants or production authority. No uplift, conversion or outcome was invented. Nothing was opened for sale.

Phase 5 final gates: all required checks pass, 295/295 test files and 148-page HTML verification. Intended commit: `Carry the level journey through placement and account presentation`. The final commit attempt failed at `.git/index.lock` with `Read-only file system`, as did the prior four attempts. Final branch check confirms `claude/admiring-cerf-wmolgb`.
