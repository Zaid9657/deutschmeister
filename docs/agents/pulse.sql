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
-- Source 'android' on rows from before the android-app rule was deployed is the Google app (referrer
-- com.google.android.googlequicksearchbox), i.e. Google search; see docs/tracking-links.md.

-- seo -------------------------------------------------------------------------------------
select coalesce(acquisition_landing,'(none)') landing, count(*) n
from profiles where created_at >= '2026-09-20' and acquisition_source is not null group by 1 order by 2 desc;
-- Search Console / DataForSEO: not reachable yet (roadmap r12). Record "not measured".

-- retention -------------------------------------------------------------------------------
select
 (select json_object_agg(kind, n) from (select kind, count(*) n from lifecycle_emails where sent_at > now()-interval '24 hours' group by 1) s) as lifecycle_24h,
 (select count(*) from profiles where email_daily_sentence is false) as opted_out_total;
-- Bounces: Resend connector get-email-metrics for the deutsch-meister.de domain, last 24 h and 30 d.

-- content ---------------------------------------------------------------------------------
-- Posts do not live in Supabase, so read the channels themselves. These reads were verified on
-- 2026-09-30 07:10 UTC. They go through the Zapier connector and are GET requests only: never
-- the "Mutating Request" action, never Publish. The daily post Routine runs in another account,
-- so list_triggers cannot see it, and the channels are the only evidence that it ran.
--  * Zapier app "Instagram for Business", action "Make API GET Request". Its one connection is
--    titled kontakt@medmeister.eu, but that Facebook login admins the Deutsch Meister page, so it
--    reaches the IG account (17841425239004659, @deutschmeisterde) and the FB page (1232346926638010):
--      GET https://graph.facebook.com/v21.0/17841425239004659?fields=username,followers_count,media_count
--      GET https://graph.facebook.com/v21.0/17841425239004659/media?fields=id,timestamp,media_type,permalink,like_count,comments_count,caption&limit=50
--      GET https://graph.facebook.com/v21.0/1232346926638010?fields=name,followers_count,fan_count
--      GET https://graph.facebook.com/v21.0/1232346926638010/feed?fields=id,created_time,message,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)&limit=25
--    /published_posts fails with #210 (it needs a page token), and IG insights fail with #10 (no
--    permission), so reach is not measured. Never request an access_token field: the response would
--    print a credential.
--  * Zapier app "YouTube", action "Make API GET Request". That connection belongs to another channel,
--    so these two calls read public data only:
--      GET https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&forHandle=@deutschmeister_de
--      GET https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=UUnBauEHinta8cqDstwxA7RQ&maxResults=50
--  * Telegram: there is no DeutschMeister channel yet (deferred to the week of 2026-10-05). The
--    Zapier Telegram bot belongs to MedMeister.
-- Count posts whose timestamp is inside now()-7 d in two ways: per channel (channel-posts), and as
-- distinct content items (one card on IG + FB = 1). Rubric v2.1 scores distinct items only.
-- Timestamps cannot pair posts across channels (the same item can go out a day apart), so pair
-- them by text: the caption (IG), message (FB) and snippet.description (YT) fields above. FB and
-- YT links carry utm_content = the item id: pNNN for the 50-post pack (drafts/instagram-100),
-- dm-w1-tN for woche_01, dNN_<topic> for the "shorts-daily" campaign (a reel + Short that first
-- appeared 2026-09-30 and is not in this repo). IG captions say "Link in Bio", so on IG pair by text.
-- Followers = IG followers_count + FB followers_count + YT subscriberCount.
-- Result on 2026-09-30: IG 7 + FB 5 + YT 2 = 14 channel-posts, 7 distinct items. Followers 0 + 1 + 5 = 6.
-- Result on 2026-10-01 07:05 UTC: IG 8 + FB 6 + YT 2 = 16 channel-posts, 8 distinct items. Followers 0 + 2 + 7 = 9.
-- To see whether the posts brought anyone in, count signups whose first or last touch was a social channel:
select
 (select count(*) from profiles where created_at > now()-interval '7 days'
   and (acquisition_source in ('instagram','facebook','youtube','telegram')
        or acquisition_last_source in ('instagram','facebook','youtube','telegram'))) as social_signups_7d,
 (select count(*) from profiles where acquisition_source in ('instagram','facebook','youtube','telegram')
        or acquisition_last_source in ('instagram','facebook','youtube','telegram')) as social_signups_total;

-- support ---------------------------------------------------------------------------------
select
 (select count(*) from support_tickets where status not in ('resolved','closed')) as tickets_open,
 (select count(*) from support_tickets where created_at > now()-interval '24 hours') as tickets_24h,
 (select count(*) from support_tickets where status not in ('resolved','closed')
   and first_response_at is null and sla_due_at < now()) as tickets_past_sla;

-- website ---------------------------------------------------------------------------------
-- agent_incidents is live (migrations/2026-09-29-agent-incidents.sql applied 2026-09-30); verified
-- read-only 2026-10-01 (0 open incidents then):
select owner_agent, severity, count(*) from agent_incidents where resolved_at is null group by 1,2;
-- Plus: the Netlify connector (latest production deploy state) and CI status on main (GitHub).

-- security --------------------------------------------------------------------------------
-- Supabase connector get_advisors(type: security): count ERROR and WARN findings.

-- webperf ---------------------------------------------------------------------------------
-- Daily: merged commits in the last 24 h touching vite.config.js, package.json, src/ or
-- astro-site/ (GitHub). Weekly (Saturday): mobile Lighthouse on the 7 tracked pages.
