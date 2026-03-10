-- ============================================
-- Fix Subscription Schema for LemonSqueezy Webhook
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Fix plan_type CHECK constraint to allow 'yearly'
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IN ('monthly', 'yearly', 'quarterly'));

-- 2. Add missing LemonSqueezy columns to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS lemonsqueezy_order_id TEXT,
  ADD COLUMN IF NOT EXISTS lemonsqueezy_product_id TEXT,
  ADD COLUMN IF NOT EXISTS lemonsqueezy_variant_id TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 3. Add UNIQUE constraint on user_id (required for upsert onConflict)
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

-- 4. Create webhook_logs table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on webhook_logs (only accessed by service role)
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to webhook_logs
CREATE POLICY "Service role full access on webhook_logs"
  ON public.webhook_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Ensure service role can write to subscriptions and profiles
-- (service_role key bypasses RLS, but just in case)

-- 6. Update the original schema file's plan_type constraint for reference
-- The original had: CHECK (plan_type IN ('monthly', 'quarterly'))
-- Now it should be: CHECK (plan_type IN ('monthly', 'yearly', 'quarterly'))

-- Verify: Check current table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subscriptions';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'webhook_logs';
