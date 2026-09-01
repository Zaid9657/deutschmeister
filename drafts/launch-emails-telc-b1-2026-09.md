# Launch sequence: telc B1 Komplettvorbereitung — 4 emails / 9 days

**Class B — drafts for owner review. Nothing here self-sends.** Written 2026-08-31
per the revenue plan's P0 (docs/revenue-plan-2026-08-31.md). Audience: the
~1,003 confirmed-email accounts, in English (every existing transactional email
is English; the German sales page is fine for actual B1-level buyers).

**Refreshed 2026-09-01 after the renovation shipped:** the included Pro window
now also covers the timed telc B1 practice exam and the AI writing feedback
(both live in production; course buyers get pro tier via the webhook —
verified in `lemonsqueezy-webhook.mjs`). Emails 1 and 3 sell them; every
figure still derives (writing quota = `PRO_WRITING_EVALUATIONS_PER_MONTH`).

**Claims discipline applied:** €89 list and €49 with START49 match the Lemon
Squeezy product + the €40 fixed code; the code expiry (2026-09-14) is real —
**do not send email 4 unless the code genuinely expires that day**; no outcome
promises, no telc fees, no invented numbers. The one figure quoted (20 daily
tasks, 3 months Pro included) matches `src/data/pricing.js` COURSES and the
program module.

**Before send 1 (checklist):**
1. START49 finished in LS (expiry 2026-09-14, restricted to the product) and
   the €89→€49 checkout verified.
2. One LS **test-mode purchase** confirmed end-to-end (buy → `purchases` row →
   `/telc-b1-kurs` unlocks). Ask the agent to verify the DB side.
3. Dry run every email: same curl with `"testMode": true` first — it sends only
   to TEST_EMAIL.

**How to send each email** (replace SUBJECT/BODY; `exclude` keeps buyers and
subscribers out of later sends):

```bash
curl -X POST https://deutsch-meister.de/.netlify/functions/send-campaign \
  -H "Content-Type: application/json" \
  -H "x-campaign-secret: $CAMPAIGN_SECRET" \
  -d '{"subject": "<SUBJECT>", "body": "<HTML BODY>", "exclude": ["subscribed", "purchased:telc_b1_komplett"], "testMode": true}'
```

Send days: **Day 0 → Day 3 → Day 6 → Day 9** (day 9 ≤ 2026-09-14).
Sales page: `https://deutsch-meister.de/telc-b1-komplettvorbereitung/`
Checkout with code prefilled:
`https://deutsch-meister.lemonsqueezy.com/checkout/buy/0875bbbb-c936-41e3-af85-d43f9be5556a?checkout[discount_code]=START49`

---

## Email 1 — Day 0 · Announcement

**Subject:** The plan I wish existed when I was studying for my German exam

**Body (HTML paragraphs):**

<p>You know the feeling: the telc B1 date is on the calendar, you know you should be practicing — and every evening you open the app, do <em>something</em>, and close it without knowing whether it was the right something.</p>

<p>That's the problem we just built a product for.</p>

<p>The <strong>telc B1 Komplettvorbereitung</strong> is a fixed 4-week plan over everything DeutschMeister already has: 20 daily tasks, in the order that leads to the exam. Grammar lesson by lesson, listening, reading, AI speaking practice — each day one tick-off task, ending with a full exam-orientation week. Three months of full Pro access are included, so there's nothing extra to subscribe to.</p>

<p>And since this week, Pro includes two things built exactly for exam candidates: a <strong>timed telc-style practice test</strong> that scores you against the documented pass threshold, and <strong>AI feedback on your exam letters</strong> — graded on the same four criteria the examiners use, with concrete corrections. Your exam week in the plan uses both.</p>

<p>It's a one-time purchase: <strong>€89</strong>. And because you were here before this existed, the launch code <strong>START49</strong> takes it to <strong>€49</strong> until September 14.</p>

<p><a href="https://deutsch-meister.de/telc-b1-komplettvorbereitung/"><strong>See exactly what's in the 4 weeks →</strong></a></p>

<p>Not preparing for telc B1? Then simply ignore this — the free daily sentence and everything else stays exactly as it is. And if you're not sure of your level yet, the <a href="https://deutsch-meister.de/level-test/">level test is free</a>.</p>

<p>— Zaid</p>

---

## Email 2 — Day 3 · Pure value: how to self-mark a Modelltest

