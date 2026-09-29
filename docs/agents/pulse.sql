-- Daily pulse queries per agent (docs/agents/PROTOCOL.md step 3).
-- Every query below was run against production (Supabase project omqyueddktqeyrrqvnyq) on
-- 2026-09-29 and returned a value. Run them through the Supabase connector (execute_sql).
-- Compare each "_24h" value with the matching 7-day daily average. SQL counts are not capped;
-- a REST list read is capped at 1,000 rows, so never count by listing.

-- revenue ---------------------------------------------------------------------------------
select
 (select coalesce(sum((payload->'data'->'attributes'->>'total')::numeric)/100,0) from webhook_logs
   where event_type='subscription_payment_success' and created_at > now()-interval '24 hours') as rev_24h_eur,
 (select round(coalesce(sum((payload->'data'->'attributes'->>'total')::numeric)/100,0)/7,2) from webhook_logs
   where event_type='subscription_payment_success' and created_at between now()-interval '8 days' and now()-interval '24 hours') as rev_7d_avg_eur,
 (select count(*) from webhook_logs where event_type='subscription_payment_failed' and created_at > now()-interval '24 hours') as payfail_24h,
 (select count(*) from webhook_logs where not processed and created_at > now()-interval '48 hours') as webhooks_unprocessed_48h,
 (select coalesce(sum((payload->'data'->'attributes'->>'total')::numeric)/100,0) from webhook_logs
   where event_type='subscription_payment_success' and created_at > now()-interval '30 days')
 + (select coalesce(sum(price_paid),0) from purchases where coalesce(price_paid,0) > 0 and created_at > now()-interval '30 days') as rev_30d_eur;
-- rev_30d_eur is the rubric's revenue number. Do not add order_created: a subscription's first order
-- arrives as both order_created and subscription_payment_success, so it would count twice.

-- conversion ------------------------------------------------------------------------------
select
 (select count(*) from webhook_logs where event_type='subscription_created' and created_at > now()-interval '24 hours') as new_subs_24h,
 (select count(*) from purchases where coalesce(price_paid,0) > 0 and created_at > now()-interval '24 hours') as paid_courses_24h,
 (select count(*) from lifecycle_emails where kind='trial_ended' and sent_at > now()-interval '24 hours') as trials_ended_24h,
 (select count(*) from webhook_logs where event_type='subscription_created' and created_at > now()-interval '30 days')
 + (select count(*) from purchases where coalesce(price_paid,0) > 0 and created_at > now()-interval '30 days') as new_paying_30d,
 (select count(*) from auth.users where created_at > now()-interval '30 days') as signups_30d;

-- product (first session and learning flows) -------------------------------------------------
select
 (select count(distinct user_id) from lesson_progress where updated_at > now()-interval '24 hours') as course_learners_24h,
 (select count(*) from speaking_sessions where created_at > now()-interval '24 hours') as speaking_24h,
 (select count(*) filter (where coalesce(user_turns,0)=0) from speaking_sessions where created_at > now()-interval '24 hours') as speaking_zero_turn_24h,
 (select count(*) from exam_attempts where created_at > now()-interval '24 hours') as exams_24h,
 (select count(*) from xray_usage where used_at > now()-interval '24 hours') as xray_24h;
-- goal: signup -> first lesson, last full-month cohort
with c as (select u.id, date_trunc('month', u.created_at)::date m from auth.users u
           where u.created_at >= date_trunc('month', now()) - interval '1 month' and u.created_at < date_trunc('month', now()))
select m, count(*) signups, count(*) filter (where v.has_lesson_activity) did_lesson
from c left join public.lifecycle_customer_state v on v.user_id = c.id group by 1;

-- acquisition -----------------------------------------------------------------------------
select
 (select count(*) from auth.users where created_at > now()-interval '24 hours') as signups_24h,
 (select round(count(*)/7.0,1) from auth.users where created_at between now()-interval '8 days' and now()-interval '24 hours') as signups_7d_avg,
 (select json_object_agg(coalesce(acquisition_source,'untracked'), n) from
   (select acquisition_source, count(*) n from profiles where created_at > now()-interval '7 days' group by 1) s) as by_source_7d;

-- seo -------------------------------------------------------------------------------------
select coalesce(acquisition_landing,'(none)') landing, count(*) n
from profiles where created_at >= '2026-09-20' and acquisition_source is not null group by 1 order by 2 desc;
-- Search Console / DataForSEO: not reachable yet (roadmap r12). Record "not measured".

-- retention -------------------------------------------------------------------------------
select
 (select json_object_agg(kind, n) from (select kind, count(*) n from lifecycle_emails where sent_at > now()-interval '24 hours' group by 1) s) as lifecycle_24h,
 (select count(*) from profiles where email_daily_sentence is false) as opted_out_total;
-- Bounces: Resend connector get-email-metrics for the deutsch-meister.de domain, last 24 h and 30 d.

-- support ---------------------------------------------------------------------------------
select
 (select count(*) from support_tickets where status not in ('resolved','closed')) as tickets_open,
 (select count(*) from support_tickets where created_at > now()-interval '24 hours') as tickets_24h,
 (select count(*) from support_tickets where status not in ('resolved','closed')
   and first_response_at is null and sla_due_at < now()) as tickets_past_sla;

-- website ---------------------------------------------------------------------------------
-- Once migrations/2026-09-29-agent-incidents.sql is applied:
-- select owner_agent, severity, count(*) from agent_incidents where resolved_at is null group by 1,2;
-- Plus: the Netlify connector (latest production deploy state) and CI status on main (GitHub).

-- security --------------------------------------------------------------------------------
-- Supabase connector get_advisors(type: security): count ERROR and WARN findings.

-- webperf ---------------------------------------------------------------------------------
-- Daily: merged commits in the last 24 h touching vite.config.js, package.json, src/ or
-- astro-site/ (GitHub). Weekly (Saturday): mobile Lighthouse on the 7 tracked pages.
