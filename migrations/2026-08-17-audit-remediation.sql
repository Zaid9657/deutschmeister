-- ============================================================================
-- Remediation of AUDIT-2026-08-16.md — ALREADY APPLIED to project
-- omqyueddktqeyrrqvnyq on 2026-08-17, as four Supabase migrations:
--   fix_speaking_rls_and_placement_2026_08_17
--   content_and_billing_fixes_2026_08_17
--   shuffle_answer_option_positions_2026_08_17
--   xray_usage_ip_hash_2026_08_17
-- Re-running is safe; this file is the reproducible record.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Speaking RLS (audit A-04, A-05) + the placement constraint (B-13)
-- ---------------------------------------------------------------------------
-- The policy named "Service role full access" on speaking_usage had
-- polroles = {0} — PUBLIC, not service_role — with cmd=ALL and qual=true. Any
-- visitor could DELETE every quota row from the browser, after which the
-- speaking limiter returned allowed:true for everyone. The service role
-- bypasses RLS, so the correct state is zero policies (same as webhook_logs).
DROP POLICY IF EXISTS "Service role full access" ON public.speaking_usage;

-- speaking-turn.mjs authorizes a turn purely on the session row existing, so
-- client INSERT let a user forge a session and skip the wallet debit. The
-- UPDATE policy had no WITH CHECK, so started_at could be reset indefinitely.
-- The SPA only ever SELECTs these tables — verified before dropping.
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.speaking_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.speaking_sessions;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.speaking_messages;
DROP POLICY IF EXISTS "Users can insert own evaluations" ON public.speaking_evaluations;

-- Trigger function exposed via PostgREST RPC by the welcome-email migration.
REVOKE EXECUTE ON FUNCTION public.notify_welcome_email() FROM anon, authenticated;

-- speaking-session.mjs passes level='placement' for the level test, which the
-- constraint rejected — every placement session 500'd *after* paying for a
-- teacher reply and a TTS render. Zero placement rows had ever been written.
ALTER TABLE public.speaking_sessions DROP CONSTRAINT IF EXISTS speaking_sessions_level_check;
ALTER TABLE public.speaking_sessions ADD CONSTRAINT speaking_sessions_level_check
  CHECK (level = ANY (ARRAY['A1.1','A1.2','A2.1','A2.2','B1.1','B1.2','B2.1','B2.2','placement']));

-- ---------------------------------------------------------------------------
-- 2. Content + billing (B-03, B-01, payment_failures dedup)
-- ---------------------------------------------------------------------------
-- The reading seeder ran twice on 2026-02-03 (15:18 and 20:09): every b1.2
-- lesson existed twice, doubling that level's progress denominator.
DELETE FROM public.reading_lessons a
USING public.reading_lessons b
WHERE a.level = b.level AND a.title_de = b.title_de AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS reading_lessons_level_title_key
  ON public.reading_lessons (level, title_de);

-- Retried Lemon Squeezy deliveries inserted the same event up to 5 times.
DELETE FROM public.payment_failures a
USING public.payment_failures b
WHERE a.lemonsqueezy_event_id = b.lemonsqueezy_event_id AND a.failed_at > b.failed_at;

CREATE UNIQUE INDEX IF NOT EXISTS payment_failures_event_id_key
  ON public.payment_failures (lemonsqueezy_event_id);

-- is_subscribed was only ever cleared by the subscription_expired handler, so
-- cancelled/past_due/unpaid accounts kept Pro. Three were entitled unbilled.
-- The webhook now revokes on those statuses; this reconciles the existing rows.
UPDATE public.profiles p
SET is_subscribed = false, subscription_tier = 'free', updated_at = now()
WHERE p.is_subscribed
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p.id AND s.status IN ('active','on_trial','trialing')
  );

-- ---------------------------------------------------------------------------
-- 3. Answer-position skew (B-02)
-- ---------------------------------------------------------------------------
-- 334 of 399 listening multiple-choice answers were "b" (83.7%), so always
-- picking "b" passed every listening exercise at every level without hearing
-- the audio. The keys were factually correct — only the option ORDER was wrong.
-- Rotating by a per-question amount is order-preserving and reversible, so an
-- answer cannot change meaning. Verified with a checksum over every correct
-- option's TEXT: byte-identical before and after.
WITH q AS (
  SELECT id,
    (abs(hashtext(id::text)) % 3) AS k,
    ARRAY[
      regexp_replace(options->>0, '^[a-c]\)\s*', ''),
      regexp_replace(options->>1, '^[a-c]\)\s*', ''),
      regexp_replace(options->>2, '^[a-c]\)\s*', '')
    ] AS texts,
    CASE correct_answer WHEN 'a' THEN 0 WHEN 'b' THEN 1 WHEN 'c' THEN 2 END AS c
  FROM listening_questions
  WHERE question_type = 'multiple_choice' AND jsonb_array_length(options) = 3
)
UPDATE listening_questions lq
SET options = jsonb_build_array(
      'a) ' || q.texts[((0 + q.k) % 3) + 1],
      'b) ' || q.texts[((1 + q.k) % 3) + 1],
      'c) ' || q.texts[((2 + q.k) % 3) + 1]
    ),
    correct_answer = (ARRAY['a','b','c'])[((q.c - q.k + 3) % 3) + 1]
FROM q WHERE lq.id = q.id AND q.c IS NOT NULL;

-- Grammar MC stores correct_answer as the option TEXT with no letter prefixes,
-- so reordering is safe on its own. 48.1% of keys sat at index 0.
WITH g AS (
  SELECT id, jsonb_agg(opt ORDER BY md5(id::text || ord::text)) AS shuffled
  FROM grammar_exercises,
       LATERAL jsonb_array_elements(options) WITH ORDINALITY AS t(opt, ord)
  WHERE exercise_type = 'multiple_choice'
  GROUP BY id
)
UPDATE grammar_exercises ge SET options = g.shuffled FROM g WHERE ge.id = g.id;

-- NOTE: re-running section 3 reshuffles again (positions change, meaning does
-- not). That is harmless but not a no-op, unlike the rest of this file.

-- ---------------------------------------------------------------------------
-- 4. Per-IP X-Ray metering (A-02)
-- ---------------------------------------------------------------------------
-- The anonymous quota keyed only on a client-generated id, which could be
-- regenerated — or omitted entirely, which made the gate unreachable and turned
-- analyze-sentence into an unauthenticated, unmetered Claude endpoint.
-- Salted SHA-256, truncated; the raw address is never stored.
ALTER TABLE public.xray_usage ADD COLUMN IF NOT EXISTS ip_hash text;

CREATE INDEX IF NOT EXISTS xray_usage_ip_hash_used_at_idx
  ON public.xray_usage (ip_hash, used_at) WHERE user_id IS NULL;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- SELECT c.relname, p.polname, (0 = ANY(p.polroles)) AS is_public
--   FROM pg_class c LEFT JOIN pg_policy p ON p.polrelid = c.oid
--  WHERE c.relname LIKE 'speaking%';                      -- no is_public rows
-- SELECT correct_answer, count(*) FROM listening_questions
--  WHERE question_type='multiple_choice' GROUP BY 1;      -- roughly uniform
-- SELECT count(*) FROM profiles p WHERE p.is_subscribed AND NOT EXISTS
--   (SELECT 1 FROM subscriptions s WHERE s.user_id=p.id
--      AND s.status IN ('active','on_trial','trialing'));  -- 0
