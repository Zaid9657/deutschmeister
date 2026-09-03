# The Ankommo-inspired plan

**2026-09-03.** Companion to `docs/competitors/ankommo-2026-09-03.md` (read its
three CORRECTED blocks first). Written after reading Ankommo's pages directly,
not from snippets.

This is a **plan, not a build**. Every section ends in a decision that is yours.
Nothing on the money side gets built until you pick a model.

---

## 0. The uncomfortable frame

Two facts have to sit next to each other:

**We have more content than he does.** Verified against live tables
(`src/data/marketing.js`): 64 grammar topics across 8 CEFR sub-levels, 453 rule
explanations, 673 worked examples, 672 interactive exercises, 66 reading
lessons, 48 listening exercises over 480 native dialogue lines, 1,935 vocabulary
words with 945 example sentences, 24 podcast episodes, 4 mock exams, plus three
AI surfaces he has no answer to (speaking with feedback, Sentence X-Ray, SRS).

**He earns more than we do.** Because he has 107,000 Instagram followers and we
have none.

So the honest read is not "his site is better." It is: **his packaging and his
distribution are better; our raw material is better.** That determines the whole
plan. We are not short of content. We are short of *shape* and *audience*.

---

## Dimension 1 — Distribution (the precondition, not a lever)

Nothing below earns anything without this. It is listed first because it is the
only dimension where he is structurally ahead and we have no substitute.

What he does: one named human posts short video daily across TikTok, Instagram
and Facebook, about *life in Germany* (passports, tax classes, salaries,
Bürgeramt) — not about German grammar. The German product is what the audience
is monetized with, not what it was built on. His Facebook comments appear under
DAAD and The Local Germany posts; reels draw thousands of likes.

**Our position:** ~200 organic visits/month, 1,554 registered users, no social
presence. `drafts/social-content-atoms-2026-09.md` holds 14 paste-ready pieces
blocked purely on accounts existing.

**What I recommend, and what it costs you personally.** This is the one thing I
cannot do for you. It needs a face or at least a voice, and a daily-ish rhythm
for months. The options, honestly ranked:

1. **You (or your brother) post.** Highest return, real personal cost. Does not
   need a face — screen recordings with captions work, and 7 of the 14 drafted
   atoms are shot that way.
2. **Buy distribution instead of building it.** €300/month of ads against exam
   keywords with a dated deadline. Small, measurable, no personal exposure.
3. **Borrow someone else's audience.** Pay or partner with existing
   German-learning creators for placements. Faster than (1), costlier per unit.

**DECISION 1: which of the three, and who does the posting?** Everything in this
plan is a multiplier on the answer. If the answer is "none", say so plainly and
we build for a search-only future, which is slower but real.

---

## Dimension 2 — Copywriting (where he is genuinely excellent)

His copy earns the compliment you paid it. The patterns worth stealing, with the
actual lines so we are copying a *technique*, not a phrase:

**A. Name the thing the reader has not been told.**
> § 01 · *the rule nobody tells you* — "Enough Points Is Not Enough to Pass"
> "Ninety-five in Lesen does precisely nothing for a fifty-five in Schreiben."

This is the single strongest move on his site. It converts a boring fact (module
pass marks) into a threat the reader recognises. **We already own this fact** —
`tests/guides.test.mjs` and the Modelltest Leitfaden encode all three marking
systems. We have written it as reference. He has written it as a warning.

**B. Reframe the objection as a cheap fix.**
> "A Modellsatz PDF Can't Start the Clock … That isn't a German problem. It's a
> room problem, and it's the cheapest one you have, because you can have the
> room tonight."

**C. Price against a familiar indulgence, never against a competitor.**
> "Knowing the route costs less than one evening out in Berlin."

**D. Two-beat hero.** "Everything before Germany. Everything after." Six words,
whole business model. Ours is a category description.

**E. Say what you will not do.** "No legal or tax advice, nothing filed on your
behalf, no promised outcomes, no commissions from anyone." Refusals read as
integrity and cost nothing. **This is very close to how we already think** — our
whole claims-discipline layer is refusals — but we keep them in test files
instead of on the page. Ours should be visible: no pass guarantee, no invented
learner counts, no fee figures, sources and check dates on every exam fact.

