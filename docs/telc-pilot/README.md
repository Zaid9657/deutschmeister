# telc B1 pilot ("telc-B1-Prüfungsprobe"): the runbook

The pilot from `docs/business-review-2026-10-11.md` §4: about ten buyers at €149, then a test of
€199 vs €249. This file covers the money path. It says how the sale is switched on and off, the
order of owner actions, how to verify a purchase and a refund, and how to grant the one practice
extension the guarantee promises.

**Reused, not new.**

| What | Value |
|---|---|
| Product key | `telc_b1_komplett` (`src/data/pricing.js`) |
| Lemon Squeezy product / variant | 1329566 / 2077984 |
| Webhook route | `LEMONSQUEEZY_TELC_B1_VARIANT_ID` |
| Course area | `/telc-b1-kurs` |
| Sales page | `/telc-b1-komplettvorbereitung/` |

There are no database migrations.

## The sale switch

The pilot is on sale only while both are true:
- `PUBLIC_TELC_B1_ON_SALE` is exactly `true` (Netlify **builds** scope, read by both front ends);
- the product has its checkout ids:

  | Scope | Variable(s) | Value |
  |---|---|---|
  | functions | `LEMONSQUEEZY_TELC_B1_VARIANT_ID` | numeric 2077984 |
  | builds | `VITE_LEMONSQUEEZY_TELC_B1_VARIANT_ID`, `PUBLIC_LEMONSQUEEZY_TELC_B1_VARIANT_ID` | checkout UUID |

**Off sale** (any other value, or unset):
- no Buy button anywhere: not the sales page, not the `/subscription` card, not a `?buy=` resume;
- no Product/Offer in the page's JSON-LD;
- the sales page CTA is the free-account door `/signup?ref=telc-pilot&utm_medium=onsite&utm_content=telc-b1`. Those signups are the pilot's first invite list (query below).

**On sale:** both Buy buttons go through `astro-site/src/components/CourseCheckout.astro`.
- Signed in → the Lemon Squeezy overlay with the account's e-mail and user id.
- Signed out → signup first, then the checkout resumes at `/subscription?buy=telc_b1_komplett`.
- Either way every order carries a user id. There is no guest link any more.

**Changing it:** a builds-scope variable needs a **redeploy** to take effect.

**The switch only controls what the site shows. Closing a sale also closes the store side.**
- The switch hides every Buy button on the site. It cannot stop a checkout that is already open in someone's tab, or a checkout link copied earlier (the €89 guest link was public on the sales page until PR A).
- So whenever the sale is closed, the product is closed in Lemon Squeezy too: set it to **Draft**, then open its old checkout link and check that it no longer sells (prompt *telc pilot* step 0 in `docs/owner-prompts.md`).
- The Lemon Squeezy docs do not say whether a Draft product blocks its checkout link. That is why the link is tested, not assumed.

**Guards:**
- `tests/telc-pilot-gate.test.mjs` pins both gates, evaluated against fake envs.
- `scripts/check-built-html.mjs` holds the built page to whichever state the build's env says.

## Owner actions, in order

1. **[Agent] PR A goes live** (this switch, off). From then on no Buy button on the site shows a stale price.
2. **[Owner] Close the store side:** set product 1329566 to Draft and check the old checkout link no longer sells (prompt step 0).
3. **[Owner] Rename and reprice** product 1329566 / variant 2077984 to „telc-B1-Prüfungsprobe", €149.
   Use the prompt in `docs/owner-prompts.md` → *telc pilot*; it also sets the redirect, reports the tax category and discounts, and turns on sale notifications.
4. **[Agent] PR B and PR C go live.** These are the 20-unit route, the deep links, the €149 page and the guarantee copy.
   The switch stays off until the page says €149.
5. **[Owner + Agent] Test purchase**, before the switch, with a 99 %-off code. The owner first publishes the product again; it stays published from here. A €0 order cannot be refunded in Lemon Squeezy; a €1.49 one can.
   The Buy buttons are still hidden, so the agent hands the owner a direct checkout link for the test account. That link carries the test account's user id. Then the agent verifies:
   - the purchase (*Verify a purchase* below);
   - the owner refunds in full, and the agent verifies the revocation (*Refunds*);
   - the owner resends that `order_created`, and the agent verifies that it stays refunded.
6. **[Owner] Recommended:** turn on tax-inclusive pricing (`docs/owner-prompts.md`), so the checkout total equals the shown €149.
   If the store stays tax-exclusive, PR C must print „zzgl. MwSt. (an der Kasse)" next to every price.
7. **[Owner says "open the sale"] → [Agent]** sets `PUBLIC_TELC_B1_ON_SALE=true` (builds scope) via the Netlify connector and redeploys.
   It then smoke-tests Buy signed out (lands on signup with the intent stored) and signed in (the overlay opens; no payment).
8. **[Owner] Invite:**
   - the waitlist below;
   - partners;
   - Telegram.
   Mailing the existing list is the owner's call. If chosen, it goes through `send-campaign` with unsubscribe links.
9. **At 10 sales, [Agent]** sets the switch back to `false` and redeploys, and **[Owner]** closes the store side again (step 2). The sale query below counts them.

## Verify a purchase

```sql
select p.lemonsqueezy_order_id, p.user_id, p.status, p.price_paid, p.access_until, p.created_at,
       s.plan_type, s.status as sub_status, s.subscription_end,
       pr.is_subscribed, pr.subscription_tier
from purchases p
left join subscriptions s on s.user_id = p.user_id
left join profiles pr on pr.id = p.user_id
where p.product_key = 'telc_b1_komplett' and p.lemonsqueezy_order_id = '<ORDER_ID>';
```