**Subject:** How to grade your own telc B1 practice test (most people do it wrong)

**Body:**

<p>Whether or not you buy anything from us, do this before your exam: sit one official Modelltest under real conditions. telc publishes them free — and most people mark them wrong, so they walk in either overconfident or unnecessarily scared.</p>

<p>The three mistakes we see constantly:</p>

<p><strong>1. Marking parts in isolation.</strong> telc B1 combines your written parts into one score — a weak reading section can be carried by listening and grammar. Grade the whole written exam together, the way the examiners do.</p>

<p><strong>2. Ignoring the clock.</strong> A Modelltest done over three relaxed evenings tells you about your German, not about your exam. The time pressure IS the exam. One sitting, real timing.</p>

<p><strong>3. Skipping speaking entirely</strong> — because there's no partner at home. This is the part people fail while passing everything else. (It's also exactly why we built AI speaking practice: a partner that's available at 11pm and doesn't judge.)</p>

<p>The full breakdown — parts, timing, how the scoring works, where to register — is in our free guide: <a href="https://deutsch-meister.de/leitfaden/telc-b1/"><strong>the telc B1 Leitfaden →</strong></a></p>

<p>— Zaid</p>

<p><em>P.S. The 4-week Komplettvorbereitung ends with exactly this: a self-marked exam week with the format and scoring already rehearsed. Still €49 with code START49 until September 14.</em></p>

---

## Email 3 — Day 6 · Honest FAQ

**Subject:** "Is the B1 course worth it for me?" — honest answers

**Body:**

<p>A few of you asked good questions about the telc B1 Komplettvorbereitung. Short and honest:</p>

<p><strong>"What do I actually get?"</strong> A fixed 20-day plan over the DeutschMeister library — the sequence, not a pile of material. Each day one task: which grammar topic, which listening set, when to do your first timed speaking. Plus 3 months of full Pro access included — which now also covers the timed telc-style practice test with automatic scoring and the AI writing feedback on exam letters — and the course area stays yours permanently.</p>

<p><strong>"I already have Pro — does this make sense?"</strong> Only if the plan itself is worth €49 to you. Pro gives you the library; the course tells you what to do with it, day by day, until the exam. If you're self-directed and on track, you don't need it.</p>

<p><strong>"What if my exam is more than 4 weeks away?"</strong> Better. Do the plan once at your pace, then repeat exam week before the real date. Nothing expires except the included Pro window (3 months — enough for both passes).</p>

<p><strong>"Who is it NOT for?"</strong> If you're below A2, it's too early — do the <a href="https://deutsch-meister.de/level-test/">free level test</a> first and start with the free A1.1 level. We'd rather tell you that now than take your €49.</p>

<p><a href="https://deutsch-meister.lemonsqueezy.com/checkout/buy/0875bbbb-c936-41e3-af85-d43f9be5556a?checkout[discount_code]=START49"><strong>Get the plan — €49 with START49 →</strong></a> (€89 after September 14)</p>

<p>— Zaid</p>

---

## Email 4 — Day 9 · Code expires (send ONLY if the code truly expires 2026-09-14)

**Subject:** START49 stops working on Sunday

**Body:**

<p>Quick and factual: the launch code <strong>START49</strong> expires on <strong>September 14</strong>. After that the telc B1 Komplettvorbereitung is €89 — still fair against what preparation courses cost, but €40 more than this week.</p>

<p>If you've been going back and forth, here's the whole decision: you're preparing for telc B1 in the next months, you want to be told what to practice each day instead of deciding every evening, and €49 for the plan plus 3 months of full access sounds reasonable. If that's you, take it. If not, genuinely — don't.</p>

<p><a href="https://deutsch-meister.lemonsqueezy.com/checkout/buy/0875bbbb-c936-41e3-af85-d43f9be5556a?checkout[discount_code]=START49"><strong>Use START49 before Sunday →</strong></a></p>

<p>Either way: the daily sentence keeps coming, A1.1 stays free, and I'll keep building. Viel Erfolg bei der Prüfung.</p>

<p>— Zaid</p>

---

**Post-send:** record opens/sales after each send in the weekly log
(docs/revenue-plan-2026-08-31.md). Week-5 gate: ≥20 sales from this sequence is
on-plan; <10 means offer/price problem — stop and diagnose before ads.
