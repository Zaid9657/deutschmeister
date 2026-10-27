-- Controller backlog c3: Monday packet. Verified 2026-10-19: all five queries ran read-only against the live schema.
-- Only SELECT/WITH statements and read-only PostgreSQL built-ins. No RPCs.
-- Sources: migrations/, weekly-truth.mjs and pulse.sql; all tables are public.
-- Run with an already-authorized reader that can see all relevant rows, not a
-- customer-scoped RLS session. Results contain aggregates and fixed labels only.
-- Keep each statement's as_of unchanged when comparing successive packet runs.

-- A. P&L: rolling 7/30 days; amounts in major currency units, one row per currency.
-- Gross = VAT-inclusive collections BEFORE refunds, including refunded purchases.
-- Net = gross - gross refunds - (sale VAT - refunded VAT) - (fees - fee credits).
-- This is payment contribution, before AI cost/CAC/overheads, not operating profit.
-- purchases.price_paid is already major units; webhook monetary fields are cents.
-- Never add order_created or subscriptions.price_paid to subscription invoices:
-- the first subscription payment would be counted twice; subscriptions is a snapshot.
-- Include financially successful events even if processed=false: local delivery
-- failure does not undo the payment. Collapse retries across the entire log history.
-- VERIFY: Payload currency/test_mode, tax, fee (or numeric fees), refunded_amount,
-- refunded_tax and refunded_fee are optional provider fields, not SQL columns.
-- Confirm their units and that refund fields are cumulative per resource. Absent
-- values stay unknown; never infer VAT at 19%, fees at a tariff, or fee credits at 0.
-- Also confirm purchases contain no test orders: that table has no test_mode column.
-- VERIFY: subscription_payment_recovered/payment_refunded use the same invoice
-- data.id as payment_success. A refund invoice's attributes.order_id, when present,
-- links the corresponding order_refunded; validate this before relying on coverage.
-- Unlinked non-course order refunds force unknown totals instead of double-counting.
-- VERIFY: Time basis is first webhook receipt (webhook_logs.created_at), not bank
-- settlement. purchases.updated_at only locates a missing-refund-log warning; it
-- is not a proven refund timestamp. Reconcile missing logs before closing accounts.
with
params as (select now() as as_of),
windows as (
  select days, as_of - days * interval '1 day' as since, as_of
  from params cross join (values (7), (30)) d(days)
),
raw as (
  select w.event_type, w.created_at,
         nullif(w.payload->'data'->>'id', '') as resource_id,
         w.payload->'data'->'attributes' as a
  from public.webhook_logs w, params p
  where w.created_at < p.as_of
    and w.event_type in ('order_created', 'order_refunded',
      'subscription_payment_success', 'subscription_payment_recovered',
      'subscription_payment_refunded')
    and coalesce(w.payload->'meta'->>'test_mode', 'false') <> 'true'
    and coalesce(w.payload->'data'->'attributes'->>'test_mode', 'false') <> 'true'
),
parsed as (
  select event_type, created_at, resource_id, a,
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
payments as (
  select resource_id, min(created_at) as occurred_at, max(currency) as currency,
         max(total) as gross, max(tax) as tax, max(fee) as fee
  from parsed
  where event_type in ('subscription_payment_success', 'subscription_payment_recovered')
    and resource_id is not null
  group by resource_id
),
refund_snapshots as (
  select case when r.event_type = 'order_refunded' then 'order' else 'invoice' end as kind,
         r.resource_id, r.currency, r.refund, max(r.refund_tax) as refund_tax,
         max(r.refund_fee) as refund_fee, min(r.created_at) as occurred_at
  from parsed r
  where r.resource_id is not null
    and (r.event_type = 'subscription_payment_refunded'
      or (r.event_type = 'order_refunded' and exists (
        select 1 from public.purchases p where p.lemonsqueezy_order_id = r.resource_id)))
  group by 1, r.resource_id, r.currency, r.refund
),
refund_history as (
  select *,
    max(refund) over previous as previous_refund,
    lag(refund_tax, 1, 0::numeric) over sequence as previous_tax,
    lag(refund_fee, 1, 0::numeric) over sequence as previous_fee
  from refund_snapshots
  window sequence as (partition by kind, resource_id order by occurred_at, refund nulls first),
         previous as (partition by kind, resource_id order by occurred_at, refund nulls first
                      rows between unbounded preceding and 1 preceding)
),
movements as (
  select p.created_at as occurred_at, coalesce(o.currency, 'UNKNOWN') as currency,
         p.price_paid as gross, o.tax as vat, o.fee as fee, 0::numeric as refund
  from public.purchases p left join orders o on o.resource_id = p.lemonsqueezy_order_id
  union all
  select occurred_at, currency, gross, tax, fee, 0::numeric from payments
  union all
  select occurred_at, currency, 0,
         case when refund_tax is not null and previous_tax is not null
           then -greatest(refund_tax - previous_tax, 0) end,
         case when refund_fee is not null and previous_fee is not null
           then -greatest(refund_fee - previous_fee, 0) end,
         case when refund is not null
           then greatest(refund - coalesce(previous_refund, 0), 0) end
  from refund_history
  union all
  -- Missing resource IDs cannot be safely deduplicated or booked.
  select created_at, currency, null, null, null, null from parsed
  where resource_id is null
  union all
  -- A refunded purchase may be partial: never substitute its original full price.
  select p.updated_at, coalesce(o.currency, 'UNKNOWN'), 0, null, null, null
  from public.purchases p left join orders o on o.resource_id = p.lemonsqueezy_order_id
  where p.status = 'refunded' and not exists (
    select 1 from parsed r where r.event_type = 'order_refunded'
      and r.resource_id = p.lemonsqueezy_order_id)
  union all
  -- Non-course order refund without a verified invoice link: amount is unbooked.
  select min(r.created_at), r.currency, 0, null, null, null
  from parsed r
  where r.event_type = 'order_refunded' and r.resource_id is not null
    and not exists (select 1 from public.purchases p
                    where p.lemonsqueezy_order_id = r.resource_id)
    and not exists (select 1 from parsed i
      where i.event_type = 'subscription_payment_refunded'
        and i.a->>'order_id' = r.resource_id)
  group by r.resource_id, r.currency
),
currencies as (
  select distinct currency from movements, params
  where occurred_at >= as_of - interval '30 days' and occurred_at < as_of
  union select 'EUR' -- stable zero row when there is no recent EUR activity
),
totals as (
  select w.days, c.currency,
    coalesce(sum(m.gross), 0) as gross_known,
    coalesce(sum(m.vat), 0) as vat_known,
    coalesce(sum(m.fee), 0) as fees_known,
    coalesce(sum(m.refund), 0) as refunds_known,
    coalesce(bool_or(m.gross is null) filter (where m.occurred_at is not null), false) as gross_unknown,
    coalesce(bool_or(m.vat is null) filter (where m.occurred_at is not null), false) as vat_unknown,
    coalesce(bool_or(m.fee is null) filter (where m.occurred_at is not null), false) as fees_unknown,
    coalesce(bool_or(m.refund is null) filter (where m.occurred_at is not null), false) as refunds_unknown
  from windows w cross join currencies c
  left join movements m on m.currency = c.currency
    and m.occurred_at >= w.since and m.occurred_at < w.as_of
  group by w.days, c.currency
)
select days, currency,
       case when not gross_unknown and currency <> 'UNKNOWN' then gross_known end as gross_revenue,
       (gross_unknown or currency = 'UNKNOWN') as gross_unknown,
       case when currency <> 'UNKNOWN' then vat_known end as vat_known,
       (vat_unknown or currency = 'UNKNOWN') as vat_unknown,
       case when currency <> 'UNKNOWN' then fees_known end as lemon_squeezy_fees_known,
       (fees_unknown or currency = 'UNKNOWN') as fees_unknown,
       case when currency <> 'UNKNOWN' then refunds_known end as refunds_known,
       (refunds_unknown or currency = 'UNKNOWN') as refunds_unknown,
       case when not (gross_unknown or vat_unknown or fees_unknown or refunds_unknown)
                  and currency <> 'UNKNOWN'
         then gross_known - refunds_known - vat_known - fees_known end as net,
       (gross_unknown or vat_unknown or fees_unknown or refunds_unknown
         or currency = 'UNKNOWN') as net_unknown
from totals order by days, currency;

-- B. Pilot funnel: last-30-day purchase cohort, current refund/access state.
-- All three counts use the same cohort; refunds are NOT all refund events in 30d.
-- Active access means course access (status=active), not the included Pro window:
-- purchases.access_until only governs that window under the current migration.
-- No offer-view/checkout denominator is available here; do not invent conversion.
with params as (select now() as as_of)
select 'telc_b1_komplett' as product_key,
       count(*) as purchases_30d,
       count(*) filter (where p.status = 'refunded') as refunded_from_cohort,
       count(*) filter (where p.status = 'active') as active_access_from_cohort
from public.purchases p, params t
where p.product_key = 'telc_b1_komplett'
  and p.created_at >= t.as_of - interval '30 days' and p.created_at < t.as_of;

-- C. Canary: last 7 completed UTC days, per role/day, plus 7d/14d timing totals.
-- Generate every slot before joining observations, so empty tables show misses.
-- Seen starts are raw starts; seen cycles count distinct slots (fulfilment needs 3).
-- A duplicate start cannot make up for a missing slot. Overnight is heartbeat-only
-- and does not need an end. Other starts need a matching end before the next start
-- in the same slot; a later run's end must not close an abandoned earlier start.
-- Verified 2026-10-27 against live agent_heartbeats (agent='orchestrator', rows
-- 2026-10-20..27); the table has no phase/run_id columns, so phase comes from labels:
-- start = note 'v5 start' (older: 'start'), or wake ending ' start'; end = wake
-- '<role>-HHMM-end' (any note), or the start's own wake with note 'v5 end...'
-- (older: 'end...'), or wake ending ' end'. 'overnight 00:50' is a start by itself.
-- Wake minutes drift (controller-0550/0551, sales-0610/0615): a row belongs to a
-- slot by role prefix (controller-, sales-, distribution-, fulfilment-) and
-- created_at within [slot - 10 min, slot + 3 h) on that UTC day, never by exact
-- wake. A role row that is neither start nor end, or falls outside every slot
-- window, is ambiguous, never an assumed start. Other wakes (supervisor-*,
-- support-desk-*, revenue-*, build-wave-*, night-0050 ...) are member/aux runs and
-- are ignored. A start's end is the first end for that role+slot after it and
-- before the slot's next start.
-- VERIFY: Confirm v5/canary activation timestamp and separately attest deliberate
-- session-loss evidence. Defaults use the documented first v5 fire; false prevents
-- certification without evidence. Heartbeat gaps are a recovery-time proxy only.
-- Gaps include silent leading/trailing edges; no starts gives 168h/336h, not zero.
-- These completed-day windows exclude today's unfinished controller run.
with
params as (
  select now() as as_of,
         date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' as report_to,
         timestamptz '2026-10-19 12:27:00+00' as canary_started_at,
         false as deliberate_loss_verified
),
schedule(role, utc_time, needs_end) as (
  values ('controller', time '05:50', true),
         ('sales', time '06:10', true),
         ('distribution', time '06:40', true),
         ('fulfilment', time '07:20', true),
         ('fulfilment', time '12:20', true),
         ('fulfilment', time '18:20', true),
         ('overnight', time '00:50', false)
),
days as (
  select (p.report_to at time zone 'UTC')::date - n as day
  from params p cross join generate_series(1, 14) n
),
slots as (
  select d.day, s.role, s.needs_end,
         (d.day + s.utc_time) at time zone 'UTC' as expected_at
  from days d cross join schedule s
),
labels as (
  select h.id, h.created_at,
    lower(trim(h.wake)) as wake,
    regexp_replace(lower(trim(h.wake)), '[- ](start|end)$', '') as base_wake,
    lower(trim(coalesce(h.note, ''))) as note
  from public.agent_heartbeats h, params p
  where h.agent = 'orchestrator'
    and h.created_at >= p.report_to - interval '14 days'
    and h.created_at < p.as_of
),
classified as (
  select l.id, l.created_at,
    case when l.base_wake = 'overnight 00:50' then 'overnight'
         else substring(l.base_wake from '^(controller|sales|distribution|fulfilment)-') end as role,
    case when l.wake ~ '[- ]end$' or l.note ~ '^(v5 )?end([[:space:][:punct:]]|$)' then 'end'
         when l.wake ~ ' start$' or l.note ~ '^(v5 )?start([[:space:][:punct:]]|$)' then 'start'
         when l.wake = 'overnight 00:50' then 'start'
         else 'ambiguous' end as phase
  from labels l
),
heartbeats as (
  select c.id, c.created_at, c.role,
    case when sl.expected_at is null then 'ambiguous' else c.phase end as phase,
    sl.expected_at, sl.needs_end
  from classified c
  left join slots sl on sl.role = c.role
    and c.created_at >= sl.expected_at - interval '10 minutes'
    and c.created_at < sl.expected_at + interval '3 hours'
  where c.role is not null
),
starts as (
  select h.*,
    lead(created_at) over (partition by role, expected_at order by created_at, id) as next_start
  from heartbeats h where phase = 'start'
),
paired as (
  select s.*,
    (not s.needs_end or exists (
      select 1 from heartbeats e
      where e.role = s.role and e.expected_at = s.expected_at and e.phase = 'end'
        and (e.created_at, e.id) > (s.created_at, s.id)
        and (s.next_start is null or e.created_at < s.next_start)
    )) as has_end
  from starts s
),
daily as (
  select sl.day, sl.role, count(*) as expected_starts,
    sum((select count(*) from paired s
         where s.role = sl.role and s.expected_at = sl.expected_at)) as seen_starts,
    count(*) filter (where exists (select 1 from paired s
      where s.role = sl.role and s.expected_at = sl.expected_at)) as seen_cycles,
    sum((select count(*) from paired s where s.role = sl.role
         and s.expected_at = sl.expected_at and not s.has_end)) as starts_without_end,
    sum((select count(*) from heartbeats h where h.role = sl.role and h.phase = 'ambiguous'
         and h.expected_at = sl.expected_at))
    + (select count(*) from heartbeats h where h.role = sl.role and h.expected_at is null
         and (h.created_at at time zone 'UTC')::date = sl.day) as ambiguous_rows
  from slots sl group by sl.day, sl.role
),
windows as (
  select days, report_to - days * interval '1 day' as since, report_to
  from params cross join (values (7), (14)) d(days)
),
gap_points as (
  select days, since as ts from windows
  union select days, report_to from windows
  union select w.days, s.created_at from windows w join starts s
    on s.created_at >= w.since and s.created_at < w.report_to
),
gaps as (
  select days, ts - lag(ts) over (partition by days order by ts) as gap from gap_points
),
summary as (
  select w.days,
    sum(d.expected_starts - d.seen_cycles) as missed_cycles,
    sum(d.starts_without_end) as starts_without_end,
    sum(d.ambiguous_rows) as ambiguous_rows,
    (select max(extract(epoch from gap) / 3600) from gaps g where g.days = w.days) as longest_gap_hours
  from windows w join daily d
    on d.day >= (w.since at time zone 'UTC')::date
   and d.day < (w.report_to at time zone 'UTC')::date
  group by w.days
),
checks as (
  select s.*,
    case when s.missed_cycles > 1 or s.longest_gap_hours > 24
           or s.starts_without_end > 0 or s.ambiguous_rows > 0 then 'FAIL'
         else 'PASS' end as timing_check
  from summary s
)
select d.day, d.role, d.expected_starts, d.seen_starts, d.seen_cycles,
       d.expected_starts - d.seen_cycles as missed_cycles,
       d.starts_without_end, d.ambiguous_rows,
       c7.longest_gap_hours as longest_gap_hours_7d,
       c7.missed_cycles as missed_cycles_7d, c7.timing_check as timing_check_7d,
       c14.missed_cycles as missed_cycles_14d,
       c14.longest_gap_hours as longest_gap_hours_14d,
       case when p.report_to - interval '14 days' < p.canary_started_at then 'PENDING'
            when c14.timing_check = 'FAIL' then 'FAIL'
            when not p.deliberate_loss_verified then 'PENDING'
            else c14.timing_check end as canary_14d,
       (d.day < (p.canary_started_at at time zone 'UTC')::date) as before_v5
from daily d cross join params p
join checks c7 on c7.days = 7 join checks c14 on c14.days = 14
where d.day >= (p.report_to at time zone 'UTC')::date - 7
order by d.day, d.role;

-- D. Failed renewals: all recorded failed invoice IDs, outcomes as of now; counts only.
-- Never group failures by subscription alone: each renewal has its own invoice.
-- An unrelated later invoice's payment must not mark the failed one recovered.
-- Recovery wins for that invoice even if its subscription is subsequently cancelled.
-- VERIFY: attributes.updated_at versions genuine provider payment attempts. Exact
-- re-deliveries of a version count once; without it, attempts are a lower bound
-- (one unversioned attempt per invoice), explicitly counted as unknown below.
-- webhook_logs.created_at counts deliveries, not distinct payment attempts.
with
params as (select now() as as_of),
events as (
  select w.event_type, w.created_at,
    nullif(w.payload->'data'->>'id', '') as resource_id,
    nullif(w.payload->'data'->'attributes'->>'subscription_id', '') as subscription_id,
    nullif(w.payload->'data'->'attributes'->>'updated_at', '') as attempt_version
  from public.webhook_logs w, params p
  where w.created_at < p.as_of
    and w.event_type in ('subscription_payment_failed', 'subscription_payment_success',
      'subscription_payment_recovered', 'subscription_cancelled', 'subscription_expired')
    and coalesce(w.payload->'meta'->>'test_mode', 'false') <> 'true'
    and coalesce(w.payload->'data'->'attributes'->>'test_mode', 'false') <> 'true'
),
invoices as (
  select resource_id as invoice_id, max(subscription_id) as subscription_id,
    min(created_at) as first_failure,
    count(distinct coalesce(attempt_version, 'unversioned')) as attempts_lower_bound,
    bool_or(attempt_version is null) as attempts_unknown,
    count(*) as failed_webhook_deliveries
  from events where event_type = 'subscription_payment_failed' and resource_id is not null
  group by resource_id
),
classified as (
  select i.*,
    case when exists (select 1 from events e where e.resource_id = i.invoice_id
      and e.event_type in ('subscription_payment_success', 'subscription_payment_recovered'))
      then 'recovered'
    when exists (select 1 from events e where e.resource_id = i.subscription_id
      and e.event_type in ('subscription_cancelled', 'subscription_expired')
      and e.created_at >= i.first_failure)
      or exists (select 1 from public.subscriptions s
        where s.lemonsqueezy_subscription_id = i.subscription_id
          and s.status in ('cancelled', 'expired')) then 'cancelled or expired'
    else 'unresolved' end as outcome
  from invoices i
),
outcomes(outcome) as (values ('recovered'), ('cancelled or expired'), ('unresolved'))
select o.outcome, count(c.invoice_id) as unique_invoices,
       coalesce(sum(c.attempts_lower_bound), 0) as attempts_lower_bound,
       count(*) filter (where c.attempts_unknown) as invoices_with_unknown_attempts,
       coalesce(sum(c.failed_webhook_deliveries), 0) as failed_webhook_deliveries,
       (select count(*) from events where event_type = 'subscription_payment_failed'
          and resource_id is null) as unkeyed_failure_deliveries
from outcomes o left join classified c using (outcome)
group by o.outcome order by o.outcome;

-- E. Open incidents now: include zero rows for every schema-defined severity.
with severities(severity, priority) as (
  values ('critical', 1), ('high', 2), ('medium', 3), ('low', 4)
)
select s.severity, count(i.id) as open_incidents
from severities s left join public.agent_incidents i
  on i.severity = s.severity and i.resolved_at is null
group by s.severity, s.priority order by s.priority;
