# Architecture review — 2026-08-23

**Scope:** whole repo (SPA + Astro site + Netlify functions + build choreography).
**Method:** source and config read directly; `npm test` (29 pass), `npm run lint`
(0 errors / 44 warnings), a dependency-cycle scan over `src/`, and a shell-precedence
proof for finding 01. Published as an artifact for reading; this file is the record.

**Thesis.** The layering is clean and the money path is genuinely server-authoritative.
Risk is concentrated on one seam: **where the SPA and the Astro site are stitched into
one `dist/`.** Both critical findings and the top high-severity one live there.

| Sev | Finding | Area |
|---|---|---|
| S1 | Build command's `\|\| true` swallows every failure | Deploy |
| S1 | One grammar URL renders two divergent lessons | Routing · Data |
| S2 | `/leitfaden/*` and `/vergleich/*` return 200 for missing pages | Routing · SEO |
| S2 | Test suite guards the copy, never the product | Testing |
| S2 | `_shared/` exists but 10 of 15 functions bypass it | Functions |
| S3 | Route protection hand-composed 31 times | SPA |
| S3 | Brand ratchet blind to three of five guards | Design system |
| S3 | 602 duplicated lines rest on an untested assumption | Packaging |
| S4 | Eight round-trips where one query would do | Performance |
| S4 | Abandoned 5-stage model still half-wired | Data model |
| S4 | No error telemetry | Observability |
| S4 | `answerMatch` duplicated outside the drift check | Packaging |

---

## S1 · 01 — A trailing `|| true` makes every deploy report success

`netlify.toml:5`. The build is one 18-step `&&` chain ending in `|| true`. Shell precedence
groups that as `(step1 && … && step18) || true`, so a failure *anywhere* short-circuits to the
`|| true` and the command exits 0. Verified:

```
$ sh -c 'echo step1 && false && echo step3 || true'; echo "exit: $?"
step1
exit: 0
```

If the Astro build dies (expired Supabase creds, a build-time network blip), `cp -r
astro-site/dist/grammar` fails and so does everything after it — including `mv dist/index.html
dist/app.html`. Netlify then publishes a `dist/` with **no `app.html`**, so all 29 SPA rewrites
point at a missing file and `/` serves the SPA shell, which has no `"/"` route and renders
NotFoundPage. Site-wide outage, deployed green.

This compounds with a documented gap: CI runs `check-built-html.mjs --spa-only`, and CLAUDE.md
states "Netlify's deploy build remains the only gate on the static pages." That gate is disarmed.

**Fix.** Scope the tolerance: `… && node scripts/prerender-spa-routes.mjs && (node
scripts/ping-indexnow.mjs || true)`. Then move the choreography into `scripts/build-site.mjs`
with real post-conditions — assert `dist/app.html` exists, assert `dist/grammar/` holds the
expected page count, assert `dist/index.html` is the Astro homepage and not the shell.

## S1 · 02 — One grammar URL renders two different lessons, and both write progress

`/grammar/a1.1/artikel` resolves to different code depending on how you arrived.
`DashboardPage.jsx:165` and `GrammarTopicCard.jsx:23` reach it via React Router `navigate()`,
which never touches the server and renders the SPA's `GrammarLessonPage.jsx` (1,520 lines).
A direct link, a refresh, or a click from Google gets the Astro static page and its
`ExercisePlayer` island (292 lines). URL-to-content is not a function; it depends on
navigation history.

The two have already drifted, and the drift reaches the database. Both upsert
`user_grammar_progress` with an identical row shape and a 70% threshold — over different
exercise sets:

```js
// SPA — GrammarLessonPage.jsx:795
  // FILTER OUT translation exercises with no options (BUG 1)
  .filter(ex => ex.options && ex.options.length > 0),

// Astro — lib/grammar.js:146, normalizeExercises()
  if (!Array.isArray(options)) options = [];   // kept, not dropped
```

Different score denominator per side. Worse: the Astro island renders `multiple_choice` as
`(exercise.options ?? []).map(…)` — zero options, zero buttons — and its "Next" control only
appears once `answered` is true. One option-less exercise dead-ends the sequence, so the run
never reaches `done` and never records at all. The SPA user simply never sees that exercise.