**F. Concreteness as proof.** "€50,700 Blue Card salary floor, 2026",
"48 h written turnaround", "Verified · Updated July 2026". Numbers with dates
beside them do the work a testimonial cannot.

**DECISION 2:** do we do a full copy pass over the public estate in this voice?
It touches the homepage, the four `/pruefung/` hubs, the six Leitfäden and
`/pricing/`. It is the highest-return work in this document that needs no new
product, and it is safe — it changes wording, not claims, and every guard suite
still holds.

---

## Dimension 3 — Social proof (where he is ahead of us, and partly faking it)

**What works.** Testimonials carry a first name, a last initial and **a level
badge** (`Affan N. · a1`, `Josephine M. · b2`). The level is what makes them
credible — it says *this person is on the same ladder as you*. The best quote on
the page is specific about a feeling, not a result: "Most German learners drown
in resources. This keeps everything in one place, in an order that never
overwhelms you."

**What does not.** The marquee repeats the same twelve testimonials four times,
and roughly half carry a rating and a name with **no quote at all** — padding
that reads as padding. He also runs an animated counter for "learners preparing
for Germany" with no stated source. This is the chaos you noticed.

**Our position is worse and cleaner.** We have zero testimonials, by policy —
"no review until a real learner writes one" is written into `/ueber-uns`. That
policy is right and I would not break it.

**The way out is proof that is not a testimonial:**
- **Measured content counts**, which we already have and he does not:
  "672 exercises, 453 rule explanations, 673 worked examples, counted against
  the database on 2026-08-24." Verifiable, ours, and unusual.
- **The provenance footer** we already ship on 11 pages (sources + check date).
  Promote it rather than hide it in a footer.
- **A visible testimonial slot that says why it is empty.** "No reviews yet —
  we launched in 2026 and we will not write our own." That is stronger than
  twelve five-star cards where half have no words.
- Then the real ask: `CompletionMoment.jsx` already asks for a testimonial at
  the celebrate moment. With 73 learners who have started a lesson, this is a
  small pond; it fills once Dimension 1 works.

**DECISION 3:** confirm the no-invented-proof policy holds (I assume yes), and
whether to ship the "empty on purpose" slot.

---

## Dimension 4 — The small details that do the work

These are the "little things that make a big difference" you noticed. Each is
cheap and each is a real idea:

| His detail | Why it works | Our version |
|---|---|---|
| **A live exercise inside the marketing page** — "Choose the correct article for *Wohnung*: der/die/das … Tap an article. This is how every exercise works." | Try before signup, and it *demonstrates the product's mechanic* rather than describing it | Our X-Ray hero already does this. Extend it: one real exercise on every `/pruefung/` hub |
| **"Answer One Question Before You Commit an Evening … Twenty seconds, and it'll tell you more than the rest of this page will."** | Names the reader's actual reluctance (time), then undercuts it | Put one real mock-exam item on the Modelltest page |
| **German article labels as UI copy** — sections named *Die Uhr*, *Der Bogen*, *Das Hören*, *Die Reihenfolge* | Teaches gender passively while navigating. Charming and on-brand | Directly adoptable, and it rhymes with our case-colour token rule |
| **Animated stat that is also a CTA** — "0 days to register your address → Check your deadline" | A fact that answers itself by clicking | Ours: "60% — the telc B1 pass mark → See how your exam is marked" |
| **"The first five chapters are free: no card, no trial clock."** | Kills two objections in nine words. Our 7-day trial *has* a clock and that is worse | Consider content-based free tier over time-based trial |
| **Hours per chapter and per level** — "Ch. 3 · 85 min", "B1 · 29 chapters · ~38 hours" | Converts vague effort into a plan | We have never stated duration anywhere. Deliberately — see below |
| **Three-way self-identification** — "Coming to study / Coming to work / Already here" | Routes strangers without a quiz | Ours: "telc B1 / Goethe B1 / DTZ / telc B2 / not sure yet" |

**One caution on hours.** `src/data/marketing.js` deliberately carries no
study-duration claim because we have never measured one. Stating "~38 hours"
would be exactly the kind of plausible-but-unmeasured number that file exists to
prevent. If we want durations, we derive them from real content (exercise counts
× measured median time) or we do not ship them.

