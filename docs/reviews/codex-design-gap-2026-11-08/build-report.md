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

## Pass 2

Authority: `BUILD-BRIEF-2.md`, implemented on 2026-11-08. The founder's permission to rewrite the public messages and first screens supersedes the earlier report's “needs founder OK” and October visual-freeze notes. The level-first journey remains the lead. No conversion uplift or visual-parity score is claimed. No git commit, staging, push, merge or deployment was attempted.

### What changed, per page

| Page / surface | Pass 2 implementation |
| --- | --- |
| Home `/` | Replaced the transit-led first screen with a large Archivo learner message on paper and a substantial, labelled A1.1 course window. The window derives the lesson title, sequence, prompt, model answer and can-do goal from the actual curriculum. It distinguishes an example from saved progress. Retained the anonymous free-course action, authenticated continuation and attributed free-account door. Course/exam choices form a compact route strip. The working `FirstStop` exercise now has its own contrasting turquoise section after that strip; retained its checker and the recorded correction. The longer home course demonstration focuses on writing; the course offers retain the full demonstrations. Rewrote the closing invitation. |
| Pricing `/pricing/` | New masthead and paper-ground opening with more distinct paid/free offer cards. The first paid card retains its derived price, one-time basis and next action; Pro retains its derived recurring price. Added a real A1.2 window beside a short explanation of course sequence versus practice-library access. Existing comparison, subscription controls, checkout attributes, allowances and availability gates remain intact. |
| Course catalogue `/courses/` | New split hero, learner-led headline and real A1.2 example. Wider single catalogue with the existing source-derived course counts, prices and doors. Kept available guided curricula distinct from the separate future-course/practice-library group. |
| All eight `/courses/<level>/` pages | Wider paper-ground hero, larger level title and a clear turquoise purchase/availability panel. Moved the eight-stop navigation below the opening offer instead of ahead of it. Live curricula receive a real course window inside the hero. Kept the price and purchase action together, existing sale states, full labelled proof and disclosed syllabus. Unfinished levels receive no fabricated lesson preview. |
| Grammar `/grammar/` | New editorial heading, left-aligned opening and turquoise reference ground. Existing labelled search, level filter, result/empty states and topic list remain immediately accessible. |
| Grammar level and topic pages | Applied the same larger editorial header and colour ground through both templates. Preserved topic/level names, summaries, canonical URLs, rules, examples, schema and practice actions. |
| Exam index `/pruefung/` | New formal-German headline and supporting copy; wider editorial opening and exam selection. Replaced remaining informal reader address in this template with Sie. |
| All exam-track pages | Two-column desktop opening: relevant action and explanation beside a real task from the writing bank; one-column mobile reading order. Retained task/source labels and the independent format/reference section. Corrected the inherited “Sie … antwortest” agreement in DTZ copy. |
| telc package page | Matching wider, two-column offer/task opening. Preserved the honest unavailable message, trial/course distinction and off-sale gate. No package price, Buy action or Offer schema was introduced while off sale. |
| Guide index `/leitfaden/` | New editorial headline and wider hero; existing exam jump navigation; two-column desktop guide catalogue. |
| Every guide article | Larger editorial opening, with a compact linked contents preview beside the title on desktop; existing full desktop contents rail and native mobile contents disclosure remain. The contents-preview labels follow each guide's language, including English guides. Kept article facts, figures, source URLs and `factsCheckedOn` dates. Converted reader-facing address, possessives and invitations in the six German exam-format guides to Sie. Preserved informal model dialogue, including “Kannst du bitte das Fenster schließen?”. Replaced five inherited contradictory team-of-doctors paragraphs with the sanctioned `FOUNDER_LINE_DE` plus a neutral tool introduction. |
| Comparison index and all comparison pages | Matching editorial hero treatment. Converted the index invitation and canonical comparison reader copy to Sie; synchronised its Astro twin. Preserved vendor facts, price records and existing “Stand” dates without representing them as newly verified. |
| FAQ `/faq/` | New editorial header and headline, wider layout, sticky desktop category rail beside native disclosure answers; stacked navigation on mobile. Category counts still derive from the answer bank. Updated the static prerender to the same headline, hierarchy and native disclosures, with answers present without JS. |
| About `/ueber-uns/` | New optimistic headline; split opening with the sanctioned founder sentence and a real A1.1 task example. Retained measured product evidence and substantive responsibility/mission text. Updated the prerender with the same example, sourced from the same curriculum and escaped before insertion. |
| Level test `/level-test/` | New headline and a two-column desktop opening with the existing real-bank sample beside Start/Resume; stacked mobile order keeps the action first. Updated the prerender. Kept the assessment, time disclosure, qualified level recommendation, result destinations and resume behavior. |
| Signup and login | Larger editorial headings and a responsive form/example composition. Rebuilt the shared account side panel with an actual A1.1 curriculum example and a clearer return-to-learning message; it also appears after the form on mobile. Kept signup trial wording and purchase context, login wording, all form handlers, confirmation/resend behavior and redirects. |
| App entry chrome | Shared `SectionHeading` page role uses the new editorial type token, carried into the static prerender vocabulary. Dashboard greeting gains the same turquoise ground; its personalised copy, recommendations and progress logic remain. Other entry pages using this heading primitive inherit the typography. |
| Shared system | Added `masthead` and `editorial` roles to the canonical token module and its byte-identical Astro twin. Added a token-based public composition stylesheet for hero grids, product windows, route strips, reference grounds and proof rhythm. Retained the turquoise palette, hairlines, focus treatments and no resting shadows. No new motion or JS visibility dependency. Commerce pages preload the token-defined fonts actually used by their opening previews; unfinished course pages retain the smaller font set. |