**Fix.** Decide the owner rather than syncing the copies. Astro already wins these URLs for every
real visitor and crawler: delete the three SPA grammar routes, switch `DashboardPage` and
`GrammarTopicCard` to a plain `<a href>` full load, delete `GrammarLessonPage.jsx`. That is the
call this repo already made for `LandingPage.jsx` and `TelcB1Page.jsx`, documented both times in
`App.jsx`.

**Stopgap (shipped 2026-08-23).** The first draft of this recommendation said "port the SPA's
filter into `normalizeExercises`". That would have been a regression: the SPA drops *every*
option-less exercise only because its `Exercise` component renders nothing but
`exercise.options.map(...)` — it has no fill-blank renderer. The Astro island does, and
`FillBlank` is a free-text input that needs no options. Copying the blanket filter would have
deleted every working fill-blank exercise from the static grammar pages. What shipped drops only
`multiple_choice` rows with no options — the ones that are genuinely unanswerable in the renderer
that will handle them.

## S2 · 03 — The soft-404 fixed for `/grammar/*` is still live on two other prefixes

`netlify.toml:293–300`. The comment at `netlify.toml:334` explains why the blanket
`/grammar/* → app.html` rule was removed: static Astro files win first, so the rule only ever
caught paths that *don't exist*, answering them 200 + app shell. GSC reported it. Two rules with
exactly that shape remain:

```toml
[[redirects]] from = "/vergleich/*"  to = "/app.html" status = 200
[[redirects]] from = "/leitfaden/*" to = "/app.html" status = 200
```

`/leitfaden/*` is the cleaner case: the SPA has **no** `/leitfaden` route at all (`TelcB1Page.jsx`
was deleted on purpose), so any unknown guide slug gets 200 + shell + NotFoundPage.
`/vergleich/*` is the same for any slug outside the four in `competitorComparisons`.

**Fix.** Delete both rules — the four guides and four comparison pages are real static files that
win before any redirect, so nothing real changes and unknown slugs fall to the `/*  → /404.html
404` catch-all. Then delete `VergleichHubPage.jsx` and `ComparisonPage.jsx`, the third
unreachable SPA twin.

## S2 · 04 — All 29 tests guard the marketing copy; none guard access or payment

`claims.test.mjs` parsing enforced limits back out of the Netlify functions is a genuinely sharp
idea and it caught a real six-fold misstatement. But every test in the suite is a brand, claims,
guide-copy or lifecycle-copy assertion. Nothing covers:

```
hasAccess / checkTrialStatus / checkSubscriptionStatus   — who gets in
lemonsqueezy-webhook signature + event handling          — who gets charged
loadUserGrammarProgress UUID <-> legacy-id mapping       — what they see
stepDownSublevel / normalizePlacementLevel               — level test
answerMatch / normalizeExercises                         — scoring
```

The two highest-consequence surfaces are the only two with no automated coverage.

**Fix.** All of the above are pure or trivially isolable. `tests/access.test.mjs` pinning the
trial/subscription truth table and `tests/webhook.test.mjs` covering signature rejection plus
each handled event type is ~150 lines and needs no database.

## S2 · 05 — `_shared/` is a directory, not a boundary

`_shared/supabase.mjs` exists and is correct. Ten of the fifteen functions ignore it and
re-declare the identical client bootstrap inline, including the same hardcoded project-URL
fallback (11 function files; the bare URL appears 21 times repo-wide):

```js
const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
```

Seven functions also carry a byte-identical 20-line CORS-and-method preamble. Changing the
allowed origins is a seven-file edit, and CLAUDE.md documents the copy-paste as convention
("CORS preamble per file") rather than as debt.

**Fix.** Add `_shared/http.mjs` exporting `corsHeaders(event)` and `preflight(event, methods)`;
route every function through `_shared/supabase.mjs`. Drop the URL fallback — a missing
`SUPABASE_URL` should fail loudly at boot, not silently point a staging deploy at production.

## S3 · 06 — Route protection is composed by hand 31 times

`src/App.jsx` is 319 lines. `<EmailVerificationGate>` appears 13×, `<OnboardingGate>` 12×, always
in the same nesting order inside an outer access guard. The composition is invariant; only the
leaf page changes. Omitting one link fails silently — the page renders, without that check. Same
class of manual-registration hazard as the documented three-place route rule, in the same file.

