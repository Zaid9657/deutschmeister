# DeutschMeister: the transformation plan (2026-11-11)

Asked by the founder on 2026-11-11: "the website is not working and not selling and not having any
courses yet and it is not a million dollar website, i want you to create a whole detailed plan to
transform the website."

Every number below was read today from production (Supabase, Lemon Squeezy) or from a named source.
Prices, legal steps and anything posted under the brand stay the founder's decisions.

## 1. Bottom line

The site has four problems, and the design was never one of them:

1. **Few people arrive, and fewer every month.**
2. **Those who arrive do not stay.** Nine in ten never come back for a second day.
3. **The people who arrive want B1 exams, and we sell them a beginner course.**
4. **Almost nothing can be bought**, and today nothing new can be bought at all.

The plan fixes them in the order money needs: open the till, give the arriving buyers their product,
stop the leak, fill the catalogue, then pour in reach. Reach comes last on purpose: traffic sent into
a site that keeps 1 visitor in 10 is wasted.

## 2. Where the site really stands

### Reach is shrinking

| Month (2026) | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov (11 days) |
|---|---|---|---|---|---|---|---|---|---|
| Signups | 430 | 184 | 363 | 205 | 190 | 164 | 155 | 66 | 29 |

- Signups fell about 85% from March to October.
- In the last 90 days, Google brought 83 tracked signups, ChatGPT 8, and our own social accounts 0.
- Instagram has 65 followers and Telegram 4 (board, 2026-11-07). The reels get views and no signups.

**Search Console, read on 2026-11-11 (added after the plan was first written):**

| Month (2026) | Mar (from 6th) | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov (1–9) |
|---|---|---|---|---|---|---|---|---|---|
| Search clicks | 222 | 384 | 1,417 | 1,041 | 916 | 721 | 784 | 532 | 163 |
| Impressions | 525 | 1,416 | 4,379 | 6,101 | 5,193 | 7,198 | 5,551 | 5,952 | 3,156 |

- **Search did not cause the fall.** March had 428 signups on only 222 search clicks, so most early
  signups came from somewhere else, and that source has stopped. Which source is not recorded:
  tracking began in September. The founder knows.
- **Search is almost only our own name.** The top query is "deutschmeister"; people who already heard
  of us type it in. Clicks peaked in May and have fallen each month since.
- **Google shows us more and clicks less.** Impressions grew twelvefold while the click rate fell
  from 42% to 9%: we now appear for learning topics, but too low on the page to be chosen.
- **Only 33 of 184 known pages are indexed.** 96 are "discovered, not indexed" and 27 "crawled, not
  indexed". Google does not yet think the site is worth crawling fully; that is fixed by links and
  by pages people search for, not by a setting. No manual action, no security issue.
- Of October's 532 search clicks, about 41 became tracked Google signups (8%). The page converts
  visitors to signups well; there are too few visitors.

### The product does not hold people

Everyone who signed up since the guided course launched (2026-09-12):

| Step | People | Share of signups |
|---|---|---|
| Signed up | 165 | 100% |
| Confirmed their email | 126 | 76% |
| Finished onboarding | 90 | 55% |
| Did any learning at all | 71 | 43% |
| Came back on a second day | 16 | 10% |
| Still active a week later | 7 | 4% |
| Bought something | 1 | 0.6% |

- The A1.1 course: 38 people ever started lesson 1, 11 finished it, 1 reached lesson 12.
- The paid A1.2 course has had 1 learner.
- We sell the second half of a course whose free first half almost nobody finishes.

### The wrong product for the people who come

In the last 90 days, 108 of 351 signups named an exam:

| Exam they chose | Signups |
|---|---|
| Goethe B1 | 51 |
| telc B2 | 13 |
| telc B1 | 10 |
| DTZ | 8 |
| Goethe A2 | 10 |
| Goethe A1 | 16 |

