# Business scorecard — 2026-09-27

**Overall: 33 / 100.** The product and the engineering are strong (7–8/10). The business
isn't working yet (1–2/10). Almost no new people are arriving, almost nobody who signs up
starts a lesson, and no course has been sold to a real customer.

All figures were measured on 2026-09-27 unless marked otherwise. Sources: live Supabase SQL
(`weekly_truth_metrics()`, `auth.users`, `subscriptions`, `purchases`, `webhook_logs`,
`xray_usage`, `lifecycle_customer_state`), Resend account metrics, Lighthouse run on a local
production build, and `docs/seo-routines/baseline-2026-09-22.md`.

| Area | Weight | Score | One-line reason |
|---|---|---|---|
| Revenue & monetization | 25% | **1** | MRR €32.97 from 3 payers; 0 real course sales; 0 new subscriptions in 31 days |
| Distribution & acquisition | 25% | **2** | Signups down ~40%; organic search is brand-only; no social channel is running |
| Activation & retention | 15% | **2** | 8–10% of signups ever start a lesson; 0 finished Lektionen in the rebuilt A1.1 course |
| Owned audience (email) | 10% | **4** | 1,148 confirmed emails get a daily email, but it isn't measured and the launch email was never sent |
| Product & content | 15% | **7** | A1.1 is built to a high standard; mock exams and AI tools exist; paid levels still run on the older content |
| Site tech & performance | 10% | **8** | Astro pages score 86–100 on Lighthouse; CI is thorough; the SPA is heavy |
| **Weighted total** | | **3.3 / 10** | |

---

## 1. Revenue — 1/10

- **MRR: €32.97** from 3 paying subscriptions. It was €55.15 on 2026-09-21 and €45.16 on
  2026-09-07. A further 3 subscriptions are `past_due` or `unpaid`, worth about €33/month
  if they are recovered.
- **Lifetime revenue: about €203 gross** across 18 `subscription_payment_success` webhooks
  since April. Over the same period there were **42 `subscription_payment_failed` events**.
- **Course sales: 0 real.** The only two rows in `purchases` are the owner's own €0 test
  (order 9377799) and an owner grant. The courses have been buyable since 2026-09-03.
- **New subscriptions: 0 since 2026-08-27.** The last `subscription_created` webhook
  arrived that day. The one row created since, on 2026-09-13, is a €0 comp.
- **Distance to goal:** €10k/month is about 300× the current MRR.

## 2. Distribution & acquisition — 2/10

**Signups per week**
- June–August averaged about 43.
- The last three weeks: 46, 22 and 30.
- 164 signups in the last 30 days.

**Where signups come from.** Attribution went live on 2026-09-22. Since then, 14 of 17
signups came from search, and 13 of those 14 landed on `/`. That means people searching for
the brand, not people discovering the site through a grammar page.

**Organic search** (baseline of 2026-09-22):
- 22 ranked keywords in Germany.
- None of the 20 target queries is in the top 30.
- 11 referring domains, 10 of them spam directories.

**Search Console:** the `deutsch-meister.de` property is still not verified on the connected
account, so there is no impressions or indexing data.

**Social**
- The 50-post pack (`public/social/ig/`, starting 2026-10-01) isn't scheduled. The account
  IDs in its Routine are still placeholders.
- The 14 TikTok/Telegram pieces written on 2026-09-03 are still unposted.

**The one bright signal: anonymous Sentence X-Ray use jumped about 25×.**
- It went from 5–13 analyses a day to 150–350 a day, starting 2026-09-14.
- Over the last 14 days: 3,392 analyses from 1,447 distinct IPs, covering 948 distinct
  sentences.
- There is almost exactly one anonymous id per analysis. So either nearly every visitor
  tries one sentence and leaves, or something is calling the function without the SPA's
  persisted id.
- The source is unknown, and signups did not rise with it.
- Either way it is the widest top of the funnel the site has. It is also an AI cost line.
  **Find out where it comes from and put an offer in front of it.**

## 3. Activation & retention — 2/10

- `lifecycle_customer_state`: 174 of 1,685 accounts have ever done a lesson (10%). For
  signups in the last 30 days it is 13 of 164 (8%).
- The rebuilt A1.1 course has had 4 learners ever and **0 completed Lektionen**.
- Grammar users in the last 7 days: 3. Speaking users in the last 30 days: 32.
- Writing submissions ever: 0. Mock-exam attempts ever: 5.

## 4. Owned audience (email) — 4/10