**Fix.** React Router 6 layout routes: a `<Gated>` element rendering the guard stack around an
`<Outlet/>`, used as a parent `<Route>`. Three variants (public / gated / level-gated) replace all
31 stacks and make the omission impossible rather than merely unlikely.

## S3 · 07 — The brand ratchet is blind to three of the five guards it claims to cover

CLAUDE.md says the ban covers "the chrome (`src/App.jsx`, the nav, **the guards**, …)".
`APP_CHROME` (`tests/brand.test.mjs:127`) is a hand-maintained list of 29 paths; it includes
`SubscriptionGuard.jsx` and `LevelSubscriptionGuard.jsx` but **not** `ProtectedRoute.jsx`,
`EmailVerificationGate.jsx`, or `OnboardingGate.jsx`. And `ProtectedRoute.jsx:14` still ships the
retired brand:

```jsx
<div className="… border-4 border-slate-200 border-t-amber-500 animate-spin" />
```

Neither ratchet catches it. `MAX_LEGACY_CTA_FILES` matches only the exact retired CTA string, and
`RETIRED_STOP` is `/\b(?:from|via|to)-(?:amber|rose)-\d{2,3}\b/`, which needs a gradient-stop
prefix — verified not to match `border-t-amber-500`. The file also uses `bg-slate-50` /
`text-slate-600` where the tokens say `bg-paper` / `text-graphite`, so adjacent routes show two
visibly different loading spinners.

