# Build report 4 — Concept 4

Date: 2026-11-09. Implemented the approved build brief in the working tree. No commits, pushes, deployment, database changes, or external messages.

## Pages and shared presentation

| Surface | Files and result |
| --- | --- |
| Home | `astro-site/src/pages/index.astro`: problem-first hero, laptop/Berlin illustration, real quick exercise, three illustrated situations, route band, measured library counts, and course/add-on cards. Mobile puts the illustration before the heading and exercise, uses compact paired scene cards, and keeps the route and offers visible. |
| Pricing | `astro-site/src/pages/pricing.astro`: illustrated hero, free A1.1 entry, A1.2 ownership beside optional AI Practice, coming-next route, pay-once/renewal comparison, native FAQ, and honest telc off-sale message. The existing monthly/yearly checkout and billing-portal logic remains in place. |
| Courses | `astro-site/src/pages/courses/index.astro`: illustrated route hero, eight cards in a four-column desktop/two-column mobile catalogue, availability, course benefits, and canonical measured counts. A1.1 is “Free”; no zero-price card. |
| Level template | `astro-site/src/pages/courses/[level].astro`: A1.2 reception hero and purchase panel; four sourced can-dos; actual doctor dialogue and writing task preview; all twelve real lessons grouped by the curriculum’s four checkpoints; FAQ and closing course door. A1.1 uses the same presentation with its live curriculum and free entry. A2–B2 have dedicated coming-next states and no price offer or purchase button. |
| Curriculum presentation | `astro-site/src/data/salesCurriculum.js`: English presentation of actual curriculum lessons; unit membership follows `checkpoints[].afterLektion`; selected can-do translations retain their original lesson ID, index, and German source. No curriculum content was changed. |
| Shared components | `astro-site/src/components/concept/{Scene,Icon,Benefits,ProofCounts,RouteBand,PurchaseDoor,Offers,Motion}.astro`; all scene images have responsive WebP pairs, sizes, explicit dimensions, useful alt text, and lazy loading except hero art. Route dots and links are HTML over the supplied tram illustration. |
| Static chrome | `astro-site/src/layouts/Layout.astro`: white header, DM mark, compact desktop disclosures, full native mobile menu, and dark teal footer. Retains attribution, session activity, login return, course return bar, consent, and account-aware continuation. |
| App chrome | `src/components/{Navbar,Footer,BottomNav,Logo}.jsx`, `src/index.css`, and shared navigation data: matching identity, menu/footer styling, white mobile app tabs, and existing course-aware continuation. |
| Shared styles | `astro-site/src/styles/concept4.css` supplies both front ends. `styles/linie.css` is now a small compatibility layer for library-page utility names. |

Full inventory: [validation-4/changed-files.txt](validation-4/changed-files.txt).

The mockup’s invented A1.2 syllabus, downloads and popularity badge were intentionally not reproduced. The real course has twelve lessons and four checkpoint groups. Its preview uses the actual lesson-six doctor conversation and lesson-two landlord message; the writing comparison is explicitly a course form check, not a fabricated AI assessment. The live checker needs answer controls and feedback space that the mockup’s completed exercise did not show.

## Tokens and new visual rules

Canonical tokens remain in `src/data/design-tokens.js`, with the byte-identical Astro twin.

| Token | Value / purpose |
| --- | --- |
| `color.paper` / `white` | `#FFFFFF` — white ground |
| `color.paperSunk` | `#F4F9F6` — quiet card ground |
| `color.siegel` | `#035E53` — sampled teal, home offer button at (400, 919) |
| `color.siegelLift` / `siegelDeep` | `#054D45` / `#05453E` — darker teal pairs |
| `color.siegelWash` | `#EDF8F3` — sampled mint panel colour |
| `color.footer` | `#05463F` — sampled footer at (300, 980) |
| `color.coral` | `#F95841` — sampled home CTA at (80, 198) |
| `color.coralAccessible` | `#BC3524` — white-text small badge variant |
| `color.ink` / `graphite` | `#090A0A` / `#43534E` — main and secondary text |
| `shadow.raise` | `0 2px 6px rgba(5, 69, 62, 0.10)` — restrained card depth |

Visual replacements to record when the owner next updates **CLAUDE.md**; that file was not edited:

1. Use white and soft mint grounds, deep teal identity and footer, and coral entry CTAs. Legacy `linie`/`nacht` names remain compatibility aliases for existing exercise surfaces.
2. Use self-hosted Fraunces for headlines and Nunito Sans for body/control text. Money pages no longer depend on Archivo or transit-sign typography.
3. Use the supplied painterly illustrations in rounded frames. Remove the former LineBoard video, station artwork, stamped ticket and train-led sales layout.
4. Permit subtle resting card shadows and pill buttons. Keep grammatical case colours reserved for labelled grammar examples.
5. Use calm fade/rise, soft hero parallax, transform-based route drawing, and a checker success tick. New effects animate only transform and opacity at the 140/220/420/800 ms token tiers. Content is visible at rest and without JS; reduced motion suppresses movement. Hover movement requires a fine hover pointer.
6. Preserve contrast: exact coral with large bold white entry text; compact coral controls use dark ink or the accessible coral variant. Focus, zoom, semantic headings, native disclosures and explicit input labels remain available.

Transactional functions retain their prior palette, pinned as `emailBrand`, because the brief explicitly excludes function changes. The visual brand regression checks that frozen palette separately from the new site palette.

## Pricing and access

- Prices and product keys remain canonical: A1.2 is €40 once, with `COURSE_PRO_MONTHS` (three) months included; AI Practice is €9.99/month or €79.99/year. No Lemon Squeezy IDs were changed.
- `COMING_SOON_LEVELS` now includes A2.1 and A2.2 alongside B1–B2. `SELLABLE_LEVELS` is exactly `['a1.2']`. Existing purchases and legacy product keys still resolve normally.
- AI Practice is described as optional AI writing feedback (`PRO_WRITING_EVALUATIONS_PER_MONTH`), AI speaking practice without a marketing session count, and Sentence X-Ray (`PRO_DAILY_LIMIT`/day). New subscriptions do not sell course access.
- `src/lib/levelEntitlement.js` is the common course-access policy. An active recurring subscription opens courses only when `subscription_start` (or `created_at` when the start is absent) precedes **2026-11-10T00:00:00.000Z**. Missing/invalid dates do not grandfather access. Confirmed paid-through deadlines and terminal statuses still apply.
- `SubscriptionContext.hasLevelAccess`, static `levelAccess.js`, static continuation, and course/exam-level gates use that policy. New paid subscribers keep AI-tool access separately. Lifetime ownership, legacy purchases, included course-practice windows, trials and explicit premium grants continue working.
- Static snapshots now read the actual subscription and dates. They do not grant course access from a stale `profiles.is_subscribed` flag. Failed reads remain unverified; duplicate-purchase protection still uses ownership and rechecks the account at click time.
- The shared offer data, subscription headings/features/status, signup/trial/limit copy, FAQ, comparisons, grammar prompts and generated public catalogues use the AI Practice name and updated offer. Existing checkout handlers, purchase intent, billing portal, consent and head reconciliation are preserved.
- The telc sale switch remains authoritative and off. No off-sale price/Offer leaks were introduced. An unset level checkout ID renders an unavailable purchase label rather than a fabricated checkout.
- Functions and their support catalogue were intentionally unchanged. Tests explicitly pin their old coming-soon set and the client’s additional A2 restrictions; all shared prices and product mappings still match. The founder still performs the provider-side product rename.

## Regression coverage

- Added `ai-practice-entitlement.test.mjs`: before/at/after cutoff; monthly/yearly; created-date fallback; missing/invalid dates; expired/terminal/cancelled/paused/past-due states; stale profile flags; free level; purchases/refunds/legacy bundle; included window; premium grant; trial; static snapshot failure; common-policy wiring; final-test bypass prevention.
- Added `concept4-design.test.mjs`: sampled palette and contrast, image pairs and loading/layout attributes, approved compositions, no old visual components, only A1.2 sellable, real A1.2 lesson/can-do/checkpoint provenance, honest AI allowances, readable motion and shared chrome.
- Extended `first-stop.test.mjs` to include the real name sentence and execute the actual interaction handlers with the real checker: completion, wrong answer, reduced motion and failed-chunk retry. Retained spelling/formal-case, no-JS, free-door and checker-option regressions.
- Removed the replaced `linie-design` and `fahrschein` visual suites. Updated `design-gap-build`, `selling-pages`, `seo-performance-release`, navigation/brand/accessibility checks and their selectors for the new layout. Availability tests now cover A2 as coming next, including placement, speaking/feedback offers, blocked-level ordering and launch-copy exclusions.
- Claim, cancellation, purchase-door, ownership, free-entry, attribution, consent, route, head-tag, trial and billing guards remain active against the new surfaces. The claim scan includes the new components instead of deleted files. Backend prices, IDs and mappings remain guarded.
- Added `tests/helpers/spawnWithFiles.mjs` for three existing real-subprocess suites. This executor denies synchronous pipe polling (`spawnSync` returned `EPERM` and empty output despite child exit 0). The helper captures the actual child output through temporary files; it does not mock execution, skip tests, or relax assertions. IndexNow context, DST scheduling and telc built-HTML checks therefore still run their real programs.

