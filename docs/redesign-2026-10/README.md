# "Die Linie": review guide

**What this is.** This branch redesigns DeutschMeister around the product the owner chose: one-time level courses.
- The CEFR ladder becomes a transit line, and A1.1 is its free first stop.
- Each paid level is a ticket: one payment, kept for good, with 3 months of Pro on board.
- B1 and B2 are marked "Im Bau" (under construction).

**Branch and scope:** `claude/wonderful-davinci-071dhj`, one draft PR, not merged and not deployed.
- Nothing on this branch changes a price, a product, a migration, an env var or an email.

| Read | For |
|---|---|
| [`baseline.md`](baseline.md) | The before: money, audience, checkout ids, Lighthouse |
| [`strategy.md`](strategy.md) | Diagnosis, audience, funnel, offers (live + proposed with unit economics), revenue model, **owner decisions** |
| [`art-direction.md`](art-direction.md) | Three directions, why B, tokens, type, motion system, asset register |
| [`copy.md`](copy.md) | Voice, the three headline routes, CTA vocabulary, ticket lines, journey copy |
| [`measurement.md`](measurement.md) | Event map, primary metric and guardrails, experiments E1–E6 |

## How to review (commit by commit)

1. **Baseline** — `docs/redesign-2026-10/baseline.md`.
2. **Measurement** — `src/data/events.js` (+ twin), `astro-site/src/lib/track.js`, `src/lib/analytics.js` `mirrorToGa`, `src/lib/signupCompletion.js`, and the checkout events in `CourseCheckout.astro`.
3. **Tokens + fonts** — the additive `linie` / `nacht` / motion / sign section at the end of `design-tokens.js`, both Tailwind configs, and `public/fonts/archivo-*.woff2`.
4. **Homepage** — `astro-site/src/pages/index.astro`, `components/linie/*`, `data/homepage.js`, `data/firstStop.js` and `src/data/offers.js`.
5. **Pricing and course pages** — `pricing.astro`, `courses/index.astro`, `courses/[level].astro`, `lib/proVariants.js`, and the identity handed to the telc checkout.
6. **SPA journey**:
   - `SubscriptionSuccessPage.jsx` ("Your ticket is valid");
   - the purchase strip on `SignupPage.jsx`;
   - the course-first `SubscriptionPage.jsx`;
   - the dashboard Continue via `src/lib/courseNext.js`;
   - the shell `<h1>` removed in `main.jsx`.
7. **a11y, polish, performance** — the axe fixes, the mock-run polish, and the sign face scoped to the four pages that preload it.

**What stays guaranteed** (each one pinned by a test):
- Prices and claims are derived, never typed (`claims`, `offers`).
- Buy appears only behind a checkout id, and never for an Im Bau stop (`offers`, `purchases`).
- `dm_buy_intent`, `Checkout.Success` and `billingPortal` are unchanged (`purchases`, `cancel-path`, `pro-cta`).
- Kasus colours appear only where a case is named (`brand`, `linie-design`).
- One `<h1>` per page (`check-built-html`, `spa-shell-h1`).
- No hex values in Astro (`astro-hex`).
- The demo grades exactly as the course does (`first-stop`).
- The dashboard resumes the right course (`course-next`).

## Validation (2026-10-04, local, CI-mirror builds)

