You are a senior conversion strategist, buying-psychology specialist and direct-response copy chief, evaluating DeutschMeister (deutsch-meister.de) for its founder. READ-ONLY: change no files, run no network calls.

## The business and the goal
- DeutschMeister is a German-learning web app (A1.1–B2.2) with exam preparation for telc, Goethe and DTZ. It is run by a solo founder, a physician in Germany.
- **North star (founder, 2026-10-31): 1,000,000 USD in sales per month by February 2027.** That is about €877k a month after VAT and refunds.
- **Today:** about €60 a month after VAT and refunds; 0 new subscriptions since 2026-08-27; 0 exam packages ever sold.
- Every recommendation must say which sales number it moves (visitor→signup, signup→checkout, checkout→paid, price per buyer, repeat or referral) and roughly by how much, in euros, with the assumptions stated.

## Your task
Evaluate the whole website as a selling machine, on three lenses together:
1. **Design and UX of the buying path:** first screen, visual hierarchy, CTA clarity and count, mobile, friction, cognitive load, trust signals, the path from landing to checkout.
2. **Buying psychology:** the buyer's job-to-be-done and fears (exam date, residence permit, job, naturalisation), motivation, risk reversal, social proof, authority, specificity, anchoring and price framing, decision fatigue, loss aversion, commitment and consistency, the "why now". Only ethical, truthful levers: no invented urgency, scarcity, testimonials, usage counts or outcome promises (German UWG).
3. **Copywriting:** headline and subhead promise, clarity versus cleverness, benefit versus feature, the buyer's own words, language choice (English vs German for each audience), voice, CTA wording, objection handling, page-to-ad message match.

Cover at minimum: home (/), /pricing/, the telc package page (/telc-b1-komplettvorbereitung/), /signup, /level-test/, the exam guide pages (/leitfaden/*), /courses/, /vergleich/, /ueber-uns/ and the free course (/course/a1.1).

## Evidence (all local)
- `(local evidence pack) INDEX.md` lists everything.
- `(local evidence pack) FACTS.md`: live numbers.
- `(local evidence pack) shots/*.png`: screenshots of the built site, desktop and mobile. **Open and look at them.**
- `(local evidence pack) page-text.json`: the visible copy of each page.
- `(local evidence pack) prior/`: the 2026-10-26 Codex sales evaluation, score 40/100, with its offer, positioning, trust, conversion, language and design aspects and a blind clean-sheet design. **Do not repeat it.**
  - Read it after forming your own first view.
  - Then say where you agree, where you disagree, and what it missed on design, psychology and copy.
  - Say what changed on the site since then, if anything.
- The repo at `/home/user/deutschmeister`. Read `CLAUDE.md` first. Copy lives in:
  - `astro-site/src/pages/**` and `astro-site/src/layouts/Layout.astro`;
  - `src/data/marketing.js`, `src/data/pricing.js` and `src/data/offers.js`, plus their Astro twins;
  - `src/pages/**` (SPA).

## Standards
- **Evidence for every claim:** a screenshot file name, a quoted line from page-text.json, a `file:line` in the repo, or a FACTS number. Otherwise write "unverified".
- **Be blunt and specific.** For every problem, give the exact replacement copy or layout change, not "improve the headline". Write German copy where the audience is German-speaking.
- **Respect the constraints in CLAUDE.md:**
  - prices only from `pricing.js`; claims only from `marketing.js`;
  - course copy speaks Sie;
  - design tokens are fixed (`siegel` is the one action colour).
- Tag each recommendation [agents] if it is a normal PR, or [owner] if it touches prices, guarantees, legal text, brand posting, entitlement or new endpoints.
- Traffic is about 2 signups a day, so conversion fixes move little money until traffic grows. Say honestly which fixes matter at today's traffic and which only pay at scale.

## Output (Markdown, 2,000–3,000 words)
1. **Verdict.**
   - Scores 1–10 for design, psychology and copy, each with a one-paragraph justification.
   - The single biggest reason the site does not sell today.
2. **The buyer.** Who actually lands here today, from the FACTS (countries, brand search, devices); what they want; what they fear; what makes them pay.
3. **Findings**, most costly first. For each: what it is, the evidence, the psychological or design mechanism, and the euro cost (with assumptions).
4. **Rewrite pack.** The exact new above-the-fold copy for each page:
   - home, pricing, telc package, signup;
   - plus the CTA labels;
   - in the language each page's audience reads.
5. **Ranked fix list (top 15).** Order by expected € per hour of work. For each: change, exact file/location, mechanism, expected effect, effort in hours, [agents]/[owner], and a measure/kill rule.
6. **Agree / disagree with the 10-26 evaluation.**
7. **What you could not verify,** and how to verify it.