## Validation

All required gates passed. The previous generated `dist/` was moved to a temporary archive before each complete build, leaving a clean output directory; the executor rejects `rm -f`-style commands.

| Gate | Result | Evidence |
| --- | --- | --- |
| `npm run lint` | PASS, zero warnings | [lint.log](validation-4/lint.log) |
| `node scripts/check-duplicates.mjs` | PASS, all 19 pairs identical | [duplicates.log](validation-4/duplicates.log) |
| `npm test` | PASS, 295 test files, 0 failures, 0 skipped; 94.67 seconds | [tests.log](validation-4/tests.log) |
| Clean `npm run build` and `mv dist/index.html dist/app.html` | PASS | [spa-build.log](validation-4/spa-build.log) |
| `GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" npm --prefix astro-site run build` | PASS, 140 Astro pages | [astro-build.log](validation-4/astro-build.log) |
| `node scripts/merge-site-builds.mjs` | PASS, 11 Astro directories merged | [merge.log](validation-4/merge.log) |
| `node scripts/prerender-spa-routes.mjs` | PASS | [prerender.log](validation-4/prerender.log) |
| `node scripts/check-built-html.mjs dist` | PASS, 148 pages, 0 failures, 0 warnings; 143 sitemap URLs checked; telc off sale with 0 Buy buttons and no Offer | [built-html.log](validation-4/built-html.log) |

Additional verification:

- All eleven generated money-page outputs have exactly one H1, complete scene-image attributes, local image files, and correct lazy/eager loading. Coming-next pages have no purchase buttons. Compiled CSS has no unresolved `theme()` calls and the merged fonts exist. [built-pages.json](validation-4/built-pages.json)
- A separate temporary Astro render supplied synthetic test variant IDs for A1.2, A2.1 and A2.2. A1.2 rendered one Buy on home, one on pricing, and two on its sales page, with the canonical key and price. A2.1/A2.2 and B2.2 rendered none; the A2 IDs were suppressed. This fixture was not merged into the final `dist/`, and changed no configured provider IDs. The normal local build has no configured course checkout IDs and correctly displays unavailable purchase labels. [configured-availability.json](validation-4/configured-availability.json)
- Focused entitlement, design, actual-checker interaction, buyer-claim and comparison-claim tests passed. `git diff --check` and the generated-catalogue freshness check also passed.
- Astro reports the existing pre-merge root-font resolution notices and Browserslist database-age notice. Font files are present after the documented merge; the final HTML check has no warnings. No dependency or lockfile changes were made.
- The repository subscription schema includes `subscription_start` and `created_at`. The static read orders by paid-through date and limits to one row before `maybeSingle`, consistent with the [Supabase singular-read reference](https://supabase.com/docs/reference/javascript/using-modifiers-maybesingle). An optional read-only live schema query was rejected by the connector because approval is unavailable in this session; no production query executed. Local query/provider regression harnesses verified the new read and access behavior.

## Browser review limitation

Local browser validation was attempted with a preview server, Puppeteer/DevTools pipe, and a direct headless Chrome file render. The sandbox refuses local binding and Chrome’s `setsockopt`; Chrome exits before it can render. No screenshots or visual pixel comparison are claimed. Details: [validation-4/browser-attempts.txt](validation-4/browser-attempts.txt).

The brief assigns Claude the 390 px / 1440 px screenshot comparison. That independent visual review remains pending in a browser-capable environment. Responsive styles and source/behavior regressions are implemented; this report distinguishes them from a completed browser comparison.