---

## Dimension 5 — The free-tool acquisition layer

His fifteen calculators sit on keywords worth ~87,000 searches/month; our best
target is 1,900. But his tools are *money* tools that anyone could clone, and he
ranks 60–100 for them — he is not actually winning that traffic yet.

**Our right-to-win is exam and status tools**, where our exam engine is the moat:

1. **Einbürgerungstest trainer.** His best asset (460 official BAMF questions,
   free, per-state, per-topic). Large German-language volume, public question
   catalogue, and **we already have exam rails, scoring and a question
   renderer**. This is the highest-leverage single build in this document.
2. **"Which German exam do I actually need?"** — visa / PR / citizenship →
   telc vs Goethe vs DTZ. The question that precedes every purchase we want.
3. **B1-für-Einbürgerung timeline.** His `/citizenship-timeline` is his most
   shared page and it knows nothing about exams. Ours would.
4. **Modelltest scorer.** Mark an official free paper on its real scale. We
   already documented all three marking systems.

**DECISION 5:** is the Einbürgerungstest trainer the next build? It is free, it
is traffic, it feeds the exam funnel, and it does not touch monetization — so it
is the one thing here I could start without the money model being settled.

---

## Dimension 6 — How to build courses (your direct question)

**The finding that should change your plan: we do not need to author a course.
We need to sequence the one we already have.**

He has 109 chapters. We have 64 grammar topics, 672 exercises, 66 reading
lessons, 48 listening exercises and 4 mock exams — *more material, arranged as a
browsable library instead of a path*. Authoring 109 chapters from scratch is
months. Sequencing what exists is weeks.

### His course-page anatomy, lifted (this is the template)

Per level, in this order:

1. **Header:** CEFR badge · "29 chapters · ~38 hours" · plain-English promise.
2. **The free line:** "The first five chapters are free: no card, no trial clock."
3. **Three preview chapters** with minutes, before any signup.
4. **§01 the curriculum — "Who is this for?"** Self-identification bullets
   ("You have completed A2 and want to go further").
5. **"What you will learn"** — 9 outcome bullets, each a *capability*
   ("Write formal emails, complaints, and professional messages"), never a
   grammar label.
6. **Grammar focus** (12 items) and **Skills & themes** (8 items) — the
   reference list, kept *below* the outcomes.
7. **§02 the method — the 5-step chapter pattern**, identical every chapter:
   Understand the context → Study the structure → Build vocabulary →
   Practise → Apply in writing or listening.
8. **§03 why it matters** — ties the level to a life outcome (PR, citizenship,
   work), with the legal hook named (§10 StAG).
9. **§04 the chapters** — the full list, `Free` badges on 1–5, minutes, and a
   **benefit line per chapter**: *"Use obwohl, damit, während, bevor and
   nachdem to connect ideas like a B1 speaker."* Not "Subordinate clauses".

That chapter-level benefit line is the most copyable single thing on his site.

### What our course should be that his cannot

Our 5-step pattern can be better than his because we have the parts:
**Understand → Study → Practise → *Speak it* → *Write it, marked*.** His steps 4
and 5 are exercises and self-study; ours are AI speaking with feedback and AI
writing marked against exam criteria. That is the difference worth charging for.

### The work, honestly scoped

- Map 64 topics + 66 reading + 48 listening + 24 podcasts into an ordered path
  per level (data-layer work on existing rails, no new content).
- Write outcome bullets and a benefit line per unit — the real authoring cost,
  and it is copywriting, not curriculum.
- Build the level course page from the anatomy above.
- Derive durations honestly or omit them.

**DECISION 6:** do we sequence into 4 courses (A1/A2/B1/B2, matching him) or 8
(a1.1–b2.2, matching our data)? I would say **4 public courses over 8 internal
sub-levels** — 8 is a database fact, 4 is how buyers think.

---

## Dimension 7 — Monetization

You said courses. Here is the case for, the case against, and two alternatives,
with the arithmetic.

**Where we start:** 1,554 users, 9 paying, ~€75–90/month, 0.6% conversion,
~200 organic visits/month.

### Option A — Courses as the product (your instinct)

