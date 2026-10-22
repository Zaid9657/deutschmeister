-- Sentence X-Ray usage tracking table
CREATE TABLE IF NOT EXISTS xray_usage (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id TEXT,
  used_at      TIMESTAMPTZ DEFAULT NOW(),
  sentence     TEXT
);

CREATE INDEX IF NOT EXISTS idx_xray_usage_user_date ON xray_usage(user_id, used_at);
CREATE INDEX IF NOT EXISTS idx_xray_usage_anon_date ON xray_usage(anonymous_id, used_at);

ALTER TABLE xray_usage ENABLE ROW LEVEL SECURITY;

-- Logged-in users can insert and read their own rows
CREATE POLICY "Users can insert own xray usage" ON xray_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can read own xray usage" ON xray_usage
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role (used by Netlify functions) bypasses RLS automatically