The principal new files are `astro-site/src/components/proof/ProductWindow.astro`, `astro-site/src/styles/public-design.css` and `src/components/ui/CourseMoment.jsx`. The last component is presentation only and uses the small `src/data/courseMoment.js` snapshot, checked field-for-field against the actual curriculum by a regression test. This keeps the full lesson banks out of account entry bundles. It has no session, checkout or entitlement dependencies. Existing station art remains behind its completeness gate: the new visual emphasis comes from inspectable product content, not an unfinished scene set.

### Every headline / tagline change

Unchanged article, lesson, topic and level titles continue to come from their existing sources. “New” below means an added heading or tagline, not a replacement of a factual title.

| Surface | Old → New |
| --- | --- |
| Home hero eyebrow | “Deutsch, in Bewegung · A1.1 → B2.2” → “Learn it. Use it. Make it yours.” |
| Home H1 | “From Guten Tag to B2, one stop at a time.” → “Your German. In real life.” |
| Home exercise eyebrow | New → “Less wondering. More trying.” |
| Home exercise section H2 | New → “Your first German moment starts here.” |
| Home closing H2 | “Your next stop is one click away.” → “Make a little room for a lot more German.” |
| Pricing H1 | “Own a level, or choose Pro.” → “Your German. Your way to learn.” |
| Pricing course-card heading | “Buy the stop you’re at” → “One level. Yours to keep.” |
| Pricing Pro-card heading | “Every level, monthly” → “Your practice, on Pro” |
| Pricing example eyebrow | New → “Look inside before you choose” |
| Pricing example H2 | New → “A plan for the moments that matter.” |
| Course catalogue H1 | “One level. One payment. Yours for good.” → “Small steps. Real-life German.” |
| Grammar index H1 | “German Grammar” → “German grammar. Now it makes sense.” |
| Exam index H1 | “Auf welche Prüfung bereitest du dich vor?” → “Ihre Prüfung. Ihr nächster Schritt.” |
| Guide index H1 | “Prüfungsleitfäden” → “Erst verstehen. Dann gezielt vorbereiten.” |
| Guide contents-preview tagline | New → “Understand. Plan. Practise.” / “Verstehen. Planen. Üben.”, according to guide language |
| DTZ guide closing heading | “Finde heraus, wo du stehst” → “Finden Sie heraus, wo Sie stehen” |
| Goethe B1 guide closing heading | “Finde heraus, welches Modul dich aufhält” → “Finden Sie heraus, welches Modul Sie aufhält” |
| Goethe A2 guide closing heading | “Finde heraus, wo du vor dem Goethe-Zertifikat A2 stehst” → “Finden Sie heraus, wo Sie vor dem Goethe-Zertifikat A2 stehen” |
| Start Deutsch 1 guide closing heading | “Finde heraus, wo du vor Start Deutsch 1 stehst” → “Finden Sie heraus, wo Sie vor Start Deutsch 1 stehen” |
| telc B1 guide plan heading | “Dein 8-Wochen-Lernplan für telc B1” → “Ihr 8-Wochen-Lernplan für telc B1” |
| telc B1 guide product heading | “Wie Deutschmeister dich auf telc B1 vorbereitet” → “Wie Deutschmeister Sie auf telc B1 vorbereitet” |
| Comparison index tagline | “Wir vergleichen uns fair mit den größten Namen. Du entscheidest.” → “Wir vergleichen uns fair mit den größten Namen. Sie entscheiden.” |
| Babbel comparison H1 | “Babbel lehrt dich Deutsch. Bei Deutschmeister sprichst du es frei.” → “Babbel lehrt Sie Deutsch. Bei Deutschmeister sprechen Sie es frei.” |
| Babbel comparison closing heading | “Teste Deutschmeister kostenlos — und entscheide selbst.” → “Testen Sie Deutschmeister kostenlos — und entscheiden Sie selbst.” |
| Duolingo comparison closing heading | “Vom Spielen zum Sprechen — teste Deutschmeister kostenlos.” → “Vom Spielen zum Sprechen — testen Sie Deutschmeister kostenlos.” |
| Lingoda comparison H1 | “Lingoda gibt dir Lehrer. Deutschmeister gibt dir Freiheit.” → “Lingoda gibt Ihnen Lehrer. Deutschmeister gibt Ihnen Freiheit.” |
| Lingoda comparison feature heading | “Lernen, wann DU willst — nicht wann der Kalender es sagt” → “Lernen, wann Sie wollen — nicht wann der Kalender es sagt” |
| FAQ H1 | “Frequently asked questions” → “A clear answer. A confident next step.”; the old heading remains as the explanatory eyebrow |
| About eyebrow | New → “Our reason to build” |
| About H1 | “Learning German should not feel like a nightmare.” → “More German. More possibility.” |
| Level-test H1 | “Discover Your German Level” → “Find your next German step.” |
| Shared account example H2 | “Your next step has a place.” → “A little German. Every time you return.” |
| Product-window footer tagline | New → “Learn in a situation. Then use it.” |