- 1,148 confirmed addresses.
- Resend sent **29,500 emails from `deutsch-meister.de` in 30 days**, mostly the daily
  sentence to every confirmed user. Bounce rate was 1.95%, with no complaints.
- **Open and click tracking are off**, so the biggest channel the business owns is
  unmeasured.
- The course launch sequence is written (`drafts/send-launch-email-1.sh`,
  `drafts/launch-sublevel-courses-2026-09.md`), but nothing in the repo shows it was ever
  sent. Its precondition is still open: a €0 test purchase of a sub-level course.
- `weekly_metrics` has no row for 2026-09-14. That week's truth run didn't store anything.

## 5. Product & content — 7/10

**What's strong**
- A1.1 is rebuilt to `docs/course-standard-2026-09-12.md`: 12 Lektionen, a 9-step lesson
  player, checkpoints and spaced review. It closed at 0 BLOCKER / 0 MAJOR after 23 DaF
  reviews.
- 84 grammar topics.
- Mock exams for Goethe B1, DTZ and telc B2.
- AI speaking, writing feedback and Sentence X-Ray.

**What's weak**
- The only course built to the new standard is A1.1, which is the **free** level.
- A1.2 is paused. The paid levels (A1.2 €40, A2.1 and A2.2 €50) still sell the older
  grammar content.
- B1 and B2 are "coming soon".

## 6. Site tech & performance — 8/10

**Lighthouse, mobile.** Median of 3 runs on a local production build. These are lab numbers
with no CDN, so they reflect page weight, not field Core Web Vitals. The PageSpeed API
returned 429 from this sandbox.

| Page | Perf | A11y | BP | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 100 | 96 | 100 | 100 | 1.35s | 0.03 |
| `/pricing/` | 86 | 100 | 100 | 100 | 3.00s | 0.18 |
| `/grammar/a1.1/definite-articles/` | 97 | 100 | 100 | 100 | 1.35s | 0.11 |
| `/courses/a1-1/` | 94 | 100 | 100 | 100 | 3.04s | 0.00 |
| `/leitfaden/telc-b1/` | 89 | 100 | 100 | 100 | 2.66s | 0.17 |
| `/level-test/` (SPA) | 79 | 100 | 100 | 100 | 4.24s | 0.00 |
| `/dashboard` → `/login` | 68 | 91 | 96 | 66* | 2.61s | **2.00** |

\*The SEO 66 is the intended noindex. The whole build and all of CI pass, and
`check-built-html` checks 138 pages with 0 failures.

**The five fixes worth making, largest first:**
1. **`vite.config.js:13`** puts `lucide-react` in a manual chunk, which defeats
   tree-shaking. `vendor-ui` ships 757 KB raw / 148 KB gzip; about 625 KB of that is icons
   the app never imports.
2. **Google Fonts** (Fraunces 67 KB and Nunito Sans 31 KB) are about 98 of the 144 KB on
   each Astro page. When they swap in, the layout shifts (CLS 0.11–0.18) and `.hero-line`
   and `.reveal` are held back. Self-hosting them with `size-adjust` fallbacks would take
   `/pricing/`, the course pages and the guides to about 100.
3. **`src/main.jsx:16`** uses `createRoot`, which throws away the prerendered HTML. The LCP
   of the SPA's prerendered routes then waits for about 313 KB of JS.
4. **The SPA entry chunk** is 317 KB raw, of which 160 KB is `src/data` (topics, writing
   tasks, mock exams). The paused A1.2 draft (66 KB) ships alongside A1.1.
5. **The `/dashboard` → `/login` redirect** has CLS 2.0 because the Footer's `mt-20`
   collapses while `<main>` is empty.

---

## What would move the score

The build side is ahead of the business side. Most of the last ~60 commits went into
polishing A1.1, which is the free level. Over the same period signups fell and no course
sold. More product work won't move the score; getting in front of learners will.

In order of money per hour of effort:
1. **Send the course launch email to the 1,148 confirmed users.** It is already written.
   It needs one €0 test purchase first, and nothing else.
2. **Put a signup and course offer on the X-Ray result, and find where the X-Ray traffic
   comes from.** About 250 people a day currently leave after one sentence.
3. **Recover the 3 failing subscriptions.** Check that Lemon Squeezy's dunning emails are
   on. That is about €33/month, the same as current MRR.
4. **Switch on the 50-post social pack** before 2026-10-01: create the accounts and fill in
   the IDs.
5. **Verify `deutsch-meister.de` in Search Console**, then turn on Resend click tracking so
   the daily email can be measured.
