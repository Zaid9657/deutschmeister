# Pricing, offers and products: evaluation (2026-11-09)

Asked by the founder after the concept-4 redesign went live: "evaluate pricing and offers and products".
Prices are owner decisions; this document recommends, it changes nothing.

## Bottom line

The price is not the problem. **There is almost nothing to buy.** One product is on sale (A1.2, €40 once),
plus the AI Practice add-on. A perfect page selling one €40 product to ~73 signups a month cannot make
real money. The next lever is the offer ladder, not the price tag.

## What the data says

| Fact | Number | Source |
|---|---|---|
| Course purchases, ever | 3: all-levels bundle €129 (09-08), A1 band €49 (09-03), A1.2 €40 (10-14) | `purchases`, read 2026-11-09 |
| Recurring subscriptions, ever | 14: 4 active (2 monthly, 2 yearly), 7 expired, 2 unpaid, 1 cancelled | `subscriptions` |
| Signups, last 30 days | 73; 31 of them (42%) chose an exam track | `profiles` |
| Products a visitor can buy today | A1.2 course (€40), AI Practice (€9.99/month, €79.99/year) | `src/data/pricing.js` |

Reading: (1) the two largest tickets ever were **bundles**, and bundles are no longer sold; (2) monthly
subscriptions churn (7 of 10 monthly gone), yearly holds (2 of 2 active); (3) 42% of signups want an exam,
and no exam product is on sale.

## Where our prices sit (checked 2026-11-09, vendors' own pages or dated reviews)

| Offer | Price | What it is |
|---|---|---|
| Busuu Premium | about €58–70 a year | App, A1–B2 |
| Babbel | about €7–13 a month; lifetime €299.99 | App, A1–B2, all languages |
| **DeutschMeister A1.2** | **€40 once (half a level)** | Guided course + 3 months AI practice |
| Goethe "Deutsch Training Online" | €99–299 per level | Self-study, no teacher |
| Goethe exam preparation | €289–389 | With teacher feedback |
| Lingoda | about €80–160 per 4 weeks | Live group classes |

We sit between the apps and the institutes. €40 for half a level is fair if the buyer sees AI feedback on
writing and speaking and a route to an exam; against Babbel's "everything for €9 a month" it needs that
difference shown on the page. Lowering the price would not fix volume; raising it is possible once proof exists.

## Recommendation, in money order (owner decides prices)

1. **Sell an A1 exam pack** at the end of A1 (Goethe Start Deutsch 1 / telc A1): mock exam, AI-graded
   writing and speaking. It follows the founder's 2026-11-02 rule (exam preparation at the end of each full
   level) and serves the 42% who came for an exam. Suggested test price: €49–69.
2. **Bring back a bundle: "A1 Complete"** = A1.2 course + A1 exam pack + 6 months AI Practice, priced above
   the parts' anchor (suggested €89–99). Bundles were the biggest tickets we ever sold.
3. **Lead AI Practice with the yearly plan** (€79.99); monthly churns. Show monthly as the second option.
4. **Keep A1.2 at €40** for now; revisit after 20 sales or when A2.1 ships.
5. **Do not discount.** With ~73 signups a month the constraint is the ladder and the number of buyers, not price.

What this is worth at today's traffic (a model, not a forecast): 73 signups × 3–5% buying × €60–90 average
order ≈ €130–330 a month, against ≈ €60 today. The ladder multiplies whatever traffic comes later.

## Also found on the live site (website issues, not pricing)

- `/signup` still sells "Start your 7-day AI Practice trial" with "All 8 levels" — it contradicts the new
  offer (courses are bought, AI Practice is the add-on).
- Inside the app, the lesson pages keep the old plain look with placeholder art; the visitor leaves the new
  illustrated home page and lands in a different-looking product.
