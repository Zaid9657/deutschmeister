# Codex build brief, pass 2: no limits on the design (2026-11-08)

## The founder's words (verbatim, newest last)

- "deutschmeister should reach a much higher level similar to the level of medmeister , let codex do the redesign to not consume a lot of credits"
- "can we use a high model of codex but not the highest because we are consuming a lot of codex credits"
- "have no limits while enhancing the website"

## Where pass 1 left the site (commit 22a10a1, PR #254)

Pass 1 shipped:
- the route choice;
- labelled product proof below the fold;
- one course catalogue;
- the exam pages in Sie;
- grammar search;
- the FAQ index;
- system consolidation.

Read `build-report.md` and `report.md` in this folder.

**What it did not do:** the first screen still looks almost exactly like before. Compare:
- the home page's first screen, `.../scratchpad/after/home_d_fold.png`, with `.../scratchpad/shots/dm_home_d_fold.png`;
- MedMeister's first screens, `.../scratchpad/shots/mm-steps/home_d_00.png` and `preise_d_00.png`.

A visitor who lands on DeutschMeister today does not see a MedMeister-level site. Pass 2 closes that gap.

Scratchpad: `/tmp/claude-0/-home-user-deutschmeister/97df4863-0325-56c0-ac9f-9d9347a56d21/scratchpad/`. MedMeister's full pages, one viewport per step, are in `shots/mm-steps/<page>_{d,m}_NN.png`; study all the steps.

## What "no limits" now allows (founder's decision)

**Headlines and copy.** You may rewrite every headline, tagline and section on every public page, including the home hero.
- Keep the founder's tone (2026-11-01, verbatim): "state as the best website to learn german and hold this tone, be bold and confident and this is not medmeister, this is not for doctors, so lets make this website more live and more fun while giving trustworthiness".
- List every change in the report. No need to hold any back for approval.

**Visuals.** You may:
- redesign the first screen of every page, including the hero layout, typography scale and composition;
- build a product panel in the hero that shows the real app, in the way MedMeister's hero panel shows its dashboard (real course content from `src/data`, labelled as an example);
- add imagery, illustration and motion;
- finish or replace the station art (`astro-site/src/data/stationArt.js`; it is gated on all eight scenes, see `ART_COMPLETE`);
- use richer section rhythm, colour grounds and an editorial scale.

The October freeze on station art, scroll-craft and visual polish is lifted for this redesign by the founder.

**Palette and type.** You may evolve them, as long as everything still flows through `src/data/design-tokens.js` and its Astro twin. DeutschMeister keeps its own identity; it does not copy MedMeister's gold and serif look.

**Scope.** The whole public site, and the app chrome where the visitor first meets it:
- home, pricing, courses, each level page, exam pages, grammar, guides, FAQ, About, level test;
- signup and login visuals.

## What stays fixed

These rules protect the business; they do not limit the design.

**Prices and claims:**
- Prices and product keys come only from `src/data/pricing.js`; claims and limits only from `src/data/marketing.js`.
- Never invent counts, testimonials, outcomes or "the best" as an unprovable fact (UWG §5).
- Phrase boldness as ambition, a promise or a challenge to compare.
- Products that are off sale (telc package, B1 and B2 levels "Im Bau") stay honestly unavailable.

**Untouched:** checkout and payment logic, auth, redirects, entitlements, Netlify functions, migrations, legal pages and email templates.

**Language:**
- German copy speaks Sie.
- English pages stay English: "Sie" governs German copy only.

**Technical rules:**
- `CLAUDE.md` technical rules hold: tokens and their twin, no hex in Astro, one `<h1>`, the `data-rh` head-tag rule, the three-place route rule (better: add no routes).
- Essential content stays readable without JS and with reduced motion.

**Tests:** keep every existing test green. If a test pins an old design choice the founder has now overruled (for example a guard on the hero headline), update it deliberately and say so in the report. Never skip or weaken a money, claim, accessibility or route guard.

## Gates (run before you stop; all must pass)

```bash
npm run lint
node scripts/check-duplicates.mjs
npm test
rm -rf dist && npm run build && mv dist/index.html dist/app.html
GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" npm --prefix astro-site run build
node scripts/merge-site-builds.mjs && node scripts/prerender-spa-routes.mjs && node scripts/check-built-html.mjs dist
```

`.git` is read-only in your sandbox, so do not try to commit; Claude commits after re-running the gates.

Your sandbox cannot run a browser. Claude screenshots the result at 390 and 1440 and sends you any visual defects in a follow-up.

## Report

Append a section "Pass 2" to `docs/reviews/codex-design-gap-2026-11-08/build-report.md` with:
- what changed, per page;
- every headline change, old → new;
- tests you deliberately updated, and why;
- the gate results;
- what you would do next.