Sell the level course: ~€29–49 per level, or ~€99 for all four.

- **For:** high perceived value; matches how buyers think; one-time pricing suits
  low traffic (revenue per customer is what we can move, not customer count);
  it is the natural home for the sequencing work in Dimension 6.
- **Against:** a "German course" is the most commoditised thing in this market —
  free on YouTube, €4.99 from him, and Babbel spends millions telling everyone
  what a German course costs. We would be selling the one part of our product
  that is *not* differentiated.

### Option B — Exam packs (my recommendation as primary)

Sell an outcome, per exam: **telc B1 / Goethe B1 / DTZ / telc B2**, ~€49–69
one-time. Contents: all mock sets for that format, AI writing marked against
that exam's criteria, AI speaking practice on that exam's task types, and the
targeted grammar path.

- **For:** it is where our moat actually is (AI feedback + real mock rails); the
  buyer has a **dated deadline**, which creates urgency a course cannot; it is
  the €13–50 gap nobody occupies — above Babbel, far below Lingoda; and it is
  the one thing his €4.99 course cannot answer.
- **Against:** smaller addressable audience than "learn German"; needs the mock
  library deepened (he has ~42 papers, we have 4 — **this is the real product
  gap, and it is the strongest argument for what to build next**).

### Option C — Ladder (how A and B coexist)

- **Free:** tools, Einbürgerungstest trainer, first chapters of every course,
  one mock set per exam.
- **€4.99–5.99/mo Basis:** the courses, no AI. Undercuts nothing we value.
- **€12.99/mo Pro:** AI speaking, AI writing marking, X-Ray, SRS.
- **€49–69 one-time Prüfungspaket** per exam. The flagship.

The subscription stops being the product and becomes the floor.

### Option D — Ideas you did not ask for, worth 60 seconds each

- **B2B / institutional.** Sell seats to Sprachschulen, integration-course
  providers, or nurse-recruitment agencies bringing staff to Germany. Ten
  contracts at €200/month is €2,000 with no consumer funnel at all. Different
  business, much slower sales cycle, no distribution problem.
- **Human writing correction as the top rung.** €149 for "AI marking plus a
  human read of three exam letters." Highest margin per customer, and it is the
  thing learners most often say they cannot get. It is also labour — the trap he
  is in — so it should be capped and priced to hurt.
- **What I would not do:** his services model (visa audits, admission sprints).
  It is his best revenue line and it is personal, local, German liability
  attached to a named person. That is the thing this business is structured to
  avoid.

### The arithmetic you should see before deciding

To reach **€1,000/month** — a real first milestone, unlike €10k:

- Subscription only at €9.99: ~100 active payers (11× today).
- Courses at €99: ~10 sales/month.
- Exam packs at €59: ~17 sales/month.

At ~200 organic visits/month, none of these happen on search alone. Every path
runs back through Decision 1.

**DECISION 7 — the one that unblocks everything:** A, B, C, or something of your
own. My recommendation is **C with B as the flagship**: sequence the courses
(they are the free acquisition layer and the thing you want), but sell the exam
packs, because that is where we are actually better than everyone.

---

## Dimension 8 — What not to copy

- **The sprawl.** `/jobs-in-norway`, `/jobs-in-finland`, `/jobs-in-luxembourg`
  are not "life in Germany". Thin, off-mission, and the kind of estate Google
  prunes.
- **Repeated testimonials and quoteless five-star cards.** The chaos you saw.
- **Unsourced animated counters.** "0k+ learners" with no provenance is exactly
  what `marketing.js` exists to prevent.
- **The services business.** See above.
- **Racing to €4.99.** We should not price a deeper product below a shallower
  one to win a comparison nobody is making.

---

## What happens next

**Blocked on you:** Decisions 1 (distribution), 2 (copy pass), 6 (course shape),
7 (monetization model). 7 is the one that unblocks the rest.

**Not blocked on you** — free, no monetization implication, and I can start on a
word from you: the **Einbürgerungstest trainer** (Dimension 5) and the
**mock-exam library depth** (Dimension 7's real product gap).

**Standing commitment, unchanged:** nothing further gets built on the money side
until the model is agreed. The €89 telc B1 course remains fully reopenable —
nothing has sold.
