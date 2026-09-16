# Lemon Squeezy product ids — DeutschStart A1.1 launch (2026-09-16)

Store **309512** (DeutschMeister — NOT the MedMeister store). Created by the owner
through the Claude in Chrome prompt in `docs/owner-prompts.md`; verified in the live
dashboard after a reload, not from the creation response.

Lemon Squeezy is dashboard-only for writes (the API key is read-only), so these ids are
the record. The env vars below are what the code reads; **nothing sells until they are
set**, because every buy surface hides when its id is unset (no-fallback rule).

## What exists now

| Product | Product id | Variant | Variant id (numeric) | Checkout UUID |
|---|---|---|---|---|
| German course catalogue (existing) | 1336941 | DeutschStart A1.1 — €39 one-time | `2135588` | `11313418-09e0-463d-b0a8-f7003688ccb4` |
| 60 Sprechminuten (new) | 1366839 | Default — €6.99 one-time | `2135651` | `52353163-beee-4b6a-ba6b-c0b93aeb3dee` |
| AI Coach (new) | 1367021 | AI Coach Monthly — €12.99/month | `2136028` | `a2372ccf-0774-4104-b7a7-ae33bb2af438` |
| AI Coach (new) | 1367021 | AI Coach Yearly — €129/year | `2136033` | `769dff11-c1f6-4d71-a716-20717b87c7d9` |

Checkout links are `https://deutsch-meister.lemonsqueezy.com/checkout/buy/<uuid>`.
Both new products carry tax category "SaaS – personal use" and redirect to
`https://deutsch-meister.de/subscription/success`. Product 1336941's redirect is empty
and was deliberately left alone.

## Grandfathering — do not touch these

| Product | Product id | Price |
|---|---|---|
| Pro Monthly | 885027 | €9.99/month |
| Pro Yearly | 885039 | €79.99/year |
| Premium Monthly | 904811 | €24.99/month |
| Premium Yearly | 904813 | €199.99/year |

Existing subscribers are billed on these variants and keep their price while
continuously subscribed (`GRANDFATHERED_MONTHLY_PRICE_EUR` / `_YEARLY_` in
`src/data/pricing.js`). **Re-pricing a variant re-prices everyone already on it**, which
is why AI Coach is a new product rather than an edit — and why the €12.99/€129 variants
were NOT added to 885027/885039.

## Why AI Coach is ONE product with two named variants

`handleSubscriptionCreated` in `netlify/functions/lemonsqueezy-webhook.mjs` derives the
plan from the **variant name**:

```js
const planType = variantName.toLowerCase().includes('yearly') ? 'yearly' : 'monthly';
```

A single-price product shows its only variant as **"Default"**, which contains no
"yearly" — so an annual buyer would be written as a *monthly* subscription ending in 30
days. Two variants on one product force real names and close that hole. The annual
variant's name must keep the word **Yearly**; renaming it in the dashboard silently
breaks annual billing. (The €6.99 top-up is a one-time order routed by variant id, not
name, so its "Default" name is harmless.)

## Env vars to set

Numeric ids go to the **functions** scope (the webhook matches the payload's variant id);
checkout UUIDs go to the **builds** scope (the client opens the checkout).

| Env var | Scope | Value |
|---|---|---|
| `LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID` | functions | `2135588` |
| `LEMONSQUEEZY_SPEAKING_TOPUP_60_VARIANT_ID` | functions | `2135651` |
| `VITE_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID` | builds | `11313418-09e0-463d-b0a8-f7003688ccb4` |
| `PUBLIC_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID` | builds | `11313418-09e0-463d-b0a8-f7003688ccb4` |
| `VITE_LEMONSQUEEZY_SPEAKING_TOPUP_60_VARIANT_ID` | builds | `52353163-beee-4b6a-ba6b-c0b93aeb3dee` |
| `VITE_LEMONSQUEEZY_AI_COACH_MONTHLY_VARIANT_ID` | builds | `a2372ccf-0774-4104-b7a7-ae33bb2af438` |
| `VITE_LEMONSQUEEZY_AI_COACH_YEARLY_VARIANT_ID` | builds | `769dff11-c1f6-4d71-a716-20717b87c7d9` |

Subscriptions need no numeric functions-scope var: the webhook reads the plan from the
payload, not from an env map.

`PUBLIC_` exists only for A1.1 because the Astro sales page at `/courses/a1-1/` opens
that checkout; the top-up and AI Coach are SPA-only surfaces.

## What each purchase grants

| Product | Webhook path | Grant |
|---|---|---|
| DeutschStart A1.1 €39 | `handleCourseOrder` → `grantCourseSpeaking` | `purchases` row (`course_a1_1`), 3,600 permanent speaking seconds, 12 included first mission attempts, 90-day Pro window |
| 60 Sprechminuten €6.99 | `topupForVariant` → `grantTopupSpeaking` | 3,600 permanent seconds. **No** `purchases` row and no Pro window — it is not a course |
| AI Coach €12.99 / €129 | `subscription_created`, then `subscription_payment_success` → `grantSubscriptionSpeaking` | subscription row; 7,200 seconds per billing month, expiring 34 days after the payload's billing date |

The AI Coach seconds come from `subscription_payment_success`, not `subscription_created`
— so they land on the first payment and again on every renewal. An annual term releases
each month's allowance through `reconcile-speaking-reservations`.

A refund calls `revokeSpeakingForOrder`: unspent seconds go to zero, consumption history
is never rewritten, and unused mission attempts are revoked.

## Still required before any of this can sell

The migrations are applied (2026-09-16) and the allowance RPCs are locked to the service
role. Outstanding: these env vars, `SPEAKING_STATE_SECRET`, `AZURE_SPEECH_KEY`/`_REGION`,
the Azure audio batch, the named DaF review, and one real test purchase confirming the
webhook separates monthly from yearly. See `docs/releases/deutschstart-a11-launch-checklist.md`.
