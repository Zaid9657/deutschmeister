-- 2026-09-27 — Speaking sessions with zero learner turns: close them out and
-- give back what they took. DATA ONLY — no schema change (the status CHECK
-- already allows 'cancelled').
--
-- WHAT IT REPAIRS (measured read-only on 2026-09-27):
--   1. A trial user gets 2 lifetime speaking sessions (speaking_usage), and the
--      unit was recorded at session START. 12 practice sessions in which the
--      learner never produced a single message (7 of them in the last 30 days
--      = 35 % of that month's trial units) consumed one each — 10 users, two of
--      whom lost BOTH sessions that way; 2 of the 10 are still in their trial.
--   2. A session the learner walked away from (tab closed, Cancel) never sent
--      its 'end' call and stayed 'active' forever — 36 rows all-time.
--   3. `user_turns` was only ever written by that client 'end' call, so every
--      abandoned session reported 0 even when the learner had spoken (12 of the
--      18 'active' zero-turn rows in the last 30 days had 1–8 learner
--      messages), and a turn in flight at Finish/timer was not counted.
--
-- The code shipped alongside (netlify/functions/_shared/speakingCloseout.mjs,
-- the 'end' action, check-speaking-usage, the hourly speaking-closeout job)
-- keeps all three from happening again: the trial unit is written under the
-- session's own id and released when the session closes with zero learner
-- turns. Rows written BEFORE that code carry random ids, which is why this file
-- links them by time instead. It is safe to apply before or after the deploy.
--
-- Wallet: nothing to refund — speaking_wallet and speaking_wallet_transactions
-- were both empty on 2026-09-27 (the code refunds any future zero-turn debit).
-- speaking_session_reservations / speaking_credit_buckets: empty and unused.
--
-- PREVIEW / ROLLBACK DATA — run this first and keep its output; it lists the
-- speaking_usage rows step 1 deletes (to roll back, re-insert them verbatim):
--
--   with zero_turn as (
--     select ss.session_token, ss.user_id, ss.started_at
--     from public.speaking_sessions ss
--     where ss.mode <> 'placement' and ss.cost_cents = 0
--       and ss.started_at + make_interval(mins => ss.planned_minutes + 2) < now()
--       and not exists (select 1 from public.speaking_messages m
--                       where m.session_token = ss.session_token and m.role = 'user')
--   )
--   select distinct on (z.session_token) su.*
--   from zero_turn z
--   join public.speaking_usage su
--     on su.user_id = z.user_id
--    and su.created_at between z.started_at - interval '2 seconds' and z.started_at + interval '10 seconds'
--   order by z.session_token, abs(extract(epoch from (su.created_at - z.started_at)));
--   -- expected on 2026-09-27: 12 rows, 10 distinct user_id
--
-- HOW TO TEST (after):
--   select status, count(*),
--          count(*) filter (where coalesce(user_turns, 0) = 0) as zero_turns
--   from public.speaking_sessions group by 1;
--   -- expected: no 'active' row older than planned_minutes + 2 min; every
--   -- 'cancelled' row has user_turns 0; no 'completed' row has user_turns 0.
--
-- IDEMPOTENT: every step re-derives its rows from speaking_messages; a second
-- run finds nothing to delete or change.

begin;

-- 1. Give the trial units back. The start path wrote the usage row 0.1–0.7 s
--    after started_at (measured on every non-placement session); the window
--    [-2 s, +10 s] holds exactly one row per session and never a neighbour's
--    (the closest two starts by one user were 54 s apart).
with zero_turn as (
  select ss.session_token, ss.user_id, ss.started_at
  from public.speaking_sessions ss
  where ss.mode <> 'placement'
    and ss.cost_cents = 0
    and ss.started_at + make_interval(mins => ss.planned_minutes + 2) < now()
    and not exists (
      select 1 from public.speaking_messages m
      where m.session_token = ss.session_token and m.role = 'user'
    )
),
matched as (
  select distinct on (z.session_token) su.id as usage_id
  from zero_turn z
  join public.speaking_usage su
    on su.user_id = z.user_id
   and su.created_at between z.started_at - interval '2 seconds' and z.started_at + interval '10 seconds'
  order by z.session_token, abs(extract(epoch from (su.created_at - z.started_at)))
)
delete from public.speaking_usage su
using matched
where su.id = matched.usage_id;

-- 2. Close every stale 'active' session (past started_at + planned + 2 min,
--    when speaking-turn stops accepting turns) on its counted learner turns.
with counted as (
  select ss.session_token,
         (select count(*) from public.speaking_messages m
           where m.session_token = ss.session_token and m.role = 'user')::int as learner_turns,
         (select max(m.created_at) from public.speaking_messages m
           where m.session_token = ss.session_token) as last_at
  from public.speaking_sessions ss
  where ss.status = 'active'
    and ss.started_at + make_interval(mins => ss.planned_minutes + 2) < now()
)
update public.speaking_sessions ss
set status = case when c.learner_turns > 0 then 'completed' else 'cancelled' end,
    user_turns = c.learner_turns,
    completed_at = coalesce(c.last_at, ss.started_at),
    duration_seconds = least(
      greatest(0, round(extract(epoch from (coalesce(c.last_at, ss.started_at) - ss.started_at)))::int),
      (ss.planned_minutes + 2) * 60
    )
from counted c
where c.session_token = ss.session_token
  and ss.status = 'active';

-- 3. Recount the already-closed sessions (the client count missed a turn still
--    in flight at Finish/timer), and apply the invariant the code now keeps:
--    a closed session with zero learner turns is 'cancelled'. Checked on
--    2026-09-27: no session anywhere has user_turns > 0 without messages, so
--    the message table is a complete record to count from.
with counted as (
  select ss.session_token,
         (select count(*) from public.speaking_messages m
           where m.session_token = ss.session_token and m.role = 'user')::int as learner_turns
  from public.speaking_sessions ss
  where ss.status in ('completed', 'cancelled')
)
update public.speaking_sessions ss
set user_turns = c.learner_turns,
    status = case when c.learner_turns = 0 then 'cancelled' else 'completed' end
from counted c
where c.session_token = ss.session_token
  and (
    coalesce(ss.user_turns, -1) <> c.learner_turns
    or ss.status <> case when c.learner_turns = 0 then 'cancelled' else 'completed' end
  );

commit;