**Fix (shipped 2026-08-23).** Added the three files to `APP_CHROME`, migrated
`ProtectedRoute.jsx` (and `OnboardingGate`'s spinner) onto the tokens, and widened `RETIRED_STOP`
to any `-(amber|rose)-\d{2,3}` utility.

**The widening changed the picture.** The ratchet had read 10 for weeks; under the wider lens the
real number is **22**. Two thirds of the surviving retired palette lived in plain `text-`, `bg-`
and `border-` utilities that a gradient-stop pattern could not see. `MAX_RETIRED_STOP_FILES` is
now 21 (22 minus `ProtectedRoute.jsx`, migrated in the same commit) and may only go down. The
ceiling went up because the lens widened, not because anything spread.

## S3 · 08 — 602 duplicated lines rest on an assumption nobody has retested

CI keeps four pairs byte-identical: `competitorComparisons.js` (236), `marketing.js` (131),
`pricing.js` (94), `design-tokens.js` (141). The stated reason is that astro-site "is a separate
package and cannot import from `src/config/`" — "two packages, two node_modules trees, no safe
cross-import".

That holds for anything resolving through `node_modules`, but these four are dependency-free ESM
importing only each other. A relative path (`../../src/data/design-tokens.js`) is resolved by
Rollup at build time in both builds; only Astro's *dev* server needs
`vite.server.fs.allow: ['..']`.

**Fix.** Probe on `design-tokens.js` first — no sibling imports, both Tailwind configs already
read it. If both builds succeed, promote a `shared/` directory and retire that pair from the
drift check.

## S4 — Accumulated drag

- **09 · Eight round-trips where one `.in()` would do.** `ProgressContext.jsx:110`,
  `ReadingSectionPage.jsx:70`, `LevelTestListening.jsx:28` each fan out one query per CEFR level
  and `Promise.all` the eight. Parallel, so latency not a stall — but `ProgressContext` sits above
  every route and runs on each authenticated page load, after two awaits it does not overlap with.
- **10 · The abandoned 5-stage grammar model is still half-wired.** The writer records
  `current_stage: 1` unconditionally (`GrammarLessonPage.jsx:830`); the reader still computes
  `Math.round(((current_stage - 1) / 5) * 100)`, so every incomplete topic reports exactly 0%.
  `buildStage2` / `buildStage3` / `buildExerciseStages` are dead (3 of the 44 lint warnings).
- **11 · No error telemetry.** 41 `console.error` calls, an `ErrorBoundary` in `main.jsx`, PostHog
  already loaded behind consent — and nothing reporting exceptions. A failed progress upsert or a
  500ing webhook is invisible unless someone opens Netlify's log stream. `captureException` in the
  boundary and the webhook catch is a small change with disproportionate payoff.
- **12 · A fifth duplicated file the drift check does not know about.** `normalizeAnswer`
  (`astro-site/src/components/ExercisePlayer.jsx:70`) carries the comment "Mirrors
  `src/utils/answerMatch.js` in the SPA" — two graders that must agree, with nothing enforcing it.

---

## Verified strengths

- **Clean layering, zero cycles.** A scan over every module under `src/` found no import cycles and
  no layering violation: `services/`, `lib/`, `utils/` never import a component, page or context,
  and no component imports a page.
- **Money is server-authoritative, deliberately.** No client-side subscription write exists; RLS +
  a trigger enforce it; the webhook verifies HMAC with `timingSafeEqual` before parsing;
  `_shared/auth.mjs` derives identity from the verified JWT with an explicit comment forbidding
  body-supplied `user_id`. `SubscriptionContext` documents why it refuses to fall back to
  `profiles.is_subscribed`.
- **The X-Ray cost controls are the best-engineered code in the repo.** Tiered daily limits, a
  per-IP hashed ceiling held independently of the client-supplied anonymous id, and a usage refund
  when the AI call fails.
- **Comments carry incidents, not descriptions.** The `onConflict` note, the `is_completed`
  column-name bug, the `getSession()` timeout, the dead `LandingPage`. This is why the review above
  could be specific.
- **Claims are checked against the server that enforces them.** `claims.test.mjs` should be the
  template for the access-path tests in finding 04.

## Roadmap

**Phase 1 — stop the bleeding. SHIPPED 2026-08-23.** Each small, independent, and removes a way to
ship a broken site silently.
1. ~~Scope the `|| true` to the IndexNow ping~~ (01) — wrapped in a subshell; a mid-chain failure
   now exits non-zero, and only the ping is tolerated. Both proven in shell.
2. ~~Delete the `/leitfaden/*` and `/vergleich/*` rewrites~~ (03) — 29 SPA rewrites → 27. The four
   guides and four comparison pages are static files and are unaffected; unknown slugs now reach
   the `/*` catch-all and return a real 404.
3. ~~Filter unanswerable exercises in `normalizeExercises`~~ (02, stopgap) — see the correction
   under finding 02: `multiple_choice` with no options only, never the fill-blanks.
4. ~~Add the three gates to `APP_CHROME`; widen `RETIRED_STOP`~~ (07) — and the widening found
   more than expected; see finding 07.

Verified: `npm test` 29/29, `npm run lint` 0 errors, `check:duplicates` clean, `node --check` on
all 15 functions, a full `npm run build` + prerender + `check-built-html --spa-only` (7 pages, 0
failures), and a grep of the **built CSS** confirming the retired border class is no longer
emitted while `border-t-siegel` is.

**Phase 2 — put the seam under test before changing it (~1d).**
1. `tests/access.test.mjs` — the trial/subscription truth table (04)
2. `tests/webhook.test.mjs` — signature rejection and each event type (04)
3. `scripts/build-site.mjs` with real post-conditions on `dist/` (01)
4. `_shared/http.mjs`; route all functions through `_shared/supabase.mjs` (05)

**Phase 3 — retire the second copy (~2d).**
1. Delete the three SPA grammar routes and `GrammarLessonPage.jsx`; switch in-app links to full
   loads (02)
2. Delete `VergleichHubPage.jsx` and `ComparisonPage.jsx` (03)
3. Layout routes replace the 31 hand-composed guard stacks (06)
4. Probe the `shared/` import on `design-tokens.js`; fold in `answerMatch` (08, 12)

## What this review could not check

- **No Supabase access.** Finding 02's dead-end depends on `multiple_choice` rows with empty
  `options` existing in live data. The SPA's `BUG 1` filter is strong evidence they did; it is not
  a query.
- **No production HTTP.** The routing conclusions in 02 and 03 are derived from `netlify.toml` rule
  order and Netlify's static-file-wins-first semantics, not observed responses. A `curl -I` against
  a deploy preview settles both in a minute.
- **The Astro build was not run.** It needs Supabase credentials or a `GRAMMAR_CONTENT_CACHE` dump
  — the same gap CI reports on every run.