| Check | Result |
|---|---|
| `npm run lint` (0 warnings allowed) | clean |
| `npm run check:duplicates` | OK, including the new twins `events.js`, `offers.js`, `courseContents.js` |
| `npm test` | **1548 pass, 0 fail** |
| `node --check` on every function | OK |
| Build A (no checkout ids, as in CI): SPA → Astro from the cache → merge → prerender once → `check-built-html` | **138 pages, 0 failures**. Stations show "See A1.2", never a dead Buy. |
| Build B (fake checkout ids, including a B1.1 id that must be ignored) | **138 pages, 0 failures**. Buy appears for A1.2, A2.1 and A2.2 only. |
| Playwright, 22 pages × 8 viewports (320, 360, 390, 768, 1280, 1440, 844×390 landscape, 200% zoom) | **176 checks: 0 horizontal overflow, exactly one `<h1>` each, 0 console errors, max CLS 0** |
| Reduced motion (390 and 1280, money pages) | H1 and every CTA visible, 0 running animations |
| No JS (390 and 1280, money pages) | H1 and every CTA visible, nothing stuck hidden; the fit chooser and pricing tabs work through `:has()` |
| Keyboard focus on nacht | A 2 px yellow outline on every nav and hero stop |
| axe-core (WCAG 2.2 AA), 22 pages × 2 widths | **0 violations** (baseline: 5 rule types, including 7 contrast failures on `/`) |
| Mocked checkout flows (`lemon.js` stub) | **16/16**: the demo's verdicts; signed-out Buy → `dm_buy_intent` → `/signup`; signed-in overlay carries `checkout[email]` + `checkout[custom][user_id]`; `Checkout.Success` → `/subscription/success` |
| Mocked auth on the SPA (Supabase stubbed) | **19/19**: the signup strip names the step, product and price; the success page shows the ticket, the Pro end date from `access_until` and a link to `/course/a1.2`, and consumes the checkout flag; `/subscription` puts "own a level" before Pro; the dashboard hero continues the bought A1.2 course |

### Lighthouse, mobile, median of 3 (lab)

| Page | Perf | FCP | LCP | CLS | a11y | Font KB |
|---|---|---|---|---|---|---|
| `/` | 99 → **98** | 0.98 → 1.73 s | 1.96 → 2.11 s | 0 | 96 → **100** | 96 → 152 |
| `/pricing/` | 99 → **98** | 1.10 → 1.73 s | 1.95 → 2.26 s | 0 | 100 | 96 → 152 |
| `/courses/` | new: **98** | 1.59 s | 2.10 s | 0 | 100 | 152 |
| `/courses/a1-2/` | new: **99** | 1.58 s | 1.96 s | 0 | 100 | 152 |
| `/courses/a1-1/` | 99 → **99** | 1.06 → 1.58 s | 1.95 → 1.95 s | 0 | 100 | 96 → 152 |
| `/grammar/a1.1/definite-articles/` | 99 → **99** | 1.11 → 1.20 s | 2.11 → 2.10 s | 0 | 100 | 96 |
| `/leitfaden/telc-b1/` | 99 → **99** | 1.17 → 1.26 s | 2.11 → 2.10 s | 0 | 100 | 96 |
| `/level-test/` | 84 → 84 | — | 4.04 → 4.18 s | 0 | 100 | 96 |
| `/login` | 89 → 88 | — | 3.31 → 3.31 s | 0 | 91 → **100** | 96 |

The four sign pages pay about 0.6 s of lab FCP for the Archivo face. That is the price of the identity, and they stay at 98–99. Library pages do not pay it.

## Known defects and limits (honest list)

1. ~~**The SPA chrome is not restyled.**~~ Fixed 2026-10-04: `Navbar.jsx`, `Footer.jsx` and `BottomNav.jsx` are ported from `Layout.astro` (see "The app chrome" below). PR #149 needs one re-merge in `Navbar.jsx`.
2. ~~**A paper band can show between a nacht SPA screen and the footer on phones.**~~ Fixed 2026-10-04 without touching `App.jsx`: the footer drops its top margin on night routes (`groundFor`), and BottomNav's spacer takes the footer's ground.
3. **Sign pages: FCP is about 0.6 s slower in the lab** (perf 98–99, CLS 0).
4. **No JS on `/` at 1280:** the hero line's station pulse keeps running, because nothing can pause it without JS. It animates transform and opacity only.
5. **Pre-existing, unchanged:** `/level-test/` at 84 and `/login` at 88 (SPA bundle weight).
6. **The content cache is old.** `grammar-content-cache.json` is from 2026-08-24, and CI warns when it is over 30 days. It was not refreshed here (Supabase is not reachable from the sandbox).
7. **Client-side completion events.** `checkout_completed` is the browser's view, and revenue truth stays in `purchases` / `weekly_truth`.

## The app chrome (2026-10-04, follow-up)

The SPA's bar, footer and phone tab bar now speak the same design as the Astro pages, so crossing from `/courses/` into `/dashboard` no longer changes the frame.

