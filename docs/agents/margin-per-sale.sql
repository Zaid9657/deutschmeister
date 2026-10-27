-- Controller backlog c2, move 2: contribution margin PER SALE. Verified 2026-10-26:
-- both statements ran read-only against the live schema (count-only wrappers).
-- expected_effect: contribution per sale visible every Monday.
-- Only SELECT/WITH statements and read-only PostgreSQL built-ins. No view,
-- function, table, grant, policy or RPC: a new public object would be a new
-- PostgREST endpoint, which is owner-only. Run with an already-authorized reader
-- that can see all rows (not a customer-scoped RLS session), like monday-packet.sql.
-- Money semantics are copied from monday-packet.sql section A; its -- VERIFY:
-- assumptions (payload units, cumulative refund fields, no test orders in
-- purchases, invoice/refund id links, webhook-receipt time basis) apply here too.
--
-- Output carries NO personal data: no emails, names, user/order/invoice/
-- subscription ids. A sale is identified only by sale_no (row_number), sale day
-- (UTC), kind, product, currency and first-touch source/channel labels.
-- Amounts are major currency units; never add currencies together.
--
-- A sale is:
--   course                one public.purchases row (one Lemon Squeezy order);
--                         gross = purchases.price_paid, VAT/fee from its order_created.
--   subscription_invoice  one subscription payment invoice (first and each renewal);
--                         its order_created is NOT a separate sale (double count).
--   unlinked_order_refund a non-course order refund with no verified invoice link
--                         (packet A's unknown case); no sale can own it, so it is
--                         its own row with gross 0 and unknown refund.
-- Source = buyer's profiles.acquisition_source (first touch, public/attribution.js),
-- channel = profiles.acquisition_medium. Labels only. NULL (before 2026-09-20,
-- arrived without labels, deleted account, unresolvable buyer) is 'untracked',
-- never 'direct'.
-- VERIFY: invoice buyer = subscriptions.user_id via attributes.subscription_id,
-- falling back to meta.custom_data.user_id (the webhook's own first choice).
-- VERIFY: subscription product label is 'subscription_' || subscriptions.plan_type;
-- it is a plan label, not a src/data/pricing.js product key.
--
-- AI cost: public.ai_usage (PR #221) does not exist yet. ai_cost_90d is NULL and
-- ai_cost_unknown is true. Once ai_usage exists, join it on the buyer over the
-- 90 days after the sale (see the commented block in `lines`).
-- Channel cost: no table records ad/partner/creator spend; channel_cost is NULL
-- and channel_cost_unknown is true. Hence `contribution` stays NULL for now and
-- `contribution_before_ai_channel` is the usable figure: payment contribution
-- after VAT, LS fee and refund, before AI cost, channel cost and overheads.
-- A known zero needs the matching *_unknown flag false; never infer VAT at 19%,
-- fees at a tariff or fee credits at 0.

-- 1. One row per sale, newest first.
with
params as (select now() as as_of),
raw as (
  select w.event_type, w.created_at,
         nullif(w.payload->'data'->>'id', '') as resource_id,
         w.payload->'data'->'attributes' as a,
         nullif(w.payload->'meta'->'custom_data'->>'user_id', '') as custom_user_id
  from public.webhook_logs w, params p
  where w.created_at < p.as_of
    and w.event_type in ('order_created', 'order_refunded',
      'subscription_payment_success', 'subscription_payment_recovered',
      'subscription_payment_refunded')
    and coalesce(w.payload->'meta'->>'test_mode', 'false') <> 'true'
    and coalesce(w.payload->'data'->'attributes'->>'test_mode', 'false') <> 'true'
),
parsed as (
  select event_type, created_at, resource_id, a, custom_user_id,
         coalesce(nullif(upper(a->>'currency'), ''), 'UNKNOWN') as currency,
         case when a->>'total' ~ '^[0-9]+$' then (a->>'total')::numeric / 100 end as total,
         case when a->>'tax' ~ '^[0-9]+$' then (a->>'tax')::numeric / 100 end as tax,
         case when coalesce(a->>'fee', a->>'fees') ~ '^[0-9]+$'
           then coalesce(a->>'fee', a->>'fees')::numeric / 100 end as fee,
         case when a->>'refunded_amount' ~ '^[0-9]+$'
           then (a->>'refunded_amount')::numeric / 100
           when (a->>'refunded' = 'true' or a->>'status' = 'refunded')
             and a->>'total' ~ '^[0-9]+$' then (a->>'total')::numeric / 100 end as refund,
         case when a->>'refunded_tax' ~ '^[0-9]+$'
           then (a->>'refunded_tax')::numeric / 100
           when (a->>'refunded' = 'true' or a->>'status' = 'refunded')
             and a->>'tax' ~ '^[0-9]+$' then (a->>'tax')::numeric / 100 end as refund_tax,
         case when a->>'refunded_fee' ~ '^[0-9]+$'
           then (a->>'refunded_fee')::numeric / 100 end as refund_fee
  from raw
),
orders as (
  select resource_id, max(currency) as currency, max(tax) as tax, max(fee) as fee
  from parsed where event_type = 'order_created' and resource_id is not null
  group by resource_id
),
-- Refund fields are cumulative per resource (VERIFY, as in A), so a sale's refund
-- is its largest snapshot; any snapshot without a parseable component makes that
-- component unknown for the sale.
refunds as (
  select case when event_type = 'order_refunded' then 'order' else 'invoice' end as kind,
         resource_id,
         max(refund) as refund, max(refund_tax) as refund_tax, max(refund_fee) as refund_fee,
         bool_or(refund is null) as refund_gap,
         bool_or(refund_tax is null) as tax_gap,
         bool_or(refund_fee is null) as fee_gap
  from parsed
  where event_type in ('order_refunded', 'subscription_payment_refunded')
    and resource_id is not null
  group by 1, resource_id
),
course_sales as (
  select p.created_at as sold_at, 'course'::text as kind, p.product_key as product,
         coalesce(o.currency, 'UNKNOWN') as currency, p.user_id as buyer_id,
         p.price_paid as gross, o.tax as vat, o.fee as fee,
         r.refund, r.refund_tax, r.refund_fee,
         (r.resource_id is not null) as has_refund,
         -- A refunded purchase without a refund log may be partial: amount unknown.
         case when r.resource_id is not null then r.refund_gap
              else p.status = 'refunded' end as refund_unknown,
         coalesce(r.tax_gap, p.status = 'refunded') as refund_tax_gap,
         coalesce(r.fee_gap, p.status = 'refunded') as refund_fee_gap
  from public.purchases p
  cross join params
  left join orders o on o.resource_id = p.lemonsqueezy_order_id
  left join refunds r on r.kind = 'order' and r.resource_id = p.lemonsqueezy_order_id
  where p.created_at < params.as_of
),
payments as (
  select resource_id, min(created_at) as sold_at, max(currency) as currency,
         max(total) as gross, max(tax) as tax, max(fee) as fee,
         max(nullif(a->>'subscription_id', '')) as subscription_id,
         max(custom_user_id) as custom_user_id
  from parsed
  where event_type in ('subscription_payment_success', 'subscription_payment_recovered')
    and resource_id is not null
  group by resource_id
),
invoice_sales as (
  select pm.sold_at, 'subscription_invoice'::text as kind,
         'subscription_' || coalesce(s.plan_type, 'unknown') as product,
         pm.currency,
         coalesce(s.user_id,
           case when pm.custom_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             then pm.custom_user_id::uuid end) as buyer_id,
         pm.gross, pm.tax as vat, pm.fee,
         r.refund, r.refund_tax, r.refund_fee,
         (r.resource_id is not null) as has_refund,
         coalesce(r.refund_gap, false) as refund_unknown,
         coalesce(r.tax_gap, false) as refund_tax_gap,
         coalesce(r.fee_gap, false) as refund_fee_gap
  from payments pm
  left join public.subscriptions s on s.lemonsqueezy_subscription_id = pm.subscription_id
  left join refunds r on r.kind = 'invoice' and r.resource_id = pm.resource_id
),
unlinked_refunds as (
  select min(r.created_at) as sold_at, 'unlinked_order_refund'::text as kind,
         'unknown'::text as product, max(r.currency) as currency, null::uuid as buyer_id,
         0::numeric as gross, null::numeric as vat, null::numeric as fee,
         null::numeric as refund, null::numeric as refund_tax, null::numeric as refund_fee,
         true as has_refund, true as refund_unknown, true as refund_tax_gap, true as refund_fee_gap
  from parsed r
  where r.event_type = 'order_refunded' and r.resource_id is not null
    and not exists (select 1 from public.purchases p
                    where p.lemonsqueezy_order_id = r.resource_id)
    and not exists (select 1 from parsed i
      where i.event_type = 'subscription_payment_refunded'
        and i.a->>'order_id' = r.resource_id)
  group by r.resource_id
),
sales as (
  select * from course_sales
  union all select * from invoice_sales
  union all select * from unlinked_refunds
),
lines as (
  select s.sold_at, s.kind, s.product, s.currency,
         coalesce(nullif(pr.acquisition_source, ''), 'untracked') as source,
         coalesce(nullif(pr.acquisition_medium, ''), 'untracked') as channel,
         case when s.currency <> 'UNKNOWN' then s.gross end as gross,
         (s.gross is null or s.currency = 'UNKNOWN') as gross_unknown,
         case when not s.has_refund and not s.refund_unknown then 0::numeric
              when not s.refund_unknown then s.refund end as refund,
         s.refund_unknown,
         -- VAT and fee net of their refunded share (A's sale VAT - refunded VAT).
         case when s.vat is null then null
              when not s.has_refund and not s.refund_tax_gap then s.vat
              when not s.refund_tax_gap then s.vat - s.refund_tax end as vat_net,
         (s.vat is null or s.refund_tax_gap) as vat_unknown,
         case when s.fee is null then null
              when not s.has_refund and not s.refund_fee_gap then s.fee
              when not s.refund_fee_gap then s.fee - s.refund_fee end as lemon_squeezy_fee_net,
         (s.fee is null or s.refund_fee_gap) as fee_unknown,
         -- AI cost, 90 days after the sale. Until public.ai_usage exists:
         null::numeric as ai_cost_90d,
         true as ai_cost_unknown,
         -- Once ai_usage exists, add to the FROM list below:
         --   left join lateral (
         --     select sum(u.cost_eur) as ai_cost_90d  -- VERIFY: column name, unit, currency
         --     from public.ai_usage u
         --     where u.user_id = s.buyer_id
         --       and u.created_at >= s.sold_at
         --       and u.created_at < s.sold_at + interval '90 days'
         --   ) ai on true
         -- then select ai.ai_cost_90d, and set ai_cost_unknown to
         --   (s.buyer_id is null or s.sold_at + interval '90 days' > params.as_of)
         -- (coalesce the sum to 0 only when the buyer is known and the window closed).
         (s.sold_at + interval '90 days' <= params.as_of) as ai_window_closed,
         null::numeric as channel_cost,
         true as channel_cost_unknown
  from sales s
  cross join params
  left join public.profiles pr on pr.id = s.buyer_id
)
select row_number() over (order by sold_at, kind, product) as sale_no,
       (sold_at at time zone 'UTC')::date as sale_day,
       kind, product, currency, source, channel,
       gross, gross_unknown,
       vat_net, vat_unknown,
       lemon_squeezy_fee_net, fee_unknown,
       refund, refund_unknown,
       gross - refund - vat_net - lemon_squeezy_fee_net as contribution_before_ai_channel,
       (gross_unknown or vat_unknown or fee_unknown or refund_unknown)
         as contribution_before_ai_channel_unknown,
       ai_cost_90d, ai_cost_unknown, ai_window_closed,
       channel_cost, channel_cost_unknown,
       gross - refund - vat_net - lemon_squeezy_fee_net - ai_cost_90d - channel_cost
         as contribution,
       (gross_unknown or vat_unknown or fee_unknown or refund_unknown
         or ai_cost_unknown or channel_cost_unknown) as contribution_unknown
from lines
order by sale_no desc;

-- 2. Summary per source / channel / kind / product / currency. Same CTEs as 1
-- (repeated so each statement runs alone). Known sums are partial whenever their
-- unknown count is above zero; a sum is only complete with unknown count 0.
with
params as (select now() as as_of),
raw as (
  select w.event_type, w.created_at,
         nullif(w.payload->'data'->>'id', '') as resource_id,
         w.payload->'data'->'attributes' as a,
         nullif(w.payload->'meta'->'custom_data'->>'user_id', '') as custom_user_id
  from public.webhook_logs w, params p
  where w.created_at < p.as_of
    and w.event_type in ('order_created', 'order_refunded',
      'subscription_payment_success', 'subscription_payment_recovered',
      'subscription_payment_refunded')
    and coalesce(w.payload->'meta'->>'test_mode', 'false') <> 'true'
    and coalesce(w.payload->'data'->'attributes'->>'test_mode', 'false') <> 'true'
),
parsed as (
  select event_type, created_at, resource_id, a, custom_user_id,
         coalesce(nullif(upper(a->>'currency'), ''), 'UNKNOWN') as currency,
         case when a->>'total' ~ '^[0-9]+$' then (a->>'total')::numeric / 100 end as total,
         case when a->>'tax' ~ '^[0-9]+$' then (a->>'tax')::numeric / 100 end as tax,
         case when coalesce(a->>'fee', a->>'fees') ~ '^[0-9]+$'
           then coalesce(a->>'fee', a->>'fees')::numeric / 100 end as fee,
         case when a->>'refunded_amount' ~ '^[0-9]+$'
           then (a->>'refunded_amount')::numeric / 100
           when (a->>'refunded' = 'true' or a->>'status' = 'refunded')
             and a->>'total' ~ '^[0-9]+$' then (a->>'total')::numeric / 100 end as refund,
         case when a->>'refunded_tax' ~ '^[0-9]+$'
           then (a->>'refunded_tax')::numeric / 100
           when (a->>'refunded' = 'true' or a->>'status' = 'refunded')
             and a->>'tax' ~ '^[0-9]+$' then (a->>'tax')::numeric / 100 end as refund_tax,
         case when a->>'refunded_fee' ~ '^[0-9]+$'
           then (a->>'refunded_fee')::numeric / 100 end as refund_fee
  from raw
),
orders as (
  select resource_id, max(currency) as currency, max(tax) as tax, max(fee) as fee
  from parsed where event_type = 'order_created' and resource_id is not null
  group by resource_id
),
refunds as (
  select case when event_type = 'order_refunded' then 'order' else 'invoice' end as kind,
         resource_id,
         max(refund) as refund, max(refund_tax) as refund_tax, max(refund_fee) as refund_fee,
         bool_or(refund is null) as refund_gap,
         bool_or(refund_tax is null) as tax_gap,
         bool_or(refund_fee is null) as fee_gap
  from parsed
  where event_type in ('order_refunded', 'subscription_payment_refunded')
    and resource_id is not null
  group by 1, resource_id
),
course_sales as (
  select p.created_at as sold_at, 'course'::text as kind, p.product_key as product,
         coalesce(o.currency, 'UNKNOWN') as currency, p.user_id as buyer_id,
         p.price_paid as gross, o.tax as vat, o.fee as fee,
         r.refund, r.refund_tax, r.refund_fee,
         (r.resource_id is not null) as has_refund,
         case when r.resource_id is not null then r.refund_gap
              else p.status = 'refunded' end as refund_unknown,
         coalesce(r.tax_gap, p.status = 'refunded') as refund_tax_gap,
         coalesce(r.fee_gap, p.status = 'refunded') as refund_fee_gap
  from public.purchases p
  cross join params
  left join orders o on o.resource_id = p.lemonsqueezy_order_id
  left join refunds r on r.kind = 'order' and r.resource_id = p.lemonsqueezy_order_id
  where p.created_at < params.as_of
),
payments as (
  select resource_id, min(created_at) as sold_at, max(currency) as currency,
         max(total) as gross, max(tax) as tax, max(fee) as fee,
         max(nullif(a->>'subscription_id', '')) as subscription_id,
         max(custom_user_id) as custom_user_id
  from parsed
  where event_type in ('subscription_payment_success', 'subscription_payment_recovered')
    and resource_id is not null
  group by resource_id
),
invoice_sales as (
  select pm.sold_at, 'subscription_invoice'::text as kind,
         'subscription_' || coalesce(s.plan_type, 'unknown') as product,
         pm.currency,
         coalesce(s.user_id,
           case when pm.custom_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             then pm.custom_user_id::uuid end) as buyer_id,
         pm.gross, pm.tax as vat, pm.fee,
         r.refund, r.refund_tax, r.refund_fee,
         (r.resource_id is not null) as has_refund,
         coalesce(r.refund_gap, false) as refund_unknown,
         coalesce(r.tax_gap, false) as refund_tax_gap,
         coalesce(r.fee_gap, false) as refund_fee_gap
  from payments pm
  left join public.subscriptions s on s.lemonsqueezy_subscription_id = pm.subscription_id
  left join refunds r on r.kind = 'invoice' and r.resource_id = pm.resource_id
),
unlinked_refunds as (
  select min(r.created_at) as sold_at, 'unlinked_order_refund'::text as kind,
         'unknown'::text as product, max(r.currency) as currency, null::uuid as buyer_id,
         0::numeric as gross, null::numeric as vat, null::numeric as fee,
         null::numeric as refund, null::numeric as refund_tax, null::numeric as refund_fee,
         true as has_refund, true as refund_unknown, true as refund_tax_gap, true as refund_fee_gap
  from parsed r
  where r.event_type = 'order_refunded' and r.resource_id is not null
    and not exists (select 1 from public.purchases p
                    where p.lemonsqueezy_order_id = r.resource_id)
    and not exists (select 1 from parsed i
      where i.event_type = 'subscription_payment_refunded'
        and i.a->>'order_id' = r.resource_id)
  group by r.resource_id
),
sales as (
  select * from course_sales
  union all select * from invoice_sales
  union all select * from unlinked_refunds
),
lines as (
  select s.sold_at, s.kind, s.product, s.currency,
         coalesce(nullif(pr.acquisition_source, ''), 'untracked') as source,
         coalesce(nullif(pr.acquisition_medium, ''), 'untracked') as channel,
         case when s.currency <> 'UNKNOWN' then s.gross end as gross,
         (s.gross is null or s.currency = 'UNKNOWN') as gross_unknown,
         case when not s.has_refund and not s.refund_unknown then 0::numeric
              when not s.refund_unknown then s.refund end as refund,
         s.refund_unknown,
         case when s.vat is null then null
              when not s.has_refund and not s.refund_tax_gap then s.vat
              when not s.refund_tax_gap then s.vat - s.refund_tax end as vat_net,
         (s.vat is null or s.refund_tax_gap) as vat_unknown,
         case when s.fee is null then null
              when not s.has_refund and not s.refund_fee_gap then s.fee
              when not s.refund_fee_gap then s.fee - s.refund_fee end as lemon_squeezy_fee_net,
         (s.fee is null or s.refund_fee_gap) as fee_unknown,
         null::numeric as ai_cost_90d,
         true as ai_cost_unknown,
         (s.sold_at + interval '90 days' <= params.as_of) as ai_window_closed,
         null::numeric as channel_cost,
         true as channel_cost_unknown
  from sales s
  cross join params
  left join public.profiles pr on pr.id = s.buyer_id
),
margins as (
  select *,
         gross - refund - vat_net - lemon_squeezy_fee_net as contribution_before_ai_channel,
         (gross_unknown or vat_unknown or fee_unknown or refund_unknown)
           as contribution_before_ai_channel_unknown
  from lines
)
select source, channel, kind, product, currency,
       count(*) as sales,
       coalesce(sum(gross), 0) as gross_known,
       count(*) filter (where gross_unknown) as gross_unknown_sales,
       coalesce(sum(vat_net), 0) as vat_net_known,
       count(*) filter (where vat_unknown) as vat_unknown_sales,
       coalesce(sum(lemon_squeezy_fee_net), 0) as lemon_squeezy_fee_net_known,
       count(*) filter (where fee_unknown) as fee_unknown_sales,
       coalesce(sum(refund), 0) as refund_known,
       count(*) filter (where refund_unknown) as refund_unknown_sales,
       coalesce(sum(contribution_before_ai_channel), 0) as contribution_before_ai_channel_known,
       count(*) filter (where contribution_before_ai_channel_unknown)
         as contribution_before_ai_channel_unknown_sales,
       case when count(*) filter (where contribution_before_ai_channel_unknown) = 0
         then round(sum(contribution_before_ai_channel) / count(*), 2)
       end as contribution_before_ai_channel_per_sale,
       null::numeric as ai_cost_90d,
       count(*) filter (where ai_cost_unknown) as ai_cost_unknown_sales,
       count(*) filter (where ai_window_closed) as ai_window_closed_sales,
       null::numeric as channel_cost,
       count(*) filter (where channel_cost_unknown) as channel_cost_unknown_sales
from margins
group by source, channel, kind, product, currency
order by source, channel, kind, product, currency;