Full old → new data-copy changes, including longer hero leads, comparison supporting copy, guide prose/CTA bodies and preview labels, are recorded in [pass-2-copy-changes.md](pass-2-copy-changes.md). It contains 174 changed data-copy groups against the Pass 1 baseline. New template supporting copy consists of the home exercise invitation, pricing course-versus-Pro explanation, and the labelled preview instructions described above; no result, learner count, testimonial or AI assessment was fabricated.

### Tests deliberately updated

- `tests/site-audit-regressions.test.mjs`: accept the founder-authorised pricing headline. Added explicit assertions that the opening still names the one-payment course and Pro choices; retained all existing payment-basis and correct-Pro-CTA assertions.
- `tests/selling-pages.test.mjs`: update the level-test headline assertion. Retained the guard that Start/Resume appear immediately after the heading and before the fact cards and test structure.
- `tests/language-strategy.test.mjs`: update the English grammar headline assertion. Added a reader-register regression over all six German exam-format guides and the canonical comparison copy; also require the authentic informal dialogue example to survive and reject the contradictory plural-founder claim. Existing document-language and navigation checks remain.
- `tests/design-gap-build.test.mjs`: added a data-integrity assertion comparing every lightweight account-example field with the canonical first lesson, and a guard against importing full course banks into that component.
- `tests/web-performance.test.mjs`: replace the obsolete filter-only preload assumption with an explicit allow-list for the three opening product-preview compositions. They must render `ProductWindow` and preload only the complete token lists. All other explicit preload declarations retain the filtered-token guard; the course template additionally must condition Fraunces on a real syllabus. Kept local-font, font-file, first-paint visibility, default-head and cache assertions.

No test was skipped. Money, claims, accessibility, head-tag, route, availability, payment-intent and entitlement guards were not weakened.

### Gate results

