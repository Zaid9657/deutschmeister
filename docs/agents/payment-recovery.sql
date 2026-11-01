-- Monday packet: failed RENEWAL invoices -> dunning evidence -> later payment.
-- READ ONLY. No new view, endpoint, table, policy, migration or send.
-- Run with an already-authorized reader. Schema/provider data NOT verified live.
-- One invoice is counted once across payment_failures and duplicate webhooks.
-- Match success/recovered by INVOICE AND SUBSCRIPTION, never subscription alone.
-- Amounts: gross failed invoice balance in major currency units, NOT net sales,
-- not attributed lift, not recurring revenue. Recovered means that same invoice
-- subsequently has a successful payment event. Refunds belong in the P&L.
-- Keep currencies separate; unknown/conflicting totals stay unknown, not zero.
-- Cohort = first observed failure in the last 90 days; later payments through
-- as_of count. VERIFY provider total is minor units and receipt timestamps are
-- adequate: delayed/out-of-order events can leave recovery unverified.
--
-- DELIVERY GAP: dunning_sent_at means API acceptance, NOT receipt/delivery.
-- There is no delivery-event ledger in this checkout. Paste an authorized
-- Resend export into delivery_receipts as VALUES (provider_id, delivered_at),
-- using email.delivered events only; never infer delivery from HTTP 2xx.
-- Default empty input truthfully reports delivery_unknown. No email addresses
-- are needed or emitted. Duplicate receipt rows are collapsed below.
--
-- After OWNER applies the retry schema, replace claim_receipts's empty SELECT
-- with: SELECT message_key, provider_id, accepted_at FROM public.mail_delivery_claims
-- WHERE kind = 'dunning'; this also recovers evidence after a legacy-stamp error.
-- Default query runs before that migration. Old sends without provider ids
-- cannot be linked reliably; leave delivery unknown, never match by email.
with
params as (select now() as as_of, now() - interval '90 days' as cohort_start),
delivery_receipts(provider_id, delivered_at) as (
  select null::text, null::timestamptz where false
),
claim_receipts(message_key, provider_id, accepted_at) as (
  select null::text, null::text, null::timestamptz where false
),
events as (
  select w.event_type, w.created_at as observed_at, w.payload
  from public.webhook_logs w, params p
  where w.created_at < p.as_of and w.event_type in
    ('subscription_payment_failed', 'subscription_payment_success', 'subscription_payment_recovered')
  union all
  select 'subscription_payment_failed', f.failed_at, f.raw_payload
  from public.payment_failures f, params p where f.failed_at < p.as_of
),
parsed as (
  select event_type, observed_at, payload,
    nullif(payload->'data'->>'id', '') as invoice_id,
    nullif(payload->'data'->'attributes'->>'subscription_id', '') as subscription_id,
    payload->'data'->'attributes'->>'billing_reason' as billing_reason,
    coalesce(nullif(upper(payload->'data'->'attributes'->>'currency'), ''), 'UNKNOWN') as currency,
    case when payload->'data'->'attributes'->>'total' ~ '^[0-9]+$'
      then (payload->'data'->'attributes'->>'total')::numeric / 100 end as amount
  from events
  where coalesce(payload->'meta'->>'test_mode', 'false') <> 'true'
    and coalesce(payload->'data'->'attributes'->>'test_mode', 'false') <> 'true'
),
failed as (
  select invoice_id, case when count(distinct subscription_id) = 1 and not bool_or(subscription_id is null)
      then max(subscription_id) end as subscription_id,
    min(observed_at) as failed_at,
    case when count(distinct currency) = 1 then max(currency) else 'UNKNOWN' end as currency,
    case when count(distinct amount) = 1 and not bool_or(amount is null)
      and count(distinct currency) = 1 and max(currency) <> 'UNKNOWN'
      then max(amount) end as balance
  from parsed
  where event_type = 'subscription_payment_failed' and billing_reason = 'renewal'
    and invoice_id is not null
  group by invoice_id
),
cohort as (
  select f.* from failed f, params p where f.failed_at >= p.cohort_start
),
accepted as (
  select f.lemonsqueezy_event_id as invoice_id,
    f.raw_payload->>'dunning_provider_id' as provider_id,
    case when f.raw_payload->>'dunning_sent_at' ~ '^\d{4}-\d{2}-\d{2}T'
      then (f.raw_payload->>'dunning_sent_at')::timestamptz end as accepted_at
  from public.payment_failures f
  union all
  select substring(message_key from length('dunning:') + 1), provider_id, accepted_at
  from claim_receipts where message_key like 'dunning:%'
),
receipts as (
  select provider_id, min(delivered_at) as delivered_at
  from delivery_receipts where delivered_at is not null group by provider_id
),
reconciled as (
  select c.*,
    (select min(s.observed_at) from parsed s, params p
      where s.event_type in ('subscription_payment_success', 'subscription_payment_recovered')
        and s.invoice_id = c.invoice_id and s.subscription_id = c.subscription_id
        and s.observed_at >= c.failed_at and s.observed_at < p.as_of) as paid_at,
    (select min(a.accepted_at) from accepted a, params p
      where a.invoice_id = c.invoice_id and a.accepted_at >= c.failed_at and a.accepted_at < p.as_of) as accepted_at,
    (select min(r.delivered_at) from accepted a join receipts r on r.provider_id = a.provider_id, params p
      where a.invoice_id = c.invoice_id and r.delivered_at >= a.accepted_at
        and a.accepted_at >= c.failed_at and r.delivered_at < p.as_of) as delivered_at
  from cohort c
),
lines as (
  select row_number() over (order by failed_at, invoice_id) as invoice_no, *,
    case when subscription_id is null then 'recovery_unknown'
      when paid_at is null then 'unrecovered' else 'recovered' end as recovery_state,
    case when delivered_at is not null then 'delivered'
      when accepted_at is not null then 'accepted_delivery_unknown'
      else 'send_unknown' end as delivery_state
  from reconciled
)
select currency, recovery_state, delivery_state, count(*) as invoices,
  coalesce(sum(balance), 0) as failed_balance_known,
  count(*) filter (where balance is null) as balance_unknown_invoices,
  coalesce(sum(balance) filter (where paid_at is not null), 0) as recovered_balance_known,
  coalesce(sum(balance) filter (where recovery_state = 'unrecovered'), 0) as unrecovered_balance_known,
  count(*) filter (where delivered_at < paid_at) as paid_after_verified_delivery,
  jsonb_agg(jsonb_build_object('invoice_no', invoice_no,
    'failed_day', (failed_at at time zone 'UTC')::date, 'balance', balance,
    'accepted_at', accepted_at, 'delivered_at', delivered_at, 'paid_at', paid_at)
    order by invoice_no) as invoice_details
from lines
group by currency, recovery_state, delivery_state
order by currency, recovery_state, delivery_state;
