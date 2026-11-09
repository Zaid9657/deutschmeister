# Codex build brief: redesign DeutschMeister to MedMeister's quality level (2026-11-08)

## The founder's words (verbatim)

1. "use codex official plugin in this chat and the goal to see how much is deutschmeister lagging in terms of the design to medmeister and to create a plan to redesign the whole deutschmeister website to be on a simillar level to medmeister"
2. "deutschmeister should reach a much higher level similar to the level of medmeister , let codex do the redesign to not consume a lot of credits"

**You (Codex) build the redesign end to end.** Claude only runs the final gates and opens the draft PR, so
do the work completely: implement, verify, commit.

## What "similar level" means

MedMeister's **quality bar**, not its look:
- craft and coherence;
- showing the real product right beside every promise;
- trust and proof placed beside the buttons;
- clear routes;
- a mobile layout that is designed, not stacked.

DeutschMeister keeps its own identity: turquoise/`siegel`, Archivo for commerce, Fraunces for editorial, the line metaphor, and its learner audience.

The founder's standing tone decision (2026-11-01, verbatim): "state as the best website to learn german and hold this tone, be bold and confident and this is not medmeister, this is not for doctors, so lets make this website more live and more fun while giving trustworthiness".
- Phrase "best" defensibly, as ambition, a promise or a challenge to compare.
- Never state it as an unprovable fact (UWG §5).

## Inputs

- **Your own gap review:** `docs/reviews/codex-design-gap-2026-11-08/report.md`. Its plan is the plan; build it.
- **MedMeister, full pages, re-captured correctly this time.** The earlier steps did not advance; these do, one viewport per step:
  - `/tmp/claude-0/-home-user-deutschmeister/97df4863-0325-56c0-ac9f-9d9347a56d21/scratchpad/shots/mm-steps/<page>_{d,m}_NN.png`
  - text in `.../scratchpad/mm-text.json`.
  - Study the below-fold sections before you design, especially:
    - `home_d_*`: problem scenes, each paired with a product panel;
    - `fspm_d_*`;
    - `preise_d_*`;
    - `simulation_d_*`.
- **DeutschMeister now:** `.../scratchpad/shots/dm_*` and `dm-text.json`.

## Your review's "one decision" is already answered

On 2026-11-02 the founder locked the business model, verbatim: "lets build it level by level", "from the beginning", "divide it to A1,1 and so on". So the lead buying journey is **the level path**:
- A1.1 is free, and it is the door;
- A1.2 is live and on sale;
- the next levels follow in order;
- exam preparation sits at the end of each full level (A1 exam after A1.2, and so on).

Exam pages stay as a secondary entrance. The telc package stays **honestly off sale**: never offer an unavailable product as buyable. Claude's reading, vetoable by the founder.

## Scope: the whole public site, in your phase order

1. **Phase 1 (money pages first):** home, `/pricing/`, `/courses/`, `/courses/<level>/`, `/pruefung/<slug>/`. Commit when green.
2. **Phase 2 (system consolidation):**
   - tokens (both twins identical), `components/ui/*`, linie/showtime CSS, chrome;
   - flatten resting shadows to hairlines;
   - use the motion tiers 140/220/420/800 ms;
   - no `transition-all` in touched primitives;
   - fix the floating intro button overlapping content.
3. **Phase 3 (product proof):**
   - build the level-journey, writing-feedback and speaking demonstrations from **real product UI**: compose the actual React/Astro components, or faithful static recreations of real screens with real course content from `src/data` (as MedMeister's hero panels do);
   - label every demonstration;
   - no fake testimonials, no invented numbers. Counts come only from measured content or `marketing.js`.
4. **Phase 4 (editorial and trust):** grammar index/topic, leitfaden index/template, FAQ, About.
   - On About, use the sanctioned founder wording from `src/data/marketing.js` and remove the contradiction.
   - If that is a brand-message change, list it in your report as "needs founder OK" instead of guessing.
5. **Phase 5 (presentation only):** the level test landing and results, and the signup/login/success visuals.
   - Make **no** auth, redirect, entitlement or payment logic changes.

Ship-ugly-first ordering applies: Phase 1 must be complete and green before you start Phase 2.

## Hard rules

Read `CLAUDE.md` first; it binds you.

**Data and money:**
- Prices and product keys come only from `src/data/pricing.js`; claims and limits only from `src/data/marketing.js`.
- Never retype a price. Never invent a count, a testimonial or an outcome.

**Design rules:**
- Hex values and font stacks live only in `src/data/design-tokens.js`, and its Astro twin stays byte-identical.
- No hex literals in Astro.
- Case colours only name grammatical cases.
- `siegel` is the one action colour.
- Only `rounded-pill` is wired.

**Language:**
- German copy speaks **Sie**.
- English pages stay English: "Sie" governs German copy only. Do not switch an English page's UI to German.

**Headings and routes:**
- One `<h1>` per page.
- Follow the `data-rh` head-tag rule.
- Follow the three-place route rule if you add a route; better, add none.

**Off limits:** prices, Lemon Squeezy, Netlify functions, auth, RLS, migrations, legal pages, email templates, the lesson player and exercise logic, `CLAUDE.md`.

**Brand message:**
- You may rewrite headlines and section copy to reach the quality bar.
- List every changed headline or tagline, old → new, in the report under "Brand message: needs founder OK". The founder approves on the PR.

**Content and motion:**
- Essential sales content must be readable without reveal animations, without JS, and with reduced motion.
- No new eight-scene illustration programme and no new scroll-craft (strategy freeze). Product captures and composition beat decoration.

**Tests:** keep every existing test passing. When you add a design rule, add its regression test.

## Gates (run from the repo root before each commit; all must pass)

```bash
npm run lint
node scripts/check-duplicates.mjs
npm test
npm run build && mv dist/index.html dist/app.html
GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" npm --prefix astro-site run build
node scripts/merge-site-builds.mjs && node scripts/prerender-spa-routes.mjs && node scripts/check-built-html.mjs dist
```

Prerender is not idempotent, so start each verification from a clean `dist/` (`rm -rf dist`).

If Chromium works in your sandbox, screenshot the changed pages at 390 and 1440 from a static server on `dist/`:
- check that there is no horizontal overflow;
- check that the h1 and the main CTA sit in the first viewport.

## Commits and report

- Work on the current branch, `claude/admiring-cerf-wmolgb`. Commit after each phase with a clear message.
- If the sandbox blocks `git commit`, leave the changes in place and say so in the report.
- Write `docs/reviews/codex-design-gap-2026-11-08/build-report.md`, covering:
  - what changed per phase (files);
  - gate results;
  - before/after notes;
  - the "Brand message: needs founder OK" list;
  - anything left undone, and why.
