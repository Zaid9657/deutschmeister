> Archived from the 2026-11-01 build session. `/tmp/...` paths name files in that build container, not in the repo. Code landed as PR #246 (track A), #247 (track C) and #248 (track B).

# Track A — selling pages

2026-11-01. Worktree: `/tmp/wt-a`; branch: `claude/codex-build-a`.

Implemented as one local change set. No deployment, external network calls, customer messages, price changes, access changes, or changes to accepted answers.

## Built

- Replaced the telc page’s obsolete grammar-week pitch with the implemented programme: 20 training days, three letters and revisions, ten speaking rehearsals, two short tests, gap practice and Satz-Röntgen. Activities, week titles and timings render directly from `src/data/programs/telcB1Komplett.js`. New course copy addresses readers as Sie and uses the existing tokens and sign typography.
- Off sale, the telc page says **“Der Kurs ist derzeit nicht buchbar”**, offers the free Pro trial, and explains that the course plan is excluded. Trial allowances come from `marketing.js`; all prices still come from `pricing.js`. Package price, Buy buttons and Product/Offer schema render only behind the existing sale gate. Removed the unsupported failure claim, dated competitor-price comparison, speculative launch timing and founder anecdote.
- Added one original letter demonstration tied to the actual delivery-complaint task: draft, explanatory feedback and revision. It says **“Demonstrationsbeispiel, kein Kundentext”** and explicitly identifies the feedback as editorial illustration, not a recorded evaluator response. No evaluation score is invented.
- All telc B1 writing-bank tasks now have four distinct Leitpunkte. The server twin is byte-identical. Tests verify that the evaluator prompt requests four coverage verdicts.
- Every telc-B1 guide offers **“telc-B1-Übungsplan ansehen”** after the useful content and FAQ. A build guard rejects assigning that offer to a non-telc-B1 guide. DTZ and Goethe retain their appropriate destinations.
- Added a recorded homepage correction beside the existing FirstStop experience: an owned A1.1 greeting, actual course-checker feedback and corrected greeting. Its recorded wrong/correct verdicts are checked against the real checker during tests and builds. **This is a short course correction, not a recording of the full AI writing evaluator.** The public label explains that distinction.
- Pricing now puts both paid choices before the free card in DOM order, so mobile reading and keyboard order agree. Its unavailable telc card no longer says “Starts soon.”
- The placement-test start/resume action now sits immediately beneath the headline. Resume remains primary and a fresh start remains secondary.
- Signup now presents a short promise and compact form before the trial allowances. The secondary logo, including its link, is hidden on mobile. Signup/auth, confirmation, resend and password rules are unchanged.

## Files

- `astro-site/src/pages/telc-b1-komplettvorbereitung.astro`
- `astro-site/src/components/TelcWritingExample.astro` (new)
- `src/data/telcWritingExample.js` (new)
- `src/data/writingTasks.js`, `netlify/functions/_shared/writingTasks.mjs`
- `astro-site/src/pages/leitfaden/[slug].astro`
- `astro-site/src/data/guides/index.js`, `astro-site/src/data/guides/telc-b1.js` (the actual guide registry lives in the Astro tree)
- `astro-site/src/pages/index.astro`
- `astro-site/src/components/linie/RecordedCorrection.astro` (new)
- `astro-site/src/data/recordedCorrection.js` (new)
- `astro-site/src/pages/pricing.astro`
- `src/components/LevelTest/LevelTestLanding.jsx`
- `src/pages/SignupPage.jsx`
- `tests/selling-pages.test.mjs`, `tests/writing-telc-format.test.mjs` (new)
- `tests/placement-draw.test.mjs`, `tests/site-audit-regressions.test.mjs` (updated for the new structure while retaining resume and contrast rules)

## Validation

- PASS: `npm run lint`, zero warnings.
- PASS: `npm run check:duplicates`, all 19 pairs.
- PASS: `node scripts/build-lesson-pool.mjs a1.1`, then `node scripts/validate-curriculum.mjs`. The generated pool has no tracked diff.
- PASS: function syntax checks across `netlify/functions/*.mjs`, `*.js` and `_shared/*.mjs`.
- PASS: focused new tests (10 assertions/tests), placement suite (9), and updated site-audit suite (11). The telc sale suite’s eight non-subprocess tests pass.
- PASS: SPA build, offline Astro build (140 pages), merge and prerender, then `node scripts/check-built-html.mjs dist`: **148 pages, zero failures, zero warnings**; 143 sitemap URLs checked. The telc sale check reports **off sale, zero Buy buttons, Offer absent**.
- PASS: additional checks against built pages: all 20 programme days; one labelled telc letter; correct telc-only guide CTAs after FAQ; paid-before-free pricing; recorded homepage disclosure.
- Full `npm test`: final result recorded below after completion. No test was disabled or skipped.

The first Astro attempt failed because `astro-site/node_modules` is a read-only symlink to the shared installation. The successful build used an ignored local config with a writable Vite cache. For reproduction from this worktree:

```sh
GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" ASTRO_TELEMETRY_DISABLED=1 npm --prefix astro-site run build -- --config .cache/offline.config.mjs
```

The local config and build cache are under `astro-site/.cache/`; no shared dependencies were modified. The grammar snapshot is dated **2026-08-24**, older than 30 days. The build confirms that it used the cache; live content freshness is unverified.

## Owner-only and release limits

- **Exact owner decision before sale:** reconcile the telc catalogue price with the intended approved offer and Lemon Squeezy checkout, complete the existing seller/legal and purchase release requirements, verify a test purchase, and explicitly authorize the existing sale switch. The page contains this TODO. Neither prices nor the switch were changed.
- Refunds, entitlements, access, quotas, legal terms, auth/security/RLS, customer mail audience/timing and public endpoints were not changed.
- No customer texts or results are published. A full recorded AI-writing result would still require a genuine evaluator run using an owned sample; none was fabricated or fetched here.

## Expected effect from the plan

`../plan-leak-onboarding-tools.md` assigns the real-correction demo an **unverified scenario of +0.10 buyer per month, about €1 in incremental gross first charges** at the current 62 signups/month; at 10× volume, approximately **+1 buyer and €10**. Zero remains possible. These are not MRR or net revenue, and overlapping effects must not be added. This smaller recorded course example does not establish that lift. The plan provides no separate quantified user/revenue uplift for the remaining Track A layout fixes. **Telc package sales contribute €0 to the forecast while off sale.** No new signup, purchase or retention result has been measured.

## Unverified / blockers / handoff

- Browser rendering is unverified. Puppeteer could not create a target. Direct Chrome launch failed before any page load with `setsockopt: Operation not permitted`. Thus no fresh screenshots, mobile fold geometry, hydration interaction or real signup/checkout checks can be claimed. The responsive implementation and source-order regressions are checked; a rendered mobile pass is still needed.
- **Commit blocked by filesystem permissions:** `git add` failed with `Unable to create '/home/user/deutschmeister/.git/worktrees/wt-a/index.lock': Read-only file system`. No commit was created and no permission bypass was attempted. All changes remain in this worktree.
- A complete patch, including all six new files, is at `/tmp/wt-a/astro-site/.cache/track-a/track-a.patch`. Suggested eventual commit: `Improve selling pages with honest telc availability and concrete practice demos`.
- Logs remain in `/tmp/wt-a/.track-a-*.log`; browser diagnostic/config artifacts are under `/tmp/wt-a/astro-site/.cache/track-a/`.