| Gate | Final result |
| --- | --- |
| `npm run lint` | Pass · zero ESLint warnings |
| `node scripts/check-duplicates.mjs` | Pass · all registered twins identical |
| `npm test` | Pass · 295/295 test files, 0 failures, 0 skipped |
| Clean SPA build + rename | Pass |
| Offline Astro build | Pass · 140 static pages |
| Merge + prerender | Pass |
| `node scripts/check-built-html.mjs dist` | Pass · 148 pages, 0 failures, 0 warnings; 143 sitemap URLs pass; telc off sale, 0 Buy buttons, Offer absent |
| Function syntax checks | Pass |
| `git diff --check` | Pass |

The complete required sequence ran from a clean `dist/`, including `mv dist/index.html dist/app.html` before the offline Astro build, then merge and a single prerender. Runtime accommodations are the same as Pass 1: `ASTRO_TELEMETRY_DISABLED=1` and `NODE_OPTIONS="--use-openssl-ca --require=/tmp/sandbox-stdio.cjs"`; Astro used `GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json"`. These change runtime capture/configuration only, not test assertions. Logs: `/tmp/pass2-{lint,duplicates,tests,vite,astro,merge,prerender,html,function-syntax,whitespace}.log`.

Additional verification: rebuilt the A1.1 lesson pool, then ran the full curriculum validator successfully; no lesson-pool source change resulted. Regenerated `public/llms*.txt` through its generator. Verified that numeric exam/vendor records in the seven edited data sources remain unchanged, excluding only the five replaced founder paragraphs. Token and comparison twins are identical. Final output is the merged site in `dist/`. A further audit of 21 representative merged pages confirmed one H1 per page, preview → route choice → working exercise order on home, no invented preview on unavailable B1/B2 courses, native FAQ disclosures and the static About example (`/tmp/pass2-built-audit.json`). The built shared account-preview chunk is approximately 3 KB and has no direct curriculum-bank dependency.

### What I would do next

1. Claude's required viewport review of the final merged build at 390×844 and 1440×900, plus 360px and 200% zoom. Prioritise hero/task balance, opening pricing CTA visibility, course price/action grouping, account form height, navigation, hydration and keyboard focus. Review the actual scroller at successive positions.
2. Review the German copy and demonstrations with a qualified language/assessment reviewer, then observe target learners choosing between a free course, a bought level and Pro. No commercial effect is established by the code gates.
3. Measure the existing consent-gated offer-to-checkout journey and verified orders after release. Add an AI-feedback capture only after a real approved run exists; current examples accurately remain curriculum/model content and deterministic checks.

Browser limitation was confirmed again, not assumed: the installed Chrome launched through Puppeteer failed before opening a page with `setsockopt: Operation not permitted` (`/tmp/pass2-browser.log`). Therefore no new viewport screenshot, live overflow, zoom, pointer or hydration result is claimed. All 286 supplied MedMeister desktop/mobile steps were inspected in contact sheets for the reference review. Prices, product keys, claim limits, sale gates, checkout/payment/auth/redirect/entitlement logic, functions, migrations, legal pages and email templates were not changed.

## Pass 3: complete redesign

### Result and authority

Implemented `BUILD-BRIEF-3.md` as a replacement public visual system, **Open House**, with new page compositions, typography, palette, artwork, logo, chrome, controls and product frames. No git commit or staging command was attempted. The expected effect is to make the learning product and the distinction between free study, a bought course and Pro easier to inspect; no conversion or learning-outcome uplift is claimed.

Reviewed the supplied before/Pass 2 comparison and all 286 MedMeister desktop/mobile steps in six contact sheets. Used the supplied competitor study for clear free-course entry, consistent actions, explicit payment terms and inspectable exercises. The design borrows those principles, with original code, copy and art for German learners.

### New design system and reasoning

