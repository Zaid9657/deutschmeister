# DeutschMeister live facts (read 2026-10-31 22:53 UTC and 2026-11-01, Supabase project omqyueddktqeyrrqvnyq, test mode excluded)

North star (founder, 2026-10-31): 1,000,000 USD in DeutschMeister sales per month, after VAT and refunds,
by February 2027 (~EUR 877k/month at EUR/USD 1.14; ~4,670 package sales/month at EUR 249).

## Sales, last 30 days
- Gross EUR 64.46: 2 Pro renewals (EUR 11.09 on 10-13, EUR 9.99 on 10-15), 1 A1.2 course (EUR 43.38 on 10-14).
- VAT EUR 4.48, refunds EUR 0, net EUR 59.98 (~USD 68). Lemon Squeezy fees: not exposed by API.
- New subscriptions in 30 days: 0 (last one 2026-08-27). Exam packages ever sold: 0 (telc package off sale).
- Failed payments in 30 days: 6. Live Lemon Squeezy subscriptions: 2 active, 2 unpaid, 1 cancelled, 7 expired.
- Lifetime: ~EUR 268 revenue; ~11-13 distinct real payers ever (data audit 2026-10-27).

## Funnel, last 30 days
- Signups 62 (43 confirmed email). First touch: google 37, untracked 11, bing 5, chatgpt.com 4, temp-mail 2, brave 1, duckduckgo 1, ecosia 1.
- 31 of 62 signups chose an exam track at onboarding. Only 6 profiles ever carry an exam date.
- Search Console, September: 808 Google clicks, at least 67% brand searches ("deutschmeister"); countries Indonesia 352, Germany 100, India 47; mobile 438, desktop 331.
- Qualified offer views and checkout starts: NOT measured (no server-side counter; PostHog not readable server-side).
- Earlier measures: 9 of 12 payers ever paid 20-129 days after their trial ended; 38% of accounts never confirm email (confirmation rate 67% Sep, 73% Oct).
- About 1 in 3 signups who use any tool come back on another day (grammar 33%, X-Ray 29%, speaking 34%).

## Prices (src/data/pricing.js is the only source; never retype)
- Pro EUR 9.99/month or yearly; sub-level courses one-time; telc B1 package approved at EUR 149 pilot (off sale, kept in Draft until the legal/release gate passes); EUR 199-249 arms later.

## Constraints (CLAUDE.md, owner-only)
- Prices, refunds, guarantees, legal text, brand messages (posting), entitlement/quotas, new public endpoints: owner decisions.
- Claims and counts must come from src/data/marketing.js / measured content counts; no invented usage numbers, testimonials, urgency or outcome promises (UWG).
- Course copy speaks Sie; design tokens in src/data/design-tokens.js; siegel is the one action colour.