- 82 of the 108 want a B1 or B2 exam. Only 16 want A1.
- What we sell: one A1.2 course and an A1 exam pack.
- A B1 exam has a date and a consequence (residence, citizenship, a job). That is why people pay.
  A beginner compares us with free apps.

### Almost nothing to buy

- Guided courses built: A1.1 (free) and A1.2 (€40). A2.1 to B2.2 show "Coming next".
- The three new offers (€59, €89, €199) exist in Lemon Squeezy since today, but the live pages still
  say "Not on sale yet" until one Netlify deploy.
- The telc B1 package is built and has been off sale for weeks, waiting on a legal check.
- Money so far: 3 course orders ever, 4 active subscriptions, 0 sales in the last 7 days.
- Checkout adds VAT on top: the October buyer of the "€40" course paid €43.38.

### What is already strong (we are not starting from zero)

- A practice library across all 8 levels: 84 grammar topics, 1,614 exercises, 480 listening dialogues.
- Practice tests already written for Goethe A1, A2, B1, telc B1 (two forms), telc B2 and DTZ.
- AI feedback on writing and speaking, which works: 26 new users tried speaking, 10 writing.
- A course standard and a factory that built A1.2 in about two weeks.
- A new design, an offer ladder, checkout, access rules and a webhook, all tested.

## 3. The market we should stand in

- 363,466 people started a state integration course in 2024 (BAMF).
- Only 58.6% of them reached B1 in the final test in 2024, and 57.8% in 2025 (BAMF). About four in
  ten must try again.
- 292,020 people were naturalised in 2024; the rule is B1.
- State course funding is reported to shrink from about €1 billion in 2026 to about €650 million in
  2027, with narrower access. More people will have to pay for their own preparation.
- Price room: Goethe's own exam preparation costs €289–389; apps cost €60–70 a year.

**Size of the prize, said once.** Easy German, the largest creator-led German business, shows 10,103
paying members from $5.50 a month (its Patreon page, found by search today). $1M a month is far beyond that, so it is a
destination that needs school and employer contracts on top of single sales. The million plan's
evidenced case for a B1 exam product is about €36k a month (base) to €90k (aggressive). This plan
aims at the first €10k month, which every later step depends on.

## 4. The one strategic decision

**Recommendation: sell to B1 exam candidates first, and keep the beginner path as the free door.**

| | B1 exam candidates first (recommended) | Beginners first (today) |
|---|---|---|
| Who already arrives | 82 of 108 exam signups | 16 of 108 |
| Why they pay | A dated exam with consequences | A wish; free apps compete |
| Price the market accepts | €149–249 (Goethe charges €289+) | €40–89 |
| What is already built | 4 practice tests, a 4-week telc plan, AI feedback | A1.1, A1.2 |
| What is missing | The legal check, packaging, a second retest | The whole path A2 to B2 |
| Risk | Needs the counsel step done | Slow: sales wait on six more courses |

This changes the founder's choice of 2026-11-09 ("first visitor: beginners"). The beginner home page
stays; it gains a second, equal door for exam candidates.

## 5. The transformed site (what a visitor will see)

1. **Home asks one question first: "What do you need German for?"** Two doors: "I have an exam
   date" and "I am starting from zero". Each door leads to its own page, offer and first task.
2. **A free graded task before signup.** The exam door ends in one real writing task, marked by the
   AI in a minute, with the result and the matching offer. The beginner door keeps the first-sentence
   exercise.
3. **A catalogue that is visibly full.** Every level shows what is ready today (its practice library)
   and the date its guided course opens, instead of six cards that say "Coming next".
4. **Proof on every selling page.** The founder's own story (a doctor who had to pass German exams
   to work here), learner results as they come, and a sample of real AI feedback.
5. **Buying works and costs what the page says.** VAT included, one click from offer to checkout.
6. **After signup, the learner lands on their own goal.** An exam chooser starts with their exam's
   first task, never with the A1 alphabet.
