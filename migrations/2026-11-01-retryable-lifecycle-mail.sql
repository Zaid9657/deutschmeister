-- DRAFT / NOT APPLIED. OWNER ONLY: approve mail retry release, new service-only
-- RPC/table policies, late-mail consent basis and kinds BEFORE applying.
-- No customer mail or settings changes are performed by this file.
-- Requires existing lifecycle_emails (including course_reminder kinds).
-- Rollback: disable LIFECYCLE_LATE_TRIAL_ENABLED, LIFECYCLE_RETRY_ENABLED and
-- PAYMENT_RECOVERY_RETRY_ENABLED. KEEP claims; do not delete or replay them.
begin;
alter table public.lifecycle_emails drop constraint if exists lifecycle_emails_kind_check;
alter table public.lifecycle_emails add constraint lifecycle_emails_kind_check check (
  kind in ('trial_day3', 'trial_day6', 'trial_ended', 'activation_d1', 'activation_d4', 'confirm_nudge',
    'trial_followup_d14', 'trial_followup_d30', 'trial_followup_d60')
  or kind ~ '^course_reminder_[0-9]{4}-[0-9]{2}-[0-9]{2}$'
);

CREATE TABLE IF NOT EXISTS public.mail_delivery_claims (
  message_key text primary key,
  scope_key text not null,
  kind text not null,
  user_id uuid references auth.users(id) on delete cascade,
  message jsonb not null,
  first_attempt_at timestamptz not null default now(),
  accepted_at timestamptz,
  closed_at timestamptz,
  provider_id text,
  last_error text
);
create index if not exists mail_delivery_scope_idx on public.mail_delivery_claims(scope_key, first_attempt_at);
alter table public.mail_delivery_claims enable row level security;
revoke all on public.mail_delivery_claims from public, anon, authenticated;
grant select, insert, update on public.mail_delivery_claims to service_role;

-- One transaction serializes claims per subscription/user-kind. Distinct
-- invoices cannot race the seven-day gate. An unfinished dunning claim blocks
-- new invoices (and is retried with its original payload). Permanent per-invoice
-- keys prevent replay even after the quiet period. No claim is ever deleted.
-- OWNER: after verified nonacceptance/cancellation, closed_at may close an
-- ambiguous claim (record the evidence in last_error) and release its scope.
-- Never stamp accepted_at without provider acceptance evidence.
create or replace function public.claim_retryable_mail(
  p_key text, p_scope text, p_kind text, p_user_id uuid,
  p_message jsonb, p_cooldown_seconds integer default 0
) returns setof public.mail_delivery_claims
language plpgsql security invoker set search_path = public, pg_temp as $$
declare existing public.mail_delivery_claims; claimed uuid;
begin
  if p_cooldown_seconds < 0 then raise exception 'invalid cooldown'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_scope, 0));
  select * into existing from public.mail_delivery_claims where message_key = p_key;
  if found then return next existing; return; end if;
  if p_cooldown_seconds > 0 then
    select * into existing from public.mail_delivery_claims
      where scope_key = p_scope and accepted_at is null and closed_at is null order by first_attempt_at limit 1;
    if found then return next existing; return; end if;
    if exists (select 1 from public.mail_delivery_claims where scope_key = p_scope
      and accepted_at > now() - make_interval(secs => p_cooldown_seconds)) then return; end if;
  else
    -- The unique user+kind is claimed BEFORE the outbox/request. Historical
    -- lifecycle rows with no outbox have unknown outcomes: never replay them.
    insert into public.lifecycle_emails(user_id, kind) values (p_user_id, p_kind)
      on conflict (user_id, kind) do nothing returning id into claimed;
    if claimed is null then return; end if;
  end if;
  return query insert into public.mail_delivery_claims(message_key, scope_key, kind, user_id, message)
    values (p_key, p_scope, p_kind, p_user_id, p_message) returning *;
end;
$$;
revoke all on function public.claim_retryable_mail(text,text,text,uuid,jsonb,integer) from public, anon, authenticated;
grant execute on function public.claim_retryable_mail(text,text,text,uuid,jsonb,integer) to service_role;
commit;
