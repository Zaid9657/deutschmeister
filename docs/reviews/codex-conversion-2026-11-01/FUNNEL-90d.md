# DeutschMeister funnel, last 90 days (Supabase, read 2026-11-01; test rows excluded where possible)

| Stage | Users | Share of previous |
|---|---|---|
| Signed up | 374 | — |
| Confirmed email | 224 | 60% (150 never confirm; 17 of the 224 took more than 1 h) |
| Finished onboarding | 188 | 84% of confirmed |
| Used any tool at least once | 102 | 46% of confirmed (122 confirmed accounts never used anything) |
| …speaking 60 (19 of them produced 0 turns: mic/flow failure or bounce), X-Ray 69, grammar 41, mock exam 13, course lesson 8, writing 6 | | |
| Active on 2+ different days | 35 | 34% of users |
| Active on 5+ days | 4 | 11% of 2-day users |
| Paid (new subscriptions 4, course 1) | 5 | 1.3% of signups; 2.2% of confirmed |
| Failed renewal payments in 90 days | 19 | existing subscribers lost to card failures |

Other facts: 62 signups in the last 30 days, 37 from Google (mostly brand searches); 31 chose an exam track; only 6 profiles ever carry an exam date; 0 exam packages sold ever (telc package off sale, €89 shown vs €149 approved); 9 of 12 historical payers paid 20–129 days after their trial ended; the trial is 7 days.

Measurement gaps: no checkout-start count (PostHog not readable server-side), no server-side offer-view counter, guest learning (A1.1 without account, level test) invisible.