| Role | New system | Reason |
| --- | --- | --- |
| Ground | Warm cream `paper`, `#FFF9F0`; recessed oat `#F3EBDD`; white product surfaces | A warm learning environment, with distinct reading and product stages. Replaces the mint wash. |
| Ink / footer | Deep plum `#2D2034`; muted plum `#615165` | Strong editorial contrast and a substantial closing scene. Muted text still meets the retained 7:1 white-card guard. |
| Action | Plum `#653C73`, hover `#512D5E`, deep `#4D285A` | A recognisable, accessible action family across the static site and app. White primary-button text retains AA contrast. |
| Energy | Orange `#E8915B`, peach `#FCE5CF`, dark orange ink `#85401E` | Everyday warmth in illustration and heading punctuation. Orange is not used as low-contrast white-text body copy. |
| Product stages | Lilac `#D9C6EE`, pale lilac `#F3EDF9`, selected wash `#EDE3F2` | Separates examples from sales prose and gives the page an alternating scene rhythm. |
| Display type | **Meister Serif**, the renamed European subset of Caladea, regular display weight | Broad, warm editorial headings instead of Archivo signs or Fraunces. |
| Reading / controls | **Meister Sans**, the renamed European subset of Carlito, regular and bold | A humanist body and interface face, with a visibly different rhythm from Nunito Sans. `sign` is a compatibility alias of this face, not a third font. |
| Shape / depth | 12px control corners; 24px product/card windows; book-like course covers; token surface, floating and overlay shadows | Replaces pill actions, flat ticket cards and station rings with a distinct control and product language. Reference disclosures can remain flat. |
| Space / motion | New spacing/type roles, generous scene gutters and responsive compositions; feedback/control/section/signature tiers 120/200/480/720ms | A calmer reading pace with brief feedback. Animation never gates sales content, and reduced motion removes movement. |

`src/data/design-tokens.js` was rewritten and its Astro twin remains byte-identical. The public composition stylesheet is also a registered byte-identical pair: canonical `src/styles/public-system.css` → `astro-site/src/styles/public-design.css`. Both Tailwind adapters expose the new radius, type, colour, elevation and motion roles. The old CSS compatibility layer resolves its timings through the new tokens.

Font files are self-hosted WOFF assets, with unique token-derived preloads in both renderers. The three preloaded files total **120,132 bytes**; all four packaged files total **141,684 bytes**. `scripts/package-public-fonts.py` preserves copyright/OFL notices, renames modified families (Carlito has a reserved name), subsets European glyphs and validates the OpenType/WOFF checksums through the regression suite. Fallback advances were calibrated against Liberation Serif/Sans using the new public copy, with separate regular/bold metrics. A FreeType specimen rendered all four files, including German umlauts, ß, punctuation and the euro glyph. [Font provenance and licences](font-licenses.txt) are retained. Browser font swapping and CLS have not been measured here.

The new mark is an original speech window with drawn letterforms, shared by the Astro/React chrome. `scripts/build-public-brand.mjs` derives favicon and app icons from tokens during the normal SPA build. The café/person/tree and speech-window drawings are original inline SVG; there are no stock assets, external image requests or generated image dependencies in the new compositions.

**Deliberate compatibility choices:** case colours and their labels retain their pedagogical meaning; existing exercise-level colour aliases retain their values. Internal names such as `siegel`, `linie`, `nacht` and the existing checkout/tracking identifiers remain compatibility names, while their public styling changes. Transactional templates and functions were explicitly excluded: their existing palette is frozen separately as `transactionalColor`, and the email drift guard still compares every field. The old train animation and station-art assets remain archived, but are no longer rendered by the rebuilt home or course pages.

### Per-page implementation

