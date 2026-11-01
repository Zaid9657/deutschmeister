# Codex review: design, buying psychology and copy for conversion (2026-11-01)

- **Asked by** the founder on 2026-11-01: "I want Codex to take over from here and evaluate the whole design of the website, the psychological factor and the copywriting, in the context of increasing sales and conversion."
- **Run:** Codex CLI 0.166.0, GPT-6-Astra at max reasoning, read-only sandbox.
- **Evidence:** the built site from `main` (1d40c792), served locally and signed out, with Supabase and analytics blocked:
  - 36 screenshots of 12 money pages, desktop and mobile;
  - the visible text of each page;
  - [FACTS.md](FACTS.md);
  - the 2026-10-26 Codex sales evaluation (draft PR #234) as a baseline.
- **Files:** [BRIEF.md](BRIEF.md) (the prompt), [report.md](report.md) (Codex's answer, unedited apart from link paths). This README is Claude's fact-check and ranking.

## Codex's verdict

- **Scores:** design 6/10, buying psychology 3/10, copy 5/10.
- **Biggest reason the site does not sell:** it promotes free exploration while the dedicated exam offer is unavailable and unproven.
- **Honest limit:**
  - $1M a month needs about 4,660 sales at €249, or 179,000–310,000 qualified visits a month.
  - At today's traffic, the conversion fixes together add only about €10–20 a month.
  - The money is in opening the sale and in bringing qualified buyers to the site.

## Fact-check (Claude, against `main` and the page text)

| Claim | Check |
|---|---|
| The telc page shows "89,00 €" and "Der Kurs startet in Kürze", while the approved pilot price is €149 | ✓ `page-text.json`; [pricing.js:81](../../../src/data/pricing.js#L81) `COURSE_TELC_B1_PRICE_EUR = 89`. The €149 rename stays an owner Lemon Squeezy step (million plan, move 1) |
| The unsupported claim "Die meisten fallen nicht durch, weil ihnen Grammatik fehlt …" | ✓ on the telc page; no source in the repo |
| FAQ: "Pro ist die Bibliothek … Der Kurs ist der Plan darüber" | ✓ |
| `/courses/`: "Each sub-level is a complete course" | ✓ text found. The contradiction "B1/B2 under construction" was **not** found in the page text; the availability wording is unverified |
| Free course: "Nothing here locks", next to lessons that open in order; "263 words" | ✓ both found |
| The signup return path keeps course paths but drops exam-task paths | ✓ [returnPath.js:17](../../../src/lib/returnPath.js#L17) accepts `/course/...` only |
| Operator fields are empty | ✓ [legal.js](../../../astro-site/src/data/legal.js) (an intentional release blocker) |
| telc writing task has 3 Leitpunkte while the guide teaches 4 | ✓ [writingTasks.js:27](../../../src/data/writingTasks.js#L27): three Leitpunkte. This is a product defect, exempt from every freeze |
| **Overridden:** use a singular founder line | ✗ The founder decided "a team of doctors" (owner decision in draft PR #234). Codex worked from the brief's "solo founder", so fix 11's founder half is dropped |
| **Added by Claude:** the telc sales page speaks *du* ("Du weißt, dass du üben musst") | The course and mail speak *Sie* (CLAUDE.md). Codex's rewrite already uses *Sie* |

## Claude's ranking: what agents can ship without an owner decision

Ranked by € per hour at today's traffic, then by what matters once buyers arrive. Every euro figure is a model, not a forecast.

| # | Fix (Codex #) | Where | Hours | Why first |
|---|---|---|---|---|
| 1 | telc page rewrite (2 + 7). **Copy:** Sie throughout, an honest "derzeit nicht buchbar", the unsupported failure claim removed. **Content:** programme activities instead of grammar weeks, one labelled demonstration correction | `astro-site/src/pages/telc-b1-komplettvorbereitung.astro` | 3 + 8 | The only exam offer page: removes false and unsupported copy, makes the premium tangible |
| 2 | telc writing tasks get the 4th Leitpunkt (product defect) | `src/data/writingTasks.js` | 2–3 | The paid product must match the real exam; credibility for every partner demo |
| 3 | Guide → telc plan CTA (1) | `astro-site/src/pages/leitfaden/[slug].astro`, `guides/telc-b1.js` | 2 | Turns the 10 exam pages (#232) into a path to the offer |
| 4 | Signup form above the fold on mobile (4) | `src/pages/SignupPage.jsx` | 2 | Fewer lost signups on mobile, 54% of September search clicks |
| 5 | Pricing: paid choices first on mobile (9) | `astro-site/src/pages/pricing.astro` | 2 | The price is visible before the free card |
| 6 | Level test: start button under the headline (13) | `src/components/LevelTest/LevelTestLanding.jsx` | 2 | Less reading before the first action |

## Owner decisions this review raises (one at a time, on the board)

- **The telc package price on sale:** €89 in code vs €149 approved; reconcile checkout and access (Codex 3).
- **Home headline rewrite** (Codex 12): brand message.
- **Consent banner copy** (Codex 10): consent wording.
- **Exam-task return paths** after signup (Codex 5): changes access flow.
- **Funnel denominator** (Codex 15): a new public endpoint (controller c4).

## Part 2 (same day): leak, onboarding, REA targets, open-source tools

- Founder's words: "make the colours better . and plan ideas to introduce the website to the user in the best way to increase trustworthiness and conversion (videos , onboarding, etc) identify where are we losing the customers and where the leak is hapenning and investigate it . also what are the best apps or websites to use REA repo on to learn from and take inspiration and to copy , etc . Also investigate open source tools that we can implement that are relevant for tutoring , simulation , speaking , language learning , etc" and "work with codex together".
- Claude measured the 90-day funnel: [FUNNEL-90d.md](FUNNEL-90d.md). Codex (GPT-6-Astra, max) wrote the plan: [plan-leak-onboarding-tools.md](plan-leak-onboarding-tools.md). Claude spot-checked its code citations (trial windows, TrialBanner expiry, firstRun exits, speaking providers, review ladder): all hold.
- The clickable "$1M-look" preview (home + telc page, v3 colours) lives as a private artifact; its decisions are in [preview-NOTES.md](preview-NOTES.md).
- Honest arithmetic from the plan: all conversion fixes together are worth about €20/month at today's 62 signups a month, about €200 at 10x. They matter once buyers arrive; the sale and distribution come first.

## Part 3 (same day): competitor study

- Founder's words: "what are the best apps or websites to use REA repo on to learn from and take inspiration and to copy". REA's browser provider was unavailable in the session, so Claude captured the first screens with Playwright (mobile 390px + desktop; Babbel, Babbel prices, Speak, Duolingo, Busuu, Praktika, Lingoda (403), Seedlang, ELSA, vhs-Lernportal) and Codex wrote [competitor-study.md](competitor-study.md) with scores, three experiments and a 30-day social-proof list. Screenshots: `competitor-shots/`.

## Part 4 (same day): Codex built the plan's three tracks

- Founder's words: "do what i told you above". Three Codex builds (GPT-6-Astra, workspace-write sandboxes, one git worktree each) ran in parallel from [build/COMMON.md](build/COMMON.md) plus one brief per track; Claude imported the commits, re-ran every gate and opened the PRs.
- **Track A, selling pages** ([brief](build/track-a-brief.md), [report](build/track-a-report.md)): telc B1 page rewrite with a labelled demonstration correction, 4 Leitpunkte in the writing task, guide CTAs, mobile order on pricing, level test and signup. Merged as #246.
- **Track C, first useful minute** ([brief](build/track-c-brief.md), [report](build/track-c-report.md)): goal-matched onboarding exit, real microphone check, confirmation copy with the exact address and subject, cross-browser continuity behind `VITE_AUTH_CONTINUITY_ENABLED` (default off). PR #247. Claude put the confirmation panels back into English after the merge with #246 showed a mixed-language page.
- **Track B, post-trial window** ([brief](build/track-b-brief.md), [report](build/track-b-report.md)): saved-work return card after the trial, 14/30/60-day follow-ups and durable dunning retries behind flags (default off), draft migration (not applied), read-only payment-recovery SQL. PR #248. Owner decisions it raises are on the board.
- Honest expected effect (plan model, not a forecast): all three tracks together about €20–35/month at today's volume. They matter once buyers arrive.