| Piece | What it does now |
|---|---|
| Bar | Paper; night on routes whose first screen is night (`groundFor` in `src/lib/chrome.js`, today only `/subscription/success`). Courses and Pricing are promoted into the bar, as in `Layout.astro`. One key: **Start A1.1 free** signed out, **Continue learning** signed in (it resumes the learner's course, never a bare `/dashboard`). |
| Phone menu | A night timetable: the eight stations with their price or status first, then every door. Signed in, it scrolls clear of the tab bar. |
| Footer | Night, with the eight stations on the yellow line, then the link groups. No top margin on night routes. |
| Tab bar | Night; the current tab is the lit stop (yellow label and top bar). Its spacer takes the footer's ground. |
| Type | Labels in the body face at 650, which is what the Astro chrome renders on every library page. The app never loads Archivo (owner decision 4). |
| Focus | A yellow ring on night grounds (`src/index.css`, twin of `linie.css`). |
| Motion | Opacity and transform only; the menus drop travel under reduced motion. |

Verified with a Playwright run against the built app, Supabase stubbed: 320, 360, 390, 1024 and 1280 px, signed out, signed in and on the night route. Horizontal overflow was 0 everywhere, and the focus ring was visible on both grounds. Pinned by `tests/linie-design.test.mjs`.

## v4: Türkis, the line board, station artwork (2026-10-04, owner feedback)

The owner's verdict on v3: "I don't like the choosing of colors … why does it say till B1 … the graphics can be a lot better — use hyperframes to include motion graphics … we have higgsfield api". What changed:

| Ask | Done |
|---|---|
| Colours | Three light palettes rendered on the real homepage (`screenshots/palette-compare.jpg`); the owner picked **A · Türkis**. Tokens moved, names kept (`nacht` = light türkis feature ground, `linie` = `siegel` = `#0A8276`). Small türkis labels use `siegel-deep` for AA. |
| "till B1" | The hero now reads "From Guten Tag to B2, one stop at a time." (`astro-site/src/data/homepage.js`). |
| Motion | **The line board**: a HyperFrames loop under the hero (`components/linie/LineBoard.astro`) — the line draws itself, a train rides A1.1 → B2.2 and each stop shows a sentence of that level. Two compositions: `videos/hero-line` (1600×560) and `videos/hero-line-mobile` (1080×1350). Poster-first, plays only when on screen and when motion is allowed. |
| Higgsfield | Station illustrations (Recraft V4.1 vector, palette-locked): 4 of 8 generated, the rest blocked by the account's daily limit — see `station-art.md`. Placed once all eight exist. |

### Re-rendering the line board

```bash
cd videos/hero-line          # and again in videos/hero-line-mobile
HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium npx --yes hyperframes@0.8.122 check .
HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium npx --yes hyperframes@0.8.122 render . -q high -o ./renders/video.mp4
videos/encode-web.sh        # → public/motion/: MP4 (H.264), VP9 WebM fallback, poster still
```

GSAP is vendored in each project (`assets/vendor/gsap.min.js`) because the agent proxy blocks the CDN; the fonts are the site's own woff2 files.

## Not verifiable from this environment

- A real Lemon Squeezy payment, and the webhook granting access on live data (the functions-scope numeric variant ids). Owner decision 1 in `strategy.md` covers this.
- The real email-confirmation round trip, i.e. the signed-out buyer resuming checkout after confirming.
- A real phone (iOS Safari, Android Chrome), and the safe-area insets on a notch.
- GA4 ingestion: events are sent with `gtag` after consent, but the GA4 property was not inspected. The same goes for PostHog.
- Live Search Console impact of the new homepage title. GSC is unverified for this site.

## Owner decisions

The full list, with recommendations, is in [`strategy.md` §7](strategy.md#7-owner-decisions-each-with-a-recommendation). In short:
1. Confirm the checkout ids with a €0 test purchase.
2. Keep "Pro opens every level" for now (D1).
3. Decide the refund wording.
4. Swap the app font after #149 merges.
5. Pause agent edits to these four pages while the PR is open.
6. **Send the launch email.**