| Surface | New composition and behavior |
| --- | --- |
| Home `/` | New editorial opening beside an illustrated, labelled first-lesson window. Anonymous free-course start, attributed account door and authenticated continuation remain. Two compact learning/exam entrances lead into alternating peach, cream and lilac scenes: try a real first-lesson task; inspect a real writing checklist and revision; inspect simulated-transcript word matching; inspect the recorded course correction; choose a course chapter; understand ownership; read native FAQ answers; begin the free course. No line board, train map, ticket widget or progression graphic. |
| Pricing `/pricing/` | Editorial introduction beside two paid access choices and a distinct free-course row, followed by the real A1.2 example and learning sequence. New course/Pro presentation, comparison surfaces and billing controls; payment frequency, total prices, renewal/cancellation wording, allowances, checkout attributes, Pro CTA helper and off-sale telc branch remain. Tables retain readable overflow regions, with keyboard access on the Pro comparison. |
| Catalogue `/courses/` | New chapter-led opening, real A1.2 lesson window and typographic course covers containing actual first-lesson titles. A single available-curriculum catalogue is followed by a separate practice-material/future-course group. All counts, prices, availability and actions retain their sources. |
| All eight `/courses/<level>/` pages | New two-column level opening. Price or honest status and the action precede the example in DOM, reading and keyboard order. A1.1/A1.2 show real lesson windows; other levels show a labelled, sourced grammar-library example, explicitly separate from a guided lesson. B1/B2 say Im Bau and remain unavailable. New level navigation, evidence scenes, contents rail and a quiet mobile purchase bar replace the train/ticket/stamping visuals. The existing conditional purchase doors, bottom-bar/return-bar exclusion, disclosed syllabus, source counts and lesson anatomy survive. |
| Exam index and all `/pruefung/<slug>/` pages | New editorial type and warm ground. Each track opens beside a framed task from the actual writing bank, with example/non-official/assessment-limit labels. The preparation path becomes a spacious two-column set of numbered scenes, with a wider format/source section and retained relevant practice, course, guide and placement actions. German address stays Sie. |
| telc package | Matching public chrome, typography and real task frame. Existing off-sale branch remains: no Buy button, no package Offer, no fabricated completed package. |
| Grammar index | A reading-room opening beside real library titles; a separate labelled search/filter surface; grouped catalogue sections and first-topic/continuation entrance. Search, empty state, level filters and all no-JS topic links remain. |
| Grammar level / every topic | New public type/shape system and level navigation. Every topic pairs its opening with an actual sourced example and translation. The article retains its summary, rules, worked examples, practice, canonicals, schema, public text and account-aware exercise doors. |
| Guide index / every guide | The index pairs its introduction with book-like guide covers derived from the registry. Articles use the new editorial system, framed contents preview, sticky desktop navigation and native mobile disclosure. Existing source facts, dates, links, languages and guide headings remain. |
| Comparison pages | Inherit the new public system, editorial scale, navigation, controls and spacing. No vendor facts, prices or verification dates were advanced. |
| FAQ `/faq/` | New question-and-speech-art opening; native, flat rule-separated answers beside a category rail. Static first paint uses the same original speech paths as React, so the illustration is already present before replacement. All answer content and category counts retain their source. |
| About `/ueber-uns/` | New opening statement, founder context and a real course sample in the warm editorial composition. Measured evidence, sanctioned anonymous founder copy, factual-claims policy and level-order roadmap remain. Static first paint mirrors the heading and example. |
| Level test `/level-test/` | New opening question in a warm assessment stage, with Start/Resume directly below and an actual-bank sample beside it on desktop. Designed mobile spacing and sample treatment. Static first paint mirrors the headline and opening structure; test drawing, scoring, resume and result behavior are unchanged. |
| Signup / login | New plum/cream type and form surfaces, compact-corner controls, elevated form frame and original speech art around a real A1.1 example. Forms remain first on mobile. Trial headline, purchase context, handlers, validation, confirmation/resend, auth and redirect behavior are retained. |
| Shared app chrome | Same speech mark, inset header, new controls, redesigned mobile menu surfaces, chapter-style footer level links and plum closing/footer across React and Astro. All registry links, auth visibility, upgrade/continue logic, support/social destinations and bottom-nav state remain. |

The presentation primitives were rebuilt around token buttons, cards, chips, section roles, product windows, example panels and shared scene scaffolds. A real lesson preview is never manufactured for an unfinished curriculum: grammar-library windows use `getTopicFull()` and state what they are.

### Every headline

The complete rendered inventory is [pass-3-headlines.md](pass-3-headlines.md): **2183 headings across 145 public pages**, including unchanged source-derived titles. It also records shared chrome/account labels that are outside static main content. The major authored replacements/additions are below; unchanged login/signup and source-derived exam, guide, grammar and lesson titles are retained in the inventory.