Expected:
- `status = active`;
- `plan_type = course` with `subscription_end` about 90 days out. If the buyer already had a live paid subscription, that row is untouched and `access_until` is null;
- `is_subscribed = true`, `subscription_tier = pro`.

The course area `/telc-b1-kurs` opens for any `active` purchase row. The AI tools follow the Pro window.

## Refunds: full refunds only

**Refund in Lemon Squeezy** (Orders → the order → Refund → **full amount**).

`order_refunded` then:
- sets the purchase to `refunded`;
- closes the included Pro window, if it came from this order (`lemonsqueezy-webhook.mjs` `handleOrderRefunded`).

It revokes on **any** refund, partial ones included. That is why partial refunds are not used: a partial refund would remove all access while keeping part of the price.

**Verify:** run the purchase query above. Expect:
- `status = refunded`;
- `access_until` ≈ the refund time;
- `sub_status = expired`;
- `is_subscribed = false`.

**A resend or retry of `order_created` never grants a refunded order again.** The webhook checks three records before writing anything (`tests/webhook-refund-replay.test.mjs`):
1. the payload's status: `refunded`, `partial_refund`, `failed` or `fraudulent`;
2. the purchase row;
3. the logged `order_refunded` event. This covers a refund that arrived **before** the order was ever delivered, so there was no row to mark. An example is a paid order with no matching account (owner alert „Paid course order has no account").

A refund is acknowledged to Lemon Squeezy only once its event is logged. If the log write fails, the webhook answers 500 and Lemon Squeezy retries the refund.

**One case is left open on purpose:** a retry of `order_created` and the refund processed in the same instant. A delivery already in flight can leave the purchase `refunded` but put the Pro window and the profile flags back. Closing it needs a database transaction (a migration), which is not worth it at ten orders.

**So after every refund, wait a minute, run the purchase query, and compare all four fields**, not only the purchase status:
- `status = refunded`;
- `sub_status = expired` (or the buyer's own paid plan, untouched);
- `is_subscribed = false`, unless that paid plan is live;
- `access_until` ≈ the refund time.

If any field is off, the agent revokes by hand with the same three updates `handleOrderRefunded` makes.

## The practice extension (guarantee step 2)

**Grant it once per buyer, after checking eligibility.**
- **Eligibility:**
  - all 20 units;
  - the three writing tasks, each with its revision (six AI corrections);
  - the ten speaking rehearsals.
- **The request:** it must arrive within 7 days of the last unit.
- **The eligibility query** comes with the 20-unit route (PR B), whose item ids it counts.

**Never use the admin action „Pro-Tage gutschreiben" (`grant_pro_days`) for this.**
- It writes a separate manual `monthly` row.
- `subscriptions.user_id` is unique, so the buyer's `course` row and a manual row cannot both exist.

**Look first.** A user has one `subscriptions` row (`user_id` is unique), and later purchases can replace it:

```sql
select plan_type, status, subscription_end, lemonsqueezy_order_id
from subscriptions where user_id = '<USER_ID>';
```

| The row shows | Then |
|---|---|
| `plan_type = course` and this pilot order's id | Run the whole transaction below. |
| A paid plan (`monthly`/`yearly`) ending at least 30 days from now | The AI tools are covered. Run only step 1. |
| Anything else: an expired paid plan, a manual row, another course's window, no row | Stop and hand it to the agent. Do not improvise: a wrong update can break a paying subscriber's row. |

**Then run one transaction, and check every row count before `commit`.**

```sql
begin;

-- 1. The pilot purchase must be active. Expect: UPDATE 1.
update purchases
set access_until = greatest(coalesce(access_until, now()), now()) + interval '30 days', updated_at = now()
where product_key = 'telc_b1_komplett' and lemonsqueezy_order_id = '<ORDER_ID>' and status = 'active';

-- 2. The included Pro window (the AI tools). Expect: UPDATE 1.
--    UPDATE 0 means the row is not this order's course window: rollback; and look again.
update subscriptions
set subscription_end = greatest(coalesce(subscription_end, now()), now()) + interval '30 days',
    status = 'active', updated_at = now()
where user_id = '<USER_ID>' and plan_type = 'course' and lemonsqueezy_order_id = '<ORDER_ID>';

-- 3. The profile flags, in case the daily sweep already closed the window. Expect: UPDATE 1.
update profiles set is_subscribed = true, subscription_tier = 'pro', updated_at = now()
where id = '<USER_ID>';

commit;  -- or rollback; if any count differs
```

**How the extra allowance is covered.** For 30 days the Pro allowance applies. It already covers the promised five extra 5-minute rehearsals and two extra writing corrections.

**Record it in the reply to the buyer, with the new end date** from the purchase query.

## Queries

**Waitlist:** signups through the off-sale door, newest first.

```sql
select id, email, created_at, acquisition_source, acquisition_last_source, exam_track
from profiles
where acquisition_last_source = 'telc-pilot' or acquisition_source = 'telc-pilot'
order by created_at desc;
```

**Sales so far** (stop at 10):

```sql
select status, count(*) as orders, sum(price_paid) as gross_eur
from purchases where product_key = 'telc_b1_komplett'
group by status;
```

**Progress and usage per buyer:** the speaking, writing and route queries come with PR B, which defines how each unit is recorded.