7. **The app looks like the site.** Lesson pages take the new design.

## 6. The work, in five phases

Codex builds, Claude checks and ships, the founder decides and does the owner-only clicks.

### Phase 0: open the till (this week, by Nov 17)

Moves: the three new offers become buyable.

| Step | Who |
|---|---|
| "Clear cache and deploy site" in Netlify | Founder, 1 minute |
| Confirm the three Buy buttons are live | Claude |
| One real test purchase, check access and the success page | Founder buys, Claude verifies |
| Switch the store to VAT-inclusive prices | Founder, 2 minutes (prompt in `docs/owner-prompts.md`) |
| Deactivate discount code G2MZI2MA (100% off, no limit, no expiry) | Founder, 1 minute |
| Search Console numbers for this session | Done 2026-11-11 (read through Claude in Chrome) |
| Book the lawyer and tax adviser (operator, FernUSG, side business) | Founder; open since Oct 31 |

Done when: one paid order runs end to end, and prices at checkout match the page.

### Phase 1: the B1 exam product (Nov 18 – Dec 15)

Moves: something to buy for the 82 exam signups; first sales at €149+.

1. **Package "B1 Exam Pack"** from what exists: the practice tests (telc B1 two forms, Goethe B1,
   DTZ), the 4-week plan, AI-marked writing and speaking tasks. One product, three exam variants.
2. **Build what is missing:** a second unseen retest per exam, and the result question after the
   exam date (so we can show pass results).
3. **Check the AI marking:** a paid German teacher blind-marks 20 letters; at most 2 may differ by
   more than one band. Budget about €150–300 (founder approves).
4. **The exam door:** home door, exam landing pages, and the free graded task before signup.
5. **Onboarding by goal:** exam choosers start on their exam's first task.
6. **Email the 108 exam signups** with the offer (founder approves the text: brand message).
7. **Price:** founder decides; the million plan's pilot price was €149.

Done when: 10 paid B1 orders, or 300 offer views with fewer than 3 sales (then change the package
once, not the price).

### Phase 2: stop the leak (Nov 18 – Dec 8, in parallel)

Moves: second-day return from 10% to 30%; lesson-1 completion from 29% to 60%.

1. **Find where lesson 1 loses people** (27 of 38 did not finish it): read the attempt logs step by
   step, then cut or reorder the step where they stop.
2. **A first win in five minutes:** the first session ends with the learner having written and
   spoken one real sentence and seen it corrected.
3. **Learning before the signup wall:** a guest finishes the first lesson, then saves progress.
   The guest mode exists; make it the default path from both doors.
4. **A dated plan on day one:** "Your exam is on 14 March: 30 minutes a day, here is today."
5. **Day-2 and day-4 mails that link to the exact next task.** The mail system exists; the content
   becomes goal-specific.
6. **Close the three A1 gaps** behind the "10 times more efficient" promise: switch on spaced
   review (one database step by the founder), real voice audio, and a measured hours-to-finish figure.
7. **Measure it:** one weekly table of the seven funnel steps in section 2.

Done when: of 100 new signups, 30 return on a second day and 15 are active a week later.

### Phase 3: fill the catalogue (Dec 1 – end of March)

Moves: a complete path to sell; All-Access Pass (€199) becomes worth its price.

| Guided course | Opens (target) | Exam pack at the end of the level |
|---|---|---|
| A2.1 | Dec 22 | |
| A2.2 | Jan 19 | Goethe A2 pack (test exists) |
| B1.1 | Feb 16 | |
| B1.2 | Mar 16 | B1 Exam Pack (from Phase 1) |
| B2.1, B2.2 | Decide in March from sales | telc B2 pack (test exists) |

- One course every four weeks, built to the course standard, with A1.1 as the template.
- Each course ships only after its own checks: validator, checkpoint tests, a full play-through.
- The catalogue page shows these dates from day one, and the Pass sells them in advance.

Done when: A1 to B1 can be bought and finished as one path.