| Surface | Pass 3 headline / prominent label |
| --- | --- |
| Home eyebrow | German, for the life you’re building. |
| Home H1 | Life happens. Learn the German for it. |
| Home practice scene | Your German starts with a hello. |
| Working exercise | Say hello. Try it here. |
| Writing scene | A real message. Your own words. |
| Speaking scene | Give your German a voice. |
| Sequence scene | A clear plan. A real situation. |
| German proof equivalents | Eine Nachricht. Ihre eigenen Worte. / Laut wird daraus Ihre Sprache. / Ein klarer Plan. Eine echte Situation. |
| Recorded checker scene | Write it. Check it. Try again. |
| Course chapter scene | A new language. A place to begin. |
| Ownership scene | Keep a level. Make it yours. |
| Home FAQ | A few questions before you begin. |
| Home closing | Your next conversation starts with one lesson. |
| Pricing H1 | A little German. A clear choice. |
| Pricing offer labels | Your course. Yours to keep. / Keep practising with Pro / A1.1, free |
| Pricing evidence | See what you’re choosing. |
| Pricing comparison | One payment or a subscription? |
| Catalogue H1 | Find your German. Start your chapter. |
| Future-course group | Still taking shape |
| Level contents | Inside your [level] course / Course at a glance |
| Grammar H1 | Make sense of the sentence. |
| Guide index H1 | Gut informiert. Klar vorbereitet. |
| FAQ H1 | Good questions. Clear answers. |
| About H1 | A language opens doors. Let’s open yours. |
| Placement H1 | Where does your German begin? |
| Account example | Your German has a home here. |
| Footer, English / German | Make yourself at home in German. / Machen Sie Deutsch zu Ihrer Sprache. |

The confident “best” line is explicitly aspirational: “Our ambition: your best place to learn German. Try it for yourself.” No unprovable ranking, testimonial, learner count or promised exam outcome was introduced.

### Tests rewritten, with reasons

| Suite | Replacement contract; retained safeguards |
| --- | --- |
| `brand.test.mjs` | Compare the excluded email implementation to the frozen transactional token palette instead of forcing this public redesign into untouched functions/templates. The whole BRAND object is now compared. Retired-brand bans and both zero-debt ratchets remain. |
| `design-gap-build.test.mjs` | Replace required train-board order and no-shadow/pill-only pins with route-before-practice order, no retired composition, new token elevation/radius/motion and authentic opening preview. Retain availability grouping, disclosed syllabus, consent/once-events, proof accuracy, undecidable-check labels and readable/no-animation-gate assertions. |
| `fahrschein.test.mjs` | Reframe stamps as real contents links; pin the new rail width and keyboard-scroll region, and reject old stamp-dot markup. Retain conditional availability, matching section targets, safe syllabus width and return-bar exclusion. |
| `funnel-events.test.mjs` | Change only the attributed account door’s visual class assertion. Keep the no-false-`signup_started` scan and exact tagged account destination. |
| `language-strategy.test.mjs` | Pin the new English grammar headline. English document/navigation labels, Sie register, literal learner dialogue and source-language rules remain. |
| `linie-design.test.mjs` | Pin the new palette/curves, common chrome, original SVG/product scenes and removal of transit/station art from the rebuilt pages. All original contrast thresholds remain, including 7:1 secondary text and 12:1 ink/wash checks. Keep focus, reduced motion, fine-pointer movement, promoted links, safe mobile padding and archived-art hygiene. |
| `selling-pages.test.mjs` | Use the new pricing-composition selector/free-card label and placement headline. Retain paid-before-free DOM/keyboard order, Start/Resume priority, short signup promise, auth form constraints, trial allowances and confirmation behavior. |
| `seo-performance-release.test.mjs` | Replace the obsolete minimum number of deferred transit components with visible, static product-scene assertions. Keep no blur, no deferred visibility/containment, visible headings and the long-grammar checks. |
| `site-audit-regressions.test.mjs` | Update the pricing headline and Pro category label. Keep one-time/recurring explanations, correct Pro CTA, derived figures and contrast guards. |
| `web-performance.test.mjs` | Pin the renamed self-hosted families and WOFF preload type, deduplicated token lists and current template declarations. Keep all-files-accounted-for, local/metric fallback, immutable caching, tree-shaking, visible first paint and stable-main checks. |

Added `public-redesign.test.mjs` for shared system equality, retirement of old families/compositions, token controls/reduced motion/focus, all font table and reconstructed OpenType checksums, drawable German/punctuation glyphs, a 125,000-byte preload budget, shared mark paths, sourced lesson/grammar/exam examples and purchase-action-before-preview order. No suite is skipped. Money, claims, availability, accessibility, head-tag, route and entitlement guards were not weakened. The script-catalogue guard was satisfied by documenting the new generator, not by changing its test.