### Phase 4: reach (starts Dec 1, grows after Phase 1 sells)

Moves: qualified visits to 5,000 a month, then 20,000. Today's figure is not measured; the last
known number is 808 search clicks in September.

Own-account reels brought 0 signups, so they stay on autopilot and get no new work.

| Channel | First step | Scale-up rule |
|---|---|---|
| Restart the early source | Find what brought 428 signups in March and 363 in May (founder), and repeat it | Scale while it brings signups |
| Search: get indexed | Only 33 of 184 pages are indexed: request indexing for the selling pages, add links between pages | Standing weekly check |
| Search: exam pages | 10 pages on real exam questions ("telc B1 Brief Beispiel"), each with the free graded task | 30 pages once 10 bring 300 non-brand clicks a month |
| Teachers and schools | Founder sends 20 short messages to B1 teachers with a free class code | Affiliate link at up to €40 a sale once 3 partners send buyers |
| Communities | One helpful, tagged post in each of 5 migrant and exam groups | Repeat only where buyers came from |
| AI answers | Keep `llms.txt` current; ChatGPT already sends signups | Free; monthly check |
| Paid search | Not before 30 sales prove the margin | €500 test on exam keywords, founder's budget |
| Schools as customers | 10 approaches offering class seats | After 10 single buyers give us results to show |

Done when: 3,000 qualified visits a month and a known cost per sale.

## 7. Targets

| Date | Sales | Second-day return | Qualified visits a month |
|---|---|---|---|
| Nov 17 | First test order works | 10% (today) | not measured yet |
| Dec 15 | 10 paid orders in total | 20% | 800 |
| Jan 31 | €3,000 in the month | 30% | 2,000 |
| Feb 28 | €10,000 in the month | 30%+ | 5,000 |
| Jun 30 | €36,000 in the month (the million plan's base case) | 35% | 12,000 |

Each Monday: five numbers on one page (visits, signups, second-day return, orders, revenue) and at
most one decision for the founder.

## 8. What the founder does

About 20 minutes a day, and only what an agent may not do:

- the owner clicks in Phase 0;
- the legal and tax appointments;
- prices and the wording of anything sent under the brand;
- sending the teacher messages (drafted for him);
- two minutes on camera for his own story, when he is ready.

## 9. What we stop

- More redesign, illustrations or visual polish.
- New social video packs.
- New plans. This plan runs 90 days; we change it only when a "done when" line fails.
- Selling anything that is not built.

## 10. The first 14 days

| Day | Work | Who |
|---|---|---|
| 1 | Netlify deploy; Buy buttons checked | Founder, Claude |
| 1–2 | Test purchase; VAT switch; discount code off; Search Console access | Founder, Claude |
| 2–3 | Lesson-1 drop-off analysis from the attempt logs | Claude |
| 2–5 | Brief and build: the two doors, the exam landing page, onboarding by goal | Codex |
| 3–7 | Brief and build: B1 Exam Pack packaging and the second retest | Codex |
| 5 | Lesson-1 fix shipped | Codex, Claude |
| 7 | Teacher marks 20 letters (if approved) | Founder approves |
| 8–10 | Free graded task before signup (new public endpoint: founder approves) | Codex |
| 10 | Email to the 108 exam signups, text approved | Founder |
| 12 | B1 Exam Pack on sale, if the legal check allows | Founder |
| 14 | First Monday page with the five numbers | Claude |

## 11. Risks, each with its fix

- **Legal (FernUSG, operator, side business):** the B1 pack does not open before counsel answers.
  Fix: book this week; everything else in Phases 1 and 2 proceeds meanwhile.
- **AI marking is wrong on B1 letters:** fix: the teacher check before sale; show the tolerance.
- **Search does not recover:** fix: teachers and communities run in parallel from Dec 1.
- **Building crowds out selling:** fix: Phase 3 never starts a course while a Phase 1 "done when"
  line is still open.