### New rules for a later owner update to `CLAUDE.md`

`CLAUDE.md` itself is unchanged. Suggested replacements for its retired Design section:

1. Open House is the public system: cream/oat reading grounds, plum ink/actions, lilac product stages, orange/peach illustration and punctuation. Case colours keep their teaching labels and meaning. Never use white body text on the warm accents.
2. Canonical colour/font values stay in the identical token modules. Keep the new public stylesheet pair registered in `shared-files.mjs`; regenerate public mark assets from tokens.
3. Use Meister Serif display and Meister Sans body/interface roles. `sign` is a body alias. Self-host the renamed OFL subsets, preserve licences and use unique token preloads; keep the font integrity/preload budget guards.
4. Use compact-corner primary/secondary buttons, rounded product windows, deliberate token elevation and an explicitly flat reference option. Pills, station rings, trains and ticket styling are retired for public composition.
5. Pair promises with labelled examples from canonical curriculum, task or grammar data. Show example/model/simulated/recorded status and assessment limits. Existing practice material must never impersonate a finished guided course.
6. Use responsive scene grids and mobile-specific composition rules. Keep actions and availability before optional detail in reading and keyboard order. Reference navigation/search/disclosures remain usable without JS.
7. Use the new 120/200/480/720ms token motion tiers and curves, with transform/opacity-only movement, fine-pointer hover movement and reduced-motion overrides. Sales content and H1s remain visible without observer/animation completion.
8. Use the same speech-window mark and public chrome across Astro/React. The canonical navigation, auth/continue/upgrade decisions, routing, tracking and checkout attributes remain functional contracts.
9. Transactional email/function styling is a deliberate frozen exception under this brief; keep its drift guard until separately authorised. No price, access, availability, claims or legal exception follows from changing public visual rules.

### Gate results

| Gate | Final result |
| --- | --- |
| `npm run lint` | Pass · zero ESLint warnings |
| `node scripts/check-duplicates.mjs` | Pass · 20/20 registered pairs byte-identical |
| `npm test` | Pass · 296/296 test files, 0 failures, 0 skipped; final 10-file focused verification also passes |
| Clean SPA build and `index.html` → `app.html` | Pass · fresh output, normal production build |
| Offline Astro build with the required cache | Pass · 140 static pages |
| Merge + one prerender | Pass · full merged output and eight prerendered SPA pages |
| `node scripts/check-built-html.mjs dist` | Pass · 148 pages, 0 failures, 0 warnings; 143 sitemap URLs valid; telc off sale, 0 Buy buttons and no Offer |
| Additional function syntax / whitespace | 83 function files pass syntax checks; `git diff --check` passes |
| Font integrity / output provenance | WOFF/OpenType checksums and German glyphs pass; built font bytes match source assets |

Final output is the merged `dist/`. The gate sequence uses the same sandbox-only capture adapter as prior passes (`NODE_OPTIONS="--use-openssl-ca --require=/tmp/sandbox-stdio.cjs"`) and disables Astro telemetry outside writable roots. Clean output was obtained by moving the previous `dist/` into a unique `/tmp/` backup: the command wrapper rejects `rm -rf`, and no old output was merged into the new build. Logs are `/tmp/pass3-{lint,duplicates,tests,vite,astro,merge,prerender,html}-complete.log`; the additional built audit is `/tmp/pass3-built-audit.json`.

The required viewport review remains a **verification limitation**, not a passed gate: Chrome was actually launched with a writable profile, headless mode and `--no-sandbox`, then exited before opening the page with `setsockopt: Operation not permitted` (`/tmp/pass3-browser.log`). No 390/1440 screenshot, zoom/overflow, live pointer/keyboard, head reconciliation or measured Lighthouse/CLS result is claimed. Claude should review the merged build at the requested viewport sizes against MedMeister. Source checks and static HTML cannot substitute for that visual review.

Checkout/payment code, auth/redirect/entitlement implementations, Netlify functions, migrations, legal-page sources, email templates, lesson player and exercise/checker logic are unchanged. Pricing and marketing data are unchanged. No new page route, service write, deployment or git commit was attempted.
